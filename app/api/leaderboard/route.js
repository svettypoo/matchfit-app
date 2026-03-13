import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");
    const metric = searchParams.get("metric") || "xp";
    const period = searchParams.get("period") || "all";

    if (!team_id) {
      return NextResponse.json(
        { error: "team_id query parameter is required" },
        { status: 400 }
      );
    }

    // Get all players on the team
    const { data: players, error } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, avatar_url, jersey_number, xp, level, current_streak, longest_streak, last_activity_date")
      .eq("team_id", team_id)
      .eq("status", "active");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!players || players.length === 0) {
      return NextResponse.json({ leaderboard: [], metric, period });
    }

    // Calculate period date range
    let periodStart = null;
    const now = new Date();

    if (period === "week") {
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 7);
    } else if (period === "month") {
      periodStart = new Date(now);
      periodStart.setMonth(periodStart.getMonth() - 1);
    }

    let leaderboard;

    if (metric === "xp" && period === "all") {
      // Simple: sort by total XP
      leaderboard = players
        .map((p) => ({
          player_id: p.id,
          name: p.name,
          avatar_url: p.avatar_url,
          jersey_number: p.jersey_number,
          level: p.level,
          value: p.xp || 0,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (metric === "streak") {
      // Sort by current streak (or longest if period=all)
      leaderboard = players
        .map((p) => ({
          player_id: p.id,
          name: p.name,
          avatar_url: p.avatar_url,
          jersey_number: p.jersey_number,
          level: p.level,
          value: period === "all" ? (p.longest_streak || 0) : (p.current_streak || 0),
        }))
        .sort((a, b) => b.value - a.value);
    } else if (metric === "compliance" || (metric === "xp" && period !== "all")) {
      // Need to calculate from workout data
      const playerIds = players.map((p) => p.id);
      const periodStartStr = periodStart
        ? periodStart.toISOString().split("T")[0]
        : null;

      leaderboard = await Promise.all(
        players.map(async (p) => {
          let query = supabaseAdmin
            .from("mf_scheduled_workouts")
            .select("id, status, xp_earned")
            .eq("player_id", p.id);

          if (periodStartStr) {
            query = query.gte("scheduled_date", periodStartStr);
          }

          const { data: workouts } = await query;
          const total = workouts?.length || 0;
          const completed = workouts?.filter((w) => w.status === "completed").length || 0;

          let value;
          if (metric === "compliance") {
            value = total > 0 ? Math.round((completed / total) * 100) : 0;
          } else {
            // XP earned in period
            value = workouts?.reduce((sum, w) => sum + (w.xp_earned || 0), 0) || 0;
          }

          return {
            player_id: p.id,
            name: p.name,
            avatar_url: p.avatar_url,
            jersey_number: p.jersey_number,
            level: p.level,
            value,
            workouts_total: total,
            workouts_completed: completed,
          };
        })
      );

      leaderboard.sort((a, b) => b.value - a.value);
    } else {
      return NextResponse.json(
        { error: "metric must be xp, streak, or compliance" },
        { status: 400 }
      );
    }

    // Add rank
    leaderboard = leaderboard.map((entry, i) => ({
      rank: i + 1,
      ...entry,
    }));

    return NextResponse.json({
      leaderboard,
      metric,
      period,
      team_id,
    });
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

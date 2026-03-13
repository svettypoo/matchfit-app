import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach_id = searchParams.get("coach_id");

    if (!coach_id) {
      return NextResponse.json(
        { error: "coach_id query parameter is required" },
        { status: 400 }
      );
    }

    // Get coach's teams
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from("mf_teams")
      .select("id, name")
      .eq("coach_id", coach_id);

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 });
    }

    const teamIds = teams?.map((t) => t.id) || [];

    if (teamIds.length === 0) {
      return NextResponse.json({
        stats: { active_players: 0, avg_compliance: 0, avg_streak: 0, injured_players: 0 },
        top_performers: [],
        at_risk: [],
        recent_completions: [],
        weekly_compliance: [],
      });
    }

    // Get all players from those teams
    const { data: players } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, email, position, status, xp, level, current_streak, longest_streak, team_id")
      .in("team_id", teamIds);

    const allPlayers = players || [];
    const activePlayers = allPlayers.filter((p) => p.status === "active");
    const injuredPlayers = allPlayers.filter((p) => p.status === "injured");
    const playerIds = allPlayers.map((p) => p.id);

    // Calculate compliance: completed / total scheduled workouts in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    let avgCompliance = 0;
    let weeklyCompliance = [];

    if (playerIds.length > 0) {
      const { data: recentWorkouts } = await supabaseAdmin
        .from("mf_scheduled_workouts")
        .select("id, player_id, scheduled_date, status, completed_at")
        .in("player_id", playerIds)
        .gte("scheduled_date", weekAgoStr)
        .order("scheduled_date", { ascending: true });

      const allRecent = recentWorkouts || [];
      const completedRecent = allRecent.filter((w) => w.status === "completed");
      avgCompliance = allRecent.length > 0
        ? Math.round((completedRecent.length / allRecent.length) * 100)
        : 0;

      // Build 7-day compliance array
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
        const dayWorkouts = allRecent.filter((w) => w.scheduled_date === dateStr);
        const dayCompleted = dayWorkouts.filter((w) => w.status === "completed");
        weeklyCompliance.push({
          label: dayLabel,
          value: dayWorkouts.length > 0
            ? Math.round((dayCompleted.length / dayWorkouts.length) * 100)
            : 0,
        });
      }
    }

    // Avg streak
    const avgStreak = activePlayers.length > 0
      ? Math.round(activePlayers.reduce((s, p) => s + (p.current_streak || 0), 0) / activePlayers.length)
      : 0;

    // Top performers by XP
    const topPerformers = [...allPlayers]
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 5)
      .map((p) => ({ id: p.id, name: p.name, xp: p.xp || 0, level: p.level || 1, streak: p.current_streak || 0 }));

    // At-risk players (streak=0 or inactive)
    const atRisk = allPlayers
      .filter((p) => p.status === "active" && (p.current_streak || 0) === 0)
      .map((p) => ({ id: p.id, name: p.name, position: p.position, team_id: p.team_id, reason: 'No active streak' }));

    // Recent completions (last 10)
    let recentCompletions = [];
    if (playerIds.length > 0) {
      const { data: completions } = await supabaseAdmin
        .from("mf_scheduled_workouts")
        .select("id, player_id, scheduled_date, completed_at, duration_minutes, xp_earned")
        .in("player_id", playerIds)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10);

      recentCompletions = (completions || []).map((w) => {
        const player = allPlayers.find((p) => p.id === w.player_id);
        return {
          ...w,
          player_name: player?.name || "Unknown",
        };
      });
    }

    return NextResponse.json({
      stats: {
        active_players: activePlayers.length,
        avg_compliance: avgCompliance,
        avg_streak: avgStreak,
        injured_players: injuredPlayers.length,
      },
      top_performers: topPerformers,
      at_risk: atRisk,
      recent_completions: recentCompletions,
      weekly_compliance: weeklyCompliance,
    });
  } catch (err) {
    console.error("GET /api/coach/dashboard error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch all players on this team with their key stats
    const { data: players, error } = await supabaseAdmin
      .from("mf_players")
      .select(
        "id, name, email, avatar_url, position, jersey_number, date_of_birth, status, xp, level, current_streak, longest_streak, last_activity_date, onboarding_complete, fitness_level, coach_notes"
      )
      .eq("team_id", id)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate compliance for each player (workouts completed / scheduled in last 7 days)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const nowStr = now.toISOString().split("T")[0];

    const enriched = await Promise.all(
      players.map(async (player) => {
        const { data: workouts } = await supabaseAdmin
          .from("mf_scheduled_workouts")
          .select("id, status")
          .eq("player_id", player.id)
          .gte("scheduled_date", weekAgoStr)
          .lte("scheduled_date", nowStr);

        const total = workouts?.length || 0;
        const completed =
          workouts?.filter((w) => w.status === "completed").length || 0;
        const compliance = total > 0 ? Math.round((completed / total) * 100) : null;

        return {
          ...player,
          compliance,
          workouts_scheduled_7d: total,
          workouts_completed_7d: completed,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/teams/[id]/players error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

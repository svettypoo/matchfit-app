import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Get player basic info
    const { data: player, error: playerError } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, xp, level, current_streak, longest_streak")
      .eq("id", id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Total completed workouts
    const { count: totalCompleted } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("id", { count: "exact", head: true })
      .eq("player_id", id)
      .eq("status", "completed");

    // Workouts completed this week (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - mondayOffset);
    const mondayStr = monday.toISOString().split("T")[0];

    const { count: weeklyWorkouts } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("id", { count: "exact", head: true })
      .eq("player_id", id)
      .eq("status", "completed")
      .gte("scheduled_date", mondayStr);

    // Weekly compliance: completed / total this week
    const { count: weeklyTotal } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("id", { count: "exact", head: true })
      .eq("player_id", id)
      .gte("scheduled_date", mondayStr);

    const weeklyCompliance = weeklyTotal > 0
      ? Math.round(((weeklyWorkouts || 0) / weeklyTotal) * 100)
      : 0;

    // Latest wellness readiness score
    const { data: latestWellness } = await supabaseAdmin
      .from("mf_wellness_checkins")
      .select("readiness_score")
      .eq("player_id", id)
      .order("checkin_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Personal records count
    const { count: prCount } = await supabaseAdmin
      .from("mf_personal_records")
      .select("id", { count: "exact", head: true })
      .eq("player_id", id);

    return NextResponse.json({
      total_workouts_completed: totalCompleted || 0,
      weekly_workouts: weeklyWorkouts || 0,
      weekly_compliance: weeklyCompliance,
      streak: player.current_streak || 0,
      current_streak: player.current_streak || 0,
      longest_streak: player.longest_streak || 0,
      total_xp: player.xp || 0,
      level: player.level || 1,
      readiness: latestWellness?.readiness_score || null,
      personal_records: prCount || 0,
    });
  } catch (err) {
    console.error("GET /api/players/[id]/stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

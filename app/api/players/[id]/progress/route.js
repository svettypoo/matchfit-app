import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // --- Weekly workout counts (last 8 weeks) ---
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const { data: recentWorkouts } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("scheduled_date, status")
      .eq("player_id", id)
      .eq("status", "completed")
      .gte("scheduled_date", eightWeeksAgo.toISOString().split("T")[0])
      .order("scheduled_date", { ascending: true });

    // Group by week
    const weeklyWorkouts = [];
    const now = new Date();
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startStr = weekStart.toISOString().split("T")[0];
      const endStr = weekEnd.toISOString().split("T")[0];

      const count = (recentWorkouts || []).filter(
        (wk) => wk.scheduled_date >= startStr && wk.scheduled_date <= endStr
      ).length;

      weeklyWorkouts.push({
        week_start: startStr,
        week_end: endStr,
        label: `Week ${8 - w}`,
        workouts_completed: count,
      });
    }

    // --- Wellness trend (last 14 days) ---
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: checkins } = await supabaseAdmin
      .from("mf_wellness_checkins")
      .select("checkin_date, readiness_score, sleep_quality, energy_level, muscle_soreness, mood, stress")
      .eq("player_id", id)
      .gte("checkin_date", fourteenDaysAgo.toISOString().split("T")[0])
      .order("checkin_date", { ascending: true });

    // --- XP growth (player record) ---
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("xp, level, current_streak, longest_streak")
      .eq("id", id)
      .single();

    // --- Exercise PRs ---
    const { data: prs } = await supabaseAdmin
      .from("mf_personal_records")
      .select("*, mf_exercises(id, name, category)")
      .eq("player_id", id)
      .order("achieved_at", { ascending: false });

    return NextResponse.json({
      weekly_workouts: weeklyWorkouts,
      wellness_trend: checkins || [],
      xp: {
        total: player?.xp || 0,
        level: player?.level || 1,
        current_streak: player?.current_streak || 0,
        longest_streak: player?.longest_streak || 0,
      },
      personal_records: prs || [],
    });
  } catch (err) {
    console.error("GET /api/players/[id]/progress error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Fetch completed workouts with program day info
    const { data: workouts, error } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select(`
        id, scheduled_date, status, completed_at, duration_minutes, xp_earned, completion_pct, rpe_reported, notes,
        mf_program_days(
          id, day_number, focus,
          mf_programs(id, name)
        )
      `)
      .eq("player_id", id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get exercise logs for each workout
    const workoutIds = (workouts || []).map((w) => w.id);
    let logsMap = {};

    if (workoutIds.length > 0) {
      const { data: logs } = await supabaseAdmin
        .from("mf_exercise_logs")
        .select("*, mf_exercises(id, name, category)")
        .in("workout_id", workoutIds);

      for (const log of logs || []) {
        if (!logsMap[log.workout_id]) {
          logsMap[log.workout_id] = [];
        }
        logsMap[log.workout_id].push(log);
      }
    }

    const history = (workouts || []).map((w) => ({
      ...w,
      program_name: w.mf_program_days?.mf_programs?.name || null,
      day_focus: w.mf_program_days?.focus || null,
      exercise_logs: logsMap[w.id] || [],
    }));

    return NextResponse.json(history);
  } catch (err) {
    console.error("GET /api/players/[id]/history error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

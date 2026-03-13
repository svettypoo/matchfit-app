import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const today = new Date().toISOString().split("T")[0];

    // Find today's scheduled workout for this player
    const { data: workout, error } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select(`
        *,
        mf_program_days(
          *,
          mf_programs(id, name, description, difficulty),
          mf_program_exercises(
            *,
            mf_exercises(id, name, description, category, muscle_groups, equipment, difficulty, video_url, image_url, is_timed, default_sets, default_reps, default_duration_sec, default_rest_sec)
          )
        )
      `)
      .eq("player_id", id)
      .eq("scheduled_date", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!workout) {
      return NextResponse.json({ workout: null, rest_day: true });
    }

    // Sort exercises by sort_order
    if (workout.mf_program_days?.mf_program_exercises) {
      workout.mf_program_days.mf_program_exercises.sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      );
    }

    // Get any existing exercise logs for this workout
    const { data: logs } = await supabaseAdmin
      .from("mf_exercise_logs")
      .select("*")
      .eq("workout_id", workout.id);

    return NextResponse.json({
      workout: {
        ...workout,
        exercise_logs: logs || [],
      },
      rest_day: false,
    });
  } catch (err) {
    console.error("GET /api/players/[id]/today-workout error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

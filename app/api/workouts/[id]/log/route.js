import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request, { params }) {
  try {
    const { id: workout_id } = params;
    const body = await request.json();
    const {
      exercise_id,
      completed_sets,
      completed_reps,
      weight_used,
      duration_sec,
      skipped,
      skip_reason,
    } = body;

    if (!exercise_id) {
      return NextResponse.json(
        { error: "exercise_id is required" },
        { status: 400 }
      );
    }

    // Verify workout exists
    const { data: workout, error: workoutError } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("id, program_day_id")
      .eq("id", workout_id)
      .single();

    if (workoutError || !workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }

    // Get prescribed sets/reps from program exercise
    let prescribed_sets = null;
    let prescribed_reps = null;

    if (workout.program_day_id) {
      const { data: progExercise } = await supabaseAdmin
        .from("mf_program_exercises")
        .select("sets, reps")
        .eq("program_day_id", workout.program_day_id)
        .eq("exercise_id", exercise_id)
        .single();

      if (progExercise) {
        prescribed_sets = progExercise.sets;
        prescribed_reps = progExercise.reps;
      }
    }

    const { data: log, error: logError } = await supabaseAdmin
      .from("mf_exercise_logs")
      .insert({
        workout_id,
        exercise_id,
        prescribed_sets,
        prescribed_reps,
        completed_sets: skipped ? 0 : (completed_sets || 0),
        completed_reps: completed_reps || null, // array of ints per set
        weight_used: weight_used || null, // array of numerics per set
        duration_sec: duration_sec || null,
        skipped: skipped || false,
        skip_reason: skipped ? (skip_reason || null) : null,
      })
      .select()
      .single();

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("POST /api/workouts/[id]/log error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

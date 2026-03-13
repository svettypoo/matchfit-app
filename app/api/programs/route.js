import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach_id = searchParams.get("coach_id");

    let query = supabaseAdmin
      .from("mf_programs")
      .select("*, mf_program_days(count)")
      .order("created_at", { ascending: false });

    if (coach_id) {
      query = query.eq("coach_id", coach_id);
    } else {
      // Only show templates if no coach specified
      query = query.eq("is_template", true);
    }

    const { data: programs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = programs.map((p) => ({
      ...p,
      day_count: p.mf_program_days?.[0]?.count ?? 0,
      mf_program_days: undefined,
    }));

    return NextResponse.json({ programs: result });
  } catch (err) {
    console.error("GET /api/programs error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      coach_id,
      name,
      description,
      duration_weeks,
      phase_type,
      difficulty,
      days,
    } = body;

    if (!coach_id || !name) {
      return NextResponse.json(
        { error: "coach_id and name are required" },
        { status: 400 }
      );
    }

    // Step 1: Create the program
    const { data: program, error: programError } = await supabaseAdmin
      .from("mf_programs")
      .insert({
        coach_id,
        name,
        description: description || null,
        duration_weeks: duration_weeks || 4,
        phase_type: phase_type || null,
        difficulty: difficulty || "intermediate",
        is_template: false,
      })
      .select()
      .single();

    if (programError) {
      return NextResponse.json(
        { error: programError.message },
        { status: 500 }
      );
    }

    // Step 2: Create program days and exercises
    if (days && Array.isArray(days) && days.length > 0) {
      for (let i = 0; i < days.length; i++) {
        const day = days[i];

        const { data: programDay, error: dayError } = await supabaseAdmin
          .from("mf_program_days")
          .insert({
            program_id: program.id,
            day_of_week: day.day_of_week,
            name: day.name || null,
            sort_order: i,
          })
          .select()
          .single();

        if (dayError) {
          // Cleanup: delete the program if day creation fails
          await supabaseAdmin.from("mf_programs").delete().eq("id", program.id);
          return NextResponse.json(
            { error: `Failed to create day ${i}: ${dayError.message}` },
            { status: 500 }
          );
        }

        // Create exercises for this day
        if (day.exercises && Array.isArray(day.exercises) && day.exercises.length > 0) {
          const exerciseInserts = day.exercises.map((ex, j) => ({
            program_day_id: programDay.id,
            exercise_id: ex.exercise_id,
            sets: ex.sets || 3,
            reps: ex.reps || null,
            duration_sec: ex.duration_sec || null,
            rest_sec: ex.rest_sec || 60,
            rpe_target: ex.rpe_target || null,
            weight_kg: ex.weight_kg || null,
            notes: ex.notes || null,
            sort_order: j,
          }));

          const { error: exError } = await supabaseAdmin
            .from("mf_program_exercises")
            .insert(exerciseInserts);

          if (exError) {
            await supabaseAdmin.from("mf_programs").delete().eq("id", program.id);
            return NextResponse.json(
              { error: `Failed to create exercises for day ${i}: ${exError.message}` },
              { status: 500 }
            );
          }
        }
      }
    }

    // Fetch the complete program with days and exercises
    const { data: fullProgram } = await supabaseAdmin
      .from("mf_programs")
      .select(
        "*, mf_program_days(*, mf_program_exercises(*, mf_exercises(name, category)))"
      )
      .eq("id", program.id)
      .single();

    return NextResponse.json(fullProgram, { status: 201 });
  } catch (err) {
    console.error("POST /api/programs error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

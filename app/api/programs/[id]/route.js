import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data: program, error } = await supabaseAdmin
      .from("mf_programs")
      .select(
        `*,
        mf_program_days(
          *,
          mf_program_exercises(
            *,
            mf_exercises(id, name, description, category, muscle_groups, equipment, difficulty, video_url, image_url, is_timed)
          )
        )`
      )
      .eq("id", id)
      .single();

    if (error || !program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Sort days by sort_order, and exercises within each day by sort_order
    if (program.mf_program_days) {
      program.mf_program_days.sort((a, b) => a.sort_order - b.sort_order);
      for (const day of program.mf_program_days) {
        if (day.mf_program_exercises) {
          day.mf_program_exercises.sort((a, b) => a.sort_order - b.sort_order);
        }
      }
    }

    return NextResponse.json(program);
  } catch (err) {
    console.error("GET /api/programs/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const allowed = [
      "name", "description", "duration_weeks", "phase_type",
      "difficulty", "is_template",
    ];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: program, error } = await supabaseAdmin
      .from("mf_programs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(program);
  } catch (err) {
    console.error("PATCH /api/programs/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Cascade delete handles program_days and program_exercises
    const { error } = await supabaseAdmin
      .from("mf_programs")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Program deleted" });
  } catch (err) {
    console.error("DELETE /api/programs/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

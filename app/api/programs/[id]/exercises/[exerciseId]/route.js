import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabase = getSupabaseAdmin();

export async function PATCH(request, { params }) {
  try {
    const { exerciseId } = params;
    const body = await request.json();

    const allowed = ["sets", "reps", "weight_kg", "rest_sec", "rpe_target", "notes", "sort_order"];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("mf_program_exercises")
      .update(updates)
      .eq("id", exerciseId)
      .select("*, mf_exercises(id, name, category, difficulty, muscle_groups)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { exerciseId } = params;
    const { error } = await supabase
      .from("mf_program_exercises")
      .delete()
      .eq("id", exerciseId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

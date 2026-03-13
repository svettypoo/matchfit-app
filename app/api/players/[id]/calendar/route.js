import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year"), 10);
    const month = parseInt(searchParams.get("month"), 10);

    if (!year || !month) {
      return NextResponse.json(
        { error: "year and month query parameters are required" },
        { status: 400 }
      );
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const { data: workouts, error } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select(`
        id, scheduled_date, status, completed_at, duration_minutes, xp_earned,
        mf_program_days(
          id, day_number, focus,
          mf_programs(id, name)
        )
      `)
      .eq("player_id", id)
      .gte("scheduled_date", startDate)
      .lt("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const events = (workouts || []).map((w) => ({
      id: w.id,
      date: w.scheduled_date,
      status: w.status,
      completed_at: w.completed_at,
      duration_minutes: w.duration_minutes,
      xp_earned: w.xp_earned,
      program_name: w.mf_program_days?.mf_programs?.name || null,
      day_focus: w.mf_program_days?.focus || null,
      day_number: w.mf_program_days?.day_number || null,
    }));

    return NextResponse.json(events);
  } catch (err) {
    console.error("GET /api/players/[id]/calendar error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

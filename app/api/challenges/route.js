import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");

    if (!team_id) {
      return NextResponse.json(
        { error: "team_id query parameter is required" },
        { status: 400 }
      );
    }

    const { data: challenges, error } = await supabaseAdmin
      .from("mf_challenges")
      .select("*")
      .eq("team_id", team_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with progress percentage
    const enriched = challenges.map((c) => ({
      ...c,
      progress_pct:
        c.target_value > 0
          ? Math.min(100, Math.round(((c.current_value || 0) / c.target_value) * 100))
          : 0,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/challenges error:", err);
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
      team_id,
      name,
      description,
      target_type,
      target_value,
      start_date,
      end_date,
      xp_reward,
    } = body;

    if (!team_id || !name || !target_type || !target_value || !start_date || !end_date) {
      return NextResponse.json(
        { error: "team_id, name, target_type, target_value, start_date, and end_date are required" },
        { status: 400 }
      );
    }

    const validTargetTypes = ["compliance_pct", "total_workouts", "total_xp"];
    if (!validTargetTypes.includes(target_type)) {
      return NextResponse.json(
        { error: `target_type must be one of: ${validTargetTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const { data: challenge, error } = await supabaseAdmin
      .from("mf_challenges")
      .insert({
        team_id,
        name,
        description: description || null,
        target_type,
        target_value,
        start_date,
        end_date,
        xp_reward: xp_reward || 100,
        status: "active",
        current_value: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(challenge, { status: 201 });
  } catch (err) {
    console.error("POST /api/challenges error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, current_value, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updates = {};
    if (current_value !== undefined) updates.current_value = current_value;
    if (status) updates.status = status;

    // Auto-complete if current_value meets target
    if (current_value !== undefined) {
      const { data: challenge } = await supabaseAdmin
        .from("mf_challenges")
        .select("target_value, status")
        .eq("id", id)
        .single();

      if (challenge && challenge.status === "active" && current_value >= challenge.target_value) {
        updates.status = "completed";
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from("mf_challenges")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/challenges error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const supabaseAdmin = getSupabaseAdmin();

export async function POST(request) {
  try {
    const body = await request.json();
    const { player_id, body_part, severity, mechanism, notes, date } = body;

    if (!player_id || !body_part || !severity || !date) {
      return NextResponse.json(
        { error: "player_id, body_part, severity, and date are required" },
        { status: 400 }
      );
    }

    if (severity < 1 || severity > 5) {
      return NextResponse.json(
        { error: "severity must be between 1 and 5" },
        { status: 400 }
      );
    }

    const { data: injury, error } = await supabaseAdmin
      .from("mf_injuries")
      .insert({
        player_id,
        body_part,
        severity,
        mechanism: mechanism || null,
        notes: notes || null,
        date,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, create it
      if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "mf_injuries table does not exist. Please run the migration." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(injury, { status: 201 });
  } catch (err) {
    console.error("POST /api/injuries error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");
    const player_id = searchParams.get("player_id");

    let query = supabaseAdmin
      .from("mf_injuries")
      .select("*, mf_players(id, name, team_id, position)")
      .order("date", { ascending: false });

    if (player_id) {
      query = query.eq("player_id", player_id);
    } else if (team_id) {
      // Get players in team first
      const { data: players } = await supabaseAdmin
        .from("mf_players")
        .select("id")
        .eq("team_id", team_id);

      const playerIds = players?.map(p => p.id) || [];
      if (playerIds.length === 0) {
        return NextResponse.json({ injuries: [] });
      }
      query = query.in("player_id", playerIds);
    }

    const { data: injuries, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ injuries: injuries || [] });
  } catch (err) {
    console.error("GET /api/injuries error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status, recovery_notes, return_date } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates = {};
    if (status) updates.status = status;
    if (recovery_notes !== undefined) updates.recovery_notes = recovery_notes;
    if (return_date !== undefined) updates.return_date = return_date;

    const { data: injury, error } = await supabaseAdmin
      .from("mf_injuries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(injury);
  } catch (err) {
    console.error("PATCH /api/injuries error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

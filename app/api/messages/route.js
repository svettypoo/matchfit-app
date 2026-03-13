import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");
    const player_id = searchParams.get("player_id");

    if (!team_id) {
      return NextResponse.json(
        { error: "team_id query parameter is required" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("mf_messages")
      .select("*")
      .eq("team_id", team_id)
      .order("created_at", { ascending: true });

    // If player_id specified, show only messages between coach and that player
    // plus team broadcasts (recipient_type = 'team' or recipient_id is null)
    if (player_id) {
      query = query.or(
        `and(sender_id.eq.${player_id}),and(recipient_id.eq.${player_id}),recipient_type.eq.team,recipient_id.is.null`
      );
    }

    const { data: messages, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(messages);
  } catch (err) {
    console.error("GET /api/messages error:", err);
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
      sender_type,
      sender_id,
      recipient_type,
      recipient_id,
      body: messageBody,
    } = body;

    if (!team_id || !sender_type || !sender_id || !messageBody) {
      return NextResponse.json(
        { error: "team_id, sender_type, sender_id, and body are required" },
        { status: 400 }
      );
    }

    if (!["coach", "player"].includes(sender_type)) {
      return NextResponse.json(
        { error: "sender_type must be 'coach' or 'player'" },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabaseAdmin
      .from("mf_messages")
      .insert({
        team_id,
        sender_type,
        sender_id,
        recipient_type: recipient_type || null,
        recipient_id: recipient_id || null,
        body: messageBody,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

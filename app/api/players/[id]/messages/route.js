import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch all messages where this player is sender or recipient
    const { data: messages, error } = await supabaseAdmin
      .from("mf_messages")
      .select("*")
      .or(`sender_id.eq.${id},recipient_id.eq.${id}`)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map body → content for frontend compatibility
    const mapped = (messages || []).map(m => ({ ...m, content: m.body }));
    return NextResponse.json({ messages: mapped });
  } catch (err) {
    console.error("GET /api/players/[id]/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { content, receiver_id } = body;

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    // Get the player's team_id and find the coach
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("team_id")
      .eq("id", id)
      .single();

    let coachId = receiver_id;
    if (!coachId && player?.team_id) {
      const { data: team } = await supabaseAdmin
        .from("mf_teams")
        .select("coach_id")
        .eq("id", player.team_id)
        .single();
      coachId = team?.coach_id;
    }

    const { data: message, error } = await supabaseAdmin
      .from("mf_messages")
      .insert({
        team_id: player?.team_id || null,
        sender_type: "player",
        sender_id: id,
        recipient_type: "coach",
        recipient_id: coachId || null,
        body: content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("POST /api/players/[id]/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { playerId } = params;

    // Fetch all messages where this player is sender or recipient
    const { data: messages, error } = await supabaseAdmin
      .from("mf_messages")
      .select("*")
      .or(
        `recipient_id.eq.${playerId},sender_id.eq.${playerId}`
      )
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map body → content for frontend compatibility
    const mapped = (messages || []).map(m => ({ ...m, content: m.body }));
    return NextResponse.json({ messages: mapped });
  } catch (err) {
    console.error("GET /api/coach/messages/[playerId] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { playerId } = params;
    const reqBody = await request.json();
    const { coach_id, sender_id, content } = reqBody;
    const coachId = coach_id || sender_id;

    if (!coachId || !content) {
      return NextResponse.json(
        { error: "coach_id/sender_id and content are required" },
        { status: 400 }
      );
    }

    // Get the team_id for this player
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("team_id")
      .eq("id", playerId)
      .single();

    const { data: message, error } = await supabaseAdmin
      .from("mf_messages")
      .insert({
        team_id: player?.team_id || null,
        sender_type: "coach",
        sender_id: coachId,
        recipient_type: "player",
        recipient_id: playerId,
        body: content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...message, content: message.body }, { status: 201 });
  } catch (err) {
    console.error("POST /api/coach/messages/[playerId] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

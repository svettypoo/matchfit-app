import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { coach_id, content } = body;

    if (!coach_id || !content) {
      return NextResponse.json(
        { error: "coach_id and content are required" },
        { status: 400 }
      );
    }

    // Store as a notification with type 'coach_note'
    const { data: note, error } = await supabaseAdmin
      .from("mf_notifications")
      .insert({
        player_id: id,
        coach_id,
        type: "coach_note",
        title: "Coach Note",
        body: content,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("POST /api/players/[id]/notes error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

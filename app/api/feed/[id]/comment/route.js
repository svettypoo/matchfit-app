import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

// POST /api/feed/[id]/comment — add a comment
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { player_id, player_name, text, ref_type } = body;

    if (!player_id || !text || !ref_type) {
      return NextResponse.json(
        { error: "player_id, text, and ref_type are required" },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabaseAdmin
      .from("mf_feed_comments")
      .insert({
        ref_id: id,
        ref_type,
        player_id,
        player_name: player_name || "Player",
        text,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error("POST /api/feed/[id]/comment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/feed/[id]/comment?ref_type=X — list comments for a feed item
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const ref_type = searchParams.get("ref_type");

    if (!ref_type) {
      return NextResponse.json({ error: "ref_type is required" }, { status: 400 });
    }

    const { data: comments, error } = await supabaseAdmin
      .from("mf_feed_comments")
      .select("*")
      .eq("ref_id", id)
      .eq("ref_type", ref_type)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(comments || []);
  } catch (err) {
    console.error("GET /api/feed/[id]/comment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

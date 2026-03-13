import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

// POST /api/feed/[id]/react — toggle like/unlike
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { player_id, ref_type } = body;

    if (!player_id || !ref_type) {
      return NextResponse.json(
        { error: "player_id and ref_type are required" },
        { status: 400 }
      );
    }

    // Check if already reacted
    const { data: existing } = await supabaseAdmin
      .from("mf_feed_reactions")
      .select("id")
      .eq("ref_id", id)
      .eq("ref_type", ref_type)
      .eq("player_id", player_id)
      .maybeSingle();

    if (existing) {
      // Unlike — remove reaction
      await supabaseAdmin
        .from("mf_feed_reactions")
        .delete()
        .eq("id", existing.id);

      return NextResponse.json({ action: "unliked", ref_id: id });
    } else {
      // Like — add reaction
      const { error } = await supabaseAdmin
        .from("mf_feed_reactions")
        .insert({
          ref_id: id,
          ref_type,
          player_id,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ action: "liked", ref_id: id });
    }
  } catch (err) {
    console.error("POST /api/feed/[id]/react error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

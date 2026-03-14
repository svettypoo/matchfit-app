import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request, { params }) {
  try {
    const { id: program_id } = params;
    const { player_ids } = await request.json();

    if (!player_ids || !Array.isArray(player_ids)) {
      return NextResponse.json({ duplicates: [] });
    }

    // Check for existing active assignments
    const { data: existing } = await supabaseAdmin
      .from("mf_player_programs")
      .select("player_id, start_date, status, mf_players(name)")
      .eq("program_id", program_id)
      .in("player_id", player_ids)
      .in("status", ["active", "upcoming"]);

    const duplicates = (existing || []).map(e => ({
      player_id: e.player_id,
      player_name: e.mf_players?.name || "Unknown",
      start_date: e.start_date,
      status: e.status,
    }));

    return NextResponse.json({ duplicates });
  } catch (err) {
    console.error("POST /api/programs/[id]/assign/check error:", err);
    return NextResponse.json({ duplicates: [] });
  }
}

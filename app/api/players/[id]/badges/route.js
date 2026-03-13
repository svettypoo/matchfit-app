import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch all badges
    const { data: allBadges, error: badgesError } = await supabaseAdmin
      .from("mf_badges")
      .select("*")
      .order("name", { ascending: true });

    if (badgesError) {
      return NextResponse.json({ error: badgesError.message }, { status: 500 });
    }

    // Fetch badges earned by this player
    const { data: earnedBadges, error: earnedError } = await supabaseAdmin
      .from("mf_player_badges")
      .select("*, mf_badges(*)")
      .eq("player_id", id)
      .order("earned_at", { ascending: false });

    if (earnedError) {
      return NextResponse.json({ error: earnedError.message }, { status: 500 });
    }

    const earnedBadgeIds = new Set(
      (earnedBadges || []).map((eb) => eb.badge_id)
    );

    const badges = (allBadges || []).map((b) => ({
      ...b,
      earned: earnedBadgeIds.has(b.id),
    }));

    const earned = (earnedBadges || []).map((eb) => ({
      ...eb.mf_badges,
      earned_at: eb.earned_at,
    }));

    return NextResponse.json({ badges, earned });
  } catch (err) {
    console.error("GET /api/players/[id]/badges error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

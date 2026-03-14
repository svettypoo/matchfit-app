import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

// GET /api/nutrition-plans?player_id=X&status=active
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const player_id = searchParams.get("player_id");
    const status = searchParams.get("status");

    if (!player_id) {
      return NextResponse.json({ error: "player_id required" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("mf_nutrition_plans")
      .select("*, mf_nutrition_plan_meals(*, mf_meals(id, name, image_url))")
      .eq("player_id", player_id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data: plans, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ plan: plans?.[0] || null, plans });
  } catch (err) {
    console.error("GET /api/nutrition-plans error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

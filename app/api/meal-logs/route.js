import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

// GET /api/meal-logs?player_id=X&date=YYYY-MM-DD&from=&to=
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const player_id = searchParams.get("player_id");
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!player_id) {
      return NextResponse.json({ error: "player_id is required" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("mf_meal_logs")
      .select("*")
      .eq("player_id", player_id)
      .order("logged_at", { ascending: false });

    if (date) {
      query = query
        .gte("logged_at", `${date}T00:00:00`)
        .lt("logged_at", `${date}T23:59:59`);
    } else if (from && to) {
      query = query
        .gte("logged_at", `${from}T00:00:00`)
        .lte("logged_at", `${to}T23:59:59`);
    } else {
      query = query.limit(50);
    }

    const { data: logs, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Calculate daily totals
    const totals = {
      calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
      fiber_g: 0, sugar_g: 0, sodium_mg: 0, meal_count: 0,
    };
    for (const log of logs || []) {
      totals.calories += log.calories || 0;
      totals.protein_g += parseFloat(log.protein_g) || 0;
      totals.carbs_g += parseFloat(log.carbs_g) || 0;
      totals.fat_g += parseFloat(log.fat_g) || 0;
      totals.fiber_g += parseFloat(log.fiber_g) || 0;
      totals.sugar_g += parseFloat(log.sugar_g) || 0;
      totals.sodium_mg += parseFloat(log.sodium_mg) || 0;
      totals.meal_count++;
    }

    return NextResponse.json({ logs, totals });
  } catch (err) {
    console.error("GET /api/meal-logs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/meal-logs — log a meal
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      player_id, meal_id, plan_meal_id, name, meal_type,
      calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
      serving_size, notes, image_url, ai_analysis, logged_at,
    } = body;

    if (!player_id || !name) {
      return NextResponse.json({ error: "player_id and name are required" }, { status: 400 });
    }

    const { data: log, error } = await supabaseAdmin
      .from("mf_meal_logs")
      .insert({
        player_id,
        meal_id: meal_id || null,
        plan_meal_id: plan_meal_id || null,
        name,
        meal_type: meal_type || "snack",
        calories: calories || null,
        protein_g: protein_g || null,
        carbs_g: carbs_g || null,
        fat_g: fat_g || null,
        fiber_g: fiber_g || null,
        sugar_g: sugar_g || null,
        sodium_mg: sodium_mg || null,
        serving_size: serving_size || null,
        notes: notes || null,
        image_url: image_url || null,
        ai_analysis: ai_analysis || null,
        logged_at: logged_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Award XP for logging meals (nutrition tracking bonus)
    try {
      const { data: player } = await supabaseAdmin
        .from("mf_players")
        .select("id, xp")
        .eq("id", player_id)
        .single();
      if (player) {
        await supabaseAdmin
          .from("mf_players")
          .update({ xp: (player.xp || 0) + 10 })
          .eq("id", player_id);
      }
    } catch { /* silent */ }

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("POST /api/meal-logs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/meal-logs?id=X
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("mf_meal_logs")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/meal-logs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

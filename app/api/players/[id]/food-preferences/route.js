import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * GET /api/players/[id]/food-preferences
 * Returns the player's saved food preferences.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, food_preferences")
      .eq("id", id)
      .single();

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({
      player_id: player.id,
      player_name: player.name,
      preferences: player.food_preferences || {
        favorite_foods: [],
        disliked_foods: [],
        allergies: [],
        dietary_restrictions: [],
        cuisine_preferences: [],
        meals_per_day: 5,
        cooking_skill: "intermediate",
      },
    });
  } catch (err) {
    console.error("get food preferences error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/players/[id]/food-preferences
 * Saves the player's food preferences to mf_players.food_preferences JSONB column.
 * Body: { favorite_foods[], disliked_foods[], allergies[], dietary_restrictions[],
 *         cuisine_preferences[], meals_per_day, cooking_skill }
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      favorite_foods = [],
      disliked_foods = [],
      allergies = [],
      dietary_restrictions = [],
      cuisine_preferences = [],
      meals_per_day = 5,
      cooking_skill = "intermediate",
    } = body;

    const preferences = {
      favorite_foods,
      disliked_foods,
      allergies,
      dietary_restrictions,
      cuisine_preferences,
      meals_per_day,
      cooking_skill,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("mf_players")
      .update({ food_preferences: preferences })
      .eq("id", id)
      .select("id, name, food_preferences")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({
      player_id: data.id,
      player_name: data.name,
      preferences: data.food_preferences,
    });
  } catch (err) {
    console.error("save food preferences error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

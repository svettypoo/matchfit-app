import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const meal_type = searchParams.get("meal_type");
    const search = searchParams.get("search");
    const coach_id = searchParams.get("coach_id");
    const dietary = searchParams.get("dietary");

    let query = supabaseAdmin
      .from("mf_meals")
      .select("*")
      .order("meal_type")
      .order("name");

    if (meal_type) query = query.eq("meal_type", meal_type);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (dietary) query = query.contains("dietary_tags", [dietary]);

    if (coach_id) {
      query = query.or(`coach_id.is.null,coach_id.eq.${coach_id}`);
    } else {
      query = query.is("coach_id", null);
    }

    const { data: meals, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ meals });
  } catch (err) {
    console.error("GET /api/meals error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      coach_id, name, description, meal_type, cuisine, dietary_tags,
      allergens, ingredients, instructions, prep_time_min, calories,
      protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g,
      serving_size, image_url, is_ai_generated,
    } = body;

    if (!name || !meal_type) {
      return NextResponse.json({ error: "name and meal_type are required" }, { status: 400 });
    }

    const validTypes = ["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout", "shake"];
    if (!validTypes.includes(meal_type)) {
      return NextResponse.json({ error: `meal_type must be one of: ${validTypes.join(", ")}` }, { status: 400 });
    }

    const { data: meal, error } = await supabaseAdmin
      .from("mf_meals")
      .insert({
        coach_id: coach_id || null,
        name, description: description || null,
        meal_type, cuisine: cuisine || null,
        dietary_tags: dietary_tags || [],
        allergens: allergens || [],
        ingredients: ingredients || [],
        instructions: instructions || null,
        prep_time_min: prep_time_min || null,
        calories: calories || null,
        protein_g: protein_g || null,
        carbs_g: carbs_g || null,
        fat_g: fat_g || null,
        fiber_g: fiber_g || null,
        sodium_mg: sodium_mg || null,
        sugar_g: sugar_g || null,
        serving_size: serving_size || null,
        image_url: image_url || null,
        is_ai_generated: is_ai_generated || false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(meal, { status: 201 });
  } catch (err) {
    console.error("POST /api/meals error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

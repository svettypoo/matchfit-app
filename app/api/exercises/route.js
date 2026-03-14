import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const coach_id = searchParams.get("coach_id");
    const exercise_type = searchParams.get("exercise_type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "40"), 100);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("mf_exercises")
      .select("*", { count: "exact" })
      .order("category")
      .order("difficulty")
      .order("name")
      .range(offset, offset + limit - 1);

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by difficulty
    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    // Filter by exercise type
    if (exercise_type) {
      query = query.eq("exercise_type", exercise_type);
    }

    // Search by name or description
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // Show system exercises (coach_id is null) + coach's custom exercises
    if (coach_id) {
      query = query.or(`coach_id.is.null,coach_id.eq.${coach_id}`);
    } else {
      // If no coach_id provided, only show system exercises
      query = query.is("coach_id", null);
    }

    const { data: exercises, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exercises, total: count, page, limit, totalPages: Math.ceil((count || 0) / limit) });
  } catch (err) {
    console.error("GET /api/exercises error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      coach_id,
      name,
      description,
      category,
      muscle_groups,
      equipment,
      difficulty,
      video_url,
      image_url,
      is_timed,
      default_sets,
      default_reps,
      default_duration_sec,
      default_rest_sec,
      maturity_safe,
      exercise_type,
      tracking_fields,
      default_weight_kg,
      instructions,
      tips,
      primary_muscles,
      secondary_muscles,
    } = body;

    if (!coach_id) {
      return NextResponse.json(
        { error: "coach_id is required to create custom exercises" },
        { status: 400 }
      );
    }

    if (!name || !category) {
      return NextResponse.json(
        { error: "name and category are required" },
        { status: 400 }
      );
    }

    const validCategories = [
      "strength", "speed", "agility", "ball_work",
      "flexibility", "core", "plyometrics", "recovery",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const { data: exercise, error } = await supabaseAdmin
      .from("mf_exercises")
      .insert({
        coach_id,
        name,
        description: description || null,
        category,
        muscle_groups: muscle_groups || [],
        equipment: equipment || ["bodyweight"],
        difficulty: difficulty || "intermediate",
        video_url: video_url || null,
        image_url: image_url || null,
        is_timed: is_timed || false,
        default_sets: default_sets || 3,
        default_reps: is_timed ? null : (default_reps || 10),
        default_duration_sec: is_timed ? (default_duration_sec || 30) : null,
        default_rest_sec: default_rest_sec || 60,
        maturity_safe: maturity_safe || ["pre_phv", "phv", "post_phv"],
        exercise_type: exercise_type || "independent",
        tracking_fields: tracking_fields || [],
        default_weight_kg: default_weight_kg || null,
        instructions: instructions || null,
        tips: tips || null,
        primary_muscles: primary_muscles || [],
        secondary_muscles: secondary_muscles || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(exercise, { status: 201 });
  } catch (err) {
    console.error("POST /api/exercises error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

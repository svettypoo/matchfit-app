import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const coach_id = searchParams.get("coach_id");

    let query = supabaseAdmin
      .from("mf_exercises")
      .select("*")
      .order("category")
      .order("difficulty")
      .order("name");

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by difficulty
    if (difficulty) {
      query = query.eq("difficulty", difficulty);
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

    const { data: exercises, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(exercises);
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

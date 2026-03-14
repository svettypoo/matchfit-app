import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * GET /api/nutrition-plans/suggest-goals?player_id=xxx
 * Returns AI-suggested nutritional goals based on player profile.
 * The coach can review and adjust these before generating a plan.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const player_id = searchParams.get("player_id");

    if (!player_id) {
      return NextResponse.json({ error: "player_id required" }, { status: 400 });
    }

    // Fetch player profile
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("*")
      .eq("id", player_id)
      .single();
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    // Fetch questionnaire data
    const { data: questionnaire } = await supabaseAdmin
      .from("mf_questionnaire_responses")
      .select("nutrition_quality, sleep_hours_avg, primary_fitness_goal, preferred_workout_duration")
      .eq("player_id", player_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch scheduled workouts this week
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const { data: workouts } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("scheduled_date, status, duration_minutes")
      .eq("player_id", player_id)
      .gte("scheduled_date", weekStart.toISOString().split("T")[0])
      .lte("scheduled_date", weekEnd.toISOString().split("T")[0]);

    // Fetch recent wellness checkins
    const { data: wellness } = await supabaseAdmin
      .from("mf_wellness_checkins")
      .select("nutrition_quality, energy_level, created_at")
      .eq("player_id", player_id)
      .order("created_at", { ascending: false })
      .limit(7);

    // Fetch food preferences
    const foodPrefs = player.food_preferences || {};

    // Calculate training load
    const weeklyWorkouts = (workouts || []).length;
    const avgDuration = weeklyWorkouts > 0
      ? Math.round((workouts || []).reduce((s, w) => s + (w.duration_minutes || 0), 0) / weeklyWorkouts)
      : 60;

    // Player stats
    const weight = player.weight_kg || 70;
    const height = player.height_cm || 175;
    const age = player.date_of_birth
      ? Math.floor((Date.now() - new Date(player.date_of_birth)) / 31557600000)
      : 20;

    // BMR (Mifflin-St Jeor)
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    const activityMultiplier = weeklyWorkouts >= 5 ? 1.725 : weeklyWorkouts >= 3 ? 1.55 : 1.375;
    const tdee = Math.round(bmr * activityMultiplier);

    // Determine goal type from player profile
    const primaryGoal = player.primary_goal || questionnaire?.primary_fitness_goal || "performance";
    let goalType = "maintain";
    if (primaryGoal.includes("lose") || primaryGoal.includes("cut") || primaryGoal.includes("lean")) {
      goalType = "cut";
    } else if (primaryGoal.includes("gain") || primaryGoal.includes("bulk") || primaryGoal.includes("mass")) {
      goalType = "bulk";
    } else if (primaryGoal.includes("performance") || primaryGoal.includes("athletic")) {
      goalType = "performance";
    }

    // Calorie target based on goal
    let calorieTarget = tdee;
    if (goalType === "cut") calorieTarget = Math.round(tdee * 0.85);
    else if (goalType === "bulk") calorieTarget = Math.round(tdee * 1.15);
    else if (goalType === "performance") calorieTarget = Math.round(tdee * 1.05);

    // Macro split based on goal
    let proteinPct, carbsPct, fatPct;
    switch (goalType) {
      case "bulk":
        proteinPct = 0.30; carbsPct = 0.45; fatPct = 0.25;
        break;
      case "cut":
        proteinPct = 0.35; carbsPct = 0.35; fatPct = 0.30;
        break;
      case "performance":
        proteinPct = 0.30; carbsPct = 0.50; fatPct = 0.20;
        break;
      default: // maintain
        proteinPct = 0.30; carbsPct = 0.45; fatPct = 0.25;
    }

    const proteinTarget = Math.round((calorieTarget * proteinPct) / 4);
    const carbsTarget = Math.round((calorieTarget * carbsPct) / 4);
    const fatTarget = Math.round((calorieTarget * fatPct) / 9);

    // Suggest meals per day based on goal and training
    let mealsPerDay = 5;
    if (goalType === "bulk") mealsPerDay = 6;
    if (goalType === "cut" && weeklyWorkouts < 3) mealsPerDay = 4;

    // Average nutrition quality from recent wellness
    const avgNutritionQuality = wellness?.length
      ? Math.round(wellness.reduce((s, w) => s + (w.nutrition_quality || 0), 0) / wellness.length * 10) / 10
      : null;

    const avgEnergyLevel = wellness?.length
      ? Math.round(wellness.reduce((s, w) => s + (w.energy_level || 0), 0) / wellness.length * 10) / 10
      : null;

    return NextResponse.json({
      player: {
        name: player.name,
        weight_kg: weight,
        height_cm: height,
        age,
        fitness_level: player.fitness_level || "intermediate",
        primary_goal: primaryGoal,
        training_days: player.training_days || weeklyWorkouts,
      },
      suggestions: {
        goal_type: goalType,
        daily_calories: calorieTarget,
        tdee,
        bmr: Math.round(bmr),
        protein_target_g: proteinTarget,
        carbs_target_g: carbsTarget,
        fat_target_g: fatTarget,
        protein_pct: Math.round(proteinPct * 100),
        carbs_pct: Math.round(carbsPct * 100),
        fat_pct: Math.round(fatPct * 100),
        meals_per_day: mealsPerDay,
        snacks_per_day: mealsPerDay > 4 ? mealsPerDay - 3 : 1,
        hydration_liters: Math.round((weight * 0.04 + weeklyWorkouts * 0.3) * 10) / 10,
      },
      wellness: {
        avg_nutrition_quality: avgNutritionQuality,
        avg_energy_level: avgEnergyLevel,
        checkins_last_7_days: wellness?.length || 0,
      },
      training: {
        weekly_workouts: weeklyWorkouts,
        avg_duration_min: avgDuration,
        activity_multiplier: activityMultiplier,
      },
      food_preferences: foodPrefs,
    });
  } catch (err) {
    console.error("suggest-goals error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/nutrition-plans/generate
 * AI-generates a personalized nutrition plan based on player profile,
 * exercise plan, dietary restrictions, goals, and food preferences.
 * Body: { player_id, goal?, dietary_restrictions?, allergies?, favorite_foods?,
 *         disliked_foods?, cuisine_preferences?, meals_per_day?, snacks_per_day?,
 *         budget?, cooking_skill?, prep_time_max_min?, daily_calories?, protein_target_g?,
 *         carbs_target_g?, fat_target_g?, special_notes? }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      player_id,
      goal,
      dietary_restrictions,
      allergies,
      favorite_foods,
      disliked_foods,
      cuisine_preferences,
      meals_per_day,
      snacks_per_day,
      budget,
      cooking_skill,
      prep_time_max_min,
      daily_calories: overrideCalories,
      protein_target_g: overrideProtein,
      carbs_target_g: overrideCarbs,
      fat_target_g: overrideFat,
      special_notes,
    } = body;

    if (!player_id) {
      return NextResponse.json({ error: "player_id required" }, { status: 400 });
    }

    // Fetch player profile (including food_preferences)
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("*")
      .eq("id", player_id)
      .single();
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    // Merge player saved preferences with request overrides
    const savedPrefs = player.food_preferences || {};
    const effectiveFavorites = favorite_foods?.length ? favorite_foods : (savedPrefs.favorite_foods || []);
    const effectiveDisliked = disliked_foods?.length ? disliked_foods : (savedPrefs.disliked_foods || []);
    const effectiveAllergies = allergies?.length ? allergies : (savedPrefs.allergies || []);
    const effectiveDietaryRestrictions = dietary_restrictions?.length ? dietary_restrictions : (savedPrefs.dietary_restrictions || []);
    const effectiveCuisine = cuisine_preferences?.length ? cuisine_preferences : (savedPrefs.cuisine_preferences || []);
    const effectiveMealsPerDay = meals_per_day || savedPrefs.meals_per_day || 5;
    const effectiveSnacksPerDay = snacks_per_day ?? 2;
    const effectiveCookingSkill = cooking_skill || savedPrefs.cooking_skill || 'intermediate';
    const effectiveBudget = budget || 'medium';
    const effectivePrepTime = prep_time_max_min || 30;

    // Fetch active exercise plan for context
    const { data: exercisePlan } = await supabaseAdmin
      .from("mf_exercise_plans")
      .select("name, description, phase, difficulty, duration_weeks")
      .eq("player_id", player_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch scheduled workouts this week to understand training load
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const { data: workouts } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("scheduled_date, status, duration_minutes, xp_earned")
      .eq("player_id", player_id)
      .gte("scheduled_date", weekStart.toISOString().split("T")[0])
      .lte("scheduled_date", weekEnd.toISOString().split("T")[0]);

    // Fetch questionnaire for dietary info
    const { data: questionnaire } = await supabaseAdmin
      .from("mf_questionnaire_responses")
      .select("nutrition_quality, sleep_hours_avg, primary_fitness_goal, preferred_workout_duration")
      .eq("player_id", player_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch available meals library
    const { data: meals } = await supabaseAdmin
      .from("mf_meals")
      .select("id, name, meal_type, calories, protein_g, carbs_g, fat_g, dietary_tags, allergens")
      .or("coach_id.is.null,coach_id.eq." + (player.team_id || "null"))
      .limit(100);

    // Calculate training load
    const weeklyWorkouts = (workouts || []).length;
    const avgDuration = weeklyWorkouts > 0
      ? Math.round((workouts || []).reduce((s, w) => s + (w.duration_minutes || 0), 0) / weeklyWorkouts)
      : 60;

    // Estimate caloric needs
    const weight = player.weight_kg || 70;
    const height = player.height_cm || 175;
    const age = player.date_of_birth
      ? Math.floor((Date.now() - new Date(player.date_of_birth)) / 31557600000)
      : 20;

    // Mifflin-St Jeor BMR + activity multiplier
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    const activityMultiplier = weeklyWorkouts >= 5 ? 1.725 : weeklyWorkouts >= 3 ? 1.55 : 1.375;
    const tdee = Math.round(bmr * activityMultiplier);

    const playerGoal = goal || questionnaire?.primary_fitness_goal || player.primary_goal || "performance";
    let calorieTarget = tdee;
    if (playerGoal.includes("lose") || playerGoal.includes("cut")) calorieTarget = Math.round(tdee * 0.85);
    else if (playerGoal.includes("gain") || playerGoal.includes("bulk")) calorieTarget = Math.round(tdee * 1.15);

    // Macro split based on goal
    let proteinPct = 0.30, carbsPct = 0.45, fatPct = 0.25;
    if (playerGoal.includes("strength") || playerGoal.includes("muscle")) {
      proteinPct = 0.35; carbsPct = 0.40; fatPct = 0.25;
    } else if (playerGoal.includes("endurance")) {
      proteinPct = 0.25; carbsPct = 0.55; fatPct = 0.20;
    }

    let proteinTarget = Math.round((calorieTarget * proteinPct) / 4);
    let carbsTarget = Math.round((calorieTarget * carbsPct) / 4);
    let fatTarget = Math.round((calorieTarget * fatPct) / 9);

    // Apply coach overrides if provided
    if (overrideCalories) calorieTarget = overrideCalories;
    if (overrideProtein) proteinTarget = overrideProtein;
    if (overrideCarbs) carbsTarget = overrideCarbs;
    if (overrideFat) fatTarget = overrideFat;

    const mealList = (meals || [])
      .map(m => `- ${m.name} (${m.meal_type}, ${m.calories || "?"}cal, P:${m.protein_g || "?"}g C:${m.carbs_g || "?"}g F:${m.fat_g || "?"}g, tags: ${(m.dietary_tags || []).join(",") || "none"})`)
      .join("\n");

    // Build food preferences section for prompt
    let foodPrefsSection = "";
    if (effectiveFavorites.length > 0) {
      foodPrefsSection += `\nFAVORITE FOODS (include these where possible, the player enjoys them): ${effectiveFavorites.join(", ")}`;
    }
    if (effectiveDisliked.length > 0) {
      foodPrefsSection += `\nDISLIKED FOODS (AVOID these completely, never include them): ${effectiveDisliked.join(", ")}`;
    }
    if (effectiveCuisine.length > 0) {
      foodPrefsSection += `\nPREFERRED CUISINES (lean towards these cooking styles): ${effectiveCuisine.join(", ")}`;
    }

    const totalMealsPerDay = effectiveMealsPerDay;
    const mealStructure = `${effectiveMealsPerDay - effectiveSnacksPerDay} main meals and ${effectiveSnacksPerDay} snacks`;

    const prompt = `You are an elite sports nutritionist creating a personalized 7-day meal plan for an athlete.

PLAYER PROFILE:
- Name: ${player.name}
- Age: ${age}, Weight: ${weight}kg, Height: ${height}cm
- Position: ${(player.position || []).join(", ") || "athlete"}
- Fitness Level: ${player.fitness_level || "intermediate"}
- Goal: ${playerGoal}

TRAINING CONTEXT:
- Current program: ${exercisePlan?.name || "none"} (${exercisePlan?.phase || "base"} phase)
- Weekly workouts: ${weeklyWorkouts} sessions, ~${avgDuration}min avg
- Current nutrition quality: ${questionnaire?.nutrition_quality || "unknown"}/5

CALCULATED TARGETS:
- TDEE: ${tdee} cal/day
- Calorie target: ${calorieTarget} cal/day (${playerGoal})
- Protein: ${proteinTarget}g/day
- Carbs: ${carbsTarget}g/day
- Fat: ${fatTarget}g/day

DIETARY RESTRICTIONS: ${effectiveDietaryRestrictions.join(", ") || "none"}
ALLERGIES: ${effectiveAllergies.join(", ") || "none"}
${foodPrefsSection}

MEAL STRUCTURE: ${totalMealsPerDay} meals per day (${mealStructure})
COOKING SKILL: ${effectiveCookingSkill} (adjust recipe complexity accordingly)
BUDGET: ${effectiveBudget} (${effectiveBudget === 'low' ? 'use affordable ingredients, avoid expensive items' : effectiveBudget === 'high' ? 'premium ingredients allowed' : 'moderate ingredient costs'})
MAX PREP TIME PER MEAL: ${effectivePrepTime} minutes
${special_notes ? `\nCOACH NOTES: ${special_notes}` : ''}

AVAILABLE MEALS IN LIBRARY (use these when possible, or suggest new ones):
${mealList || "No meals in library yet — suggest all new meals."}

Create a 7-day meal plan with ${totalMealsPerDay} meals per day (${mealStructure}).

For each meal, consider:
- Pre/post workout timing on training days
- Higher carbs on training days, slightly lower on rest days
- Protein distributed evenly across meals
- Hydration reminders
- Player's favorite foods should appear frequently
- Player's disliked foods must NEVER appear
- Recipes should match the player's cooking skill level
- Each meal should be preparable within ${effectivePrepTime} minutes

Return JSON:
\`\`\`json
{
  "name": "Plan name",
  "description": "Brief description",
  "ai_writeup": "Detailed 3-4 paragraph nutritional analysis. Explain the macro split rationale, meal timing strategy relative to training, key nutritional priorities for this athlete, hydration recommendations, and supplement suggestions if appropriate. Mention how the plan incorporates the player's food preferences.",
  "daily_calories": ${calorieTarget},
  "protein_target_g": ${proteinTarget},
  "carbs_target_g": ${carbsTarget},
  "fat_target_g": ${fatTarget},
  "days": [
    {
      "day_of_week": 0,
      "is_training_day": true,
      "meals": [
        {
          "meal_type": "breakfast",
          "name": "Oatmeal Power Bowl",
          "description": "Steel-cut oats with banana, almonds, and whey protein",
          "calories": 450,
          "protein_g": 30,
          "carbs_g": 55,
          "fat_g": 12,
          "ingredients": ["1 cup steel-cut oats", "1 banana", "30g almonds", "1 scoop whey protein"],
          "prep_time_min": 10,
          "notes": "Eat 2 hours before training"
        }
      ]
    }
  ],
  "shopping_list": ["Item 1", "Item 2"],
  "supplements": ["Creatine 5g daily", "Vitamin D 2000IU"],
  "hydration_target_liters": 3.5,
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}
\`\`\`

Requirements:
- 7 complete days (day_of_week 0-6, 0=Sunday)
- Each day: ${totalMealsPerDay} meals totaling close to ${calorieTarget} calories
- Training days: pre-workout and post-workout meals timed appropriately
- Include a practical shopping list
- Meals should be realistic, easy to prep, and appetizing
- Respect ALL dietary restrictions and allergies
- Include the player's favorite foods as often as nutritionally appropriate
- NEVER include any of the player's disliked foods`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiResponse.json();
    const aiText = aiData.content?.[0]?.text || "";

    let planData;
    try {
      const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/\{[\s\S]*\}/);
      planData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiText);
    } catch {
      return NextResponse.json({
        error: "Failed to parse AI nutrition plan",
        raw_response: aiText.slice(0, 1000),
      }, { status: 500 });
    }

    // Deactivate existing active plans
    await supabaseAdmin
      .from("mf_nutrition_plans")
      .update({ status: "superseded" })
      .eq("player_id", player_id)
      .eq("status", "active");

    // Create the plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from("mf_nutrition_plans")
      .insert({
        player_id,
        coach_id: null,
        name: planData.name || `${player.name}'s Nutrition Plan`,
        description: planData.description || "",
        ai_writeup: planData.ai_writeup || "",
        daily_calories: planData.daily_calories || calorieTarget,
        protein_target_g: planData.protein_target_g || proteinTarget,
        carbs_target_g: planData.carbs_target_g || carbsTarget,
        fat_target_g: planData.fat_target_g || fatTarget,
        dietary_restrictions: effectiveDietaryRestrictions,
        allergies: effectiveAllergies,
        goal: playerGoal,
        status: "active",
        start_date: new Date().toISOString().split("T")[0],
        is_ai_generated: true,
      })
      .select()
      .single();

    if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

    // Create plan meals
    for (const day of (planData.days || [])) {
      for (let i = 0; i < (day.meals || []).length; i++) {
        const meal = day.meals[i];

        // Try to find matching meal in library
        let mealId = null;
        if (meals?.length) {
          const match = meals.find(m =>
            m.name.toLowerCase() === (meal.name || "").toLowerCase()
          );
          if (match) mealId = match.id;
        }

        // Create new meal in library if not found
        if (!mealId && meal.name) {
          const { data: newMeal } = await supabaseAdmin
            .from("mf_meals")
            .insert({
              name: meal.name,
              description: meal.description || null,
              meal_type: meal.meal_type || "snack",
              calories: meal.calories || null,
              protein_g: meal.protein_g || null,
              carbs_g: meal.carbs_g || null,
              fat_g: meal.fat_g || null,
              ingredients: meal.ingredients || [],
              prep_time_min: meal.prep_time_min || null,
              is_ai_generated: true,
            })
            .select()
            .single();
          if (newMeal) mealId = newMeal.id;
        }

        await supabaseAdmin
          .from("mf_nutrition_plan_meals")
          .insert({
            plan_id: plan.id,
            meal_id: mealId,
            day_of_week: day.day_of_week ?? 0,
            meal_type: meal.meal_type || "snack",
            name: meal.name || null,
            calories: meal.calories || null,
            protein_g: meal.protein_g || null,
            carbs_g: meal.carbs_g || null,
            fat_g: meal.fat_g || null,
            notes: meal.notes || null,
            sort_order: i,
          });
      }
    }

    // Fetch complete plan
    const { data: fullPlan } = await supabaseAdmin
      .from("mf_nutrition_plans")
      .select("*, mf_nutrition_plan_meals(*, mf_meals(id, name, image_url))")
      .eq("id", plan.id)
      .single();

    return NextResponse.json({
      plan: fullPlan,
      shopping_list: planData.shopping_list || [],
      supplements: planData.supplements || [],
      hydration_target_liters: planData.hydration_target_liters || 3,
      tips: planData.tips || [],
    }, { status: 201 });
  } catch (err) {
    console.error("generate nutrition plan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

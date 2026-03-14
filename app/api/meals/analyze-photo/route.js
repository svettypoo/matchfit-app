import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/meals/analyze-photo
 * Accepts a base64 image of a meal, uses Claude Vision to identify food items
 * and estimate macros, calories, and nutrients.
 * Body: { image_base64, player_id?, meal_type? }
 */
export async function POST(request) {
  try {
    const { image_base64, image_url, player_id, meal_type } = await request.json();

    if (!image_base64 && !image_url) {
      return NextResponse.json({ error: "image_base64 or image_url is required" }, { status: 400 });
    }

    // Fetch player context if available (for dietary restrictions, goals)
    let playerContext = "";
    if (player_id) {
      const { data: player } = await supabaseAdmin
        .from("mf_players")
        .select("name, weight_kg, height_cm, primary_goal")
        .eq("id", player_id)
        .single();

      const { data: plan } = await supabaseAdmin
        .from("mf_nutrition_plans")
        .select("daily_calories, protein_target_g, carbs_target_g, fat_target_g, dietary_restrictions, allergies")
        .eq("player_id", player_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (player) {
        playerContext = `\nPLAYER CONTEXT:
- Weight: ${player.weight_kg || "?"}kg, Height: ${player.height_cm || "?"}cm
- Goal: ${player.primary_goal || "general fitness"}`;
      }
      if (plan) {
        playerContext += `\nNUTRITION TARGETS:
- Daily calories: ${plan.daily_calories || "?"}
- Protein: ${plan.protein_target_g || "?"}g, Carbs: ${plan.carbs_target_g || "?"}g, Fat: ${plan.fat_target_g || "?"}g
- Dietary restrictions: ${(plan.dietary_restrictions || []).join(", ") || "none"}
- Allergies: ${(plan.allergies || []).join(", ") || "none"}`;
      }
    }

    const prompt = `You are a certified sports nutritionist analyzing a meal photo for an athlete.

Analyze this meal image and provide detailed nutritional information.
${playerContext}

Identify ALL food items visible in the image. For each item, estimate:
- Portion size (in grams or common measurements)
- Calories, protein, carbs, fat, fiber, sugar, sodium

Then provide totals for the entire meal.

Also provide:
- A brief assessment of this meal for an athlete (is it balanced? good pre/post workout?)
- Suggestions to improve the meal nutritionally
- A "meal score" from 1-10 for athletic performance

Return JSON in this exact format:
\`\`\`json
{
  "meal_name": "Descriptive name of the meal",
  "items": [
    {
      "name": "Food item name",
      "portion": "estimated portion (e.g. '150g', '1 cup')",
      "calories": 250,
      "protein_g": 20,
      "carbs_g": 30,
      "fat_g": 8,
      "fiber_g": 3,
      "sugar_g": 5,
      "sodium_mg": 400
    }
  ],
  "totals": {
    "calories": 650,
    "protein_g": 45,
    "carbs_g": 60,
    "fat_g": 25,
    "fiber_g": 8,
    "sugar_g": 12,
    "sodium_mg": 900
  },
  "meal_score": 7,
  "assessment": "Brief assessment of the meal...",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "meal_type": "lunch",
  "dietary_tags": ["high_protein", "balanced"]
}
\`\`\``;

    // Build message with image
    const content = [{ type: "text", text: prompt }];

    if (image_base64) {
      // Detect media type from base64 header or default to jpeg
      let mediaType = "image/jpeg";
      if (image_base64.startsWith("/9j/")) mediaType = "image/jpeg";
      else if (image_base64.startsWith("iVBOR")) mediaType = "image/png";
      else if (image_base64.startsWith("R0lGOD")) mediaType = "image/gif";
      else if (image_base64.startsWith("UklGR")) mediaType = "image/webp";

      content.unshift({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: image_base64,
        },
      });
    } else if (image_url) {
      content.unshift({
        type: "image",
        source: { type: "url", url: image_url },
      });
    }

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content }],
      }),
    });

    const aiData = await aiResponse.json();
    const aiText = aiData.content?.[0]?.text || "";

    let analysis;
    try {
      const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiText);
    } catch {
      return NextResponse.json({
        error: "Failed to parse AI analysis",
        raw_response: aiText.slice(0, 500),
      }, { status: 500 });
    }

    // Optionally save to meal_logs if player_id provided
    if (player_id) {
      const { data: log } = await supabaseAdmin
        .from("mf_meal_logs")
        .insert({
          player_id,
          name: analysis.meal_name || "Meal",
          meal_type: meal_type || analysis.meal_type || "snack",
          calories: analysis.totals?.calories || null,
          protein_g: analysis.totals?.protein_g || null,
          carbs_g: analysis.totals?.carbs_g || null,
          fat_g: analysis.totals?.fat_g || null,
          fiber_g: analysis.totals?.fiber_g || null,
          sugar_g: analysis.totals?.sugar_g || null,
          sodium_mg: analysis.totals?.sodium_mg || null,
          image_url: image_url || null,
          ai_analysis: analysis,
        })
        .select()
        .single();

      analysis.meal_log_id = log?.id;
    }

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("POST /api/meals/analyze-photo error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

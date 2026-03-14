import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/ai/exercise-suggestions
 * AI suggests exercises for a training day based on player profile,
 * current program phase, recent performance, and muscle group balance.
 * Body: { player_id, day_type?, focus_area?, exclude_exercises?[] }
 */
export async function POST(request) {
  try {
    const { player_id, day_type, focus_area, exclude_exercises } = await request.json();
    if (!player_id) {
      return NextResponse.json({ error: "player_id required" }, { status: 400 });
    }

    // Fetch player profile
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("*, mf_teams(sport)")
      .eq("id", player_id)
      .single();
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    // Fetch exercise library
    const { data: exercises } = await supabaseAdmin
      .from("mf_exercises")
      .select("id, name, category, equipment, difficulty, primary_muscles, secondary_muscles, exercise_type")
      .limit(200);

    // Fetch recent exercise logs for muscle balance analysis
    const { data: recentLogs } = await supabaseAdmin
      .from("mf_exercise_logs")
      .select("exercise_id, completed_sets, weight_used, created_at, mf_exercises(name, category, primary_muscles)")
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch active injuries
    const { data: injuries } = await supabaseAdmin
      .from("mf_injuries")
      .select("body_part, severity, status")
      .eq("player_id", player_id)
      .in("status", ["active", "monitoring"]);

    // Build AI prompt
    const injuryContext = (injuries || []).length > 0
      ? `ACTIVE INJURIES (avoid exercises targeting these):\n${injuries.map(i => `- ${i.body_part}: ${i.severity} severity (${i.status})`).join("\n")}`
      : "No active injuries.";

    const exerciseList = (exercises || [])
      .filter(e => !(exclude_exercises || []).includes(e.id))
      .map(e => `- ${e.name} [${e.category}] (${e.difficulty}, muscles: ${(e.primary_muscles || []).join(",") || "general"}, equip: ${e.equipment || "none"})`)
      .join("\n");

    const recentMuscles = {};
    for (const log of (recentLogs || [])) {
      for (const m of (log.mf_exercises?.primary_muscles || [])) {
        recentMuscles[m] = (recentMuscles[m] || 0) + (log.completed_sets || 0);
      }
    }
    const muscleBalance = Object.entries(recentMuscles)
      .sort((a, b) => b[1] - a[1])
      .map(([m, sets]) => `${m}: ${sets} sets`)
      .join(", ");

    const prompt = `You are an elite sports performance coach. Suggest 6-8 exercises for a training session.

PLAYER PROFILE:
- Name: ${player.name}
- Age: ${player.date_of_birth ? Math.floor((Date.now() - new Date(player.date_of_birth)) / 31557600000) : "unknown"}
- Position: ${(player.position || []).join(", ") || "athlete"}
- Fitness Level: ${player.fitness_level || "intermediate"}
- Sport: ${player.mf_teams?.sport || "soccer"}

${injuryContext}

SESSION TYPE: ${day_type || "general training"}
FOCUS AREA: ${focus_area || "balanced"}

RECENT MUSCLE VOLUME (last 2 weeks): ${muscleBalance || "no data"}
- Prioritize under-trained muscle groups for balance

AVAILABLE EXERCISES:
${exerciseList}

Select 6-8 exercises from the available list that best fit this session. Include:
- 1 warmup/mobility exercise
- 2-3 main compound exercises
- 2-3 accessory exercises
- 1 cooldown/recovery exercise

For each exercise, suggest appropriate sets, reps, rest period, and RPE target.

Return JSON:
\`\`\`json
{
  "session_name": "Session name",
  "estimated_duration_min": 45,
  "exercises": [
    {
      "exercise_name": "Exercise Name",
      "sets": 3,
      "reps": 10,
      "rest_sec": 60,
      "rpe_target": 7,
      "notes": "Focus on controlled eccentric",
      "role": "warmup|main|accessory|cooldown"
    }
  ],
  "coaching_notes": "Brief session notes for the coach",
  "muscle_groups_targeted": ["quads", "hamstrings", "core"]
}
\`\`\``;

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
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiResponse.json();
    const aiText = aiData.content?.[0]?.text || "";

    let suggestions;
    try {
      const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/\{[\s\S]*\}/);
      suggestions = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiText);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI suggestions", raw: aiText.slice(0, 500) }, { status: 500 });
    }

    // Match exercise names to IDs from our library
    if (suggestions.exercises && exercises) {
      for (const ex of suggestions.exercises) {
        const match = exercises.find(e =>
          e.name.toLowerCase() === ex.exercise_name.toLowerCase()
        );
        if (match) ex.exercise_id = match.id;
      }
    }

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error("POST /api/ai/exercise-suggestions error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

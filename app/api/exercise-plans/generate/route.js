import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const supabase = getSupabaseAdmin();

/**
 * POST — Generate a full exercise plan from questionnaire + coach feedback using AI
 * Body: { player_id, questionnaire_id?, coach_feedback_id? }
 */
export async function POST(request) {
  try {
    const { player_id } = await request.json();
    if (!player_id) return NextResponse.json({ error: 'player_id required' }, { status: 400 });

    // Fetch player profile
    const { data: player } = await supabase
      .from('mf_players')
      .select('*')
      .eq('id', player_id)
      .single();
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    // Fetch questionnaire
    const { data: questionnaire } = await supabase
      .from('mf_questionnaire_responses')
      .select('*')
      .eq('player_id', player_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch coach feedback if exists
    let coachFeedback = null;
    if (questionnaire) {
      const { data: fb } = await supabase
        .from('mf_coach_feedback')
        .select('*')
        .eq('questionnaire_id', questionnaire.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      coachFeedback = fb;
    }

    // Fetch exercise library
    const { data: exercises } = await supabase
      .from('mf_exercises')
      .select('id, name, category, difficulty, description, equipment, muscle_groups, default_sets, default_reps, default_weight_kg, default_duration_sec, default_rest_sec, is_timed');

    // Build AI prompt
    const prompt = buildPrompt(player, questionnaire, coachFeedback, exercises);

    // Call Claude API for the plan
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const aiData = await aiResponse.json();
    const aiText = aiData.content?.[0]?.text || '';

    // Parse AI response — expects JSON with plan structure
    let planData;
    try {
      const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/\{[\s\S]*\}/);
      planData = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiText);
    } catch {
      // If AI didn't return valid JSON, use a structured fallback
      planData = buildFallbackPlan(player, questionnaire, coachFeedback, exercises);
    }

    // Deactivate any existing active plans
    await supabase
      .from('mf_exercise_plans')
      .update({ status: 'superseded' })
      .eq('player_id', player_id)
      .eq('status', 'active');

    // Create the plan
    const { data: plan, error: planError } = await supabase
      .from('mf_exercise_plans')
      .insert({
        player_id,
        questionnaire_id: questionnaire?.id || null,
        coach_feedback_id: coachFeedback?.id || null,
        name: planData.name || `${player.name}'s Training Plan`,
        description: planData.description || '',
        ai_writeup: planData.writeup || aiText,
        duration_weeks: planData.duration_weeks || 4,
        phase: planData.phase || 'base',
        difficulty: planData.difficulty || player.fitness_level || 'intermediate',
      })
      .select()
      .single();

    if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

    // Create days and exercises
    const exerciseMap = new Map((exercises || []).map(e => [e.name.toLowerCase(), e]));
    const exerciseIdMap = new Map((exercises || []).map(e => [e.id, e]));

    for (let i = 0; i < (planData.days || []).length; i++) {
      const dayData = planData.days[i];

      const { data: day, error: dayError } = await supabase
        .from('mf_plan_days')
        .insert({
          plan_id: plan.id,
          day_number: i + 1,
          day_of_week: dayData.day_of_week ?? (i % 7),
          name: dayData.name || `Day ${i + 1}`,
          focus: dayData.focus || '',
          status: i === 0 ? 'available' : 'upcoming', // First day is immediately available
        })
        .select()
        .single();

      if (dayError) continue;

      // Insert exercises for this day
      for (let j = 0; j < (dayData.exercises || []).length; j++) {
        const exData = dayData.exercises[j];

        // Match exercise by ID or name
        let matchedEx = exerciseIdMap.get(exData.exercise_id);
        if (!matchedEx && exData.name) {
          matchedEx = exerciseMap.get(exData.name.toLowerCase());
        }
        if (!matchedEx) continue; // Skip if we can't find the exercise

        await supabase
          .from('mf_plan_exercises')
          .insert({
            plan_day_id: day.id,
            exercise_id: matchedEx.id,
            sets: exData.sets || matchedEx.default_sets || 3,
            reps: exData.reps || matchedEx.default_reps || 10,
            weight_kg: exData.weight_kg || matchedEx.default_weight_kg || null,
            duration_sec: exData.duration_sec || matchedEx.default_duration_sec || null,
            rest_sec: exData.rest_sec || matchedEx.default_rest_sec || 60,
            rpe_target: exData.rpe_target || 7,
            notes: exData.notes || null,
            sort_order: j,
          });
      }
    }

    // Fetch the complete plan
    const { data: fullPlan } = await supabase
      .from('mf_exercise_plans')
      .select('*, mf_plan_days(*, mf_plan_exercises(*, mf_exercises(id, name, category, difficulty)))')
      .eq('id', plan.id)
      .single();

    return NextResponse.json(fullPlan, { status: 201 });
  } catch (err) {
    console.error('generate plan error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildPrompt(player, questionnaire, coachFeedback, exercises) {
  const q = questionnaire || {};
  const cf = coachFeedback || {};

  const exerciseList = (exercises || [])
    .map(e => `- ${e.name} (${e.category}, ${e.difficulty}, equipment: ${e.equipment || 'none'})`)
    .join('\n');

  return `You are a certified strength & conditioning coach creating a personalized exercise plan.

PLAYER PROFILE:
- Name: ${player.name}
- Age: ${player.date_of_birth ? Math.floor((Date.now() - new Date(player.date_of_birth)) / 31557600000) : 'unknown'}
- Position: ${player.position?.join(', ') || 'unknown'}
- Fitness Level: ${player.fitness_level || 'intermediate'}
- Height: ${player.height_cm || '?'}cm, Weight: ${player.weight_kg || '?'}kg

QUESTIONNAIRE RESPONSES:
- Pain Areas: ${JSON.stringify(q.pain_areas || [])}
- Injury History: ${JSON.stringify(q.injury_history || [])}
- Movement Screening: Full squat=${q.can_full_squat}, Overhead reach=${q.can_overhead_reach}, Single leg balance=${q.can_single_leg_balance}, Touch toes=${q.can_touch_toes}
- Clicking joints: ${q.has_clicking_joints ? q.clicking_joints_areas : 'none'}
- Training: ${q.years_training || 0} years, ${q.current_training_frequency || 3}x/week
- Exercises avoided: ${q.exercises_avoided || 'none'}
- Exercises painful: ${q.exercises_painful || 'none'}
- Sleep: ${q.sleep_hours_avg || 7.5}h, quality ${q.sleep_quality || 3}/5
- Stress: ${q.stress_level || 3}/5, Nutrition: ${q.nutrition_quality || 3}/5
- Goal: ${q.primary_fitness_goal || player.primary_goal || 'overall fitness'}
- Equipment: ${(q.equipment_available || []).join(', ') || 'full gym'}
- Preferred duration: ${q.preferred_workout_duration || 60} min
- Environment: ${q.workout_environment || 'gym'}
- Medical conditions: ${q.has_medical_conditions ? q.medical_conditions : 'none'}
- Medications: ${q.takes_medications ? q.medications : 'none'}

COACH FEEDBACK:
- Risk level: ${cf.risk_level || 'not assessed'}
- Movement notes: ${cf.movement_notes || 'none'}
- Injury concerns: ${cf.injury_concerns || 'none'}
- Modifications: ${cf.recommended_modifications || 'none'}
- Exercises to avoid: ${(cf.exercises_to_avoid || []).join(', ') || 'none'}
- Exercises to prioritize: ${(cf.exercises_to_prioritize || []).join(', ') || 'none'}
- Special instructions: ${cf.special_instructions || 'none'}
- Intensity override: ${cf.intensity_override || 'normal'}

AVAILABLE EXERCISES:
${exerciseList}

Create a 4-week progressive training plan. Return JSON in this exact format:
\`\`\`json
{
  "name": "Plan name",
  "description": "Brief description",
  "writeup": "Detailed 3-5 paragraph analysis of the player's condition, pain areas, movement limitations, and how this plan addresses them. Include specific precautions, warm-up protocols, and progression strategy.",
  "duration_weeks": 4,
  "phase": "base",
  "difficulty": "intermediate",
  "days": [
    {
      "name": "Day 1 - Upper Body Strength",
      "day_of_week": 1,
      "focus": "Upper body strength with shoulder rehabilitation",
      "exercises": [
        {
          "name": "Exercise name (must match available exercises exactly)",
          "sets": 3,
          "reps": 10,
          "weight_kg": null,
          "rest_sec": 60,
          "rpe_target": 7,
          "notes": "Focus on controlled movement"
        }
      ]
    }
  ]
}
\`\`\`

Requirements:
- 3-5 training days per week based on player's availability
- Each day: 6-10 exercises
- Progressive overload: later days in the week are slightly more intense
- AVOID any exercises that cause pain based on questionnaire
- PRIORITIZE exercises recommended by coach
- Include warm-up, main work, and cool-down in each session
- Respect medical conditions and injury history
- Match exercise names EXACTLY to the available exercises list`;
}

function buildFallbackPlan(player, questionnaire, coachFeedback, exercises) {
  const q = questionnaire || {};
  const painAreas = (q.pain_areas || []).map(p => p.area?.toLowerCase() || '');
  const avoidExercises = (coachFeedback?.exercises_to_avoid || []).map(e => e.toLowerCase());

  // Filter safe exercises
  const safeExercises = (exercises || []).filter(ex => {
    const name = ex.name.toLowerCase();
    // Basic pain-area filtering
    for (const pa of painAreas) {
      if (pa.includes('knee') && (name.includes('squat') || name.includes('lunge'))) return false;
      if (pa.includes('shoulder') && (name.includes('press') || name.includes('overhead'))) return false;
      if (pa.includes('back') && name.includes('deadlift')) return false;
    }
    if (avoidExercises.some(a => name.includes(a.toLowerCase()))) return false;
    return true;
  });

  const byCategory = {};
  for (const ex of safeExercises) {
    if (!byCategory[ex.category]) byCategory[ex.category] = [];
    byCategory[ex.category].push(ex);
  }

  function pick(cat, count) {
    const pool = byCategory[cat] || [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(ex => ({
      name: ex.name,
      exercise_id: ex.id,
      sets: ex.default_sets || 3,
      reps: ex.default_reps || 10,
      weight_kg: ex.default_weight_kg || null,
      duration_sec: ex.default_duration_sec || null,
      rest_sec: ex.default_rest_sec || 60,
      rpe_target: 7,
      notes: null,
    }));
  }

  const days = [
    { name: 'Day 1 - Strength & Power', day_of_week: 1, focus: 'Full body strength', exercises: [...pick('flexibility', 1), ...pick('strength', 4), ...pick('core', 2), ...pick('recovery', 1)] },
    { name: 'Day 2 - Speed & Agility', day_of_week: 3, focus: 'Speed and agility work', exercises: [...pick('flexibility', 1), ...pick('speed', 3), ...pick('agility', 3), ...pick('recovery', 1)] },
    { name: 'Day 3 - Ball Work & Recovery', day_of_week: 5, focus: 'Technical skills and mobility', exercises: [...pick('flexibility', 1), ...pick('ball_work', 4), ...pick('core', 1), ...pick('recovery', 2)] },
  ];

  // Duplicate for weeks 2-4 with progressive overload
  const allDays = [];
  for (let week = 0; week < 4; week++) {
    for (const day of days) {
      allDays.push({
        ...day,
        name: `W${week + 1} ${day.name}`,
        exercises: day.exercises.map(ex => ({
          ...ex,
          reps: ex.reps ? Math.min(20, ex.reps + week) : ex.reps,
          weight_kg: ex.weight_kg ? Math.round((ex.weight_kg * (1 + week * 0.025)) * 2) / 2 : null,
        })),
      });
    }
  }

  return {
    name: `${player.name}'s Training Plan`,
    description: `Personalized 4-week plan based on assessment. ${painAreas.length > 0 ? `Modified for ${painAreas.join(', ')} concerns.` : ''}`,
    writeup: `This plan has been generated based on ${player.name}'s physical assessment and questionnaire responses. ${painAreas.length > 0 ? `Special attention has been given to ${painAreas.join(', ')} areas of concern, with modified exercises to avoid aggravating existing conditions.` : ''} The plan follows a progressive overload model across 4 weeks with gradual increases in volume and intensity.`,
    duration_weeks: 4,
    phase: 'base',
    difficulty: player.fitness_level || 'intermediate',
    days: allDays,
  };
}

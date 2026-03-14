import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const supabase = getSupabaseAdmin();

/**
 * POST /api/ai/session-summary
 * Generates an AI summary of a completed workout day for the coach.
 * Body: { day_id }
 * Returns: { summary }
 */
export async function POST(request) {
  try {
    const { day_id } = await request.json();
    if (!day_id) return NextResponse.json({ error: 'day_id required' }, { status: 400 });

    // Fetch day with exercises and player info
    const { data: day } = await supabase
      .from('mf_plan_days')
      .select(`
        *,
        mf_exercise_plans (
          player_id,
          name,
          phase,
          difficulty,
          intensity_multiplier,
          mf_players (name, fitness_level)
        ),
        mf_plan_exercises (
          *,
          mf_exercises (name, category)
        )
      `)
      .eq('id', day_id)
      .single();

    if (!day) return NextResponse.json({ error: 'Day not found' }, { status: 404 });

    const plan = day.mf_exercise_plans;
    const player = plan?.mf_players;
    const exercises = day.mf_plan_exercises || [];

    // Build exercise summary
    const exerciseLines = exercises.map(pe => {
      const ex = pe.mf_exercises || {};
      const actualReps = Array.isArray(pe.actual_reps) ? pe.actual_reps : [];
      const actualWeights = Array.isArray(pe.actual_weight) ? pe.actual_weight.filter(w => w > 0) : [];
      const maxWeight = actualWeights.length > 0 ? Math.max(...actualWeights) : 0;
      const prescribedVol = (pe.sets || 3) * (pe.reps || 10) * (pe.weight_kg || 1);
      const actualVol = actualReps.reduce((s, r, j) => s + (r || 0) * (actualWeights[j] || pe.weight_kg || 1), 0);
      const volPct = prescribedVol > 0 ? Math.round((actualVol / prescribedVol) * 100) : 0;

      return `- ${ex.name || 'Exercise'} (${ex.category || 'general'}): ${pe.completed ? `Done` : 'Skipped'}. ` +
        (pe.completed ? `${pe.actual_sets} sets, reps [${actualReps.join(',')}], ${maxWeight > 0 ? maxWeight + 'kg' : 'bodyweight'}. Volume ${volPct}% of prescribed. RPE ${pe.actual_rpe || 'not recorded'}.` : '') +
        (pe.player_notes ? ` Player note: "${pe.player_notes}"` : '');
    }).join('\n');

    const prompt = `You are a sports performance AI assistant. Generate a brief 2-3 sentence coach summary for this workout session. Be specific about performance, flag any concerns (pain, skipped exercises, very high RPE), and note positives. Write in third person about the player.

Player: ${player?.name || 'Unknown'} (${player?.fitness_level || 'intermediate'})
Plan: ${plan?.name || 'Unknown'} (${plan?.phase || 'base'} phase, ${plan?.difficulty || 'intermediate'})
Workout: ${day.name} — ${day.focus || 'General'}
Overall Rating: ${day.performance_rating || 'met'}
Overall RPE: ${day.overall_rpe || 'not recorded'}

Exercises:
${exerciseLines}

Write ONLY the summary, no headers or formatting. Keep it concise and actionable for the coach.`;

    // Call Claude API
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    let summary = '';
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      summary = aiData.content?.[0]?.text || '';
    } else {
      // Fallback: generate a basic summary without AI
      const completedEx = exercises.filter(e => e.completed).length;
      const skippedEx = exercises.filter(e => !e.completed).length;
      const avgRPE = exercises.filter(e => e.actual_rpe).reduce((s, e) => s + e.actual_rpe, 0) / (exercises.filter(e => e.actual_rpe).length || 1);
      const notes = exercises.filter(e => e.player_notes).map(e => e.player_notes);

      summary = `${player?.name || 'Player'} completed ${completedEx}/${exercises.length} exercises in ${day.name}. `;
      if (day.performance_rating === 'exceeded') summary += 'Performance exceeded targets — consider progressive overload. ';
      else if (day.performance_rating === 'below') summary += 'Performance below targets — monitor for fatigue. ';
      if (skippedEx > 0) summary += `${skippedEx} exercise(s) skipped. `;
      if (avgRPE >= 8.5) summary += `High average RPE (${avgRPE.toFixed(1)}) — potential overtraining risk. `;
      if (notes.length > 0) summary += `Notes: ${notes.join('; ')}`;
    }

    // Save to database
    await supabase
      .from('mf_plan_days')
      .update({ ai_summary: summary })
      .eq('id', day_id);

    return NextResponse.json({ summary });
  } catch (err) {
    console.error('POST /api/ai/session-summary error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

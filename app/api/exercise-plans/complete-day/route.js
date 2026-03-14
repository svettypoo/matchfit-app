import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const supabase = getSupabaseAdmin();

/**
 * POST — Complete a plan day, evaluate performance, adjust future intensity
 * Body: { day_id, exercises: [{ exercise_id, actual_sets, actual_reps, actual_weight, actual_rpe, player_notes }] }
 */
export async function POST(request) {
  try {
    const { day_id, exercises, overall_rpe } = await request.json();
    if (!day_id) return NextResponse.json({ error: 'day_id required' }, { status: 400 });

    // Get the day and its plan
    const { data: day } = await supabase
      .from('mf_plan_days')
      .select('*, mf_exercise_plans(*), mf_plan_exercises(*)')
      .eq('id', day_id)
      .single();

    if (!day) return NextResponse.json({ error: 'Day not found' }, { status: 404 });

    // Update each exercise with actual values
    let totalPrescribed = 0;
    let totalActual = 0;
    let exerciseCount = 0;

    for (const ex of (exercises || [])) {
      const planEx = day.mf_plan_exercises?.find(pe => pe.exercise_id === ex.exercise_id || pe.id === ex.plan_exercise_id);
      if (!planEx) continue;

      const actualRepsArr = Array.isArray(ex.actual_reps) ? ex.actual_reps : [];
      const actualWeightArr = Array.isArray(ex.actual_weight) ? ex.actual_weight : [];
      const actualSets = ex.actual_sets || actualRepsArr.length;

      await supabase
        .from('mf_plan_exercises')
        .update({
          actual_sets: actualSets,
          actual_reps: actualRepsArr,
          actual_weight: actualWeightArr.length > 0 ? actualWeightArr : null,
          actual_rpe: ex.actual_rpe || overall_rpe || null,
          completed: true,
          completed_at: new Date().toISOString(),
          player_notes: ex.player_notes || null,
        })
        .eq('id', planEx.id);

      // Calculate performance ratio
      const prescribedVolume = (planEx.sets || 3) * (planEx.reps || 10);
      const actualVolume = actualRepsArr.reduce((sum, r) => sum + (r || 0), 0);
      totalPrescribed += prescribedVolume;
      totalActual += actualVolume;
      exerciseCount++;
    }

    // Determine performance rating
    let performanceRating = 'met';
    if (exerciseCount > 0 && totalPrescribed > 0) {
      const ratio = totalActual / totalPrescribed;
      if (ratio < 0.85) performanceRating = 'below';
      else if (ratio > 1.1) performanceRating = 'exceeded';
    }

    // Update day status
    await supabase
      .from('mf_plan_days')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        performance_rating: performanceRating,
      })
      .eq('id', day_id);

    // Update plan performance trend and intensity
    const plan = day.mf_exercise_plans;
    if (plan) {
      // Get all completed days for this plan
      const { data: completedDays } = await supabase
        .from('mf_plan_days')
        .select('performance_rating')
        .eq('plan_id', plan.id)
        .eq('status', 'completed');

      const ratings = (completedDays || []).map(d => d.performance_rating);
      const recentRatings = ratings.slice(-3); // Last 3 workouts

      let trend = 'meeting';
      let intensityMultiplier = parseFloat(plan.intensity_multiplier) || 1.0;

      const exceededCount = recentRatings.filter(r => r === 'exceeded').length;
      const belowCount = recentRatings.filter(r => r === 'below').length;

      if (exceededCount >= 2) {
        trend = 'exceeding';
        intensityMultiplier = Math.min(1.5, intensityMultiplier + 0.05); // 5% increase
      } else if (belowCount >= 2) {
        trend = 'below';
        intensityMultiplier = Math.max(0.7, intensityMultiplier - 0.05); // 5% decrease
      }

      await supabase
        .from('mf_exercise_plans')
        .update({
          performance_trend: trend,
          intensity_multiplier: intensityMultiplier,
          last_adjustment_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      // Generate next day if there are upcoming days
      const { data: nextDay } = await supabase
        .from('mf_plan_days')
        .select('id, status')
        .eq('plan_id', plan.id)
        .eq('status', 'upcoming')
        .order('day_number', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextDay) {
        // Make the next day available and adjust its exercises based on intensity
        await supabase
          .from('mf_plan_days')
          .update({ status: 'available' })
          .eq('id', nextDay.id);

        // Adjust future exercises based on intensity multiplier
        if (intensityMultiplier !== 1.0) {
          const { data: futureExercises } = await supabase
            .from('mf_plan_exercises')
            .select('*')
            .eq('plan_day_id', nextDay.id);

          for (const fex of (futureExercises || [])) {
            // Find the same exercise from the just-completed day
            const prevEx = day.mf_plan_exercises?.find(pe => pe.exercise_id === fex.exercise_id);

            let newReps = fex.reps;
            let newWeight = fex.weight_kg;
            let newSets = fex.sets;

            if (trend === 'exceeding') {
              // Progressive overload: increase reps by 1-2 or weight by 2.5%
              if (newWeight) {
                newWeight = Math.round((newWeight * 1.025) * 2) / 2; // Round to 0.5kg
              } else {
                newReps = Math.min(20, (newReps || 10) + 1);
              }
            } else if (trend === 'below') {
              // Reduce load slightly
              if (newWeight) {
                newWeight = Math.round((newWeight * 0.975) * 2) / 2;
              } else {
                newReps = Math.max(5, (newReps || 10) - 1);
              }
            }

            await supabase
              .from('mf_plan_exercises')
              .update({
                reps: newReps,
                weight_kg: newWeight,
                sets: newSets,
                previous_exercise_id: prevEx?.id || null,
                intensity_change: trend === 'exceeding' ? 2.5 : trend === 'below' ? -2.5 : 0,
              })
              .eq('id', fex.id);
          }
        }
      }
    }

    return NextResponse.json({
      performance_rating: performanceRating,
      intensity_change: performanceRating === 'exceeded' ? 'increased' : performanceRating === 'below' ? 'decreased' : 'maintained',
    });
  } catch (err) {
    console.error('complete-day error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

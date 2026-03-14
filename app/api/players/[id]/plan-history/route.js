import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const supabase = getSupabaseAdmin();

/**
 * GET — Fetch completed plan days for a player with full exercise details
 * Query params: limit, offset
 * Used by: player history page, coach player detail, progress graphs
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get all plan days for this player's plans (completed + available)
    const { data: plans } = await supabase
      .from('mf_exercise_plans')
      .select('id, name, phase, difficulty, performance_trend, intensity_multiplier')
      .eq('player_id', id)
      .in('status', ['active', 'completed', 'superseded'])
      .order('created_at', { ascending: false });

    if (!plans || plans.length === 0) {
      return NextResponse.json({ days: [], plans: [], summary: {} });
    }

    const planIds = plans.map(p => p.id);

    // Fetch completed plan days with exercises
    const { data: days, error } = await supabase
      .from('mf_plan_days')
      .select(`
        id, plan_id, day_number, name, focus, status, completed_at, performance_rating,
        mf_plan_exercises (
          id, exercise_id, sets, reps, weight_kg, duration_sec, rest_sec, rpe_target, notes, sort_order,
          actual_sets, actual_reps, actual_weight, actual_rpe, completed, completed_at, player_notes,
          intensity_change,
          mf_exercises (id, name, category, difficulty, equipment, muscle_groups)
        )
      `)
      .in('plan_id', planIds)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sort exercises within each day
    const sortedDays = (days || []).map(day => ({
      ...day,
      plan_name: plans.find(p => p.id === day.plan_id)?.name || 'Unknown Plan',
      plan_phase: plans.find(p => p.id === day.plan_id)?.phase || 'base',
      mf_plan_exercises: (day.mf_plan_exercises || []).sort((a, b) => a.sort_order - b.sort_order),
    }));

    // Calculate summary stats
    const completedDays = sortedDays;
    const totalVolume = completedDays.reduce((sum, day) => {
      return sum + (day.mf_plan_exercises || []).reduce((dSum, ex) => {
        const reps = Array.isArray(ex.actual_reps) ? ex.actual_reps.reduce((s, r) => s + (r || 0), 0) : 0;
        const weight = Array.isArray(ex.actual_weight) ? Math.max(...ex.actual_weight.map(w => w || 0)) : (ex.weight_kg || 0);
        return dSum + (reps * weight);
      }, 0);
    }, 0);

    const ratings = completedDays.map(d => d.performance_rating).filter(Boolean);
    const exceededCount = ratings.filter(r => r === 'exceeded').length;
    const metCount = ratings.filter(r => r === 'met').length;
    const belowCount = ratings.filter(r => r === 'below').length;

    // Weekly aggregation for graphs
    const weeklyData = {};
    for (const day of completedDays) {
      if (!day.completed_at) continue;
      const date = new Date(day.completed_at);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, workouts: 0, volume: 0, exceeded: 0, met: 0, below: 0, exercises_completed: 0 };
      }
      weeklyData[weekKey].workouts++;
      if (day.performance_rating === 'exceeded') weeklyData[weekKey].exceeded++;
      if (day.performance_rating === 'met') weeklyData[weekKey].met++;
      if (day.performance_rating === 'below') weeklyData[weekKey].below++;

      for (const ex of (day.mf_plan_exercises || [])) {
        if (ex.completed) weeklyData[weekKey].exercises_completed++;
        const reps = Array.isArray(ex.actual_reps) ? ex.actual_reps.reduce((s, r) => s + (r || 0), 0) : 0;
        const weight = Array.isArray(ex.actual_weight) ? Math.max(...ex.actual_weight.map(w => w || 0)) : (ex.weight_kg || 0);
        weeklyData[weekKey].volume += reps * weight;
      }
    }

    const weekly = Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json({
      days: sortedDays,
      plans,
      summary: {
        total_workouts: completedDays.length,
        total_volume: Math.round(totalVolume),
        exceeded: exceededCount,
        met: metCount,
        below: belowCount,
        avg_rating: ratings.length > 0
          ? (exceededCount > metCount && exceededCount > belowCount ? 'exceeding'
            : belowCount > metCount ? 'below' : 'meeting')
          : 'none',
      },
      weekly,
    });
  } catch (err) {
    console.error('plan-history error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

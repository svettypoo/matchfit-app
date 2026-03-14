import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const supabase = getSupabaseAdmin();

// GET — fetch active plan for a player with all days and exercises
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const player_id = searchParams.get('player_id');
  const plan_id = searchParams.get('plan_id');

  if (!player_id && !plan_id) {
    return NextResponse.json({ error: 'player_id or plan_id required' }, { status: 400 });
  }

  let query = supabase
    .from('mf_exercise_plans')
    .select(`
      *,
      mf_plan_days (
        *,
        mf_plan_exercises (
          *,
          mf_exercises (id, name, category, difficulty, description, instructions, video_url, equipment, primary_muscles:muscle_groups)
        )
      )
    `);

  if (plan_id) {
    query = query.eq('id', plan_id);
  } else {
    query = query.eq('player_id', player_id).eq('status', 'active');
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort days and exercises
  if (data?.mf_plan_days) {
    data.mf_plan_days.sort((a, b) => a.day_number - b.day_number);
    data.mf_plan_days.forEach(day => {
      if (day.mf_plan_exercises) {
        day.mf_plan_exercises.sort((a, b) => a.sort_order - b.sort_order);
      }
    });
  }

  return NextResponse.json(data || null);
}

// PATCH — update plan (performance trend, intensity, etc.)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { plan_id, ...updates } = body;
    if (!plan_id) return NextResponse.json({ error: 'plan_id required' }, { status: 400 });

    const { data, error } = await supabase
      .from('mf_exercise_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', plan_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

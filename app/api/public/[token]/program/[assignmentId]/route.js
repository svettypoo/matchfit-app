import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  const { token, assignmentId } = await params;
  const supabaseAdmin = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const dayOnly = searchParams.get('day_only') === 'true';

  // Validate token
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('mf_public_tokens')
    .select('player_id')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  const playerId = tokenData.player_id;

  // If day_only mode, fetch just the day's exercises for workout execution
  if (dayOnly) {
    const { data: day } = await supabaseAdmin
      .from('mf_program_days')
      .select('id, day_number, title, program_id')
      .eq('id', assignmentId)
      .single();

    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    const { data: programExercises } = await supabaseAdmin
      .from('mf_program_exercises')
      .select('id, exercise_id, sets, reps, duration, sort_order')
      .eq('program_day_id', day.id)
      .order('sort_order', { ascending: true });

    // Enrich with exercise details
    const exerciseIds = (programExercises || []).map(pe => pe.exercise_id);
    const { data: exercises } = await supabaseAdmin
      .from('mf_exercises')
      .select('id, name, description, instructions, image_url, category, equipment')
      .in('id', exerciseIds.length ? exerciseIds : ['__none__']);

    const exerciseMap = Object.fromEntries((exercises || []).map(e => [e.id, e]));

    const enrichedExercises = (programExercises || []).map(pe => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      sets: pe.sets,
      reps: pe.reps,
      duration: pe.duration,
      name: exerciseMap[pe.exercise_id]?.name || 'Exercise',
      description: exerciseMap[pe.exercise_id]?.description || '',
      instructions: exerciseMap[pe.exercise_id]?.instructions || '',
      image_url: exerciseMap[pe.exercise_id]?.image_url || null,
      category: exerciseMap[pe.exercise_id]?.category || '',
      equipment: exerciseMap[pe.exercise_id]?.equipment || '',
    }));

    return NextResponse.json({
      day_id: day.id,
      day_number: day.day_number,
      title: day.title,
      exercises: enrichedExercises,
    });
  }

  // Full program view: fetch assignment
  const { data: assignment } = await supabaseAdmin
    .from('mf_player_programs')
    .select('id, program_id, status, created_at, completed_at')
    .eq('id', assignmentId)
    .eq('player_id', playerId)
    .single();

  if (!assignment) {
    return NextResponse.json({ error: 'Program assignment not found' }, { status: 404 });
  }

  // Fetch program info
  const { data: program } = await supabaseAdmin
    .from('mf_programs')
    .select('id, name, description, duration_weeks')
    .eq('id', assignment.program_id)
    .single();

  // Fetch program days
  const { data: days } = await supabaseAdmin
    .from('mf_program_days')
    .select('id, day_number, title')
    .eq('program_id', assignment.program_id)
    .order('day_number', { ascending: true });

  // Fetch all exercises for all days
  const dayIds = (days || []).map(d => d.id);
  const { data: allProgramExercises } = await supabaseAdmin
    .from('mf_program_exercises')
    .select('id, program_day_id, exercise_id, sets, reps, duration, sort_order')
    .in('program_day_id', dayIds.length ? dayIds : ['__none__'])
    .order('sort_order', { ascending: true });

  // Fetch exercise details
  const exerciseIds = [...new Set((allProgramExercises || []).map(pe => pe.exercise_id))];
  const { data: exercises } = await supabaseAdmin
    .from('mf_exercises')
    .select('id, name, description, image_url, category')
    .in('id', exerciseIds.length ? exerciseIds : ['__none__']);

  const exerciseMap = Object.fromEntries((exercises || []).map(e => [e.id, e]));

  // Fetch completed workouts for this player and program
  const { data: completedWorkouts } = await supabaseAdmin
    .from('mf_workouts')
    .select('id, program_day_id, status')
    .eq('player_id', playerId)
    .eq('program_id', assignment.program_id)
    .eq('status', 'completed');

  const completedDayIds = new Set((completedWorkouts || []).map(w => w.program_day_id));

  // Build enriched days
  const enrichedDays = (days || []).map(day => {
    const dayExercises = (allProgramExercises || [])
      .filter(pe => pe.program_day_id === day.id)
      .map(pe => ({
        id: pe.id,
        exercise_id: pe.exercise_id,
        sets: pe.sets,
        reps: pe.reps,
        duration: pe.duration,
        name: exerciseMap[pe.exercise_id]?.name || 'Exercise',
        description: exerciseMap[pe.exercise_id]?.description || '',
        image_url: exerciseMap[pe.exercise_id]?.image_url || null,
        category: exerciseMap[pe.exercise_id]?.category || '',
      }));

    return {
      id: day.id,
      day_number: day.day_number,
      title: day.title,
      exercises: dayExercises,
      completed: completedDayIds.has(day.id),
    };
  });

  return NextResponse.json({
    info: {
      name: program?.name || 'Program',
      description: program?.description || '',
      duration_weeks: program?.duration_weeks,
    },
    days: enrichedDays,
    progress: {
      completed_days: completedDayIds.size,
      total_days: enrichedDays.length,
      status: assignment.status,
    },
  });
}

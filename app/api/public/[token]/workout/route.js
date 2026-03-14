import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request, { params }) {
  const { token } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  // Validate token
  const { data: tokenData } = await supabaseAdmin
    .from('mf_public_tokens')
    .select('player_id')
    .eq('token', token)
    .single();

  if (!tokenData) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  const playerId = tokenData.player_id;
  const body = await request.json();
  const { action, program_day_id, exercise_id, sets, reps, weight, duration, workout_id } = body;

  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  // ---- START ----
  if (action === 'start') {
    if (!program_day_id) {
      return NextResponse.json({ error: 'program_day_id is required' }, { status: 400 });
    }

    // Get the program_id from the day
    const { data: day } = await supabaseAdmin
      .from('mf_program_days')
      .select('id, program_id')
      .eq('id', program_day_id)
      .single();

    if (!day) {
      return NextResponse.json({ error: 'Program day not found' }, { status: 404 });
    }

    // Check for existing in-progress workout
    const { data: existing } = await supabaseAdmin
      .from('mf_workouts')
      .select('id')
      .eq('player_id', playerId)
      .eq('program_day_id', program_day_id)
      .eq('status', 'in_progress')
      .single();

    if (existing) {
      return NextResponse.json({ workout_id: existing.id, message: 'Resumed existing workout' });
    }

    // Create new workout entry
    const { data: workout, error } = await supabaseAdmin
      .from('mf_workouts')
      .insert({
        player_id: playerId,
        program_id: day.program_id,
        program_day_id: program_day_id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to start workout', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ workout_id: workout.id, message: 'Workout started' });
  }

  // ---- LOG ----
  if (action === 'log') {
    if (!exercise_id) {
      return NextResponse.json({ error: 'exercise_id is required' }, { status: 400 });
    }

    const { data: log, error } = await supabaseAdmin
      .from('mf_exercise_logs')
      .insert({
        player_id: playerId,
        exercise_id,
        workout_id: workout_id || null,
        sets: sets || null,
        reps: reps || null,
        weight: weight || null,
        duration: duration || null,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to log exercise', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ log_id: log.id, message: 'Exercise logged' });
  }

  // ---- COMPLETE ----
  if (action === 'complete') {
    const targetWorkoutId = workout_id;

    if (!targetWorkoutId && !program_day_id) {
      return NextResponse.json({ error: 'workout_id or program_day_id is required' }, { status: 400 });
    }

    // Find the workout to complete
    let workoutQuery = supabaseAdmin
      .from('mf_workouts')
      .select('id, program_id, program_day_id')
      .eq('player_id', playerId)
      .eq('status', 'in_progress');

    if (targetWorkoutId) {
      workoutQuery = workoutQuery.eq('id', targetWorkoutId);
    } else {
      workoutQuery = workoutQuery.eq('program_day_id', program_day_id);
    }

    const { data: workoutToComplete } = await workoutQuery.single();

    if (!workoutToComplete) {
      // If no in-progress workout, still create a completed one
      const { data: day } = await supabaseAdmin
        .from('mf_program_days')
        .select('program_id')
        .eq('id', program_day_id)
        .single();

      if (day) {
        await supabaseAdmin.from('mf_workouts').insert({
          player_id: playerId,
          program_id: day.program_id,
          program_day_id: program_day_id,
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      }
    } else {
      // Update workout to completed
      await supabaseAdmin
        .from('mf_workouts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', workoutToComplete.id);
    }

    // Increment player stats
    const { data: player } = await supabaseAdmin
      .from('mf_players')
      .select('xp, streak, level')
      .eq('id', playerId)
      .single();

    if (player) {
      const xpGain = 50; // base XP per workout
      const newXp = (player.xp || 0) + xpGain;
      const newStreak = (player.streak || 0) + 1;
      // Level up every 500 XP
      const newLevel = Math.floor(newXp / 500) + 1;

      await supabaseAdmin
        .from('mf_players')
        .update({
          xp: newXp,
          streak: newStreak,
          level: newLevel,
          last_workout_at: new Date().toISOString(),
        })
        .eq('id', playerId);

      // Check for reward triggers
      await checkRewardTriggers(supabaseAdmin, playerId, newStreak, newXp, newLevel);
    }

    // Notify coach (Phase 9)
    const programId = workoutToComplete?.program_id || null;
    if (programId) {
      const { data: prog } = await supabaseAdmin
        .from('mf_programs')
        .select('coach_id, name')
        .eq('id', programId)
        .single();
      const { data: pl } = await supabaseAdmin
        .from('mf_players')
        .select('name')
        .eq('id', playerId)
        .single();
      if (prog?.coach_id) {
        await supabaseAdmin.from('mf_notifications').insert({
          coach_id: prog.coach_id,
          type: 'workout_completed',
          title: `${pl?.name || 'Player'} completed a workout`,
          message: `${pl?.name || 'A player'} completed a workout in "${prog.name || 'a program'}"`,
          read: false,
        }).then(() => {}).catch(() => {});
      }
    }

    return NextResponse.json({ message: 'Workout completed', xp_gained: 50 });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}

async function checkRewardTriggers(supabaseAdmin, playerId, streak, xp, level) {
  // Fetch all badges
  const { data: badges } = await supabaseAdmin
    .from('mf_badges')
    .select('id, name, trigger_type, trigger_value');

  if (!badges?.length) return;

  // Fetch already earned badges
  const { data: earned } = await supabaseAdmin
    .from('mf_player_badges')
    .select('badge_id')
    .eq('player_id', playerId);

  const earnedIds = new Set((earned || []).map(e => e.badge_id));

  const newBadges = [];

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    let earned = false;
    if (badge.trigger_type === 'streak' && streak >= (badge.trigger_value || 0)) earned = true;
    if (badge.trigger_type === 'xp' && xp >= (badge.trigger_value || 0)) earned = true;
    if (badge.trigger_type === 'level' && level >= (badge.trigger_value || 0)) earned = true;
    if (badge.trigger_type === 'workouts') {
      const { count } = await supabaseAdmin
        .from('mf_workouts')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', playerId)
        .eq('status', 'completed');
      if ((count || 0) >= (badge.trigger_value || 0)) earned = true;
    }

    if (earned) {
      newBadges.push({ player_id: playerId, badge_id: badge.id, earned_at: new Date().toISOString() });
    }
  }

  if (newBadges.length) {
    await supabaseAdmin.from('mf_player_badges').insert(newBadges);
  }
}

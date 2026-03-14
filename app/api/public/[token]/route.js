import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  const { token } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  // Validate token
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('mf_public_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  // Check expiration
  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
  }

  const playerId = tokenData.player_id;

  // Fetch player info
  const { data: player } = await supabaseAdmin
    .from('mf_players')
    .select('id, name, email, phone, level, xp, streak, has_account, team_id')
    .eq('id', playerId)
    .single();

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  // Get team name if applicable
  let teamName = null;
  if (player.team_id) {
    const { data: team } = await supabaseAdmin
      .from('mf_teams')
      .select('name')
      .eq('id', player.team_id)
      .single();
    teamName = team?.name;
  }

  // Fetch completed programs
  const { data: completedPrograms } = await supabaseAdmin
    .from('mf_player_programs')
    .select('id, program_id, status, completed_at, created_at')
    .eq('player_id', playerId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  // Enrich completed programs with program names
  const completedWithNames = await enrichProgramNames(supabaseAdmin, completedPrograms || []);

  // Fetch active programs
  const { data: activePrograms } = await supabaseAdmin
    .from('mf_player_programs')
    .select('id, program_id, status, created_at')
    .eq('player_id', playerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const activeWithNames = await enrichProgramNames(supabaseAdmin, activePrograms || []);

  // Get completed day counts for active programs
  for (const prog of activeWithNames) {
    const { count } = await supabaseAdmin
      .from('mf_workouts')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('program_id', prog.program_id)
      .eq('status', 'completed');
    prog.completed_days = count || 0;

    // Get total days
    const { count: totalDays } = await supabaseAdmin
      .from('mf_program_days')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', prog.program_id);
    prog.total_days = totalDays || 0;
  }

  // Fetch recent exercise logs
  const { data: recentLogs } = await supabaseAdmin
    .from('mf_exercise_logs')
    .select('id, exercise_id, sets, reps, weight, duration, created_at')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Enrich logs with exercise names
  const enrichedLogs = [];
  if (recentLogs?.length) {
    const exerciseIds = [...new Set(recentLogs.map(l => l.exercise_id))];
    const { data: exercises } = await supabaseAdmin
      .from('mf_exercises')
      .select('id, name')
      .in('id', exerciseIds);
    const exerciseMap = Object.fromEntries((exercises || []).map(e => [e.id, e.name]));
    for (const log of recentLogs) {
      enrichedLogs.push({ ...log, exercise_name: exerciseMap[log.exercise_id] || 'Unknown' });
    }
  }

  // Fetch rewards
  const { data: playerBadges } = await supabaseAdmin
    .from('mf_player_badges')
    .select('id, badge_id, earned_at')
    .eq('player_id', playerId)
    .order('earned_at', { ascending: false });

  let rewards = [];
  if (playerBadges?.length) {
    const badgeIds = playerBadges.map(b => b.badge_id);
    const { data: badges } = await supabaseAdmin
      .from('mf_badges')
      .select('id, name, icon, description')
      .in('id', badgeIds);
    const badgeMap = Object.fromEntries((badges || []).map(b => [b.id, b]));
    rewards = playerBadges.map(pb => ({
      id: pb.id,
      name: badgeMap[pb.badge_id]?.name || 'Badge',
      icon: badgeMap[pb.badge_id]?.icon || null,
      description: badgeMap[pb.badge_id]?.description || '',
      earned_at: pb.earned_at,
    }));
  }

  // Update last_accessed_at on the token
  await supabaseAdmin
    .from('mf_public_tokens')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', tokenData.id);

  return NextResponse.json({
    profile: {
      name: player.name,
      email: player.email,
      phone: player.phone,
      level: player.level,
      xp: player.xp,
      streak: player.streak,
      has_account: player.has_account,
      team_name: teamName,
    },
    completed_programs: completedWithNames,
    active_programs: activeWithNames,
    recent_logs: enrichedLogs,
    rewards,
  });
}

async function enrichProgramNames(supabaseAdmin, programs) {
  if (!programs.length) return [];
  const programIds = [...new Set(programs.map(p => p.program_id))];
  const { data: programInfos } = await supabaseAdmin
    .from('mf_programs')
    .select('id, name, duration_weeks')
    .in('id', programIds);
  const programMap = Object.fromEntries((programInfos || []).map(p => [p.id, p]));
  return programs.map(p => ({
    ...p,
    program_name: programMap[p.program_id]?.name || 'Program',
    duration_weeks: programMap[p.program_id]?.duration_weeks,
  }));
}

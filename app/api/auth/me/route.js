import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const { requireAuth } = require('@/lib/sso-auth');

export async function GET(req) {
  const ssoUser = requireAuth(req);
  if (!ssoUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const email = ssoUser.email;

  // Check if user is a coach
  const { data: coach } = await supabase
    .from('mf_coaches')
    .select('*')
    .eq('email', email)
    .single();

  if (coach) {
    return NextResponse.json({
      user: { id: coach.id, email, name: coach.name || ssoUser.name },
      role: 'coach',
      profile: coach,
    });
  }

  // Check if user is a player
  const { data: player } = await supabase
    .from('mf_players')
    .select('*')
    .eq('email', email)
    .single();

  if (player) {
    return NextResponse.json({
      user: { id: player.id, email, name: player.name || ssoUser.name },
      role: 'player',
      profile: player,
    });
  }

  // User has SSO but no MatchFit profile — return minimal info
  return NextResponse.json({
    user: { id: ssoUser.sub, email, name: ssoUser.name },
    role: null,
    profile: null,
  });
}

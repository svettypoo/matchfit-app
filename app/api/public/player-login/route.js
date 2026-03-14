import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // Find account by email
  const { data: account } = await supabaseAdmin
    .from('mf_player_accounts')
    .select('id, player_id, email, password_hash, name')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (!account) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Verify password
  const valid = await bcrypt.compare(password, account.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Update last login
  await supabaseAdmin
    .from('mf_player_accounts')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', account.id);

  // Get player's public token
  const { data: tokenRecord } = await supabaseAdmin
    .from('mf_players')
    .select('public_profile_token')
    .eq('id', account.player_id)
    .single();

  if (!tokenRecord?.public_profile_token) {
    return NextResponse.json({ error: 'No profile token found' }, { status: 404 });
  }

  return NextResponse.json({
    message: 'Login successful',
    token: tokenRecord.public_profile_token,
    name: account.name,
  });
}

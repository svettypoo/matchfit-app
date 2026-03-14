import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

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
  const { email, password, name, phone } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  // Check if player already has an account
  const { data: player } = await supabaseAdmin
    .from('mf_players')
    .select('id, has_account')
    .eq('id', playerId)
    .single();

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  if (player.has_account) {
    return NextResponse.json({ error: 'Account already exists for this player' }, { status: 409 });
  }

  // Check if email is already taken
  const { data: existingAccount } = await supabaseAdmin
    .from('mf_player_accounts')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (existingAccount) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create player account
  const { error: insertError } = await supabaseAdmin
    .from('mf_player_accounts')
    .insert({
      player_id: playerId,
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name || null,
      phone: phone || null,
    });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create account', details: insertError.message }, { status: 500 });
  }

  // Update player record
  const updates = { has_account: true };
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (email) updates.email = email.toLowerCase().trim();

  await supabaseAdmin
    .from('mf_players')
    .update(updates)
    .eq('id', playerId);

  return NextResponse.json({ message: 'Account created successfully' });
}

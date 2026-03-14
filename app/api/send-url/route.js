import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { buildProfileEmailTemplate } from '@/lib/email-templates';

export async function POST(request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();
  const { player_id, type } = body;

  if (!player_id) {
    return NextResponse.json({ error: 'player_id is required' }, { status: 400 });
  }

  if (!type || !['sms', 'email', 'both'].includes(type)) {
    return NextResponse.json({ error: 'type must be sms, email, or both' }, { status: 400 });
  }

  // Fetch player
  const { data: player, error: playerError } = await supabaseAdmin
    .from('mf_players')
    .select('id, name, phone, email')
    .eq('id', player_id)
    .single();

  if (playerError || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  // Get or create public token
  let { data: tokenRecord } = await supabaseAdmin
    .from('mf_public_tokens')
    .select('token')
    .eq('player_id', player_id)
    .single();

  if (!tokenRecord) {
    const newToken = generateToken();
    const { data: created, error: tokenErr } = await supabaseAdmin
      .from('mf_public_tokens')
      .insert({ player_id, token: newToken })
      .select('token')
      .single();

    if (tokenErr) {
      return NextResponse.json({ error: 'Failed to create token', details: tokenErr.message }, { status: 500 });
    }
    tokenRecord = created;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchfit.stproperties.com';
  const profileUrl = `${appUrl}/p/${tokenRecord.token}`;
  const results = { sms: null, email: null };

  // Send SMS
  if ((type === 'sms' || type === 'both') && player.phone) {
    try {
      const smsResponse = await fetch('https://api.telnyx.com/v2/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        },
        body: JSON.stringify({
          from: '+15878643090',
          to: player.phone,
          text: `Hey ${player.name || 'there'}! Here's your MatchFit profile: ${profileUrl} - Track your workouts, view programs, and earn rewards. No account needed!`,
        }),
      });

      const smsData = await smsResponse.json();
      results.sms = smsResponse.ok ? 'sent' : 'failed';

      // Log to mf_sms_log
      await supabaseAdmin.from('mf_sms_log').insert({
        player_id,
        phone: player.phone,
        message: `Profile URL sent: ${profileUrl}`,
        status: smsResponse.ok ? 'sent' : 'failed',
        telnyx_message_id: smsData?.data?.id || null,
      });
    } catch (err) {
      results.sms = 'error';
      await supabaseAdmin.from('mf_sms_log').insert({
        player_id,
        phone: player.phone,
        message: `Profile URL send error: ${err.message}`,
        status: 'error',
      });
    }
  }

  // Send Email
  if ((type === 'email' || type === 'both') && player.email) {
    try {
      const htmlBody = buildProfileEmailTemplate(player.name || 'Player', profileUrl);

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'MatchFit <noreply@inboxai-mail.dedyn.io>',
          to: player.email,
          subject: `${player.name || 'Player'}, your MatchFit profile is ready!`,
          html: htmlBody,
        }),
      });

      results.email = emailResponse.ok ? 'sent' : 'failed';
    } catch (err) {
      results.email = 'error';
    }
  }

  return NextResponse.json({
    message: 'URL sent',
    url: profileUrl,
    results,
  });
}

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

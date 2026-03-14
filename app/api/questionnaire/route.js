import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const supabase = getSupabaseAdmin();

// GET — fetch questionnaire for a player
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const player_id = searchParams.get('player_id');
  if (!player_id) return NextResponse.json({ error: 'player_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('mf_questionnaire_responses')
    .select('*')
    .eq('player_id', player_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || null);
}

// POST — submit questionnaire
export async function POST(request) {
  try {
    const body = await request.json();
    const { player_id, ...answers } = body;
    if (!player_id) return NextResponse.json({ error: 'player_id required' }, { status: 400 });

    // Upsert: delete old responses, insert new
    await supabase.from('mf_questionnaire_responses').delete().eq('player_id', player_id);

    const { data, error } = await supabase
      .from('mf_questionnaire_responses')
      .insert({ player_id, ...answers, completed_at: new Date().toISOString() })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

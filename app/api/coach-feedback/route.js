import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const supabase = getSupabaseAdmin();

// GET — fetch coach feedback for a questionnaire
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const questionnaire_id = searchParams.get('questionnaire_id');
  const player_id = searchParams.get('player_id');

  let query = supabase.from('mf_coach_feedback').select('*');
  if (questionnaire_id) query = query.eq('questionnaire_id', questionnaire_id);
  if (player_id) {
    // Get feedback via questionnaire -> player
    const { data: q } = await supabase
      .from('mf_questionnaire_responses')
      .select('id')
      .eq('player_id', player_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (q) query = query.eq('questionnaire_id', q.id);
    else return NextResponse.json(null);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || null);
}

// POST — submit or update coach feedback
export async function POST(request) {
  try {
    const body = await request.json();
    const { questionnaire_id, coach_id, ...feedback } = body;
    if (!questionnaire_id || !coach_id) {
      return NextResponse.json({ error: 'questionnaire_id and coach_id required' }, { status: 400 });
    }

    // Check for existing feedback
    const { data: existing } = await supabase
      .from('mf_coach_feedback')
      .select('id')
      .eq('questionnaire_id', questionnaire_id)
      .eq('coach_id', coach_id)
      .maybeSingle();

    let data, error;
    if (existing) {
      ({ data, error } = await supabase
        .from('mf_coach_feedback')
        .update({ ...feedback, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('mf_coach_feedback')
        .insert({ questionnaire_id, coach_id, ...feedback })
        .select()
        .single());
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

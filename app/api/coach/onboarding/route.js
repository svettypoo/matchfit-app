import { getSupabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/coach/onboarding?coach_id=X
// Checks if coach has any teams — if not, they need onboarding
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coach_id');

    if (!coachId) {
      return NextResponse.json({ error: 'coach_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if coach has any teams
    const { data: teams, error: teamsError } = await supabase
      .from('mf_teams')
      .select('id')
      .eq('coach_id', coachId)
      .limit(1);

    if (teamsError) {
      console.error('Error checking teams:', teamsError);
      return NextResponse.json({ error: 'Failed to check onboarding status' }, { status: 500 });
    }

    const hasTeams = teams && teams.length > 0;

    // Also check if onboarding was explicitly completed (in case coach skipped team creation)
    const { data: coach, error: coachError } = await supabase
      .from('mf_coaches')
      .select('onboarding_completed')
      .eq('id', coachId)
      .single();

    const onboardingCompleted = coach?.onboarding_completed === true;

    return NextResponse.json({
      needs_onboarding: !hasTeams && !onboardingCompleted,
      has_teams: hasTeams,
      onboarding_completed: onboardingCompleted,
    });
  } catch (err) {
    console.error('Onboarding GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/coach/onboarding
// Marks onboarding as complete for the coach
export async function POST(request) {
  try {
    const body = await request.json();
    const { coach_id } = body;

    if (!coach_id) {
      return NextResponse.json({ error: 'coach_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Update coach record to mark onboarding as completed
    const { error: updateError } = await supabase
      .from('mf_coaches')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', coach_id);

    if (updateError) {
      // If the column doesn't exist yet, try a simpler update or just log
      console.error('Error updating onboarding status:', updateError);

      // Fallback: try without the timestamp column
      const { error: fallbackError } = await supabase
        .from('mf_coaches')
        .update({ onboarding_completed: true })
        .eq('id', coach_id);

      if (fallbackError) {
        console.error('Fallback update also failed:', fallbackError);
        // Still return success — onboarding flow shouldn't be blocked by DB issues
        return NextResponse.json({
          success: true,
          warning: 'Could not persist onboarding status, but flow completed',
        });
      }
    }

    return NextResponse.json({ success: true, onboarding_completed: true });
  } catch (err) {
    console.error('Onboarding POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

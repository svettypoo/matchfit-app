import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach_id = searchParams.get("coach_id");

    if (!coach_id) {
      return NextResponse.json(
        { error: "coach_id query parameter is required" },
        { status: 400 }
      );
    }

    // Get coach's teams
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from("mf_teams")
      .select("id, name")
      .eq("coach_id", coach_id);

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 });
    }

    const teamIds = teams?.map((t) => t.id) || [];

    if (teamIds.length === 0) {
      return NextResponse.json({ players: [] });
    }

    // Get all players from those teams
    const { data: players, error: playersError } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, email, position, jersey_number, status, xp, level, current_streak, longest_streak, fitness_level, team_id, date_of_birth, onboarding_complete")
      .in("team_id", teamIds)
      .order("name", { ascending: true });

    if (playersError) {
      return NextResponse.json({ error: playersError.message }, { status: 500 });
    }

    // Attach team name
    const teamMap = {};
    for (const t of teams) {
      teamMap[t.id] = t.name;
    }

    const result = (players || []).map((p) => ({
      ...p,
      team_name: teamMap[p.team_id] || null,
    }));

    return NextResponse.json({ players: result });
  } catch (err) {
    console.error("GET /api/coach/players error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

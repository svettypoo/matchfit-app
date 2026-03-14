import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import crypto from "crypto";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach_id = searchParams.get("coach_id");

    if (!coach_id) {
      return NextResponse.json({ error: "coach_id required" }, { status: 400 });
    }

    // Get teams with nested players
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from("mf_teams")
      .select("id, name, age_group, season_start, season_end, join_code, created_at, mf_players(id, name, email, phone, position, jersey_number, status, xp, level, current_streak, team_id, date_of_birth, has_account, public_profile_token)")
      .eq("coach_id", coach_id)
      .order("name", { ascending: true });

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 });
    }

    // Get unassigned players (no team_id) — players created by this coach but not in a team
    // We check via auth_id matching coach's user id or players who have no team but are linked to coach's teams
    const teamIds = (teams || []).map(t => t.id);

    // Also fetch players without team_id that belong to this coach
    const { data: allPlayers, error: playersError } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, email, phone, position, jersey_number, status, xp, level, current_streak, team_id, date_of_birth, has_account, public_profile_token")
      .is("team_id", null)
      .order("name", { ascending: true });

    // Format teams
    const formattedTeams = (teams || []).map(t => ({
      ...t,
      players: t.mf_players || [],
      player_count: (t.mf_players || []).length,
      mf_players: undefined,
    }));

    // All players flat list (from all teams + unassigned)
    const allTeamPlayers = formattedTeams.flatMap(t =>
      t.players.map(p => ({ ...p, team_name: t.name }))
    );
    const unassigned = (allPlayers || []).map(p => ({ ...p, team_name: null }));
    const allPlayersList = [...allTeamPlayers, ...unassigned].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );

    return NextResponse.json({
      teams: formattedTeams,
      unassigned_players: unassigned,
      all_players: allPlayersList,
      total_players: allPlayersList.length,
      total_teams: formattedTeams.length,
    });
  } catch (err) {
    console.error("GET /api/roster error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, team_id, position, jersey_number, coach_id } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Generate public profile token
    const public_profile_token = crypto.randomBytes(16).toString("hex");

    const { data: player, error } = await supabaseAdmin
      .from("mf_players")
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        team_id: team_id || null,
        position: position || null,
        jersey_number: jersey_number || null,
        public_profile_token,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create a public token entry for this player
    if (coach_id) {
      await supabaseAdmin.from("mf_public_tokens").insert({
        player_id: player.id,
        coach_id,
        token: public_profile_token,
        type: "profile",
      });
    }

    return NextResponse.json(player, { status: 201 });
  } catch (err) {
    console.error("POST /api/roster error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      .select("id")
      .eq("coach_id", coach_id);

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 });
    }

    const teamIds = teams?.map((t) => t.id) || [];

    if (teamIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get all players from those teams
    const { data: players } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, email, position, status, team_id")
      .in("team_id", teamIds)
      .eq("status", "active");

    if (!players || players.length === 0) {
      return NextResponse.json([]);
    }

    const playerIds = players.map((p) => p.id);

    // Get latest wellness check-in for each player
    // Fetch recent check-ins (last 3 days) and pick the latest per player
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: checkins } = await supabaseAdmin
      .from("mf_wellness_checkins")
      .select("*")
      .in("player_id", playerIds)
      .gte("checkin_date", threeDaysAgo.toISOString().split("T")[0])
      .order("checkin_date", { ascending: false });

    // Map latest check-in per player
    const latestByPlayer = {};
    for (const c of checkins || []) {
      if (!latestByPlayer[c.player_id]) {
        latestByPlayer[c.player_id] = c;
      }
    }

    const result = players.map((p) => {
      const wellness = latestByPlayer[p.id] || null;
      return {
        id: p.id,
        name: p.name,
        position: p.position,
        team_id: p.team_id,
        wellness: wellness
          ? {
              checkin_date: wellness.checkin_date,
              sleep_quality: wellness.sleep_quality,
              energy_level: wellness.energy_level,
              muscle_soreness: wellness.muscle_soreness,
              mood: wellness.mood,
              stress: wellness.stress,
              readiness_score: wellness.readiness_score,
              notes: wellness.notes,
            }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/coach/wellness error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

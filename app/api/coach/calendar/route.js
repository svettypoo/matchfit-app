import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach_id = searchParams.get("coach_id");
    const year = parseInt(searchParams.get("year"), 10);
    const month = parseInt(searchParams.get("month"), 10);

    if (!coach_id || !year || !month) {
      return NextResponse.json(
        { error: "coach_id, year, and month query parameters are required" },
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
      .select("id, name, team_id")
      .in("team_id", teamIds);

    if (!players || players.length === 0) {
      return NextResponse.json([]);
    }

    const playerIds = players.map((p) => p.id);
    const playerMap = {};
    for (const p of players) {
      playerMap[p.id] = p.name;
    }

    // Date range for the month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    // Fetch scheduled workouts for all players in this month
    const { data: workouts, error: workoutsError } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select(`
        id, player_id, scheduled_date, status, completed_at, duration_minutes, xp_earned,
        mf_program_days(
          id, day_number, focus,
          mf_programs(id, name)
        )
      `)
      .in("player_id", playerIds)
      .gte("scheduled_date", startDate)
      .lt("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true });

    if (workoutsError) {
      return NextResponse.json({ error: workoutsError.message }, { status: 500 });
    }

    const events = (workouts || []).map((w) => ({
      id: w.id,
      date: w.scheduled_date,
      player_id: w.player_id,
      player_name: playerMap[w.player_id] || "Unknown",
      status: w.status,
      completed_at: w.completed_at,
      duration_minutes: w.duration_minutes,
      program_name: w.mf_program_days?.mf_programs?.name || null,
      day_focus: w.mf_program_days?.focus || null,
    }));

    return NextResponse.json(events);
  } catch (err) {
    console.error("GET /api/coach/calendar error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

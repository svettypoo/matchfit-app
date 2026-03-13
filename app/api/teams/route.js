import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();
import crypto from "crypto";

function generateJoinCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach_id = searchParams.get("coach_id");
    const includePlayers = searchParams.get("include_players") === "true";

    if (!coach_id) {
      return NextResponse.json(
        { error: "coach_id query parameter is required" },
        { status: 400 }
      );
    }

    const selectStr = includePlayers
      ? "*, mf_players(id, name, email, position, status, xp, level)"
      : "*, mf_players(count)";

    const { data: teams, error } = await supabaseAdmin
      .from("mf_teams")
      .select(selectStr)
      .eq("coach_id", coach_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = includePlayers
      ? teams.map((t) => ({
          ...t,
          players: t.mf_players || [],
          player_count: (t.mf_players || []).length,
          mf_players: undefined,
        }))
      : teams.map((t) => ({
          ...t,
          player_count: t.mf_players?.[0]?.count ?? 0,
          mf_players: undefined,
        }));

    return NextResponse.json({ teams: result });
  } catch (err) {
    console.error("GET /api/teams error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { coach_id, name, age_group, season_start, season_end } = body;

    if (!coach_id || !name) {
      return NextResponse.json(
        { error: "coach_id and name are required" },
        { status: 400 }
      );
    }

    const { data: team, error } = await supabaseAdmin
      .from("mf_teams")
      .insert({
        coach_id,
        name,
        join_code: generateJoinCode(),
        age_group: age_group || null,
        season_start: season_start || null,
        season_end: season_end || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(team, { status: 201 });
  } catch (err) {
    console.error("POST /api/teams error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

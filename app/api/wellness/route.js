import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request) {
  try {
    const body = await request.json();
    const { player_id, sleep_quality, energy_level, muscle_soreness, mood, stress, notes } = body;

    if (!player_id) {
      return NextResponse.json(
        { error: "player_id is required" },
        { status: 400 }
      );
    }

    // Validate all fields are 1-5
    const fields = { sleep_quality, energy_level, muscle_soreness, mood, stress };
    for (const [name, value] of Object.entries(fields)) {
      if (value === undefined || value === null) {
        return NextResponse.json(
          { error: `${name} is required` },
          { status: 400 }
        );
      }
      if (value < 1 || value > 5) {
        return NextResponse.json(
          { error: `${name} must be between 1 and 5` },
          { status: 400 }
        );
      }
    }

    // Calculate readiness score (0-100)
    // Higher sleep, energy, mood = better; higher soreness, stress = worse
    const readiness_score = Math.round(
      ((sleep_quality * 25) +
        (energy_level * 25) +
        ((6 - muscle_soreness) * 20) +
        (mood * 15) +
        ((6 - stress) * 15)) / 5
    );

    const today = new Date().toISOString().split("T")[0];

    // Upsert for today (one check-in per day)
    const { data: checkin, error } = await supabaseAdmin
      .from("mf_wellness_checkins")
      .upsert(
        {
          player_id,
          checkin_date: today,
          sleep_quality,
          energy_level,
          muscle_soreness,
          mood,
          stress,
          readiness_score,
          notes: notes || null,
        },
        { onConflict: "player_id,checkin_date" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award +10 XP for check-in
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("id, xp, level")
      .eq("id", player_id)
      .single();

    if (player) {
      const newXp = (player.xp || 0) + 10;
      const newLevel = Math.floor(newXp / 500) + 1;
      await supabaseAdmin
        .from("mf_players")
        .update({ xp: newXp, level: newLevel })
        .eq("id", player_id);
    }

    return NextResponse.json({
      checkin,
      xp_earned: 10,
      readiness_label:
        readiness_score >= 80
          ? "excellent"
          : readiness_score >= 60
          ? "good"
          : readiness_score >= 40
          ? "moderate"
          : "low",
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/wellness error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const player_id = searchParams.get("player_id");
    const days = parseInt(searchParams.get("days") || "7", 10);

    if (!player_id) {
      return NextResponse.json(
        { error: "player_id query parameter is required" },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: checkins, error } = await supabaseAdmin
      .from("mf_wellness_checkins")
      .select("*")
      .eq("player_id", player_id)
      .gte("checkin_date", startDate.toISOString().split("T")[0])
      .order("checkin_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate averages
    const count = checkins.length;
    const averages =
      count > 0
        ? {
            sleep_quality:
              Math.round(
                (checkins.reduce((s, c) => s + c.sleep_quality, 0) / count) * 10
              ) / 10,
            energy_level:
              Math.round(
                (checkins.reduce((s, c) => s + c.energy_level, 0) / count) * 10
              ) / 10,
            muscle_soreness:
              Math.round(
                (checkins.reduce((s, c) => s + c.muscle_soreness, 0) / count) * 10
              ) / 10,
            mood:
              Math.round(
                (checkins.reduce((s, c) => s + c.mood, 0) / count) * 10
              ) / 10,
            stress:
              Math.round(
                (checkins.reduce((s, c) => s + c.stress, 0) / count) * 10
              ) / 10,
            readiness_score:
              Math.round(
                checkins.reduce((s, c) => s + (c.readiness_score || 0), 0) / count
              ),
          }
        : null;

    return NextResponse.json({
      checkins,
      averages,
      days_checked: count,
      period_days: days,
    });
  } catch (err) {
    console.error("GET /api/wellness error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

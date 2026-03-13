import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");
    const status = searchParams.get("status"); // active, completed, all
    const with_leaderboard = searchParams.get("leaderboard") === "true";

    if (!team_id) {
      return NextResponse.json(
        { error: "team_id query parameter is required" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("mf_challenges")
      .select("*")
      .eq("team_id", team_id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: challenges, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with progress percentage and days remaining
    const now = new Date();
    const enriched = await Promise.all(
      challenges.map(async (c) => {
        const daysLeft = Math.max(0, Math.ceil((new Date(c.end_date) - now) / 86400000));
        const totalDays = Math.max(1, Math.ceil((new Date(c.end_date) - new Date(c.start_date)) / 86400000));
        const daysElapsed = totalDays - daysLeft;

        const item = {
          ...c,
          progress_pct:
            c.target_value > 0
              ? Math.min(100, Math.round(((c.current_value || 0) / c.target_value) * 100))
              : 0,
          days_left: daysLeft,
          total_days: totalDays,
          days_elapsed: daysElapsed,
          is_expired: daysLeft === 0 && c.status === "active",
        };

        // Build leaderboard if requested
        if (with_leaderboard) {
          item.leaderboard = await buildLeaderboard(c);
        }

        return item;
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/challenges error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function buildLeaderboard(challenge) {
  try {
    // Get all players in the team
    const { data: players } = await supabaseAdmin
      .from("mf_players")
      .select("id, name")
      .eq("team_id", challenge.team_id)
      .eq("status", "active");

    if (!players?.length) return [];

    const startDate = challenge.start_date;
    const endDate = challenge.end_date;

    let leaderboard = [];

    if (challenge.target_type === "total_workouts") {
      // Count completed workouts per player in date range
      for (const player of players) {
        const { count } = await supabaseAdmin
          .from("mf_scheduled_workouts")
          .select("id", { count: "exact", head: true })
          .eq("player_id", player.id)
          .eq("status", "completed")
          .gte("completed_at", startDate)
          .lte("completed_at", endDate);

        leaderboard.push({
          player_id: player.id,
          player_name: player.name,
          value: count || 0,
        });
      }
    } else if (challenge.target_type === "total_xp") {
      // Sum XP earned per player in date range
      for (const player of players) {
        const { data: workouts } = await supabaseAdmin
          .from("mf_scheduled_workouts")
          .select("xp_earned")
          .eq("player_id", player.id)
          .eq("status", "completed")
          .gte("completed_at", startDate)
          .lte("completed_at", endDate);

        const totalXp = (workouts || []).reduce((sum, w) => sum + (w.xp_earned || 0), 0);
        leaderboard.push({
          player_id: player.id,
          player_name: player.name,
          value: totalXp,
        });
      }
    } else if (challenge.target_type === "compliance_pct") {
      // Calculate compliance (completed / scheduled) per player
      for (const player of players) {
        const { count: total } = await supabaseAdmin
          .from("mf_scheduled_workouts")
          .select("id", { count: "exact", head: true })
          .eq("player_id", player.id)
          .gte("scheduled_date", startDate)
          .lte("scheduled_date", endDate);

        const { count: completed } = await supabaseAdmin
          .from("mf_scheduled_workouts")
          .select("id", { count: "exact", head: true })
          .eq("player_id", player.id)
          .eq("status", "completed")
          .gte("scheduled_date", startDate)
          .lte("scheduled_date", endDate);

        const pct = total > 0 ? Math.round(((completed || 0) / total) * 100) : 0;
        leaderboard.push({
          player_id: player.id,
          player_name: player.name,
          value: pct,
        });
      }
    } else if (challenge.target_type === "exercise_reps" || challenge.target_type === "exercise_weight") {
      // Sum reps or max weight for a specific exercise
      for (const player of players) {
        let query = supabaseAdmin
          .from("mf_exercise_logs")
          .select("reps, weight")
          .eq("player_id", player.id)
          .gte("created_at", startDate)
          .lte("created_at", endDate);

        if (challenge.exercise_id) {
          query = query.eq("exercise_id", challenge.exercise_id);
        }

        const { data: logs } = await query;

        let value = 0;
        if (challenge.target_type === "exercise_reps") {
          value = (logs || []).reduce((sum, l) => sum + (l.reps || 0), 0);
        } else {
          value = Math.max(0, ...(logs || []).map(l => l.weight || 0));
        }

        leaderboard.push({
          player_id: player.id,
          player_name: player.name,
          value,
        });
      }
    }

    // Sort descending by value
    leaderboard.sort((a, b) => b.value - a.value);

    // Add rank
    leaderboard = leaderboard.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

    return leaderboard;
  } catch (err) {
    console.error("buildLeaderboard error:", err);
    return [];
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      team_id,
      name,
      description,
      target_type,
      target_value,
      start_date,
      end_date,
      xp_reward,
      exercise_id,
      metric,
      duration,
    } = body;

    // Support both legacy fields and new fields
    const finalTargetType = target_type || metric || "total_workouts";
    const finalStartDate = start_date || new Date().toISOString().split("T")[0];
    const finalEndDate = end_date || (duration
      ? new Date(Date.now() + duration * 86400000).toISOString().split("T")[0]
      : null);

    if (!team_id || !name) {
      return NextResponse.json(
        { error: "team_id and name are required" },
        { status: 400 }
      );
    }

    if (!finalEndDate) {
      return NextResponse.json(
        { error: "end_date or duration is required" },
        { status: 400 }
      );
    }

    const validTargetTypes = [
      "compliance_pct",
      "total_workouts",
      "total_xp",
      "exercise_reps",
      "exercise_weight",
    ];
    if (!validTargetTypes.includes(finalTargetType)) {
      return NextResponse.json(
        { error: `target_type must be one of: ${validTargetTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const insertData = {
      team_id,
      name,
      description: description || null,
      target_type: finalTargetType,
      target_value: target_value || 0,
      start_date: finalStartDate,
      end_date: finalEndDate,
      xp_reward: xp_reward || 100,
      status: "active",
      current_value: 0,
    };

    // Store exercise_id if provided (for exercise-specific challenges)
    if (exercise_id) {
      insertData.exercise_id = exercise_id;
    }

    const { data: challenge, error } = await supabaseAdmin
      .from("mf_challenges")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(challenge, { status: 201 });
  } catch (err) {
    console.error("POST /api/challenges error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, current_value, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updates = {};
    if (current_value !== undefined) updates.current_value = current_value;
    if (status) updates.status = status;

    // Auto-complete if current_value meets target
    if (current_value !== undefined) {
      const { data: challenge } = await supabaseAdmin
        .from("mf_challenges")
        .select("target_value, status")
        .eq("id", id)
        .single();

      if (challenge && challenge.status === "active" && current_value >= challenge.target_value) {
        updates.status = "completed";
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from("mf_challenges")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/challenges error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

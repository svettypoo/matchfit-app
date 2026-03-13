import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Get full player profile
    const { data: player, error } = await supabaseAdmin
      .from("mf_players")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Get earned badges
    const { data: badges } = await supabaseAdmin
      .from("mf_player_badges")
      .select("*, mf_badges(*)")
      .eq("player_id", id)
      .order("earned_at", { ascending: false });

    // Get current active program
    const { data: activeProgram } = await supabaseAdmin
      .from("mf_player_programs")
      .select("*, mf_programs(id, name, description, duration_weeks, phase_type, difficulty)")
      .eq("player_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get stats summary
    const { data: completedWorkouts } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("id", { count: "exact" })
      .eq("player_id", id)
      .eq("status", "completed");

    const { data: totalWorkouts } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("id", { count: "exact" })
      .eq("player_id", id);

    return NextResponse.json({
      ...player,
      badges: badges?.map((pb) => ({
        ...pb.mf_badges,
        earned_at: pb.earned_at,
      })) || [],
      current_program: activeProgram?.mf_programs || null,
      stats: {
        total_workouts: totalWorkouts?.length || 0,
        completed_workouts: completedWorkouts?.length || 0,
        completion_rate:
          totalWorkouts?.length > 0
            ? Math.round(
                ((completedWorkouts?.length || 0) / totalWorkouts.length) * 100
              )
            : 0,
      },
    });
  } catch (err) {
    console.error("GET /api/players/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Fields that can be updated
    const allowed = [
      "name", "avatar_url", "position", "jersey_number", "status",
      "fitness_level", "training_days", "preferred_time", "max_hours_per_day",
      "primary_goal", "dream_club", "motivation", "current_injuries",
      "other_sports", "units", "dark_mode", "reminder_time",
      "workout_reminder", "checkin_reminder", "coach_notes", "team_id",
    ];

    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: player, error } = await supabaseAdmin
      .from("mf_players")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(player);
  } catch (err) {
    console.error("PATCH /api/players/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Remove player from team (set team_id to null) rather than deleting
    // To fully delete, remove auth user which cascades
    const { data: player, error: findError } = await supabaseAdmin
      .from("mf_players")
      .select("auth_id")
      .eq("id", id)
      .single();

    if (findError || !player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Remove from team
    const { error } = await supabaseAdmin
      .from("mf_players")
      .update({ team_id: null, status: "inactive" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Player removed from team",
    });
  } catch (err) {
    console.error("DELETE /api/players/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { name, email, position } = await request.json();

    if (!name || !email || !position) {
      return NextResponse.json(
        { error: "name, email, and position are required" },
        { status: 400 }
      );
    }

    // Verify team exists
    const { data: team, error: teamError } = await supabaseAdmin
      .from("mf_teams")
      .select("id, name")
      .eq("id", id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Create Supabase auth user (or get existing)
    let userId;
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: "MatchFit123!",
      email_confirm: true,
    });

    if (authError) {
      // If user already exists, look them up
      if (authError.message?.includes("already") || authError.status === 422) {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existing = users?.find(u => u.email === email.toLowerCase().trim());
        if (existing) {
          userId = existing.id;
        } else {
          return NextResponse.json(
            { error: "User exists but could not be found: " + authError.message },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Failed to create auth user: " + authError.message },
          { status: 500 }
        );
      }
    } else {
      userId = authUser.user.id;
    }

    // Check if player already exists on this team
    const { data: existingPlayer } = await supabaseAdmin
      .from("mf_players")
      .select("id")
      .eq("user_id", userId)
      .eq("team_id", id)
      .maybeSingle();

    if (existingPlayer) {
      return NextResponse.json(
        { error: "This player is already on the team" },
        { status: 409 }
      );
    }

    // Create mf_players record
    const { data: player, error: playerError } = await supabaseAdmin
      .from("mf_players")
      .insert({
        user_id: userId,
        team_id: id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        positions: [position],
        position: position,
        status: "active",
        xp: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single();

    if (playerError) {
      return NextResponse.json(
        { error: "Failed to create player: " + playerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(player, { status: 201 });
  } catch (err) {
    console.error("POST /api/teams/[id]/players error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch all players on this team with their key stats
    const { data: players, error } = await supabaseAdmin
      .from("mf_players")
      .select(
        "id, name, email, avatar_url, position, jersey_number, date_of_birth, status, xp, level, current_streak, longest_streak, last_activity_date, onboarding_complete, fitness_level, coach_notes"
      )
      .eq("team_id", id)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate compliance for each player (workouts completed / scheduled in last 7 days)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const nowStr = now.toISOString().split("T")[0];

    const enriched = await Promise.all(
      players.map(async (player) => {
        const { data: workouts } = await supabaseAdmin
          .from("mf_scheduled_workouts")
          .select("id, status")
          .eq("player_id", player.id)
          .gte("scheduled_date", weekAgoStr)
          .lte("scheduled_date", nowStr);

        const total = workouts?.length || 0;
        const completed =
          workouts?.filter((w) => w.status === "completed").length || 0;
        const compliance = total > 0 ? Math.round((completed / total) * 100) : null;

        return {
          ...player,
          compliance,
          workouts_scheduled_7d: total,
          workouts_completed_7d: completed,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/teams/[id]/players error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

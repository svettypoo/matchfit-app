import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();
import crypto from "crypto";

function generateJoinCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, team_name, join_code } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password, role" },
        { status: 400 }
      );
    }

    if (!["coach", "player"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'coach' or 'player'" },
        { status: 400 }
      );
    }

    // Create Supabase auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const authUser = authData.user;

    if (role === "coach") {
      // Insert into mf_coaches
      const { data: coach, error: coachError } = await supabaseAdmin
        .from("mf_coaches")
        .insert({
          auth_id: authUser.id,
          name,
          email,
        })
        .select()
        .single();

      if (coachError) {
        // Cleanup auth user on failure
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        return NextResponse.json(
          { error: coachError.message },
          { status: 500 }
        );
      }

      // Create default team if team_name provided
      let team = null;
      if (team_name) {
        const { data: teamData, error: teamError } = await supabaseAdmin
          .from("mf_teams")
          .insert({
            coach_id: coach.id,
            name: team_name,
            join_code: generateJoinCode(),
          })
          .select()
          .single();

        if (teamError) {
          return NextResponse.json(
            { error: teamError.message },
            { status: 500 }
          );
        }
        team = teamData;
      }

      return NextResponse.json({
        user: { id: authUser.id, email: authUser.email },
        role: "coach",
        coach,
        team,
      });
    }

    // Player signup
    const playerData = {
      auth_id: authUser.id,
      name,
      email,
    };

    // If join_code provided, find the team
    if (join_code) {
      const { data: team, error: teamError } = await supabaseAdmin
        .from("mf_teams")
        .select("id")
        .eq("join_code", join_code.toUpperCase())
        .single();

      if (teamError || !team) {
        // Still create the player but without a team
        console.warn("Invalid join code provided:", join_code);
      } else {
        playerData.team_id = team.id;
      }
    }

    const { data: player, error: playerError } = await supabaseAdmin
      .from("mf_players")
      .insert(playerData)
      .select()
      .single();

    if (playerError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      return NextResponse.json(
        { error: playerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: { id: authUser.id, email: authUser.email },
      role: "player",
      player,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

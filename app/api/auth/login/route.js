import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate via Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (authError) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const authUser = authData.user;

    // Check if user is a coach
    const { data: coach } = await supabaseAdmin
      .from("mf_coaches")
      .select("*")
      .eq("auth_id", authUser.id)
      .single();

    if (coach) {
      return NextResponse.json({
        user: {
          id: coach.id,
          auth_id: authUser.id,
          name: coach.name,
          email: authUser.email,
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
        },
        role: "coach",
        profile: coach,
      });
    }

    // Check if user is a player
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("*")
      .eq("auth_id", authUser.id)
      .single();

    if (player) {
      return NextResponse.json({
        user: {
          id: player.id,
          auth_id: authUser.id,
          name: player.name,
          email: authUser.email,
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
        },
        role: "player",
        profile: player,
      });
    }

    return NextResponse.json(
      { error: "User exists in auth but has no coach or player profile" },
      { status: 404 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

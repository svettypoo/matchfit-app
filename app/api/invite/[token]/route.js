import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { token } = params;

    // Try full token match first (from email link)
    let { data: invite, error } = await supabaseAdmin
      .from("mf_invites")
      .select("*, mf_teams(id, name, age_group, coach_id, mf_coaches(name))")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (invite) {
      return NextResponse.json({
        invite: { id: invite.id, email: invite.email, status: invite.status },
        team_name: invite.mf_teams?.name,
        coach_name: invite.mf_teams?.mf_coaches?.name || "Coach",
        team: invite.mf_teams,
      });
    }

    // Fallback: try as a team join_code (6-char manual entry)
    const { data: team } = await supabaseAdmin
      .from("mf_teams")
      .select("id, name, age_group, coach_id, mf_coaches(name)")
      .eq("join_code", token.toUpperCase())
      .single();

    if (team) {
      return NextResponse.json({
        team_name: team.name,
        coach_name: team.mf_coaches?.name || "Coach",
        team,
      });
    }

    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 404 }
    );
  } catch (err) {
    console.error("GET /api/invite/[token] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { token } = params;

    // Find the invite
    const { data: invite, error: findError } = await supabaseAdmin
      .from("mf_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (findError || !invite) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `Invite has already been ${invite.status}` },
        { status: 400 }
      );
    }

    // Mark invite as accepted
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("mf_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invite: updated,
      message: "Invite accepted",
    });
  } catch (err) {
    console.error("PATCH /api/invite/[token] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

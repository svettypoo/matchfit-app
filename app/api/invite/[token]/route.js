import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  try {
    const { token } = params;

    const { data: invite, error } = await supabaseAdmin
      .from("mf_invites")
      .select("*, mf_teams(id, name, age_group, coach_id)")
      .eq("token", token)
      .single();

    if (error || !invite) {
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

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        status: invite.status,
      },
      team: invite.mf_teams,
    });
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

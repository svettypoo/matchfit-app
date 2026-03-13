import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const { team_id, emails } = await request.json();

    if (!team_id || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "team_id and emails[] are required" },
        { status: 400 }
      );
    }

    // Verify team exists
    const { data: team, error: teamError } = await supabaseAdmin
      .from("mf_teams")
      .select("id, name")
      .eq("id", team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Create invite records
    const invites = emails.map((email) => ({
      team_id,
      email: email.toLowerCase().trim(),
      token: crypto.randomBytes(16).toString("hex"),
      status: "pending",
    }));

    const { data: created, error: insertError } = await supabaseAdmin
      .from("mf_invites")
      .insert(invites)
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invites: created.map((inv) => ({
        id: inv.id,
        email: inv.email,
        token: inv.token,
        status: inv.status,
      })),
      team: { id: team.id, name: team.name },
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/invite error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");

    if (!team_id) {
      return NextResponse.json(
        { error: "team_id query parameter is required" },
        { status: 400 }
      );
    }

    const { data: invites, error } = await supabaseAdmin
      .from("mf_invites")
      .select("*")
      .eq("team_id", team_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(invites);
  } catch (err) {
    console.error("GET /api/invite error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

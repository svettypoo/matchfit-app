import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://matchfit.stproperties.com";

function buildInviteEmail(teamName, inviteCode, joinUrl) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#15803d,#059669);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center">
    <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">MatchFit</div>
    <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:4px">Train Like A Pro</div>
  </div>
  <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
    <h1 style="font-size:22px;color:#111827;margin:0 0 8px">You're Invited!</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">
      Your coach has invited you to join <strong style="color:#111827">${teamName}</strong> on MatchFit — the AI-powered training platform for athletes.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px">
      <div style="color:#6b7280;font-size:12px;margin-bottom:4px">Your invite code</div>
      <div style="font-size:32px;font-weight:800;color:#15803d;letter-spacing:4px;font-family:monospace">${inviteCode}</div>
    </div>
    <a href="${joinUrl}" style="display:block;background:#15803d;color:#fff;text-align:center;padding:14px;border-radius:10px;font-size:16px;font-weight:600;text-decoration:none">Join ${teamName}</a>
    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0">
      Or go to <a href="${APP_URL}/join" style="color:#15803d">${APP_URL}/join</a> and enter code <strong>${inviteCode}</strong>
    </p>
  </div>
  <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px">
    Powered by MatchFit &bull; AI-Driven Athletic Performance
  </div>
</div>
</body></html>`;
}

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
      .select("id, name, coach_id, mf_coaches(name)")
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

    // Send invite emails via Resend
    const emailResults = [];
    const resendKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM || "MatchFit <noreply@inboxai-mail.dedyn.io>";

    if (resendKey) {
      for (const inv of created) {
        const inviteCode = inv.token.slice(0, 6).toUpperCase();
        const joinUrl = `${APP_URL}/join?token=${inv.token}`;
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [inv.email],
              subject: `You're invited to join ${team.name} on MatchFit!`,
              html: buildInviteEmail(team.name, inviteCode, joinUrl),
            }),
          });
          const emailData = await emailRes.json();
          emailResults.push({ email: inv.email, sent: emailRes.ok, id: emailData.id });
        } catch (emailErr) {
          console.error(`Failed to send invite email to ${inv.email}:`, emailErr.message);
          emailResults.push({ email: inv.email, sent: false, error: emailErr.message });
        }
      }
    }

    return NextResponse.json({
      invites: created.map((inv) => ({
        id: inv.id,
        email: inv.email,
        token: inv.token,
        status: inv.status,
      })),
      team: { id: team.id, name: team.name },
      emails_sent: emailResults,
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

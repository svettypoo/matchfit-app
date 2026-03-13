import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const player_id = searchParams.get("player_id");

    if (!player_id) {
      return NextResponse.json(
        { error: "player_id query parameter is required" },
        { status: 400 }
      );
    }

    const { data: notifications, error } = await supabaseAdmin
      .from("mf_notifications")
      .select("*")
      .eq("player_id", player_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unread = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications,
      unread_count: unread,
    });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { player_id, coach_id, type, title, body: notifBody, scheduled_for } = body;

    if (!player_id || !type || !title) {
      return NextResponse.json(
        { error: "player_id, type, and title are required" },
        { status: 400 }
      );
    }

    const validTypes = [
      "coach_message", "program_update", "challenge", "badge",
      "streak", "system",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabaseAdmin
      .from("mf_notifications")
      .insert({
        player_id,
        coach_id: coach_id || null,
        type,
        title,
        body: notifBody || null,
        scheduled_for: scheduled_for || null,
        sent_at: scheduled_for ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (err) {
    console.error("POST /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, read } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabaseAdmin
      .from("mf_notifications")
      .update({ read: read === true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(notification);
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

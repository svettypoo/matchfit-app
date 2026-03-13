import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    let query = supabaseAdmin
      .from("mf_notifications")
      .select("*")
      .eq("player_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = unreadOnly
      ? (notifications || []).length
      : (notifications || []).filter((n) => !n.read).length;

    return NextResponse.json({
      notifications: notifications || [],
      count: unreadCount,
      unread_count: unreadCount,
    });
  } catch (err) {
    console.error("GET /api/players/[id]/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function PATCH(request, { params }) {
  try {
    const { id, notifId } = params;

    const { data: notification, error } = await supabaseAdmin
      .from("mf_notifications")
      .update({ read: true })
      .eq("id", notifId)
      .eq("player_id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (err) {
    console.error("PATCH /api/players/[id]/notifications/[notifId] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

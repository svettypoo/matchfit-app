import { NextResponse } from "next/server";

export async function DELETE() {
  // Client-side tokens should be cleared by the frontend.
  // This endpoint confirms the logout action server-side.
  return NextResponse.json({ success: true, message: "Logged out" });
}

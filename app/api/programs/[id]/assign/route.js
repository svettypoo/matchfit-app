import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import crypto from "crypto";
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request, { params }) {
  try {
    const { id: program_id } = params;
    const { player_ids, start_date, force } = await request.json();

    if (!player_ids || !Array.isArray(player_ids) || player_ids.length === 0) {
      return NextResponse.json(
        { error: "player_ids[] is required" },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { error: "start_date is required" },
        { status: 400 }
      );
    }

    // Fetch program with days
    const { data: program, error: progError } = await supabaseAdmin
      .from("mf_programs")
      .select("*, mf_program_days(id, day_of_week, name, sort_order)")
      .eq("id", program_id)
      .single();

    if (progError || !program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    const durationWeeks = program.duration_weeks || 4;
    const programDays = program.mf_program_days || [];

    const results = [];

    for (const player_id of player_ids) {
      // Mark any existing active program as completed
      await supabaseAdmin
        .from("mf_player_programs")
        .update({ status: "completed" })
        .eq("player_id", player_id)
        .eq("status", "active");

      // Calculate end date
      const start = new Date(start_date);
      const end = new Date(start);
      end.setDate(end.getDate() + durationWeeks * 7);

      // Create player_program assignment
      const { data: playerProgram, error: ppError } = await supabaseAdmin
        .from("mf_player_programs")
        .insert({
          player_id,
          program_id,
          start_date,
          end_date: end.toISOString().split("T")[0],
          status: "active",
          week_number: 1,
        })
        .select()
        .single();

      if (ppError) {
        results.push({
          player_id,
          error: ppError.message,
        });
        continue;
      }

      // Generate scheduled workouts for 4 weeks
      const scheduledWorkouts = [];
      const startDateObj = new Date(start_date);

      for (let week = 0; week < durationWeeks; week++) {
        for (const day of programDays) {
          // Calculate the actual date for this day_of_week in this week
          const weekStart = new Date(startDateObj);
          weekStart.setDate(weekStart.getDate() + week * 7);

          // Find the next occurrence of this day_of_week from weekStart
          const currentDayOfWeek = weekStart.getDay(); // 0=Sun
          let daysUntil = day.day_of_week - currentDayOfWeek;
          if (daysUntil < 0) daysUntil += 7;

          const workoutDate = new Date(weekStart);
          workoutDate.setDate(workoutDate.getDate() + daysUntil);

          // Only schedule if within the program duration
          if (workoutDate <= end) {
            scheduledWorkouts.push({
              player_id,
              program_day_id: day.id,
              scheduled_date: workoutDate.toISOString().split("T")[0],
              name: day.name || `Week ${week + 1} - Day ${day.sort_order + 1}`,
              status: "upcoming",
            });
          }
        }
      }

      if (scheduledWorkouts.length > 0) {
        const { error: swError } = await supabaseAdmin
          .from("mf_scheduled_workouts")
          .insert(scheduledWorkouts);

        if (swError) {
          results.push({
            player_id,
            player_program: playerProgram,
            error: `Program assigned but failed to generate workouts: ${swError.message}`,
          });
          continue;
        }
      }

      // Generate public token for this assignment
      const programToken = crypto.randomBytes(16).toString("hex");

      // Ensure player has a profile token
      const { data: player } = await supabaseAdmin
        .from("mf_players")
        .select("public_profile_token")
        .eq("id", player_id)
        .single();

      if (!player?.public_profile_token) {
        const profileToken = crypto.randomBytes(16).toString("hex");
        await supabaseAdmin
          .from("mf_players")
          .update({ public_profile_token: profileToken })
          .eq("id", player_id);
      }

      // Create public token for this program assignment
      await supabaseAdmin.from("mf_public_tokens").insert({
        player_id,
        coach_id: program.coach_id,
        token: programToken,
        type: "program",
        program_assignment_id: playerProgram.id,
      });

      // Update the player_program with token reference
      await supabaseAdmin
        .from("mf_player_programs")
        .update({ assigned_via: force ? "reassign" : "manual" })
        .eq("id", playerProgram.id);

      results.push({
        player_id,
        player_program: playerProgram,
        workouts_generated: scheduledWorkouts.length,
        public_token: programToken,
      });
    }

    return NextResponse.json({
      program: { id: program.id, name: program.name },
      assignments: results,
    });
  } catch (err) {
    console.error("POST /api/programs/[id]/assign error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

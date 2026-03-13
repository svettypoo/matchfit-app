import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch workout with program day exercises
    const { data: workout, error } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select(
        `*,
        mf_program_days(
          *,
          mf_program_exercises(
            *,
            mf_exercises(id, name, description, category, muscle_groups, equipment, difficulty, video_url, image_url, is_timed, default_sets, default_reps, default_duration_sec, default_rest_sec)
          )
        )`
      )
      .eq("id", id)
      .single();

    if (error || !workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }

    // Sort exercises by sort_order
    if (workout.mf_program_days?.mf_program_exercises) {
      workout.mf_program_days.mf_program_exercises.sort(
        (a, b) => a.sort_order - b.sort_order
      );
    }

    // Get any existing exercise logs for this workout
    const { data: logs } = await supabaseAdmin
      .from("mf_exercise_logs")
      .select("*")
      .eq("workout_id", id);

    return NextResponse.json({
      ...workout,
      exercise_logs: logs || [],
    });
  } catch (err) {
    console.error("GET /api/workouts/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Badge eligibility checks.
 * Returns array of badge names the player qualifies for.
 */
async function checkBadgeEligibility(playerId) {
  const earned = [];

  // Get player stats
  const { data: player } = await supabaseAdmin
    .from("mf_players")
    .select("current_streak, xp")
    .eq("id", playerId)
    .single();

  if (!player) return earned;

  // Count completed workouts
  const { count: completedCount } = await supabaseAdmin
    .from("mf_scheduled_workouts")
    .select("id", { count: "exact", head: true })
    .eq("player_id", playerId)
    .eq("status", "completed");

  // Get already earned badge names
  const { data: existingBadges } = await supabaseAdmin
    .from("mf_player_badges")
    .select("mf_badges(name)")
    .eq("player_id", playerId);

  const earnedNames = new Set(
    existingBadges?.map((b) => b.mf_badges?.name) || []
  );

  // Check each badge condition
  const checks = [
    { name: "First Workout", condition: completedCount >= 1 },
    { name: "7-Day Warrior", condition: player.current_streak >= 7 },
    { name: "14-Day Fighter", condition: player.current_streak >= 14 },
    { name: "30-Day Machine", condition: player.current_streak >= 30 },
    { name: "100-Day Legend", condition: player.current_streak >= 100 },
    { name: "Iron Will", condition: completedCount >= 50 },
    { name: "Centurion", condition: completedCount >= 100 },
  ];

  // Check perfect week (7/7 in last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: weekWorkouts } = await supabaseAdmin
    .from("mf_scheduled_workouts")
    .select("status")
    .eq("player_id", playerId)
    .gte("scheduled_date", weekAgo.toISOString().split("T")[0]);

  if (weekWorkouts && weekWorkouts.length >= 7) {
    const allCompleted = weekWorkouts.every((w) => w.status === "completed");
    checks.push({ name: "Perfect Week", condition: allCompleted });
  }

  for (const check of checks) {
    if (check.condition && !earnedNames.has(check.name)) {
      earned.push(check.name);
    }
  }

  return earned;
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, completion_pct, rpe_reported, duration_minutes, notes } = body;

    // Fetch current workout
    const { data: workout, error: fetchError } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("*, mf_program_days(mf_program_exercises(count))")
      .eq("id", id)
      .single();

    if (fetchError || !workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }

    const updates = {};
    if (status) updates.status = status;
    if (completion_pct !== undefined) updates.completion_pct = completion_pct;
    if (rpe_reported !== undefined) updates.rpe_reported = rpe_reported;
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
    if (notes !== undefined) updates.notes = notes;

    let xpEarned = 0;
    let newBadges = [];

    // XP calculation when marking as completed
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();

      // Base XP
      xpEarned = 50;

      // Completion bonus: +25 for 100% completion
      const pct = completion_pct ?? 100;
      if (pct >= 100) xpEarned += 25;
      else if (pct >= 80) xpEarned += 15;
      else if (pct >= 50) xpEarned += 5;

      // RPE accuracy bonus: +10 if RPE reported
      if (rpe_reported) xpEarned += 10;

      // Duration bonus: +15 if workout took > 30 min
      if (duration_minutes && duration_minutes >= 30) xpEarned += 15;

      updates.xp_earned = xpEarned;

      // Update player XP and streak
      const { data: player } = await supabaseAdmin
        .from("mf_players")
        .select("id, xp, level, current_streak, longest_streak, last_activity_date")
        .eq("id", workout.player_id)
        .single();

      if (player) {
        const today = new Date().toISOString().split("T")[0];
        const lastActivity = player.last_activity_date;

        let newStreak = player.current_streak;

        if (lastActivity) {
          const lastDate = new Date(lastActivity);
          const todayDate = new Date(today);
          const diffDays = Math.floor(
            (todayDate - lastDate) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            // Consecutive day — extend streak
            newStreak += 1;
            // Streak bonus XP
            if (newStreak >= 7) xpEarned += 10;
            if (newStreak >= 14) xpEarned += 15;
            if (newStreak >= 30) xpEarned += 25;
          } else if (diffDays === 0) {
            // Same day — keep streak
          } else {
            // Streak broken
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        const newXp = (player.xp || 0) + xpEarned;
        // Level up every 500 XP
        const newLevel = Math.floor(newXp / 500) + 1;

        await supabaseAdmin
          .from("mf_players")
          .update({
            xp: newXp,
            level: newLevel,
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, player.longest_streak || 0),
            last_activity_date: today,
          })
          .eq("id", player.id);

        // Check badge eligibility
        const eligibleBadges = await checkBadgeEligibility(player.id);
        for (const badgeName of eligibleBadges) {
          const { data: badge } = await supabaseAdmin
            .from("mf_badges")
            .select("id, name, xp_reward")
            .eq("name", badgeName)
            .single();

          if (badge) {
            await supabaseAdmin.from("mf_player_badges").insert({
              player_id: player.id,
              badge_id: badge.id,
            });

            // Award badge XP
            await supabaseAdmin
              .from("mf_players")
              .update({ xp: newXp + badge.xp_reward })
              .eq("id", player.id);

            newBadges.push(badge);
          }
        }
      }
    }

    // Update workout record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workout: updated,
      xp_earned: xpEarned,
      new_badges: newBadges,
    });
  } catch (err) {
    console.error("PATCH /api/workouts/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

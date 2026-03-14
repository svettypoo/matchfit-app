import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/ai/smart-defaults
 * Returns AI-suggested defaults for logging an exercise based on the player's
 * recent performance history for that exercise.
 * Body: { player_id, exercise_id, prescribed_sets, prescribed_reps }
 */
export async function POST(request) {
  try {
    const { player_id, exercise_id, prescribed_sets, prescribed_reps } = await request.json();
    if (!player_id || !exercise_id) {
      return NextResponse.json({ error: "player_id and exercise_id required" }, { status: 400 });
    }

    // Fetch last 10 logs of this exercise for this player
    const { data: logs } = await supabaseAdmin
      .from("mf_exercise_logs")
      .select("completed_sets, completed_reps, weight_used, duration_sec, rpe_logged, created_at, mf_scheduled_workouts(player_id)")
      .eq("exercise_id", exercise_id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Filter to this player's logs (join through scheduled_workouts)
    const playerLogs = (logs || []).filter(l => l.mf_scheduled_workouts?.player_id === player_id).slice(0, 10);

    if (playerLogs.length === 0) {
      // No history — return prescribed values as defaults
      return NextResponse.json({
        suggested_sets: prescribed_sets || 3,
        suggested_reps: Array(prescribed_sets || 3).fill(prescribed_reps || 10),
        suggested_weight: Array(prescribed_sets || 3).fill(null),
        confidence: "no_history",
        message: "No previous data — using prescribed values",
      });
    }

    // Analyze recent performance
    const lastLog = playerLogs[0];
    const recentWeights = playerLogs
      .map(l => l.weight_used)
      .filter(Boolean)
      .flat()
      .filter(w => w > 0);
    const recentReps = playerLogs
      .map(l => l.completed_reps)
      .filter(Boolean)
      .flat()
      .filter(r => r > 0);
    const recentRPE = playerLogs
      .map(l => l.rpe_logged)
      .filter(r => r !== null && r !== undefined);

    const avgWeight = recentWeights.length > 0
      ? Math.round(recentWeights.reduce((s, w) => s + w, 0) / recentWeights.length * 10) / 10
      : null;
    const lastWeight = lastLog.weight_used?.[0] || avgWeight;
    const avgRPE = recentRPE.length > 0
      ? Math.round(recentRPE.reduce((s, r) => s + r, 0) / recentRPE.length * 10) / 10
      : null;

    // Progressive overload logic
    const sets = prescribed_sets || lastLog.completed_sets || 3;
    let suggestedWeight = lastWeight;

    // If RPE was consistently low (<7), suggest a small increase
    if (avgRPE !== null && avgRPE < 7 && suggestedWeight) {
      suggestedWeight = Math.round((suggestedWeight * 1.025) * 10) / 10; // +2.5%
    }

    // Build reps array from last performance
    const suggestedReps = [];
    for (let i = 0; i < sets; i++) {
      if (lastLog.completed_reps && lastLog.completed_reps[i]) {
        suggestedReps.push(lastLog.completed_reps[i]);
      } else {
        suggestedReps.push(prescribed_reps || (recentReps.length > 0 ? Math.round(recentReps.reduce((s, r) => s + r, 0) / recentReps.length) : 10));
      }
    }

    // Build weight array
    const suggestedWeightArr = [];
    for (let i = 0; i < sets; i++) {
      if (lastLog.weight_used && lastLog.weight_used[i]) {
        let w = lastLog.weight_used[i];
        // Apply progressive overload to first set only
        if (i === 0 && avgRPE !== null && avgRPE < 7) {
          w = Math.round(w * 1.025 * 10) / 10;
        }
        suggestedWeightArr.push(w);
      } else {
        suggestedWeightArr.push(suggestedWeight);
      }
    }

    // Determine trend
    let trend = "stable";
    if (recentWeights.length >= 4) {
      const firstHalf = recentWeights.slice(Math.floor(recentWeights.length / 2));
      const secondHalf = recentWeights.slice(0, Math.floor(recentWeights.length / 2));
      const firstAvg = firstHalf.reduce((s, w) => s + w, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, w) => s + w, 0) / secondHalf.length;
      if (secondAvg > firstAvg * 1.02) trend = "improving";
      else if (secondAvg < firstAvg * 0.98) trend = "declining";
    }

    return NextResponse.json({
      suggested_sets: sets,
      suggested_reps: suggestedReps,
      suggested_weight: suggestedWeightArr,
      last_performance: {
        sets: lastLog.completed_sets,
        reps: lastLog.completed_reps,
        weight: lastLog.weight_used,
        rpe: lastLog.rpe_logged,
        date: lastLog.created_at,
      },
      avg_rpe: avgRPE,
      trend,
      sessions_analyzed: playerLogs.length,
      confidence: playerLogs.length >= 5 ? "high" : playerLogs.length >= 2 ? "medium" : "low",
      message: trend === "improving"
        ? "Great progress! Weight increased slightly based on your trend."
        : trend === "declining"
          ? "Performance dipping — consider a deload or recovery focus."
          : avgRPE !== null && avgRPE < 7
            ? "RPE is low — AI suggests a small weight increase."
            : "Pre-filled from your last session.",
    });
  } catch (err) {
    console.error("POST /api/ai/smart-defaults error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

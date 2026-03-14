import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/ai/auto-progression
 * Analyzes a player's recent performance logs and recommends
 * progressive overload adjustments for their next training cycle.
 * Body: { player_id }
 */
export async function POST(request) {
  try {
    const { player_id } = await request.json();
    if (!player_id) {
      return NextResponse.json({ error: "player_id required" }, { status: 400 });
    }

    // Fetch player
    const { data: player } = await supabaseAdmin
      .from("mf_players")
      .select("name, fitness_level, date_of_birth, weight_kg")
      .eq("id", player_id)
      .single();
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    // Fetch last 4 weeks of exercise logs
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: logs } = await supabaseAdmin
      .from("mf_exercise_logs")
      .select("exercise_id, completed_sets, completed_reps, weight_used, rpe_logged, skipped, created_at, mf_exercises(name, category, primary_muscles), mf_scheduled_workouts(player_id)")
      .gte("created_at", fourWeeksAgo.toISOString())
      .order("created_at", { ascending: true })
      .limit(200);

    const playerLogs = (logs || []).filter(l => l.mf_scheduled_workouts?.player_id === player_id);

    if (playerLogs.length < 5) {
      return NextResponse.json({
        recommendations: [],
        summary: "Not enough training data yet. Complete at least 5 sessions for AI progression analysis.",
        readiness: "insufficient_data",
      });
    }

    // Group logs by exercise
    const byExercise = {};
    for (const log of playerLogs) {
      if (log.skipped) continue;
      const name = log.mf_exercises?.name || "Unknown";
      if (!byExercise[name]) byExercise[name] = [];
      byExercise[name].push(log);
    }

    // Calculate progression for each exercise
    const recommendations = [];

    for (const [exerciseName, exLogs] of Object.entries(byExercise)) {
      if (exLogs.length < 2) continue;

      const weights = exLogs.map(l => l.weight_used?.[0]).filter(w => w > 0);
      const reps = exLogs.map(l => l.completed_reps?.[0]).filter(r => r > 0);
      const rpes = exLogs.map(l => l.rpe_logged).filter(r => r !== null && r !== undefined);

      const latestWeight = weights[weights.length - 1] || 0;
      const earliestWeight = weights[0] || 0;
      const weightChange = latestWeight && earliestWeight ? ((latestWeight - earliestWeight) / earliestWeight * 100).toFixed(1) : 0;

      const avgRPE = rpes.length > 0 ? (rpes.reduce((s, r) => s + r, 0) / rpes.length).toFixed(1) : null;
      const latestRPE = rpes[rpes.length - 1] || null;

      let recommendation = "maintain";
      let newWeight = latestWeight;
      let reasoning = "";

      if (latestRPE !== null) {
        if (latestRPE <= 6) {
          recommendation = "increase_weight";
          newWeight = Math.round(latestWeight * 1.05 * 10) / 10; // +5%
          reasoning = `RPE of ${latestRPE} indicates room to grow. Suggest +5% weight.`;
        } else if (latestRPE >= 9 && exLogs.length >= 3) {
          recommendation = "deload";
          newWeight = Math.round(latestWeight * 0.9 * 10) / 10; // -10%
          reasoning = `RPE of ${latestRPE} indicates fatigue/strain. Suggest -10% deload.`;
        } else if (latestRPE >= 7 && latestRPE <= 8) {
          // Check if all reps were completed
          const latestLog = exLogs[exLogs.length - 1];
          const prescribedReps = latestLog.prescribed_reps;
          const completedAll = latestLog.completed_reps?.every((r, i) => r >= (prescribedReps || 0));
          if (completedAll && latestRPE <= 7.5) {
            recommendation = "increase_reps";
            reasoning = `RPE ${latestRPE} with all reps completed — add 1-2 reps per set before increasing weight.`;
          } else {
            recommendation = "maintain";
            reasoning = `Good working range (RPE ${latestRPE}). Maintain current load.`;
          }
        }
      } else if (weights.length >= 3) {
        // No RPE data — use weight trend
        if (parseFloat(weightChange) > 5) {
          recommendation = "maintain";
          reasoning = `Weight up ${weightChange}% over 4 weeks. Good progression, maintain briefly.`;
        } else if (parseFloat(weightChange) < -3) {
          recommendation = "review";
          reasoning = `Weight decreased ${Math.abs(weightChange)}%. Check for fatigue or injury.`;
        } else {
          recommendation = "increase_weight";
          newWeight = Math.round(latestWeight * 1.025 * 10) / 10;
          reasoning = `Plateau detected. Suggest small +2.5% increase.`;
        }
      }

      recommendations.push({
        exercise_name: exerciseName,
        exercise_id: exLogs[0].exercise_id,
        category: exLogs[0].mf_exercises?.category || "general",
        sessions: exLogs.length,
        current_weight: latestWeight || null,
        suggested_weight: newWeight || null,
        weight_change_pct: weightChange,
        avg_rpe: avgRPE,
        latest_rpe: latestRPE,
        recommendation,
        reasoning,
      });
    }

    // Overall readiness assessment
    const avgOverallRPE = playerLogs
      .map(l => l.rpe_logged)
      .filter(r => r !== null && r !== undefined);
    const overallRPE = avgOverallRPE.length > 0
      ? (avgOverallRPE.reduce((s, r) => s + r, 0) / avgOverallRPE.length).toFixed(1)
      : null;
    const skipRate = playerLogs.filter(l => l.skipped).length / playerLogs.length;

    let readiness = "good";
    let summary = "Player is progressing well. Continue current programming.";

    if (overallRPE && parseFloat(overallRPE) >= 8.5) {
      readiness = "fatigued";
      summary = "High overall RPE suggests accumulated fatigue. Consider a deload week.";
    } else if (skipRate > 0.2) {
      readiness = "inconsistent";
      summary = `${Math.round(skipRate * 100)}% skip rate. Address barriers to completion.`;
    } else if (recommendations.filter(r => r.recommendation === "increase_weight").length > recommendations.length / 2) {
      readiness = "ready_to_progress";
      summary = "Majority of exercises ready for progression. Player is adapting well.";
    }

    return NextResponse.json({
      recommendations: recommendations.sort((a, b) => {
        const order = { increase_weight: 0, increase_reps: 1, maintain: 2, deload: 3, review: 4 };
        return (order[a.recommendation] ?? 5) - (order[b.recommendation] ?? 5);
      }),
      summary,
      readiness,
      overall_rpe: overallRPE,
      total_sessions: playerLogs.length,
      skip_rate: Math.round(skipRate * 100),
    });
  } catch (err) {
    console.error("POST /api/ai/auto-progression error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

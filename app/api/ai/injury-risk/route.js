import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * GET /api/ai/injury-risk?coach_id=X
 * Analyzes all players on a coach's team for injury risk indicators:
 * - High RPE trends (overtraining)
 * - Sudden volume increases (acute:chronic workload ratio)
 * - Skipped exercises (pain avoidance)
 * - Missed workouts (inconsistency)
 * - Low wellness scores
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach_id = searchParams.get("coach_id");
    if (!coach_id) {
      return NextResponse.json({ error: "coach_id required" }, { status: 400 });
    }

    // Get all players for this coach
    const { data: teams } = await supabaseAdmin
      .from("mf_teams")
      .select("id")
      .eq("coach_id", coach_id);
    const teamIds = (teams || []).map(t => t.id);

    if (teamIds.length === 0) {
      return NextResponse.json({ alerts: [], summary: "No teams found" });
    }

    const { data: players } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, position, fitness_level, weight_kg")
      .in("team_id", teamIds);

    if (!players?.length) {
      return NextResponse.json({ alerts: [], summary: "No players found" });
    }

    const alerts = [];
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    for (const player of players) {
      const playerAlerts = [];

      // 1. Check workout completion rate
      const { data: workouts } = await supabaseAdmin
        .from("mf_scheduled_workouts")
        .select("id, status, scheduled_date")
        .eq("player_id", player.id)
        .gte("scheduled_date", fourWeeksAgo.toISOString().split("T")[0]);

      const total = (workouts || []).length;
      const completed = (workouts || []).filter(w => w.status === "completed").length;
      const missed = (workouts || []).filter(w => w.status === "missed").length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      if (missed >= 3) {
        playerAlerts.push({
          type: "missed_workouts",
          severity: missed >= 5 ? "high" : "medium",
          message: `Missed ${missed} of ${total} workouts in 4 weeks (${completionRate}% completion)`,
          metric: { missed, total, rate: completionRate },
        });
      }

      // 2. Check exercise logs for high RPE / skip patterns
      const { data: logs } = await supabaseAdmin
        .from("mf_exercise_logs")
        .select("rpe_logged, skipped, skip_reason, completed_sets, weight_used, created_at, mf_exercises(name, primary_muscles)")
        .eq("workout_id", workouts?.map(w => w.id)?.[0] || "null")
        .gte("created_at", fourWeeksAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100);

      // Broader log fetch
      const workoutIds = (workouts || []).map(w => w.id);
      let allLogs = [];
      if (workoutIds.length > 0) {
        const { data: allLogsData } = await supabaseAdmin
          .from("mf_exercise_logs")
          .select("rpe_logged, skipped, skip_reason, completed_sets, weight_used, created_at, mf_exercises(name, primary_muscles)")
          .in("workout_id", workoutIds)
          .order("created_at", { ascending: false });
        allLogs = allLogsData || [];
      }

      // High RPE check
      const recentRPEs = allLogs
        .filter(l => l.rpe_logged !== null && l.rpe_logged !== undefined)
        .slice(0, 10)
        .map(l => l.rpe_logged);
      const avgRPE = recentRPEs.length > 0
        ? (recentRPEs.reduce((s, r) => s + r, 0) / recentRPEs.length).toFixed(1)
        : null;

      if (avgRPE && parseFloat(avgRPE) >= 8.5) {
        playerAlerts.push({
          type: "high_rpe",
          severity: parseFloat(avgRPE) >= 9 ? "high" : "medium",
          message: `Average RPE of ${avgRPE} over last ${recentRPEs.length} exercises — overtraining risk`,
          metric: { avg_rpe: parseFloat(avgRPE), samples: recentRPEs.length },
        });
      }

      // Skip pattern check
      const skippedExercises = allLogs.filter(l => l.skipped);
      if (skippedExercises.length >= 3) {
        const skipReasons = skippedExercises
          .map(l => l.skip_reason)
          .filter(Boolean);
        const painSkips = skipReasons.filter(r =>
          r.toLowerCase().includes("pain") || r.toLowerCase().includes("hurt") || r.toLowerCase().includes("sore")
        );

        if (painSkips.length >= 2) {
          const skippedMuscles = skippedExercises
            .map(l => l.mf_exercises?.primary_muscles || [])
            .flat();
          playerAlerts.push({
            type: "pain_avoidance",
            severity: "high",
            message: `${painSkips.length} exercises skipped due to pain — possible injury developing`,
            metric: { pain_skips: painSkips.length, affected_areas: [...new Set(skippedMuscles)] },
          });
        }
      }

      // 3. Check acute:chronic workload ratio (last week vs 4-week avg)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const acuteLoad = allLogs
        .filter(l => new Date(l.created_at) >= oneWeekAgo)
        .reduce((s, l) => s + (l.completed_sets || 0), 0);
      const chronicLoad = allLogs.reduce((s, l) => s + (l.completed_sets || 0), 0) / 4;

      if (chronicLoad > 0) {
        const acwr = (acuteLoad / chronicLoad).toFixed(2);
        if (parseFloat(acwr) > 1.5) {
          playerAlerts.push({
            type: "workload_spike",
            severity: parseFloat(acwr) > 2.0 ? "high" : "medium",
            message: `Acute:Chronic workload ratio of ${acwr} — high injury risk zone (>1.5)`,
            metric: { acwr: parseFloat(acwr), acute_sets: acuteLoad, chronic_avg_sets: Math.round(chronicLoad) },
          });
        }
      }

      // 4. Check wellness scores
      const { data: wellness } = await supabaseAdmin
        .from("mf_wellness_logs")
        .select("sleep_quality, energy_level, muscle_soreness, mood, stress_level, created_at")
        .eq("player_id", player.id)
        .gte("created_at", twoWeeksAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(7);

      if (wellness?.length >= 3) {
        const avgSoreness = wellness.reduce((s, w) => s + (w.muscle_soreness || 3), 0) / wellness.length;
        const avgSleep = wellness.reduce((s, w) => s + (w.sleep_quality || 3), 0) / wellness.length;
        const avgEnergy = wellness.reduce((s, w) => s + (w.energy_level || 3), 0) / wellness.length;

        if (avgSoreness >= 4) {
          playerAlerts.push({
            type: "high_soreness",
            severity: avgSoreness >= 4.5 ? "high" : "medium",
            message: `Average muscle soreness ${avgSoreness.toFixed(1)}/5 over ${wellness.length} days`,
            metric: { avg_soreness: parseFloat(avgSoreness.toFixed(1)) },
          });
        }
        if (avgSleep <= 2 || avgEnergy <= 2) {
          playerAlerts.push({
            type: "poor_recovery",
            severity: "medium",
            message: `Low sleep quality (${avgSleep.toFixed(1)}/5) and/or energy (${avgEnergy.toFixed(1)}/5) — recovery compromised`,
            metric: { avg_sleep: parseFloat(avgSleep.toFixed(1)), avg_energy: parseFloat(avgEnergy.toFixed(1)) },
          });
        }
      }

      // 5. Check for active injuries
      const { data: injuries } = await supabaseAdmin
        .from("mf_injuries")
        .select("body_part, severity, status, injury_date")
        .eq("player_id", player.id)
        .in("status", ["active", "monitoring"]);

      if (injuries?.length) {
        for (const injury of injuries) {
          playerAlerts.push({
            type: "active_injury",
            severity: injury.severity === "severe" ? "high" : injury.severity === "moderate" ? "medium" : "low",
            message: `Active ${injury.severity} injury: ${injury.body_part} (${injury.status})`,
            metric: { body_part: injury.body_part, since: injury.injury_date },
          });
        }
      }

      if (playerAlerts.length > 0) {
        alerts.push({
          player_id: player.id,
          player_name: player.name,
          position: player.position,
          risk_level: playerAlerts.some(a => a.severity === "high") ? "high"
            : playerAlerts.some(a => a.severity === "medium") ? "medium" : "low",
          alert_count: playerAlerts.length,
          alerts: playerAlerts,
          completion_rate: completionRate,
          avg_rpe: avgRPE ? parseFloat(avgRPE) : null,
        });
      }
    }

    // Sort by risk level
    const riskOrder = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => (riskOrder[a.risk_level] ?? 3) - (riskOrder[b.risk_level] ?? 3));

    const highRisk = alerts.filter(a => a.risk_level === "high").length;
    const medRisk = alerts.filter(a => a.risk_level === "medium").length;

    return NextResponse.json({
      alerts,
      summary: alerts.length === 0
        ? "All players look healthy. No injury risk indicators detected."
        : `${highRisk} high-risk, ${medRisk} medium-risk players out of ${players.length} total.`,
      total_players: players.length,
      flagged_players: alerts.length,
    });
  } catch (err) {
    console.error("GET /api/ai/injury-risk error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

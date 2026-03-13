import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach_id = searchParams.get("coach_id");
    const type = searchParams.get("type"); // load | performance | injuries | wellness
    const player_id = searchParams.get("player_id"); // optional filter

    if (!coach_id) {
      return NextResponse.json({ error: "coach_id is required" }, { status: 400 });
    }

    // Get coach's teams and players
    const { data: teams } = await supabaseAdmin
      .from("mf_teams")
      .select("id, name")
      .eq("coach_id", coach_id);

    const teamIds = teams?.map(t => t.id) || [];
    if (teamIds.length === 0) {
      return NextResponse.json({ players: [], data: [] });
    }

    const { data: players } = await supabaseAdmin
      .from("mf_players")
      .select("id, name, position, team_id, jersey_number")
      .in("team_id", teamIds)
      .eq("status", "active")
      .order("name");

    const playerIds = players?.map(p => p.id) || [];
    if (playerIds.length === 0) {
      return NextResponse.json({ players: [], data: [] });
    }

    switch (type) {
      case "load":
        return NextResponse.json(await getLoadData(players, playerIds, player_id));
      case "performance":
        return NextResponse.json(await getPerformanceData(players, playerIds, player_id));
      case "injuries":
        return NextResponse.json(await getInjuryData(players, playerIds, teams));
      case "wellness":
        return NextResponse.json(await getWellnessData(players, playerIds));
      default:
        return NextResponse.json({ error: "type must be load|performance|injuries|wellness" }, { status: 400 });
    }
  } catch (err) {
    console.error("GET /api/analytics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ===================== LOAD MANAGEMENT =====================
async function getLoadData(players, playerIds, selectedPlayerId) {
  const today = new Date();
  const thirtyFiveDaysAgo = new Date(today);
  thirtyFiveDaysAgo.setDate(today.getDate() - 35); // need 35 days to compute 28-day chronic + 7-day acute

  const { data: workouts } = await supabaseAdmin
    .from("mf_scheduled_workouts")
    .select("id, player_id, scheduled_date, status, duration_minutes, rpe_reported, completion_pct, xp_earned")
    .in("player_id", playerIds)
    .gte("scheduled_date", thirtyFiveDaysAgo.toISOString().split("T")[0])
    .eq("status", "completed")
    .order("scheduled_date", { ascending: true });

  // Also fetch exercise logs for volume calculation
  const workoutIds = (workouts || []).map(w => w.id);
  let logs = [];
  if (workoutIds.length > 0) {
    // Batch fetch in groups of 100 to avoid query limits
    for (let i = 0; i < workoutIds.length; i += 100) {
      const batch = workoutIds.slice(i, i + 100);
      const { data } = await supabaseAdmin
        .from("mf_exercise_logs")
        .select("workout_id, completed_sets, completed_reps, weight_used, duration_sec")
        .in("workout_id", batch)
        .eq("skipped", false);
      if (data) logs = logs.concat(data);
    }
  }

  // Compute session load (sRPE method: RPE x duration in minutes)
  // Also compute volume load from exercise logs
  const workoutLoads = {};
  for (const w of workouts || []) {
    const rpe = w.rpe_reported || 5; // default RPE if not reported
    const duration = w.duration_minutes || 30; // default 30 min
    const sessionLoad = rpe * duration;

    if (!workoutLoads[w.player_id]) workoutLoads[w.player_id] = [];
    workoutLoads[w.player_id].push({
      date: w.scheduled_date,
      load: sessionLoad,
      rpe,
      duration,
    });
  }

  // Calculate ACWR for each player
  const todayStr = today.toISOString().split("T")[0];
  const acwrData = players.map(player => {
    const playerWorkouts = workoutLoads[player.id] || [];

    // Calculate daily loads for the last 35 days
    const dailyLoads = {};
    for (let i = 0; i < 35; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dailyLoads[d.toISOString().split("T")[0]] = 0;
    }

    for (const w of playerWorkouts) {
      if (dailyLoads[w.date] !== undefined) {
        dailyLoads[w.date] += w.load;
      }
    }

    // Acute load: sum of last 7 days / 7
    let acuteLoad = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      acuteLoad += dailyLoads[d.toISOString().split("T")[0]] || 0;
    }

    // Chronic load: sum of last 28 days / 28
    let chronicLoad = 0;
    for (let i = 0; i < 28; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      chronicLoad += dailyLoads[d.toISOString().split("T")[0]] || 0;
    }

    const acuteAvg = acuteLoad / 7;
    const chronicAvg = chronicLoad / 28;
    const acwr = chronicAvg > 0 ? Math.round((acuteAvg / chronicAvg) * 100) / 100 : null;

    // Zone classification
    let zone = "gray";
    if (acwr !== null) {
      if (acwr >= 0.8 && acwr <= 1.3) zone = "green";
      else if ((acwr > 1.3 && acwr <= 1.5) || (acwr >= 0.5 && acwr < 0.8)) zone = "amber";
      else zone = "red";
    }

    return {
      player_id: player.id,
      player_name: player.name,
      position: player.position,
      jersey_number: player.jersey_number,
      acute_load: Math.round(acuteLoad),
      chronic_load: Math.round(chronicLoad),
      acute_avg: Math.round(acuteAvg),
      chronic_avg: Math.round(chronicAvg),
      acwr,
      zone,
      sessions_7d: playerWorkouts.filter(w => {
        const d = new Date(w.date);
        const sevenAgo = new Date(today);
        sevenAgo.setDate(today.getDate() - 7);
        return d >= sevenAgo;
      }).length,
    };
  });

  // Build trend data for selected player
  let trendData = [];
  if (selectedPlayerId) {
    const playerWorkouts = workoutLoads[selectedPlayerId] || [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      // Compute rolling 7-day acute and 28-day chronic up to this date
      let acute = 0;
      for (let j = 0; j < 7; j++) {
        const dd = new Date(d);
        dd.setDate(d.getDate() - j);
        const dayLoad = playerWorkouts.find(w => w.date === dd.toISOString().split("T")[0])?.load || 0;
        acute += dayLoad;
      }

      let chronic = 0;
      for (let j = 0; j < 28; j++) {
        const dd = new Date(d);
        dd.setDate(d.getDate() - j);
        const dayLoad = playerWorkouts.find(w => w.date === dd.toISOString().split("T")[0])?.load || 0;
        chronic += dayLoad;
      }

      const acuteAvg = acute / 7;
      const chronicAvg = chronic / 28;
      const acwr = chronicAvg > 0 ? Math.round((acuteAvg / chronicAvg) * 100) / 100 : null;

      trendData.push({
        date: dateStr,
        acute_load: Math.round(acute),
        chronic_load: Math.round(chronic),
        acwr,
      });
    }
  }

  return { players, acwr_data: acwrData, trend: trendData };
}

// ===================== PERFORMANCE =====================
async function getPerformanceData(players, playerIds, selectedPlayerId) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Get completed workouts
  const { data: workouts } = await supabaseAdmin
    .from("mf_scheduled_workouts")
    .select("id, player_id, scheduled_date")
    .in("player_id", playerIds)
    .gte("scheduled_date", ninetyDaysAgo.toISOString().split("T")[0])
    .eq("status", "completed")
    .order("scheduled_date", { ascending: true });

  const workoutIds = (workouts || []).map(w => w.id);
  const workoutDateMap = {};
  const workoutPlayerMap = {};
  (workouts || []).forEach(w => {
    workoutDateMap[w.id] = w.scheduled_date;
    workoutPlayerMap[w.id] = w.player_id;
  });

  let logs = [];
  if (workoutIds.length > 0) {
    for (let i = 0; i < workoutIds.length; i += 100) {
      const batch = workoutIds.slice(i, i + 100);
      const { data } = await supabaseAdmin
        .from("mf_exercise_logs")
        .select("workout_id, exercise_id, completed_sets, completed_reps, weight_used, mf_exercises(id, name, category)")
        .in("workout_id", batch)
        .eq("skipped", false);
      if (data) logs = logs.concat(data);
    }
  }

  // Calculate estimated 1RM per exercise per player per date (Epley formula)
  // 1RM = weight * (1 + reps/30)
  const exerciseMap = {}; // exercise_id -> { name, category }
  const playerExercise1RMs = {}; // player_id -> exercise_id -> [{ date, e1rm, weight, reps }]
  const personalRecords = []; // { player_id, player_name, exercise_name, e1rm, date }

  for (const log of logs) {
    const playerId = workoutPlayerMap[log.workout_id];
    const date = workoutDateMap[log.workout_id];
    if (!playerId || !date) continue;

    const exerciseId = log.exercise_id;
    const exerciseName = log.mf_exercises?.name || "Unknown";
    const category = log.mf_exercises?.category || "other";
    exerciseMap[exerciseId] = { name: exerciseName, category };

    // Get max weight and corresponding reps
    const weights = Array.isArray(log.weight_used) ? log.weight_used.filter(w => w != null && w > 0) : [];
    const reps = Array.isArray(log.completed_reps) ? log.completed_reps : [];

    if (weights.length === 0) continue; // Skip bodyweight-only exercises

    // Find the set with highest estimated 1RM
    let bestE1RM = 0;
    let bestWeight = 0;
    let bestReps = 0;

    for (let s = 0; s < weights.length; s++) {
      const w = weights[s];
      const r = reps[s] || 1;
      if (w > 0 && r > 0) {
        const e1rm = Math.round(w * (1 + r / 30) * 10) / 10;
        if (e1rm > bestE1RM) {
          bestE1RM = e1rm;
          bestWeight = w;
          bestReps = r;
        }
      }
    }

    if (bestE1RM === 0) continue;

    if (!playerExercise1RMs[playerId]) playerExercise1RMs[playerId] = {};
    if (!playerExercise1RMs[playerId][exerciseId]) playerExercise1RMs[playerId][exerciseId] = [];

    playerExercise1RMs[playerId][exerciseId].push({
      date,
      e1rm: bestE1RM,
      weight: bestWeight,
      reps: bestReps,
    });
  }

  // Detect PRs and build exercise summaries
  const exerciseSummaries = {}; // exercise_id -> { name, category, team_avg_1rm, best_1rm, best_player, pr_count }
  const prList = [];

  for (const playerId of Object.keys(playerExercise1RMs)) {
    const playerName = players.find(p => p.id === playerId)?.name || "Unknown";
    for (const exerciseId of Object.keys(playerExercise1RMs[playerId])) {
      const entries = playerExercise1RMs[playerId][exerciseId];
      entries.sort((a, b) => a.date.localeCompare(b.date));

      // Detect PRs
      let maxSoFar = 0;
      for (const entry of entries) {
        if (entry.e1rm > maxSoFar) {
          if (maxSoFar > 0) {
            prList.push({
              player_id: playerId,
              player_name: playerName,
              exercise_id: exerciseId,
              exercise_name: exerciseMap[exerciseId]?.name,
              e1rm: entry.e1rm,
              previous: maxSoFar,
              improvement: Math.round((entry.e1rm - maxSoFar) * 10) / 10,
              date: entry.date,
            });
          }
          maxSoFar = entry.e1rm;
        }
      }

      // Aggregate for exercise summaries
      if (!exerciseSummaries[exerciseId]) {
        exerciseSummaries[exerciseId] = {
          exercise_id: exerciseId,
          name: exerciseMap[exerciseId]?.name,
          category: exerciseMap[exerciseId]?.category,
          all_1rms: [],
          best_1rm: 0,
          best_player: "",
          player_count: 0,
        };
      }

      const latest1RM = entries[entries.length - 1]?.e1rm || 0;
      exerciseSummaries[exerciseId].all_1rms.push(latest1RM);
      exerciseSummaries[exerciseId].player_count++;

      if (maxSoFar > exerciseSummaries[exerciseId].best_1rm) {
        exerciseSummaries[exerciseId].best_1rm = maxSoFar;
        exerciseSummaries[exerciseId].best_player = playerName;
      }
    }
  }

  // Calculate team averages
  const exerciseList = Object.values(exerciseSummaries).map(ex => ({
    ...ex,
    team_avg_1rm: ex.all_1rms.length > 0
      ? Math.round(ex.all_1rms.reduce((s, v) => s + v, 0) / ex.all_1rms.length * 10) / 10
      : 0,
    all_1rms: undefined, // don't send raw data
  }));

  // Build historical 1RM chart data for selected player
  let history = [];
  if (selectedPlayerId && playerExercise1RMs[selectedPlayerId]) {
    for (const [exId, entries] of Object.entries(playerExercise1RMs[selectedPlayerId])) {
      for (const entry of entries) {
        history.push({
          date: entry.date,
          exercise_id: exId,
          exercise_name: exerciseMap[exId]?.name,
          category: exerciseMap[exId]?.category,
          e1rm: entry.e1rm,
          weight: entry.weight,
          reps: entry.reps,
        });
      }
    }
    history.sort((a, b) => a.date.localeCompare(b.date));
  }

  return {
    players,
    exercises: exerciseList,
    personal_records: prList.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
    history,
  };
}

// ===================== INJURIES =====================
async function getInjuryData(players, playerIds, teams) {
  const { data: injuries } = await supabaseAdmin
    .from("mf_injuries")
    .select("*")
    .in("player_id", playerIds)
    .order("date", { ascending: false });

  // Monthly trends
  const monthlyTrends = {};
  for (const injury of injuries || []) {
    const month = injury.date?.substring(0, 7); // YYYY-MM
    if (!monthlyTrends[month]) monthlyTrends[month] = 0;
    monthlyTrends[month]++;
  }

  // Body part frequency
  const bodyPartCounts = {};
  for (const injury of injuries || []) {
    const part = injury.body_part || "Unknown";
    if (!bodyPartCounts[part]) bodyPartCounts[part] = 0;
    bodyPartCounts[part]++;
  }

  // Severity distribution
  const severityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const injury of injuries || []) {
    const sev = injury.severity || 1;
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;
  }

  // Enrich injuries with player names
  const playerMap = {};
  for (const p of players) playerMap[p.id] = p.name;

  const enrichedInjuries = (injuries || []).map(inj => ({
    ...inj,
    player_name: playerMap[inj.player_id] || "Unknown",
  }));

  return {
    players,
    teams,
    injuries: enrichedInjuries,
    monthly_trends: Object.entries(monthlyTrends)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count })),
    body_part_counts: Object.entries(bodyPartCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([part, count]) => ({ part, count })),
    severity_distribution: severityCounts,
    total: (injuries || []).length,
  };
}

// ===================== WELLNESS =====================
async function getWellnessData(players, playerIds) {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: checkins } = await supabaseAdmin
    .from("mf_wellness_checkins")
    .select("*")
    .in("player_id", playerIds)
    .gte("checkin_date", fourteenDaysAgo.toISOString().split("T")[0])
    .order("checkin_date", { ascending: true });

  // Build heatmap: players x days
  const dates = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const heatmap = players.map(player => {
    const playerCheckins = (checkins || []).filter(c => c.player_id === player.id);
    const checkinMap = {};
    playerCheckins.forEach(c => { checkinMap[c.checkin_date] = c; });

    const days = dates.map(date => {
      const c = checkinMap[date];
      return {
        date,
        readiness: c?.readiness_score ?? null,
        sleep: c?.sleep_quality ?? null,
        energy: c?.energy_level ?? null,
        mood: c?.mood ?? null,
        soreness: c?.muscle_soreness ?? null,
        stress: c?.stress ?? null,
      };
    });

    // Calculate 7-day average readiness
    const last7 = days.slice(-7);
    const readinessValues = last7.filter(d => d.readiness !== null).map(d => d.readiness);
    const avgReadiness = readinessValues.length > 0
      ? Math.round(readinessValues.reduce((s, v) => s + v, 0) / readinessValues.length)
      : null;

    // Check if deload recommended (avg readiness < 40 over last 3 days)
    const last3 = days.slice(-3);
    const last3Readiness = last3.filter(d => d.readiness !== null).map(d => d.readiness);
    const avg3 = last3Readiness.length > 0
      ? last3Readiness.reduce((s, v) => s + v, 0) / last3Readiness.length
      : null;
    const deloadRecommended = avg3 !== null && avg3 < 40;

    return {
      player_id: player.id,
      player_name: player.name,
      position: player.position,
      jersey_number: player.jersey_number,
      days,
      avg_readiness_7d: avgReadiness,
      deload_recommended: deloadRecommended,
    };
  });

  // Team wellness trends (daily averages)
  const dailyTrends = dates.map(date => {
    const dayCheckins = (checkins || []).filter(c => c.checkin_date === date);
    if (dayCheckins.length === 0) return { date, avg_readiness: null, avg_sleep: null, avg_energy: null, avg_mood: null, count: 0 };

    return {
      date,
      avg_readiness: Math.round(dayCheckins.reduce((s, c) => s + (c.readiness_score || 0), 0) / dayCheckins.length),
      avg_sleep: Math.round(dayCheckins.reduce((s, c) => s + (c.sleep_quality || 0), 0) / dayCheckins.length * 10) / 10,
      avg_energy: Math.round(dayCheckins.reduce((s, c) => s + (c.energy_level || 0), 0) / dayCheckins.length * 10) / 10,
      avg_mood: Math.round(dayCheckins.reduce((s, c) => s + (c.mood || 0), 0) / dayCheckins.length * 10) / 10,
      count: dayCheckins.length,
    };
  });

  // Deload alerts
  const deloadAlerts = heatmap.filter(p => p.deload_recommended);

  // Performance correlation: compare readiness with workout completion on same day
  // (for players who have both)
  const correlationData = [];
  for (const player of players) {
    const playerCheckins = (checkins || []).filter(c => c.player_id === player.id);
    for (const c of playerCheckins) {
      correlationData.push({
        player_name: player.name,
        date: c.checkin_date,
        readiness: c.readiness_score,
        sleep: c.sleep_quality,
        energy: c.energy_level,
        mood: c.mood,
      });
    }
  }

  return {
    players,
    heatmap,
    daily_trends: dailyTrends,
    deload_alerts: deloadAlerts,
    correlation: correlationData,
    dates,
  };
}

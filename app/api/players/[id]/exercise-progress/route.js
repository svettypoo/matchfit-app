import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exercise_id");
    const category = searchParams.get("category");
    const weeks = parseInt(searchParams.get("weeks") || "8");

    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - weeks * 7);
    const startDate = weeksAgo.toISOString().split("T")[0];

    // Get all completed workout IDs for this player in the period
    const { data: workouts } = await supabaseAdmin
      .from("mf_scheduled_workouts")
      .select("id, scheduled_date, xp_earned, completion_pct, rpe_reported, duration_minutes")
      .eq("player_id", id)
      .eq("status", "completed")
      .gte("scheduled_date", startDate)
      .order("scheduled_date", { ascending: true });

    if (!workouts || workouts.length === 0) {
      return NextResponse.json({
        exercise_progress: [],
        category_progress: [],
        overall_progress: [],
        exercises: [],
        categories: [],
      });
    }

    const workoutIds = workouts.map(w => w.id);

    // Get all exercise logs for these workouts
    let logQuery = supabaseAdmin
      .from("mf_exercise_logs")
      .select("*, mf_exercises(id, name, category, exercise_type, is_timed, default_weight_kg)")
      .in("workout_id", workoutIds)
      .eq("skipped", false)
      .order("workout_id");

    if (exerciseId) {
      logQuery = logQuery.eq("exercise_id", exerciseId);
    }

    const { data: logs } = await logQuery;

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        exercise_progress: [],
        category_progress: [],
        overall_progress: [],
        exercises: [],
        categories: [],
      });
    }

    // Filter by category if specified
    const filteredLogs = category
      ? logs.filter(l => l.mf_exercises?.category === category)
      : logs;

    // Build workout date lookup
    const workoutDateMap = {};
    workouts.forEach(w => { workoutDateMap[w.id] = w.scheduled_date; });

    // === Individual Exercise Progress ===
    // Group logs by exercise, then by date
    const exerciseGroups = {};
    filteredLogs.forEach(log => {
      const exId = log.exercise_id;
      if (!exerciseGroups[exId]) {
        exerciseGroups[exId] = {
          exercise: log.mf_exercises,
          entries: [],
        };
      }

      const date = workoutDateMap[log.workout_id];

      // Calculate max weight from weight_used array
      const weights = Array.isArray(log.weight_used) ? log.weight_used.filter(w => w != null) : [];
      const maxWeight = weights.length > 0 ? Math.max(...weights) : null;

      // Calculate total volume (sets * reps * weight)
      const reps = Array.isArray(log.completed_reps)
        ? log.completed_reps.reduce((s, r) => s + (r || 0), 0)
        : (log.completed_reps || 0);
      const totalVolume = maxWeight ? reps * maxWeight : reps;

      // Calculate avg reps per set
      const avgReps = Array.isArray(log.completed_reps) && log.completed_reps.length > 0
        ? Math.round(log.completed_reps.reduce((s, r) => s + (r || 0), 0) / log.completed_reps.length)
        : (log.completed_reps || 0);

      exerciseGroups[exId].entries.push({
        date,
        sets: log.completed_sets || log.prescribed_sets || 0,
        reps: avgReps,
        total_reps: reps,
        max_weight: maxWeight,
        total_volume: totalVolume,
        duration_sec: log.duration_sec,
        rpe: log.rpe_logged,
      });
    });

    const exerciseProgress = Object.values(exerciseGroups).map(group => ({
      exercise_id: group.exercise?.id,
      exercise_name: group.exercise?.name,
      category: group.exercise?.category,
      exercise_type: group.exercise?.exercise_type,
      is_timed: group.exercise?.is_timed,
      data_points: group.entries.sort((a, b) => a.date.localeCompare(b.date)),
      summary: {
        total_sessions: group.entries.length,
        latest_weight: group.entries[group.entries.length - 1]?.max_weight,
        first_weight: group.entries[0]?.max_weight,
        weight_change: group.entries.length >= 2 && group.entries[0].max_weight && group.entries[group.entries.length - 1].max_weight
          ? Math.round((group.entries[group.entries.length - 1].max_weight - group.entries[0].max_weight) * 10) / 10
          : null,
        latest_reps: group.entries[group.entries.length - 1]?.reps,
        best_volume: Math.max(...group.entries.map(e => e.total_volume)),
      },
    }));

    // === Category Progress ===
    // Group by category, calculate weekly volume totals
    const categoryData = {};
    filteredLogs.forEach(log => {
      const cat = log.mf_exercises?.category;
      if (!cat) return;
      if (!categoryData[cat]) categoryData[cat] = [];
      const date = workoutDateMap[log.workout_id];
      const weights = Array.isArray(log.weight_used) ? log.weight_used.filter(w => w != null) : [];
      const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
      const reps = Array.isArray(log.completed_reps)
        ? log.completed_reps.reduce((s, r) => s + (r || 0), 0)
        : (log.completed_reps || 0);
      categoryData[cat].push({ date, volume: maxWeight ? reps * maxWeight : reps, rpe: log.rpe_logged });
    });

    // Aggregate by week for categories
    const categoryProgress = Object.entries(categoryData).map(([cat, entries]) => {
      const weeklyData = {};
      entries.forEach(e => {
        const d = new Date(e.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay() + 1);
        const weekKey = weekStart.toISOString().split("T")[0];
        if (!weeklyData[weekKey]) weeklyData[weekKey] = { volume: 0, sessions: 0, rpe_sum: 0, rpe_count: 0 };
        weeklyData[weekKey].volume += e.volume;
        weeklyData[weekKey].sessions += 1;
        if (e.rpe) { weeklyData[weekKey].rpe_sum += e.rpe; weeklyData[weekKey].rpe_count += 1; }
      });

      return {
        category: cat,
        weekly: Object.entries(weeklyData)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([week, data]) => ({
            week,
            total_volume: Math.round(data.volume),
            sessions: data.sessions,
            avg_rpe: data.rpe_count > 0 ? Math.round(data.rpe_sum / data.rpe_count * 10) / 10 : null,
          })),
        total_volume: Math.round(entries.reduce((s, e) => s + e.volume, 0)),
        total_sessions: entries.length,
      };
    });

    // === Overall Fitness Progress ===
    // Weekly aggregation across all exercises
    const overallWeekly = {};
    workouts.forEach(w => {
      const d = new Date(w.scheduled_date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const weekKey = weekStart.toISOString().split("T")[0];
      if (!overallWeekly[weekKey]) overallWeekly[weekKey] = {
        workouts: 0, total_xp: 0, total_volume: 0,
        total_duration: 0, rpe_sum: 0, rpe_count: 0,
        completion_sum: 0,
      };
      overallWeekly[weekKey].workouts += 1;
      overallWeekly[weekKey].total_xp += w.xp_earned || 0;
      overallWeekly[weekKey].total_duration += w.duration_minutes || 0;
      if (w.rpe_reported) {
        overallWeekly[weekKey].rpe_sum += w.rpe_reported;
        overallWeekly[weekKey].rpe_count += 1;
      }
      overallWeekly[weekKey].completion_sum += w.completion_pct || 0;
    });

    // Add volume data from logs
    filteredLogs.forEach(log => {
      const date = workoutDateMap[log.workout_id];
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const weekKey = weekStart.toISOString().split("T")[0];
      if (overallWeekly[weekKey]) {
        const weights = Array.isArray(log.weight_used) ? log.weight_used.filter(w => w != null) : [];
        const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
        const reps = Array.isArray(log.completed_reps)
          ? log.completed_reps.reduce((s, r) => s + (r || 0), 0)
          : (log.completed_reps || 0);
        overallWeekly[weekKey].total_volume += maxWeight ? reps * maxWeight : reps;
      }
    });

    const overallProgress = Object.entries(overallWeekly)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, data]) => ({
        week,
        workouts: data.workouts,
        total_xp: data.total_xp,
        total_volume: Math.round(data.total_volume),
        total_duration: data.total_duration,
        avg_rpe: data.rpe_count > 0 ? Math.round(data.rpe_sum / data.rpe_count * 10) / 10 : null,
        avg_completion: data.workouts > 0 ? Math.round(data.completion_sum / data.workouts) : 0,
      }));

    // Unique exercises and categories for filter dropdowns
    const uniqueExercises = [...new Set(filteredLogs.map(l => l.exercise_id))].map(exId => {
      const log = filteredLogs.find(l => l.exercise_id === exId);
      return { id: exId, name: log?.mf_exercises?.name, category: log?.mf_exercises?.category };
    });

    const uniqueCategories = [...new Set(filteredLogs.map(l => l.mf_exercises?.category).filter(Boolean))];

    return NextResponse.json({
      exercise_progress: exerciseProgress,
      category_progress: categoryProgress,
      overall_progress: overallProgress,
      exercises: uniqueExercises,
      categories: uniqueCategories,
    });
  } catch (err) {
    console.error("GET /api/players/[id]/exercise-progress error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

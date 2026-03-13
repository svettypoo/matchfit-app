import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

/**
 * Determine maturity stage from offset value.
 */
function getMaturityStage(offset) {
  if (offset === null || offset === undefined) return "phv"; // default to around-PHV
  if (offset < -1) return "pre_phv";
  if (offset <= 1) return "phv";
  return "post_phv";
}

/**
 * Determine difficulty from fitness level.
 */
function difficultyFromFitness(fitnessLevel) {
  if (fitnessLevel === "advanced") return "advanced";
  if (fitnessLevel === "intermediate") return "intermediate";
  return "beginner";
}

/**
 * Build a periodized 4-week program structure based on player profile.
 * Uses exercise science principles:
 * - Progressive overload (weekly volume increase)
 * - Proper work:rest ratios
 * - Age-appropriate loading (maturity-safe exercises only)
 * - Phase-appropriate emphasis
 */
function buildProgramStructure(player, trainingDays) {
  const maturityStage = getMaturityStage(player.maturity_offset);
  const difficulty = difficultyFromFitness(player.fitness_level);

  // Map training days to day_of_week numbers
  const dayMap = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  const scheduledDays = (trainingDays || ["monday", "wednesday", "friday"])
    .map((d) => dayMap[d.toLowerCase()])
    .filter((d) => d !== undefined)
    .sort((a, b) => a - b);

  // Define session templates based on number of training days
  const numDays = scheduledDays.length;

  let sessionTypes;
  if (numDays <= 2) {
    sessionTypes = ["full_body", "full_body"];
  } else if (numDays === 3) {
    sessionTypes = ["strength_power", "speed_agility", "ball_work_recovery"];
  } else if (numDays === 4) {
    sessionTypes = ["strength", "speed_agility", "ball_work", "power_recovery"];
  } else {
    sessionTypes = [
      "strength", "speed", "ball_work", "agility_plyo", "recovery_flexibility",
    ];
  }

  // Build category requirements for each session type
  const sessionCategories = {
    full_body: {
      name: "Full Body Session",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "strength", count: 3 },
        { cat: "core", count: 2 },
        { cat: "ball_work", count: 2 },
        { cat: "recovery", count: 1 },
      ],
    },
    strength_power: {
      name: "Strength & Power",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "strength", count: 4 },
        { cat: "plyometrics", count: 2 },
        { cat: "core", count: 2 },
        { cat: "recovery", count: 1 },
      ],
    },
    strength: {
      name: "Strength Day",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "strength", count: 5 },
        { cat: "core", count: 2 },
        { cat: "recovery", count: 1 },
      ],
    },
    speed_agility: {
      name: "Speed & Agility",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "speed", count: 3 },
        { cat: "agility", count: 3 },
        { cat: "recovery", count: 1 },
      ],
    },
    speed: {
      name: "Speed Day",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "speed", count: 4 },
        { cat: "plyometrics", count: 2 },
        { cat: "recovery", count: 1 },
      ],
    },
    ball_work_recovery: {
      name: "Ball Work & Recovery",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "ball_work", count: 4 },
        { cat: "core", count: 1 },
        { cat: "recovery", count: 2 },
      ],
    },
    ball_work: {
      name: "Ball Mastery Day",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "ball_work", count: 5 },
        { cat: "agility", count: 1 },
        { cat: "recovery", count: 1 },
      ],
    },
    power_recovery: {
      name: "Power & Recovery",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "plyometrics", count: 3 },
        { cat: "flexibility", count: 2 },
        { cat: "recovery", count: 2 },
      ],
    },
    agility_plyo: {
      name: "Agility & Plyometrics",
      categories: [
        { cat: "flexibility", count: 1, role: "warmup" },
        { cat: "agility", count: 3 },
        { cat: "plyometrics", count: 2 },
        { cat: "core", count: 1 },
        { cat: "recovery", count: 1 },
      ],
    },
    recovery_flexibility: {
      name: "Recovery & Mobility",
      categories: [
        { cat: "flexibility", count: 3 },
        { cat: "recovery", count: 3 },
        { cat: "core", count: 1 },
      ],
    },
  };

  // Build days
  const days = scheduledDays.map((dayOfWeek, i) => {
    const sessionType = sessionTypes[i % sessionTypes.length];
    const template = sessionCategories[sessionType];
    return {
      day_of_week: dayOfWeek,
      name: template.name,
      session_type: sessionType,
      exercise_requirements: template.categories,
    };
  });

  return {
    maturityStage,
    difficulty,
    days,
    name: `${player.name}'s ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Program`,
    description: `Personalized 4-week ${difficulty} program for ${maturityStage.replace("_", "-")} athlete. ${numDays} sessions per week with progressive overload.`,
  };
}

export async function POST(request) {
  try {
    const { player_id } = await request.json();

    if (!player_id) {
      return NextResponse.json(
        { error: "player_id is required" },
        { status: 400 }
      );
    }

    // Fetch player profile
    const { data: player, error: playerError } = await supabaseAdmin
      .from("mf_players")
      .select("*")
      .eq("id", player_id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    if (!player.onboarding_complete) {
      return NextResponse.json(
        { error: "Player must complete onboarding before generating a program" },
        { status: 400 }
      );
    }

    // Get player's team to find coach_id
    let coach_id = null;
    if (player.team_id) {
      const { data: team } = await supabaseAdmin
        .from("mf_teams")
        .select("coach_id")
        .eq("id", player.team_id)
        .single();
      if (team) coach_id = team.coach_id;
    }

    // Build program structure
    const structure = buildProgramStructure(player, player.training_days);

    // Fetch suitable exercises filtered by maturity stage and difficulty
    const { data: allExercises, error: exError } = await supabaseAdmin
      .from("mf_exercises")
      .select("*")
      .contains("maturity_safe", [structure.maturityStage]);

    if (exError) {
      return NextResponse.json(
        { error: "Failed to fetch exercises" },
        { status: 500 }
      );
    }

    // Group exercises by category
    const exercisesByCategory = {};
    for (const ex of allExercises) {
      if (!exercisesByCategory[ex.category]) {
        exercisesByCategory[ex.category] = [];
      }
      exercisesByCategory[ex.category].push(ex);
    }

    // Filter by difficulty: beginner gets beginner only,
    // intermediate gets beginner + intermediate, advanced gets all
    function filterByDifficulty(exercises, targetDifficulty) {
      const levels = { beginner: 1, intermediate: 2, advanced: 3 };
      const maxLevel = levels[targetDifficulty] || 2;
      return exercises.filter((e) => (levels[e.difficulty] || 2) <= maxLevel);
    }

    // Select exercises for each day
    const programDays = structure.days.map((day) => {
      const exercises = [];
      const usedIds = new Set();

      for (const req of day.exercise_requirements) {
        const pool = filterByDifficulty(
          exercisesByCategory[req.cat] || [],
          structure.difficulty
        ).filter((e) => !usedIds.has(e.id));

        // Shuffle and pick the required count
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, req.count);

        for (const ex of selected) {
          usedIds.add(ex.id);

          // Progressive overload: base sets/reps with room to increase
          let sets = ex.default_sets || 3;
          let reps = ex.default_reps || null;
          let duration_sec = ex.default_duration_sec || null;
          let rest_sec = ex.default_rest_sec || 60;

          // Adjust for difficulty
          if (structure.difficulty === "beginner") {
            sets = Math.max(2, sets - 1);
            if (reps) reps = Math.max(6, reps - 2);
          } else if (structure.difficulty === "advanced") {
            sets = sets + 1;
            if (reps) reps = reps + 2;
          }

          exercises.push({
            exercise_id: ex.id,
            sets,
            reps,
            duration_sec,
            rest_sec,
            rpe_target: structure.difficulty === "beginner" ? 6 : structure.difficulty === "advanced" ? 8 : 7,
            notes: null,
          });
        }
      }

      return {
        day_of_week: day.day_of_week,
        name: day.name,
        exercises,
      };
    });

    // Create the program in the database
    const { data: program, error: progError } = await supabaseAdmin
      .from("mf_programs")
      .insert({
        coach_id,
        name: structure.name,
        description: structure.description,
        duration_weeks: 4,
        phase_type: "inseason",
        difficulty: structure.difficulty,
        is_template: false,
      })
      .select()
      .single();

    if (progError) {
      return NextResponse.json(
        { error: `Failed to create program: ${progError.message}` },
        { status: 500 }
      );
    }

    // Create program days and exercises
    for (let i = 0; i < programDays.length; i++) {
      const day = programDays[i];

      const { data: programDay, error: dayError } = await supabaseAdmin
        .from("mf_program_days")
        .insert({
          program_id: program.id,
          day_of_week: day.day_of_week,
          name: day.name,
          sort_order: i,
        })
        .select()
        .single();

      if (dayError) {
        // Cleanup
        await supabaseAdmin.from("mf_programs").delete().eq("id", program.id);
        return NextResponse.json(
          { error: `Failed to create program day: ${dayError.message}` },
          { status: 500 }
        );
      }

      if (day.exercises.length > 0) {
        const inserts = day.exercises.map((ex, j) => ({
          program_day_id: programDay.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          duration_sec: ex.duration_sec,
          rest_sec: ex.rest_sec,
          rpe_target: ex.rpe_target,
          notes: ex.notes,
          sort_order: j,
        }));

        const { error: exInsertError } = await supabaseAdmin
          .from("mf_program_exercises")
          .insert(inserts);

        if (exInsertError) {
          await supabaseAdmin.from("mf_programs").delete().eq("id", program.id);
          return NextResponse.json(
            { error: `Failed to create exercises: ${exInsertError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Fetch the complete program
    const { data: fullProgram } = await supabaseAdmin
      .from("mf_programs")
      .select(
        "*, mf_program_days(*, mf_program_exercises(*, mf_exercises(name, category, difficulty)))"
      )
      .eq("id", program.id)
      .single();

    return NextResponse.json({
      program: fullProgram,
      maturity_stage: structure.maturityStage,
      difficulty: structure.difficulty,
      sessions_per_week: programDays.length,
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/generate-program error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Calculate maturity offset (years from PHV) using the Mirwald equation.
 * Mirwald et al. (2002) — Predicting maturity from anthropometric measures.
 * For males: maturity_offset = -9.236 + (0.0002708 * leg_length * sitting_height)
 *            - (0.001663 * age * leg_length)
 *            + (0.007216 * age * sitting_height)
 *            + (0.02292 * (weight / height * 100))
 */
function calculateMaturityOffset(age, heightCm, weightKg, sittingHeightCm) {
  const legLength = heightCm - sittingHeightCm;
  const weightHeightRatio = (weightKg / heightCm) * 100;

  const offset =
    -9.236 +
    0.0002708 * legLength * sittingHeightCm -
    0.001663 * age * legLength +
    0.007216 * age * sittingHeightCm +
    0.02292 * weightHeightRatio;

  return Math.round(offset * 100) / 100;
}

/**
 * Simplified Khamis-Roche predicted adult height estimate.
 * Uses current height, weight, and mid-parent height.
 * This is a simplified version — actual K-R uses age-specific coefficients.
 * Estimate: predicted_height ≈ current_height + remaining_growth
 * where remaining_growth is estimated from maturity offset.
 */
function predictAdultHeight(
  heightCm,
  weightKg,
  maturityOffset,
  fatherHeightCm,
  motherHeightCm
) {
  // Mid-parent height (for boys: (father + mother + 13) / 2, simplified approach)
  const midParentHeight =
    fatherHeightCm && motherHeightCm
      ? (fatherHeightCm + motherHeightCm + 13) / 2
      : null;

  if (maturityOffset >= 0) {
    // Post-PHV: limited growth remaining
    // Approximate 2-3cm remaining growth per year before PHV
    const remainingGrowth = Math.max(0, (2 - maturityOffset) * 1.5);
    return Math.round((heightCm + remainingGrowth) * 10) / 10;
  }

  // Pre-PHV: use mid-parent height as anchor if available
  if (midParentHeight) {
    // Blend current trajectory with genetic potential
    const yearsToPhv = Math.abs(maturityOffset);
    // Average growth rate ~6cm/year pre-PHV, ~8cm/year around PHV
    const estimatedGrowth = yearsToPhv * 6 + 8; // growth through PHV
    const trajectoryEstimate = heightCm + estimatedGrowth;
    // Weight the genetic estimate more if further from PHV
    const geneticWeight = Math.min(0.6, yearsToPhv * 0.15);
    return Math.round(
      (trajectoryEstimate * (1 - geneticWeight) +
        midParentHeight * geneticWeight) *
        10
    ) / 10;
  }

  // Fallback without parent heights
  const yearsToPhv = Math.abs(maturityOffset);
  const estimatedGrowth = yearsToPhv * 6 + 8;
  return Math.round((heightCm + estimatedGrowth) * 10) / 10;
}

/**
 * Calculate decimal age from date of birth.
 */
function calculateAge(dob) {
  const birth = new Date(dob);
  const now = new Date();
  const diffMs = now - birth;
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      date_of_birth,
      gender,
      height_cm,
      weight_kg,
      sitting_height_cm,
      parent_height_father_cm,
      parent_height_mother_cm,
      tanner_stage,
      position,
      jersey_number,
      fitness_level,
      training_days,
      preferred_time,
      max_hours_per_day,
      primary_goal,
      dream_club,
      motivation,
      current_injuries,
      other_sports,
      yoyo_score,
      sprint_time,
      max_pushups,
      max_situps,
      units,
    } = body;

    // Validate required fields
    if (!date_of_birth || !height_cm || !weight_kg) {
      return NextResponse.json(
        { error: "date_of_birth, height_cm, and weight_kg are required" },
        { status: 400 }
      );
    }

    const age = calculateAge(date_of_birth);

    // Calculate maturity offset if sitting height is provided
    let maturity_offset = null;
    let predicted_adult_height_cm = null;

    if (sitting_height_cm) {
      maturity_offset = calculateMaturityOffset(
        age,
        height_cm,
        weight_kg,
        sitting_height_cm
      );

      predicted_adult_height_cm = predictAdultHeight(
        height_cm,
        weight_kg,
        maturity_offset,
        parent_height_father_cm,
        parent_height_mother_cm
      );
    }

    // Build update object
    const updates = {
      date_of_birth,
      gender: gender || null,
      height_cm,
      weight_kg,
      sitting_height_cm: sitting_height_cm || null,
      parent_height_father_cm: parent_height_father_cm || null,
      parent_height_mother_cm: parent_height_mother_cm || null,
      tanner_stage: tanner_stage || null,
      maturity_offset,
      predicted_adult_height_cm,
      position: position || null,
      jersey_number: jersey_number || null,
      fitness_level: fitness_level || "beginner",
      training_days: training_days || null,
      preferred_time: preferred_time || null,
      max_hours_per_day: max_hours_per_day || null,
      primary_goal: primary_goal || null,
      dream_club: dream_club || null,
      motivation: motivation || null,
      current_injuries: current_injuries || null,
      other_sports: other_sports || null,
      yoyo_score: yoyo_score || null,
      sprint_time: sprint_time || null,
      max_pushups: max_pushups || null,
      max_situps: max_situps || null,
      units: units || "metric",
      onboarding_complete: true,
    };

    const { data: player, error } = await supabaseAdmin
      .from("mf_players")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      player,
      maturity_analysis: {
        age_years: Math.round(age * 10) / 10,
        maturity_offset,
        maturity_stage:
          maturity_offset === null
            ? "unknown"
            : maturity_offset < -1
            ? "pre_phv"
            : maturity_offset <= 1
            ? "phv"
            : "post_phv",
        predicted_adult_height_cm,
      },
    });
  } catch (err) {
    console.error("POST /api/players/[id]/onboarding error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

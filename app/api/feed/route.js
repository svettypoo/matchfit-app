import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
const supabaseAdmin = getSupabaseAdmin();

// GET /api/feed?team_id=X&type=all|workouts|prs|announcements
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");
    const type = searchParams.get("type") || "all";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!team_id) {
      return NextResponse.json({ error: "team_id is required" }, { status: 400 });
    }

    const feedItems = [];

    // 1. Workout completions from mf_scheduled_workouts
    if (type === "all" || type === "workouts") {
      const { data: workouts } = await supabaseAdmin
        .from("mf_scheduled_workouts")
        .select("id, player_id, program_day_id, completed_at, duration_minutes, xp_earned, created_at")
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(30);

      if (workouts?.length) {
        // Get player info for these workouts
        const playerIds = [...new Set(workouts.map(w => w.player_id))];
        const { data: players } = await supabaseAdmin
          .from("mf_players")
          .select("id, name, team_id")
          .in("id", playerIds)
          .eq("team_id", team_id);

        const playerMap = {};
        (players || []).forEach(p => { playerMap[p.id] = p; });

        // Get program day names
        const dayIds = [...new Set(workouts.map(w => w.program_day_id).filter(Boolean))];
        let dayMap = {};
        if (dayIds.length) {
          const { data: days } = await supabaseAdmin
            .from("mf_program_days")
            .select("id, name")
            .in("id", dayIds);
          (days || []).forEach(d => { dayMap[d.id] = d.name; });
        }

        for (const w of workouts) {
          const player = playerMap[w.player_id];
          if (!player) continue;
          feedItems.push({
            id: `workout-${w.id}`,
            type: "workout",
            player_id: w.player_id,
            player_name: player.name,
            title: `${player.name} completed ${dayMap[w.program_day_id] || "a workout"}`,
            subtitle: `${w.duration_minutes || 0}min${w.xp_earned ? ` — +${w.xp_earned} XP` : ""}`,
            icon: "dumbbell",
            timestamp: w.completed_at,
            ref_id: w.id,
            ref_type: "workout",
          });
        }
      }
    }

    // 2. Personal records from mf_personal_records
    if (type === "all" || type === "prs") {
      const { data: prs } = await supabaseAdmin
        .from("mf_personal_records")
        .select("id, player_id, exercise_id, value, unit, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (prs?.length) {
        const playerIds = [...new Set(prs.map(p => p.player_id))];
        const exerciseIds = [...new Set(prs.map(p => p.exercise_id).filter(Boolean))];

        const { data: players } = await supabaseAdmin
          .from("mf_players")
          .select("id, name, team_id")
          .in("id", playerIds)
          .eq("team_id", team_id);
        const playerMap = {};
        (players || []).forEach(p => { playerMap[p.id] = p; });

        let exerciseMap = {};
        if (exerciseIds.length) {
          const { data: exercises } = await supabaseAdmin
            .from("mf_exercises")
            .select("id, name")
            .in("id", exerciseIds);
          (exercises || []).forEach(e => { exerciseMap[e.id] = e.name; });
        }

        for (const pr of prs) {
          const player = playerMap[pr.player_id];
          if (!player) continue;
          feedItems.push({
            id: `pr-${pr.id}`,
            type: "pr",
            player_id: pr.player_id,
            player_name: player.name,
            title: `${player.name} set a new PR on ${exerciseMap[pr.exercise_id] || "an exercise"}`,
            subtitle: `${pr.value}${pr.unit || "kg"}!`,
            icon: "trophy",
            timestamp: pr.created_at,
            ref_id: pr.id,
            ref_type: "pr",
          });
        }
      }
    }

    // 3. Badges earned from mf_player_badges
    if (type === "all") {
      const { data: earnedBadges } = await supabaseAdmin
        .from("mf_player_badges")
        .select("id, player_id, badge_id, earned_at")
        .order("earned_at", { ascending: false })
        .limit(20);

      if (earnedBadges?.length) {
        const playerIds = [...new Set(earnedBadges.map(b => b.player_id))];
        const badgeIds = [...new Set(earnedBadges.map(b => b.badge_id))];

        const { data: players } = await supabaseAdmin
          .from("mf_players")
          .select("id, name, team_id")
          .in("id", playerIds)
          .eq("team_id", team_id);
        const playerMap = {};
        (players || []).forEach(p => { playerMap[p.id] = p; });

        let badgeMap = {};
        if (badgeIds.length) {
          const { data: badges } = await supabaseAdmin
            .from("mf_badges")
            .select("id, name, icon")
            .in("id", badgeIds);
          (badges || []).forEach(b => { badgeMap[b.id] = b; });
        }

        for (const eb of earnedBadges) {
          const player = playerMap[eb.player_id];
          if (!player) continue;
          const badge = badgeMap[eb.badge_id] || {};
          feedItems.push({
            id: `badge-${eb.id}`,
            type: "badge",
            player_id: eb.player_id,
            player_name: player.name,
            title: `${player.name} earned '${badge.name || "a badge"}'`,
            subtitle: badge.icon || "medal",
            icon: "badge",
            timestamp: eb.earned_at,
            ref_id: eb.id,
            ref_type: "badge",
          });
        }
      }
    }

    // 4. Announcements + challenges from mf_feed_posts
    if (type === "all" || type === "announcements") {
      const { data: posts } = await supabaseAdmin
        .from("mf_feed_posts")
        .select("*")
        .eq("team_id", team_id)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);

      if (posts?.length) {
        for (const post of posts) {
          feedItems.push({
            id: `post-${post.id}`,
            type: post.post_type || "announcement",
            player_id: post.author_id,
            player_name: post.author_name || "Coach",
            title: post.title,
            subtitle: post.body,
            image_url: post.image_url,
            icon: post.post_type === "challenge" ? "fire" : "megaphone",
            timestamp: post.created_at,
            pinned: post.pinned || false,
            ref_id: post.id,
            ref_type: "post",
          });
        }
      }
    }

    // 5. Active challenges from mf_challenges
    if (type === "all") {
      const { data: challenges } = await supabaseAdmin
        .from("mf_challenges")
        .select("*")
        .eq("team_id", team_id)
        .eq("status", "active")
        .order("end_date", { ascending: true })
        .limit(10);

      if (challenges?.length) {
        for (const ch of challenges) {
          const daysLeft = Math.max(0, Math.ceil((new Date(ch.end_date) - new Date()) / 86400000));
          feedItems.push({
            id: `challenge-${ch.id}`,
            type: "challenge",
            player_id: null,
            player_name: "Team Challenge",
            title: ch.name,
            subtitle: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left! ${ch.description || ""}`.trim(),
            icon: "fire",
            timestamp: ch.created_at,
            pinned: true,
            ref_id: ch.id,
            ref_type: "challenge",
            progress_pct: ch.target_value > 0
              ? Math.min(100, Math.round(((ch.current_value || 0) / ch.target_value) * 100))
              : 0,
          });
        }
      }
    }

    // Sort: pinned first, then by timestamp desc
    feedItems.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Now fetch reactions and comments for all items
    const refIds = feedItems.map(f => f.ref_id).filter(Boolean);
    let reactionsMap = {};
    let commentsMap = {};

    if (refIds.length) {
      // Reactions
      const { data: reactions } = await supabaseAdmin
        .from("mf_feed_reactions")
        .select("ref_id, ref_type, player_id")
        .in("ref_id", refIds.map(String));

      if (reactions?.length) {
        for (const r of reactions) {
          const key = `${r.ref_type}-${r.ref_id}`;
          if (!reactionsMap[key]) reactionsMap[key] = [];
          reactionsMap[key].push(r.player_id);
        }
      }

      // Comments count
      const { data: comments } = await supabaseAdmin
        .from("mf_feed_comments")
        .select("ref_id, ref_type, id")
        .in("ref_id", refIds.map(String));

      if (comments?.length) {
        for (const c of comments) {
          const key = `${c.ref_type}-${c.ref_id}`;
          commentsMap[key] = (commentsMap[key] || 0) + 1;
        }
      }
    }

    // Attach reactions + comment counts
    const enriched = feedItems.map(item => ({
      ...item,
      reactions: reactionsMap[`${item.ref_type}-${item.ref_id}`] || [],
      reaction_count: (reactionsMap[`${item.ref_type}-${item.ref_id}`] || []).length,
      comment_count: commentsMap[`${item.ref_type}-${item.ref_id}`] || 0,
    }));

    const paginated = enriched.slice(offset, offset + limit);

    return NextResponse.json({
      items: paginated,
      total: enriched.length,
      has_more: offset + limit < enriched.length,
    });
  } catch (err) {
    console.error("GET /api/feed error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/feed — create an announcement/post (coach)
export async function POST(request) {
  try {
    const body = await request.json();
    const { team_id, author_id, author_name, title, body: postBody, image_url, post_type, pinned } = body;

    if (!team_id || !author_id || !title) {
      return NextResponse.json({ error: "team_id, author_id, and title are required" }, { status: 400 });
    }

    const { data: post, error } = await supabaseAdmin
      .from("mf_feed_posts")
      .insert({
        team_id,
        author_id,
        author_name: author_name || "Coach",
        title,
        body: postBody || null,
        image_url: image_url || null,
        post_type: post_type || "announcement",
        pinned: pinned || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("POST /api/feed error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/feed — pin/unpin a post
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, pinned } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates = {};
    if (pinned !== undefined) updates.pinned = pinned;

    const { data, error } = await supabaseAdmin
      .from("mf_feed_posts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/feed error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

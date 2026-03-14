const https = require('https');

const content = [
  {tag:'h3',children:['MatchFit \u2014 Full Implementation Plan']},
  {tag:'p',children:['Based on UX Designer Review + Product Manager Review | Generated: 2026-03-13']},

  {tag:'h3',children:['Epic 1: Workout Execution (P0 \u2014 CRITICAL)']},
  {tag:'p',children:['Both reviewers flagged this as #1 missing feature. Athletes spend 90% of their time here.']},
  {tag:'h4',children:['US-1.1: Per-Set Logging UI']},
  {tag:'p',children:['As an athlete, I want large tappable buttons for logging weight/reps/RPE per set so that I can track quickly in the gym. Full-screen mobile-first view, 48px tap targets, RPE selector, previous set data visible.']},
  {tag:'h4',children:['US-1.2: Rest Timer']},
  {tag:'p',children:['Integrated rest timer with configurable defaults, visual countdown, audio/vibration alerts, skip/extend.']},
  {tag:'h4',children:['US-1.3: Exercise Instructions During Workout']},
  {tag:'p',children:['Info icon overlay with video demo + coaching tips without navigating away.']},
  {tag:'h4',children:['US-1.4: Superset & Circuit Support']},
  {tag:'p',children:['Visual grouping, flow through all exercises before rest.']},
  {tag:'h4',children:['US-1.5: Exercise Swap']},
  {tag:'p',children:['Swap for alternative from same category. Logs swap for coach.']},
  {tag:'h4',children:['US-1.6: Workout Notes']},
  {tag:'p',children:['Per-exercise and overall notes, visible to coach.']},

  {tag:'h3',children:['Epic 2: Program Builder (P0 \u2014 CRITICAL)']},
  {tag:'p',children:['Table-stakes for coaches. Without this, no coach will pay.']},
  {tag:'h4',children:['US-2.1: Drag-and-Drop Program Designer']},
  {tag:'p',children:['Week/day grid, drag exercises from library, set targets, copy/paste days/weeks.']},
  {tag:'h4',children:['US-2.2: Program Templates']},
  {tag:'p',children:['Save/reuse templates, pre-built starters.']},
  {tag:'h4',children:['US-2.3: Periodization Tools']},
  {tag:'p',children:['Auto-progression, deload weeks, block periodization, intensity timeline.']},
  {tag:'h4',children:['US-2.4: Program Assignment']},
  {tag:'p',children:['Assign to individual/team, set start date, bulk assign, individualization.']},
  {tag:'h4',children:['US-2.5: Custom Exercise Upload']},
  {tag:'p',children:['Coach uploads exercises with video + instructions. Private to that coach.']},

  {tag:'h3',children:['Epic 3: Onboarding (P0 \u2014 CRITICAL)']},
  {tag:'h4',children:['US-3.1: Coach Wizard']},
  {tag:'p',children:['Create team \u2192 Invite athletes \u2192 Choose program \u2192 Assign. Progress bar, skip option.']},
  {tag:'h4',children:['US-3.2: Athlete Wizard']},
  {tag:'p',children:['Join team \u2192 Set goals \u2192 Wellness check-in \u2192 First workout. Dashboard tooltips.']},
  {tag:'h4',children:['US-3.3: Team Invite System']},
  {tag:'p',children:['Team codes, QR, email deep links, CSV bulk import.']},
  {tag:'h4',children:['US-3.4: Empty States']},
  {tag:'p',children:['Replace "0 exercises" with contextual messages. Rest day, no coach, no program messaging.']},

  {tag:'h3',children:['Epic 4: Advanced Coach Analytics (P1 \u2014 HIGH)']},
  {tag:'p',children:['"This is what coaches pay for." \u2014 Product Manager']},
  {tag:'h4',children:['US-4.1: Load Management (ACWR)']},
  {tag:'p',children:['7d acute / 28d chronic ratio. Color zones. Red zone alerts.']},
  {tag:'h4',children:['US-4.2: 1RM Progression']},
  {tag:'p',children:['Auto-calculate e1RM (Epley/Brzycki). Historical charts. PR detection.']},
  {tag:'h4',children:['US-4.3: Injury Tracking']},
  {tag:'p',children:['Body map, severity, mechanism, history timeline, team trends.']},
  {tag:'h4',children:['US-4.4: Wellness-Performance Correlation']},
  {tag:'p',children:['Overlay wellness on performance. Readiness recommendations. Alerts.']},
  {tag:'h4',children:['US-4.5: Custom Reports']},
  {tag:'p',children:['Select metrics + period + athletes. Export PDF. Team branding.']},

  {tag:'h3',children:['Epic 5: Social & Community (P1 \u2014 HIGH)']},
  {tag:'h4',children:['US-5.1: Team Feed']},
  {tag:'p',children:['Workout completions, PRs, badges, announcements. Like/comment reactions.']},
  {tag:'h4',children:['US-5.2: Team Challenges']},
  {tag:'p',children:['Coach creates challenges. Live leaderboard. Auto-track. Winner badges.']},
  {tag:'h4',children:['US-5.3: Athlete Messaging']},
  {tag:'p',children:['Direct + group chats between team members.']},
  {tag:'h4',children:['US-5.4: Shareable Achievements']},
  {tag:'p',children:['Share PRs/badges to social media via branded image cards.']},

  {tag:'h3',children:['Epic 6: Mobile Optimization (P1)']},
  {tag:'h4',children:['US-6.1: Responsive Coach Dashboard \u2014 hamburger nav, stacking cards, touch charts.']},
  {tag:'h4',children:['US-6.2: Mobile Workout \u2014 swipe gestures, auto-lock, offline sync.']},
  {tag:'h4',children:['US-6.3: PWA \u2014 service worker, manifest, push notifications, Add to Home Screen.']},

  {tag:'h3',children:['Epic 7: Gamification Depth (P1)']},
  {tag:'h4',children:['US-7.1: XP Rewards \u2014 milestone unlocks (themes, avatars, badges).']},
  {tag:'h4',children:['US-7.2: Enhanced Badges \u2014 gallery, categories, rarity, showcase on profile.']},
  {tag:'h4',children:['US-7.3: Level-Up Celebration \u2014 confetti, sound, share button.']},
  {tag:'h4',children:['US-7.4: Streak Protection \u2014 1 free freeze/month, grace period.']},
  {tag:'h4',children:['US-7.5: Coach Gamification \u2014 XP multipliers, custom badges.']},

  {tag:'h3',children:['Epic 8: Exercise Library (P1)']},
  {tag:'h4',children:['US-8.1: Video Demos \u2014 auto-play loop, multiple angles, 20+ exercises.']},
  {tag:'h4',children:['US-8.2: Advanced Search \u2014 auto-suggest, similar exercises, multi-filter.']},

  {tag:'h3',children:['Epic 9: Login Page (P2)']},
  {tag:'h4',children:['US-9.1: Compelling Landing \u2014 feature highlights, social proof, coach/athlete CTAs.']},

  {tag:'h3',children:['Epic 10: Notifications (P2)']},
  {tag:'h4',children:['US-10.1: Smart Notifications \u2014 workout reminders, streak warnings, PR celebrations.']},
  {tag:'h4',children:['US-10.2: Coach Alerts \u2014 configurable thresholds, one-click actions, weekly summary.']},

  {tag:'h3',children:['Epic 11: UI Polish (P2)']},
  {tag:'h4',children:['US-11.1: Chart Colors \u2014 remove purple, green/teal/grey palette.']},
  {tag:'h4',children:['US-11.2: Nav Labels \u2014 text below icons, replace lightning bolt.']},
  {tag:'h4',children:['US-11.3: Chart Labels \u2014 abbreviated numbers, clear legends.']},

  {tag:'h3',children:['Epic 12: Monetization (P2)']},
  {tag:'h4',children:['US-12.1: Tiered Pricing \u2014 Free / Pro $49 / Team $99 / Enterprise.']},
  {tag:'h4',children:['US-12.2: Billing \u2014 Stripe, plan management, invoices, free trial.']},

  {tag:'h3',children:['Implementation Phases']},

  {tag:'h4',children:['Phase 1: Foundation (Weeks 1-4) \u2014 57 pts']},
  {tag:'p',children:['Make the app usable for real coaches and athletes']},
  {tag:'ul',children:[
    {tag:'li',children:['Wk 1-2: Program Builder (US-2.1, US-2.4) \u2014 21 pts']},
    {tag:'li',children:['Wk 2-3: Workout Execution (US-1.1, US-1.2, US-1.3) \u2014 18 pts']},
    {tag:'li',children:['Wk 3-4: Onboarding (US-3.1, US-3.2, US-3.4) \u2014 13 pts']},
    {tag:'li',children:['Wk 4: UI Polish (US-11.1, US-11.2, US-11.3) \u2014 5 pts']},
  ]},

  {tag:'h4',children:['Phase 2: Engagement (Weeks 5-8) \u2014 52 pts']},
  {tag:'p',children:['Give users reasons to come back every day']},
  {tag:'ul',children:[
    {tag:'li',children:['Wk 5: Gamification (US-7.1-7.4) \u2014 13 pts']},
    {tag:'li',children:['Wk 5-6: Social (US-5.1, US-5.2) \u2014 16 pts']},
    {tag:'li',children:['Wk 6-7: Exercise Library (US-8.1, US-8.2) \u2014 10 pts']},
    {tag:'li',children:['Wk 7-8: Notifications (US-10.1, US-10.2) \u2014 13 pts']},
  ]},

  {tag:'h4',children:['Phase 3: Intelligence (Weeks 9-12) \u2014 55 pts']},
  {tag:'p',children:['Data-driven coaching that justifies premium pricing']},
  {tag:'ul',children:[
    {tag:'li',children:['Wk 9-10: Analytics (US-4.1-4.3) \u2014 21 pts']},
    {tag:'li',children:['Wk 10-11: Analytics (US-4.4, US-4.5) \u2014 13 pts']},
    {tag:'li',children:['Wk 11: Landing Page (US-9.1) \u2014 5 pts']},
    {tag:'li',children:['Wk 12: Mobile/PWA (US-6.1-6.3) \u2014 16 pts']},
  ]},

  {tag:'h4',children:['Phase 4: Monetization (Weeks 13-14) \u2014 31 pts']},
  {tag:'p',children:['Revenue-ready platform']},
  {tag:'ul',children:[
    {tag:'li',children:['Wk 13: Billing + Pricing (US-12.1, US-12.2) \u2014 13 pts']},
    {tag:'li',children:['Wk 14: Templates, Periodization, Coach Tools \u2014 18 pts']},
  ]},

  {tag:'h3',children:['Summary']},
  {tag:'ul',children:[
    {tag:'li',children:['12 Epics | 40 User Stories | ~195 Story Points']},
    {tag:'li',children:['P0 Critical: 15 stories (Workout, Program Builder, Onboarding)']},
    {tag:'li',children:['P1 High: 16 stories (Analytics, Social, Mobile, Gamification, Exercises)']},
    {tag:'li',children:['P2 Medium: 9 stories (Landing, Notifications, UI Polish, Monetization)']},
    {tag:'li',children:['Estimated Duration: 14 weeks']},
  ]},

  {tag:'h4',children:['Key Dependencies']},
  {tag:'ol',children:[
    {tag:'li',children:['Program Builder first \u2014 workout execution and onboarding depend on it']},
    {tag:'li',children:['Workout Execution before Analytics \u2014 analytics need real data']},
    {tag:'li',children:['Notifications after Social \u2014 feed notifications depend on feed']},
    {tag:'li',children:['Monetization last \u2014 need features to justify pricing']},
  ]},
];

const body = JSON.stringify({
  access_token: '5a0e2b453dfe6ccf5427410d4810d2ead6544f8c34dc3c0fb71b12d4c397',
  title: 'MatchFit \u2014 Implementation Plan (40 User Stories)',
  author_name: 'Svet Pargov',
  content: content
});

const req = https.request('https://api.telegra.ph/createPage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const j = JSON.parse(d);
    if (j.ok) console.log('URL:', j.result.url);
    else console.log('ERROR:', JSON.stringify(j));
  });
});
req.write(body);
req.end();

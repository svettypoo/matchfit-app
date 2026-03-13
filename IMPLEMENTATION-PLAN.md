# MatchFit — Full Implementation Plan
## Based on UX Designer Review + Product Manager Review

> Generated: 2026-03-13
> Sources: gemini-review.txt (UX Designer), chatgpt-review.txt (Product Manager)

---

## Epic 1: Workout Execution Experience (P0 — CRITICAL)
*Both reviewers flagged this as the #1 missing feature. Athletes spend 90% of their time here.*

### US-1.1: Per-Set Logging UI
**As an** athlete, **I want** large, tappable buttons for logging weight/reps/RPE per set **so that** I can track my workout quickly without fumbling with small inputs in the gym.

**Acceptance Criteria:**
- [ ] Full-screen workout execution view (mobile-first)
- [ ] Current exercise name, set number, and target reps/weight shown prominently
- [ ] Large numeric inputs for weight and reps (min 48px tap targets)
- [ ] RPE selector (1-10 scale, optional)
- [ ] "Complete Set" button advances to next set
- [ ] Previous set data visible for reference
- [ ] Keyboard auto-opens on weight/reps fields

### US-1.2: Rest Timer
**As an** athlete, **I want** an integrated rest timer between sets **so that** I can maintain proper recovery intervals without needing a separate app.

**Acceptance Criteria:**
- [ ] Auto-starts after completing a set
- [ ] Configurable default rest time per exercise (set by coach or athlete)
- [ ] Visual countdown with audio/vibration alert when time's up
- [ ] Skip/extend buttons

### US-1.3: Exercise Instructions During Workout
**As an** athlete, **I want** quick access to exercise video demos and coaching tips during my workout **so that** I maintain proper form.

**Acceptance Criteria:**
- [ ] "Info" icon on each exercise during workout
- [ ] Opens overlay with video demo, instructions, coaching tips, muscle groups
- [ ] Does not navigate away from workout screen
- [ ] Pulls from exercise library data

### US-1.4: Superset & Circuit Support
**As an** athlete, **I want** to log supersets and circuits **so that** my workout structure matches what my coach programmed.

**Acceptance Criteria:**
- [ ] Visual grouping of exercises in a superset/circuit
- [ ] Flow moves through all exercises in group before rest
- [ ] Coach can create supersets in program builder

### US-1.5: Exercise Swap
**As an** athlete, **I want** to swap an exercise for an alternative during my workout **so that** I can work around equipment availability or minor injuries.

**Acceptance Criteria:**
- [ ] "Swap" button on each exercise
- [ ] Shows alternatives from same category/muscle group
- [ ] Logs the swap for coach visibility
- [ ] Coach can pre-set allowed substitutions

### US-1.6: Workout Notes
**As an** athlete, **I want** to add notes to individual exercises or the overall workout **so that** I can communicate context to my coach (e.g., "shoulder felt tight").

**Acceptance Criteria:**
- [ ] Per-exercise note field (optional, collapsible)
- [ ] Overall workout note on completion screen
- [ ] Notes visible to coach on player progress view

---

## Epic 2: Program Builder (P0 — CRITICAL)
*Both reviewers: table-stakes for coaches. Without this, no coach will pay.*

### US-2.1: Drag-and-Drop Program Designer
**As a** coach, **I want** a visual drag-and-drop interface to design multi-week training programs **so that** I can build periodized plans efficiently.

**Acceptance Criteria:**
- [ ] Week/day grid layout
- [ ] Drag exercises from library into day slots
- [ ] Set target sets/reps/weight/RPE per exercise
- [ ] Reorder exercises within a day
- [ ] Copy/paste days or weeks
- [ ] Program name, description, duration (weeks), difficulty

### US-2.2: Program Templates
**As a** coach, **I want** to save and reuse program templates **so that** I don't rebuild common programs from scratch.

**Acceptance Criteria:**
- [ ] "Save as Template" on any program
- [ ] Template library with search/filter
- [ ] "Use Template" creates new program from template
- [ ] Pre-built starter templates (e.g., "4-Week Strength", "Pre-Season Conditioning")

### US-2.3: Periodization Tools
**As a** coach, **I want** to set progressive overload rules (% increase per week, deload weeks) **so that** programs auto-progress without manual edits each week.

**Acceptance Criteria:**
- [ ] Auto-progression: increase weight by X% or Y kg per week
- [ ] Deload week toggle (reduce volume/intensity by configurable %)
- [ ] Block periodization view (accumulation → transmutation → realization)
- [ ] Visual timeline of intensity across program

### US-2.4: Program Assignment
**As a** coach, **I want** to assign programs to individual athletes or entire teams **so that** everyone gets their scheduled workouts automatically.

**Acceptance Criteria:**
- [ ] Assign to individual player or team
- [ ] Set start date
- [ ] Athletes see assigned workouts on their calendar/dashboard
- [ ] Bulk assign to multiple players
- [ ] Option to individualize (modify for specific athlete)

### US-2.5: Custom Exercise Upload
**As a** coach, **I want** to upload my own exercises with videos and instructions **so that** my programs include sport-specific or proprietary drills.

**Acceptance Criteria:**
- [ ] "Create Custom Exercise" form
- [ ] Video upload (or YouTube/Vimeo URL)
- [ ] Custom instructions, coaching tips, muscle groups, equipment
- [ ] Custom exercises appear in exercise library for that coach only
- [ ] Can be used in programs like any other exercise

---

## Epic 3: Onboarding Flows (P0 — CRITICAL)
*Both reviewers: high friction = low activation = high churn.*

### US-3.1: Coach Getting-Started Wizard
**As a** new coach, **I want** a step-by-step setup wizard **so that** I can create my first team, invite athletes, and assign a program within 10 minutes.

**Acceptance Criteria:**
- [ ] Triggered on first login (no prior teams)
- [ ] Step 1: Create your team (name, sport, season)
- [ ] Step 2: Invite athletes (email, team code, or bulk CSV import)
- [ ] Step 3: Choose or create a program
- [ ] Step 4: Assign program to team
- [ ] Progress bar showing completion
- [ ] Skip option with "Resume later" reminder

### US-3.2: Athlete Getting-Started Wizard
**As a** new athlete, **I want** a guided setup **so that** I understand my dashboard, connect with my coach, and complete my first workout.

**Acceptance Criteria:**
- [ ] Triggered on first login
- [ ] Step 1: Join a team (enter team code or accept invite)
- [ ] Step 2: Set your goals (strength, speed, endurance, etc.)
- [ ] Step 3: Complete wellness check-in
- [ ] Step 4: Start your first workout (or tour of dashboard if none assigned)
- [ ] Tooltips/hotspots on key dashboard elements

### US-3.3: Team Invite System
**As a** coach, **I want** multiple ways to invite athletes (email, shareable team code, QR code, bulk import) **so that** onboarding a full roster is fast.

**Acceptance Criteria:**
- [ ] Unique team join code (6-character alphanumeric)
- [ ] QR code that opens app with team code pre-filled
- [ ] Email invite with deep link
- [ ] CSV bulk import (name, email, position)
- [ ] Pending invites list with resend/revoke

### US-3.4: Empty State Improvements
**As an** athlete, **I want** helpful empty states instead of "0 exercises" **so that** I know what to do next when no workout is assigned.

**Acceptance Criteria:**
- [ ] "Today's Workout: 0 exercises" replaced with contextual message
- [ ] If no coach: "Join a team to get workouts assigned"
- [ ] If coach but no program: "Your coach hasn't assigned a workout yet — check back soon!"
- [ ] If rest day: "Rest day! Recovery is part of the process."
- [ ] Coach dashboard "Needs Attention" empty state: celebrate team success

---

## Epic 4: Advanced Coach Analytics (P1 — HIGH)
*PM review: "This is what coaches pay for." UX review: "Deeper insights needed."*

### US-4.1: Load Management Dashboard
**As a** coach, **I want** acute-to-chronic workload ratio (ACWR) visualization per athlete **so that** I can identify injury risk and adjust training loads.

**Acceptance Criteria:**
- [ ] ACWR calculation (7-day acute / 28-day chronic rolling average)
- [ ] Color-coded zones: green (0.8-1.3), amber (1.3-1.5), red (>1.5 or <0.8)
- [ ] Per-athlete and team-average views
- [ ] Trend line over time
- [ ] Alert when athlete enters red zone

### US-4.2: 1RM Progression Tracking
**As a** coach, **I want** estimated 1RM progression for all key lifts per athlete **so that** I can measure true strength gains over time.

**Acceptance Criteria:**
- [ ] Auto-calculate e1RM from logged sets (Epley/Brzycki formula)
- [ ] Historical 1RM chart per exercise per athlete
- [ ] PR detection and highlighting
- [ ] Compare against team averages

### US-4.3: Injury Tracking
**As a** coach, **I want** to log and track injuries (body part, severity, mechanism, duration) **so that** I can identify patterns and prevent recurrence.

**Acceptance Criteria:**
- [ ] "Log Injury" form on player profile
- [ ] Body part selector (visual body map)
- [ ] Severity scale (1-5)
- [ ] Mechanism/notes field
- [ ] Injury history timeline
- [ ] Team-wide injury dashboard (trends, recurrence rates)

### US-4.4: Wellness-Performance Correlation
**As a** coach, **I want** to see how wellness scores correlate with workout performance **so that** I can make data-driven decisions about deloading or pushing athletes.

**Acceptance Criteria:**
- [ ] Overlay wellness score on performance charts
- [ ] "Readiness" recommendation engine: "Low readiness — consider deloading"
- [ ] Correlation analysis (e.g., poor sleep → decreased volume)
- [ ] Actionable alerts on coach dashboard

### US-4.5: Custom Report Builder
**As a** coach, **I want** to generate reports for athletic directors, parents, or stakeholders **so that** I can justify program decisions with data.

**Acceptance Criteria:**
- [ ] Select metrics (compliance, volume, 1RM, wellness, injuries)
- [ ] Select time period and athletes/team
- [ ] Export as PDF or shareable link
- [ ] Branded with team/organization logo

---

## Epic 5: Social & Community Features (P1 — HIGH)
*PM review: "TrainHeroic's team feed is a game-changer." UX review: "Social features barely realized."*

### US-5.1: Dynamic Team Feed
**As an** athlete, **I want** a team activity feed **so that** I can see teammates' PRs, cheer them on, and feel part of a team even when training alone.

**Acceptance Criteria:**
- [ ] Central feed showing: workout completions, PRs, badges earned, coach announcements
- [ ] Like/cheer reactions on feed items
- [ ] Comment on teammates' activities
- [ ] Coach can post announcements, tips, or videos to feed
- [ ] Filterable by team member

### US-5.2: Team Challenges
**As a** coach, **I want** to create team challenges (e.g., "Most Pull-ups in 30 Days") **so that** I can drive specific behaviors through friendly competition.

**Acceptance Criteria:**
- [ ] Create challenge: name, metric, duration, eligible exercises
- [ ] Live leaderboard during challenge
- [ ] Auto-track from logged workouts
- [ ] Winner announcement and badge award
- [ ] Challenge history

### US-5.3: Athlete-to-Athlete Messaging
**As an** athlete, **I want** to message teammates directly **so that** I can coordinate training, ask questions, or motivate each other.

**Acceptance Criteria:**
- [ ] Direct messages between team members
- [ ] Small group chats
- [ ] Push notification for new messages

### US-5.4: Shareable Achievements
**As an** athlete, **I want** to share my PRs and badges to social media **so that** I can celebrate wins and introduce friends to MatchFit.

**Acceptance Criteria:**
- [ ] "Share" button on PR notifications and badge earn screens
- [ ] Generates branded image card with achievement details
- [ ] Share to Instagram Stories, Twitter, or copy link
- [ ] Referral tracking (optional)

---

## Epic 6: Mobile Optimization (P1 — HIGH)
*PM review: "Athletes are in the gym with their phones. These screens scream desktop."*

### US-6.1: Responsive Coach Dashboard
**As a** coach, **I want** the dashboard to work well on tablet and phone **so that** I can check team status on the go.

**Acceptance Criteria:**
- [ ] Sidebar collapses to hamburger menu on < 768px
- [ ] Cards stack vertically on mobile
- [ ] Charts are touch-friendly (pinch-zoom, horizontal scroll)
- [ ] Critical actions (message athlete, view alerts) accessible within 2 taps

### US-6.2: Mobile-First Workout Execution
**As an** athlete, **I want** the workout screen designed for one-handed phone use **so that** I can log sets between exercises without putting my phone down.

**Acceptance Criteria:**
- [ ] Min 48px tap targets for all interactive elements
- [ ] Swipe gestures (swipe right = complete set, swipe up = next exercise)
- [ ] Auto-lock prevention during active workout
- [ ] Works offline with sync when connection returns

### US-6.3: Progressive Web App (PWA)
**As an** athlete, **I want** to install MatchFit on my phone's home screen **so that** it feels like a native app with offline support.

**Acceptance Criteria:**
- [ ] Service worker for offline workout access
- [ ] App manifest with icons
- [ ] "Add to Home Screen" prompt
- [ ] Push notifications via web push API
- [ ] Offline workout logging with background sync

---

## Epic 7: Gamification Depth (P1 — HIGH)
*Both reviewers: "XP is just a number without meaning."*

### US-7.1: XP Rewards & Unlocks
**As an** athlete, **I want** XP to unlock cosmetic rewards (themes, avatar items, profile badges) **so that** leveling up feels meaningful.

**Acceptance Criteria:**
- [ ] XP milestone rewards (every 500 XP or per level)
- [ ] Unlockable profile themes/colors
- [ ] Unlockable avatar frames or icons
- [ ] "Rewards" page showing earned and upcoming unlocks

### US-7.2: Enhanced Badge System
**As an** athlete, **I want** a rich badge collection with categories and rarity levels **so that** earning badges feels like real achievements.

**Acceptance Criteria:**
- [ ] Badge gallery page with earned/locked states
- [ ] Categories: Consistency, Strength, Social, Milestones
- [ ] Rarity levels: Common, Rare, Epic, Legendary
- [ ] Badge detail: how to earn, date earned, % of users who have it
- [ ] Showcase up to 3 badges on profile

### US-7.3: Level-Up Celebration
**As an** athlete, **I want** an exciting animation when I level up **so that** the moment feels rewarding and worth sharing.

**Acceptance Criteria:**
- [ ] Full-screen celebration overlay on level up
- [ ] Confetti/particle animation
- [ ] Sound effect (optional, respects mute)
- [ ] Shows new level, rewards unlocked, and "Share" button
- [ ] Brief animation (< 3 seconds, skippable)

### US-7.4: Streak Protection
**As an** athlete, **I want** a streak freeze option **so that** an illness or rest day doesn't destroy weeks of consistency.

**Acceptance Criteria:**
- [ ] 1 free streak freeze per month
- [ ] Additional freezes purchasable with XP
- [ ] Freeze must be activated before streak breaks (or within 24h grace)
- [ ] Visual indicator on streak counter when freeze is active

### US-7.5: Coach Gamification Tools
**As a** coach, **I want** to set XP bonuses for specific exercises or challenges **so that** I can incentivize behaviors I want to encourage.

**Acceptance Criteria:**
- [ ] Per-exercise XP multiplier (e.g., 2x XP on squat day)
- [ ] Challenge XP bonuses
- [ ] Custom badge creation (name, icon, criteria)
- [ ] Team XP leaderboard on coach dashboard

---

## Epic 8: Exercise Library Enhancement (P1)
*Both reviewers: video demos are non-negotiable for safety and education.*

### US-8.1: Video Demonstrations
**As an** athlete, **I want** high-quality video demos for every exercise **so that** I can learn and maintain proper form.

**Acceptance Criteria:**
- [ ] Video player on exercise detail page
- [ ] Auto-play loop (muted)
- [ ] Multiple angles where applicable
- [ ] Minimum 20 core exercises with video on launch
- [ ] Placeholder/illustration for exercises without video

### US-8.2: Exercise Search & Discovery
**As a** coach, **I want** advanced search with auto-suggest and related exercises **so that** I can quickly find or discover exercises for my programs.

**Acceptance Criteria:**
- [ ] Search-as-you-type with suggestions
- [ ] "Similar exercises" recommendation on each detail page
- [ ] Filter by: category, difficulty, equipment, exercise type, muscle group
- [ ] Sort by: name, popularity, recently added

---

## Epic 9: Login & Value Proposition (P2)
*PM review: "The login screen tells me nothing."*

### US-9.1: Compelling Login/Landing Page
**As a** first-time visitor, **I want** to immediately understand what MatchFit does and why it's valuable **so that** I'm motivated to sign up.

**Acceptance Criteria:**
- [ ] Hero section with clear value proposition (not just tagline)
- [ ] 3-4 feature highlights with icons
- [ ] Social proof (athlete count, team count, or testimonials)
- [ ] Separate CTAs for coaches and athletes
- [ ] Dynamic background or hero image (not plain circles)

---

## Epic 10: Notifications & Reminders (P2)
*PM review: "Critical for habit formation."*

### US-10.1: Smart Notification System
**As an** athlete, **I want** timely reminders for workouts, wellness check-ins, and coach messages **so that** I stay engaged and don't miss anything.

**Acceptance Criteria:**
- [ ] Daily workout reminder (configurable time)
- [ ] Wellness check-in prompt (morning)
- [ ] New message notification
- [ ] Streak-at-risk warning ("Don't lose your 14-day streak!")
- [ ] PR celebration push notification
- [ ] In-app notification center with unread count
- [ ] Email digest option (daily/weekly)

### US-10.2: Coach Alert System
**As a** coach, **I want** alerts when athletes miss workouts, report low wellness, or hit PRs **so that** I can intervene or celebrate at the right moment.

**Acceptance Criteria:**
- [ ] Configurable alert thresholds (e.g., missed 2+ days, wellness < 3/5)
- [ ] Alert badge on "Needs Attention" dashboard section
- [ ] One-click actions: send message, adjust program, log note
- [ ] Weekly summary email of team activity

---

## Epic 11: UI Polish (P2)
*UX review: color inconsistency, nav ambiguity, chart labels.*

### US-11.1: Chart Color Consistency
**As a** user, **I want** consistent chart colors throughout the app **so that** the interface feels polished and professional.

**Acceptance Criteria:**
- [ ] Remove arbitrary purple from charts
- [ ] Define chart color palette: primary green, secondary teal, tertiary grey
- [ ] Apply consistently across all Recharts components
- [ ] Create shared chart theme config file

### US-11.2: Player Bottom Nav Labels
**As an** athlete, **I want** text labels below navigation icons **so that** I know exactly what each icon does.

**Acceptance Criteria:**
- [ ] Add labels: Home, Progress, Workout, Messages, Profile
- [ ] Central lightning bolt icon replaced with "Workout" or sport-specific icon
- [ ] Active state clearly differentiated

### US-11.3: Chart Label Improvements
**As a** user, **I want** clear axis labels without "(hundreds)" suffixes **so that** data is immediately readable.

**Acceptance Criteria:**
- [ ] Y-axis uses abbreviated numbers (2.5K, 5K, 10K)
- [ ] Tooltips show exact values
- [ ] Legend clearly distinguishes data series
- [ ] Stacked/grouped bars use distinguishable colors

---

## Epic 12: Monetization & Pricing (P2)
*PM review: "$29/mo is too low and feature set too thin for serious coaches."*

### US-12.1: Tiered Pricing Structure
**As the** product team, **we want** to implement tiered pricing **so that** we capture value from individual trainers through large organizations.

**Proposed Tiers:**
- [ ] **Free**: 1 team, 5 athletes, basic tracking
- [ ] **Pro ($49/mo)**: Unlimited athletes, advanced analytics, program builder, custom exercises
- [ ] **Team ($99/mo)**: Multiple teams, load management, injury tracking, custom reports, team feed
- [ ] **Enterprise (custom)**: White-label, API access, SSO, dedicated support

### US-12.2: Coach Billing & Subscription Management
**As a** coach, **I want** to manage my subscription, billing, and invoices in-app **so that** I don't need external tools.

**Acceptance Criteria:**
- [ ] Stripe integration for payments
- [ ] Plan selection and upgrade/downgrade
- [ ] Invoice history and receipts
- [ ] Free trial (14 days) with credit card
- [ ] Usage dashboard (athletes, teams, storage)

---

# Implementation Phases

## Phase 1: Foundation (Weeks 1-4)
*Goal: Make the app usable for real coaches and athletes*

| Week | Epics | User Stories | Est. Story Points |
|------|-------|-------------|-------------------|
| 1-2 | Epic 2 (Program Builder) | US-2.1, US-2.4 | 21 |
| 2-3 | Epic 1 (Workout Execution) | US-1.1, US-1.2, US-1.3 | 18 |
| 3-4 | Epic 3 (Onboarding) | US-3.1, US-3.2, US-3.4 | 13 |
| 4 | Epic 11 (UI Polish) | US-11.1, US-11.2, US-11.3 | 5 |

**Phase 1 Total: ~57 story points**
**Deliverables:** Working program builder, mobile workout logging, onboarding wizards, chart cleanup

## Phase 2: Engagement (Weeks 5-8)
*Goal: Give users reasons to come back every day*

| Week | Epics | User Stories | Est. Story Points |
|------|-------|-------------|-------------------|
| 5 | Epic 7 (Gamification) | US-7.1, US-7.2, US-7.3, US-7.4 | 13 |
| 5-6 | Epic 5 (Social) | US-5.1, US-5.2 | 16 |
| 6-7 | Epic 8 (Exercise Library) | US-8.1, US-8.2 | 10 |
| 7-8 | Epic 10 (Notifications) | US-10.1, US-10.2 | 13 |

**Phase 2 Total: ~52 story points**
**Deliverables:** Team feed, challenges, badge system, XP rewards, exercise videos, push notifications

## Phase 3: Intelligence (Weeks 9-12)
*Goal: Data-driven coaching that justifies premium pricing*

| Week | Epics | User Stories | Est. Story Points |
|------|-------|-------------|-------------------|
| 9-10 | Epic 4 (Analytics) | US-4.1, US-4.2, US-4.3 | 21 |
| 10-11 | Epic 4 (Analytics) | US-4.4, US-4.5 | 13 |
| 11 | Epic 9 (Login/Landing) | US-9.1 | 5 |
| 12 | Epic 6 (Mobile) | US-6.1, US-6.2, US-6.3 | 16 |

**Phase 3 Total: ~55 story points**
**Deliverables:** Load management, 1RM tracking, injury dashboard, wellness correlation, reports, PWA

## Phase 4: Monetization (Weeks 13-14)
*Goal: Revenue-ready platform*

| Week | Epics | User Stories | Est. Story Points |
|------|-------|-------------|-------------------|
| 13 | Epic 12 (Monetization) | US-12.1, US-12.2 | 13 |
| 14 | Epic 2, 5, 7 (Remaining) | US-2.2, US-2.3, US-2.5, US-5.3, US-5.4, US-7.5 | 18 |

**Phase 4 Total: ~31 story points**
**Deliverables:** Stripe billing, tiered pricing, templates, periodization, coach gamification tools

---

# Summary

| Metric | Count |
|--------|-------|
| **Epics** | 12 |
| **User Stories** | 40 |
| **Total Story Points** | ~195 |
| **Estimated Duration** | 14 weeks |
| **P0 (Critical)** | 15 stories across 3 epics |
| **P1 (High)** | 16 stories across 5 epics |
| **P2 (Medium)** | 9 stories across 4 epics |

### Key Dependencies
1. **Program Builder (Epic 2) must come first** — workout execution and onboarding both depend on programs existing
2. **Workout Execution (Epic 1) before Analytics (Epic 4)** — analytics need real workout data to analyze
3. **Notifications (Epic 10) after Social (Epic 5)** — feed notifications depend on feed existing
4. **Monetization (Epic 12) last** — need features to justify pricing tiers

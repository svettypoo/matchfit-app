# MatchFit — Complete User Stories & Acceptance Criteria
> Soccer Fitness Platform — Coach Admin + Player App
> URL: https://matchfit.stproperties.com

---

## PERSONA: COACH (Admin Portal)

### AUTH & ACCOUNT

**US-C01: Coach Signup**
- Coach navigates to /admin/signup
- Enters name, email, password, team name
- Submits → account created, redirected to /admin dashboard
- Sees empty team state with "Invite Players" CTA

**US-C02: Coach Login**
- Coach navigates to /admin/login
- Enters email + password → authenticated → /admin dashboard
- Invalid credentials → error message shown
- "Forgot password" link → sends reset email

**US-C03: Coach Logout**
- Coach clicks avatar/menu → Logout
- Session destroyed, redirected to /admin/login

**US-C04: Coach Profile**
- Coach can update name, email, profile photo
- Coach can change password

### TEAM MANAGEMENT

**US-C05: Create Team**
- Coach clicks "Create Team" on dashboard
- Enters team name, sport (pre-filled soccer), age group, season dates
- Team created with unique join code

**US-C06: Invite Players**
- Coach clicks "Invite Players" on team page
- Option A: Enter player emails (comma-separated) → sends invite email with join link
- Option B: Copy invite link (contains team code) → share via any channel
- Option C: Generate QR code for in-person signup
- Coach sees pending invites list with resend/revoke options

**US-C07: Create Player Accounts (Bulk)**
- Coach clicks "Add Players Manually"
- Enters player name + email for each (or CSV upload)
- System creates accounts with temporary passwords
- Players receive email with login credentials + onboarding link

**US-C08: View Team Roster**
- Coach sees all players in a table: name, position, age, maturity stage, streak, compliance %, status (active/injured/inactive)
- Can filter by position, sort by any column
- Click player name → player detail view

**US-C09: Remove Player**
- Coach clicks remove on player row → confirmation dialog
- Player removed from team (account preserved, just unlinked)

**US-C10: Edit Player Details**
- Coach can update player position, jersey number, notes
- Can mark player as injured (removes from active program, shows recovery protocol)

### PROGRAM DESIGN

**US-C11: View Program Templates**
- Coach sees pre-built program templates (Pre-season, In-season, Off-season, Recovery, Speed & Agility, Strength)
- Each template shows duration, focus areas, difficulty
- Can preview template exercises before assigning

**US-C12: Create Custom Program**
- Coach clicks "Create Program"
- Sets: name, duration (weeks), phase type, target group
- Adds weekly schedule: which days have workouts
- For each day: adds exercises from library (search/filter by category, muscle group, equipment)
- Each exercise: sets, reps, duration, rest period, RPE target, video demo
- Can add notes/instructions per exercise
- Can reorder exercises via drag-and-drop
- Save → program available for assignment

**US-C13: Assign Program to Players**
- Coach selects program → "Assign" → choose players or entire team
- Sets start date
- Players receive notification: "New program assigned"
- Program appears on player's calendar starting from start date

**US-C14: Modify Active Program**
- Coach can edit exercises in an active program
- Changes propagate to future dates only (past completed workouts preserved)
- Coach can swap exercises for specific players (injury accommodations)

**US-C15: Exercise Library**
- Coach sees categorized exercise library (Strength, Speed, Agility, Ball Work, Flexibility, Core, Plyometrics, Recovery)
- Each exercise has: name, description, video demo, target muscles, equipment needed, difficulty
- Coach can add custom exercises with their own video uploads
- Search + filter by category, muscle group, equipment, difficulty

### MONITORING & ANALYTICS

**US-C16: Team Dashboard**
- Overview cards: active players, avg compliance %, avg streak, injured players
- Weekly compliance chart (bar chart, % completion per day)
- Top performers list (by streak/XP)
- At-risk players (missed 2+ days, wellness score low)
- Quick actions: send message, assign program, view calendar

**US-C17: Individual Player View**
- Shows player profile, onboarding survey answers, maturity stage
- Workout calendar with completed (green), missed (red), upcoming (blue)
- Compliance % over time (line chart)
- Exercise progression (volume/load over time)
- Wellness trend (mood, sleep, soreness over time)
- Streaks, badges earned, XP level
- Coach notes section

**US-C18: Workout Completion Feed**
- Real-time feed of player workout completions
- Each entry: player name, workout name, completion %, time, RPE reported
- Filter by date, player, workout type

**US-C19: Wellness Dashboard**
- All players in a grid with traffic light (red/amber/green) for today's wellness
- Players who haven't checked in yet shown in gray
- Click player → see wellness trend details
- Alert badges on players with declining trends (3+ days of low scores)

**US-C20: Performance Reports**
- Generate weekly/monthly report per player or team
- Includes: compliance %, exercises completed, volume progression, wellness trends
- Export as PDF or share link

### COMMUNICATION

**US-C21: Send Notification to Player**
- Coach clicks "Message" on player profile
- Types message → sends push notification + in-app notification
- Can attach exercise video or image

**US-C22: Send Team Announcement**
- Coach clicks "Announce" on team page
- Types message → sent to all active players
- Shows in player's notification center

**US-C23: Schedule Notification**
- Coach can schedule a message to be sent at a specific date/time
- Useful for pre-game motivation, reminders

**US-C24: Respond to Player Question**
- Player sends message from their app → appears in coach's inbox
- Coach types reply → player receives notification

### CALENDAR & SCHEDULING

**US-C25: Team Calendar View**
- Monthly calendar showing all team events
- Color-coded: workouts, games, rest days, assessments
- Can add events: games, practices, assessments, rest days
- Hover on day → see assigned workouts for that day

**US-C26: Season Planning**
- Coach sets season start/end dates
- Divides into phases (pre-season, in-season, post-season)
- Each phase can have different program templates auto-assigned
- Visual timeline of the entire season

---

## PERSONA: PLAYER (Mobile-First App)

### AUTH & ONBOARDING

**US-P01: Player Signup via Invite Link**
- Player clicks invite link from coach
- Sees signup page with team name pre-filled
- Enters name, email, password
- Account created → redirected to onboarding survey

**US-P02: Player Signup via Join Code**
- Player navigates to /join
- Enters team join code (6-digit alphanumeric)
- If valid → signup form shown with team pre-filled
- If invalid → error "Team not found"

**US-P03: Player Login**
- Player navigates to / (root)
- Enters email + password → authenticated → /dashboard
- Remember me checkbox → persists session
- Forgot password link works

**US-P04: Player Logout**
- Player taps menu → Logout → session destroyed → login page

**US-P05: Onboarding Survey (First Login)**
- Player is taken through multi-step survey after first login
- Cannot skip — must complete before accessing dashboard
- Steps:

  **Step 1 — Personal Info**
  - Date of birth
  - Height (cm or ft/in toggle)
  - Weight (kg or lbs toggle)
  - Standing height + sitting height (for PHV calc)
  - Gender
  - Position played (GK, CB, FB, CM, AM, Winger, ST — multi-select)

  **Step 2 — Maturity & Development**
  - Tanner stage self-assessment (age-appropriate visual scale 1-5)
  - Parent heights (for %PAH predicted adult height)
  - Any recent growth spurts? (Y/N + approx timing)
  - Current injuries or limitations? (multi-select body parts + text)

  **Step 3 — Fitness Baseline**
  - How many days/week do you currently train? (1-7 slider)
  - Current activities besides soccer (multi-sport tracking)
  - Self-rated fitness level (Beginner / Intermediate / Advanced)
  - Yo-Yo test score (optional, coach can fill later)
  - Sprint time (optional)
  - Max pushups in 60 sec (optional)
  - Max situps in 60 sec (optional)

  **Step 4 — Schedule & Availability**
  - Which days are available for training? (checkboxes Mon-Sun)
  - Preferred training time (Morning / Afternoon / Evening)
  - How many hours can you train per day? (0.5-3h slider)
  - Any commitments that block training? (free text)

  **Step 5 — Goals & Motivation**
  - Primary goal: (Get faster / Get stronger / Improve stamina / Lose weight / Injury prevention / Overall fitness)
  - What position do you want to master?
  - Dream club/team?
  - What motivates you most? (Competing with teammates / Personal bests / Coach recognition / Playing time / Fun)

- Submit → AI generates personalized program → player redirected to dashboard with program loaded

**US-P06: Edit Profile**
- Player can update profile photo, height, weight (periodic)
- Updated measurements recalculate maturity offset

### DAILY EXPERIENCE

**US-P07: Daily Wellness Check-In**
- On app open (morning), modal prompts: "How are you feeling today?"
- 5 emoji-scale questions (30 seconds):
  1. Sleep quality (1-5 moon emoji)
  2. Energy level (1-5 battery emoji)
  3. Muscle soreness (1-5 body emoji)
  4. Mood (1-5 face emoji)
  5. Stress (1-5 brain emoji)
- Submit → results logged, visible to coach
- Generates "Readiness Score" (0-100) shown to player
- If score < 40: "Recovery day recommended" banner on today's workout

**US-P08: View Today's Workout**
- Dashboard shows today's date + workout card
- Workout card: name, estimated duration, number of exercises, difficulty
- "Start Workout" button
- If rest day: shows "Rest Day" card with recovery tips
- If no program assigned: shows "No program yet — contact your coach"

**US-P09: Execute Workout**
- Player taps "Start Workout" → enters workout mode
- Exercise list with expandable details
- Each exercise shows: name, sets x reps (or duration), rest period, video demo thumbnail
- Tap video thumbnail → plays exercise demo video
- For each set: player logs completed reps + weight (if applicable)
- Rest timer auto-starts between sets with countdown
- Can skip exercise (logged as skipped with reason)
- After last exercise: rate workout RPE (1-10 scale)
- "Complete Workout" → confetti animation + XP earned popup

**US-P10: View Exercise Demo Video**
- During workout, tap exercise name or video icon
- Full-screen video plays showing proper form
- Can replay, slow down
- Close → back to workout

**US-P11: Log Partial Workout**
- If player can't finish, tap "End Early"
- Logs completed exercises, marks rest as incomplete
- Completion % calculated accordingly

**US-P12: View Weekly Calendar**
- Scrollable week view showing each day
- Each day shows: workout name (if assigned), status (completed/upcoming/missed/rest)
- Completed days have green checkmark + XP earned
- Missed days have red X
- Tap any day → see that day's workout details

**US-P13: View Monthly Calendar**
- Full month grid view
- Days color-coded: green (completed), red (missed), blue (upcoming), gray (rest)
- Streak counter visible at top
- Shows current month stats: X/Y workouts completed, streak count

### GAMIFICATION

**US-P14: View XP & Level**
- Profile/dashboard shows current XP, level, progress bar to next level
- XP earned: completing workout (+50), daily check-in (+10), achieving RPE target (+20), streak bonus (+5/day)
- Level thresholds visible: Level 1 (0 XP) → Level 2 (200 XP) → etc.
- Level up → celebration animation + badge unlock

**US-P15: View Streak**
- Dashboard shows current streak (consecutive days with workout or check-in)
- Streak milestones: 3-day, 7-day, 14-day, 30-day, 60-day, 100-day
- Hitting milestone → badge + bonus XP
- Missing a day → streak resets (shown with "broken streak" animation)

**US-P16: View Badges**
- Badge collection page shows earned + locked badges
- Badge categories:
  - Consistency: 7-Day Warrior, 30-Day Machine, 100-Day Legend
  - Performance: First PR, Volume King, Speed Demon
  - Wellness: Check-In Champ (30 consecutive check-ins), Sleep Master (7 days 8+ hrs)
  - Soccer: Ball Mastery (complete all ball work), Pitch Ready (finish pre-season program)
  - Social: Team Player (complete team challenge), Mentor (help teammate)
- Tap badge → see description + date earned (or requirements if locked)

**US-P17: Team Leaderboard**
- Leaderboard tab shows rankings by: XP (default), streak, compliance %, weekly volume
- Toggle between: This Week / This Month / All Time
- Player sees their rank highlighted
- Top 3 get crown/medal icons
- Position filter (compare only among same position)

**US-P18: Weekly Team Challenge**
- Coach or auto-generated challenge each week
- Example: "Team goal: 90% average compliance this week"
- Progress bar shows team's collective progress
- If achieved → all participants get bonus XP + "Team Challenge" badge

### COMMUNICATION

**US-P19: View Notifications**
- Bell icon with unread count
- Notification types: coach message, program update, challenge announcement, badge earned, streak milestone
- Tap notification → navigates to relevant content
- Mark as read / mark all read

**US-P20: Message Coach**
- Player can send message to coach from profile or notification screen
- Text input + send button
- Conversation thread visible
- Coach response appears as notification

**US-P21: View Coach Instructions**
- On workout page, coach notes/instructions shown in a callout box
- Per-exercise coach notes visible during workout
- General team announcements in notification center

### PROGRESS & HISTORY

**US-P22: View Progress Dashboard**
- Visual cards showing:
  - Compliance % this week/month (circular progress)
  - Total workouts completed
  - Current streak
  - XP level + progress
  - Wellness trend mini-chart (7-day)
- Motivational quote or tip (rotates daily)

**US-P23: View Workout History**
- List of past workouts (reverse chronological)
- Each entry: date, workout name, completion %, duration, RPE
- Tap → see exercise-level detail (sets, reps, weights logged)

**US-P24: View Personal Records**
- PR board showing best performances per exercise
- Date achieved + progression chart
- New PR flagged with animation during workout

### SETTINGS

**US-P25: Notification Preferences**
- Toggle: workout reminders, coach messages, team challenges, wellness check-in reminder
- Set preferred reminder time (e.g., 7:00 AM for check-in, 4:00 PM for workout)

**US-P26: Units Preference**
- Toggle metric (kg, cm) vs imperial (lbs, ft/in)
- Applied across all displays

**US-P27: Dark Mode**
- Toggle dark/light theme

---

## PERSONA: SYSTEM (Background/Automated)

**US-S01: AI Program Generation**
- When player completes onboarding survey:
  - System calculates maturity offset (PHV) from measurements
  - Considers: age, maturity stage, fitness level, goals, available days, coach's program template
  - Generates personalized weekly program with progressive overload
  - Assigns exercises appropriate for maturity stage (e.g., no heavy barbell for pre-PHV)
  - Populates calendar for next 4 weeks
  - Auto-regenerates next 4-week block as current one ends

**US-S02: Readiness Score Calculation**
- After daily check-in, compute composite readiness (0-100):
  - Sleep quality (25%), energy (25%), soreness (inverse, 20%), mood (15%), stress (inverse, 15%)
  - If < 40: flag as "at risk" on coach dashboard, recommend recovery workout
  - If < 25: suggest rest day

**US-S03: Streak Management**
- Track consecutive days with: completed workout OR wellness check-in
- Reset at midnight local time if neither logged
- Award streak badges at milestones

**US-S04: XP & Level Calculation**
- Sum XP from all sources
- Level thresholds: L1=0, L2=200, L3=500, L4=1000, L5=1800, L6=3000, L7=5000, L8=8000, L9=12000, L10=20000

**US-S05: Weekly Report Generation**
- Every Monday at 8 AM: generate weekly summary for each coach
- Includes: team compliance %, top 5 performers, at-risk players, milestone achievements

**US-S06: Program Auto-Progression**
- Each 4-week block: slightly increase volume/intensity per progressive overload
- Deload week every 4th week (reduce volume by 40%)
- Adjust based on player's logged RPE trends (if consistently low → increase, consistently high → decrease)

**US-S07: Invite Email Delivery**
- When coach sends invite: system sends email via Resend
- Email contains: team name, coach name, join link, temporary password (if bulk created)
- Undelivered emails flagged on coach's invite list

**US-S08: Notification Delivery**
- Coach messages → push notification (if enabled) + in-app notification
- Workout reminder → sent at player's preferred time
- Wellness check-in reminder → sent each morning

---

## EDGE CASES & ERROR STATES

**US-E01: Player with no program**
- Dashboard shows "No program assigned yet" with coach contact CTA
- Calendar is empty with message

**US-E02: Player tries to access workout on rest day**
- Shows rest day card with recovery tips, not an error

**US-E03: Coach removes player mid-program**
- Player sees "You've been removed from [Team]" message
- Workout history preserved but no new workouts

**US-E04: Multiple teams**
- A coach can create multiple teams (e.g., U14, U16, U18)
- Each team has separate roster, programs, calendar
- Coach switches between teams via dropdown

**US-E05: Player on multiple teams**
- Not supported in v1 — player belongs to one team at a time

**US-E06: Offline workout logging**
- If player loses connection mid-workout → data cached locally
- Syncs when connection restored
- (v1: show "connection required" — offline support is v2)

**US-E07: Session timeout**
- If token expires → redirect to login with "Session expired" message
- Preserve current URL for redirect after re-login

**US-E08: Empty exercise library**
- System ships with 100+ pre-built exercises
- Coach sees full library on first login — not empty

**US-E09: Concurrent program assignment**
- Only one active program per player at a time
- Assigning new program → confirmation "This will replace current program"

**US-E10: Workout already completed today**
- If player already completed today's workout, show "Completed" state
- Can view details but not re-log

---

## USER STORY COUNT: 62 stories
- Coach: 26 stories (US-C01 through US-C26)
- Player: 27 stories (US-P01 through US-P27)
- System: 8 stories (US-S01 through US-S08)
- Edge Cases: 10 stories (US-E01 through US-E10)

---

## TESTING PROTOCOL (Dream)
For each user story:
1. Navigate to relevant page via Dream
2. Perform the described interaction
3. Take screenshot at key state
4. Verify acceptance criteria met
5. Log result as PASS/FAIL with screenshot URL
6. If FAIL → fix → redeploy → retest

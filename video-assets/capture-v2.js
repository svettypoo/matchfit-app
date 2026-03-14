const { execSync } = require('child_process');
const fs = require('fs');

const RS = 'node c:/Users/pargo_pxnd4wa/birthdayboard/railway-screenshot.js';
const FRAMES = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/frames';
const SS = 'c:/Users/pargo_pxnd4wa/birthdayboard/screenshot.png';

function run(cmd) { try { return execSync(cmd, { encoding: 'utf8', timeout: 30000 }); } catch(e) { return e.stdout || ''; } }
function nav(url) { run(`${RS} navigate "${url}"`); sleep(3); }
function shot(name) { run(`${RS} screenshot`); fs.copyFileSync(SS, `${FRAMES}/${name}.png`); console.log('  saved:', name); }
function click(sel) { run(`${RS} click "${sel}"`); sleep(1.5); }
function fill(sel, val) { run(`${RS} fill "${sel}" "${val}"`); }
function evaljs(code) { run(`${RS} eval "${code}"`); }
function sleep(s) { execSync(`sleep ${s}`, { timeout: s * 1000 + 5000 }); }

console.log('=== ACT 1: COACH PERSPECTIVE ===');

// Login as coach
nav('https://matchfit.stproperties.com');
evaljs('localStorage.clear(); window.location.href="/"');
sleep(2);
nav('https://matchfit.stproperties.com');
try { click("button:has-text('Coach')"); } catch(e) {}
fill("input[type='email']", "coach@stproperties.com");
fill("input[type='password']", "Partycard123*");
click("button[type='submit']");
sleep(3);

shot('01-coach-dashboard');

nav('https://matchfit.stproperties.com/admin/teams');
shot('02-coach-teams');

nav('https://matchfit.stproperties.com/admin/programs');
shot('03-coach-programs');

nav('https://matchfit.stproperties.com/admin/programs/new');
shot('04-coach-program-builder');

nav('https://matchfit.stproperties.com/admin/exercises');
shot('05-coach-exercises');

nav('https://matchfit.stproperties.com/admin/calendar');
shot('06-coach-calendar');

nav('https://matchfit.stproperties.com/admin/messages');
shot('07-coach-messages');

nav('https://matchfit.stproperties.com/admin/wellness');
shot('08-coach-wellness');

nav('https://matchfit.stproperties.com/admin/feed');
shot('09-coach-feed');

nav('https://matchfit.stproperties.com/admin/analytics');
shot('10-coach-analytics');

console.log('\n=== ACT 2: PLAYER PERSPECTIVE ===');

evaljs('localStorage.clear(); window.location.href="/"');
sleep(2);
nav('https://matchfit.stproperties.com');
fill("input[type='email']", "player@stproperties.com");
fill("input[type='password']", "Partycard123*");
click("button[type='submit']");
sleep(3);

shot('11-player-dashboard');

nav('https://matchfit.stproperties.com/dashboard/feed');
shot('12-player-feed');

nav('https://matchfit.stproperties.com/dashboard/progress');
shot('13-player-progress');

nav('https://matchfit.stproperties.com/dashboard/badges');
shot('14-player-badges');

nav('https://matchfit.stproperties.com/dashboard/leaderboard');
shot('15-player-leaderboard');

nav('https://matchfit.stproperties.com/dashboard/notifications');
shot('16-player-notifications');

nav('https://matchfit.stproperties.com/dashboard/profile');
shot('17-player-profile');

console.log('\n=== ACT 3: COACH REVIEW ===');

evaljs('localStorage.clear(); window.location.href="/"');
sleep(2);
nav('https://matchfit.stproperties.com');
try { click("button:has-text('Coach')"); } catch(e) {}
fill("input[type='email']", "coach@stproperties.com");
fill("input[type='password']", "Partycard123*");
click("button[type='submit']");
sleep(3);

shot('19-coach-review-dashboard');

nav('https://matchfit.stproperties.com/admin/analytics');
shot('20-coach-review-load');

try { click("button:has-text('Performance')"); } catch(e) {}
sleep(2);
shot('21-coach-review-performance');

try { click("button:has-text('Wellness')"); } catch(e) {}
sleep(2);
shot('22-coach-review-wellness');

// Landing for outro
evaljs('localStorage.clear(); window.location.href="/"');
sleep(2);
nav('https://matchfit.stproperties.com');
shot('24-landing-outro');

console.log('\nDone! All frames captured.');

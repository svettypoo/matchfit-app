const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const get = k => { const m = env.match(new RegExp('^' + k + '=(.+)', 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null; };
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');

function supabaseReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url + path);
    const data = body ? JSON.stringify(body) : '';
    const req = https.request(u, {
      method,
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch { resolve(b); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Create coach auth user
  console.log('Creating coach auth user...');
  const coachAuth = await supabaseReq('POST', '/auth/v1/admin/users', {
    email: 'coach@stproperties.com',
    password: 'Partycard123*',
    email_confirm: true,
    user_metadata: { name: 'Coach Svet', role: 'coach' }
  });
  console.log('Coach auth ID:', coachAuth.id || coachAuth.msg || JSON.stringify(coachAuth).substring(0, 200));

  // Create player auth user
  console.log('Creating player auth user...');
  const playerAuth = await supabaseReq('POST', '/auth/v1/admin/users', {
    email: 'player@stproperties.com',
    password: 'Partycard123*',
    email_confirm: true,
    user_metadata: { name: 'Alex Player', role: 'player' }
  });
  console.log('Player auth ID:', playerAuth.id || playerAuth.msg || JSON.stringify(playerAuth).substring(0, 200));

  const coachAuthId = coachAuth.id;
  const playerAuthId = playerAuth.id;
  if (!coachAuthId || !playerAuthId) {
    console.log('Auth user creation failed, check output above');
    return;
  }

  // Create coach record
  console.log('Creating coach record...');
  const coach = await supabaseReq('POST', '/rest/v1/mf_coaches', {
    auth_id: coachAuthId,
    name: 'Coach Svet',
    email: 'coach@stproperties.com'
  });
  console.log('Coach record:', JSON.stringify(coach).substring(0, 150));
  const coachRecId = Array.isArray(coach) ? coach[0].id : coach.id;

  // Create team
  console.log('Creating team...');
  const team = await supabaseReq('POST', '/rest/v1/mf_teams', {
    coach_id: coachRecId,
    name: 'S&T FC',
    join_code: 'STFC24',
    age_group: 'U18',
    season_start: '2026-03-01',
    season_end: '2026-11-30'
  });
  console.log('Team:', JSON.stringify(team).substring(0, 150));
  const teamId = Array.isArray(team) ? team[0].id : team.id;

  // Create player record
  console.log('Creating player record...');
  const player = await supabaseReq('POST', '/rest/v1/mf_players', {
    auth_id: playerAuthId,
    team_id: teamId,
    name: 'Alex Player',
    email: 'player@stproperties.com',
    position: ['CM', 'AM'],
    jersey_number: 10,
    date_of_birth: '2008-06-15',
    gender: 'male',
    height_cm: 172,
    weight_kg: 65,
    sitting_height_cm: 88,
    tanner_stage: 4,
    fitness_level: 'intermediate',
    training_days: ['monday','tuesday','wednesday','thursday','friday'],
    preferred_time: 'afternoon',
    max_hours_per_day: 1.5,
    primary_goal: 'Get faster',
    dream_club: 'Real Madrid',
    motivation: 'Playing time',
    onboarding_complete: true,
    status: 'active',
    xp: 350,
    level: 2,
    current_streak: 5,
    longest_streak: 12
  });
  console.log('Player:', JSON.stringify(player).substring(0, 150));

  // Create a few more players for the team
  const names = ['Maria Garcia', 'Jake Torres', 'Liam Chen', 'Sofia Ahmed'];
  const positions = [['GK'], ['CB', 'FB'], ['Winger', 'ST'], ['CM', 'AM']];
  for (let i = 0; i < names.length; i++) {
    const email = names[i].toLowerCase().replace(' ', '.') + '@stproperties.com';
    const auth = await supabaseReq('POST', '/auth/v1/admin/users', {
      email, password: 'Partycard123*', email_confirm: true,
      user_metadata: { name: names[i], role: 'player' }
    });
    if (auth.id) {
      await supabaseReq('POST', '/rest/v1/mf_players', {
        auth_id: auth.id, team_id: teamId, name: names[i], email,
        position: positions[i], jersey_number: i + 2,
        date_of_birth: `200${7 + i}-0${i + 3}-1${i + 1}`,
        gender: i % 2 === 0 ? 'female' : 'male',
        height_cm: 165 + i * 5, weight_kg: 58 + i * 4,
        fitness_level: ['beginner', 'intermediate', 'advanced', 'intermediate'][i],
        onboarding_complete: true, status: 'active',
        xp: 100 + i * 150, level: 1 + Math.floor(i / 2),
        current_streak: i * 2, longest_streak: i * 3 + 2,
        training_days: ['monday','wednesday','friday']
      });
      console.log(`Created player: ${names[i]}`);
    }
  }

  console.log('\n=== DEMO ACCOUNTS ===');
  console.log('Coach: coach@stproperties.com / Partycard123*');
  console.log('Player: player@stproperties.com / Partycard123*');
  console.log('Team join code: STFC24');
  console.log('Additional players: maria.garcia@, jake.torres@, liam.chen@, sofia.ahmed@ (all Partycard123*)');
}

main().catch(console.error);

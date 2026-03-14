const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const API_KEY = 'AIzaSyAL3nvtrW7qFF8KPrzKXwv7cswWiALIhSU';
const OUT = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets';

function tts(text, voice, outFile) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
      }
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) { console.log(`  TTS error: ${j.error.message.substring(0,80)}`); resolve(false); return; }
          const audio = j.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!audio) { console.log('  No audio in response'); resolve(false); return; }
          // Write PCM, convert to WAV
          const pcmFile = outFile.replace('.wav', '.pcm');
          fs.writeFileSync(pcmFile, Buffer.from(audio, 'base64'));
          execSync(`ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${pcmFile}" "${outFile}"`, {stdio:'pipe',timeout:10000});
          fs.unlinkSync(pcmFile);
          const sz = fs.statSync(outFile).size;
          console.log(`  ${outFile.split('/').pop()} (${(sz/1024).toFixed(0)} KB)`);
          resolve(true);
        } catch(e) { console.log(`  Parse error: ${e.message}`); resolve(false); }
      });
    });
    req.on('error', (e) => { console.log(`  Net error: ${e.message}`); resolve(null); });
    req.write(body);
    req.end();
  });
}

const narrations = [
  // INTRO
  { file: 'narr-intro.wav', voice: 'Kore', text: 'Say with excitement and energy: MatchFit! Train like a pro. Play like a champion.' },
  
  // ACT 1 - Coach Sarah (female voice)
  { file: 'narr-act1-intro.wav', voice: 'Kore', text: 'Say warmly and professionally: Hi, I am Coach Sarah, Head Coach at FC United Academy. Let me show you how I manage my team with MatchFit.' },
  { file: 'narr-dashboard.wav', voice: 'Kore', text: 'Say with enthusiasm: My dashboard gives me everything at a glance - active players, compliance rates, and training streaks. I can see exactly how my team is performing.' },
  { file: 'narr-teams.wav', voice: 'Kore', text: 'Say confidently: Team management is a breeze. I organize my squads, track rosters, and send invites all from one place.' },
  { file: 'narr-programs.wav', voice: 'Kore', text: 'Say with excitement: The program builder is incredible! A four step wizard with drag and drop, auto progression, and templates. Building training programs has never been easier.' },
  { file: 'narr-exercises.wav', voice: 'Kore', text: 'Say informatively: Over one hundred exercises in our library, each with video demos, muscle groups, and difficulty levels.' },
  { file: 'narr-calendar.wav', voice: 'Kore', text: 'Say with satisfaction: The training calendar lets me see the full week at a glance. Workouts, rest days, everything organized.' },
  { file: 'narr-wellness.wav', voice: 'Kore', text: 'Say with care: Wellness monitoring tracks sleep, mood, and energy levels. I can spot issues early before they become injuries.' },
  { file: 'narr-feed.wav', voice: 'Kore', text: 'Say cheerfully: The team feed keeps everyone connected. I post announcements, celebrate wins, and keep the energy high.' },
  { file: 'narr-analytics.wav', voice: 'Kore', text: 'Say impressively: Advanced analytics with ACWR load management, one rep max tracking, and injury monitoring. This is where data drives decisions.' },
  
  // ACT 2 - Player Alex (male voice)
  { file: 'narr-act2-intro.wav', voice: 'Orus', text: 'Say enthusiastically: Hey! I am Alex, midfielder at FC United Academy. Let me show you my daily training experience!' },
  { file: 'narr-player-dash.wav', voice: 'Orus', text: 'Say with energy: My dashboard shows todays workout, my streak, XP level, and a wellness check-in. I know exactly what I need to do today.' },
  { file: 'narr-player-feed.wav', voice: 'Orus', text: 'Say excitedly: The team feed is awesome. I can see what my teammates are crushing and cheer them on!' },
  { file: 'narr-progress.wav', voice: 'Orus', text: 'Say proudly: Progress tracking with weekly charts, a compliance ring, and exercise PRs. I can see myself getting stronger every week.' },
  { file: 'narr-badges.wav', voice: 'Orus', text: 'Say with excitement: Badges and achievements! Twenty badges across four rarities. Common, Rare, Epic, and Legendary. I am chasing that legendary badge!' },
  
  // ACT 3 - Coach Review (female voice)
  { file: 'narr-act3-intro.wav', voice: 'Kore', text: 'Say thoughtfully: Now let me review how my players performed and make data-driven decisions.' },
  { file: 'narr-review-analytics.wav', voice: 'Kore', text: 'Say analytically: Looking at the team overview, Alex has a ten day streak. He is our top performer! And Sofia is climbing fast.' },
  { file: 'narr-review-perf.wav', voice: 'Kore', text: 'Say with insight: Performance analytics show estimated one rep max tracking and PR detection. I can see exactly who is improving and where.' },
  { file: 'narr-review-wellness.wav', voice: 'Kore', text: 'Say with care: The wellness insights show me team readiness. I can spot who needs a deload week before burnout hits.' },
  
  // OUTRO
  { file: 'narr-outro.wav', voice: 'Kore', text: 'Say with passion and energy: MatchFit. The future of team fitness. Visit matchfit dot s t properties dot com to get started today!' },
];

(async () => {
  console.log(`Generating ${narrations.length} narration clips...\n`);
  for (const n of narrations) {
    process.stdout.write(`  ${n.file}... `);
    await tts(n.text, n.voice, `${OUT}/narr/${n.file}`);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\nDone!');
})();

const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = 'AIzaSyCkib3FjcJA3YNCoxH5n8kbxvn5djyIYlw';
const FRAMES_DIR = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/frames';

// First, let's use Gemini to generate individual video segments from screenshots
// Veo uses predictLongRunning — let's try generating a video from each key scene

// We'll generate a video for each act using Veo with a reference image
async function generateVideoClip(imagePath, prompt, outputName) {
  const imageData = fs.readFileSync(imagePath).toString('base64');

  const body = JSON.stringify({
    instances: [{
      prompt: prompt,
      image: {
        bytesBase64Encoded: imageData,
        mimeType: 'image/png'
      }
    }],
    parameters: {
      aspectRatio: '16:9',
      sampleCount: 1,
      durationSeconds: 8,
      // enhancePrompt removed — not supported by this model
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/veo-3.0-fast-generate-001:predictLongRunning?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            console.log(`  Error for ${outputName}:`, json.error.message);
            resolve(null);
          } else if (json.name) {
            console.log(`  Operation started for ${outputName}: ${json.name}`);
            resolve(json.name);
          } else {
            console.log(`  Unexpected response for ${outputName}:`, data.slice(0, 200));
            resolve(null);
          }
        } catch (e) {
          console.log(`  Parse error for ${outputName}:`, e.message);
          resolve(null);
        }
      });
    });
    req.on('error', e => { console.log(`  Request error: ${e.message}`); resolve(null); });
    req.write(body);
    req.end();
  });
}

async function checkOperation(opName) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/${opName}?key=${API_KEY}`,
      method: 'GET',
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message });
        }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

(async () => {
  console.log('=== Generating MatchFit Marketing Video with Veo ===\n');

  // Generate key video clips
  const clips = [
    {
      image: '01-coach-dashboard',
      prompt: 'A professional software demo video showing a coach dashboard for a sports fitness app called MatchFit. The dashboard animates in with smooth transitions, showing team stats, compliance charts, and player rankings. Modern green and white UI with data cards appearing one by one. Upbeat tech demo style.',
      name: 'coach-dashboard'
    },
    {
      image: '11-player-dashboard',
      prompt: 'A professional software demo video showing a mobile fitness app dashboard for an athlete. Shows workout cards, XP levels, streak counters, and wellness prompts animating in. Green-themed modern UI. The bottom navigation tabs highlight as the user scrolls. Upbeat and energetic feel.',
      name: 'player-dashboard'
    },
    {
      image: '10-coach-analytics',
      prompt: 'A professional software demo video showing an advanced analytics dashboard for sports coaching. Data tables with ACWR workload ratios animate in, color-coded zones (green optimal, amber caution, red danger) highlight. Modern clean UI with green sidebar. Professional data visualization feel.',
      name: 'analytics'
    },
  ];

  const operations = [];

  for (const clip of clips) {
    const imgPath = path.join(FRAMES_DIR, clip.image + '.png');
    if (!fs.existsSync(imgPath)) {
      console.log(`  MISSING: ${imgPath}`);
      continue;
    }
    console.log(`Generating clip: ${clip.name}...`);
    const op = await generateVideoClip(imgPath, clip.prompt, clip.name);
    if (op) operations.push({ name: clip.name, op });
  }

  if (operations.length === 0) {
    console.log('\nNo operations started. Check API access.');
    return;
  }

  // Poll for completion
  console.log(`\nWaiting for ${operations.length} video clips to generate...`);

  const maxWait = 300; // 5 minutes
  let waited = 0;

  while (waited < maxWait) {
    await new Promise(r => setTimeout(r, 10000)); // wait 10s
    waited += 10;

    let allDone = true;
    for (const op of operations) {
      if (op.done) continue;

      const status = await checkOperation(op.op);
      if (status.done) {
        op.done = true;
        if (status.response && status.response.generateVideoResponse) {
          const videos = status.response.generateVideoResponse.generatedSamples || [];
          for (let i = 0; i < videos.length; i++) {
            const video = videos[i].video;
            if (video && video.bytesBase64Encoded) {
              const outFile = `c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/veo-${op.name}.mp4`;
              fs.writeFileSync(outFile, Buffer.from(video.bytesBase64Encoded, 'base64'));
              console.log(`  Saved: ${outFile}`);
            } else if (video && video.uri) {
              console.log(`  Video URI: ${video.uri}`);
            }
          }
        } else if (status.error) {
          console.log(`  Error for ${op.name}: ${status.error.message || JSON.stringify(status.error)}`);
        }
      } else {
        allDone = false;
        const pct = status.metadata?.percentComplete || '?';
        process.stdout.write(`  ${op.name}: ${pct}% ... `);
      }
    }

    if (allDone) {
      console.log('\nAll clips generated!');
      break;
    }
    console.log(`(${waited}s elapsed)`);
  }

  console.log('\nDone!');
})();

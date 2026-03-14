const fs = require('fs');
const https = require('https');
const path = require('path');

const API_KEY = 'AIzaSyCkib3FjcJA3YNCoxH5n8kbxvn5djyIYlw';
const FRAMES_DIR = 'c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/frames';

// Read the prompt
const promptText = fs.readFileSync('c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/gemini-video-prompt.md', 'utf8');

// Key screenshots to include as inline images (base64)
const keyFrames = [
  '01-coach-dashboard',
  '04-coach-program-builder',
  '05-coach-exercises',
  '10-coach-analytics',
  '11-player-dashboard',
  '12-player-feed',
  '13-player-progress',
  '14-player-badges',
  '20-coach-review-load',
  '21-coach-review-performance',
  '24-landing-outro',
];

// Build parts array with images
const parts = [];

// Add the main prompt
parts.push({ text: promptText + '\n\nPlease generate a marketing video using these screenshots as the visual content. Create smooth transitions, add the text overlays described in the script, include an animated logo intro, and make it feel like a professional SaaS marketing video. The video should be approximately 2 minutes long.' });

// Add key images inline
keyFrames.forEach(frame => {
  const imgPath = path.join(FRAMES_DIR, frame + '.png');
  if (fs.existsSync(imgPath)) {
    const imgData = fs.readFileSync(imgPath).toString('base64');
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: imgData
      }
    });
    parts.push({ text: `[Above image: ${frame}]` });
  }
});

// Use Gemini 2.0 Flash with video generation
const body = JSON.stringify({
  contents: [{ parts }],
  generationConfig: {
    responseModalities: ['TEXT', 'IMAGE'],
    temperature: 0.8,
  }
});

console.log(`Sending request to Gemini with ${keyFrames.length} images...`);
console.log(`Request body size: ${(Buffer.byteLength(body) / 1024 / 1024).toFixed(1)} MB`);

const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
  timeout: 300000,
}, (res) => {
  let data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    const buf = Buffer.concat(data);
    try {
      const json = JSON.parse(buf.toString());

      if (json.error) {
        console.log('API Error:', JSON.stringify(json.error, null, 2));
        return;
      }

      // Check for generated content
      if (json.candidates && json.candidates[0]) {
        const candidate = json.candidates[0];
        if (candidate.content && candidate.content.parts) {
          candidate.content.parts.forEach((part, i) => {
            if (part.text) {
              console.log('\nGemini text response:\n', part.text);
            }
            if (part.inlineData) {
              const ext = part.inlineData.mimeType.includes('video') ? 'mp4' :
                         part.inlineData.mimeType.includes('image') ? 'png' : 'bin';
              const outFile = `c:/Users/pargo_pxnd4wa/matchfit-app/video-assets/gemini-output-${i}.${ext}`;
              fs.writeFileSync(outFile, Buffer.from(part.inlineData.data, 'base64'));
              console.log(`Saved: ${outFile} (${part.inlineData.mimeType})`);
            }
          });
        }
        if (candidate.finishReason) {
          console.log('Finish reason:', candidate.finishReason);
        }
      } else {
        console.log('Unexpected response:', buf.toString().slice(0, 500));
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw response:', buf.toString().slice(0, 500));
    }
  });
});

req.on('error', (e) => console.log('Request error:', e.message));
req.on('timeout', () => { console.log('Request timed out'); req.destroy(); });
req.write(body);
req.end();

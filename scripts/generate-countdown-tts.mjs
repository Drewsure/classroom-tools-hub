#!/usr/bin/env node
/**
 * Generate spoken countdown number MP3 files (1-10) for the Classroom Tools Hub.
 * Uses the z-ai TTS API via the SDK.
 *
 * Output: public/sounds/countdown-1.mp3 ... public/sounds/countdown-10.mp3
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/home/z/my-project/public/sounds';

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const zai = await ZAI.create();
  console.log('ZAI SDK initialized');

  // Use the "xiaochen" voice (沉稳专业 - calm/professional) for clear countdown numbers
  const voice = 'xiaochen';
  const speed = 0.9; // slightly slower for clarity in countdown context

  for (let n = 1; n <= 10; n++) {
    const text = String(n);
    const outputPath = path.join(OUT_DIR, `countdown-${n}.mp3`);

    try {
      const response = await zai.audio.tts.create({
        input: text,
        voice: voice,
        speed: speed,
        response_format: 'wav',
        stream: false,
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));

      // Save as .wav (the API only supports wav/pcm, not mp3)
      const wavPath = path.join(OUT_DIR, `countdown-${n}.wav`);
      fs.writeFileSync(wavPath, buffer);

      console.log(`  ✓ countdown-${n}.wav (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed to generate countdown-${n}.mp3:`, err);
      process.exit(1);
    }
  }

  console.log('\nAll countdown numbers generated successfully.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

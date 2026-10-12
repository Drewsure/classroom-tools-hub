#!/usr/bin/env node
/**
 * Generate the remaining phonic TTS files (p through z) with rate-limit handling.
 * Adds a 3-second delay between requests to avoid 429 errors.
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/home/z/my-project/public/sounds';

const REMAINING = [
  { letter: "p", word: "panda" },
  { letter: "q", word: "quiet" },
  { letter: "r", word: "run" },
  { letter: "s", word: "sun" },
  { letter: "t", word: "tent" },
  { letter: "u", word: "umbrella" },
  { letter: "v", word: "van" },
  { letter: "w", word: "windy" },
  { letter: "x", word: "taxi" },
  { letter: "y", word: "yes" },
  { letter: "z", word: "zero" },
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const zai = await ZAI.create();
  console.log('ZAI SDK initialized');

  const voice = 'xiaochen';
  const speed = 0.85;

  for (const { letter, word } of REMAINING) {
    const upper = letter.toUpperCase();
    const text = `${upper}. ${upper} for ${word}.`;
    const outputPath = path.join(OUT_DIR, `phonic-${letter}.wav`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`  ⊘ phonic-${letter}.wav already exists, skipping`);
      continue;
    }

    let retries = 0;
    const maxRetries = 3;
    while (retries < maxRetries) {
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
        fs.writeFileSync(outputPath, buffer);
        console.log(`  ✓ phonic-${letter}.wav (${(buffer.length / 1024).toFixed(1)} KB) — "${text}"`);
        break;
      } catch (err) {
        retries++;
        if (retries >= maxRetries) {
          console.error(`  ✗ Failed phonic-${letter}.wav after ${maxRetries} retries:`, err.message);
          break;
        }
        console.log(`  ⏳ Rate limited on phonic-${letter}.wav, waiting 5s (retry ${retries}/${maxRetries})`);
        await sleep(5000);
      }
    }

    // Delay between requests to avoid rate limiting
    await sleep(3000);
  }

  console.log('\nDone. Total phonic files:', fs.readdirSync(OUT_DIR).filter(f => f.startsWith('phonic-')).length);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

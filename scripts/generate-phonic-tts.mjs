#!/usr/bin/env node
/**
 * Generate TTS phonic sound MP3 files for all 26 letters.
 * Each file says: "<letter>. <letter> for <word>." (e.g., "A. A for apple.")
 *
 * Output: public/sounds/phonic-a.mp3 ... phonic-z.mp3
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/home/z/my-project/public/sounds';

const PHONIC_DATA = [
  { letter: "a", word: "apple" },
  { letter: "b", word: "bed" },
  { letter: "c", word: "car" },
  { letter: "d", word: "dog" },
  { letter: "e", word: "egg" },
  { letter: "f", word: "five" },
  { letter: "g", word: "gorilla" },
  { letter: "h", word: "hot" },
  { letter: "i", word: "in" },
  { letter: "j", word: "jump" },
  { letter: "k", word: "koala" },
  { letter: "l", word: "loud" },
  { letter: "m", word: "moon" },
  { letter: "n", word: "no" },
  { letter: "o", word: "on" },
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

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const zai = await ZAI.create();
  console.log('ZAI SDK initialized');

  const voice = 'xiaochen'; // calm/professional voice
  const speed = 0.85; // slightly slower for clarity

  for (const { letter, word } of PHONIC_DATA) {
    const upper = letter.toUpperCase();
    // Say: "A. A for apple." — letter name, then letter+word association
    const text = `${upper}. ${upper} for ${word}.`;
    const outputPath = path.join(OUT_DIR, `phonic-${letter}.wav`);

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
    } catch (err) {
      console.error(`  ✗ Failed to generate phonic-${letter}.wav:`, err);
    }
  }

  console.log('\nAll phonic sounds generated.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Generate high-quality TTS audio for all 26 phonic words.
 * Uses a natural voice, slower speed for clarity.
 * Output: public/sounds/word-<letter>.mp3
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = '/home/z/my-project/public/sounds';

const WORDS = [
  { letter: "a", word: "apple" }, { letter: "b", word: "bed" },
  { letter: "c", word: "car" }, { letter: "d", word: "dog" },
  { letter: "e", word: "egg" }, { letter: "f", word: "five" },
  { letter: "g", word: "gorilla" }, { letter: "h", word: "hot" },
  { letter: "i", word: "in" }, { letter: "j", word: "jump" },
  { letter: "k", word: "koala" }, { letter: "l", word: "loud" },
  { letter: "m", word: "moon" }, { letter: "n", word: "no" },
  { letter: "o", word: "on" }, { letter: "p", word: "panda" },
  { letter: "q", word: "quiet" }, { letter: "r", word: "run" },
  { letter: "s", word: "sun" }, { letter: "t", word: "tent" },
  { letter: "u", word: "umbrella" }, { letter: "v", word: "van" },
  { letter: "w", word: "windy" }, { letter: "x", word: "taxi" },
  { letter: "y", word: "yes" }, { letter: "z", word: "zero" },
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const zai = await ZAI.create();
  console.log('ZAI SDK initialized — generating word audio files...\n');

  // Use 'jam' voice (English gentleman) for clearer pronunciation
  const voice = 'jam';
  const speed = 0.8;

  let success = 0, failed = 0;
  for (const { letter, word } of WORDS) {
    const mp3Path = path.join(OUT_DIR, `word-${letter}.mp3`);
    if (fs.existsSync(mp3Path)) {
      console.log(`  ⊘ word-${letter}.mp3 already exists, skipping`);
      success++;
      continue;
    }

    let retries = 0;
    while (retries < 3) {
      try {
        const response = await zai.audio.tts.create({
          input: word,
          voice: voice,
          speed: speed,
          response_format: 'wav',
          stream: false,
        });
        const arrayBuffer = await response.arrayBuffer();
        const wavPath = path.join(OUT_DIR, `word-${letter}.wav`);
        fs.writeFileSync(wavPath, Buffer.from(new Uint8Array(arrayBuffer)));
        // Convert to MP3
        execSync(`ffmpeg -y -i "${wavPath}" -ar 44100 -ac 2 -b:a 128k -codec:a libmp3lame "${mp3Path}" 2>/dev/null`);
        fs.unlinkSync(wavPath);
        console.log(`  ✓ word-${letter}.mp3 — "${word}"`);
        success++;
        break;
      } catch (err) {
        retries++;
        if (retries >= 3) {
          console.error(`  ✗ word-${letter}.mp3 failed: ${err.message}`);
          failed++;
          break;
        }
        await sleep(5000);
      }
    }
    await sleep(2500);
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed.`);
}

main().catch(console.error);

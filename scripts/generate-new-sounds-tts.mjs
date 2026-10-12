#!/usr/bin/env node
/**
 * Generate TTS MP3 files for the new sound pad sounds:
 * Yes, No, True, False, ooohh (sad), try again
 *
 * Uses browser-friendly WAV format, then converts to MP3 via ffmpeg.
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = '/home/z/my-project/public/sounds';

const NEW_SOUNDS = [
  { id: "yes", text: "Yes!", file: "yes.wav" },
  { id: "no", text: "No!", file: "no.wav" },
  { id: "true", text: "True!", file: "true.wav" },
  { id: "false", text: "False!", file: "false.wav" },
  { id: "ooohh", text: "Ooohh.", file: "ooohh.wav" },
  { id: "try-again", text: "Try again!", file: "try-again.wav" },
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const zai = await ZAI.create();
  console.log('ZAI SDK initialized');

  const voice = 'xiaochen';
  const speed = 0.9;

  for (const { id, text, file } of NEW_SOUNDS) {
    const wavPath = path.join(OUT_DIR, file);
    const mp3Path = path.join(OUT_DIR, file.replace('.wav', '.mp3'));

    // Skip if MP3 already exists
    if (fs.existsSync(mp3Path)) {
      console.log(`  ⊘ ${mp3Path} already exists, skipping`);
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
        fs.writeFileSync(wavPath, buffer);
        console.log(`  ✓ ${file} (${(buffer.length / 1024).toFixed(1)} KB) — "${text}"`);

        // Convert to MP3
        execSync(`ffmpeg -y -i "${wavPath}" -ar 44100 -ac 2 -b:a 128k -codec:a libmp3lame "${mp3Path}" 2>/dev/null`);
        console.log(`  ✓ ${file.replace('.wav', '.mp3')} (converted)`);

        // Delete WAV to save space
        fs.unlinkSync(wavPath);
        break;
      } catch (err) {
        retries++;
        if (retries >= maxRetries) {
          console.error(`  ✗ Failed ${file} after ${maxRetries} retries:`, err.message);
          break;
        }
        console.log(`  ⏳ Rate limited on ${file}, waiting 5s (retry ${retries}/${maxRetries})`);
        await sleep(5000);
      }
    }

    // Delay between requests
    await sleep(3000);
  }

  console.log('\nDone. New sounds:');
  for (const { id, file } of NEW_SOUNDS) {
    const mp3Path = path.join(OUT_DIR, file.replace('.wav', '.mp3'));
    if (fs.existsSync(mp3Path)) {
      const size = (fs.statSync(mp3Path).size / 1024).toFixed(1);
      console.log(`  ${mp3Path} (${size} KB)`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

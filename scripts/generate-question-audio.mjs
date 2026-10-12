#!/usr/bin/env node
/**
 * Generate high-quality TTS MP3 files for each card's unique question.
 * Output: public/sounds/question-<letter>.mp3
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = '/home/z/my-project/public/sounds';

const QUESTIONS = [
  { letter: "a", text: "How are you? I'm good. I'm fine. I'm okay." },
  { letter: "b", text: "What is your name? My name is ..." },
  { letter: "c", text: "How old are you? I'm ... years old." },
  { letter: "d", text: "How's the weather? It's ... today." },
  { letter: "e", text: "Can you ...? Yes, I can. No, I can't." },
  { letter: "f", text: "Do you like ...? Yes, I do. No, I don't." },
  { letter: "g", text: "Do you like animals? Yes, I do. No, I don't." },
  { letter: "h", text: "What is your favorite vegetable? I like ... best." },
  { letter: "i", text: "Do you have any pets? Yes, I do. No, I don't." },
  { letter: "j", text: "Do you have a pen? Yes, I do. No, I don't." },
  { letter: "k", text: "What vegetables do you like? I like ..." },
  { letter: "l", text: "What sports do you like? I like ... and ..." },
  { letter: "m", text: "What sport do you play? I play ..." },
  { letter: "n", text: "How many ... are there? There are ..." },
  { letter: "o", text: "What's your favorite color? I like ... best." },
  { letter: "p", text: "What colors do you like? I like ... and ..." },
  { letter: "q", text: "How many ... do you have? I have ..." },
  { letter: "r", text: "What can you do? I can ..." },
  { letter: "s", text: "Can you play ...? Yes, I can. No, I can't." },
  { letter: "t", text: "Where do you live? I live in ..." },
  { letter: "u", text: "What are you doing? I am ...ing." },
  { letter: "v", text: "Is it sunny today? Yes, it is. No, it isn't." },
  { letter: "w", text: "Do you like ...? Yes, I do. No, I don't." },
  { letter: "x", text: "What is your favorite ...? I like ... best." },
  { letter: "y", text: "Where are you from? I'm from ..." },
  { letter: "z", text: "Do you live near ...? Yes, I do. No, I don't." },
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const zai = await ZAI.create();
  console.log('Generating card question audio files...\n');

  const voice = 'jam';
  const speed = 0.85;

  let success = 0;
  for (const { letter, text } of QUESTIONS) {
    const mp3Path = path.join(OUT_DIR, `question-${letter}.mp3`);
    if (fs.existsSync(mp3Path)) {
      console.log(`  ⊘ question-${letter}.mp3 exists, skipping`);
      success++;
      continue;
    }

    let retries = 0;
    while (retries < 3) {
      try {
        const response = await zai.audio.tts.create({
          input: text, voice, speed,
          response_format: 'wav', stream: false,
        });
        const buf = Buffer.from(new Uint8Array(await response.arrayBuffer()));
        const wavPath = path.join(OUT_DIR, `question-${letter}.wav`);
        fs.writeFileSync(wavPath, buf);
        execSync(`ffmpeg -y -i "${wavPath}" -ar 44100 -ac 2 -b:a 128k -codec:a libmp3lame "${mp3Path}" 2>/dev/null`);
        fs.unlinkSync(wavPath);
        console.log(`  ✓ question-${letter}.mp3 — "${text.slice(0, 40)}..."`);
        success++;
        break;
      } catch (err) {
        retries++;
        if (retries >= 3) {
          console.error(`  ✗ question-${letter}.mp3 failed`);
          break;
        }
        await sleep(5000);
      }
    }
    await sleep(3000);
  }
  console.log(`\nDone: ${success}/${QUESTIONS.length} succeeded.`);
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * Regenerate question audio — ONLY the question part (no answers).
 * Also generate separate answer audio files.
 *
 * Output:
 *   public/sounds/question-only-<letter>.mp3  (just the question)
 *   public/sounds/answer-<letter>.mp3         (the answer options)
 */

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUT_DIR = '/home/z/my-project/public/sounds';

const DATA = [
  { letter: "a", question: "How are you?", answer: "I'm good. I'm fine. I'm okay." },
  { letter: "b", question: "What is your name?", answer: "My name is ..." },
  { letter: "c", question: "How old are you?", answer: "I'm ... years old." },
  { letter: "d", question: "How's the weather?", answer: "It's ... today." },
  { letter: "e", question: "Can you ...?", answer: "Yes, I can. No, I can't." },
  { letter: "f", question: "Do you like ...?", answer: "Yes, I do. No, I don't." },
  { letter: "g", question: "Do you like animals?", answer: "Yes, I do. No, I don't." },
  { letter: "h", question: "What is your favorite vegetable?", answer: "I like ... best." },
  { letter: "i", question: "Do you have any pets?", answer: "Yes, I do. No, I don't." },
  { letter: "j", question: "Do you have a pen?", answer: "Yes, I do. No, I don't." },
  { letter: "k", question: "What vegetables do you like?", answer: "I like ..." },
  { letter: "l", question: "What sports do you like?", answer: "I like ... and ..." },
  { letter: "m", question: "What sport do you play?", answer: "I play ..." },
  { letter: "n", question: "How many ... are there?", answer: "There are ..." },
  { letter: "o", question: "What's your favorite color?", answer: "I like ... best." },
  { letter: "p", question: "What colors do you like?", answer: "I like ... and ..." },
  { letter: "q", question: "How many ... do you have?", answer: "I have ..." },
  { letter: "r", question: "What can you do?", answer: "I can ..." },
  { letter: "s", question: "Can you play ...?", answer: "Yes, I can. No, I can't." },
  { letter: "t", question: "Where do you live?", answer: "I live in ..." },
  { letter: "u", question: "What are you doing?", answer: "I am ...ing." },
  { letter: "v", question: "Is it sunny today?", answer: "Yes, it is. No, it isn't." },
  { letter: "w", question: "Do you like ...?", answer: "Yes, I do. No, I don't." },
  { letter: "x", question: "What is your favorite ...?", answer: "I like ... best." },
  { letter: "y", question: "Where are you from?", answer: "I'm from ..." },
  { letter: "z", question: "Do you live near ...?", answer: "Yes, I do. No, I don't." },
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateAudio(zai, text, letter, type, voice, speed) {
  const mp3Path = path.join(OUT_DIR, `${type}-${letter}.mp3`);
  if (fs.existsSync(mp3Path)) {
    console.log(`  ⊘ ${type}-${letter}.mp3 exists, skipping`);
    return true;
  }

  let retries = 0;
  while (retries < 3) {
    try {
      const response = await zai.audio.tts.create({
        input: text, voice, speed,
        response_format: 'wav', stream: false,
      });
      const buf = Buffer.from(new Uint8Array(await response.arrayBuffer()));
      const wavPath = path.join(OUT_DIR, `${type}-${letter}.wav`);
      fs.writeFileSync(wavPath, buf);
      execSync(`ffmpeg -y -i "${wavPath}" -ar 44100 -ac 2 -b:a 128k -codec:a libmp3lame "${mp3Path}" 2>/dev/null`);
      fs.unlinkSync(wavPath);
      console.log(`  ✓ ${type}-${letter}.mp3 — "${text.slice(0, 40)}"`);
      return true;
    } catch (err) {
      retries++;
      if (retries >= 3) {
        console.error(`  ✗ ${type}-${letter}.mp3 failed: ${err.message}`);
        return false;
      }
      await sleep(5000);
    }
  }
  return false;
}

async function main() {
  const zai = await ZAI.create();
  console.log('Generating question-only and answer audio files...\n');

  const voice = 'jam';
  const questionSpeed = 0.85;
  const answerSpeed = 0.8;

  let qSuccess = 0, aSuccess = 0;
  for (const { letter, question, answer } of DATA) {
    // Generate question-only audio (no answers)
    if (await generateAudio(zai, question, letter, 'question-only', voice, questionSpeed)) qSuccess++;

    await sleep(2500);

    // Generate answer audio
    if (await generateAudio(zai, answer, letter, 'answer', voice, answerSpeed)) aSuccess++;

    await sleep(2500);
  }

  console.log(`\nDone: ${qSuccess}/26 questions, ${aSuccess}/26 answers generated.`);
}

main().catch(console.error);

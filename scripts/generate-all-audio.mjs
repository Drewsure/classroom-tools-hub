import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import { execSync } from 'child_process';

const OUT = '/home/z/my-project/public/sounds';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function gen(zai, text, file, voice='jam', speed=0.85) {
  const mp3 = `${OUT}/${file}.mp3`;
  if (fs.existsSync(mp3)) { console.log(`  skip ${file}`); return; }
  for (let r = 0; r < 3; r++) {
    try {
      const resp = await zai.audio.tts.create({ input: text, voice, speed, response_format: 'wav', stream: false });
      const buf = Buffer.from(new Uint8Array(await resp.arrayBuffer()));
      const wav = mp3.replace('.mp3','.wav');
      fs.writeFileSync(wav, buf);
      execSync(`ffmpeg -y -i "${wav}" -ar 44100 -ac 2 -b:a 128k -codec:a libmp3lame "${mp3}" 2>/dev/null`);
      fs.unlinkSync(wav);
      console.log(`  ✓ ${file}.mp3`);
      return;
    } catch(e) { console.log(`  retry ${file} (${r+1}/3)`); await sleep(8000); }
  }
  console.log(`  FAILED ${file}`);
}

async function main() {
  const zai = await ZAI.create();
  console.log('Generating ALL audio files...\n');

  // 1. Sound pad spoken words (6 files)
  const sounds = [
    {t:'Yes!', f:'yes'},{t:'No!', f:'no'},{t:'True!', f:'true'},
    {t:'False!', f:'false'},{t:'Ooohh.', f:'ooohh'},{t:'Try again!', f:'try-again'}
  ];
  for (const {t,f} of sounds) { await gen(zai, t, f, 'jam', 0.9); await sleep(3000); }

  // 2. Word audio (26 files)
  const words = [['a','apple'],['b','bed'],['c','car'],['d','dog'],['e','egg'],['f','five'],['g','gorilla'],['h','hot'],['i','in'],['j','jump'],['k','koala'],['l','loud'],['m','moon'],['n','no'],['o','on'],['p','panda'],['q','quiet'],['r','run'],['s','sun'],['t','tent'],['u','umbrella'],['v','van'],['w','windy'],['x','taxi'],['y','yes'],['z','zero']];
  for (const [l,w] of words) { await gen(zai, w, `word-${l}`); await sleep(3000); }

  // 3. Question-only audio (26 files)
  const questions = [['a','How are you?'],['b','What is your name?'],['c','How old are you?'],['d',"How's the weather?"],['e','Can you ...?'],['f','Do you like ...?'],['g','Do you like animals?'],['h','What is your favorite vegetable?'],['i','Do you have any pets?'],['j','Do you have a pen?'],['k','What vegetables do you like?'],['l','What sports do you like?'],['m','What sport do you play?'],['n','How many ... are there?'],['o',"What's your favorite color?"],['p','What colors do you like?'],['q','How many ... do you have?'],['r','What can you do?'],['s','Can you play ...?'],['t','Where do you live?'],['u','What are you doing?'],['v','Is it sunny today?'],['w','Do you like ...?'],['x','What is your favorite ...?'],['y','Where are you from?'],['z','Do you live near ...?']];
  for (const [l,q] of questions) { await gen(zai, q, `question-only-${l}`); await sleep(3000); }

  // 4. Answer audio (26 files)
  const answers = [['a',"I'm good. I'm fine. I'm okay."],['b','My name is ...'],['c',"I'm ... years old."],['d',"It's ... today."],['e',"Yes, I can. No, I can't."],['f',"Yes, I do. No, I don't."],['g',"Yes, I do. No, I don't."],['h','I like ... best.'],['i',"Yes, I do. No, I don't."],['j',"Yes, I do. No, I don't."],['k','I like ...'],['l','I like ... and ...'],['m','I play ...'],['n','There are ...'],['o','I like ... best.'],['p','I like ... and ...'],['q','I have ...'],['r','I can ...'],['s',"Yes, I can. No, I can't."],['t','I live in ...'],['u','I am ...ing.'],['v',"Yes, it is. No, it isn't."],['w',"Yes, I do. No, I don't."],['x','I like ... best.'],['y',"I'm from ..."],["z","Yes, I do. No, I don't."]];
  for (const [l,a] of answers) { await gen(zai, a, `answer-${l}`); await sleep(3000); }

  console.log('\nALL AUDIO DONE');
}

main().catch(console.error);

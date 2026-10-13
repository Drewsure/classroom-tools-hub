import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const build = resolve(process.argv[2] ?? join(root, "../../classroom-audio-build"));
const ffmpeg = join(build, "node_modules/ffmpeg-static/ffmpeg.exe");
const sources = join(build, "sources");
const out = join(root, "public/sounds");
const selections = {
  "card-shuffle": ["casino-audio", "card-shuffle"],
  "card-turn": ["casino-audio", "card-slide-1"],
  "dice-roll": ["casino-audio", "dice-throw-2"],
  "classic-finish": ["interface-sounds", "confirmation_001"],
  "rocket-finish": ["sci-fi-sounds", "thrusterFire_003"],
  "bomb-finish": ["sci-fi-sounds", "explosionCrunch_000"],
  "candle-finish": ["casino-audio", "card-fan-1"],
  "hourglass-finish": ["interface-sounds", "bong_001"],
  "circle-finish": ["interface-sounds", "glass_004"],
  "traffic-finish": ["interface-sounds", "error_003"],
  "bar-finish": ["interface-sounds", "confirmation_004"],
  "pe-finish": ["interface-sounds", "confirmation_002"],
  "tally-finish": ["interface-sounds", "confirmation_003"],
  "stopwatch-lap": ["interface-sounds", "click_002"],
};

// Normalize PCM peaks consistently without modifying any existing MP3 recording.
function normalizePcm(file, target) {
  const wav = readFileSync(file);
  let data = 0;
  let length = 0;
  for (let offset = 12; offset + 8 <= wav.length;) {
    const size = wav.readUInt32LE(offset + 4);
    if (wav.toString("ascii", offset, offset + 4) === "data") { data = offset + 8; length = size; break; }
    offset += 8 + size + (size % 2);
  }
  if (!length) throw new Error(`Empty audio: ${file}`);
  let peak = 0;
  for (let i = data; i < data + length; i += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
  if (!peak) throw new Error(`Silent audio: ${file}`);
  const multiplier = target * 32767 / peak;
  for (let i = data; i < data + length; i += 2) wav.writeInt16LE(Math.round(wav.readInt16LE(i) * multiplier), i);
  writeFileSync(file, wav);
  console.log(`${file.split(/[\\/]/).at(-1)}: ${length} PCM bytes, peak ${target}`);
}

for (const [name, [pack, original]] of Object.entries(selections)) {
  const output = join(out, `${name}.wav`);
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i",
    join(sources, pack, "Audio", `${original}.ogg`), "-t", "2.4",
    "-af", "highpass=f=65,lowpass=f=9000,afade=t=in:d=0.008,areverse,afade=t=in:d=0.04,areverse",
    "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", output]);
  normalizePcm(output, 0.55);
}
for (const prefix of ["timer", "elapsed"]) {
  for (const second of [60, 45, 30]) normalizePcm(join(out, `${prefix}-${second}.wav`), 0.68);
}

const licenceDir = join(root, "docs/audio-licenses");
mkdirSync(licenceDir, { recursive: true });
for (const pack of ["casino-audio", "sci-fi-sounds", "interface-sounds"]) {
  copyFileSync(join(sources, pack, "License.txt"), join(licenceDir, `kenney-${pack}.txt`));
}

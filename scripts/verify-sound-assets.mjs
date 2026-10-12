import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const hookPath = join(root, "src", "hooks", "use-sound-pad.ts");
const swPath = join(root, "public", "sw.js");
const soundDir = join(root, "public", "sounds");

const hookSource = readFileSync(hookPath, "utf8");
const swSource = readFileSync(swPath, "utf8");

const soundFilesBlock = hookSource.match(/export const SOUND_FILES[\s\S]*?\];/)?.[0] ?? "";
const soundsBlock = hookSource.match(/export const SOUNDS[\s\S]*?\];/)?.[0] ?? "";

const soundFiles = [...soundFilesBlock.matchAll(/\{\s*id:\s*"([^"]+)",\s*file:\s*"([^"]+)"\s*\}/g)]
  .map(([, id, file]) => ({ id, file }));

const sounds = [...soundsBlock.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?label:\s*"([^"]+)"[\s\S]*?file:\s*"([^"]+)"/g)]
  .map(([, id, label, file]) => ({ id, label, file }));

const failures = [];
const warnings = [];

const duplicates = (items) => items.filter((item, index) => items.indexOf(item) !== index);
const duplicateFileIds = duplicates(soundFiles.map((sound) => sound.id));
const duplicateSoundIds = duplicates(sounds.map((sound) => sound.id));

if (duplicateFileIds.length) failures.push(`Duplicate SOUND_FILES ids: ${duplicateFileIds.join(", ")}`);
if (duplicateSoundIds.length) failures.push(`Duplicate SOUNDS ids: ${duplicateSoundIds.join(", ")}`);

const filesById = new Map(soundFiles.map((sound) => [sound.id, sound.file]));
const soundsById = new Map(sounds.map((sound) => [sound.id, sound]));

for (const { id, file } of soundFiles) {
  const sound = soundsById.get(id);
  if (!sound) failures.push(`SOUND_FILES id "${id}" has no SOUNDS button`);
  if (sound && sound.file !== file) {
    failures.push(`Sound "${id}" maps to "${file}" in SOUND_FILES but "${sound.file}" in SOUNDS`);
  }
}

for (const { id } of sounds) {
  if (!filesById.has(id)) failures.push(`SOUNDS id "${id}" has no SOUND_FILES entry`);
}

const isMp3 = (buffer) =>
  buffer.slice(0, 3).toString("latin1") === "ID3" ||
  (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);

const isWav = (buffer) =>
  buffer.slice(0, 4).toString("latin1") === "RIFF" &&
  buffer.slice(8, 12).toString("latin1") === "WAVE";

for (const { id, file } of soundFiles) {
  const path = join(soundDir, file);
  if (!existsSync(path)) {
    failures.push(`Sound "${id}" points to missing file: ${file}`);
    continue;
  }

  const buffer = readFileSync(path);
  const validSignature = file.endsWith(".mp3") ? isMp3(buffer) : file.endsWith(".wav") ? isWav(buffer) : false;
  if (!validSignature) failures.push(`Sound "${id}" has an invalid audio signature: ${file}`);

  const size = statSync(path).size;
  if (size > 2_500_000) {
    failures.push(`Sound "${id}" is too large for instant classroom playback: ${file} (${size} bytes)`);
  }

  if (!swSource.includes(`"/sounds/${file}"`)) {
    failures.push(`Service worker does not precache sound-pad file: ${file}`);
  }
}

const publicSoundFiles = readdirSync(soundDir).filter((file) => /\.(mp3|wav)$/i.test(file));
for (const file of publicSoundFiles) {
  const size = statSync(join(soundDir, file)).size;
  if (size > 2_500_000 && !soundFiles.some((sound) => sound.file === file)) {
    warnings.push(`Large unreferenced public audio kept out of sound pad: ${file} (${size} bytes)`);
  }
}

if (failures.length > 0) {
  console.error("Sound asset verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length) {
    console.error("\nWarnings:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

for (const warning of warnings) console.warn(`Warning: ${warning}`);
console.log(`Verified ${sounds.length} sound buttons and ${new Set(soundFiles.map((sound) => sound.file)).size} sound-pad audio files.`);

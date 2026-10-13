import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(root, "public");
const sourceDirs = [join(root, "src")];
const sourceFiles = [join(root, "public", "manifest.json"), join(root, "public", "sw.js")];
const publicInfrastructure = new Set(["manifest.json", "robots.txt", "sw.js"]);

const failures = [];
const warnings = [];
const expectedAssets = new Set();

const walk = (dir, files = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
};

for (const dir of sourceDirs) {
  sourceFiles.push(
    ...walk(dir).filter((path) => /\.(ts|tsx|js|jsx|json|css)$/i.test(path)),
  );
}

for (const sourceFile of sourceFiles) {
  const source = readFileSync(sourceFile, "utf8");
  for (const match of source.matchAll(/["'`](\/(?:images|sounds|icons)\/[^"'`\s)]+)["'`]/g)) {
    if (!match[1].includes("${")) {
      expectedAssets.add(new URL(match[1], "https://classroom.invalid").pathname);
    }
  }
}

const phonicCardsSource = readFileSync(join(root, "src", "lib", "phonic-cards.ts"), "utf8");
const phonicLetters = [...phonicCardsSource.matchAll(/letter:\s*"([a-z])"/g)].map((match) => match[1]);
for (const letter of phonicLetters) {
  expectedAssets.add(`/images/cards/card-${letter}.png`);
  expectedAssets.add(`/sounds/word-${letter}.mp3`);
  expectedAssets.add(`/sounds/question-only-${letter}.mp3`);
}

for (let i = 1; i <= 10; i++) expectedAssets.add(`/sounds/countdown-${i}.mp3`);

const manifest = JSON.parse(readFileSync(join(root, "public", "manifest.json"), "utf8"));
for (const icon of manifest.icons ?? []) expectedAssets.add(icon.src);
for (const shortcut of manifest.shortcuts ?? []) {
  for (const icon of shortcut.icons ?? []) expectedAssets.add(icon.src);
}

const isPng = (buffer) =>
  buffer[0] === 0x89 &&
  buffer.slice(1, 4).toString("latin1") === "PNG";

const isGif = (buffer) => {
  const header = buffer.slice(0, 6).toString("latin1");
  return header === "GIF87a" || header === "GIF89a";
};

const isMp3 = (buffer) =>
  buffer.slice(0, 3).toString("latin1") === "ID3" ||
  (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);

const validateSignature = (asset, path) => {
  const buffer = readFileSync(path);
  const ext = extname(path).toLowerCase();
  if (ext === ".png" && !isPng(buffer)) failures.push(`Invalid PNG signature: ${asset}`);
  if (ext === ".gif" && !isGif(buffer)) failures.push(`Invalid GIF signature: ${asset}`);
  if (ext === ".mp3" && !isMp3(buffer)) failures.push(`Invalid MP3 signature: ${asset}`);
};

for (const asset of [...expectedAssets].sort()) {
  const path = join(publicDir, asset.slice(1));
  if (!existsSync(path)) {
    failures.push(`Missing public asset: ${asset}`);
    continue;
  }
  validateSignature(asset, path);
}

const publicFiles = walk(publicDir);
const expectedPublicPaths = new Set([...expectedAssets].map((asset) => asset.slice(1).replaceAll("/", "\\")));
const publicArchives = publicFiles.filter((path) => /\.(zip|7z|rar|tar|gz)$/i.test(path));
for (const archive of publicArchives) {
  failures.push(`Archive file must not be shipped from public/: ${relative(publicDir, archive)}`);
}

const totalBytes = publicFiles.reduce((sum, path) => sum + statSync(path).size, 0);
const oversizedFiles = publicFiles
  .map((path) => ({ path, size: statSync(path).size }))
  .filter(({ size }) => size > 2_500_000)
  .sort((a, b) => b.size - a.size);

for (const file of oversizedFiles) {
  warnings.push(`Large public file: ${relative(publicDir, file.path)} (${file.size} bytes)`);
}

const unreferencedFiles = publicFiles
  .map((path) => ({ path, rel: relative(publicDir, path), size: statSync(path).size }))
  .filter(({ rel }) => !expectedPublicPaths.has(rel))
  .filter(({ rel }) => !publicInfrastructure.has(rel))
  .sort((a, b) => b.size - a.size);

const unreferencedBytes = unreferencedFiles.reduce((sum, file) => sum + file.size, 0);
if (unreferencedFiles.length > 0) {
  warnings.push(`Unreferenced public payload: ${unreferencedFiles.length} files, ${unreferencedBytes} bytes`);
  for (const file of unreferencedFiles.slice(0, 12)) {
    warnings.push(`Unreferenced public file: ${file.rel} (${file.size} bytes)`);
  }
}

if (totalBytes > 80_000_000) {
  warnings.push(`Public folder is heavy for a classroom PWA: ${totalBytes} bytes`);
}

if (failures.length > 0) {
  console.error("Public asset verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length) {
    console.error("\nWarnings:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

for (const warning of warnings) console.warn(`Warning: ${warning}`);
console.log(`Verified ${expectedAssets.size} referenced public assets. Public payload: ${totalBytes} bytes.`);

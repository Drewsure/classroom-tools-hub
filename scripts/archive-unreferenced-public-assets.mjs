import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(root, "public");
const archiveDir = join(root, "docs", "legacy-public-assets");
const alwaysKeep = new Set(["manifest.json", "robots.txt", "sw.js"]);

const walk = (dir, files = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
};

const expectedAssets = new Set();
const sourceFiles = [join(root, "public", "manifest.json"), join(root, "public", "sw.js")];

for (const path of walk(join(root, "src")).filter((file) => /\.(ts|tsx|js|jsx|json|css)$/i.test(file))) {
  sourceFiles.push(path);
}

for (const sourceFile of sourceFiles) {
  const source = readFileSync(sourceFile, "utf8");
  for (const match of source.matchAll(/["'`](\/(?:images|sounds|icons)\/[^"'`\s)]+)["'`]/g)) {
    if (!match[1].includes("${")) expectedAssets.add(match[1].slice(1).replaceAll("/", "\\"));
  }
}

const phonicCardsSource = readFileSync(join(root, "src", "lib", "phonic-cards.ts"), "utf8");
for (const [, letter] of phonicCardsSource.matchAll(/letter:\s*"([a-z])"/g)) {
  expectedAssets.add(`images\\cards\\card-${letter}.png`);
  expectedAssets.add(`sounds\\word-${letter}.mp3`);
  expectedAssets.add(`sounds\\question-only-${letter}.mp3`);
}

for (let i = 1; i <= 10; i++) expectedAssets.add(`sounds\\countdown-${i}.mp3`);

const manifest = JSON.parse(readFileSync(join(root, "public", "manifest.json"), "utf8"));
for (const icon of manifest.icons ?? []) expectedAssets.add(icon.src.slice(1).replaceAll("/", "\\"));
for (const shortcut of manifest.shortcuts ?? []) {
  for (const icon of shortcut.icons ?? []) expectedAssets.add(icon.src.slice(1).replaceAll("/", "\\"));
}

const candidates = walk(publicDir)
  .map((path) => ({ path, rel: relative(publicDir, path), size: statSync(path).size }))
  .filter(({ rel }) => !alwaysKeep.has(rel))
  .filter(({ rel }) => !expectedAssets.has(rel));

let movedBytes = 0;
for (const { path, rel, size } of candidates) {
  const target = join(archiveDir, rel);
  mkdirSync(dirname(target), { recursive: true });
  if (existsSync(target)) {
    throw new Error(`Archive target already exists: ${relative(root, target)}`);
  }
  renameSync(path, target);
  movedBytes += size;
}

console.log(`Archived ${candidates.length} unreferenced public files (${movedBytes} bytes) to ${relative(root, archiveDir)}.`);

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
const source = readFileSync(new URL("../src/lib/i-can-cards.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { I_CAN_CARDS, I_CAN_SONG_CARDS, I_CAN_SONG, I_CAN_SONG_ORDER } =
  await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

test("the eight core actions follow the supplied lyric order; extras follow afterwards", () => {
  assert.deepEqual(I_CAN_CARDS.map((card) => card.id),
    ["jump", "run", "stretch", "spin", "walk", "cook", "climb", "sing", "dance", "swim", "do-it-all"]);
});
test("the song sequence includes both repeated choruses and both final choruses", () => {
  const first = ["jump", "run", "stretch", "spin"], second = ["walk", "cook", "climb", "sing"];
  assert.deepEqual(I_CAN_SONG_ORDER, [...first, ...first, ...first, ...second, ...second, ...second,
    ...first, ...second, ...first, ...second]);
  assert.equal(I_CAN_SONG_CARDS.length, 40);
  assert.equal(new Set(I_CAN_SONG_CARDS.map((card) => card.id)).size, 40);
  assert.ok(I_CAN_SONG_CARDS.every((card) => card.image && card.label));
});
test("all supplied images are valid portrait PNGs and are available offline", () => {
  const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  for (const card of I_CAN_CARDS) {
    const bytes = readFileSync(new URL("../public" + card.image, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.ok(bytes.readUInt32BE(16) < bytes.readUInt32BE(20));
    assert.ok(worker.includes(JSON.stringify(card.image)));
  }
});
test("the supplied original MP3 is preserved byte for byte and precached", () => {
  const bytes = readFileSync(new URL("../public" + I_CAN_SONG.src, import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "6c7c197d3ca0f4720df48e63b723fa4b569c09286c8dce2770ba6eac16888f15");
  const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.ok(worker.includes(JSON.stringify(I_CAN_SONG.src)));
});

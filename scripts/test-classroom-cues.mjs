import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../src/lib/classroom-cues.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { TimerMilestones, CLASSROOM_CUE_FILES, TIMER_FINISH_CUES } =
  await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

test("countdowns announce all three marks once", () => {
  const tracker = new TimerMilestones();
  assert.equal(tracker.update(61, true), null);
  assert.equal(tracker.update(60, true), 60);
  assert.equal(tracker.update(60, true), null);
  assert.equal(tracker.update(45, true), 45);
  assert.equal(tracker.update(30, true), 30);
});

test("a timer starting exactly at a milestone announces it", () => {
  for (const value of [60, 45, 30]) {
    assert.equal(new TimerMilestones().update(value, true), value);
  }
});

test("pause and resume do not repeat an announcement", () => {
  const tracker = new TimerMilestones();
  assert.equal(tracker.update(45, true), 45);
  assert.equal(tracker.update(45, false), null);
  assert.equal(tracker.update(45, true), null);
});

test("reset and a longer restart allow fresh announcements", () => {
  const tracker = new TimerMilestones();
  tracker.update(30, true);
  tracker.reset();
  assert.equal(tracker.update(30, true), 30);
  tracker.update(90, false);
  assert.equal(tracker.update(60, true), 60);
});

test("minor clock drift crosses a mark without losing it", () => {
  const tracker = new TimerMilestones();
  tracker.update(46, true);
  assert.equal(tracker.update(44, true), 45);
});

test("large background jumps do not queue stale voice announcements", () => {
  const tracker = new TimerMilestones();
  tracker.update(90, true);
  assert.equal(tracker.update(20, true), null);
  assert.equal(tracker.update(0, true), null);
});

test("elapsed stopwatches announce in ascending order", () => {
  const tracker = new TimerMilestones();
  assert.equal(tracker.update(0, true, "up"), null);
  assert.equal(tracker.update(30, true, "up"), 30);
  assert.equal(tracker.update(45, true, "up"), 45);
  assert.equal(tracker.update(60, true, "up"), 60);
  assert.equal(tracker.update(60, true, "up"), null);
});

test("countdown timer finishes have distinct audio files", () => {
  const ids = ["classic", "rocket", "bomb", "candle", "hourglass", "circle", "snail-race", "traffic-light", "bar"];
  assert.equal(new Set(ids.map((id) => TIMER_FINISH_CUES[id])).size, ids.length);
  assert.equal(TIMER_FINISH_CUES["snail-race"], "cheer.mp3");
});

test("every classroom cue is a nonempty supported asset and is precached", () => {
  const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  for (const file of CLASSROOM_CUE_FILES) {
    const bytes = readFileSync(new URL(`../public/sounds/${file}`, import.meta.url));
    assert.ok(bytes.length > 100, file);
    assert.ok(sw.includes(`"/sounds/${file}"`), `Offline cache: ${file}`);
    if (!file.endsWith(".wav")) continue;
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", file);
    assert.equal(bytes.toString("ascii", 8, 12), "WAVE", file);
    let pcm = null;
    let format = null;
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const length = bytes.readUInt32LE(offset + 4);
      const id = bytes.toString("ascii", offset, offset + 4);
      if (id === "fmt ") format = offset + 8;
      if (id === "data") pcm = bytes.subarray(offset + 8, offset + 8 + length);
      offset += length + 8 + (length % 2);
    }
    assert.ok(format && pcm?.length, `WAV chunks: ${file}`);
    assert.equal(bytes.readUInt16LE(format), 1, `PCM codec: ${file}`);
    assert.equal(bytes.readUInt16LE(format + 2), 1, `Mono: ${file}`);
    assert.equal(bytes.readUInt16LE(format + 14), 16, `16 bit: ${file}`);
    let peak = 0;
    for (let i = 0; i < pcm.length; i += 2) peak = Math.max(peak, Math.abs(pcm.readInt16LE(i)));
    assert.ok(peak > 1000 && peak < 25000, `Audible unclipped PCM: ${file}`);
  }
});

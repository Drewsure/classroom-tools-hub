import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";

const engineSource = readFileSync(new URL("../src/lib/sound-pad-engine.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(engineSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { SoundPadEngine } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("the four favourite recordings are preserved byte for byte", () => {
  const expected = {
    "heartbeat.mp3": "629c6ff6b6c57611fa1791aa7bcdb69bb2fca6a4a3322a49fe5eee03656f73c3",
    "gameshow.mp3": "4a45b00a185e7bd4f4dcece8c9a768e39d3d7660f410463a5fc244f4fca971d7",
    "laugh.mp3": "49e4acb38f7d6e7a9720bb000aa9ac6fb29084c581e4bd0941d7cc0587f76151",
    "cheer.mp3": "a70a80349894e120d8d2826a7951af7dddedeab1b296ff4f741e15f6770499ad",
  };
  for (const [file, hash] of Object.entries(expected)) {
    const bytes = readFileSync(new URL(`../public/sounds/${file}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, file);
  }
});

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function fixture(fetchAudio = async () => new ArrayBuffer(8)) {
  const events = [];
  const sources = [];
  let contexts = 0;
  let closes = 0;
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {}, gain: param() });
  const context = {
    state: "running", currentTime: 0, destination: {},
    resume: async () => {},
    close: async () => { closes++; context.state = "closed"; },
    decodeAudioData: async () => ({ duration: 2 }),
    createGain: node,
    createDynamicsCompressor: () => ({ ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }),
    createBiquadFilter: () => ({ ...node(), frequency: param(), Q: param() }),
    createBufferSource: () => {
      const source = { ...node(), starts: 0, stops: 0, start() { this.starts++; }, stop() { this.stops++; } };
      sources.push(source);
      return source;
    },
  };
  const engine = new SoundPadEngine({
    files: [{ id: "a", file: "a.mp3" }, { id: "b", file: "b.mp3" }],
    gains: {}, filters: {}, fetchAudio,
    contextFactory: () => { contexts++; return context; },
    onStatus: (status) => events.push({ ...status }),
  });
  return { engine, events, sources, get contexts() { return contexts; }, get closes() { return closes; } };
}

test("preloading does not open an AudioContext before a user gesture", async () => {
  const f = fixture();
  await f.engine.preload();
  assert.equal(f.contexts, 0);
});

test("Stop All cancels playback waiting for a download", async () => {
  const download = deferred();
  const f = fixture(() => download.promise);
  const playback = f.engine.play("a");
  f.engine.stopAll();
  download.resolve(new ArrayBuffer(8));
  await playback;
  assert.equal(f.sources.length, 0);
  assert.equal(f.events.at(-1).playingId, null);
  assert.equal(f.events.at(-1).loadingId, null);
});

test("latest pad wins even when an earlier download finishes later", async () => {
  const first = deferred();
  const f = fixture((url) => url.endsWith("a.mp3") ? first.promise : Promise.resolve(new ArrayBuffer(8)));
  const oldPlayback = f.engine.play("a");
  await f.engine.play("b");
  first.resolve(new ArrayBuffer(8));
  await oldPlayback;
  assert.equal(f.sources.length, 1);
  assert.equal(f.events.at(-1).playingId, "b");
});

test("mute cancels a pending sound and zero volume creates no source", async () => {
  const download = deferred();
  const f = fixture(() => download.promise);
  const playback = f.engine.play("a");
  f.engine.setVolume(0);
  download.resolve(new ArrayBuffer(8));
  await playback;
  await f.engine.play("b");
  assert.equal(f.sources.length, 0);
});

test("Stop All keeps the context reusable; disposal closes it only once", async () => {
  const f = fixture();
  await f.engine.play("a");
  f.engine.stopAll();
  await f.engine.play("a");
  assert.equal(f.contexts, 1);
  assert.equal(f.closes, 0);
  assert.equal(f.sources[0].stops, 1);
  f.engine.dispose();
  f.engine.dispose();
  assert.equal(f.closes, 1);
});

test("download failures show an error and a later tap retries", async () => {
  let calls = 0;
  const f = fixture(async () => {
    if (++calls === 1) throw new Error("offline");
    return new ArrayBuffer(8);
  });
  await f.engine.play("a");
  assert.match(f.events.at(-1).error, /retry/);
  await f.engine.play("a");
  assert.equal(f.events.at(-1).error, null);
  assert.equal(f.events.at(-1).playingId, "a");
});

test("natural completion clears the active indicator", async () => {
  const f = fixture();
  await f.engine.play("a");
  f.sources[0].onended();
  assert.equal(f.events.at(-1).playingId, null);
});

test("disposed engines never play pending sounds or report stale status", async () => {
  const download = deferred();
  const f = fixture(() => download.promise);
  const playback = f.engine.play("a");
  f.engine.dispose();
  const count = f.events.length;
  download.resolve(new ArrayBuffer(8));
  await playback;
  assert.equal(f.sources.length, 0);
  assert.equal(f.events.length, count);
});

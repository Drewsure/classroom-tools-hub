import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://classroom.test";
function worker(network = async () => { throw new Error("offline"); }) {
  const stores = new Map();
  const handlers = {};
  const keyOf = (input) => new URL(typeof input === "string" ? input : input.url, origin).href;
  let activated = false;
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(key) { return stores.delete(key); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async match(request) { return entries.get(keyOf(request))?.clone(); },
        async put(request, response) {
          if (response.status === 206) throw new Error("Partial response cannot be cached");
          entries.set(keyOf(request), response.clone());
        },
        async add(request) {
          const response = await network({ url: keyOf(request) });
          if (!response.ok) throw new Error("Failed asset");
          entries.set(keyOf(request), response.clone());
        },
      };
    },
    async match(request) {
      for (const name of stores.keys()) {
        const result = await (await caches.open(name)).match(request);
        if (result) return result;
      }
    },
  };
  const context = {
    caches, fetch: network, URL, Response, Headers,
    self: { location: { origin }, clients: { claim: async () => {}, matchAll: async () => [] },
      skipWaiting: async () => { activated = true; },
      addEventListener: (name, fn) => { handlers[name] = fn; } },
  };
  vm.runInNewContext(source, context);
  const version = /const VERSION = "([^"]+)"/.exec(source)[1];
  return {
    caches, context, version, handlers, activated: () => activated,
    async fetch(path, options = {}) {
      let response;
      const jobs = [];
      handlers.fetch({ request: { method: "GET", url: origin + path, mode: options.mode ?? "cors",
        headers: new Headers(options.headers) }, respondWith: (value) => { response = value; },
        waitUntil: (job) => jobs.push(job) });
      if (!response) return null;
      const result = await response;
      await Promise.all(jobs);
      return result;
    },
  };
}
test("updates preserve the previous build and unrelated browser caches", async () => {
  const w = worker();
  for (const name of ["cth-static-v1.5.2", "cth-runtime-v1.5.2", "cth-static-v1.5.20",
    "cth-runtime-v1.5.20", "teacher-resources", "cth-static-" + w.version]) await w.caches.open(name);
  let job;
  w.handlers.activate({ waitUntil: (promise) => { job = promise; } });
  await job;
  const keys = await w.caches.keys();
  assert.ok(keys.includes("teacher-resources"));
  assert.ok(keys.includes("cth-runtime-v1.5.20"));
  assert.ok(!keys.includes("cth-static-v1.5.2"));
});
test("Safari byte-range playback works from the offline music cache", async () => {
  const w = worker();
  const cache = await w.caches.open("cth-static-" + w.version);
  await cache.put("/sounds/test.mp3", new Response(new Uint8Array([1, 2, 3, 4]), { headers: { "Content-Type": "audio/mpeg" } }));
  const response = await w.fetch("/sounds/test.mp3", { headers: { Range: "bytes=0-1" } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("Content-Range"), "bytes 0-1/4");
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2]);
});
test("suffix, open-ended and unsatisfiable audio ranges are handled correctly", async () => {
  const w = worker();
  const response = () => new Response(new Uint8Array([1, 2, 3, 4]));
  assert.deepEqual([...new Uint8Array(await (await w.context.cachedRange(response(), "bytes=-2")).arrayBuffer())], [3, 4]);
  assert.deepEqual([...new Uint8Array(await (await w.context.cachedRange(response(), "bytes=2-")).arrayBuffer())], [3, 4]);
  for (const range of ["bytes=9-10", "bytes=3-2", "bytes=-", "bytes=0-1,3-4", "bytes=-0"]) {
    assert.equal((await w.context.cachedRange(response(), range)).status, 416);
  }
});
test("server failures cannot poison a cached app shell", async () => {
  const w = worker(async () => new Response("server error", { status: 503 }));
  await (await w.caches.open("cth-static-" + w.version)).put("/", new Response("healthy shell"));
  const response = await w.fetch("/", { mode: "navigate" });
  assert.equal(await response.text(), "healthy shell");
});
test("offline navigation prefers the current shell over older versions", async () => {
  const w = worker();
  await (await w.caches.open("cth-static-v1.5.20")).put("/", new Response("old"));
  await (await w.caches.open("cth-static-" + w.version)).put("/", new Response("current"));
  assert.equal(await (await w.fetch("/", { mode: "navigate" })).text(), "current");
});
test("partial network responses are not written into the full audio cache", async () => {
  const w = worker(async () => new Response(new Uint8Array([1, 2]), { status: 206 }));
  assert.equal((await w.fetch("/sounds/test.mp3", { headers: { Range: "bytes=0-1" } })).status, 206);
  assert.equal(await w.caches.match("/sounds/test.mp3"), undefined);
});
test("an update is not activated when the required app shell fails to download", async () => {
  const w = worker(async () => new Response("unavailable", { status: 503 }));
  let job;
  w.handlers.install({ waitUntil: (promise) => { job = promise; } });
  await assert.rejects(job);
  assert.equal(w.activated(), false);
});
test("RSC responses are never substituted for a cached HTML page", async () => {
  const w = worker();
  assert.equal(await w.fetch("/", { headers: { RSC: "1" } }), null);
});

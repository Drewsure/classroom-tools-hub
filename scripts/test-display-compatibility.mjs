import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import sharp from "sharp";

const source = readFileSync(new URL("../src/lib/display-compatibility.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { DISPLAY_COMPATIBILITY_SCRIPT } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

function mode({ userAgent = "Chrome desktop", search = "", supports = true, cssMissing = false, attributes = {}, coarsePointer = false } = {}) {
  let result;
  const window = { location: { search } };
  window.matchMedia = () => ({ matches: coarsePointer });
  if (!cssMissing) window.CSS = { supports: () => supports };
  runInNewContext(DISPLAY_COMPATIBILITY_SCRIPT, {
    window,
    navigator: { userAgent },
    document: { documentElement: { setAttribute: (key, value) => {
      attributes[key] = value;
      if (key === "data-display-mode") result = value;
    } } },
  });
  return result;
}

test("Android uses compatible display without a storage API", () => {
  assert.equal(mode({ userAgent: "Mozilla/5.0 (Linux; Android 12; Tablet)" }), "compatible");
});
test("modern desktop retains the standard display", () => {
  assert.equal(mode(), "standard");
});
test("touch tablets using a desktop user-agent still receive the illustrated compatible board", () => {
  assert.equal(mode({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/155", coarsePointer: true }), "compatible");
});
test("the safe link works alongside other query parameters", () => {
  assert.equal(mode({ search: "?class=1&safe=1&other=2" }), "compatible");
  assert.equal(mode({ search: "?unsafe=1" }), "standard");
  assert.equal(mode({ search: "?safe=10" }), "standard");
});
test("missing or unsupported color APIs enable compatible display", () => {
  assert.equal(mode({ cssMissing: true }), "compatible");
  assert.equal(mode({ supports: false }), "compatible");
});
test("plain launch is opt-in and also enables compatible tool rendering", () => {
  const attributes = {};
  assert.equal(mode({ search: "?safe=2", attributes }), "compatible");
  assert.equal(attributes["data-plain-launch"], "true");
  const standardAttributes = {};
  mode({ attributes: standardAttributes });
  assert.equal(standardAttributes["data-plain-launch"], undefined);
});
test("all 29 tool thumbnails use fresh, bounded PNGs and are precached", () => {
  const map = readFileSync(new URL("../src/lib/tool-art.generated.ts", import.meta.url), "utf8");
  const paths = [...map.matchAll(/"(\/images\/manga-icons\/bitmap-[^\"]+\.png)"/g)];
  const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.equal(paths.length, 29);
  for (const match of paths) {
    const icon = readFileSync(new URL("../public" + match[1], import.meta.url));
    assert.deepEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(icon.readUInt32BE(16), 320);
    assert.equal(icon.readUInt32BE(20), 320);
    assert.ok(worker.includes(JSON.stringify(match[1])));
  }
  assert.doesNotMatch(map, /\.svg/);
});
test("every PNG thumbnail decodes to nonblank colorful artwork", async () => {
  const map = readFileSync(new URL("../src/lib/tool-art.generated.ts", import.meta.url), "utf8");
  for (const match of map.matchAll(/"(\/images\/manga-icons\/bitmap-[^\"]+\.png)"/g)) {
    const icon = readFileSync(new URL("../public" + match[1], import.meta.url));
    const stats = await sharp(icon).stats();
    assert.ok(stats.channels.slice(0, 3).every(channel => channel.stdev > 20), match[1]);
  }
});
test("flash overlays are hidden, not frozen opaque, and layout transforms stay intact", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\[data-decorative-effect\][\s\S]*?display: none !important/);
  const overlays = readFileSync(new URL("../src/components/effects/effect-overlays.tsx", import.meta.url), "utf8");
  assert.match(overlays, /data-decorative-effect="flash"/);
  assert.doesNotMatch(css, /transform: none !important/);
});

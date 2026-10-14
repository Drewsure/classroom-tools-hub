import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/display-compatibility.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { DISPLAY_COMPATIBILITY_SCRIPT } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

function mode({ userAgent = "Chrome desktop", search = "", supports = true, cssMissing = false } = {}) {
  let result;
  const window = { location: { search } };
  if (!cssMissing) window.CSS = { supports: () => supports };
  runInNewContext(DISPLAY_COMPATIBILITY_SCRIPT, {
    window,
    navigator: { userAgent },
    document: { documentElement: { setAttribute: (key, value) => {
      assert.equal(key, "data-display-mode");
      result = value;
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
test("the safe link works alongside other query parameters", () => {
  assert.equal(mode({ search: "?class=1&safe=1&other=2" }), "compatible");
  assert.equal(mode({ search: "?unsafe=1" }), "standard");
  assert.equal(mode({ search: "?safe=10" }), "standard");
});
test("missing or unsupported color APIs enable compatible display", () => {
  assert.equal(mode({ cssMissing: true }), "compatible");
  assert.equal(mode({ supports: false }), "compatible");
});
test("flash overlays are hidden, not frozen opaque, and layout transforms stay intact", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\[data-decorative-effect\][\s\S]*?display: none !important/);
  const overlays = readFileSync(new URL("../src/components/effects/effect-overlays.tsx", import.meta.url), "utf8");
  assert.match(overlays, /data-decorative-effect="flash"/);
  assert.doesNotMatch(css, /transform: none !important/);
});

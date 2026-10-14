import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/tools/attendance-dialog.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("attendance.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "closeOnEscape") handler = node.initializer.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(handler, "The attendance Escape handler must exist");
const code = ts.transpileModule(
  `export function create(confirmation, setConfirmation, onClose) { return ${handler}; }`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } },
).outputText;
const { create } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

function simulate(confirmation, key) {
  const calls = [];
  const onKey = create(confirmation, (value) => calls.push(["confirmation", value]), () => calls.push(["attendance"]));
  onKey({ key, preventDefault: () => calls.push(["prevent"]), stopImmediatePropagation: () => calls.push(["stop"]) });
  return calls;
}
test("Escape cancels only the active confirmation and stops global tool-close handlers", () => {
  assert.deepEqual(simulate({ kind: "absent" }, "Escape"), [["prevent"], ["stop"], ["confirmation", null]]);
});
test("Escape closes attendance when no confirmation is open", () => {
  assert.deepEqual(simulate(null, "Escape"), [["prevent"], ["stop"], ["attendance"]]);
});
test("other keys are left alone for controls and keyboard navigation", () => {
  assert.deepEqual(simulate({ kind: "remove" }, "Tab"), []);
});

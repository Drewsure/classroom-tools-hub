import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(new URL("../src/components/tools/pe-english-hub.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("pe.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ["SIMON_COMMANDS", "SIMON_TRICKS", "BODY_PARTS", "PE_DICE_PRESETS"];
const declarations = ast.statements.filter((statement) => ts.isVariableStatement(statement) &&
  statement.declarationList.declarations.some((declaration) => names.includes(declaration.name.getText(ast))));
const code = ts.transpileModule(declarations.map((statement) => statement.getText(ast)).join("\n") +
  "\nexport { SIMON_COMMANDS, SIMON_TRICKS, BODY_PARTS, PE_DICE_PRESETS };",
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { SIMON_COMMANDS, SIMON_TRICKS, BODY_PARTS, PE_DICE_PRESETS } =
  await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
test("every body part mentioned in commands is available in reference and body-part dice", () => {
  const references = new Set(BODY_PARTS.map((part) => part.id));
  const dice = new Set(PE_DICE_PRESETS.bodyParts.map((part) => part.id));
  const words = [...SIMON_COMMANDS, ...SIMON_TRICKS].join(" ").toLowerCase();
  for (const part of ["head", "shoulder", "knee", "toe", "elbow", "ankle", "backside", "back",
    "hand", "leg", "arm", "finger", "feet", "eye", "ear", "mouth", "nose"]) {
    if (!new RegExp("\\b" + part + "(?:s)?\\b").test(words)) continue;
    const id = ["head", "ankle", "back", "backside", "feet", "mouth", "nose"].includes(part) ? part : part + "s";
    assert.ok(references.has(id), "Missing reference: " + part);
    assert.ok(dice.has(id), "Missing dice part: " + part);
  }
});
test("all requested facial parts and yell are available even without a command draw", () => {
  for (const part of ["eyes", "ears", "mouth", "nose"]) assert.ok(BODY_PARTS.some((item) => item.id === part));
  assert.ok(PE_DICE_PRESETS.movements.some((item) => item.id === "yell"));
  assert.equal(new Set(BODY_PARTS.map((item) => item.id)).size, BODY_PARTS.length);
});
test("command action vocabulary is represented in movement reference and dice", () => {
  const words = SIMON_COMMANDS.join(" ").toLowerCase();
  const movements = new Set(PE_DICE_PRESETS.movements.map((item) => item.id));
  for (const verb of ["spin", "jump", "run", "hop", "march", "swim", "walk", "stretch", "climb", "sing",
    "freeze", "flap", "wiggle", "stomp", "whisper", "shout", "cross", "sit", "roll", "point", "yell", "clap"]) {
    if (new RegExp("\\b" + verb + "\\b").test(words)) assert.ok(movements.has(verb), "Missing movement: " + verb);
  }
});

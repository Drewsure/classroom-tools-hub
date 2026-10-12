import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const toolsPath = join(root, "src", "lib", "tools.ts");
const launcherPath = join(root, "src", "components", "tools", "tool-launcher.tsx");
const weatherPath = join(root, "src", "components", "tools", "weather-flashcards.tsx");

const toolsSource = readFileSync(toolsPath, "utf8");
const launcherSource = readFileSync(launcherPath, "utf8");
const weatherSource = readFileSync(weatherPath, "utf8");

const toolIds = [...toolsSource.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
const duplicateToolIds = toolIds.filter((id, index) => toolIds.indexOf(id) !== index);
const rendererIds = [...launcherSource.matchAll(/case\s+"([^"]+)":/g)].map((match) => match[1]);
const missingRenderers = toolIds.filter((id) => !rendererIds.includes(id));
const orphanRenderers = rendererIds.filter((id) => !toolIds.includes(id));

const categories = [
  ...new Set([...toolsSource.matchAll(/\bcategory:\s*"([^"]+)"/g)].map((match) => match[1])),
];
const categoryInfoKeys = [
  ...toolsSource.matchAll(/^\s{2}([a-z-]+):\s*\{/gm),
].map((match) => match[1]);
const missingCategoryInfo = categories.filter((category) => !categoryInfoKeys.includes(category));

const weatherTypes = [...weatherSource.matchAll(/"([a-z]+)",?/g)]
  .map((match) => match[1])
  .filter((value) =>
    ["sunny", "cloudy", "rainy", "snowy", "windy", "stormy", "hot", "cold"].includes(value),
  );
const uniqueWeatherTypes = [...new Set(weatherTypes)];
const missingWeatherAssets = uniqueWeatherTypes.filter(
  (type) => !existsSync(join(root, "public", "images", "weather", `${type}.gif`)),
);

const failures = [
  duplicateToolIds.length && `Duplicate tool ids: ${duplicateToolIds.join(", ")}`,
  missingRenderers.length && `Missing launcher renderers: ${missingRenderers.join(", ")}`,
  orphanRenderers.length && `Launcher renderers without registry entries: ${orphanRenderers.join(", ")}`,
  missingCategoryInfo.length && `Missing CATEGORY_INFO entries: ${missingCategoryInfo.join(", ")}`,
  missingWeatherAssets.length && `Missing weather GIF assets: ${missingWeatherAssets.join(", ")}`,
].filter(Boolean);

if (failures.length > 0) {
  console.error("Tool registry verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${toolIds.length} tools, ${categories.length} categories, and ${uniqueWeatherTypes.length} weather assets.`);

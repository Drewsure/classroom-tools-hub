import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(root, "public", "images", "manga-icons");
mkdirSync(outDir, { recursive: true });

const tools = [
  { id: "classic", title: "Timer", symbol: "00:05", a: "#fb923c", b: "#fef08a", prop: "clock" },
  { id: "stopwatch", title: "Stopwatch", symbol: "GO!", a: "#06b6d4", b: "#818cf8", prop: "stopwatch" },
  { id: "rocket", title: "Rocket", symbol: "3 2 1", a: "#a855f7", b: "#f472b6", prop: "rocket" },
  { id: "bomb", title: "Bomb", symbol: "BOM!", a: "#ef4444", b: "#f59e0b", prop: "bomb" },
  { id: "candle", title: "Candle", symbol: "QUIET", a: "#f59e0b", b: "#f97316", prop: "flame" },
  { id: "hourglass", title: "Hourglass", symbol: "SAND", a: "#fbbf24", b: "#fb923c", prop: "hourglass" },
  { id: "circle", title: "Circle", symbol: "FULL", a: "#14b8a6", b: "#22c55e", prop: "ring" },
  { id: "snail-race", title: "Snail", symbol: "RACE!", a: "#84cc16", b: "#22c55e", prop: "snail" },
  { id: "traffic-light", title: "Lights", symbol: "STOP", a: "#71717a", b: "#22c55e", prop: "traffic" },
  { id: "bar", title: "Bar", symbol: "LEVEL", a: "#f43f5e", b: "#a855f7", prop: "bars" },
  { id: "enter-names", title: "Roster", symbol: "CLASS", a: "#8b5cf6", b: "#38bdf8", prop: "clipboard" },
  { id: "name-picker", title: "Picker", symbol: "NEXT?", a: "#c084fc", b: "#818cf8", prop: "target" },
  { id: "group-generator", title: "Groups", symbol: "TEAM", a: "#6366f1", b: "#d946ef", prop: "students" },
  { id: "student-shuffler", title: "Order", symbol: "1 2 3", a: "#a78bfa", b: "#38bdf8", prop: "shuffle" },
  { id: "chance-games", title: "Chance", symbol: "LUCK", a: "#f97316", b: "#fb7185", prop: "dice" },
  { id: "custom-dice", title: "Dice", symbol: "d100", a: "#fb7185", b: "#ef4444", prop: "die" },
  { id: "spinner-wheel", title: "Wheel", symbol: "SPIN", a: "#818cf8", b: "#d946ef", prop: "wheel" },
  { id: "color-generator", title: "Color", symbol: "POP", a: "#e879f9", b: "#f43f5e", prop: "palette" },
  { id: "tally-counter", title: "Tally", symbol: "+1", a: "#10b981", b: "#22d3ee", prop: "score" },
  { id: "stopwatch-splits", title: "Splits", symbol: "LAP", a: "#22d3ee", b: "#3b82f6", prop: "split" },
  { id: "math-facts", title: "Math", symbol: "7x8", a: "#3b82f6", b: "#f59e0b", prop: "math" },
  { id: "letter-cards", title: "Letters", symbol: "Aa", a: "#60a5fa", b: "#34d399", prop: "letter" },
  { id: "flash-card-presenter", title: "Cards", symbol: "Q&A", a: "#a855f7", b: "#6366f1", prop: "cards" },
  { id: "weather-cards", title: "Weather", symbol: "SUN?", a: "#38bdf8", b: "#facc15", prop: "weather" },
  { id: "custom-dashboard", title: "Board", symbol: "HUB", a: "#94a3b8", b: "#a78bfa", prop: "dashboard" },
  { id: "activity-hub", title: "Activity", symbol: "PLAY", a: "#06b6d4", b: "#818cf8", prop: "spark" },
  { id: "pe-english-hub", title: "PE", symbol: "MOVE", a: "#ea580c", b: "#f43f5e", prop: "movement" },
  { id: "sound-pad", title: "Sound", symbol: "SFX", a: "#d946ef", b: "#f472b6", prop: "speaker" },
  { id: "audio-player", title: "Audio", symbol: "MP3", a: "#8b5cf6", b: "#06b6d4", prop: "headphones" },
];

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function propSvg(prop, a, b) {
  const ink = "#0f172a";
  const white = "#ffffff";
  switch (prop) {
    case "clock":
    case "stopwatch":
      return `<circle cx="170" cy="150" r="66" fill="${white}" stroke="${ink}" stroke-width="10"/><path d="M170 150l0-42M170 150l38 22" stroke="${ink}" stroke-width="10" stroke-linecap="round"/><rect x="142" y="48" width="56" height="28" rx="13" fill="${a}" stroke="${ink}" stroke-width="8"/>`;
    case "rocket":
      return `<path d="M168 58c38 24 54 78 44 158-48-10-86-38-112-82 18-38 40-62 68-76z" fill="${white}" stroke="${ink}" stroke-width="9"/><circle cx="170" cy="115" r="18" fill="${b}" stroke="${ink}" stroke-width="7"/><path d="M112 178l-36 34 46 4M206 178l36 34-46 4" fill="${a}" stroke="${ink}" stroke-width="8"/><path d="M154 224c8 20 19 34 33 44 10-18 12-36 5-54z" fill="#f97316" stroke="${ink}" stroke-width="7"/>`;
    case "bomb":
      return `<circle cx="170" cy="166" r="70" fill="#111827" stroke="${ink}" stroke-width="10"/><path d="M204 92c20-38 48-40 68-18" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round"/><path d="M264 68l22-24M270 86l32 4M250 58l-8-32" stroke="#facc15" stroke-width="10" stroke-linecap="round"/><rect x="138" y="84" width="64" height="34" rx="15" fill="${a}" stroke="${ink}" stroke-width="8"/>`;
    case "flame":
      return `<path d="M176 42c28 52-18 65 12 110 12-18 18-35 16-54 42 42 48 106 4 142-46 36-120 8-118-54 2-50 52-72 86-144z" fill="${b}" stroke="${ink}" stroke-width="10"/><path d="M174 150c26 28 22 70-8 82-34-16-36-56 8-82z" fill="#fef08a" stroke="${ink}" stroke-width="7"/>`;
    case "hourglass":
      return `<path d="M106 54h128M106 250h128M122 64c4 60 80 70 80 92s-76 38-80 92M218 64c-4 60-80 70-80 92s76 38 80 92" fill="${white}" stroke="${ink}" stroke-width="10" stroke-linecap="round"/><path d="M148 112h44l-22 30zM138 230c16-36 50-36 66 0z" fill="${b}" stroke="${ink}" stroke-width="5"/>`;
    case "ring":
      return `<circle cx="170" cy="154" r="84" fill="none" stroke="${white}" stroke-width="28"/><path d="M170 70a84 84 0 0184 84" fill="none" stroke="${a}" stroke-width="28" stroke-linecap="round"/><circle cx="170" cy="154" r="48" fill="${b}" stroke="${ink}" stroke-width="8"/>`;
    case "snail":
      return `<path d="M86 190c40 34 112 34 162 12 20-8 24-34 0-44-32-12-56 10-82 12-42 4-66-26-98 0z" fill="${b}" stroke="${ink}" stroke-width="9"/><circle cx="150" cy="154" r="44" fill="${a}" stroke="${ink}" stroke-width="9"/><path d="M150 154c28-6 28-42 0-42s-38 34-12 54" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/><path d="M230 158l18-36M248 158l30-24" stroke="${ink}" stroke-width="7" stroke-linecap="round"/><circle cx="251" cy="119" r="7" fill="${ink}"/><circle cx="282" cy="131" r="7" fill="${ink}"/>`;
    case "traffic":
      return `<rect x="126" y="42" width="88" height="190" rx="36" fill="#1f2937" stroke="${ink}" stroke-width="10"/><circle cx="170" cy="88" r="24" fill="#ef4444" stroke="${ink}" stroke-width="5"/><circle cx="170" cy="137" r="24" fill="#facc15" stroke="${ink}" stroke-width="5"/><circle cx="170" cy="186" r="24" fill="#22c55e" stroke="${ink}" stroke-width="5"/><path d="M170 232v42" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`;
    case "bars":
    case "score":
      return `<rect x="82" y="196" width="40" height="54" rx="8" fill="${a}" stroke="${ink}" stroke-width="8"/><rect x="146" y="142" width="40" height="108" rx="8" fill="${white}" stroke="${ink}" stroke-width="8"/><rect x="210" y="84" width="40" height="166" rx="8" fill="${b}" stroke="${ink}" stroke-width="8"/><path d="M72 258h196" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`;
    case "clipboard":
      return `<rect x="98" y="58" width="144" height="196" rx="18" fill="${white}" stroke="${ink}" stroke-width="9"/><rect x="132" y="42" width="76" height="38" rx="14" fill="${a}" stroke="${ink}" stroke-width="8"/><path d="M130 128h82M130 168h82M130 208h58" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>`;
    case "target":
      return `<circle cx="170" cy="152" r="86" fill="${white}" stroke="${ink}" stroke-width="9"/><circle cx="170" cy="152" r="56" fill="${a}" stroke="${ink}" stroke-width="8"/><circle cx="170" cy="152" r="24" fill="${b}" stroke="${ink}" stroke-width="7"/><path d="M218 104l54-54M246 50h26v26" stroke="${ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "students":
      return `<circle cx="118" cy="118" r="30" fill="${white}" stroke="${ink}" stroke-width="8"/><circle cx="222" cy="118" r="30" fill="${white}" stroke="${ink}" stroke-width="8"/><circle cx="170" cy="96" r="34" fill="${b}" stroke="${ink}" stroke-width="8"/><path d="M70 230c10-54 86-54 96 0M174 230c10-54 86-54 96 0M104 246c12-66 120-66 132 0" fill="${a}" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/>`;
    case "shuffle":
      return `<path d="M82 106h50c52 0 58 96 114 96h20" fill="none" stroke="${white}" stroke-width="18" stroke-linecap="round"/><path d="M82 202h50c52 0 58-96 114-96h20" fill="none" stroke="${b}" stroke-width="18" stroke-linecap="round"/><path d="M246 82l34 24-34 24M246 178l34 24-34 24" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "dice":
    case "die":
      return `<rect x="84" y="72" width="112" height="112" rx="24" fill="${white}" stroke="${ink}" stroke-width="9" transform="rotate(-10 140 128)"/><rect x="154" y="118" width="112" height="112" rx="24" fill="${b}" stroke="${ink}" stroke-width="9" transform="rotate(11 210 174)"/><circle cx="126" cy="112" r="8" fill="${ink}"/><circle cx="154" cy="146" r="8" fill="${ink}"/><circle cx="196" cy="154" r="8" fill="${ink}"/><circle cx="230" cy="188" r="8" fill="${ink}"/>`;
    case "wheel":
      return `<circle cx="170" cy="152" r="88" fill="${white}" stroke="${ink}" stroke-width="9"/><path d="M170 152V64A88 88 0 01258 152z" fill="${a}"/><path d="M170 152h88A88 88 0 01170 240z" fill="${b}"/><path d="M170 152v88A88 88 0 0182 152z" fill="#22c55e"/><path d="M170 152H82A88 88 0 01170 64z" fill="#facc15"/><circle cx="170" cy="152" r="24" fill="${white}" stroke="${ink}" stroke-width="8"/><path d="M170 34l24 48h-48z" fill="#ef4444" stroke="${ink}" stroke-width="7"/>`;
    case "palette":
      return `<path d="M170 62c70 0 110 44 100 98-6 34-32 34-54 28-22-6-32 8-22 28 10 22-8 42-38 36-58-10-98-48-96-96 2-58 48-94 110-94z" fill="${white}" stroke="${ink}" stroke-width="9"/><circle cx="126" cy="124" r="14" fill="#ef4444"/><circle cx="170" cy="104" r="14" fill="#facc15"/><circle cx="214" cy="124" r="14" fill="#22c55e"/><circle cx="146" cy="170" r="14" fill="${a}"/>`;
    case "split":
      return `<circle cx="170" cy="134" r="70" fill="${white}" stroke="${ink}" stroke-width="9"/><path d="M170 134l0-44M170 134l36 24" stroke="${ink}" stroke-width="9" stroke-linecap="round"/><path d="M88 238h164M110 268h120" stroke="${b}" stroke-width="14" stroke-linecap="round"/><rect x="140" y="38" width="60" height="28" rx="12" fill="${a}" stroke="${ink}" stroke-width="7"/>`;
    case "math":
      return `<rect x="80" y="68" width="180" height="168" rx="22" fill="${white}" stroke="${ink}" stroke-width="9"/><path d="M116 118h52M142 92v52M194 118h52M116 176h52M194 160l44 44M238 160l-44 44" stroke="${ink}" stroke-width="10" stroke-linecap="round"/><rect x="112" y="218" width="116" height="38" rx="14" fill="${b}" stroke="${ink}" stroke-width="7"/>`;
    case "letter":
      return `<rect x="94" y="54" width="152" height="214" rx="22" fill="${white}" stroke="${ink}" stroke-width="9"/><text x="170" y="182" text-anchor="middle" font-size="106" font-weight="900" fill="${a}" stroke="${ink}" stroke-width="3" font-family="Arial Black, Arial">Aa</text><path d="M120 82h100M120 238h100" stroke="${b}" stroke-width="8" stroke-linecap="round"/>`;
    case "cards":
      return `<rect x="92" y="78" width="126" height="166" rx="18" fill="${white}" stroke="${ink}" stroke-width="8" transform="rotate(-8 155 161)"/><rect x="130" y="58" width="126" height="166" rx="18" fill="${b}" stroke="${ink}" stroke-width="8" transform="rotate(8 193 141)"/><text x="194" y="164" text-anchor="middle" font-size="54" font-weight="900" fill="${white}" stroke="${ink}" stroke-width="2" font-family="Arial Black, Arial">Q?</text>`;
    case "weather":
      return `<circle cx="124" cy="116" r="44" fill="#facc15" stroke="${ink}" stroke-width="8"/><path d="M122 186c8-34 52-44 78-18 22-22 70-12 78 22 8 34-18 54-56 54H124c-42 0-62-30-42-58 10-14 24-18 40 0z" fill="${white}" stroke="${ink}" stroke-width="9"/><path d="M98 66l-18-24M152 58l12-28M74 116H42" stroke="#facc15" stroke-width="10" stroke-linecap="round"/>`;
    case "dashboard":
      return `<rect x="70" y="64" width="200" height="178" rx="22" fill="${white}" stroke="${ink}" stroke-width="9"/><rect x="96" y="96" width="64" height="48" rx="12" fill="${a}" stroke="${ink}" stroke-width="6"/><rect x="180" y="96" width="64" height="48" rx="12" fill="${b}" stroke="${ink}" stroke-width="6"/><rect x="96" y="164" width="64" height="48" rx="12" fill="#22c55e" stroke="${ink}" stroke-width="6"/><rect x="180" y="164" width="64" height="48" rx="12" fill="#facc15" stroke="${ink}" stroke-width="6"/>`;
    case "spark":
      return `<path d="M170 46l24 70 74 8-58 46 18 72-58-40-60 40 20-72-58-46 74-8z" fill="${b}" stroke="${ink}" stroke-width="9" stroke-linejoin="round"/><path d="M76 76l22 14M250 70l-18 22M72 226l24-20M262 224l-26-16" stroke="${white}" stroke-width="10" stroke-linecap="round"/>`;
    case "movement":
      return `<circle cx="170" cy="78" r="28" fill="${white}" stroke="${ink}" stroke-width="8"/><path d="M170 110l-32 58 50 28-26 58M158 142l62-18M186 196l58 48M136 168l-54 32" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M236 92c18 12 32 30 40 52" fill="none" stroke="${b}" stroke-width="10" stroke-linecap="round"/>`;
    case "speaker":
      return `<path d="M84 178h42l70 52V74l-70 52H84z" fill="${white}" stroke="${ink}" stroke-width="9" stroke-linejoin="round"/><path d="M224 120c18 18 18 48 0 66M250 92c38 42 38 96 0 136" fill="none" stroke="${b}" stroke-width="12" stroke-linecap="round"/>`;
    case "headphones":
      return `<path d="M86 166c0-62 38-104 84-104s84 42 84 104" fill="none" stroke="${ink}" stroke-width="14" stroke-linecap="round"/><rect x="62" y="158" width="54" height="76" rx="20" fill="${a}" stroke="${ink}" stroke-width="9"/><rect x="224" y="158" width="54" height="76" rx="20" fill="${b}" stroke="${ink}" stroke-width="9"/><path d="M118 248h104" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`;
    default:
      return `<circle cx="170" cy="152" r="82" fill="${white}" stroke="${ink}" stroke-width="9"/><path d="M128 152h84M170 110v84" stroke="${a}" stroke-width="16" stroke-linecap="round"/>`;
  }
}

function iconSvg(tool) {
  const title = escapeXml(tool.title);
  const symbol = escapeXml(tool.symbol);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340" role="img" aria-label="${title} manga classroom tool icon">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tool.a}"/>
      <stop offset="1" stop-color="${tool.b}"/>
    </linearGradient>
    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2.2" fill="#0f172a" opacity=".13"/>
    </pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#0f172a" flood-opacity=".28"/>
    </filter>
  </defs>
  <rect width="340" height="340" rx="58" fill="url(#bg)"/>
  <rect width="340" height="340" rx="58" fill="url(#dots)"/>
  <path d="M36 58h268M20 116h300M30 282h280M54 22l-28 76M314 44l-72 42M304 306l-88-36M32 314l94-54" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".42"/>
  <path d="M30 40h280v260H30z" fill="none" stroke="#0f172a" stroke-width="10" stroke-linejoin="round" opacity=".9"/>
  <g filter="url(#shadow)">
    ${propSvg(tool.prop, tool.a, tool.b)}
  </g>
  <path d="M42 268c50 28 206 28 256 0" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".58"/>
  <rect x="62" y="246" width="216" height="52" rx="20" fill="#ffffff" stroke="#0f172a" stroke-width="8"/>
  <text x="170" y="281" text-anchor="middle" font-size="22" font-weight="900" fill="#0f172a" font-family="Arial Black, Arial">${title}</text>
  <g transform="rotate(-10 82 72)">
    <rect x="38" y="48" width="88" height="40" rx="14" fill="#ffffff" stroke="#0f172a" stroke-width="7"/>
    <text x="82" y="75" text-anchor="middle" font-size="17" font-weight="900" fill="#0f172a" font-family="Arial Black, Arial">${symbol}</text>
  </g>
</svg>
`;
}

for (const tool of tools) {
  writeFileSync(join(outDir, `${tool.id}.svg`), iconSvg(tool));
}

const mapPath = join(root, "src", "lib", "tool-art.generated.ts");
const mapSource = `// Generated by scripts/generate-manga-tool-icons.mjs
export const MANGA_ICON_BY_TOOL = {
${tools.map((tool) => `  "${tool.id}": "/images/manga-icons/${tool.id}.svg",`).join("\n")}
} as const;

export type MangaToolId = keyof typeof MANGA_ICON_BY_TOOL;

export function getMangaToolIcon(toolId: string): string | undefined {
  return MANGA_ICON_BY_TOOL[toolId as MangaToolId];
}
`;
mkdirSync(dirname(mapPath), { recursive: true });
writeFileSync(mapPath, mapSource);

console.log(`Generated ${tools.length} manga tool icons.`);

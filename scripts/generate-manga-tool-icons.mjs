import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(root, "public", "images", "manga-icons");
mkdirSync(outDir, { recursive: true });

const tools = [
  { id: "classic", title: "Timer", symbol: "HURRY!", a: "#fb923c", b: "#fef08a", prop: "clock", face: "focused" },
  { id: "stopwatch", title: "Stopwatch", symbol: "GO!", a: "#06b6d4", b: "#818cf8", prop: "stopwatch", face: "happy" },
  { id: "rocket", title: "Rocket", symbol: "3 2 1!", a: "#a855f7", b: "#f472b6", prop: "rocket", face: "excited" },
  { id: "bomb", title: "Bomb", symbol: "BANG!", a: "#ef4444", b: "#f59e0b", prop: "bomb", face: "shout" },
  { id: "candle", title: "Candle", symbol: "SHH...", a: "#f59e0b", b: "#f97316", prop: "flame", face: "calm" },
  { id: "hourglass", title: "Hourglass", symbol: "SAND!", a: "#fbbf24", b: "#fb923c", prop: "hourglass", face: "focused" },
  { id: "circle", title: "Circle", symbol: "FULL!", a: "#14b8a6", b: "#22c55e", prop: "ring", face: "happy" },
  { id: "snail-race", title: "Snail", symbol: "RACE!", a: "#84cc16", b: "#22c55e", prop: "snail", face: "excited" },
  { id: "traffic-light", title: "Lights", symbol: "STOP!", a: "#71717a", b: "#22c55e", prop: "traffic", face: "focused" },
  { id: "bar", title: "Bar", symbol: "MAX!", a: "#f43f5e", b: "#a855f7", prop: "bars", face: "happy" },
  { id: "enter-names", title: "Roster", symbol: "CLASS!", a: "#8b5cf6", b: "#38bdf8", prop: "clipboard", face: "happy" },
  { id: "name-picker", title: "Picker", symbol: "NEXT?", a: "#c084fc", b: "#818cf8", prop: "target", face: "excited" },
  { id: "group-generator", title: "Groups", symbol: "TEAM!", a: "#6366f1", b: "#d946ef", prop: "students", face: "happy" },
  { id: "student-shuffler", title: "Order", symbol: "MIX!", a: "#a78bfa", b: "#38bdf8", prop: "shuffle", face: "excited" },
  { id: "chance-games", title: "Chance", symbol: "LUCK!", a: "#f97316", b: "#fb7185", prop: "dice", face: "shout" },
  { id: "custom-dice", title: "Dice", symbol: "ROLL!", a: "#fb7185", b: "#ef4444", prop: "die", face: "shout" },
  { id: "spinner-wheel", title: "Wheel", symbol: "SPIN!", a: "#818cf8", b: "#d946ef", prop: "wheel", face: "excited" },
  { id: "color-generator", title: "Color", symbol: "POP!", a: "#e879f9", b: "#f43f5e", prop: "palette", face: "happy" },
  { id: "tally-counter", title: "Tally", symbol: "+1!", a: "#10b981", b: "#22d3ee", prop: "score", face: "happy" },
  { id: "stopwatch-splits", title: "Splits", symbol: "LAP!", a: "#22d3ee", b: "#3b82f6", prop: "split", face: "focused" },
  { id: "math-facts", title: "Math", symbol: "WOW!", a: "#3b82f6", b: "#f59e0b", prop: "math", face: "focused" },
  { id: "letter-cards", title: "Letters", symbol: "Aa!", a: "#60a5fa", b: "#34d399", prop: "letter", face: "happy" },
  { id: "flash-card-presenter", title: "Cards", symbol: "Q&A!", a: "#a855f7", b: "#6366f1", prop: "cards", face: "excited" },
  { id: "weather-cards", title: "Weather", symbol: "SUN!", a: "#38bdf8", b: "#facc15", prop: "weather", face: "happy" },
  { id: "custom-dashboard", title: "Board", symbol: "HUB!", a: "#94a3b8", b: "#a78bfa", prop: "dashboard", face: "focused" },
  { id: "activity-hub", title: "Activity", symbol: "PLAY!", a: "#06b6d4", b: "#818cf8", prop: "spark", face: "excited" },
  { id: "pe-english-hub", title: "PE", symbol: "MOVE!", a: "#ea580c", b: "#f43f5e", prop: "movement", face: "shout" },
  { id: "sound-pad", title: "Sound", symbol: "SFX!", a: "#d946ef", b: "#f472b6", prop: "speaker", face: "excited" },
  { id: "audio-player", title: "Audio", symbol: "LISTEN!", a: "#8b5cf6", b: "#06b6d4", prop: "headphones", face: "calm" },
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

function mangaBackdrop(tool) {
  const panels = {
    clock: `<circle cx="296" cy="78" r="34" fill="#fff" opacity=".7"/><path d="M284 78h24M296 66v24" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>`,
    stopwatch: `<path d="M286 58l50 20-48 18 28 42-56-20" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`,
    rocket: `<path d="M274 54l52 30-42 24 46 40-74-18" fill="#fff" opacity=".75" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>`,
    bomb: `<path d="M284 52l18 30 34-8-18 30 24 26-34-2-16 32-14-34-34-4 28-22-10-34z" fill="#fef08a" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>`,
    flame: `<path d="M286 58c24 28 18 72-14 88 54 0 74-56 14-88z" fill="#fff" opacity=".75"/>`,
    hourglass: `<path d="M280 66h54M280 120h54M294 78l26 30-26 30" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`,
    ring: `<circle cx="302" cy="100" r="46" fill="none" stroke="#fff" stroke-width="14" opacity=".75"/>`,
    snail: `<path d="M262 88c28-26 68-18 76 22-42-10-60 0-84 24" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".8"/>`,
    traffic: `<rect x="286" y="54" width="42" height="104" rx="18" fill="#fff" opacity=".75"/><circle cx="307" cy="80" r="9" fill="#ef4444"/><circle cx="307" cy="106" r="9" fill="#facc15"/><circle cx="307" cy="132" r="9" fill="#22c55e"/>`,
    bars: `<path d="M276 142l18-54 20 28 22-60" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`,
    clipboard: `<path d="M270 64h62v82h-62z" fill="#fff" opacity=".7" stroke="#0f172a" stroke-width="5"/><path d="M282 92h38M282 118h32" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>`,
    target: `<circle cx="308" cy="98" r="44" fill="#fff" opacity=".75" stroke="#0f172a" stroke-width="5"/><circle cx="308" cy="98" r="20" fill="none" stroke="#0f172a" stroke-width="5"/>`,
    students: `<circle cx="286" cy="86" r="16" fill="#fff" opacity=".8"/><circle cx="326" cy="86" r="16" fill="#fff" opacity=".8"/><path d="M260 142c10-32 58-32 68 0M300 142c10-32 58-32 68 0" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/>`,
    shuffle: `<path d="M270 76c44 0 34 60 78 60M270 136c44 0 34-60 78-60" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".82"/>`,
    dice: `<rect x="274" y="70" width="68" height="68" rx="14" fill="#fff" opacity=".78" stroke="#0f172a" stroke-width="5"/><circle cx="294" cy="90" r="5" fill="#0f172a"/><circle cx="322" cy="118" r="5" fill="#0f172a"/>`,
    die: `<rect x="274" y="70" width="68" height="68" rx="14" fill="#fff" opacity=".78" stroke="#0f172a" stroke-width="5"/><text x="308" y="114" text-anchor="middle" font-size="29" font-weight="900" fill="#0f172a" font-family="Arial Black, Arial">20</text>`,
    wheel: `<circle cx="310" cy="104" r="48" fill="#fff" opacity=".75" stroke="#0f172a" stroke-width="5"/><path d="M310 104V58M310 104l40 22M310 104l-40 22" stroke="#0f172a" stroke-width="5"/>`,
    palette: `<circle cx="284" cy="82" r="12" fill="#ef4444"/><circle cx="318" cy="82" r="12" fill="#facc15"/><circle cx="302" cy="118" r="12" fill="#22c55e"/><path d="M270 146c42 14 78 2 86-40" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/>`,
    score: `<text x="304" y="120" text-anchor="middle" font-size="76" font-weight="900" fill="#fff" stroke="#0f172a" stroke-width="3" font-family="Arial Black, Arial">+1</text>`,
    split: `<text x="304" y="116" text-anchor="middle" font-size="50" font-weight="900" fill="#fff" stroke="#0f172a" stroke-width="3" font-family="Arial Black, Arial">LAP</text>`,
    math: `<text x="306" y="114" text-anchor="middle" font-size="48" font-weight="900" fill="#fff" stroke="#0f172a" stroke-width="3" font-family="Arial Black, Arial">7x8</text>`,
    letter: `<text x="304" y="124" text-anchor="middle" font-size="76" font-weight="900" fill="#fff" stroke="#0f172a" stroke-width="3" font-family="Arial Black, Arial">Aa</text>`,
    cards: `<rect x="270" y="66" width="54" height="76" rx="10" fill="#fff" opacity=".8" stroke="#0f172a" stroke-width="5" transform="rotate(-9 297 104)"/><rect x="304" y="58" width="54" height="76" rx="10" fill="#fff" opacity=".8" stroke="#0f172a" stroke-width="5" transform="rotate(12 331 96)"/>`,
    weather: `<circle cx="294" cy="82" r="26" fill="#facc15" stroke="#0f172a" stroke-width="5"/><path d="M282 128c12-30 58-30 70 0z" fill="#fff" opacity=".82" stroke="#0f172a" stroke-width="5"/>`,
    dashboard: `<rect x="266" y="64" width="76" height="78" rx="12" fill="#fff" opacity=".76" stroke="#0f172a" stroke-width="5"/><path d="M284 88h40M284 116h24" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>`,
    spark: `<path d="M308 54l14 42 42 8-34 26 12 44-34-26-36 26 12-44-34-26 42-8z" fill="#fff" opacity=".78" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>`,
    movement: `<path d="M304 54c28 24 36 62 24 104M278 90l50 24-46 28" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" opacity=".84"/>`,
    speaker: `<path d="M270 114h28l44 32V70l-44 32h-28z" fill="#fff" opacity=".8" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/><path d="M350 88c18 22 18 42 0 64" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`,
    headphones: `<path d="M270 120c0-44 26-72 62-72s62 28 62 72" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/><rect x="262" y="112" width="30" height="46" rx="12" fill="#fff" opacity=".8"/><rect x="372" y="112" width="30" height="46" rx="12" fill="#fff" opacity=".8"/>`,
  };
  return panels[tool.prop] ?? panels.spark;
}

function speedLines() {
  return `<path d="M28 62h92M20 118h68M26 296h110M246 42h92M288 300h58M38 340h74" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".42"/>
  <path d="M42 92h48M252 84h74M258 328h42" stroke="#0f172a" stroke-width="5" stroke-linecap="round" opacity=".42"/>`;
}

function iconSvg(tool) {
  const title = escapeXml(tool.title);
  const symbol = escapeXml(tool.symbol);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 380" role="img" aria-label="${title} manga classroom tool icon">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tool.a}"/>
      <stop offset="1" stop-color="${tool.b}"/>
    </linearGradient>
    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2.2" fill="#0f172a" opacity=".13"/>
    </pattern>
  </defs>
  <rect width="380" height="380" rx="46" fill="url(#bg)"/>
  <rect width="380" height="380" rx="46" fill="url(#dots)"/>
  ${speedLines()}
  <path d="M22 30h336v320H22z" fill="none" stroke="#0f172a" stroke-width="12" stroke-linejoin="round" opacity=".94"/>
  <path d="M48 56h284v198H48z" fill="#ffffff" opacity=".12" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>
  ${mangaBackdrop(tool)}
  <g transform="translate(14 44) scale(1.06)">
    ${propSvg(tool.prop, tool.a, tool.b)}
  </g>
  <path d="M56 282h268c14 0 24 10 24 24v22c0 14-10 24-24 24H56c-14 0-24-10-24-24v-22c0-14 10-24 24-24z" fill="#ffffff" stroke="#0f172a" stroke-width="9"/>
  <text x="190" y="326" text-anchor="middle" font-size="32" font-weight="900" fill="#0f172a" font-family="Arial Black, Arial">${title}</text>
  <g transform="rotate(-10 102 82)">
    <path d="M34 50h138l20 28-20 28H34z" fill="#fffef2" stroke="#0f172a" stroke-width="8" stroke-linejoin="round"/>
    <text x="103" y="88" text-anchor="middle" font-size="25" font-weight="900" fill="#0f172a" font-family="Arial Black, Arial">${symbol}</text>
  </g>
  <path d="M304 44l18-30M330 70l34-8M296 92l28 28" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
</svg>
`;
}

for (const tool of tools) {
  const source = iconSvg(tool);
  writeFileSync(join(outDir, `${tool.id}.svg`), source);
  // Bake SVG patterns into pixels once, rather than in each tablet paint.
  await sharp(Buffer.from(source)).resize(320, 320).png({ compressionLevel: 9 })
    .toFile(join(outDir, `bitmap-${tool.id}.png`));
}

const mapPath = join(root, "src", "lib", "tool-art.generated.ts");
const mapSource = `// Generated by scripts/generate-manga-tool-icons.mjs
export const MANGA_ICON_BY_TOOL = {
${tools.map((tool) => `  "${tool.id}": "/images/manga-icons/bitmap-${tool.id}.png",`).join("\n")}
} as const;

export type MangaToolId = keyof typeof MANGA_ICON_BY_TOOL;

export function getMangaToolIcon(toolId: string): string | undefined {
  const source = MANGA_ICON_BY_TOOL[toolId as MangaToolId];
  return source;
}
`;
mkdirSync(dirname(mapPath), { recursive: true });
writeFileSync(mapPath, mapSource);

console.log(`Generated ${tools.length} manga tool icons.`);

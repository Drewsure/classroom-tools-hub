import type { LucideIcon } from "lucide-react";
import {
  Timer,
  Watch,
  Rocket,
  Bomb,
  Flame,
  Hourglass,
  Circle,
  Snail,
  TrafficCone,
  BarChart3,
  Shuffle,
  Dices,
  Users,
  Hash,
  Disc,
  ListOrdered,
  Split,
  Calculator,
  LayoutDashboard,
  Volume2,
  Palette,
  CloudSun,
  Layers,
  Sparkles,
  Headphones,
  Dumbbell,
} from "lucide-react";

export type ToolCategory = "timers" | "pickers" | "games" | "counters" | "math" | "letters" | "weather" | "dashboard" | "sounds" | "audio";

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  icon: LucideIcon;
  gradient: string;
  accent: string;       // hex color used for iridescent border + glow
  category: ToolCategory;
}

export const CATEGORY_INFO: Record<
  ToolCategory,
  { label: string; emoji: string; description: string }
> = {
  favorites: {
    label: "Favorites",
    emoji: "⭐",
    description: "Your most-used tools",
  },
  dashboard: {
    label: "Dashboards",
    emoji: "📊",
    description: "Combine multiple tools on one screen",
  },
  timers: {
    label: "Classroom Timers",
    emoji: "⏰",
    description: "Countdown and stopwatch tools",
  },
  pickers: {
    label: "Name Pickers",
    emoji: "🎯",
    description: "Random selection tools",
  },
  games: {
    label: "Chance Games",
    emoji: "🎲",
    description: "Coin flips, dice, and more",
  },
  counters: {
    label: "Tally Counters",
    emoji: "🔢",
    description: "Scorekeeping and counting",
  },
  math: {
    label: "Math Tools",
    emoji: "🧮",
    description: "Math fact generators and practice",
  },
  letters: {
    label: "Letter Tools",
    emoji: "🔤",
    description: "Letter generators and practice",
  },
  weather: {
    label: "Weather Tools",
    emoji: "🌤️",
    description: "Weather flashcards for ESL classroom",
  },
  sounds: {
    label: "Sound Pad",
    emoji: "🔊",
    description: "Instant classroom sound effects",
  },
  audio: {
    label: "Audio Player",
    emoji: "🎵",
    description: "Offline MP3 curriculum player",
  },
};

export const TOOLS: ToolDef[] = [
  // Timers
  { id: "classic", name: "Classic Countdown", description: "Big bold digital timer", emoji: "⏰", icon: Timer, gradient: "from-slate-700 via-slate-800 to-black", accent: "#64748b", category: "timers" },
  { id: "stopwatch", name: "Stopwatch", description: "Count up with lap support", emoji: "⏱️", icon: Watch, gradient: "from-cyan-600 via-blue-700 to-indigo-900", accent: "#06b6d4", category: "timers" },
  { id: "rocket", name: "Rocket Launch", description: "3... 2... 1... Blastoff!", emoji: "🚀", icon: Rocket, gradient: "from-purple-700 via-fuchsia-800 to-slate-900", accent: "#a855f7", category: "timers" },
  { id: "bomb", name: "Bomb Fuse", description: "Fuse burns down — kaboom!", emoji: "🧨", icon: Bomb, gradient: "from-red-700 via-orange-800 to-yellow-900", accent: "#ef4444", category: "timers" },
  { id: "candle", name: "Burning Candle", description: "Candle melts as time runs out", emoji: "🕯️", icon: Flame, gradient: "from-amber-700 via-orange-900 to-stone-900", accent: "#f59e0b", category: "timers" },
  { id: "hourglass", name: "Hourglass", description: "Watch sand fall through glass", emoji: "⌛", icon: Hourglass, gradient: "from-amber-600 via-yellow-700 to-orange-900", accent: "#fbbf24", category: "timers" },
  { id: "circle", name: "Radial Progress", description: "Sleek circular countdown ring", emoji: "🔵", icon: Circle, gradient: "from-teal-600 via-emerald-700 to-green-900", accent: "#14b8a6", category: "timers" },
  { id: "snail-race", name: "Snail Race", description: "Cheer on the snails!", emoji: "🐌", icon: Snail, gradient: "from-lime-600 via-green-700 to-emerald-900", accent: "#84cc16", category: "timers" },
  { id: "traffic-light", name: "Traffic Light", description: "Green → Yellow → Red", emoji: "🚦", icon: TrafficCone, gradient: "from-zinc-700 via-zinc-800 to-zinc-900", accent: "#a1a1aa", category: "timers" },
  { id: "bar", name: "Progress Bar", description: "Simple horizontal bar countdown", emoji: "📊", icon: BarChart3, gradient: "from-rose-600 via-pink-700 to-purple-900", accent: "#f43f5e", category: "timers" },

  // Pickers
  { id: "enter-names", name: "Enter Names", description: "Manage your class list — shared with all tools", emoji: "📋", icon: Users, gradient: "from-violet-600 via-purple-600 to-fuchsia-600", accent: "#8b5cf6", category: "pickers" },
  { id: "name-picker", name: "Random Name Picker", description: "Spin to pick a random name", emoji: "🎯", icon: Shuffle, gradient: "from-violet-600 via-purple-600 to-fuchsia-600", accent: "#a855f7", category: "pickers" },
  { id: "group-generator", name: "Random Group Generator", description: "Split names into teams", emoji: "👥", icon: Users, gradient: "from-indigo-600 via-purple-600 to-fuchsia-600", accent: "#6366f1", category: "pickers" },

  // Games
  { id: "chance-games", name: "Chance Games", description: "Coin, dice, wheel, 8-ball", emoji: "🎲", icon: Dices, gradient: "from-amber-500 via-orange-600 to-red-700", accent: "#f97316", category: "games" },
  { id: "custom-dice", name: "Custom Dice", description: "2-100 sides, custom labels, no-repeat", emoji: "🎯", icon: Dices, gradient: "from-rose-500 via-red-600 to-rose-700", accent: "#fb7185", category: "games" },
  { id: "spinner-wheel", name: "Spinner Wheel", description: "Custom text spinner wheel", emoji: "🎡", icon: Disc, gradient: "from-indigo-500 via-purple-600 to-fuchsia-600", accent: "#818cf8", category: "games" },
  { id: "color-generator", name: "Color Generator", description: "Random color picker with adjustable palette", emoji: "🎨", icon: Palette, gradient: "from-fuchsia-500 via-pink-600 to-rose-600", accent: "#e879f9", category: "games" },

  // Counters
  { id: "tally-counter", name: "Tally Counter", description: "Multi-counter scorekeeper", emoji: "🔢", icon: Hash, gradient: "from-emerald-600 via-teal-700 to-cyan-800", accent: "#10b981", category: "counters" },
  { id: "stopwatch-splits", name: "Stopwatch + Splits", description: "Stopwatch with lap timing", emoji: "⏱️", icon: Split, gradient: "from-cyan-600 via-blue-700 to-indigo-800", accent: "#22d3ee", category: "counters" },

  // Pickers (additional)
  { id: "student-shuffler", name: "Order Shuffler", description: "Random student presentation order", emoji: "🔀", icon: ListOrdered, gradient: "from-violet-500 via-purple-600 to-indigo-600", accent: "#a78bfa", category: "pickers" },

  // Math
  { id: "math-facts", name: "Math Fact Generator", description: "Practice +, −, ×, ÷ with instant feedback", emoji: "🧮", icon: Calculator, gradient: "from-blue-500 via-indigo-600 to-purple-700", accent: "#3b82f6", category: "math" },

  // Letters
  { id: "letter-cards", name: "Letter Card Generator", description: "Random A-Z flash cards with no-repeat mode", emoji: "🔤", icon: Calculator, gradient: "from-blue-500 via-indigo-600 to-purple-700", accent: "#60a5fa", category: "letters" },
  { id: "flash-card-presenter", name: "Flash Card Presenter", description: "Present phonic cards fullscreen with Q&A audio", emoji: "🎴", icon: Layers, gradient: "from-purple-500 via-violet-600 to-indigo-700", accent: "#a855f7", category: "letters" },

  // Weather
  { id: "weather-cards", name: "Weather Flashcards", description: "8 weather types with GIFs — sunny, rainy, snowy & more", emoji: "🌤️", icon: CloudSun, gradient: "from-sky-400 via-blue-500 to-indigo-600", accent: "#38bdf8", category: "weather" },

  // Dashboard
  { id: "custom-dashboard", name: "Custom Dashboard", description: "Combine timers, counters & more on one screen", emoji: "📊", icon: LayoutDashboard, gradient: "from-slate-700 via-slate-800 to-slate-900", accent: "#94a3b8", category: "dashboard" },

  // Activity Hub (all-in-one: Timer + Dice + Tally)
  { id: "activity-hub", name: "Activity Hub", description: "Timer · Dice · Tally — all on one screen, no swapping", emoji: "✨", icon: Sparkles, gradient: "from-cyan-500 via-blue-600 to-indigo-700", accent: "#06b6d4", category: "dashboard" },

  // PE English Hub
  { id: "pe-english-hub", name: "PE English Hub", description: "50-min PE-in-English lesson: Simon Says, Red Light Green Light, Fruit Salad Tag", emoji: "🏃", icon: Dumbbell, gradient: "from-orange-600 via-red-600 to-pink-600", accent: "#ea580c", category: "dashboard" },

  // Sounds
  { id: "sound-pad", name: "Sound Pad", description: "Instant sound effects: cheer, buzzer, animals & more", emoji: "🔊", icon: Volume2, gradient: "from-fuchsia-600 via-purple-600 to-indigo-700", accent: "#d946ef", category: "sounds" },

  // Audio Player
  { id: "audio-player", name: "Audio Player", description: "Offline MP3 player with 12-level curriculum structure", emoji: "🎵", icon: Headphones, gradient: "from-indigo-600 via-purple-600 to-fuchsia-600", accent: "#8b5cf6", category: "audio" },
];

export function getToolsByCategory(cat: ToolCategory): ToolDef[] {
  return TOOLS.filter((t) => t.category === cat);
}

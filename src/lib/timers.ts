export type TimerType =
  | "classic"
  | "stopwatch"
  | "rocket"
  | "bomb"
  | "candle"
  | "hourglass"
  | "circle"
  | "snail-race"
  | "traffic-light"
  | "bar";

export interface TimerConfig {
  id: TimerType;
  name: string;
  description: string;
  emoji: string;
  gradient: string;
  accent: string;
  category: "countdown" | "stopwatch" | "themed";
}

export const TIMER_CONFIGS: TimerConfig[] = [
  {
    id: "classic",
    name: "Classic Countdown",
    description: "Big bold digital timer with seconds precision",
    emoji: "⏰",
    gradient: "from-slate-700 via-slate-800 to-black",
    accent: "text-emerald-400",
    category: "countdown",
  },
  {
    id: "stopwatch",
    name: "Stopwatch",
    description: "Count up from zero with lap support",
    emoji: "⏱️",
    gradient: "from-cyan-600 via-blue-700 to-indigo-900",
    accent: "text-cyan-300",
    category: "stopwatch",
  },
  {
    id: "rocket",
    name: "Rocket Launch",
    description: "3... 2... 1... Blastoff! Rocket flies when done",
    emoji: "🚀",
    gradient: "from-purple-700 via-fuchsia-800 to-slate-900",
    accent: "text-fuchsia-300",
    category: "themed",
  },
  {
    id: "bomb",
    name: "Bomb Fuse",
    description: "Fuse burns down — kaboom when time's up!",
    emoji: "🧨",
    gradient: "from-red-700 via-orange-800 to-yellow-900",
    accent: "text-orange-300",
    category: "themed",
  },
  {
    id: "candle",
    name: "Burning Candle",
    description: "Candle melts as time runs out",
    emoji: "🕯️",
    gradient: "from-amber-700 via-orange-900 to-stone-900",
    accent: "text-amber-300",
    category: "themed",
  },
  {
    id: "hourglass",
    name: "Hourglass",
    description: "Watch sand fall through the glass",
    emoji: "⌛",
    gradient: "from-amber-600 via-yellow-700 to-orange-900",
    accent: "text-yellow-300",
    category: "themed",
  },
  {
    id: "circle",
    name: "Radial Progress",
    description: "Sleek circular countdown ring",
    emoji: "🔵",
    gradient: "from-teal-600 via-emerald-700 to-green-900",
    accent: "text-teal-300",
    category: "countdown",
  },
  {
    id: "snail-race",
    name: "Snail Race",
    description: "Cheer on the snails as they crawl to the finish",
    emoji: "🐌",
    gradient: "from-lime-600 via-green-700 to-emerald-900",
    accent: "text-lime-300",
    category: "themed",
  },
  {
    id: "traffic-light",
    name: "Traffic Light",
    description: "Green → Yellow → Red when time is up",
    emoji: "🚦",
    gradient: "from-zinc-700 via-zinc-800 to-zinc-900",
    accent: "text-zinc-300",
    category: "themed",
  },
  {
    id: "bar",
    name: "Progress Bar",
    description: "Simple horizontal bar countdown",
    emoji: "📊",
    gradient: "from-rose-600 via-pink-700 to-purple-900",
    accent: "text-rose-300",
    category: "countdown",
  },
];

export const PRESET_TIMES = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];

export function formatTime(totalSeconds: number): {
  display: string;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const display =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  return { display, hours, minutes, seconds };
}

export function formatStopwatchTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

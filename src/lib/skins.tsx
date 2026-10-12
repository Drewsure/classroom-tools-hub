"use client";

import { useState } from "react";
import { useParticleField, type Particle } from "@/hooks/use-effects";

export type SkinId =
  | "default"
  | "spring"
  | "summer"
  | "autumn"
  | "winter"
  | "halloween"
  | "christmas"
  | "newyear"
  | "easter"
  | "valentine"
  | "birthday"
  | "diwali"
  | "lunar"
  | "stpatrick"
  | "thanksgiving";

export interface SkinDef {
  id: SkinId;
  name: string;
  emoji: string;
  /** Background gradient (tailwind classes) */
  bgGradient: string;
  /** Accent color for ring/progress */
  accent: string;
  /** Accent button color (tailwind bg) */
  accentButton: string;
  /** Particle emoji or shape rendered in scene */
  particleEmoji?: string;
  /** Particle color (for dot particles) */
  particleColor: string;
  /** Number of ambient particles */
  particleCount: number;
  /** Animation name for particles */
  particleAnim: string;
  /** Completion flash color */
  flashColor: string;
  /** Completion message */
  completionMessage: string;
  /** Completion emoji */
  completionEmoji: string;
  /** Optional scene decorator (rendered behind timer) */
  sceneDecorator?:
    | "none"
    | "sun"
    | "moon"
    | "pumpkin"
    | "tree"
    | "snowman"
    | "fireworks"
    | "lanterns"
    | "diyas"
    | "eggs"
    | "hearts"
    | "balloons"
    | "cherry"
    | "clover"
    | "turkey"
    | "beach"
    | "jackolanterns"
    | "christmas"
    | "easter"
    | "birthday"
    | "thanksgiving";
}

export const SKINS: SkinDef[] = [
  {
    id: "default",
    name: "Classic",
    emoji: "⏰",
    bgGradient: "from-slate-800 via-slate-900 to-black",
    accent: "#10b981",
    accentButton: "bg-emerald-500 hover:bg-emerald-600",
    particleColor: "rgba(255,255,255,0.4)",
    particleCount: 40,
    particleAnim: "particleFloat",
    flashColor: "rgba(255, 215, 0, 0.9)",
    completionMessage: "TIME'S UP!",
    completionEmoji: "🎉",
  },
  {
    id: "spring",
    name: "Spring",
    emoji: "🌸",
    bgGradient: "from-pink-400 via-rose-400 to-green-300",
    accent: "#ec4899",
    accentButton: "bg-pink-500 hover:bg-pink-600",
    particleEmoji: "🌸",
    particleColor: "rgba(255, 182, 193, 0.7)",
    particleCount: 25,
    particleAnim: "petalFall",
    flashColor: "rgba(255, 182, 193, 0.85)",
    completionMessage: "Spring is here!",
    completionEmoji: "🌷",
    sceneDecorator: "cherry",
  },
  {
    id: "summer",
    name: "Summer",
    emoji: "☀️",
    bgGradient: "from-sky-500 via-cyan-500 to-amber-300",
    accent: "#0284c7",
    accentButton: "bg-sky-600 hover:bg-sky-700",
    particleEmoji: "🐚",
    particleColor: "rgba(255, 255, 255, 0.8)",
    particleCount: 20,
    particleAnim: "petalFall",
    flashColor: "rgba(255, 230, 100, 0.9)",
    completionMessage: "Sun's out!",
    completionEmoji: "🏖️",
    sceneDecorator: "beach",
  },
  {
    id: "autumn",
    name: "Autumn",
    emoji: "🍂",
    bgGradient: "from-orange-500 via-amber-600 to-yellow-700",
    accent: "#ea580c",
    accentButton: "bg-orange-500 hover:bg-orange-600",
    particleEmoji: "🍂",
    particleColor: "rgba(217, 119, 6, 0.7)",
    particleCount: 25,
    particleAnim: "leafFall",
    flashColor: "rgba(234, 88, 12, 0.85)",
    completionMessage: "Time's up!",
    completionEmoji: "🍁",
    sceneDecorator: "tree",
  },
  {
    id: "winter",
    name: "Winter",
    emoji: "❄️",
    bgGradient: "from-blue-600 via-indigo-700 to-slate-900",
    accent: "#38bdf8",
    accentButton: "bg-sky-500 hover:bg-sky-600",
    particleEmoji: "❄️",
    particleColor: "rgba(255, 255, 255, 1)",
    particleCount: 50,
    particleAnim: "snowFall",
    flashColor: "rgba(200, 230, 255, 0.95)",
    completionMessage: "Brrr! Time!",
    completionEmoji: "⛄",
    sceneDecorator: "snowman",
  },
  {
    id: "halloween",
    name: "Halloween",
    emoji: "🎃",
    bgGradient: "from-purple-950 via-orange-950 to-black",
    accent: "#fb923c",
    accentButton: "bg-orange-500 hover:bg-orange-600",
    particleEmoji: "🦇",
    particleColor: "rgba(251, 146, 60, 0.7)",
    particleCount: 25,
    particleAnim: "batFly",
    flashColor: "rgba(255, 120, 0, 0.9)",
    completionMessage: "Boo! Time!",
    completionEmoji: "👻",
    sceneDecorator: "jackolanterns",
  },
  {
    id: "christmas",
    name: "Christmas",
    emoji: "🎄",
    bgGradient: "from-green-950 via-red-950 to-green-900",
    accent: "#ef4444",
    accentButton: "bg-red-500 hover:bg-red-600",
    particleEmoji: "❄️",
    particleColor: "rgba(255, 255, 255, 1)",
    particleCount: 50,
    particleAnim: "snowFall",
    flashColor: "rgba(255, 255, 255, 0.9)",
    completionMessage: "Ho ho ho!",
    completionEmoji: "🎅",
    sceneDecorator: "christmas",
  },
  {
    id: "newyear",
    name: "New Year",
    emoji: "🎉",
    bgGradient: "from-slate-950 via-indigo-950 to-purple-950",
    accent: "#fbbf24",
    accentButton: "bg-amber-500 hover:bg-amber-600",
    particleEmoji: "✨",
    particleColor: "rgba(251, 191, 36, 0.9)",
    particleCount: 40,
    particleAnim: "particleFloat",
    flashColor: "rgba(251, 191, 36, 0.95)",
    completionMessage: "Happy New Year!",
    completionEmoji: "🎆",
    sceneDecorator: "fireworks",
  },
  {
    id: "easter",
    name: "Easter",
    emoji: "🐰",
    bgGradient: "from-purple-400 via-pink-300 to-yellow-300",
    accent: "#c026d3",
    accentButton: "bg-fuchsia-500 hover:bg-fuchsia-600",
    particleEmoji: "🥚",
    particleColor: "rgba(236, 72, 153, 0.8)",
    particleCount: 25,
    particleAnim: "petalFall",
    flashColor: "rgba(255, 200, 230, 0.9)",
    completionMessage: "Egg-cellent!",
    completionEmoji: "🐇",
    sceneDecorator: "easter",
  },
  {
    id: "valentine",
    name: "Valentine's",
    emoji: "💝",
    bgGradient: "from-rose-950 via-pink-900 to-red-950",
    accent: "#fb7185",
    accentButton: "bg-rose-500 hover:bg-rose-600",
    particleEmoji: "❤️",
    particleColor: "rgba(251, 113, 133, 1)",
    particleCount: 30,
    particleAnim: "heartFloat",
    flashColor: "rgba(251, 113, 133, 0.95)",
    completionMessage: "Love it!",
    completionEmoji: "💖",
    sceneDecorator: "hearts",
  },
  {
    id: "birthday",
    name: "Birthday",
    emoji: "🎂",
    bgGradient: "from-fuchsia-600 via-purple-600 to-pink-600",
    accent: "#f0abfc",
    accentButton: "bg-fuchsia-500 hover:bg-fuchsia-600",
    particleEmoji: "🎉",
    particleColor: "rgba(240, 171, 252, 0.9)",
    particleCount: 30,
    particleAnim: "balloonFloat",
    flashColor: "rgba(240, 171, 252, 0.9)",
    completionMessage: "Happy Birthday!",
    completionEmoji: "🎂",
    sceneDecorator: "birthday",
  },
  {
    id: "diwali",
    name: "Diwali",
    emoji: "🪔",
    bgGradient: "from-amber-700 via-orange-800 to-red-900",
    accent: "#f59e0b",
    accentButton: "bg-amber-500 hover:bg-amber-600",
    particleEmoji: "✨",
    particleColor: "rgba(251, 191, 36, 0.8)",
    particleCount: 35,
    particleAnim: "particleFloat",
    flashColor: "rgba(255, 200, 50, 0.9)",
    completionMessage: "Happy Diwali!",
    completionEmoji: "🪔",
    sceneDecorator: "diyas",
  },
  {
    id: "lunar",
    name: "Lunar New Year",
    emoji: "🏮",
    bgGradient: "from-red-700 via-red-800 to-yellow-900",
    accent: "#fbbf24",
    accentButton: "bg-red-600 hover:bg-red-700",
    particleEmoji: "✨",
    particleColor: "rgba(251, 191, 36, 0.7)",
    particleCount: 30,
    particleAnim: "particleFloat",
    flashColor: "rgba(251, 191, 36, 0.9)",
    completionMessage: "Gong xi!",
    completionEmoji: "🐉",
    sceneDecorator: "lanterns",
  },
  {
    id: "stpatrick",
    name: "St. Patrick's",
    emoji: "🍀",
    bgGradient: "from-green-500 via-emerald-600 to-green-800",
    accent: "#22c55e",
    accentButton: "bg-green-500 hover:bg-green-600",
    particleEmoji: "🍀",
    particleColor: "rgba(34, 197, 94, 0.7)",
    particleCount: 25,
    particleAnim: "petalFall",
    flashColor: "rgba(34, 197, 94, 0.85)",
    completionMessage: "Lucky time!",
    completionEmoji: "🇮🇪",
    sceneDecorator: "clover",
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    emoji: "🦃",
    bgGradient: "from-amber-800 via-orange-900 to-red-950",
    accent: "#fbbf24",
    accentButton: "bg-amber-600 hover:bg-amber-700",
    particleEmoji: "🍂",
    particleColor: "rgba(251, 191, 36, 0.8)",
    particleCount: 25,
    particleAnim: "leafFall",
    flashColor: "rgba(251, 191, 36, 0.9)",
    completionMessage: "Give thanks!",
    completionEmoji: "🦃",
    sceneDecorator: "thanksgiving",
  },
];

export function getSkin(id: SkinId): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

/* ============================================================
   SAVED SKIN HOOK — persists favorite skin per timer in localStorage
   ============================================================ */
const STORAGE_KEY = "classroom-timer-saved-skins";

function readSavedSkins(): Record<string, SkinId> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SkinId>;
  } catch {
    return {};
  }
}

function writeSavedSkins(map: Record<string, SkinId>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Hook that manages the current skin for a timer, with localStorage persistence.
 * - On mount, loads the saved skin for this timerKey (if any) via lazy initial state.
 * - When the user saves a skin, it's persisted to localStorage.
 * - Returns: current skinId, setSkinId function, savedSkinId, saveSkin function, isSaved boolean.
 */
export function useSavedSkin(timerKey: string) {
  // Lazy-initialize from localStorage so we don't need an effect
  const [savedSkinId, setSavedSkinId] = useState<SkinId | null>(() => {
    const saved = readSavedSkins();
    return saved[timerKey] ?? null;
  });
  const [skinId, setSkinId] = useState<SkinId>(() => {
    const saved = readSavedSkins();
    return saved[timerKey] ?? "default";
  });

  const saveSkin = (id: SkinId) => {
    const saved = readSavedSkins();
    saved[timerKey] = id;
    writeSavedSkins(saved);
    setSavedSkinId(id);
  };

  const isSaved = savedSkinId === skinId;

  return { skinId, setSkinId, savedSkinId, saveSkin, isSaved };
}

/* ============================================================
   SKIN PARTICLE FIELD — renders themed particles (emoji or dot)
   ============================================================ */
export function SkinParticleField({
  skin,
  seed = 0,
}: {
  skin: SkinDef;
  seed?: number;
}) {
  const particles = useParticleField(skin.particleCount, seed);

  if (skin.particleEmoji) {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute select-none"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${p.size * 6 + 14}px`,
                animation: `${skin.particleAnim} ${p.duration * 2}s linear ${p.delay}s infinite`,
                ["--drift" as string]: `${p.drift}px`,
                opacity: 0.85,
              } as React.CSSProperties
            }
          >
            {skin.particleEmoji}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: skin.particleColor,
              animation: `${skin.particleAnim} ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
              ["--drift" as string]: `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ============================================================
   SKIN SCENE DECORATOR — large background scene element
   ============================================================ */
/* ============================================================
   PATTERNED EASTER EGG — colourful SVG egg with patterns
   ============================================================ */
function PatternedEgg({
  className,
  pattern = "dots",
  colors = ["#ec4899", "#fbbf24", "#22c55e"],
  size = 48,
}: {
  className?: string;
  pattern?: "dots" | "stripes" | "zigzag";
  colors?: string[];
  size?: number;
}) {
  const eggId = `egg-${pattern}-${colors.join("")}`;
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 100 130"
      className={className}
      aria-hidden
    >
      <defs>
        <clipPath id={eggId}>
          <ellipse cx="50" cy="70" rx="42" ry="55" />
        </clipPath>
        {pattern === "stripes" && (
          <pattern id={`${eggId}-pat`} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="10" fill={colors[0]} />
            <rect y="10" width="20" height="10" fill={colors[1]} />
          </pattern>
        )}
        {pattern === "dots" && (
          <pattern id={`${eggId}-pat`} width="18" height="18" patternUnits="userSpaceOnUse">
            <rect width="18" height="18" fill={colors[0]} />
            <circle cx="9" cy="9" r="4" fill={colors[1]} />
            <circle cx="0" cy="0" r="3" fill={colors[2] ?? "#fff"} />
            <circle cx="18" cy="18" r="3" fill={colors[2] ?? "#fff"} />
          </pattern>
        )}
        {pattern === "zigzag" && (
          <pattern id={`${eggId}-pat`} width="24" height="16" patternUnits="userSpaceOnUse">
            <rect width="24" height="16" fill={colors[0]} />
            <polyline points="0,4 6,12 12,4 18,12 24,4" fill="none" stroke={colors[1]} strokeWidth="3" />
            <polyline points="0,12 6,4 12,12 18,4 24,12" fill="none" stroke={colors[2] ?? "#fff"} strokeWidth="2" />
          </pattern>
        )}
      </defs>
      {/* Egg shape with pattern */}
      <g clipPath={`url(#${eggId})`}>
        <rect width="100" height="130" fill={`url(#${eggId}-pat)`} />
      </g>
      {/* Egg outline + highlight */}
      <ellipse cx="50" cy="70" rx="42" ry="55" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
      <ellipse cx="35" cy="45" rx="12" ry="18" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

export function SkinSceneDecorator({ skin }: { skin: SkinDef }) {
  switch (skin.sceneDecorator) {
    case "sun":
      return (
        <div className="absolute top-8 right-8 w-24 h-24 rounded-full bg-yellow-300 shadow-[0_0_80px_30px_rgba(255,230,100,0.7)] animate-[spinGlow_30s_linear_infinite]" />
      );
    case "moon":
      return (
        <div className="absolute top-8 right-8 w-20 h-20 rounded-full bg-yellow-100 shadow-[0_0_60px_20px_rgba(255,255,200,0.7)]" />
      );
    case "pumpkin":
      return (
        <div className="absolute bottom-4 right-6 text-7xl drop-shadow-2xl animate-[winnerBounce_3s_ease-in-out_infinite]">
          🎃
        </div>
      );
    case "tree":
      return (
        <div className="absolute bottom-2 left-4 text-7xl drop-shadow-2xl">
          🌳
        </div>
      );
    case "snowman":
      return (
        <div className="absolute bottom-2 right-6 text-7xl drop-shadow-2xl animate-[winnerBounce_4s_ease-in-out_infinite]">
          ⛄
        </div>
      );
    case "fireworks":
      return (
        <>
          {/* Sparkle stars instead of fireworks */}
          <div className="absolute top-1/4 left-1/4 text-5xl animate-[twinkle_2s_ease-in-out_infinite]">⭐</div>
          <div className="absolute top-1/3 right-1/4 text-4xl animate-[twinkle_2.5s_ease-in-out_0.5s_infinite]">✨</div>
          <div className="absolute top-1/2 left-1/2 text-3xl animate-[twinkle_3s_ease-in-out_1s_infinite]">⭐</div>
          <div className="absolute top-20 right-10 text-3xl animate-[twinkle_2s_ease-in-out_1.5s_infinite]">✨</div>
        </>
      );
    case "lanterns":
      return (
        <>
          <div className="absolute top-6 left-8 text-5xl animate-[winnerBounce_3s_ease-in-out_infinite]">🏮</div>
          <div className="absolute top-6 right-8 text-5xl animate-[winnerBounce_3s_ease-in-out_1s_infinite]">🏮</div>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-6xl animate-[winnerBounce_3.5s_ease-in-out_0.5s_infinite]">🐉</div>
        </>
      );
    case "diyas":
      return (
        <>
          <div className="absolute bottom-3 left-6 text-4xl animate-[flicker_0.5s_ease-in-out_infinite]">🪔</div>
          <div className="absolute bottom-3 right-6 text-4xl animate-[flicker_0.6s_ease-in-out_0.2s_infinite]">🪔</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-5xl animate-[flicker_0.4s_ease-in-out_0.1s_infinite]">🪔</div>
        </>
      );
    case "eggs":
      return (
        <>
          <div className="absolute bottom-3 left-8 text-3xl rotate-12">🥚</div>
          <div className="absolute bottom-3 right-8 text-3xl -rotate-12">🥚</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-4xl">🐰</div>
        </>
      );
    case "hearts":
      return (
        <>
          <div className="absolute top-8 left-8 text-4xl animate-[winnerBounce_2s_ease-in-out_infinite]">💖</div>
          <div className="absolute top-8 right-8 text-4xl animate-[winnerBounce_2s_ease-in-out_0.5s_infinite]">💕</div>
        </>
      );
    case "balloons":
      return (
        <>
          <div className="absolute top-6 left-6 text-4xl animate-[balloonFloat_4s_ease-in-out_infinite]">🎈</div>
          <div className="absolute top-6 right-6 text-4xl animate-[balloonFloat_4s_ease-in-out_1s_infinite]">🎈</div>
          <div className="absolute top-20 left-1/3 text-3xl animate-[balloonFloat_5s_ease-in-out_0.5s_infinite]">🎈</div>
        </>
      );
    case "cherry":
      return (
        <>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-400/40 to-transparent" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-6xl">🌸</div>
        </>
      );
    case "clover":
      return (
        <>
          <div className="absolute bottom-2 left-4 text-6xl drop-shadow-2xl animate-[winnerBounce_3s_ease-in-out_infinite]">🍀</div>
          <div className="absolute bottom-2 right-4 text-5xl drop-shadow-2xl animate-[winnerBounce_3.5s_ease-in-out_0.8s_infinite]">☘️</div>
          <div className="absolute top-6 right-6 text-4xl drop-shadow-2xl">🌈</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-5xl">🪙</div>
          <div className="absolute top-8 left-6 text-3xl">🎩</div>
        </>
      );
    case "turkey":
    case "thanksgiving":
      return (
        <>
          <div className="absolute bottom-2 right-4 text-7xl drop-shadow-2xl animate-[winnerBounce_3s_ease-in-out_infinite]">🦃</div>
          <div className="absolute bottom-2 left-4 text-6xl drop-shadow-2xl animate-[winnerBounce_3.5s_ease-in-out_0.8s_infinite]">🦃</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-5xl">🌽</div>
          <div className="absolute top-6 right-6 text-4xl drop-shadow-2xl">🍂</div>
          <div className="absolute top-8 left-6 text-4xl">🥧</div>
          <div className="absolute top-1/3 right-8 text-3xl opacity-70">🍁</div>
        </>
      );
    case "beach":
      return (
        <>
          {/* Big sun */}
          <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-yellow-300 shadow-[0_0_80px_30px_rgba(255,230,100,0.8)] animate-[spinGlow_30s_linear_infinite]" />
          {/* Beach umbrella */}
          <div className="absolute bottom-2 left-4 text-6xl drop-shadow-2xl">⛱️</div>
          {/* Palm tree */}
          <div className="absolute bottom-2 right-4 text-6xl drop-shadow-2xl">🌴</div>
          {/* Japanese wind chime (furin) */}
          <div className="absolute top-8 left-8 text-4xl animate-[winnerBounce_2s_ease-in-out_infinite]">🎐</div>
          {/* Beach ball */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-4xl animate-[winnerBounce_2s_ease-in-out_infinite]">🏐</div>
          {/* Seashells */}
          <div className="absolute top-1/4 left-6 text-3xl">🐚</div>
          <div className="absolute top-1/3 right-6 text-3xl">🐚</div>
        </>
      );
    case "jackolanterns":
      return (
        <>
          {/* Multiple Jack-o-lanterns */}
          <div className="absolute bottom-2 left-4 text-7xl drop-shadow-2xl animate-[winnerBounce_3s_ease-in-out_infinite]">🎃</div>
          <div className="absolute bottom-2 right-4 text-7xl drop-shadow-2xl animate-[winnerBounce_3.5s_ease-in-out_0.8s_infinite]">🎃</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-6xl drop-shadow-2xl">🎃</div>
          {/* Ghost */}
          <div className="absolute top-8 left-8 text-5xl animate-[winnerBounce_2.5s_ease-in-out_infinite]">👻</div>
          {/* Spider web */}
          <div className="absolute top-6 right-8 text-4xl">🕸️</div>
          {/* Witch hat */}
          <div className="absolute top-1/3 right-6 text-4xl opacity-80">🧙</div>
        </>
      );
    case "christmas":
      return (
        <>
          {/* Christmas tree */}
          <div className="absolute bottom-2 left-4 text-7xl drop-shadow-2xl animate-[winnerBounce_3s_ease-in-out_infinite]">🎄</div>
          {/* Santa */}
          <div className="absolute bottom-2 right-4 text-6xl drop-shadow-2xl animate-[winnerBounce_3.5s_ease-in-out_0.8s_infinite]">🎅</div>
          {/* Snowman */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-5xl">⛄</div>
          {/* Presents */}
          <div className="absolute top-8 left-8 text-4xl">🎁</div>
          <div className="absolute top-8 right-8 text-4xl">🎁</div>
          {/* Ornament */}
          <div className="absolute top-1/3 left-6 text-3xl">🧦</div>
          {/* Star */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-4xl animate-[dramaticPulse_2s_ease-in-out_infinite]">⭐</div>
        </>
      );
    case "easter":
      return (
        <>
          {/* Rabbits */}
          <div className="absolute bottom-2 left-4 text-6xl drop-shadow-2xl animate-[winnerBounce_3s_ease-in-out_infinite]">🐰</div>
          <div className="absolute bottom-2 right-4 text-6xl drop-shadow-2xl animate-[winnerBounce_3.5s_ease-in-out_0.8s_infinite]">🐰</div>
          {/* Colourful patterned Easter eggs (SVG) */}
          <PatternedEgg className="absolute bottom-3 left-1/2 -translate-x-1/2" pattern="stripes" colors={["#ec4899", "#fbbf24", "#22c55e"]} />
          <PatternedEgg className="absolute top-1/3 left-8" pattern="dots" colors={["#3b82f6", "#fff", "#a855f7"]} size={36} />
          <PatternedEgg className="absolute top-1/3 right-8" pattern="zigzag" colors={["#f97316", "#fff", "#06b6d4"]} size={36} />
          <PatternedEgg className="absolute top-20 left-1/4" pattern="dots" colors={["#ef4444", "#fbbf24", "#fff"]} size={28} />
          {/* Flowers */}
          <div className="absolute top-8 left-8 text-4xl">🌷</div>
          <div className="absolute top-8 right-8 text-4xl">🌼</div>
          {/* Chick */}
          <div className="absolute top-1/2 left-6 text-4xl animate-[winnerBounce_2s_ease-in-out_infinite]">🐤</div>
          <div className="absolute top-1/2 right-6 text-4xl animate-[winnerBounce_2.5s_ease-in-out_0.5s_infinite]">🐤</div>
          {/* Basket */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-4xl">🧺</div>
        </>
      );
    case "birthday":
      return (
        <>
          {/* Cake */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-7xl drop-shadow-2xl animate-[winnerBounce_3s_ease-in-out_infinite]">🎂</div>
          {/* Balloons */}
          <div className="absolute top-6 left-6 text-5xl animate-[balloonFloat_4s_ease-in-out_infinite]">🎈</div>
          <div className="absolute top-6 right-6 text-5xl animate-[balloonFloat_4s_ease-in-out_1s_infinite]">🎈</div>
          {/* Candles */}
          <div className="absolute bottom-2 left-4 text-4xl animate-[flicker_0.5s_ease-in-out_infinite]">🕯️</div>
          <div className="absolute bottom-2 right-4 text-4xl animate-[flicker_0.6s_ease-in-out_0.2s_infinite]">🕯️</div>
          {/* Gift */}
          <div className="absolute top-1/3 left-8 text-4xl">🎁</div>
          {/* Party popper */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-4xl animate-[countdownBoom_2s_ease-out_infinite]">🎉</div>
        </>
      );
    default:
      return null;
  }
}

/* ============================================================
   SKIN PICKER — horizontal chip row with save/favorite button
   ============================================================ */
export function SkinPicker({
  current,
  onChange,
  timerKey,
}: {
  current: SkinId;
  onChange: (id: SkinId) => void;
  /** Optional timer key — when provided, shows a "save as favorite" heart button */
  timerKey?: string;
}) {
  // Read saved skin once on mount via lazy initial state (no effect needed)
  const [savedSkin, setSavedSkin] = useState<SkinId | null>(() => {
    if (!timerKey) return null;
    const saved = readSavedSkins();
    return saved[timerKey] ?? null;
  });

  const handleSave = () => {
    if (!timerKey) return;
    const saved = readSavedSkins();
    saved[timerKey] = current;
    writeSavedSkins(saved);
    setSavedSkin(current);
  };

  const isSaved = savedSkin === current;

  return (
    <div className="w-full mb-2">
      <div className="flex items-center justify-center gap-2 mb-2">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          Theme
        </p>
        {timerKey && (
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border transition-all ${
              isSaved
                ? "bg-pink-500/30 text-pink-200 border-pink-400/50"
                : "bg-white/10 text-white/70 border-white/25 hover:bg-white/20"
            }`}
            title={
              isSaved
                ? "This is your saved favorite for this timer"
                : "Save this skin as your favorite for this timer"
            }
          >
            <span className={isSaved ? "animate-pulse" : ""}>
              {isSaved ? "♥" : "♡"}
            </span>
            {isSaved ? "Saved" : "Save favorite"}
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap max-h-24 overflow-y-hidden">
        {SKINS.map((skin) => (
          <button
            key={skin.id}
            onClick={() => onChange(skin.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all relative ${
              current === skin.id
                ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                : "bg-white/10 text-white border-white/25 hover:bg-white/20"
            }`}
            title={skin.name}
          >
            <span className="mr-1">{skin.emoji}</span>
            {skin.name}
            {savedSkin === skin.id && (
              <span className="absolute -top-1 -right-1 text-pink-400 text-sm drop-shadow" aria-label="saved favorite">
                ♥
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

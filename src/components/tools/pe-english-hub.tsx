"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import {
  Play, Pause, RotateCcw, Shuffle, Dice5, TrafficCone, Activity,
  Volume2, ChevronRight, ChevronDown, Check, X, Timer, Dumbbell,
  Maximize2, Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   PE ENGLISH HUB — Year 4 Elementary (EPR: English through Physical Response)
   ============================================================
   A complete 50-minute PE-in-English lesson tool with:
   - 4-phase lesson timer (Warm-Up → Drill → Main Activity → Cool-Down)
   - Traffic Light controller (7 colors for Red Light Green Light Plus)
   - Simon Says command generator (30+ commands)
   - PE Flashcards (20 cards: Signal Lights, Stations, Game Words)
   - PE Dice (movement dice, body parts, colors)
   - Station rotation timer (for Choice A Stations)
   - All visual-first, iPad-optimized, touch-friendly
   ============================================================ */

type Phase = "warmup" | "drill" | "main" | "cooldown" | "stations";
type DiceOption = {
  text: string;
  emoji: string;
  visual?: "movement" | "bodyPart";
  id?: string;
};

const PHASES: { id: Phase; name: string; emoji: string; minutes: number; color: string; desc: string }[] = [
  { id: "warmup",  name: "Warm-Up: Simon Says",     emoji: "🙋", minutes: 10, color: "from-blue-500 to-cyan-600",    desc: "Listening comprehension & body parts" },
  { id: "drill",   name: "Drill: Red Light Green Light", emoji: "🚦", minutes: 10, color: "from-yellow-500 to-orange-600", desc: "Movement modifiers & colors" },
  { id: "main",    name: "Main: Fruit Salad Tag",   emoji: "🍎", minutes: 20, color: "from-red-500 to-pink-600",      desc: "Rapid recall & active participation" },
  { id: "stations",name: "Stations: Choice A",      emoji: "🎯", minutes: 5,  color: "from-green-500 to-emerald-600", desc: "Free-choice activity rotation" },
  { id: "cooldown",name: "Cool-Down & Review",      emoji: "🧘", minutes: 5,  color: "from-purple-500 to-indigo-600", desc: "Stretch & vocabulary review" },
];

// ===== Traffic Lights for Red Light Green Light Plus =====
const TRAFFIC_LIGHTS = [
  { color: "green",  emoji: "🟢", bg: "bg-green-500",   action: "RUN / WALK FORWARD", jp: "走る (はしる)",         katakana: "ラン" },
  { color: "red",    emoji: "🔴", bg: "bg-red-500",     action: "FREEZE!",            jp: "止まる (とまる)",         katakana: "フリーズ" },
  { color: "yellow", emoji: "🟡", bg: "bg-yellow-500",  action: "SLOW MOTION",        jp: "ゆっくり歩く",            katakana: "スローモーション" },
  { color: "purple", emoji: "🟣", bg: "bg-purple-500",  action: "HOP LIKE A FROG",    jp: "カエルのように跳ぶ",       katakana: "ホップ" },
  { color: "orange", emoji: "🟠", bg: "bg-orange-500",  action: "CRAB WALK",          jp: "カニ歩き",               katakana: "クラブ ウォーク" },
  { color: "blue",   emoji: "🔵", bg: "bg-blue-500",    action: "FLY LIKE A BIRD",    jp: "鳥のように飛ぶ",          katakana: "フライ" },
  { color: "pink",   emoji: "🩷", bg: "bg-pink-500",    action: "KANGAROO JUMP",      jp: "カンガルージャンプ",      katakana: "ジャンプ" },
];

// ===== Simon Says Commands =====
const SIMON_COMMANDS = [
  // Round 1: Body Parts
  "Touch your head", "Touch your shoulders", "Touch your right knee", "Touch your toes",
  "Touch your elbow", "Touch your ankle", "Touch your back", "Clap your hands 3 times",
  "Stand on one leg", "Spin around once", "Touch your nose", "Jump twice",
  // Round 2: Dynamic Actions
  "Run in place!", "Hop like a frog", "March like a soldier", "Swim in the air",
  "Walk slowly", "Stretch tall", "Climb the ladder", "Sing one word",
  "Freeze!", "Flap your arms like a bird", "Wiggle your fingers", "Stomp your feet",
  // Round 3: Spatial
  "Take 2 steps forward", "Take 1 giant leap backward", "Touch the floor with your left hand",
  "Whisper your name", "Shout 'English!'", "Cross your arms", "Sit down quietly",
  "Roll your shoulders", "Point to your backside", "Make a big circle",
];

// Trick commands (no "Simon says" prefix)
const SIMON_TRICKS = [
  "Touch your nose!", "Jump twice!", "Freeze!", "Sit down!", "Shout 'English'!",
];

// ===== Body part visuals =====
const BODY_PARTS = [
  { id: "head", en: "Head", jp: "あたま", emoji: "HEAD", top: "29%", left: "50%", calloutX: "76%", calloutY: "18%" },
  { id: "shoulders", en: "Shoulders", jp: "かた", emoji: "SHOULDERS", top: "46%", left: "50%", calloutX: "76%", calloutY: "38%" },
  { id: "knees", en: "Knees", jp: "ひざ", emoji: "KNEES", top: "79%", left: "34%", calloutX: "78%", calloutY: "70%" },
  { id: "toes", en: "Toes", jp: "つまさき", emoji: "TOES", top: "90%", left: "75%", calloutX: "77%", calloutY: "78%" },
  { id: "elbows", en: "Elbows", jp: "ひじ", emoji: "ELBOWS", top: "68%", left: "18%", calloutX: "76%", calloutY: "58%" },
  { id: "legs", en: "Legs", jp: "あし", emoji: "LEGS", top: "75%", left: "50%", calloutX: "78%", calloutY: "66%" },
  { id: "arms", en: "Arms", jp: "うで", emoji: "ARMS", top: "58%", left: "35%", calloutX: "76%", calloutY: "48%" },
  { id: "hands", en: "Hands", jp: "て", emoji: "HANDS", top: "76%", left: "12%", calloutX: "76%", calloutY: "66%" },
  { id: "fingers", en: "Fingers", jp: "ゆび", emoji: "FINGERS", top: "75%", left: "90%", calloutX: "72%", calloutY: "64%" },
  { id: "back", en: "Back", jp: "せなか", emoji: "BACK", top: "54%", left: "50%", calloutX: "78%", calloutY: "42%" },
  { id: "backside", en: "Backside", jp: "おしり", emoji: "BACKSIDE", top: "70%", left: "50%", calloutX: "78%", calloutY: "60%" },
  { id: "ankle", en: "Ankle", jp: "あしくび", emoji: "ANKLE", top: "89%", left: "67%", calloutX: "78%", calloutY: "78%" },
] as const;

// ===== PE Flashcards (20 cards) =====
const PE_FLASHCARDS = [
  // SET 1: Signal Lights
  { id: "green",  set: "Signal Lights", front: "🟢 GREEN LIGHT",  back: "RUN / WALK FORWARD\n走る (はしる)\nラン", color: "bg-green-500" },
  { id: "red",    set: "Signal Lights", front: "🔴 RED LIGHT",    back: "FREEZE!\n止まる (とまる)\nフリーズ", color: "bg-red-500" },
  { id: "yellow", set: "Signal Lights", front: "🟡 YELLOW LIGHT", back: "SLOW MOTION\nゆっくり歩く\nスローモーション", color: "bg-yellow-500" },
  { id: "purple", set: "Signal Lights", front: "🟣 PURPLE LIGHT", back: "HOP LIKE A FROG\nカエルのように跳ぶ\nホップ", color: "bg-purple-500" },
  { id: "orange-light", set: "Signal Lights", front: "🟠 ORANGE LIGHT", back: "CRAB WALK\nカニ歩き\nクラブ ウォーク", color: "bg-orange-500" },
  { id: "blue",   set: "Signal Lights", front: "🔵 BLUE LIGHT",   back: "FLY LIKE A BIRD\n鳥のように飛ぶ\nフライ", color: "bg-blue-500" },
  { id: "pink",   set: "Signal Lights", front: "🩷 PINK LIGHT",   back: "KANGAROO JUMP\nカンガルージャンプ\nジャンプ", color: "bg-pink-500" },
  // SET 2: Stations
  { id: "toss",   set: "Stations", front: "🎯 TARGET TOSS",     back: "Throw to the target!\n的当て (まとあて)", color: "bg-emerald-600" },
  { id: "rope",   set: "Stations", front: "🪢 JUMP ROPE",       back: "Jump and count!\n縄跳び (なわとび)", color: "bg-cyan-600" },
  { id: "balance",set: "Stations", front: "⚖️ BALANCE PATH",    back: "Walk carefully!\nバランス", color: "bg-teal-600" },
  // SET 3: Game Words
  { id: "apple",  set: "Game Words", front: "🍎 Apples",        back: "りんご\nアップルズ", color: "bg-red-400" },
  { id: "banana", set: "Game Words", front: "🍌 Bananas",       back: "バナナ", color: "bg-yellow-400" },
  { id: "orange", set: "Game Words", front: "🍊 Oranges",       back: "みかん・オレンジ", color: "bg-orange-400" },
  { id: "salad",  set: "Game Words", front: "🥗 Fruit Salad!",  back: "フルーツサラダ！\nEveryone runs!", color: "bg-green-400" },
  { id: "ok",     set: "Game Words", front: "👍 Are you OK?",   back: "だいじょうぶ？", color: "bg-red-500" },
  { id: "free",   set: "Game Words", front: "🆓 You're free!",  back: "自由だよ！(じゆうだよ)", color: "bg-green-500" },
  { id: "try",    set: "Game Words", front: "🙋 Can I try?",    back: "やってみてもいい？", color: "bg-blue-400" },
  { id: "turn",   set: "Game Words", front: "👉 My turn!",      back: "私の番！(わたしのばん)", color: "bg-purple-400" },
  { id: "stretch-tall", set: "Game Words", front: "🙆 Stretch tall", back: "大きくのびる", color: "bg-indigo-400" },
  { id: "fun",    set: "Game Words", front: "💭 What was fun?", back: "何が楽しかった？", color: "bg-slate-500" },
];

const RANDOM_CARD_BLOCKLIST = new Set(["turn", "free", "toss", "rope", "salad"]);
const RANDOM_PE_FLASHCARDS = PE_FLASHCARDS.filter((card) => !RANDOM_CARD_BLOCKLIST.has(card.id));

// ===== PE Dice Presets =====
const PE_DICE_PRESETS: Record<string, DiceOption[]> = {
  movements: [
    { id: "stretch", text: "Stretch", emoji: "STRETCH", visual: "movement" },
    { id: "jump", text: "Jump", emoji: "JUMP", visual: "movement" },
    { id: "run", text: "Run", emoji: "RUN", visual: "movement" },
    { id: "walk", text: "Walk", emoji: "WALK", visual: "movement" },
    { id: "swim", text: "Swim", emoji: "SWIM", visual: "movement" },
    { id: "spin", text: "Spin", emoji: "SPIN", visual: "movement" },
    { id: "climb", text: "Climb", emoji: "CLIMB", visual: "movement" },
    { id: "sing", text: "Sing", emoji: "SING", visual: "movement" },
  ],
  bodyParts: BODY_PARTS.map((part) => ({ id: part.id, text: part.en, emoji: part.emoji, visual: "bodyPart" })),
  animals: [
    { text: "Frog",     emoji: "🐸" },
    { text: "Bird",     emoji: "🐦" },
    { text: "Crab",     emoji: "🦀" },
    { text: "Kangaroo", emoji: "🦘" },
    { text: "Rabbit",   emoji: "🐰" },
    { text: "Snake",    emoji: "🐍" },
  ],
  colors: [
    { text: "Green=Run",    emoji: "🟢" },
    { text: "Red=Freeze",   emoji: "🔴" },
    { text: "Yellow=Slow",  emoji: "🟡" },
    { text: "Purple=Hop",   emoji: "🟣" },
    { text: "Orange=Crab",  emoji: "🟠" },
    { text: "Blue=Fly",     emoji: "🔵" },
  ],
  numbers: [
    { text: "3 times",  emoji: "3️⃣" },
    { text: "5 times",  emoji: "5️⃣" },
    { text: "10 times", emoji: "🔟" },
    { text: "2 times",  emoji: "2️⃣" },
    { text: "8 times",  emoji: "8️⃣" },
    { text: "1 time",   emoji: "1️⃣" },
  ],
};

// ===== Station descriptions =====
const STATIONS = [
  { name: "TARGET TOSS", emoji: "🎯", phrases: ["Step back", "Nice shot!", "Count: 1,2,3!"], desc: "Throw ball into hoop. Count points in English!" },
  { name: "JUMP ROPE", emoji: "🪢", phrases: ["Ready, set, jump!", "How many?", "Faster/Slower"], desc: "Jump continuously. Count without stopping!" },
  { name: "BALANCE PATH", emoji: "⚖️", phrases: ["Walk carefully", "Step over", "Stay balanced!"], desc: "Step, balance, and finish. Use slow careful English commands." },
];

function BodyPartVisual({ part }: { part: (typeof BODY_PARTS)[number] }) {
  const isBackView = part.id === "back" || part.id === "backside";

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-2xl border-4 border-slate-900 bg-gradient-to-b from-sky-100 via-white to-amber-50 shadow-inner">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_18%,#38bdf8_0_7px,transparent_8px),radial-gradient(circle_at_84%_28%,#facc15_0_8px,transparent_9px)]" />
      <svg viewBox="0 0 220 260" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M110 43c18 0 32 14 32 32s-14 32-32 32-32-14-32-32 14-32 32-32z" fill="#fff7ed" stroke="#0f172a" strokeWidth="8" />
        {isBackView ? (
          <path d="M82 72c4-26 52-36 62 0v20c-16-10-52-10-64 2z" fill="#0f172a" />
        ) : (
          <>
            <path d="M86 72h12M122 72h12" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
            <path d="M94 90c10 9 22 9 32 0" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
          </>
        )}
        <path d="M80 128c8-28 52-28 60 0l10 58H70z" fill={isBackView ? "#38bdf8" : "#f97316"} stroke="#0f172a" strokeWidth="8" strokeLinejoin="round" />
        {isBackView ? (
          <path d="M110 126v52M92 136h36" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" opacity=".45" />
        ) : null}
        <path d="M78 132L38 176M142 132l40 44" fill="none" stroke="#0f172a" strokeWidth="13" strokeLinecap="round" />
        <path d="M40 176l-14 22M180 176l18 20" fill="none" stroke="#0f172a" strokeWidth="11" strokeLinecap="round" />
        <path d="M88 186L74 242M132 186l14 56" fill="none" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
        <path d="M74 242H48M146 242h26" fill="none" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
        <path d="M66 118h88" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
        <circle cx="38" cy="176" r="9" fill="#fff" stroke="#0f172a" strokeWidth="5" />
        <circle cx="182" cy="176" r="9" fill="#fff" stroke="#0f172a" strokeWidth="5" />
        <circle cx="74" cy="206" r="9" fill="#fff" stroke="#0f172a" strokeWidth="5" />
        <circle cx="146" cy="206" r="9" fill="#fff" stroke="#0f172a" strokeWidth="5" />
      </svg>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id={`arrow-${part.id}`} markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#ef4444" />
          </marker>
        </defs>
        <line
          x1={part.calloutX}
          y1={part.calloutY}
          x2={part.left}
          y2={part.top}
          stroke="#ef4444"
          strokeWidth="3.5"
          strokeLinecap="round"
          markerEnd={`url(#arrow-${part.id})`}
        />
      </svg>
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white shadow-lg ring-4 ring-white"
        style={{ top: part.top, left: part.left }}
      >
        {part.emoji}
      </div>
      <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-white/90 px-2 py-1 text-center">
        <p className="text-lg font-black text-slate-950">{part.en}</p>
      </div>
    </div>
  );
}

function MovementVisual({ id, label }: { id?: string; label: string }) {
  const body = (() => {
    switch (id) {
      case "stretch":
        return <path d="M110 78v74M110 102L56 52M110 102l54-50M92 152l-36 70M128 152l36 70" />;
      case "jump":
        return <path d="M110 84v62M110 112L64 94M110 112l46-18M96 146l-48 42M124 146l48 42" />;
      case "run":
        return <path d="M118 92l-30 52 48 28M92 144l-54 4M136 172l42 48M112 126l56 6" />;
      case "walk":
        return <path d="M110 92v64M110 124l-42 30M110 126l42 18M100 156l-36 62M120 156l40 62" />;
      case "swim":
        return <path d="M58 142c30-28 60-28 92 0M88 118l48 48M52 180c42-18 78-18 120 0" />;
      case "spin":
        return <path d="M110 92v64M110 122l-48 2M110 122l48 2M94 156l-30 54M126 156l30 54" />;
      case "climb":
        return <path d="M72 54v174M148 54v174M72 92h76M72 134h76M72 176h76M114 96l-26 52 42 24M88 148l-26 34M130 172l22 46" />;
      case "sing":
        return <path d="M110 94v72M110 124l-42 30M110 124l42 30M94 166l-26 48M126 166l26 48" />;
      default:
        return <path d="M110 92v64M110 124l-42 30M110 126l42 18M96 156l-34 62M124 156l34 62" />;
    }
  })();

  return (
    <div className="relative h-full min-h-32 w-full overflow-hidden rounded-2xl border-4 border-slate-900 bg-gradient-to-br from-cyan-100 via-white to-yellow-100">
      <svg viewBox="0 0 220 260" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M30 56h50M28 96h34M150 54h46M160 206h36M30 222h52" stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" opacity=".45" />
        {id === "spin" ? (
          <path d="M62 82c32-42 104-42 128 8M176 76l18 20-28 6M158 198c-38 34-100 24-124-22M44 194l-18-20 28-6" fill="none" stroke="#f97316" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {id === "sing" ? (
          <>
            <path d="M154 64v84" stroke="#a855f7" strokeWidth="10" strokeLinecap="round" />
            <circle cx="136" cy="148" r="18" fill="#a855f7" />
            <path d="M172 58c22 8 28 24 18 42" fill="none" stroke="#a855f7" strokeWidth="8" strokeLinecap="round" />
          </>
        ) : null}
        <circle cx="110" cy="56" r="28" fill="#fff7ed" stroke="#0f172a" strokeWidth="8" />
        <g fill="none" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
          {body}
        </g>
        <path d="M98 55h8M122 55h8" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <path d="M100 72c8 8 20 8 28 0" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-white/92 px-2 py-1 text-center shadow">
        <p className="text-xl font-black uppercase tracking-wide text-slate-950">{label}</p>
      </div>
    </div>
  );
}

function DiceVisual({ option, large = false }: { option: DiceOption | null; large?: boolean }) {
  if (!option) {
    return <span className={cn("font-black text-slate-800", large ? "text-8xl" : "text-xl")}>?</span>;
  }

  if (option.visual === "bodyPart") {
    const part = BODY_PARTS.find((bodyPart) => bodyPart.id === option.id);
    if (part) {
      return (
        <div className={cn("w-full", large ? "max-w-[25rem]" : "max-w-[12rem]")}>
          <BodyPartVisual part={part} />
        </div>
      );
    }
  }

  if (option.visual === "movement") {
    return (
      <div className={cn("w-full", large ? "h-full max-h-[22rem] max-w-[25rem]" : "h-28 max-w-[11rem]")}>
        <MovementVisual id={option.id} label={option.text} />
      </div>
    );
  }

  return (
    <>
      <span className={cn("leading-none", large ? "text-[8rem] sm:text-[10rem]" : "text-4xl")}>{option.emoji}</span>
      <span className={cn("font-black text-slate-800 text-center px-2 leading-tight", large ? "text-4xl sm:text-5xl" : "text-sm")}>{option.text}</span>
    </>
  );
}

// ===== Component =====
export function PEEnglishHub() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [activePhase, setActivePhase] = useState<Phase>("warmup");
  const [activeLight, setActiveLight] = useState<string | null>(null);
  const [simonCommand, setSimonCommand] = useState<string>("");
  const [simonIsTrick, setSimonIsTrick] = useState(false);
  const [usedSimonCommands, setUsedSimonCommands] = useState<Set<number>>(new Set());
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [popupFlippedCard, setPopupFlippedCard] = useState<string | null>(null);
  const [randomCard, setRandomCard] = useState<typeof PE_FLASHCARDS[0] | null>(null);
  const [showJapanese, setShowJapanese] = useState(true);
  const [diceResult, setDiceResult] = useState<DiceOption | null>(null);
  const [diceCategory, setDiceCategory] = useState<keyof typeof PE_DICE_PRESETS>("movements");
  const [diceRolling, setDiceRolling] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(600);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(600);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ===== Popup state — any section can expand to fullscreen =====
  const [popupType, setPopupType] = useState<string | null>(null);

  const openPopup = (type: string) => {
    setPopupType(type);
    sound.playClick();
  };
  const closePopup = () => {
    setPopupType(null);
    sound.playClick();
  };

  // ESC key to close popup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && popupType) {
        closePopup();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popupType]);

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            sound.playReveal();
            flashFn("rgba(34, 197, 94, 0.6)");
            burstConfetti(100, 50, 40);
            return 0;
          }
          if (prev <= 11 && prev > 0) sound.playTick(800);
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [timerRunning, timerRemaining, sound, flashFn, burstConfetti]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const setPhaseTimer = (phase: Phase) => {
    const p = PHASES.find(ph => ph.id === phase);
    if (p) {
      setTimerSeconds(p.minutes * 60);
      setTimerRemaining(p.minutes * 60);
      setTimerRunning(false);
    }
  };

  // Traffic Light handler
  const handleLight = (color: string) => {
    setActiveLight(color);
    sound.playClick();
    if (color === "red") {
      flashFn("rgba(239, 68, 68, 0.5)");
      shake(3);
    } else if (color === "green") {
      flashFn("rgba(34, 197, 94, 0.4)");
    }
  };

  // Simon Says
  const drawSimonCommand = () => {
    // 70% normal command, 30% trick
    const isTrick = Math.random() < 0.3;
    if (isTrick) {
      const idx = Math.floor(Math.random() * SIMON_TRICKS.length);
      setSimonCommand(SIMON_TRICKS[idx]);
      setSimonIsTrick(true);
    } else {
      // Pick unused command
      let available = SIMON_COMMANDS.map((_, i) => i).filter(i => !usedSimonCommands.has(i));
      if (available.length === 0) {
        setUsedSimonCommands(new Set());
        available = SIMON_COMMANDS.map((_, i) => i);
      }
      const idx = available[Math.floor(Math.random() * available.length)];
      setSimonCommand(SIMON_COMMANDS[idx]);
      setSimonIsTrick(false);
      setUsedSimonCommands(prev => new Set(prev).add(idx));
    }
    sound.playWhoosh();
  };

  // Dice roll
  // Draw a random flashcard
  const drawRandomCard = () => {
    const card = RANDOM_PE_FLASHCARDS[Math.floor(Math.random() * RANDOM_PE_FLASHCARDS.length)];
    setRandomCard(card);
    setPopupFlippedCard(null);
    sound.playWhoosh();
  };

  const rollDice = () => {
    setDiceRolling(true);
    sound.playDiceRoll();
    const presets = PE_DICE_PRESETS[diceCategory];
    let ticks = 0;
    const interval = setInterval(() => {
      setDiceResult(presets[Math.floor(Math.random() * presets.length)]);
      ticks++;
      if (ticks >= 15) {
        clearInterval(interval);
        const final = presets[Math.floor(Math.random() * presets.length)];
        setDiceResult(final);
        setDiceRolling(false);
        sound.playReveal();
        flashFn("rgba(255, 215, 0, 0.5)");
      }
    }, 80);
  };

  const currentPhase = PHASES.find(p => p.id === activePhase)!;

  return (
    <div className="flex flex-col items-center gap-4 py-2 w-full">
      {/* Header */}
      <div className="w-full max-w-6xl px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 border border-white/10 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Dumbbell className="h-6 w-6" />
          PE English Hub 🏃‍♂️
        </h2>
        <p className="text-xs text-white/70 mt-0.5">
          Year 4 · 50-min Lesson · English through Physical Response
        </p>
      </div>

      {/* Phase selector */}
      <div className="w-full max-w-6xl flex items-center gap-2 flex-wrap justify-center">
        {PHASES.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => { setActivePhase(p.id); setPhaseTimer(p.id); sound.playClick(); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all",
              activePhase === p.id
                ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                : "classroom-control-button"
            )}
          >
            <span className="text-lg">{p.emoji}</span>
            <div className="text-left">
              <p className="text-sm leading-tight">{idx + 1}. {p.name.split(":")[0]}</p>
              <p className="text-xs leading-tight">{p.minutes} min</p>
            </div>
          </button>
        ))}
      </div>

      {/* Current phase info + Timer */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row gap-3 items-stretch">
        {/* Phase description */}
        <div className="flex-1 p-4 rounded-2xl border-2 border-sky-300 bg-white text-slate-950 shadow-lg">
          <p className="text-sm font-bold flex items-center gap-2">
            <span className="text-2xl">{currentPhase.emoji}</span>
            {currentPhase.name}
          </p>
          <p className="text-sm font-semibold text-slate-700 mt-1">{currentPhase.desc}</p>
        </div>

        {/* Timer */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-lg flex items-center gap-4">
          <div className="text-center">
            <p className="text-sm font-bold text-white uppercase">Timer</p>
            <p className={cn(
              "font-mono font-black tabular-nums text-white",
              timerRemaining <= 10 && timerRemaining > 0 ? "text-red-400 animate-pulse text-4xl" : "text-3xl"
            )}>
              {formatTime(timerRemaining)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { setTimerRunning(!timerRunning); sound.playClick(); }}
              aria-label={timerRunning ? "Pause lesson timer" : "Start lesson timer"}
              title={timerRunning ? "Pause lesson timer" : "Start lesson timer"}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                timerRunning ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-white text-slate-900 hover:scale-105"
              )}
            >
              {timerRunning ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            <button
              onClick={() => { setTimerRemaining(timerSeconds); setTimerRunning(false); sound.playClick(); }}
              className="classroom-control-button flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm"
              title="Reset lesson timer"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ===== Phase Content ===== */}
      <div className="w-full max-w-6xl">
        {/* WARM-UP: Simon Says */}
        {activePhase === "warmup" && (
          <div className="space-y-4">
        <div className="pe-lesson-panel p-6 rounded-2xl border-2 border-blue-300 text-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">🙋 Simon Says Command Generator</h3>
                <button
                  onClick={() => openPopup("simon")}
                  className="classroom-control-button flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
                >
                  <Maximize2 className="h-3 w-3" /> Pop Up
                </button>
              </div>
              <div className="min-h-[120px] flex items-center justify-center mb-4">
                {simonCommand ? (
                  <div className={cn(
                    "p-6 rounded-2xl border-2 max-w-lg",
                    simonIsTrick
                      ? "bg-red-500/20 border-red-400/50"
                      : "bg-blue-500/20 border-blue-400/50"
                  )}>
                    <p className={cn(
                      "text-2xl sm:text-3xl font-black",
                      simonIsTrick ? "text-red-300" : "text-white"
                    )}>
                      {simonIsTrick ? "⚠️ " : "✅ Simon says: "}
                      {simonCommand}
                    </p>
                    {simonIsTrick && (
                      <p className="text-base font-semibold text-white mt-2">Trick! No "Simon says" — don't move!</p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 text-sm">Click "Draw Command" to get a random instruction</p>
                )}
              </div>
              <Button
                onClick={drawSimonCommand}
                size="lg"
                className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 font-bold text-lg"
              >
                <Shuffle className="mr-2 h-5 w-5" />
                Draw Command
              </Button>
              <p className="text-sm font-semibold text-white mt-3">
                {SIMON_COMMANDS.length - usedSimonCommands.size} of {SIMON_COMMANDS.length} commands remaining
              </p>
            </div>

            {/* Quick body part reference — popup flashcards */}
        <div className="pe-lesson-panel p-4 rounded-2xl border-2 border-slate-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-white uppercase">Body Parts Quick Reference:</p>
                <button
                  onClick={() => openPopup("body-parts")}
                  className="classroom-control-button flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
                >
                  <Maximize2 className="h-3 w-3" /> Pop Up
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center">
                {BODY_PARTS.map(bp => (
                  <div key={bp.en} className="break-words px-2 py-2 rounded-lg bg-white text-slate-950 text-sm font-bold">{bp.en}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DRILL: Red Light Green Light */}
        {activePhase === "drill" && (
          <div className="space-y-4">
        <div className="pe-lesson-panel p-6 rounded-2xl border-2 border-yellow-400">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">🚦 Red Light, Green Light Plus</h3>
                <button
                  onClick={() => openPopup("traffic")}
                  className="classroom-control-button flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
                >
                  <Maximize2 className="h-3 w-3" /> Pop Up
                </button>
              </div>
              <p className="text-xs text-white/60 text-center mb-4">Tap a color to call out the action. Students must respond instantly!</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {TRAFFIC_LIGHTS.map(light => (
                  <button
                    key={light.color}
                    onClick={() => handleLight(light.color)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      activeLight === light.color
                        ? cn("border-white scale-105 shadow-2xl animate-[revealPulse_0.6s_ease-out]", light.bg)
                        : cn("border-white/20 hover:scale-105 hover:border-white/50", light.bg)
                    )}
                  >
                    <span className="text-4xl sm:text-5xl">{light.emoji}</span>
                    <div className="w-full rounded-lg bg-white p-2 text-center text-slate-950">
                      <p className="text-sm font-black uppercase">{light.action}</p>
                      {showJapanese && (
                        <p className="mt-1 text-sm font-semibold">{light.jp}</p>
                      )}
                      <p className="mt-1 text-sm font-semibold">{light.katakana}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setShowJapanese(!showJapanese)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                    showJapanese ? "classroom-control-button-active" : "classroom-control-button"
                  )}
                >
                  日本語 {showJapanese ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN: Fruit Salad Tag */}
        {activePhase === "main" && (
          <div className="space-y-4">
        <div className="pe-lesson-panel p-6 rounded-2xl border-2 border-red-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">🍎 Fruit Salad Tag</h3>
                <button
                  onClick={() => openPopup("fruit-salad")}
                  className="classroom-control-button flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
                >
                  <Maximize2 className="h-3 w-3" /> Pop Up
                </button>
              </div>
              <p className="text-xs text-white/60 text-center mb-4">Tap a team name to call them. Tap "FRUIT SALAD!" for everyone to run!</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { name: "Apples", emoji: "🍎", color: "bg-red-500" },
                  { name: "Bananas", emoji: "🍌", color: "bg-yellow-500" },
                  { name: "Oranges", emoji: "🍊", color: "bg-orange-500" },
                  { name: "Grapes", emoji: "🍇", color: "bg-purple-500" },
                ].map(team => (
                  <button
                    key={team.name}
                    onClick={() => { sound.playClick(); flashFn("rgba(255,255,255,0.3)"); }}
                    className={cn("flex flex-col items-center gap-2 p-5 rounded-2xl text-white font-black shadow-lg hover:scale-105 transition-all", team.color)}
                  >
                    <span className="text-5xl">{team.emoji}</span>
                    <span className="w-full rounded-lg bg-white px-2 py-1 text-lg text-slate-950">{team.name}!</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { sound.playReveal(); flashFn("rgba(255,0,128,0.5)"); burstConfetti(100, 50, 40); shake(3); }}
                className="w-full p-6 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white font-black text-2xl shadow-2xl hover:scale-[1.02] transition-all"
              >
                🥗 FRUIT SALAD! (Everyone runs!)
              </button>

              {/* Key phrases */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-center">
                  <p className="text-sm font-bold text-white">👍 Are you OK?</p>
                  <p className="text-xs text-white/60">だいじょうぶ？</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-400/30 text-center">
                  <p className="text-sm font-bold text-white">🆓 You're free!</p>
                  <p className="text-xs text-white/60">自由だよ！(じゆうだよ)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATIONS: Choice A */}
        {activePhase === "stations" && (
          <div className="space-y-4">
        <div className="pe-lesson-panel p-6 rounded-2xl border-2 border-green-300">
              <h3 className="text-lg font-black text-white text-center mb-4">🎯 Choice A Stations</h3>
              <p className="text-xs text-white/60 text-center mb-4">Students choose their station. Rotate every 5 minutes.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STATIONS.map(st => (
                  <div key={st.name} className="p-4 rounded-2xl bg-white/5 border border-white/15">
                    <div className="text-center mb-3">
                      <span className="text-4xl">{st.emoji}</span>
                      <p className="text-sm font-black text-white mt-1">{st.name}</p>
                    </div>
                    <p className="text-xs text-white/60 mb-2">{st.desc}</p>
                    <div className="space-y-1">
                      {st.phrases.map(ph => (
                        <p key={ph} className="text-xs text-emerald-300 font-bold">💬 "{ph}"</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-center">
                <p className="text-sm font-bold text-white">🙋 "Can I try {STATIONS[0].name}?" / 「やってみてもいい？」</p>
              </div>
            </div>
          </div>
        )}

        {/* COOL-DOWN */}
        {activePhase === "cooldown" && (
          <div className="space-y-4">
        <div className="pe-lesson-panel p-6 rounded-2xl border-2 border-purple-300">
              <h3 className="text-lg font-black text-white text-center mb-4">🧘 Cool-Down & Review</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stretches */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Stretch Commands:</p>
                  <div className="space-y-2">
                    {[
                      "Reach both hands up to the ceiling",
                      "Roll shoulders forward 1,2,3",
                      "Touch your toes... 10,9,8...",
                      "Butterfly stretch - bounce knees",
                      "Cross right arm, pull with left",
                      "Step back, stretch calf",
                    ].map(s => (
                      <div key={s} className="flex items-start gap-2">
                        <span className="text-purple-300 text-xs mt-0.5">▸</span>
                        <p className="text-sm text-white">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Review questions */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Review Questions:</p>
                  <div className="space-y-2">
                    {[
                      "Show me the action for 'hop'!",
                      "Touch: Elbow! Ankle! Waist!",
                      "Who can tell me one verb we used?",
                      "Repeat: 'Great job today, team!'",
                      "Give your partner a high-five!",
                      "What was fun today?",
                    ].map(q => (
                      <div key={q} className="flex items-start gap-2">
                        <span className="text-emerald-300 text-xs mt-0.5">💡</span>
                        <p className="text-sm text-white">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== PE Flashcards (always visible) ===== */}
      <div className="w-full max-w-6xl">
        <div className="pe-lesson-panel p-4 rounded-2xl border-2 border-slate-300">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4" />
              PE Flashcards (20 cards — tap to flip)
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowJapanese(!showJapanese)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                  showJapanese ? "classroom-control-button-active" : "classroom-control-button"
                )}
              >
                日本語 {showJapanese ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => { drawRandomCard(); openPopup("random-card"); }}
                className="classroom-control-button flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
                title="Draw a random flashcard"
              >
                <Shuffle className="h-3 w-3" /> Random Card
              </button>
              <button
                onClick={() => { setPopupFlippedCard(null); openPopup("flashcards"); }}
                className="classroom-control-button flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
              >
                <Maximize2 className="h-3 w-3" /> Pop Up
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {PE_FLASHCARDS.map(card => (
              <button
                key={card.id}
                onClick={() => { setFlippedCard(flippedCard === card.id ? null : card.id); sound.playClick(); }}
                className={cn(
                  "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center p-2 text-center",
                  flippedCard === card.id
                    ? "bg-slate-800 border-white scale-105 shadow-lg"
                    : cn("border-white/20 hover:scale-105 hover:border-white/50", card.color)
                )}
              >
                {flippedCard === card.id ? (
                  <div className="w-full rounded-lg bg-white p-2 text-slate-950">
                    <p className="text-sm font-bold whitespace-pre-line leading-snug">{card.back}</p>
                  </div>
                ) : (
                  <div className="w-full rounded-lg bg-white p-2 text-slate-950">
                    <p className="text-xs font-bold uppercase mb-1">{card.set}</p>
                    <p className="text-base font-black leading-snug">{card.front}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PE Dice ===== */}
      <div className="w-full max-w-6xl">
        <div className="pe-lesson-panel p-4 rounded-2xl border-2 border-slate-300">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Dice5 className="h-4 w-4" />
              PE Activity Dice
            </h3>
            <button
              onClick={() => openPopup("dice")}
              className="classroom-control-button flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all"
            >
              <Maximize2 className="h-3 w-3" /> Pop Up
            </button>
          </div>
          {/* Category selector */}
          <div className="flex flex-wrap gap-2 mb-3 justify-center">
            {(Object.keys(PE_DICE_PRESETS) as Array<keyof typeof PE_DICE_PRESETS>).map(cat => (
              <button
                key={cat}
                onClick={() => { setDiceCategory(cat); setDiceResult(null); sound.playClick(); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize",
                  diceCategory === cat
                    ? "bg-white text-slate-900 border-white scale-105 shadow"
                    : "classroom-control-button"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Dice display */}
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "h-44 w-full max-w-64 rounded-2xl bg-gradient-to-br from-white to-slate-100 flex flex-col items-center justify-center shadow-2xl border-4 border-white gap-1 p-2",
              diceRolling && "animate-[diceTumble_0.3s_linear_infinite]"
            )}>
              <DiceVisual option={diceResult} />
            </div>
            <Button
              onClick={rollDice}
              disabled={diceRolling}
              size="lg"
              className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 font-bold"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              {diceRolling ? "Rolling..." : "Roll Dice"}
            </Button>
          </div>
        </div>
      </div>

      {/* Teacher tips */}
      <div className="w-full max-w-6xl rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-xl shadow-black/20">
        <p className="mb-3 text-sm font-black uppercase tracking-wider text-amber-900">💡 Teacher Tips</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-white p-3 text-sm font-semibold leading-snug text-slate-900 shadow-sm">
            <b className="block text-base font-black text-slate-950">✅ Demonstrate first</b>
            Model the movement visually while speaking English.
          </div>
          <div className="rounded-xl border border-amber-200 bg-white p-3 text-sm font-semibold leading-snug text-slate-900 shadow-sm">
            <b className="block text-base font-black text-slate-950">✅ Whistle & gesture</b>
            1 whistle = "Freeze & Listen".
          </div>
          <div className="rounded-xl border border-amber-200 bg-white p-3 text-sm font-semibold leading-snug text-slate-900 shadow-sm">
            <b className="block text-base font-black text-slate-950">✅ Peer assistance</b>
            Pair stronger English speakers with quieter students.
          </div>
        </div>
      </div>

      <ConfettiOverlay pieces={confetti} />
      <FlashOverlay flash={flash} />
      <ShakeWrapper intensity={shakeIntensity} />

      {/* ===== Fullscreen Popup Modal — content rendered dynamically so state changes work ===== */}
      {popupType && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center gap-2 p-3 sm:p-4"
          onClick={closePopup}
        >
          <button
            onClick={closePopup}
            className="self-end shrink-0 w-12 h-12 rounded-full bg-white hover:bg-cyan-100 text-slate-950 flex items-center justify-center transition-all"
            title="Close (Esc)"
            aria-label="Close popup"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="w-full min-h-0 flex-1 max-w-6xl overflow-y-auto overscroll-contain p-3 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== SIMON SAYS POPUP ===== */}
            {popupType === "simon" && (
              <div className="w-full max-w-2xl mx-auto">
                <h2 className="text-4xl font-black text-white text-center mb-8">🙋 Simon Says</h2>
                <div className="min-h-[200px] flex items-center justify-center mb-6">
                  {simonCommand ? (
                    <div className={cn(
                      "p-8 rounded-2xl border-4 max-w-lg",
                      simonIsTrick ? "bg-red-500/20 border-red-400/50" : "bg-blue-500/20 border-blue-400/50"
                    )}>
                      <p className={cn("text-4xl font-black text-center", simonIsTrick ? "text-red-300" : "text-white")}>
                        {simonIsTrick ? "⚠️ " : "✅ Simon says: "}{simonCommand}
                      </p>
                      {simonIsTrick && <p className="text-lg font-semibold text-white mt-3 text-center">Trick! No "Simon says" — don't move!</p>}
                    </div>
                  ) : (
                    <p className="text-white/50 text-xl">Click "Draw Command" to get a random instruction</p>
                  )}
                </div>
                <div className="flex justify-center">
                  <Button onClick={drawSimonCommand} size="lg" className="rounded-full px-10 bg-white text-slate-900 hover:bg-white/90 font-bold text-xl">
                    <Shuffle className="mr-2 h-6 w-6" /> Draw Command
                  </Button>
                </div>
              </div>
            )}

            {/* ===== BODY PARTS POPUP ===== */}
            {popupType === "body-parts" && (
              <div className="w-full">
                <h2 className="text-3xl font-black text-white text-center mb-6">Body Parts 🧠💪🦵</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {BODY_PARTS.map(bp => (
                    <div key={bp.en} className="rounded-2xl border border-white/20 bg-white/10 p-3">
                      <BodyPartVisual part={bp} />
                      <div className="mt-2 text-center">
                        <p className="text-2xl font-black text-white">{bp.en}</p>
                        <p className="text-base font-bold text-white/70">{bp.jp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== TRAFFIC LIGHTS POPUP ===== */}
            {popupType === "traffic" && (
              <div className="w-full">
                <h2 className="text-4xl font-black text-white text-center mb-8">🚦 Red Light, Green Light Plus</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {TRAFFIC_LIGHTS.map(light => (
                    <button
                      key={light.color}
                      onClick={() => handleLight(light.color)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-8 rounded-3xl border-4 transition-all",
                        activeLight === light.color
                          ? cn("border-white scale-105 shadow-2xl", light.bg)
                          : cn("border-white/20 hover:scale-105", light.bg)
                      )}
                    >
                      <span className="text-7xl">{light.emoji}</span>
                      <div className="w-full rounded-lg bg-white p-3 text-center text-slate-950">
                        <p className="text-xl font-black uppercase">{light.action}</p>
                        {showJapanese && <p className="mt-1 text-base font-semibold">{light.jp}</p>}
                        <p className="mt-1 text-base font-semibold">{light.katakana}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== FRUIT SALAD POPUP ===== */}
            {popupType === "fruit-salad" && (
              <div className="w-full max-w-3xl mx-auto">
                <h2 className="text-4xl font-black text-white text-center mb-8">🍎 Fruit Salad Tag</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { name: "Apples", emoji: "🍎", color: "bg-red-500" },
                    { name: "Bananas", emoji: "🍌", color: "bg-yellow-500" },
                    { name: "Oranges", emoji: "🍊", color: "bg-orange-500" },
                    { name: "Grapes", emoji: "🍇", color: "bg-purple-500" },
                  ].map(team => (
                    <button
                      key={team.name}
                      onClick={() => { sound.playClick(); flashFn("rgba(255,255,255,0.3)"); }}
                      className={cn("flex flex-col items-center gap-3 p-8 rounded-3xl text-white font-black shadow-lg hover:scale-105 transition-all", team.color)}
                    >
                      <span className="text-8xl">{team.emoji}</span>
                      <span className="w-full rounded-lg bg-white px-2 py-1 text-2xl text-slate-950">{team.name}!</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { sound.playReveal(); flashFn("rgba(255,0,128,0.5)"); burstConfetti(100, 50, 40); shake(3); }}
                  className="w-full p-8 rounded-3xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white font-black text-4xl shadow-2xl hover:scale-[1.02] transition-all"
                >
                  🥗 FRUIT SALAD! (Everyone runs!)
                </button>
              </div>
            )}

            {/* ===== FLASHCARDS POPUP — dynamically rendered, flipping works! ===== */}
            {popupType === "flashcards" && (
              <div className="w-full max-w-5xl mx-auto">
                <h2 className="text-3xl font-black text-white text-center mb-6">PE Flashcards 📇</h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {PE_FLASHCARDS.map(card => (
                    <button
                      key={card.id}
                      onClick={() => { setPopupFlippedCard(popupFlippedCard === card.id ? null : card.id); sound.playClick(); }}
                      className={cn(
                        "aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center p-3 text-center",
                        popupFlippedCard === card.id
                          ? "bg-slate-800 border-white scale-105 shadow-lg"
                          : cn("border-white/20 hover:scale-105 hover:border-white/50", card.color)
                      )}
                    >
                      {popupFlippedCard === card.id ? (
                        <div className="w-full rounded-lg bg-white p-2 text-slate-950">
                          <p className="text-sm font-bold whitespace-pre-line leading-tight">{card.back}</p>
                        </div>
                      ) : (
                        <div className="w-full rounded-lg bg-white p-2 text-slate-950">
                          <p className="text-xs font-bold uppercase mb-1">{card.set}</p>
                          <p className="text-base font-black leading-tight">{card.front}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== RANDOM CARD POPUP ===== */}
            {popupType === "random-card" && randomCard && (
              <div className="w-full max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <h2 className="text-3xl font-black text-white text-center">Random PE Flashcard</h2>
                  <button
                    onClick={drawRandomCard}
                    className="classroom-control-button flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all"
                  >
                    <Shuffle className="h-4 w-4" /> Draw Again
                  </button>
                </div>
                <button
                  onClick={() => { setPopupFlippedCard(popupFlippedCard === randomCard.id ? null : randomCard.id); sound.playClick(); }}
                  className={cn(
                    "mx-auto aspect-[3/4] w-full max-w-sm rounded-3xl overflow-hidden border-4 transition-all flex flex-col items-center justify-center p-8 text-center shadow-2xl",
                    popupFlippedCard === randomCard.id
                      ? "bg-slate-800 border-white"
                      : cn("border-white/30 hover:scale-[1.02] hover:border-white/70", randomCard.color)
                  )}
                >
                  {popupFlippedCard === randomCard.id ? (
                    <div className="w-full rounded-lg bg-white p-3 text-slate-950">
                      <p className="text-3xl font-black whitespace-pre-line leading-tight">{randomCard.back}</p>
                    </div>
                  ) : (
                    <div className="w-full rounded-lg bg-white p-3 text-slate-950">
                      <p className="text-base font-bold uppercase mb-4">{randomCard.set}</p>
                      <p className="text-5xl font-black leading-tight">{randomCard.front}</p>
                      <p className="text-base font-semibold mt-6">Tap to flip</p>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* ===== DICE POPUP — dynamically rendered, rolling works! ===== */}
            {popupType === "dice" && (
              <div className="w-full max-w-2xl mx-auto">
                <h2 className="text-3xl font-black text-white text-center mb-6">🎲 PE Activity Dice</h2>
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  {(Object.keys(PE_DICE_PRESETS) as Array<keyof typeof PE_DICE_PRESETS>).map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setDiceCategory(cat); setDiceResult(null); sound.playClick(); }}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold border transition-all capitalize",
                        diceCategory === cat
                          ? "bg-white text-slate-900 border-white scale-105 shadow"
                          : "classroom-control-button"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col items-center gap-8">
                  <div className={cn(
                    "h-[min(72vh,34rem)] w-full max-w-[34rem] rounded-[2rem] bg-gradient-to-br from-white to-slate-100 flex flex-col items-center justify-center shadow-2xl border-8 border-white gap-4 p-4",
                    diceRolling && "animate-[diceTumble_0.3s_linear_infinite]"
                  )}>
                    <DiceVisual option={diceResult} large />
                  </div>
                  <Button
                    onClick={rollDice}
                    disabled={diceRolling}
                    size="lg"
                    className="rounded-full px-12 py-4 bg-white text-slate-900 hover:bg-white/90 font-bold text-2xl shadow-lg"
                  >
                    <Play className="mr-2 h-7 w-7 fill-current" />
                    {diceRolling ? "Rolling..." : "Roll Dice"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

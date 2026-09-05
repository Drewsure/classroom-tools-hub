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
  "Touch your left ear", "Touch your right knee", "Reach for the sky", "Clap your hands 3 times",
  "Stand on one leg", "Spin around once", "Touch your nose", "Jump twice",
  // Round 2: Dynamic Actions
  "Run in place!", "Hop like a frog", "March like a soldier", "Swim in the air",
  "Freeze!", "Flap your arms like a bird", "Do 3 jumping jacks", "Stomp your feet",
  "Sit down!", "Strike a superhero pose",
  // Round 3: Spatial
  "Take 2 steps forward", "Take 1 giant leap backward", "Touch the floor with your left hand",
  "Whisper your name", "Shout 'English!'", "Cross your arms", "Sit down quietly",
  "Touch your toes", "Roll your shoulders", "Reach up high", "Make a big circle",
];

// Trick commands (no "Simon says" prefix)
const SIMON_TRICKS = [
  "Touch your nose!", "Jump twice!", "Freeze!", "Sit down!", "Shout 'English'!",
];

// ===== PE Flashcards (20 cards) =====
const PE_FLASHCARDS = [
  // SET 1: Signal Lights
  { id: "green",  set: "Signal Lights", front: "🟢 GREEN LIGHT",  back: "RUN / WALK FORWARD\n走る (はしる)\nラン", color: "bg-green-500" },
  { id: "red",    set: "Signal Lights", front: "🔴 RED LIGHT",    back: "FREEZE!\n止まる (とまる)\nフリーズ", color: "bg-red-500" },
  { id: "yellow", set: "Signal Lights", front: "🟡 YELLOW LIGHT", back: "SLOW MOTION\nゆっくり歩く\nスローモーション", color: "bg-yellow-500" },
  { id: "purple", set: "Signal Lights", front: "🟣 PURPLE LIGHT", back: "HOP LIKE A FROG\nカエルのように跳ぶ\nホップ", color: "bg-purple-500" },
  { id: "orange", set: "Signal Lights", front: "🟠 ORANGE LIGHT", back: "CRAB WALK\nカニ歩き\nクラブ ウォーク", color: "bg-orange-500" },
  { id: "blue",   set: "Signal Lights", front: "🔵 BLUE LIGHT",   back: "FLY LIKE A BIRD\n鳥のように飛ぶ\nフライ", color: "bg-blue-500" },
  { id: "pink",   set: "Signal Lights", front: "🩷 PINK LIGHT",   back: "KANGAROO JUMP\nカンガルージャンプ\nジャンプ", color: "bg-pink-500" },
  // SET 2: Stations
  { id: "toss",   set: "Stations", front: "🎯 TARGET TOSS",     back: "I choose Target Toss!\n的当て (まとあて)", color: "bg-emerald-600" },
  { id: "rope",   set: "Stations", front: "🪢 JUMP ROPE",       back: "I choose Jump Rope!\n縄跳び (なわとび)", color: "bg-cyan-600" },
  { id: "agility",set: "Stations", front: "🏃 AGILITY COURSE",  back: "I choose Agility Course!\nアジリティコース", color: "bg-teal-600" },
  // SET 3: Game Words
  { id: "apple",  set: "Game Words", front: "🍎 Apples",        back: "りんご\nアップルズ", color: "bg-red-400" },
  { id: "banana", set: "Game Words", front: "🍌 Bananas",       back: "バナナ", color: "bg-yellow-400" },
  { id: "orange", set: "Game Words", front: "🍊 Oranges",       back: "みかん・オレンジ", color: "bg-orange-400" },
  { id: "salad",  set: "Game Words", front: "🥗 Fruit Salad!",  back: "フルーツサラダ！\nEveryone runs!", color: "bg-green-400" },
  { id: "help",   set: "Game Words", front: "🆘 Help me, please!", back: "助けて！(たすけて)", color: "bg-red-500" },
  { id: "free",   set: "Game Words", front: "🆓 You're free!",  back: "自由だよ！(じゆうだよ)", color: "bg-green-500" },
  { id: "choose", set: "Game Words", front: "🙋 I choose...",   back: "えらびます", color: "bg-blue-400" },
  { id: "turn",   set: "Game Words", front: "👉 My turn!",      back: "私の番！(わたしのばん)", color: "bg-purple-400" },
  { id: "reach",  set: "Game Words", front: "🙆 Reach up",      back: "上に伸びる (うえにのびる)", color: "bg-indigo-400" },
  { id: "what",   set: "Game Words", front: "💭 What did we do?", back: "何をした？(なにをした)", color: "bg-slate-500" },
];

// ===== PE Dice Presets =====
const PE_DICE_PRESETS: Record<string, { text: string; emoji: string }[]> = {
  movements: [
    { text: "Jump",  emoji: "🤸" },
    { text: "Hop",   emoji: "🦘" },
    { text: "Spin",  emoji: "🌀" },
    { text: "Clap",  emoji: "👏" },
    { text: "Stomp", emoji: "🦶" },
    { text: "March", emoji: "🥁" },
  ],
  bodyParts: [
    { text: "Head",      emoji: "🧠" },
    { text: "Shoulders", emoji: "💪" },
    { text: "Knees",     emoji: "🦵" },
    { text: "Toes",      emoji: "🦶" },
    { text: "Elbows",    emoji: "💪" },
    { text: "Ankles",    emoji: "🦶" },
  ],
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
  { name: "AGILITY COURSE", emoji: "🏃", phrases: ["Walk carefully", "Step over", "High knees!"], desc: "Balance beam + agility ladder. Don't touch lines!" },
];

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
  const [diceResult, setDiceResult] = useState<{ text: string; emoji: string } | null>(null);
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
    const card = PE_FLASHCARDS[Math.floor(Math.random() * PE_FLASHCARDS.length)];
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
                ? cn("bg-gradient-to-r text-white border-white scale-105 shadow-lg", p.color)
                : "bg-white/10 text-white border-white/25 hover:bg-white/20"
            )}
          >
            <span className="text-lg">{p.emoji}</span>
            <div className="text-left">
              <p className="text-xs leading-tight">{idx + 1}. {p.name.split(":")[0]}</p>
              <p className="text-[10px] opacity-70 leading-tight">{p.minutes} min</p>
            </div>
          </button>
        ))}
      </div>

      {/* Current phase info + Timer */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row gap-3 items-stretch">
        {/* Phase description */}
        <div className={cn("flex-1 p-4 rounded-2xl bg-gradient-to-r text-white shadow-lg", currentPhase.color)}>
          <p className="text-sm font-bold flex items-center gap-2">
            <span className="text-2xl">{currentPhase.emoji}</span>
            {currentPhase.name}
          </p>
          <p className="text-xs text-white/80 mt-1">{currentPhase.desc}</p>
        </div>

        {/* Timer */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/15 shadow-lg flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Timer</p>
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
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                timerRunning ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-white text-slate-900 hover:scale-105"
              )}
            >
              {timerRunning ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            <button
              onClick={() => { setTimerRemaining(timerSeconds); setTimerRunning(false); sound.playClick(); }}
              className="w-12 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Phase Content ===== */}
      <div className="w-full max-w-6xl">
        {/* WARM-UP: Simon Says */}
        {activePhase === "warmup" && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-400/30 text-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">🙋 Simon Says Command Generator</h3>
                <button
                  onClick={() => openPopup("simon")}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
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
                      <p className="text-sm text-red-300/70 mt-2">Trick! No "Simon says" — don't move!</p>
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
              <p className="text-xs text-white/40 mt-3">
                {SIMON_COMMANDS.length - usedSimonCommands.size} of {SIMON_COMMANDS.length} commands remaining
              </p>
            </div>

            {/* Quick body part reference — popup flashcards */}
            <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Body Parts Quick Reference:</p>
                <button
                  onClick={() => openPopup("body-parts")}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  <Maximize2 className="h-3 w-3" /> Pop Up
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center">
                {["Head 🧠", "Shoulders 💪", "Knees 🦵", "Toes 🦶", "Elbows 💪", "Ankles 🦶", "Nose 👃", "Ears 👂", "Eyes 👀", "Mouth 👄", "Hands ✋", "Feet 🦶"].map(bp => (
                  <div key={bp} className="px-2 py-2 rounded-lg bg-white/5 text-white text-xs font-bold">{bp}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DRILL: Red Light Green Light */}
        {activePhase === "drill" && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-400/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">🚦 Red Light, Green Light Plus</h3>
                <button
                  onClick={() => openPopup("traffic")}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
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
                        : cn("border-white/20 hover:scale-105 hover:border-white/50", light.bg, "opacity-70 hover:opacity-100")
                    )}
                  >
                    <span className="text-4xl sm:text-5xl">{light.emoji}</span>
                    <div className="text-center">
                      <p className="text-xs font-black text-white uppercase tracking-wide">{light.action}</p>
                      {showJapanese && (
                        <p className="text-[10px] text-white/80 mt-1">{light.jp}</p>
                      )}
                      <p className="text-[9px] text-white/60 mt-0.5">{light.katakana}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setShowJapanese(!showJapanese)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                    showJapanese ? "bg-white/20 text-white border-white/40" : "bg-white/10 text-white/50 border-white/20"
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
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-400/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white">🍎 Fruit Salad Tag</h3>
                <button
                  onClick={() => openPopup("fruit-salad")}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
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
                    <span className="text-lg">{team.name}!</span>
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
                  <p className="text-sm font-bold text-white">🆘 Help me, please!</p>
                  <p className="text-xs text-white/60">助けて！(たすけて)</p>
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
            <div className="p-6 rounded-2xl bg-green-500/10 border border-green-400/30">
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
                <p className="text-sm font-bold text-white">🙋 "I choose... {STATIONS[0].name}!" / 「えらびます」</p>
              </div>
            </div>
          </div>
        )}

        {/* COOL-DOWN */}
        {activePhase === "cooldown" && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-400/30">
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
                      "What did we do today?",
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
        <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4" />
              PE Flashcards (20 cards — tap to flip)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJapanese(!showJapanese)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                  showJapanese ? "bg-white/20 text-white border-white/40" : "bg-white/10 text-white/50 border-white/20"
                )}
              >
                日本語 {showJapanese ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => { drawRandomCard(); openPopup("random-card"); }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 border border-purple-400/40 text-xs font-bold transition-all"
                title="Draw a random flashcard"
              >
                <Shuffle className="h-3 w-3" /> Random Card
              </button>
              <button
                onClick={() => { setPopupFlippedCard(null); openPopup("flashcards"); }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                <Maximize2 className="h-3 w-3" /> Pop Up
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
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
                  <div className="text-white">
                    <p className="text-[10px] font-bold whitespace-pre-line leading-tight">{card.back}</p>
                  </div>
                ) : (
                  <div className="text-white">
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-1">{card.set}</p>
                    <p className="text-xs font-black leading-tight">{card.front}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PE Dice ===== */}
      <div className="w-full max-w-6xl">
        <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Dice5 className="h-4 w-4" />
              PE Activity Dice
            </h3>
            <button
              onClick={() => openPopup("dice")}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              <Maximize2 className="h-3 w-3" /> Pop Up
            </button>
          </div>
          {/* Category selector */}
          <div className="flex flex-wrap gap-2 mb-3 justify-center">
            {(Object.keys(PE_DICE_PRESETS) as Array<keyof typeof PE_DICE_PRESETS>).map(cat => (
              <button
                key={cat}
                onClick={() => { setDiceCategory(cat); setDiceResult(""); sound.playClick(); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize",
                  diceCategory === cat
                    ? "bg-white text-slate-900 border-white scale-105 shadow"
                    : "bg-white/10 text-white border-white/25 hover:bg-white/20"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Dice display */}
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-32 h-32 rounded-2xl bg-gradient-to-br from-white to-slate-100 flex flex-col items-center justify-center shadow-2xl border-4 border-white gap-1",
              diceRolling && "animate-[diceTumble_0.3s_linear_infinite]"
            )}>
              {diceResult ? (
                <>
                  <span className="text-4xl">{diceResult.emoji}</span>
                  <span className="text-sm font-black text-slate-800 text-center px-2 leading-tight">{diceResult.text}</span>
                </>
              ) : (
                <span className="text-xl font-black text-slate-800">?</span>
              )}
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
      <div className="w-full max-w-6xl p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30">
        <p className="text-xs font-bold text-amber-200 uppercase tracking-wider mb-2">💡 Teacher Tips:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/70">
          <div>✅ <b>Demonstrate first</b> — model the movement visually while speaking English</div>
          <div>✅ <b>Whistle & gesture</b> — 1 whistle = "Freeze & Listen"</div>
          <div>✅ <b>Peer assistance</b> — pair stronger English speakers with quieter students</div>
        </div>
      </div>

      <ConfettiOverlay pieces={confetti} />
      <FlashOverlay flash={flash} />
      <ShakeWrapper intensity={shakeIntensity} />

      {/* ===== Fullscreen Popup Modal — content rendered dynamically so state changes work ===== */}
      {popupType && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePopup}
        >
          <button
            onClick={closePopup}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
            title="Close (Esc)"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="w-full h-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
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
                      {simonIsTrick && <p className="text-lg text-red-300/70 mt-3 text-center">Trick! No "Simon says" — don't move!</p>}
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
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  {[
                    { en: "Head", jp: "あたま", emoji: "🧠" },
                    { en: "Shoulders", jp: "かた", emoji: "💪" },
                    { en: "Knees", jp: "ひざ", emoji: "🦵" },
                    { en: "Toes", jp: "つまさき", emoji: "🦶" },
                    { en: "Elbows", jp: "ひじ", emoji: "💪" },
                    { en: "Ankles", jp: "あしくび", emoji: "🦶" },
                    { en: "Nose", jp: "はな", emoji: "👃" },
                    { en: "Ears", jp: "みみ", emoji: "👂" },
                    { en: "Eyes", jp: "め", emoji: "👀" },
                    { en: "Mouth", jp: "くち", emoji: "👄" },
                    { en: "Hands", jp: "て", emoji: "✋" },
                    { en: "Feet", jp: "あし", emoji: "🦶" },
                  ].map(bp => (
                    <div key={bp.en} className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/10 border border-white/20">
                      <span className="text-6xl">{bp.emoji}</span>
                      <p className="text-2xl font-black text-white">{bp.en}</p>
                      <p className="text-lg text-white/60">{bp.jp}</p>
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
                          : cn("border-white/20 hover:scale-105", light.bg, "opacity-80 hover:opacity-100")
                      )}
                    >
                      <span className="text-7xl">{light.emoji}</span>
                      <div className="text-center">
                        <p className="text-xl font-black text-white uppercase">{light.action}</p>
                        {showJapanese && <p className="text-sm text-white/80 mt-1">{light.jp}</p>}
                        <p className="text-xs text-white/60 mt-0.5">{light.katakana}</p>
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
                      <span className="text-3xl">{team.name}!</span>
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
                        <div className="text-white">
                          <p className="text-sm font-bold whitespace-pre-line leading-tight">{card.back}</p>
                        </div>
                      ) : (
                        <div className="text-white">
                          <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-1">{card.set}</p>
                          <p className="text-base font-black leading-tight">{card.front}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
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
                      onClick={() => { setDiceCategory(cat); setDiceResult(""); sound.playClick(); }}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold border transition-all capitalize",
                        diceCategory === cat
                          ? "bg-white text-slate-900 border-white scale-105 shadow"
                          : "bg-white/10 text-white border-white/25 hover:bg-white/20"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col items-center gap-8">
                  <div className={cn(
                    "w-80 h-80 sm:w-96 sm:h-96 rounded-[2rem] bg-gradient-to-br from-white to-slate-100 flex flex-col items-center justify-center shadow-2xl border-8 border-white gap-4",
                    diceRolling && "animate-[diceTumble_0.3s_linear_infinite]"
                  )}>
                    {diceResult ? (
                      <>
                        <span className="text-[8rem] sm:text-[10rem] leading-none">{diceResult.emoji}</span>
                        <span className="text-4xl sm:text-5xl font-black text-slate-800 text-center px-4 leading-tight">{diceResult.text}</span>
                      </>
                    ) : (
                      <span className="text-8xl font-black text-slate-800">?</span>
                    )}
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

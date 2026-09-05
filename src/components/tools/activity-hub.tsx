"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTimer } from "@/hooks/use-timer";
import { useTimerAudio } from "@/hooks/use-timer-audio";
import {
  useDramaticSound,
  useConfetti,
  useFlash,
  useScreenShake,
} from "@/hooks/use-effects";
import {
  ConfettiOverlay,
  FlashOverlay,
  ShakeWrapper,
} from "@/components/effects/effect-overlays";
import {
  SKINS,
  SkinPicker,
  SkinParticleField,
  SkinSceneDecorator,
  useSavedSkin,
} from "@/lib/skins";
import { formatTime } from "@/lib/timers";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Check,
  X,
  Dices,
  Clock,
  Hash,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   TIMER PRESETS for the Activity Hub
   ============================================================ */
const TIMER_PRESETS: { label: string; seconds: number }[] = [
  { label: "15s", seconds: 15 },
  { label: "30s", seconds: 30 },
  { label: "45s", seconds: 45 },
  { label: "1m", seconds: 60 },
  { label: "1:30", seconds: 90 },
  { label: "2m", seconds: 120 },
  { label: "2:30", seconds: 150 },
  { label: "3m", seconds: 180 },
  { label: "5m", seconds: 300 },
  { label: "10m", seconds: 600 },
  { label: "15m", seconds: 900 },
];

/* ============================================================
   DICE PRESETS
   ============================================================ */
const DICE_PRESETS = [6, 8, 10, 20, 25, 100];

/* ============================================================
   TALLY TEAM COLORS
   ============================================================ */
const TEAM_COLORS = [
  "from-emerald-500 to-green-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-lime-500 to-teal-600",
];

interface Team {
  id: number;
  label: string;
  value: number;
  colorIdx: number;
}

/* ============================================================
   SNAIL RACE — colorful racing snails for the Activity Hub timer
   ============================================================ */
const RACE_SNAILS = [
  { id: 0, name: "Turbo",   hue: 0,   emoji: "🐌" },
  { id: 1, name: "Lightning", hue: 120, emoji: "🐌" },
  { id: 2, name: "Speedy",  hue: 240, emoji: "🐌" },
];

/* ============================================================
   ACTIVITY HUB — Timer + Dice + Tally + Future Tool
   ============================================================ */
export function ActivityHub() {
  const { skinId, setSkinId } = useSavedSkin("activity-hub");
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Header */}
      <div className="w-full max-w-6xl text-center px-6 py-3 rounded-2xl glass-dark border border-white/10">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          Activity Hub
        </h2>
        <p className="text-xs text-white/60 mt-1">
          Timer · Dice · Tally — all on one screen, no swapping
        </p>
      </div>

      {/* Skin picker */}
      <SkinPicker
        current={skinId}
        onChange={setSkinId}
        timerKey="activity-hub"
      />

      {/* 2×2 grid of panels */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimerPanel skin={skin} />
        <DicePanel skin={skin} />
        <TallyPanel skin={skin} />
        <FutureToolPanel />
      </div>
    </div>
  );
}

/* ============================================================
   TIMER PANEL — HH:MM:SS + presets + Start inside the display
   ============================================================ */
function TimerPanel({ skin }: { skin: (typeof SKINS)[number] }) {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);

  const totalInput = hours * 3600 + minutes * 60 + seconds;
  const timer = useTimer(totalInput);

  useTimerAudio(
    "classic",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    useCallback(() => {
      burstConfetti(120, 50, 40);
      flashFn(skin.flashColor);
      shake(2);
    }, [burstConfetti, flashFn, skin.flashColor, shake]),
  );

  const handlePreset = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    setHours(h);
    setMinutes(m);
    setSeconds(sec);
    timer.setTime(s);
    sound.playClick();
  };

  const handleStart = () => {
    if (totalInput <= 0) return;
    timer.start(totalInput);
    sound.playClick();
  };

  const handleReset = () => {
    timer.reset(totalInput);
    sound.playClick();
  };

  const { display } = formatTime(timer.remaining);
  const lowTime = timer.remaining <= 10 && timer.remaining > 0;
  const veryLow = timer.remaining <= 5 && timer.remaining > 0;
  const isFinished = timer.isCompleted;
  const isEditable = timer.isIdle;

  return (
    <section
      className="relative overflow-hidden rounded-3xl glass-dark p-5 sm:p-6 shadow-xl border border-white/10"
      aria-label="Timer panel"
    >
      <PanelHeader icon={<Clock className="h-4 w-4" />} label="Timer" accent="text-cyan-300" />

      <ShakeWrapper intensity={shakeIntensity}>
        <div
          className={cn(
            "relative mt-3 rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br p-5 flex flex-col items-center justify-center gap-3",
            skin.bgGradient,
            veryLow && "border-red-500/80 animate-[strobeUrgent_0.4s_ease-in-out_infinite]",
            isFinished && "border-white/80",
          )}
          style={{ minHeight: "260px" }}
        >
          <SkinParticleField skin={skin} seed={3} />
          <SkinSceneDecorator skin={skin} />

          {/* ===== Snail Race Track ===== */}
          <div className="relative z-10 w-full">
            {/* Timer display (compact, at top) */}
            <div className="text-center mb-2">
              {isFinished ? (
                <>
                  <div className="text-5xl mb-1 animate-bounce">🏆</div>
                  <p
                    className="text-xl font-black drop-shadow-[0_0_20px_currentColor]"
                    style={{ color: skin.accent }}
                  >
                    {skin.completionMessage}
                  </p>
                </>
              ) : (
                <div
                  className={cn(
                    "font-mono font-black tabular-nums text-white drop-shadow-2xl transition-all",
                    "text-4xl sm:text-5xl",
                    lowTime && "text-red-300",
                    veryLow && "animate-[dramaticPulse_0.5s_ease-in-out_infinite] text-red-400",
                  )}
                >
                  {display}
                </div>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                {timer.isRunning
                  ? veryLow ? "⚡ HURRY! ⚡" : "Racing..."
                  : timer.isPaused
                    ? "Paused"
                    : timer.isCompleted
                      ? "Done!"
                      : "Ready"}
              </p>
            </div>

            {/* Snail race track — 3 colorful snails racing across */}
            <div className="relative w-full h-32 sm:h-36 rounded-xl bg-black/20 border border-white/10 overflow-hidden">
              {/* Finish line (right side) */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-300 via-white to-yellow-300 opacity-80" />
              <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-around">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-yellow-300/60" />
                ))}
              </div>
              <div className="absolute right-6 top-1 text-lg">🏁</div>

              {/* Three snails with different colors */}
              {RACE_SNAILS.map((snail, idx) => {
                // Each snail progresses at slightly different speed for visual interest
                const baseProgress = isFinished ? 100 : (1 - timer.remaining / Math.max(totalInput, 1)) * 100;
                const snailOffset = idx === 0 ? 0 : idx === 1 ? -3 : 2; // slight variation
                const progress = Math.max(0, Math.min(95, baseProgress + snailOffset));
                return (
                  <div
                    key={snail.id}
                    className="absolute left-0 transition-all duration-1000 ease-linear"
                    style={{
                      top: `${15 + idx * 28}%`,
                      left: `${progress}%`,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-2xl sm:text-3xl drop-shadow-lg" style={{ filter: `hue-rotate(${snail.hue}deg)` }}>🐌</span>
                      <span className="text-[9px] font-bold text-white/80 hidden sm:inline">{snail.name}</span>
                    </div>
                  </div>
                );
              })}

              {/* Winner banner when finished */}
              {isFinished && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <p className="text-2xl font-black text-yellow-300 drop-shadow-lg animate-bounce">
                    🏆 {RACE_SNAILS[0].name} Wins! 🎉
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Start/Pause/Resume/Reset button INSIDE the display area */}
          <div className="relative z-10">
            {isEditable && (
              <Button
                onClick={handleStart}
                className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Start Race!
              </Button>
            )}
            {timer.isRunning && (
              <Button
                onClick={timer.pause}
                className="rounded-full px-6 bg-amber-500 hover:bg-amber-600 text-white shadow-lg font-bold"
                size="lg"
              >
                <Pause className="mr-2 h-4 w-4 fill-current" />
                Pause
              </Button>
            )}
            {timer.isPaused && (
              <Button
                onClick={timer.resume}
                className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Resume
              </Button>
            )}
            {isFinished && (
              <Button
                onClick={handleReset}
                className="rounded-full px-6 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg font-bold"
                size="lg"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Race Again
              </Button>
            )}
          </div>

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Presets */}
      {isEditable && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">
            Quick presets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TIMER_PRESETS.map((preset) => {
              const isActive = totalInput === preset.seconds;
              return (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.seconds)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all",
                    isActive
                      ? "bg-cyan-500 text-white border-cyan-400 scale-105 shadow"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* HH:MM:SS inputs */}
      {isEditable && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">
            Custom time
          </p>
          <div className="flex items-center justify-center gap-2">
            <TimeInputMini label="Hours" value={hours} onChange={setHours} max={23} />
            <span className="text-2xl font-bold text-white/70 pb-5">:</span>
            <TimeInputMini label="Min" value={minutes} onChange={setMinutes} max={59} />
            <span className="text-2xl font-bold text-white/70 pb-5">:</span>
            <TimeInputMini label="Sec" value={seconds} onChange={setSeconds} max={59} />
          </div>
        </div>
      )}

      {/* Reset (when running/paused) */}
      {!timer.isIdle && !isFinished && (
        <div className="mt-3 flex justify-center">
          <Button
            onClick={handleReset}
            size="sm"
            variant="outline"
            className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      )}
    </section>
  );
}

function TimeInputMini({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <Input
        type="number"
        min={0}
        max={max}
        value={value.toString().padStart(2, "0")}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (isNaN(v)) onChange(0);
          else onChange(Math.max(0, Math.min(max, v)));
        }}
        className="w-16 h-16 text-center text-2xl font-bold bg-white/10 border-white/25 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-[10px] text-white/60 mt-1 font-semibold uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   DICE PANEL — custom sides + no-repeat + roll alongside the dice
   ============================================================ */
function DicePanel({ skin }: { skin: (typeof SKINS)[number] }) {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [sides, setSides] = useState(6);
  const [noRepeat, setNoRepeat] = useState(false);
  const [usedValues, setUsedValues] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "rolling" | "result">("idle");
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSidesChange = (n: number) => {
    const clamped = Math.max(2, Math.min(100, n));
    setSides(clamped);
    setUsedValues([]);
    setCurrent(null);
    setPhase("idle");
  };

  const handleRoll = useCallback(() => {
    if (phase === "rolling") return;
    setPhase("rolling");
    setCurrent(null);
    sound.playDiceRoll();

    let ticks = 0;
    spinRef.current = setInterval(() => {
      setCurrent(Math.floor(Math.random() * sides) + 1);
      if (ticks % 2 === 0) sound.playTick(400 + ticks * 15);
      ticks++;
      if (ticks >= 18) {
        if (spinRef.current) clearInterval(spinRef.current);
        let final: number;
        if (noRepeat) {
          const pool = Array.from({ length: sides }, (_, i) => i + 1);
          const available = pool.filter((v) => !usedValues.includes(v));
          if (available.length === 0) {
            final = Math.floor(Math.random() * sides) + 1;
            setUsedValues([final]);
          } else {
            final = available[Math.floor(Math.random() * available.length)];
            setUsedValues((prev) => [...prev, final]);
          }
        } else {
          final = Math.floor(Math.random() * sides) + 1;
        }
        setCurrent(final);
        setPhase("result");
        sound.playReveal();
        flashFn("rgba(255, 215, 0, 0.7)");
        shake(2);
        burstConfetti(80, 50, 40);
      }
    }, 90);
  }, [phase, sides, noRepeat, usedValues, sound, flashFn, shake, burstConfetti]);

  const handleReset = useCallback(() => {
    if (spinRef.current) clearInterval(spinRef.current);
    setPhase("idle");
    setCurrent(null);
    setUsedValues([]);
    sound.playClick();
  }, [sound]);

  useEffect(() => () => {
    if (spinRef.current) clearInterval(spinRef.current);
  }, []);

  const allExhausted = noRepeat && usedValues.length >= sides;
  const displayValue = current !== null ? String(current) : "?";

  // Font size for short labels
  const getFontSize = () => {
    const len = displayValue.length;
    if (len <= 1) return "text-7xl sm:text-8xl";
    if (len <= 2) return "text-6xl sm:text-7xl";
    if (len <= 3) return "text-4xl sm:text-5xl";
    return "text-2xl sm:text-3xl";
  };

  return (
    <section
      className="relative overflow-hidden rounded-3xl glass-dark p-5 sm:p-6 shadow-xl border border-white/10"
      aria-label="Dice panel"
    >
      <PanelHeader icon={<Dices className="h-4 w-4" />} label="Dice" accent="text-rose-300" />

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn(
          "mt-3 rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br p-5 flex flex-col items-center justify-center gap-3",
          skin.bgGradient,
        )}>
          <SkinParticleField skin={skin} seed={7} />
          <SkinSceneDecorator skin={skin} />

          {/* The dice itself */}
          <div className="relative z-10 flex items-center justify-center gap-4">
            <div
              className={cn(
                "relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl bg-gradient-to-br from-white to-slate-100 flex items-center justify-center shadow-2xl border-4 border-white overflow-hidden",
                phase === "rolling" && "animate-[diceTumble_0.3s_linear_infinite]",
                phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
              )}
            >
              <div className="absolute top-3 left-5 w-12 h-6 rounded-full bg-white/60 blur-sm pointer-events-none" />
              <span
                className={cn(
                  "relative text-slate-800 font-black drop-shadow-2xl text-center leading-none",
                  getFontSize(),
                )}
              >
                {displayValue}
              </span>
            </div>
          </div>

          {/* Result text */}
          <p className="relative z-10 text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
            {allExhausted ? "🎉 All sides rolled!" : phase === "result" ? `${displayValue}!` : phase === "buildup" ? "Get ready..." : phase === "rolling" ? "Rolling..." : "Ready?"}
          </p>

          {/* Roll button — INSIDE the container */}
          <div className="relative z-10">
            {phase === "idle" && (
              <Button
                onClick={handleRoll}
                disabled={allExhausted}
                className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Roll d{sides}
              </Button>
            )}
            {phase === "rolling" && (
              <Button
                disabled
                className="rounded-full px-6 bg-white/30 text-white font-bold"
                size="lg"
              >
                Rolling...
              </Button>
            )}
            {phase === "result" && (
              <Button
                onClick={handleRoll}
                disabled={allExhausted}
                className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Roll Again
              </Button>
            )}
          </div>

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Reset button — OUTSIDE the container (students won't accidentally hit it) */}
      {phase === "result" && (
        <div className="mt-3 flex justify-center">
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="rounded-full px-5 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      )}

      {/* Sides presets */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">
          Sides presets
        </p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {DICE_PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => handleSidesChange(n)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all",
                sides === n
                  ? "bg-rose-500 text-white border-rose-400 scale-105 shadow"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20",
              )}
            >
              d{n}
            </button>
          ))}
        </div>
      </div>

      {/* Custom sides input + no-repeat toggle */}
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
            Custom:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSidesChange(sides - 1)}
              className="w-7 h-7 rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20 flex items-center justify-center"
              aria-label="Decrease sides"
            >
              <Minus className="h-3 w-3" />
            </button>
            <Input
              type="number"
              min={2}
              max={100}
              value={sides}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) handleSidesChange(v);
              }}
              className="w-16 h-8 text-center text-sm font-bold bg-white/10 border-white/25 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => handleSidesChange(sides + 1)}
              className="w-7 h-7 rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20 flex items-center justify-center"
              aria-label="Increase sides"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="text-[10px] text-white/40">sides (2–100)</span>
        </div>

        <button
          onClick={() => {
            setNoRepeat(!noRepeat);
            setUsedValues([]);
            sound.playClick();
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
            noRepeat
              ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/50"
              : "bg-white/10 text-white border-white/25 hover:bg-white/20",
          )}
        >
          {noRepeat && <Check className="h-3 w-3" />}
          No-Repeat
        </button>
      </div>

      {/* No-repeat history */}
      {noRepeat && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
            Used:
          </span>
          {usedValues.length === 0 ? (
            <span className="text-[10px] text-white/30">none yet</span>
          ) : (
            usedValues.map((v) => (
              <span
                key={v}
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/40 text-emerald-100 border border-emerald-400/40 line-through"
              >
                {v}
              </span>
            ))
          )}
          {usedValues.length > 0 && (
            <button
              onClick={() => {
                setUsedValues([]);
                sound.playClick();
              }}
              className="text-[10px] text-white/50 hover:text-white underline ml-1"
            >
              reset
            </button>
          )}
        </div>
      )}

      {allExhausted && (
        <p className="mt-2 text-center text-amber-300 text-xs font-bold">
          🎉 All {sides} sides rolled! Reset to start again.
        </p>
      )}

      {/* Confetti + flash overlays (local to dice panel) */}
      <div className="pointer-events-none">
        <ConfettiOverlay pieces={confetti} />
        <FlashOverlay flash={flash} />
      </div>
    </section>
  );
}

/* ============================================================
   TALLY PANEL — 3 teams default, rename, add/remove
   ============================================================ */
function TallyPanel({ skin }: { skin: (typeof SKINS)[number] }) {
  const sound = useDramaticSound();
  const idRef = useRef(100);

  const [teams, setTeams] = useState<Team[]>([
    { id: 1, label: "Team A", value: 0, colorIdx: 0 },
    { id: 2, label: "Team B", value: 0, colorIdx: 1 },
    { id: 3, label: "Team C", value: 0, colorIdx: 2 },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const increment = useCallback(
    (id: number) => {
      setTeams((prev) =>
        prev.map((t) => (t.id === id ? { ...t, value: t.value + 1 } : t)),
      );
      sound.playTick(800);
    },
    [sound],
  );

  const decrement = useCallback(
    (id: number) => {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, value: Math.max(0, t.value - 1) } : t,
        ),
      );
      sound.playTick(400);
    },
    [sound],
  );

  const addTeam = () => {
    setTeams((prev) => [
      ...prev,
      {
        id: idRef.current++,
        label: `Team ${String.fromCharCode(65 + prev.length)}`,
        value: 0,
        colorIdx: prev.length % TEAM_COLORS.length,
      },
    ]);
    sound.playClick();
  };

  const removeTeam = (id: number) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
    sound.playClick();
  };

  const startEdit = (t: Team) => {
    setEditingId(t.id);
    setEditLabel(t.label);
  };

  const saveEdit = () => {
    if (editingId !== null) {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === editingId ? { ...t, label: editLabel.trim() || t.label } : t,
        ),
      );
      setEditingId(null);
      sound.playClick();
    }
  };

  const total = teams.reduce((s, t) => s + t.value, 0);
  const leader =
    teams.length > 0 && teams.some((t) => t.value > 0)
      ? teams.reduce((max, t) => (t.value > max.value ? t : max))
      : null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl glass-dark p-5 sm:p-6 shadow-xl border border-white/10"
      aria-label="Tally panel"
    >
      <PanelHeader icon={<Hash className="h-4 w-4" />} label="Tally" accent="text-emerald-300" />

      {/* Summary */}
      <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Teams</p>
          <p className="text-lg font-black text-white">{teams.length}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total</p>
          <p className="text-lg font-black text-emerald-400">{total}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Leader</p>
          <p className="text-lg font-black text-yellow-400 truncate max-w-[80px]">
            {leader && leader.value > 0 ? leader.label : "—"}
          </p>
        </div>
      </div>

      {/* Teams grid */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {teams.map((t) => {
          const isLeader = leader?.id === t.id && t.value > 0;
          return (
            <div
              key={t.id}
              className={cn(
                "relative rounded-2xl overflow-hidden border-2 border-white/15 shadow-lg bg-gradient-to-br p-3",
                TEAM_COLORS[t.colorIdx],
                isLeader && "ring-2 ring-yellow-400/60",
              )}
            >
              {isLeader && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-lg animate-bounce z-10">
                  👑
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                {/* Label (renameable) */}
                {editingId === t.id ? (
                  <div className="flex items-center gap-1 w-full">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="bg-white/20 border-white/30 text-white text-center text-xs h-7"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      className="text-white p-1 hover:bg-white/20 rounded"
                      aria-label="Save name"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-white p-1 hover:bg-white/20 rounded"
                      aria-label="Cancel rename"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 w-full justify-center">
                    <span className="text-sm font-bold text-white drop-shadow uppercase tracking-wide truncate max-w-[100px]">
                      {t.label}
                    </span>
                    <button
                      onClick={() => startEdit(t)}
                      className="text-white/50 hover:text-white transition-colors shrink-0"
                      aria-label={`Rename ${t.label}`}
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Big number */}
                <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] tabular-nums">
                  {t.value}
                </div>

                {/* +/- buttons */}
                <div className="flex gap-1.5 w-full">
                  <Button
                    onClick={() => decrement(t.id)}
                    className="flex-1 h-10 bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 font-black"
                    variant="outline"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => increment(t.id)}
                    className="flex-1 h-10 bg-white text-slate-900 hover:bg-white/90 font-black shadow"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeTeam(t.id)}
                  className="text-[10px] text-white/60 hover:text-red-200 flex items-center gap-1"
                  aria-label={`Remove ${t.label}`}
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        {/* Add team card */}
        <button
          onClick={addTeam}
          disabled={teams.length >= 6}
          className="rounded-2xl border-2 border-dashed border-white/25 hover:border-white/40 hover:bg-white/5 transition-all min-h-[140px] flex flex-col items-center justify-center gap-1 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider">Add Team</span>
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   FUTURE TOOL PLACEHOLDER — dashed border
   ============================================================ */
function FutureToolPanel() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-5 sm:p-6 flex flex-col items-center justify-center text-center min-h-[200px]"
      aria-label="Future tool placeholder"
    >
      <div className="text-5xl mb-3 opacity-60">🚧</div>
      <p className="text-base font-bold text-white/80 uppercase tracking-wider">
        Future Tool
      </p>
      <p className="text-xs text-white/50 mt-2 max-w-xs">
        More classroom tools coming soon. This slot is reserved for the next addition.
      </p>
      <div className="mt-4 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white/40">
        Placeholder
      </div>
    </section>
  );
}

/* ============================================================
   SHARED — panel header
   ============================================================ */
function PanelHeader({
  icon,
  label,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center",
          accent,
        )}
      >
        {icon}
      </div>
      <h3 className="text-sm font-black text-white uppercase tracking-wider">
        {label}
      </h3>
    </div>
  );
}

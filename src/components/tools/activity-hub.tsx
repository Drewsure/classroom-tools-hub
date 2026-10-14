"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTimer } from "@/hooks/use-timer";
import { useTimerAudio } from "@/hooks/use-timer-audio";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SKINS, SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import { useAttendance } from "@/hooks/use-attendance";
import { useClassroomAudio } from "@/hooks/use-classroom-audio";
import { PHONIC_CARDS, phonicWordAudioUrl } from "@/lib/phonic-cards";
import { formatTime } from "@/lib/timers";
import {
  Play, Pause, RotateCcw, Plus, Minus, Trash2, Edit3, Check, X,
  Dices, Clock, Hash, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Volume2, SkipBack, SkipForward, Music,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   ACTIVITY HUB v2
   - Fixed viewport layout (no page scrolling on desktop)
   - Every panel expandable fullscreen (Esc minimizes back)
   - Timer (snail race) + Student Dice (attendance) + Tally
   - Flash Card Presenter (phonic / weather / custom groups)
   - Mini MP3 player (reads the Audio Player library)
   ============================================================ */

const TIMER_PRESETS: { label: string; seconds: number }[] = [
  { label: "15s", seconds: 15 }, { label: "30s", seconds: 30 }, { label: "45s", seconds: 45 },
  { label: "1m", seconds: 60 }, { label: "1:30", seconds: 90 }, { label: "2m", seconds: 120 },
  { label: "2:30", seconds: 150 }, { label: "3m", seconds: 180 }, { label: "5m", seconds: 300 },
  { label: "10m", seconds: 600 }, { label: "15m", seconds: 900 },
];

const DICE_PRESETS = [6, 10, 20, 40, 60, 80, 100];

const TEAM_COLORS = [
  "from-emerald-500 to-green-600", "from-cyan-500 to-blue-600", "from-fuchsia-500 to-purple-600",
  "from-amber-500 to-orange-600", "from-rose-500 to-pink-600", "from-lime-500 to-teal-600",
];

interface Team { id: number; label: string; value: number; colorIdx: number; }

const RACE_SNAILS = [
  { id: 0, name: "Turbo", hue: 0, emoji: "🐌" },
  { id: 1, name: "Lightning", hue: 120, emoji: "🐌" },
  { id: 2, name: "Speedy", hue: 240, emoji: "🐌" },
];

type PanelId = "timer" | "dice" | "tally" | "flashcards";
type PanelSkin = (typeof SKINS)[number];

interface PanelProps {
  skin: PanelSkin;
  expanded: boolean;
  onToggleExpand: () => void;
}

/* ============================================================
   HUB ROOT - fixed layout
   ============================================================ */
export function ActivityHub() {
  const { skinId, setSkinId, skin } = useToolSkin("activity-hub");
  const [expanded, setExpanded] = useState<PanelId | null>(null);

  // Esc minimizes the expanded panel (capture phase beats the launcher close-on-Esc)
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setExpanded(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [expanded]);

  return (
    <div className="flex flex-col gap-2 w-full max-w-7xl mx-auto h-[calc(100vh-10.5rem)] overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 rounded-3xl bg-gradient-to-r from-cyan-400/28 via-slate-900/86 to-violet-500/24 border border-cyan-200/20 shadow-xl">
        <h2 className="text-lg font-black text-white flex items-center gap-3">
          <img src="/images/manga-icons/activity-hub.png" alt="" className="h-14 w-14 rounded-2xl bg-white object-contain shadow-lg" />
          Activity Hub
        </h2>
        <p className="hidden sm:block text-xs text-white/50">⛶ expands a tool · Esc returns</p>
      </div>

      {/* Skin picker */}
      <div className="shrink-0 overflow-x-auto">
        <UniversalSkinPicker current={skinId} onChange={setSkinId} />
      </div>

      {/* 2x2 fixed grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-3">
        <TimerPanel skin={skin} expanded={expanded === "timer"} onToggleExpand={() => setExpanded(expanded === "timer" ? null : "timer")} />
        <DicePanel skin={skin} expanded={expanded === "dice"} onToggleExpand={() => setExpanded(expanded === "dice" ? null : "dice")} />
        <TallyPanel skin={skin} expanded={expanded === "tally"} onToggleExpand={() => setExpanded(expanded === "tally" ? null : "tally")} />
        <FlashCardPanel skin={skin} expanded={expanded === "flashcards"} onToggleExpand={() => setExpanded(expanded === "flashcards" ? null : "flashcards")} />
      </div>

      {/* Mini MP3 player bar */}
      <MiniPlayer />
    </div>
  );
}

/* ============================================================
   PANEL SHELL - shared frame + expand button
   ============================================================ */
function PanelShell({
  icon, label, accent, expanded, onToggleExpand, children, ariaLabel,
}: {
  icon: React.ReactNode; label: string; accent: string;
  expanded: boolean; onToggleExpand: () => void; children: React.ReactNode; ariaLabel: string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col min-h-[420px] lg:min-h-0 rounded-3xl border-2 border-white/20 bg-gradient-to-br from-white/[0.16] via-slate-900/74 to-cyan-950/28 p-3 sm:p-4 shadow-xl shadow-black/25 overflow-hidden",
        expanded && "fixed inset-3 z-[60] m-0 min-h-0 rounded-[2rem] border-cyan-200/40 bg-none bg-slate-950 p-4 shadow-2xl shadow-black/45 sm:inset-5 sm:p-6",
      )}
    >
      <div className={cn("flex items-center justify-between gap-2 shrink-0", expanded && "rounded-2xl border border-white/15 bg-white/10 px-3 py-2")}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("w-8 h-8 rounded-xl bg-white/15 border border-white/25 shadow-sm flex items-center justify-center shrink-0", expanded && "h-12 w-12 rounded-2xl", accent)}>{icon}</div>
          <h3 className={cn("text-sm font-black text-white uppercase tracking-wider truncate", expanded && "text-xl")}>{label}</h3>
        </div>
        <button
          onClick={onToggleExpand}
          className={cn("w-8 h-8 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center shrink-0", expanded && "h-11 w-11 rounded-2xl bg-white text-slate-900 hover:bg-cyan-100 hover:text-slate-950")}
          title={expanded ? "Minimize (Esc)" : "Expand"}
          aria-label={expanded ? "Minimize panel" : "Expand panel"}
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
      <div className={cn("flex-1 min-h-0 flex flex-col gap-2 mt-2 overflow-y-auto overscroll-contain", expanded && "mt-4")}>{children}</div>
    </section>
  );
}

/* ============================================================
   TIMER PANEL - snail race, compact
   ============================================================ */
function TimerPanel({ skin, expanded, onToggleExpand }: PanelProps) {
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
    "snail-race", timer.remaining, timer.isRunning, timer.isCompleted,
    useCallback(() => {
      burstConfetti(120, 50, 40);
      flashFn(skin.flashColor);
      shake(2);
    }, [burstConfetti, flashFn, skin.flashColor, shake]),
    timer.status,
  );

  const handlePreset = (s: number) => {
    setHours(Math.floor(s / 3600));
    setMinutes(Math.floor((s % 3600) / 60));
    setSeconds(s % 60);
    timer.setTime(s);
    sound.playClick();
  };
  const handleStart = () => { if (totalInput <= 0) return; timer.start(totalInput); sound.playClick(); };
  const handleReset = () => { timer.reset(totalInput); sound.playClick(); };

  const { display } = formatTime(timer.remaining);
  const lowTime = timer.remaining <= 10 && timer.remaining > 0;
  const veryLow = timer.remaining <= 5 && timer.remaining > 0;
  const isFinished = timer.isCompleted;
  const isEditable = timer.isIdle;

  return (
    <PanelShell icon={<Clock className="h-4 w-4" />} label="Timer" accent="text-cyan-300" expanded={expanded} onToggleExpand={onToggleExpand} ariaLabel="Timer panel">
      <ShakeWrapper intensity={shakeIntensity} className={cn(expanded && "flex flex-1 min-h-[22rem] flex-col")}>
        <div
          className={cn(
            "relative shrink-0 rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br p-4 flex flex-col items-center justify-center gap-2",
            skin.bgGradient,
            expanded && "flex-1 min-h-[22rem]",
            veryLow && "border-red-500/80 animate-[strobeUrgent_0.4s_ease-in-out_infinite]",
            isFinished && "border-white/80",
          )}
          style={expanded ? undefined : { minHeight: "230px" }}
        >
          <SkinParticleField skin={skin} seed={3} />
          <SkinSceneDecorator skin={skin} />

          <div className={cn("relative z-10 w-full", expanded && "flex flex-1 min-h-0 flex-col")}>
            <div className="text-center">
              {isFinished ? (
                <p className="text-xl font-black drop-shadow-[0_0_20px_currentColor]" style={{ color: skin.accent }}>
                  {skin.completionMessage}
                </p>
              ) : (
                <div className={cn(
                  "inline-block rounded-lg bg-slate-950 px-3 py-2 font-mono font-black tabular-nums text-white text-4xl",
                  expanded && "text-5xl sm:text-7xl",
                  lowTime && "text-red-300",
                  veryLow && "animate-[dramaticPulse_0.5s_ease-in-out_infinite] text-red-400",
                )}>
                  {display}
                </div>
              )}
            </div>

            {/* Snail race track */}
            <div className={cn("relative w-full h-20 sm:h-24 mt-2 rounded-xl bg-slate-950 border border-white/20 overflow-hidden", expanded && "flex-1 min-h-56 h-auto sm:h-auto")}>
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-300 via-white to-yellow-300 opacity-80" />
              {RACE_SNAILS.map((snail, idx) => {
                const baseProgress = isFinished ? 100 : (1 - timer.remaining / Math.max(totalInput, 1)) * 100;
                const offset = idx === 0 ? 0 : idx === 1 ? -3 : 2;
                const progress = Math.max(0, Math.min(95, baseProgress + offset));
                return (
                  <div key={snail.id} className="absolute inset-x-3 transition-transform duration-1000 ease-linear" style={{ top: `${expanded ? 5 + idx * 30 : 12 + idx * 28}%`, transform: `translateX(calc(${progress}% - ${progress / 100 * (expanded ? 5 : 2)}rem))` }}>
                    <span className={cn("inline-block text-xl sm:text-2xl drop-shadow-lg leading-none", expanded && "text-5xl sm:text-7xl")} style={{ filter: `hue-rotate(${snail.hue}deg)` }}>{snail.emoji}</span>
                  </div>
                );
              })}
              {isFinished && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <p className="text-lg font-black text-yellow-300 drop-shadow-lg animate-bounce">🏆 {RACE_SNAILS[0].name} Wins! 🎉</p>
                </div>
              )}
            </div>
          </div>

          {/* Start/Pause/Resume/Reset */}
          <div className="relative z-10 shrink-0 flex flex-wrap items-center justify-center gap-2">
            {isEditable && (
              <Button onClick={handleStart} className="rounded-full px-5 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold" size="lg">
                <Play className="mr-2 h-4 w-4 fill-current" /> Start Race!
              </Button>
            )}
            {timer.isRunning && (
              <Button onClick={timer.pause} className="rounded-full px-5 bg-amber-500 hover:bg-amber-600 text-white shadow-lg font-bold" size="lg">
                <Pause className="mr-2 h-4 w-4" /> Pause
              </Button>
            )}
            {timer.isPaused && (
              <Button onClick={timer.resume} className="rounded-full px-5 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold" size="lg">
                <Play className="mr-2 h-4 w-4 fill-current" /> Resume
              </Button>
            )}
            {isFinished && (
              <Button onClick={handleReset} className="rounded-full px-5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg font-bold" size="lg">
                <RotateCcw className="mr-2 h-4 w-4" /> Race Again
              </Button>
            )}
            {!timer.isIdle && !isFinished && (
              <Button onClick={handleReset} size="sm" variant="outline" className="classroom-control-button ml-2 rounded-full hover:text-slate-950">
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Scrollable config */}
      {isEditable && (
        <div className={cn("min-h-0 flex flex-col gap-2", expanded ? "shrink-0 rounded-xl bg-slate-950 p-3" : "flex-1 overflow-y-auto pr-1")}>
          <div>
            <p className="mb-1 text-xs font-bold text-slate-200 uppercase tracking-wider">Quick presets</p>
            <div className="flex flex-wrap gap-1.5">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.seconds)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all",
                    totalInput === preset.seconds
                      ? "bg-cyan-500 text-white border-cyan-400 scale-105 shadow"
                      : "classroom-control-button hover:text-slate-950",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-slate-200 uppercase tracking-wider">Custom time</p>
            <div className="flex items-center justify-center gap-2">
              <TimeInputMini label="Hours" value={hours} onChange={setHours} max={23} />
              <span className="pb-4 text-xl font-black text-white">:</span>
              <TimeInputMini label="Min" value={minutes} onChange={setMinutes} max={59} />
              <span className="pb-4 text-xl font-black text-white">:</span>
              <TimeInputMini label="Sec" value={seconds} onChange={setSeconds} max={59} />
            </div>
          </div>
        </div>
      )}
    </PanelShell>
  );
}

function TimeInputMini({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div className="flex flex-col items-center">
      <Input
        type="number" min={0} max={max}
        value={value.toString().padStart(2, "0")}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (isNaN(v)) onChange(0); else onChange(Math.max(0, Math.min(max, v)));
        }}
        className="classroom-input h-11 w-14 text-center text-lg font-black [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="mt-0.5 text-[9px] font-black uppercase tracking-wide text-white">{label}</span>
    </div>
  );
}

/* ============================================================
   DICE PANEL - Students (attendance) or Numbers
   ============================================================ */
function DicePanel({ skin, expanded, onToggleExpand }: PanelProps) {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const att = useAttendance();

  const [mode, setMode] = useState<"students" | "numbers">("students");
  const [sides, setSides] = useState(6);
  const [noRepeat, setNoRepeat] = useState(true);
  const [used, setUsed] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "rolling" | "result">("idle");
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const present = att.activeStudents();
  const presentKey = JSON.stringify(present);
  useEffect(() => {
    if (spinRef.current) clearInterval(spinRef.current);
    setUsed([]);
    setCurrent(null);
    setPhase("idle");
  }, [presentKey, att.activeClass?.id]);
  const classTotal = att.activeClass?.students.length ?? 0;
  const classLabel = att.activeClass?.name ?? "No class selected";
  const attExcluded = classTotal - present.length;

  const poolSize = mode === "students" ? present.length : sides;
  const exhausted = noRepeat && poolSize > 0 && used.length >= poolSize;
  const studentName = mode === "students" && current !== null ? present[current - 1] : null;

  const switchMode = (m: "students" | "numbers") => {
    if (mode === m) return;
    setMode(m);
    setNoRepeat(m === "students");
    setUsed([]);
    setCurrent(null);
    setPhase("idle");
    sound.playClick();
  };

  const handleSidesChange = (n: number) => {
    const clamped = Math.max(2, Math.min(100, n));
    setSides(clamped);
    setUsed([]);
    setCurrent(null);
    setPhase("idle");
  };

  const handleRoll = useCallback(() => {
    if (phase === "rolling" || poolSize < 2) return;
    setPhase("rolling");
    setCurrent(null);
    sound.playDiceRoll();

    let ticks = 0;
    spinRef.current = setInterval(() => {
      setCurrent(Math.floor(Math.random() * poolSize) + 1);
      ticks++;
      if (ticks >= 18) {
        if (spinRef.current) clearInterval(spinRef.current);
        let candidates = Array.from({ length: poolSize }, (_, i) => i + 1);
        if (noRepeat) {
          const free = candidates.filter((v) => !used.includes(v));
          if (free.length > 0) candidates = free;
          // if empty: auto new round, roll from everyone
        }
        const final = candidates[Math.floor(Math.random() * candidates.length)];
        if (noRepeat) setUsed((prev) => (prev.length >= poolSize ? [final] : [...prev, final]));
        setCurrent(final);
        setPhase("result");
        sound.playResultChime();
        flashFn("rgba(255, 215, 0, 0.7)");
        shake(2);
        burstConfetti(80, 50, 40);
      }
    }, 90);
  }, [phase, poolSize, noRepeat, used, sound, flashFn, shake, burstConfetti]);

  const handleReset = useCallback(() => {
    if (spinRef.current) clearInterval(spinRef.current);
    setPhase("idle");
    setCurrent(null);
    setUsed([]);
    sound.playClick();
  }, [sound]);

  useEffect(() => () => { if (spinRef.current) clearInterval(spinRef.current); }, []);

  const displayValue = current !== null ? String(current) : "?";
  const getFontSize = () => {
    const len = displayValue.length;
    if (len <= 1) return expanded ? "text-9xl" : "text-7xl";
    if (len <= 2) return expanded ? "text-8xl" : "text-6xl";
    return "text-4xl sm:text-5xl";
  };

  return (
    <PanelShell icon={<Dices className="h-4 w-4" />} label="Dice" accent="text-rose-300" expanded={expanded} onToggleExpand={onToggleExpand} ariaLabel="Dice panel">
      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative shrink-0 rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br p-4 flex flex-col items-center justify-center gap-2", skin.bgGradient, expanded && "flex-1 min-h-[24rem]")}>
          <SkinParticleField skin={skin} seed={7} />
          <SkinSceneDecorator skin={skin} />

          <div className={cn(
            "relative rounded-3xl bg-gradient-to-br from-white to-slate-100 flex items-center justify-center shadow-2xl border-4 border-white overflow-hidden",
            expanded ? "w-64 h-64" : "w-36 h-36 sm:w-44 sm:h-44",
            phase === "rolling" && "animate-[diceTumble_0.3s_linear_infinite]",
            phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
          )}>
            <div className="absolute top-3 left-4 w-10 h-5 rounded-full bg-white/60 blur-sm pointer-events-none" />
            <span className={cn("relative text-slate-800 font-black drop-shadow-2xl text-center leading-none", getFontSize())}>
              {displayValue}
            </span>
          </div>

          <p className="relative z-10 max-w-full rounded-lg bg-slate-950 px-3 py-2 text-center text-xl sm:text-2xl font-black text-white break-words">
            {exhausted ? "🎉 All rolled! Rolling again from the start"
              : phase === "result" && studentName ? `${studentName}!`
              : phase === "result" ? `${displayValue}!`
              : phase === "rolling" ? "Rolling..."
              : mode === "students" ? "Student dice"
              : `Roll d${sides}`}
          </p>

          <div className="relative z-10">
            {phase !== "rolling" ? (
              <Button onClick={handleRoll} disabled={poolSize < 2} className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold" size="lg">
                <Play className="mr-2 h-4 w-4 fill-current" />
                {mode === "students" ? "Roll a Student" : `Roll d${sides}`}
              </Button>
            ) : (
              <Button disabled className="rounded-full px-6 bg-white/30 text-white font-bold" size="lg">Rolling...</Button>
            )}
            {(phase === "result" || used.length > 0) && (
              <Button onClick={handleReset} size="sm" variant="outline" className="classroom-control-button ml-2 rounded-full hover:text-slate-950">
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>

          {mode === "students" && noRepeat && !exhausted && poolSize > 0 && (
            <p className="relative z-10 rounded-lg bg-slate-950 px-3 py-1 text-sm text-slate-200">{poolSize - used.length} of {poolSize} not yet picked</p>
          )}

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Scrollable config */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2">
        {/* Mode toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="classroom-muted-label text-[10px] uppercase tracking-wider">Mode:</span>
          <button onClick={() => switchMode("students")} className={cn("px-3 py-1 rounded-full text-xs font-black border transition-all", mode === "students" ? "classroom-control-button-active scale-105" : "classroom-control-button")}>👥 Students</button>
          <button onClick={() => switchMode("numbers")} className={cn("px-3 py-1 rounded-full text-xs font-black border transition-all", mode === "numbers" ? "classroom-control-button-active scale-105" : "classroom-control-button")}>🔢 Numbers</button>
          <button onClick={() => { setNoRepeat(!noRepeat); setUsed([]); sound.playClick(); }} className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border transition-all", noRepeat ? "bg-emerald-400 text-slate-950 border-emerald-500" : "classroom-control-button")}>
            {noRepeat && <Check className="h-3 w-3" />} No-Repeat
          </button>
        </div>

        {mode === "students" ? (
          <div className="text-xs">
            <p className="font-bold text-white/80">📘 {classLabel}</p>
            <p className="text-white/50">
              {present.length} present{attExcluded > 0 ? ` of ${classTotal}` : ""} — switch class / mark attendance via the 📋 header button
            </p>
            {attExcluded > 0 && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[10px] font-bold">
                Active: {present.length}/{classTotal} (attendance)
              </span>
            )}
            {poolSize < 2 && <p className="text-amber-300 mt-1">Mark 2+ students PRESENT in Attendance to roll.</p>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 items-center">
              {DICE_PRESETS.map((n) => (
                <button key={n} onClick={() => handleSidesChange(n)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-black border transition-all", sides === n ? "bg-rose-500 text-white border-rose-600 scale-105 shadow" : "classroom-control-button")}>d{n}</button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleSidesChange(sides - 1)} className="classroom-control-button flex h-7 w-7 items-center justify-center rounded-full"><Minus className="h-3 w-3" /></button>
              <Input type="number" min={2} max={100} value={sides}
                onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) handleSidesChange(v); }}
                className="classroom-input h-8 w-14 text-center text-sm font-black [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              <button onClick={() => handleSidesChange(sides + 1)} className="classroom-control-button flex h-7 w-7 items-center justify-center rounded-full"><Plus className="h-3 w-3" /></button>
              <span className="text-[10px] font-bold text-white">sides (2-100)</span>
            </div>
          </>
        )}

        {/* Used history */}
        {noRepeat && used.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Used:</span>
            {mode === "students"
              ? used.map((v) => (
                  <span key={v} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/40 text-emerald-100 border border-emerald-400/40 line-through">
                    {present[v - 1] ?? v}
                  </span>
                ))
              : used.map((v) => (
                  <span key={v} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/40 text-emerald-100 border border-emerald-400/40 line-through">{v}</span>
                ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}

/* ============================================================
   TALLY PANEL - compact
   ============================================================ */
function TallyPanel({ skin: _skin, expanded, onToggleExpand }: PanelProps) {
  const sound = useDramaticSound();
  const idRef = useRef(100);

  const [teams, setTeams] = useState<Team[]>([
    { id: 1, label: "Team A", value: 0, colorIdx: 0 },
    { id: 2, label: "Team B", value: 0, colorIdx: 1 },
    { id: 3, label: "Team C", value: 0, colorIdx: 2 },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const increment = useCallback((id: number) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, value: t.value + 1 } : t)));
    sound.playTick(800);
  }, [sound]);
  const decrement = useCallback((id: number) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, value: Math.max(0, t.value - 1) } : t)));
    sound.playTick(400);
  }, [sound]);
  const addTeam = () => {
    setTeams((prev) => [...prev, { id: idRef.current++, label: `Team ${String.fromCharCode(65 + prev.length)}`, value: 0, colorIdx: prev.length % TEAM_COLORS.length }]);
    sound.playClick();
  };
  const removeTeam = (id: number) => { setTeams((prev) => prev.filter((t) => t.id !== id)); sound.playClick(); };
  const saveEdit = () => {
    if (editingId !== null) {
      setTeams((prev) => prev.map((t) => (t.id === editingId ? { ...t, label: editLabel.trim() || t.label } : t)));
      setEditingId(null);
      sound.playClick();
    }
  };

  const total = teams.reduce((s, t) => s + t.value, 0);
  const leader = teams.length > 0 && teams.some((t) => t.value > 0)
    ? teams.reduce((max, t) => (t.value > max.value ? t : max))
    : null;

  return (
    <PanelShell icon={<Hash className="h-4 w-4" />} label="Tally" accent="text-emerald-300" expanded={expanded} onToggleExpand={onToggleExpand} ariaLabel="Tally panel">
      {/* Summary */}
      <div className="shrink-0 flex items-center justify-around gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-center">
        <div><p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Teams</p><p className="text-base font-black text-white">{teams.length}</p></div>
        <div><p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Total</p><p className="text-base font-black text-emerald-400">{total}</p></div>
        <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Leader</p><p className="text-base font-black text-yellow-400 truncate max-w-[90px]">{leader && leader.value > 0 ? leader.label : "–"}</p></div>
        <button onClick={addTeam} disabled={teams.length >= 6} className="classroom-control-button flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] disabled:opacity-30"><Plus className="h-3 w-3" /> Team</button>
      </div>

      {/* Teams grid (scrolls inside) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 grid grid-cols-2 gap-2 content-start">
        {teams.map((t) => {
          const isLeader = leader?.id === t.id && t.value > 0;
          return (
            <div key={t.id} className={cn("relative rounded-2xl overflow-hidden border-2 border-white/15 shadow-lg bg-gradient-to-br p-2 flex flex-col items-center gap-1.5", TEAM_COLORS[t.colorIdx], isLeader && "ring-2 ring-yellow-400/60")}>
              {isLeader && <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-base animate-bounce z-10">👑</div>}
              {editingId === t.id ? (
                <div className="flex items-center gap-1 w-full">
                  <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                    className="bg-white/20 border-white/30 text-white text-center text-xs h-7" autoFocus />
                  <button onClick={saveEdit} className="text-white p-1 hover:bg-white/20 rounded"><Check className="h-3 w-3" /></button>
                  <button onClick={() => setEditingId(null)} className="text-white p-1 hover:bg-white/20 rounded"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1 w-full justify-center min-w-0">
                  <span className="text-xs font-bold text-white drop-shadow uppercase tracking-wide truncate max-w-[90px]">{t.label}</span>
                  <button onClick={() => { setEditingId(t.id); setEditLabel(t.label); }} className="text-white/50 hover:text-white shrink-0"><Edit3 className="h-3 w-3" /></button>
                </div>
              )}
              <div className="text-4xl font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] tabular-nums">{t.value}</div>
              <div className="flex gap-1.5 w-full">
                <Button onClick={() => decrement(t.id)} className="flex-1 h-9 bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 font-black" variant="outline"><Minus className="h-4 w-4" /></Button>
                <Button onClick={() => increment(t.id)} className="flex-1 h-9 bg-white text-slate-900 hover:bg-white/90 font-black shadow"><Plus className="h-4 w-4" /></Button>
              </div>
              <button onClick={() => removeTeam(t.id)} className="text-[9px] text-white/60 hover:text-red-200 flex items-center gap-0.5"><Trash2 className="h-2.5 w-2.5" /> Remove</button>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

/* ============================================================
   FLASH CARD PANEL - embedded presenter (phonic/weather/custom)
   ============================================================ */
interface MiniCard { id: string; label: string; word?: string; image: string; type: "phonic" | "weather" | "custom"; }

const WEATHER_DEFS: { id: string; label: string; image: string }[] = [
  { id: "sunny", label: "Sunny", image: "/images/weather/sunny.gif" },
  { id: "cloudy", label: "Cloudy", image: "/images/weather/cloudy.gif" },
  { id: "rainy", label: "Rainy", image: "/images/weather/rainy.gif" },
  { id: "snowy", label: "Snowy", image: "/images/weather/snowy.gif" },
  { id: "windy", label: "Windy", image: "/images/weather/windy.gif" },
  { id: "stormy", label: "Stormy", image: "/images/weather/stormy.gif" },
  { id: "hot", label: "Hot", image: "/images/weather/hot.gif" },
  { id: "cold", label: "Cold", image: "/images/weather/cold.gif" },
];

function buildGroups(): { id: string; name: string; cards: MiniCard[] }[] {
  const phonic: MiniCard[] = PHONIC_CARDS.map((c) => ({
    id: c.letter, label: `${c.upper}/${c.letter}`, word: c.word, image: c.cardImage, type: "phonic" as const,
  }));
  const weather: MiniCard[] = WEATHER_DEFS.map((w) => ({ id: w.id, label: w.label, image: w.image, type: "weather" as const }));
  const groups = [
    { id: "phonic", name: "Phonic (A-Z)", cards: phonic },
    { id: "weather", name: "Weather", cards: weather },
  ];
  try {
    const raw = window.localStorage.getItem("classroom-tools-flashcard-groups-v2");
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, { customCards?: MiniCard[] }>;
      for (const [name, sg] of Object.entries(obj)) {
        if (sg?.customCards && sg.customCards.length > 0) {
          groups.push({ id: `custom-${name}`, name, cards: sg.customCards });
        }
      }
    }
  } catch { /* ignore */ }
  return groups;
}

function FlashCardPanel({ skin, expanded, onToggleExpand }: PanelProps) {
  const sound = useDramaticSound();
  const classroomAudio = useClassroomAudio();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const groups = useMemo(() => buildGroups(), []);
  const [groupId, setGroupId] = useState("phonic");
  const group = groups.find((g) => g.id === groupId) ?? groups[0];
  const cards = group.cards;

  const [cardIdx, setCardIdx] = useState(0);
  const [used, setUsed] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "drawing" | "result">("idle");

  useEffect(() => { setCardIdx(0); setUsed([]); setPhase("idle"); }, [groupId]);

  const card = cards[cardIdx];

  const drawRandom = useCallback(() => {
    if (phase === "drawing" || cards.length === 0) return;
    setPhase("drawing");
    sound.playCardShuffle();
    const available = cards.filter((c) => !used.includes(c.id));
    const pool = available.length > 0 ? available : cards;
    let ticks = 0;
    const interval = setInterval(() => {
      setCardIdx(cards.indexOf(pool[Math.floor(Math.random() * pool.length)]));
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        const final = pool[Math.floor(Math.random() * pool.length)];
        setCardIdx(cards.indexOf(final));
        if (available.length > 0) setUsed((prev) => [...prev, final.id]);
        else setUsed([final.id]);
        setPhase("result");
        sound.playCardTurn();
        flashFn("rgba(168, 85, 247, 0.5)");
        shake(2);
        burstConfetti(60, 50, 40);
      }
    }, 70);
  }, [phase, cards, used, sound, flashFn, shake, burstConfetti]);

  const goNext = () => { setCardIdx((i) => (i + 1) % cards.length); setPhase("result"); sound.playTick(800); };
  const goPrev = () => { setCardIdx((i) => (i - 1 + cards.length) % cards.length); setPhase("result"); sound.playTick(600); };

  const playWord = () => {
    if (!card) return;
    if (card.type === "phonic" && card.id) {
      void classroomAudio.play(phonicWordAudioUrl(card.id), { volume: 0.5, lowpass: 7600 });
    } else {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(card.word || card.label);
        u.lang = "en-US"; u.rate = 0.85;
        window.speechSynthesis.speak(u);
      } catch { /* ignore */ }
    }
    sound.playClick();
  };

  return (
    <PanelShell icon={<Dices className="h-4 w-4" />} label="Flash Cards" accent="text-violet-300" expanded={expanded} onToggleExpand={onToggleExpand} ariaLabel="Flash card panel">
      {/* Group select */}
      <div className="shrink-0 flex items-center gap-2">
        <span className="classroom-muted-label shrink-0 text-[10px] uppercase tracking-wider">Set:</span>
        <select value={groupId} onChange={(e) => { setGroupId(e.target.value); sound.playClick(); }}
          className="classroom-input flex-1 min-w-0 rounded-xl px-2 py-1.5 text-xs font-black">
          {groups.map((g) => (
            <option key={g.id} value={g.id} className="bg-slate-900">{g.name} ({g.cards.length})</option>
          ))}
        </select>
      </div>

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative flex-1 min-h-[18rem] rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br flex flex-col items-center justify-center p-3 gap-2", skin.bgGradient)}>
          <SkinParticleField skin={skin} seed={11} />
          <SkinSceneDecorator skin={skin} />

          {card && (
            <>
              <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center w-full">
                <div className={cn(
                  "rounded-xl bg-white shadow-2xl border-4 border-white/40 overflow-hidden h-full aspect-[3/4] max-w-full",
                  phase === "drawing" && "animate-[diceTumble_0.2s_linear_infinite]",
                  phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
                )}>
                  <img src={card.image} alt={card.label} className="w-full h-full object-cover select-none" draggable={false} />
                </div>
              </div>

              <div className="relative z-10 text-center shrink-0">
                <p className="max-w-full rounded-lg bg-slate-950 px-3 py-2 text-xl sm:text-2xl font-black text-white break-words">{card.label}</p>
                {card.word && <p className="rounded-lg bg-slate-950 px-3 py-1 text-sm text-slate-200">{card.word} · {used.length} of {cards.length} drawn</p>}
                {!card.word && <p className="rounded-lg bg-slate-950 px-3 py-1 text-sm text-slate-200">{used.length} of {cards.length} drawn</p>}
              </div>
            </>
          )}

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Controls */}
      <div className="shrink-0 flex gap-2 justify-center items-center flex-wrap">
        <Button onClick={goPrev} size="sm" variant="outline" className="classroom-control-button rounded-full hover:text-slate-950"><ChevronLeft className="h-4 w-4" /> Prev</Button>
        {phase === "drawing" ? (
          <Button disabled size="sm" className="rounded-full px-5 bg-white/30 text-white">Drawing...</Button>
        ) : (
          <Button onClick={drawRandom} size="sm" className="rounded-full px-5 bg-white text-slate-900 hover:bg-white/90 shadow font-bold"><Play className="mr-1 h-3.5 w-3.5 fill-current" /> Draw</Button>
        )}
        <Button onClick={goNext} size="sm" className="rounded-full px-5 bg-white text-slate-900 hover:bg-white/90 shadow font-bold">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
        <button onClick={playWord} className="w-9 h-9 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/35 flex items-center justify-center shrink-0" title="Say the word">
          <Volume2 className="h-4 w-4" />
        </button>
        <Button onClick={() => { setUsed([]); setPhase("idle"); sound.playClick(); }} size="sm" variant="outline" className="classroom-control-button rounded-full hover:text-slate-950"><RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset</Button>
      </div>
    </PanelShell>
  );
}

/* ============================================================
   MINI MP3 PLAYER - reads the Audio Player library (IndexedDB)
   ============================================================ */
interface MiniTrack { id: string; name: string; level: number; week?: number; blob: Blob; }

function openMiniDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("classroom-tools-audio-player", 3);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("tracks")) {
        const store = db.createObjectStore("tracks", { keyPath: "id" });
        store.createIndex("level", "level", { unique: false });
        store.createIndex("week", "week", { unique: false });
        store.createIndex("name", "name", { unique: false });
      }
      if (!db.objectStoreNames.contains("playlists")) db.createObjectStore("playlists", { keyPath: "id" });
    };
  });
}

async function dbGetAllMini(): Promise<MiniTrack[]> {
  const db = await openMiniDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("tracks", "readonly");
    const req = tx.objectStore("tracks").getAll();
    req.onsuccess = () => {
      const all = (req.result as MiniTrack[]);
      const nat = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      all.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        if ((a.week ?? 999) !== (b.week ?? 999)) return (a.week ?? 999) - (b.week ?? 999);
        return nat(a.name, b.name);
      });
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

function MiniPlayer() {
  const [tracks, setTracks] = useState<MiniTrack[]>([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await dbGetAllMini();
        if (alive) setTracks(all);
      } catch { /* DB not created yet */ }
    })();
    return () => {
      alive = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      audioRef.current?.pause();
    };
  }, []);

  // Load + autoplay when the selected track changes
  useEffect(() => {
    if (idx < 0 || !tracks[idx]) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(tracks[idx].blob);
    urlRef.current = url;
    const a = audioRef.current;
    if (a) {
      a.src = url;
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [idx, tracks]);

  const goNext = () => { if (tracks.length > 0) setIdx((i) => (i + 1) % tracks.length); };
  const goPrev = () => { if (tracks.length > 0) setIdx((i) => (i - 1 + tracks.length) % tracks.length); };
  const toggle = () => {
    const a = audioRef.current;
    if (!a || idx < 0) return;
    if (playing) a.pause(); else a.play().catch(() => {});
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="shrink-0 h-14 rounded-2xl glass-dark border border-white/10 px-3 flex items-center gap-2 overflow-hidden">
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onEnded={goNext}
      />
      <Music className="h-4 w-4 text-fuchsia-300 shrink-0" />
      {tracks.length === 0 ? (
        <p className="text-xs text-white/50 truncate">No audio uploaded yet — upload MP3s in the Audio Player tool and they appear here.</p>
      ) : (
        <>
          <select
            value={idx}
            onChange={(e) => setIdx(parseInt(e.target.value, 10))}
            className="flex-1 min-w-0 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold px-2 py-1.5 truncate"
            title="Pick a track"
          >
            <option value={-1} className="bg-slate-900">– pick a track –</option>
            {tracks.map((t, i) => (
              <option key={t.id} value={i} className="bg-slate-900">{`L${t.level}${t.week ? `-W${t.week}` : ""} · ${t.name}`}</option>
            ))}
          </select>
          <button onClick={goPrev} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center shrink-0" title="Previous"><SkipBack className="h-4 w-4" /></button>
          <button onClick={toggle} disabled={idx < 0} className="w-10 h-10 rounded-full bg-white text-slate-900 hover:scale-105 transition-all flex items-center justify-center shrink-0 shadow disabled:opacity-30" title={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
          <button onClick={goNext} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center shrink-0" title="Next"><SkipForward className="h-4 w-4" /></button>
          <span className="text-[10px] text-white/50 font-mono tabular-nums shrink-0 hidden sm:inline">{fmt(time)}</span>
          <input
            type="range" min={0} max={dur || 0} value={time}
            onChange={(e) => { const v = parseFloat(e.target.value); if (audioRef.current) { audioRef.current.currentTime = v; setTime(v); } }}
            className="flex-1 min-w-[80px] max-w-[220px] h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer accent-fuchsia-500"
          />
          <span className="text-[10px] text-white/50 font-mono tabular-nums shrink-0 hidden sm:inline">{fmt(dur)}</span>
        </>
      )}
    </div>
  );
}

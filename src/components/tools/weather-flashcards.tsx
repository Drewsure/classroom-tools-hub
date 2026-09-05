"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import {
  Play,
  RotateCcw,
  Check,
  X,
  Cloud,
  Grid3x3,
  Layers,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   WEATHER FLASHCARDS — Redesigned like Flash Card Presenter
   ============================================================
   Three modes:
   1. Flashcard — large random draw, "Is it .... today?" Yes/No
   2. Selection Panel — grid of 8, mark ✓ correct or ✗ wrong
   3. Present Selected — large format presentation of selected cards

   AAAA presentation quality with themed particles, large GIFs,
   dramatic effects, and fullscreen mode.
   ============================================================ */

const WEATHER_TYPES = [
  "sunny", "cloudy", "rainy", "snowy",
  "windy", "stormy", "hot", "cold",
] as const;
type WeatherType = (typeof WEATHER_TYPES)[number];

const WEATHER_META: Record<WeatherType, { label: string; emoji: string; color: string }> = {
  sunny:   { label: "sunny",   emoji: "☀️", color: "from-yellow-400 to-orange-500" },
  cloudy:  { label: "cloudy",  emoji: "☁️", color: "from-slate-400 to-slate-600" },
  rainy:   { label: "rainy",   emoji: "🌧️", color: "from-blue-400 to-blue-600" },
  snowy:   { label: "snowy",   emoji: "❄️", color: "from-cyan-300 to-blue-400" },
  windy:   { label: "windy",   emoji: "💨", color: "from-teal-400 to-cyan-500" },
  stormy:  { label: "stormy",  emoji: "⛈️", color: "from-purple-500 to-slate-700" },
  hot:     { label: "hot",     emoji: "🥵", color: "from-red-400 to-orange-600" },
  cold:    { label: "cold",    emoji: "🥶", color: "from-blue-300 to-indigo-500" },
};

function weatherGif(type: WeatherType): string {
  return `/images/weather/${type}.gif`;
}

type Mode = "flashcard" | "selection" | "present";
type FlashcardPhase = "idle" | "flipping" | "result";

export function WeatherFlashcards() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const { skinId, setSkinId, skin } = useToolSkin("weather-flashcards");

  const [mode, setMode] = useState<Mode>("flashcard");
  const [fullscreen, setFullscreen] = useState(false);

  // Flashcard mode state
  const [phase, setPhase] = useState<FlashcardPhase>("idle");
  const [current, setCurrent] = useState<WeatherType | null>(null);
  const [used, setUsed] = useState<WeatherType[]>([]);
  const [revealAnswer, setRevealAnswer] = useState<"yes" | "no" | null>(null);

  // Selection panel state
  const [marks, setMarks] = useState<Record<WeatherType, "correct" | "wrong" | null>>(
    () => Object.fromEntries(WEATHER_TYPES.map((t) => [t, null])) as Record<WeatherType, "correct" | "wrong" | null>,
  );

  // Present mode state
  const [presentIdx, setPresentIdx] = useState(0);

  // ===== Flashcard mode: draw random =====
  const drawRandom = useCallback(() => {
    setPhase("flipping");
    setRevealAnswer(null);
    sound.playWhoosh();
    setTimeout(() => {
      const pool = WEATHER_TYPES.filter((t) => !used.includes(t));
      const available = pool.length > 0 ? pool : WEATHER_TYPES;
      const next = available[Math.floor(Math.random() * available.length)];
      setCurrent(next);
      if (pool.length === 0) setUsed([next]);
      else setUsed((prev) => [...prev, next]);
      setPhase("result");
      sound.playTick(600);
    }, 600);
  }, [used, sound]);

  const handleYes = useCallback(() => {
    setRevealAnswer("yes");
    sound.playReveal();
    flashFn("rgba(34, 197, 94, 0.6)");
    shake(2);
    burstConfetti(120, 50, 40);
    setTimeout(() => burstConfetti(60, 30, 50), 300);
  }, [sound, flashFn, shake, burstConfetti]);

  const handleNo = useCallback(() => {
    setRevealAnswer("no");
    sound.playBuildUp();
    flashFn("rgba(239, 68, 68, 0.5)");
    shake(2);
    setTimeout(() => drawRandom(), 1500);
  }, [sound, flashFn, shake, drawRandom]);

  const handleResetFlashcard = useCallback(() => {
    setPhase("idle");
    setUsed([]);
    setRevealAnswer(null);
    setCurrent(null);
    sound.playClick();
  }, [sound]);

  // ===== Selection panel: toggle marks =====
  const toggleMark = useCallback((type: WeatherType, mark: "correct" | "wrong") => {
    setMarks((prev) => ({ ...prev, [type]: prev[type] === mark ? null : mark }));
    sound.playTick(mark === "correct" ? 880 : 440);
  }, [sound]);

  const clearMarks = useCallback(() => {
    setMarks(Object.fromEntries(WEATHER_TYPES.map((t) => [t, null])) as Record<WeatherType, "correct" | "wrong" | null>);
    sound.playClick();
  }, [sound]);

  // ===== Present mode =====
  const correctTypes = useMemo(() => WEATHER_TYPES.filter((t) => marks[t] === "correct"), [marks]);
  const wrongTypes = useMemo(() => WEATHER_TYPES.filter((t) => marks[t] === "wrong"), [marks]);

  const startPresent = useCallback(() => {
    if (correctTypes.length === 0) return;
    setMode("present");
    setPresentIdx(0);
    setPhase("result");
    sound.playWhoosh();
    setTimeout(() => { sound.playReveal(); flashFn("rgba(34,197,94,0.4)"); shake(1.5); burstConfetti(60,50,40); }, 400);
  }, [correctTypes, sound, flashFn, shake, burstConfetti]);

  const handlePresentNext = useCallback(() => {
    setPhase("flipping");
    sound.playTick(600);
    setTimeout(() => {
      setPresentIdx((prev) => (prev + 1) % correctTypes.length);
      setPhase("result");
      sound.playReveal();
    }, 400);
  }, [sound, correctTypes.length]);

  const handlePresentPrev = useCallback(() => {
    setPhase("flipping");
    sound.playTick(400);
    setTimeout(() => {
      setPresentIdx((prev) => (prev - 1 + correctTypes.length) % correctTypes.length);
      setPhase("result");
      sound.playReveal();
    }, 400);
  }, [sound, correctTypes.length]);

  const toggleFullscreen = useCallback(() => { setFullscreen((f) => !f); sound.playClick(); }, [sound]);

  const correctCount = correctTypes.length;
  const wrongCount = wrongTypes.length;
  const presentCard = correctTypes[presentIdx];

  return (
    <div className={cn("flex flex-col items-center gap-4 py-2", fullscreen && "fixed inset-0 z-50 bg-black/95 p-4 overflow-y-auto")}>
      {!fullscreen && <UniversalSkinPicker current={skinId} onChange={setSkinId} />}

      {/* Title */}
      <div className="w-full max-w-3xl text-center px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 border border-white/10 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
          <Cloud className="h-5 w-5" /> How&apos;s the Weather?
        </h2>
        <p className="text-xs text-white/70 mt-1">Flashcard + selection + presentation mode</p>
      </div>

      {/* Mode toggle + fullscreen */}
      {!fullscreen && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Mode:</span>
          <button onClick={() => { setMode("flashcard"); handleResetFlashcard(); }} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-all", mode === "flashcard" ? "bg-white text-slate-900 border-white scale-105 shadow-lg" : "bg-white/10 text-white border-white/25 hover:bg-white/20")}>
            <Layers className="h-4 w-4" /> Flashcard
          </button>
          <button onClick={() => { setMode("selection"); sound.playClick(); }} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-all", mode === "selection" ? "bg-white text-slate-900 border-white scale-105 shadow-lg" : "bg-white/10 text-white border-white/25 hover:bg-white/20")}>
            <Grid3x3 className="h-4 w-4" /> Selection
          </button>
          <button onClick={toggleFullscreen} className="px-4 py-2 rounded-full text-sm font-bold border bg-white/10 text-white border-white/25 hover:bg-white/20" title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}
      {fullscreen && (
        <button onClick={toggleFullscreen} className="text-white/60 hover:text-white text-sm font-bold">✕ Exit Fullscreen</button>
      )}

      {/* ===== FLASHCARD MODE ===== */}
      {mode === "flashcard" && (
        <ShakeWrapper intensity={shakeIntensity}>
          <div className={cn("relative rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br", skin.bgGradient, fullscreen ? "w-full max-w-5xl min-h-[70vh]" : "w-full max-w-md min-h-[30rem]")}>
            <SkinParticleField skin={skin} seed={7} />
            <SkinSceneDecorator skin={skin} />

            {phase === "idle" && (
              <div className="relative z-10 text-center">
                <div className="text-6xl mb-4 animate-bounce">🌤️</div>
                <p className="text-2xl font-bold text-white mb-2">How&apos;s the Weather?</p>
                <p className="text-white/70 mb-4">Draw a card, then ask: &quot;Is it .... today?&quot;</p>
                <Button onClick={drawRandom} size="lg" className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg">
                  <Play className="mr-2 h-5 w-5 fill-current" /> Draw Weather Card
                </Button>
              </div>
            )}

            {phase === "flipping" && (
              <div className="relative z-10 text-center"><div className="text-6xl mb-4 animate-spin">🔄</div><p className="text-2xl font-bold text-white">Flipping...</p></div>
            )}

            {phase === "result" && current && (
              <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                {/* Large weather GIF */}
                <div className={cn("relative rounded-3xl overflow-hidden border-4 shadow-2xl", fullscreen ? "w-56 h-56 sm:w-64 sm:h-64" : "w-48 h-48 sm:w-56 sm:h-56", revealAnswer === "yes" ? "border-emerald-400 animate-[revealPulse_0.6s_ease-out]" : "border-white/80", "bg-gradient-to-br", WEATHER_META[current].color)}>
                  <img src={weatherGif(current)} alt={WEATHER_META[current].label} className="w-full h-full object-cover" draggable={false} />
                  {revealAnswer === "yes" && <div className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg animate-[popIn_0.3s_ease-out]">✓ YES!</div>}
                </div>

                {/* Question / Answer */}
                <p className={cn("text-2xl sm:text-3xl font-black text-white drop-shadow-lg text-center", revealAnswer === "yes" && "text-emerald-300")}>
                  {revealAnswer === "yes" ? `Yes! It's ${WEATHER_META[current].label} today!` : `Is it ${WEATHER_META[current].label} today?`}
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                  {!revealAnswer ? (
                    <>
                      <Button onClick={handleNo} className="rounded-full px-6 bg-rose-500 hover:bg-rose-600 text-white shadow-lg" size="lg"><X className="mr-2 h-5 w-5" /> No, it&apos;s not</Button>
                      <Button onClick={handleYes} className="rounded-full px-6 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg" size="lg"><Check className="mr-2 h-5 w-5" /> Yes, it is!</Button>
                    </>
                  ) : revealAnswer === "yes" ? (
                    <Button onClick={drawRandom} className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg" size="lg"><Play className="mr-2 h-4 w-4 fill-current" /> Next Card</Button>
                  ) : null}
                </div>

                {used.length > 0 && <p className="text-xs text-white/50">Seen: {used.length} / {WEATHER_TYPES.length}</p>}
              </div>
            )}

            <ConfettiOverlay pieces={confetti} />
            <FlashOverlay flash={flash} />
          </div>
        </ShakeWrapper>
      )}

      {/* Flashcard controls */}
      {mode === "flashcard" && phase === "idle" && (
        <button onClick={handleResetFlashcard} className="text-xs text-white/40 hover:text-red-400 transition-colors flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reset</button>
      )}

      {/* ===== SELECTION PANEL MODE ===== */}
      {mode === "selection" && (
        <div className="w-full max-w-3xl flex flex-col items-center gap-4">
          {/* Summary bar */}
          <div className="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex-wrap">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 font-bold text-emerald-300"><Check className="h-4 w-4" /> Correct: {correctCount}</span>
              <span className="flex items-center gap-1.5 font-bold text-rose-300"><X className="h-4 w-4" /> Wrong: {wrongCount}</span>
            </div>
            <div className="flex gap-2">
              {correctCount > 0 && (
                <Button onClick={startPresent} size="sm" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Play className="mr-1 h-3.5 w-3.5 fill-current" /> Present {correctCount} Card{correctCount !== 1 ? "s" : ""}
                </Button>
              )}
              {(correctCount > 0 || wrongCount > 0) && (
                <Button onClick={clearMarks} size="sm" variant="outline" className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"><RotateCcw className="mr-1 h-3.5 w-3.5" /> Clear</Button>
              )}
            </div>
          </div>

          {/* Grid of 8 weather GIFs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
            {WEATHER_TYPES.map((type) => {
              const mark = marks[type];
              return (
                <div key={type} className={cn("relative rounded-2xl overflow-hidden border-2 shadow-lg bg-white/5 transition-all", mark === "correct" ? "border-emerald-400/80 ring-2 ring-emerald-400/40 scale-105" : mark === "wrong" ? "border-rose-400/80 ring-2 ring-rose-400/40 opacity-70" : "border-white/15")}>
                  <div className="relative aspect-square bg-black/20">
                    <img src={weatherGif(type)} alt={WEATHER_META[type].label} className="w-full h-full object-cover" draggable={false} />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">{WEATHER_META[type].emoji} {WEATHER_META[type].label}</div>
                    {mark === "correct" && <div className="absolute top-2 right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg"><Check className="h-4 w-4" /></div>}
                    {mark === "wrong" && <div className="absolute top-2 right-2 bg-rose-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg"><X className="h-4 w-4" /></div>}
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1.5 bg-black/30">
                    <button onClick={() => toggleMark(type, "correct")} className={cn("py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center", mark === "correct" ? "bg-emerald-500 text-white shadow" : "bg-white/10 text-white/70 hover:bg-emerald-500/40 hover:text-white")}><Check className="h-4 w-4" /></button>
                    <button onClick={() => toggleMark(type, "wrong")} className={cn("py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center", mark === "wrong" ? "bg-rose-500 text-white shadow" : "bg-white/10 text-white/70 hover:bg-rose-500/40 hover:text-white")}><X className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-white/50 text-center max-w-md">Tap ✓ (correct) or ✗ (wrong) on each card. Select multiple correct cards (e.g. sunny + hot), then click &quot;Present&quot; to show them in large format.</p>
        </div>
      )}

      {/* ===== PRESENT MODE — large format presentation ===== */}
      {mode === "present" && presentCard && (
        <>
          <ShakeWrapper intensity={shakeIntensity}>
            <div className={cn("relative rounded-3xl overflow-hidden border-2 border-emerald-400/30 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br", skin.bgGradient, fullscreen ? "w-full max-w-5xl min-h-[70vh]" : "w-full max-w-2xl min-h-[32rem]")}>
              <SkinParticleField skin={skin} seed={9} />
              <SkinSceneDecorator skin={skin} />

              {phase === "flipping" && <div className="relative z-10 text-center"><div className="text-6xl mb-4 animate-spin">🔄</div><p className="text-2xl font-bold text-white">Flipping...</p></div>}

              {phase === "result" && (
                <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                  <div className={cn("relative rounded-3xl overflow-hidden border-4 border-emerald-400 shadow-2xl bg-gradient-to-br animate-[revealPulse_0.5s_ease-out]", WEATHER_META[presentCard].color, fullscreen ? "w-48 h-48 sm:w-56 sm:h-56" : "w-40 h-40 sm:w-48 sm:h-48")}>
                    <img src={weatherGif(presentCard)} alt={WEATHER_META[presentCard].label} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"><Check className="h-5 w-5" /></div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-emerald-300 text-center">Yes, it is. It&apos;s {WEATHER_META[presentCard].label} today.</p>
                  <p className="text-sm text-emerald-300/70">Card {presentIdx + 1} of {correctTypes.length}</p>
                </div>
              )}

              <ConfettiOverlay pieces={confetti} />
              <FlashOverlay flash={flash} />
            </div>
          </ShakeWrapper>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Button onClick={handlePresentPrev} size="lg" variant="outline" className="rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20"><ChevronLeft className="mr-1 h-5 w-5" /> Prev</Button>
            <Button onClick={handlePresentNext} size="lg" className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg">Next <ChevronRight className="ml-1 h-5 w-5" /></Button>
            <button onClick={() => { setMode("selection"); sound.playClick(); }} className="text-xs text-white/40 hover:text-red-400 transition-colors flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Back to Selection</button>
          </div>
        </>
      )}
    </div>
  );
}

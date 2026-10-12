"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import { Plus, Minus, RotateCcw, Check, Play, Save, FolderOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COUNTER_COLORS = [
  "from-emerald-500 to-green-600",
  "from-blue-500 to-cyan-600",
  "from-purple-500 to-fuchsia-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-yellow-500 to-amber-600",
];

const LABEL_SETS_KEY = "classroom-tools-dice-label-sets";

function readLabelSets(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LABEL_SETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeLabelSets(sets: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LABEL_SETS_KEY, JSON.stringify(sets)); } catch {}
}

type LabelMode = "numbers" | "words";

export function CustomDice() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const { skinId, setSkinId, skin } = useToolSkin("custom-dice");

  const [sides, setSides] = useState(6);
  const [labelMode, setLabelMode] = useState<LabelMode>("numbers");
  const [labels, setLabels] = useState<string[]>(["1", "2", "3", "4", "5", "6"]);
  const [noRepeat, setNoRepeat] = useState(false);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "buildup" | "rolling" | "result">("idle");
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savedSets, setSavedSets] = useState<Record<string, string[]>>({});
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved sets on mount
  useState(() => { setSavedSets(readLabelSets()); });

  const handleRoll = useCallback(() => {
    if (phase === "buildup" || phase === "rolling") return;

    setPhase("buildup");
    setCurrentIdx(null);
    sound.playBuildUp();

    setTimeout(() => {
      setPhase("rolling");
      sound.playDiceRoll();
      const pool = Array.from({ length: sides }, (_, i) => i);
      let ticks = 0;
      spinRef.current = setInterval(() => {
        setCurrentIdx(Math.floor(Math.random() * sides));
        if (ticks % 2 === 0) sound.playTick(400 + ticks * 15);
        ticks++;
        if (ticks >= 18) {
          if (spinRef.current) clearInterval(spinRef.current);
          let final: number;
          if (noRepeat) {
            const available = pool.filter((i) => !usedIndices.includes(i));
            if (available.length === 0) {
              final = Math.floor(Math.random() * sides);
              setUsedIndices([final]);
            } else {
              final = available[Math.floor(Math.random() * available.length)];
              setUsedIndices((prev) => [...prev, final]);
            }
          } else {
            final = Math.floor(Math.random() * sides);
          }
          setCurrentIdx(final);
          setPhase("result");
          sound.playReveal();
          flashFn("rgba(255, 215, 0, 0.7)");
          shake(2);
          burstConfetti(80, 50, 40);
          setTimeout(() => burstConfetti(50, 30, 50), 300);
        }
      }, 90);
    }, 1500);
  }, [phase, sides, noRepeat, usedIndices, sound, flashFn, shake, burstConfetti]);

  const handleReset = useCallback(() => {
    if (spinRef.current) clearInterval(spinRef.current);
    setPhase("idle");
    setCurrentIdx(null);
    setUsedIndices([]);
    sound.playClick();
  }, [sound]);

  const handleSidesChange = (newSides: number) => {
    const clamped = Math.max(2, Math.min(100, newSides));
    setSides(clamped);
    if (labelMode === "numbers") {
      setLabels(Array.from({ length: clamped }, (_, i) => String(i + 1)));
    } else {
      if (clamped > labels.length) {
        setLabels((prev) => [...prev, ...Array.from({ length: clamped - prev.length }, (_, i) => `Item ${prev.length + i + 1}`)]);
      } else {
        setLabels((prev) => prev.slice(0, clamped));
      }
    }
    setUsedIndices([]);
    setCurrentIdx(null);
    setPhase("idle");
  };

  // ===== Themed Dice Presets (story cubes, movement dice, etc.) =====
  const loadDicePreset = (presetName: string) => {
    const presets: Record<string, string[]> = {
      "story-cubes": ["Once upon a time", "Suddenly", "Meanwhile", "Luckily", "Unfortunately", "In the end"],
      "movement": ["Jump", "Spin", "Hop", "Clap", "Stomp", "Touch toes"],
      "emotions": ["Happy", "Sad", "Angry", "Scared", "Surprised", "Silly"],
      "colors": ["Red", "Blue", "Green", "Yellow", "Purple", "Orange"],
      "animals": ["Lion", "Elephant", "Monkey", "Rabbit", "Tiger", "Snake"],
      "weather": ["Sunny", "Rainy", "Snowy", "Windy", "Stormy", "Cloudy"],
      "directions": ["Forward", "Backward", "Left", "Right", "Up", "Down"],
      "exercises": ["5 Jumping Jacks", "3 Push-ups", "10 Squats", "5 Sit-ups", "30s Plank", "10 Lunges"],
      "questions": ["Why?", "How?", "When?", "Where?", "Who?", "What?"],
      "feelings": ["I love", "I hate", "I like", "I want", "I need", "I feel"],
    };
    const presetLabels = presets[presetName];
    if (presetLabels) {
      setSides(presetLabels.length);
      setLabels(presetLabels);
      setLabelMode("words");
      setUsedIndices([]);
      setCurrentIdx(null);
      setPhase("idle");
      sound.playClick();
    }
  };

  const DICE_PRESETS = [
    { id: "story-cubes", label: "📖 Story", emoji: "📖" },
    { id: "movement", label: "🏃 Movement", emoji: "🏃" },
    { id: "emotions", label: "😊 Emotions", emoji: "😊" },
    { id: "colors", label: "🎨 Colors", emoji: "🎨" },
    { id: "animals", label: "🐘 Animals", emoji: "🐘" },
    { id: "weather", label: "🌤️ Weather", emoji: "🌤️" },
    { id: "directions", label: "➡️ Directions", emoji: "➡️" },
    { id: "exercises", label: "💪 Exercises", emoji: "💪" },
    { id: "questions", label: "❓ Questions", emoji: "❓" },
    { id: "feelings", label: "❤️ Feelings", emoji: "❤️" },
  ];

  const switchLabelMode = (mode: LabelMode) => {
    setLabelMode(mode);
    if (mode === "numbers") {
      setLabels(Array.from({ length: sides }, (_, i) => String(i + 1)));
    } else {
      setLabels(Array.from({ length: sides }, (_, i) => labels[i] || `Item ${i + 1}`));
    }
    setUsedIndices([]);
    setCurrentIdx(null);
    setPhase("idle");
    sound.playClick();
  };

  const handleLabelChange = (idx: number, value: string) => {
    setLabels((prev) => prev.map((l, i) => (i === idx ? value : l)));
  };

  const handleSaveLabels = () => {
    const name = saveName.trim() || `Set ${Object.keys(savedSets).length + 1}`;
    const updated = { ...savedSets, [name]: [...labels] };
    writeLabelSets(updated);
    setSavedSets(updated);
    setSaveName("");
    setShowSaveDialog(false);
    sound.playClick();
  };

  const handleLoadLabels = (name: string) => {
    const set = savedSets[name];
    if (set) {
      setLabels(set);
      setSides(set.length);
      setLabelMode("words");
      setUsedIndices([]);
      setCurrentIdx(null);
      setPhase("idle");
      setShowLoadDialog(false);
      sound.playClick();
    }
  };

  const handleDeleteSet = (name: string) => {
    const updated = { ...savedSets };
    delete updated[name];
    writeLabelSets(updated);
    setSavedSets(updated);
    sound.playClick();
  };

  const allExhausted = noRepeat && usedIndices.length >= sides;
  const displayValue = currentIdx !== null ? (labels[currentIdx] || `Item ${currentIdx + 1}`) : "?";

  // Font size based on label length — much bigger for short labels
  const getFontSize = () => {
    const len = displayValue.length;
    if (len <= 1) return "text-[8rem] sm:text-[10rem]";
    if (len <= 2) return "text-[7rem] sm:text-[9rem]";
    if (len <= 3) return "text-6xl sm:text-7xl";
    if (len <= 6) return "text-4xl sm:text-5xl";
    if (len <= 10) return "text-3xl sm:text-4xl";
    return "text-xl sm:text-2xl";
  };

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Configuration */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {/* Sides */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Sides:</span>
          <button onClick={() => handleSidesChange(sides - 1)} className="w-9 h-9 rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20 flex items-center justify-center">
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-2xl font-black text-white w-10 text-center">{sides}</span>
          <button onClick={() => handleSidesChange(sides + 1)} className="w-9 h-9 rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20 flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Label mode */}
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-white/80 uppercase tracking-wider mr-1">Type:</span>
          <button onClick={() => switchLabelMode("numbers")} className={cn("px-3 py-1.5 rounded-full text-xs font-bold border transition-all", labelMode === "numbers" ? "bg-white text-slate-900 border-white scale-105" : "bg-white/10 text-white border-white/25 hover:bg-white/20")}>Numbers</button>
          <button onClick={() => switchLabelMode("words")} className={cn("px-3 py-1.5 rounded-full text-xs font-bold border transition-all", labelMode === "words" ? "bg-white text-slate-900 border-white scale-105" : "bg-white/10 text-white border-white/25 hover:bg-white/20")}>Words/Names</button>
        </div>

        {/* No-repeat */}
        <button onClick={() => { setNoRepeat(!noRepeat); setUsedIndices([]); sound.playClick(); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all", noRepeat ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/50" : "bg-white/10 text-white border-white/25 hover:bg-white/20")}>
          {noRepeat && <Check className="h-4 w-4" />} No-Repeat
        </button>

        {/* Label editor + save/load */}
        {labelMode === "words" && (
          <>
            <Button onClick={() => setShowLabelEditor(!showLabelEditor)} variant="outline" size="sm" className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white">
              Edit Labels
            </Button>
            <Button onClick={() => setShowSaveDialog(!showSaveDialog)} variant="outline" size="sm" className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white">
              <Save className="mr-1 h-3.5 w-3.5" /> Save Set
            </Button>
            <Button onClick={() => { setShowLoadDialog(!showLoadDialog); setSavedSets(readLabelSets()); }} variant="outline" size="sm" className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white">
              <FolderOpen className="mr-1 h-3.5 w-3.5" /> Load Set
              {Object.keys(savedSets).length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{Object.keys(savedSets).length}</span>}
            </Button>
          </>
        )}
      </div>

      {/* Quick Select — preset sides for fast access to higher numbers */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs font-bold text-white/60 uppercase tracking-wider mr-1">Quick:</span>
        {[6, 10, 20, 40, 60, 80, 100].map((n) => (
          <button
            key={n}
            onClick={() => handleSidesChange(n)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
              sides === n
                ? "bg-emerald-500 text-white border-emerald-400 scale-105 shadow-lg"
                : "bg-white/10 text-white border-white/25 hover:bg-white/20 hover:scale-105",
            )}
            title={`Set dice to ${n} sides`}
          >
            d{n}
          </button>
        ))}
      </div>

      {/* Themed Dice Presets — story cubes, movement, emotions, etc. */}
      <div className="w-full max-w-2xl p-3 rounded-2xl bg-black/20 border border-white/10">
        <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 text-center">
          🎲 Themed Dice Presets
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {DICE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadDicePreset(preset.id)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-white border border-indigo-400/30 hover:from-indigo-500/50 hover:to-purple-500/50 hover:scale-105 transition-all shadow-lg"
              title={`Load ${preset.label} dice preset`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-black/30 border border-white/10">
          <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Save current labels as:</p>
          <div className="flex gap-2">
            <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveLabels()} placeholder='e.g. "Student Names", "Vocab Words"' className="bg-white/10 border-white/20 text-white placeholder:text-white/40" autoFocus />
            <Button onClick={handleSaveLabels} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"><Save className="h-4 w-4" /></Button>
            <Button onClick={() => setShowSaveDialog(false)} size="sm" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white shrink-0">Cancel</Button>
          </div>
        </div>
      )}

      {/* Load dialog */}
      {showLoadDialog && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-black/30 border border-white/10">
          <p className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider">{Object.keys(savedSets).length > 0 ? "Select a saved label set to load" : "No saved sets yet — save your labels first!"}</p>
          {Object.keys(savedSets).length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(savedSets).map(([name, setLabels]) => (
                <div key={name} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white text-sm">{name}</span>
                    <span className="text-xs text-white/50 ml-2">{setLabels.length} labels</span>
                    <p className="text-xs text-white/40 truncate">{setLabels.slice(0, 5).join(", ")}{setLabels.length > 5 ? "..." : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => handleLoadLabels(name)} size="sm" className="bg-white text-slate-900 hover:bg-white/90 h-7 text-xs">Load</Button>
                    <button onClick={() => handleDeleteSet(name)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button onClick={() => setShowLoadDialog(false)} size="sm" variant="outline" className="mt-3 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white">Close</Button>
        </div>
      )}

      {/* Label editor */}
      {showLabelEditor && labelMode === "words" && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-black/30 border border-white/10">
          <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Custom labels for each side (max 15 chars)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {labels.map((label, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white/50 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <Input value={label} onChange={(e) => handleLabelChange(i, e.target.value.slice(0, 15))} placeholder={`Side ${i + 1}`} className="bg-white/10 border-white/20 text-white text-sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No-repeat history */}
      {noRepeat && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-sm text-white/70">Used:</span>
          <div className="flex gap-1 flex-wrap">
            {labels.map((label, i) => (
              <span key={i} className={cn("px-2 py-1 rounded-full text-xs font-bold border", usedIndices.includes(i) ? "bg-emerald-500/40 text-emerald-200 border-emerald-400/50 line-through" : "bg-white/10 text-white/60 border-white/20")}>
                {label.length > 8 ? label.slice(0, 8) + "…" : label}
              </span>
            ))}
          </div>
          {usedIndices.length > 0 && <button onClick={() => { setUsedIndices([]); sound.playClick(); }} className="text-xs text-white/50 hover:text-white underline ml-1">reset</button>}
        </div>
      )}

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full max-w-md mx-auto h-[28rem] sm:h-[34rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br", skin.bgGradient)}>
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={5} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Build-up */}
          {phase === "buildup" && (
            <>
              <div className="absolute inset-0 bg-white/10 animate-[buildUpPulse_0.6s_ease-in-out_infinite]" />
              <div className="absolute inset-8 rounded-3xl border-4 border-white/40 animate-[buildUpPulse_0.8s_ease-in-out_infinite]" />
            </>
          )}

          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white/30" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: `${(i % 3) + 1}px`, height: `${(i % 3) + 1}px`, animation: `particleFloat ${(i % 3) + 2}s ease-in-out ${(i % 3) * 0.5}s infinite alternate` }} />
            ))}
          </div>

          <div className="relative z-10 text-center flex flex-col items-center gap-4">
            <div className={cn("mx-auto w-56 h-56 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-br from-white to-slate-100 flex items-center justify-center shadow-2xl border-4 border-white relative overflow-hidden", phase === "rolling" && "animate-[diceTumble_0.3s_linear_infinite]", phase === "buildup" && "animate-[vibrate_0.1s_linear_infinite] scale-90", phase === "result" && "animate-[revealPulse_0.6s_ease-out]")}>
              <div className="absolute top-4 left-6 w-14 h-7 rounded-full bg-white/60 blur-sm pointer-events-none" />
              <span className={cn("relative text-slate-800 font-black drop-shadow-2xl break-words px-3 text-center leading-none", getFontSize())}>
                {displayValue}
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
              {allExhausted ? "🎉 All sides rolled!" : phase === "result" ? `${displayValue}!` : phase === "buildup" ? "Get ready..." : phase === "rolling" ? "Rolling..." : "Ready?"}
            </p>
            {noRepeat && !allExhausted && phase === "idle" && (
              <p className="text-base text-white/70 mt-2">{sides - usedIndices.length} of {sides} remaining</p>
            )}

            {/* ===== Roll / Next Roll button — INSIDE the dice container border ===== */}
            {phase === "idle" && (
              <Button onClick={handleRoll} disabled={allExhausted} size="lg" className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg">
                <Play className="mr-2 h-5 w-5 fill-current" /> Roll d{sides}
              </Button>
            )}
            {(phase === "buildup" || phase === "rolling") && (
              <Button disabled size="lg" className="rounded-full px-8 bg-white/30 text-white">
                {phase === "buildup" ? "⚡ Building up..." : "Rolling..."}
              </Button>
            )}
            {phase === "result" && (
              <Button onClick={handleRoll} disabled={allExhausted} size="lg" className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg">
                <Play className="mr-2 h-5 w-5 fill-current" /> Next Roll
              </Button>
            )}
          </div>

          {phase === "result" && (
            <>
              <div className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-4 border-white/60 pointer-events-none animate-[glowRingExpand_0.8s_ease-out]" />
              <div className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-2 border-yellow-300/60 pointer-events-none animate-[glowRingExpand_1.2s_ease-out_0.15s]" />
            </>
          )}

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Controls — Reset button only (Roll/Next Roll is now INSIDE the dice container) */}
      {phase === "result" && (
        <div className="flex gap-3 justify-center">
          <Button onClick={handleReset} size="lg" variant="outline" className="rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white">
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>
      )}
    </div>
  );
}

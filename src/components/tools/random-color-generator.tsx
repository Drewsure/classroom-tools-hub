"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import { Play, RotateCcw, Plus, Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

// Preset color palette table
const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#71717a", "#1e293b",
  "#fef08a", "#bbf7d0", "#bfdbfe", "#ddd6fe", "#fce7f3",
  "#fed7aa", "#a7f3d0", "#bae6fd", "#c7d2fe", "#fbcfe8",
];

function randomColor(): string {
  const hex = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) color += hex[Math.floor(Math.random() * 16)];
  return color;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#1e293b" : "#ffffff";
}

export function RandomColorGenerator() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const { skinId, setSkinId, skin } = useToolSkin("color-generator");

  const [currentColor, setCurrentColor] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "buildup" | "spinning" | "result">("idle");
  const [selectedPalette, setSelectedPalette] = useState<Set<string>>(new Set(COLOR_PALETTE.slice(0, 12)));
  const [showPalette, setShowPalette] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const togglePaletteColor = (color: string) => {
    setSelectedPalette((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  };

  const handleGenerate = useCallback(() => {
    if (phase === "buildup" || phase === "spinning") return;
    const pool = Array.from(selectedPalette);
    if (pool.length === 0) return;

    setPhase("buildup");
    setCurrentColor(null);
    sound.playBuildUp();

    setTimeout(() => {
      setPhase("spinning");
      sound.playWhoosh();
      let ticks = 0;
      const interval = setInterval(() => {
        setCurrentColor(pool[Math.floor(Math.random() * pool.length)]);
        sound.playTick(400 + ticks * 20);
        ticks++;
        if (ticks >= 20) {
          clearInterval(interval);
          const final = pool[Math.floor(Math.random() * pool.length)];
          setCurrentColor(final);
          setHistory((prev) => [final, ...prev].slice(0, 12));
          setPhase("result");
          sound.playReveal();
          flashFn(final + "cc");
          shake(2);
          burstConfetti(80, 50, 40);
        }
      }, 80);
    }, 1500);
  }, [phase, selectedPalette, sound, flashFn, shake, burstConfetti]);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setCurrentColor(null);
    setHistory([]);
    sound.playClick();
  }, [sound]);

  const isBusy = phase === "buildup" || phase === "spinning";

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Color palette selector */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
            Color Pool ({selectedPalette.size} colors)
          </h3>
          <Button
            onClick={() => setShowPalette(!showPalette)}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <Palette className="mr-1 h-4 w-4" />
            {showPalette ? "Hide" : "Edit"} Colors
          </Button>
        </div>

        {showPalette && (
          <div className="mb-4 p-4 rounded-2xl bg-black/30 border border-white/10">
            <p className="text-xs text-white/60 mb-3">Click colors to include/exclude from the random pool:</p>
            <div className="grid grid-cols-10 gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => togglePaletteColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 transition-all relative",
                    selectedPalette.has(color)
                      ? "border-white scale-100 shadow-lg"
                      : "border-white/20 opacity-30 scale-90",
                  )}
                  style={{ background: color }}
                >
                  {selectedPalette.has(color) && (
                    <Check className="absolute inset-0 m-auto h-4 w-4" style={{ color: getContrastColor(color) }} />
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => setSelectedPalette(new Set(COLOR_PALETTE))}
                size="sm"
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                Select All
              </Button>
              <Button
                onClick={() => setSelectedPalette(new Set())}
                size="sm"
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Selected colors preview */}
        {!showPalette && (
          <div className="flex flex-wrap gap-1">
            {Array.from(selectedPalette).slice(0, 20).map((color) => (
              <div
                key={color}
                className="w-6 h-6 rounded-md border border-white/20"
                style={{ background: color }}
              />
            ))}
            {selectedPalette.size > 20 && (
              <span className="text-xs text-white/50 self-center">+{selectedPalette.size - 20} more</span>
            )}
          </div>
        )}
      </div>

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full max-w-md mx-auto h-80 sm:h-96 rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br", skin.bgGradient)}>
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={11} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Build-up */}
          {phase === "buildup" && (
            <>
              <div className="absolute inset-0 bg-white/10 animate-[buildUpPulse_0.6s_ease-in-out_infinite]" />
              <div className="absolute inset-8 rounded-full border-4 border-white/40 animate-[buildUpPulse_0.8s_ease-in-out_infinite]" />
            </>
          )}

          {/* Sparkles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white/30"
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 100}%`,
                  width: `${(i % 3) + 1}px`,
                  height: `${(i % 3) + 1}px`,
                  animation: `particleFloat ${(i % 3) + 2}s ease-in-out ${(i % 3) * 0.5}s infinite alternate`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 text-center">
            {currentColor && (phase === "spinning" || phase === "result") ? (
              <div className="flex flex-col items-center gap-4">
                {/* Color display */}
                <div
                  className={cn(
                    "w-48 h-48 sm:w-64 sm:h-64 rounded-3xl shadow-2xl border-4 border-white/30 flex items-center justify-center",
                    phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
                  )}
                  style={{ background: currentColor }}
                >
                  <div className="text-center" style={{ color: getContrastColor(currentColor) }}>
                    <p className="text-2xl font-black uppercase">{currentColor}</p>
                    <p className="text-sm opacity-70 mt-1">
                      RGB({hexToRgb(currentColor).r}, {hexToRgb(currentColor).g}, {hexToRgb(currentColor).b})
                    </p>
                  </div>
                </div>
                <p className="text-xl font-black text-white">
                  {phase === "result" ? "Your Color!" : "Spinning..."}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🎨</div>
                <p className="text-2xl font-bold text-white mb-2">Random Color Generator</p>
                <p className="text-white/70 mb-4">{selectedPalette.size} colors in pool</p>
                <Button
                  onClick={handleGenerate}
                  disabled={selectedPalette.size === 0}
                  size="lg"
                  className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Generate Color!
                </Button>
              </div>
            )}
          </div>

          {phase === "result" && (
            <>
              <div className="absolute left-1/2 top-1/2 w-48 h-48 rounded-full border-4 border-white/60 pointer-events-none animate-[glowRingExpand_0.8s_ease-out]" />
            </>
          )}

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Controls */}
      {(phase === "result" || isBusy) && (
        <div className="flex gap-3 justify-center">
          {isBusy ? (
            <Button disabled size="lg" className="rounded-full px-8 bg-white/30 text-white">
              {phase === "buildup" ? "⚡ Building up..." : "Spinning..."}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleGenerate}
                size="lg"
                className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 shadow-lg"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Another
              </Button>
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="w-full max-w-2xl">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">History</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((color, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-sm cursor-pointer"
                style={{ background: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

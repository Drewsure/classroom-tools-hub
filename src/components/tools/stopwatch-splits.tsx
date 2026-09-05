"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStopwatch } from "@/hooks/use-timer";
import { useDramaticSound, useConfetti, useFlash } from "@/hooks/use-effects";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import { Pause, Play, RotateCcw, Flag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Split {
  id: number;
  totalMs: number;
  lapMs: number;
  label: string;
}

export function StopwatchSplits() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();

  const sw = useStopwatch();
  const { skinId, setSkinId, skin } = useToolSkin("stopwatch-splits");
  const [splits, setSplits] = useState<Split[]>([]);
  const [justSplit, setJustSplit] = useState(false);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds)}.${pad(centiseconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  const handleStart = () => {
    sw.start();
    sound.playClick();
  };

  const handlePause = () => {
    sw.pause();
    sound.playClick();
  };

  const handleReset = () => {
    sw.reset();
    setSplits([]);
    sound.playClick();
  };

  const handleSplit = () => {
    if (!sw.running) return;
    const lastTotal = splits.length > 0 ? splits[0].totalMs : 0;
    const lapMs = sw.elapsed - lastTotal;
    const newSplit: Split = {
      id: Date.now(),
      totalMs: sw.elapsed,
      lapMs,
      label: `Split ${splits.length + 1}`,
    };
    setSplits((prev) => [newSplit, ...prev]);
    sound.playSparkle();
    flashFn("rgba(168, 85, 247, 0.4)");
    setJustSplit(true);
    setTimeout(() => setJustSplit(false), 300);
    burstConfetti(30, 50, 40);
  };

  const removeSplit = (id: number) => {
    setSplits((prev) => prev.filter((s) => s.id !== id));
    sound.playClick();
  };

  // Find best and worst lap
  const lapTimes = splits.map((s) => s.lapMs);
  const bestLap = lapTimes.length > 0 ? Math.min(...lapTimes) : null;
  const worstLap = lapTimes.length > 0 ? Math.max(...lapTimes) : null;

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <UniversalSkinPicker current={skinId} onChange={setSkinId} />
      <ShakeWrapper intensity={0}>
        <div className={cn("relative w-full max-w-md mx-auto h-72 sm:h-80 rounded-3xl overflow-hidden border-4 border-white/15 shadow-2xl flex flex-col items-center justify-center bg-gradient-to-br", skin.bgGradient)}>
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={11} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Pulse glow when running */}
          <div
            className={cn(
              "absolute inset-4 rounded-full blur-2xl transition-opacity",
              sw.running
                ? "bg-cyan-400/50 opacity-80 animate-[dramaticPulse_2s_ease-in-out_infinite]"
                : "bg-cyan-400/20 opacity-40",
            )}
          />

          {/* Pulse rings when running */}
          {sw.running && (
            <>
              <div className="absolute w-64 h-64 rounded-full border-2 border-cyan-300/30 animate-[pulseRing_2s_ease-out_infinite]" />
              <div className="absolute w-64 h-64 rounded-full border-2 border-cyan-300/30 animate-[pulseRing_2s_ease-out_infinite]"
                style={{ animationDelay: "1s" }} />
            </>
          )}

          <div className="relative z-10 text-center">
            <div className="font-mono font-black tabular-nums text-white text-5xl sm:text-7xl drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">
              {formatTime(sw.elapsed)}
            </div>
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-cyan-200/80">
              {sw.running ? "▶ Running" : sw.elapsed > 0 ? "⏸ Paused" : "Ready"}
            </p>
          </div>

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {!sw.running ? (
          <Button
            onClick={handleStart}
            size="lg"
            className="rounded-full px-8 bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50"
          >
            <Play className="mr-2 h-5 w-5 fill-current" />
            {sw.elapsed > 0 ? "Resume" : "Start"}
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            size="lg"
            className="rounded-full px-8 bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
          >
            <Pause className="mr-2 h-5 w-5 fill-current" />
            Pause
          </Button>
        )}
        <Button
          onClick={handleSplit}
          disabled={!sw.running}
          size="lg"
          variant="outline"
          className={cn(
            "rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white transition-transform",
            justSplit && "scale-95 bg-purple-500/40",
          )}
        >
          <Flag className="mr-2 h-5 w-5" />
          Split
        </Button>
        <Button
          onClick={handleReset}
          size="lg"
          variant="outline"
          className="rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset
        </Button>
      </div>

      {/* Splits list */}
      {splits.length > 0 && (
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-black/30 border border-white/10 overflow-hidden shadow-xl">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-xs font-semibold text-white/60 uppercase tracking-wider grid grid-cols-12 gap-2">
              <span className="col-span-2">#</span>
              <span className="col-span-5">Lap Time</span>
              <span className="col-span-4">Total</span>
              <span className="col-span-1"></span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {splits.map((split, idx) => {
                const splitNum = splits.length - idx;
                const isBest = split.lapMs === bestLap && splits.length > 1;
                const isWorst = split.lapMs === worstLap && splits.length > 1;
                return (
                  <div
                    key={split.id}
                    className={cn(
                      "px-4 py-2.5 grid grid-cols-12 gap-2 items-center border-b border-white/5 last:border-0 font-mono text-white/90 transition-colors",
                      isBest && "bg-emerald-500/15",
                      isWorst && "bg-red-500/10",
                      justSplit && idx === 0 && "bg-purple-500/20",
                    )}
                  >
                    <span className="col-span-2 flex items-center gap-1">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isBest ? "text-emerald-300" : isWorst ? "text-red-300" : "text-cyan-300",
                        )}
                      >
                        #{splitNum}
                      </span>
                      {isBest && <span className="text-xs">🏆</span>}
                      {isWorst && <span className="text-xs">🐢</span>}
                    </span>
                    <span className="col-span-5 text-sm tabular-nums text-white">
                      {formatTime(split.lapMs)}
                    </span>
                    <span className="col-span-4 text-sm tabular-nums text-white/60">
                      {formatTime(split.totalMs)}
                    </span>
                    <button
                      onClick={() => removeSplit(split.id)}
                      className="col-span-1 text-white/30 hover:text-red-400 transition-colors justify-self-end"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {splits.length > 1 && (
            <p className="mt-2 text-xs text-white/40 text-center">
              🏆 = fastest split · 🐢 = slowest split
            </p>
          )}
        </div>
      )}
    </div>
  );
}

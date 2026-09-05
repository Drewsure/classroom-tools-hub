"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStopwatch } from "@/hooks/use-timer";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { SKINS, SkinPicker, SkinParticleField, SkinSceneDecorator, useSavedSkin } from "@/lib/skins";
import { formatStopwatchTime } from "@/lib/timers";
import { Pause, Play, RotateCcw, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stopwatch() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const { skinId, setSkinId } = useSavedSkin("stopwatch");
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  const [justLapped, setJustLapped] = useState(false);
  const sw = useStopwatch();

  const handleStart = () => {
    sw.start();
    sound.playClick();
    sound.playWhoosh();
  };
  const handlePause = () => {
    sw.pause();
    sound.playClick();
  };
  const handleReset = () => {
    sw.reset();
    sound.playClick();
  };
  const handleLap = () => {
    sw.lap();
    sound.playSparkle();
    flashFn(skin.flashColor);
    shake(0.4);
    setJustLapped(true);
    setTimeout(() => setJustLapped(false), 300);
  };

  const formatted = formatStopwatchTime(sw.elapsed);

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="stopwatch" />

      <ShakeWrapper intensity={shakeIntensity}>
        <div
          className={cn(
            "relative w-full max-w-md mx-auto h-72 sm:h-80 rounded-full flex items-center justify-center border-4 shadow-2xl backdrop-blur-sm bg-gradient-to-br overflow-hidden",
            skin.bgGradient,
            sw.running ? "border-white/40" : "border-white/20",
          )}
        >
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={3} />

          {/* Pulsing glow */}
          <div
            className="absolute inset-4 rounded-full blur-2xl transition-opacity"
            style={{
              background: sw.running
                ? `${skin.accent}80`
                : `${skin.accent}30`,
              opacity: sw.running ? 0.8 : 0.4,
              animation: sw.running
                ? "dramaticPulse 2s ease-in-out infinite"
                : undefined,
            }}
          />

          {/* Pulse rings when running */}
          {sw.running && (
            <>
              <div className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-white/30 animate-[pulseRing_2s_ease-out_infinite]" />
              <div
                className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-white/30 animate-[pulseRing_2s_ease-out_infinite]"
                style={{ animationDelay: "1s" }}
              />
            </>
          )}

          <div className="relative text-center z-10">
            <div className="font-mono font-black tabular-nums text-white text-5xl sm:text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
              {formatted}
            </div>
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/80">
              {sw.running ? "▶ Running" : "⏸ Paused"}
            </p>
          </div>

          {/* Start/Pause button — INSIDE the container */}
          <div className="relative z-10 mt-2">
            {!sw.running ? (
              <Button
                onClick={handleStart}
                size="lg"
                className={cn("rounded-full px-8 text-white shadow-lg", skin.accentButton)}
              >
                <Play className="mr-2 h-5 w-5 fill-current" />
                {sw.elapsed > 0 ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="lg"
                className="rounded-full px-8 text-white shadow-lg bg-amber-500 hover:bg-amber-600"
              >
                <Pause className="mr-2 h-5 w-5 fill-current" />
                Pause
              </Button>
            )}
          </div>

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Lap + Reset buttons — OUTSIDE the container */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button
          onClick={handleLap}
          disabled={!sw.running}
          size="lg"
          variant="outline"
          className={cn(
            "rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white transition-transform shadow-lg",
            justLapped && "scale-95 bg-white/30",
          )}
        >
          <Flag className="mr-2 h-5 w-5" />
          Lap
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

      {sw.laps.length > 0 && (
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-black/30 border border-white/10 overflow-hidden shadow-xl">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-xs font-semibold text-white/60 uppercase tracking-wider flex justify-between">
              <span>Lap</span>
              <span>Time</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {[...sw.laps].reverse().map((lap, idx) => {
                const lapNum = sw.laps.length - idx;
                const isBest = lap === Math.min(...sw.laps);
                const isWorst = lap === Math.max(...sw.laps) && sw.laps.length > 1;
                return (
                  <div
                    key={lapNum}
                    className={cn(
                      "px-4 py-2.5 flex justify-between items-center border-b border-white/5 last:border-0 font-mono text-white/90 transition-colors",
                      isBest && "bg-emerald-500/15",
                      isWorst && "bg-red-500/10",
                      justLapped && idx === 0 && "bg-white/20",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isBest ? "text-emerald-300" : isWorst ? "text-red-300" : "text-white/80",
                        )}
                      >
                        #{lapNum}
                      </span>
                      {isBest && <span className="text-xs">🏆</span>}
                      {isWorst && <span className="text-xs">🐢</span>}
                    </span>
                    <span className="text-sm tabular-nums">
                      {formatStopwatchTime(lap)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {sw.laps.length > 1 && (
            <p className="mt-2 text-xs text-white/40 text-center">
              🏆 = fastest lap · 🐢 = slowest lap
            </p>
          )}
        </div>
      )}
    </div>
  );
}

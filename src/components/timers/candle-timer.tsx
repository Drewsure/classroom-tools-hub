"use client";

import { useState } from "react";
import { TimerControls, TimerStartButton } from "./timer-controls";
import { useTimer } from "@/hooks/use-timer";
import { useTimerAudio } from "@/hooks/use-timer-audio";
import {
  useConfetti,
  useFlash,
  useScreenShake,
} from "@/hooks/use-effects";
import {
  ConfettiOverlay,
  FlashOverlay,
  ShakeWrapper,
  DramaticCountdown,
} from "@/components/effects/effect-overlays";
import { SKINS, SkinPicker, SkinParticleField, SkinSceneDecorator, useSavedSkin } from "@/lib/skins";
import { formatTime } from "@/lib/timers";
import { cn } from "@/lib/utils";

// Stable ember positions (pre-computed so CSS animations don't break)
const EMBER_SPARKS = Array.from({ length: 3 }, () => ({
  left: 50 + (Math.random() - 0.5) * 60,
  sparkX: (Math.random() - 0.5) * 20,
  sparkY: -Math.random() * 20 - 5,
}));

export function CandleTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("candle");
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];
  const [smokeTrail, setSmokeTrail] = useState<number[]>([]);

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, candle puff alarm
  useTimerAudio(
    "candle",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    () => {
      flashFn(skin.flashColor);
      shake(1.2);
      burstConfetti(60, 50, 35);
      setSmokeTrail([0, 1, 2, 3, 4, 5]);
      setTimeout(() => setSmokeTrail([]), 3500);
    },
  );

  // Derived: show big countdown number in last 5 seconds
  const showCountdown =
    timer.isRunning && timer.remaining <= 5 && timer.remaining > 0;

  const handleStart = () => {
    if (totalInput <= 0) return;
    timer.start(totalInput);
  };

  const handlePreset = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    setHours(h);
    setMinutes(m);
    setSeconds(sec);
    timer.setTime(s);
  };

  const handleReset = () => {
    setSmokeTrail([]);
    timer.reset(totalInput);
  };

  const { display } = formatTime(timer.remaining);
  const progress = timer.progress;
  const isOut = timer.isCompleted;
  const lowTime = timer.remaining <= 10 && timer.remaining > 0;
  const veryLow = timer.remaining <= 5 && timer.remaining > 0;

  const candleHeight = Math.max(60, 240 - progress * 180);

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="candle" />
      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-b", skin.bgGradient)}>
          {/* Themed ambient particles */}
          <SkinParticleField skin={skin} seed={6} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Ambient glow from candle */}
          {!isOut && (
            <div
              className={cn(
                "absolute rounded-full blur-3xl pointer-events-none transition-all duration-500",
                veryLow
                  ? "bg-red-500/50 animate-[dramaticPulse_0.5s_ease-in-out_infinite]"
                  : lowTime
                    ? "bg-orange-500/50"
                    : "bg-amber-400/50",
              )}
              style={{
                left: "50%",
                top: "30%",
                transform: "translate(-50%, -50%)",
                width: "260px",
                height: "260px",
              }}
            />
          )}

          {/* Floor */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-b from-stone-700 to-stone-900" />

          {/* Smoke trail when snuffed */}
          {smokeTrail.map((id) => (
            <div
              key={id}
              className="absolute left-1/2 bottom-32 w-8 h-8 rounded-full bg-stone-400/60 blur-md pointer-events-none"
              style={{
                animation: `smokeRiseBig 3s ease-out forwards`,
                animationDelay: `${id * 0.25}s`,
                ["--drift" as string]: `${(id - 2.5) * 25}px`,
              } as React.CSSProperties}
            />
          ))}

          {/* Time display */}
          <div className="absolute top-4 left-0 right-0 text-center pointer-events-none z-10">
            <div
              className={cn(
                "inline-block px-6 py-3 rounded-2xl backdrop-blur-sm border",
                isOut
                  ? "bg-stone-900/60 border-stone-600/50"
                  : veryLow
                    ? "bg-red-900/60 border-red-400/50 animate-[strobeUrgent_0.4s_ease-in-out_infinite]"
                    : lowTime
                      ? "bg-orange-900/50 border-orange-400/50"
                      : "bg-black/50 border-white/20",
              )}
            >
              <div
                className={cn(
                  "font-mono font-black text-4xl sm:text-5xl lg:text-7xl xl:text-8xl tabular-nums drop-shadow-lg",
                  isOut ? "text-stone-400" : veryLow ? "text-red-300 animate-[dramaticPulse_0.5s_ease-in-out_infinite]" : lowTime ? "text-orange-300" : "text-amber-100",
                )}
              >
                {isOut ? "SNUFFED!" : display}
              </div>
            </div>
          </div>

          {/* Dramatic countdown */}
          {showCountdown && !isOut && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <DramaticCountdown
                number={timer.remaining}
                className="text-[160px] font-black text-orange-300 drop-shadow-[0_0_30px_rgba(251,146,60,1)]"
              />
            </div>
          )}

          {/* Candle */}
          <div className="absolute left-1/2 bottom-10 -translate-x-1/2 flex flex-col items-center z-10">
            {/* Flame */}
            {!isOut && (
              <div className="relative mb-1">
                {/* Outer glow */}
                <div className="absolute inset-0 -m-4 rounded-full bg-yellow-400/60 blur-lg animate-pulse" />
                <div className="absolute inset-0 -m-2 rounded-full bg-orange-400/40 blur-sm animate-pulse" />
                {/* Flame shape */}
                <div
                  className={cn(
                    "relative w-5 h-9 transition-all",
                    veryLow
                      ? "animate-[flicker_0.15s_ease-in-out_infinite]"
                      : lowTime
                        ? "animate-[flicker_0.25s_ease-in-out_infinite]"
                        : "animate-[flicker_0.4s_ease-in-out_infinite]",
                  )}
                  style={{
                    background:
                      "radial-gradient(ellipse at bottom, #fff5b1 0%, #fbbf24 40%, #f97316 80%, #dc2626 100%)",
                    borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%",
                    boxShadow: "0 0 20px rgba(251, 191, 36, 0.7), 0 0 40px rgba(249, 115, 22, 0.5)",
                  }}
                />
                {/* Ember sparks */}
                {veryLow &&
                  EMBER_SPARKS.map((spark, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-orange-300"
                      style={{
                        top: 0,
                        left: `${spark.left}%`,
                        animation: `sparkFly 0.8s ease-out ${i * 0.2}s infinite`,
                        ["--spark-x" as string]: `${spark.sparkX}px`,
                        ["--spark-y" as string]: `${spark.sparkY}px`,
                      } as React.CSSProperties}
                    />
                  ))}
                {/* Wick */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-stone-900" />
              </div>
            )}

            {/* Snuffed wick + smoke */}
            {isOut && (
              <div className="relative mb-1 h-10 flex items-end">
                <div className="w-0.5 h-2 bg-stone-900" />
              </div>
            )}

            {/* Candle body */}
            <div
              className="relative w-16 transition-all duration-500 ease-linear"
              style={{ height: `${candleHeight}px` }}
            >
              <div
                className="absolute inset-0 rounded-md border border-amber-300/50 shadow-inner"
                style={{
                  background:
                    "linear-gradient(to bottom, #fef3c7 0%, #fde68a 40%, #fcd34d 100%)",
                }}
              />
              {/* Wax drip marks */}
              <div className="absolute top-0 left-1 w-1.5 h-5 bg-amber-50 rounded-b-full opacity-80" />
              <div className="absolute top-0 right-2 w-1.5 h-3 bg-amber-50 rounded-b-full opacity-80" />
              {/* Wax pool at top */}
              <div className="absolute -top-1 left-1 right-1 h-2 rounded-full bg-amber-100 shadow-inner" />
              {/* Side highlight */}
              <div className="absolute top-2 bottom-2 left-1 w-1 bg-white/40 rounded-full" />
            </div>

            {/* Holder */}
            <div className="w-24 h-3 bg-gradient-to-b from-stone-600 to-stone-800 rounded-md shadow-lg" />
            <div className="w-32 h-2 bg-gradient-to-b from-stone-700 to-stone-900 rounded-md" />
          </div>

          {/* Confetti */}
          {/* Start/Pause/Resume button — INSIDE the container */}
          <TimerStartButton
            status={timer.status}
            onStart={handleStart}
            onPause={timer.pause}
            onResume={timer.resume}
            accentColor={skin.accentButton}
          />
          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      <TimerControls
        status={timer.status}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        onHoursChange={setHours}
        onMinutesChange={setMinutes}
        onSecondsChange={setSeconds}
        onStart={handleStart}
        onPause={timer.pause}
        onResume={timer.resume}
        onReset={handleReset}
        onPreset={handlePreset}
        accentColor={skin.accentButton}
      />
    </div>
  );
}

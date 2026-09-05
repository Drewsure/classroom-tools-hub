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
import {
  SKINS,
  SkinPicker,
  SkinParticleField,
  SkinSceneDecorator,
  useSavedSkin,
} from "@/lib/skins";
import { formatTime } from "@/lib/timers";
import { cn } from "@/lib/utils";

export function BarTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(3);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("bar");

  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, bar themed alarm
  useTimerAudio(
    "bar",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    () => {
            flashFn(skin.flashColor);
      shake(2);
      burstConfetti(100, 50, 50);
      setTimeout(() => burstConfetti(60, 30, 40), 300);
    },
  );

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
    timer.reset(totalInput);
  };

  const { display } = formatTime(timer.remaining);
  const progress = timer.progress;
  const done = timer.isCompleted;
  const lowTime = timer.remaining <= 10 && timer.remaining > 0;
  const veryLow = timer.remaining <= 5 && timer.remaining > 0;
  const remainingPct = Math.max(0, (1 - progress) * 100);

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="bar" />

      <ShakeWrapper intensity={shakeIntensity}>
        <div
          className={cn(
            "relative w-full h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center px-6 sm:px-10 bg-gradient-to-b",
            skin.bgGradient,
          )}
        >
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={2} />

          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Dramatic countdown */}
          {showCountdown && !done && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <DramaticCountdown
                number={timer.remaining}
                className="text-[160px] font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]"
              />
            </div>
          )}

          {/* Time display */}
          <div className="text-center mb-12 z-10">
            {done ? (
              <div className="text-7xl mb-2 animate-[winnerBounce_0.6s_ease-in-out_infinite]">
                {skin.completionEmoji}
              </div>
            ) : (
              <div
                className={cn(
                  "font-mono font-black tabular-nums drop-shadow-2xl text-6xl sm:text-7xl lg:text-9xl xl:text-[12rem] transition-all text-white",
                  veryLow && "text-red-300 animate-[dramaticPulse_0.5s_ease-in-out_infinite]",
                  lowTime && "text-orange-300",
                )}
              >
                {display}
              </div>
            )}
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-white/80">
              {done
                ? skin.completionMessage
                : timer.isRunning
                  ? veryLow ? "⚡ HURRY! ⚡"
                  : "Running"
                  : timer.isPaused
                    ? "Paused"
                    : "Ready"}
            </p>
          </div>

          {/* Bar container */}
          <div className="w-full max-w-xl z-10">
            <div className="flex justify-between text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
              <span>Start</span>
              <span
                className={cn(
                  veryLow && "text-red-200 animate-[strobeUrgent_0.4s_ease-in-out_infinite]",
                )}
              >
                {Math.round(remainingPct)}% left
              </span>
              <span>End</span>
            </div>
            <div className="relative h-14 rounded-full bg-black/40 border-2 border-white/10 overflow-hidden shadow-inner">
              {/* Progress fill */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-300 ease-linear rounded-full relative overflow-hidden",
                  done
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : veryLow
                      ? "bg-gradient-to-r from-red-500 via-rose-500 to-pink-500"
                      : lowTime
                        ? "bg-gradient-to-r from-orange-400 via-red-500 to-rose-500"
                        : "bg-gradient-to-r",
                )}
                style={{
                  width: `${remainingPct}%`,
                  backgroundSize: "200% 200%",
                  ...(done || lowTime || veryLow
                    ? {}
                    : {
                        backgroundImage: `linear-gradient(to right, ${skin.accent}, ${skin.accent}aa)`,
                      }),
                }}
              >
                {/* Shimmer effect */}
                {timer.isRunning && !done && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_linear_infinite]" />
                )}
                {/* Fire glow on top edge when low */}
                {lowTime && !done && (
                  <div className="absolute -top-2 left-0 right-0 h-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute bottom-0 w-3 h-6 rounded-full bg-gradient-to-t from-orange-500 to-yellow-200 blur-[1px] animate-[flicker_0.3s_ease-in-out_infinite]"
                        style={{
                          left: `${(i / 8) * 100}%`,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              {/* Tick marks */}
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-r border-white/15 last:border-r-0"
                  />
                ))}
              </div>
            </div>

            {/* Mini progress segments below */}
            <div className="mt-4 flex gap-1 z-10">
              {Array.from({ length: 20 }).map((_, i) => {
                const segProgress = i / 20;
                const isFilled = segProgress < 1 - progress;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-colors duration-300",
                      isFilled
                        ? done
                          ? "bg-emerald-400"
                          : veryLow
                            ? "bg-red-400 animate-[strobeUrgent_0.4s_ease-in-out_infinite]"
                            : lowTime
                              ? "bg-orange-400"
                              : ""
                        : "bg-white/10",
                    )}
                    style={
                      isFilled && !done && !lowTime && !veryLow
                        ? { background: skin.accent }
                        : undefined
                    }
                  />
                );
              })}
            </div>
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

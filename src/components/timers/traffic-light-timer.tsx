"use client";

import { useEffect, useState } from "react";
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

export function TrafficLightTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("traffic-light");
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];
  const [sirenCount, setSirenCount] = useState(0);

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, traffic-light themed alarm
  useTimerAudio(
    "traffic-light",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    () => {
      setSirenCount(3);
      flashFn(skin.flashColor);
      shake(3);
      burstConfetti(80, 50, 50);
    },
  );

  const showCountdown =
    timer.isRunning && timer.remaining <= 5 && timer.remaining > 0;

  // Siren countdown — decrements every 1.2s to drive the visual siren pulses
  useEffect(() => {
    if (sirenCount <= 0) return;
    const t = setTimeout(() => {
      setSirenCount((c) => c - 1);
    }, 1200);
    return () => clearTimeout(t);
  }, [sirenCount]);

  const handleStart = () => {
    if (totalInput <= 0) return;
    setSirenCount(0);
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
    setSirenCount(0);
    timer.reset(totalInput);
  };

  const { display } = formatTime(timer.remaining);
  const done = timer.isCompleted;

  const yellowThreshold = Math.min(15, timer.totalSeconds * 0.25);
  const isRed = done;
  const isYellow = !done && timer.isRunning && timer.remaining <= yellowThreshold;
  const isGreen = !done && !isYellow;

  // Time decline progress (0 → 1 as time runs out)
  const progress = timer.progress;
  const remainingPct = Math.max(0, (1 - progress) * 100);

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="traffic-light" />
      <ShakeWrapper intensity={shakeIntensity}>
        <div
          className={cn(
            "relative w-full h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem] rounded-3xl overflow-hidden border-2 shadow-2xl bg-gradient-to-b transition-colors duration-500",
            skin.bgGradient,
            isRed
              ? "border-red-500/40"
              : isYellow
                ? "border-amber-500/40"
                : "border-white/15",
          )}
        >
          {/* Themed ambient particles */}
          <SkinParticleField skin={skin} seed={9} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Red strobe overlay when done */}
          {isRed && (
            <div className="absolute inset-0 bg-red-600/20 animate-[strobeUrgent_0.4s_ease-in-out_infinite] pointer-events-none" />
          )}

          {/* Dramatic countdown overlay (full screen) */}
          {showCountdown && !done && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <DramaticCountdown
                number={timer.remaining}
                className="text-[160px] font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]"
              />
            </div>
          )}

          {/* Main content: two-column layout — traffic light on left, time + progress on right */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 sm:gap-8 px-4 z-10">
            {/* LEFT: Traffic light housing (horizontal on mobile, vertical on desktop) */}
            <div className="flex sm:flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-zinc-950/90 rounded-2xl border-4 border-zinc-700 shadow-2xl backdrop-blur-sm shrink-0">
              <Light color="green" active={isGreen} size="sm" />
              <Light color="yellow" active={isYellow} size="sm" />
              <Light color="red" active={isRed} size="sm" />
            </div>

            {/* RIGHT: Time display + visual time decline indicator */}
            <div className="flex flex-col items-center gap-3 flex-1 max-w-xs">
              {/* Status label */}
              <div
                className={cn(
                  "text-lg sm:text-2xl font-black uppercase tracking-wider transition-colors drop-shadow-lg",
                  isRed
                    ? "text-red-400 animate-[dramaticPulse_0.4s_ease-in-out_infinite]"
                    : isYellow
                      ? "text-amber-400"
                      : "text-emerald-400",
                )}
              >
                {isRed ? "🛑 STOP!" : isYellow ? "⚠ Slow Down" : "✅ Go!"}
              </div>

              {/* Time display */}
              <div
                className={cn(
                  "inline-block px-5 py-2 rounded-2xl backdrop-blur-sm border",
                  isRed
                    ? "bg-red-900/70 border-red-400/60 animate-[strobeUrgent_0.4s_ease-in-out_infinite]"
                    : isYellow
                      ? "bg-amber-900/60 border-amber-400/50"
                      : "bg-emerald-900/60 border-emerald-400/50",
                )}
              >
                <div
                  className={cn(
                    "font-mono font-black tabular-nums drop-shadow-lg text-4xl sm:text-5xl lg:text-7xl xl:text-8xl",
                    isRed
                      ? "text-red-300 animate-[dramaticPulse_0.4s_ease-in-out_infinite]"
                      : isYellow
                        ? "text-amber-300"
                        : "text-emerald-300",
                  )}
                >
                  {done ? "🛑" : display}
                </div>
              </div>

              {/* Visual time decline indicator — vertical progress bar themed as traffic light pole */}
              <div className="w-full mt-1">
                <div className="flex justify-between text-xs font-bold text-white/70 mb-1 uppercase tracking-wider">
                  <span>Full</span>
                  <span>{Math.round(remainingPct)}%</span>
                  <span>Empty</span>
                </div>
                {/* Vertical bar container */}
                <div className="relative h-20 sm:h-24 rounded-xl bg-black/50 border-2 border-white/15 overflow-hidden shadow-inner">
                  {/* Fill — shrinks from top to bottom as time runs out */}
                  <div
                    className={cn(
                      "absolute top-0 left-0 right-0 transition-all duration-300 ease-linear rounded-xl",
                      done
                        ? "bg-gradient-to-b from-red-400 to-red-600"
                        : isYellow
                          ? "bg-gradient-to-b from-amber-300 to-orange-500"
                          : "bg-gradient-to-b from-emerald-300 to-green-600",
                    )}
                    style={{ height: `${remainingPct}%` }}
                  >
                    {/* Shimmer */}
                    {timer.isRunning && !done && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_linear_infinite]" />
                    )}
                  </div>
                  {/* Tick marks */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-px bg-white/15" />
                    ))}
                  </div>
                </div>
                {/* Mini caption */}
                <div className="text-center text-xs text-white/50 mt-1 font-semibold">
                  {done
                    ? "🚨 Time's up! 🚨"
                    : isYellow
                      ? "Wrapping up soon..."
                      : timer.isRunning
                        ? "Keep going!"
                        : "Ready"}
                </div>
              </div>
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

function Light({
  color,
  active,
  size = "md",
}: {
  color: "red" | "yellow" | "green";
  active: boolean;
  size?: "sm" | "md";
}) {
  const colorMap = {
    red: {
      on: "bg-red-500 shadow-[0_0_40px_14px_rgba(239,68,68,0.9)]",
      off: "bg-red-950/60",
    },
    yellow: {
      on: "bg-amber-400 shadow-[0_0_40px_14px_rgba(251,191,36,0.9)]",
      off: "bg-amber-950/60",
    },
    green: {
      on: "bg-emerald-500 shadow-[0_0_40px_14px_rgba(16,185,129,0.9)]",
      off: "bg-emerald-950/60",
    },
  } as const;

  const sizeClass = size === "sm" ? "w-14 h-14 sm:w-16 sm:h-16" : "w-20 h-20 sm:w-24 sm:h-24";

  return (
    <div
      className={cn(
        "rounded-full transition-all duration-300 border-2 relative overflow-hidden",
        sizeClass,
        active
          ? cn(colorMap[color].on, "border-white/50 scale-110")
          : cn(colorMap[color].off, "border-zinc-800"),
      )}
    >
      {/* Pulse rings when active */}
      {active && (
        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-[pulseRing_1.5s_ease-out_infinite]" />
      )}
      {/* Inner highlight */}
      {active && (
        <div className="absolute top-2 left-3 w-5 h-2.5 rounded-full bg-white/40 blur-sm" />
      )}
    </div>
  );
}

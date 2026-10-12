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

// Stable spark positions (pre-computed so CSS animations don't break)
const FLAME_SPARKS = Array.from({ length: 4 }, () => ({
  left: 50 + (Math.random() - 0.5) * 60,
  sparkX: (Math.random() - 0.5) * 40,
  sparkY: Math.random() * 25 + 10,
}));

export function RocketTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("rocket");
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];
  const [smokeClouds, setSmokeClouds] = useState<number[]>([]);
  const [blastoff, setBlastoff] = useState(false);

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, rocket blastoff alarm
  useTimerAudio(
    "rocket",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    () => {
      setBlastoff(true);
      flashFn(skin.flashColor);
      shake(3);
      // Multi-wave confetti
      burstConfetti(100, 50, 70);
      setTimeout(() => burstConfetti(80, 30, 60), 300);
      setTimeout(() => burstConfetti(80, 70, 60), 600);
      // Smoke clouds
      setSmokeClouds([0, 1, 2, 3, 4]);
      setTimeout(() => setSmokeClouds([]), 3000);
    },
  );

  // Derived: show big countdown number in last 5 seconds
  const showCountdown =
    timer.isRunning && timer.remaining <= 5 && timer.remaining > 0;

  const handleStart = () => {
    if (totalInput <= 0) return;
    setBlastoff(false);
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
    setBlastoff(false);
    setSmokeClouds([]);
    timer.reset(totalInput);
  };

  const { display } = formatTime(timer.remaining);
  const isLaunching = timer.isCompleted;
  const progress = timer.progress * 100;
  const countdown = timer.isRunning && timer.remaining <= 5;

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="rocket" />
      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-b", skin.bgGradient)}>
          {/* Themed ambient particles */}
          <SkinParticleField skin={skin} seed={4} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Moon */}
          <div className="absolute top-6 right-8 w-12 h-12 rounded-full bg-yellow-100 shadow-[0_0_60px_20px_rgba(255,255,200,0.7)]" />

          {/* Ground / Launch pad */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-slate-700 to-slate-900 border-t-2 border-slate-500" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-24 h-2 bg-slate-500 rounded-t-md" />

          {/* Smoke clouds at base when launching */}
          {smokeClouds.map((id) => (
            <div
              key={id}
              className="absolute bottom-10 left-1/2 w-16 h-16 rounded-full bg-white/70 blur-md pointer-events-none"
              style={{
                animation: `smokeRiseBig 2.5s ease-out forwards`,
                animationDelay: `${id * 0.15}s`,
                ["--drift" as string]: `${(id - 2) * 30}px`,
              } as React.CSSProperties}
            />
          ))}

          {/* Rocket */}
          <div
            className={cn(
              "absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-200 ease-out",
              blastoff && "animate-[rocketLaunch_3s_ease-out_forwards]",
            )}
            style={{
              transform: countdown
                ? `translateX(-50%) translateY(${-(5 - timer.remaining) * 12}px)`
                : "translateX(-50%) translateY(0)",
            }}
          >
            <div className="relative">
              {/* Big flame trail */}
              {(timer.isRunning || isLaunching) && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-10 h-20">
                  <div
                    className="absolute inset-0 rounded-full blur-[3px] animate-[flameTrail_0.15s_ease-in-out_infinite]"
                    style={{
                      background:
                        "linear-gradient(to top, #dc2626 0%, #f97316 30%, #fbbf24 60%, #fef3c7 100%)",
                    }}
                  />
                  <div className="absolute inset-x-2 top-4 bottom-0 bg-yellow-200 rounded-full blur-[1px] animate-[flameTrail_0.1s_ease-in-out_infinite]" />
                  {/* Sparks */}
                  {FLAME_SPARKS.map((spark, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-orange-300"
                      style={{
                        bottom: 0,
                        left: `${spark.left}%`,
                        animation: `sparkFly 0.5s ease-out ${i * 0.1}s infinite`,
                        ["--spark-x" as string]: `${spark.sparkX}px`,
                        ["--spark-y" as string]: `${spark.sparkY}px`,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
              {/* Body */}
              <svg width="56" height="92" viewBox="0 0 48 80" className="relative drop-shadow-2xl">
                <path
                  d="M24 4 L36 28 L36 60 L12 60 L12 28 Z"
                  fill="#f1f5f9"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
                <circle cx="24" cy="32" r="6" fill="#0ea5e9" stroke="#0284c7" strokeWidth="2" />
                <circle cx="22" cy="30" r="2" fill="#7dd3fc" />
                <path d="M12 50 L4 70 L12 64 Z" fill="#ef4444" />
                <path d="M36 50 L44 70 L36 64 Z" fill="#ef4444" />
                <rect x="12" y="58" width="24" height="4" fill="#475569" />
                <text x="24" y="50" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="bold">🚀</text>
              </svg>
            </div>
          </div>

          {/* Dramatic countdown overlay */}
          {countdown && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <DramaticCountdown
                number={timer.remaining}
                className="text-[180px] font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.9)]"
              />
            </div>
          )}

          {/* Launched overlay */}
          {blastoff && (
            <div className="absolute top-4 left-0 right-0 text-center pointer-events-none z-20">
              <div className="inline-block px-6 py-2 rounded-full bg-emerald-500/40 backdrop-blur-sm border border-emerald-300/60 text-emerald-100 font-black text-xl animate-[winnerBounce_0.6s_ease-in-out_infinite]">
                🚀 BLASTOFF! 🎉
              </div>
            </div>
          )}

          {/* Time display */}
          {!countdown && !blastoff && (
            <div className="absolute top-4 left-0 right-0 text-center pointer-events-none z-10">
              <div className="inline-block px-6 py-3 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/20">
                <div
                  className={cn(
                    "font-mono font-black text-4xl sm:text-5xl lg:text-7xl xl:text-8xl text-white tabular-nums drop-shadow-lg",
                    countdown && "animate-[dramaticPulse_0.5s_ease-in-out_infinite] text-red-300",
                  )}
                >
                  {display}
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {timer.isRunning && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-10">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

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

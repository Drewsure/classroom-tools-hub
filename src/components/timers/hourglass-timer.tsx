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

export function HourglassTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("hourglass");
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];
  const [burstParticles, setBurstParticles] = useState<number[]>([]);

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, hourglass themed alarm
  useTimerAudio(
    "hourglass",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    () => {
            flashFn(skin.flashColor);
      shake(1.5);
      burstConfetti(80, 50, 50);
      setBurstParticles([0, 1, 2, 3, 4, 5, 6, 7]);
      setTimeout(() => setBurstParticles([]), 2000);
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
    setBurstParticles([]);
    timer.reset(totalInput);
  };

  const { display } = formatTime(timer.remaining);
  const progress = timer.progress;
  const done = timer.isCompleted;
  const lowTime = timer.remaining <= 10 && timer.remaining > 0;
  const veryLow = timer.remaining <= 5 && timer.remaining > 0;

  const topFill = Math.max(0, 1 - progress);
  const bottomFill = Math.min(1, progress);

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="hourglass" />
      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex items-center justify-center bg-gradient-to-b", skin.bgGradient)}>
          {/* Themed ambient particles */}
          <SkinParticleField skin={skin} seed={7} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Burst particles on completion */}
          {burstParticles.map((id) => {
            const angle = (id / 8) * Math.PI * 2;
            return (
              <div
                key={id}
                className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full bg-yellow-300 pointer-events-none"
                style={{
                  animation: `debrisFly 1.8s ease-out forwards`,
                  animationDelay: `${id * 0.05}s`,
                  ["--tx" as string]: `${Math.cos(angle) * 100}px`,
                  ["--ty" as string]: `${Math.sin(angle) * 100 - 30}px`,
                  ["--rot" as string]: `${id * 90}deg`,
                } as React.CSSProperties}
              />
            );
          })}

          {/* Time display */}
          <div className="absolute top-4 left-0 right-0 text-center pointer-events-none z-10">
            <div
              className={cn(
                "inline-block px-6 py-3 rounded-2xl backdrop-blur-sm border",
                done
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
                  done ? "text-stone-400" : veryLow ? "text-red-300 animate-[dramaticPulse_0.5s_ease-in-out_infinite]" : lowTime ? "text-orange-300" : "text-yellow-100",
                )}
              >
                {display}
              </div>
            </div>
          </div>

          {/* Dramatic countdown */}
          {showCountdown && !done && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <DramaticCountdown
                number={timer.remaining}
                className="text-[160px] font-black text-yellow-300 drop-shadow-[0_0_30px_rgba(251,191,36,1)]"
              />
            </div>
          )}

          {/* Hourglass */}
          <div className="relative">
            <svg width="180" height="240" viewBox="0 0 180 240" className="drop-shadow-2xl">
              {/* Frame top */}
              <rect x="20" y="10" width="140" height="10" rx="2" fill="#8b4513" />
              <rect x="15" y="5" width="150" height="8" rx="2" fill="#a0522d" />
              {/* Frame bottom */}
              <rect x="20" y="220" width="140" height="10" rx="2" fill="#8b4513" />
              <rect x="15" y="227" width="150" height="8" rx="2" fill="#a0522d" />
              {/* Side posts */}
              <rect x="15" y="10" width="6" height="215" fill="#8b4513" />
              <rect x="159" y="10" width="6" height="215" fill="#8b4513" />

              {/* Glass shape (outline) */}
              <path
                d="M30 20 L150 20 L150 30 L100 110 L100 130 L150 210 L150 220 L30 220 L30 210 L80 130 L80 110 L30 30 Z"
                fill="rgba(255,255,255,0.08)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
              />

              {/* Top sand (decreases) */}
              <clipPath id="topBulb">
                <path d="M30 20 L150 20 L150 30 L100 110 L80 110 L30 30 Z" />
              </clipPath>
              <g clipPath="url(#topBulb)">
                <rect
                  x="30"
                  y={20 + (1 - topFill) * 90}
                  width="120"
                  height={topFill * 90 + 10}
                  fill={veryLow ? "#f87171" : lowTime ? "#fb923c" : "#fbbf24"}
                  className="transition-all duration-500"
                />
                {topFill > 0.02 && (
                  <rect
                    x="30"
                    y={20 + (1 - topFill) * 90}
                    width="120"
                    height="2"
                    fill="#fef3c7"
                  />
                )}
              </g>

              {/* Falling stream of sand */}
              {timer.isRunning && !done && progress < 0.99 && (
                <g>
                  <rect
                    x="89"
                    y="110"
                    width="2"
                    height="100"
                    fill={veryLow ? "#f87171" : "#fbbf24"}
                  />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <circle
                      key={i}
                      cx="90"
                      cy={120 + i * 25}
                      r="1.5"
                      fill="#fde68a"
                      opacity="0.8"
                    />
                  ))}
                </g>
              )}

              {/* Bottom sand (increases) */}
              <clipPath id="bottomBulb">
                <path d="M80 130 L100 130 L150 210 L150 220 L30 220 L30 210 Z" />
              </clipPath>
              <g clipPath="url(#bottomBulb)">
                <rect
                  x="30"
                  y={220 - bottomFill * 90}
                  width="120"
                  height={bottomFill * 90 + 10}
                  fill={veryLow ? "#f87171" : lowTime ? "#fb923c" : "#fbbf24"}
                  className="transition-all duration-500"
                />
                {bottomFill > 0.02 && (
                  <polygon
                    points={`90,${220 - bottomFill * 90} ${90 - bottomFill * 50},${220} ${90 + bottomFill * 50},${220}`}
                    fill={veryLow ? "#ef4444" : lowTime ? "#f97316" : "#f59e0b"}
                  />
                )}
              </g>

              {/* Glass shine */}
              <path
                d="M40 25 L48 25 L88 110 L82 110 Z"
                fill="rgba(255,255,255,0.15)"
              />

              {/* Pulse glow when low time */}
              {veryLow && !done && (
                <circle
                  cx="90"
                  cy="115"
                  r="80"
                  fill="none"
                  stroke="rgba(248, 113, 113, 0.6)"
                  strokeWidth="3"
                  className="animate-[pulseRing_1s_ease-out_infinite]"
                />
              )}
            </svg>

            {done && (
              <div className="text-center mt-2 text-yellow-200 font-black text-xl animate-[winnerBounce_0.6s_ease-in-out_infinite]">
                ⏳ Time&apos;s up!
              </div>
            )}
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

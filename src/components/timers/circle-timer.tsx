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

export function CircleTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(3);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("circle");

  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, circle themed alarm
  useTimerAudio(
    "circle",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    () => {
            flashFn(skin.flashColor);
      shake(1.5);
      burstConfetti(100, 50, 50);
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

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const remainingFraction = done ? 0 : 1 - progress;
  const dashOffset = circumference * (1 - remainingFraction);

  // Build gradient id from skin to avoid collisions
  const gradId = `ringGrad-${skin.id}`;
  const gradLowId = `ringGradLow-${skin.id}`;
  const gradDoneId = `ringGradDone-${skin.id}`;
  const glowId = `glow-${skin.id}`;

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="circle" />

      <ShakeWrapper intensity={shakeIntensity}>
        <div
          className={cn(
            "relative w-full h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex items-center justify-center bg-gradient-to-b",
            skin.bgGradient,
          )}
        >
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={1} />

          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Rotating glow halo */}
          {timer.isRunning && !done && (
            <div
              className="absolute w-80 h-80 rounded-full blur-3xl opacity-60 animate-[spinGlow_8s_linear_infinite]"
              style={{
                background: veryLow
                  ? "conic-gradient(from 0deg, transparent, rgba(248,113,113,0.6), transparent)"
                  : lowTime
                    ? "conic-gradient(from 0deg, transparent, rgba(251,146,60,0.6), transparent)"
                    : `conic-gradient(from 0deg, transparent, ${skin.accent}99, transparent)`,
              }}
            />
          )}

          {/* Pulse rings */}
          {timer.isRunning && !done && (
            <>
              <div
                className={cn(
                  "absolute w-72 h-72 rounded-full border-2 animate-[pulseRing_2s_ease-out_infinite]",
                  lowTime ? "border-red-400/40" : "border-white/30",
                )}
              />
              <div
                className={cn(
                  "absolute w-72 h-72 rounded-full border-2 animate-[pulseRing_2s_ease-out_infinite]",
                  lowTime ? "border-red-400/40" : "border-white/30",
                )}
                style={{ animationDelay: "1s" }}
              />
            </>
          )}

          <svg
            viewBox="0 0 320 320"
            className="relative drop-shadow-2xl z-10 w-full h-full max-w-[28rem] lg:max-w-[36rem] xl:max-w-[44rem] max-h-[28rem] lg:max-h-[36rem] xl:max-h-[44rem]"
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={skin.accent} stopOpacity="0.9" />
                <stop offset="100%" stopColor={skin.accent} stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id={gradLowId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
              <linearGradient id={gradDoneId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor={skin.accent} />
              </linearGradient>
              <filter id={glowId}>
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Track */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="14"
            />

            {/* Progress ring with glow */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke={
                done
                  ? `url(#${gradDoneId})`
                  : veryLow || lowTime
                    ? `url(#${gradLowId})`
                    : `url(#${gradId})`
              }
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 160 160)"
              className="transition-all duration-300 ease-linear"
              filter={`url(#${glowId})`}
            />

            {/* Tick marks every 30deg */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 160 + Math.cos(angle) * 148;
              const y1 = 160 + Math.sin(angle) * 148;
              const x2 = 160 + Math.cos(angle) * 155;
              const y2 = 160 + Math.sin(angle) * 155;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />
              );
            })}

            {/* Center text */}
            {done ? (
              <text
                x="160"
                y="155"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={skin.accent}
                fontSize="48"
                fontWeight="900"
              >
                {skin.completionEmoji}
              </text>
            ) : showCountdown ? (
              <text
                key={timer.remaining}
                x="160"
                y="160"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fda4af"
                fontSize="120"
                fontWeight="900"
                className="animate-[countdownBoom_1s_ease-out]"
              >
                {timer.remaining}
              </text>
            ) : (
              <text
                x="160"
                y="155"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={veryLow ? "#fda4af" : lowTime ? "#fdba74" : "white"}
                fontSize="48"
                fontWeight="900"
                fontFamily="monospace"
                className={cn(veryLow && "animate-[dramaticPulse_0.5s_ease-in-out_infinite]")}
              >
                {display}
              </text>
            )}
            <text
              x="160"
              y="195"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize="12"
              fontWeight="700"
              letterSpacing="3"
            >
              {done
                ? skin.completionMessage.toUpperCase()
                : timer.isRunning
                  ? veryLow ? "HURRY!" : "RUNNING"
                  : timer.isPaused
                    ? "PAUSED"
                    : timer.isCompleted
                      ? "DONE"
                      : "READY"}
            </text>
          </svg>

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

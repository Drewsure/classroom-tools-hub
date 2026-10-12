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

export function ClassicTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("classic");

  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, themed alarm
  useTimerAudio(
    "classic",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    () => {
      burstConfetti(120, 50, 40);
      flashFn(skin.flashColor);
      shake(2);
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
  const lowTime = timer.remaining <= 10 && timer.remaining > 0;
  const veryLow = timer.remaining <= 5 && timer.remaining > 0;
  const isFinished = timer.isCompleted;
  const isSetup = timer.status === "idle";

  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] w-full flex-col items-center justify-center gap-3 py-1">
      {isSetup && <SkinPicker current={skinId} onChange={setSkinId} timerKey="classic" />}

      <ShakeWrapper intensity={shakeIntensity} className="flex justify-center">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full transition-all duration-300 shrink-0",
            isSetup
              ? "h-[min(58dvh,40rem)] w-[min(58dvh,40rem)] min-h-[22rem] min-w-[22rem]"
              : "h-[min(82dvh,62rem)] w-[min(82dvh,62rem)] min-h-[32rem] min-w-[32rem]",
            "border-4 shadow-2xl backdrop-blur-sm bg-gradient-to-br",
            skin.bgGradient,
            lowTime && "border-red-400/80",
            veryLow && "border-red-500 animate-[strobeUrgent_0.4s_ease-in-out_infinite]",
            isFinished && "border-white/80",
          )}
        >
          {/* Themed particles */}
          <SkinParticleField skin={skin} />

          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Pulsing glow */}
          <div
            className="absolute inset-4 rounded-full blur-2xl opacity-60 transition-all duration-500"
            style={{
              background: isFinished
                ? `${skin.accent}80`
                : veryLow
                  ? "rgba(239, 68, 68, 0.6)"
                  : lowTime
                    ? "rgba(251, 146, 60, 0.5)"
                    : `${skin.accent}40`,
            }}
          />

          {/* Pulse rings when running */}
          {timer.isRunning && !isFinished && (
            <>
              <div
                className={cn(
                  "absolute inset-8 rounded-full border-2 animate-[pulseRing_2s_ease-out_infinite]",
                  lowTime ? "border-red-400/40" : "border-white/30",
                )}
              />
              <div
                className={cn(
                  "absolute inset-8 rounded-full border-2 animate-[pulseRing_2s_ease-out_infinite]",
                  lowTime ? "border-red-400/40" : "border-white/30",
                )}
                style={{ animationDelay: "1s" }}
              />
            </>
          )}

          <div className="relative text-center z-10">
            {isFinished ? (
              <>
                <div className="text-7xl mb-2 animate-bounce">
                  {skin.completionEmoji}
                </div>
                <p
                  className="text-2xl font-black drop-shadow-[0_0_20px_currentColor]"
                  style={{ color: skin.accent }}
                >
                  {skin.completionMessage}
                </p>
              </>
            ) : showCountdown ? (
              <DramaticCountdown
                number={timer.remaining}
                className="font-black text-red-400 drop-shadow-[0_0_30px_rgba(248,113,113,0.9)]"
              />
            ) : (
              <div
                className={cn(
                  "font-mono font-black tabular-nums text-white drop-shadow-2xl transition-all",
                  "text-6xl sm:text-8xl lg:text-9xl xl:text-[12rem]",
                  lowTime && "text-red-300",
                  veryLow && "animate-[dramaticPulse_0.5s_ease-in-out_infinite] text-red-400",
                )}
              >
                {display}
              </div>
            )}
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/70">
              {timer.isRunning
                ? veryLow ? "⚡ HURRY! ⚡"
                : "Running"
                : timer.isPaused
                  ? "Paused"
                  : timer.isCompleted
                    ? "Done!"
                    : "Ready"}
            </p>
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

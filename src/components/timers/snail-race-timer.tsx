"use client";

import { useEffect, useRef, useState } from "react";
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
} from "@/components/effects/effect-overlays";
import { SKINS, SkinPicker, SkinParticleField, SkinSceneDecorator, useSavedSkin } from "@/lib/skins";
import { formatTime } from "@/lib/timers";
import { cn } from "@/lib/utils";

const SNAILS = [
  { id: 0, name: "Speedy", color: "#22c55e", shell: "#15803d" },
  { id: 1, name: "Turbo", color: "#3b82f6", shell: "#1e40af" },
  { id: 2, name: "Lightning", color: "#f59e0b", shell: "#b45309" },
  { id: 3, name: "Dash", color: "#ec4899", shell: "#9f1239" },
];

export function SnailRaceTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("snail-race");
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];
  const [positions, setPositions] = useState<number[]>([0, 0, 0, 0]);
  const [winner, setWinner] = useState<number | null>(null);
  const positionsRef = useRef(positions);

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const announceWinner = () => {
    const current = positionsRef.current;
    let maxIdx = 0;
    let maxVal = -1;
    current.forEach((p, i) => {
      if (p > maxVal) {
        maxVal = p;
        maxIdx = i;
      }
    });
    setPositions([1, 1, 1, 1]);
    setWinner(maxIdx);
    flashFn(skin.flashColor);
    shake(2);
    // Multi-burst confetti
    burstConfetti(120, 80, 30);
    setTimeout(() => burstConfetti(80, 50, 40), 300);
    setTimeout(() => burstConfetti(80, 20, 40), 600);
  };

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, snail race finish alarm
  useTimerAudio(
    "snail-race",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    announceWinner,
  );

  // Advance snails while running
  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(() => {
      setPositions((prev) => {
        const remainingFraction = timer.remaining / Math.max(1, timer.totalSeconds);
        const targetMax = 1 - remainingFraction * 0.9;
        return prev.map((p, i) => {
          if (p >= 0.97) return p;
          const nudge = Math.random() * 0.012 + 0.003;
          const target = targetMax + (Math.random() - 0.5) * 0.08;
          const next = Math.min(target, p + nudge);
          return Math.max(p, next);
        });
      });
    }, 200);
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.remaining, timer.totalSeconds]);

  // Countdown beeps in final 5 seconds

  const handleStart = () => {
    if (totalInput <= 0) return;
    setPositions([0, 0, 0, 0]);
    setWinner(null);
    timer.start(totalInput);
  };

  const handlePreset = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    setHours(h);
    setMinutes(m);
    setSeconds(sec);
    setPositions([0, 0, 0, 0]);
    setWinner(null);
    timer.setTime(s);
  };

  const handleReset = () => {
    timer.reset(totalInput);
    setPositions([0, 0, 0, 0]);
    setWinner(null);
  };

  const { display } = formatTime(timer.remaining);
  const veryLow = timer.remaining <= 5 && timer.remaining > 0;

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="snail-race" />
      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full h-96 rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-b", skin.bgGradient)}>
          {/* Themed ambient particles */}
          <SkinParticleField skin={skin} seed={8} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Winner banner */}
          <div className="absolute top-4 left-0 right-0 text-center z-20 pointer-events-none">
            {winner !== null ? (
              <div className="inline-block px-6 py-3 rounded-2xl bg-emerald-500/40 backdrop-blur-sm border-2 border-emerald-300/70 animate-[winnerBounce_0.5s_ease-in-out_infinite]">
                <div className="text-2xl sm:text-3xl font-black text-emerald-100 drop-shadow-[0_0_20px_rgba(16,185,129,0.9)]">
                  🏆 {SNAILS[winner].name} WINS! 🎉
                </div>
                <div className="text-xs text-emerald-200/80 mt-1 font-bold tracking-widest uppercase">
                  Photo Finish!
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "inline-block px-6 py-3 rounded-2xl bg-black/50 backdrop-blur-sm border",
                  veryLow ? "border-red-400/50 animate-[strobeUrgent_0.4s_ease-in-out_infinite]" : "border-white/20",
                )}
              >
                <div
                  className={cn(
                    "font-mono font-black text-4xl sm:text-5xl lg:text-7xl xl:text-8xl tabular-nums drop-shadow-lg",
                    veryLow && "text-red-300 animate-[dramaticPulse_0.5s_ease-in-out_infinite]",
                  )}
                >
                  {display}
                </div>
              </div>
            )}
          </div>

          {/* Race track */}
          <div className="absolute top-24 left-0 right-0 bottom-4 px-4 sm:px-8">
            {/* Finish line — checkered */}
            <div className="absolute right-2 sm:right-4 top-0 bottom-0 w-4 flex flex-col z-10">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    background: i % 2 === 0 ? "white" : "black",
                  }}
                />
              ))}
            </div>
            {/* Finish line burst when winner declared */}
            {winner !== null && (
              <>
                <div className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-yellow-300 pointer-events-none animate-[burstRing_1s_ease-out]" />
                <div className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-emerald-300 pointer-events-none animate-[burstRing_1.4s_ease-out_0.2s]" />
              </>
            )}
            <div className="absolute right-7 sm:right-9 top-2 text-xs font-black text-white/80 tracking-wider">
              FINISH
            </div>

            {/* Lanes */}
            {SNAILS.map((snail, i) => (
              <div
                key={snail.id}
                className={cn(
                  "relative h-16 border-b border-white/10",
                  winner === i && "bg-emerald-500/20",
                )}
              >
                {/* Lane label */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">
                  #{i + 1}
                </div>
                {/* Lane center line */}
                <div className="absolute left-8 right-12 top-1/2 h-px bg-white/5" />

                {/* Snail */}
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 transition-all duration-200 ease-linear",
                    winner === i && "animate-[winnerBounce_0.5s_ease-in-out_infinite]",
                  )}
                  style={{
                    left: `calc(40px + ${positions[i] * 78}%)`,
                  }}
                >
                  <Snail color={snail.color} shell={snail.shell} />
                  <span
                    className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-black whitespace-nowrap drop-shadow-lg"
                    style={{ color: snail.color }}
                  >
                    {snail.name}
                    {winner === i && " 🏆"}
                  </span>
                  {/* Crown for winner */}
                  {winner === i && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                      👑
                    </div>
                  )}
                </div>
              </div>
            ))}
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

function Snail({ color, shell }: { color: string; shell: string }) {
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" className="drop-shadow-lg">
      {/* Body */}
      <ellipse cx="20" cy="24" rx="18" ry="6" fill={color} />
      {/* Head */}
      <circle cx="36" cy="20" r="7" fill={color} />
      {/* Eye stalks */}
      <line x1="38" y1="14" x2="40" y2="6" stroke={color} strokeWidth="2" />
      <line x1="42" y1="14" x2="44" y2="8" stroke={color} strokeWidth="2" />
      <circle cx="40" cy="6" r="2" fill={color} />
      <circle cx="44" cy="8" r="2" fill={color} />
      <circle cx="40" cy="6" r="1" fill="black" />
      <circle cx="44" cy="8" r="1" fill="black" />
      {/* Smile */}
      <path d="M33 22 Q36 24 39 22" stroke="black" strokeWidth="0.8" fill="none" />
      {/* Shell with spiral */}
      <circle cx="18" cy="16" r="11" fill={shell} />
      <circle cx="18" cy="16" r="8" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="18" cy="16" r="5" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="18" cy="16" r="2" fill={color} />
      {/* Shell highlight */}
      <ellipse cx="14" cy="13" rx="3" ry="2" fill="white" opacity="0.3" />
      {/* Bottom highlight */}
      <ellipse cx="18" cy="28" rx="16" ry="2" fill="black" opacity="0.2" />
    </svg>
  );
}

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

interface Debris {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  rot: number;
}

// Stable spark positions (pre-computed so CSS animations don't break)
const FUSE_SPARKS = Array.from({ length: 8 }, () => ({
  sparkX: (Math.random() - 0.5) * 40,
  sparkY: -Math.random() * 30 - 5,
}));

export function BombTimer() {
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const { skinId, setSkinId } = useSavedSkin("bomb");
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];
  const [debris, setDebris] = useState<Debris[]>([]);
  const [exploded, setExploded] = useState(false);
  const [showBoom, setShowBoom] = useState(false);

  const totalInput = hours * 3600 + minutes * 60 + seconds;

  const triggerExplosion = () => {
    setExploded(true);
    setShowBoom(true);
    flashFn(skin.flashColor);
    shake(3);
    // Generate debris flying outward
    const colors = ["#1f1f1f", "#3f3f3f", "#ef4444", "#f97316", "#fbbf24"];
    const newDebris: Debris[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      angle: (i / 24) * 360 + Math.random() * 30,
      distance: 80 + Math.random() * 120,
      size: 6 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 720,
    }));
    setDebris(newDebris);
    setTimeout(() => setDebris([]), 1500);
    setTimeout(() => setShowBoom(false), 2000);
    burstConfetti(60, 50, 60);
  };

  const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, bomb explosion alarm
  useTimerAudio(
    "bomb",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    triggerExplosion,
  );

  // Derived: show big countdown number in last 5 seconds
  const showCountdown =
    timer.isRunning && timer.remaining <= 5 && timer.remaining > 0;

  const handleStart = () => {
    if (totalInput <= 0) return;
    setExploded(false);
    setShowBoom(false);
    timer.start(totalInput);
  };

  const handlePreset = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    setHours(h);
    setMinutes(m);
    setSeconds(sec);
    setExploded(false);
    timer.setTime(s);
  };

  const handleReset = () => {
    setExploded(false);
    setShowBoom(false);
    setDebris([]);
    timer.reset(totalInput);
  };

  const { display } = formatTime(timer.remaining);
  const progress = timer.progress;
  const lowTime = timer.remaining <= 10 && timer.remaining > 0;
  const veryLow = timer.remaining <= 5 && timer.remaining > 0;
  const sizzling = timer.isRunning;

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <SkinPicker current={skinId} onChange={setSkinId} timerKey="bomb" />
      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-b", skin.bgGradient)}>
          {/* Themed ambient particles */}
          <SkinParticleField skin={skin} seed={5} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Bomb */}
          <div
            className={cn(
              "absolute left-1/2 bottom-12 -translate-x-1/2 transition-all",
              veryLow && !exploded && "animate-[screenShake_0.3s_ease-in-out_infinite]",
              exploded && "scale-0 transition-transform duration-200",
            )}
            style={
              veryLow && !exploded
                ? ({ ["--shake-intensity" as string]: "4px" } as React.CSSProperties)
                : undefined
            }
          >
            <div className="relative">
              {/* Big spark fuse */}
              {sizzling && !exploded && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute -inset-4 rounded-full bg-yellow-400/60 blur-xl animate-pulse" />
                    {/* Core spark */}
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full bg-yellow-100 shadow-[0_0_30px_12px_rgba(255,220,100,0.95)] animate-pulse",
                        veryLow && "w-4 h-4",
                      )}
                    />
                    {/* Spark particles */}
                    {FUSE_SPARKS.map((spark, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
                        style={{
                          animation: `sparkFly 0.6s ease-out ${i * 0.08}s infinite`,
                          ["--spark-x" as string]: `${spark.sparkX}px`,
                          ["--spark-y" as string]: `${spark.sparkY}px`,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fuse line - gets shorter as time passes */}
              {timer.isRunning && !exploded && (
                <svg
                  className="absolute -top-12 left-1/2 -translate-x-1/2"
                  width="24"
                  height="48"
                  viewBox="0 0 24 48"
                >
                  <path
                    d="M12 48 Q6 30 12 18 Q18 8 12 0"
                    stroke="#8b4513"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="M12 48 Q6 30 12 18 Q18 8 12 0"
                    stroke="#ff6b35"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="48"
                    strokeDashoffset={48 * progress}
                    className="transition-all duration-300"
                  />
                </svg>
              )}

              {/* Bomb body */}
              <svg width="140" height="140" viewBox="0 0 120 120">
                <ellipse cx="60" cy="115" rx="44" ry="6" fill="black" opacity="0.5" />
                <circle cx="60" cy="65" r="48" fill="url(#bombGrad)" />
                <circle cx="60" cy="65" r="48" fill="none" stroke="#3f3f3f" strokeWidth="2" />
                <rect x="50" y="12" width="20" height="10" rx="2" fill="#3f3f3f" />
                <ellipse cx="45" cy="50" rx="14" ry="10" fill="white" opacity="0.18" />
                <ellipse cx="48" cy="48" rx="6" ry="4" fill="white" opacity="0.3" />
                <defs>
                  <radialGradient id="bombGrad" cx="0.35" cy="0.35">
                    <stop offset="0%" stopColor="#3a3a3a" />
                    <stop offset="100%" stopColor="#0a0a0a" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Explosion: BOOM text + debris + ring */}
          {exploded && (
            <>
              {/* Expanding burst rings */}
              <div
                className="absolute left-1/2 top-1/2 w-20 h-20 rounded-full border-8 border-yellow-300/80 pointer-events-none"
                style={{ animation: "burstRing 1s ease-out forwards" }}
              />
              <div
                className="absolute left-1/2 top-1/2 w-20 h-20 rounded-full border-4 border-orange-500/60 pointer-events-none"
                style={{ animation: "burstRing 1.2s ease-out 0.1s forwards" }}
              />
              {/* Fireball flash */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-radial from-yellow-200 via-orange-500 to-red-700 blur-2xl animate-ping" />

              {/* Debris */}
              {debris.map((d) => {
                const rad = (d.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * d.distance;
                const ty = Math.sin(rad) * d.distance - 40;
                return (
                  <div
                    key={d.id}
                    className="absolute left-1/2 top-1/2 pointer-events-none"
                    style={{
                      width: d.size,
                      height: d.size,
                      background: d.color,
                      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                      animation: `debrisFly 1.5s ease-out forwards`,
                      ["--tx" as string]: `${tx}px`,
                      ["--ty" as string]: `${ty}px`,
                      ["--rot" as string]: `${d.rot}deg`,
                    } as React.CSSProperties}
                  />
                );
              })}

              {/* BOOM text */}
              {showBoom && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div
                    className="text-8xl font-black text-yellow-300 drop-shadow-[0_0_30px_rgba(255,200,0,1)] animate-[countdownBoom_1.5s_ease-out]"
                    style={{ textShadow: "0 0 40px rgba(255, 100, 0, 1), 0 0 80px rgba(255, 50, 0, 0.8)" }}
                  >
                    BOOM!
                  </div>
                </div>
              )}
            </>
          )}

          {/* Dramatic countdown */}
          {showCountdown && !exploded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <DramaticCountdown
                number={timer.remaining}
                className="text-[160px] font-black text-red-400 drop-shadow-[0_0_30px_rgba(248,113,113,1)]"
              />
            </div>
          )}

          {/* Time display */}
          {!exploded && !showCountdown && (
            <div className="absolute top-4 left-0 right-0 text-center pointer-events-none z-10">
              <div
                className={cn(
                  "inline-block px-6 py-3 rounded-2xl backdrop-blur-sm border",
                  veryLow
                    ? "bg-red-900/70 border-red-400/60 animate-[strobeUrgent_0.3s_ease-in-out_infinite]"
                    : lowTime
                      ? "bg-red-900/60 border-red-400/50"
                      : "bg-black/50 border-white/20",
                )}
              >
                <div
                  className={cn(
                    "font-mono font-black text-4xl sm:text-5xl lg:text-7xl xl:text-8xl tabular-nums drop-shadow-lg",
                    veryLow ? "text-red-300 animate-[dramaticPulse_0.4s_ease-in-out_infinite]" : lowTime ? "text-red-300" : "text-white",
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
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
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

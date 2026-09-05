"use client";

import type { ConfettiPiece, Particle } from "@/hooks/use-effects";
import { cn } from "@/lib/utils";

/* ============================================================
   CONFETTI OVERLAY — renders confetti pieces with physics
   ============================================================ */
export function ConfettiOverlay({
  pieces,
  className,
}: {
  pieces: ConfettiPiece[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden z-30",
        className,
      )}
      aria-hidden
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `confettiFall 3s ease-out forwards`,
              ["--vx" as string]: `${p.vx}px`,
              ["--vy" as string]: `${p.vy}px`,
              ["--spin" as string]: `${p.spin}deg`,
            } as React.CSSProperties
          }
        >
          {p.shape === "rect" && (
            <div
              className="block"
              style={{
                width: p.size,
                height: p.size * 0.6,
                background: p.color,
                transform: `rotate(${p.rot}deg)`,
              }}
            />
          )}
          {p.shape === "circle" && (
            <div
              className="block rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
              }}
            />
          )}
          {p.shape === "triangle" && (
            <div
              className="block"
              style={{
                width: 0,
                height: 0,
                borderLeft: `${p.size / 2}px solid transparent`,
                borderRight: `${p.size / 2}px solid transparent`,
                borderBottom: `${p.size}px solid ${p.color}`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   FLASH OVERLAY — brief screen flash for impact moments
   ============================================================ */
export function FlashOverlay({
  flash,
  className,
}: {
  flash: { color: string; key: number } | null;
  className?: string;
}) {
  if (!flash) return null;
  return (
    <div
      key={flash.key}
      className={cn(
        "pointer-events-none absolute inset-0 z-40 animate-[flashFade_0.25s_ease-out_forwards]",
        className,
      )}
      style={{ background: flash.color }}
      aria-hidden
    />
  );
}

/* ============================================================
   PARTICLE FIELD — ambient drifting particles for atmosphere
   ============================================================ */
export function ParticleField({
  particles,
  color = "rgba(255,255,255,0.6)",
  className,
  animationName = "particleFloat",
}: {
  particles: Particle[];
  color?: string;
  className?: string;
  animationName?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: color,
              animation: `${animationName} ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
              ["--drift" as string]: `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ============================================================
   SHAKE WRAPPER — applies screen shake to its children
   ============================================================ */
export function ShakeWrapper({
  intensity,
  children,
  className,
}: {
  intensity: number;
  children: React.ReactNode;
  className?: string;
}) {
  // Always include w-full so the wrapper fills its flex parent.
  // Use intensity as the key so the div re-mounts (and the CSS animation
  // restarts) whenever the shake intensity changes.
  const baseClass = cn("w-full", className);

  if (intensity <= 0) return <div className={baseClass}>{children}</div>;

  return (
    <div
      key={intensity}
      className={cn("animate-[screenShake_0.6s_ease-in-out]", baseClass)}
      style={
        {
          ["--shake-intensity" as string]: `${intensity * 10}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

/* ============================================================
   DRAMATIC COUNTDOWN — big pulsing number for last 5 seconds
   ============================================================ */
export function DramaticCountdown({
  number,
  className,
}: {
  number: number;
  className?: string;
}) {
  return (
    <div
      key={number}
      className={cn("animate-[countdownBoom_1s_ease-out]", className)}
    >
      {number}
    </div>
  );
}

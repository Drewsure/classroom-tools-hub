"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { RosterManager } from "./roster-manager";
import { Play, RotateCcw, Plus, Trash2, History, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";

const WHEEL_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#eab308",
  "#a855f7", "#f97316", "#ec4899", "#06b6d4",
  "#84cc16", "#f43f5e", "#8b5cf6", "#14b8a6",
];

/** Pick a readable text color (black or white) based on segment background luminance */
function readableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  // Relative luminance (sRGB)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#0f172a" : "#ffffff";
}

export function SpinnerWheel() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const { students, setStudents } = useStudentRoster();
  const { skinId, setSkinId, skin } = useToolSkin("spinner-wheel");

  const [segments, setSegments] = useState<string[]>(
    students.length > 0 ? students : ["Option 1", "Option 2", "Option 3", "Option 4"],
  );
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<"idle" | "buildup" | "spinning" | "result">("idle");
  const [winner, setWinner] = useState<string | null>(null);
  const [newSegment, setNewSegment] = useState("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Remove-on-pick mode (default ON — each spin removes the winner so the next spin picks a different option)
  const [removeOnPick, setRemoveOnPick] = useState(true);
  const [pickedSegments, setPickedSegments] = useState<{ text: string; ts: number }[]>([]);

  // Sync from shared roster
  useEffect(() => {
    if (students.length > 0) {
      setSegments(students);
    }
  }, [students]);

  const handleSpin = useCallback(() => {
    if (phase === "buildup" || phase === "spinning") return;
    if (segments.length < 2) return;

    setPhase("buildup");
    setWinner(null);
    sound.playBuildUp();

    setTimeout(() => {
      setPhase("spinning");
      sound.playWhoosh();

      const spins = 5 + Math.random() * 3;
      const finalAngle = spins * 360 + Math.random() * 360;
      setRotation((prev) => prev + finalAngle);

      // Tick sounds
      let tickCount = 0;
      tickRef.current = setInterval(() => {
        sound.playWheelTick();
        tickCount++;
        if (tickCount > 40) {
          if (tickRef.current) clearInterval(tickRef.current);
        }
      }, 70);

      setTimeout(() => {
        if (tickRef.current) clearInterval(tickRef.current);
        const segmentAngle = 360 / segments.length;
        const normalized = ((finalAngle % 360) + 360) % 360;
        const idx = Math.floor((360 - normalized) / segmentAngle) % segments.length;
        const winnerName = segments[idx];
        setWinner(winnerName);
        setPhase("result");
        sound.playReveal();
        flashFn(hexToRgba(WHEEL_COLORS[idx % WHEEL_COLORS.length], 0.7));
        shake(2);
        burstConfetti(100, 50, 40);
        setTimeout(() => burstConfetti(60, 30, 50), 300);

        // Remove the winner from the pool if remove-on-pick is ON
        if (removeOnPick) {
          const remaining = segments.filter((_, i) => i !== idx);
          setSegments(remaining);
          setStudents(remaining);
          setPickedSegments((prev) => [{ text: winnerName, ts: Date.now() }, ...prev]);
        }
      }, 4000);
    }, 1500);
  }, [phase, segments, sound, flashFn, shake, burstConfetti, removeOnPick, setStudents]);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setWinner(null);
    sound.playClick();
  }, [sound]);

  // Restore all picked segments
  const restoreAllPicked = () => {
    if (pickedSegments.length === 0) return;
    const restored = [...pickedSegments].reverse().map((p) => p.text);
    const merged = [...segments, ...restored];
    setSegments(merged);
    setStudents(merged);
    setPickedSegments([]);
    sound.playClick();
  };

  const restoreOne = (ts: number) => {
    const target = pickedSegments.find((p) => p.ts === ts);
    if (!target) return;
    const merged = [...segments, target.text];
    setSegments(merged);
    setStudents(merged);
    setPickedSegments((prev) => prev.filter((p) => p.ts !== ts));
    sound.playClick();
  };

  const addSegment = () => {
    if (newSegment.trim()) {
      const updated = [...segments, newSegment.trim()];
      setSegments(updated);
      setStudents(updated);
      setNewSegment("");
      sound.playClick();
    }
  };

  const removeSegment = (idx: number) => {
    const updated = segments.filter((_, i) => i !== idx);
    setSegments(updated);
    setStudents(updated);
  };

  const updateSegment = (idx: number, value: string) => {
    const updated = segments.map((s, i) => (i === idx ? value : s));
    setSegments(updated);
    setStudents(updated);
  };

  const isBusy = phase === "buildup" || phase === "spinning";

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Shared roster manager */}
      <div className="w-full max-w-2xl">
        <RosterManager
          localStudents={segments}
          onStudentsChange={(s) => setSegments(s)}
        />
      </div>

      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Remove-on-pick toggle + restore controls */}
      <div className="w-full max-w-md flex flex-wrap items-center gap-2 justify-center">
        <button
          onClick={() => setRemoveOnPick((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
            removeOnPick
              ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
              : "bg-white/10 border-white/20 text-white/60",
          )}
          title="When ON, each spin removes the winner so the next spin picks a different option"
        >
          <span className={cn("w-3 h-3 rounded-full border", removeOnPick ? "bg-emerald-400 border-emerald-300" : "border-white/40")} />
          Remove picked {removeOnPick ? "(ON)" : "(OFF)"}
        </button>
        {pickedSegments.length > 0 && (
          <button
            onClick={restoreAllPicked}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/30 transition-all"
          >
            <History className="h-3.5 w-3.5" />
            Restore all ({pickedSegments.length})
          </button>
        )}
        {segments.length < 2 && pickedSegments.length > 0 && (
          <span className="text-xs text-amber-300/80 font-semibold">
            All picked! Restore to spin again.
          </span>
        )}
      </div>

      {/* Picked history strip */}
      {pickedSegments.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1.5 font-bold text-center">Already picked</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {pickedSegments.map((p) => (
              <button
                key={p.ts}
                onClick={() => restoreOne(p.ts)}
                className="group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-emerald-500/10 hover:border-emerald-400/40 hover:text-emerald-200 transition-all"
                title="Click to restore this option"
              >
                <span className="line-through opacity-70">{p.text}</span>
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full max-w-md mx-auto h-80 sm:h-96 rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br", skin.bgGradient)}>
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={9} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Build-up */}
          {phase === "buildup" && (
            <>
              <div className="absolute inset-0 bg-white/10 animate-[buildUpPulse_0.6s_ease-in-out_infinite]" />
              <div className="absolute inset-8 rounded-full border-4 border-white/40 animate-[buildUpPulse_0.8s_ease-in-out_infinite]" />
            </>
          )}

          {/* Sparkles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white/30"
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 100}%`,
                  width: `${(i % 3) + 1}px`,
                  height: `${(i % 3) + 1}px`,
                  animation: `particleFloat ${(i % 3) + 2}s ease-in-out ${(i % 3) * 0.5}s infinite alternate`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 text-center">
            {winner && phase === "result" ? (
              <div className="animate-[revealPulse_0.6s_ease-out]">
                <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">
                  🏆 Winner 🏆
                </p>
                <div className="text-4xl sm:text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] break-words px-4">
                  {winner}
                </div>
              </div>
            ) : (
              <>
                {/* Wheel */}
                <div className={cn("relative mx-auto mb-4 w-52 h-52", phase === "buildup" && "animate-[buildUpPulse_0.6s_ease-in-out_infinite]")}>
                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-4xl drop-shadow-lg">
                    🔻
                  </div>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.4)]" />
                  {/* Wheel */}
                  <div
                    className="w-full h-full rounded-full border-8 border-white shadow-2xl relative overflow-hidden"
                    style={{
                      background: `conic-gradient(${segments.map((_, i) => {
                        const start = (i / segments.length) * 360;
                        const end = ((i + 1) / segments.length) * 360;
                        return `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${start}deg ${end}deg`;
                      }).join(", ")})`,
                      transform: `rotate(${rotation}deg)`,
                      transition: phase === "spinning" ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                    }}
                  >
                    {segments.map((seg, i) => {
                      const angle = (i / segments.length) * 360 + (360 / segments.length) / 2;
                      const segColor = WHEEL_COLORS[i % WHEEL_COLORS.length];
                      const textColor = readableTextColor(segColor);
                      return (
                        <div
                          key={i}
                          className="absolute top-1/2 left-1/2 origin-left font-bold text-xs"
                          style={{
                            color: textColor,
                            transform: `rotate(${angle}deg) translateX(30px)`,
                            textShadow: textColor === "#ffffff" ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
                            maxWidth: "80px",
                          }}
                        >
                          {seg.length > 10 ? seg.slice(0, 10) + "…" : seg}
                        </div>
                      );
                    })}
                  </div>
                  {/* Center hub */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg border-4 border-slate-300 flex items-center justify-center text-xl">
                    🎯
                  </div>
                </div>
                <p className="text-2xl font-black text-white drop-shadow-lg">
                  {phase === "buildup" ? "Get ready..." : phase === "spinning" ? "Spinning..." : "Ready?"}
                </p>
              </>
            )}
          </div>

          {/* Result glow ring */}
          {phase === "result" && (
            <>
              <div className="absolute left-1/2 top-1/2 w-40 h-40 rounded-full border-4 border-white/60 pointer-events-none animate-[glowRingExpand_0.8s_ease-out]" />
              <div className="absolute left-1/2 top-1/2 w-40 h-40 rounded-full border-2 border-yellow-300/60 pointer-events-none animate-[glowRingExpand_1.2s_ease-out_0.15s]" />
            </>
          )}

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {phase === "idle" && (
          <Button
            onClick={handleSpin}
            disabled={segments.length < 2}
            size="lg"
            className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg"
          >
            <Play className="mr-2 h-5 w-5 fill-current" />
            Spin the Wheel!
          </Button>
        )}
        {isBusy && (
          <Button disabled size="lg" className="rounded-full px-8 bg-white/30 text-white">
            {phase === "buildup" ? "⚡ Building up..." : "Spinning..."}
          </Button>
        )}
        {phase === "result" && (
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="rounded-full px-8 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Spin Again
          </Button>
        )}
      </div>

      {/* Segment management */}
      <div className="w-full max-w-2xl">
        <h3 className="text-lg font-bold text-white mb-3">
          Wheel Segments ({segments.length})
        </h3>

        {/* Quick add */}
        <div className="flex gap-2 mb-3">
          <Input
            value={newSegment}
            onChange={(e) => setNewSegment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSegment()}
            placeholder="Add a segment..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <Button onClick={addSegment} className="bg-purple-500 hover:bg-purple-600 text-white shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Segment chips */}
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm border"
              style={{
                background: WHEEL_COLORS[i % WHEEL_COLORS.length] + "40",
                borderColor: WHEEL_COLORS[i % WHEEL_COLORS.length] + "80",
              }}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: WHEEL_COLORS[i % WHEEL_COLORS.length] }}
              />
              <input
                type="text"
                value={seg}
                onChange={(e) => updateSegment(i, e.target.value)}
                className="bg-transparent text-white text-sm outline-none min-w-0 w-20"
              />
              <button
                onClick={() => removeSegment(i)}
                className="text-white/40 hover:text-red-400 ml-1 shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={addSegment}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-dashed border-white/25 hover:border-white/50 text-white/50 hover:text-white text-sm transition-all"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {segments.length < 2 && (
          <p className="text-center text-white/50 text-sm mt-4">
            Add at least 2 segments to spin
          </p>
        )}
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

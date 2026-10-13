"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { useAttendance } from "@/hooks/use-attendance";
import { ClassSelect } from "./class-select";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import { Shuffle, RotateCcw, Plus, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const ORDER_COLORS = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-yellow-500 to-amber-600",
  "from-purple-500 to-fuchsia-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-indigo-500 to-blue-600",
  "from-lime-500 to-green-600",
  "from-violet-500 to-purple-600",
  "from-fuchsia-500 to-pink-600",
];

export function StudentOrderShuffler() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  const { students } = useStudentRoster();
  const att = useAttendance();
  // Default name source: the active attendance class (falls back to shared roster)
  const attClassNames = att.activeClass ? att.activeClass.students.map((s) => s.name) : [];
  const { skinId, setSkinId, skin } = useToolSkin("student-shuffler");

  const [names, setNames] = useState<string[]>(
    students.length > 0 ? students : attClassNames.length > 0 ? attClassNames : ["Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona"],
  );
  const [order, setOrder] = useState<string[] | null>(null);
  const [phase, setPhase] = useState<"idle" | "buildup" | "shuffling" | "result">("idle");
  const [newName, setNewName] = useState("");
  const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ===== Attendance: absent students excluded from shuffle =====
  const attPresent = new Set(att.activeStudents());
  const attInClass = (n: string) => (att.activeClass ? att.activeClass.students.some((s) => s.name === n) : false);
  const attOk = (n: string) => !attInClass(n) || attPresent.has(n);
  const pool = names.filter(attOk);
  const attExcluded = names.length - pool.length;

  // Sync from shared roster
  useEffect(() => {
    if (students.length > 0) {
      setNames(students);
      setOrder(null); // class changed: restart at full class
    }
  }, [students]);

  const handleShuffle = useCallback(() => {
    if (phase === "buildup" || phase === "shuffling") return;
    if (pool.length < 2) return;

    setPhase("buildup");
    setOrder(null);
    sound.playBuildUp();

    setTimeout(() => {
      setPhase("shuffling");
      sound.playWhoosh();

      let ticks = 0;
      const totalTicks = 25;
      shuffleRef.current = setInterval(() => {
        // Rapid shuffle for animation
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        setOrder(shuffled);
        sound.playTick(500 + ticks * 15);
        ticks++;
        if (ticks >= totalTicks) {
          if (shuffleRef.current) clearInterval(shuffleRef.current);
          // Final shuffle
          const finalOrder = [...pool].sort(() => Math.random() - 0.5);
          setOrder(finalOrder);
          setPhase("result");
          sound.playReveal();
          sound.playSparkle();
          flashFn("rgba(168, 85, 247, 0.7)");
          shake(2);
          burstConfetti(100, 50, 40);
          setTimeout(() => burstConfetti(60, 30, 50), 300);
        }
      }, 100);
    }, 1500);
  }, [phase, pool, sound, flashFn, shake, burstConfetti]);

  const handleReset = useCallback(() => {
    if (shuffleRef.current) clearInterval(shuffleRef.current);
    setPhase("idle");
    setOrder(null);
    sound.playClick();
  }, [sound]);

  const addName = () => {
    if (newName.trim()) {
      const updated = [...names, newName.trim()];
      setNames(updated);
      setNewName("");
      sound.playClick();
    }
  };

  const removeName = (idx: number) => {
    const updated = names.filter((_, i) => i !== idx);
    setNames(updated);
  };

  const handleCopyOrder = () => {
    if (order) {
      navigator.clipboard.writeText(order.join("\n")).catch(() => {});
      sound.playClick();
    }
  };

  const isBusy = phase === "buildup" || phase === "shuffling";

  return (
    <div className="tool-projector-root flex flex-col items-center gap-4 py-1">
      <UniversalSkinPicker current={skinId} onChange={setSkinId} />
      {attExcluded > 0 && (
        <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-bold" title="Absent students are excluded - change in Attendance">
          Active: {pool.length}/{names.length} (attendance)
        </span>
      )}

      <ClassSelect
        currentNames={names}
        onPick={(s) => {
          setNames(s);
          setOrder(null);
        }}
      />

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("tool-projector-stage relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-white/15 bg-gradient-to-br p-6 shadow-2xl", skin.bgGradient)}>
          {/* Build-up */}
          {phase === "buildup" && (
            <>
              <div className="absolute inset-0 bg-white/10 animate-[buildUpPulse_0.6s_ease-in-out_infinite]" />
              <div className="absolute inset-8 rounded-full border-4 border-white/40 animate-[buildUpPulse_0.8s_ease-in-out_infinite]" />
            </>
          )}

          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={10} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          <div className="relative z-10 w-full">
            {order && (phase === "shuffling" || phase === "result") ? (
              <>
                <p className="text-center text-sm font-bold uppercase tracking-widest text-white/70 mb-4">
                  {phase === "shuffling" ? "🔀 Shuffling..." : "📋 Presentation Order"}
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {order.map((name, i) => (
                    <div
                      key={`${name}-${i}`}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border-2 border-white/20 shadow-lg bg-gradient-to-r transition-all",
                        ORDER_COLORS[i % ORDER_COLORS.length],
                        phase === "result" && "animate-[revealPulse_0.5s_ease-out]",
                      )}
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <span className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-black text-white text-sm shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-bold text-white text-base sm:text-lg flex-1 break-words">
                        {name}
                      </span>
                      {phase === "result" && i === 0 && (
                        <span className="text-2xl">👑</span>
                      )}
                    </div>
                  ))}
                </div>
                {phase === "result" && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      onClick={handleCopyOrder}
                      variant="outline"
                      size="sm"
                      className="classroom-control-button hover:text-slate-950"
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Copy Order
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🔀</div>
                <p className="text-2xl font-bold text-white mb-2">
                  Student Order Shuffler
                </p>
                <p className="text-white/70 mb-4">
                  {pool.length} students ready to shuffle
                </p>
                <Button
                  onClick={handleShuffle}
                  disabled={pool.length < 2}
                  size="lg"
                  className="rounded-full px-8 bg-white text-purple-700 hover:bg-white/90 shadow-lg text-lg"
                >
                  <Shuffle className="mr-2 h-5 w-5" />
                  Shuffle Order!
                </Button>
              </div>
            )}
          </div>

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Controls */}
      {(phase === "result" || isBusy) && (
        <div className="flex gap-3 justify-center">
          {isBusy && (
            <Button disabled size="lg" className="rounded-full px-8 bg-white/30 text-white">
              {phase === "buildup" ? "⚡ Building up..." : "Shuffling..."}
            </Button>
          )}
          {phase === "result" && (
            <>
              <Button
                onClick={handleShuffle}
                size="lg"
                className="rounded-full px-6 bg-white text-purple-700 hover:bg-white/90 shadow-lg"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Re-shuffle
              </Button>
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="classroom-control-button rounded-full px-6 hover:text-slate-950"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>
      )}

      {/* Name management */}
      <div className="w-full max-w-2xl">
        <h3 className="text-lg font-bold text-white mb-3">
          Students ({names.length})
        </h3>

        {/* Quick add */}
        <div className="flex gap-2 mb-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addName()}
            placeholder="Add a student..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <Button onClick={addName} className="bg-purple-500 hover:bg-purple-600 text-white shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Name chips */}
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
          {names.map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-sm"
            >
              {name}
              <button
                onClick={() => removeName(i)}
                className="text-white/40 hover:text-red-400 ml-1"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {names.length < 2 && (
          <p className="text-center text-white/50 text-sm mt-4">
            Add at least 2 students to shuffle
          </p>
        )}
      </div>
    </div>
  );
}

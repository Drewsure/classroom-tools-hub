"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { RosterManager } from "./roster-manager";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import { Sparkles, RotateCcw, Play, Plus, Trash2, UserPlus, History, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NameEntry {
  id: number;
  text: string;
}

/** Convert string[] → NameEntry[] with stable IDs */
function toEntries(names: string[], startId = 1): NameEntry[] {
  return names.map((text, i) => ({ id: i + startId, text }));
}

export function RandomNamePicker() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  // Shared roster (syncs with Group Generator)
  const { students, setStudents } = useStudentRoster();
  // Tool skin
  const { skinId, setSkinId, skin } = useToolSkin("name-picker");

  // Local editing state — initialized from shared roster, synced back on change
  const [names, setNames] = useState<NameEntry[]>(() =>
    students.length > 0
      ? toEntries(students)
      : toEntries(["Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona"]),
  );
  const idRef = useRef(1000);

  // Sync FROM shared roster → local state when roster changes externally (e.g. load class)
  useEffect(() => {
    if (students.length > 0) {
      setNames(toEntries(students));
    }
  }, [students]);

  // Sync TO shared roster → when local names change
  const syncToRoster = useCallback(
    (newNames: NameEntry[]) => {
      const texts = newNames.map((n) => n.text).filter(Boolean);
      setStudents(texts);
    },
    [setStudents],
  );

  const [spinning, setSpinning] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [newName, setNewName] = useState("");
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Remove-on-pick mode (default ON — each spin removes the winner so the next spin gives a different student)
  const [removeOnPick, setRemoveOnPick] = useState(true);
  // Pool of names removed this session — so the teacher can restore them
  const [pickedNames, setPickedNames] = useState<{ text: string; ts: number }[]>([]);

  const handleSpin = useCallback(() => {
    if (names.length < 2 || spinning) return;
    setWinner(null);
    setSpinning(true);
    sound.playClick();

    let tickCount = 0;
    const totalTicks = 30 + Math.floor(Math.random() * 10);
    let currentIdx = 0;

    spinIntervalRef.current = setInterval(() => {
      currentIdx = (currentIdx + 1) % names.length;
      setHighlightIdx(currentIdx);
      sound.playTick(800 + (tickCount * 10));

      tickCount++;
      if (tickCount >= totalTicks) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        const finalIdx = Math.floor(Math.random() * names.length);
        const winnerName = names[finalIdx].text || `Player ${finalIdx + 1}`;
        setHighlightIdx(finalIdx);
        setWinner(winnerName);
        setSpinning(false);
        sound.playExplosion();
        sound.playSparkle();
        flashFn("rgba(255, 215, 0, 0.8)");
        shake(2);
        burstConfetti(100, 50, 40);
        setTimeout(() => burstConfetti(60, 30, 50), 300);

        // Remove the winner from the pool if remove-on-pick is ON
        if (removeOnPick) {
          const winnerEntry = names[finalIdx];
          const remaining = names.filter((_, i) => i !== finalIdx);
          setNames(remaining);
          syncToRoster(remaining);
          setPickedNames((prev) => [{ text: winnerEntry.text || `Player ${finalIdx + 1}`, ts: Date.now() }, ...prev]);
        }
      }
    }, 100);
  }, [names, spinning, sound, flashFn, shake, burstConfetti, removeOnPick, syncToRoster]);

  const handleReset = useCallback(() => {
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    setSpinning(false);
    setWinner(null);
    setHighlightIdx(null);
    sound.playClick();
  }, [sound]);

  // Restore all picked names back into the pool
  const restoreAllPicked = () => {
    if (pickedNames.length === 0) return;
    const restored = [...pickedNames].reverse().map((p) => ({ id: idRef.current++, text: p.text }));
    const merged = [...names, ...restored];
    setNames(merged);
    syncToRoster(merged);
    setPickedNames([]);
    sound.playClick();
  };

  // Restore a single picked name
  const restoreOne = (ts: number) => {
    const target = pickedNames.find((p) => p.ts === ts);
    if (!target) return;
    const merged = [...names, { id: idRef.current++, text: target.text }];
    setNames(merged);
    syncToRoster(merged);
    setPickedNames((prev) => prev.filter((p) => p.ts !== ts));
    sound.playClick();
  };

  const addName = () => {
    const newNames = [...names, { id: idRef.current++, text: "" }];
    setNames(newNames);
    syncToRoster(newNames);
  };

  const addNameFromInput = () => {
    if (!newName.trim()) return;
    const newNames = [...names, { id: idRef.current++, text: newName.trim() }];
    setNames(newNames);
    syncToRoster(newNames);
    setNewName("");
    sound.playClick();
  };

  const updateName = (id: number, text: string) => {
    const newNames = names.map((n) => (n.id === id ? { ...n, text } : n));
    setNames(newNames);
    syncToRoster(newNames);
  };

  const removeName = (id: number) => {
    const newNames = names.filter((n) => n.id !== id);
    setNames(newNames);
    syncToRoster(newNames);
  };

  const handleBulkAdd = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const newEntries = lines.map((text) => ({ id: idRef.current++, text }));
    const newNames = [...names, ...newEntries];
    setNames(newNames);
    syncToRoster(newNames);
    setBulkText("");
    setShowBulk(false);
    sound.playClick();
  };

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Shared roster manager (save/load classes) */}
      <div className="w-full max-w-2xl">
        <RosterManager
          localStudents={names.map((n) => n.text).filter(Boolean)}
          onStudentsChange={(s) => setNames(toEntries(s))}
        />
      </div>

      {/* Remove-on-pick toggle + restore controls */}
      <div className="w-full max-w-2xl flex flex-wrap items-center gap-3">
        <button
          onClick={() => setRemoveOnPick((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
            removeOnPick
              ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
              : "bg-white/10 border-white/20 text-white/60",
          )}
          title="When ON, each spin removes the winner so the next spin picks a different student"
        >
          <span className={cn("w-3 h-3 rounded-full border", removeOnPick ? "bg-emerald-400 border-emerald-300" : "border-white/40")} />
          Remove picked name {removeOnPick ? "(ON)" : "(OFF)"}
        </button>
        {pickedNames.length > 0 && (
          <button
            onClick={restoreAllPicked}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/30 transition-all"
          >
            <History className="h-3.5 w-3.5" />
            Restore all picked ({pickedNames.length})
          </button>
        )}
        {names.length < 2 && pickedNames.length > 0 && (
          <span className="text-xs text-amber-300/80 font-semibold">
            All names picked! Restore to spin again.
          </span>
        )}
      </div>

      {/* Picked history strip */}
      {pickedNames.length > 0 && (
        <div className="w-full max-w-2xl">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1.5 font-bold">Already picked</p>
          <div className="flex flex-wrap gap-1.5">
            {pickedNames.map((p) => (
              <button
                key={p.ts}
                onClick={() => restoreOne(p.ts)}
                className="group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-emerald-500/10 hover:border-emerald-400/40 hover:text-emerald-200 transition-all"
                title="Click to restore this name"
              >
                <span className="line-through opacity-70">{p.text}</span>
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full max-w-2xl h-80 sm:h-96 rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br flex flex-col items-center justify-center p-6", skin.bgGradient)}>
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={3} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {winner !== null ? (
            <div className="relative z-10 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">
                🏆 Winner 🏆
              </p>
              <div className="text-5xl sm:text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-[winnerBounce_0.6s_ease-in-out_infinite] break-words px-4">
                {winner}
              </div>
              <Button
                onClick={handleReset}
                className="mt-6 rounded-full px-6 bg-white text-purple-700 hover:bg-white/90 shadow-lg"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Spin Again
              </Button>
            </div>
          ) : spinning || highlightIdx !== null ? (
            <div className="relative z-10 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-4">
                {spinning ? "Spinning..." : "Ready!"}
              </p>
              <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                {names.map((name, i) => (
                  <div
                    key={name.id}
                    className={cn(
                      "px-5 py-3 rounded-2xl font-bold text-lg transition-all duration-100 border-2",
                      i === highlightIdx
                        ? "bg-white text-purple-700 border-yellow-300 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.8)]"
                        : "bg-white/10 text-white border-white/20",
                    )}
                  >
                    {name.text || `Player ${i + 1}`}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-4 animate-bounce">🎯</div>
              <p className="text-2xl font-bold text-white mb-2">
                Random Name Picker
              </p>
              <p className="text-white/70 mb-4">
                {names.length} names ready · Click Spin to pick!
              </p>
              <Button
                onClick={handleSpin}
                disabled={names.length < 2}
                size="lg"
                className="rounded-full px-8 bg-white text-purple-700 hover:bg-white/90 shadow-lg text-lg"
              >
                <Play className="mr-2 h-5 w-5 fill-current" />
                Spin the Picker!
              </Button>
            </div>
          )}

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Name management */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">
            Names ({names.length})
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBulk(!showBulk)}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
            >
              <UserPlus className="mr-1 h-4 w-4" />
              Bulk Add
            </Button>
          </div>
        </div>

        {/* Quick add input */}
        <div className="flex gap-2 mb-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNameFromInput()}
            placeholder="Type a name and press Enter..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <Button
            onClick={addNameFromInput}
            className="bg-purple-500 hover:bg-purple-600 text-white shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {showBulk && (
          <div className="mb-4 p-4 rounded-2xl bg-black/30 border border-white/10">
            <p className="text-xs text-white/60 mb-2">Paste names (one per line):</p>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Alice\nBob\nCharlie"}
              className="bg-white/10 border-white/20 text-white min-h-[100px] mb-2"
            />
            <Button onClick={handleBulkAdd} size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
              Add All
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
          {names.map((name, i) => (
            <div
              key={name.id}
              className={cn(
                "flex items-center gap-1 rounded-xl border p-2 transition-colors",
                i === highlightIdx && spinning
                  ? "bg-white/30 border-yellow-300"
                  : "bg-white/10 border-white/15",
              )}
            >
              <input
                type="text"
                value={name.text}
                onChange={(e) => updateName(name.id, e.target.value)}
                placeholder={`Name ${i + 1}`}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/40 min-w-0"
              />
              <button
                onClick={() => removeName(name.id)}
                className="text-white/40 hover:text-red-400 transition-colors p-1 shrink-0"
                aria-label="Remove name"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {/* Add tile */}
          <button
            onClick={addName}
            className="flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-white/25 hover:border-white/50 hover:bg-white/5 transition-all p-2 text-white/50 hover:text-white text-sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {names.length < 2 && (
          <p className="text-center text-white/50 text-sm mt-4">
            Add at least 2 names to start spinning
          </p>
        )}
      </div>

      {winner && (
        <div className="text-center">
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Pick Another
          </Button>
        </div>
      )}
    </div>
  );
}

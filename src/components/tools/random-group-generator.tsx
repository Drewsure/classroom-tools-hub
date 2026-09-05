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
import { Users, Shuffle, Plus, Trash2, RotateCcw, UserPlus, History, X } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUP_COLORS = [
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
];

export function RandomGroupGenerator() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();

  // Shared roster (syncs with Name Picker)
  const { students, setStudents } = useStudentRoster();
  // Tool skin
  const { skinId, setSkinId, skin } = useToolSkin("group-generator");

  // Local names state — initialized from shared roster, synced back on change
  const [names, setNames] = useState<string[]>(() =>
    students.length > 0
      ? students
      : ["Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona",
         "George", "Hannah", "Ian", "Jane", "Kevin", "Lily"],
  );

  // Sync FROM shared roster → local state when roster changes externally
  useEffect(() => {
    if (students.length > 0) {
      setNames(students);
    }
  }, [students]);

  const [numGroups, setNumGroups] = useState(3);
  const [groups, setGroups] = useState<string[][] | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [newName, setNewName] = useState("");
  const shuffleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Remove-on-pick mode (default ON — after generating groups, all names get moved to "picked" so the next Generate pulls fresh names only)
  const [removeOnPick, setRemoveOnPick] = useState(true);
  const [pickedNames, setPickedNames] = useState<string[]>([]);

  const handleGenerate = useCallback(() => {
    // When removeOnPick is ON, only shuffle from the active pool (names not yet picked)
    const pool = removeOnPick ? names : names;
    if (pool.length < numGroups) return;
    setGroups(null);
    setShuffling(true);
    sound.playClick();
    sound.playWhoosh();

    // Shuffling animation — rapidly rearrange names
    let ticks = 0;
    const totalTicks = 20;
    shuffleRef.current = setInterval(() => {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const tempGroups: string[][] = [];
      for (let i = 0; i < numGroups; i++) tempGroups.push([]);
      shuffled.forEach((name, i) => {
        tempGroups[i % numGroups].push(name);
      });
      setGroups(tempGroups);
      sound.playTick(600 + ticks * 15);
      ticks++;
      if (ticks >= totalTicks) {
        if (shuffleRef.current) clearInterval(shuffleRef.current);
        // Final shuffle
        const finalShuffled = [...pool].sort(() => Math.random() - 0.5);
        const finalGroups: string[][] = [];
        for (let i = 0; i < numGroups; i++) finalGroups.push([]);
        finalShuffled.forEach((name, i) => {
          finalGroups[i % numGroups].push(name);
        });
        setGroups(finalGroups);
        setShuffling(false);
        sound.playExplosion();
        sound.playSparkle();
        flashFn("rgba(168, 85, 247, 0.7)");
        shake(2);
        burstConfetti(100, 50, 40);
        setTimeout(() => burstConfetti(60, 30, 50), 300);

        // If remove-on-pick is ON, move all just-used names into the picked pool
        if (removeOnPick) {
          setPickedNames((prev) => [...pool, ...prev]);
          setNames([]);
          setStudents([]);
        }
      }
    }, 120);
  }, [names, numGroups, sound, flashFn, shake, burstConfetti, removeOnPick, setStudents]);

  const handleReset = useCallback(() => {
    if (shuffleRef.current) clearInterval(shuffleRef.current);
    setGroups(null);
    setShuffling(false);
    sound.playClick();
  }, [sound]);

  // Restore all picked names back into the active pool
  const restoreAllPicked = () => {
    if (pickedNames.length === 0) return;
    const merged = [...names, ...pickedNames];
    setNames(merged);
    setStudents(merged);
    setPickedNames([]);
    sound.playClick();
  };

  const restoreOne = (idx: number) => {
    const target = pickedNames[idx];
    if (!target) return;
    const merged = [...names, target];
    setNames(merged);
    setStudents(merged);
    setPickedNames((prev) => prev.filter((_, i) => i !== idx));
    sound.playClick();
  };

  const addName = () => {
    if (newName.trim()) {
      const updated = [...names, newName.trim()];
      setNames(updated);
      setStudents(updated);
      setNewName("");
      sound.playClick();
    }
  };

  const removeName = (idx: number) => {
    const updated = names.filter((_, i) => i !== idx);
    setNames(updated);
    setStudents(updated);
  };

  const handleBulkAdd = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const updated = [...names, ...lines];
    setNames(updated);
    setStudents(updated);
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
          localStudents={names}
          onStudentsChange={(s) => setNames(s)}
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
          title="When ON, generating groups moves all names to 'picked' so the next Generate pulls from a fresh batch (if more names are added)"
        >
          <span className={cn("w-3 h-3 rounded-full border", removeOnPick ? "bg-emerald-400 border-emerald-300" : "border-white/40")} />
          Remove after grouping {removeOnPick ? "(ON)" : "(OFF)"}
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
        {names.length < numGroups && pickedNames.length > 0 && (
          <span className="text-xs text-amber-300/80 font-semibold">
            All used! Restore to shuffle again.
          </span>
        )}
      </div>

      {/* Picked history strip */}
      {pickedNames.length > 0 && (
        <div className="w-full max-w-2xl">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1.5 font-bold">Already grouped</p>
          <div className="flex flex-wrap gap-1.5">
            {pickedNames.map((p, i) => (
              <button
                key={`${p}-${i}`}
                onClick={() => restoreOne(i)}
                className="group flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/50 hover:bg-emerald-500/10 hover:border-emerald-400/40 hover:text-emerald-200 transition-all"
                title="Click to restore this name"
              >
                <span className="line-through opacity-70">{p}</span>
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Group count selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Groups:</span>
        <div className="flex gap-1">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => { setNumGroups(n); setGroups(null); }}
              className={cn(
                "w-10 h-10 rounded-full font-bold border-2 transition-all",
                numGroups === n
                  ? "bg-white text-purple-700 border-white scale-110 shadow-lg"
                  : "bg-white/10 text-white border-white/25 hover:bg-white/20",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn("relative w-full max-w-2xl min-h-80 sm:min-h-96 rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br flex flex-col items-center justify-center p-6", skin.bgGradient)}>
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={8} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {groups ? (
            <div className="relative z-10 w-full">
              <p className="text-center text-sm font-bold uppercase tracking-widest text-white/70 mb-4">
                {shuffling ? "Shuffling..." : `${numGroups} Groups Ready!`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((group, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-2xl p-4 bg-gradient-to-br border-2 border-white/20 shadow-lg transition-all",
                      GROUP_COLORS[i % GROUP_COLORS.length],
                      !shuffling && "animate-[winnerBounce_0.5s_ease-in-out]",
                    )}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center font-black text-white text-sm">
                        {i + 1}
                      </span>
                      <span className="font-bold text-white text-sm uppercase tracking-wider">
                        Team {i + 1}
                      </span>
                      <span className="ml-auto text-white/70 text-xs">
                        {group.length} {group.length === 1 ? "person" : "people"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.map((name, j) => (
                        <span
                          key={j}
                          className="px-2 py-1 rounded-lg bg-white/20 text-white text-sm font-medium"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-4 animate-bounce">👥</div>
              <p className="text-2xl font-bold text-white mb-2">
                Random Group Generator
              </p>
              <p className="text-white/70 mb-4">
                {names.length} people → {numGroups} groups
              </p>
              <Button
                onClick={handleGenerate}
                disabled={names.length < numGroups}
                size="lg"
                className="rounded-full px-8 bg-white text-purple-700 hover:bg-white/90 shadow-lg text-lg"
              >
                <Shuffle className="mr-2 h-5 w-5" />
                Generate Groups!
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
            Participants ({names.length})
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBulk(!showBulk)}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
            >
              <UserPlus className="mr-1 h-4 w-4" />
              Bulk
            </Button>
          </div>
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

        {/* Quick add */}
        <div className="flex gap-2 mb-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addName()}
            placeholder="Add a name..."
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
                aria-label="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {groups && !shuffling && (
        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            className="rounded-full px-6 bg-white text-purple-700 hover:bg-white/90 shadow-lg"
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Re-shuffle
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}

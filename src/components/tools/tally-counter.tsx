"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDramaticSound } from "@/hooks/use-effects";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { RosterManager } from "./roster-manager";
import { useTimer } from "@/hooks/use-timer";
import { formatTime } from "@/lib/timers";
import { Plus, Minus, RotateCcw, Trash2, Edit3, Check, X, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Counter {
  id: number;
  label: string;
  value: number;
  color: string;
}

const COUNTER_COLORS = [
  "from-emerald-500 to-green-600",
  "from-blue-500 to-cyan-600",
  "from-purple-500 to-fuchsia-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-yellow-500 to-amber-600",
  "from-teal-500 to-cyan-600",
  "from-indigo-500 to-blue-600",
];

export function TallyCounter() {
  const sound = useDramaticSound();
  const { skinId, setSkinId, skin } = useToolSkin("tally-counter");
  const { students } = useStudentRoster();

  const [counters, setCounters] = useState<Counter[]>([
    { id: 1, label: "Team A", value: 0, color: COUNTER_COLORS[0] },
    { id: 2, label: "Team B", value: 0, color: COUNTER_COLORS[1] },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [showTimer, setShowTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [showRoster, setShowRoster] = useState(false);
  const idRef = useRef(100);

  // Mini timer
  const timer = useTimer(timerMinutes * 60, {
    onComplete: () => {
      sound.playExplosion();
    },
  });

  const increment = useCallback((id: number) => {
    setCounters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: c.value + 1 } : c)),
    );
    sound.playTick(800);
  }, [sound]);

  const decrement = useCallback((id: number) => {
    setCounters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: Math.max(0, c.value - 1) } : c)),
    );
    sound.playTick(400);
  }, [sound]);

  const reset = useCallback((id: number) => {
    setCounters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: 0 } : c)),
    );
    sound.playClick();
  }, [sound]);

  const resetAll = useCallback(() => {
    setCounters((prev) => prev.map((c) => ({ ...c, value: 0 })));
    sound.playClick();
  }, [sound]);

  const addCounter = () => {
    const idx = counters.length % COUNTER_COLORS.length;
    setCounters((prev) => [
      ...prev,
      { id: idRef.current++, label: `Counter ${prev.length + 1}`, value: 0, color: COUNTER_COLORS[idx] },
    ]);
    sound.playClick();
  };

  const removeCounter = (id: number) => {
    setCounters((prev) => prev.filter((c) => c.id !== id));
    sound.playClick();
  };

  const startEdit = (counter: Counter) => {
    setEditingId(counter.id);
    setEditLabel(counter.label);
  };

  const saveEdit = () => {
    if (editingId !== null) {
      setCounters((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, label: editLabel || c.label } : c)),
      );
      setEditingId(null);
      sound.playClick();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  /** Load student names as counter labels */
  const loadFromRoster = () => {
    if (students.length === 0) return;
    const newCounters: Counter[] = students.map((name, i) => ({
      id: idRef.current++,
      label: name,
      value: 0,
      color: COUNTER_COLORS[i % COUNTER_COLORS.length],
    }));
    setCounters(newCounters);
    setShowRoster(false);
    sound.playSparkle();
  };

  const total = counters.reduce((sum, c) => sum + c.value, 0);
  const leader = counters.length > 0 && counters.some((c) => c.value > 0)
    ? counters.reduce((max, c) => (c.value > max.value ? c : max))
    : null;

  const { display: timerDisplay } = formatTime(timer.remaining);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Top bar: summary + toggle timer */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 shadow-lg flex-wrap">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Counters</p>
            <p className="text-2xl font-black text-white">{counters.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Total</p>
            <p className="text-2xl font-black text-emerald-400">{total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Leading</p>
            <p className="text-2xl font-black text-yellow-400 truncate max-w-24">
              {leader && leader.value > 0 ? leader.label : "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRoster(!showRoster)}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <Users className="mr-1 h-4 w-4" />
            Load Class
          </Button>
          <Button
            onClick={() => setShowTimer(!showTimer)}
            variant="outline"
            size="sm"
            className={cn(
              "border-white/25 hover:bg-white/20 hover:text-white",
              showTimer ? "bg-cyan-500/30 text-cyan-200" : "bg-white/10 text-white",
            )}
          >
            <Clock className="mr-1 h-4 w-4" />
            Timer
          </Button>
          <Button
            onClick={resetAll}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset All
          </Button>
        </div>
      </div>

      {/* Mini timer panel */}
      {showTimer && (
        <div className="w-full max-w-2xl p-4 rounded-2xl bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-400/30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-300/70">Countdown</p>
                <p className={cn(
                  "text-4xl font-black font-mono tabular-nums",
                  timer.isCompleted ? "text-red-400" : timer.remaining <= 10 ? "text-amber-400 animate-pulse" : "text-cyan-300",
                )}>
                  {timerDisplay}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {timer.isIdle && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 5, 10].map((m) => (
                    <button
                      key={m}
                      onClick={() => { setTimerMinutes(m); timer.setTime(m * 60); }}
                      className={cn(
                        "w-9 h-9 rounded-full text-xs font-bold border transition-all",
                        timerMinutes === m
                          ? "bg-cyan-500 text-white border-cyan-400"
                          : "bg-white/10 text-white border-white/20 hover:bg-white/20",
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              )}
              {timer.isIdle && (
                <Button
                  onClick={() => timer.start(timerMinutes * 60)}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  Start
                </Button>
              )}
              {timer.isRunning && (
                <Button
                  onClick={timer.pause}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Pause
                </Button>
              )}
              {timer.isPaused && (
                <Button
                  onClick={timer.resume}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  Resume
                </Button>
              )}
              {!timer.isIdle && (
                <Button
                  onClick={() => timer.reset(timerMinutes * 60)}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roster load panel */}
      {showRoster && (
        <div className="w-full max-w-2xl p-4 rounded-2xl bg-black/30 border border-white/10">
          <RosterManager
            localStudents={counters.map((c) => c.label)}
            onStudentsChange={() => {}}
          />
          {students.length > 0 ? (
            <Button
              onClick={loadFromRoster}
              className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Users className="mr-2 h-4 w-4" />
              Load {students.length} students as counters
            </Button>
          ) : (
            <p className="text-center text-white/50 text-sm mt-2">
              No saved class yet. Add names in the Name Picker or Group Generator first.
            </p>
          )}
        </div>
      )}

      {/* Counters grid */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {counters.map((counter) => (
          <div
            key={counter.id}
            className={cn(
              "relative rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br",
              counter.color,
              leader?.id === counter.id && counter.value > 0 && "ring-4 ring-yellow-400/50",
            )}
          >
            {/* Crown for leader */}
            {leader?.id === counter.id && counter.value > 0 && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl animate-bounce z-10">
                👑
              </div>
            )}

            <div className="p-5 flex flex-col items-center gap-3">
              {/* Label (editable) */}
              {editingId === counter.id ? (
                <div className="flex items-center gap-1 w-full">
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    className="bg-white/20 border-white/30 text-white text-center text-sm"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="text-white p-1 hover:bg-white/20 rounded">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={cancelEdit} className="text-white p-1 hover:bg-white/20 rounded">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full justify-center">
                  <span className="text-lg font-bold text-white drop-shadow uppercase tracking-wide truncate max-w-40">
                    {counter.label}
                  </span>
                  <button
                    onClick={() => startEdit(counter)}
                    className="text-white/50 hover:text-white transition-colors shrink-0"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Big number */}
              <div className="text-7xl sm:text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] tabular-nums">
                {counter.value}
              </div>

              {/* +/- buttons */}
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => decrement(counter.id)}
                  className="flex-1 h-14 bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 text-2xl font-black"
                  variant="outline"
                >
                  <Minus className="h-6 w-6" />
                </Button>
                <Button
                  onClick={() => increment(counter.id)}
                  className="flex-1 h-14 bg-white text-slate-900 hover:bg-white/90 text-2xl font-black shadow-lg"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>

              {/* Reset & remove */}
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => reset(counter.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset
                </Button>
                <Button
                  onClick={() => removeCounter(counter.id)}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/20 hover:bg-red-500/30 hover:text-white hover:border-red-400/50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Add counter card */}
        <button
          onClick={addCounter}
          className="rounded-3xl border-2 border-dashed border-white/30 hover:border-white/50 hover:bg-white/5 transition-all min-h-48 flex flex-col items-center justify-center gap-2 text-white/60 hover:text-white"
        >
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <Plus className="h-7 w-7" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">Add Counter</span>
        </button>
      </div>

      {counters.length === 0 && (
        <p className="text-white/50 text-sm">Add a counter to get started!</p>
      )}
    </div>
  );
}

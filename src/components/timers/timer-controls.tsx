"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PRESET_TIMES } from "@/lib/timers";
import type { TimerStatus } from "@/hooks/use-timer";
import { Pause, Play, RotateCcw } from "lucide-react";

interface TimerControlsProps {
  status: TimerStatus;
  hours: number;
  minutes: number;
  seconds: number;
  onHoursChange: (v: number) => void;
  onMinutesChange: (v: number) => void;
  onSecondsChange: (v: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onPreset: (seconds: number) => void;
  showPresets?: boolean;
  accentColor?: string;
}

/* ============================================================
   TimerStartButton — placed INSIDE the timer container
   Shows Start / Pause / Resume based on status
   Does NOT show Reset (Reset stays outside to prevent accidents)
   ============================================================ */
export function TimerStartButton({
  status,
  onStart,
  onPause,
  onResume,
  accentColor = "bg-emerald-500 hover:bg-emerald-600",
}: {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  accentColor?: string;
}) {
  return (
    <div className="relative z-10 mt-2">
      {status === "idle" && (
        <Button
          onClick={onStart}
          size="lg"
          className={cn(
            "rounded-2xl border-2 border-white/60 px-9 py-6 text-lg font-black text-white shadow-xl shadow-emerald-950/25 transition hover:-translate-y-0.5 active:scale-95",
            accentColor,
          )}
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          Start!
        </Button>
      )}
      {status === "running" && (
        <Button
          onClick={onPause}
          size="lg"
          className="rounded-2xl border-2 border-white/60 bg-amber-500 px-9 py-6 text-lg font-black text-white shadow-xl shadow-amber-950/25 transition hover:-translate-y-0.5 hover:bg-amber-600 active:scale-95"
        >
          <Pause className="mr-2 h-5 w-5 fill-current" />
          Pause
        </Button>
      )}
      {status === "paused" && (
        <Button
          onClick={onResume}
          size="lg"
          className={cn(
            "rounded-2xl border-2 border-white/60 px-9 py-6 text-lg font-black text-white shadow-xl shadow-emerald-950/25 transition hover:-translate-y-0.5 active:scale-95",
            accentColor,
          )}
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          Resume!
        </Button>
      )}
      {status === "completed" && (
        <p className="text-white/70 text-sm font-bold uppercase tracking-wider">
          ✅ Done!
        </p>
      )}
    </div>
  );
}

/* ============================================================
   TimerControls — placed OUTSIDE the timer container
   Shows: presets, custom time inputs, and Reset button only
   (Start/Pause/Resume is now inside the container via TimerStartButton)
   ============================================================ */
export function TimerControls({
  status,
  hours,
  minutes,
  seconds,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  onStart,
  onPause,
  onResume,
  onReset,
  onPreset,
  showPresets = true,
  accentColor = "bg-emerald-500 hover:bg-emerald-600",
}: TimerControlsProps) {
  const isEditable = status === "idle";
  // Show Reset when: running, paused, or completed
  const showReset = status !== "idle";

  return (
    <div className="w-full space-y-5">
      {showPresets && isEditable && (
        <div className="rounded-3xl border border-white/12 bg-white/[0.055] p-3">
          <p className="text-xs font-black text-white/70 uppercase tracking-wider mb-2">
            Quick presets
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {PRESET_TIMES.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onPreset(preset.seconds)}
                className="rounded-xl border border-white/25 bg-white/12 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/20 active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isEditable && (
        <div className="rounded-3xl border border-white/12 bg-white/[0.055] p-3">
          <p className="text-xs font-black text-white/70 uppercase tracking-wider mb-2">
            Custom time
          </p>
          <div className="flex items-center justify-center gap-2">
            <TimeInput
              label="Hours"
              value={hours}
              onChange={onHoursChange}
              max={23}
            />
            <Colon />
            <TimeInput
              label="Min"
              value={minutes}
              onChange={onMinutesChange}
              max={59}
            />
            <Colon />
            <TimeInput
              label="Sec"
              value={seconds}
              onChange={onSecondsChange}
              max={59}
            />
          </div>
        </div>
      )}

      {/* Reset button — guarded and outside the main action area */}
      {showReset && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <GuardedResetButton onReset={onReset} />
        </div>
      )}
    </div>
  );
}

function GuardedResetButton({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timeout = window.setTimeout(() => setArmed(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [armed]);

  return (
    <Button
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setArmed(false);
        onReset();
      }}
      size="lg"
      variant="outline"
      className={cn(
        "rounded-2xl border-2 px-5 text-white shadow-sm transition-all",
        armed
          ? "border-rose-300 bg-rose-500/85 hover:bg-rose-500 hover:text-white"
          : "border-white/25 bg-white/10 hover:bg-white/20 hover:text-white",
      )}
    >
      <RotateCcw className="mr-2 h-5 w-5" />
      {armed ? "Confirm Reset" : "Teacher Reset"}
    </Button>
  );
}

function TimeInput({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <Input
        type="number"
        min={0}
        max={max}
        value={value.toString().padStart(2, "0")}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (isNaN(v)) onChange(0);
          else onChange(Math.max(0, Math.min(max, v)));
        }}
        className="h-20 w-20 rounded-2xl border-white/25 bg-white/12 text-center text-3xl font-black text-white shadow-inner [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-xs text-white/60 mt-1.5 font-semibold uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="text-4xl font-bold text-white/80 pb-6">:</span>
  );
}

"use client";

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
            "rounded-full px-8 text-white shadow-lg",
            accentColor,
          )}
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          Start
        </Button>
      )}
      {status === "running" && (
        <Button
          onClick={onPause}
          size="lg"
          className="rounded-full px-8 text-white shadow-lg bg-amber-500 hover:bg-amber-600"
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
            "rounded-full px-8 text-white shadow-lg",
            accentColor,
          )}
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          Resume
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
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
            Quick presets
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {PRESET_TIMES.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onPreset(preset.seconds)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isEditable && (
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
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

      {/* Reset button — OUTSIDE the container (students won't accidentally hit it) */}
      {showReset && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            onClick={onReset}
            size="lg"
            variant="outline"
            className="rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        </div>
      )}
    </div>
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
        className="w-20 h-20 text-center text-3xl font-bold bg-white/10 border-white/25 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

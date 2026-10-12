"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PRESET_TIMES } from "@/lib/timers";
import type { TimerStatus } from "@/hooks/use-timer";
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";

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
  const startKeyProps = getKeyboardActivationProps(onStart);
  const pauseKeyProps = getKeyboardActivationProps(onPause);
  const resumeKeyProps = getKeyboardActivationProps(onResume);

  return (
    <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
      {status === "idle" && (
        <Button
          ref={getNativeActivationRef(onStart)}
          {...startKeyProps}
          size="lg"
          className={cn(
            "rounded-2xl border-2 border-white/60 px-10 py-7 text-xl font-black text-white shadow-xl shadow-emerald-950/25 transition hover:-translate-y-0.5 active:scale-95",
            accentColor,
          )}
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          Start!
        </Button>
      )}
      {status === "running" && (
        <Button
          ref={getNativeActivationRef(onPause)}
          {...pauseKeyProps}
          size="lg"
          className="rounded-2xl border-2 border-white/60 bg-amber-500 px-10 py-7 text-xl font-black text-white shadow-xl shadow-amber-950/25 transition hover:-translate-y-0.5 hover:bg-amber-600 active:scale-95"
        >
          <Pause className="mr-2 h-5 w-5 fill-current" />
          Pause
        </Button>
      )}
      {status === "paused" && (
        <Button
          ref={getNativeActivationRef(onResume)}
          {...resumeKeyProps}
          size="lg"
          className={cn(
            "rounded-2xl border-2 border-white/60 px-10 py-7 text-xl font-black text-white shadow-xl shadow-emerald-950/25 transition hover:-translate-y-0.5 active:scale-95",
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

function getNativeActivationRef(action: () => void) {
  return (node: HTMLButtonElement | null) => {
    if (!node) return;

    const activate = (event: Event) => {
      event.preventDefault();
      const now = Date.now();
      const lastActivation = Number(node.dataset.lastActivation ?? 0);
      if (now - lastActivation < 250) return;

      node.dataset.lastActivation = String(now);
      action();
    };

    node.onclick = activate;
    node.onpointerdown = activate;
  };
}

function getKeyboardActivationProps(action: () => void) {
  return {
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      action();
    },
  };
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
    <div className="grid w-full max-w-7xl grid-cols-1 gap-2 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
      {showPresets && isEditable && (
        <div className="rounded-2xl border border-white/18 bg-slate-950/55 p-2.5 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-[0.65rem] font-black uppercase tracking-wider text-white/70">
            Quick presets
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {PRESET_TIMES.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onPreset(preset.seconds)}
                className="rounded-xl border border-white/25 bg-white/12 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/20 active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isEditable && (
        <div className="rounded-2xl border border-white/18 bg-slate-950/55 p-2.5 shadow-xl backdrop-blur-md lg:col-start-2">
          <p className="mb-2 text-center text-[0.65rem] font-black uppercase tracking-wider text-white/70">
            Custom time
          </p>
          <div className="flex items-center justify-center gap-2">
            <TimeInput
              label="Hours"
              value={hours}
              onChange={onHoursChange}
              max={23}
              step={1}
            />
            <Colon />
            <TimeInput
              label="Min"
              value={minutes}
              onChange={onMinutesChange}
              max={59}
              step={1}
            />
            <Colon />
            <TimeInput
              label="Sec"
              value={seconds}
              onChange={onSecondsChange}
              max={59}
              step={5}
            />
          </div>
        </div>
      )}

      {/* Reset button — guarded and outside the main action area */}
      {showReset && (
        <div className="flex items-center justify-center gap-3 lg:col-span-3">
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
        "rounded-2xl border-2 px-5 py-5 text-white shadow-sm transition-all",
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
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
  step: number;
}) {
  const update = (nextValue: number) => onChange(Math.max(0, Math.min(max, nextValue)));

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => update(value + step)}
        aria-label={`Increase ${label}`}
        className="grid h-8 w-16 place-items-center rounded-xl border border-white/20 bg-white/15 text-white shadow-sm transition hover:bg-white/25 active:scale-95"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <Input
        type="number"
        min={0}
        max={max}
        value={value.toString().padStart(2, "0")}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (isNaN(v)) onChange(0);
          else update(v);
        }}
        className="h-14 w-16 rounded-2xl border-white/25 bg-white/12 text-center text-2xl font-black text-white shadow-inner [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => update(value - step)}
        aria-label={`Decrease ${label}`}
        className="grid h-8 w-16 place-items-center rounded-xl border border-white/20 bg-white/15 text-white shadow-sm transition hover:bg-white/25 active:scale-95"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
      <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white/60">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="pb-5 text-3xl font-bold text-white/80">:</span>
  );
}

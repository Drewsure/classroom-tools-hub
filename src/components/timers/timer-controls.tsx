"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PRESET_TIMES } from "@/lib/timers";
import type { TimerStatus } from "@/hooks/use-timer";
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";
import styles from "./timer-layout.module.css";

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
    <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
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
          className="rounded-2xl border-2 border-amber-200 bg-amber-300 px-8 py-6 text-xl font-black text-zinc-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-amber-400 active:scale-95"
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
    <div className="grid w-full max-w-7xl grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      {showPresets && isEditable && (
        <div className="min-w-0 rounded-lg border border-zinc-500 bg-zinc-950 p-2 shadow-xl">
          <p className="mb-1 text-xs font-black uppercase tracking-wider text-white">
            Quick presets
          </p>
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-8 md:grid-cols-5 lg:grid-cols-8">
            {PRESET_TIMES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onPreset(preset.seconds)}
                className="min-h-7 rounded-md border border-zinc-300 bg-white px-1 py-1 text-sm font-black text-zinc-950 shadow-sm transition hover:bg-cyan-100 focus-visible:outline-2 focus-visible:outline-yellow-300 active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isEditable && (
        <div className="min-w-0 rounded-lg border border-zinc-500 bg-zinc-950 p-2 shadow-xl">
          <p className="mb-1 text-center text-xs font-black uppercase tracking-wider text-white">
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
        <div className="flex justify-end md:col-span-2">
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
        "rounded-lg border-2 px-5 py-5 text-white shadow-2xl transition-all",
        armed
          ? "border-rose-200 bg-rose-600 hover:bg-rose-500 hover:text-white"
          : "border-amber-200 bg-zinc-950 hover:bg-zinc-800 hover:text-white",
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
  const inputId = useId();
  const update = (nextValue: number) => onChange(Math.max(0, Math.min(max, nextValue)));

  return (
    <div className={styles.timeInput}>
      <button
        type="button"
        onClick={() => update(value + step)}
        aria-label={`Increase ${label}`}
        className="grid h-7 w-16 place-items-center rounded-md border border-zinc-300 bg-zinc-800 text-white shadow-sm transition hover:bg-zinc-700 active:scale-95"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <Input
        id={inputId}
        aria-label={label}
        type="number"
        min={0}
        max={max}
        value={value.toString().padStart(2, "0")}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (isNaN(v)) onChange(0);
          else update(v);
        }}
        className="h-10 w-16 rounded-md border-zinc-400 bg-white text-center text-2xl font-black text-zinc-950 shadow-inner md:text-2xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => update(value - step)}
        aria-label={`Decrease ${label}`}
        className="grid h-7 w-16 place-items-center rounded-md border border-zinc-300 bg-zinc-800 text-white shadow-sm transition hover:bg-zinc-700 active:scale-95"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
      <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wide text-white">
        {label}
      </label>
    </div>
  );
}

function Colon() {
  return (
    <span className="pb-5 text-3xl font-bold text-white/80">:</span>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerOptions {
  onComplete?: () => void;
}

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export function useTimer(initialSeconds = 60, options?: UseTimerOptions) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetEndRef = useRef<number | null>(null);
  const onCompleteRef = useRef(options?.onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = options?.onComplete;
  }, [options?.onComplete]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (targetEndRef.current == null) return;
    const ms = targetEndRef.current - Date.now();
    const secs = Math.ceil(ms / 1000);
    if (secs <= 0) {
      setRemaining(0);
      clearTick();
      setStatus("completed");
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    } else {
      setRemaining(secs);
    }
  }, [clearTick]);

  const start = useCallback(
    (seconds?: number) => {
      const startValue = seconds ?? totalSeconds;
      if (seconds != null) {
        setTotalSeconds(seconds);
      }
      setRemaining(startValue);
      completedRef.current = false;
      setStatus("running");
      targetEndRef.current = Date.now() + startValue * 1000;
      clearTick();
      intervalRef.current = setInterval(tick, 100);
    },
    [totalSeconds, tick, clearTick],
  );

  const pause = useCallback(() => {
    if (status !== "running") return;
    clearTick();
    setStatus("paused");
    if (targetEndRef.current != null) {
      const ms = targetEndRef.current - Date.now();
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
    }
  }, [status, clearTick]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    setStatus("running");
    targetEndRef.current = Date.now() + remaining * 1000;
    clearTick();
    intervalRef.current = setInterval(tick, 100);
  }, [status, remaining, tick, clearTick]);

  const reset = useCallback(
    (seconds?: number) => {
      clearTick();
      completedRef.current = false;
      const value = seconds ?? totalSeconds;
      if (seconds != null) setTotalSeconds(seconds);
      setRemaining(value);
      setStatus("idle");
      targetEndRef.current = null;
    },
    [totalSeconds, clearTick],
  );

  const setTime = useCallback(
    (seconds: number) => {
      clearTick();
      completedRef.current = false;
      setTotalSeconds(seconds);
      setRemaining(seconds);
      setStatus("idle");
      targetEndRef.current = null;
    },
    [clearTick],
  );

  useEffect(() => {
    return () => clearTick();
  }, [clearTick]);

  const progress =
    totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;

  return {
    totalSeconds,
    remaining,
    status,
    start,
    pause,
    resume,
    reset,
    setTime,
    progress,
    isRunning: status === "running",
    isPaused: status === "paused",
    isCompleted: status === "completed",
    isIdle: status === "idle",
  };
}

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(0);

  const tick = useCallback(() => {
    if (startRef.current == null) return;
    setElapsed(baseRef.current + (Date.now() - startRef.current));
  }, []);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    startRef.current = Date.now();
    clearTick();
    intervalRef.current = setInterval(tick, 50);
  }, [running, tick, clearTick]);

  const pause = useCallback(() => {
    if (!running) return;
    setRunning(false);
    if (startRef.current != null) {
      baseRef.current += Date.now() - startRef.current;
    }
    startRef.current = null;
    clearTick();
  }, [running, clearTick]);

  const reset = useCallback(() => {
    clearTick();
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    baseRef.current = 0;
    startRef.current = null;
  }, [clearTick]);

  const lap = useCallback(() => {
    if (!running) return;
    setLaps((prev) => {
      const lastLapTotal = prev.reduce((sum, l) => sum + l, 0);
      return [...prev, elapsed - lastLapTotal];
    });
  }, [running, elapsed]);

  useEffect(() => {
    return () => clearTick();
  }, [clearTick]);

  return { elapsed, running, laps, start, pause, reset, lap };
}

"use client";

import { useEffect, useRef } from "react";
import { useDramaticSound } from "@/hooks/use-effects";

/**
 * Centralized timer audio hook — handles all countdown sound logic so every
 * timer gets consistent, dramatic audio without duplicating useEffect code.
 *
 * Audio sequence:
 *  - Every second during normal countdown: subtle tick
 *  - At 20 seconds remaining: dramatic build-up drone (one-shot)
 *  - From 10 down to 1: spoken countdown number (TTS MP3)
 *  - At 0 (completion): themed alarm matching the timer type
 *
 * @param timerType  e.g. "classic", "rocket", "bomb", "candle", ...
 * @param remaining   seconds remaining (from useTimer)
 * @param isRunning   whether the timer is actively running
 * @param isCompleted whether the timer just hit zero
 * @param onComplete  optional extra callback (confetti, flash, shake) fired at 0
 */
export function useTimerAudio(
  timerType: string,
  remaining: number,
  isRunning: boolean,
  isCompleted: boolean,
  onComplete?: () => void,
) {
  const sound = useDramaticSound();

  // Track which sounds have already played so we don't repeat them
  const lastRemainingRef = useRef<number | null>(null);
  const buildUpPlayedRef = useRef(false);
  const alarmPlayedRef = useRef(false);

  // Reset tracking when a new countdown starts (remaining jumps back up)
  useEffect(() => {
    if (isRunning && lastRemainingRef.current !== null && remaining > lastRemainingRef.current + 1) {
      buildUpPlayedRef.current = false;
      alarmPlayedRef.current = false;
    }
  }, [remaining, isRunning]);

  // Warm up the AudioContext when the timer starts running
  // Critical for mobile (Android/iOS) where AudioContext starts suspended
  // until a user gesture resumes it. The Start button click is that gesture.
  useEffect(() => {
    if (!isRunning) return;
    // Resume the AudioContext immediately on timer start
    // so it's ready when the first sound needs to play
    void sound.resume();
  }, [isRunning, sound]);

  // Per-tick audio
  useEffect(() => {
    if (!isRunning) {
      lastRemainingRef.current = null;
      return;
    }

    // Only fire on whole-second changes
    if (lastRemainingRef.current === remaining) return;
    const prev = lastRemainingRef.current;
    lastRemainingRef.current = remaining;

    // Skip the very first tick (timer just started — would double with playClick)
    if (prev === null) return;

    // 1. Dramatic build-up at exactly 20 seconds (one-shot)
    if (remaining === 20 && !buildUpPlayedRef.current) {
      buildUpPlayedRef.current = true;
      sound.playDramaticBuildUp();
    }

    // 2. Spoken countdown 10 → 1 (async — plays TTS MP3 via Web Audio API)
    if (remaining >= 1 && remaining <= 10) {
      void sound.playSpokenNumber(remaining);
    } else if (remaining > 10 && remaining < 20) {
      // 3. Subtle tick during 11-19 (fills the gap between build-up and spoken)
      sound.playTick(600 + (20 - remaining) * 20);
    } else if (remaining > 20 && remaining % 60 === 0) {
      // 4. Minute chime for long countdowns (every minute)
      sound.playTick(880);
    }
  }, [remaining, isRunning, sound]);

  // Completion alarm
  useEffect(() => {
    if (isCompleted && !alarmPlayedRef.current) {
      alarmPlayedRef.current = true;
      sound.playThemedAlarm(timerType);
      onComplete?.();
    }
    // Reset alarm flag when timer is no longer completed (reset/restart)
    if (!isCompleted) {
      alarmPlayedRef.current = false;
    }
  }, [isCompleted, timerType, sound, onComplete]);

  return sound;
}

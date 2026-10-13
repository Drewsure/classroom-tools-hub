"use client";

import { useEffect, useRef } from "react";
import { useDramaticSound } from "@/hooks/use-effects";
import { TimerMilestones } from "@/lib/classroom-cues";
import type { TimerStatus } from "@/hooks/use-timer";

const WARNING_PITCH: Record<string, number> = {
  classic: 880, rocket: 620, bomb: 320, candle: 480, hourglass: 560,
  circle: 1040, "snail-race": 720, "traffic-light": 660, bar: 800, pe: 960, tally: 840,
};

export function useTimerAudio(
  timerType: string,
  remaining: number,
  isRunning: boolean,
  isCompleted: boolean,
  onComplete?: () => void,
  status?: TimerStatus,
) {
  const sound = useDramaticSound();
  const { resume, stopAll, playTimerMilestone, playSpokenNumber, playTick, playThemedAlarm } = sound;
  const milestones = useRef(new TimerMilestones());
  const previous = useRef<number | null>(null);
  const warned = useRef(false);
  const alarmPlayed = useRef(false);
  const completion = useRef(onComplete);

  useEffect(() => { completion.current = onComplete; }, [onComplete]);
  useEffect(() => { if (isRunning) void resume(); }, [isRunning, resume]);

  useEffect(() => {
    if (status === "idle" || (previous.current !== null && remaining > previous.current)) {
      milestones.current.reset();
      warned.current = false;
      alarmPlayed.current = false;
      previous.current = null;
    }
    const before = previous.current;
    previous.current = remaining;
    const milestone = milestones.current.update(remaining, isRunning);
    if (!isRunning) {
      stopAll();
      return;
    }
    if (milestone !== null) {
      playTimerMilestone(milestone);
      return;
    }
    if (before === remaining || before === null) return;
    if (remaining === 20 && !warned.current) {
      warned.current = true;
      playTick(WARNING_PITCH[timerType] ?? 880);
    } else if (remaining >= 1 && remaining <= 10) {
      void playSpokenNumber(remaining);
    } else if (remaining > 10 && remaining < 20) {
      playTick((WARNING_PITCH[timerType] ?? 880) + (20 - remaining) * 10);
    }
  }, [remaining, isRunning, status, timerType, stopAll, playTimerMilestone, playTick, playSpokenNumber]);

  useEffect(() => {
    if (isCompleted && !alarmPlayed.current) {
      alarmPlayed.current = true;
      playThemedAlarm(timerType);
      completion.current?.();
    }
    if (!isCompleted) alarmPlayed.current = false;
  }, [isCompleted, timerType, playThemedAlarm]);

  return sound;
}

export function useElapsedTimerAudio(elapsedMs: number, running: boolean) {
  const sound = useDramaticSound();
  const { resume, stopAll, playTimerMilestone } = sound;
  const milestones = useRef(new TimerMilestones());
  const seconds = Math.floor(elapsedMs / 1000);
  useEffect(() => {
    if (seconds === 0 && !running) milestones.current.reset();
    const milestone = milestones.current.update(seconds, running, "up");
    if (!running) stopAll();
    if (running) void resume();
    if (milestone !== null) playTimerMilestone(milestone, true);
  }, [seconds, running, resume, stopAll, playTimerMilestone]);
  return sound;
}

"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useSoundEnabled } from "@/components/timers/timer-launcher";
import { SoundPadEngine, type PadStatus } from "@/lib/sound-pad-engine";

export function useSoundPad() {
  const soundEnabled = useSoundEnabled();
  const [volume, setVolumeState] = useState(0.5);
  const volumeRef = useRef(0.5);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [status, setStatus] = useState<PadStatus>({
    playingId: null, loadingId: null, error: null, loadedCount: 0,
  });
  const engineRef = useRef<SoundPadEngine | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new SoundPadEngine({
        files: SOUND_FILES, gains: SOUND_GAIN, filters: SOUND_FILTER, onStatus: setStatus,
      });
      engineRef.current.setVolume(volumeRef.current);
    }
    return engineRef.current;
  }, []);

  useEffect(() => {
    const engine = getEngine();
    void engine.preload();
    return () => {
      engine.dispose();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [getEngine]);

  useEffect(() => {
    if (!soundEnabled) engineRef.current?.stopAll();
  }, [soundEnabled]);

  const setVolume = useCallback((value: number) => {
    const next = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    volumeRef.current = next;
    setVolumeState(next);
    engineRef.current?.setVolume(next);
  }, []);

  const play = useCallback((id: string, volumeOverride?: number) => {
    if (!soundEnabled || (volumeOverride ?? volumeRef.current) <= 0) return;
    setLastPlayed(id);
    void getEngine().play(id, volumeOverride);
  }, [soundEnabled, getEngine]);

  const stopAll = useCallback(() => engineRef.current?.stopAll(), []);

  return { play, stopAll, volume, setVolume, lastPlayed, ...status, totalSounds: SOUND_FILES.length };
}
export interface SoundDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
  category: "positive" | "funny" | "attention" | "answers";
  key?: string;
  file: string;
}

const SOUND_GAIN: Record<string, number> = {
  cheer: 0.5,
  clap: 0.48,
  tada: 0.72,
  laugh: 0.38,
  ding: 0.72,
  wow: 0.72,
  boop: 0.72,
  buzzer: 0.32,
  fanfare: 0.68,
  drumroll: 0.38,
  cowbell: 0.36,
  gong: 0.7,
  sparkle: 0.44,
  spring: 0.4,
  quack: 0.5,
  monkey: 0.5,
  whoosh: 0.38,
  alarm: 0.28,
  true: 0.72,
  false: 0.72,
  yes: 0.72,
  no: 0.72,
  maybe: 0.72,
  "try-again": 0.72,
};

const SOUND_FILTER: Record<string, number> = {
  buzzer: 4200,
  alarm: 3800,
  quack: 5200,
  monkey: 5200,
  spring: 5600,
  cowbell: 6200,
  laugh: 6800,
  clap: 7200,
  cheer: 7600,
};

export const SOUND_FILES: { id: string; file: string }[] = [
  { id: "cheer", file: "cheer.mp3" },
  { id: "clap", file: "clap.mp3" },
  { id: "ding", file: "spoken-great-job.mp3" },     // SPOKEN: "Great job!"
  { id: "fanfare", file: "spoken-wrong.mp3" },       // SPOKEN: "Wrong!"
  { id: "tada", file: "spoken-correct.mp3" },        // SPOKEN: "Correct!"
  { id: "wow", file: "spoken-wow.mp3" },             // SPOKEN: "Wow!"
  { id: "boop", file: "spoken-lets-play.mp3" },      // SPOKEN: "Let's play!"
  { id: "buzzer", file: "buzzer.mp3" },
  { id: "spring", file: "spring.mp3" },
  { id: "drumroll", file: "heartbeat.mp3" },
  { id: "laugh", file: "laugh.mp3" },
  { id: "cowbell", file: "gameshow.mp3" },
  { id: "gong", file: "spoken-times-up.mp3" },       // SPOKEN: "Time's up!"
  { id: "sparkle", file: "sparkle.mp3" },
  { id: "quack", file: "ding.mp3" },
  { id: "monkey", file: "boop.mp3" },
  { id: "whoosh", file: "whoosh.mp3" },
  { id: "alarm", file: "alarm.mp3" },
  // Classroom Answers (NEW — 4th row)
  { id: "true", file: "spoken-true.mp3" },           // SPOKEN: "True!"
  { id: "false", file: "spoken-false.mp3" },         // SPOKEN: "False!"
  { id: "yes", file: "spoken-yes.mp3" },             // SPOKEN: "Yes!"
  { id: "no", file: "spoken-no.mp3" },               // SPOKEN: "No!"
  { id: "maybe", file: "spoken-maybe.mp3" },         // SPOKEN: "Maybe."
  { id: "try-again", file: "spoken-try-again.mp3" }, // SPOKEN: "Try again!"
];

export const SOUNDS: SoundDef[] = [
  // Positive & Encouraging
  { id: "cheer", label: "Crowd Cheer", emoji: "🎉", color: "from-yellow-400 to-orange-500", category: "positive", key: "1", file: "cheer.mp3" },
  { id: "clap", label: "Clap", emoji: "👏", color: "from-pink-400 to-rose-500", category: "positive", key: "2", file: "clap.mp3" },
  { id: "tada", label: "Correct!", emoji: "✅", color: "from-green-400 to-emerald-500", category: "positive", key: "3", file: "spoken-correct.mp3" },
  { id: "laugh", label: "Giggle", emoji: "😂", color: "from-lime-400 to-green-500", category: "positive", key: "4", file: "laugh.mp3" },
  { id: "ding", label: "Great Job!", emoji: "🌟", color: "from-violet-400 to-purple-500", category: "positive", key: "5", file: "spoken-great-job.mp3" },
  { id: "wow", label: "Wow!", emoji: "😮", color: "from-cyan-400 to-blue-500", category: "positive", key: "6", file: "spoken-wow.mp3" },

  // Game Show
  { id: "boop", label: "Let's Play!", emoji: "🥁", color: "from-amber-500 to-orange-600", category: "funny", key: "q", file: "spoken-lets-play.mp3" },
  { id: "buzzer", label: "Buzzer", emoji: "🚨", color: "from-red-500 to-rose-600", category: "funny", key: "w", file: "buzzer.mp3" },
  { id: "fanfare", label: "Wrong!", emoji: "❌", color: "from-red-400 to-red-500", category: "funny", key: "e", file: "spoken-wrong.mp3" },
  { id: "drumroll", label: "Heartbeat", emoji: "❤️", color: "from-rose-500 to-red-600", category: "funny", key: "r", file: "heartbeat.mp3" },
  { id: "cowbell", label: "Thinking", emoji: "🎬", color: "from-indigo-500 to-purple-600", category: "funny", key: "t", file: "gameshow.mp3" },
  { id: "gong", label: "Time's Up!", emoji: "⏰", color: "from-red-500 to-orange-600", category: "funny", key: "y", file: "spoken-times-up.mp3" },

  // Attention & Fun
  { id: "sparkle", label: "Sparkle", emoji: "✨", color: "from-fuchsia-400 to-pink-500", category: "attention", key: "a", file: "sparkle.mp3" },
  { id: "spring", label: "Spring", emoji: "🤪", color: "from-teal-400 to-cyan-500", category: "attention", key: "s", file: "spring.mp3" },
  { id: "quack", label: "Chime", emoji: "🔔", color: "from-sky-400 to-blue-500", category: "attention", key: "d", file: "ding.mp3" },
  { id: "monkey", label: "Boop", emoji: "🔵", color: "from-amber-500 to-orange-600", category: "attention", key: "f", file: "boop.mp3" },
  { id: "whoosh", label: "Whoosh", emoji: "💨", color: "from-sky-400 to-indigo-500", category: "attention", key: "g", file: "whoosh.mp3" },
  { id: "alarm", label: "Alarm", emoji: "🚨", color: "from-red-500 to-orange-500", category: "attention", key: "h", file: "alarm.mp3" },

  // Classroom Answers (NEW — 4th row for True/False, Yes/No, etc.)
  { id: "true", label: "True!", emoji: "✅", color: "from-green-500 to-emerald-600", category: "answers", key: "z", file: "spoken-true.mp3" },
  { id: "false", label: "False!", emoji: "❎", color: "from-red-500 to-rose-600", category: "answers", key: "x", file: "spoken-false.mp3" },
  { id: "yes", label: "Yes!", emoji: "👍", color: "from-emerald-500 to-teal-600", category: "answers", key: "c", file: "spoken-yes.mp3" },
  { id: "no", label: "No!", emoji: "👎", color: "from-rose-500 to-pink-600", category: "answers", key: "v", file: "spoken-no.mp3" },
  { id: "maybe", label: "Maybe.", emoji: "🤔", color: "from-amber-500 to-yellow-600", category: "answers", key: "b", file: "spoken-maybe.mp3" },
  { id: "try-again", label: "Try Again!", emoji: "🔄", color: "from-orange-500 to-red-600", category: "answers", key: "n", file: "spoken-try-again.mp3" },
];

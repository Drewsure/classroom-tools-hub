"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useSoundEnabled } from "@/components/timers/timer-launcher";

/**
 * Classroom Sound Pad Engine
 *
 * FIXES (vs old version):
 *  - Uses Web Audio API + AudioBuffer caching (NOT cloneNode)
 *    → Eliminates the 1+ minute delay when clicking buttons
 *  - Audio files are decoded once and cached for quick replay
 *  - Spoken-word buttons ("Correct!", "Great Job!", "Wow!", etc.)
 *    now use TTS audio matching their labels
 *  - Gentle loading fallback instead of harsh oscillator/noise sounds
 *
 * Audio files are fetched once, decoded once, then played via
 * AudioBufferSourceNode — no re-fetching, no cloneNode, no delays.
 */

export function useSoundPad() {
  const soundEnabled = useSoundEnabled();

  // AudioBuffer cache — decoded audio ready to play instantly
  const audioBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const loadingRef = useRef<Map<string, Promise<AudioBuffer | null>>>(new Map());
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Shared AudioContext (lazy-initialized on first user gesture)
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  const [volume, setVolume] = useState(0.5);
  const volumeRef = useRef(0.5);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);

  // Update volume ref when state changes
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // ===== AudioContext accessor =====
  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  const getOutput = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return null;

    if (!masterGainRef.current || !compressorRef.current) {
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 24;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.16;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.82;

      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      compressorRef.current = compressor;
      masterGainRef.current = masterGain;
    }

    return { ctx, input: compressorRef.current };
  }, [getCtx]);

  const loadSound = useCallback(
    async (id: string) => {
      const existing = audioBufferCacheRef.current.get(id);
      if (existing) return existing;

      const soundFile = SOUND_FILES.find((sound) => sound.id === id);
      if (!soundFile) return null;

      const loading = loadingRef.current.get(id);
      if (loading) return loading;

      const promise = (async () => {
        const ctx = getCtx();
        if (!ctx) return null;

        try {
          const response = await fetch(`/sounds/${soundFile.file}`);
          if (!response.ok) {
            console.warn(`[sound-pad] Failed to fetch ${soundFile.file}: ${response.status}`);
            return null;
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(arrayBuffer);
          audioBufferCacheRef.current.set(id, buffer);
          setLoadedCount((n) => n + 1);
          return buffer;
        } catch (e) {
          console.warn(`[sound-pad] Failed to load ${id} (${soundFile.file}):`, e);
          return null;
        } finally {
          loadingRef.current.delete(id);
        }
      })();

      loadingRef.current.set(id, promise);
      return promise;
    },
    [getCtx],
  );

  // ===== Preload: fetch + decode ALL sounds on mount (background, non-blocking) =====
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;

    let cancelled = false;

    SOUND_FILES.forEach(async ({ id }) => {
      const buffer = await loadSound(id);
      if (cancelled || !buffer) return;
    });

    return () => {
      cancelled = true;
    };
  }, [getCtx, loadSound]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      ctxRef.current = null;
      masterGainRef.current = null;
      compressorRef.current = null;
      if (ctx && ctx.state !== "closed") {
        void ctx.close().catch(() => undefined);
      }
    };
  }, []);

  const playSoftNotice = useCallback(() => {
    if (!soundEnabled) return;
    const output = getOutput();
    if (!output) return;
    const { ctx, input } = output;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08 * volumeRef.current, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(input);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, [getOutput, soundEnabled]);

  // ===== Main play function — INSTANT playback from AudioBuffer cache =====
  const play = useCallback(
    (soundId: string, volumeOverride?: number) => {
      if (!soundEnabled) return;
      setLastPlayed(soundId);

      const output = getOutput();
      if (!output) return;
      const { ctx, input } = output;

      // Resume AudioContext if suspended (required on mobile after user gesture)
      if (ctx.state === "suspended") {
        void ctx.resume().catch(() => {});
      }

      const buffer = audioBufferCacheRef.current.get(soundId);
      if (!buffer) {
        // Still loading: give a tiny clean cue, then play the real file when ready.
        playSoftNotice();
        void loadSound(soundId).then((loadedBuffer) => {
          if (loadedBuffer) play(soundId, volumeOverride);
        });
        return;
      }

      activeSourcesRef.current.forEach((src) => {
        try { src.stop(); } catch { /* already stopped */ }
      });
      activeSourcesRef.current.clear();

      // Create a new source node for instant playback (no re-fetch needed!)
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Volume control via GainNode, trimmed per sound to avoid classroom blasts.
      const gain = ctx.createGain();
      const effectiveVolume = volumeOverride ?? volumeRef.current;
      const trimmedVolume = effectiveVolume * (SOUND_GAIN[soundId] ?? 0.72);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(trimmedVolume, ctx.currentTime + 0.012);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = SOUND_FILTER[soundId] ?? 8400;
      filter.Q.value = 0.2;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(input);

      // Track for STOP
      activeSourcesRef.current.add(source);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
      };

      // START PLAYBACK — this is now instant
      try {
        source.start();
      } catch (e) {
        console.warn(`[sound-pad] Failed to start ${soundId}:`, e);
      }
    },
    [soundEnabled, getOutput, loadSound, playSoftNotice],
  );

  // ===== STOP ALL — immediately stops every active source =====
  const stopAll = useCallback(() => {
    // Stop all active BufferSource nodes instantly
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch { /* already stopped */ }
    });
    activeSourcesRef.current.clear();

    // Close and recreate AudioContext to kill any synth fallbacks
    const ctx = ctxRef.current;
    ctxRef.current = null;
    masterGainRef.current = null;
    compressorRef.current = null;
    if (ctx && ctx.state !== "closed") {
      void ctx.close().catch(() => undefined);
    }
  }, []);

  return { play, stopAll, volume, setVolume, lastPlayed, loadedCount, totalSounds: SOUND_FILES.length };
}

/* ============================================================
   SOUND DEFINITIONS — mapped to local audio files
   ============================================================
   UPDATES:
   - "Correct!"     → spoken-correct.mp3 (was tada.mp3 SFX)
   - "Great Job!"   → spoken-great-job.mp3 (was ding.mp3 SFX)
   - "Wow!"         → spoken-wow.mp3 (was wow.mp3 SFX)
   - "Wrong"        → spoken-wrong.mp3 (was wrong.mp3 SFX)
   - "Time's Up!"   → spoken-times-up.mp3 (was timeup.mp3)
   - "Let's Play!"  → spoken-lets-play.mp3 (was drumroll.mp3)
   ============================================================ */
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
  { id: "cheer", label: "Cheer", emoji: "🎉", color: "from-yellow-400 to-orange-500", category: "positive", key: "1", file: "cheer.mp3" },
  { id: "clap", label: "Clap", emoji: "👏", color: "from-pink-400 to-rose-500", category: "positive", key: "2", file: "clap.mp3" },
  { id: "tada", label: "Correct!", emoji: "✅", color: "from-green-400 to-emerald-500", category: "positive", key: "3", file: "spoken-correct.mp3" },
  { id: "laugh", label: "Laugh", emoji: "😂", color: "from-lime-400 to-green-500", category: "positive", key: "4", file: "laugh.mp3" },
  { id: "ding", label: "Great Job!", emoji: "🌟", color: "from-violet-400 to-purple-500", category: "positive", key: "5", file: "spoken-great-job.mp3" },
  { id: "wow", label: "Wow!", emoji: "😮", color: "from-cyan-400 to-blue-500", category: "positive", key: "6", file: "spoken-wow.mp3" },

  // Game Show
  { id: "boop", label: "Let's Play!", emoji: "🥁", color: "from-amber-500 to-orange-600", category: "funny", key: "q", file: "spoken-lets-play.mp3" },
  { id: "buzzer", label: "Buzzer", emoji: "🚨", color: "from-red-500 to-rose-600", category: "funny", key: "w", file: "buzzer.mp3" },
  { id: "fanfare", label: "Wrong!", emoji: "❌", color: "from-red-400 to-red-500", category: "funny", key: "e", file: "spoken-wrong.mp3" },
  { id: "drumroll", label: "Heart Beat", emoji: "❤️", color: "from-rose-500 to-red-600", category: "funny", key: "r", file: "heartbeat.mp3" },
  { id: "cowbell", label: "Game Show - Think!", emoji: "🎬", color: "from-indigo-500 to-purple-600", category: "funny", key: "t", file: "gameshow.mp3" },
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

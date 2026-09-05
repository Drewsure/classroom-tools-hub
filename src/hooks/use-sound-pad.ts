"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useSoundEnabled } from "@/components/timers/timer-launcher";

/**
 * Classroom Sound Pad Engine — AAA Quality
 *
 * FIXES (vs old version):
 *  - Uses Web Audio API + AudioBuffer caching (NOT cloneNode)
 *    → Eliminates the 1+ minute delay when clicking buttons
 *  - All audio files preloaded as decoded AudioBuffers on mount
 *    → Instant playback on click (microsecond latency)
 *  - Spoken-word buttons ("Correct!", "Great Job!", "Wow!", etc.)
 *    now use high-quality TTS audio matching their labels
 *  - Synth fallback retained for resilience if files fail to load
 *
 * Audio files are fetched once, decoded once, then played via
 * AudioBufferSourceNode — no re-fetching, no cloneNode, no delays.
 */

export function useSoundPad() {
  const soundEnabled = useSoundEnabled();

  // AudioBuffer cache — decoded audio ready to play instantly
  const audioBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const loadingRef = useRef<Set<string>>(new Set());
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Shared AudioContext (lazy-initialized on first user gesture)
  const ctxRef = useRef<AudioContext | null>(null);

  const [volume, setVolume] = useState(0.7);
  const volumeRef = useRef(0.7);
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

  // ===== Preload: fetch + decode ALL sounds on mount (background, non-blocking) =====
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;

    let cancelled = false;

    SOUND_FILES.forEach(async ({ id, file }) => {
      if (loadingRef.current.has(id) || audioBufferCacheRef.current.has(id)) return;
      loadingRef.current.add(id);

      try {
        const response = await fetch(`/sounds/${file}`);
        if (!response.ok) {
          console.warn(`[sound-pad] Failed to fetch ${file}: ${response.status}`);
          return;
        }
        const arrayBuffer = await response.arrayBuffer();

        // decodeAudioData needs the AudioContext to be running OR will queue
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        audioBufferCacheRef.current.set(id, buffer);
        loadingRef.current.delete(id);
        setLoadedCount((n) => n + 1);
      } catch (e) {
        console.warn(`[sound-pad] Failed to load ${id} (${file}):`, e);
        loadingRef.current.delete(id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [getCtx]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        try { void ctxRef.current.close(); } catch { /* ignore */ }
        ctxRef.current = null;
      }
    };
  }, []);

  // ===== Synthesis fallback (used if audio file not yet loaded or failed) =====
  const synthTone = useCallback(
    (freq: number, duration: number, opts: { type?: OscillatorType; vol?: number; sweepTo?: number } = {}) => {
      if (!soundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = opts.type ?? "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (opts.sweepTo) osc.frequency.exponentialRampToValueAtTime(opts.sweepTo, ctx.currentTime + duration);
      const vol = (opts.vol ?? 0.3) * volumeRef.current;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [getCtx, soundEnabled],
  );

  const synthNoise = useCallback(
    (duration: number, vol: number, filterFreq: number) => {
      if (!soundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = filterFreq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * volumeRef.current, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    },
    [getCtx, soundEnabled],
  );

  // Synthesis fallback sounds (kept the same IDs as before)
  const synthFallback = useCallback(
    (id: string) => {
      switch (id) {
        case "cheer": synthNoise(1.2, 0.35, 2500); break;
        case "clap": for (let i = 0; i < 6; i++) setTimeout(() => synthNoise(0.08, 0.3, 1500), i * 100); break;
        case "ding": synthTone(1318.5, 0.6, { type: "sine", vol: 0.4 }); break;
        case "fanfare": [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => synthTone(f, 0.3, { type: "sawtooth", vol: 0.2 }), i * 150)); break;
        case "tada": [659, 784, 988, 1318].forEach((f, i) => setTimeout(() => synthTone(f, 0.1, { type: "triangle", vol: 0.2 }), i * 50)); break;
        case "wow": synthTone(300, 0.15, { type: "sawtooth", vol: 0.25, sweepTo: 500 }); setTimeout(() => synthTone(500, 0.2, { type: "sawtooth", vol: 0.25, sweepTo: 700 }), 150); break;
        case "boop": [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => synthTone(f, 0.3, { type: "sawtooth", vol: 0.2 }), i * 150)); break;
        case "buzzer": synthTone(150, 0.5, { type: "sawtooth", vol: 0.3 }); synthNoise(0.5, 0.15, 800); break;
        case "spring": synthTone(200, 0.3, { type: "sine", vol: 0.3, sweepTo: 800 }); break;
        case "drumroll": synthTone(60, 0.15, { type: "sine", vol: 0.4 }); setTimeout(() => synthTone(60, 0.15, { type: "sine", vol: 0.4 }), 300); break;
        case "laugh": [400, 350, 300].forEach((f, i) => setTimeout(() => synthTone(f, 0.12, { type: "sawtooth", vol: 0.25 }), i * 180)); break;
        case "cowbell": for (let i = 0; i < 12; i++) setTimeout(() => synthNoise(0.05, 0.2, 400), i * 60); break;
        case "gong": synthTone(80, 2, { type: "sine", vol: 0.4 }); synthNoise(0.5, 0.2, 2000); break;
        case "sparkle": [1046, 1318, 1568, 2093].forEach((f, i) => setTimeout(() => synthTone(f, 0.3, { type: "triangle", vol: 0.15 }), i * 60)); break;
        case "quack": [2000, 2400, 2000, 2200].forEach((f, i) => setTimeout(() => synthTone(f, 0.08, { type: "sine", vol: 0.15 }), i * 80)); break;
        case "monkey": synthTone(200, 0.1, { type: "sawtooth", vol: 0.3, sweepTo: 150 }); setTimeout(() => synthTone(180, 0.15, { type: "sawtooth", vol: 0.25, sweepTo: 120 }), 120); break;
        case "whoosh": synthTone(200, 0.4, { type: "sawtooth", vol: 0.2, sweepTo: 800 }); synthNoise(0.4, 0.15, 600); break;
        case "alarm": for (let i = 0; i < 3; i++) { setTimeout(() => synthTone(880, 0.12, { type: "square", vol: 0.2 }), i * 300); setTimeout(() => synthTone(988, 0.12, { type: "square", vol: 0.2 }), i * 300 + 150); } break;
        // Classroom Answers synth fallbacks
        case "true": synthTone(880, 0.15, { type: "sine", vol: 0.3 }); setTimeout(() => synthTone(1108, 0.2, { type: "sine", vol: 0.3 }), 150); break;
        case "false": synthTone(440, 0.15, { type: "sawtooth", vol: 0.3 }); setTimeout(() => synthTone(330, 0.25, { type: "sawtooth", vol: 0.3 }), 150); break;
        case "yes": synthTone(659, 0.2, { type: "sine", vol: 0.3 }); break;
        case "no": synthTone(330, 0.2, { type: "sawtooth", vol: 0.3 }); break;
        case "maybe": synthTone(523, 0.15, { type: "triangle", vol: 0.25 }); setTimeout(() => synthTone(587, 0.2, { type: "triangle", vol: 0.25 }), 150); break;
        case "try-again": synthTone(440, 0.1, { type: "square", vol: 0.25 }); setTimeout(() => synthTone(523, 0.1, { type: "square", vol: 0.25 }), 100); setTimeout(() => synthTone(659, 0.2, { type: "square", vol: 0.25 }), 200); break;
      }
    },
    [synthTone, synthNoise],
  );

  // ===== Main play function — INSTANT playback from AudioBuffer cache =====
  const play = useCallback(
    (soundId: string) => {
      if (!soundEnabled) return;
      setLastPlayed(soundId);

      const ctx = getCtx();
      if (!ctx) {
        synthFallback(soundId);
        return;
      }

      // Resume AudioContext if suspended (required on mobile after user gesture)
      if (ctx.state === "suspended") {
        void ctx.resume().catch(() => {});
      }

      const buffer = audioBufferCacheRef.current.get(soundId);
      if (!buffer) {
        // Still loading or failed — use synth fallback immediately
        synthFallback(soundId);
        return;
      }

      // Create a new source node for instant playback (no re-fetch needed!)
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Volume control via GainNode
      const gain = ctx.createGain();
      gain.gain.value = volumeRef.current;

      source.connect(gain);
      gain.connect(ctx.destination);

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
        synthFallback(soundId);
      }
    },
    [soundEnabled, synthFallback, getCtx],
  );

  // ===== STOP ALL — immediately stops every active source =====
  const stopAll = useCallback(() => {
    // Stop all active BufferSource nodes instantly
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch { /* already stopped */ }
    });
    activeSourcesRef.current.clear();

    // Close and recreate AudioContext to kill any synth fallbacks
    if (ctxRef.current) {
      try { void ctxRef.current.close(); } catch { /* ignore */ }
      ctxRef.current = null;
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
  { id: "quack", file: "chirping.mp3" },
  { id: "monkey", file: "dog.mp3" },
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
  { id: "quack", label: "Chirping", emoji: "🐦", color: "from-sky-400 to-blue-500", category: "attention", key: "d", file: "chirping.mp3" },
  { id: "monkey", label: "Dog", emoji: "🐶", color: "from-amber-500 to-orange-600", category: "attention", key: "f", file: "dog.mp3" },
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

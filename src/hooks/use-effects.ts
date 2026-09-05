"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSoundEnabled } from "@/components/timers/timer-launcher";

/* ============================================================
   PARTICLE FIELD — drifting particles for ambience
   ============================================================ */
export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

export function useParticleField(count = 30, seed = 0) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i + seed * 1000,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 4,
      drift: (Math.random() - 0.5) * 40,
    })),
  );
  return particles;
}

/* ============================================================
   CONFETTI BURST — fires on completion
   ============================================================ */
export interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rot: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  spin: number;
  shape: "rect" | "circle" | "triangle";
}

const CONFETTI_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
];

export function useConfetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const idRef = useRef(0);

  const burst = useCallback(
    (count = 80, originX = 50, originY = 50) => {
      const newPieces: ConfettiPiece[] = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 60 + 40;
        return {
          id: idRef.current++,
          x: originX + (Math.random() - 0.5) * 10,
          y: originY + (Math.random() - 0.5) * 10,
          rot: Math.random() * 360,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: Math.random() * 8 + 6,
          vx: Math.cos(angle) * speed * 0.6,
          vy: Math.sin(angle) * speed - Math.random() * 40,
          spin: (Math.random() - 0.5) * 720,
          shape: ["rect", "circle", "triangle"][
            Math.floor(Math.random() * 3)
          ] as "rect" | "circle" | "triangle",
        };
      });
      setPieces((prev) => [...prev, ...newPieces]);

      // Clean up old pieces after animation
      setTimeout(() => {
        setPieces((prev) =>
          prev.filter((p) => !newPieces.find((np) => np.id === p.id)),
        );
      }, 3500);
    },
    [],
  );

  const clear = useCallback(() => setPieces([]), []);

  return { pieces, burst, clear };
}

/* ============================================================
   SCREEN SHAKE — applies a CSS shake to the page
   ============================================================ */
export function useScreenShake() {
  const [shake, setShake] = useState(0);

  const trigger = useCallback((intensity = 1) => {
    setShake(intensity);
    setTimeout(() => setShake(0), 600);
  }, []);

  return { shakeIntensity: shake, shake: trigger };
}

/* ============================================================
   FLASH OVERLAY — brief white/color flash for impact
   ============================================================ */
export function useFlash() {
  const [flash, setFlash] = useState<{ color: string; key: number } | null>(
    null,
  );

  const trigger = useCallback((color = "rgba(255,255,255,0.85)") => {
    setFlash({ color, key: Date.now() });
    setTimeout(() => setFlash(null), 250);
  }, []);

  return { flash, flashFn: trigger };
}

/* ============================================================
   DRAMATIC SOUND — layered sound effects
   ============================================================ */
export function useDramaticSound() {
  const soundEnabled = useSoundEnabled();
  const ctxRef = useRef<AudioContext | null>(null);

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

  const playTone = useCallback(
    (
      freq: number,
      duration: number,
      opts: {
        type?: OscillatorType;
        volume?: number;
        startAt?: number;
        sweepTo?: number;
        attack?: number;
        release?: number;
        detune?: number;
      } = {},
    ) => {
      if (!soundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();
      const start = opts.startAt ?? ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = opts.type ?? "sine";
      osc.frequency.setValueAtTime(freq, start);
      if (opts.sweepTo) {
        osc.frequency.exponentialRampToValueAtTime(opts.sweepTo, start + duration);
      }
      if (opts.detune) osc.detune.value = opts.detune;
      const vol = opts.volume ?? 0.3;
      const attack = opts.attack ?? 0.01;
      const release = opts.release ?? duration * 0.3;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + attack);
      gain.gain.setValueAtTime(vol, start + duration - release);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    },
    [getCtx, soundEnabled],
  );

  /** Play a note with a harmonic layer (fundamental + octave + fifth) for a richer sound */
  const playChord = useCallback(
    (
      freq: number,
      duration: number,
      opts: {
        type?: OscillatorType;
        volume?: number;
        startAt?: number;
        harmonics?: boolean;
      } = {},
    ) => {
      if (!soundEnabled) return;
      const vol = opts.volume ?? 0.2;
      const harmonics = opts.harmonics ?? true;
      playTone(freq, duration, { ...opts, volume: vol });
      if (harmonics) {
        playTone(freq * 2, duration, { ...opts, volume: vol * 0.4, type: "sine" });
        playTone(freq * 1.5, duration, { ...opts, volume: vol * 0.25, type: "sine" });
      }
    },
    [playTone, soundEnabled],
  );

  const playNoise = useCallback(
    (duration: number, volume = 0.4, filterFreq = 1000, filterType: BiquadFilterType = "lowpass") => {
      if (!soundEnabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    },
    [getCtx, soundEnabled],
  );

  // Sound: triumphant fanfare (major chord arpeggio with harmonics)
  const playAlarm = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // C major arpeggio: C5, E5, G5, C6 — rich and triumphant
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.12;
      playChord(freq, 0.3, {
        type: "triangle",
        volume: 0.25,
        startAt: start,
      });
    });
    // Final sustained chord
    const finalStart = ctx.currentTime + 0.48;
    playChord(1046.5, 0.6, {
      type: "triangle",
      volume: 0.3,
      startAt: finalStart,
      release: 0.4,
    });
  }, [playChord, getCtx]);

  // Sound: tick — soft woodblock-like click (not harsh square wave)
  const playTick = useCallback(
    (pitch = 800) => {
      playTone(pitch, 0.04, { type: "triangle", volume: 0.15, attack: 0.001 });
      playTone(pitch * 0.5, 0.06, { type: "sine", volume: 0.08, attack: 0.001 });
    },
    [playTone],
  );

  // Sound: click — pleasant UI click
  const playClick = useCallback(() => {
    playTone(880, 0.05, { type: "sine", volume: 0.2, attack: 0.001 });
    playTone(1320, 0.03, { type: "sine", volume: 0.1, attack: 0.001 });
  }, [playTone]);

  // Sound: launch sequence (rising whoosh with filtered noise sweep)
  const playWhoosh = useCallback(() => {
    playTone(150, 1.5, { type: "sawtooth", volume: 0.2, sweepTo: 1000, attack: 0.1 });
    playNoise(1.5, 0.12, 600);
  }, [playTone, playNoise]);

  // Sound: rocket blastoff (big cinematic)
  const playBlastoff = useCallback(() => {
    // Deep rumble (sub-bass)
    playTone(50, 2, { type: "sawtooth", volume: 0.35, sweepTo: 25, attack: 0.05 });
    // Mid rumble
    playTone(100, 1.5, { type: "triangle", volume: 0.2, sweepTo: 50 });
    // Noise roar
    playNoise(1.5, 0.4, 500);
    // High sparkle at peak
    setTimeout(() => {
      playChord(1600, 0.4, { type: "triangle", volume: 0.25 });
      playChord(2400, 0.3, { type: "sine", volume: 0.15 });
    }, 200);
  }, [playTone, playNoise, playChord]);

  // Sound: explosion (cinematic boom with debris)
  const playExplosion = useCallback(() => {
    // Sub-bass thump (deep boom)
    playTone(60, 1, { type: "sawtooth", volume: 0.5, sweepTo: 25, attack: 0.005 });
    // Mid crash
    playTone(120, 0.6, { type: "triangle", volume: 0.3, sweepTo: 40 });
    // Noise crash (wide band)
    playNoise(1, 0.5, 300);
    // High debris rattle
    setTimeout(() => playNoise(0.3, 0.2, 3000, "highpass"), 100);
    // Triumphant resolution
    setTimeout(() => playAlarm(), 500);
  }, [playTone, playNoise, playAlarm]);

  // Sound: dramatic countdown beep (warm bell-like)
  const playCountdownBeep = useCallback(
    (remaining: number) => {
      const pitch = 440 + (6 - remaining) * 80;
      playChord(pitch, 0.2, {
        type: "triangle",
        volume: 0.25,
        release: 0.15,
      });
    },
    [playChord],
  );

  // Sound: final zero beep (long sustained bell)
  const playZeroBeep = useCallback(() => {
    playChord(880, 1, {
      type: "triangle",
      volume: 0.35,
      release: 0.7,
    });
    playChord(1320, 0.8, {
      type: "sine",
      volume: 0.2,
      release: 0.6,
    });
  }, [playChord]);

  // Sound: siren (warbling alternating tones)
  const playSiren = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    for (let i = 0; i < 4; i++) {
      const t = ctx.currentTime + i * 0.35;
      playChord(440, 0.3, { type: "triangle", volume: 0.2, startAt: t });
      playChord(587.33, 0.3, { type: "triangle", volume: 0.2, startAt: t + 0.15 });
    }
  }, [getCtx, playChord]);

  // Sound: sparkle / magic (ascending shimmer with harmonics)
  const playSparkle = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Ascending C major scale with harmonics
    const notes = [659.25, 783.99, 987.77, 1318.5, 1568, 2093];
    notes.forEach((freq, i) => {
      playChord(freq, 0.25, {
        type: "triangle",
        volume: 0.15,
        startAt: ctx.currentTime + i * 0.06,
      });
    });
  }, [getCtx, playChord]);

  // Sound: spin/roulette tick (rapid descending ticks for build-up)
  const playSpin = useCallback(
    (ticks: number, intervalMs: number) => {
      let i = 0;
      const interval = setInterval(() => {
        if (i >= ticks) {
          clearInterval(interval);
          return;
        }
        const pitch = 1000 - i * (600 / ticks); // descends as it slows
        playTick(pitch);
        i++;
      }, intervalMs);
    },
    [playTick],
  );

  // Sound: dice roll (clattering)
  const playDiceRoll = useCallback(() => {
    // Rapid random clicks for clatter
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playTone(200 + Math.random() * 400, 0.03, {
          type: "triangle",
          volume: 0.15,
          attack: 0.001,
        });
      }, i * 60 + Math.random() * 30);
    }
  }, [playTone]);

  // Sound: coin flip (metallic ping)
  const playCoinFlip = useCallback(() => {
    playTone(1200, 0.08, { type: "sine", volume: 0.2, attack: 0.001 });
    setTimeout(() => playTone(1800, 0.06, { type: "sine", volume: 0.12, attack: 0.001 }), 40);
  }, [playTone]);

  // Sound: coin land (settle)
  const playCoinLand = useCallback(() => {
    playTone(800, 0.1, { type: "triangle", volume: 0.2, attack: 0.005 });
    playNoise(0.15, 0.1, 2000, "highpass");
  }, [playTone, playNoise]);

  // Sound: wheel tick (per segment click)
  const playWheelTick = useCallback(() => {
    playTone(600, 0.02, { type: "square", volume: 0.08, attack: 0.001 });
  }, [playTone]);

  // Sound: result reveal (big satisfying chord)
  const playReveal = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // C major chord: C4, E4, G4, C5
    const chord = [261.63, 329.63, 392.0, 523.25];
    chord.forEach((freq) => {
      playChord(freq, 0.8, {
        type: "triangle",
        volume: 0.18,
        startAt: ctx.currentTime,
        release: 0.5,
      });
    });
    // Add a high sparkle on top
    setTimeout(() => {
      playChord(1046.5, 0.5, { type: "sine", volume: 0.12, release: 0.4 });
    }, 100);
  }, [getCtx, playChord]);

  // Sound: build-up tension (rising drone)
  const playBuildUp = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Rising tone over 1.5s
    playTone(200, 1.5, {
      type: "sawtooth",
      volume: 0.15,
      sweepTo: 600,
      attack: 0.3,
    });
    // Sub-bass pulse
    playTone(80, 1.5, {
      type: "sine",
      volume: 0.2,
      sweepTo: 120,
      attack: 0.3,
    });
  }, [getCtx, playTone]);

  // Sound: dramatic 20-second build-up (longer, more intense than playBuildUp)
  // Plays a rising drone + heartbeat pulses to signal "time is running out"
  const playDramaticBuildUp = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Rising sustained drone (low → mid)
    playTone(150, 2, {
      type: "sawtooth",
      volume: 0.12,
      sweepTo: 400,
      attack: 0.5,
      release: 0.8,
    });
    // Sub-bass heartbeat (two thumps)
    playTone(60, 0.15, { type: "sine", volume: 0.3, attack: 0.005 });
    setTimeout(() => playTone(60, 0.15, { type: "sine", volume: 0.3, attack: 0.005 }), 300);
  }, [getCtx, playTone]);

  // Sound: spoken countdown number (plays TTS-generated MP3 via Web Audio API)
  // Numbers 1-10 are pre-generated as /sounds/countdown-N.mp3
  // Routes through the AudioContext (not HTMLAudioElement) for reliable mobile playback
  const audioBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  const playSpokenNumber = useCallback(async (n: number) => {
    if (!soundEnabled) return;
    if (n < 1 || n > 10) return;
    const ctx = getCtx();
    if (!ctx) return;
    // Resume context if suspended (mobile autoplay policy)
    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch { /* ignore */ }
    }

    const url = `/sounds/countdown-${n}.mp3`;
    const cacheKey = `countdown-${n}`;

    try {
      let buffer = audioBufferCacheRef.current.get(cacheKey);
      if (!buffer) {
        // Fetch + decode the MP3 into an AudioBuffer (cached for reuse)
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await ctx.decodeAudioData(arrayBuffer);
        audioBufferCacheRef.current.set(cacheKey, buffer);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {
      // Fallback to beep if audio fails
      playChord(440 + (10 - n) * 50, 0.3, { type: "triangle", volume: 0.25 });
    }
  }, [soundEnabled, getCtx, playChord]);

  // ============================================================
  // PER-TIMER THEMED ALARM SOUNDS
  // Each timer type gets a unique completion sound that matches its theme
  // ============================================================

  // Classic timer: triumphant fanfare (uses existing playAlarm)
  // (already defined above as playAlarm)

  // Rocket timer: cinematic blastoff (uses existing playBlastoff)
  // (already defined above as playBlastoff)

  // Bomb timer: big explosion boom (uses existing playExplosion)
  // (already defined above as playExplosion)

  // Candle timer: gentle puff-out + soft chime
  const playCandlePuff = useCallback(() => {
    // Quick air puff (filtered noise, short)
    playNoise(0.3, 0.3, 800, "lowpass");
    // Soft descending chime (smoke dissipating)
    setTimeout(() => {
      playChord(880, 0.4, { type: "sine", volume: 0.2, release: 0.3 });
      playChord(660, 0.5, { type: "sine", volume: 0.15, release: 0.4 });
    }, 200);
  }, [playNoise, playChord]);

  // Hourglass timer: sand-finish rustle + deep bell
  const playHourglassFinish = useCallback(() => {
    // Sand rustle (high-pass filtered noise)
    playNoise(0.8, 0.25, 4000, "highpass");
    // Deep bell toll
    setTimeout(() => {
      playChord(220, 1.2, { type: "triangle", volume: 0.3, release: 0.8 });
      playChord(330, 1.0, { type: "sine", volume: 0.2, release: 0.7 });
    }, 300);
  }, [playNoise, playChord]);

  // Circle/Radial timer: bright celestial chime (ascending harmonics)
  const playCircleChime = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Ascending C major arpeggio with sparkle
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      playChord(freq, 0.5, {
        type: "sine",
        volume: 0.2,
        startAt: ctx.currentTime + i * 0.08,
        release: 0.3,
      });
    });
    // Final shimmer
    setTimeout(() => playChord(2093, 0.8, { type: "sine", volume: 0.15, release: 0.6 }), 400);
  }, [getCtx, playChord]);

  // Snail race timer: playful finish melody (descending then ascending)
  const playSnailFinish = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Playful descending-then-ascending melody
    const notes = [523, 440, 392, 440, 523, 659];
    notes.forEach((freq, i) => {
      playChord(freq, 0.2, {
        type: "triangle",
        volume: 0.22,
        startAt: ctx.currentTime + i * 0.12,
      });
    });
    // Final happy chord
    setTimeout(() => playChord(523, 0.6, { type: "triangle", volume: 0.25, release: 0.4 }), 800);
  }, [getCtx, playChord]);

  // Traffic light timer: urgent honking horns + siren
  const playTrafficAlarm = useCallback(() => {
    // Two honks
    playChord(220, 0.15, { type: "sawtooth", volume: 0.3, attack: 0.01 });
    setTimeout(() => playChord(220, 0.15, { type: "sawtooth", volume: 0.3, attack: 0.01 }), 250);
    // Siren wail
    setTimeout(() => {
      playTone(440, 0.5, { type: "triangle", volume: 0.2, sweepTo: 880 });
      setTimeout(() => playTone(880, 0.5, { type: "triangle", volume: 0.2, sweepTo: 440 }), 500);
    }, 600);
  }, [playChord, playTone]);

  // Bar/Progress timer: completion fanfare with bass
  const playBarFinish = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Bass thump
    playTone(80, 0.3, { type: "sine", volume: 0.4, attack: 0.005 });
    // Triumphant chord stabs
    const chords = [[261, 329, 392], [293, 369, 440], [329, 415, 493], [261, 329, 392, 523]];
    chords.forEach((c, i) => {
      c.forEach(freq => {
        playChord(freq, 0.25, {
          type: "triangle",
          volume: 0.18,
          startAt: ctx.currentTime + 0.1 + i * 0.15,
        });
      });
    });
  }, [getCtx, playTone, playChord]);

  // Dispatcher: play the themed alarm for a given timer type
  const playThemedAlarm = useCallback((timerType: string) => {
    switch (timerType) {
      case "rocket":
        playBlastoff();
        break;
      case "bomb":
        playExplosion();
        break;
      case "candle":
        playCandlePuff();
        break;
      case "hourglass":
        playHourglassFinish();
        break;
      case "circle":
        playCircleChime();
        break;
      case "snail-race":
      case "snail":
        playSnailFinish();
        break;
      case "traffic-light":
      case "traffic":
        playTrafficAlarm();
        break;
      case "bar":
        playBarFinish();
        break;
      case "classic":
      default:
        playAlarm();
        break;
    }
  }, [playBlastoff, playExplosion, playCandlePuff, playHourglassFinish, playCircleChime, playSnailFinish, playTrafficAlarm, playBarFinish, playAlarm]);

  // Resume the AudioContext (needed on mobile after user gesture)
  const resume = useCallback(async () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
  }, [getCtx]);

  useEffect(() => {
    return () => {
      if (ctxRef.current) void ctxRef.current.close();
    };
  }, []);

  return {
    playTone,
    playChord,
    playNoise,
    playAlarm,
    playTick,
    playClick,
    playWhoosh,
    playBlastoff,
    playExplosion,
    playCountdownBeep,
    playZeroBeep,
    playSiren,
    playSparkle,
    playSpin,
    playDiceRoll,
    playCoinFlip,
    playCoinLand,
    playWheelTick,
    playReveal,
    playBuildUp,
    // New: dramatic 20-sec build-up + spoken countdown + themed alarms
    playDramaticBuildUp,
    playSpokenNumber,
    playThemedAlarm,
    playCandlePuff,
    playHourglassFinish,
    playCircleChime,
    playSnailFinish,
    playTrafficAlarm,
    playBarFinish,
    // AudioContext control (for mobile warm-up)
    resume,
  };
}

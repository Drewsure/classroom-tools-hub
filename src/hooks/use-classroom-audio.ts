"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSoundEnabled } from "@/components/timers/timer-launcher";

interface PlayOptions {
  volume?: number;
  lowpass?: number;
}

export function useClassroomAudio() {
  const soundEnabled = useSoundEnabled();
  const ctxRef = useRef<AudioContext | null>(null);
  const outputRef = useRef<DynamicsCompressorNode | null>(null);
  const cacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const loadingRef = useRef<Map<string, Promise<AudioBuffer | null>>>(new Map());
  const activeRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  const getOutput = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return null;

    if (!outputRef.current) {
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
      outputRef.current = compressor;
    }

    return { ctx, input: outputRef.current };
  }, [getCtx]);

  const load = useCallback(
    async (url: string) => {
      const cached = cacheRef.current.get(url);
      if (cached) return cached;

      const pending = loadingRef.current.get(url);
      if (pending) return pending;

      const promise = (async () => {
        const ctx = getCtx();
        if (!ctx) return null;

        try {
          const response = await fetch(url);
          if (!response.ok) return null;
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(arrayBuffer);
          cacheRef.current.set(url, buffer);
          return buffer;
        } catch {
          return null;
        } finally {
          loadingRef.current.delete(url);
        }
      })();

      loadingRef.current.set(url, promise);
      return promise;
    },
    [getCtx],
  );

  const play = useCallback(
    async (url: string, options: PlayOptions = {}) => {
      if (!soundEnabled) return false;

      const output = getOutput();
      if (!output) return false;

      const { ctx, input } = output;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
      }

      const buffer = await load(url);
      if (!buffer) return false;

      activeRef.current.forEach((source) => {
        try {
          source.stop();
        } catch {
          /* already stopped */
        }
      });
      activeRef.current.clear();

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = options.lowpass ?? 7600;
      filter.Q.value = 0.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(options.volume ?? 0.48, ctx.currentTime + 0.012);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(input);

      activeRef.current.add(source);
      source.onended = () => {
        activeRef.current.delete(source);
      };
      source.start();
      return true;
    },
    [getOutput, load, soundEnabled],
  );

  useEffect(() => {
    return () => {
      activeRef.current.forEach((source) => {
        try {
          source.stop();
        } catch {
          /* already stopped */
        }
      });
      activeRef.current.clear();
      if (ctxRef.current) {
        void ctxRef.current.close().catch(() => undefined);
        ctxRef.current = null;
        outputRef.current = null;
      }
    };
  }, []);

  return { play };
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSoundEnabled } from "@/components/timers/timer-launcher";

interface PlayOptions {
  volume?: number;
  lowpass?: number;
  channel?: "effect" | "voice";
}

export function useClassroomAudio(externalContext?: () => AudioContext | null) {
  const soundEnabled = useSoundEnabled();
  const enabledRef = useRef(soundEnabled);
  const ctxRef = useRef<AudioContext | null>(null);
  const outputRef = useRef<{ context: AudioContext; input: DynamicsCompressorNode } | null>(null);
  const cacheRef = useRef(new Map<string, AudioBuffer>());
  const bytesRef = useRef(new Map<string, Promise<ArrayBuffer>>());
  const loadingRef = useRef(new Map<string, Promise<AudioBuffer>>());
  const activeRef = useRef(new Map<string, { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode }>());
  const requestsRef = useRef(new Map<string, number>());
  const epochRef = useRef(0);

  const getCtx = useCallback(() => {
    if (externalContext) return externalContext();
    if (typeof window === "undefined") return null;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const Ctor = window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, [externalContext]);

  const getBytes = useCallback((url: string) => {
    const cached = bytesRef.current.get(url);
    if (cached) return cached;
    const task = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.arrayBuffer();
    }).catch((error) => { bytesRef.current.delete(url); throw error; });
    bytesRef.current.set(url, task);
    return task;
  }, []);

  const preload = useCallback((urls: string[]) =>
    Promise.allSettled(urls.map(getBytes)), [getBytes]);

  const load = useCallback((url: string, ctx: AudioContext) => {
    const cached = cacheRef.current.get(url);
    if (cached) return Promise.resolve(cached);
    const pending = loadingRef.current.get(url);
    if (pending) return pending;
    const task = getBytes(url).then((bytes) => ctx.decodeAudioData(bytes.slice(0)))
      .then((buffer) => { cacheRef.current.set(url, buffer); return buffer; })
      .finally(() => loadingRef.current.delete(url));
    loadingRef.current.set(url, task);
    return task;
  }, [getBytes]);

  const stopAll = useCallback(() => {
    epochRef.current++;
    for (const { source, filter, gain } of activeRef.current.values()) {
      try { source.stop(); } catch { /* Already ended. */ }
      source.disconnect(); filter.disconnect(); gain.disconnect();
    }
    activeRef.current.clear();
  }, []);

  const resume = useCallback(async () => {
    const ctx = getCtx();
    if (ctx && ctx.state !== "running") await ctx.resume().catch(() => undefined);
  }, [getCtx]);

  const play = useCallback(async (url: string, options: PlayOptions = {}) => {
    if (!soundEnabled || !enabledRef.current || (options.volume ?? 0.48) <= 0) return false;
    const channel = options.channel ?? "effect";
    const token = (requestsRef.current.get(channel) ?? 0) + 1;
    requestsRef.current.set(channel, token);
    const epoch = epochRef.current;
    const ctx = getCtx();
    if (!ctx) return false;
    try {
      if (ctx.state !== "running") await ctx.resume();
      const buffer = await load(url, ctx);
      if (epoch !== epochRef.current || token !== requestsRef.current.get(channel) ||
        !enabledRef.current || ctx.state === "closed") return false;
      const old = activeRef.current.get(channel);
      if (old) { try { old.source.stop(); } catch { /* Already ended. */ } }
      if (!outputRef.current || outputRef.current.context !== ctx) {
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -18; compressor.knee.value = 24;
        compressor.ratio.value = 8; compressor.attack.value = 0.005; compressor.release.value = 0.16;
        const master = ctx.createGain();
        master.gain.value = 0.82;
        compressor.connect(master); master.connect(ctx.destination);
        outputRef.current = { context: ctx, input: compressor };
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = options.lowpass ?? 7600; filter.Q.value = 0.2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(Math.min(1, options.volume ?? 0.48), ctx.currentTime + 0.012);
      source.connect(filter); filter.connect(gain); gain.connect(outputRef.current.input);
      activeRef.current.set(channel, { source, filter, gain });
      source.onended = () => {
        source.disconnect(); filter.disconnect(); gain.disconnect();
        if (activeRef.current.get(channel)?.source === source) activeRef.current.delete(channel);
      };
      source.start();
      if (process.env.NODE_ENV === "development") console.debug("[classroom-audio] playing", url, channel);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.warn("[classroom-audio] playback failed", url, error);
      return false;
    }
  }, [getCtx, load, soundEnabled]);

  useEffect(() => {
    enabledRef.current = soundEnabled;
    if (!soundEnabled) stopAll();
  }, [soundEnabled, stopAll]);

  useEffect(() => () => {
    stopAll();
    const ctx = ctxRef.current;
    ctxRef.current = null; outputRef.current = null;
    if (ctx && ctx.state !== "closed") void ctx.close().catch(() => undefined);
  }, [stopAll]);

  return { play, preload, stopAll, resume };
}

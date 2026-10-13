export type PadStatus = {
  playingId: string | null;
  loadingId: string | null;
  error: string | null;
  loadedCount: number;
};

type EngineOptions = {
  files: { id: string; file: string }[];
  gains: Record<string, number>;
  filters: Record<string, number>;
  onStatus: (status: PadStatus) => void;
  contextFactory?: () => AudioContext;
  fetchAudio?: (url: string) => Promise<ArrayBuffer>;
};

export class SoundPadEngine {
  private options: EngineOptions;
  private context: AudioContext | null = null;
  private output: DynamicsCompressorNode | null = null;
  private master: GainNode | null = null;
  private encoded = new Map<string, Promise<ArrayBuffer>>();
  private decoded = new Map<string, AudioBuffer>();
  private decoding = new Map<string, Promise<AudioBuffer>>();
  private request = 0;
  private disposed = false;
  private volume = 0.5;
  private active: { source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode; trim: number; override?: number } | null = null;
  private status: PadStatus = { playingId: null, loadingId: null, error: null, loadedCount: 0 };

  constructor(options: EngineOptions) {
    this.options = options;
  }

  private report(update: Partial<PadStatus>) {
    if (this.disposed) return;
    this.status = { ...this.status, ...update };
    this.options.onStatus(this.status);
  }

  private fetch(id: string) {
    const cached = this.encoded.get(id);
    if (cached) return cached;
    const file = this.options.files.find((sound) => sound.id === id);
    if (!file) return Promise.reject(new Error("Unknown sound"));
    const fetchAudio = this.options.fetchAudio ?? (async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Audio download failed");
      return response.arrayBuffer();
    });
    const task = fetchAudio(`/sounds/${file.file}`).catch((error) => {
      this.encoded.delete(id);
      throw error;
    });
    this.encoded.set(id, task);
    return task;
  }

  preload() {
    // Fetch bytes without opening an AudioContext before a mobile user gesture.
    return Promise.allSettled(this.options.files.map(({ id }) => this.fetch(id)));
  }

  private getContext() {
    if (this.context?.state === "closed") {
      this.context = null;
      this.output = null;
      this.master = null;
    }
    if (!this.context) {
      const factory = this.options.contextFactory ?? (() => {
        const ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!ctor) throw new Error("Audio is unavailable in this browser");
        return new ctor();
      });
      this.context = factory();
      this.output = this.context.createDynamicsCompressor();
      this.output.threshold.value = -18;
      this.output.knee.value = 24;
      this.output.ratio.value = 8;
      this.output.attack.value = 0.005;
      this.output.release.value = 0.16;
      this.master = this.context.createGain();
      this.master.gain.value = 0.82;
      this.output.connect(this.master);
      this.master.connect(this.context.destination);
    }
    return this.context;
  }

  private decode(id: string, context: AudioContext) {
    const cached = this.decoded.get(id);
    if (cached) return Promise.resolve(cached);
    const pending = this.decoding.get(id);
    if (pending) return pending;
    const task = this.fetch(id).then((bytes) => context.decodeAudioData(bytes.slice(0)))
      .then((buffer) => {
        if (!this.disposed) {
          this.decoded.set(id, buffer);
          this.report({ loadedCount: this.decoded.size });
        }
        return buffer;
      }).finally(() => this.decoding.delete(id));
    this.decoding.set(id, task);
    return task;
  }

  private stopSource() {
    const active = this.active;
    this.active = null;
    if (!active) return;
    try { active.source.stop(); } catch { /* A completed source is already stopped. */ }
    active.source.disconnect();
    active.filter.disconnect();
    active.gain.disconnect();
  }

  setVolume(value: number) {
    this.volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    if (this.volume === 0) {
      this.stopAll();
    } else if (this.active && this.active.override === undefined && this.context) {
      this.active.gain.gain.setTargetAtTime(this.volume * this.active.trim, this.context.currentTime, 0.015);
    }
  }

  async play(id: string, volumeOverride?: number) {
    if (this.disposed || (volumeOverride ?? this.volume) <= 0) return;
    const token = ++this.request;
    this.stopSource();
    this.report({ playingId: null, loadingId: id, error: null });
    try {
      const context = this.getContext();
      // resume() is invoked during the click, before any download/decode await.
      if (context.state !== "running") await context.resume();
      const buffer = await this.decode(id, context);
      if (this.disposed || token !== this.request) return;
      const source = context.createBufferSource();
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = this.options.filters[id] ?? 8400;
      filter.Q.value = 0.2;
      const gain = context.createGain();
      const trim = this.options.gains[id] ?? 0.72;
      const effectiveVolume = Math.max(0, Math.min(1, volumeOverride ?? this.volume));
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(effectiveVolume * trim, context.currentTime + 0.012);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.output!);
      this.active = { source, gain, filter, trim, override: volumeOverride };
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
        if (this.active?.source === source) {
          this.active = null;
          this.report({ playingId: null });
        }
      };
      source.start();
      this.report({ playingId: id, loadingId: null });
    } catch {
      if (!this.disposed && token === this.request) {
        this.stopSource();
        this.report({ playingId: null, loadingId: null, error: "Sound could not play. Tap the pad to retry." });
      }
    }
  }

  stopAll() {
    ++this.request;
    this.stopSource();
    this.report({ playingId: null, loadingId: null });
  }

  dispose() {
    if (this.disposed) return;
    this.stopAll();
    this.disposed = true;
    const context = this.context;
    this.context = null;
    this.encoded.clear();
    this.decoded.clear();
    if (context && context.state !== "closed") void context.close().catch(() => undefined);
  }
}

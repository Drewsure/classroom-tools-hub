"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSoundPad, SOUNDS } from "@/hooks/use-sound-pad";
import { useSoundEnabled } from "@/components/timers/timer-launcher";
import { Heart, LoaderCircle, Square, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const FAVOURITES = new Set(["drumroll", "cowbell", "laugh", "cheer"]);
const CATEGORIES = [
  { id: "favourites", label: "Class favourites" },
  { id: "positive", label: "Celebrate" },
  { id: "funny", label: "Game show" },
  { id: "attention", label: "Attention" },
  { id: "answers", label: "Answers" },
  { id: "all", label: "All sounds" },
] as const;

export function SoundPad() {
  const { play, stopAll, volume, setVolume, playingId, loadingId, error } = useSoundPad();
  const soundEnabled = useSoundEnabled();
  const previousVolume = useRef(0.5);
  const [category, setCategory] = useState<string>("favourites");
  const sounds = SOUNDS.filter((sound) => category === "all" ||
    (category === "favourites" ? FAVOURITES.has(sound.id) : sound.category === category));
  const activeSound = SOUNDS.find((sound) => sound.id === (playingId ?? loadingId));
  const muted = volume === 0;

  const handlePlay = useCallback((id: string) => {
    if (soundEnabled && !muted) play(id);
  }, [soundEnabled, muted, play]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [role='dialog']"))) return;
      if (event.key === " " && !(target instanceof HTMLElement && target.closest("button"))) {
        event.preventDefault();
        stopAll();
        return;
      }
      const sound = SOUNDS.find((item) => item.key === event.key.toLowerCase());
      if (sound) {
        event.preventDefault();
        handlePlay(sound.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePlay, stopAll]);

  const toggleMute = () => {
    if (muted) setVolume(previousVolume.current || 0.5);
    else {
      previousVolume.current = volume;
      setVolume(0);
    }
  };

  return (
    <div className="w-full min-w-0 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/images/manga-icons/sound-pad.png" alt="" className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain" />
          <div>
            <h2 className="text-2xl font-black text-white">Sound Pad</h2>
            <p role="status" className="mt-1 text-base font-semibold text-white">
              {!soundEnabled ? "Sound is muted in the teacher toolbar" : muted ? "Muted" :
                loadingId ? `Loading: ${activeSound?.label ?? ""}` :
                playingId ? `Playing: ${activeSound?.label ?? ""}` : "Ready"}
            </p>
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-900">{error}</p>}
      </div>

      <div role="tablist" aria-label="Sound collections" className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            id={`sound-tab-${item.id}`}
            role="tab"
            aria-selected={category === item.id}
            tabIndex={category === item.id ? 0 : -1}
            aria-controls="sound-pad-grid"
            onClick={() => setCategory(item.id)}
            onKeyDown={(event) => {
              const index = CATEGORIES.findIndex((entry) => entry.id === item.id);
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % CATEGORIES.length;
              else if (event.key === "ArrowLeft") next = (index + CATEGORIES.length - 1) % CATEGORIES.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = CATEGORIES.length - 1;
              else return;
              event.preventDefault();
              setCategory(CATEGORIES[next].id);
              document.getElementById(`sound-tab-${CATEGORIES[next].id}`)?.focus();
            }}
            className={cn("flex min-h-11 items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-black",
              category === item.id ? "border-yellow-400 bg-yellow-300 text-slate-950" : "border-slate-300 bg-white text-slate-900 hover:bg-cyan-50")}
          >
            {item.id === "favourites" && <Heart className="h-4 w-4" />}
            {item.label}
          </button>
        ))}
      </div>

      <div
        id="sound-pad-grid"
        role="tabpanel"
        aria-labelledby={`sound-tab-${category}`}
        className={cn("grid gap-3 sm:gap-4",
          category === "favourites" ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6")}
      >
        {sounds.map((sound) => {
          const active = playingId === sound.id;
          const loading = loadingId === sound.id;
          return (
            <button
              key={sound.id}
              onClick={() => handlePlay(sound.id)}
              disabled={!soundEnabled || muted}
              aria-label={sound.label}
              aria-pressed={active}
              title={sound.key ? `${sound.label} (${sound.key.toUpperCase()})` : sound.label}
              className={cn("relative flex min-w-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border-4 bg-gradient-to-br p-3 shadow-lg transition active:scale-95 disabled:opacity-60",
                category === "favourites" ? "aspect-square" : "min-h-36",
                sound.color,
                active ? "border-yellow-300 ring-4 ring-yellow-300" : "border-white")}
            >
              <span aria-hidden="true" className={cn("grid place-items-center rounded-lg bg-white leading-none",
                category === "favourites" ? "h-20 w-20 text-6xl sm:h-28 sm:w-28 sm:text-7xl" : "h-16 w-16 text-5xl")}>
                {sound.emoji}
              </span>
              <span className="w-full rounded-lg bg-white px-2 py-2 text-center text-base font-black leading-snug text-slate-950">
                {sound.label}
              </span>
              {(active || loading) && (
                <span className="flex items-center gap-1 rounded-lg bg-slate-950 px-2 py-1 text-sm font-bold text-white">
                  {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {loading ? "Loading" : "Playing"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto flex w-full max-w-5xl items-center gap-2 rounded-lg border-2 border-slate-300 bg-white p-2 text-slate-950 shadow-xl sm:gap-4">
          <button onClick={toggleMute} aria-label={muted ? "Unmute sound pad" : "Mute sound pad"} title={muted ? "Unmute" : "Mute"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-300 bg-slate-100 text-slate-950">
            {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="hidden text-sm font-bold sm:inline">Volume</span>
            <input type="range" aria-label="Sound pad volume" min="0" max="100" value={Math.round(volume * 100)}
              onChange={(event) => {
                const next = Number(event.target.value) / 100;
                if (next > 0) previousVolume.current = next;
                setVolume(next);
              }}
              className="h-11 w-full min-w-0 cursor-pointer accent-cyan-700" />
            <span className="w-10 shrink-0 text-right text-sm font-black tabular-nums">{Math.round(volume * 100)}%</span>
          </label>
          <button onClick={stopAll} title="Stop all sounds (Space)"
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-red-700 px-3 py-3 text-base font-black text-white hover:bg-red-800 sm:px-6">
            <Square className="h-5 w-5 fill-current" /> Stop All
          </button>
        </div>
      </div>
    </div>
  );
}

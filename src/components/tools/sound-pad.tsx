"use client";

import { useEffect, useState, useCallback } from "react";
import { useSoundPad, SOUNDS } from "@/hooks/use-sound-pad";
import { Volume2, VolumeX, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "positive", label: "Positive & Encouraging", emoji: "🎉" },
  { id: "funny", label: "Game Show", emoji: "🎬" },
  { id: "attention", label: "Attention & Fun", emoji: "🛎️" },
  { id: "answers", label: "Classroom Answers", emoji: "📝" },
] as const;

export function SoundPad() {
  const { play, stopAll, volume, setVolume, lastPlayed } = useSoundPad();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const handlePlay = useCallback(
    (soundId: string) => {
      if (muted) return;
      play(soundId);
      setActiveId(soundId);
      setTimeout(() => {
        setActiveId((prev) => (prev === soundId ? null : prev));
      }, 400);
    },
    [muted, play],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      const sound = SOUNDS.find((s) => s.key === key);
      if (sound) {
        e.preventDefault();
        handlePlay(sound.id);
      }
      if (e.key === " ") {
        e.preventDefault();
        stopAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePlay, stopAll]);

  const toggleMute = () => {
    if (muted) {
      setMuted(false);
      setVolume(0.7);
    } else {
      setMuted(true);
      setVolume(0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 w-full min-h-[calc(100vh-200px)]">
      {/* Glassmorphism control bar */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3 px-5 py-3 rounded-2xl glass-dark">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔊</span>
          <div>
            <h2 className="text-xl font-bold text-white">Sound Pad</h2>
            <p className="text-xs text-white/50">
              {lastPlayed
                ? `Last: ${SOUNDS.find((s) => s.id === lastPlayed)?.emoji} ${SOUNDS.find((s) => s.id === lastPlayed)?.label}`
                : "Tap a sound or use keyboard!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Volume slider — always visible on iPad */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-white/70 hover:text-white p-1" aria-label="Toggle mute">
              {muted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(e) => {
                const v = parseInt(e.target.value) / 100;
                setVolume(v);
                setMuted(v === 0);
              }}
              className="w-28 h-2 rounded-full appearance-none bg-white/20 cursor-pointer"
            />
          </div>

          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold border transition-all",
              muted
                ? "bg-red-500/30 text-red-200 border-red-400/50"
                : "bg-white/10 text-white border-white/25 hover:bg-white/20",
            )}
          >
            {muted ? "🔇 Muted" : "🔊 Sound On"}
          </button>

          {/* Stop / Panic button — large for iPad */}
          <button
            onClick={stopAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-red-500 hover:bg-red-600 text-white border border-red-400 shadow-lg transition-all"
            title="Stop all sounds (Space)"
          >
            <Square className="h-4 w-4 fill-current" />
            STOP ALL
          </button>
        </div>
      </div>

      {/* Sound pad grid — iPad-optimized large buttons */}
      <div className="w-full max-w-5xl space-y-5 flex-1">
        {CATEGORIES.map((cat) => {
          const catSounds = SOUNDS.filter((s) => s.category === cat.id);
          return (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{cat.emoji}</span>
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
                  {cat.label}
                </h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                {catSounds.map((sound) => {
                  const isActive = activeId === sound.id;
                  return (
                    <button
                      key={sound.id}
                      onClick={() => handlePlay(sound.id)}
                      className={cn(
                        "relative overflow-hidden rounded-2xl p-4 sm:p-6 text-white shadow-lg transition-all duration-150 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/40 bg-gradient-to-br group",
                        "min-h-[110px] sm:min-h-[130px]",
                        sound.color,
                        isActive && "scale-95 ring-4 ring-white/60",
                      )}
                    >
                      {/* Key shortcut badge */}
                      {sound.key && (
                        <span className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/30 text-white text-xs font-bold flex items-center justify-center backdrop-blur-sm uppercase">
                          {sound.key}
                        </span>
                      )}

                      {/* Ripple effect when active */}
                      {isActive && (
                        <div className="absolute inset-0 bg-white/30 animate-[flashFade_0.4s_ease-out]" />
                      )}

                      <div className="relative flex flex-col items-center gap-2">
                        <span className={cn(
                          "text-4xl sm:text-5xl drop-shadow-lg transition-transform",
                          isActive && "scale-110",
                        )}>
                          {sound.emoji}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-center drop-shadow">
                          {sound.label}
                        </span>
                      </div>

                      {/* Active glow */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl border-4 border-white animate-[pulseRing_0.5s_ease-out]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard shortcuts help — bottom bar */}
      <div className="w-full max-w-5xl mt-2 p-3 rounded-2xl glass">
        <p className="text-xs text-white/50 text-center">
          ⌨️ <span className="font-bold text-white/70">Keyboard:</span>{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-white/80">1-6</kbd> Positive ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-white/80">Q-Y</kbd> Game Show ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-white/80">A-H</kbd> Attention ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-white/80">Z-N</kbd> Answers ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-white/80">Space</kbd> Stop All
        </p>
      </div>
    </div>
  );
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TIMER_CONFIGS, type TimerType } from "@/lib/timers";
import { cn } from "@/lib/utils";
import { Maximize, Minimize, Volume2, VolumeX, X } from "lucide-react";
import { ClassicTimer } from "./classic-timer";
import { Stopwatch } from "./stopwatch";
import { RocketTimer } from "./rocket-timer";
import { BombTimer } from "./bomb-timer";
import { CandleTimer } from "./candle-timer";
import { HourglassTimer } from "./hourglass-timer";
import { CircleTimer } from "./circle-timer";
import { SnailRaceTimer } from "./snail-race-timer";
import { TrafficLightTimer } from "./traffic-light-timer";
import { BarTimer } from "./bar-timer";

interface TimerLauncherProps {
  type: TimerType;
  onClose: () => void;
}

// Sound toggle context — all timers respect this
export const SoundEnabledContext = createContext<boolean>(true);
export const useSoundEnabled = () => useContext(SoundEnabledContext);

export function TimerLauncher({ type, onClose }: TimerLauncherProps) {
  const config = TIMER_CONFIGS.find((t) => t.id === type);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
      if (e.key === "m" || e.key === "M") {
        setSoundEnabled((s) => !s);
      }
    };
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [onClose]);

  if (!config) return null;

  return (
    <SoundEnabledContext.Provider value={soundEnabled}>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-gradient-to-br overflow-y-auto",
          config.gradient,
        )}
      >
        <div className="min-h-screen flex flex-col">
          <header className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 gap-2">
            <div className="flex items-center gap-3 text-white min-w-0">
              <span className="text-3xl sm:text-4xl drop-shadow-lg shrink-0">
                {config.emoji}
              </span>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold drop-shadow truncate">
                  {config.name}
                </h1>
                <p className="text-xs sm:text-sm text-white/70 truncate">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setSoundEnabled((s) => !s)}
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-full border-white/25 h-11 w-11",
                  soundEnabled
                    ? "bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40"
                    : "bg-white/10 text-white/60 hover:bg-white/20",
                )}
                aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                title="Toggle sound (M)"
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </Button>
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="icon"
                className="rounded-full bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white h-11 w-11"
                aria-label="Toggle fullscreen"
                title="Fullscreen (F)"
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="icon"
                className="rounded-full bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white h-11 w-11"
                aria-label="Close timer"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-3xl">
              <TimerRenderer type={type} />
            </div>
          </main>

          <footer className="px-4 sm:px-8 py-4 text-center text-xs text-white/50">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono">Esc</kbd> close ·{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono">F</kbd> fullscreen ·{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono">M</kbd> mute
          </footer>
        </div>
      </div>
    </SoundEnabledContext.Provider>
  );
}

function TimerRenderer({ type }: { type: TimerType }) {
  switch (type) {
    case "classic":
      return <ClassicTimer />;
    case "stopwatch":
      return <Stopwatch />;
    case "rocket":
      return <RocketTimer />;
    case "bomb":
      return <BombTimer />;
    case "candle":
      return <CandleTimer />;
    case "hourglass":
      return <HourglassTimer />;
    case "circle":
      return <CircleTimer />;
    case "snail-race":
      return <SnailRaceTimer />;
    case "traffic-light":
      return <TrafficLightTimer />;
    case "bar":
      return <BarTimer />;
    default:
      return null;
  }
}

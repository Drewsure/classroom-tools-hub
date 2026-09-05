"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type ToolDef } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { X, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import { SoundEnabledContext } from "@/components/timers/timer-launcher";
import { RandomNamePicker } from "./random-name-picker";
import { ChanceGames } from "./chance-games";
import { RandomGroupGenerator } from "./random-group-generator";
import { TallyCounter } from "./tally-counter";
import { CustomDice } from "./custom-dice";
import { SpinnerWheel } from "./spinner-wheel";
import { StopwatchSplits } from "./stopwatch-splits";
import { StudentOrderShuffler } from "./student-order-shuffler";
import { MathFactGenerator } from "./math-fact-generator";
import { CustomDashboard } from "./custom-dashboard";
import { SoundPad } from "./sound-pad";
import { RandomColorGenerator } from "./random-color-generator";
import { LetterCardGenerator } from "./letter-card-generator";
import { WeatherFlashcards } from "./weather-flashcards";
import { FlashCardPresenter } from "./flash-card-presenter";
import { ActivityHub } from "./activity-hub";
import { OfflineAudioPlayer } from "./offline-audio-player";
import { PEEnglishHub } from "./pe-english-hub";
import { EnterNames } from "./enter-names";
import { ClassicTimer } from "@/components/timers/classic-timer";
import { Stopwatch } from "@/components/timers/stopwatch";
import { RocketTimer } from "@/components/timers/rocket-timer";
import { BombTimer } from "@/components/timers/bomb-timer";
import { CandleTimer } from "@/components/timers/candle-timer";
import { HourglassTimer } from "@/components/timers/hourglass-timer";
import { CircleTimer } from "@/components/timers/circle-timer";
import { SnailRaceTimer } from "@/components/timers/snail-race-timer";
import { TrafficLightTimer } from "@/components/timers/traffic-light-timer";
import { BarTimer } from "@/components/timers/bar-timer";

interface ToolLauncherProps {
  tool: ToolDef;
  onClose: () => void;
}

export function ToolLauncher({ tool, onClose }: ToolLauncherProps) {
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

  return (
    <SoundEnabledContext.Provider value={soundEnabled}>
    <div className="fixed inset-0 z-50 glass-bg overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        <header className="glass-header flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 gap-2">
          <div className="flex items-center gap-3 text-white min-w-0">
            <span className="text-3xl sm:text-4xl drop-shadow-lg shrink-0">
              {tool.emoji}
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold drop-shadow truncate">
                {tool.name}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 truncate">
                {tool.description}
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
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white h-11 w-11"
              aria-label="Toggle fullscreen"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white h-11 w-11"
              aria-label="Close tool"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className={cn("w-full", tool.id === "sound-pad" ? "max-w-6xl" : "max-w-6xl")}>
            <ToolRenderer toolId={tool.id} />
          </div>
        </main>

        <footer className="px-4 sm:px-8 py-4 text-center text-xs text-white/50">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono">Esc</kbd> close ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono">F</kbd> fullscreen
        </footer>
      </div>
    </div>
    </SoundEnabledContext.Provider>
  );
}

function ToolRenderer({ toolId }: { toolId: string }) {
  switch (toolId) {
    // Timers
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
    // Tools
    case "name-picker":
      return <RandomNamePicker />;
    case "chance-games":
      return <ChanceGames />;
    case "group-generator":
      return <RandomGroupGenerator />;
    case "tally-counter":
      return <TallyCounter />;
    case "custom-dice":
      return <CustomDice />;
    case "spinner-wheel":
      return <SpinnerWheel />;
    case "stopwatch-splits":
      return <StopwatchSplits />;
    case "student-shuffler":
      return <StudentOrderShuffler />;
    case "math-facts":
      return <MathFactGenerator />;
    case "custom-dashboard":
      return <CustomDashboard />;
    case "activity-hub":
      return <ActivityHub />;
    case "pe-english-hub":
      return <PEEnglishHub />;
    case "sound-pad":
      return <SoundPad />;
    case "audio-player":
      return <OfflineAudioPlayer />;
    case "color-generator":
      return <RandomColorGenerator />;
    case "letter-cards":
      return <LetterCardGenerator />;
    case "flash-card-presenter":
      return <FlashCardPresenter />;
    case "weather-cards":
      return <WeatherFlashcards />;
    case "enter-names":
      return <EnterNames />;
    default:
      return null;
  }
}

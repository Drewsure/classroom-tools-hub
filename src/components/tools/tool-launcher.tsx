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
import { AttendanceButton } from "./attendance-dialog";
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

const WIDE_TOOL_IDS = new Set([
  "bar",
  "bomb",
  "candle",
  "circle",
  "classic",
  "activity-hub",
  "audio-player",
  "custom-dashboard",
  "hourglass",
  "pe-english-hub",
  "rocket",
  "snail-race",
  "sound-pad",
  "stopwatch",
  "traffic-light",
  "weather-cards",
  "chance-games",
  "color-generator",
  "custom-dice",
  "flash-card-presenter",
  "group-generator",
  "letter-cards",
  "math-facts",
  "name-picker",
  "spinner-wheel",
  "stopwatch-splits",
  "student-shuffler",
  "tally-counter",
]);

const TIMER_TOOL_IDS = new Set([
  "bar",
  "bomb",
  "candle",
  "circle",
  "classic",
  "hourglass",
  "rocket",
  "snail-race",
  "stopwatch",
  "traffic-light",
]);

const PROJECTOR_TOOL_IDS = new Set([
  "activity-hub",
  "custom-dashboard",
]);

const MANGA_ICON_BY_TOOL: Record<string, string> = {
  "activity-hub": "/images/manga-icons/activity-hub.png",
  "custom-dashboard": "/images/manga-icons/dashboard.png",
  classic: "/images/manga-icons/timer.png",
  "name-picker": "/images/manga-icons/name-picker.png",
  "weather-cards": "/images/manga-icons/weather.png",
  "sound-pad": "/images/manga-icons/sound-pad.png",
  "letter-cards": "/images/manga-icons/letter-cards.png",
};

export function ToolLauncher({ tool, onClose }: ToolLauncherProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mangaIcon = MANGA_ICON_BY_TOOL[tool.id];
  const isTimerTool = TIMER_TOOL_IDS.has(tool.id);
  const isProjectorTool = PROJECTOR_TOOL_IDS.has(tool.id);

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,113,133,0.16),transparent_30%),#060416] backdrop-blur-2xl">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:px-6">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3 text-white">
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-3xl shadow-lg shadow-black/30 ring-2 ring-white/25 sm:h-16 sm:w-16 sm:text-4xl">
                  {mangaIcon ? (
                    <img src={mangaIcon} alt="" className="h-16 w-16 object-contain" />
                  ) : (
                    tool.emoji
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                    Active Tool
                  </p>
                  <h1 className="truncate text-lg font-black drop-shadow sm:text-2xl">
                    {tool.name}
                  </h1>
                  <p className="truncate text-xs font-medium text-white/70 sm:text-sm">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AttendanceButton />
                <Button
                  onClick={() => setSoundEnabled((s) => !s)}
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-11 w-11 rounded-2xl border-white/20",
                    soundEnabled
                      ? "bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40"
                      : "bg-white/10 text-white/60 hover:bg-white/20",
                  )}
                  aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                  title="Toggle sound"
                >
                  {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
                <Button
                  onClick={toggleFullscreen}
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  aria-label="Toggle fullscreen"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  aria-label="Close tool"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          <main className={cn(
            "flex flex-1 items-stretch justify-center px-2 py-2 sm:px-3 lg:px-4",
            !isTimerTool && !isProjectorTool && "sm:py-3",
          )}>
            <div className={cn(
              "active-tool-shell w-full",
              WIDE_TOOL_IDS.has(tool.id) ? "max-w-7xl" : "max-w-6xl",
              "max-w-none",
            )}>
              <ToolRenderer toolId={tool.id} />
            </div>
          </main>

          <footer className="hidden px-4 py-3 text-center text-xs text-white/45 sm:px-8">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono ring-1 ring-white/15">Esc</kbd> close ·{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono ring-1 ring-white/15">F</kbd> fullscreen
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

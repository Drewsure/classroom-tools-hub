"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  TOOLS,
  CATEGORY_INFO,
  getToolsByCategory,
  type ToolCategory,
  type ToolDef,
} from "@/lib/tools";
import { ToolLauncher } from "@/components/tools/tool-launcher";
import { useFavorites } from "@/hooks/use-favorites";
import { AttendanceButton } from "@/components/tools/attendance-dialog";
import {
  BookOpenCheck,
  Clock3,
  Grid2X2,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

type FilterKey = "all" | "favorites" | ToolCategory;

const CATEGORY_ORDER: ToolCategory[] = [
  "dashboard",
  "timers",
  "pickers",
  "games",
  "counters",
  "math",
  "letters",
  "weather",
  "sounds",
  "audio",
];

const DAILY_TOOL_IDS = [
  "activity-hub",
  "custom-dashboard",
  "classic",
  "name-picker",
  "weather-cards",
  "sound-pad",
  "letter-cards",
];

const CATEGORY_ACCENTS: Record<ToolCategory, string> = {
  dashboard: "#38bdf8",
  timers: "#f97316",
  pickers: "#a855f7",
  games: "#fb7185",
  counters: "#22c55e",
  math: "#f59e0b",
  letters: "#60a5fa",
  weather: "#38bdf8",
  sounds: "#d946ef",
  audio: "#8b5cf6",
  favorites: "#facc15",
};

const PATHWAY_STYLES: Record<
  string,
  {
    kicker: string;
    image?: string;
    hue: string;
    bg: string;
  }
> = {
  "activity-hub": {
    kicker: "Daily warm-up",
    image: "/images/manga-icons/activity-hub.png",
    hue: "#22d3ee",
    bg: "from-cyan-300 via-sky-400 to-indigo-500",
  },
  "custom-dashboard": {
    kicker: "Teacher board",
    image: "/images/manga-icons/dashboard.png",
    hue: "#a78bfa",
    bg: "from-violet-300 via-fuchsia-400 to-rose-400",
  },
  classic: {
    kicker: "Class timer",
    image: "/images/manga-icons/timer.png",
    hue: "#fb923c",
    bg: "from-orange-300 via-amber-300 to-yellow-300",
  },
  "name-picker": {
    kicker: "Student turn",
    image: "/images/manga-icons/name-picker.png",
    hue: "#c084fc",
    bg: "from-purple-300 via-violet-400 to-indigo-500",
  },
  "weather-cards": {
    kicker: "ESL picture talk",
    image: "/images/manga-icons/weather.png",
    hue: "#38bdf8",
    bg: "from-sky-200 via-cyan-300 to-blue-400",
  },
  "sound-pad": {
    kicker: "Class reactions",
    image: "/images/manga-icons/sound-pad.png",
    hue: "#e879f9",
    bg: "from-fuchsia-300 via-pink-400 to-rose-400",
  },
  "letter-cards": {
    kicker: "Phonics cards",
    image: "/images/manga-icons/letter-cards.png",
    hue: "#60a5fa",
    bg: "from-blue-300 via-sky-300 to-emerald-300",
  },
};

const MANGA_ICON_BY_TOOL: Record<string, string> = {
  "activity-hub": "/images/manga-icons/activity-hub.png",
  "custom-dashboard": "/images/manga-icons/dashboard.png",
  classic: "/images/manga-icons/timer.png",
  "name-picker": "/images/manga-icons/name-picker.png",
  "weather-cards": "/images/manga-icons/weather.png",
  "sound-pad": "/images/manga-icons/sound-pad.png",
  "letter-cards": "/images/manga-icons/letter-cards.png",
};

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [activeCategory, setActiveCategory] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const { isFavorite, toggleFavorite, favorites } = useFavorites();

  useEffect(() => {
    const openToolFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      const foundTool = TOOLS.find((tool) => tool.id === hash);
      if (foundTool) setActiveTool(foundTool);
    };

    openToolFromHash();
    window.addEventListener("hashchange", openToolFromHash);
    return () => window.removeEventListener("hashchange", openToolFromHash);
  }, []);

  useEffect(() => {
    document.body.style.overflow = activeTool ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeTool]);

  const favoriteTools = useMemo(
    () => TOOLS.filter((tool) => favorites.includes(tool.id)),
    [favorites],
  );

  const dailyTools = useMemo(
    () =>
      DAILY_TOOL_IDS.map((id) => TOOLS.find((tool) => tool.id === id)).filter(
        (tool): tool is ToolDef => Boolean(tool),
      ),
    [],
  );

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const tools =
      activeCategory === "all"
        ? TOOLS
        : activeCategory === "favorites"
          ? favoriteTools
          : getToolsByCategory(activeCategory);

    if (!normalizedQuery) return tools;

    return tools.filter((tool) =>
      [tool.name, tool.description, tool.category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [activeCategory, favoriteTools, query]);

  const openDashboard = () => {
    setActiveTool(TOOLS.find((tool) => tool.id === "custom-dashboard") ?? null);
  };

  return (
    <main className="relative h-screen overflow-hidden bg-[#f7fbff] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(125,211,252,0.42),rgba(254,240,138,0.5)_44%,rgba(251,207,232,0.42))]" />
      <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_78%_10%,rgba(34,197,94,0.24),transparent_24%)]" />
      <div className="relative z-10 mx-auto flex h-screen w-full max-w-[96rem] flex-col gap-2.5 px-3 py-3 sm:px-4">
        <header className="rounded-[1.4rem] border border-white/80 bg-white/[0.86] p-3 shadow-xl shadow-sky-900/10 backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[auto_minmax(18rem,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-cyan-200 shadow-lg shadow-sky-900/20">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
                  Elementary ESL Japan
                </p>
                <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">
                  Classroom Tools Adventure Board
                </h1>
              </div>
            </div>

            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-700" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools..."
                className="h-11 w-full rounded-2xl border border-sky-200 bg-sky-50/90 pl-10 pr-3 text-sm font-black text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-1.5 shadow-sm">
                <AttendanceButton />
              </div>
              <button
                type="button"
                onClick={openDashboard}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-sky-900"
              >
                <Grid2X2 className="h-4 w-4" />
                Dashboard
              </button>
            </div>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-2.5 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="grid min-h-0 gap-2.5 xl:grid-rows-[auto_minmax(0,1fr)]">
            <div className="rounded-[1.4rem] border border-white/80 bg-white/[0.88] p-3 shadow-xl shadow-sky-900/10">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Teacher Dock
                </p>
                <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white">
                  {filteredTools.length}/{TOOLS.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <TeacherDockTile icon={<Users className="h-4 w-4" />} label="Roster" tool={TOOLS.find((tool) => tool.id === "enter-names")} onOpen={setActiveTool} />
                <TeacherDockTile icon={<Clock3 className="h-4 w-4" />} label="Timer" tool={TOOLS.find((tool) => tool.id === "classic")} onOpen={setActiveTool} />
                <TeacherDockTile icon={<BookOpenCheck className="h-4 w-4" />} label="Phonics" tool={TOOLS.find((tool) => tool.id === "letter-cards")} onOpen={setActiveTool} />
              </div>
            </div>

            <div className="min-h-0 rounded-[1.4rem] border border-white/80 bg-white/82 p-3 shadow-xl shadow-sky-900/10">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-700">
                  Tool Zones
                </p>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <div className="grid max-h-[calc(100vh-15.5rem)] grid-cols-2 gap-1.5 overflow-y-auto pr-1 xl:max-h-[calc(100vh-16.5rem)]">
                  <FilterButton
                    active={activeCategory === "all"}
                    label="All"
                    count={TOOLS.length}
                    onClick={() => setActiveCategory("all")}
                  />
                  <FilterButton
                    active={activeCategory === "favorites"}
                    label="Stars"
                    count={favoriteTools.length}
                    onClick={() => setActiveCategory("favorites")}
                    favorite
                  />
                  {CATEGORY_ORDER.map((category) => (
                    <FilterButton
                      key={category}
                      active={activeCategory === category}
                      label={CATEGORY_INFO[category].label}
                      count={getToolsByCategory(category).length}
                      emoji={CATEGORY_INFO[category].emoji}
                      accent={CATEGORY_ACCENTS[category]}
                      onClick={() => setActiveCategory(category)}
                    />
                  ))}
              </div>
            </div>
          </aside>

          <section className="min-h-0 rounded-[1.4rem] border border-white/80 bg-white/82 p-3 shadow-xl shadow-sky-900/10 backdrop-blur-xl xl:h-[calc(100vh-6.75rem)]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                  {activeCategory === "all"
                    ? "All Tools"
                    : activeCategory === "favorites"
                      ? "Favorites"
                      : CATEGORY_INFO[activeCategory].label}
                </p>
                <h2 className="text-lg font-black leading-tight">
                  {query.trim()
                    ? `${filteredTools.length} search result${
                        filteredTools.length === 1 ? "" : "s"
                      }`
                    : "Choose a classroom pathway"}
                </h2>
              </div>
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-sky-50"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {!query.trim() && activeCategory === "all" ? (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1 pr-1">
                {dailyTools.map((tool) => (
                  <PathwayCard
                    key={tool.id}
                    tool={tool}
                    onOpen={() => setActiveTool(tool)}
                  />
                ))}
              </div>
            ) : null}

            <div className={cn(
              "grid grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
              !query.trim() && activeCategory === "all"
                ? "max-h-[calc(100vh-19rem)] xl:max-h-[calc(100vh-19.5rem)]"
                : "max-h-[calc(100vh-10.5rem)]",
            )}>
              {filteredTools.map((tool) => (
                <ToolTile
                  key={tool.id}
                  tool={tool}
                  favorite={isFavorite(tool.id)}
                  onOpen={() => setActiveTool(tool)}
                  onToggleFavorite={() => toggleFavorite(tool.id)}
                />
              ))}
            </div>

            {filteredTools.length === 0 ? (
              <div className="mt-10 rounded-xl border border-dashed border-white/20 bg-white/[0.04] p-6 text-center text-sm text-slate-300">
                No tools matched that search.
              </div>
            ) : null}
          </section>
        </section>
      </div>

      {activeTool ? (
        <ToolLauncher
          tool={activeTool}
          onClose={() => {
            setActiveTool(null);
            if (window.location.hash) {
              history.replaceState(null, "", window.location.pathname);
            }
          }}
        />
      ) : null}
    </main>
  );
}

function QuickLaunchButton({
  tool,
  onOpen,
}: {
  tool: ToolDef;
  onOpen: () => void;
}) {
  const Icon = tool.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-14 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] p-2 text-left transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.12]"
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ backgroundColor: `${tool.accent}28` }}
      >
        <Icon className="h-4 w-4" style={{ color: tool.accent }} />
      </span>
      <span className="min-w-0 text-xs font-black leading-tight text-white">
        {tool.name}
      </span>
    </button>
  );
}

function TeacherDockTile({
  icon,
  label,
  tool,
  onOpen,
}: {
  icon: ReactNode;
  label: string;
  tool?: ToolDef;
  onOpen: (tool: ToolDef) => void;
}) {
  if (!tool) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(tool)}
      className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PathwayCard({
  tool,
  onOpen,
}: {
  tool: ToolDef;
  onOpen: () => void;
}) {
  const style = PATHWAY_STYLES[tool.id] ?? {
    kicker: CATEGORY_INFO[tool.category].label,
    hue: tool.accent,
    bg: tool.gradient,
  };
  const Icon = tool.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative min-h-[6.25rem] min-w-[7.7rem] flex-1 overflow-hidden rounded-[1.25rem] bg-gradient-to-br p-2.5 text-left text-white shadow-lg shadow-slate-900/14 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300",
        style.bg,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.18),rgba(15,23,42,0.02)_45%,rgba(15,23,42,0.28))]" />
      {style.image ? (
        <img
          src={style.image}
          alt=""
          className="absolute bottom-0 right-0 h-16 w-16 object-contain opacity-95 drop-shadow-xl transition group-hover:scale-105"
        />
      ) : (
        <span className="absolute bottom-1 right-2 text-5xl opacity-80 drop-shadow-xl transition group-hover:scale-105">
          {tool.emoji}
        </span>
      )}
      <div className="relative z-10 flex h-full flex-col justify-between">
        <span className="w-fit rounded-full bg-white/[0.84] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-900">
          {style.kicker}
        </span>
        <div className="max-w-[6rem]">
          <div
            className="mb-1 grid h-8 w-8 place-items-center rounded-xl bg-white/90 text-slate-950"
            style={{ color: style.hue }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-black leading-tight drop-shadow">
            {tool.name}
          </h3>
        </div>
      </div>
    </button>
  );
}

function FilterButton({
  active,
  label,
  count,
  onClick,
  emoji,
  accent,
  favorite = false,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  emoji?: string;
  accent?: string;
  favorite?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50",
        active &&
          "border-cyan-200 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20",
        favorite && active && "border-amber-200 bg-amber-300",
      )}
      style={active && accent && !favorite ? { borderColor: accent } : undefined}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span>{favorite ? "★" : emoji}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 opacity-70">{count}</span>
    </button>
  );
}

function ToolTile({
  tool,
  favorite,
  onOpen,
  onToggleFavorite,
}: {
  tool: ToolDef;
  favorite: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  const Icon = tool.icon;
  const mangaIcon = MANGA_ICON_BY_TOOL[tool.id];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group relative flex min-h-[4.35rem] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 opacity-90"
        style={{ backgroundColor: tool.accent }}
      />

      <div className="flex items-start justify-between gap-2">
        {mangaIcon ? (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50">
            <img src={mangaIcon} alt="" className="h-9 w-9 object-contain" />
          </div>
        ) : (
          <div
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${tool.accent}24` }}
          >
            <Icon className="h-4 w-4" style={{ color: tool.accent }} />
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 transition hover:bg-white",
            favorite && "border-amber-200/70 bg-amber-300 text-slate-950",
          )}
        >
          <Star className={cn("h-3 w-3", favorite && "fill-current")} />
        </button>
      </div>

      <div>
        <h3 className="line-clamp-1 text-xs font-black leading-tight text-slate-950">
          {tool.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold leading-tight text-slate-500">
          {CATEGORY_INFO[tool.category].label}
        </p>
      </div>
    </article>
  );
}

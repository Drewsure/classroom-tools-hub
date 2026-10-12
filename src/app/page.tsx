"use client";

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
  Grid2X2,
  LayoutDashboard,
  Search,
  Sparkles,
  Star,
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
  "custom-dashboard",
  "enter-names",
  "classic",
  "name-picker",
  "weather-cards",
  "sound-pad",
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
    <main className="relative h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.13),transparent_28%)]" />
      <div className="relative z-10 mx-auto flex h-screen w-full max-w-[92rem] flex-col gap-3 px-3 py-3 sm:px-4">
        <header className="rounded-2xl border border-white/15 bg-slate-950/82 p-3 shadow-xl shadow-black/25 backdrop-blur-2xl">
          <div className="grid gap-3 lg:grid-cols-[auto_minmax(18rem,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                  Classroom Tools Hub
                </p>
                <h1 className="truncate text-xl font-black tracking-tight">
                  One-Screen Teacher Console
                </h1>
              </div>
            </div>

            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools..."
                className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-300 focus:bg-white/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <AttendanceButton />
              <button
                type="button"
                onClick={openDashboard}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-slate-950 shadow-lg shadow-black/20 transition hover:bg-cyan-100"
              >
                <Grid2X2 className="h-4 w-4" />
                Dashboard
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-3 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/12 bg-white/[0.065] p-3 backdrop-blur-xl xl:h-[calc(100vh-6.75rem)]">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl border border-white/10 bg-slate-900/65 p-3">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Daily
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {dailyTools.map((tool) => (
                    <QuickLaunchButton
                      key={tool.id}
                      tool={tool}
                      onOpen={() => setActiveTool(tool)}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/65 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">
                    Filters
                  </p>
                  <span className="text-xs font-bold text-slate-400">
                    {filteredTools.length}/{TOOLS.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
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
            </div>
          </aside>

          <section className="min-h-0 rounded-2xl border border-white/12 bg-white/[0.055] p-3 shadow-xl shadow-black/20 backdrop-blur-xl xl:h-[calc(100vh-6.75rem)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
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
                    : "Tap once. Teach fast."}
                </h2>
              </div>
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="grid max-h-[calc(100vh-10.5rem)] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
        "flex h-9 items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-2 text-xs font-black text-slate-200 transition hover:bg-white/10",
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
      className="group relative flex min-h-[4.15rem] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-slate-900/72 p-1.5 outline-none transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-slate-800/85 focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 opacity-90"
        style={{ backgroundColor: tool.accent }}
      />

      <div className="flex items-start justify-between gap-2">
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${tool.accent}24` }}
        >
          <Icon className="h-4 w-4" style={{ color: tool.accent }} />
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10",
            favorite && "border-amber-200/70 bg-amber-300 text-slate-950",
          )}
        >
          <Star className={cn("h-3 w-3", favorite && "fill-current")} />
        </button>
      </div>

      <div>
        <h3 className="line-clamp-1 text-xs font-black leading-tight text-white">
          {tool.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold leading-tight text-slate-400">
          {CATEGORY_INFO[tool.category].label}
        </p>
      </div>
    </article>
  );
}

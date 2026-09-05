"use client";

import { useEffect, useState } from "react";
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
import { Star } from "lucide-react";

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all" | "favorites">("all");
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (activeTool) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeTool]);

  const categories = (Object.keys(CATEGORY_INFO) as ToolCategory[]).filter(
    (c) => c !== "favorites",
  );
  const filteredTools =
    activeCategory === "all"
      ? TOOLS
      : activeCategory === "favorites"
        ? TOOLS.filter((t) => favorites.includes(t.id))
        : getToolsByCategory(activeCategory);

  const favoriteTools = TOOLS.filter((t) => favorites.includes(t.id));

  return (
    <div className="min-h-screen flex flex-col glass-bg">
      {/* Glassmorphism header */}
      <header className="glass-header px-3 py-2 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          <h1 className="text-base font-black tracking-tight shrink-0 glass-hero-text">
            🎓 Tools Hub
          </h1>
          <span className="text-xs text-white/50 shrink-0 hidden sm:inline">
            {TOOLS.length} tools
          </span>
          {/* Category filter — compact pills, inline */}
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all whitespace-nowrap",
                activeCategory === "all"
                  ? "glass-button-active text-white"
                  : "glass-button text-white hover:bg-white/15",
              )}
            >
              All ({TOOLS.length})
            </button>
            <button
              onClick={() => setActiveCategory("favorites")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all whitespace-nowrap",
                activeCategory === "favorites"
                  ? "bg-yellow-400 text-slate-900 border-yellow-400"
                  : "glass-button text-white hover:bg-white/15",
              )}
            >
              ★ ({favorites.length})
            </button>
            {categories.map((cat) => {
              const info = CATEGORY_INFO[cat];
              const count = getToolsByCategory(cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all whitespace-nowrap flex items-center gap-0.5",
                    activeCategory === cat
                      ? "glass-button-active text-white"
                      : "glass-button text-white hover:bg-white/15",
                  )}
                >
                  <span>{info.emoji}</span>
                  <span className="hidden lg:inline">{info.label}</span>
                  <span className="opacity-50">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content — bento layout */}
      <main className="flex-1 px-4 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Favorites row — compact strip */}
          {activeCategory === "all" && favoriteTools.length > 0 && (
            <section className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">
                  Favorites
                </h2>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {favoriteTools.map((tool) => (
                  <MiniToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => setActiveTool(tool)}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All tools — bento grid with side-by-side categories */}
          {activeCategory === "all" ? (
            <div className="space-y-2">
              {/* Render categories, grouping single-tool categories side by side */}
              {(() => {
                // Define which categories to pair side-by-side
                const pairs: [ToolCategory, ToolCategory][] = [
                  ["math", "letters"],
                  ["dashboard", "sounds"],
                ];
                const paired = new Set<string>(pairs.flat());

                // Render a single category section
                const renderSection = (cat: ToolCategory) => {
                  const info = CATEGORY_INFO[cat];
                  const tools = getToolsByCategory(cat);
                  if (tools.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{info.emoji}</span>
                        <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">
                          {info.label}
                        </h2>
                        <span className="text-xs text-white/40 hidden sm:inline">
                          {info.description}
                        </span>
                      </div>
                      <div className={cn(
                        "grid gap-2",
                        tools.length === 10
                          ? "grid-cols-5"
                          : tools.length <= 2
                            ? "grid-cols-2"
                            : tools.length <= 4
                              ? "grid-cols-4"
                              : "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
                      )}>
                        {tools.map((tool) => (
                          <MiniToolCard
                            key={tool.id}
                            tool={tool}
                            onClick={() => setActiveTool(tool)}
                            isFavorite={isFavorite(tool.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  );
                };

                return categories.map((cat) => {
                  if (paired.has(cat)) {
                    // Find the pair this category belongs to
                    const pair = pairs.find(([a, b]) => a === cat || b === cat);
                    if (pair && cat === pair[0]) {
                      // Render both side by side (only on the first of the pair)
                      return (
                        <div key={cat} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {renderSection(pair[0])}
                          {renderSection(pair[1])}
                        </div>
                      );
                    }
                    // Skip the second of the pair (already rendered)
                    return null;
                  }
                  // Render standalone categories normally
                  return <section key={cat}>{renderSection(cat)}</section>;
                });
              })()}
            </div>
          ) : activeCategory === "favorites" ? (
            favoriteTools.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {favoriteTools.map((tool) => (
                  <MiniToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => setActiveTool(tool)}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Star className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-base font-semibold mb-1">
                  No favorites yet!
                </p>
                <p className="text-white/30 text-xs">
                  Click the ★ on any tool card to add it here
                </p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
              {filteredTools.map((tool) => (
                <MiniToolCard
                  key={tool.id}
                  tool={tool}
                  onClick={() => setActiveTool(tool)}
                  isFavorite={isFavorite(tool.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto px-4 py-2 text-center text-xs text-white/30">
        Click ★ to favorite · Sound on for best experience
      </footer>

      {activeTool && (
        <ToolLauncher
          tool={activeTool}
          onClose={() => setActiveTool(null)}
        />
      )}
    </div>
  );
}

/* Compact bento-style tool card */
function MiniToolCard({
  tool,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  tool: ToolDef;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const Icon = tool.icon;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl transition-all duration-200 hover:scale-105 focus-within:ring-2 focus-within:ring-emerald-400/40 bg-gradient-to-br cursor-pointer tool-card-glow",
        tool.gradient,
        "min-h-[76px] flex flex-col",
      )}
      style={{ ['--tool-accent' as string]: tool.accent }}
      onClick={onClick}
    >
      {/* Favorite star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(tool.id);
        }}
        className={cn(
          "absolute top-1 right-1 z-20 w-5 h-5 rounded-full flex items-center justify-center transition-all",
          isFavorite
            ? "bg-yellow-400/90 text-slate-900"
            : "bg-black/20 text-white/50 hover:bg-black/40 hover:text-white opacity-0 group-hover:opacity-100",
        )}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star className={cn("h-2.5 w-2.5", isFavorite && "fill-current")} />
      </button>

      {/* Background emoji */}
      <div className="absolute -right-2 -top-2 text-4xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300 pointer-events-none">
        {tool.emoji}
      </div>

      {/* Content */}
      <div className="relative p-2 text-white flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Icon className="h-3 w-3 text-white" />
          </div>
          <span className="text-base">{tool.emoji}</span>
        </div>
        <div className="mt-1">
          <h3 className="text-[11px] font-bold leading-tight drop-shadow">
            {tool.name}
          </h3>
          <p className="text-[9px] text-white/70 leading-tight mt-0.5 line-clamp-1">
            {tool.description}
          </p>
        </div>
      </div>
    </div>
  );
}

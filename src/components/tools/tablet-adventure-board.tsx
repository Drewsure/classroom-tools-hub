"use client";

import { Grid2X2, Search, Star, Users, X } from "lucide-react";
import { CATEGORY_INFO, TOOLS, type ToolCategory, type ToolDef } from "@/lib/tools";
import { getMangaToolIcon } from "@/lib/tool-art.generated";
import { AttendanceButton } from "./attendance-dialog";

interface Props {
  categories: ToolCategory[];
  category: "all" | ToolCategory;
  onCategory: (category: "all" | ToolCategory) => void;
  query: string;
  onQuery: (query: string) => void;
  tools: ToolDef[];
  onOpen: (tool: ToolDef) => void;
  isFavorite: (id: string) => boolean;
  onFavorite: (id: string) => void;
}

export function TabletAdventureBoard({ categories, category, onCategory, query, onQuery, tools, onOpen, isFavorite, onFavorite }: Props) {
  return (
    <section className="tablet-adventure" aria-label="Illustrated classroom board">
      <header className="tablet-board-header">
        <div><p>MINISTAR ENGLISH</p><h1>Classroom Tools Hub</h1></div>
        <div className="tablet-teacher-dock">
          <span>Teacher</span>
          <AttendanceButton />
          <button type="button" onClick={() => onOpen(TOOLS.find(tool => tool.id === "enter-names")!)}><Users size={20} /> Roster</button>
        </div>
      </header>
      <div className="tablet-board-search">
        <Search size={20} aria-hidden />
        <input aria-label="Search classroom tools" placeholder="Search tools" value={query} onChange={event => onQuery(event.target.value)} />
        {query && <button type="button" title="Clear search" aria-label="Clear search" onClick={() => onQuery("")}><X size={20} /></button>}
      </div>
      <label className="tablet-mobile-zone">
        <span>Tool zone</span>
        <select value={category} onChange={event => onCategory(event.target.value as Props["category"])}>
          <option value="all">All Tools</option>
          <option value="favorites">Favorites</option>
          {categories.map(zone => <option key={zone} value={zone}>{CATEGORY_INFO[zone].label}</option>)}
        </select>
      </label>
      <nav className="tablet-tool-zones" aria-label="Tool categories">
        <button type="button" aria-pressed={category === "all"} onClick={() => onCategory("all")}><Grid2X2 size={18} /> All</button>
        <button type="button" aria-pressed={category === "favorites"} onClick={() => onCategory("favorites")}><Star size={18} /> Favorites</button>
        {categories.map(zone => {
          const Icon = TOOLS.find(tool => tool.category === zone)?.icon ?? Grid2X2;
          return <button key={zone} type="button" aria-pressed={category === zone} onClick={() => onCategory(zone)}><Icon size={18} />{CATEGORY_INFO[zone].label}</button>;
        })}
      </nav>
      <div className="tablet-picture-tools">
        {tools.map(tool => (
          <article key={tool.id} style={{ borderColor: tool.accent }}>
            <button className="tablet-picture-open" type="button" onClick={() => onOpen(tool)} aria-label={tool.name}>
              <img src={getMangaToolIcon(tool.id)} width={110} height={110} alt="" loading="lazy" decoding="async" />
              <span>{tool.name}</span>
            </button>
            <button className="tablet-picture-star" type="button" aria-label={`${isFavorite(tool.id) ? "Remove" : "Add"} ${tool.name} ${isFavorite(tool.id) ? "from" : "to"} favorites`} aria-pressed={isFavorite(tool.id)} title="Favorite tool" onClick={() => onFavorite(tool.id)}>
              <Star size={18} fill={isFavorite(tool.id) ? "#facc15" : "none"} />
            </button>
          </article>
        ))}
      </div>
      {tools.length === 0 && <p className="tablet-board-empty">No matching tools.</p>}
    </section>
  );
}

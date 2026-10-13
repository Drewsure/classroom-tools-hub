"use client";

import { SKINS, type SkinId } from "@/lib/skins";
import { cn } from "@/lib/utils";

interface UniversalSkinPickerProps {
  current: SkinId;
  onChange: (id: SkinId) => void;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

/**
 * Universal skin picker — works on any tool (timers, pickers, games, counters).
 * Same chip-row UI as the timer SkinPicker but without the "save favorite" button
 * (saving is handled automatically via useToolSkin).
 */
export function UniversalSkinPicker({
  current,
  onChange,
  compact = false,
}: UniversalSkinPickerProps) {
  return (
    <div className="mb-2 w-full rounded-2xl border border-white/60 bg-white/90 p-2 shadow-xl shadow-slate-950/15 backdrop-blur-md">
      <p className="mb-2 text-center text-xs font-black uppercase tracking-wider text-slate-700">
        Theme
      </p>
      <select
        aria-label="Theme"
        value={current}
        onChange={(event) => onChange(event.target.value as SkinId)}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-bold text-slate-950 sm:hidden"
      >
        {SKINS.map((skin) => <option key={skin.id} value={skin.id}>{skin.name}</option>)}
      </select>
      <div className={cn(
        "hidden sm:flex justify-center gap-1.5 overflow-y-auto pb-1 flex-wrap",
        compact ? "max-h-16" : "max-h-28",
      )}>
        {SKINS.map((skin) => (
          <button
            key={skin.id}
            onClick={() => onChange(skin.id)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-xs font-black shadow-sm transition-all",
              current === skin.id
                ? "scale-105 border-cyan-700 bg-cyan-600 text-white shadow-lg shadow-cyan-900/20"
                : "border-slate-300 bg-white text-slate-800 hover:border-cyan-500 hover:bg-cyan-50",
            )}
            title={skin.name}
            aria-label={skin.name}
            aria-pressed={current === skin.id}
          >
            <span className="mr-0.5">{skin.emoji}</span>
            <span>{skin.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

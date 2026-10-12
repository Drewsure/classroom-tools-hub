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
      <div className={cn(
        "flex justify-center gap-1.5 overflow-y-auto pb-1 flex-wrap",
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
          >
            <span className="mr-0.5">{skin.emoji}</span>
            <span className="hidden sm:inline">{skin.name}</span>
            <span className="sm:hidden">{skin.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

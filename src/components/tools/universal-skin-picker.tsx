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
    <div className="w-full mb-2">
      <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 text-center">
        Theme
      </p>
      <div className={cn(
        "flex gap-1.5 overflow-x-auto pb-2 justify-center flex-wrap",
        compact && "max-h-16",
      )}>
        {SKINS.map((skin) => (
          <button
            key={skin.id}
            onClick={() => onChange(skin.id)}
            className={cn(
              "shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border transition-all",
              current === skin.id
                ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                : "bg-white/10 text-white border-white/25 hover:bg-white/20",
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

"use client";

import { useState, useCallback } from "react";
import { SKINS, type SkinId, type SkinDef } from "@/lib/skins";

const SKIN_STORAGE_KEY = "classroom-tools-tool-skins";

function readSavedSkins(): Record<string, SkinId> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SKIN_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SkinId>;
  } catch {
    return {};
  }
}

function writeSavedSkins(map: Record<string, SkinId>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Hook for managing the active skin on a tool, with localStorage persistence.
 * Works for ANY tool (timers, pickers, games, counters) — not just the timer components.
 *
 * Usage:
 *   const { skin, setSkinId, skinId } = useToolSkin("tally-counter");
 *   // skin = SkinDef with all properties (bgGradient, accent, particles, etc.)
 */
export function useToolSkin(toolKey: string) {
  const [skinId, setSkinIdState] = useState<SkinId>(() => {
    const saved = readSavedSkins();
    return saved[toolKey] ?? "default";
  });

  const setSkinId = useCallback(
    (id: SkinId) => {
      const saved = readSavedSkins();
      saved[toolKey] = id;
      writeSavedSkins(saved);
      setSkinIdState(id);
    },
    [toolKey],
  );

  const skin: SkinDef = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  return { skinId, setSkinId, skin };
}

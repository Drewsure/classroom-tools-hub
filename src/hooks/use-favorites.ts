"use client";

import { useState, useCallback } from "react";

const FAVORITES_KEY = "classroom-tools-favorites";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

/**
 * Hook for managing favorite tools.
 * Favorites are stored in localStorage and persist across sessions.
 * Returns the list of favorite tool IDs, plus toggle/check functions.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites());

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites((prev) => {
      const current = readFavorites();
      const exists = current.includes(toolId);
      const updated = exists
        ? current.filter((id) => id !== toolId)
        : [...current, toolId];
      writeFavorites(updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (toolId: string) => favorites.includes(toolId),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}

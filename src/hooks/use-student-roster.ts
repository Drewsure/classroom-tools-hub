"use client";

import { useEffect, useState, useCallback } from "react";

/* ============================================================
   SHARED STUDENT ROSTER STORE
   ============================================================
   A localStorage-backed store that lets the Random Name Picker
   and Random Group Generator share the same student list.

   Features:
   - Save multiple named rosters (e.g. "Class 5A", "Period 2")
   - The "active" roster is shared between both tools
   - Changes in one tool instantly appear in the other
   - Persists across page reloads
   ============================================================ */

export interface Roster {
  id: string;
  name: string;
  students: string[];
  createdAt: number;
}

const STORAGE_KEY = "classroom-tools-rosters";
const ACTIVE_KEY = "classroom-tools-active-roster";

/** Custom event dispatched whenever the active roster changes */
const ROSTER_CHANGE_EVENT = "classroom-roster-change";

function readRosters(): Roster[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Roster[];
  } catch {
    return [];
  }
}

function writeRosters(rosters: Roster[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rosters));
  } catch {
    // ignore
  }
}

function readActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function writeActiveId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      window.localStorage.setItem(ACTIVE_KEY, id);
    } else {
      window.localStorage.removeItem(ACTIVE_KEY);
    }
  } catch {
    // ignore
  }
}

/** Dispatch a change event so other components re-read from localStorage */
function notifyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ROSTER_CHANGE_EVENT));
}

/**
 * The main hook for accessing and managing the shared student roster.
 * Returns the active roster (students + name), and functions to:
 * - setStudents: update the active roster's student list
 * - saveAsNew: save current students as a new named roster
 * - loadRoster: switch to a different saved roster
 * - deleteRoster: delete a saved roster
 * - allRosters: list of all saved rosters
 */
export function useStudentRoster() {
  // Use a version counter to trigger re-reads when the store changes.
  // The actual data is read from localStorage during render (not in an effect).
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener(ROSTER_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(ROSTER_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  // Read current state from localStorage (version forces re-read on changes)
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  version; // touch version so React re-renders when it changes
  const rosters = readRosters();
  const activeId = readActiveId();

  const activeRoster = rosters.find((r) => r.id === activeId) ?? null;
  const students = activeRoster?.students ?? [];

  /** Update the active roster's student list (creates a "Current" roster if none active) */
  const setStudents = useCallback(
    (newStudents: string[]) => {
      let current = readRosters();
      let currentActiveId = readActiveId();
      let roster = current.find((r) => r.id === currentActiveId);

      if (!roster) {
        // Create a default "Current" roster
        const newId = `roster-${Date.now()}`;
        roster = {
          id: newId,
          name: "Current Class",
          students: newStudents,
          createdAt: Date.now(),
        };
        current = [...current, roster];
        currentActiveId = newId;
        writeRosters(current);
        writeActiveId(currentActiveId);
      } else {
        current = current.map((r) =>
          r.id === currentActiveId ? { ...r, students: newStudents } : r,
        );
        writeRosters(current);
      }
      notifyChange();
    },
    [],
  );

  /** Save the current students as a new named roster and make it active */
  const saveAsNew = useCallback(
    (name: string, students: string[]) => {
      const newRoster: Roster = {
        id: `roster-${Date.now()}`,
        name: name.trim() || `Class ${Date.now()}`,
        students: [...students],
        createdAt: Date.now(),
      };
      const current = readRosters();
      writeRosters([...current, newRoster]);
      writeActiveId(newRoster.id);
      notifyChange();
    },
    [],
  );

  /** Switch to a different saved roster */
  const loadRoster = useCallback((id: string) => {
    writeActiveId(id);
    notifyChange();
  }, []);

  /** Delete a saved roster */
  const deleteRoster = useCallback(
    (id: string) => {
      const current = readRosters();
      const filtered = current.filter((r) => r.id !== id);
      writeRosters(filtered);
      // If we deleted the active one, clear or switch to first available
      if (readActiveId() === id) {
        writeActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      notifyChange();
    },
    [],
  );

  /** Rename the active roster */
  const renameActive = useCallback((name: string) => {
    const currentActiveId = readActiveId();
    if (!currentActiveId) return;
    const current = readRosters();
    writeRosters(
      current.map((r) =>
        r.id === currentActiveId ? { ...r, name: name.trim() || r.name } : r,
      ),
    );
    notifyChange();
  }, []);

  return {
    students,
    activeRoster,
    allRosters: rosters,
    setStudents,
    saveAsNew,
    loadRoster,
    deleteRoster,
    renameActive,
  };
}

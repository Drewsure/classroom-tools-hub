"use client";

import { useCallback, useEffect, useState } from "react";
import { MINISTAR_WEEKLY_SCHEDULE_TEXT } from "@/lib/ministar-weekly-schedule";

/* ============================================================
   ATTENDANCE STORE — browser-only (never committed to git)
   Classes live in localStorage; each day saves a separate
   record under  attendance_YYYY-MM-DD_<classId>
   ============================================================ */

export type { CardLevel, AttStudent, AttClass, AttEntry, AttRecord } from "@/lib/attendance-store";
import {
  type CardLevel, type AttStudent, type AttClass, type AttEntry,
  CHANGE_EVENT, ERROR_EVENT, PREFIX, readClasses, writeClasses, readActiveId, writeActiveId,
  todayStr, lessonDate, startLesson, readRecord, writeRecord, defaultEntry, recordFor,
  ensureTodayRecord, notify, presentStudents, guardMutation, attendanceError,
  allRecords, exportAttendanceBackup, restoreAttendanceBackup,
} from "@/lib/attendance-store";

const DAY_WORDS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function slugId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "class";
}

/** Parse one student line: "Eito (Nenchou) B card" / "Momoko G card" / "Honoka" */
export function parseStudentLine(line: string): AttStudent {
  let s = line.trim().replace(/\s+/g, " ");
  let grade: string | null = null;
  let card: CardLevel | null = null;
  const g = s.match(/\(([^)]+)\)/);
  if (g) { grade = g[1]; s = s.replace(/\([^)]+\)/, " ").replace(/\s+/g, " ").trim(); }
  const c = s.match(/\b([PBG])\s*card\b/i) || s.match(/\s([PBG])$/);
  if (c) { card = c[1].toUpperCase() as CardLevel; s = s.replace(c[0], "").trim(); }
  return { name: s, grade, card };
}

/** Parse a pasted weekly schedule (day headers + class lines + students) */
export function parseSchedule(text: string): AttClass[] {
  const out: AttClass[] = [];
  let day = "";
  let current: AttClass | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(mon|tues|wednes|thurs|fris|fri|satur|sun)days?$/i.test(line)) {
      let d = line.replace(/s$/i, "");
      day = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
      current = null;
      continue;
    }
    const times = line.match(/\d{1,2}:\d{2}/g);
    const dayIn = DAY_WORDS.find((d) => line.toLowerCase().includes(d.toLowerCase()));
    if (times && times.length >= 1 && (dayIn || day) && /[–—-]/.test(line)) {
      // class header line
      const parts = line.split(/[–—-]/).map((p) => p.trim()).filter(Boolean);
      const nameParts: string[] = [];
      for (const p of parts) {
        if (DAY_WORDS.some((d) => p.toLowerCase().startsWith(d.toLowerCase()))) break;
        if (/\d{1,2}:\d{2}/.test(p)) break;
        nameParts.push(p);
      }
      if (nameParts.length === 0) nameParts.push(parts[0] || line);
      const name = nameParts.join(" – ");
      const time = times.length >= 2 ? `${times[0]}–${times[1]}` : (times[0] || "");
      let id = slugId(name);
      if (out.some((c) => c.id === id)) id = id + "-" + (out.length + 1);
      current = { id, name, day: dayIn || day || "", time, students: [] };
      out.push(current);
      continue;
    }
    if (current) current.students.push(parseStudentLine(line));
  }
  return out;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useAttendance() {
  const [version, setVersion] = useState(0);
  const [storageError, setStorageError] = useState<string | null>(attendanceError);

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    const onError = () => setStorageError(attendanceError());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener(ERROR_EVENT, onError);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener(ERROR_EVENT, onError);
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  version;

  let classes: AttClass[] = [];
  let activeId: string | null = null;
  let readError: string | null = null;
  try {
    classes = readClasses();
    activeId = readActiveId();
  } catch { readError = "Saved attendance cannot be read. Restore a backup; do not clear this browser."; }
  const activeClass = classes.find((c) => c.id === activeId) ?? null;
  let activeDate = todayStr();
  try {
    if (activeClass) {
      activeDate = lessonDate(activeClass.id);
      readRecord(activeDate, activeClass.id);
    }
  } catch { readError = "Saved lesson cannot be read. Export or restore a backup before making changes."; }

  const entryFor = useCallback((name: string): AttEntry => {
    const id = readActiveId();
    if (!id) return defaultEntry();
    try { return readRecord(lessonDate(id), id)?.students[name] ?? defaultEntry(); }
    catch { return { p: 0, hw: 0, bag: 0, book: 0 }; }
  }, [activeId]);

  const activeStudents = useCallback((): string[] => {
    const id = readActiveId();
    if (!id) return [];
    try {
      const cls = readClasses().find((c) => c.id === id) ?? null;
      return presentStudents(cls);
    } catch { return []; }
  }, [activeId]);

  const setField = useCallback((name: string, field: "p" | "hw" | "bag" | "book", value: 0 | 1) => {
    const id = readActiveId();
    if (!id) return;
    if (!readClasses().find((cls) => cls.id === id)?.students.some((s) => s.name === name)) return;
    const rec = recordFor(id);
    const e = rec.students[name] ?? defaultEntry();
    rec.students[name] = { ...e, [field]: value };
    writeRecord(rec);
    notify();
  }, []);

  const markAll = useCallback((value: 0 | 1) => {
    const id = readActiveId();
    if (!id) return;
    const cls = readClasses().find((c) => c.id === id);
    if (!cls) return;
    const rec = recordFor(id);
    for (const s of cls.students) {
      const e = rec.students[s.name] ?? defaultEntry();
      rec.students[s.name] = { ...e, p: value };
    }
    writeRecord(rec);
    notify();
  }, []);

  const cycleCard = useCallback((name: string) => {
    const id = readActiveId();
    if (!id) return;
    const cs = readClasses();
    const cls = cs.find((c) => c.id === id);
    if (!cls) return;
    const st = cls.students.find((s) => s.name === name);
    if (!st) return;
    const order: (CardLevel | null)[] = [null, "P", "B", "G"];
    st.card = order[(order.indexOf(st.card ?? null) + 1) % order.length];
    writeClasses(cs);
    notify();
  }, []);

  /** Save a custom name list as a new class (appears in every Class dropdown) */
  const saveCustomList = useCallback((name: string, students: string[]) => {
    const trimmed = name.trim() || "Custom list";
    let id = slugId("custom-" + trimmed);
    const cs = readClasses();
    if (cs.some((c) => c.id === id)) id = id + "-" + Date.now();
    const cls: AttClass = {
      id,
      name: trimmed,
      day: "Custom",
      time: "",
      students: students.filter(Boolean).map((n) => ({ name: n, grade: null, card: null })),
    };
    writeClasses([...cs, cls]);
    startLesson(cls.id);
    writeActiveId(cls.id);
    ensureTodayRecord(cls);
    notify();
    return cls.id;
  }, []);
  const selectClass = useCallback((id: string) => {
    const cls = readClasses().find((c) => c.id === id);
    if (!cls) {
      if (!id) {
        writeActiveId("");
        window.localStorage.removeItem("classroom-tools-active-roster");
        notify();
      }
      return;
    }
    if (readActiveId() !== id) startLesson(id);
    ensureTodayRecord(cls);
    writeActiveId(id);
    notify();
  }, []);

  const importClasses = useCallback((text: string, mode: "replace" | "merge"): number => {
    const parsed = parseSchedule(text);
    if (!parsed.length) return 0;
    let cs = readClasses();
    if (mode === "replace") cs = [];
    for (const c of parsed) {
      const i = cs.findIndex((x) => x.id === c.id);
      if (i >= 0) cs[i] = c;
      else cs.push(c);
    }
    writeClasses(cs);
    startLesson(parsed[0].id);
    ensureTodayRecord(parsed[0]);
    writeActiveId(parsed[0].id);
    notify();
    return parsed.length;
  }, []);

  const importMinistarClasses = useCallback((mode: "replace" | "merge" = "merge"): number => {
    return importClasses(MINISTAR_WEEKLY_SCHEDULE_TEXT, mode);
  }, [importClasses]);

  const removeClass = useCallback((id: string) => {
    const cs = readClasses().filter((c) => c.id !== id);
    writeClasses(cs);
    if (readActiveId() === id) writeActiveId(cs.length ? cs[0].id : "");
    notify();
  }, []);

  const yearDates = useCallback((classId: string): string[] => {
    if (typeof window === "undefined") return [];
    const out: string[] = [];
    const suffix = "_" + classId;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX) && k.endsWith(suffix)) {
        const date = k.slice(PREFIX.length, k.length - suffix.length);
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) out.push(date);
      }
    }
    return out.sort();
  }, []);

  const yearStats = useCallback((classId: string) => {
    const cls = readClasses().find((c) => c.id === classId);
    if (!cls) return [] as { name: string; present: number; hw: number; streak: number; card: CardLevel | null }[];
    const dates = yearDates(classId);
    return cls.students.map((s) => {
      let present = 0, hw = 0;
      for (const d of dates) {
        const e = readRecord(d, classId)?.students[s.name];
        if (e) { if (e.p) present++; if (e.hw) hw++; }
      }
      let streak = 0;
      for (let i = dates.length - 1; i >= 0; i--) {
        const e = readRecord(dates[i], classId)?.students[s.name];
        if (e && e.p) streak++;
        else break;
      }
      return { name: s.name, present, hw, streak, card: s.card };
    });
  }, [yearDates]);

  const exportDayCSV = useCallback(() => {
    const id = readActiveId();
    if (!id) return;
    const cls = readClasses().find((c) => c.id === id);
    if (!cls) return;
    const rec = readRecord(lessonDate(id), id);
    const rows: (string | number)[][] = [["Date", "Class", "Name", "Grade", "Present", "Homework", "Bag", "Book", "Card"]];
    for (const s of cls.students) {
      const e = rec?.students[s.name] ?? defaultEntry();
      rows.push([lessonDate(id), cls.name, s.name, s.grade ?? "", e.p ? "Yes" : "No", e.hw ? "Yes" : "No", e.bag ? "Yes" : "No", e.book ? "Yes" : "No", s.card ?? ""]);
    }
    downloadCSV(`Attendance_${cls.id}_${lessonDate(id)}.csv`, rows);
  }, []);

  const exportYearCSV = useCallback(() => {
    const rows: (string | number)[][] = [["Date", "Class", "Day", "Time", "Name", "Present", "Homework", "Bag", "Book", "Card"]];
    for (const rec of allRecords()) {
      const cls = rec.classSnapshot ?? readClasses().find((c) => c.id === rec.classId);
      for (const [name, e] of Object.entries(rec.students)) {
        const student = cls?.students.find((s) => s.name === name);
        rows.push([rec.date, cls?.name ?? rec.classId, cls?.day ?? "", cls?.time ?? "", name,
          e.p ? "Yes" : "No", e.hw ? "Yes" : "No", e.bag ? "Yes" : "No", e.book === undefined ? "Not recorded" : e.book ? "Yes" : "No", student?.card ?? ""]);
      }
    }
    if (rows.length === 1) return;
    downloadCSV(`Attendance_${new Date().getFullYear()}.csv`, rows);
  }, [yearDates]);

  const exportBackup = () => {
    const url = URL.createObjectURL(new Blob([exportAttendanceBackup()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Classroom_Attendance_Backup_${todayStr()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return {
    classes, activeClass, today: activeDate,
    storageError: readError ?? storageError, entryFor, activeStudents,
    setField: guardMutation(setField, undefined), markAll: guardMutation(markAll, undefined),
    cycleCard: guardMutation(cycleCard, undefined), selectClass: guardMutation(selectClass, undefined),
    saveCustomList: guardMutation(saveCustomList, ""), importClasses: guardMutation(importClasses, 0),
    importMinistarClasses: guardMutation(importMinistarClasses, 0), removeClass: guardMutation(removeClass, undefined),
    yearDates, yearStats: (classId: string) => {
      try { return yearStats(classId); } catch { return []; }
    }, exportDayCSV: guardMutation(exportDayCSV, undefined),
    exportYearCSV: guardMutation(exportYearCSV, undefined), exportBackup: guardMutation(exportBackup, undefined),
    restoreBackup: guardMutation(restoreAttendanceBackup, -1),
    history: (classId: string) => {
      try { return allRecords().filter((record) => record.classId === classId); } catch { return []; }
    },
    startToday: guardMutation(() => {
      if (!activeClass) return;
      startLesson(activeClass.id);
      ensureTodayRecord(activeClass);
      notify();
    }, undefined),
  };
}

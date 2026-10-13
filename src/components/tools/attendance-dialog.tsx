"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAttendance, type CardLevel } from "@/hooks/use-attendance";
import { useStudentRoster } from "@/hooks/use-student-roster";
import {
  ClipboardList, X, Check, Download, Upload, Trash2, CalendarDays, RefreshCw,
} from "lucide-react";

const CARD_STYLES: Record<CardLevel, string> = {
  P: "bg-pink-500 text-white border-pink-300",
  B: "bg-blue-500 text-white border-blue-300",
  G: "bg-emerald-500 text-white border-emerald-300",
};
const CARD_LABEL: Record<CardLevel, string> = { P: "Pink", B: "Blue", G: "Green" };

function ToggleChip({ on, emoji, label, color, onClick }: {
  on: boolean; emoji: string; label: string; color: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} title={label}
      className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 text-xl sm:text-2xl flex items-center justify-center transition-all active:scale-90 shrink-0",
        on ? color : "bg-white text-slate-500 border-slate-300 hover:bg-cyan-50 hover:text-slate-900")}>
      {emoji}
    </button>
  );
}

export function AttendanceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const att = useAttendance();
  const roster = useStudentRoster();
  const [showYear, setShowYear] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Auto-sync: selecting a class makes it the active roster (load or create only — never overwrites students silently)
  const activeClassId = att.activeClass?.id;
  useEffect(() => {
    if (!open || !att.activeClass) return;
    const names = att.activeClass.students.map((s) => s.name);
    const match = roster.allRosters.find((r) => r.name === att.activeClass!.name);
    if (match) {
      if (roster.activeRoster?.id !== match.id) roster.loadRoster(match.id);
    } else if (names.length > 0) {
      roster.saveAsNew(att.activeClass.name, names);
    }
  }, [open, activeClassId]);

  const syncToRoster = () => {
    if (!att.activeClass) return;
    const names = att.activeClass.students.map((s) => s.name);
    const match = roster.allRosters.find((r) => r.name === att.activeClass!.name);
    if (match) {
      roster.loadRoster(match.id);
      roster.setStudents(names);
      setToast(`Updated roster "${match.name}" (${names.length} students)`);
    } else {
      roster.saveAsNew(att.activeClass.name, names);
      setToast(`Created roster "${att.activeClass.name}" (${names.length} students)`);
    }
  };

  const loadMinistarClasses = (mode: "merge" | "replace" = "merge") => {
    const n = att.importMinistarClasses(mode);
    setToast(n > 0 ? `Loaded ${n} Ministar classes` : "No Ministar classes found");
    setShowImport(false);
  };

if (!open) return null;
  const cls = att.activeClass;
  const activeCount = att.activeStudents().length;
  const total = cls?.students.length ?? 0;
  const dayList = cls ? att.yearDates(cls.id) : [];
  const stats = cls ? att.yearStats(cls.id) : [];

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="attendance-title" className="fixed inset-0 z-[110] glass-bg overflow-y-auto">
      <div className="min-h-screen flex flex-col max-w-4xl mx-auto w-full px-3 sm:px-6 py-4">

        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 id="attendance-title" className="text-lg sm:text-xl font-black text-white flex items-center gap-2 flex-wrap">
            <ClipboardList className="h-5 w-5 text-emerald-300" />
            Attendance しゅっせき
            {cls && (
              <span className={cn("text-sm font-bold px-2 py-0.5 rounded-full",
                activeCount === total ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>
                {activeCount}/{total}
              </span>
            )}
            {cls && <span className="text-sm text-slate-300 font-normal">{att.today}</span>}
          </h2>
          <Button onClick={onClose} variant="outline" size="icon" aria-label="Close attendance"
            className="h-10 w-10 rounded-full border-white bg-white text-slate-900 hover:bg-cyan-100">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!cls ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ClipboardList className="h-12 w-12 text-white/20" />
            <p className="text-slate-200 font-bold">No classes yet</p>
            <p className="text-slate-300 text-sm max-w-md">
              Click Import and paste your weekly schedule — days, class lines with times, one student per line.
              Cards like &quot;B card&quot; are auto-detected. Data stays in this browser only.
            </p>
            <Button onClick={() => setShowImport(true)} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white">
              <Upload className="mr-1 h-4 w-4" /> Import schedule
            </Button>
            <Button onClick={() => loadMinistarClasses("replace")} variant="outline" className="classroom-control-button rounded-full hover:text-slate-950">
              <ClipboardList className="mr-1 h-4 w-4" /> Load Ministar weekly classes
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <select value={cls.id} onChange={(e) => att.selectClass(e.target.value)}
                className="classroom-input flex-1 min-w-[220px] rounded-xl px-3 py-2 text-sm font-black">
                {att.classes.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900">
                    {c.name} · {c.day} {c.time} ({c.students.length})
                  </option>
                ))}
              </select>
              <Button onClick={syncToRoster} size="sm" variant="outline"
                className="classroom-control-button rounded-full hover:text-slate-950">
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Sync to pickers
              </Button>
              <Button size="sm" variant="outline"
                onClick={() => { if (window.confirm(`Remove class "${cls.name}"? Attendance history is kept.`)) att.removeClass(cls.id); }}
                className="rounded-full bg-rose-500/20 text-rose-200 border-rose-400/40 hover:bg-rose-500/30">
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Button size="sm" onClick={() => att.markAll(1)} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white">
                <Check className="mr-1 h-3.5 w-3.5" /> All Present
              </Button>
              <Button size="sm" variant="outline" onClick={() => att.markAll(0)}
                className="classroom-control-button rounded-full hover:text-slate-950">All Absent</Button>
              <Button size="sm" variant="outline" onClick={() => setShowYear(!showYear)}
                className={cn("rounded-full", showYear ? "classroom-control-button-active" : "classroom-control-button hover:text-slate-950")}>
                <CalendarDays className="mr-1 h-3.5 w-3.5" /> Year View
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowImport(!showImport)}
                className="classroom-control-button rounded-full hover:text-slate-950">
                <Upload className="mr-1 h-3.5 w-3.5" /> Import
              </Button>
              <Button size="sm" variant="outline" onClick={() => loadMinistarClasses("merge")}
                className="classroom-control-button rounded-full hover:text-slate-950">
                <ClipboardList className="mr-1 h-3.5 w-3.5" /> Ministar Classes
              </Button>
              <Button size="sm" variant="outline" onClick={att.exportDayCSV}
                className="classroom-control-button rounded-full hover:text-slate-950">
                <Download className="mr-1 h-3.5 w-3.5" /> CSV Day
              </Button>
              <Button size="sm" variant="outline" onClick={att.exportYearCSV}
                className="classroom-control-button rounded-full hover:text-slate-950">
                <Download className="mr-1 h-3.5 w-3.5" /> CSV Year
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              {cls.students.map((s) => {
                const e = att.entryFor(s.name);
                return (
                  <div key={s.name} className="flex items-center gap-2 sm:gap-3 rounded-xl border border-white/70 bg-white/95 px-3 py-2 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-xl font-black text-slate-950 truncate">{s.name}</p>
                      {s.grade && <p className="text-xs font-semibold text-slate-500">{s.grade}</p>}
                    </div>
                    <ToggleChip on={e.p === 1} emoji="✓" label="Present"
                      color="bg-emerald-500/90 border-emerald-300 text-white"
                      onClick={() => att.setField(s.name, "p", e.p ? 0 : 1)} />
                    <ToggleChip on={e.hw === 1} emoji="📚" label="Homework"
                      color="bg-amber-500/90 border-amber-300 text-white"
                      onClick={() => att.setField(s.name, "hw", e.hw ? 0 : 1)} />
                    <ToggleChip on={e.bag === 1} emoji="🎒" label="Bag"
                      color="bg-violet-500/90 border-violet-300 text-white"
                      onClick={() => att.setField(s.name, "bag", e.bag ? 0 : 1)} />
                    <button onClick={() => att.cycleCard(s.name)}
                      title={s.card ? `Card: ${CARD_LABEL[s.card]} — click to cycle` : "No card — click to cycle"}
                      className={cn("w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 text-sm font-black shrink-0 transition-all hover:scale-110 active:scale-95",
                        s.card ? CARD_STYLES[s.card] : "bg-white text-slate-500 border-slate-300")}>
                      {s.card ?? "–"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-slate-300 mt-2">
              Present ON by default · Homework OFF · Bag ON · Active {activeCount}/{total}
              — absent students get excluded from pickers in the next stage
            </p>

            {showYear && (
              <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="h-4 w-4 text-sky-300" />
                  <h3 className="text-sm font-bold text-white">Year View — {cls.name}</h3>
                  <span className="text-sm text-slate-300">{dayList.length}/40 lessons recorded</span>
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 mb-3">
                  {Array.from({ length: 40 }, (_, i) => {
                    const d = dayList[i];
                    return (
                      <div key={i}
                        title={d ? "Lesson " + (i + 1) + " - " + d : "Lesson " + (i + 1)}
                        className={cn("h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all",
                          d ? "bg-emerald-500/80 text-white shadow" : "bg-white/10 text-white/30")}>
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                  {stats.length === 0 && <p className="text-sm text-slate-300">No students.</p>}
                  {stats.map((st) => (
                    <div key={st.name} className="flex items-center gap-2 text-xs text-white/70">
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border-2",
                        st.card ? CARD_STYLES[st.card] : "bg-white/10 text-white/30 border-white/10")}>
                        {st.card ?? "–"}
                      </span>
                      <b className="text-white text-sm">{st.name}</b>
                      <span>— {st.present} days present · {st.hw} homework{st.streak > 1 ? ` · streak ${st.streak} 🔥` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {showImport && (
          <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4" /> Import classes
            </h3>
            <p className="text-sm text-slate-300 mb-2">
              Paste your weekly schedule: day headers (MONDAYS…), class lines with times, one student per line.
              Cards auto-detected: P card = pink · B card = blue · G card = green.
              Saved to this browser only — never uploaded anywhere.
            </p>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={8}
              placeholder={"MONDAYS\n\nItochuodai Nursery School – Monday – 14:05 – 14:55\nEito (Nenchou) B card\nMiho (Nenchou) G card"}
              className="w-full rounded-xl bg-black/30 border border-white/20 text-white text-xs font-mono p-3" />
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-white/70 cursor-pointer">
                <input type="radio" checked={importMode === "merge"} onChange={() => setImportMode("merge")} /> Merge
              </label>
              <label className="flex items-center gap-1.5 text-xs text-white/70 cursor-pointer">
                <input type="radio" checked={importMode === "replace"} onChange={() => setImportMode("replace")} /> Replace all
              </label>
              <Button size="sm" className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white ml-auto"
                onClick={() => {
                  const n = att.importClasses(importText, importMode);
                  setToast(n > 0 ? `Imported ${n} classes` : "No classes found — check the format");
                  if (n > 0) { setShowImport(false); setImportText(""); }
                }}>Import</Button>
              <Button size="sm" variant="outline" className="classroom-control-button rounded-full hover:text-slate-950"
                onClick={() => loadMinistarClasses(importMode)}>
                <ClipboardList className="mr-1 h-3.5 w-3.5" /> Load Ministar list
              </Button>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg z-[80]">
            {toast}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function AttendanceButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const att = useAttendance();
  const total = mounted ? (att.activeClass?.students.length ?? 0) : 0;
  const active = mounted ? att.activeStudents().length : 0;
  return (
    <>
      <button onClick={() => setOpen(true)} title="Attendance しゅっせき"
        className="shrink-0 flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-black text-emerald-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-100 active:scale-95">
        <ClipboardList className="h-4 w-4" />
        <span className="hidden sm:inline">Attendance</span>
        <span className={cn("rounded-full px-2 py-0.5 tabular-nums", total > 0 && active < total ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900")}>
          {active}/{total}
        </span>
      </button>
      <AttendanceDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

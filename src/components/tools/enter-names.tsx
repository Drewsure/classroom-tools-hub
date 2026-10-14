"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { useDramaticSound } from "@/hooks/use-effects";
import { RosterManager } from "./roster-manager";
import { MINISTAR_WEEKLY_SCHEDULE_TEXT } from "@/lib/ministar-weekly-schedule";
import { parseSchedule, useAttendance } from "@/hooks/use-attendance";
import { BookOpenCheck, Download, Plus, Trash2, UserPlus, Users } from "lucide-react";

export function EnterNames() {
  const sound = useDramaticSound();
  const { students, setStudents, importRosters } = useStudentRoster();
  const attendance = useAttendance();

  const [newName, setNewName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [rosterToast, setRosterToast] = useState<string | null>(null);

  // Sync from shared roster — just use students directly
  // The hook re-renders when the store changes, so we can derive names from it
  const [localOverrides, setLocalOverrides] = useState<string[] | null>(null);
  useEffect(() => { setLocalOverrides(null); }, [students]);
  const names = localOverrides ?? students;
  const setNames = (newNames: string[]) => {
    setLocalOverrides(newNames);
    setStudents(newNames);
  };

  useEffect(() => {
    if (!rosterToast) return;
    const timer = window.setTimeout(() => setRosterToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [rosterToast]);

  const syncToRoster = (updated: string[]) => {
    setNames(updated);
    setStudents(updated);
  };

  const addName = () => {
    if (!newName.trim()) return;
    syncToRoster([...names, newName.trim()]);
    setNewName("");
    sound.playClick();
  };

  const removeName = (idx: number) => {
    syncToRoster(names.filter((_, i) => i !== idx));
    sound.playClick();
  };

  const updateName = (idx: number, value: string) => {
    const updated = names.map((n, i) => (i === idx ? value : n));
    setNames(updated);
    setStudents(updated);
  };

  const handleBulkAdd = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    syncToRoster([...names, ...lines]);
    setBulkText("");
    setShowBulk(false);
    sound.playClick();
  };

  const clearAll = () => {
    syncToRoster([]);
    sound.playClick();
  };

  const exportNames = () => {
    const text = names.join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    sound.playClick();
  };

  const loadMinistarRosters = () => {
    const classes = parseSchedule(MINISTAR_WEEKLY_SCHEDULE_TEXT);
    const attendanceCount = attendance.importMinistarClasses("merge");
    const count = importRosters(
      classes.map((cls) => ({
        name: cls.name,
        students: cls.students.map((student) => student.name),
      })),
      "merge",
    );
    const firstClass = classes[0]?.students.map((student) => student.name) ?? [];
    if (firstClass.length > 0) setLocalOverrides(firstClass);
    const loaded = Math.max(count, attendanceCount);
    setRosterToast(loaded > 0 ? `Loaded ${loaded} Ministar classes with attendance checklists` : "No Ministar classes found");
    sound.playClick();
  };

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4 py-2">
      {/* Header */}
      <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white px-5 py-4 text-slate-950 shadow-xl shadow-sky-950/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📋</span>
          <div>
            <h2 className="text-xl font-black text-slate-950">Enter Names</h2>
            <p className="text-xs font-bold text-slate-600">
              Manage your class list — shared with all Name Picker tools
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-sky-800">{names.length}</p>
          <p className="text-xs font-bold text-slate-600">students</p>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-3 shadow-lg shadow-emerald-950/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-black text-emerald-950">
              <BookOpenCheck className="h-4 w-4 text-emerald-700" />
              Weekly class loader
            </p>
            <p className="text-xs font-semibold text-emerald-900">
              Load your Ministar weekly classes into the class picker list.
            </p>
          </div>
          <Button
            onClick={loadMinistarRosters}
            className="bg-emerald-700 font-black text-white shadow-md shadow-emerald-950/15 hover:bg-emerald-800"
          >
            <BookOpenCheck className="mr-1 h-4 w-4" />
            Load Ministar Classes
          </Button>
        </div>
        {rosterToast && (
          <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-emerald-900">
            {rosterToast}
          </p>
        )}
      </div>

      {/* Roster manager (save/load classes) */}
      <RosterManager
        localStudents={names}
        onStudentsChange={(s) => setNames(s)}
      />

      {/* Quick add */}
      <div className="w-full flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addName()}
          placeholder="Type a name and press Enter..."
          className="border-sky-200 bg-white text-slate-950 placeholder:text-slate-500"
        />
        <Button onClick={addName} className="shrink-0 bg-sky-700 text-white hover:bg-sky-800">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Bulk + export buttons */}
      <div className="w-full flex gap-2 flex-wrap">
        <Button
          onClick={() => setShowBulk(!showBulk)}
          variant="outline"
          size="sm"
          className="border-slate-300 bg-white font-black text-slate-900 hover:bg-sky-50"
        >
          <UserPlus className="mr-1 h-4 w-4" />
          Bulk Add
        </Button>
        <Button
          onClick={exportNames}
          variant="outline"
          size="sm"
          className="border-slate-300 bg-white font-black text-slate-900 hover:bg-sky-50"
        >
          <Download className="mr-1 h-4 w-4" />
          Copy All
        </Button>
        {names.length > 0 && (
          <Button
            onClick={clearAll}
            variant="outline"
            size="sm"
            className="border-red-200 bg-white font-black text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Bulk add panel */}
      {showBulk && (
        <div className="w-full rounded-2xl border border-sky-200 bg-white p-4 shadow-lg shadow-sky-950/10">
          <p className="mb-2 text-xs font-black text-slate-700">Paste names (one per line):</p>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Alice\nBob\nCharlie"}
            className="mb-2 min-h-[100px] border-sky-200 bg-white text-slate-950 placeholder:text-slate-500"
          />
          <Button onClick={handleBulkAdd} size="sm" className="bg-sky-700 font-black text-white hover:bg-sky-800">
            Add All
          </Button>
        </div>
      )}

      {/* Names list */}
      <div className="w-full">
        {names.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto mb-4 h-16 w-16 text-sky-200" />
            <p className="mb-2 text-lg font-black text-slate-700">
              No names yet!
            </p>
            <p className="text-sm font-semibold text-slate-500">
              Add names above — they'll be shared with the Name Picker, Group Generator, and Order Shuffler
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {names.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white p-2.5 shadow-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-700 text-xs font-black text-white">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none"
                />
                <button
                  onClick={() => removeName(i)}
                  className="shrink-0 text-slate-400 transition-colors hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

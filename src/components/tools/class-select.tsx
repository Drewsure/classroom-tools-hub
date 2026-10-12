"use client";

import { useEffect } from "react";
import { useAttendance } from "@/hooks/use-attendance";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { Users, Save } from "lucide-react";

/* Compact class selector for the randomizer tools.
   Source of truth: the Attendance registry. Selecting a class here
   makes it the active class everywhere (header count, other tools).
   The save button turns the current pool into a named custom list. */

export function ClassSelect({
  onPick,
  currentNames,
}: {
  onPick: (students: string[]) => void;
  currentNames?: string[];
}) {
  const att = useAttendance();
  const roster = useStudentRoster();
  const activeId = att.activeClass?.id ?? "";

  useEffect(() => {
    const cls = att.activeClass;
    if (!cls) return;
    const names = cls.students.map((s) => s.name);
    const match = roster.allRosters.find((r) => r.name === cls.name);
    if (match) {
      const sameNames =
        match.students.length === names.length &&
        match.students.every((student, index) => student === names[index]);
      if (roster.activeRoster?.id !== match.id) roster.loadRoster(match.id);
      if (!sameNames) roster.setStudents(names);
    } else {
      roster.saveAsNew(cls.name, names);
    }
  }, [activeId]);

  const handleChange = (value: string) => {
    if (value === "__new__") {
      onPick([]);
      return;
    }
    const cls = att.classes.find((c) => c.id === value);
    if (!cls) return;
    att.selectClass(value);
    const names = cls.students.map((s) => s.name);
    // keep the shared roster in step (one-directional: registry -> roster)
    const match = roster.allRosters.find((r) => r.name === cls.name);
    if (match) {
      roster.loadRoster(match.id);
      roster.setStudents(names);
    } else {
      roster.saveAsNew(cls.name, names);
    }
    onPick(names);
  };

  const saveCurrent = () => {
    if (!currentNames || currentNames.filter(Boolean).length === 0) return;
    const name = window.prompt("Save this list as...", "My list");
    if (!name) return;
    att.saveCustomList(name, currentNames);
  };

  return (
    <div className="classroom-control-panel flex w-full max-w-2xl items-center gap-2 rounded-2xl p-2">
      <span className="classroom-muted-label flex shrink-0 items-center gap-1 text-xs uppercase tracking-wider">
        <Users className="h-3.5 w-3.5" /> Class
      </span>
      <select
        value={activeId}
        onChange={(e) => handleChange(e.target.value)}
        className="classroom-input flex-1 rounded-xl px-3 py-2 text-sm font-black"
        title="Classes come from the Attendance registry"
      >
        <option value="" className="bg-slate-900">- select a class -</option>
        {att.classes.map((c) => (
          <option key={c.id} value={c.id} className="bg-slate-900">
            {c.name} ({c.students.length})
          </option>
        ))}
        <option value="__new__" className="bg-slate-900">+ New / custom list...</option>
      </select>
      {currentNames && currentNames.filter(Boolean).length > 0 && (
        <button
          onClick={saveCurrent}
          className="shrink-0 rounded-xl border border-emerald-500 bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-900 transition-all hover:bg-emerald-200 active:scale-95"
          title="Save the current list - it will appear in every Class dropdown"
        >
          <Save className="h-3.5 w-3.5 inline mr-1" />Save list
        </button>
      )}
    </div>
  );
}

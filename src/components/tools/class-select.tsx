"use client";

import { useAttendance } from "@/hooks/use-attendance";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { Users } from "lucide-react";

/* Compact class selector for the randomizer tools.
   Source of truth: the Attendance registry. Selecting a class here
   makes it the active class everywhere (header count, other tools). */

export function ClassSelect({ onPick }: { onPick: (students: string[]) => void }) {
  const att = useAttendance();
  const roster = useStudentRoster();
  const activeId = att.activeClass?.id ?? "";

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

  return (
    <div className="w-full max-w-2xl flex items-center gap-2">
      <span className="text-xs font-bold text-white/60 uppercase tracking-wider shrink-0 flex items-center gap-1">
        <Users className="h-3.5 w-3.5" /> Class
      </span>
      <select
        value={activeId}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold px-3 py-2"
        title="Classes come from the Attendance registry"
      >
        <option value="" className="bg-slate-900">— select a class —</option>
        {att.classes.map((c) => (
          <option key={c.id} value={c.id} className="bg-slate-900">
            {c.name} ({c.students.length})
          </option>
        ))}
        <option value="__new__" className="bg-slate-900">＋ New / custom list…</option>
      </select>
    </div>
  );
}
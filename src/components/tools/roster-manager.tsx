"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { Check, FolderOpen, Save, Trash2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RosterManagerProps {
  /** The tool's local student list — used when saving so we capture the latest edits */
  localStudents: string[];
  /** Called when the active roster's students change (so the tool can sync its local state) */
  onStudentsChange?: (students: string[]) => void;
}

export function RosterManager({ localStudents, onStudentsChange }: RosterManagerProps) {
  const {
    activeRoster,
    activeClassName,
    allRosters,
    saveAsNew,
    loadRoster,
    deleteRoster,
    renameActive,
  } = useStudentRoster();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [newRosterName, setNewRosterName] = useState("");
  const [renameMode, setRenameMode] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const handleSave = () => {
    const name = newRosterName.trim() || `Class ${allRosters.length + 1}`;
    saveAsNew(name, localStudents);
    setNewRosterName("");
    setShowSaveDialog(false);
    onStudentsChange?.(localStudents);
  };

  const handleLoad = (id: string) => {
    const students = loadRoster(id);
    onStudentsChange?.(students);
    setShowLoadDialog(false);
  };

  const handleDelete = (id: string) => {
    deleteRoster(id);
    if (allRosters.filter((r) => r.id !== id).length === 0) onStudentsChange?.([]);
  };

  const handleRenameSave = () => {
    renameActive(renameValue);
    setRenameMode(false);
  };

  return (
    <div className="w-full rounded-2xl border border-sky-200 bg-white p-3 text-slate-950 shadow-xl shadow-sky-950/10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-800">
            <Users className="h-5 w-5" />
          </span>
          {renameMode ? (
            <div className="flex min-w-0 items-center gap-1">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
                className="h-9 w-44 border-sky-300 bg-white text-sm font-bold text-slate-950"
                autoFocus
              />
              <button
                onClick={handleRenameSave}
                className="rounded-lg bg-emerald-100 p-2 text-emerald-800 hover:bg-emerald-200"
                aria-label="Save class name"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setRenameMode(false)}
                className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                aria-label="Cancel rename"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-base font-black">
                  {activeClassName ?? activeRoster?.name ?? "Unsaved List"}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
                  {localStudents.length} students
                </span>
              </div>
              {!activeClassName && activeRoster && (
                <button
                  onClick={() => {
                    setRenameMode(true);
                    setRenameValue(activeRoster.name);
                  }}
                  className="mt-1 rounded-full bg-sky-50 px-2 py-1 text-xs font-black text-sky-800 underline hover:bg-sky-100"
                >
                  Rename class
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            variant="outline"
            size="sm"
            className="border-slate-300 bg-white font-black text-slate-900 hover:bg-sky-50"
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            Save Class
          </Button>
          <Button
            onClick={() => setShowLoadDialog(!showLoadDialog)}
            size="sm"
            className="bg-sky-700 font-black text-white shadow-md shadow-sky-950/15 hover:bg-sky-800"
          >
            <FolderOpen className="mr-1 h-3.5 w-3.5" />
            Load Class
            {allRosters.length > 0 && (
              <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-xs text-sky-900">
                {allRosters.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {showSaveDialog && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-amber-900">
            Save current list as a new class
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={newRosterName}
              onChange={(e) => setNewRosterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder='e.g. "Class 5A", "Period 2"'
              className="min-w-48 flex-1 border-amber-300 bg-white text-slate-950 placeholder:text-slate-500"
              autoFocus
            />
            <Button onClick={handleSave} size="sm" className="shrink-0 bg-emerald-600 font-black text-white hover:bg-emerald-700">
              <Save className="mr-1 h-4 w-4" />
              Save
            </Button>
            <Button
              onClick={() => setShowSaveDialog(false)}
              size="sm"
              variant="outline"
              className="shrink-0 border-slate-300 bg-white font-black text-slate-900 hover:bg-slate-100"
            >
              Cancel
            </Button>
          </div>
          <p className="mt-2 text-xs font-semibold text-amber-950">
            Saved classes are shared with Random Name Picker and Group Generator.
          </p>
        </div>
      )}

      {showLoadDialog && (
        <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-sky-950">
            {allRosters.length > 0
              ? "Select a saved class to load"
              : "No saved classes yet. Use the Ministar loader or save your current list first."}
          </p>
          {allRosters.length > 0 && (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {allRosters.map((roster) => (
                <div
                  key={roster.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border p-3 transition-colors",
                    roster.id === activeRoster?.id
                      ? "border-emerald-300 bg-emerald-100"
                      : "border-slate-200 bg-white hover:bg-sky-100",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-black text-slate-950">
                        {roster.name}
                      </span>
                      {roster.id === activeRoster?.id && (
                        <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-xs font-black text-white">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {roster.students.length} students
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {roster.id !== activeRoster?.id && (
                      <Button
                        onClick={() => handleLoad(roster.id)}
                        size="sm"
                        className="h-8 bg-sky-700 text-xs font-black text-white hover:bg-sky-800"
                      >
                        Load
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(roster.id)}
                      className="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700"
                      aria-label="Delete roster"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={() => setShowLoadDialog(false)}
            size="sm"
            variant="outline"
            className="mt-3 border-slate-300 bg-white font-black text-slate-900 hover:bg-slate-100"
          >
            Close
          </Button>
        </div>
      )}

      {activeRoster && (
        <p className="pt-1 text-center text-xs font-bold text-slate-600">
          Shared with Random Name Picker and Group Generator
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { Save, FolderOpen, Trash2, Check, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface RosterManagerProps {
  /** The tool's local student list — used when saving so we capture the latest edits */
  localStudents: string[];
  /** Called when the active roster's students change (so the tool can sync its local state) */
  onStudentsChange?: (students: string[]) => void;
}

/**
 * Shared roster manager — appears in both the Name Picker and Group Generator.
 * Lets teachers:
 * - See which roster is currently active
 * - Save current names as a new named class
 * - Switch between saved classes (instantly loads in both tools)
 * - Delete saved classes
 * - Rename the active class
 */
export function RosterManager({ localStudents, onStudentsChange }: RosterManagerProps) {
  const {
    students,
    activeRoster,
    allRosters,
    setStudents,
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
    // Save the LOCAL students (latest edits) to a new roster
    saveAsNew(name, localStudents);
    setNewRosterName("");
    setShowSaveDialog(false);
    onStudentsChange?.(localStudents);
  };

  const handleLoad = (id: string) => {
    loadRoster(id);
    const loaded = allRosters.find((r) => r.id === id);
    if (loaded) {
      onStudentsChange?.(loaded.students);
    }
    setShowLoadDialog(false);
  };

  const handleDelete = (id: string) => {
    deleteRoster(id);
    // After delete, notify with the new active roster's students
    const remaining = allRosters.filter((r) => r.id !== id);
    if (remaining.length > 0) {
      // The hook will auto-switch to the first remaining; we'll be notified via event
    } else {
      onStudentsChange?.([]);
    }
  };

  const handleRenameSave = () => {
    renameActive(renameValue);
    setRenameMode(false);
  };

  return (
    <div className="w-full">
      {/* Active roster indicator + actions */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 text-white">
          <Users className="h-4 w-4 text-white/60" />
          {renameMode ? (
            <div className="flex items-center gap-1">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
                className="h-7 w-40 bg-white/10 border-white/20 text-white text-sm"
                autoFocus
              />
              <button
                onClick={handleRenameSave}
                className="p-1 text-emerald-400 hover:bg-white/10 rounded"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setRenameMode(false)}
                className="p-1 text-white/50 hover:bg-white/10 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm font-bold">
                {activeRoster?.name ?? "Unsaved List"}
              </span>
              <span className="text-xs text-white/50">
                ({localStudents.length} students)
              </span>
              {activeRoster && (
                <button
                  onClick={() => {
                    setRenameMode(true);
                    setRenameValue(activeRoster.name);
                  }}
                  className="text-white/40 hover:text-white text-xs underline"
                >
                  rename
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            Save Class
          </Button>
          <Button
            onClick={() => setShowLoadDialog(!showLoadDialog)}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <FolderOpen className="mr-1 h-3.5 w-3.5" />
            Load Class
            {allRosters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                {allRosters.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="mb-3 p-4 rounded-2xl bg-black/30 border border-white/10">
          <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">
            Save current list as a new class
          </p>
          <div className="flex gap-2">
            <Input
              value={newRosterName}
              onChange={(e) => setNewRosterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder='e.g. "Class 5A", "Period 2"'
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              autoFocus
            />
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
            >
              <Save className="mr-1 h-4 w-4" />
              Save
            </Button>
            <Button
              onClick={() => setShowSaveDialog(false)}
              size="sm"
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white shrink-0"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-white/40 mt-2">
            Saving creates a new class roster. The saved list will be available
            in both the Name Picker and Group Generator.
          </p>
        </div>
      )}

      {/* Load dialog */}
      {showLoadDialog && (
        <div className="mb-3 p-4 rounded-2xl bg-black/30 border border-white/10">
          <p className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider">
            {allRosters.length > 0
              ? "Select a saved class to load"
              : "No saved classes yet — save your current list first!"}
          </p>
          {allRosters.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allRosters.map((roster) => (
                <div
                  key={roster.id}
                  className={cn(
                    "flex items-center justify-between gap-2 p-3 rounded-xl border transition-colors",
                    roster.id === activeRoster?.id
                      ? "bg-emerald-500/20 border-emerald-400/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">
                        {roster.name}
                      </span>
                      {roster.id === activeRoster?.id && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/50">
                      {roster.students.length} students
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {roster.id !== activeRoster?.id && (
                      <Button
                        onClick={() => handleLoad(roster.id)}
                        size="sm"
                        className="bg-white text-slate-900 hover:bg-white/90 h-7 text-xs"
                      >
                        Load
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(roster.id)}
                      className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
            className="mt-3 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
          >
            Close
          </Button>
        </div>
      )}

      {/* Sync indicator */}
      {activeRoster && (
        <p className="text-xs text-white/40 text-center">
          🔄 Shared with Random Name Picker & Group Generator
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStudentRoster } from "@/hooks/use-student-roster";
import { useDramaticSound } from "@/hooks/use-effects";
import { RosterManager } from "./roster-manager";
import { UserPlus, Plus, Trash2, Users, Upload, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function EnterNames() {
  const sound = useDramaticSound();
  const { students, setStudents, saveAsNew, allRosters, loadRoster, activeRoster } = useStudentRoster();

  const [newName, setNewName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  // Sync from shared roster — just use students directly
  // The hook re-renders when the store changes, so we can derive names from it
  const [localOverrides, setLocalOverrides] = useState<string[] | null>(null);
  const names = localOverrides ?? students;
  const setNames = (newNames: string[]) => {
    setLocalOverrides(newNames);
    setStudents(newNames);
  };

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

  return (
    <div className="flex flex-col items-center gap-6 py-2 w-full max-w-2xl">
      {/* Header */}
      <div className="w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📋</span>
          <div>
            <h2 className="text-xl font-bold text-white">Enter Names</h2>
            <p className="text-xs text-white/60">
              Manage your class list — shared with all Name Picker tools
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-white">{names.length}</p>
          <p className="text-xs text-white/60">students</p>
        </div>
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
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
        <Button onClick={addName} className="bg-purple-500 hover:bg-purple-600 text-white shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Bulk + export buttons */}
      <div className="w-full flex gap-2 flex-wrap">
        <Button
          onClick={() => setShowBulk(!showBulk)}
          variant="outline"
          size="sm"
          className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
        >
          <UserPlus className="mr-1 h-4 w-4" />
          Bulk Add
        </Button>
        <Button
          onClick={exportNames}
          variant="outline"
          size="sm"
          className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
        >
          <Download className="mr-1 h-4 w-4" />
          Copy All
        </Button>
        {names.length > 0 && (
          <Button
            onClick={clearAll}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/25 hover:bg-red-500/30 hover:text-white"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Bulk add panel */}
      {showBulk && (
        <div className="w-full p-4 rounded-2xl bg-black/30 border border-white/10">
          <p className="text-xs text-white/60 mb-2">Paste names (one per line):</p>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Alice\nBob\nCharlie"}
            className="bg-white/10 border-white/20 text-white min-h-[100px] mb-2"
          />
          <Button onClick={handleBulkAdd} size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
            Add All
          </Button>
        </div>
      )}

      {/* Names list */}
      <div className="w-full">
        {names.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg font-semibold mb-2">
              No names yet!
            </p>
            <p className="text-white/40 text-sm">
              Add names above — they'll be shared with the Name Picker, Group Generator, and Order Shuffler
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {names.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 p-2.5"
              >
                <span className="w-6 h-6 rounded-full bg-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none min-w-0"
                />
                <button
                  onClick={() => removeName(i)}
                  className="text-white/40 hover:text-red-400 transition-colors shrink-0"
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

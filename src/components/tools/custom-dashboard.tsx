"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDramaticSound } from "@/hooks/use-effects";
import { useTimer, useStopwatch } from "@/hooks/use-timer";
import { formatTime, formatStopwatchTime } from "@/lib/timers";
import { SOUNDS } from "@/hooks/use-sound-pad";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Minus, RotateCcw, Trash2, X, Clock, Hash, Dices,
  Play, Pause, Volume2, Save, FolderOpen, Volume1, GripVertical, Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RandomNamePicker } from "./random-name-picker";
import { RandomGroupGenerator } from "./random-group-generator";
import { StudentOrderShuffler } from "./student-order-shuffler";
import { MathFactGenerator } from "./math-fact-generator";
import { LetterCardGenerator } from "./letter-card-generator";
import { TallyCounter } from "./tally-counter";
import { StopwatchSplits } from "./stopwatch-splits";
import { CustomDice } from "./custom-dice";
import { SpinnerWheel } from "./spinner-wheel";
import { ChanceGames } from "./chance-games";
import { ClassicTimer } from "@/components/timers/classic-timer";
import { Stopwatch } from "@/components/timers/stopwatch";
import { RocketTimer } from "@/components/timers/rocket-timer";
import { BombTimer } from "@/components/timers/bomb-timer";
import { CandleTimer } from "@/components/timers/candle-timer";
import { HourglassTimer } from "@/components/timers/hourglass-timer";
import { CircleTimer } from "@/components/timers/circle-timer";
import { SnailRaceTimer } from "@/components/timers/snail-race-timer";
import { TrafficLightTimer } from "@/components/timers/traffic-light-timer";
import { BarTimer } from "@/components/timers/bar-timer";
import { ToolLauncher } from "./tool-launcher";
import { TOOLS, type ToolDef } from "@/lib/tools";

/* ============================================================
   WIDGET TYPES
   ============================================================ */
type WidgetType =
  // Timers
  | "classicTimer" | "stopwatch" | "rocketTimer" | "bombTimer" | "candleTimer"
  | "hourglassTimer" | "circleTimer" | "snailRaceTimer" | "trafficLightTimer" | "barTimer"
  // Counters
  | "counter" | "tallyCounter" | "stopwatchSplits"
  // Games
  | "dice" | "coinFlip" | "colorWheel" | "magicBall"
  // Pickers
  | "namePicker" | "groupGenerator" | "orderShuffler"
  // Learning
  | "mathFacts" | "letterCard" | "letterGenerator"
  // Sound
  | "soundButton";

interface Widget {
  id: number;
  type: WidgetType;
  title: string;
  counterValue?: number;
  counterLabel?: string;
  timerMinutes?: number;
  diceValue?: number;
  diceRange?: "all" | "low" | "high";
  soundId?: string;
  soundVolume?: number;
  letterValue?: string;
  letterCase?: "upper" | "lower" | "mixed" | "random";
  coinFace?: "heads" | "tails";
  wheelRotation?: number;
  ballResponse?: string | null;
}

let widgetIdCounter = 2000;

/** Always returns a fresh, unique widget ID — bumps the counter past any hardcoded initial IDs */
function nextWidgetId() {
  return ++widgetIdCounter;
}

/** Maps a dashboard widget type to the corresponding tool ID in TOOLS — used for the "Expand" button */
const WIDGET_TO_TOOL_ID: Partial<Record<WidgetType, string>> = {
  classicTimer: "classic",
  stopwatch: "stopwatch",
  rocketTimer: "rocket",
  bombTimer: "bomb",
  candleTimer: "candle",
  hourglassTimer: "hourglass",
  circleTimer: "circle",
  snailRaceTimer: "snail-race",
  trafficLightTimer: "traffic-light",
  barTimer: "bar",
  counter: "tally-counter",
  tallyCounter: "tally-counter",
  stopwatchSplits: "stopwatch-splits",
  dice: "custom-dice",
  coinFlip: "chance-games",
  colorWheel: "spinner-wheel",
  magicBall: "chance-games",
  namePicker: "name-picker",
  groupGenerator: "group-generator",
  orderShuffler: "student-shuffler",
  mathFacts: "math-facts",
  letterCard: "letter-cards",
  letterGenerator: "letter-cards",
  // soundButton has no full-tool equivalent
};

function findToolDef(toolId: string): ToolDef | undefined {
  return TOOLS.find((t) => t.id === toolId);
}

const DASHBOARD_KEY = "classroom-tools-dashboards";
function readDashboards(): Record<string, Widget[]> {
  if (typeof window === "undefined") return {};
  try { const raw = window.localStorage.getItem(DASHBOARD_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function writeDashboards(d: Record<string, Widget[]>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(DASHBOARD_KEY, JSON.stringify(d)); } catch {}
}

/* ============================================================
   WIDGET CATALOG
   ============================================================ */
interface WidgetDef { type: WidgetType; label: string; emoji: string; color: string; category: string; create: () => Widget; }

const WIDGET_CATALOG: WidgetDef[] = [
  // Timers
  { type: "classicTimer", label: "Classic Timer", emoji: "⏰", color: "bg-slate-600 hover:bg-slate-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "classicTimer", title: "Classic", timerMinutes: 5 }) },
  { type: "stopwatch", label: "Stopwatch", emoji: "⏱️", color: "bg-cyan-600 hover:bg-cyan-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "stopwatch", title: "Stopwatch" }) },
  { type: "rocketTimer", label: "Rocket Launch", emoji: "🚀", color: "bg-purple-600 hover:bg-purple-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "rocketTimer", title: "Rocket", timerMinutes: 3 }) },
  { type: "bombTimer", label: "Bomb Fuse", emoji: "🧨", color: "bg-orange-600 hover:bg-orange-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "bombTimer", title: "Bomb", timerMinutes: 3 }) },
  { type: "candleTimer", label: "Burning Candle", emoji: "🕯️", color: "bg-amber-600 hover:bg-amber-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "candleTimer", title: "Candle", timerMinutes: 5 }) },
  { type: "hourglassTimer", label: "Hourglass", emoji: "⌛", color: "bg-yellow-600 hover:bg-yellow-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "hourglassTimer", title: "Hourglass", timerMinutes: 3 }) },
  { type: "circleTimer", label: "Radial Progress", emoji: "🔵", color: "bg-teal-600 hover:bg-teal-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "circleTimer", title: "Circle", timerMinutes: 5 }) },
  { type: "snailRaceTimer", label: "Snail Race", emoji: "🐌", color: "bg-green-600 hover:bg-green-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "snailRaceTimer", title: "Snail Race", timerMinutes: 3 }) },
  { type: "trafficLightTimer", label: "Traffic Light", emoji: "🚦", color: "bg-zinc-600 hover:bg-zinc-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "trafficLightTimer", title: "Traffic Light", timerMinutes: 5 }) },
  { type: "barTimer", label: "Progress Bar", emoji: "📊", color: "bg-rose-600 hover:bg-rose-700", category: "Classroom Timers", create: () => ({ id: nextWidgetId(), type: "barTimer", title: "Bar Timer", timerMinutes: 5 }) },
  // Counters
  { type: "counter", label: "Counter", emoji: "🔢", color: "bg-purple-500 hover:bg-purple-600", category: "Counters", create: () => ({ id: nextWidgetId(), type: "counter", title: "Counter", counterValue: 0, counterLabel: "Team" }) },
  { type: "tallyCounter", label: "Tally Counter", emoji: "🔢", color: "bg-teal-500 hover:bg-teal-600", category: "Counters", create: () => ({ id: nextWidgetId(), type: "tallyCounter", title: "Tally", counterValue: 0, counterLabel: "Score" }) },
  { type: "stopwatchSplits", label: "Stopwatch + Splits", emoji: "⏱️", color: "bg-indigo-500 hover:bg-indigo-600", category: "Counters", create: () => ({ id: nextWidgetId(), type: "stopwatchSplits", title: "Splits" }) },
  // Games
  { type: "dice", label: "Dice Roll", emoji: "🎲", color: "bg-red-500 hover:bg-red-600", category: "Games", create: () => ({ id: nextWidgetId(), type: "dice", title: "Dice", diceValue: 1, diceRange: "all" }) },
  { type: "coinFlip", label: "Coin Flip", emoji: "🪙", color: "bg-amber-500 hover:bg-amber-600", category: "Games", create: () => ({ id: nextWidgetId(), type: "coinFlip", title: "Coin", coinFace: "heads" }) },
  { type: "colorWheel", label: "Colour Wheel", emoji: "🎨", color: "bg-purple-500 hover:bg-purple-600", category: "Games", create: () => ({ id: nextWidgetId(), type: "colorWheel", title: "Wheel", wheelRotation: 0 }) },
  { type: "magicBall", label: "Magic 8-Ball", emoji: "🔮", color: "bg-slate-700 hover:bg-slate-800", category: "Games", create: () => ({ id: nextWidgetId(), type: "magicBall", title: "8-Ball", ballResponse: null }) },
  // Pickers
  { type: "namePicker", label: "Name Picker", emoji: "🎯", color: "bg-violet-500 hover:bg-violet-600", category: "Pickers", create: () => ({ id: nextWidgetId(), type: "namePicker", title: "Names" }) },
  { type: "groupGenerator", label: "Group Generator", emoji: "👥", color: "bg-indigo-500 hover:bg-indigo-600", category: "Pickers", create: () => ({ id: nextWidgetId(), type: "groupGenerator", title: "Groups" }) },
  { type: "orderShuffler", label: "Order Shuffler", emoji: "🔀", color: "bg-purple-500 hover:bg-purple-600", category: "Pickers", create: () => ({ id: nextWidgetId(), type: "orderShuffler", title: "Shuffle" }) },
  // Learning
  { type: "mathFacts", label: "Math Facts", emoji: "🧮", color: "bg-blue-500 hover:bg-blue-600", category: "Learning", create: () => ({ id: nextWidgetId(), type: "mathFacts", title: "Math" }) },
  { type: "letterCard", label: "Letter Card", emoji: "🔤", color: "bg-blue-500 hover:bg-indigo-600", category: "Learning", create: () => ({ id: nextWidgetId(), type: "letterCard", title: "Letter", letterValue: "A", letterCase: "upper" }) },
  { type: "letterGenerator", label: "Letter Generator", emoji: "🔤", color: "bg-indigo-500 hover:bg-purple-600", category: "Learning", create: () => ({ id: nextWidgetId(), type: "letterGenerator", title: "Letters", letterCase: "upper" }) },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export function CustomDashboard() {
  const sound = useDramaticSound();
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 3001, type: "classicTimer", title: "Activity Timer", timerMinutes: 5 },
    { id: 3002, type: "counter", title: "Team A", counterValue: 0, counterLabel: "Team A" },
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savedDashboards, setSavedDashboards] = useState<Record<string, Widget[]>>(() => readDashboards());
  // Expanded tool overlay — when set, the corresponding full tool opens in a ToolLauncher
  const [expandedTool, setExpandedTool] = useState<ToolDef | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((w) => String(w.id) === active.id);
        const newIndex = items.findIndex((w) => String(w.id) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      sound.playClick();
    }
  }, [sound]);

  const addWidget = (def: WidgetDef) => {
    setWidgets((prev) => [...prev, def.create()]);
    setShowAddMenu(false);
    sound.playClick();
  };

  const addSoundWidget = (s: typeof SOUNDS[0]) => {
    setWidgets((prev) => [...prev, { id: nextWidgetId(), type: "soundButton" as WidgetType, title: s.label, soundId: s.id, soundVolume: 0.7 }]);
    setShowAddMenu(false);
    sound.playClick();
  };

  const removeWidget = (id: number) => { setWidgets((prev) => prev.filter((w) => w.id !== id)); sound.playClick(); };
  const updateWidget = (id: number, updates: Partial<Widget>) => { setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w))); };

  // Open the corresponding full tool in a launcher overlay
  const expandWidget = useCallback((widgetType: WidgetType) => {
    const toolId = WIDGET_TO_TOOL_ID[widgetType];
    if (!toolId) return;
    const def = findToolDef(toolId);
    if (def) {
      setExpandedTool(def);
      sound.playClick();
    }
  }, [sound]);

  const handleSave = () => {
    const name = saveName.trim() || `Dashboard ${Object.keys(savedDashboards).length + 1}`;
    const updated = { ...savedDashboards, [name]: widgets };
    writeDashboards(updated); setSavedDashboards(updated); setSaveName(""); setShowSaveDialog(false); sound.playClick();
  };
  const handleLoad = (name: string) => {
    const dash = savedDashboards[name];
    if (dash) { const reset = dash.map((w) => ({ ...w, id: nextWidgetId() })); setWidgets(reset); setShowLoadDialog(false); sound.playClick(); }
  };
  const handleDelete = (name: string) => { const u = { ...savedDashboards }; delete u[name]; writeDashboards(u); setSavedDashboards(u); sound.playClick(); };

  const catalogByCategory = WIDGET_CATALOG.reduce((acc, def) => { if (!acc[def.category]) acc[def.category] = []; acc[def.category].push(def); return acc; }, {} as Record<string, WidgetDef[]>);

  return (
    <div className="flex flex-col items-center gap-4 py-2 w-full">
      {/* Top bar */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3 px-4 py-3 rounded-2xl glass-dark flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="text-lg font-bold text-white">Custom Dashboard</h2>
            <p className="text-xs text-white/50">{widgets.length} widgets · Drag to rearrange</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowAddMenu(!showAddMenu)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white"><Plus className="mr-1 h-4 w-4" /> Add Widget</Button>
          <Button onClick={() => setShowSaveDialog(!showSaveDialog)} size="sm" variant="outline" className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"><Save className="mr-1 h-3.5 w-3.5" /> Save</Button>
          <Button onClick={() => { setShowLoadDialog(!showLoadDialog); setSavedDashboards(readDashboards()); }} size="sm" variant="outline" className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"><FolderOpen className="mr-1 h-3.5 w-3.5" /> Load{Object.keys(savedDashboards).length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{Object.keys(savedDashboards).length}</span>}</Button>
        </div>
      </div>

      {/* Add widget menu */}
      {showAddMenu && (
        <div className="w-full max-w-5xl p-4 rounded-2xl glass max-h-[400px] overflow-y-auto">
          {Object.entries(catalogByCategory).map(([category, defs]) => (
            <div key={category} className="mb-3">
              <p className="text-xs text-white/60 mb-1.5 font-semibold uppercase tracking-wider">{category}:</p>
              <div className="flex flex-wrap gap-1.5">
                {defs.map((def) => (
                  <button key={def.type} onClick={() => addWidget(def)} className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white border border-white/15 hover:scale-105 transition-all", def.color)}>
                    <span className="text-base">{def.emoji}</span>{def.label}<Plus className="h-3 w-3 ml-0.5" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-white/60 mb-1.5 font-semibold uppercase tracking-wider">Individual Sounds:</p>
          <div className="flex flex-wrap gap-1.5">
            {SOUNDS.map((s) => (
              <button key={s.id} onClick={() => addSoundWidget(s)} className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-br border border-white/15 hover:scale-105 transition-all", s.color)}>
                <span className="text-base">{s.emoji}</span>{s.label}<Plus className="h-3 w-3 ml-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="w-full max-w-md p-4 rounded-2xl glass">
          <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Save dashboard as:</p>
          <div className="flex gap-2">
            <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} placeholder='e.g. "Math Class"' className="bg-white/10 border-white/20 text-white placeholder:text-white/40" autoFocus />
            <Button onClick={handleSave} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"><Save className="h-4 w-4" /></Button>
            <Button onClick={() => setShowSaveDialog(false)} size="sm" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white shrink-0">Cancel</Button>
          </div>
        </div>
      )}

      {/* Load dialog */}
      {showLoadDialog && (
        <div className="w-full max-w-md p-4 rounded-2xl glass">
          <p className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider">{Object.keys(savedDashboards).length > 0 ? "Select a saved dashboard:" : "No saved dashboards yet!"}</p>
          {Object.keys(savedDashboards).length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(savedDashboards).map(([name, dw]) => (
                <div key={name} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                  <div><span className="font-bold text-white text-sm">{name}</span><span className="text-xs text-white/50 ml-2">{dw.length} widgets</span></div>
                  <div className="flex gap-1"><Button onClick={() => handleLoad(name)} size="sm" className="bg-white text-slate-900 hover:bg-white/90 h-7 text-xs">Load</Button><button onClick={() => handleDelete(name)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="h-3.5 w-3.5" /></button></div>
                </div>
              ))}
            </div>
          )}
          <Button onClick={() => setShowLoadDialog(false)} size="sm" variant="outline" className="mt-3 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white">Close</Button>
        </div>
      )}

      {/* Drag-and-drop widget grid */}
      {widgets.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3 opacity-20">📊</div>
          <p className="text-white/50 text-base font-semibold mb-1">Your dashboard is empty!</p>
          <p className="text-white/40 text-sm">Click "Add Widget" to add any of the 24 tools</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => String(w.id))} strategy={rectSortingStrategy}>
            <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {widgets.map((widget) => (
                <SortableWidgetCard
                  key={widget.id}
                  widget={widget}
                  onRemove={() => removeWidget(widget.id)}
                  onUpdate={(u) => updateWidget(widget.id, u)}
                  onExpand={() => expandWidget(widget.type)}
                />
              ))}
              {/* Add tile */}
              <button onClick={() => setShowAddMenu(true)} className="rounded-2xl border-2 border-dashed border-white/25 hover:border-white/50 hover:bg-white/5 transition-all min-h-[120px] flex flex-col items-center justify-center gap-1.5 text-white/50 hover:text-white">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Plus className="h-5 w-5" /></div>
                <span className="text-xs font-bold uppercase tracking-wider">Add Widget</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Expanded tool overlay — opens the actual full tool in a launcher */}
      {expandedTool && (
        <ToolLauncher tool={expandedTool} onClose={() => setExpandedTool(null)} />
      )}
    </div>
  );
}

/* ============================================================
   SORTABLE WIDGET CARD — wraps widget with drag handle
   ============================================================ */
function SortableWidgetCard({ widget, onRemove, onUpdate, onExpand }: { widget: Widget; onRemove: () => void; onUpdate: (u: Partial<Widget>) => void; onExpand: () => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(widget.id) });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };
  // Show the expand button only if this widget type maps to a full tool
  const hasTool = !!WIDGET_TO_TOOL_ID[widget.type];
  return (
    <div ref={setNodeRef} style={style} className={cn("rounded-2xl glass-dark overflow-hidden flex flex-col", isDragging && "ring-2 ring-emerald-400 shadow-2xl")}>
      {/* Header with drag handle + expand + remove */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-black/30 border-b border-white/10 gap-1">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60 p-0.5 touch-none shrink-0" title="Drag to move">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <input type="text" value={widget.title} onChange={(e) => onUpdate({ title: e.target.value })} className="bg-transparent text-white text-xs font-bold outline-none flex-1 min-w-0 text-center" />
        {hasTool && (
          <button onClick={onExpand} className="text-white/40 hover:text-emerald-300 transition-colors p-1 shrink-0" title="Open full tool">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={onRemove} className="text-white/40 hover:text-red-400 transition-colors p-1 shrink-0"><X className="h-3.5 w-3.5" /></button>
      </div>
      {/* Content */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[420px]">
        <WidgetContent widget={widget} onUpdate={onUpdate} onExpand={onExpand} />
      </div>
    </div>
  );
}

/* ============================================================
   WIDGET CONTENT ROUTER
   ============================================================ */
function WidgetContent({ widget, onUpdate, onExpand }: { widget: Widget; onUpdate: (u: Partial<Widget>) => void; onExpand: () => void; }) {
  // All timer types — embed the actual full timer component
  switch (widget.type) {
    case "classicTimer": return <EmbeddedTool><ClassicTimer /></EmbeddedTool>;
    case "stopwatch": return <EmbeddedTool><Stopwatch /></EmbeddedTool>;
    case "rocketTimer": return <EmbeddedTool><RocketTimer /></EmbeddedTool>;
    case "bombTimer": return <EmbeddedTool><BombTimer /></EmbeddedTool>;
    case "candleTimer": return <EmbeddedTool><CandleTimer /></EmbeddedTool>;
    case "hourglassTimer": return <EmbeddedTool><HourglassTimer /></EmbeddedTool>;
    case "circleTimer": return <EmbeddedTool><CircleTimer /></EmbeddedTool>;
    case "snailRaceTimer": return <EmbeddedTool><SnailRaceTimer /></EmbeddedTool>;
    case "trafficLightTimer": return <EmbeddedTool><TrafficLightTimer /></EmbeddedTool>;
    case "barTimer": return <EmbeddedTool><BarTimer /></EmbeddedTool>;
    // Tools with full embedded components
    case "stopwatchSplits": return <EmbeddedTool><StopwatchSplits /></EmbeddedTool>;
    case "counter": case "tallyCounter": return <EmbeddedTool><TallyCounter /></EmbeddedTool>;
    case "dice": return <EmbeddedTool><CustomDice /></EmbeddedTool>;
    case "colorWheel": return <EmbeddedTool><SpinnerWheel /></EmbeddedTool>;
    case "coinFlip": case "magicBall": return <EmbeddedTool><ChanceGames /></EmbeddedTool>;
    case "namePicker": return <EmbeddedTool><RandomNamePicker /></EmbeddedTool>;
    case "groupGenerator": return <EmbeddedTool><RandomGroupGenerator /></EmbeddedTool>;
    case "orderShuffler": return <EmbeddedTool><StudentOrderShuffler /></EmbeddedTool>;
    case "mathFacts": return <EmbeddedTool><MathFactGenerator /></EmbeddedTool>;
    case "letterCard": case "letterGenerator": return <EmbeddedTool><LetterCardGenerator /></EmbeddedTool>;
    // Sound button widget — keep compact version (single sound trigger, no full-tool equivalent)
    case "soundButton": return <SoundButtonWidget widget={widget} onUpdate={onUpdate} />;
    default: return null;
  }
}

/* ===== Embedded tool wrapper — scales full tool to fit inside a widget card ===== */
function EmbeddedTool({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col items-center [&_img]:max-w-full [&_svg]:max-w-full">
      {children}
    </div>
  );
}

/* ===== Sound Button Widget ===== */
function SoundButtonWidget({ widget, onUpdate }: { widget: Widget; onUpdate: (u: Partial<Widget>) => void; }) {
  const sound = useDramaticSound();
  const [playing, setPlaying] = useState(false);
  const sd = SOUNDS.find((s) => s.id === widget.soundId) ?? SOUNDS[0];
  const vol = widget.soundVolume ?? 0.7;
  const play = () => { setPlaying(true); const a = new Audio(`/sounds/${sd.file}`); a.volume = vol; a.play().catch(() => sound.playClick()); a.addEventListener("ended", () => setPlaying(false)); setTimeout(() => setPlaying(false), 1500); };
  return <div className="flex flex-col items-center gap-2"><select value={widget.soundId ?? SOUNDS[0].id} onChange={(e) => onUpdate({ soundId: e.target.value })} className="bg-white/10 border border-white/20 text-white text-xs rounded px-2 py-1 w-full">{SOUNDS.map((s) => <option key={s.id} value={s.id} className="bg-slate-800">{s.emoji} {s.label}</option>)}</select><button onClick={play} className={cn("w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm shadow-lg transition-all", playing && "scale-95 ring-2 ring-white/60")} style={{ background: `linear-gradient(135deg, ${sd.color.replace("from-", "").replace(" to-", ", ")})` }}><span className="text-xl">{sd.emoji}</span>{sd.label}</button><div className="flex items-center gap-1.5 w-full"><Volume1 className="h-3 w-3 text-white/40 shrink-0" /><input type="range" min="0" max="100" value={Math.round(vol * 100)} onChange={(e) => onUpdate({ soundVolume: parseInt(e.target.value) / 100 })} className="flex-1 h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer" /><Volume2 className="h-3 w-3 text-white/40 shrink-0" /></div></div>;
}

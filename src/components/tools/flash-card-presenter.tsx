"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  useDramaticSound,
  useConfetti,
  useFlash,
  useScreenShake,
} from "@/hooks/use-effects";
import {
  ConfettiOverlay,
  FlashOverlay,
  ShakeWrapper,
} from "@/components/effects/effect-overlays";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import { PHONIC_CARDS } from "@/lib/phonic-cards";
import {
  Play,
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  Maximize,
  Minimize,
  Check,
  X,
  Layers,
  Save,
  FolderOpen,
  Trash2,
  Upload,
  CloudSun,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "shuffle" | "browse" | "select";

/* ============================================================
   CARD TYPE DEFINITIONS
   ============================================================ */

interface PresenterCard {
  id: string;          // unique id within group
  label: string;       // short label (e.g. "A/a", "Sunny")
  word?: string;       // anchor word (phonic) or weather name
  image: string;       // image URL or data URL
  type: "phonic" | "weather" | "custom";
}

interface CardGroup {
  id: string;
  name: string;
  icon: "phonic" | "weather" | "custom";
  cards: PresenterCard[];
}

/* ============================================================
   BUILT-IN GROUPS — Phonic Cards (26) + Weather Cards (8)
   ============================================================ */

const WEATHER_DEFS: { id: string; label: string; image: string }[] = [
  { id: "sunny",   label: "Sunny",   image: "/images/weather/sunny.gif" },
  { id: "cloudy",  label: "Cloudy",  image: "/images/weather/cloudy.gif" },
  { id: "rainy",   label: "Rainy",   image: "/images/weather/rainy.gif" },
  { id: "snowy",   label: "Snowy",   image: "/images/weather/snowy.gif" },
  { id: "windy",   label: "Windy",   image: "/images/weather/windy.gif" },
  { id: "stormy",  label: "Stormy",  image: "/images/weather/stormy.gif" },
  { id: "hot",     label: "Hot",     image: "/images/weather/hot.gif" },
  { id: "cold",    label: "Cold",    image: "/images/weather/cold.gif" },
];

const PHONIC_GROUP: CardGroup = {
  id: "phonic",
  name: "Phonic Cards (A-Z)",
  icon: "phonic",
  cards: PHONIC_CARDS.map((c) => ({
    id: c.letter,
    label: `${c.upper}/${c.letter}`,
    word: c.word,
    image: c.cardImage,
    type: "phonic" as const,
  })),
};

const WEATHER_GROUP: CardGroup = {
  id: "weather",
  name: "Weather Cards",
  icon: "weather",
  cards: WEATHER_DEFS.map((w) => ({
    id: w.id,
    label: w.label,
    word: w.id,
    image: w.image,
    type: "weather" as const,
  })),
};

const BUILTIN_GROUPS: CardGroup[] = [PHONIC_GROUP, WEATHER_GROUP];

/* ============================================================
   SAVED GROUPS (localStorage) — includes both selections of
   builtin cards AND fully custom uploaded card groups
   ============================================================ */

const SAVED_GROUPS_KEY = "classroom-tools-flashcard-groups-v2";

interface SavedGroup {
  name: string;
  icon: "phonic" | "weather" | "custom";
  // For builtin-card selections: reference by {group, cardId}
  // For custom uploaded cards: include full card data with data URL
  sourceGroup?: string;           // "phonic" | "weather" | undefined for custom
  cardIds?: string[];             // selected ids from sourceGroup
  customCards?: PresenterCard[];  // for fully custom uploaded groups
}

function readSavedGroups(): Record<string, SavedGroup> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SAVED_GROUPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeSavedGroups(groups: Record<string, SavedGroup>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(SAVED_GROUPS_KEY, JSON.stringify(groups)); } catch {}
}

/* ============================================================
   FLASH CARD PRESENTER — Multi-group version
   ============================================================ */
export function FlashCardPresenter() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const { skinId, setSkinId, skin } = useToolSkin("flash-card-presenter");

  // Active group (which set of cards we're working with)
  const [activeGroupId, setActiveGroupId] = useState<string>("phonic");

  // Build the full list of available groups (builtin + saved custom groups)
  const savedGroups = useMemo(() => readSavedGroups(), []);
  const [savedGroupsState, setSavedGroupsState] = useState<Record<string, SavedGroup>>(savedGroups);

  const allGroups: CardGroup[] = useMemo(() => {
    const customGroups: CardGroup[] = Object.entries(savedGroupsState)
      .filter(([, sg]) => sg.customCards && sg.customCards.length > 0)
      .map(([name, sg]) => ({
        id: `custom-${name}`,
        name: name,
        icon: "custom" as const,
        cards: sg.customCards!,
      }));
    return [...BUILTIN_GROUPS, ...customGroups];
  }, [savedGroupsState]);

  const activeGroup = useMemo(
    () => allGroups.find((g) => g.id === activeGroupId) ?? allGroups[0],
    [allGroups, activeGroupId],
  );

  const allCards = activeGroup.cards;
  const allCardIds = allCards.map((c) => c.id);

  const [mode, setMode] = useState<Mode>("shuffle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shuffle state
  const [currentCardId, setCurrentCardId] = useState<string>(allCards[0]?.id ?? "");
  const [used, setUsed] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "drawing" | "result">("idle");

  // Browse state
  const browseIndex = useMemo(
    () => allCardIds.indexOf(currentCardId),
    [currentCardId, allCardIds],
  );

  // Select mode state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [presenting, setPresenting] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);

  // Saved groups dialogs
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Upload dialog
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedCards, setUploadedCards] = useState<PresenterCard[]>([]);
  const [uploadGroupName, setUploadGroupName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When active group changes, reset state
  useEffect(() => {
    if (allCards.length > 0) {
      setCurrentCardId(allCards[0].id);
    }
    setUsed([]);
    setPhase("idle");
    setSelected(new Set());
    setPresenting(false);
  }, [activeGroupId, allCards.length]);

  // ===== Save current selection as a named group =====
  const handleSaveGroup = useCallback(() => {
    const name = saveName.trim() || `Group ${Object.keys(savedGroupsState).length + 1}`;
    const selectedCards = allCards.filter((c) => selected.has(c.id));
    const newSaved: SavedGroup = {
      name,
      icon: activeGroup.icon,
      sourceGroup: activeGroup.id,
      cardIds: Array.from(selected),
    };
    void selectedCards; // (kept for clarity)
    const updated = { ...savedGroupsState, [name]: newSaved };
    writeSavedGroups(updated);
    setSavedGroupsState(updated);
    setSaveName("");
    setShowSaveDialog(false);
    sound.playClick();
  }, [saveName, selected, allCards, activeGroup, savedGroupsState, sound]);

  // ===== Load a saved group (selection of builtin cards) =====
  const handleLoadGroup = useCallback((name: string) => {
    const sg = savedGroupsState[name];
    if (!sg) return;
    if (sg.sourceGroup && sg.cardIds) {
      // Selection of builtin cards — switch to that group and set selection
      setActiveGroupId(sg.sourceGroup);
      setSelected(new Set(sg.cardIds));
    } else if (sg.customCards) {
      // Custom group — already in allGroups via custom-* id
      setActiveGroupId(`custom-${name}`);
    }
    setShowLoadDialog(false);
    sound.playClick();
  }, [savedGroupsState, sound]);

  // ===== Delete a saved group =====
  const handleDeleteGroup = useCallback((name: string) => {
    const updated = { ...savedGroupsState };
    delete updated[name];
    writeSavedGroups(updated);
    setSavedGroupsState(updated);
    sound.playClick();
  }, [savedGroupsState, sound]);

  // ===== Upload images to create a custom group =====
  const handleFileUpload = useCallback((files: FileList) => {
    const newCards: PresenterCard[] = [];
    Array.from(files).forEach((file, idx) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        newCards.push({
          id: `upload-${Date.now()}-${idx}`,
          label: fileName,
          image: dataUrl,
          type: "custom",
        });
        // Update state when all files processed
        if (newCards.length === Array.from(files).filter((f) => f.type.startsWith("image/")).length) {
          setUploadedCards((prev) => [...prev, ...newCards]);
        }
      };
      reader.readAsDataURL(file);
    });
    sound.playClick();
  }, [sound]);

  const handleSaveUploadedGroup = useCallback(() => {
    if (uploadedCards.length === 0) return;
    const name = uploadGroupName.trim() || `Custom Group ${Object.keys(savedGroupsState).length + 1}`;
    const newSaved: SavedGroup = {
      name,
      icon: "custom",
      customCards: uploadedCards,
    };
    const updated = { ...savedGroupsState, [name]: newSaved };
    writeSavedGroups(updated);
    setSavedGroupsState(updated);
    setUploadedCards([]);
    setUploadGroupName("");
    setShowUploadDialog(false);
    setActiveGroupId(`custom-${name}`);
    sound.playClick();
  }, [uploadedCards, uploadGroupName, savedGroupsState, sound]);

  // ===== Fullscreen =====
  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ===== Mode switching =====
  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    setPhase("idle");
    setPresenting(false);
    sound.playClick();
  }, [sound]);

  // ===== Shuffle =====
  const drawRandom = useCallback(() => {
    if (phase === "drawing") return;
    setPhase("drawing");
    sound.playWhoosh();

    const available = allCardIds.filter((id) => !used.includes(id));
    const finalPool = available.length > 0 ? available : allCardIds;

    let ticks = 0;
    const interval = setInterval(() => {
      setCurrentCardId(finalPool[Math.floor(Math.random() * finalPool.length)]);
      ticks++;
      if (ticks >= 16) {
        clearInterval(interval);
        const final = finalPool[Math.floor(Math.random() * finalPool.length)];
        setCurrentCardId(final);
        if (available.length > 0) {
          setUsed((prev) => [...prev, final]);
        } else {
          setUsed([final]);
        }
        setPhase("result");
        sound.playReveal();
        flashFn("rgba(168, 85, 247, 0.5)");
        shake(2);
        burstConfetti(80, 50, 40);
      }
    }, 80);
  }, [phase, used, allCardIds, sound, flashFn, shake, burstConfetti]);

  const resetShuffle = useCallback(() => {
    setUsed([]);
    setPhase("idle");
    if (allCards[0]) setCurrentCardId(allCards[0].id);
    sound.playClick();
  }, [allCards, sound]);

  // ===== Browse =====
  const goPrev = useCallback(() => {
    const newIdx = (browseIndex - 1 + allCardIds.length) % allCardIds.length;
    setCurrentCardId(allCardIds[newIdx]);
    setPhase("result");
    sound.playTick(600);
  }, [browseIndex, allCardIds, sound]);

  const goNext = useCallback(() => {
    const newIdx = (browseIndex + 1) % allCardIds.length;
    setCurrentCardId(allCardIds[newIdx]);
    setPhase("result");
    sound.playTick(800);
  }, [browseIndex, allCardIds, sound]);

  // ===== Select mode =====
  const toggleSelect = useCallback((cardId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
    sound.playClick();
  }, [sound]);

  const startPresenting = useCallback(() => {
    if (selected.size === 0) return;
    setPresentIndex(0);
    setPresenting(true);
    setCurrentCardId(Array.from(selected)[0]);
    setPhase("result");
    sound.playReveal();
    flashFn("rgba(168, 85, 247, 0.5)");
    burstConfetti(60, 50, 40);
  }, [selected, sound, flashFn, burstConfetti]);

  const nextSelected = useCallback(() => {
    const arr = Array.from(selected);
    if (arr.length === 0) return;
    const next = (presentIndex + 1) % arr.length;
    setPresentIndex(next);
    setCurrentCardId(arr[next]);
    setPhase("result");
    sound.playTick(800);
    if (next === 0) {
      sound.playReveal();
      burstConfetti(100, 50, 40);
    }
  }, [selected, presentIndex, sound, burstConfetti]);

  const prevSelected = useCallback(() => {
    const arr = Array.from(selected);
    if (arr.length === 0) return;
    const next = (presentIndex - 1 + arr.length) % arr.length;
    setPresentIndex(next);
    setCurrentCardId(arr[next]);
    setPhase("result");
    sound.playTick(600);
  }, [selected, presentIndex, sound]);

  const exitPresenting = useCallback(() => {
    setPresenting(false);
    sound.playClick();
  }, [sound]);

  // Current card
  const currentCard = useMemo(
    () => allCards.find((c) => c.id === currentCardId) ?? allCards[0],
    [allCards, currentCardId],
  );

  const showPresenter =
    mode === "shuffle" || mode === "browse" || (mode === "select" && presenting);

  const groupIcon = (icon: string) => {
    if (icon === "weather") return <CloudSun className="h-4 w-4" />;
    if (icon === "custom") return <Upload className="h-4 w-4" />;
    return <Type className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Title + fullscreen */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3">
        <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 border border-white/10 shadow-lg flex-1">
          <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Flash Card Presenter
          </h2>
          <p className="text-xs text-white/70 mt-0.5">
            Phonic · Weather · Custom Uploads · shuffle · browse · select · fullscreen
          </p>
        </div>
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          size="icon"
          className="rounded-full bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white h-11 w-11 shrink-0"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
      </div>

      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* ===== Group selector ===== */}
      {!presenting && (
        <div className="w-full max-w-4xl">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Card Set:</span>
            {allGroups.map((g) => {
              const isActive = g.id === activeGroupId;
              return (
                <button
                  key={g.id}
                  onClick={() => { setActiveGroupId(g.id); sound.playClick(); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all",
                    isActive
                      ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                      : "bg-white/10 text-white border-white/25 hover:bg-white/20",
                  )}
                >
                  {groupIcon(g.icon)}
                  {g.name}
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
                    {g.cards.length}
                  </span>
                </button>
              );
            })}
            <Button
              onClick={() => setShowUploadDialog(!showUploadDialog)}
              size="sm"
              variant="outline"
              className="rounded-full bg-emerald-500/20 text-emerald-100 border-emerald-400/40 hover:bg-emerald-500/30 hover:text-emerald-50"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload New Group
            </Button>
          </div>
        </div>
      )}

      {/* ===== Upload dialog ===== */}
      {showUploadDialog && (
        <div className="w-full max-w-2xl p-5 rounded-2xl bg-black/40 border border-emerald-400/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-emerald-300" />
              Upload Images to Create a Custom Card Group
            </h3>
            <button onClick={() => setShowUploadDialog(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-400/40 rounded-2xl p-8 text-center cursor-pointer hover:bg-emerald-500/5 transition-all"
          >
            <Upload className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">Drop images here or click to browse</p>
            <p className="text-xs text-white/50 mt-1">PNG, JPG, GIF · Each image becomes one card</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) handleFileUpload(e.target.files); }}
            />
          </div>

          {/* Uploaded cards preview */}
          {uploadedCards.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">
                {uploadedCards.length} image{uploadedCards.length !== 1 ? "s" : ""} ready:
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                {uploadedCards.map((card, idx) => (
                  <div key={card.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/20 group">
                    <img src={card.image} alt={card.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedCards((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-white hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={uploadGroupName}
                  onChange={(e) => setUploadGroupName(e.target.value)}
                  placeholder="Group name (e.g. 'Animals', 'Colors', 'Shapes')"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none"
                />
                <Button onClick={handleSaveUploadedGroup} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Save className="mr-1.5 h-4 w-4" /> Save Group
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Mode toggle ===== */}
      {!presenting && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Mode:</span>
          {([
            { id: "shuffle" as const, label: "Shuffle", icon: Shuffle },
            { id: "browse" as const, label: "Browse", icon: ChevronRight },
            { id: "select" as const, label: "Select", icon: MousePointerClick },
          ]).map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-all",
                  mode === m.id
                    ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                    : "bg-white/10 text-white border-white/25 hover:bg-white/20",
                )}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ===== Select mode: card picker ===== */}
      {mode === "select" && !presenting && (
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
              Tap cards to select ({selected.size} selected)
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => { setSelected(new Set(allCardIds)); sound.playClick(); }}
                size="sm"
                variant="outline"
                className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                Select All
              </Button>
              <Button
                onClick={() => { setSelected(new Set()); sound.playClick(); }}
                size="sm"
                variant="outline"
                className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {allCards.map((card) => {
              const isSel = selected.has(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleSelect(card.id)}
                  className={cn(
                    "relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all",
                    isSel
                      ? "border-fuchsia-400 ring-2 ring-fuchsia-400/50 scale-105 shadow-lg"
                      : "border-white/15 hover:border-white/40 hover:scale-105",
                  )}
                >
                  <img
                    src={card.image}
                    alt={card.label}
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                  />
                  {isSel && (
                    <div className="absolute inset-0 bg-fuchsia-500/40 flex items-center justify-center">
                      <span className="text-3xl text-white drop-shadow-lg">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <Button
              onClick={startPresenting}
              disabled={selected.size === 0}
              className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5 fill-current" />
              Present {selected.size} Card{selected.size !== 1 ? "s" : ""}
            </Button>

            <Button
              onClick={() => setShowSaveDialog(!showSaveDialog)}
              disabled={selected.size === 0}
              size="sm"
              variant="outline"
              className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save Group
            </Button>
            <Button
              onClick={() => { setShowLoadDialog(!showLoadDialog); setSavedGroupsState(readSavedGroups()); }}
              size="sm"
              variant="outline"
              className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
            >
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" /> Load Group
              {Object.keys(savedGroupsState).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                  {Object.keys(savedGroupsState).length}
                </span>
              )}
            </Button>
          </div>

          {/* Save dialog */}
          {showSaveDialog && (
            <div className="mt-3 p-4 rounded-2xl bg-black/30 border border-white/10 max-w-md mx-auto">
              <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">
                Save {selected.size} cards from "{activeGroup.name}" as:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveGroup()}
                  placeholder='e.g. "Vowels", "A-M", "Weather Set 1"'
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none"
                  autoFocus
                />
                <Button onClick={handleSaveGroup} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Save className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowSaveDialog(false)} size="sm" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Load dialog */}
          {showLoadDialog && (
            <div className="mt-3 p-4 rounded-2xl bg-black/30 border border-white/10 max-w-md mx-auto">
              <p className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider">
                {Object.keys(savedGroupsState).length > 0 ? "Select a saved group to load:" : "No saved groups yet — save one first!"}
              </p>
              {Object.keys(savedGroupsState).length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(savedGroupsState).map(([name, sg]) => {
                    const cardCount = sg.customCards?.length ?? sg.cardIds?.length ?? 0;
                    const preview = sg.customCards?.map((c) => c.label).join(", ")
                      ?? sg.cardIds?.map((id) => id.toUpperCase()).join(", ")
                      ?? "";
                    return (
                      <div key={name} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {groupIcon(sg.icon)}
                            <span className="font-bold text-white text-sm">{name}</span>
                            <span className="text-xs text-white/50">{cardCount} cards</span>
                          </div>
                          <p className="text-xs text-white/40 truncate mt-0.5">{preview}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button onClick={() => handleLoadGroup(name)} size="sm" className="bg-white text-slate-900 hover:bg-white/90 h-7 text-xs">Load</Button>
                          <button onClick={() => handleDeleteGroup(name)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button onClick={() => setShowLoadDialog(false)} size="sm" variant="outline" className="mt-3 bg-white/10 text-white border-white/20 hover:bg-white/20">Close</Button>
            </div>
          )}
        </div>
      )}

      {/* ===== Presenter view ===== */}
      {showPresenter && currentCard && (
        <>
          <ShakeWrapper intensity={shakeIntensity}>
            <div
              className={cn(
                "relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br flex flex-col items-center justify-center p-6",
                skin.bgGradient,
              )}
              style={{ minHeight: isFullscreen ? "70vh" : "32rem" }}
            >
              <SkinParticleField skin={skin} seed={11} />
              <SkinSceneDecorator skin={skin} />

              {/* Card image */}
              <div className="relative z-10">
                <div
                  className={cn(
                    "rounded-2xl bg-white shadow-2xl border-4 border-white/40 overflow-hidden",
                    isFullscreen ? "w-[28rem] h-[40rem]" : "w-72 h-96 sm:w-80 sm:h-[28rem]",
                    phase === "drawing" && "animate-[diceTumble_0.2s_linear_infinite]",
                    phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
                  )}
                >
                  <img
                    src={currentCard.image}
                    alt={currentCard.label}
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Card info */}
              <div className="relative z-10 mt-4 text-center">
                <p className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                  {currentCard.label}
                </p>
                {currentCard.word && (
                  <p className="text-base text-white/80">
                    {currentCard.word}
                    {mode === "select" && presenting && (
                      <span className="text-white/50 text-sm">
                        {" "}· {presentIndex + 1} / {selected.size}
                      </span>
                    )}
                  </p>
                )}
                {mode === "shuffle" && (
                  <p className="text-xs text-white/50 mt-1">
                    {used.length} of {allCards.length} drawn
                  </p>
                )}
                {mode === "browse" && (
                  <p className="text-xs text-white/50 mt-1">
                    Card {browseIndex + 1} of {allCards.length}
                  </p>
                )}
              </div>

              <ConfettiOverlay pieces={confetti} />
              <FlashOverlay flash={flash} />
            </div>
          </ShakeWrapper>

          {/* Controls */}
          <div className="flex gap-3 justify-center items-center flex-wrap">
            {(mode === "browse" || (mode === "select" && presenting)) && (
              <Button
                onClick={mode === "select" ? prevSelected : goPrev}
                size="lg"
                variant="outline"
                className="rounded-full px-5 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                <ChevronLeft className="mr-1 h-5 w-5" />
                Prev
              </Button>
            )}

            {mode === "shuffle" && (
              <>
                {phase === "idle" || phase === "result" ? (
                  <Button
                    onClick={drawRandom}
                    size="lg"
                    className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold"
                  >
                    <Shuffle className="mr-2 h-5 w-5" />
                    {phase === "result" ? "Draw Next" : "Draw a Card"}
                  </Button>
                ) : (
                  <Button disabled size="lg" className="rounded-full px-8 bg-white/30 text-white font-bold">
                    Drawing...
                  </Button>
                )}
                <Button
                  onClick={resetShuffle}
                  size="lg"
                  variant="outline"
                  className="rounded-full px-5 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Reset
                </Button>
              </>
            )}

            {mode === "browse" && (
              <Button
                onClick={() => {
                  if (allCards[0]) setCurrentCardId(allCards[0].id);
                  setPhase("result");
                  sound.playClick();
                }}
                size="lg"
                variant="outline"
                className="rounded-full px-5 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                First Card
              </Button>
            )}

            {mode === "select" && presenting && (
              <Button
                onClick={exitPresenting}
                size="lg"
                variant="outline"
                className="rounded-full px-5 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                <X className="mr-2 h-5 w-5" />
                Exit
              </Button>
            )}

            {(mode === "browse" || (mode === "select" && presenting)) && (
              <Button
                onClick={mode === "select" ? nextSelected : goNext}
                size="lg"
                className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold"
              >
                Next
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Browse: quick-jump strip */}
          {mode === "browse" && (
            <div className="w-full max-w-2xl">
              <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1.5 text-center">
                Jump to card
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {allCards.map((card, idx) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      setCurrentCardId(card.id);
                      setPhase("result");
                      sound.playTick(700);
                    }}
                    className={cn(
                      "w-7 h-7 rounded-md text-[10px] font-bold border transition-all",
                      card.id === currentCardId
                        ? "bg-white text-slate-900 border-white scale-110 shadow"
                        : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20",
                    )}
                    title={card.label}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer hint */}
      <p className="text-xs text-white/40 text-center">
        Tip: press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px]">F</kbd> for fullscreen ·
        Upload your own images to create custom card groups · Saved groups persist in your browser
      </p>
    </div>
  );
}

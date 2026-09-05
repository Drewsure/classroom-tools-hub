"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "shuffle" | "browse" | "select";

const ALL_LETTERS = PHONIC_CARDS.map((c) => c.letter);

// ===== Saved card groups (localStorage) =====
const SAVED_GROUPS_KEY = "classroom-tools-flashcard-groups";

function readSavedGroups(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SAVED_GROUPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeSavedGroups(groups: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(SAVED_GROUPS_KEY, JSON.stringify(groups)); } catch {}
}

/* ============================================================
   FLASH CARD PRESENTER
   - Shuffle: random draw with no-repeat
   - Browse: prev/next through all 26 cards
   - Select: tap cards to select, then present only selected cards
   - Fullscreen mode for classroom projection
   ============================================================ */
export function FlashCardPresenter() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const { skinId, setSkinId, skin } = useToolSkin("flash-card-presenter");

  const [mode, setMode] = useState<Mode>("shuffle");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shuffle state
  const [currentLetter, setCurrentLetter] = useState<string>("a");
  const [used, setUsed] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "drawing" | "result">("idle");

  // Browse state (uses same currentLetter; tracks index)
  const browseIndex = useMemo(
    () => ALL_LETTERS.indexOf(currentLetter),
    [currentLetter],
  );

  // Select mode state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [presenting, setPresenting] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);

  // Saved groups state
  const [savedGroups, setSavedGroups] = useState<Record<string, string[]>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Load saved groups on mount
  useEffect(() => {
    setSavedGroups(readSavedGroups());
  }, []);

  // Save current selection as a named group
  const handleSaveGroup = useCallback(() => {
    const name = saveName.trim() || `Group ${Object.keys(savedGroups).length + 1}`;
    const updated = { ...savedGroups, [name]: Array.from(selected) };
    writeSavedGroups(updated);
    setSavedGroups(updated);
    setSaveName("");
    setShowSaveDialog(false);
    sound.playClick();
  }, [saveName, selected, savedGroups, sound]);

  // Load a saved group into the selection
  const handleLoadGroup = useCallback((name: string) => {
    const letters = savedGroups[name];
    if (letters) {
      setSelected(new Set(letters));
      setShowLoadDialog(false);
      sound.playClick();
    }
  }, [savedGroups, sound]);

  // Delete a saved group
  const handleDeleteGroup = useCallback((name: string) => {
    const updated = { ...savedGroups };
    delete updated[name];
    writeSavedGroups(updated);
    setSavedGroups(updated);
    sound.playClick();
  }, [savedGroups, sound]);

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
  const switchMode = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      setPhase("idle");
      setPresenting(false);
      sound.playClick();
    },
    [sound],
  );

  // ===== Shuffle: draw random with no-repeat =====
  const drawRandom = useCallback(() => {
    if (phase === "drawing") return;
    setPhase("drawing");
    sound.playWhoosh();

    // Determine pool — for shuffle, use all 26 (no-repeat)
    const pool = ALL_LETTERS;
    const available = pool.filter((l) => !used.includes(l));
    const finalPool = available.length > 0 ? available : pool;

    // Spin animation
    let ticks = 0;
    const interval = setInterval(() => {
      setCurrentLetter(finalPool[Math.floor(Math.random() * finalPool.length)]);
      ticks++;
      if (ticks >= 16) {
        clearInterval(interval);
        const final = finalPool[Math.floor(Math.random() * finalPool.length)];
        setCurrentLetter(final);
        if (available.length > 0) {
          setUsed((prev) => [...prev, final]);
        } else {
          // Pool exhausted — start fresh with just this one
          setUsed([final]);
        }
        setPhase("result");
        sound.playReveal();
        flashFn("rgba(168, 85, 247, 0.5)");
        shake(2);
        burstConfetti(80, 50, 40);
      }
    }, 80);
  }, [phase, used, sound, flashFn, shake, burstConfetti]);

  const resetShuffle = useCallback(() => {
    setUsed([]);
    setPhase("idle");
    setCurrentLetter("a");
    sound.playClick();
  }, [sound]);

  // ===== Browse: prev/next =====
  const goPrev = useCallback(() => {
    const newIdx = (browseIndex - 1 + ALL_LETTERS.length) % ALL_LETTERS.length;
    setCurrentLetter(ALL_LETTERS[newIdx]);
    setPhase("result");
    sound.playTick(600);
  }, [browseIndex, sound]);

  const goNext = useCallback(() => {
    const newIdx = (browseIndex + 1) % ALL_LETTERS.length;
    setCurrentLetter(ALL_LETTERS[newIdx]);
    setPhase("result");
    sound.playTick(800);
  }, [browseIndex, sound]);

  // ===== Select mode =====
  const toggleSelect = useCallback(
    (letter: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(letter)) next.delete(letter);
        else next.add(letter);
        return next;
      });
      sound.playClick();
    },
    [sound],
  );

  const startPresenting = useCallback(() => {
    if (selected.size === 0) return;
    setPresentIndex(0);
    setPresenting(true);
    setCurrentLetter(Array.from(selected)[0]);
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
    setCurrentLetter(arr[next]);
    setPhase("result");
    sound.playTick(800);
    if (next === 0) {
      // Wrapped around — celebrate completion
      sound.playReveal();
      burstConfetti(100, 50, 40);
    }
  }, [selected, presentIndex, sound, burstConfetti]);

  const prevSelected = useCallback(() => {
    const arr = Array.from(selected);
    if (arr.length === 0) return;
    const next = (presentIndex - 1 + arr.length) % arr.length;
    setPresentIndex(next);
    setCurrentLetter(arr[next]);
    setPhase("result");
    sound.playTick(600);
  }, [selected, presentIndex, sound]);

  const exitPresenting = useCallback(() => {
    setPresenting(false);
    sound.playClick();
  }, [sound]);

  // Current card to display
  const currentCard = useMemo(
    () => PHONIC_CARDS.find((c) => c.letter === currentLetter) ?? PHONIC_CARDS[0],
    [currentLetter],
  );

  // ===== Layout: presenting mode in select, or shuffle/browse =====
  const showPresenter =
    mode === "shuffle" || mode === "browse" || (mode === "select" && presenting);

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
            26 phonic cards · shuffle · browse · select · fullscreen
          </p>
        </div>
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          size="icon"
          className="rounded-full bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white h-11 w-11 shrink-0"
          aria-label="Toggle fullscreen"
          title="Fullscreen (F)"
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
      </div>

      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Mode toggle — hidden while presenting */}
      {!presenting && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Mode:</span>
          {(
            [
              { id: "shuffle" as const, label: "Shuffle", icon: Shuffle },
              { id: "browse" as const, label: "Browse", icon: ChevronRight },
              { id: "select" as const, label: "Select", icon: MousePointerClick },
            ]
          ).map((m) => {
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

      {/* ===== Select mode: card picker grid (when not presenting) ===== */}
      {mode === "select" && !presenting && (
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
              Tap cards to select ({selected.size} selected)
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelected(new Set(ALL_LETTERS));
                  sound.playClick();
                }}
                size="sm"
                variant="outline"
                className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                Select All
              </Button>
              <Button
                onClick={() => {
                  setSelected(new Set());
                  sound.playClick();
                }}
                size="sm"
                variant="outline"
                className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-13 gap-2">
            {PHONIC_CARDS.map((card) => {
              const isSel = selected.has(card.letter);
              return (
                <button
                  key={card.letter}
                  onClick={() => toggleSelect(card.letter)}
                  className={cn(
                    "relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all",
                    isSel
                      ? "border-fuchsia-400 ring-2 ring-fuchsia-400/50 scale-105 shadow-lg"
                      : "border-white/15 hover:border-white/40 hover:scale-105",
                  )}
                  aria-label={`Card ${card.letter.toUpperCase()} — ${isSel ? "deselect" : "select"}`}
                >
                  { }
                  <img
                    src={card.cardImage}
                    alt={`Phonic card ${card.upper} for ${card.word}`}
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

            {/* Save / Load group buttons */}
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
              onClick={() => { setShowLoadDialog(!showLoadDialog); setSavedGroups(readSavedGroups()); }}
              size="sm"
              variant="outline"
              className="rounded-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
            >
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" /> Load Group
              {Object.keys(savedGroups).length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{Object.keys(savedGroups).length}</span>}
            </Button>
          </div>

          {/* Save dialog */}
          {showSaveDialog && (
            <div className="mt-3 p-4 rounded-2xl bg-black/30 border border-white/10 max-w-md mx-auto">
              <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Save {selected.size} cards as:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveGroup()}
                  placeholder='e.g. "Vowels", "A-M", "Spelling Set 1"'
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
                {Object.keys(savedGroups).length > 0 ? "Select a saved group to load:" : "No saved groups yet — save one first!"}
              </p>
              {Object.keys(savedGroups).length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(savedGroups).map(([name, letters]) => (
                    <div key={name} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-white text-sm">{name}</span>
                        <span className="text-xs text-white/50 ml-2">{letters.length} cards</span>
                        <p className="text-xs text-white/40 truncate">{letters.map(l => l.toUpperCase()).join(", ")}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button onClick={() => handleLoadGroup(name)} size="sm" className="bg-white text-slate-900 hover:bg-white/90 h-7 text-xs">Load</Button>
                        <button onClick={() => handleDeleteGroup(name)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => setShowLoadDialog(false)} size="sm" variant="outline" className="mt-3 bg-white/10 text-white border-white/20 hover:bg-white/20">Close</Button>
            </div>
          )}
        </div>
      )}

      {/* ===== Presenter view (shuffle / browse / presenting select) ===== */}
      {showPresenter && (
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
                  { }
                  <img
                    src={currentCard.cardImage}
                    alt={`Phonic card ${currentCard.upper} for ${currentCard.word}`}
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Card info */}
              <div className="relative z-10 mt-4 text-center">
                <p className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                  {currentCard.letter} / {currentCard.upper}
                </p>
                <p className="text-base text-white/80">
                  {currentCard.word} {mode === "select" && presenting && (
                    <span className="text-white/50 text-sm">
                      · {presentIndex + 1} / {selected.size}
                    </span>
                  )}
                </p>
                {mode === "shuffle" && (
                  <p className="text-xs text-white/50 mt-1">
                    {used.length} of {ALL_LETTERS.length} drawn
                  </p>
                )}
                {mode === "browse" && (
                  <p className="text-xs text-white/50 mt-1">
                    Card {browseIndex + 1} of {ALL_LETTERS.length}
                  </p>
                )}
              </div>

              <ConfettiOverlay pieces={confetti} />
              <FlashOverlay flash={flash} />
            </div>
          </ShakeWrapper>

          {/* Controls */}
          <div className="flex gap-3 justify-center items-center flex-wrap">
            {/* Browse + presenting select: prev */}
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

            {/* Shuffle: Draw */}
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
                  <Button
                    disabled
                    size="lg"
                    className="rounded-full px-8 bg-white/30 text-white font-bold"
                  >
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

            {/* Browse: reset */}
            {mode === "browse" && (
              <Button
                onClick={() => {
                  setCurrentLetter("a");
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

            {/* Presenting select: exit */}
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

            {/* Browse + presenting select: next */}
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

          {/* Browse: quick-jump alphabet strip */}
          {mode === "browse" && (
            <div className="w-full max-w-2xl">
              <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1.5 text-center">
                Jump to card
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {ALL_LETTERS.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setCurrentLetter(l);
                      setPhase("result");
                      sound.playTick(700);
                    }}
                    className={cn(
                      "w-7 h-7 rounded-md text-xs font-bold uppercase border transition-all",
                      l === currentLetter
                        ? "bg-white text-slate-900 border-white scale-110 shadow"
                        : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20",
                    )}
                  >
                    {l}
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
        perfect for classroom projection
      </p>
    </div>
  );
}

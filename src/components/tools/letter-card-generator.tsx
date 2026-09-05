"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";
import { PhonicCardPanel } from "./phonic-card-panel";
import { findPhonicCard } from "@/lib/phonic-cards";
import { Play, RotateCcw, Check, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz".split("");

type CaseMode = "upper" | "lower" | "mixed" | "random";

const VOWELS = ["A", "E", "I", "O", "U"];

export function LetterCardGenerator() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const { skinId, setSkinId, skin } = useToolSkin("letter-cards");

  const [letter, setLetter] = useState("A");
  const [phase, setPhase] = useState<"idle" | "buildup" | "spinning" | "result">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [noRepeat, setNoRepeat] = useState(false);
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [caseMode, setCaseMode] = useState<CaseMode>("upper");
  const [customMode, setCustomMode] = useState(false);
  const [vowelOnly, setVowelOnly] = useState(false);
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(new Set(ALPHABET_UPPER));
  const [showPhonicCard, setShowPhonicCard] = useState(true);  // toggle phonic card panel
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Find the phonic card for the current letter (used to check if a phonic card exists)
  const currentPhonicCard = useMemo(
    () => findPhonicCard(letter.length === 1 ? letter : letter.charAt(0).toUpperCase()),
    [letter],
  );

  // Build the letter pool based on case mode, custom selection, and vowel-only
  const getPool = useCallback(() => {
    let baseLetters: string[];
    if (vowelOnly) {
      baseLetters = [...VOWELS];
    } else if (customMode) {
      baseLetters = Array.from(selectedLetters);
    } else {
      baseLetters = [...ALPHABET_UPPER];
    }
    // Apply case transformation
    if (caseMode === "lower") {
      return baseLetters.map((l) => l.toLowerCase());
    } else if (caseMode === "mixed") {
      // mixed = each letter shown as "aA" pair (lowercase then uppercase)
      return baseLetters.map((l) => l.toLowerCase() + l.toUpperCase());
    } else if (caseMode === "random") {
      // random = each letter randomly upper or lower
      return baseLetters.map((l) => Math.random() < 0.5 ? l.toUpperCase() : l.toLowerCase());
    } else {
      return baseLetters.map((l) => l.toUpperCase());
    }
  }, [customMode, selectedLetters, caseMode, vowelOnly]);

  const handleGenerate = useCallback(() => {
    if (phase === "buildup" || phase === "spinning") return;
    const pool = getPool();
    if (pool.length === 0) return;

    const available = noRepeat ? pool.filter((l) => !usedLetters.includes(l)) : pool;
    if (available.length === 0) return;

    setPhase("buildup");
    setResult(null);
    sound.playBuildUp();

    setTimeout(() => {
      setPhase("spinning");
      sound.playWhoosh();
      let ticks = 0;
      spinRef.current = setInterval(() => {
        setLetter(available[Math.floor(Math.random() * available.length)]);
        sound.playTick(500 + ticks * 20);
        ticks++;
        if (ticks >= 20) {
          if (spinRef.current) clearInterval(spinRef.current);
          const final = available[Math.floor(Math.random() * available.length)];
          setLetter(final);
          setResult(final);
          if (noRepeat) {
            setUsedLetters((prev) => [...prev, final]);
          }
          setPhase("result");
          sound.playReveal();
          flashFn("rgba(59, 130, 246, 0.6)");
          shake(2);
          burstConfetti(80, 50, 40);
        }
      }, 80);
    }, 1500);
  }, [phase, noRepeat, usedLetters, getPool, sound, flashFn, shake, burstConfetti]);

  const handleReset = useCallback(() => {
    if (spinRef.current) clearInterval(spinRef.current);
    setPhase("idle");
    setResult(null);
    setUsedLetters([]);
    sound.playClick();
  }, [sound]);

  const toggleLetter = (l: string) => {
    setSelectedLetters((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
    sound.playClick();
  };

  const allExhausted = noRepeat && usedLetters.length >= getPool().length;
  const isBusy = phase === "buildup" || phase === "spinning";

  // For display: normalize used letters to uppercase for the tracking grid
  const usedUpper = new Set(usedLetters.map((l) => l.toUpperCase()));

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Title area */}
      <div className="w-full max-w-md text-center px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 border border-white/10 shadow-lg">
        <h2 className="text-2xl font-black text-white">🔤 Letter Card Generator</h2>
        <p className="text-sm text-white/70 mt-1">Letter generators and practice</p>
      </div>

      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Case mode selector */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Case:</span>
        {([
          { id: "upper" as const, label: "ABC", icon: "Uppercase" },
          { id: "lower" as const, label: "abc", icon: "Lowercase" },
          { id: "mixed" as const, label: "aA", icon: "Mixed (lower+upper pair)" },
          { id: "random" as const, label: "A?a", icon: "Random upper/lower" },
        ]).map((c) => (
          <button
            key={c.id}
            onClick={() => { setCaseMode(c.id); setUsedLetters([]); sound.playClick(); }}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold border transition-all",
              caseMode === c.id
                ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                : "bg-white/10 text-white border-white/25 hover:bg-white/20",
            )}
            title={c.icon}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Options toggles */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <button
          onClick={() => { setVowelOnly(!vowelOnly); setUsedLetters([]); sound.playClick(); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all",
            vowelOnly
              ? "bg-orange-500/30 text-orange-200 border-orange-400/50"
              : "bg-white/10 text-white border-white/25 hover:bg-white/20",
          )}
        >
          {vowelOnly && <Check className="h-4 w-4" />}
          Vowels Only
        </button>

        <button
          onClick={() => { setCustomMode(!customMode); setVowelOnly(false); setUsedLetters([]); sound.playClick(); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all",
            customMode
              ? "bg-blue-500/30 text-blue-200 border-blue-400/50"
              : "bg-white/10 text-white border-white/25 hover:bg-white/20",
          )}
        >
          {customMode && <Check className="h-4 w-4" />}
          Custom Letter Selection
        </button>

        <button
          onClick={() => { setNoRepeat(!noRepeat); setUsedLetters([]); sound.playClick(); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all",
            noRepeat
              ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/50"
              : "bg-white/10 text-white border-white/25 hover:bg-white/20",
          )}
        >
          {noRepeat && <Check className="h-4 w-4" />}
          No-Repeat Mode
        </button>

        <button
          onClick={() => { setShowPhonicCard(!showPhonicCard); sound.playClick(); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all",
            showPhonicCard
              ? "bg-purple-500/30 text-purple-200 border-purple-400/50"
              : "bg-white/10 text-white border-white/25 hover:bg-white/20",
          )}
        >
          {showPhonicCard && <Check className="h-4 w-4" />}
          <Volume2 className="h-4 w-4" />
          Card Image + Q&A
        </button>
      </div>

      {/* Custom letter grid */}
      {customMode && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-black/30 border border-white/10">
          <p className="text-xs text-white/60 mb-3 font-semibold uppercase tracking-wider">
            Select letters to include ({selectedLetters.size}/26)
          </p>
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
            {ALPHABET_UPPER.map((l) => (
              <button
                key={l}
                onClick={() => toggleLetter(l)}
                className={cn(
                  "w-9 h-9 rounded-lg text-sm font-bold border-2 transition-all",
                  selectedLetters.has(l)
                    ? "bg-blue-500 text-white border-blue-400 scale-105"
                    : "bg-white/5 text-white/30 border-white/10",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => { setSelectedLetters(new Set(ALPHABET_UPPER)); sound.playClick(); }}
              size="sm"
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
            >
              Select All
            </Button>
            <Button
              onClick={() => { setSelectedLetters(new Set()); sound.playClick(); }}
              size="sm"
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* No-repeat tracking */}
      {noRepeat && !customMode && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-sm text-white/70">Used:</span>
          <div className="flex gap-1 flex-wrap max-w-md">
            {ALPHABET_UPPER.map((l) => (
              <span
                key={l}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border",
                  usedUpper.has(l)
                    ? "bg-emerald-500/40 text-emerald-200 border-emerald-400/50 line-through"
                    : "bg-white/10 text-white/60 border-white/20",
                )}
              >
                {l}
              </span>
            ))}
          </div>
          {usedLetters.length > 0 && (
            <button onClick={() => { setUsedLetters([]); sound.playClick(); }} className="text-xs text-white/50 hover:text-white underline ml-1">
              reset
            </button>
          )}
        </div>
      )}

      {/* ===== SIDE-BY-SIDE LAYOUT: Flash card on LEFT, Card Image + Q&A on RIGHT =====
           No scrolling — both fit on one screen side-by-side */}
      {showPhonicCard && phase === "result" && currentPhonicCard ? (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-5 items-start justify-center">
          {/* LEFT: Flash card (the Aa letter card) */}
          <div className="w-full lg:w-1/2 max-w-md">
            <ShakeWrapper intensity={shakeIntensity}>
              <div className={cn(
                "relative w-full h-[28rem] sm:h-[34rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br",
                skin.bgGradient,
              )}>
                <SkinParticleField skin={skin} seed={12} />
                <SkinSceneDecorator skin={skin} />

                {phase === "buildup" && (
                  <>
                    <div className="absolute inset-0 bg-white/10 animate-[buildUpPulse_0.6s_ease-in-out_infinite]" />
                    <div className="absolute inset-8 rounded-full border-4 border-white/40 animate-[buildUpPulse_0.8s_ease-in-out_infinite]" />
                  </>
                )}

                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-white/30"
                      style={{
                        left: `${(i * 37) % 100}%`,
                        top: `${(i * 53) % 100}%`,
                        width: `${(i % 3) + 1}px`,
                        height: `${(i % 3) + 1}px`,
                        animation: `particleFloat ${(i % 3) + 2}s ease-in-out ${(i % 3) * 0.5}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 text-center">
                  <div className="flex flex-col items-center gap-4">
                    {/* Flash card with Aa style */}
                    <div
                      className={cn(
                        "w-56 h-72 sm:w-72 sm:h-96 rounded-3xl bg-gradient-to-br from-white to-slate-100 flex flex-col items-center justify-center shadow-2xl border-4 border-white relative",
                        phase === "spinning" && "animate-[vibrate_0.08s_linear_infinite]",
                        phase === "buildup" && "animate-[buildUpPulse_0.5s_ease-in-out_infinite] scale-90",
                        phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
                      )}
                    >
                      {/* Card frame */}
                      <div className="absolute inset-3 rounded-2xl border-4 border-blue-500/30" />
                      <div className="absolute inset-5 rounded-xl border-2 border-blue-400/20" />
                      {/* Corner decorations — small letter top-left, big letter center, small letter bottom-right */}
                      <div className="absolute top-3 left-4 text-blue-500/30 text-base font-bold">{letter}</div>
                      <div className="absolute bottom-3 right-4 text-blue-500/30 text-base font-bold rotate-180">{letter}</div>
                      {/* Big letter — sized based on length (aA pair is 2 chars) */}
                      <span className={cn(
                        "relative font-black text-blue-600 drop-shadow-2xl leading-none",
                        letter.length === 1 ? "text-[10rem] sm:text-[14rem]" : "text-[7rem] sm:text-[10rem]",
                      )}>
                        {letter}
                      </span>
                      {/* Shine */}
                      <div className="absolute top-6 left-8 w-16 h-8 rounded-full bg-white/50 blur-sm" />
                    </div>
                    <p className={cn(
                      "text-3xl sm:text-4xl font-black text-white drop-shadow-lg",
                      phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
                    )}>
                      {phase === "result" ? `Letter ${letter}!` : "Flipping..."}
                    </p>
                    {noRepeat && !allExhausted && phase === "result" && (
                      <p className="text-sm text-white/70">
                        {getPool().length - usedLetters.length} letters remaining
                      </p>
                    )}
                  </div>
                </div>

                {phase === "result" && (
                  <>
                    <div className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-4 border-white/60 pointer-events-none animate-[glowRingExpand_0.8s_ease-out]" />
                    <div className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-2 border-blue-300/60 pointer-events-none animate-[glowRingExpand_1.2s_ease-out_0.15s]" />
                  </>
                )}

                <ConfettiOverlay pieces={confetti} />
                <FlashOverlay flash={flash} />
              </div>
            </ShakeWrapper>
          </div>

          {/* RIGHT: Card Image + Q&A Panel */}
          <div className="w-full lg:w-1/2 lg:max-w-lg">
            <PhonicCardPanel
              letter={letter}
              showPhonicCard={false}
              showActualCard={true}
            />
          </div>
        </div>
      ) : (
        <ShakeWrapper intensity={shakeIntensity}>
          <div className={cn(
            "relative w-full max-w-md mx-auto h-[28rem] sm:h-[34rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br",
            skin.bgGradient,
          )}>
            <SkinParticleField skin={skin} seed={12} />
            <SkinSceneDecorator skin={skin} />

            {phase === "buildup" && (
              <>
                <div className="absolute inset-0 bg-white/10 animate-[buildUpPulse_0.6s_ease-in-out_infinite]" />
                <div className="absolute inset-8 rounded-full border-4 border-white/40 animate-[buildUpPulse_0.8s_ease-in-out_infinite]" />
              </>
            )}

            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="absolute rounded-full bg-white/30"
                  style={{
                    left: `${(i * 37) % 100}%`,
                    top: `${(i * 53) % 100}%`,
                    width: `${(i % 3) + 1}px`,
                    height: `${(i % 3) + 1}px`,
                    animation: `particleFloat ${(i % 3) + 2}s ease-in-out ${(i % 3) * 0.5}s infinite alternate`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 text-center">
              {letter && (phase === "spinning" || phase === "result") ? (
                <div className="flex flex-col items-center gap-4">
                  {/* Flash card with Aa style */}
                  <div
                    className={cn(
                      "w-56 h-72 sm:w-72 sm:h-96 rounded-3xl bg-gradient-to-br from-white to-slate-100 flex flex-col items-center justify-center shadow-2xl border-4 border-white relative",
                      phase === "spinning" && "animate-[vibrate_0.08s_linear_infinite]",
                      phase === "buildup" && "animate-[buildUpPulse_0.5s_ease-in-out_infinite] scale-90",
                      phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
                    )}
                  >
                    {/* Card frame */}
                    <div className="absolute inset-3 rounded-2xl border-4 border-blue-500/30" />
                    <div className="absolute inset-5 rounded-xl border-2 border-blue-400/20" />
                    {/* Corner decorations — small letter top-left, big letter center, small letter bottom-right */}
                    <div className="absolute top-3 left-4 text-blue-500/30 text-base font-bold">{letter}</div>
                    <div className="absolute bottom-3 right-4 text-blue-500/30 text-base font-bold rotate-180">{letter}</div>
                    {/* Big letter — sized based on length (aA pair is 2 chars) */}
                    <span className={cn(
                      "relative font-black text-blue-600 drop-shadow-2xl leading-none",
                      letter.length === 1 ? "text-[10rem] sm:text-[14rem]" : "text-[7rem] sm:text-[10rem]",
                    )}>
                      {letter}
                    </span>
                    {/* Shine */}
                    <div className="absolute top-6 left-8 w-16 h-8 rounded-full bg-white/50 blur-sm" />
                  </div>
                  <p className={cn(
                    "text-3xl sm:text-4xl font-black text-white drop-shadow-lg",
                    phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
                  )}>
                    {phase === "result" ? `Letter ${letter}!` : "Flipping..."}
                  </p>
                  {noRepeat && !allExhausted && phase === "result" && (
                    <p className="text-sm text-white/70">
                      {getPool().length - usedLetters.length} letters remaining
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-bounce">🔤</div>
                  <p className="text-2xl font-bold text-white mb-2">Letter Card Generator</p>
                  <p className="text-white/70 mb-4">
                    {customMode
                      ? `${selectedLetters.size} letters selected · ${caseMode === "upper" ? "Uppercase" : caseMode === "lower" ? "Lowercase" : caseMode === "mixed" ? "aA pairs" : "Random case"}`
                      : noRepeat
                        ? `${getPool().length - usedLetters.length} of ${getPool().length} letters available`
                        : vowelOnly
                          ? `Random vowels (${caseMode === "upper" ? "AEIOU" : caseMode === "lower" ? "aeiou" : caseMode === "mixed" ? "aA eE iI oO uU" : "A?a"})`
                          : `Random ${caseMode === "upper" ? "A-Z" : caseMode === "lower" ? "a-z" : caseMode === "mixed" ? "aA-zZ pairs" : "A?a random case"} flash cards`}
                  </p>
                  <Button
                    onClick={handleGenerate}
                    disabled={allExhausted || (customMode && selectedLetters.size === 0)}
                    size="lg"
                    className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg"
                  >
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Draw a Card!
                  </Button>
                </div>
              )}
            </div>

            {phase === "result" && (
              <>
                <div className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-4 border-white/60 pointer-events-none animate-[glowRingExpand_0.8s_ease-out]" />
                <div className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-2 border-blue-300/60 pointer-events-none animate-[glowRingExpand_1.2s_ease-out_0.15s]" />
              </>
            )}

            <ConfettiOverlay pieces={confetti} />
            <FlashOverlay flash={flash} />
          </div>
        </ShakeWrapper>
      )}

      {(phase === "result" || isBusy) && (
        <div className="flex gap-3 justify-center">
          {isBusy ? (
            <Button disabled size="lg" className="rounded-full px-8 bg-white/30 text-white">
              {phase === "buildup" ? "⚡ Building up..." : "Flipping..."}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleGenerate}
                disabled={allExhausted}
                size="lg"
                className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 shadow-lg"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Next Card
              </Button>
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
                className="rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>
      )}

      {allExhausted && (
        <p className="text-center text-white/70 text-lg font-bold">
          🎉 All letters used! Reset to start again.
        </p>
      )}
    </div>
  );
}

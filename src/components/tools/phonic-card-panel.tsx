"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Play, HelpCircle, CheckCircle2 } from "lucide-react";
import { findPhonicCard } from "@/lib/phonic-cards";
import { cn } from "@/lib/utils";

/* Emoji lookup table — one emoji per anchor word (a–z) */
const WORD_EMOJI: Record<string, string> = {
  apple: "🍎",
  bed: "🛏️",
  car: "🚗",
  dog: "🐶",
  egg: "🥚",
  five: "5️⃣",
  gorilla: "🦍",
  hot: "🔥",
  in: "📥",
  jump: "🤸‍♀️",
  koala: "🐨",
  loud: "🔊",
  moon: "🌙",
  no: "🚫",
  on: "💡",
  panda: "🐼",
  quiet: "🤫",
  run: "🏃",
  sun: "☀️",
  tent: "⛺",
  umbrella: "☂️",
  van: "🚐",
  windy: "💨",
  taxi: "🚕",
  yes: "✅",
  zero: "0️⃣",
};

interface PhonicCardPanelProps {
  letter: string;
  showPhonicCard: boolean;
  showActualCard: boolean;
}

/**
 * PhonicCardPanel — renders alongside the Letter Card Generator.
 *
 * LAYOUT FIXES (v2):
 *  - Card image is now LARGE (same size as the letter card display)
 *  - "Say ..." button (with ellipsis, NOT "Say sun") placed BELOW the card image
 *  - Card image takes full width on mobile, 60% on desktop
 *
 * Two display modes (both can be on simultaneously):
 *  - Digital phonic card: number badge + lowercase/uppercase pair + anchor word
 *    + animated emoji + "Say ..." button (plays /sounds/word-[letter].mp3)
 *  - Physical card section: actual /images/cards/card-[letter].png image (LARGE)
 *    with question (blue) + answer (green) karaoke-style hoverable lines
 *    + sound buttons for word / question / all answers.
 */
export function PhonicCardPanel({
  letter,
  showPhonicCard,
  showActualCard,
}: PhonicCardPanelProps) {
  const card = useMemo(() => findPhonicCard(letter), [letter]);

  // Which answer line is currently being spoken (for karaoke highlight)
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const baseLetter = letter?.charAt(0).toLowerCase() ?? "";
  const wordSoundUrl = `/sounds/word-${baseLetter}.mp3`;
  const questionSoundUrl = `/sounds/question-only-${baseLetter}.mp3`;

  // Split the answer string into individual answer options
  // e.g. "Yes, I do. No, I don't." → ["Yes, I do.", "No, I don't."]
  const answerLines = useMemo(() => {
    if (!card?.cardAnswer) return [] as string[];
    // Split on "." boundaries but keep the trailing punctuation
    const parts = card.cardAnswer
      .split(/\.\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.endsWith(".") ? s : s + "."));
    return parts;
  }, [card]);

  const playAudio = useCallback((url: string) => {
    if (typeof window === "undefined") return;
    try {
      const audio = new Audio(url);
      audio.volume = 0.9;
      void audio.play().catch(() => {
        // File may not exist yet — silently ignore
      });
    } catch {
      /* no-op */
    }
  }, []);

  const speakLine = useCallback((text: string, idx: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      utter.pitch = 1.0;
      utter.onstart = () => setActiveLine(idx);
      utter.onend = () => setActiveLine(null);
      utter.onerror = () => setActiveLine(null);
      window.speechSynthesis.speak(utter);
    } catch {
      setActiveLine(null);
    }
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setActiveLine(null);
  }, []);

  if (!card) {
    return (
      <div className="w-full max-w-md mx-auto p-6 rounded-2xl glass-dark text-center">
        <p className="text-sm text-white/60">No phonic card for “{letter}”.</p>
      </div>
    );
  }

  const emoji = WORD_EMOJI[card.word] ?? "🔤";

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ===== Digital phonic card ===== */}
      {showPhonicCard && (
        <section
          className="relative overflow-hidden rounded-3xl glass-dark p-6 sm:p-8 shadow-xl"
          aria-label="Digital phonic card"
        >
          {/* Decorative glow */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-40"
            style={{ background: card.color }}
            aria-hidden
          />

          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Number badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-white/70">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
              Card #{card.number} · {card.numberWord}
            </div>

            {/* Letter pair + emoji */}
            <div className="flex items-end gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">
                  Lower · Upper
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="text-7xl sm:text-8xl font-black drop-shadow-2xl leading-none"
                    style={{ color: card.color }}
                  >
                    {card.letter}
                  </span>
                  <span className="text-2xl text-white/30 font-black">/</span>
                  <span
                    className="text-7xl sm:text-8xl font-black drop-shadow-2xl leading-none"
                    style={{ color: card.color }}
                  >
                    {card.upper}
                  </span>
                </div>
              </div>
            </div>

            {/* Animated emoji */}
            <div
              className="text-7xl sm:text-8xl select-none animate-[winnerBounce_2.4s_ease-in-out_infinite]"
              aria-hidden
            >
              {emoji}
            </div>

            {/* Anchor word */}
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                Anchor Word
              </p>
              <p className="text-2xl sm:text-3xl font-black text-white drop-shadow">
                {card.word}
              </p>
            </div>

            {/* Say ... button (with ellipsis, not the actual word) */}
            <Button
              onClick={() => playAudio(wordSoundUrl)}
              className="rounded-full px-6 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold"
              size="lg"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Say ...
            </Button>
          </div>
        </section>
      )}

      {/* ===== Physical card section ===== */}
      {showActualCard && (
        <section
          className="relative overflow-hidden rounded-3xl glass-dark p-5 sm:p-6 shadow-xl"
          aria-label="Physical phonic card"
        >
          <div className="flex flex-col lg:flex-row gap-5">
            {/* ===== LARGE Card image + Say ... button below ===== */}
            <div className="flex flex-col items-center gap-4 lg:w-3/5">
              {/* Card image — NOW LARGE (same size as letter card) */}
              <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-white/5 border border-white/15 shadow-2xl">
                <img
                  src={card.cardImage}
                  alt={`Phonic card ${card.letter.toUpperCase()} for ${card.word}`}
                  className="w-full h-auto block select-none"
                  draggable={false}
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-black/60 text-white text-sm font-bold backdrop-blur-sm">
                  {card.letter}/{card.upper}
                </div>
              </div>

              {/* Say ... button — BELOW the card image (with ellipsis, not the word) */}
              <Button
                onClick={() => playAudio(wordSoundUrl)}
                className="rounded-full px-8 py-3 bg-white text-slate-900 hover:bg-white/90 shadow-lg font-bold text-lg"
                size="lg"
              >
                <Volume2 className="mr-2 h-5 w-5" />
                Say ...
              </Button>
            </div>

            {/* Question + Answer */}
            <div className="flex flex-col gap-3 lg:w-2/5 lg:min-w-0">
              {/* Question (blue) */}
              <div className="rounded-2xl bg-blue-500/15 border border-blue-400/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-4 w-4 text-blue-300" />
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200/80">
                    Question
                  </p>
                </div>
                <p className="text-base sm:text-lg font-bold text-white leading-snug mb-3">
                  {card.cardQuestion}
                </p>
                <Button
                  onClick={() => playAudio(questionSoundUrl)}
                  size="sm"
                  className="rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Ask the Question
                </Button>
              </div>

              {/* Answer (green) — karaoke-style hoverable lines */}
              <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-200/80">
                    Answer (hover to hear)
                  </p>
                </div>

                <ul
                  className="flex flex-col gap-1.5"
                  onMouseLeave={stopSpeech}
                >
                  {answerLines.map((line, idx) => (
                    <li
                      key={idx}
                      onMouseEnter={() => speakLine(line, idx)}
                      className={cn(
                        "cursor-pointer rounded-lg px-3 py-2 text-sm sm:text-base font-medium transition-all",
                        activeLine === idx
                          ? "bg-emerald-400/30 text-white scale-[1.02] shadow-md ring-2 ring-emerald-300/60"
                          : "bg-white/5 text-emerald-50/90 hover:bg-emerald-400/20 hover:text-white",
                      )}
                    >
                      <span className="mr-2 text-emerald-300/70 font-bold">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-emerald-200/50 italic">
                  Tip: move your mouse over each line to hear it spoken.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

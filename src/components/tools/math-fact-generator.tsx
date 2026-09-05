"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { Play, RotateCcw, Check, X, Plus, Minus, Calculator, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Operation = "add" | "subtract" | "multiply" | "divide" | "mixed";

interface Fact {
  a: number;
  b: number;
  op: Operation;
  answer: number;
  options: number[];
}

const OP_SYMBOLS: Record<Operation, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

const OP_LABELS: Record<Operation, string> = {
  add: "Addition",
  subtract: "Subtraction",
  multiply: "Multiplication",
  divide: "Division",
};

function generateFact(op: Operation, maxNum: number): Fact {
  let actualOp = op;
  if (op === "mixed") {
    const ops: Operation[] = ["add", "subtract", "multiply", "divide"];
    actualOp = ops[Math.floor(Math.random() * ops.length)];
  }

  let a: number, b: number, answer: number;

  switch (actualOp) {
    case "add":
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
      break;
    case "subtract":
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "multiply":
      // For multiplication, use smaller numbers based on maxNum
      const mulMax = Math.min(maxNum, 12);
      a = Math.floor(Math.random() * mulMax) + 1;
      b = Math.floor(Math.random() * mulMax) + 1;
      answer = a * b;
      break;
    case "divide":
      // Generate clean division
      b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
      answer = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
      a = b * answer;
      break;
  }

  // Generate 4 answer options including the correct one
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const variant = answer + (Math.floor(Math.random() * 7) - 3);
    if (variant >= 0 && variant !== answer) {
      options.add(variant);
    }
  }
  // Shuffle
  const shuffled = Array.from(options).sort(() => Math.random() - 0.5);

  return { a, b, op: actualOp, answer, options: shuffled };
}

export function MathFactGenerator() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const { skinId, setSkinId, skin } = useToolSkin("math-facts");

  const [operation, setOperation] = useState<Operation>("add");
  const [maxNum, setMaxNum] = useState(10);
  const [fact, setFact] = useState<Fact | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "active" | "correct" | "wrong">("idle");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const handleGenerate = useCallback(() => {
    const newFact = generateFact(operation, maxNum);
    setFact(newFact);
    setSelectedAnswer(null);
    setPhase("active");
    sound.playClick();
  }, [operation, maxNum, sound]);

  const handleAnswer = useCallback(
    (answer: number) => {
      if (!fact || phase !== "active") return;
      setSelectedAnswer(answer);
      if (answer === fact.answer) {
        setPhase("correct");
        setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        setStreak((prev) => {
          const newStreak = prev + 1;
          setBestStreak((bp) => Math.max(bp, newStreak));
          return newStreak;
        });
        sound.playReveal();
        flashFn("rgba(16, 185, 129, 0.6)");
        shake(1);
        burstConfetti(60, 50, 40);
      } else {
        setPhase("wrong");
        setScore((prev) => ({ ...prev, total: prev.total + 1 }));
        setStreak(0);
        sound.playExplosion();
        flashFn("rgba(239, 68, 68, 0.5)");
        shake(1.5);
      }
    },
    [fact, phase, sound, flashFn, shake, burstConfetti],
  );

  const handleNext = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleReset = useCallback(() => {
    setFact(null);
    setSelectedAnswer(null);
    setPhase("idle");
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setBestStreak(0);
    sound.playClick();
  }, [sound]);

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const showResult = phase === "correct" || phase === "wrong";

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Operation + difficulty selector */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex gap-1 flex-wrap justify-center">
          {(Object.keys(OP_LABELS) as Operation[]).map((op) => (
            <button
              key={op}
              onClick={() => { setOperation(op); setFact(null); setPhase("idle"); }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-bold border transition-all",
                operation === op
                  ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                  : "bg-white/10 text-white border-white/25 hover:bg-white/20",
              )}
            >
              {OP_LABELS[op]} {op !== "mixed" && OP_SYMBOLS[op]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Max:</span>
        <button
          onClick={() => setMaxNum(Math.max(5, maxNum - 5))}
          className="w-8 h-8 rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20 flex items-center justify-center"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="text-xl font-black text-white w-10 text-center">{maxNum}</span>
        <button
          onClick={() => setMaxNum(Math.min(100, maxNum + 5))}
          className="w-8 h-8 rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20 flex items-center justify-center"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Score bar */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 shadow-lg">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Score</p>
            <p className="text-xl font-black text-emerald-400">{score.correct}/{score.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Accuracy</p>
            <p className="text-xl font-black text-cyan-400">{accuracy}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Streak</p>
            <p className="text-xl font-black text-yellow-400">🔥 {streak}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">Best</p>
            <p className="text-xl font-black text-orange-400">⭐ {bestStreak}</p>
          </div>
        </div>
        {(score.total > 0) && (
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      <ShakeWrapper intensity={shakeIntensity}>
        <div className={cn(
          "relative w-full max-w-md mx-auto min-h-72 sm:h-80 rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br",
          skin.bgGradient,
        )}>
          {/* Sparkles */}
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

          {fact ? (
            <div className="relative z-10 text-center w-full">
              {/* Math problem */}
              <div className="mb-6">
                <div className={cn(
                  "text-6xl sm:text-7xl font-black text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]",
                  phase === "correct" && "animate-[revealPulse_0.6s_ease-out] text-emerald-300",
                  phase === "wrong" && "animate-[vibrate_0.2s_linear]",
                )}>
                  {fact.a} {OP_SYMBOLS[fact.op]} {fact.b} = ?
                </div>
              </div>

              {/* Answer options */}
              <div className="grid grid-cols-2 gap-3">
                {fact.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === fact.answer;

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={showResult}
                      className={cn(
                        "py-4 rounded-2xl text-3xl font-black border-2 transition-all",
                        !showResult && "bg-white/15 text-white border-white/30 hover:bg-white/25 hover:scale-105",
                        showResult && isCorrect && "bg-emerald-500 text-white border-emerald-300 scale-105 animate-[revealPulse_0.5s_ease-out]",
                        showResult && isSelected && !isCorrect && "bg-red-500 text-white border-red-300",
                        showResult && !isCorrect && !isSelected && "bg-white/5 text-white/40 border-white/10",
                      )}
                    >
                      {option}
                      {showResult && isCorrect && <Check className="inline ml-2 h-6 w-6" />}
                      {showResult && isSelected && !isCorrect && <X className="inline ml-2 h-6 w-6" />}
                    </button>
                  );
                })}
              </div>

              {/* Next button */}
              {showResult && (
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="mt-6 rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Next Question
                </Button>
              )}
            </div>
          ) : (
            // Idle display
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-4 animate-bounce">🧮</div>
              <p className="text-2xl font-bold text-white mb-2">
                Math Fact Generator
              </p>
              <p className="text-white/70 mb-4">
                {OP_LABELS[operation]} · Max {maxNum}
              </p>
              <Button
                onClick={handleGenerate}
                size="lg"
                className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start!
              </Button>
            </div>
          )}

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Quick controls */}
      {fact && phase === "active" && (
        <Button
          onClick={handleNext}
          variant="outline"
          className="bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
        >
          Skip Question
        </Button>
      )}
    </div>
  );
}

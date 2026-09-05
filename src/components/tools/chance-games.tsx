"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDramaticSound, useConfetti, useFlash, useScreenShake } from "@/hooks/use-effects";
import { ConfettiOverlay, FlashOverlay, ShakeWrapper } from "@/components/effects/effect-overlays";
import { Dices, Coins, Sparkles, RotateCcw, HelpCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToolSkin } from "@/hooks/use-tool-skin";
import { UniversalSkinPicker } from "./universal-skin-picker";
import { SkinParticleField, SkinSceneDecorator } from "@/lib/skins";

type GameType = "coin" | "dice" | "wheel" | "ball";

// High-contrast alternating colors — no two adjacent segments share a hue family
const WHEEL_OPTIONS = [
  { label: "Red", color: "#dc2626" },
  { label: "Yellow", color: "#facc15" },
  { label: "Blue", color: "#2563eb" },
  { label: "Green", color: "#16a34a" },
  { label: "Orange", color: "#ea580c" },
  { label: "Purple", color: "#9333ea" },
  { label: "Cyan", color: "#0891b2" },
  { label: "Pink", color: "#db2777" },
];

/** Pick a readable text color (black or white) based on segment background luminance */
function readableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#0f172a" : "#ffffff";
}

const BALL_RESPONSES = [
  "Yes! ✅", "No! ❌", "Maybe... 🤔", "Definitely! 💯",
  "Ask again 🔄", "Not sure 🤷", "Absolutely! 🌟", "Doubtful 😐",
  "Yes, definitely! 🎉", "Very doubtful 😬", "Signs point to yes 👆",
  "Outlook good 📈", "Better not tell you now 🤐", "Cannot predict now 🔮",
  "Concentrate and ask again 🧘", "My reply is no 🚫",
];

// SVG dice face positions for each value (1-6)
// Each array contains [x, y] positions for the pips on a 100x100 grid
const DICE_PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
};

function DiceFace({ value, className }: { value: number; className?: string }) {
  const pips = DICE_PIP_POSITIONS[value] || DICE_PIP_POSITIONS[1];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-label={`Dice showing ${value}`}>
      {/* Rounded dice background */}
      <rect x="5" y="5" width="90" height="90" rx="18" ry="18" fill="url(#diceGrad)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <defs>
        <linearGradient id="diceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      {/* Pips */}
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#1e293b" />
      ))}
    </svg>
  );
}

export function ChanceGames() {
  const sound = useDramaticSound();
  const { pieces: confetti, burst: burstConfetti } = useConfetti();
  const { flash, flashFn } = useFlash();
  const { shakeIntensity, shake } = useScreenShake();
  const { skinId, setSkinId, skin } = useToolSkin("chance-games");

  const [game, setGame] = useState<GameType>("dice");
  const [phase, setPhase] = useState<"idle" | "buildup" | "spinning" | "result">("idle");
  const [result, setResult] = useState<string | null>(null);

  // Coin state
  const [coinFace, setCoinFace] = useState<"heads" | "tails">("heads");

  // Dice state
  const [diceValue, setDiceValue] = useState(1);
  const [noRepeatMode, setNoRepeatMode] = useState(false);
  const [usedDiceNumbers, setUsedDiceNumbers] = useState<number[]>([]);
  const [diceRange, setDiceRange] = useState<"all" | "low" | "high">("all");

  const getDicePool = useCallback(() => {
    if (diceRange === "low") return [1, 2, 3];
    if (diceRange === "high") return [4, 5, 6];
    return [1, 2, 3, 4, 5, 6];
  }, [diceRange]);

  // Wheel state
  const [wheelRotation, setWheelRotation] = useState(0);

  // Ball state
  const [ballResponse, setBallResponse] = useState<string | null>(null);

  // Letter state
  const [letterValue, setLetterValue] = useState("A");
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePlay = useCallback(() => {
    if (phase === "buildup" || phase === "spinning") return;

    // Phase 1: Build-up (1.5s of tension)
    setPhase("buildup");
    setResult(null);
    setBallResponse(null);
    sound.playBuildUp();

    setTimeout(() => {
      // Phase 2: Spinning/animation
      setPhase("spinning");
      startGameAnimation();
    }, 1500);
     
  }, [phase, game, sound]);

  const startGameAnimation = useCallback(() => {
    if (game === "coin") {
      // Rapid flip
      sound.playCoinFlip();
      let ticks = 0;
      spinRef.current = setInterval(() => {
        setCoinFace((prev) => (prev === "heads" ? "tails" : "heads"));
        if (ticks % 3 === 0) sound.playTick(600 + ticks * 8);
        ticks++;
        if (ticks >= 24) {
          if (spinRef.current) clearInterval(spinRef.current);
          const final = Math.random() < 0.5 ? "heads" : "tails";
          setCoinFace(final);
          setResult(final === "heads" ? "HEADS" : "TAILS");
          finishGame();
        }
      }, 80);
    } else if (game === "dice") {
      // Dice tumble with clatter
      sound.playDiceRoll();
      const pool = getDicePool();
      let ticks = 0;
      spinRef.current = setInterval(() => {
        setDiceValue(pool[Math.floor(Math.random() * pool.length)]);
        if (ticks % 2 === 0) sound.playTick(400 + ticks * 15);
        ticks++;
        if (ticks >= 18) {
          if (spinRef.current) clearInterval(spinRef.current);
          let final: number;
          if (noRepeatMode) {
            const available = pool.filter((n) => !usedDiceNumbers.includes(n));
            if (available.length === 0) {
              final = pool[Math.floor(Math.random() * pool.length)];
              setUsedDiceNumbers([final]);
            } else {
              final = available[Math.floor(Math.random() * available.length)];
              setUsedDiceNumbers((prev) => [...prev, final]);
            }
          } else {
            final = pool[Math.floor(Math.random() * pool.length)];
          }
          setDiceValue(final);
          setResult(String(final));
          finishGame();
        }
      }, 90);
    } else if (game === "wheel") {
      // Wheel spin
      sound.playWhoosh();
      const spins = 5 + Math.random() * 3;
      const finalAngle = spins * 360 + Math.random() * 360;
      setWheelRotation((prev) => prev + finalAngle);

      // Tick sounds during spin
      let tickCount = 0;
      const tickInterval = setInterval(() => {
        sound.playWheelTick();
        tickCount++;
        if (tickCount > 30) clearInterval(tickInterval);
      }, 80);

      setTimeout(() => {
        clearInterval(tickInterval);
        const segment = 360 / WHEEL_OPTIONS.length;
        const normalized = ((finalAngle % 360) + 360) % 360;
        const idx = Math.floor((360 - normalized) / segment) % WHEEL_OPTIONS.length;
        setResult(WHEEL_OPTIONS[idx].label);
        finishGame(WHEEL_OPTIONS[idx].color);
      }, 3500);
    } else if (game === "ball") {
      // Magic 8-ball shake
      let ticks = 0;
      spinRef.current = setInterval(() => {
        setBallResponse(BALL_RESPONSES[Math.floor(Math.random() * BALL_RESPONSES.length)]);
        sound.playTick(300 + ticks * 10);
        ticks++;
        if (ticks >= 18) {
          if (spinRef.current) clearInterval(spinRef.current);
          const final = BALL_RESPONSES[Math.floor(Math.random() * BALL_RESPONSES.length)];
          setBallResponse(final);
          setResult(final);
          finishGame();
        }
      }, 90);
    }
  }, [game, sound, noRepeatMode, usedDiceNumbers, getDicePool]);

  const finishGame = useCallback(
    (color?: string) => {
      setPhase("result");
      sound.playReveal();
      flashFn(color ? hexToRgba(color, 0.7) : "rgba(255, 215, 0, 0.7)");
      shake(2);
      burstConfetti(80, 50, 40);
      setTimeout(() => burstConfetti(50, 30, 50), 300);
    },
    [sound, flashFn, shake, burstConfetti],
  );

  const handleReset = useCallback(() => {
    if (spinRef.current) clearInterval(spinRef.current);
    setPhase("idle");
    setResult(null);
    setBallResponse(null);
    sound.playClick();
  }, [sound]);

  const handleGameChange = (newGame: GameType) => {
    if (spinRef.current) clearInterval(spinRef.current);
    setGame(newGame);
    setPhase("idle");
    setResult(null);
    setBallResponse(null);
    sound.playClick();
  };

  const handleResetDiceHistory = () => {
    setUsedDiceNumbers([]);
    sound.playClick();
  };

  const isBusy = phase === "buildup" || phase === "spinning";

  const games: { id: GameType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "dice", label: "Dice Roll", icon: <Dices className="h-5 w-5" />, color: "from-red-500 to-rose-600" },
    { id: "wheel", label: "Colour Wheel", icon: <Sparkles className="h-5 w-5" />, color: "from-purple-500 to-fuchsia-600" },
    { id: "ball", label: "Magic 8-Ball", icon: <HelpCircle className="h-5 w-5" />, color: "from-slate-700 to-slate-900" },
    { id: "coin", label: "Coin Flip", icon: <Coins className="h-5 w-5" />, color: "from-amber-500 to-yellow-600" },
  ];

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <UniversalSkinPicker current={skinId} onChange={setSkinId} />

      {/* Game selector */}
      <div className="flex gap-2 flex-wrap justify-center">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGameChange(g.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all",
              game === g.id
                ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                : "bg-white/10 text-white border-white/25 hover:bg-white/20",
            )}
          >
            {g.icon}
            {g.label}
          </button>
        ))}
      </div>

      {/* Dice controls: range selector + no-repeat toggle */}
      {game === "dice" && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Range selector */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white/80 uppercase tracking-wider mr-1">Range:</span>
            {([
              { id: "all" as const, label: "1-6" },
              { id: "low" as const, label: "1-3" },
              { id: "high" as const, label: "4-6" },
            ]).map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setDiceRange(r.id);
                  setUsedDiceNumbers([]);
                  sound.playClick();
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                  diceRange === r.id
                    ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                    : "bg-white/10 text-white border-white/25 hover:bg-white/20",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setNoRepeatMode(!noRepeatMode);
              setUsedDiceNumbers([]);
              sound.playClick();
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all",
              noRepeatMode
                ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/50"
                : "bg-white/10 text-white border-white/25 hover:bg-white/20",
            )}
          >
            {noRepeatMode && <Check className="h-4 w-4" />}
            No-Repeat Mode
          </button>
          {noRepeatMode && (
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <span>Used:</span>
              <div className="flex gap-1">
                {getDicePool().map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border",
                      usedDiceNumbers.includes(n)
                        ? "bg-emerald-500/40 text-emerald-200 border-emerald-400/50 line-through"
                        : "bg-white/10 text-white/60 border-white/20",
                    )}
                  >
                    {n}
                  </span>
                ))}
              </div>
              {usedDiceNumbers.length > 0 && (
                <button
                  onClick={handleResetDiceHistory}
                  className="text-xs text-white/50 hover:text-white underline ml-1"
                >
                  reset
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <ShakeWrapper intensity={shakeIntensity}>
        <div className="relative w-full max-w-2xl mx-auto h-[28rem] sm:h-[34rem] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex flex-col items-center justify-center p-6 bg-gradient-to-br">
          <div className={cn("absolute inset-0 bg-gradient-to-br", skin.bgGradient)} />
          {/* Themed particles */}
          <SkinParticleField skin={skin} seed={7} />
          {/* Scene decorator */}
          <SkinSceneDecorator skin={skin} />

          {/* Build-up pulsing glow ring */}
          {phase === "buildup" && (
            <>
              <div className="absolute inset-0 bg-white/10 animate-[buildUpPulse_0.6s_ease-in-out_infinite]" />
              <div className="absolute inset-8 rounded-full border-4 border-white/40 animate-[buildUpPulse_0.8s_ease-in-out_infinite]" />
              <div className="absolute inset-16 rounded-full border-4 border-white/30 animate-[buildUpPulse_1s_ease-in-out_0.2s_infinite]" />
            </>
          )}

          {/* Sparkle particles */}
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

          {/* Game display */}
          <div className="relative z-10 text-center">
            {game === "coin" && (
              <CoinDisplay
                face={coinFace}
                phase={phase}
                result={result}
              />
            )}

            {game === "dice" && (
              <DiceDisplay
                value={diceValue}
                phase={phase}
                result={result}
                noRepeatMode={noRepeatMode}
                usedNumbers={usedDiceNumbers}
              />
            )}

            {game === "wheel" && (
              <WheelDisplay
                rotation={wheelRotation}
                phase={phase}
                result={result}
                spinning={phase === "spinning"}
              />
            )}

            {game === "ball" && (
              <BallDisplay
                response={ballResponse}
                phase={phase}
                result={result}
              />
            )}

          </div>

          {/* Result reveal glow ring */}
          {phase === "result" && (
            <>
              <div className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-4 border-white/60 pointer-events-none animate-[glowRingExpand_0.8s_ease-out]" />
              <div className="absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-2 border-yellow-300/60 pointer-events-none animate-[glowRingExpand_1.2s_ease-out_0.15s]" />
            </>
          )}

          <ConfettiOverlay pieces={confetti} />
          <FlashOverlay flash={flash} />
        </div>
      </ShakeWrapper>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {phase === "idle" && (
          <Button
            onClick={handlePlay}
            size="lg"
            className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {game === "coin" ? "Flip Coin" : game === "dice" ? "Roll Dice" : game === "wheel" ? "Spin Wheel" : "Shake Ball"}
          </Button>
        )}
        {isBusy && (
          <Button disabled size="lg" className="rounded-full px-8 bg-white/30 text-white">
            {phase === "buildup" ? "⚡ Building up..." : "Spinning..."}
          </Button>
        )}
        {phase === "result" && (
          <div className="flex gap-3">
            <Button
              onClick={handlePlay}
              size="lg"
              className="rounded-full px-8 bg-white text-slate-900 hover:bg-white/90 shadow-lg text-lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Next
            </Button>
            <Button
              onClick={handleReset}
              size="lg"
              variant="outline"
              className="rounded-full px-6 bg-white/10 text-white border-white/25 hover:bg-white/20 hover:text-white"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   COIN DISPLAY
   ============================================================ */
function CoinDisplay({ face, phase, result }: { face: "heads" | "tails"; phase: string; result: string | null }) {
  return (
    <>
      <div
        className={cn(
          "mx-auto mb-6 w-52 h-52 sm:w-64 sm:h-64 rounded-full flex items-center justify-center text-8xl sm:text-9xl font-black shadow-2xl border-4 relative",
          phase === "spinning" && "animate-[coinFlip3D_1.8s_linear]",
          phase === "buildup" && "animate-[buildUpPulse_0.5s_ease-in-out_infinite] scale-90",
          phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
          face === "heads"
            ? "bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-amber-900 border-yellow-200"
            : "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-orange-100 border-amber-300",
        )}
        style={{ perspective: "600px" }}
      >
        {/* Inner ring detail */}
        <div className="absolute inset-3 rounded-full border-2 border-current opacity-30" />
        <div className="absolute inset-6 rounded-full border-2 border-current opacity-20" />
        {/* Shine */}
        <div className="absolute top-4 left-6 w-12 h-6 rounded-full bg-white/40 blur-sm" />
        <span className="relative drop-shadow-lg">{face === "heads" ? "H" : "T"}</span>
      </div>
      <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
        {result ? result : phase === "buildup" ? "Get ready..." : phase === "spinning" ? "Flipping..." : "Ready?"}
      </p>
    </>
  );
}

/* ============================================================
   DICE DISPLAY
   ============================================================ */
function DiceDisplay({
  value,
  phase,
  result,
  noRepeatMode,
  usedNumbers,
}: {
  value: number;
  phase: string;
  result: string | null;
  noRepeatMode: boolean;
  usedNumbers: number[];
}) {
  const allExhausted = noRepeatMode && usedNumbers.length >= 6;
  return (
    <>
      <div
        className={cn(
          "mx-auto mb-6 w-52 h-52 sm:w-64 sm:h-64 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white relative overflow-hidden",
          phase === "spinning" && "animate-[diceTumble_0.3s_linear_infinite]",
          phase === "buildup" && "animate-[vibrate_0.1s_linear_infinite] scale-90",
          phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
        )}
      >
        {/* SVG Dice face */}
        <DiceFace value={value} className="w-full h-full" />
        {/* Shine overlay */}
        <div className="absolute top-4 left-6 w-16 h-8 rounded-full bg-white/50 blur-sm pointer-events-none" />
      </div>
      <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
        {allExhausted
          ? "🎉 All numbers rolled! Reset to continue"
          : result
            ? `Rolled ${result}!`
            : phase === "buildup"
              ? "Get ready..."
              : phase === "spinning"
                ? "Rolling..."
                : "Ready?"}
      </p>
      {noRepeatMode && !allExhausted && (
        <p className="text-base text-white/70 mt-2">
          {6 - usedNumbers.length} numbers remaining
        </p>
      )}
    </>
  );
}

/* ============================================================
   WHEEL DISPLAY
   ============================================================ */
function WheelDisplay({
  rotation,
  phase,
  result,
  spinning,
}: {
  rotation: number;
  phase: string;
  result: string | null;
  spinning: boolean;
}) {
  return (
    <>
      <div className={cn("relative mx-auto mb-6 w-72 h-72 sm:w-80 sm:h-80", phase === "buildup" && "animate-[buildUpPulse_0.6s_ease-in-out_infinite]")}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-5xl drop-shadow-lg">
          🔻
        </div>
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full shadow-[0_0_60px_rgba(255,255,255,0.4)]" />
        {/* Wheel */}
        <div
          className="w-full h-full rounded-full border-8 border-white shadow-2xl relative overflow-hidden"
          style={{
            background: `conic-gradient(${WHEEL_OPTIONS.map((o, i) => {
              const start = (i / WHEEL_OPTIONS.length) * 360;
              const end = ((i + 1) / WHEEL_OPTIONS.length) * 360;
              return `${o.color} ${start}deg ${end}deg`;
            }).join(", ")})`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {/* Segment labels */}
          {WHEEL_OPTIONS.map((o, i) => {
            const angle = (i / WHEEL_OPTIONS.length) * 360 + (360 / WHEEL_OPTIONS.length) / 2;
            const textColor = readableTextColor(o.color);
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left font-bold text-sm"
                style={{
                  color: textColor,
                  transform: `rotate(${angle}deg) translateX(56px)`,
                  textShadow: textColor === "#ffffff" ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
                }}
              >
                {o.label}
              </div>
            );
          })}
        </div>
        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-lg border-4 border-slate-300 flex items-center justify-center text-2xl">
          🎯
        </div>
      </div>
      <p className={cn(
        "text-3xl sm:text-4xl font-black text-white drop-shadow-lg",
        phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
      )}>
        {result ? `${result}!` : phase === "buildup" ? "Get ready..." : spinning ? "Spinning..." : "Ready?"}
      </p>
    </>
  );
}

/* ============================================================
   MAGIC 8-BALL DISPLAY
   ============================================================ */
function BallDisplay({
  response,
  phase,
  result,
}: {
  response: string | null;
  phase: string;
  result: string | null;
}) {
  return (
    <>
      <div
        className={cn(
          "mx-auto mb-4 w-[18rem] h-[18rem] sm:w-[26rem] sm:h-[26rem] rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center shadow-2xl border-4 border-slate-600 relative",
          phase === "spinning" && "animate-[ballShake_0.15s_ease-in-out_infinite]",
          phase === "buildup" && "animate-[buildUpPulse_0.5s_ease-in-out_infinite] scale-90",
          phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
        )}
      >
        {/* Shine */}
        <div className="absolute top-8 left-12 w-24 h-12 rounded-full bg-white/20 blur-sm" />
        {/* Blue answer window — large, fills most of the ball */}
        <div className="w-[14rem] h-[14rem] sm:w-[20rem] sm:h-[20rem] rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-6 border-4 border-blue-300/40 shadow-inner">
          <span className="text-white text-3xl sm:text-5xl font-bold text-center leading-tight drop-shadow-lg">
            {response ?? "8"}
          </span>
        </div>
      </div>
      <p className={cn(
        "text-2xl sm:text-3xl font-black text-white drop-shadow-lg",
        phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
      )}>
        {result ? result : phase === "buildup" ? "Concentrate..." : phase === "spinning" ? "Shaking..." : "Ask a question!"}
      </p>
    </>
  );
}

/* ============================================================
   LETTER FLASH CARD DISPLAY
   ============================================================ */
function LetterDisplay({
  letter,
  phase,
  result,
}: {
  letter: string;
  phase: string;
  result: string | null;
}) {
  return (
    <>
      <div
        className={cn(
          "mx-auto mb-6 w-56 h-72 sm:w-72 sm:h-96 rounded-3xl bg-gradient-to-br from-white to-slate-100 flex items-center justify-center shadow-2xl border-4 border-white relative",
          phase === "spinning" && "animate-[vibrate_0.08s_linear_infinite]",
          phase === "buildup" && "animate-[buildUpPulse_0.5s_ease-in-out_infinite] scale-90",
          phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
        )}
      >
        {/* Card frame */}
        <div className="absolute inset-3 rounded-2xl border-4 border-blue-500/30" />
        <div className="absolute inset-5 rounded-xl border-2 border-blue-400/20" />
        {/* Corner decorations */}
        <div className="absolute top-3 left-4 text-blue-500/30 text-sm font-bold">{letter}</div>
        <div className="absolute bottom-3 right-4 text-blue-500/30 text-sm font-bold rotate-180">{letter}</div>
        {/* Big letter */}
        <span className="relative text-[10rem] sm:text-[14rem] font-black text-blue-600 drop-shadow-2xl">
          {letter}
        </span>
        {/* Shine */}
        <div className="absolute top-6 left-8 w-16 h-8 rounded-full bg-white/50 blur-sm" />
      </div>
      <p className={cn(
        "text-3xl sm:text-4xl font-black text-white drop-shadow-lg",
        phase === "result" && "animate-[revealPulse_0.6s_ease-out]",
      )}>
        {result ? `Letter ${result}!` : phase === "buildup" ? "Get ready..." : phase === "spinning" ? "Flipping..." : "Ready?"}
      </p>
    </>
  );
}

/* Helper: hex to rgba */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

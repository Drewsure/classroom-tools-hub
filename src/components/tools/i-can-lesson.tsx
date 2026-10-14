"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Layers, RotateCcw } from "lucide-react";
import { I_CAN_SONG } from "@/lib/i-can-cards";

export function ICanLesson({ card, index, total, onPrevious, onNext, onFirst, onCardSets }: {
  card: { label: string; image: string }; index: number; total: number;
  onPrevious: () => void; onNext: () => void; onFirst: () => void; onCardSets: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lessonRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);
  useEffect(() => {
    const lesson = lessonRef.current;
    const launcher = lesson?.closest<HTMLElement>(".tool-launcher");
    const shell = lesson?.closest<HTMLElement>(".active-tool-shell");
    const header = launcher?.querySelector<HTMLElement>("header");
    const previousMinHeight = shell?.style.minHeight ?? "";
    if (shell) shell.style.minHeight = "0";
    const resize = () => {
      const height = Math.min(window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
      if (lesson) {
        lesson.style.height = Math.max(200, height - (header?.getBoundingClientRect().height ?? 120) - 24) + "px";
        lesson.style.minHeight = "200px";
      }
    };
    resize();
    launcher?.scrollTo({ top: 0 });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (header) observer?.observe(header);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    return () => {
      if (shell) shell.style.minHeight = previousMinHeight;
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <section ref={lessonRef} className="i-can-lesson" aria-label="I Can lesson">
      <div className="min-h-0 min-w-0">
        <img src={card.image} alt={card.label} className="h-full w-full object-contain" draggable={false} />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-2">
        <p className="m-0 text-center text-base font-black text-white" aria-live="polite">Card {index + 1} / {total}</p>
        <audio ref={audioRef} controls preload="metadata" src={I_CAN_SONG.src} aria-label="I Can song" className="h-12 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <button onClick={onPrevious} aria-label="Previous card" title="Previous card" className="classroom-control-button grid h-11 place-items-center rounded-lg"><ChevronLeft /></button>
          <button onClick={onFirst} aria-label="First card" title="First card" className="classroom-control-button grid h-11 place-items-center rounded-lg"><RotateCcw /></button>
          <button onClick={onNext} aria-label="Next card" title="Next card" className="grid h-11 place-items-center rounded-lg border border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-800"><ChevronRight /></button>
        </div>
        <button onClick={onCardSets} className="classroom-control-button flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold"><Layers size={18} /> Card sets</button>
      </div>
    </section>
  );
}

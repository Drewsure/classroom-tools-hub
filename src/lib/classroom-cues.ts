export const TIMER_VOICE_CUES: Record<number, string> = {
  60: "timer-60.wav",
  45: "timer-45.wav",
  30: "timer-30.wav",
};

export const ELAPSED_VOICE_CUES: Record<number, string> = {
  60: "elapsed-60.wav",
  45: "elapsed-45.wav",
  30: "elapsed-30.wav",
};

export const TIMER_FINISH_CUES: Record<string, string> = {
  classic: "classic-finish.wav",
  rocket: "rocket-finish.wav",
  bomb: "bomb-finish.wav",
  candle: "candle-finish.wav",
  hourglass: "hourglass-finish.wav",
  circle: "circle-finish.wav",
  "snail-race": "cheer.mp3",
  snail: "cheer.mp3",
  "traffic-light": "traffic-finish.wav",
  traffic: "traffic-finish.wav",
  bar: "bar-finish.wav",
  pe: "pe-finish.wav",
  tally: "tally-finish.wav",
};

export const INTERACTION_CUES = {
  cards: "card-shuffle.wav",
  cardTurn: "card-turn.wav",
  dice: "dice-roll.wav",
  lap: "stopwatch-lap.wav",
};

export const CLASSROOM_CUE_FILES = [...new Set([
  ...Object.values(TIMER_VOICE_CUES),
  ...Object.values(ELAPSED_VOICE_CUES),
  ...Object.values(TIMER_FINISH_CUES),
  ...Object.values(INTERACTION_CUES),
  ...Array.from({ length: 10 }, (_, i) => `countdown-${i + 1}.mp3`),
])];

export type CueDirection = "down" | "up";

export class TimerMilestones {
  private previous: number | null = null;
  private played = new Set<number>();

  reset() {
    this.previous = null;
    this.played.clear();
  }

  update(seconds: number, running: boolean, direction: CueDirection = "down") {
    if (!Number.isFinite(seconds)) return null;
    const value = Math.max(0, Math.floor(seconds));
    const previous = this.previous;
    if (previous !== null && (direction === "down" ? value > previous : value < previous)) this.reset();
    this.previous = value;
    if (!running) return null;
    const thresholds = direction === "down" ? [60, 45, 30] : [30, 45, 60];
    const crossed = thresholds.filter((threshold) => !this.played.has(threshold) &&
      (value === threshold || (previous !== null && (direction === "down"
        ? previous > threshold && value < threshold
        : previous < threshold && value > threshold))));
    // A delayed background tick may cross several marks; only announce the nearest.
    crossed.forEach((threshold) => this.played.add(threshold));
    const nearest = crossed.at(-1);
    return nearest !== undefined && value > 0 && Math.abs(value - nearest) <= 2 ? nearest : null;
  }
}

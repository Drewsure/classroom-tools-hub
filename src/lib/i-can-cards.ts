export const I_CAN_SONG = {
  title: "I Can! - Ministar English",
  src: "/sounds/ministar-i-can.mp3",
};

export const I_CAN_CARDS = [
  { id: "jump", label: "I can jump!", word: "jump", image: "/images/i-can/flashcard_jump.png", type: "custom" as const },
  { id: "run", label: "I can run!", word: "run", image: "/images/i-can/flashcard_run.png", type: "custom" as const },
  { id: "stretch", label: "I can stretch!", word: "stretch", image: "/images/i-can/flashcard_stretch.png", type: "custom" as const },
  { id: "spin", label: "I can spin!", word: "spin", image: "/images/i-can/flashcard_spin.png", type: "custom" as const },
  { id: "walk", label: "I can walk!", word: "walk", image: "/images/i-can/flashcard_walk.png", type: "custom" as const },
  { id: "cook", label: "I can cook!", word: "cook", image: "/images/i-can/flashcard_cook.png", type: "custom" as const },
  { id: "climb", label: "I can climb!", word: "climb", image: "/images/i-can/flashcard_climb.png", type: "custom" as const },
  { id: "sing", label: "I can sing!", word: "sing", image: "/images/i-can/flashcard_sing.png", type: "custom" as const },
  { id: "dance", label: "I can dance!", word: "dance", image: "/images/i-can/flashcard_dance.png", type: "custom" as const },
  { id: "swim", label: "I can swim!", word: "swim", image: "/images/i-can/flashcard_swim.png", type: "custom" as const },
  { id: "do-it-all", label: "I can do it all!", word: "do-it-all", image: "/images/i-can/flashcard_bonus_do_it_all.png", type: "custom" as const },
];

const firstVerse = ["jump", "run", "stretch", "spin"];
const secondVerse = ["walk", "cook", "climb", "sing"];
// Manual song cue order from the supplied lyrics, not guessed audio timestamps.
export const I_CAN_SONG_ORDER = [
  ...firstVerse, ...firstVerse, ...firstVerse,
  ...secondVerse, ...secondVerse, ...secondVerse,
  ...firstVerse, ...secondVerse, ...firstVerse, ...secondVerse,
];

export const I_CAN_SONG_CARDS = I_CAN_SONG_ORDER.map((id, index) => ({
  ...I_CAN_CARDS.find((card) => card.id === id)!,
  id: `cue-${index + 1}-${id}`,
}));

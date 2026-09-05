// Complete phonic card data for all 26 letters
// Each card has a unique Q&A question extracted from the PDF

export interface PhonicCard {
  letter: string;
  upper: string;
  word: string;
  numberWord: string;
  number: number;
  color: string;
  cardImage: string;
  cardQuestion: string;
  cardAnswer: string;
}

export const PHONIC_CARDS: PhonicCard[] = [
  { letter: "a", upper: "A", word: "apple", numberWord: "one", number: 1, color: "#dc2626", cardImage: "/images/cards/card-a.png", cardQuestion: "How are you?", cardAnswer: "I'm good. I'm fine. I'm okay." },
  { letter: "b", upper: "B", word: "bed", numberWord: "one", number: 1, color: "#2563eb", cardImage: "/images/cards/card-b.png", cardQuestion: "What is your name?", cardAnswer: "My name is ..." },
  { letter: "c", upper: "C", word: "car", numberWord: "one", number: 1, color: "#16a34a", cardImage: "/images/cards/card-c.png", cardQuestion: "How old are you?", cardAnswer: "I'm ... years old." },
  { letter: "d", upper: "D", word: "dog", numberWord: "one", number: 1, color: "#ea580c", cardImage: "/images/cards/card-d.png", cardQuestion: "How's the weather?", cardAnswer: "It's ... today." },
  { letter: "e", upper: "E", word: "egg", numberWord: "two", number: 2, color: "#f59e0b", cardImage: "/images/cards/card-e.png", cardQuestion: "Can you ...?", cardAnswer: "Yes, I can. No, I can't." },
  { letter: "f", upper: "F", word: "five", numberWord: "two", number: 2, color: "#7c3aed", cardImage: "/images/cards/card-f.png", cardQuestion: "Do you like ...?", cardAnswer: "Yes, I do. No, I don't." },
  { letter: "g", upper: "G", word: "gorilla", numberWord: "two", number: 2, color: "#475569", cardImage: "/images/cards/card-g.png", cardQuestion: "Do you like animals?", cardAnswer: "Yes, I do. No, I don't." },
  { letter: "h", upper: "H", word: "hot", numberWord: "two", number: 2, color: "#ef4444", cardImage: "/images/cards/card-h.png", cardQuestion: "What is your favorite vegetable?", cardAnswer: "I like ... best." },
  { letter: "i", upper: "I", word: "in", numberWord: "three", number: 3, color: "#0891b2", cardImage: "/images/cards/card-i.png", cardQuestion: "Do you have any pets?", cardAnswer: "Yes, I do. No, I don't." },
  { letter: "j", upper: "J", word: "jump", numberWord: "three", number: 3, color: "#db2777", cardImage: "/images/cards/card-j.png", cardQuestion: "Do you have a pen?", cardAnswer: "Yes, I do. No, I don't." },
  { letter: "k", upper: "K", word: "koala", numberWord: "three", number: 3, color: "#65a30d", cardImage: "/images/cards/card-k.png", cardQuestion: "What vegetables do you like?", cardAnswer: "I like ..." },
  { letter: "l", upper: "L", word: "loud", numberWord: "three", number: 3, color: "#9333ea", cardImage: "/images/cards/card-l.png", cardQuestion: "What sports do you like?", cardAnswer: "I like ... and ..." },
  { letter: "m", upper: "M", word: "moon", numberWord: "four", number: 4, color: "#1e40af", cardImage: "/images/cards/card-m.png", cardQuestion: "What sport do you play?", cardAnswer: "I play ..." },
  { letter: "n", upper: "N", word: "no", numberWord: "four", number: 4, color: "#dc2626", cardImage: "/images/cards/card-n.png", cardQuestion: "How many ... are there?", cardAnswer: "There are ..." },
  { letter: "o", upper: "O", word: "on", numberWord: "four", number: 4, color: "#f59e0b", cardImage: "/images/cards/card-o.png", cardQuestion: "What's your favorite color?", cardAnswer: "I like ... best." },
  { letter: "p", upper: "P", word: "panda", numberWord: "four", number: 4, color: "#0f172a", cardImage: "/images/cards/card-p.png", cardQuestion: "What colors do you like?", cardAnswer: "I like ... and ..." },
  { letter: "q", upper: "Q", word: "quiet", numberWord: "five", number: 5, color: "#64748b", cardImage: "/images/cards/card-q.png", cardQuestion: "How many ... do you have?", cardAnswer: "I have ..." },
  { letter: "r", upper: "R", word: "run", numberWord: "five", number: 5, color: "#16a34a", cardImage: "/images/cards/card-r.png", cardQuestion: "What can you do?", cardAnswer: "I can ..." },
  { letter: "s", upper: "S", word: "sun", numberWord: "five", number: 5, color: "#facc15", cardImage: "/images/cards/card-s.png", cardQuestion: "Can you play ...?", cardAnswer: "Yes, I can. No, I can't." },
  { letter: "t", upper: "T", word: "tent", numberWord: "five", number: 5, color: "#7c2d12", cardImage: "/images/cards/card-t.png", cardQuestion: "Where do you live?", cardAnswer: "I live in ..." },
  { letter: "u", upper: "U", word: "umbrella", numberWord: "six", number: 6, color: "#1d4ed8", cardImage: "/images/cards/card-u.png", cardQuestion: "What are you doing?", cardAnswer: "I am ...ing." },
  { letter: "v", upper: "V", word: "van", numberWord: "six", number: 6, color: "#9333ea", cardImage: "/images/cards/card-v.png", cardQuestion: "Is it sunny today?", cardAnswer: "Yes, it is. No, it isn't." },
  { letter: "w", upper: "W", word: "windy", numberWord: "six", number: 6, color: "#0891b2", cardImage: "/images/cards/card-w.png", cardQuestion: "Do you like ...?", cardAnswer: "Yes, I do. No, I don't." },
  { letter: "x", upper: "X", word: "taxi", numberWord: "six", number: 6, color: "#facc15", cardImage: "/images/cards/card-x.png", cardQuestion: "What is your favorite ...?", cardAnswer: "I like ... best." },
  { letter: "y", upper: "Y", word: "yes", numberWord: "seven", number: 7, color: "#16a34a", cardImage: "/images/cards/card-y.png", cardQuestion: "Where are you from?", cardAnswer: "I'm from ..." },
  { letter: "z", upper: "Z", word: "zero", numberWord: "seven", number: 7, color: "#0f172a", cardImage: "/images/cards/card-z.png", cardQuestion: "Do you live near ...?", cardAnswer: "Yes, I do. No, I don't." },
];

export function findPhonicCard(letter: string): PhonicCard | undefined {
  const baseLetter = letter.charAt(0).toLowerCase();
  return PHONIC_CARDS.find((c) => c.letter === baseLetter);
}

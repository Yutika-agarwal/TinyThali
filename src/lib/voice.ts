import { INGREDIENTS } from "../data/ingredients.ts";

/** Words parents actually say, mapped to ingredient ids. Hindi and everyday names. */
const ALIASES: Record<string, string> = {
  aloo: "potato", potatoes: "potato", palak: "spinach", gajar: "carrot", pyaz: "onion", pyaaz: "onion", pyaj: "onion",
  tamatar: "tomato", tomatoes: "tomato", matar: "peas", peas: "peas", "green peas": "peas", gobi: "cauliflower",
  "phool gobi": "cauliflower", "patta gobi": "cabbage", "band gobi": "cabbage", dahi: "curd", yogurt: "curd", yoghurt: "curd",
  chawal: "rice", doodh: "milk", anda: "eggs", ande: "eggs", egg: "eggs", "shimla mirch": "capsicum", "bell pepper": "capsicum",
  kheera: "cucumber", lahsun: "garlic", dhaniya: "cilantro", coriander: "cilantro", chana: "chickpeas", chole: "chickpeas",
  chickpea: "chickpeas", ghiya: "lauki", "bottle gourd": "lauki", makai: "corn", shakarkandi: "sweet_potato",
  chukandar: "beetroot", beet: "beetroot", "kidney beans": "rajma", semolina: "sooji", suji: "sooji", rava: "sooji",
  "chickpea flour": "besan", "wheat flour": "atta", flour: "atta", roti: "tortilla", rotis: "tortilla", tortillas: "tortilla",
  "whole moong": "moong_whole", "sabut moong": "moong_whole", "green moong": "moong_whole", "green gram": "moong_whole",
  "moong dal": "moong", "mung dal": "moong", "yellow moong": "moong", "masoor dal": "masoor", "red lentils": "masoor",
  methi: "methi", "fenugreek leaves": "methi", noodle: "noodles", maggi: "noodles", "tofu": "tofu", "soya paneer": "tofu",
};

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let phrases: { phrase: string; id: string }[] | null = null;

function buildPhrases() {
  const out = new Map<string, string>();
  for (const i of INGREDIENTS) {
    if (i.category === "pantry") continue;
    const base = i.name.toLowerCase();
    const head = base.replace(/\s*\(.*\)/, "").trim();
    out.set(head, i.id);
    const inside = base.match(/\((.*)\)/)?.[1];
    if (inside) for (const alt of inside.split(/ or /)) if (alt.trim().length > 3) out.set(alt.trim(), i.id);
  }
  for (const [k, v] of Object.entries(ALIASES)) out.set(k, v);
  // Longest first, so "cottage cheese" wins over "cheese" and "whole moong" over "moong".
  return [...out.entries()].map(([phrase, id]) => ({ phrase, id })).sort((a, b) => b.phrase.length - a.phrase.length);
}

/** Ingredient ids heard in a spoken sentence, e.g. "I have aloo, paneer and some palak". */
export function parseIngredients(text: string): string[] {
  phrases ??= buildPhrases();
  let t = ` ${text.toLowerCase().replace(/[^a-z\s]/g, " ")} `;
  const found: string[] = [];
  for (const { phrase, id } of phrases) {
    const re = new RegExp(`(?<![a-z])${esc(phrase)}(?:s|es)?(?![a-z])`, "g");
    if (re.test(t)) {
      if (!found.includes(id)) found.push(id);
      t = t.replace(re, " ");
    }
  }
  return found;
}

/** "next", "back" and "done" in English or Hindi. Null when it is neither. */
export function stepCommand(text: string): "next" | "back" | "done" | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z\s]/g, " ")} `;
  if (/ (back|previous|peeche|pichla|piche) /.test(t)) return "back";
  if (/ (next|aage|agla|continue|ok next) /.test(t)) return "next";
  if (/ (done|finish|finished|khatam) /.test(t)) return "done";
  return null;
}

// ---- Browser speech recognition (Chrome, Edge and Safari have it; Firefox does not) ----

interface Rec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

function ctor(): (new () => Rec) | null {
  const w = globalThis as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return ctor() !== null;
}

/** Starts listening. Calls onText with each finished phrase. Returns a stop function. */
export function listen(opts: { continuous?: boolean; onText: (text: string) => void; onEnd: (error?: string) => void }): () => void {
  const R = ctor();
  if (!R) {
    opts.onEnd("unsupported");
    return () => {};
  }
  const rec = new R();
  rec.lang = "en-IN"; // understands Hinglish ingredient names far better than en-US
  rec.continuous = opts.continuous ?? false;
  rec.interimResults = false;
  let error: string | undefined;
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) opts.onText(e.results[i][0].transcript);
    }
  };
  rec.onerror = (e) => {
    error = e.error;
  };
  rec.onend = () => opts.onEnd(error);
  try {
    rec.start();
  } catch {
    opts.onEnd("failed");
  }
  return () => {
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  };
}

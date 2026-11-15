import type { Slot } from "../types.ts";

/**
 * Dish types for "Boost my dish". A parent says what they are cooking; we map it to a type,
 * and the type says which kinds of boosts fit (through the same slots recipes use).
 * Keywords are matched against the dish name; longer matches win.
 */
export interface DishType {
  id: string;
  label: string;
  emoji: string;
  /** Shown as the quick-tap chip. */
  chip: string;
  keywords: string[];
  slots: Slot[];
  /** When to add the boost, in plain words. */
  when: string;
}

export const DISH_TYPES: DishType[] = [
  {
    id: "roti",
    label: "Roti, paratha or dough",
    emoji: "🫓",
    chip: "Roti / paratha",
    keywords: ["roti", "chapati", "chapathi", "phulka", "paratha", "parantha", "thepla", "puri", "naan", "kulcha", "bhatura", "dough", "flatbread", "tortilla"],
    slots: ["dough", "filling"],
    when: "while making the dough or the stuffing",
  },
  {
    id: "dal",
    label: "Dal or curry",
    emoji: "🍲",
    chip: "Dal / curry",
    keywords: ["dal", "daal", "sambar", "sambhar", "rajma", "chole", "chana", "curry", "kadhi", "gravy", "saag", "masala", "palak", "paneer", "lentil"],
    slots: ["simmer", "sauce", "topping"],
    when: "while it simmers, or on top at the end",
  },
  {
    id: "rice",
    label: "Rice, khichdi or pulao",
    emoji: "🍚",
    chip: "Rice / khichdi",
    keywords: ["rice", "khichdi", "khichri", "pulao", "pulav", "biryani", "bhaat", "lemon rice", "curd rice"],
    slots: ["grain", "simmer", "filling", "topping"],
    when: "when you pick the grain, while it cooks, or on top",
  },
  {
    id: "upma",
    label: "Upma, poha or porridge",
    emoji: "🥣",
    chip: "Upma / poha",
    keywords: ["upma", "poha", "daliya", "dalia", "porridge", "oats", "sheera", "semolina", "sooji", "rava"],
    slots: ["simmer", "filling", "topping"],
    when: "while it cooks, or on top",
  },
  {
    id: "pasta",
    label: "Pasta or noodles",
    emoji: "🍝",
    chip: "Pasta / noodles",
    keywords: ["pasta", "noodles", "macaroni", "mac and cheese", "spaghetti", "penne", "maggi", "ramen"],
    slots: ["sauce", "filling", "topping"],
    when: "in the sauce, or on top",
  },
  {
    id: "batter",
    label: "Chilla, dosa, waffle or pancake",
    emoji: "🥞",
    chip: "Chilla / dosa",
    keywords: ["chilla", "cheela", "dosa", "uttapam", "pancake", "waffle", "idli", "pakora", "pakoda", "appe", "paniyaram", "batter", "crepe"],
    slots: ["batter", "topping"],
    when: "in the batter, or on top",
  },
  {
    id: "stirfry",
    label: "Sabzi, bhurji or scramble",
    emoji: "🍳",
    chip: "Sabzi / bhurji",
    keywords: ["sabzi", "subzi", "bhurji", "scramble", "stir fry", "stir-fry", "omelette", "omelet", "egg", "aloo", "bhaji", "bhindi", "gobi", "poriyal", "thoran"],
    slots: ["filling", "simmer", "topping"],
    when: "while it cooks, or sprinkled on top",
  },
  {
    id: "wrap",
    label: "Wrap, burger or patty",
    emoji: "🌯",
    chip: "Wrap / burger",
    keywords: ["wrap", "roll", "kathi", "sandwich", "burger", "patty", "tikki", "cutlet", "kebab", "quesadilla", "enchilada", "taco", "slider", "toast", "sandwhich"],
    slots: ["filling", "topping"],
    when: "in the filling or patty mix, or on top",
  },
  {
    id: "soup",
    label: "Soup",
    emoji: "🥣",
    chip: "Soup",
    keywords: ["soup", "stew", "shorba", "broth", "rasam"],
    slots: ["sauce", "simmer", "topping"],
    when: "when blending, or on top",
  },
  {
    id: "dip",
    label: "Dip, chutney or spread",
    emoji: "🫙",
    chip: "Dip / chutney",
    keywords: ["dip", "chutney", "hummus", "raita", "spread", "dressing", "guacamole"],
    slots: ["blend", "topping"],
    when: "when blending, or on top",
  },
  {
    id: "sweet",
    label: "Sweet or dessert",
    emoji: "🍮",
    chip: "Sweet",
    keywords: ["halwa", "kheer", "payasam", "ladoo", "laddu", "cake", "muffin", "dessert", "sweet", "pudding", "smoothie", "cookie", "barfi"],
    slots: ["sweet", "topping"],
    when: "in place of sugar, or on top",
  },
];

export const DISH_TYPE_BY_ID: Record<string, DishType> = Object.fromEntries(DISH_TYPES.map((d) => [d.id, d]));

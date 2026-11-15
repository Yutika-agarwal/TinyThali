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
    keywords: ["roti", "chapati", "chapathi", "phulka", "paratha", "parantha", "thepla", "puri", "naan", "kulcha", "bhatura", "bhature", "dough", "flatbread", "tortilla"],
    slots: ["dough"],
    when: "while making the dough or the stuffing",
  },
  {
    id: "dal",
    label: "Dal or curry",
    emoji: "🍲",
    chip: "Dal / curry",
    keywords: ["dal", "daal", "sambar", "sambhar", "rajma", "chole", "chana", "curry", "kadhi", "gravy", "saag", "lentil", "palak paneer", "matar paneer", "shahi paneer", "kadai paneer", "paneer butter masala", "butter paneer", "paneer masala", "tikka masala"],
    slots: ["simmer", "sauce", "topping"],
    when: "while it simmers, or on top at the end",
  },
  {
    id: "rice",
    label: "Rice, khichdi or pulao",
    emoji: "🍚",
    chip: "Rice / khichdi",
    keywords: ["rice", "khichdi", "khichri", "pulao", "pulav", "biryani", "bhaat", "chawal", "lemon rice", "curd rice"],
    slots: ["grain", "simmer", "filling", "topping"],
    when: "when you pick the grain, while it cooks, or on top",
  },
  {
    id: "upma",
    label: "Upma, poha or porridge",
    emoji: "🥣",
    chip: "Upma / poha",
    keywords: ["upma", "poha", "daliya", "dalia", "porridge", "oats", "semolina", "sooji", "rava"],
    slots: ["simmer", "topping"],
    when: "while it cooks, or on top",
  },
  {
    id: "pasta",
    label: "Pasta or noodles",
    emoji: "🍝",
    chip: "Pasta / noodles",
    keywords: ["pasta", "noodles", "macaroni", "mac and cheese", "spaghetti", "penne", "maggi", "ramen"],
    slots: ["sauce", "topping"],
    when: "in the sauce, or on top",
  },
  {
    id: "stuffed",
    label: "Stuffed dish",
    emoji: "🥟",
    chip: "Stuffed",
    keywords: ["stuffed", "ravioli", "tortellini", "stuffed shells", "lasagna", "lasagne", "momos", "dumpling", "samosa", "kachori", "aloo paratha", "paneer paratha", "gobi paratha", "mooli paratha", "methi paratha stuffed", "stuffed paratha", "stuffed roti", "calzone"],
    slots: ["filling", "dough", "side"],
    when: "in the filling or the dough",
  },
  {
    id: "batter",
    label: "Chilla, dosa, waffle or pancake",
    emoji: "🥞",
    chip: "Chilla / dosa",
    keywords: ["chilla", "cheela", "dosa", "uttapam", "idli", "pakora", "pakoda", "appe", "paniyaram", "batter"],
    slots: ["batter", "side", "topping"],
    when: "in the batter, or on top",
  },
  {
    id: "pancake",
    label: "Pancakes or waffles",
    emoji: "🥞",
    chip: "Pancakes / waffles",
    keywords: ["pancake", "waffle", "crepe"],
    slots: ["batter", "topping"],
    when: "in the batter, or on top",
  },
  {
    id: "stirfry",
    label: "Sabzi, bhurji or scramble",
    emoji: "🍳",
    chip: "Sabzi / bhurji",
    keywords: ["sabzi", "subzi", "bhurji", "scramble", "stir fry", "stir-fry", "omelette", "omelet", "bhaji", "bhindi", "gobi", "poriyal", "thoran", "scrambled"],
    slots: ["simmer", "topping"],
    when: "while it cooks, or sprinkled on top",
  },
  {
    id: "wrap",
    label: "Wrap, burger or patty",
    emoji: "🌯",
    chip: "Wrap / burger",
    keywords: ["wrap", "roll", "kathi", "sandwich", "burger", "patty", "tikki", "cutlet", "kebab", "quesadilla", "enchilada", "taco", "slider", "sandwhich"],
    slots: ["side", "filling"],
    when: "in the filling or patty mix, or on top",
  },
  {
    id: "soup",
    label: "Soup",
    emoji: "🥣",
    chip: "Soup",
    keywords: ["soup", "stew", "shorba", "broth", "rasam"],
    slots: ["sauce", "simmer", "topping", "dollop"],
    when: "when blending, or on top",
  },
  {
    id: "toast",
    label: "Toast",
    emoji: "🍞",
    chip: "Toast",
    keywords: ["toast", "open sandwich"],
    slots: ["topping", "dollop"],
    when: "on top",
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
    keywords: ["halwa", "sheera", "kheer", "payasam", "ladoo", "laddu", "cake", "muffin", "dessert", "pudding", "smoothie", "cookie", "barfi"],
    slots: ["sweet", "topping"],
    when: "in place of sugar, or on top",
  },
];

export const DISH_TYPE_BY_ID: Record<string, DishType> = Object.fromEntries(DISH_TYPES.map((d) => [d.id, d]));

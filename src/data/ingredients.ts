import type { Ingredient } from "../types.ts";

/**
 * Single source of truth for ingredient names and allergens.
 * Recipe and boost allergens are always computed from this table, so an
 * ingredient only has to be tagged once.
 */
export const INGREDIENTS: Ingredient[] = [
  // Veg
  { id: "beetroot", name: "Beetroot", emoji: "🟣", category: "veg", allergens: [], jainUnsafe: true },
  { id: "potato", name: "Potato", emoji: "🥔", category: "veg", allergens: [], jainUnsafe: true },
  { id: "spinach", name: "Spinach", emoji: "🥬", category: "veg", allergens: [] },
  { id: "onion", name: "Onion", emoji: "🧅", category: "veg", allergens: [], jainUnsafe: true },
  { id: "tomato", name: "Tomato", emoji: "🍅", category: "veg", allergens: [] },
  { id: "carrot", name: "Carrot", emoji: "🥕", category: "veg", allergens: [], jainUnsafe: true },
  { id: "peas", name: "Green peas", emoji: "🫛", category: "veg", allergens: [] },
  { id: "cilantro", name: "Cilantro", emoji: "🌿", category: "veg", allergens: [] },

  // Dairy and protein
  { id: "paneer", name: "Paneer", emoji: "🧀", category: "dairy_protein", allergens: ["dairy"] },
  { id: "curd", name: "Curd (yogurt)", emoji: "🥛", category: "dairy_protein", allergens: ["dairy"] },
  { id: "eggs", name: "Eggs", emoji: "🥚", category: "dairy_protein", allergens: ["egg"] },
  { id: "tofu", name: "Tofu", emoji: "⬜", category: "dairy_protein", allergens: ["soy"] },

  // Grains and flours
  { id: "atta", name: "Atta (whole wheat flour)", emoji: "🌾", category: "grains", allergens: ["gluten"] },
  { id: "rice", name: "Rice", emoji: "🍚", category: "grains", allergens: [] },
  { id: "besan", name: "Besan (chickpea flour)", emoji: "🌼", category: "grains", allergens: [] },
  { id: "sooji", name: "Sooji (semolina)", emoji: "🥣", category: "grains", allergens: ["gluten"] },

  // Lentils
  { id: "moong", name: "Moong dal", emoji: "🟡", category: "lentils", allergens: [] },
  { id: "masoor", name: "Masoor dal", emoji: "🟠", category: "lentils", allergens: [] },
  { id: "chickpeas", name: "Chickpeas (chana)", emoji: "🫘", category: "lentils", allergens: [] },

  // Pantry staples, always assumed to be at home
  { id: "salt", name: "Salt", emoji: "🧂", category: "pantry", allergens: [] },
  { id: "oil", name: "Oil", emoji: "🫒", category: "pantry", allergens: [] },
  { id: "turmeric", name: "Turmeric", emoji: "🟨", category: "pantry", allergens: [] },
  { id: "cumin", name: "Cumin", emoji: "🌱", category: "pantry", allergens: [] },
  { id: "chili", name: "Chili powder", emoji: "🌶️", category: "pantry", allergens: [] },
  { id: "ghee", name: "Ghee", emoji: "🧈", category: "pantry", allergens: ["dairy"] },
];

export const INGREDIENT_BY_ID: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
);

export const CATEGORY_LABELS = {
  veg: "🥕 Veg",
  dairy_protein: "🧀 Dairy & protein",
  grains: "🌾 Grains & flours",
  lentils: "🫘 Lentils",
} as const;

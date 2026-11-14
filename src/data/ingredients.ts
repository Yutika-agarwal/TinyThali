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
  { id: "basil", name: "Basil", emoji: "🌿", category: "veg", allergens: [] },
  { id: "kale", name: "Kale", emoji: "🥬", category: "veg", allergens: [] },
  { id: "methi", name: "Methi (fresh fenugreek leaves)", emoji: "🌱", category: "veg", allergens: [] },
  { id: "avocado", name: "Avocado", emoji: "🥑", category: "veg", allergens: [] },
  { id: "garlic", name: "Garlic", emoji: "🧄", category: "veg", allergens: [], jainUnsafe: true },
  { id: "lauki", name: "Lauki (bottle gourd)", emoji: "🥒", category: "veg", allergens: [] },
  { id: "broccoli", name: "Broccoli", emoji: "🥦", category: "veg", allergens: [] },
  { id: "corn", name: "Sweet corn", emoji: "🌽", category: "veg", allergens: [] },
  { id: "sweet_potato", name: "Sweet potato", emoji: "🍠", category: "veg", allergens: [] },
  { id: "capsicum", name: "Capsicum (bell pepper)", emoji: "🫑", category: "veg", allergens: [] },
  { id: "cauliflower", name: "Cauliflower", emoji: "🥦", category: "veg", allergens: [] },
  { id: "cucumber", name: "Cucumber", emoji: "🥒", category: "veg", allergens: [] },

  // Dairy and protein
  { id: "paneer", name: "Paneer", emoji: "🧀", category: "dairy_protein", allergens: ["dairy"] },
  { id: "curd", name: "Curd (yogurt)", emoji: "🥛", category: "dairy_protein", allergens: ["dairy"] },
  { id: "eggs", name: "Eggs", emoji: "🥚", category: "dairy_protein", allergens: ["egg"] },
  { id: "tofu", name: "Tofu", emoji: "⬜", category: "dairy_protein", allergens: ["soy"] },
  { id: "milk", name: "Milk", emoji: "🥛", category: "dairy_protein", allergens: ["dairy"] },
  { id: "greek_yogurt", name: "Greek yogurt", emoji: "🥛", category: "dairy_protein", allergens: ["dairy"] },
  { id: "cottage_cheese", name: "Cottage cheese", emoji: "🧀", category: "dairy_protein", allergens: ["dairy"] },
  { id: "cheese", name: "Cheese (mozzarella or cheddar)", emoji: "🧀", category: "dairy_protein", allergens: ["dairy"] },
  { id: "edamame", name: "Edamame (shelled)", emoji: "🫛", category: "dairy_protein", allergens: ["soy"] },
  { id: "cream_cheese", name: "Cream cheese", emoji: "🧀", category: "dairy_protein", allergens: ["dairy"] },
  { id: "pine_nuts", name: "Pine nuts", emoji: "🌰", category: "dairy_protein", allergens: ["tree_nuts"] },
  { id: "tahini", name: "Tahini (sesame paste)", emoji: "🫙", category: "dairy_protein", allergens: ["sesame"] },
  { id: "pumpkin_seeds", name: "Pumpkin seeds (pepitas)", emoji: "🎃", category: "dairy_protein", allergens: [] },
  { id: "makhana", name: "Makhana (fox nuts)", emoji: "⚪", category: "dairy_protein", allergens: [] },

  // Grains and flours
  { id: "atta", name: "Atta (whole wheat flour)", emoji: "🌾", category: "grains", allergens: ["gluten"] },
  { id: "rice", name: "Rice", emoji: "🍚", category: "grains", allergens: [] },
  { id: "besan", name: "Besan (chickpea flour)", emoji: "🌼", category: "grains", allergens: [] },
  { id: "sooji", name: "Sooji (semolina)", emoji: "🥣", category: "grains", allergens: ["gluten"] },
  { id: "sabudana", name: "Sabudana (tapioca pearls)", emoji: "⚪", category: "grains", allergens: [] },
  { id: "sourdough", name: "Sourdough bread", emoji: "🍞", category: "grains", allergens: ["gluten"] },
  { id: "tortilla", name: "Tortillas (or soft rotis)", emoji: "🫓", category: "grains", allergens: ["gluten"] },
  { id: "bread", name: "Bread", emoji: "🍞", category: "grains", allergens: ["gluten"] },
  { id: "pav", name: "Pav (soft buns)", emoji: "🥖", category: "grains", allergens: ["gluten"] },
  { id: "pasta", name: "Pasta", emoji: "🍝", category: "grains", allergens: ["gluten"] },
  { id: "quinoa", name: "Quinoa", emoji: "🌾", category: "grains", allergens: [] },

  // Lentils
  { id: "moong", name: "Moong dal", emoji: "🟡", category: "lentils", allergens: [] },
  { id: "moong_whole", name: "Whole moong (green gram)", emoji: "🟢", category: "lentils", allergens: [] },
  { id: "masoor", name: "Masoor dal", emoji: "🟠", category: "lentils", allergens: [] },
  { id: "chickpeas", name: "Chickpeas (chana)", emoji: "🫘", category: "lentils", allergens: [] },
  { id: "rajma", name: "Rajma (kidney beans)", emoji: "🫘", category: "lentils", allergens: [] },

  // Pantry staples, always assumed to be at home
  { id: "salt", name: "Salt", emoji: "🧂", category: "pantry", allergens: [] },
  { id: "oil", name: "Oil", emoji: "🫒", category: "pantry", allergens: [] },
  { id: "turmeric", name: "Turmeric", emoji: "🟨", category: "pantry", allergens: [] },
  { id: "cumin", name: "Cumin", emoji: "🌱", category: "pantry", allergens: [] },
  { id: "chili", name: "Chili powder", emoji: "🌶️", category: "pantry", allergens: [] },
  { id: "ghee", name: "Ghee", emoji: "🧈", category: "pantry", allergens: ["dairy"] },
  { id: "sugar", name: "Sugar", emoji: "🍬", category: "pantry", allergens: [] },
  { id: "cardamom", name: "Cardamom", emoji: "🌰", category: "pantry", allergens: [] },
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

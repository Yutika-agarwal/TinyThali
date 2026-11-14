export type Allergen =
  | "dairy"
  | "egg"
  | "soy"
  | "sesame"
  | "peanuts"
  | "tree_nuts"
  | "gluten"
  | "fish"
  | "shellfish";

export const ALLERGENS: { id: Allergen; label: string }[] = [
  { id: "dairy", label: "Dairy" },
  { id: "egg", label: "Egg" },
  { id: "soy", label: "Soy" },
  { id: "sesame", label: "Sesame" },
  { id: "peanuts", label: "Peanuts" },
  { id: "tree_nuts", label: "Tree nuts" },
  { id: "gluten", label: "Gluten / wheat" },
  { id: "fish", label: "Fish" },
  { id: "shellfish", label: "Shellfish" },
];

export type AgeBand = "1-3" | "4-8" | "9-12";
export const AGE_BANDS: AgeBand[] = ["1-3", "4-8", "9-12"];

export type Diet = "vegetarian" | "eggetarian" | "non_veg" | "jain";
export const DIETS: { id: Diet; label: string }[] = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "eggetarian", label: "Eggetarian" },
  { id: "non_veg", label: "Non-veg" },
  { id: "jain", label: "Jain" },
];

export type NutrientBadge = "Calcium" | "Iron" | "Protein" | "Fiber" | "Omega-3";

export type IngredientCategory = "veg" | "dairy_protein" | "grains" | "lentils" | "pantry";

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  category: IngredientCategory;
  allergens: Allergen[];
  /** Root vegetables and alliums, which Jain households avoid. */
  jainUnsafe?: boolean;
}

export interface RecipeIngredient {
  id: string;
  qty: string;
  optional?: boolean;
}

/** Replace one ingredient with another when a kid has the given allergy. */
export interface AllergenSwap {
  allergen: Allergen;
  replace: string;
  with: string;
  note: string;
}

/** Where in a recipe a boost can be added. */
export type Slot = "dough" | "filling" | "simmer" | "batter" | "topping" | "sweet" | "grain" | "sauce";

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  minutes: number;
  /** The least restrictive diet the recipe fits: vegetarian, or eggetarian if it has egg. */
  diet: "vegetarian" | "eggetarian";
  ingredients: RecipeIngredient[];
  steps: string[];
  /** Slot -> index of the step that the boost text is attached to. */
  slots: Partial<Record<Slot, number>>;
  /** Nutrient badges the recipe earns on its own. */
  badges: NutrientBadge[];
  swaps?: AllergenSwap[];
}

export interface Boost {
  id: string;
  name: string;
  emoji: string;
  slots: Slot[];
  /** Short label of what is added, e.g. "Ragi flour". */
  add: string;
  amount: string;
  /** Instruction sentence used in the cook-mode step. */
  stepText: string;
  why: string;
  badges: NutrientBadge[];
  /** Lowest age, in years, the boost is suitable for. */
  minAge: number;
  allergens: Allergen[];
  note: string;
  /** Disappears into the dish, so it is a good first try for picky eaters. */
  blendsIn?: boolean;
  /** Boosts in the same group replace each other (e.g. only one flour swap). */
  exclusiveGroup?: "flour" | "flax";
  /** Hidden on recipes that already contain any of these ingredient ids (nothing to add). */
  hideIfRecipeHas?: string[];
}

export interface KidProfile {
  id: string;
  nickname: string;
  ageBand: AgeBand;
  allergies: Allergen[];
  diet: Diet;
  picky: boolean;
}

export interface CommunityPost {
  id: string;
  recipeId: string;
  title: string;
  whatAdded: string;
  amount: string;
  whereInRecipe: string;
  kidReaction: "loved" | "ate_some" | "not_this_time";
  ageBand: AgeBand;
  allergenTags: Allergen[];
  /** The poster ticked either the relevant allergens or "None of these". */
  allergensConfirmed: boolean;
  tasteNote?: string;
  authorName: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
  sample?: boolean;
  createdAt?: string;
  helpful: number;
  kidApproved: number;
}

export type Reaction = "loved" | "ate_some" | "not_this_time";

export interface SavedRecipe {
  id: string;
  recipeId: string;
  boostIds: string[];
  postIds: string[];
  savedAt: string;
}

export interface CookEntry {
  id: string;
  recipeId: string;
  boostIds: string[];
  postIds: string[];
  reaction: Reaction;
  cookedAt: string;
}

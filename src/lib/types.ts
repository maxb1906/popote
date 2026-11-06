export type SourceType =
  | 'web'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'pinterest'
  | 'text'
  | 'photo'
  | 'file'
  | 'manual';

export type DishType = 'starter' | 'main' | 'dessert' | 'side' | 'breakfast' | 'drink' | 'snack' | 'other';
export const DISH_TYPES: DishType[] = ['starter', 'main', 'side', 'dessert', 'breakfast', 'snack', 'drink', 'other'];

export interface Ingredient {
  id: string;
  qty?: number;
  /** quantity range upper bound, e.g. "2-3 eggs" -> qty 2, qtyMax 3 */
  qtyMax?: number;
  unit?: string;
  name: string;
  note?: string;
  raw: string;
}

export interface Step {
  id: string;
  text: string;
  timerSeconds?: number;
}

export interface Nutrition {
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Recipe {
  id: string;
  title: string;
  sourceUrl?: string;
  sourceType: SourceType;
  author?: string;
  image?: string;
  servings: number;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes?: number;
  dishType: DishType;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  nutrition?: Nutrition;
  notes?: string;
  favourite: boolean;
  cookedCount: number;
  lastCookedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** What a parser / importer produces before it gets ids and timestamps. */
export type RecipeDraft = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'favourite' | 'cookedCount'> &
  Partial<Pick<Recipe, 'favourite' | 'cookedCount'>>;

export interface Notebook {
  id: string;
  name: string;
  recipeIds: string[];
  createdAt: string;
}

export type Meal = 'lunch' | 'dinner';
export const MEALS: Meal[] = ['lunch', 'dinner'];

export interface PlanEntry {
  id: string;
  /** local calendar day, YYYY-MM-DD */
  date: string;
  meal: Meal;
  recipeId: string;
  servings: number;
}

export type Aisle =
  | 'produce'
  | 'meat'
  | 'fish'
  | 'dairy'
  | 'bakery'
  | 'savoury'
  | 'sweet'
  | 'spices'
  | 'frozen'
  | 'drinks'
  | 'other';

export const AISLE_ORDER: Aisle[] = [
  'produce',
  'bakery',
  'meat',
  'fish',
  'dairy',
  'savoury',
  'spices',
  'sweet',
  'frozen',
  'drinks',
  'other',
];

export interface ShoppingItem {
  key: string;
  name: string;
  qty?: number;
  unit?: string;
  aisle: Aisle;
  manual: boolean;
  recipeIds: string[];
  atHome?: boolean;
  /** quantities that could not be summed (different units) */
  extra?: string[];
}

export interface PantryItem {
  id: string;
  name: string;
}

export type AiProvider = 'anthropic' | 'openai';

export interface AiSettings {
  provider: AiProvider;
  model: string;
  apiKey: string;
  /** OpenAI-compatible base URL, e.g. https://api.openai.com/v1 or http://192.168.1.10:11434/v1 */
  baseUrl?: string;
}

export interface Settings {
  language: 'fr' | 'en';
  theme: 'system' | 'light' | 'dark';
  grams: boolean;
  ai?: AiSettings;
}

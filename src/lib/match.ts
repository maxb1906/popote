import { nameKey } from './text';
import type { Recipe } from './types';

/** Ingredients nobody shops for when choosing what to cook. */
const STAPLES = new Set(
  [
    'sel', 'salt', 'poivre', 'pepper', 'poivre noir', 'black pepper', 'eau', 'water', 'huile', 'oil', "huile d'olive", 'olive oil',
    'huile neutre', 'sucre', 'sugar', 'sel et poivre', 'sel poivre', 'salt and pepper', 'farine', 'flour', 'beurre', 'butter',
    'vinaigre', 'vinegar', 'huile de tournesol',
  ].map(nameKey),
);

export function isStaple(name: string): boolean {
  const k = nameKey(name);
  return STAPLES.has(k) || /^(sel|salt|poivre|pepper)\b/.test(k);
}

function matches(have: string, ingredientKey: string): boolean {
  if (!have) return false;
  if (ingredientKey === have) return true;
  // "poulet" matches "blanc de poulet", "tomate" matches "tomate cerise"
  return ` ${ingredientKey} `.includes(` ${have} `);
}

export interface Match {
  recipe: Recipe;
  have: string[];
  missing: string[];
  score: number;
}

/** "What can I cook with what I have?" ranks recipes by the share of their ingredients you already have. */
export function matchRecipes(haveNames: string[], recipes: Recipe[], limit = 30): Match[] {
  const have = haveNames.map(nameKey).filter(Boolean);
  if (!have.length) return [];
  const out: Match[] = [];
  for (const r of recipes) {
    const needed = r.ingredients.filter((i) => !isStaple(i.name));
    if (!needed.length) continue;
    const got: string[] = [];
    const missing: string[] = [];
    for (const ing of needed) {
      const k = nameKey(ing.name);
      if (have.some((h) => matches(h, k))) got.push(ing.name);
      else missing.push(ing.name);
    }
    if (!got.length) continue;
    out.push({ recipe: r, have: got, missing, score: got.length / needed.length + got.length * 0.01 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** After cooking, suggest recipes that reuse this recipe's fresh ingredients (to finish open packs). */
export function leftoverSuggestions(cooked: Recipe, recipes: Recipe[], limit = 2): Match[] {
  const names = cooked.ingredients.filter((i) => !isStaple(i.name)).map((i) => i.name);
  return matchRecipes(names, recipes.filter((r) => r.id !== cooked.id), limit);
}

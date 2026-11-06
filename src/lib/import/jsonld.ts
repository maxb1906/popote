import { parseIngredient } from '../parse/ingredient';
import { findDurationSeconds, parseIsoDuration } from '../parse/duration';
import { guessDishType } from '../parse/recipeText';
import { decodeEntities, stripTags, uid } from '../text';
import type { DishType, Nutrition, RecipeDraft, SourceType, Step } from '../types';

type Json = any; // JSON-LD is untyped by nature

export function extractJsonLdBlocks(html: string): Json[] {
  const out: Json[] = [];
  const re = /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const body = m[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, '');
    try {
      out.push(JSON.parse(body));
    } catch {
      try {
        // some sites leave raw control characters or trailing commas
        out.push(JSON.parse(body.replace(/[\u0000-\u001f]+/g, ' ').replace(/,\s*([}\]])/g, '$1')));
      } catch {
        /* ignore broken block */
      }
    }
  }
  return out;
}

function isRecipe(node: Json): boolean {
  const t = node?.['@type'];
  return t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'));
}

export function findRecipeNodes(data: Json): Json[] {
  const found: Json[] = [];
  const seen = new Set<Json>();
  const walk = (n: Json, depth: number) => {
    if (!n || typeof n !== 'object' || depth > 8 || seen.has(n)) return;
    seen.add(n);
    if (Array.isArray(n)) return n.forEach((x) => walk(x, depth + 1));
    if (isRecipe(n)) found.push(n);
    for (const k of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item', 'hasPart']) {
      if (n[k]) walk(n[k], depth + 1);
    }
  };
  walk(data, 0);
  return found;
}

const str = (v: Json): string => (typeof v === 'string' ? stripTags(v) : typeof v === 'number' ? String(v) : '');

function imageOf(v: Json): string | undefined {
  if (!v) return undefined;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return imageOf(v[v.length > 1 ? v.length - 1 : 0]) ?? imageOf(v[0]);
  return v.url ?? v.contentUrl ?? v['@id'];
}

function yieldOf(v: Json): number | undefined {
  const arr = Array.isArray(v) ? v : [v];
  for (const x of arr) {
    const n = typeof x === 'number' ? x : parseInt(String(x ?? '').match(/\d+/)?.[0] ?? '', 10);
    if (n > 0 && n < 100) return n;
  }
  return undefined;
}

function stepsOf(v: Json): Step[] {
  const texts: string[] = [];
  const walk = (n: Json) => {
    if (!n) return;
    if (typeof n === 'string') {
      // a single string with several lines or numbered steps
      stripTags(n)
        .split(/\n+|(?:^|\s)(?=\d{1,2}[.)]\s)/)
        .map((s) => s.replace(/^\d{1,2}[.)]\s*/, '').trim())
        .filter(Boolean)
        .forEach((s) => texts.push(s));
      return;
    }
    if (Array.isArray(n)) return n.forEach(walk);
    if (n['@type'] === 'HowToSection' || n.itemListElement) return walk(n.itemListElement);
    const t = str(n.text) || str(n.name) || str(n.description);
    if (t) texts.push(t);
  };
  walk(v);
  return texts.map((text) => ({ id: uid(), text, timerSeconds: findDurationSeconds(text) }));
}

function num(v: Json): number | undefined {
  const n = parseFloat(String(v ?? '').replace(',', '.').match(/[\d.]+/)?.[0] ?? '');
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function nutritionOf(v: Json): Nutrition | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const n: Nutrition = {
    kcal: num(v.calories),
    protein: num(v.proteinContent),
    carbs: num(v.carbohydrateContent),
    fat: num(v.fatContent),
  };
  return Object.values(n).some((x) => x !== undefined) ? n : undefined;
}

function keywordsOf(v: Json): string[] {
  const arr: string[] = Array.isArray(v) ? v.map(str) : str(v).split(',');
  return arr
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s.length < 30)
    .slice(0, 6);
}

const CATEGORY_MAP: [RegExp, DishType][] = [
  [/dessert|sucr|sweet|p[aâ]tisserie|cake|g[aâ]teau/i, 'dessert'],
  [/entr[ée]e|starter|appetizer|ap[ée]ritif|soup/i, 'starter'],
  [/accompagnement|side/i, 'side'],
  [/petit[- ]d[ée]j|breakfast|brunch/i, 'breakfast'],
  [/boisson|drink|cocktail/i, 'drink'],
  [/plat|main|dinner|lunch|d[îi]ner/i, 'main'],
];

export function recipeFromJsonLd(node: Json, sourceUrl?: string, sourceType: SourceType = 'web'): RecipeDraft {
  const title = decodeEntities(str(node.name) || str(node.headline)).trim();
  const servings = yieldOf(node.recipeYield ?? node.yield);
  const rawIngs: string[] = (Array.isArray(node.recipeIngredient) ? node.recipeIngredient : Array.isArray(node.ingredients) ? node.ingredients : [])
    .map(str)
    .filter(Boolean);
  const category = [str(node.recipeCategory), ...(Array.isArray(node.recipeCategory) ? node.recipeCategory.map(str) : [])].join(' ');
  let dishType: DishType | undefined;
  for (const [re, d] of CATEGORY_MAP) if (re.test(category)) { dishType = d; break; }
  const prep = parseIsoDuration(node.prepTime);
  const cook = parseIsoDuration(node.cookTime);
  const total = parseIsoDuration(node.totalTime) ?? (prep || cook ? (prep ?? 0) + (cook ?? 0) : undefined);
  const ingredients = rawIngs.map(parseIngredient);
  const author = Array.isArray(node.author) ? str(node.author[0]?.name) : str(node.author?.name ?? node.author);
  const cuisine = keywordsOf(node.recipeCuisine);
  return {
    title,
    sourceUrl,
    sourceType,
    author: author || undefined,
    image: imageOf(node.image ?? node.thumbnailUrl),
    servings: servings ?? 4,
    prepMinutes: prep,
    cookMinutes: cook,
    totalMinutes: total,
    dishType: dishType ?? guessDishType(title, ingredients.map((i) => i.name).join(' ')),
    tags: [...new Set([...cuisine, ...keywordsOf(node.keywords)])].slice(0, 6),
    ingredients,
    steps: stepsOf(node.recipeInstructions),
    nutrition: nutritionOf(node.nutrition),
    notes: str(node.description) ? str(node.description).slice(0, 500) : undefined,
  };
}

/** All schema.org Recipes found in a page. */
export function recipesFromHtml(html: string, sourceUrl?: string, sourceType: SourceType = 'web'): RecipeDraft[] {
  return extractJsonLdBlocks(html)
    .flatMap(findRecipeNodes)
    .map((n) => recipeFromJsonLd(n, sourceUrl, sourceType))
    .filter((r) => r.title && (r.ingredients.length || r.steps.length));
}

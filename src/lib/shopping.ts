import { aisleOf } from './aisles';
import { formatQty } from './scale';
import { nameKey, capitalise } from './text';
import { fromBase, toBase, unitDef, unitLabel } from './units';
import type { PantryItem, PlanEntry, Recipe, ShoppingItem } from './types';

interface Acc {
  name: string;
  key: string;
  recipeIds: Set<string>;
  /** metric sums by dimension */
  mass?: number;
  volume?: number;
  /** other units summed per unit id ('' = no unit, a count) */
  byUnit: Map<string, number>;
  /** ingredient listed without quantity at least once */
  bare: boolean;
}

/** "Sel, poivre" / "salt and pepper" with no quantity -> two items. */
function splitBare(ings: Recipe['ingredients']): Recipe['ingredients'] {
  return ings.flatMap((i) => {
    if (i.qty !== undefined || i.unit) return [i];
    const parts = i.name.split(/\s*,\s*|\s+(?:et|and|&)\s+/i).filter(Boolean);
    return parts.length > 1 && parts.every((p) => p.split(' ').length <= 3) ? parts.map((name) => ({ ...i, name })) : [i];
  });
}

/** Things everybody has: never added to the list unless the user adds them by hand. */
const ALWAYS_THERE = new Set(['eau', 'water', 'eau chaude', 'eau froide', 'hot water', 'cold water', 'glacon', 'ice']);

export function pantryMatch(key: string, pantry: PantryItem[]): boolean {
  return pantry.some((p) => {
    const pk = nameKey(p.name);
    return pk && (key === pk || key.startsWith(pk + ' ') || key.endsWith(' ' + pk));
  });
}

/**
 * Turn the planned meals into a merged shopping list.
 * Quantities are summed only when they can be (g+kg, ml+cl+l, same unit); anything else is kept as "extra".
 */
export function buildShoppingList(
  entries: PlanEntry[],
  recipes: Record<string, Recipe>,
  pantry: PantryItem[],
  lang: 'fr' | 'en',
): ShoppingItem[] {
  const acc = new Map<string, Acc>();
  for (const e of entries) {
    const r = recipes[e.recipeId];
    if (!r) continue;
    const factor = e.servings / (r.servings || 1);
    for (const ing of splitBare(r.ingredients)) {
      const key = nameKey(ing.name);
      if (!key || ALWAYS_THERE.has(key)) continue;
      let a = acc.get(key);
      if (!a) {
        a = { name: capitalise(ing.name.trim()), key, recipeIds: new Set(), byUnit: new Map(), bare: false };
        acc.set(key, a);
      }
      a.recipeIds.add(r.id);
      const qty = ing.qtyMax ?? ing.qty;
      if (qty === undefined) {
        a.bare = true;
        continue;
      }
      const q = qty * factor;
      const u = unitDef(ing.unit);
      if (u?.metric) {
        const b = toBase(q, ing.unit)!;
        if (b.dim === 'mass') a.mass = (a.mass ?? 0) + b.value;
        else a.volume = (a.volume ?? 0) + b.value;
      } else {
        const id = ing.unit ?? '';
        a.byUnit.set(id, (a.byUnit.get(id) ?? 0) + q);
      }
    }
  }

  const items: ShoppingItem[] = [];
  for (const a of acc.values()) {
    const parts: { qty: number; unit?: string }[] = [];
    if (a.mass) parts.push(fromBase(a.mass, 'mass'));
    if (a.volume) parts.push(fromBase(a.volume, 'volume'));
    for (const [unit, qty] of a.byUnit) parts.push({ qty: unit === '' ? Math.ceil(qty - 0.01) : qty, unit: unit || undefined });
    const [main, ...rest] = parts;
    items.push({
      key: a.key,
      name: a.name,
      qty: main?.qty,
      unit: main?.unit,
      aisle: aisleOf(a.name),
      manual: false,
      recipeIds: [...a.recipeIds],
      atHome: pantryMatch(a.key, pantry),
      extra: rest.length ? rest.map((p) => `${formatQty(p.qty, p.unit, lang)} ${p.unit ? unitLabel(p.unit, p.qty, lang) : ''}`.trim()) : undefined,
    });
  }
  return items.sort((x, y) => x.name.localeCompare(y.name, lang));
}

export function itemQuantityText(item: ShoppingItem, lang: 'fr' | 'en'): string {
  const main = item.qty !== undefined ? `${formatQty(item.qty, item.unit, lang)} ${item.unit ? unitLabel(item.unit, item.qty, lang) : ''}`.trim() : '';
  return [main, ...(item.extra ?? [])].filter(Boolean).join(' + ');
}

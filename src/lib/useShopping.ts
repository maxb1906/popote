import { useMemo } from 'react';
import { useUi } from '../components/layout';
import { useT } from '../i18n';
import { aisleOf } from './aisles';
import { weekDays } from './dates';
import { parseIngredient } from './parse/ingredient';
import { buildShoppingList } from './shopping';
import { nameKey } from './text';
import { AISLE_ORDER, type Aisle, type ShoppingItem } from './types';
import { useStore } from '../store';

export interface AisleGroup {
  aisle: Aisle;
  items: ShoppingItem[];
}

/** The shopping list for the week shown in the planner: generated items + manual ones, minus removed. */
export function useShopping() {
  const { lang } = useT();
  const weekStart = useUi((s) => s.weekStart);
  const plan = useStore((s) => s.plan);
  const recipes = useStore((s) => s.recipes);
  const pantry = useStore((s) => s.pantry);
  const shopping = useStore((s) => s.shopping);

  return useMemo(() => {
    const days = weekDays(weekStart);
    const entries = plan.filter((p) => p.date >= days[0] && p.date <= days[6]);
    const generated = buildShoppingList(entries, recipes, pantry, lang).filter((i) => !shopping.removed[i.key]);
    const keys = new Set(generated.map((i) => i.key));
    const items = [...generated, ...shopping.manual.filter((m) => !keys.has(m.key))];
    const toBuy = items.filter((i) => !i.atHome);
    const atHome = items.filter((i) => i.atHome);
    const groups: AisleGroup[] = AISLE_ORDER.map((aisle) => ({
      aisle,
      items: toBuy.filter((i) => i.aisle === aisle).sort((a, b) => Number(!!shopping.checked[a.key]) - Number(!!shopping.checked[b.key])),
    })).filter((g) => g.items.length);
    const left = toBuy.filter((i) => !shopping.checked[i.key]).length;
    return { items, groups, atHome, left, checked: shopping.checked, entries, total: toBuy.length };
  }, [weekStart, plan, recipes, pantry, shopping, lang]);
}

/** "6 yaourts" typed by hand -> a manual item, filed in the right aisle. */
export function manualItem(text: string): ShoppingItem {
  const ing = parseIngredient(text);
  return {
    key: `manual:${nameKey(ing.name)}`,
    name: ing.name.charAt(0).toUpperCase() + ing.name.slice(1),
    qty: ing.qty,
    unit: ing.unit,
    aisle: aisleOf(ing.name),
    manual: true,
    recipeIds: [],
  };
}

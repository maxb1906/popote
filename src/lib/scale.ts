import { unitDef, unitLabel } from './units';
import type { Ingredient } from './types';

const NICE_FRACTIONS: [number, string][] = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [1 / 3, '⅓'],
  [0.5, '½'],
  [2 / 3, '⅔'],
  [0.75, '¾'],
];

/** Units where a fraction reads better than a decimal ("½ c. à café", "1 ½ oignon"). */
function prefersFraction(unit?: string): boolean {
  const u = unitDef(unit);
  return !u || u.dim === 'count' || ['tsp', 'tbsp', 'cup', 'glass'].includes(u.id);
}

export function roundQty(q: number, unit?: string): number {
  const u = unitDef(unit);
  if (u?.metric) {
    if (u.id === 'g' || u.id === 'ml') {
      if (q >= 100) return Math.round(q / 5) * 5;
      if (q >= 10) return Math.round(q);
      return Math.round(q * 10) / 10;
    }
    // kg, l, cl...: one decimal is enough once above 1 (1.125 l -> 1.1 l)
    return q >= 1 ? Math.round(q * 10) / 10 : Math.round(q * 100) / 100;
  }
  return Math.round(q * 100) / 100;
}

export function formatQty(q: number | undefined, unit: string | undefined, lang: 'fr' | 'en'): string {
  if (q === undefined || !Number.isFinite(q)) return '';
  q = roundQty(q, unit);
  if (prefersFraction(unit)) {
    const whole = Math.floor(q + 1e-9);
    const frac = q - whole;
    if (frac < 0.06) return String(whole || (q > 0 ? formatDecimal(q, lang) : '0'));
    for (const [v, glyph] of NICE_FRACTIONS) {
      if (Math.abs(frac - v) < 0.06) return whole ? `${whole} ${glyph}` : glyph;
    }
    if (frac > 0.94) return String(whole + 1);
  }
  return formatDecimal(q, lang);
}

function formatDecimal(q: number, lang: 'fr' | 'en'): string {
  const s = String(Math.round(q * 100) / 100);
  return lang === 'fr' ? s.replace('.', ',') : s;
}

export interface DisplayIngredient {
  qtyText: string;
  unitText: string;
  name: string;
  note?: string;
}

export function scaleIngredient(ing: Ingredient, factor: number): Ingredient {
  return {
    ...ing,
    qty: ing.qty !== undefined ? ing.qty * factor : undefined,
    qtyMax: ing.qtyMax !== undefined ? ing.qtyMax * factor : undefined,
  };
}

export function displayIngredient(ing: Ingredient, lang: 'fr' | 'en'): DisplayIngredient {
  let qtyText = formatQty(ing.qty, ing.unit, lang);
  if (ing.qtyMax !== undefined && qtyText) qtyText += `–${formatQty(ing.qtyMax, ing.unit, lang)}`;
  return {
    qtyText,
    unitText: ing.unit ? unitLabel(ing.unit, ing.qtyMax ?? ing.qty, lang) : '',
    name: ing.name,
    note: ing.note,
  };
}

/** One-line text: "2 c. à soupe huile d'olive (vierge)". */
export function ingredientLine(ing: Ingredient, lang: 'fr' | 'en'): string {
  const d = displayIngredient(ing, lang);
  return [d.qtyText, d.unitText, d.name].filter(Boolean).join(' ') + (d.note ? ` (${d.note})` : '');
}

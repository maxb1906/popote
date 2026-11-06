import { fold } from './text';
import { unitDef } from './units';
import type { Ingredient } from './types';

/** Approximate densities in g/ml for common ingredients, used to show volumes as grams. */
const DENSITY: [string, number][] = [
  ['farine', 0.55], ['flour', 0.55], ['maizena', 0.6], ['fecule', 0.6], ['cornstarch', 0.6],
  ['sucre glace', 0.5], ['icing sugar', 0.5], ['sucre', 0.85], ['sugar', 0.85], ['cassonade', 0.8], ['brown sugar', 0.8],
  ['cacao', 0.45], ['cocoa', 0.45], ['poudre d amande', 0.45], ['amande en poudre', 0.45], ['ground almond', 0.45],
  ['flocons d avoine', 0.35], ['oats', 0.35], ['riz', 0.85], ['rice', 0.85], ['semoule', 0.7], ['couscous', 0.7],
  ['lentille', 0.8], ['lentil', 0.8], ['quinoa', 0.75], ['chapelure', 0.45], ['breadcrumb', 0.45],
  ['sel', 1.2], ['salt', 1.2], ['levure', 0.8], ['baking powder', 0.9], ['bicarbonate', 0.9], ['baking soda', 0.9],
  ['huile', 0.92], ['oil', 0.92], ['beurre fondu', 0.91], ['beurre', 0.95], ['butter', 0.95],
  ['miel', 1.4], ['honey', 1.4], ['sirop', 1.3], ['syrup', 1.3], ['creme', 1.0], ['cream', 1.0],
  ['lait', 1.03], ['milk', 1.03], ['yaourt', 1.03], ['yogurt', 1.03], ['eau', 1], ['water', 1], ['bouillon', 1], ['stock', 1],
  ['vin', 0.99], ['wine', 0.99], ['jus', 1.04], ['juice', 1.04], ['sauce soja', 1.15], ['soy sauce', 1.15], ['vinaigre', 1.01],
  ['parmesan', 0.4], ['fromage rape', 0.4], ['grated cheese', 0.4], ['noix', 0.5], ['nuts', 0.5], ['pepites', 0.6], ['chocolate chips', 0.6],
];

export function densityOf(name: string): number | undefined {
  const f = ` ${fold(name)} `;
  for (const [k, d] of DENSITY) if (f.includes(` ${k}`)) return d;
  return undefined;
}

/** Show volumes (ml, cl, spoons, cups) as grams, the way kitchen robots and scales want them. */
export function toGrams(ing: Ingredient): Ingredient {
  const u = unitDef(ing.unit);
  if (!u || u.dim !== 'volume' || ing.qty === undefined || u.factor === undefined) return ing;
  const d = densityOf(ing.name);
  if (d === undefined) return ing;
  const g = (q: number) => Math.round(q * u.factor! * d);
  return { ...ing, qty: g(ing.qty), qtyMax: ing.qtyMax !== undefined ? g(ing.qtyMax) : undefined, unit: 'g' };
}

/** Canonical units, their aliases in French and English, and their dimension. */

export type Dimension = 'mass' | 'volume' | 'count';

export interface UnitDef {
  id: string;
  dim: Dimension;
  /** factor to the base unit of the dimension (g for mass, ml for volume) */
  factor?: number;
  /** metric units can be summed with each other */
  metric?: boolean;
  aliases: string[];
  label: { fr: [string, string]; en: [string, string] };
}

export const UNITS: UnitDef[] = [
  { id: 'mg', dim: 'mass', factor: 0.001, metric: true, aliases: ['mg', 'milligramme', 'milligrammes', 'milligram', 'milligrams'], label: { fr: ['mg', 'mg'], en: ['mg', 'mg'] } },
  { id: 'g', dim: 'mass', factor: 1, metric: true, aliases: ['g', 'gr', 'grs', 'gramme', 'grammes', 'gram', 'grams', 'grammes'], label: { fr: ['g', 'g'], en: ['g', 'g'] } },
  { id: 'kg', dim: 'mass', factor: 1000, metric: true, aliases: ['kg', 'kgs', 'kilo', 'kilos', 'kilogramme', 'kilogrammes', 'kilogram', 'kilograms'], label: { fr: ['kg', 'kg'], en: ['kg', 'kg'] } },
  { id: 'oz', dim: 'mass', factor: 28.35, aliases: ['oz', 'ounce', 'ounces', 'once', 'onces'], label: { fr: ['oz', 'oz'], en: ['oz', 'oz'] } },
  { id: 'lb', dim: 'mass', factor: 453.6, aliases: ['lb', 'lbs', 'pound', 'pounds', 'livre', 'livres'], label: { fr: ['lb', 'lb'], en: ['lb', 'lb'] } },
  { id: 'ml', dim: 'volume', factor: 1, metric: true, aliases: ['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters'], label: { fr: ['ml', 'ml'], en: ['ml', 'ml'] } },
  { id: 'cl', dim: 'volume', factor: 10, metric: true, aliases: ['cl', 'centilitre', 'centilitres', 'centiliter', 'centiliters'], label: { fr: ['cl', 'cl'], en: ['cl', 'cl'] } },
  { id: 'dl', dim: 'volume', factor: 100, metric: true, aliases: ['dl', 'decilitre', 'decilitres', 'deciliter', 'deciliters'], label: { fr: ['dl', 'dl'], en: ['dl', 'dl'] } },
  { id: 'l', dim: 'volume', factor: 1000, metric: true, aliases: ['l', 'litre', 'litres', 'liter', 'liters', 'lt'], label: { fr: ['l', 'l'], en: ['l', 'l'] } },
  {
    id: 'tbsp',
    dim: 'volume',
    factor: 15,
    aliases: [
      'c a soupe', 'c a s', 'cas', 'cs', 'c s', 'cuillere a soupe', 'cuilleres a soupe', 'cuillerees a soupe', 'cuilleree a soupe',
      'cuil a soupe', 'cuill a soupe', 'grosse cuillere', 'tbsp', 'tbs', 'tbsps', 'tablespoon', 'tablespoons', 'tbl',
    ],
    label: { fr: ['c. à soupe', 'c. à soupe'], en: ['tbsp', 'tbsp'] },
  },
  {
    id: 'tsp',
    dim: 'volume',
    factor: 5,
    aliases: [
      'c a cafe', 'c a c', 'cac', 'cc', 'c c', 'cuillere a cafe', 'cuilleres a cafe', 'cuilleree a cafe', 'cuillerees a cafe',
      'cuil a cafe', 'cuill a cafe', 'petite cuillere', 'tsp', 'tsps', 'teaspoon', 'teaspoons',
    ],
    label: { fr: ['c. à café', 'c. à café'], en: ['tsp', 'tsp'] },
  },
  { id: 'cup', dim: 'volume', factor: 240, aliases: ['cup', 'cups', 'tasse', 'tasses', 'mug', 'mugs', 'bol', 'bols'], label: { fr: ['tasse', 'tasses'], en: ['cup', 'cups'] } },
  { id: 'glass', dim: 'volume', factor: 200, aliases: ['verre', 'verres', 'glass', 'glasses'], label: { fr: ['verre', 'verres'], en: ['glass', 'glasses'] } },
  { id: 'pinch', dim: 'count', aliases: ['pincee', 'pincees', 'pinch', 'pinches'], label: { fr: ['pincée', 'pincées'], en: ['pinch', 'pinches'] } },
  { id: 'dash', dim: 'count', aliases: ['filet', 'filets', 'trait', 'traits', 'dash', 'dashes', 'splash', 'drizzle'], label: { fr: ['filet', 'filets'], en: ['dash', 'dashes'] } },
  { id: 'clove', dim: 'count', aliases: ['gousse', 'gousses', 'clove', 'cloves'], label: { fr: ['gousse', 'gousses'], en: ['clove', 'cloves'] } },
  { id: 'slice', dim: 'count', aliases: ['tranche', 'tranches', 'slice', 'slices', 'rondelle', 'rondelles'], label: { fr: ['tranche', 'tranches'], en: ['slice', 'slices'] } },
  { id: 'can', dim: 'count', aliases: ['boite', 'boites', 'conserve', 'conserves', 'can', 'cans', 'tin', 'tins'], label: { fr: ['boîte', 'boîtes'], en: ['can', 'cans'] } },
  { id: 'jar', dim: 'count', aliases: ['pot', 'pots', 'bocal', 'bocaux', 'jar', 'jars', 'pot de', 'tub', 'tubs'], label: { fr: ['pot', 'pots'], en: ['jar', 'jars'] } },
  { id: 'bunch', dim: 'count', aliases: ['botte', 'bottes', 'bouquet', 'bouquets', 'bunch', 'bunches'], label: { fr: ['bouquet', 'bouquets'], en: ['bunch', 'bunches'] } },
  { id: 'packet', dim: 'count', aliases: ['sachet', 'sachets', 'paquet', 'paquets', 'packet', 'packets', 'pack', 'packs', 'package', 'packages', 'sachet de'], label: { fr: ['sachet', 'sachets'], en: ['packet', 'packets'] } },
  { id: 'sprig', dim: 'count', aliases: ['brin', 'brins', 'branche', 'branches', 'sprig', 'sprigs', 'tige', 'tiges', 'stalk', 'stalks'], label: { fr: ['brin', 'brins'], en: ['sprig', 'sprigs'] } },
  { id: 'leaf', dim: 'count', aliases: ['feuille', 'feuilles', 'leaf', 'leaves'], label: { fr: ['feuille', 'feuilles'], en: ['leaf', 'leaves'] } },
  { id: 'handful', dim: 'count', aliases: ['poignee', 'poignees', 'handful', 'handfuls'], label: { fr: ['poignée', 'poignées'], en: ['handful', 'handfuls'] } },
  { id: 'knob', dim: 'count', aliases: ['noisette', 'noisettes', 'noix', 'knob', 'knobs'], label: { fr: ['noix', 'noix'], en: ['knob', 'knobs'] } },
  { id: 'piece', dim: 'count', aliases: ['piece', 'pieces', 'morceau', 'morceaux', 'carre', 'carres', 'piece(s)', 'pc', 'pcs'], label: { fr: ['morceau', 'morceaux'], en: ['piece', 'pieces'] } },
  { id: 'drop', dim: 'count', aliases: ['goutte', 'gouttes', 'drop', 'drops'], label: { fr: ['goutte', 'gouttes'], en: ['drop', 'drops'] } },
];

const BY_ID = new Map(UNITS.map((u) => [u.id, u]));

/** alias (folded) -> unit id, longest aliases first so "c a soupe" wins over "c". */
export const ALIASES: [string, string][] = UNITS.flatMap((u) => u.aliases.map((a) => [a, u.id] as [string, string])).sort(
  (a, b) => b[0].length - a[0].length,
);

export function unitDef(id?: string): UnitDef | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function unitLabel(id: string | undefined, qty: number | undefined, lang: 'fr' | 'en'): string {
  const u = unitDef(id);
  if (!u) return id ?? '';
  const [one, many] = u.label[lang];
  return qty !== undefined && qty > 1 ? many : one;
}

/** Convert a quantity to the base unit of its dimension (g or ml), or undefined if not convertible. */
export function toBase(qty: number, unit?: string): { value: number; dim: Dimension } | undefined {
  const u = unitDef(unit);
  if (!u || u.factor === undefined) return undefined;
  return { value: qty * u.factor, dim: u.dim };
}

/** Best metric unit to display a base quantity. */
export function fromBase(value: number, dim: Dimension): { qty: number; unit: string } {
  if (dim === 'mass') return value >= 1000 ? { qty: value / 1000, unit: 'kg' } : { qty: value, unit: 'g' };
  if (dim === 'volume') {
    if (value >= 1000) return { qty: value / 1000, unit: 'l' };
    if (value >= 100 && value % 10 === 0) return { qty: value / 10, unit: 'cl' };
    return { qty: value, unit: 'ml' };
  }
  return { qty: value, unit: '' };
}

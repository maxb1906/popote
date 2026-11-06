import { ALIASES } from '../units';
import { fold, stripEmoji, uid } from '../text';
import type { Ingredient } from '../types';

const FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅙': 1 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

const WORD_NUMBERS: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, douze: 12,
  quinze: 15, vingt: 20, demi: 0.5, demie: 0.5,
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12,
  half: 0.5, dozen: 12, douzaine: 12,
};

const VAGUE = /^(un peu|quelques|some|a little|a few|a bit|selon|to taste|au gout|q\.?s\.?)\b/i;

const ALIAS_MAP = new Map(ALIASES);
const MAX_ALIAS_WORDS = 4;

const NUM = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?(?:\s*[½⅓⅔¼¾⅕⅙⅛⅜⅝⅞])?|[½⅓⅔¼¾⅕⅙⅛⅜⅝⅞])`;
const QTY_RE = new RegExp(String.raw`^(${NUM})(?:\s*(?:-|–|à|a|to|ou|or)\s*(${NUM}))?(?=\s|$|[^\d])`, 'i');

export function parseNumber(s: string): number | undefined {
  s = s.trim();
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return +m[1] + +m[2] / +m[3];
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) return +m[2] ? +m[1] / +m[2] : undefined;
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*([½⅓⅔¼¾⅕⅙⅛⅜⅝⅞])$/);
  if (m) return parseFloat(m[1].replace(',', '.')) + FRACTIONS[m[2]];
  if (FRACTIONS[s] !== undefined) return FRACTIONS[s];
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function cleanLine(line: string): string {
  return stripEmoji(line)
    .replace(/^[\s\-–—•*·▪●○◦✓✔→>+~]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripOf(s: string): string {
  return s.replace(/^(?:de la |de l['’]|des |du |de |d['’]|of the |of )/i, '').trim();
}

/** Read a unit at the start of `rest`; returns the unit id and the text after it. */
function takeUnit(rest: string): { unit?: string; rest: string } {
  const words = rest.split(' ');
  for (let n = Math.min(MAX_ALIAS_WORDS, words.length); n >= 1; n--) {
    const candidate = fold(words.slice(0, n).join(' '));
    const id = ALIAS_MAP.get(candidate);
    if (!id) continue;
    const after = words.slice(n).join(' ').trim();
    // "3 noix" (walnuts): a count-like unit with nothing after it is the ingredient itself
    if (!after) return { rest };
    // "noix"/"noisette" are only a unit when followed by "de" ("une noix de beurre")
    if (id === 'knob' && !/^(de |d['’])/i.test(after)) return { rest };
    // a lone "l" or "c" must be followed by a space-separated word, already guaranteed here
    return { unit: id, rest: after.replace(/^\.\s*/, '') };
  }
  return { rest };
}

function splitNote(name: string, splitComma: boolean): { name: string; note?: string } {
  const notes: string[] = [];
  name = name.replace(/\(([^)]*)\)/g, (_, n: string) => {
    if (n.trim()) notes.push(n.trim());
    return ' ';
  });
  const comma = name.indexOf(',');
  if (splitComma && comma > 0) {
    notes.push(name.slice(comma + 1).trim());
    name = name.slice(0, comma);
  }
  name = name.replace(/\s+/g, ' ').replace(/[\s.;:]+$/, '').trim();
  const note = notes.filter(Boolean).join(', ');
  return { name, note: note || undefined };
}

/**
 * "2 c. à soupe d'huile d'olive" -> { qty: 2, unit: 'tbsp', name: "huile d'olive" }
 * "200g farine (T55)"            -> { qty: 200, unit: 'g', name: 'farine', note: 'T55' }
 * "Sel, poivre"                  -> { name: 'Sel, poivre' } (no quantity: commas are not notes)
 */
export function parseIngredient(input: string): Ingredient {
  const raw = input.trim();
  let line = cleanLine(raw)
    // glue: "200g" -> "200 g", "1kg" -> "1 kg"
    .replace(/(\d)([a-zA-Zéèàçœ])/g, '$1 $2')
    .replace(/(\d)\s*x\s+(?=\D)/i, '$1 ');

  // "Farine : 200 g" or "Farine 200 g" or "Oeufs x3" -> move the quantity to the front
  const tail = line.match(/^([^\d½¼¾⅓⅔]+?)\s*(?:[:–—-]\s*|\s)(?:x\s*)?(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*([a-zA-Zéèàç. ]{0,20})$/);
  if (tail && !QTY_RE.test(line)) {
    const maybeUnit = tail[3].trim();
    const u = maybeUnit ? takeUnit(maybeUnit + ' x') : { rest: '' };
    if (!maybeUnit || u.unit) line = `${tail[2]} ${maybeUnit} ${tail[1]}`.replace(/\s+/g, ' ').trim();
  }
  const leadX = line.match(/^x\s*(\d+)\s+(.*)$/i);
  if (leadX) line = `${leadX[1]} ${leadX[2]}`;

  let qty: number | undefined;
  let qtyMax: number | undefined;
  let rest = line;

  if (VAGUE.test(rest)) {
    rest = rest.replace(VAGUE, '').trim();
  } else {
    const m = rest.match(QTY_RE);
    if (m) {
      qty = parseNumber(m[1]);
      if (m[2]) qtyMax = parseNumber(m[2]);
      rest = rest.slice(m[0].length).trim();
    } else {
      const w = rest.match(/^([a-zA-Zéè]+)[\s-]+/);
      const first = w ? fold(w[1]) : '';
      if (w && WORD_NUMBERS[first] !== undefined) {
        qty = WORD_NUMBERS[first];
        rest = rest.slice(w[0].length).trim();
        // "une demi-botte", "a half cup"
        if (qty === 1 && /^(demi|demie|half)\b/i.test(rest)) {
          qty = 0.5;
          rest = rest.replace(/^(demi|demie|half)-?\s*/i, '');
        }
        if (qty === 0.5) rest = rest.replace(/^an?\s+/i, '');
      }
    }
  }
  if (qtyMax !== undefined && qty !== undefined && qtyMax <= qty) qtyMax = undefined;

  let unit: string | undefined;
  if (rest) {
    const u = takeUnit(rest);
    unit = u.unit;
    rest = u.rest;
  }
  rest = stripOf(rest);
  // "Sel, poivre" (no quantity): keep the whole line as the name
  const { name, note } = splitNote(rest || line, qty !== undefined || unit !== undefined);
  return {
    id: uid(),
    qty,
    qtyMax,
    unit,
    name: name || line,
    note,
    raw,
  };
}

/** Does this line look like an ingredient (quantity first, or short bullet)? Used by the text parser. */
export function looksLikeIngredient(line: string): boolean {
  const l = cleanLine(line);
  if (!l || l.length > 90) return false;
  if (/[.!?]$/.test(l) && l.split(' ').length > 8) return false;
  if (QTY_RE.test(l.replace(/(\d)([a-zA-Z])/g, '$1 $2'))) {
    // "1. Préchauffer le four" is a step, not an ingredient
    if (/^\d+\s*[.)]\s+\D/.test(l) && !/^\d+\s*[.)]\s*\d/.test(l)) return false;
    return true;
  }
  const first = fold(l.split(' ')[0] ?? '');
  if (WORD_NUMBERS[first] !== undefined && l.split(' ').length <= 8) return true;
  return /^[\-–—•*·▪●○◦✓✔→>+~]/.test(line.trim()) && l.split(' ').length <= 10;
}

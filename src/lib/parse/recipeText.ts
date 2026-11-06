import { looksLikeIngredient, parseIngredient } from './ingredient';
import { findDurationSeconds, parseDurationText } from './duration';
import { capitalise, fold, stripEmoji, uid } from '../text';
import type { DishType, RecipeDraft, SourceType, Step } from '../types';

const ING_HEADER = /^(?:les\s+)?(ingr[ée]dients?|ingredients|ce qu'il (?:vous )?faut|il (?:vous )?faut|liste des courses|what you(?:'|’)?ll need|you(?:'|’)?ll need|you need|shopping list)\b/i;
const STEP_HEADER = /^(?:la\s+)?(pr[ée]paration|[ée]tapes?|instructions?|d[ée]roul[ée]|la recette|recette|m[ée]thode|method|directions?|steps?|how to make( it)?|how to|preparation|progression)\b/i;
const NOISE_HEADER = /^(astuces?|tips?|notes?|conseils?|bon app[ée]tit|enjoy|n'h[ée]sitez|abonne|follow|like|partage|save|enregistre|comment|lien|link)\b/i;
const SERVINGS_RE = [
  /pour\s+(\d+)\s*(?:à\s*\d+\s*)?(?:personnes?|pers\.?|parts?|portions?|couverts?|gourmands?|enfants?|adultes?)/i,
  /(\d+)\s*(?:à\s*\d+\s*)?(?:personnes?|pers\.?|portions?|parts|couverts|servings?|people|persons?)\b/i,
  /(?:serves|servings?|yield|makes|portions?)\s*:?\s*(\d+)/i,
  /pour\s+(\d+)\b/i,
];

const DESSERT = /\b(gateau|gâteau|tarte (?:aux|au) (?:pomme|poire|fraise|citron|chocolat|framboise|abricot|fruits)|cookies?|brownies?|muffins?|cupcakes?|cheesecake|tiramisu|mousse au chocolat|crumble|cr[eè]me (?:br[uû]l[ée]e|dessert|anglaise|p[aâ]tissi[eè]re)|flan|fondant|moelleux|madeleines?|financiers?|cr[eê]pes?|gaufres?|glaces?|sorbets?|clafoutis|panna cotta|macarons?|meringues?|banana bread|cake au citron|pancakes?|dessert|sweet|cake)\b/i;
const STARTER = /\b(entr[ée]e|starter|appetizer|ap[ée]ro|ap[ée]ritif|soupe|velout[ée]|gaspacho|salade|salad|dips?|houmous|hummus|tartinade|bruschetta|carpaccio|tapas|verrines?)\b/i;
const BREAKFAST = /\b(petit[- ]d[ée]j(?:euner)?|breakfast|brunch|porridge|granola|overnight oats|smoothie bowl)\b/i;
const DRINK = /\b(cocktail|smoothie|boisson|drink|limonade|lemonade|jus|juice|latte|mocktail|sirop)\b/i;
const SIDE = /\b(accompagnement|side dish|pur[ée]e|gratin dauphinois|frites|riz pilaf|l[ée]gumes r[oô]tis)\b/i;
const SNACK = /\b(snack|go[uû]ter|encas|en-cas|barres?|energy balls?)\b/i;

export function guessDishType(title: string, extra = ''): DishType {
  const t = `${title} ${extra}`;
  if (DRINK.test(title)) return 'drink';
  if (BREAKFAST.test(t)) return 'breakfast';
  if (DESSERT.test(title)) return 'dessert';
  if (SNACK.test(title)) return 'snack';
  if (STARTER.test(title)) return 'starter';
  if (SIDE.test(title)) return 'side';
  if (DESSERT.test(extra) && !/\b(sal[ée]|savou?ry)\b/i.test(t)) return 'dessert';
  return 'main';
}

function cleanText(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .replace(/[\u2028\u2029]/g, '\n')
    // "1) ...2) ..." on one line -> new lines
    .replace(/\s+(?=(?:\d{1,2}[.)]|[ée]tape\s*\d+\s*[:.)-]|step\s*\d+\s*[:.)-])\s+[A-ZÀ-Ýa-zà-ÿ])/g, '\n')
    .split('\n')
    .map((l) => stripEmoji(l).replace(/\s+/g, ' ').trim());
}

function isHashtagLine(l: string): boolean {
  const words = l.split(' ').filter(Boolean);
  return words.length > 0 && words.filter((w) => /^[#@]/.test(w)).length / words.length > 0.5;
}

function headerRest(l: string, re: RegExp): string {
  return l.replace(re, '').replace(/^[\s:–—\-.)]+/, '').replace(/^\(?pour \d+[^)]*\)?\s*:?/i, '').trim();
}

function stripStepNumber(l: string): string {
  return l
    .replace(/^(?:[ée]tape|step)\s*\d+\s*[:.)\-–]?\s*/i, '')
    .replace(/^\d{1,2}\s*[.)\-–:]\s+/, '')
    .replace(/^[\-–—•*·▪●○◦→>+~]\s*/, '')
    .trim();
}

function toSteps(lines: string[]): Step[] {
  const out: string[] = [];
  for (const l of lines) {
    if (!l) continue;
    const isNumbered = /^(?:\d{1,2}\s*[.)\-–:]\s+|(?:[ée]tape|step)\s*\d+)/i.test(l);
    const text = stripStepNumber(l);
    if (!text) continue;
    // continuation of the previous step: no number, starts lowercase
    if (out.length && !isNumbered && /^[a-zà-ÿ]/.test(text)) out[out.length - 1] += ' ' + text;
    else out.push(text);
  }
  // one long paragraph -> sentences
  if (out.length === 1 && out[0].length > 220) {
    const sentences = out[0].match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? out;
    out.splice(0, 1, ...sentences);
  }
  return out.map((text) => ({ id: uid(), text: capitalise(text), timerSeconds: findDurationSeconds(text) }));
}

function findServings(text: string): number | undefined {
  for (const re of SERVINGS_RE) {
    const m = text.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > 0 && n <= 50) return n;
    }
  }
  return undefined;
}

function findLabelledMinutes(text: string, labels: RegExp): number | undefined {
  const m = text.match(new RegExp(`(?:${labels.source})\\s*(?:time)?\\s*[:\\-–]?\\s*([^\\n,;|]{1,25})`, 'i'));
  return m ? parseDurationText(m[1]) : undefined;
}

function pickTitle(lines: string[]): string {
  for (const l of lines) {
    if (!l || isHashtagLine(l)) continue;
    if (ING_HEADER.test(l) || STEP_HEADER.test(l)) break;
    if (looksLikeIngredient(l) && /^\d/.test(l)) continue;
    let t = l.replace(/#\w+/g, '').replace(/@\w+/g, '').trim();
    t = t.replace(/^(?:recette|recipe)\s*(?:du jour|facile|rapide|express)?\s*[:\-–]\s*/i, '');
    // keep the first sentence / clause
    const cut = t.split(/[.!?]\s|\s[|•–—]\s/)[0];
    t = cut.replace(/[.!:]+$/, '').trim();
    if (t.length > 70) t = t.slice(0, 67).replace(/\s+\S*$/, '') + '…';
    if (t.length >= 3) return capitalise(t);
  }
  return '';
}

export interface ParseOptions {
  sourceType?: SourceType;
  sourceUrl?: string;
  /** a title we already know (page title, oEmbed title) */
  title?: string;
  image?: string;
  author?: string;
}

/**
 * Turn free text (a social caption, a pasted recipe, an OCR'd page) into a recipe draft.
 * Works without any AI: section headers first, then line-by-line heuristics.
 */
export function parseRecipeText(text: string, opts: ParseOptions = {}): RecipeDraft {
  const lines = cleanText(text);
  const ingLines: string[] = [];
  const stepLines: string[] = [];
  let section: 'none' | 'ing' | 'step' | 'noise' = 'none';
  let sawHeaders = false;

  for (const l of lines) {
    if (!l) continue;
    if (isHashtagLine(l)) continue;
    if (ING_HEADER.test(l)) {
      section = 'ing';
      sawHeaders = true;
      const rest = headerRest(l, ING_HEADER);
      if (rest) ingLines.push(...splitInline(rest));
      continue;
    }
    if (STEP_HEADER.test(l) && (l.length < 40 || /[:]/.test(l.slice(0, 25)))) {
      section = 'step';
      sawHeaders = true;
      const rest = headerRest(l, STEP_HEADER);
      if (rest && !/^\d+\s*(min|h)/i.test(rest)) stepLines.push(rest);
      continue;
    }
    if (NOISE_HEADER.test(l) && section !== 'none' && l.length < 60) {
      section = 'noise';
      continue;
    }
    if (section === 'ing') {
      // "Pour la sauce :" sub-heading
      if (/:$/.test(l) && !/\d/.test(l)) continue;
      if (!looksLikeIngredient(l) && l.length > 90) {
        section = 'step';
        stepLines.push(l);
        continue;
      }
      ingLines.push(...splitInline(l));
    } else if (section === 'step') {
      stepLines.push(l);
    }
  }

  // No headers: classify each line.
  if (!sawHeaders || (!ingLines.length && !stepLines.length)) {
    ingLines.length = 0;
    stepLines.length = 0;
    const title = pickTitle(lines);
    let passedTitle = false;
    for (const l of lines) {
      if (!l || isHashtagLine(l)) continue;
      if (!passedTitle && title && capitalise(l).startsWith(title.replace(/…$/, ''))) {
        passedTitle = true;
        continue;
      }
      if (looksLikeIngredient(l)) ingLines.push(l);
      else if (/^(?:\d{1,2}\s*[.)\-–:]\s+|(?:[ée]tape|step)\s*\d+)/i.test(l) || l.length > 50) stepLines.push(l);
    }
  }

  const ingredients = ingLines
    .map((l) => l.replace(/^[\-–—•*·▪●○◦✓✔→>+~]\s*/, '').trim())
    .filter((l) => l && l.length < 140)
    .map(parseIngredient)
    .filter((i) => i.name && fold(i.name).length > 1);

  const title = opts.title?.trim() || pickTitle(lines) || '';
  const prep = findLabelledMinutes(text, /pr[ée]paration|pr[ée]p|prep(?:aration)?/);
  const cook = findLabelledMinutes(text, /cuisson|cook(?:ing)?|bake|repos/);
  const total = findLabelledMinutes(text, /total|temps total|ready in|pr[eê]t en/);
  const steps = toSteps(stepLines);

  return {
    title: title || '',
    sourceType: opts.sourceType ?? 'text',
    sourceUrl: opts.sourceUrl,
    author: opts.author,
    image: opts.image,
    servings: findServings(text) ?? 2,
    prepMinutes: prep,
    cookMinutes: cook,
    totalMinutes: total ?? (prep || cook ? (prep ?? 0) + (cook ?? 0) : undefined),
    dishType: guessDishType(title, ingredients.map((i) => i.name).join(' ')),
    tags: [],
    ingredients,
    steps,
  };
}

/** "200 g farine, 2 oeufs, 50 cl lait" on one line -> three lines. */
function splitInline(l: string): string[] {
  const parts = l.split(/\s*[;•|]\s*|,\s+(?=\d|un |une |deux |trois |[½¼¾])/i).map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts : [l];
}

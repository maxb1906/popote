/** Durations: ISO 8601 (JSON-LD) and free text in French / English. */

export function parseIsoDuration(s?: unknown): number | undefined {
  if (typeof s !== 'string') return undefined;
  const m = s.trim().match(/^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!m) return parseDurationText(s);
  const [, d, h, min, sec] = m;
  const total = (+(d ?? 0)) * 1440 + (+(h ?? 0)) * 60 + +(min ?? 0) + +(sec ?? 0) / 60;
  return total > 0 ? Math.round(total) : undefined;
}

const H = String.raw`(?:h|hr|hrs|heures?|hours?)`;
const M = String.raw`(?:min|mins|mn|minutes?|minute)`;
const S = String.raw`(?:s|sec|secs|secondes?|seconds?)`;
const NUM = String.raw`(\d+(?:[.,]\d+)?)`;

/** First duration found in a text, in seconds. "1 h 30" -> 5400, "10-12 min" -> 600. */
export function findDurationSeconds(text: string): number | undefined {
  const t = text.toLowerCase();
  // 1h30, 1 h 30, 1 heure 30, 1h30min
  let m = t.match(new RegExp(String.raw`\b${NUM}\s*${H}\s*(?:et\s*)?(\d{1,2})\s*(?:${M})?(?![\d])`));
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 3600 + +m[2] * 60);
  // 10 à 15 minutes, 10-15 min (take the lower bound: check early)
  m = t.match(new RegExp(String.raw`\b${NUM}\s*(?:-|–|à|a|to|ou|or)\s*\d+(?:[.,]\d+)?\s*(${H}|${M}|${S})\b`));
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * unitSeconds(m[2]));
  m = t.match(new RegExp(String.raw`\b${NUM}\s*(${H}|${M}|${S})(?![a-z])`));
  if (m) {
    const secs = parseFloat(m[1].replace(',', '.')) * unitSeconds(m[2]);
    return secs > 0 ? Math.round(secs) : undefined;
  }
  return undefined;
}

function unitSeconds(u: string): number {
  if (new RegExp(`^${H}$`).test(u)) return 3600;
  if (new RegExp(`^${M}$`).test(u)) return 60;
  return 1;
}

/** Minutes from text like "Préparation : 1 h 15" or "45 min". */
export function parseDurationText(s: string): number | undefined {
  const secs = findDurationSeconds(s);
  return secs ? Math.max(1, Math.round(secs / 60)) : undefined;
}

export function formatMinutes(min: number | undefined, lang: 'fr' | 'en'): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return lang === 'fr' ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h ${m} min`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

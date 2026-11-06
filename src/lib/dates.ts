/** Local calendar days as 'YYYY-MM-DD'. Weeks start on Monday. */

export function toDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // noon: safe across DST changes
}

export function addDays(day: string, n: number): string {
  const d = fromDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

export function startOfWeek(day: string): string {
  const d = fromDay(day);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(day, -dow);
}

export function today(): string {
  return toDay(new Date());
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const LOCALE = { fr: 'fr-FR', en: 'en-GB' } as const;

export function formatDay(day: string, lang: 'fr' | 'en', opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }): string {
  try {
    return fromDay(day).toLocaleDateString(LOCALE[lang], opts);
  } catch {
    return day;
  }
}

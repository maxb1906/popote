import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import { formatMinutes } from './parse/duration';
import { ingredientLine, scaleIngredient } from './scale';
import type { Recipe } from './types';

export function recipeAsText(r: Recipe, servings: number, lang: 'fr' | 'en', labels: { ingredients: string; steps: string; servings: string }): string {
  const f = servings / (r.servings || 1);
  const lines = [
    r.title,
    [labels.servings, r.totalMinutes ? formatMinutes(r.totalMinutes, lang) : ''].filter(Boolean).join(' · '),
    '',
    `${labels.ingredients} :`,
    ...r.ingredients.map((i) => `- ${ingredientLine(scaleIngredient(i, f), lang)}`),
    '',
    `${labels.steps} :`,
    ...r.steps.map((s, i) => `${i + 1}. ${s.text}`),
  ];
  if (r.sourceUrl) lines.push('', r.sourceUrl);
  return lines.join('\n');
}

/** Native share sheet; on web, the Web Share API or the clipboard. Returns 'copied' when it fell back to the clipboard. */
export async function shareText(message: string, title?: string): Promise<'shared' | 'copied'> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : undefined;
    if (nav?.share) {
      try {
        await nav.share({ text: message, title });
        return 'shared';
      } catch {
        /* cancelled or unsupported: copy instead */
      }
    }
    await Clipboard.setStringAsync(message);
    return 'copied';
  }
  await Share.share({ message, title });
  return 'shared';
}

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

export async function printRecipe(r: Recipe, servings: number, lang: 'fr' | 'en', labels: { ingredients: string; steps: string; servings: string }) {
  const f = servings / (r.servings || 1);
  const img = r.image && /^(https?:|data:)/.test(r.image) ? `<img src="${esc(r.image)}" alt="">` : '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.title)}</title>
<style>
body{font-family:Georgia,serif;color:#241B16;max-width:720px;margin:32px auto;padding:0 24px;line-height:1.5}
h1{font-size:30px;margin:0 0 4px} .meta{color:#6A5A4F;font-family:system-ui,sans-serif;font-size:14px;margin-bottom:20px}
img{width:100%;max-height:320px;object-fit:cover;border-radius:12px;margin-bottom:16px}
h2{font-family:system-ui,sans-serif;font-size:16px;text-transform:uppercase;letter-spacing:.06em;color:#9A3415;margin:24px 0 8px}
ul{padding-left:20px} li{margin:4px 0} ol li{margin:8px 0} .src{font-family:system-ui,sans-serif;font-size:12px;color:#6A5A4F;margin-top:24px;word-break:break-all}
</style></head><body>
${img}<h1>${esc(r.title)}</h1>
<div class="meta">${esc(labels.servings)}${r.totalMinutes ? ' · ' + esc(formatMinutes(r.totalMinutes, lang)) : ''}</div>
<h2>${esc(labels.ingredients)}</h2><ul>${r.ingredients.map((i) => `<li>${esc(ingredientLine(scaleIngredient(i, f), lang))}</li>`).join('')}</ul>
<h2>${esc(labels.steps)}</h2><ol>${r.steps.map((s) => `<li>${esc(s.text)}</li>`).join('')}</ol>
${r.sourceUrl ? `<div class="src">${esc(r.sourceUrl)}</div>` : ''}
</body></html>`;
  await Print.printAsync({ html });
}

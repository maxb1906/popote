import { Platform } from 'react-native';
import { parseRecipeText } from '../parse/recipeText';
import type { RecipeDraft, SourceType } from '../types';
import { recipesFromHtml } from './jsonld';
import { captionFromHtml, detectSource } from './social';

export class ImportError extends Error {
  constructor(
    public code: 'network' | 'no-recipe' | 'blocked' | 'web-cors' | 'empty',
    public url?: string,
  ) {
    super(code);
  }
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

export function splitInput(input: string): { urls: string[]; text: string } {
  const urls = [...new Set((input.match(URL_RE) ?? []).map((u) => u.replace(/[.,;!?]+$/, '')))];
  const text = input.replace(URL_RE, ' ').trim();
  return { urls, text };
}

const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36 Popote/1.0';

async function get(url: string, accept = 'text/html,application/xhtml+xml'): Promise<string> {
  let res: Response;
  try {
    // browsers refuse custom User-Agent headers and only read sites that allow it (CORS)
    res = Platform.OS === 'web' ? await fetch(url, { headers: { Accept: accept } }) : await fetch(url, { headers: { 'User-Agent': UA, Accept: accept, 'Accept-Language': 'fr,en;q=0.8' } });
  } catch {
    throw new ImportError(Platform.OS === 'web' ? 'web-cors' : 'network', url);
  }
  if (res.status === 401 || res.status === 403 || res.status === 429) throw new ImportError('blocked', url);
  if (!res.ok) throw new ImportError('network', url);
  return res.text();
}

/** TikTok and YouTube publish an official oEmbed endpoint: title (= caption on TikTok), author, thumbnail. */
async function oembed(url: string, source: SourceType): Promise<{ title?: string; author?: string; image?: string } | undefined> {
  const endpoint =
    source === 'tiktok'
      ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      : source === 'youtube'
        ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
        : undefined;
  if (!endpoint) return undefined;
  try {
    const data = JSON.parse(await get(endpoint, 'application/json'));
    return { title: data.title, author: data.author_name, image: data.thumbnail_url };
  } catch {
    return undefined;
  }
}

export async function importFromUrl(url: string): Promise<RecipeDraft[]> {
  const source = detectSource(url);
  const emb = await oembed(url, source);
  let html = '';
  try {
    html = await get(url);
  } catch (e) {
    if (!emb) throw e;
  }

  // 1. Structured data published by the page (most recipe sites, some Pinterest pins)
  if (html) {
    const structured = recipesFromHtml(html, url, source);
    if (structured.length) return structured;
  }

  // 2. Social caption / page description -> text parser
  const cap = html ? captionFromHtml(html, source) : undefined;
  const text = source === 'tiktok' && emb?.title ? emb.title : (cap?.text ?? '');
  const title = source === 'youtube' ? (emb?.title ?? cap?.title) : source === 'tiktok' ? undefined : cap?.title;
  const draft = parseRecipeText(text, {
    sourceType: source,
    sourceUrl: url,
    title: source === 'web' || source === 'youtube' || source === 'pinterest' ? title : undefined,
    image: cap?.image ?? emb?.image,
    author: emb?.author,
  });
  if (!draft.ingredients.length && !draft.steps.length) {
    // on the web only TikTok's oEmbed is readable: a caption without a recipe is "no recipe", not "blocked"
    if (!html && Platform.OS === 'web' && !(source === 'tiktok' && emb?.title)) throw new ImportError('web-cors', url);
    throw new ImportError(source === 'instagram' || source === 'facebook' ? 'blocked' : 'no-recipe', url);
  }
  if (!draft.title) draft.title = title ?? '';
  return [draft];
}

export interface ImportResult {
  drafts: RecipeDraft[];
  errors: ImportError[];
}

/** One field accepts: one or several links, or a pasted recipe, or both. */
export async function importFromInput(input: string): Promise<ImportResult> {
  const { urls, text } = splitInput(input);
  const drafts: RecipeDraft[] = [];
  const errors: ImportError[] = [];
  for (const url of urls) {
    try {
      drafts.push(...(await importFromUrl(url)));
    } catch (e) {
      errors.push(e instanceof ImportError ? e : new ImportError('network', url));
    }
  }
  // pasted text is a recipe on its own, or the caption of a link that could not be read
  if (text && text.length > 20 && (!urls.length || errors.length)) {
    const d = parseRecipeText(text, { sourceType: 'text', sourceUrl: urls.length === 1 && errors.length ? urls[0] : undefined });
    if (d.ingredients.length || d.steps.length) {
      // the caption was pasted next to a link that could not be read: keep the link as the source
      if (urls.length === 1) d.sourceType = detectSource(urls[0]);
      drafts.push(d);
      // the pasted text fixes the failed link, so drop that error
      if (urls.length === 1) errors.length = 0;
    }
  }
  if (!drafts.length && !errors.length) errors.push(new ImportError('empty'));
  return { drafts, errors };
}

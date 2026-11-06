import type { SourceType } from '../types';
import { decodeJsonString, readMeta } from './html';

export function detectSource(url: string): SourceType {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\./, '');
  } catch {
    return 'web';
  }
  if (/(^|\.)instagram\.com$|^instagr\.am$/.test(host)) return 'instagram';
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
  if (/(^|\.)youtube\.com$|^youtu\.be$/.test(host)) return 'youtube';
  if (/(^|\.)facebook\.com$|^fb\.watch$|^fb\.com$/.test(host)) return 'facebook';
  if (/(^|\.)pinterest\.[a-z.]+$|^pin\.it$/.test(host)) return 'pinterest';
  return 'web';
}

export interface Caption {
  text: string;
  title?: string;
  image?: string;
  author?: string;
}

/** Instagram og:description looks like `12 likes, 3 comments - chef on May 2, 2026: "caption"`. */
export function instagramCaption(desc: string): string {
  const m = desc.match(/:\s*["“]([\s\S]+)["”]\s*\.?\s*$/);
  if (m) return m[1];
  return desc.replace(/^[\d.,\s]+(?:likes?|j’aime|j'aime)[^-–]*[-–]\s*/i, '');
}

/** YouTube watch pages embed the full description in their player data. */
export function youtubeDescription(html: string): string | undefined {
  const m = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  return m ? decodeJsonString(m[1]) : undefined;
}

export function captionFromHtml(html: string, source: SourceType): Caption | undefined {
  const meta = readMeta(html);
  let text = meta.description ?? '';
  if (source === 'instagram' && text) text = instagramCaption(text);
  if (source === 'youtube') text = youtubeDescription(html) ?? text;
  let title = meta.title;
  if (source === 'instagram' || source === 'facebook') title = undefined; // "Name on Instagram: ..." is not a recipe title
  if (title) title = title.replace(/\s*[-|–]\s*(YouTube|TikTok|Pinterest|Facebook)\s*$/i, '').trim();
  if (!text && !title) return undefined;
  return { text, title, image: meta.image };
}

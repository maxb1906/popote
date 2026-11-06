import { decodeEntities } from '../text';

/** Read <meta property|name="key" content="..."> from an HTML page. */
export function metaContent(html: string, key: string): string | undefined {
  const k = key.replace(/[.*+?^${}()|[\]\\:]/g, '\\$&');
  const a = new RegExp(String.raw`<meta[^>]+?(?:property|name|itemprop)=["']${k}["'][^>]*?content=("|')([\s\S]*?)\1`, 'i');
  const b = new RegExp(String.raw`<meta[^>]+?content=("|')([\s\S]*?)\1[^>]*?(?:property|name|itemprop)=["']${k}["']`, 'i');
  const m = html.match(a) ?? html.match(b);
  return m ? decodeEntities(m[2]).trim() : undefined;
}

export function pageTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : undefined;
}

export interface PageMeta {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export function readMeta(html: string): PageMeta {
  return {
    title: metaContent(html, 'og:title') ?? metaContent(html, 'twitter:title') ?? pageTitle(html),
    description: metaContent(html, 'og:description') ?? metaContent(html, 'twitter:description') ?? metaContent(html, 'description'),
    image: metaContent(html, 'og:image') ?? metaContent(html, 'twitter:image'),
    siteName: metaContent(html, 'og:site_name'),
  };
}

/** Decode a JSON string literal body (\n, é, \") found inside a page script. */
export function decodeJsonString(s: string): string {
  try {
    return JSON.parse(`"${s}"`);
  } catch {
    return s.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
}

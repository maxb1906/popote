import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { readBase64, writeDataUri } from './media';
import type { Notebook, PantryItem, PlanEntry, Recipe } from './types';

export interface Backup {
  app: 'popote';
  version: 1;
  exportedAt: string;
  recipes: Recipe[];
  notebooks?: Notebook[];
  plan?: PlanEntry[];
  pantry?: PantryItem[];
}

export function isBackup(x: unknown): x is Backup {
  return !!x && typeof x === 'object' && (x as Backup).app === 'popote' && Array.isArray((x as Backup).recipes);
}

/** Embed local photos as data: URIs so the file is self-contained. */
async function embedImages(recipes: Recipe[]): Promise<Recipe[]> {
  const out: Recipe[] = [];
  for (const r of recipes) {
    if (r.image?.startsWith('file:')) {
      const b64 = await readBase64(r.image);
      out.push({ ...r, image: b64 ? `data:image/jpeg;base64,${b64}` : undefined });
    } else out.push(r);
  }
  return out;
}

export async function makeBackup(data: { recipes: Recipe[]; notebooks?: Notebook[]; plan?: PlanEntry[]; pantry?: PantryItem[] }): Promise<Backup> {
  return {
    app: 'popote',
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: await embedImages(data.recipes),
    notebooks: data.notebooks,
    plan: data.plan,
    pantry: data.pantry,
  };
}

/** Save JSON to a file and open the share sheet (or download it on web). */
export async function shareJson(name: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 1);
  const fileName = `${name.replace(/[^\w\-]+/g, '-').slice(0, 60) || 'popote'}.json`;
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return;
  }
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: fileName, UTI: 'public.json' });
}

export interface PickedFile {
  name: string;
  mimeType?: string;
  text?: string;
  base64?: string;
}

/** Let the user choose a file; returns its text (json, txt, html) or base64 (pdf, images). */
export async function pickFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'text/html', 'application/pdf', 'image/*', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const binary = /pdf|image/.test(a.mimeType ?? '') || /\.(pdf|jpe?g|png|webp)$/i.test(a.name);
  if (Platform.OS === 'web') {
    const blob = a.file ?? (await (await fetch(a.uri)).blob());
    if (binary) {
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
      return { name: a.name, mimeType: a.mimeType, base64: btoa(s) };
    }
    return { name: a.name, mimeType: a.mimeType, text: await blob.text() };
  }
  const f = new File(a.uri);
  return binary ? { name: a.name, mimeType: a.mimeType, base64: await f.base64() } : { name: a.name, mimeType: a.mimeType, text: await f.text() };
}

/** Restore embedded photos as files on the phone. */
export function restoreImages(recipes: Recipe[]): Recipe[] {
  return recipes.map((r) => (r.image?.startsWith('data:') ? { ...r, image: writeDataUri(r.image) } : r));
}

/** Merge a backup into the current data: same id -> the most recently updated wins. */
const RECIPE_DEFAULTS: Omit<Recipe, 'id' | 'title' | 'createdAt' | 'updatedAt'> = {
  favourite: false,
  cookedCount: 0,
  tags: [],
  ingredients: [],
  steps: [],
  servings: 2,
  dishType: 'main',
  sourceType: 'file',
};

export function mergeRecipes(current: Record<string, Recipe>, incoming: Recipe[]): { recipes: Record<string, Recipe>; changed: number } {
  const recipes = { ...current };
  let changed = 0;
  for (const r of incoming) {
    if (!r?.id || !r.title) continue;
    const mine = recipes[r.id];
    if (!mine || (r.updatedAt ?? '') > (mine.updatedAt ?? '')) {
      recipes[r.id] = { ...RECIPE_DEFAULTS, ...r };
      changed++;
    }
  }
  return { recipes, changed };
}

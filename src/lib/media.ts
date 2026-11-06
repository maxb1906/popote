import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { uid } from './text';

export interface PickedImage {
  /** what we store on the recipe: file:// on the phone, data: URI on web */
  uri: string;
  base64?: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
}

function imagesDir(): Directory {
  const dir = new Directory(Paths.document, 'images');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/** Copy a picked photo into the app's own folder so it survives cache clean-ups. */
function persist(uri: string): string {
  if (Platform.OS === 'web') return uri;
  try {
    const src = new File(uri);
    const ext = (uri.split('?')[0].match(/\.(jpe?g|png|webp|heic)$/i)?.[1] ?? 'jpg').toLowerCase();
    const dest = new File(imagesDir(), `${uid()}.${ext}`);
    src.copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

function mediaTypeOf(asset: ImagePicker.ImagePickerAsset): PickedImage['mediaType'] {
  const m = asset.mimeType ?? '';
  if (m.includes('png')) return 'image/png';
  if (m.includes('webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function pickImages(opts: { camera?: boolean; multiple?: boolean; base64?: boolean } = {}): Promise<PickedImage[]> {
  if (opts.camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return [];
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.7,
    base64: opts.base64 || Platform.OS === 'web',
    allowsMultipleSelection: !!opts.multiple,
    selectionLimit: opts.multiple ? 10 : 1,
  };
  const res = opts.camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled) return [];
  if (Platform.OS === 'web') {
    // iPhone photos are 3-5 MB: shrink them before they go into the browser's storage
    return Promise.all(
      res.assets.map(async (a) => {
        const src = a.base64 ? `data:${mediaTypeOf(a)};base64,${a.base64}` : a.uri;
        const uri = await downscaleWeb(src, 1400, 0.8);
        return { uri, base64: uri.split(',')[1], mediaType: 'image/jpeg' as const };
      }),
    );
  }
  return res.assets.map((a) => ({ uri: persist(a.uri), base64: a.base64 ?? undefined, mediaType: mediaTypeOf(a) }));
}

/** Resize an image in the browser so its longest side is at most `max` px; returns a JPEG data URI. */
export function downscaleWeb(src: string, max: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(src);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/** Delete a photo we own when its recipe is deleted or its photo replaced. */
export function deleteLocalImage(uri?: string) {
  if (!uri || Platform.OS === 'web' || !uri.startsWith('file:')) return;
  try {
    const f = new File(uri);
    if (f.exists && f.uri.includes('/images/')) f.delete();
  } catch {
    /* already gone */
  }
}

export async function readBase64(uri: string): Promise<string | undefined> {
  if (uri.startsWith('data:')) return uri.split(',')[1];
  if (Platform.OS === 'web' || !uri.startsWith('file:')) return undefined;
  try {
    return await new File(uri).base64();
  } catch {
    return undefined;
  }
}

/** Write a data: URI (from a backup) back to a file; returns the new file:// URI. */
export function writeDataUri(dataUri: string): string {
  if (Platform.OS === 'web') return dataUri;
  const m = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return dataUri;
  try {
    const f = new File(imagesDir(), `${uid()}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`);
    f.create();
    f.write(m[2], { encoding: 'base64' });
    return f.uri;
  } catch {
    return dataUri;
  }
}

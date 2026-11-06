import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * Where the app keeps its data.
 * - Phone (Android / iOS app): AsyncStorage.
 * - Web / iPhone home-screen app: IndexedDB. localStorage (what AsyncStorage uses on web) is capped
 *   around 5 MB, which a few recipe photos would fill; IndexedDB holds hundreds of MB.
 */

const DB = 'popote';
const STORE = 'kv';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
const db = () => (dbPromise ??= openDb());

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const t = d.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => resolve(req.result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

const indexedDbStorage: StateStorage = {
  async getItem(name) {
    const v = await tx<string | undefined>('readonly', (s) => s.get(name));
    if (v != null) return v;
    // first launch after the switch from localStorage: move the data over
    const legacy = typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null;
    if (legacy != null) {
      await tx('readwrite', (s) => s.put(legacy, name));
      localStorage.removeItem(name);
    }
    return legacy;
  },
  async setItem(name, value) {
    await tx('readwrite', (s) => s.put(value, name));
  },
  async removeItem(name) {
    await tx('readwrite', (s) => s.delete(name));
  },
};

function hasIndexedDb(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

export const appStorage: StateStorage = Platform.OS === 'web' && hasIndexedDb() ? indexedDbStorage : AsyncStorage;

/** Ask the browser not to evict our data under storage pressure (Safari, Chrome). */
export function requestPersistentStorage() {
  if (Platform.OS !== 'web') return;
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* not supported */
  }
}

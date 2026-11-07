import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Where the web app is running, to explain how to put it on the home screen.
 * - installed: already opened from the home screen icon
 * - safari: iPhone / iPad Safari, can "Add to Home Screen"
 * - other-browser: Chrome, Firefox, Edge… on iOS (the option may be missing: Safari is safest)
 * - in-app: the browser inside another app (Instagram, Messenger, Gmail…), which has no such option
 * - android, desktop: not an Apple device
 * - native: the Android / iOS app itself
 */
export type InstallMode = 'native' | 'installed' | 'safari' | 'other-browser' | 'in-app' | 'android' | 'desktop';

const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|MessengerForiOS|Line\/|Snapchat|TikTok|musical_ly|BytedanceWebview|LinkedInApp|Twitter|GSA\/|Pinterest|WhatsApp|Telegram|Discord|GoogleApp|\bwv\b/i;
const OTHER_IOS_BROWSER = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|DuckDuckGo|Brave|YaBrowser/i;

export function classifyBrowser(ua: string, maxTouchPoints = 0, standalone = false): Exclude<InstallMode, 'native'> {
  if (standalone) return 'installed';
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  if (!ios) return /Android/i.test(ua) ? 'android' : 'desktop';
  if (IN_APP.test(ua)) return 'in-app';
  if (OTHER_IOS_BROWSER.test(ua)) return 'other-browser';
  // Apps that show pages in their own web view drop the "Safari/" token from the user agent.
  if (!/Safari\//.test(ua)) return 'in-app';
  return 'safari';
}

export function installMode(): InstallMode {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return 'native';
  const nav = navigator as Navigator & { standalone?: boolean };
  let standalone = nav.standalone === true;
  try {
    standalone ||= window.matchMedia('(display-mode: standalone)').matches;
  } catch {}
  return classifyBrowser(nav.userAgent, nav.maxTouchPoints ?? 0, standalone);
}

/** The app's address, to copy and paste into Safari. */
export function appUrl(): string {
  if (typeof location === 'undefined') return '';
  const base = ((Constants.expoConfig?.experiments as { baseUrl?: string } | undefined)?.baseUrl ?? '').replace(/\/$/, '');
  return `${location.origin}${base}/`;
}

const DISMISS_KEY = 'popote-install-hint-dismissed';

export function hintDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissHint() {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {}
}

import { useColorScheme } from 'react-native';
import tokens from '../design/tokens.json';
import { useStore } from './store';

type Role = keyof typeof tokens.color;
export type Colors = Record<Role, string>;

export const light = tokens.color as Colors;
export const dark = tokens.colorDark as Colors;
export const space = tokens.space;
export const radius = tokens.radius;
export const type = tokens.type;

export function useTheme() {
  const pref = useStore((s) => s.settings.theme);
  const system = useColorScheme();
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  return { c: isDark ? dark : light, isDark };
}

export const font = {
  serif: 'serif' as const,
};

export function textStyle(k: keyof typeof tokens.type) {
  const t = tokens.type[k];
  return { fontSize: t.size, lineHeight: t.line, fontWeight: t.weight as '400' | '500' | '600' | '700' };
}

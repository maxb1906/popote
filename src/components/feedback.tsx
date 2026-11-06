import { useEffect } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { radius, space, useTheme } from '../theme';
import { Text } from './ui';

interface ToastState {
  message: string | null;
  tone: 'info' | 'error';
  key: number;
  show: (message: string, tone?: 'info' | 'error') => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  key: 0,
  show: (message, tone = 'info') => set((s) => ({ message, tone, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = (message: string, tone: 'info' | 'error' = 'info') => useToastStore.getState().show(message, tone);

export function ToastHost() {
  const { message, tone, key, hide } = useToastStore();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, tone === 'error' ? 5000 : 2600);
    return () => clearTimeout(t);
  }, [key, message, tone, hide]);
  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + 88 }]}>
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole={tone === 'error' ? 'alert' : undefined}
        style={[styles.toast, { backgroundColor: tone === 'error' ? c.danger : c.text }]}
      >
        <Text variant="sm" style={{ color: c.bg, fontWeight: '500' }}>
          {message}
        </Text>
      </View>
    </View>
  );
}

/** Cross-platform yes/no question (Alert does nothing on web). */
export function confirm(message: string, okLabel: string, cancelLabel: string, destructive = true): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(typeof window !== 'undefined' ? window.confirm(message) : false);
  return new Promise((resolve) =>
    Alert.alert('', message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}


const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: space[4] },
  toast: { paddingHorizontal: space[4], paddingVertical: space[3], borderRadius: radius.md, maxWidth: 480 },
});

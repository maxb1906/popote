import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '../components/feedback';
import { useT } from '../i18n';
import { useStore } from '../store';
import { useTheme } from '../theme';

export default function RootLayout() {
  const { c, isDark } = useTheme();
  const { t } = useT();
  const hydrated = useStore((s) => s.hydrated);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!hydrated ? (
        <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.accent} accessibilityLabel={t('common.loading')} />
        </View>
      ) : (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.bg },
            headerTintColor: c.text,
            headerTitleStyle: { color: c.text, fontWeight: '600' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: c.bg },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]" options={{ title: '' }} />
          <Stack.Screen name="edit/[id]" options={{ title: t('edit.titleEdit'), presentation: 'modal' }} />
          <Stack.Screen name="import" options={{ title: t('import.title'), presentation: 'modal' }} />
          <Stack.Screen name="cook/[id]" options={{ title: '', presentation: 'fullScreenModal' }} />
          <Stack.Screen name="pick" options={{ title: t('pick.title'), presentation: 'modal' }} />
          <Stack.Screen name="store" options={{ title: t('shop.store'), presentation: 'fullScreenModal' }} />
          <Stack.Screen name="pantry" options={{ title: t('pantry.title') }} />
          <Stack.Screen name="notebooks" options={{ title: t('notebooks.title') }} />
          <Stack.Screen name="fridge" options={{ title: t('home.fridge') }} />
          <Stack.Screen name="ai" options={{ title: t('ai.title') }} />
          <Stack.Screen name="install" options={{ title: t('install.title') }} />
        </Stack>
      )}
      <ToastHost />
    </SafeAreaProvider>
  );
}

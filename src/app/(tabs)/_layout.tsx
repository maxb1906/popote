import { Tabs } from 'expo-router';
import { BookOpen, CalendarDays, Settings, ShoppingCart } from 'lucide-react-native';
import { useT } from '../../i18n';
import { useTheme } from '../../theme';

export default function TabLayout() {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c['accent-text'],
        tabBarInactiveTintColor: c['text-muted'],
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.text, fontWeight: '700', fontSize: 20 },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tab.recipes'), headerTitle: t('home.title'), tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }}
      />
      <Tabs.Screen name="week" options={{ title: t('tab.week'), tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }} />
      <Tabs.Screen name="shopping" options={{ title: t('tab.shopping'), tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('tab.settings'), tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tabs>
  );
}

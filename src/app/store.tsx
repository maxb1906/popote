import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, ChevronRight, PartyPopper, ShoppingCart, X } from 'lucide-react-native';
import { ItemRow } from '../components/ItemRow';
import { Button, Divider, EmptyState, IconButton, Text } from '../components/ui';
import { useT } from '../i18n';
import { useShopping } from '../lib/useShopping';
import { useStore } from '../store';
import { space, useTheme } from '../theme';

/** One aisle at a time, big rows, screen kept on. Ticks are saved on the phone, so it works offline. */
export default function StoreMode() {
  useKeepAwake();
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { groups, checked, left } = useShopping();
  const toggleChecked = useStore((s) => s.toggleChecked);
  const [i, setI] = useState(0);
  const idx = Math.min(i, Math.max(0, groups.length - 1));
  const group = groups[idx];

  // jump to the next aisle with something left, when the current one is complete
  useEffect(() => {
    if (group && group.items.every((it) => checked[it.key])) {
      const next = groups.findIndex((g, k) => k > idx && g.items.some((it) => !checked[it.key]));
      if (next >= 0) {
        const h = setTimeout(() => setI(next), 600);
        return () => clearTimeout(h);
      }
    }
  }, [checked, group, groups, idx]);

  const header = <Stack.Screen options={{ headerLeft: () => <IconButton icon={X} label={t('common.close')} onPress={() => router.back()} /> }} />;

  if (!groups.length) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <EmptyState icon={ShoppingCart} title={t('store.empty')} />
      </View>
    );
  }

  if (!left) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <EmptyState icon={PartyPopper} title={t('store.done')} body={t('shop.allDone')}>
          <Button label={t('common.done')} icon={Check} onPress={() => router.back()} />
        </EmptyState>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingBottom: insets.bottom }}>
      {header}
      <View style={{ paddingHorizontal: space[4], paddingTop: space[2], gap: 2, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Text variant="xs" tone="muted" bold>
          {t('store.aisle', { i: idx + 1, n: groups.length })} · {t('shop.left', { n: left })}
        </Text>
        <Text variant="display" serif accessibilityRole="header">
          {t(`aisle.${group.aisle}`)}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: space[4], maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {group.items.map((it, k) => (
          <View key={it.key}>
            {k > 0 ? <Divider /> : null}
            <ItemRow item={it} big checked={!!checked[it.key]} onToggle={() => toggleChecked(it.key)} />
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: space[3], padding: space[4], borderTopWidth: 1, borderColor: c.border, backgroundColor: c.surface }}>
        <Button label={t('store.prevAisle')} icon={ChevronLeft} variant="secondary" size="lg" disabled={idx === 0} onPress={() => setI(idx - 1)} style={{ flex: 1 }} />
        <Button
          label={t('store.nextAisle')}
          icon={ChevronRight}
          size="lg"
          disabled={idx >= groups.length - 1}
          onPress={() => setI(idx + 1)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

import { Pressable, StyleSheet, View } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { IconButton, Text } from './ui';
import { useT } from '../i18n';
import { itemQuantityText } from '../lib/shopping';
import type { ShoppingItem } from '../lib/types';
import { useStore } from '../store';
import { space, useTheme } from '../theme';

export function ItemRow({ item, checked, onToggle, big, onRemove }: { item: ShoppingItem; checked: boolean; onToggle: () => void; big?: boolean; onRemove?: () => void }) {
  const { c } = useTheme();
  const { t, lang } = useT();
  const recipes = useStore((s) => s.recipes);
  const qty = itemQuantityText(item, lang);
  const from = item.recipeIds.map((id) => recipes[id]?.title).filter(Boolean);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={[item.name, qty].filter(Boolean).join(', ')}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: big ? space[4] : space[3], flex: 1, opacity: pressed ? 0.7 : 1 }]}
      >
        <View
          style={[
            styles.box,
            big && { width: 32, height: 32, borderRadius: 10 },
            { borderColor: checked ? c.success : c['border-input'], backgroundColor: checked ? c.success : 'transparent' },
          ]}
        >
          {checked ? <Check size={big ? 20 : 16} color={c.surface} strokeWidth={3} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant={big ? 'lg' : 'base'} tone={checked ? 'muted' : 'text'} style={checked ? { textDecorationLine: 'line-through' } : undefined}>
            {item.name}
          </Text>
          {from.length && !big ? (
            <Text variant="xs" tone="muted" numberOfLines={1}>
              {t('shop.fromRecipes', { list: from.join(', ') })}
            </Text>
          ) : null}
        </View>
        {qty ? (
          <Text variant={big ? 'lg' : 'sm'} tone={checked ? 'muted' : 'text'} bold style={{ maxWidth: '45%', textAlign: 'right' }}>
            {qty}
          </Text>
        ) : null}
      </Pressable>
      {onRemove ? <IconButton icon={Trash2} label={t('common.delete')} size={36} color={c['text-muted']} onPress={onRemove} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});

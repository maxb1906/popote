import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Clock, Heart } from 'lucide-react-native';
import { formatMinutes } from '../lib/parse/duration';
import type { Recipe } from '../lib/types';
import { useT } from '../i18n';
import { radius, space, useTheme } from '../theme';
import { Text } from './ui';

export function RecipeImage({ recipe, height, rounded = true }: { recipe: Pick<Recipe, 'image' | 'title'>; height: number; rounded?: boolean }) {
  const { c } = useTheme();
  const [failed, setFailed] = React.useState(false);
  const r = rounded ? radius.md : 0;
  if (recipe.image && !failed) {
    return (
      <Image
        source={{ uri: recipe.image }}
        onError={() => setFailed(true)}
        style={{ width: '100%', height, borderRadius: r, backgroundColor: c['surface-2'] }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  const letter = (recipe.title.trim()[0] ?? '?').toUpperCase();
  return (
    <View style={{ width: '100%', height, borderRadius: r, backgroundColor: c['accent-soft'], alignItems: 'center', justifyContent: 'center' }}>
      <Text serif style={{ fontSize: Math.min(56, height / 2.2), lineHeight: Math.min(64, height / 2), color: c['accent-text'], fontWeight: '700' }}>
        {letter}
      </Text>
    </View>
  );
}

export function RecipeCard({ recipe, onPress, width }: { recipe: Recipe; onPress: () => void; width: number }) {
  const { c } = useTheme();
  const { t, lang } = useT();
  const time = recipe.totalMinutes ?? ((recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0) || undefined);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[recipe.title, time ? formatMinutes(time, lang) : '', recipe.favourite ? '♥' : ''].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.85 : 1 }]}
    >
      <View>
        <RecipeImage recipe={recipe} height={width * 0.78} />
        {recipe.favourite ? (
          <View style={[styles.fav, { backgroundColor: c.surface }]}>
            <Heart size={14} color={c.accent} fill={c.accent} />
          </View>
        ) : null}
      </View>
      <Text variant="sm" bold numberOfLines={2} style={{ marginTop: space[2] }}>
        {recipe.title}
      </Text>
      <View style={styles.meta}>
        {time ? (
          <>
            <Clock size={12} color={c['text-muted']} />
            <Text variant="xs" tone="muted">
              {formatMinutes(time, lang)}
            </Text>
            <Text variant="xs" tone="muted">
              ·
            </Text>
          </>
        ) : null}
        <Text variant="xs" tone="muted" numberOfLines={1}>
          {t(`dish.${recipe.dishType}`)}
        </Text>
      </View>
    </Pressable>
  );
}

export function RecipeRow({ recipe, onPress, right }: { recipe: Recipe; onPress: () => void; right?: React.ReactNode }) {
  const { lang, t } = useT();
  const time = recipe.totalMinutes;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ width: 56 }}>
        <RecipeImage recipe={recipe} height={56} />
      </View>
      <View style={{ flex: 1 }}>
        <Text bold numberOfLines={2}>
          {recipe.title}
        </Text>
        <Text variant="xs" tone="muted">
          {[t(`dish.${recipe.dishType}`), time ? formatMinutes(time, lang) : '', t('common.servings', { n: recipe.servings })].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space[4] },
  fav: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2] },
});

import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { router, Stack } from 'expo-router';
import { ArrowUpDown, BookOpen, FolderOpen, Plus, Refrigerator, Search, SearchX, X } from 'lucide-react-native';
import { RecipeCard } from '../../components/RecipeCard';
import { Button, Chip, EmptyState, IconButton, Row, Text } from '../../components/ui';
import { MAX_WIDTH } from '../../components/layout';
import { toast } from '../../components/feedback';
import { useT } from '../../i18n';
import { sampleRecipes } from '../../lib/samples';
import { fold } from '../../lib/text';
import type { DishType, Recipe } from '../../lib/types';
import { useStore } from '../../store';
import { radius, space, textStyle, useTheme } from '../../theme';

type Sort = 'recent' | 'az' | 'quick' | 'cooked';
const SORTS: Sort[] = ['recent', 'az', 'quick', 'cooked'];
type Filter = { kind: 'all' } | { kind: 'fav' } | { kind: 'quick' } | { kind: 'dish'; dish: DishType } | { kind: 'notebook'; id: string };

const minutes = (r: Recipe) => r.totalMinutes ?? ((r.prepMinutes ?? 0) + (r.cookMinutes ?? 0) || 9999);

export default function Home() {
  const { c } = useTheme();
  const { t, lang } = useT();
  const recipesById = useStore((s) => s.recipes);
  const notebooks = useStore((s) => s.notebooks);
  const addRecipe = useStore((s) => s.addRecipe);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [sort, setSort] = useState<Sort>('recent');
  const { width } = useWindowDimensions();

  const all = useMemo(() => Object.values(recipesById), [recipesById]);
  const dishTypes = useMemo(() => [...new Set(all.map((r) => r.dishType))], [all]);

  const shown = useMemo(() => {
    const q = fold(query);
    let list = all;
    if (q) {
      const words = q.split(' ');
      list = list.filter((r) => {
        const hay = fold([r.title, r.tags.join(' '), r.ingredients.map((i) => i.name).join(' '), r.author ?? ''].join(' '));
        return words.every((w) => hay.includes(w));
      });
    }
    if (filter.kind === 'fav') list = list.filter((r) => r.favourite);
    if (filter.kind === 'quick') list = list.filter((r) => minutes(r) <= 30);
    if (filter.kind === 'dish') list = list.filter((r) => r.dishType === filter.dish);
    if (filter.kind === 'notebook') {
      const ids = new Set(notebooks.find((n) => n.id === filter.id)?.recipeIds ?? []);
      list = list.filter((r) => ids.has(r.id));
    }
    const sorted = [...list];
    if (sort === 'recent') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title, lang));
    if (sort === 'quick') sorted.sort((a, b) => minutes(a) - minutes(b));
    if (sort === 'cooked') sorted.sort((a, b) => b.cookedCount - a.cookedCount || b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [all, query, filter, sort, notebooks, lang]);

  const contentWidth = Math.min(width, MAX_WIDTH) - space[4] * 2;
  const cols = contentWidth > 820 ? 5 : contentWidth > 600 ? 4 : contentWidth > 420 ? 3 : 2;
  const gap = space[3];
  const cardWidth = Math.floor((contentWidth - gap * (cols - 1)) / cols);
  const isSel = (f: Filter) => JSON.stringify(f) === JSON.stringify(filter);

  const header = (
    <Stack.Screen
      options={{
        headerRight: () => (
          <Row gap={0} style={{ marginRight: space[2] }}>
            <IconButton icon={Refrigerator} label={t('fridge.title')} onPress={() => router.push('/fridge')} />
            <IconButton icon={FolderOpen} label={t('notebooks.title')} onPress={() => router.push('/notebooks')} />
          </Row>
        ),
      }}
    />
  );

  if (!all.length) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <EmptyState icon={BookOpen} title={t('home.empty.title')} body={t('home.empty.body')}>
          <Button label={t('home.empty.import')} icon={Plus} onPress={() => router.push('/import')} />
          <Button
            label={t('home.empty.samples')}
            variant="ghost"
            onPress={() => {
              sampleRecipes(lang).forEach(addRecipe);
              toast(t('samples.added'));
            }}
          />
        </EmptyState>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {header}
      <FlatList
        key={cols}
        data={shown}
        numColumns={cols}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ padding: space[4], paddingBottom: 120, maxWidth: MAX_WIDTH, width: '100%', alignSelf: 'center' }}
        ListHeaderComponent={
          <View style={{ gap: space[3], marginBottom: space[4] }}>
            <View style={[styles.search, { backgroundColor: c.surface, borderColor: c['border-input'] }]}>
              <Search size={18} color={c['text-muted']} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('home.search')}
                placeholderTextColor={c['text-muted']}
                accessibilityLabel={t('common.search')}
                returnKeyType="search"
                style={[textStyle('base'), { flex: 1, color: c.text, paddingVertical: space[2] }]}
              />
              {query ? <IconButton icon={X} label={t('common.close')} size={32} onPress={() => setQuery('')} /> : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
              <Chip label={t('home.filter.all')} selected={isSel({ kind: 'all' })} onPress={() => setFilter({ kind: 'all' })} />
              <Chip label={t('home.filter.favourites')} selected={isSel({ kind: 'fav' })} onPress={() => setFilter({ kind: 'fav' })} />
              <Chip label={t('home.filter.quick')} selected={isSel({ kind: 'quick' })} onPress={() => setFilter({ kind: 'quick' })} />
              {dishTypes.map((d) => (
                <Chip key={d} label={t(`dish.${d}`)} selected={isSel({ kind: 'dish', dish: d })} onPress={() => setFilter({ kind: 'dish', dish: d })} />
              ))}
              {notebooks.map((n) => (
                <Chip key={n.id} icon={FolderOpen} label={n.name} selected={isSel({ kind: 'notebook', id: n.id })} onPress={() => setFilter({ kind: 'notebook', id: n.id })} />
              ))}
            </ScrollView>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="sm" tone="muted">
                {shown.length === 1 ? t('home.countOne') : t('home.count', { n: shown.length })}
              </Text>
              <Pressable
                onPress={() => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length])}
                accessibilityRole="button"
                accessibilityLabel={`${t('home.sort')} : ${t(`home.sort.${sort}`)}`}
                style={styles.sort}
                hitSlop={8}
              >
                <ArrowUpDown size={14} color={c['accent-text']} />
                <Text variant="sm" tone="accent" bold>
                  {t(`home.sort.${sort}`)}
                </Text>
              </Pressable>
            </Row>
          </View>
        }
        ListEmptyComponent={<EmptyState icon={SearchX} title={t('home.noResults.title')} body={t('home.noResults.body')} />}
        renderItem={({ item }) => <RecipeCard recipe={item} width={cardWidth} onPress={() => router.push(`/recipe/${item.id}`)} />}
      />
      <Pressable
        onPress={() => router.push('/import')}
        accessibilityRole="button"
        accessibilityLabel={t('home.import')}
        style={({ pressed }) => [styles.fab, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus color={c['on-accent']} size={22} />
        <Text tone="onAccent" bold>
          {t('home.import')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderWidth: 1, borderRadius: radius.pill, paddingLeft: space[4], paddingRight: space[1], minHeight: 46 },
  sort: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  fab: {
    position: 'absolute',
    right: space[4],
    bottom: space[5],
    height: 56,
    paddingHorizontal: space[5],
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});

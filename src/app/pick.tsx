import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BookOpen, Check } from 'lucide-react-native';
import { RecipeRow } from '../components/RecipeCard';
import { useUi } from '../components/layout';
import { Button, Chip, EmptyState, Field, Row, Stepper, Text } from '../components/ui';
import { toast } from '../components/feedback';
import { useT } from '../i18n';
import { formatDay, today, weekDays } from '../lib/dates';
import { fold } from '../lib/text';
import { MEALS, type Meal } from '../lib/types';
import { useStore } from '../store';
import { space, useTheme } from '../theme';

/**
 * Two ways in:
 *  - from the Week tab with ?date&meal -> choose a recipe
 *  - from a recipe with ?recipeId      -> choose a day, a meal and servings
 */
export default function Pick() {
  const params = useLocalSearchParams<{ date?: string; meal?: Meal; recipeId?: string }>();
  const { c } = useTheme();
  const { t, lang } = useT();
  const recipes = useStore((s) => s.recipes);
  const addPlan = useStore((s) => s.addPlan);
  const weekStart = useUi((s) => s.weekStart);
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = fold(query);
    return Object.values(recipes)
      .filter((r) => !q || fold(`${r.title} ${r.tags.join(' ')} ${r.ingredients.map((i) => i.name).join(' ')}`).includes(q))
      .sort((a, b) => Number(b.favourite) - Number(a.favourite) || a.title.localeCompare(b.title, lang));
  }, [recipes, query, lang]);

  // mode 2: plan a given recipe
  const recipe = params.recipeId ? recipes[params.recipeId] : undefined;
  const days = weekDays(weekStart);
  const [date, setDate] = useState(params.date ?? days.find((d) => d >= today()) ?? days[0]);
  const [meal, setMeal] = useState<Meal>(params.meal ?? 'dinner');
  const [servings, setServings] = useState(recipe?.servings ?? 2);

  if (recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: space[4], gap: space[4] }}>
        <Stack.Screen options={{ title: t('recipe.plan') }} />
        <Text variant="lg" serif>
          {recipe.title}
        </Text>
        <Row wrap gap={space[2]}>
          {days.map((d) => (
            <Chip key={d} label={formatDay(d, lang, { weekday: 'short', day: 'numeric' })} selected={d === date} onPress={() => setDate(d)} />
          ))}
        </Row>
        <Row gap={space[2]}>
          {MEALS.map((m) => (
            <Chip key={m} label={t(`week.${m}`)} selected={m === meal} onPress={() => setMeal(m)} />
          ))}
        </Row>
        <Stepper value={servings} onChange={setServings} label={t('edit.servings')} format={(n) => t('common.servings', { n })} />
        <Button
          label={t('common.add')}
          icon={Check}
          size="lg"
          onPress={() => {
            addPlan(date, meal, recipe.id, servings);
            toast(`${formatDay(date, lang)} · ${t(`week.${meal}`)}`);
            router.back();
          }}
        />
      </View>
    );
  }

  const date1 = params.date!;
  const meal1 = (params.meal ?? 'dinner') as Meal;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space[4], gap: space[1], maxWidth: 720, width: '100%', alignSelf: 'center' }}
        ListHeaderComponent={
          <View style={{ gap: space[3], marginBottom: space[2] }}>
            <Text tone="muted" style={{ textTransform: 'capitalize' }}>
              {t('pick.for', { day: formatDay(date1, lang), meal: t(`week.${meal1}`) })}
            </Text>
            <Field value={query} onChangeText={setQuery} placeholder={t('home.search')} accessibilityLabel={t('common.search')} autoCorrect={false} />
          </View>
        }
        ListEmptyComponent={<EmptyState icon={BookOpen} title={t('pick.empty')} />}
        renderItem={({ item }) => (
          <RecipeRow
            recipe={item}
            onPress={() => {
              addPlan(date1, meal1, item.id, item.servings);
              router.back();
            }}
          />
        )}
      />
    </View>
  );
}

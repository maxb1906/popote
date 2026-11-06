import { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Sparkles, X } from 'lucide-react-native';
import { RecipeImage } from '../../components/RecipeCard';
import { Page, useUi } from '../../components/layout';
import { Banner, Button, IconButton, Row, Text } from '../../components/ui';
import { toast } from '../../components/feedback';
import { useT } from '../../i18n';
import { addDays, formatDay, startOfWeek, today, weekDays } from '../../lib/dates';
import { MEALS, type Meal, type PlanEntry } from '../../lib/types';
import { useStore } from '../../store';
import { radius, space, useTheme } from '../../theme';

export default function Week() {
  const { c } = useTheme();
  const { t, lang } = useT();
  const { weekStart, setWeekStart } = useUi();
  const plan = useStore((s) => s.plan);
  const recipes = useStore((s) => s.recipes);
  const { removePlan, updatePlan, addPlan } = useStore.getState();
  const { width } = useWindowDimensions();
  const days = weekDays(weekStart);
  const todayStr = today();
  const weekEntries = useMemo(() => plan.filter((p) => p.date >= weekStart && p.date <= addDays(weekStart, 6) && recipes[p.recipeId]), [plan, weekStart, recipes]);
  const columns = width >= 900 ? 4 : width >= 560 ? 2 : 1;

  const fillWeek = () => {
    const pool = Object.values(recipes).filter((r) => r.dishType === 'main' || r.dishType === 'starter' || r.dishType === 'side');
    const list = pool.length ? pool : Object.values(recipes);
    if (!list.length) return toast(t('week.suggestNone'));
    // favour favourites and recipes not cooked recently, avoid repeats within the week
    const used = new Set(weekEntries.map((e) => e.recipeId));
    const ranked = [...list].sort((a, b) => Number(b.favourite) - Number(a.favourite) || (a.lastCookedAt ?? '').localeCompare(b.lastCookedAt ?? '') || Math.random() - 0.5);
    let added = 0;
    let i = 0;
    for (const d of days) {
      if (d < todayStr) continue;
      if (weekEntries.some((e) => e.date === d && e.meal === 'dinner')) continue;
      let r = ranked[i % ranked.length];
      for (let k = 0; k < ranked.length && used.has(r.id) && used.size < ranked.length; k++) r = ranked[++i % ranked.length];
      used.add(r.id);
      i++;
      addPlan(d, 'dinner', r.id, r.servings);
      added++;
    }
    toast(t('week.suggestDone', { n: added }));
  };

  const mealBlock = (day: string, meal: Meal, entries: PlanEntry[]) => (
    <View key={meal} style={{ gap: space[2] }}>
      <Text variant="xs" tone="muted" bold style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {t(`week.${meal}`)}
      </Text>
      {entries.map((e) => {
        const r = recipes[e.recipeId];
        return (
          <View key={e.id} style={[styles.entry, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Pressable onPress={() => router.push(`/recipe/${r.id}`)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: space[2], flex: 1 }}>
              <View style={{ width: 40 }}>
                <RecipeImage recipe={r} height={40} />
              </View>
              <Text variant="sm" bold numberOfLines={2} style={{ flex: 1 }}>
                {r.title}
              </Text>
            </Pressable>
            <Row gap={0} style={{ alignSelf: 'flex-end' }}>
              <IconButton icon={Minus} size={30} label={`${t('edit.servings')} −`} disabled={e.servings <= 1} onPress={() => updatePlan(e.id, { servings: e.servings - 1 })} />
              <Text variant="xs" bold style={{ minWidth: 18, textAlign: 'center' }} accessibilityLabel={t('common.servingsLong', { n: e.servings })}>
                {e.servings}
              </Text>
              <IconButton icon={Plus} size={30} label={`${t('edit.servings')} +`} onPress={() => updatePlan(e.id, { servings: e.servings + 1 })} />
              <IconButton icon={X} size={30} label={t('common.delete')} onPress={() => removePlan(e.id)} />
            </Row>
          </View>
        );
      })}
      <Pressable
        onPress={() => router.push({ pathname: '/pick', params: { date: day, meal } })}
        accessibilityRole="button"
        accessibilityLabel={`${t('week.add')} · ${formatDay(day, lang)} · ${t(`week.${meal}`)}`}
        style={({ pressed }) => [styles.add, { borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}
      >
        <Plus size={16} color={c['accent-text']} />
        <Text variant="sm" tone="accent" bold>
          {t('week.add')}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <Page>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconButton icon={ChevronLeft} label={t('common.previous')} tone="surface" onPress={() => setWeekStart(addDays(weekStart, -7))} />
          <Pressable onPress={() => setWeekStart(startOfWeek(todayStr))} accessibilityRole="button" style={{ alignItems: 'center', flex: 1 }}>
            <Text variant="lg">{t('week.of', { date: formatDay(weekStart, lang, { day: 'numeric', month: 'long' }) })}</Text>
            <Text variant="xs" tone="muted">
              {weekEntries.length === 1 ? t('week.mealsOne') : t('week.meals', { n: weekEntries.length })}
            </Text>
          </Pressable>
          <IconButton icon={ChevronRight} label={t('common.next')} tone="surface" onPress={() => setWeekStart(addDays(weekStart, 7))} />
        </Row>

        <Row wrap gap={space[2]}>
          <Button label={t('week.toShopping')} icon={ShoppingCart} onPress={() => router.navigate('/shopping')} disabled={!weekEntries.length} style={{ flexGrow: 1 }} />
          <Button label={t('week.suggest')} icon={Sparkles} variant="secondary" onPress={fillWeek} style={{ flexGrow: 1 }} />
        </Row>

        {!weekEntries.length ? <Banner>{t('week.empty')}</Banner> : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
          {days.map((d) => {
            const isToday = d === todayStr;
            return (
              <View
                key={d}
                style={[
                  styles.day,
                  { backgroundColor: c['surface-2'], borderColor: isToday ? c.accent : 'transparent', flexBasis: columns === 1 ? '100%' : `${100 / columns - 3}%`, flexGrow: 1 },
                  d < todayStr && { opacity: 0.7 },
                ]}
              >
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text bold style={{ textTransform: 'capitalize' }} accessibilityRole="header">
                    {formatDay(d, lang, { weekday: 'long', day: 'numeric' })}
                  </Text>
                  {isToday ? (
                    <Text variant="xs" tone="accent" bold>
                      {t('week.today')}
                    </Text>
                  ) : null}
                </Row>
                {MEALS.map((m) => mealBlock(d, m, weekEntries.filter((e) => e.date === d && e.meal === m)))}
              </View>
            );
          })}
        </View>
      </Page>
    </>
  );
}

const styles = StyleSheet.create({
  day: { borderRadius: radius.lg, padding: space[3], gap: space[3], borderWidth: 2 },
  entry: { gap: space[1], padding: space[2], borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md, minHeight: 40 },
});

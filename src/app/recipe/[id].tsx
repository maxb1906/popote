import { useMemo, useState } from 'react';
import { Linking, Pressable, Switch, View, useWindowDimensions } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays,
  ChefHat,
  Clock,
  ExternalLink,
  FileDown,
  FolderOpen,
  Heart,
  Info,
  Pencil,
  Printer,
  Share2,
  Timer,
  Trash2,
  TriangleAlert,
} from 'lucide-react-native';
import { RecipeImage } from '../../components/RecipeCard';
import { Page } from '../../components/layout';
import { Banner, Button, Chip, Divider, EmptyState, IconButton, Row, Section, Stepper, Text } from '../../components/ui';
import { confirm, toast } from '../../components/feedback';
import { useT } from '../../i18n';
import { detectAllergens } from '../../lib/allergens';
import { shareJson } from '../../lib/backup';
import { deleteLocalImage } from '../../lib/media';
import { formatClock, formatMinutes } from '../../lib/parse/duration';
import { toGrams } from '../../lib/robot';
import { displayIngredient, scaleIngredient } from '../../lib/scale';
import { printRecipe, recipeAsText, shareText } from '../../lib/share';
import { useStore } from '../../store';
import { radius, space, useTheme } from '../../theme';

export default function RecipeScreen() {
  const { id, imported } = useLocalSearchParams<{ id: string; imported?: string }>();
  const { c } = useTheme();
  const { t, lang } = useT();
  const recipe = useStore((s) => s.recipes[id]);
  const notebooks = useStore((s) => s.notebooks);
  const grams = useStore((s) => s.settings.grams);
  const { setSettings, toggleFavourite, deleteRecipe, toggleInNotebook } = useStore.getState();
  const [servings, setServings] = useState(recipe?.servings ?? 2);
  const [showNotebooks, setShowNotebooks] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 820;

  const allergens = useMemo(() => (recipe ? detectAllergens(recipe.ingredients) : []), [recipe]);

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyState icon={TriangleAlert} title={t('recipe.notFound')}>
          <Button label={t('common.back')} variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </EmptyState>
      </View>
    );
  }

  const factor = servings / (recipe.servings || 1);
  const servingsLabel = servings === 1 ? t('common.servingsOne') : t('common.servingsLong', { n: servings });
  const labels = { ingredients: t('recipe.ingredients'), steps: t('recipe.steps'), servings: servingsLabel };

  const onDelete = async () => {
    if (!(await confirm(t('recipe.deleteConfirm', { title: recipe.title }), t('common.delete'), t('common.cancel')))) return;
    deleteLocalImage(recipe.image);
    deleteRecipe(recipe.id);
    router.back();
  };

  const onShare = async () => {
    const res = await shareText(recipeAsText(recipe, servings, lang, labels), recipe.title);
    if (res === 'copied') toast(t('common.copied'));
  };

  const times = [
    recipe.prepMinutes ? `${t('recipe.prep')} ${formatMinutes(recipe.prepMinutes, lang)}` : '',
    recipe.cookMinutes ? `${t('recipe.cookTime')} ${formatMinutes(recipe.cookMinutes, lang)}` : '',
  ].filter(Boolean);

  const ingredientsBlock = (
    <Section
      title={t('recipe.ingredients')}
      right={<Stepper value={servings} onChange={setServings} label={t('edit.servings')} format={(n) => t('common.servings', { n })} />}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text variant="sm" bold>
            {t('recipe.grams')}
          </Text>
          <Text variant="xs" tone="muted">
            {t('recipe.gramsHint')}
          </Text>
        </View>
        <Switch
          value={grams}
          onValueChange={(v) => setSettings({ grams: v })}
          accessibilityLabel={t('recipe.grams')}
          trackColor={{ true: c.accent, false: c['border-input'] }}
          thumbColor={c.surface}
        />
      </Row>
      {recipe.ingredients.length ? (
        <View>
          {recipe.ingredients.map((ing, i) => {
            const scaled = scaleIngredient(ing, factor);
            const d = displayIngredient(grams ? toGrams(scaled) : scaled, lang);
            return (
              <View key={ing.id}>
                {i > 0 ? <Divider /> : null}
                <View style={{ flexDirection: 'row', paddingVertical: space[2], gap: space[3] }}>
                  <Text bold style={{ minWidth: 92 }}>
                    {[d.qtyText, d.unitText].filter(Boolean).join(' ')}
                  </Text>
                  <Text style={{ flex: 1 }}>
                    {d.name}
                    {d.note ? <Text tone="muted">{`, ${d.note}`}</Text> : null}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text tone="muted">{t('recipe.noIngredients')}</Text>
      )}
    </Section>
  );

  const stepsBlock = (
    <Section title={t('recipe.steps')}>
      {recipe.steps.length ? (
        recipe.steps.map((s, i) => (
          <View key={s.id} style={{ flexDirection: 'row', gap: space[3] }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c['accent-soft'], alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="sm" tone="accent" bold>
                {i + 1}
              </Text>
            </View>
            <View style={{ flex: 1, gap: space[1] }}>
              <Text>{s.text}</Text>
              {s.timerSeconds ? (
                <Row gap={4}>
                  <Timer size={14} color={c['text-muted']} />
                  <Text variant="xs" tone="muted">
                    {formatClock(s.timerSeconds)}
                  </Text>
                </Row>
              ) : null}
            </View>
          </View>
        ))
      ) : (
        <Text tone="muted">{t('recipe.noSteps')}</Text>
      )}
    </Section>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: wide ? recipe.title : '',
          headerRight: () => (
            <Row gap={0}>
              <IconButton
                icon={Heart}
                label={t('home.filter.favourites')}
                color={recipe.favourite ? c.accent : c.text}
                onPress={() => toggleFavourite(recipe.id)}
              />
              <IconButton icon={Share2} label={t('common.share')} onPress={onShare} />
              <IconButton icon={Pencil} label={t('common.edit')} onPress={() => router.push(`/edit/${recipe.id}`)} />
            </Row>
          ),
        }}
      />
      <Page>
        {imported ? (
          <Banner icon={Info}>
            <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }} gap={space[2]}>
              <Text variant="sm" style={{ flex: 1, minWidth: 180 }}>
                {t('edit.review')}
              </Text>
              <Button label={t('common.edit')} size="sm" variant="secondary" icon={Pencil} onPress={() => router.push(`/edit/${recipe.id}`)} />
            </Row>
          </Banner>
        ) : null}

        <View style={{ flexDirection: wide ? 'row' : 'column', gap: space[5] }}>
          <View style={{ flex: wide ? 1 : undefined }}>
            <RecipeImage recipe={recipe} height={wide ? 300 : Math.min(260, width * 0.62)} />
          </View>
          <View style={{ flex: wide ? 1 : undefined, gap: space[3], justifyContent: 'center' }}>
            <Text variant="xs" tone="accent" bold style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {[t(`dish.${recipe.dishType}`), ...recipe.tags].join(' · ')}
            </Text>
            <Text variant="xl" serif accessibilityRole="header">
              {recipe.title}
            </Text>
            <Row wrap gap={space[3]}>
              {recipe.totalMinutes ? (
                <Row gap={4}>
                  <Clock size={16} color={c['text-muted']} />
                  <Text variant="sm" tone="muted">
                    {formatMinutes(recipe.totalMinutes, lang)}
                  </Text>
                </Row>
              ) : null}
              {times.length ? (
                <Text variant="sm" tone="muted">
                  {times.join(' · ')}
                </Text>
              ) : null}
              {recipe.cookedCount ? (
                <Text variant="sm" tone="muted">
                  {t('recipe.cooked', { n: recipe.cookedCount })}
                </Text>
              ) : null}
            </Row>
            {recipe.sourceUrl ? (
              <Pressable
                onPress={() => Linking.openURL(recipe.sourceUrl!)}
                accessibilityRole="link"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
              >
                <ExternalLink size={14} color={c['accent-text']} />
                <Text variant="sm" tone="accent" bold>
                  {t('recipe.openSource')} · {t(`source.${recipe.sourceType}`)}
                  {recipe.author ? ` · ${recipe.author}` : ''}
                </Text>
              </Pressable>
            ) : null}
            <Row gap={space[2]} wrap>
              <Button label={t('recipe.cook')} icon={ChefHat} onPress={() => router.push({ pathname: '/cook/[id]', params: { id: recipe.id, servings: String(servings) } })} />
              <Button label={t('recipe.plan')} icon={CalendarDays} variant="secondary" onPress={() => router.push({ pathname: '/pick', params: { recipeId: recipe.id } })} />
            </Row>
          </View>
        </View>

        {allergens.length ? (
          <Banner tone="warning" icon={TriangleAlert}>
            <Text variant="sm" bold>
              {t('recipe.allergens', { list: allergens.map((a) => ALLERGEN_LABEL[lang][a]).join(', ') })}
            </Text>
            <Text variant="xs" tone="muted">
              {t('recipe.allergensHint')}
            </Text>
          </Banner>
        ) : null}

        {recipe.nutrition && Object.values(recipe.nutrition).some((v) => v) ? (
          <View style={{ gap: space[2] }}>
            <Text variant="sm" bold>
              {t('recipe.nutrition')}
            </Text>
            <Row gap={space[2]} wrap>
              {(
                [
                  ['kcal', recipe.nutrition.kcal, t('recipe.kcal')],
                  ['protein', recipe.nutrition.protein, t('recipe.protein')],
                  ['carbs', recipe.nutrition.carbs, t('recipe.carbs')],
                  ['fat', recipe.nutrition.fat, t('recipe.fat')],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([k, v, label]) => (
                  <View key={k} style={{ backgroundColor: c['surface-2'], borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[2], minWidth: 76 }}>
                    <Text bold>{k === 'kcal' ? v : `${v} g`}</Text>
                    <Text variant="xs" tone="muted">
                      {label}
                    </Text>
                  </View>
                ))}
            </Row>
          </View>
        ) : null}

        <View style={{ flexDirection: wide ? 'row' : 'column', gap: space[6], alignItems: 'flex-start' }}>
          <View style={{ flex: wide ? 2 : undefined, alignSelf: 'stretch' }}>{ingredientsBlock}</View>
          <View style={{ flex: wide ? 3 : undefined, alignSelf: 'stretch' }}>{stepsBlock}</View>
        </View>

        {recipe.notes ? (
          <Section title={t('recipe.notes')}>
            <Text tone="muted">{recipe.notes}</Text>
          </Section>
        ) : null}

        <Divider />
        <View style={{ gap: space[3] }}>
          <Row wrap gap={space[2]}>
            <Button label={t('recipe.addToNotebook')} icon={FolderOpen} variant="secondary" size="sm" onPress={() => setShowNotebooks((v) => !v)} />
            <Button label={t('recipe.print')} icon={Printer} variant="secondary" size="sm" onPress={() => printRecipe(recipe, servings, lang, labels)} />
            <Button
              label={t('recipe.exportFile')}
              icon={FileDown}
              variant="secondary"
              size="sm"
              onPress={async () => shareJson(recipe.title, { app: 'popote', version: 1, exportedAt: new Date().toISOString(), recipes: [recipe] })}
            />
            <Button label={t('common.delete')} icon={Trash2} variant="danger" size="sm" onPress={onDelete} />
          </Row>
          {showNotebooks ? (
            notebooks.length ? (
              <Row wrap gap={space[2]}>
                {notebooks.map((n) => (
                  <Chip key={n.id} label={n.name} selected={n.recipeIds.includes(recipe.id)} onPress={() => toggleInNotebook(n.id, recipe.id)} />
                ))}
              </Row>
            ) : (
              <Row gap={space[2]} wrap>
                <Text variant="sm" tone="muted">
                  {t('notebooks.empty')}
                </Text>
                <Button label={t('notebooks.new')} size="sm" variant="ghost" onPress={() => router.push('/notebooks')} />
              </Row>
            )
          ) : null}
        </View>
      </Page>
    </>
  );
}

const ALLERGEN_LABEL = {
  fr: {
    gluten: 'gluten', crustaceans: 'crustacés', eggs: 'œufs', fish: 'poisson', peanuts: 'arachides', soy: 'soja', milk: 'lait',
    nuts: 'fruits à coque', celery: 'céleri', mustard: 'moutarde', sesame: 'sésame', sulphites: 'sulfites', lupin: 'lupin', molluscs: 'mollusques',
  },
  en: {
    gluten: 'gluten', crustaceans: 'crustaceans', eggs: 'eggs', fish: 'fish', peanuts: 'peanuts', soy: 'soy', milk: 'milk',
    nuts: 'tree nuts', celery: 'celery', mustard: 'mustard', sesame: 'sesame', sulphites: 'sulphites', lupin: 'lupin', molluscs: 'molluscs',
  },
} as const;

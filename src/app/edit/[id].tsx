import { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { RecipeImage } from '../../components/RecipeCard';
import { Page } from '../../components/layout';
import { Button, Chip, Field, Row, Stepper, Text } from '../../components/ui';
import { useT } from '../../i18n';
import { deleteLocalImage, pickImages } from '../../lib/media';
import { parseIngredient } from '../../lib/parse/ingredient';
import { findDurationSeconds } from '../../lib/parse/duration';
import { ingredientLine } from '../../lib/scale';
import { uid } from '../../lib/text';
import { DISH_TYPES, type DishType, type Ingredient, type Nutrition, type Recipe, type RecipeDraft, type Step } from '../../lib/types';
import { useStore } from '../../store';
import { space } from '../../theme';

const num = (s: string): number | undefined => {
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const existing = useStore((s) => (isNew ? undefined : s.recipes[id]));
  const { addRecipe, updateRecipe } = useStore.getState();
  const { t, lang } = useT();

  // Ingredients are edited as text lines; lines that did not change keep their parsed form.
  const initialLines = useMemo(() => (existing?.ingredients ?? []).map((i) => i.raw || ingredientLine(i, lang)), [existing, lang]);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [servings, setServings] = useState(existing?.servings ?? 4);
  const [prep, setPrep] = useState(existing?.prepMinutes ? String(existing.prepMinutes) : '');
  const [cook, setCook] = useState(existing?.cookMinutes ? String(existing.cookMinutes) : '');
  const [dish, setDish] = useState<DishType>(existing?.dishType ?? 'main');
  const [ingredients, setIngredients] = useState(initialLines.join('\n'));
  const [steps, setSteps] = useState((existing?.steps ?? []).map((s) => s.text).join('\n'));
  const [tags, setTags] = useState((existing?.tags ?? []).join(', '));
  const [source, setSource] = useState(existing?.sourceUrl ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [image, setImage] = useState(existing?.image);
  const [nutrition, setNutrition] = useState<Record<keyof Nutrition, string>>({
    kcal: existing?.nutrition?.kcal ? String(existing.nutrition.kcal) : '',
    protein: existing?.nutrition?.protein ? String(existing.nutrition.protein) : '',
    carbs: existing?.nutrition?.carbs ? String(existing.nutrition.carbs) : '',
    fat: existing?.nutrition?.fat ? String(existing.nutrition.fat) : '',
  });
  const [error, setError] = useState<string>();

  const choosePhoto = async (camera: boolean) => {
    const [img] = await pickImages({ camera });
    if (img) setImage(img.uri);
  };

  const save = () => {
    if (!title.trim()) {
      setError(t('edit.titleRequired'));
      return;
    }
    const byRaw = new Map((existing?.ingredients ?? []).map((i) => [i.raw || ingredientLine(i, lang), i]));
    const ings: Ingredient[] = ingredients
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => byRaw.get(l) ?? parseIngredient(l));
    const oldSteps = new Map((existing?.steps ?? []).map((s) => [s.text, s]));
    const stp: Step[] = steps
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text) => oldSteps.get(text) ?? { id: uid(), text, timerSeconds: findDurationSeconds(text) });
    const p = num(prep);
    const ck = num(cook);
    const nut: Nutrition = { kcal: num(nutrition.kcal), protein: num(nutrition.protein), carbs: num(nutrition.carbs), fat: num(nutrition.fat) };
    const patch: Partial<Recipe> = {
      title: title.trim(),
      servings,
      prepMinutes: p,
      cookMinutes: ck,
      totalMinutes: p || ck ? (p ?? 0) + (ck ?? 0) : existing?.totalMinutes,
      dishType: dish,
      ingredients: ings,
      steps: stp,
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      sourceUrl: source.trim() || undefined,
      notes: notes.trim() || undefined,
      image,
      nutrition: Object.values(nut).some((v) => v) ? nut : undefined,
    };
    if (existing && existing.image && existing.image !== image) deleteLocalImage(existing.image);
    if (existing) {
      // a recipe whose times were not edited keeps its imported total
      if (!p && !ck && existing.prepMinutes === undefined && existing.cookMinutes === undefined) patch.totalMinutes = existing.totalMinutes;
      updateRecipe(existing.id, patch);
      router.back();
    } else {
      const r = addRecipe({ sourceType: 'manual', ...patch } as RecipeDraft);
      router.replace(`/recipe/${r.id}`);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isNew ? t('edit.titleNew') : t('edit.titleEdit'),
          headerRight: () => <Button label={t('common.save')} size="sm" onPress={save} style={{ marginRight: space[2] }} />,
        }}
      />
      <Page>
        <Field label={t('edit.name')} value={title} onChangeText={(v) => (setTitle(v), setError(undefined))} placeholder={t('edit.namePh')} error={error} autoFocus={isNew} />

        <View style={{ gap: space[2] }}>
          <Text variant="sm" bold>
            {t('edit.photo')}
          </Text>
          {image ? (
            <View style={{ width: 180 }}>
              <RecipeImage recipe={{ image, title }} height={130} />
            </View>
          ) : null}
          <Row wrap>
            <Button label={t('edit.photoPick')} icon={ImageIcon} variant="secondary" size="sm" onPress={() => choosePhoto(false)} />
            {Platform.OS !== 'web' ? <Button label={t('edit.photoCamera')} icon={Camera} variant="secondary" size="sm" onPress={() => choosePhoto(true)} /> : null}
            {image ? <Button label={t('edit.photoRemove')} icon={X} variant="ghost" size="sm" onPress={() => setImage(undefined)} /> : null}
          </Row>
        </View>

        <View style={{ gap: space[2] }}>
          <Text variant="sm" bold>
            {t('edit.servings')}
          </Text>
          <Stepper value={servings} onChange={setServings} label={t('edit.servings')} />
        </View>

        <Row gap={space[3]}>
          <View style={{ flex: 1 }}>
            <Field label={t('edit.prep')} value={prep} onChangeText={setPrep} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t('edit.cook')} value={cook} onChangeText={setCook} keyboardType="number-pad" />
          </View>
        </Row>

        <View style={{ gap: space[2] }}>
          <Text variant="sm" bold>
            {t('edit.dish')}
          </Text>
          <Row wrap>
            {DISH_TYPES.map((d) => (
              <Chip key={d} label={t(`dish.${d}`)} selected={dish === d} onPress={() => setDish(d)} />
            ))}
          </Row>
        </View>

        <Field label={t('edit.ingredients')} value={ingredients} onChangeText={setIngredients} placeholder={t('edit.ingredientsPh')} multiline style={{ minHeight: 180 }} />
        <Field label={t('edit.steps')} value={steps} onChangeText={setSteps} placeholder={t('edit.stepsPh')} multiline style={{ minHeight: 200 }} />
        <Field label={t('edit.tags')} value={tags} onChangeText={setTags} placeholder={t('edit.tagsPh')} />

        <View style={{ gap: space[2] }}>
          <Text variant="sm" bold>
            {t('edit.nutrition')}
          </Text>
          <Row gap={space[2]} wrap>
            {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
              <View key={k} style={{ flexGrow: 1, flexBasis: 120 }}>
                <Field
                  value={nutrition[k]}
                  onChangeText={(v) => setNutrition((n) => ({ ...n, [k]: v }))}
                  placeholder={k === 'kcal' ? t('recipe.kcal') : `${t(`recipe.${k}`)} (g)`}
                  accessibilityLabel={k === 'kcal' ? t('recipe.kcal') : t(`recipe.${k}`)}
                  keyboardType="number-pad"
                />
              </View>
            ))}
          </Row>
        </View>

        <Field label={t('edit.source')} value={source} onChangeText={setSource} autoCapitalize="none" keyboardType="url" placeholder="https://" />
        <Field label={t('edit.notes')} value={notes} onChangeText={setNotes} multiline />

        <Button label={t('common.save')} size="lg" onPress={save} />
      </Page>
    </>
  );
}

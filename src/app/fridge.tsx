import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Plus, Refrigerator } from 'lucide-react-native';
import { RecipeRow } from '../components/RecipeCard';
import { Page } from '../components/layout';
import { Chip, EmptyState, Field, IconButton, Row, Text } from '../components/ui';
import { useT } from '../i18n';
import { matchRecipes } from '../lib/match';
import { useStore } from '../store';
import { space, useTheme } from '../theme';

export default function Fridge() {
  const { c } = useTheme();
  const { t } = useT();
  const recipes = useStore((s) => s.recipes);
  const [have, setHave] = useState<string[]>([]);
  const [text, setText] = useState('');
  const matches = useMemo(() => matchRecipes(have, Object.values(recipes)), [have, recipes]);

  const add = () => {
    const items = text.split(',').map((s) => s.trim()).filter(Boolean);
    if (items.length) setHave((h) => [...new Set([...h, ...items])]);
    setText('');
  };

  return (
    <Page>
      <View style={{ gap: space[2] }}>
        <Text variant="lg">{t('fridge.title')}</Text>
        <Text tone="muted">{t('fridge.body')}</Text>
      </View>
      <Row gap={space[2]}>
        <View style={{ flex: 1 }}>
          <Field value={text} onChangeText={setText} placeholder={t('fridge.addPh')} onSubmitEditing={add} returnKeyType="done" blurOnSubmit={false} accessibilityLabel={t('fridge.addPh')} />
        </View>
        <IconButton icon={Plus} label={t('common.add')} tone="accent" onPress={add} disabled={!text.trim()} />
      </Row>
      {have.length ? (
        <Row wrap gap={space[2]}>
          {have.map((h) => (
            <Chip key={h} label={h} selected onRemove={() => setHave((all) => all.filter((x) => x !== h))} />
          ))}
        </Row>
      ) : null}
      {have.length && !matches.length ? <EmptyState icon={Refrigerator} title={t('fridge.none')} /> : null}
      {matches.map((m) => {
        const total = m.have.length + m.missing.length;
        return (
          <View key={m.recipe.id} style={{ borderBottomWidth: 1, borderColor: c.border, paddingBottom: space[2] }}>
            <RecipeRow recipe={m.recipe} onPress={() => router.push(`/recipe/${m.recipe.id}`)} />
            <Text variant="sm" tone={m.missing.length ? 'muted' : 'success'} bold>
              {m.missing.length ? t('fridge.have', { n: m.have.length, total }) : t('fridge.complete')}
            </Text>
            {m.missing.length ? (
              <Text variant="xs" tone="muted" numberOfLines={2}>
                {t('fridge.missing', { list: m.missing.join(', ') })}
              </Text>
            ) : null}
          </View>
        );
      })}
    </Page>
  );
}

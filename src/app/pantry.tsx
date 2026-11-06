import { useState } from 'react';
import { View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Page } from '../components/layout';
import { Chip, Field, IconButton, Row, Section, Text } from '../components/ui';
import { useT } from '../i18n';
import { useStore } from '../store';
import { space } from '../theme';

const SUGGESTIONS = {
  fr: ['Sel', 'Poivre', "Huile d'olive", 'Huile de tournesol', 'Vinaigre', 'Farine', 'Sucre', 'Beurre', 'Moutarde', 'Riz', 'Pâtes', 'Ail', 'Oignons', 'Herbes de Provence', 'Bouillon cube', 'Levure chimique'],
  en: ['Salt', 'Pepper', 'Olive oil', 'Sunflower oil', 'Vinegar', 'Flour', 'Sugar', 'Butter', 'Mustard', 'Rice', 'Pasta', 'Garlic', 'Onions', 'Dried herbs', 'Stock cubes', 'Baking powder'],
};

export default function Pantry() {
  const { t, lang } = useT();
  const pantry = useStore((s) => s.pantry);
  const { addPantry, removePantry } = useStore.getState();
  const [text, setText] = useState('');
  const has = new Set(pantry.map((p) => p.name.toLowerCase()));

  const add = () => {
    text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach(addPantry);
    setText('');
  };

  return (
    <Page>
      <Text tone="muted">{t('pantry.body')}</Text>
      <Row gap={space[2]}>
        <View style={{ flex: 1 }}>
          <Field value={text} onChangeText={setText} placeholder={t('pantry.addPh')} onSubmitEditing={add} returnKeyType="done" blurOnSubmit={false} />
        </View>
        <IconButton icon={Plus} label={t('common.add')} tone="accent" onPress={add} disabled={!text.trim()} />
      </Row>
      <Section title={t('pantry.title')}>
        {pantry.length ? (
          <Row wrap gap={space[2]}>
            {pantry.map((p) => (
              <Chip key={p.id} label={p.name} selected onRemove={() => removePantry(p.id)} />
            ))}
          </Row>
        ) : (
          <Text tone="muted">{t('pantry.empty')}</Text>
        )}
      </Section>
      <Section title={t('pantry.suggestions')}>
        <Row wrap gap={space[2]}>
          {SUGGESTIONS[lang]
            .filter((s) => !has.has(s.toLowerCase()))
            .map((s) => (
              <Chip key={s} label={`+ ${s}`} onPress={() => addPantry(s)} />
            ))}
        </Row>
      </Section>
    </Page>
  );
}

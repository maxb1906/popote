import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Eraser, House, Plus, RotateCcw, Share2, ShoppingCart, Store } from 'lucide-react-native';
import { Page, useUi } from '../../components/layout';
import { Button, Divider, EmptyState, Field, IconButton, Row, Section, Text } from '../../components/ui';
import { confirm, toast } from '../../components/feedback';
import { useT } from '../../i18n';
import { addDays, formatDay } from '../../lib/dates';
import { shareText } from '../../lib/share';
import { itemQuantityText } from '../../lib/shopping';
import { manualItem, useShopping } from '../../lib/useShopping';
import { useStore } from '../../store';
import { ItemRow } from '../../components/ItemRow';
import { radius, space, useTheme } from '../../theme';

export default function Shopping() {
  const { c } = useTheme();
  const { t, lang } = useT();
  const { weekStart, setWeekStart } = useUi();
  const { groups, atHome, left, checked, total, items } = useShopping();
  const { toggleChecked, addManualItem, clearChecked, resetShopping, removeShoppingKey } = useStore.getState();
  const [text, setText] = useState('');

  const add = () => {
    const v = text.trim();
    if (!v) return;
    addManualItem(manualItem(v));
    setText('');
  };

  const onShare = async () => {
    const lines = groups.flatMap((g) => [
      `— ${t(`aisle.${g.aisle}`)} —`,
      ...g.items.filter((i) => !checked[i.key]).map((i) => `☐ ${i.name}${itemQuantityText(i, lang) ? ` : ${itemQuantityText(i, lang)}` : ''}`),
    ]);
    const res = await shareText([t('shop.forWeek', { date: formatDay(weekStart, lang, { day: 'numeric', month: 'long' }) }), '', ...lines].join('\n'));
    if (res === 'copied') toast(t('common.copied'));
  };

  const checkedKeys = items.filter((i) => checked[i.key]).map((i) => i.key);

  return (
    <Page>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon={ChevronLeft} label={t('common.previous')} tone="surface" onPress={() => setWeekStart(addDays(weekStart, -7))} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text bold>{t('shop.forWeek', { date: formatDay(weekStart, lang, { day: 'numeric', month: 'long' }) })}</Text>
          <Text variant="xs" tone="muted">
            {total ? (left ? t('shop.left', { n: left }) : t('shop.allDone')) : ' '}
          </Text>
        </View>
        <IconButton icon={ChevronRight} label={t('common.next')} tone="surface" onPress={() => setWeekStart(addDays(weekStart, 7))} />
      </Row>

      <Row gap={space[2]}>
        <View style={{ flex: 1 }}>
          <Field value={text} onChangeText={setText} placeholder={t('shop.addPh')} onSubmitEditing={add} returnKeyType="done" blurOnSubmit={false} />
        </View>
        <IconButton icon={Plus} label={t('common.add')} tone="accent" onPress={add} disabled={!text.trim()} />
      </Row>

      {!groups.length && !atHome.length ? (
        <EmptyState icon={ShoppingCart} title={t('shop.empty.title')} body={t('shop.empty.body')}>
          <Button label={t('tab.week')} variant="secondary" onPress={() => router.navigate('/week')} />
        </EmptyState>
      ) : (
        <>
          <Row wrap gap={space[2]}>
            <Button label={t('shop.store')} icon={Store} onPress={() => router.push('/store')} disabled={!total} style={{ flexGrow: 1 }} />
            <Button label={t('shop.share')} icon={Share2} variant="secondary" onPress={onShare} style={{ flexGrow: 1 }} />
          </Row>
          {groups.map((g) => (
            <Section key={g.aisle} title={t(`aisle.${g.aisle}`)}>
              <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                {g.items.map((i, k) => (
                  <View key={i.key}>
                    {k > 0 ? <Divider /> : null}
                    <ItemRow item={i} checked={!!checked[i.key]} onToggle={() => toggleChecked(i.key)} onRemove={() => removeShoppingKey(i.key)} />
                  </View>
                ))}
              </View>
            </Section>
          ))}
          {atHome.length ? (
            <Section
              title={t('shop.atHome')}
              right={<Button label={t('shop.pantry')} icon={House} variant="ghost" size="sm" onPress={() => router.push('/pantry')} />}
            >
              <View style={[styles.card, { backgroundColor: c['surface-2'], borderColor: c.border }]}>
                {atHome.map((i, k) => (
                  <View key={i.key}>
                    {k > 0 ? <Divider /> : null}
                    <ItemRow item={i} checked={!!checked[i.key]} onToggle={() => toggleChecked(i.key)} />
                  </View>
                ))}
              </View>
            </Section>
          ) : (
            <Button label={t('shop.pantry')} icon={House} variant="ghost" onPress={() => router.push('/pantry')} />
          )}
          <Row wrap gap={space[2]}>
            <Button label={t('shop.clearChecked')} icon={Eraser} variant="secondary" size="sm" disabled={!checkedKeys.length} onPress={() => clearChecked(checkedKeys)} />
            <Button
              label={t('shop.reset')}
              icon={RotateCcw}
              variant="danger"
              size="sm"
              onPress={async () => {
                if (await confirm(t('shop.resetConfirm'), t('common.confirm'), t('common.cancel'))) resetShopping();
              }}
            />
          </Row>
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: space[3] },
});

import { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Download, FolderOpen, Code, House, KeyRound, Smartphone, Trash2, Upload } from 'lucide-react-native';
import { Page } from '../../components/layout';
import { Card, Chip, Divider, ListRow, Row, Section, Text } from '../../components/ui';
import { confirm, toast } from '../../components/feedback';
import { useT } from '../../i18n';
import { isBackup, makeBackup, mergeRecipes, pickFile, restoreImages, shareJson } from '../../lib/backup';
import { useStore } from '../../store';
import { space } from '../../theme';
import { REPO_URL } from '../../config';
import { installMode } from '../../lib/install';


export default function SettingsScreen() {
  const { t } = useT();
  const settings = useStore((s) => s.settings);
  const recipes = useStore((s) => s.recipes);
  const plan = useStore((s) => s.plan);
  const { setSettings, replaceAll } = useStore.getState();
  const [busy, setBusy] = useState(false);

  const exportAll = async () => {
    setBusy(true);
    try {
      const s = useStore.getState();
      const backup = await makeBackup({ recipes: Object.values(s.recipes), notebooks: s.notebooks, plan: s.plan, pantry: s.pantry });
      await shareJson(`popote-${new Date().toISOString().slice(0, 10)}`, backup);
    } finally {
      setBusy(false);
    }
  };

  const importAll = async () => {
    const f = await pickFile();
    if (!f?.text) return;
    let data: unknown;
    try {
      data = JSON.parse(f.text);
    } catch {
      data = undefined;
    }
    if (!isBackup(data)) return toast(t('settings.importBad'), 'error');
    const s = useStore.getState();
    const { recipes: merged, changed } = mergeRecipes(s.recipes, restoreImages(data.recipes));
    const notebookIds = new Set(s.notebooks.map((n) => n.id));
    const planIds = new Set(s.plan.map((p) => p.id));
    const pantryNames = new Set(s.pantry.map((p) => p.name.toLowerCase()));
    replaceAll({
      recipes: merged,
      notebooks: [...s.notebooks, ...(data.notebooks ?? []).filter((n) => !notebookIds.has(n.id))],
      plan: [...s.plan, ...(data.plan ?? []).filter((p) => !planIds.has(p.id) && merged[p.recipeId])],
      pantry: [...s.pantry, ...(data.pantry ?? []).filter((p) => !pantryNames.has(p.name.toLowerCase()))],
    });
    toast(t('settings.importDone', { n: changed }));
  };

  const wipe = async () => {
    if (!(await confirm(t('settings.wipeConfirm'), t('settings.wipe'), t('common.cancel')))) return;
    replaceAll({ recipes: {}, notebooks: [], plan: [], pantry: [], shopping: { checked: {}, removed: {}, manual: [] } });
  };

  return (
    <Page>
      <Section title={t('settings.language')}>
        <Row gap={space[2]}>
          <Chip label="Français" selected={settings.language === 'fr'} onPress={() => setSettings({ language: 'fr' })} />
          <Chip label="English" selected={settings.language === 'en'} onPress={() => setSettings({ language: 'en' })} />
        </Row>
      </Section>

      <Section title={t('settings.theme')}>
        <Row gap={space[2]} wrap>
          {(['system', 'light', 'dark'] as const).map((th) => (
            <Chip key={th} label={t(`settings.theme.${th}`)} selected={settings.theme === th} onPress={() => setSettings({ theme: th })} />
          ))}
        </Row>
      </Section>

      <Section title={t('settings.data')}>
        <Text variant="sm" tone="muted">
          {t('settings.dataBody')}
        </Text>
        <Text variant="sm" bold>
          {t('settings.stats', { r: Object.keys(recipes).length, p: plan.length })}
        </Text>
        <Card style={{ paddingHorizontal: space[4] }}>
          <ListRow icon={Upload} title={t('settings.export')} onPress={busy ? undefined : exportAll} />
          <Divider />
          <ListRow icon={Download} title={t('settings.import')} onPress={importAll} />
          <Divider />
          <ListRow icon={House} title={t('settings.pantry')} onPress={() => router.push('/pantry')} />
          <Divider />
          <ListRow icon={FolderOpen} title={t('settings.notebooks')} onPress={() => router.push('/notebooks')} />
        </Card>
      </Section>

      <Section title={t('settings.ai')}>
        <Text variant="sm" tone="muted">
          {t('settings.aiBody')}
        </Text>
        <Card style={{ paddingHorizontal: space[4] }}>
          <ListRow
            icon={KeyRound}
            title={t('ai.title')}
            subtitle={settings.ai ? t('settings.aiOn', { model: settings.ai.model }) : t('settings.aiOff')}
            onPress={() => router.push('/ai')}
          />
        </Card>
      </Section>

      <Section title={t('settings.about')}>
        <Text variant="sm" tone="muted">
          {t('settings.aboutBody')}
        </Text>
        <Card style={{ paddingHorizontal: space[4] }}>
          <ListRow icon={Code} title={t('settings.source')} subtitle={REPO_URL} onPress={() => Linking.openURL(REPO_URL)} />
          {installMode() !== 'native' && installMode() !== 'installed' ? (
            <>
              <Divider />
              <ListRow icon={Smartphone} title={t('settings.install')} onPress={() => router.push('/install')} />
            </>
          ) : null}
        </Card>
        <Text variant="xs" tone="muted">
          {t('settings.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}
        </Text>
      </Section>

      <View>
        <Card style={{ paddingHorizontal: space[4] }}>
          <ListRow icon={Trash2} title={t('settings.wipe')} danger onPress={wipe} />
        </Card>
      </View>
    </Page>
  );
}

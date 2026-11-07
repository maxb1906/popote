import { useState } from 'react';
import { Linking, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { CircleCheck, Compass, Copy, Download, EyeOff, type LucideIcon, Share, SquarePlus, Smartphone } from 'lucide-react-native';
import { Page } from '../components/layout';
import { toast } from '../components/feedback';
import { Banner, Button, Card, Row, Section, Text } from '../components/ui';
import { REPO_URL } from '../config';
import { useT } from '../i18n';
import { appUrl, installMode } from '../lib/install';
import { radius, space, useTheme } from '../theme';

function Step({ n, icon: Icon, text, hint }: { n: number; icon: LucideIcon; text: string; hint?: string }) {
  const { c } = useTheme();
  return (
    <Row gap={space[3]} style={{ alignItems: 'flex-start', paddingVertical: space[3] }}>
      <View style={{ width: 32, height: 32, borderRadius: radius.pill, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text tone="onAccent" bold>
          {n}
        </Text>
      </View>
      <View style={{ flex: 1, gap: space[1] }}>
        <Row gap={space[2]} style={{ alignItems: 'flex-start' }}>
          <Icon size={20} color={c['accent-text']} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1 }}>{text}</Text>
        </Row>
        {hint ? (
          <Text variant="sm" tone="muted">
            {hint}
          </Text>
        ) : null}
      </View>
    </Row>
  );
}

function CopyLink() {
  const { t } = useT();
  const url = appUrl();
  return (
    <View style={{ gap: space[2] }}>
      <Text variant="sm" tone="muted" selectable>
        {url}
      </Text>
      <Button
        icon={Copy}
        label={t('install.copy')}
        variant="secondary"
        onPress={async () => {
          // Some in-app browsers refuse clipboard access: the address stays shown above, selectable.
          if (await Clipboard.setStringAsync(url).catch(() => false)) toast(t('common.copied'));
        }}
      />
    </View>
  );
}

export default function Install() {
  const { t } = useT();
  const [mode] = useState(installMode);

  if (mode === 'installed' || mode === 'native') {
    return (
      <Page>
        <Banner icon={CircleCheck}>{t('install.done')}</Banner>
      </Page>
    );
  }

  if (mode === 'android' || mode === 'desktop') {
    return (
      <Page>
        <Text>{mode === 'android' ? t('install.android') : t('install.desktop')}</Text>
        {mode === 'android' ? <Button icon={Download} label={t('install.releases')} onPress={() => Linking.openURL(`${REPO_URL}/releases/latest`)} /> : <CopyLink />}
      </Page>
    );
  }

  return (
    <Page>
      {mode === 'in-app' ? (
        <Section title={t('install.inapp.title')}>
          <Text tone="muted">{t('install.inapp.body')}</Text>
          <Card style={{ paddingHorizontal: space[4] }}>
            <Step n={1} icon={Compass} text={t('install.inapp.step1')} />
            <Step n={2} icon={Copy} text={t('install.inapp.step2')} />
          </Card>
          <CopyLink />
        </Section>
      ) : null}

      {mode === 'other-browser' ? (
        <Section title={t('install.other.title')}>
          <Text tone="muted">{t('install.other.body')}</Text>
          <CopyLink />
        </Section>
      ) : null}

      <Section title={t('install.safari.title')}>
        <Card style={{ paddingHorizontal: space[4] }}>
          <Step n={1} icon={Share} text={t('install.step1')} hint={t('install.step1b')} />
          <Step n={2} icon={SquarePlus} text={t('install.step2')} hint={t('install.step2b')} />
          <Step n={3} icon={Smartphone} text={t('install.step3')} />
        </Card>
        <Banner icon={EyeOff}>{t('install.private')}</Banner>
      </Section>
    </Page>
  );
}

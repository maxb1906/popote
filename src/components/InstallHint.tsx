import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Compass, Smartphone } from 'lucide-react-native';
import { Banner, Button, Row, Text } from './ui';
import { useT } from '../i18n';
import { dismissHint, hintDismissed, installMode } from '../lib/install';
import { space } from '../theme';

/** Web on iPhone / iPad only: tells people how to put Popote on the home screen. */
export function InstallHint() {
  const { t } = useT();
  const [mode] = useState(installMode);
  const [hidden, setHidden] = useState(hintDismissed);
  if (hidden || (mode !== 'safari' && mode !== 'other-browser' && mode !== 'in-app')) return null;

  const inApp = mode === 'in-app';
  const text = inApp ? t('install.banner.inapp') : mode === 'other-browser' ? t('install.banner.other') : t('install.banner.safari');
  return (
    <Banner tone={inApp ? 'warning' : 'info'} icon={inApp ? Compass : Smartphone}>
      <View style={{ gap: space[2] }}>
        <Text variant="sm">{text}</Text>
        <Row gap={space[2]} style={{ flexWrap: 'wrap' }}>
          <Button size="sm" label={t('install.how')} onPress={() => router.push('/install')} />
          {inApp ? null : (
            <Button
              size="sm"
              variant="ghost"
              label={t('install.later')}
              onPress={() => {
                dismissHint();
                setHidden(true);
              }}
            />
          )}
        </Row>
      </View>
    </Banner>
  );
}

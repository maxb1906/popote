import { useState } from 'react';
import { router } from 'expo-router';
import { Check, Trash2, Zap } from 'lucide-react-native';
import { Page } from '../components/layout';
import { Banner, Button, Chip, Field, Row, Section, Text } from '../components/ui';
import { toast } from '../components/feedback';
import { useT } from '../i18n';
import { DEFAULT_MODELS, aiErrorMessage, aiTest } from '../lib/ai';
import type { AiProvider, AiSettings } from '../lib/types';
import { useStore } from '../store';
import { space } from '../theme';

export default function AiSettingsScreen() {
  const { t, lang } = useT();
  const current = useStore((s) => s.settings.ai);
  const setSettings = useStore((s) => s.setSettings);
  const [provider, setProvider] = useState<AiProvider>(current?.provider ?? 'anthropic');
  const [model, setModel] = useState(current?.model ?? DEFAULT_MODELS.anthropic);
  const [apiKey, setApiKey] = useState(current?.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(current?.baseUrl ?? 'https://api.openai.com/v1');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const value = (): AiSettings => ({
    provider,
    model: model.trim() || DEFAULT_MODELS[provider],
    apiKey: apiKey.trim(),
    baseUrl: provider === 'openai' ? baseUrl.trim() : undefined,
  });
  // a local Ollama needs no key; Anthropic always does
  const canSave = provider === 'openai' ? !!baseUrl.trim() : !!apiKey.trim();

  const switchProvider = (p: AiProvider) => {
    setProvider(p);
    if (!model || Object.values(DEFAULT_MODELS).includes(model)) setModel(DEFAULT_MODELS[p]);
    setResult(null);
  };

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      await aiTest(value(), lang);
      setResult({ ok: true, msg: t('ai.testOk') });
    } catch (e) {
      setResult({ ok: false, msg: aiErrorMessage(e) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Page>
      <Text tone="muted">{t('ai.body')}</Text>
      <Section title={t('ai.provider')}>
        <Row wrap gap={space[2]}>
          <Chip label={t('ai.anthropic')} selected={provider === 'anthropic'} onPress={() => switchProvider('anthropic')} />
          <Chip label={t('ai.openai')} selected={provider === 'openai'} onPress={() => switchProvider('openai')} />
        </Row>
      </Section>
      {provider === 'openai' ? (
        <Field label={t('ai.baseUrl')} value={baseUrl} onChangeText={setBaseUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" hint="http://192.168.1.20:11434/v1 (Ollama)" />
      ) : null}
      <Field label={t('ai.model')} value={model} onChangeText={setModel} autoCapitalize="none" autoCorrect={false} />
      <Field
        label={t('ai.key')}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder={t('ai.keyPh')}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      {result ? <Banner tone={result.ok ? 'info' : 'error'}>{result.msg}</Banner> : null}
      <Row wrap gap={space[2]}>
        <Button label={t('ai.test')} icon={Zap} variant="secondary" onPress={test} loading={testing} disabled={!canSave} />
        <Button
          label={t('common.save')}
          icon={Check}
          disabled={!canSave}
          onPress={() => {
            setSettings({ ai: value() });
            toast(t('ai.saved'));
            router.back();
          }}
        />
        {current ? (
          <Button
            label={t('ai.remove')}
            icon={Trash2}
            variant="danger"
            onPress={() => {
              setSettings({ ai: undefined });
              router.back();
            }}
          />
        ) : null}
      </Row>
    </Page>
  );
}

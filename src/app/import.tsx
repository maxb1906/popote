import { useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Camera, ClipboardPaste, FileText, Image as ImageIcon, Info, Link, Pencil, TriangleAlert } from 'lucide-react-native';
import { Page } from '../components/layout';
import { Banner, Button, Field, Row, Text } from '../components/ui';
import { toast } from '../components/feedback';
import { useT } from '../i18n';
import { aiErrorMessage, aiExtract } from '../lib/ai';
import { isBackup, mergeRecipes, pickFile, restoreImages } from '../lib/backup';
import { importFromInput, type ImportError } from '../lib/import';
import { recipesFromHtml } from '../lib/import/jsonld';
import { pickImages } from '../lib/media';
import { parseRecipeText } from '../lib/parse/recipeText';
import type { RecipeDraft } from '../lib/types';
import { useStore } from '../store';
import { space } from '../theme';

export default function ImportScreen() {
  const { t, lang } = useT();
  const addRecipe = useStore((s) => s.addRecipe);
  const ai = useStore((s) => s.settings.ai);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState<null | 'link' | 'photo' | 'file'>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const finish = (drafts: RecipeDraft[]) => {
    const saved = drafts.map((d) => addRecipe({ ...d, title: d.title || t('import.untitled') }));
    if (!saved.length) return;
    toast(t('import.done', { n: saved.length }));
    if (saved.length === 1) router.replace({ pathname: '/recipe/[id]', params: { id: saved[0].id, imported: '1' } });
    else router.back();
  };

  const errorText = (e: ImportError) => {
    const msg = t(`import.err.${e.code}`);
    return e.url ? `${e.url}\n${msg}` : msg;
  };

  const run = async () => {
    setErrors([]);
    setBusy('link');
    try {
      const { drafts, errors: errs } = await importFromInput(input);
      setErrors(errs.map(errorText));
      if (drafts.length) finish(drafts);
    } finally {
      setBusy(null);
    }
  };

  const paste = async () => {
    const s = await Clipboard.getStringAsync();
    if (s) setInput((cur) => (cur ? `${cur}\n${s}` : s));
  };

  const photo = async (camera: boolean) => {
    setErrors([]);
    if (!ai) {
      setErrors([t('import.needAi')]);
      return;
    }
    const imgs = await pickImages({ camera, multiple: !camera, base64: true });
    if (!imgs.length) return;
    setBusy('photo');
    try {
      const drafts = await aiExtract(
        ai,
        { text: input, images: imgs.filter((i) => i.base64).map((i) => ({ data: i.base64!, mediaType: i.mediaType })) },
        lang,
        'photo',
      );
      if (!drafts.length) setErrors([t('import.err.no-recipe')]);
      else finish(drafts);
    } catch (e) {
      setErrors([t('import.err.ai', { msg: aiErrorMessage(e) })]);
    } finally {
      setBusy(null);
    }
  };

  const file = async () => {
    setErrors([]);
    const f = await pickFile();
    if (!f) return;
    setBusy('file');
    try {
      if (f.text !== undefined) {
        let json: unknown;
        try {
          json = JSON.parse(f.text);
        } catch {
          json = undefined;
        }
        if (isBackup(json)) {
          const state = useStore.getState();
          const { recipes, changed } = mergeRecipes(state.recipes, restoreImages(json.recipes));
          state.replaceAll({ recipes });
          toast(t('import.fromBackup', { n: changed }));
          router.back();
          return;
        }
        if (/<html|<script/i.test(f.text)) {
          const found = recipesFromHtml(f.text, undefined, 'file');
          if (found.length) return finish(found);
        }
        const d = parseRecipeText(f.text, { sourceType: 'file' });
        if (d.ingredients.length || d.steps.length) return finish([d]);
        setErrors([t('import.err.no-recipe')]);
        return;
      }
      if (f.base64) {
        if (!ai) {
          setErrors([t('import.needAi')]);
          return;
        }
        const isPdf = /pdf/.test(f.mimeType ?? '') || /\.pdf$/i.test(f.name);
        const mediaType = /png/.test(f.mimeType ?? '') ? 'image/png' : /webp/.test(f.mimeType ?? '') ? 'image/webp' : 'image/jpeg';
        const drafts = await aiExtract(ai, isPdf ? { pdf: f.base64 } : { images: [{ data: f.base64, mediaType }] }, lang, 'file');
        if (drafts.length) finish(drafts);
        else setErrors([t('import.err.no-recipe')]);
        return;
      }
      setErrors([t('import.fileUnknown')]);
    } catch (e) {
      setErrors([t('import.err.ai', { msg: aiErrorMessage(e) })]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page>
      <View style={{ gap: space[3] }}>
        <Field
          value={input}
          onChangeText={setInput}
          placeholder={t('import.placeholder')}
          multiline
          autoFocus={Platform.OS !== 'web'}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t('import.placeholder')}
          style={{ minHeight: 160 }}
          hint={t('import.hint')}
        />
        <Row wrap>
          <Button label={t('import.paste')} icon={ClipboardPaste} variant="secondary" size="sm" onPress={paste} />
        </Row>
        <Button label={busy === 'link' ? t('import.working') : t('import.go')} icon={Link} size="lg" onPress={run} loading={busy === 'link'} disabled={!input.trim() || !!busy} />
      </View>

      {errors.map((e, i) => (
        <Banner key={i} tone="error" icon={TriangleAlert}>
          {e}
        </Banner>
      ))}

      <View style={{ gap: space[2] }}>
        <Row wrap gap={space[2]}>
          <Button label={t('import.manual')} icon={Pencil} variant="secondary" onPress={() => router.replace('/edit/new')} disabled={!!busy} />
          <Button label={t('import.file')} icon={FileText} variant="secondary" onPress={file} loading={busy === 'file'} disabled={!!busy} />
          <Button label={t('import.photo')} icon={ImageIcon} variant="secondary" onPress={() => photo(false)} loading={busy === 'photo'} disabled={!!busy} />
          {Platform.OS !== 'web' ? <Button label={t('edit.photoCamera')} icon={Camera} variant="secondary" onPress={() => photo(true)} disabled={!!busy} /> : null}
        </Row>
        {!ai ? (
          <Banner icon={Info}>
            <Text variant="sm">{t('settings.aiBody')}</Text>
          </Banner>
        ) : null}
      </View>
    </Page>
  );
}

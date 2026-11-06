import { useState } from 'react';
import { View } from 'react-native';
import { FolderOpen, Pencil, Plus, Trash2, Check, X } from 'lucide-react-native';
import { Page } from '../components/layout';
import { Card, EmptyState, Field, IconButton, Row, Text } from '../components/ui';
import { confirm } from '../components/feedback';
import { useT } from '../i18n';
import { useStore } from '../store';
import { space, useTheme } from '../theme';

export default function Notebooks() {
  const { t } = useT();
  const { c } = useTheme();
  const notebooks = useStore((s) => s.notebooks);
  const recipes = useStore((s) => s.recipes);
  const { addNotebook, renameNotebook, deleteNotebook } = useStore.getState();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const create = () => {
    if (!name.trim()) return;
    addNotebook(name);
    setName('');
  };

  return (
    <Page>
      <Row gap={space[2]}>
        <View style={{ flex: 1 }}>
          <Field value={name} onChangeText={setName} placeholder={t('notebooks.namePh')} accessibilityLabel={t('notebooks.new')} onSubmitEditing={create} returnKeyType="done" />
        </View>
        <IconButton icon={Plus} label={t('notebooks.new')} tone="accent" onPress={create} disabled={!name.trim()} />
      </Row>
      {!notebooks.length ? (
        <EmptyState icon={FolderOpen} title={t('notebooks.title')} body={t('notebooks.empty')} />
      ) : (
        notebooks.map((n) => {
          const count = n.recipeIds.filter((id) => recipes[id]).length;
          return (
            <Card key={n.id} style={{ padding: space[3] }}>
              {editing === n.id ? (
                <Row gap={space[2]}>
                  <View style={{ flex: 1 }}>
                    <Field value={editName} onChangeText={setEditName} autoFocus accessibilityLabel={t('common.rename')} />
                  </View>
                  <IconButton
                    icon={Check}
                    label={t('common.save')}
                    tone="accent"
                    onPress={() => {
                      if (editName.trim()) renameNotebook(n.id, editName);
                      setEditing(null);
                    }}
                  />
                  <IconButton icon={X} label={t('common.cancel')} onPress={() => setEditing(null)} />
                </Row>
              ) : (
                <Row gap={space[2]}>
                  <FolderOpen size={20} color={c['accent-text']} />
                  <View style={{ flex: 1 }}>
                    <Text bold>{n.name}</Text>
                    <Text variant="xs" tone="muted">
                      {t('notebooks.count', { n: count })}
                    </Text>
                  </View>
                  <IconButton
                    icon={Pencil}
                    label={t('common.rename')}
                    onPress={() => {
                      setEditing(n.id);
                      setEditName(n.name);
                    }}
                  />
                  <IconButton
                    icon={Trash2}
                    label={t('common.delete')}
                    onPress={async () => {
                      if (await confirm(t('notebooks.deleteConfirm', { name: n.name }), t('common.delete'), t('common.cancel'))) deleteNotebook(n.id);
                    }}
                  />
                </Row>
              )}
            </Card>
          );
        })
      )}
    </Page>
  );
}

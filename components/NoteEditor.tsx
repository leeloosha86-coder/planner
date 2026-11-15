import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { NoteDraft, SphereCustom } from '../lib/types';
import { useTheme } from '../lib/theme';
import { FieldLabel, PrimaryButton } from './UI';
import SpherePicker from './SpherePicker';

export interface NoteEditorHandle { save: () => void }
const EMPTY: NoteDraft = { title: '', text: '', sphere: '' };

const NoteEditor = forwardRef<NoteEditorHandle, {
  visible: boolean;
  initial: NoteDraft | null;
  spheres: SphereCustom[];
  useTelegramButton: boolean;
  onClose: () => void;
  onSave: (draft: NoteDraft) => void;
}>(function NoteEditor({ visible, initial, spheres, useTelegramButton, onClose, onSave }, ref) {
  const { colors, serif } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<NoteDraft>(initial || EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && initial) { setDraft(initial); setError(''); }
  }, [visible, initial]);

  const save = () => {
    if (!draft.title.trim() && !draft.text.trim()) {
      setError('Добавьте заголовок или текст заметки');
      return;
    }
    onSave({
      ...draft,
      title: draft.title.trim() || 'Без названия',
      text: draft.text.trim(),
      sphere: draft.sphere || spheres[0]?.id || '',
    });
  };
  useImperativeHandle(ref, () => ({ save }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderColor: colors.border }]}>
          <Pressable onPress={onClose} style={[styles.back, { backgroundColor: colors.card }]} accessibilityLabel="Назад"><Ionicons name="arrow-back" size={23} color={colors.forest} /></Pressable>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: serif }]}>{draft.id ? 'Редактирование' : 'Новая заметка'}</Text>
          <View style={{ width: 42 }} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: useTelegramButton ? 100 : Math.max(insets.bottom + 24, 36) }]}>
          <FieldLabel>Заголовок</FieldLabel>
          <TextInput
            value={draft.title}
            onChangeText={(title) => { setDraft((current) => ({ ...current, title })); setError(''); }}
            placeholder="О чём эта заметка?"
            placeholderTextColor={colors.muted}
            returnKeyType="next"
            maxLength={120}
            autoFocus={!draft.id}
            style={[styles.titleInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border, fontFamily: serif }]}
          />
          <FieldLabel>Текст</FieldLabel>
          <TextInput
            value={draft.text}
            onChangeText={(text) => { setDraft((current) => ({ ...current, text })); setError(''); }}
            placeholder="Запишите мысль, идею или небольшой план…"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            maxLength={6000}
            style={[styles.bodyInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          />
          <SpherePicker spheres={spheres} value={draft.sphere || spheres[0]?.id || ''} onChange={(sphere) => setDraft((current) => ({ ...current, sphere }))} />
          {!!error && <Text style={[styles.error, { color: colors.terra }]}>{error}</Text>}
          {!useTelegramButton && <View style={styles.save}><PrimaryButton label="Сохранить" icon="checkmark" onPress={save} /></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default NoteEditor;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22 },
  content: { padding: 20 },
  titleInput: { borderWidth: 1, borderRadius: 18, padding: 16, fontSize: 22, minHeight: 58 },
  bodyInput: { borderWidth: 1, borderRadius: 18, padding: 16, fontSize: 16, lineHeight: 24, minHeight: 220 },
  save: { marginTop: 24 },
  error: { marginTop: 16, fontSize: 15, lineHeight: 21 },
});

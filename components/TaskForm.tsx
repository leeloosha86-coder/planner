import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { REPEAT_OPTIONS, SPHERES } from '../lib/constants';
import { formatLongDate, fromDateKey, repeatDescription } from '../lib/date';
import type { RepeatRule, SphereId, TaskDraft } from '../lib/types';
import { useTheme } from '../lib/theme';
import { ChoiceChip, FieldLabel, PrimaryButton } from './UI';

export interface TaskFormHandle { save: () => void }

interface Props {
  visible: boolean;
  initial: TaskDraft | null;
  useTelegramButton: boolean;
  onClose: () => void;
  onSave: (draft: TaskDraft) => void;
  onDelete?: () => void;
}

const EMPTY: TaskDraft = { title: '', time: '', repeat: 'none', sphere: 'work', date: '' };

const TaskForm = forwardRef<TaskFormHandle, Props>(function TaskForm({ visible, initial, useTelegramButton, onClose, onSave, onDelete }, ref) {
  const { colors, serif } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<TaskDraft>(initial || EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && initial) {
      setDraft(initial);
      setError('');
    }
  }, [visible, initial]);

  const save = () => {
    if (!draft.title.trim()) {
      setError('Напишите название задачи');
      return;
    }
    if (draft.time) {
      const [hours, minutes] = draft.time.split(':').map(Number);
      if (draft.time.length !== 5 || hours > 23 || minutes > 59 || Number.isNaN(hours) || Number.isNaN(minutes)) {
        setError('Укажите время в формате ЧЧ:ММ');
        return;
      }
    }
    onSave({ ...draft, title: draft.title.trim() });
  };
  useImperativeHandle(ref, () => ({ save }));

  const updateTime = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    const time = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    setDraft((current) => ({ ...current, time }));
    setError('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.backdrop, { backgroundColor: colors.dark ? 'rgba(30,24,20,0.76)' : 'rgba(74,59,46,0.38)' }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Закрыть форму" />
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: useTelegramButton ? 78 : Math.max(insets.bottom, 18) }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.headingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heading, { color: colors.text, fontFamily: serif }]}>{draft.id ? 'Изменить задачу' : 'Новая задача'}</Text>
                {!!draft.date && <Text style={[styles.date, { color: colors.terra }]}>{formatLongDate(fromDateKey(draft.date))}</Text>}
              </View>
              <Pressable onPress={onClose} style={[styles.close, { backgroundColor: colors.subtle }]} accessibilityLabel="Закрыть">
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
              <FieldLabel>Название</FieldLabel>
              <TextInput
                value={draft.title}
                onChangeText={(title) => { setDraft((current) => ({ ...current, title })); setError(''); }}
                placeholder="Например, полить фиалки"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                onSubmitEditing={save}
                autoFocus={!draft.id}
                maxLength={120}
                style={[styles.input, styles.titleInput, { color: colors.text, backgroundColor: colors.input, borderColor: error && !draft.title.trim() ? colors.terra : colors.border }]}
              />
              <FieldLabel optional>Время</FieldLabel>
              <View style={styles.timeRow}>
                <View style={[styles.timeInputWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <Ionicons name="time-outline" size={20} color={colors.terra} />
                  <TextInput
                    value={draft.time}
                    onChangeText={updateTime}
                    placeholder="ЧЧ:ММ"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={5}
                    returnKeyType="done"
                    style={[styles.timeInput, { color: colors.text }]}
                  />
                </View>
                {!!draft.time && <Pressable onPress={() => setDraft((current) => ({ ...current, time: '' }))} style={[styles.clearTime, { borderColor: colors.border }]}><Text style={{ color: colors.muted, fontSize: 14 }}>Без времени</Text></Pressable>}
              </View>
              <View style={styles.quickTimes}>
                {['09:00', '12:00', '18:00'].map((time) => <ChoiceChip key={time} label={time} small selected={draft.time === time} color={colors.terra} onPress={() => setDraft((current) => ({ ...current, time }))} />)}
              </View>
              <FieldLabel>Повтор</FieldLabel>
              <View style={styles.wrap}>
                {REPEAT_OPTIONS.map((option) => <ChoiceChip key={option.id} label={option.label} small selected={draft.repeat === option.id} color={colors.forest} onPress={() => setDraft((current) => ({ ...current, repeat: option.id as RepeatRule }))} />)}
              </View>
              <Text style={[styles.hint, { color: colors.muted }]}>{repeatDescription(draft.repeat, draft.date)}</Text>
              <FieldLabel>Сфера</FieldLabel>
              <View style={styles.sphereGrid}>
                {(Object.keys(SPHERES) as SphereId[]).map((id) => (
                  <View key={id} style={styles.sphereCell}><ChoiceChip label={SPHERES[id].name} selected={draft.sphere === id} color={SPHERES[id].color} onPress={() => setDraft((current) => ({ ...current, sphere: id }))} /></View>
                ))}
              </View>
              {!!error && <View style={[styles.errorBox, { backgroundColor: colors.terraSoft }]}><Ionicons name="alert-circle-outline" size={18} color={colors.terra} /><Text style={[styles.error, { color: colors.terra }]}>{error}</Text></View>}
              {!useTelegramButton && <View style={styles.saveButton}><PrimaryButton label="Сохранить" icon="checkmark" onPress={save} /></View>}
              {draft.id && onDelete && <Pressable onPress={onDelete} style={styles.deleteButton}><Ionicons name="trash-outline" size={18} color={colors.terra} /><Text style={[styles.deleteText, { color: colors.terra }]}>Удалить задачу</Text></Pressable>}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default TaskForm;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '93%', paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  heading: { fontSize: 27, lineHeight: 32 },
  date: { fontSize: 14, lineHeight: 19, marginTop: 4, textTransform: 'capitalize' },
  close: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  form: { paddingBottom: 12 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, fontSize: 16 },
  titleInput: { minHeight: 52, paddingVertical: 13 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, minHeight: 50, gap: 9 },
  timeInput: { width: 82, fontSize: 17, paddingVertical: 11 },
  clearTime: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, minHeight: 45, justifyContent: 'center' },
  quickTimes: { flexDirection: 'row', gap: 8, marginTop: 9 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: 9 },
  sphereGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  sphereCell: { width: '50%', paddingHorizontal: 4, marginBottom: 8 },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 14, marginTop: 16 },
  error: { fontSize: 14, flex: 1 },
  saveButton: { marginTop: 22 },
  deleteButton: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  deleteText: { fontSize: 15, fontWeight: '600' },
});

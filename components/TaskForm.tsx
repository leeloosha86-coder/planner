import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { REPEAT_OPTIONS } from '../lib/constants';
import { DAYS_SHORT, MAX_EVERY_DAYS, MAX_WEEK_INTERVAL, dayIndex, daysWord, formatLongDate, fromDateKey, makeDaysRule, makeEveryRule, parseRepeat, repeatDescription, weeksWord } from '../lib/date';
import type { RepeatRule, SphereCustom, TaskDraft } from '../lib/types';
import { useTheme } from '../lib/theme';
import { ChoiceChip, FieldLabel, PrimaryButton } from './UI';
import SpherePicker from './SpherePicker';

export interface TaskFormHandle { save: () => void }

interface Props {
  visible: boolean;
  initial: TaskDraft | null;
  spheres: SphereCustom[];
  useTelegramButton: boolean;
  onClose: () => void;
  onSave: (draft: TaskDraft) => void;
  onDelete?: () => void;
}

const EMPTY: TaskDraft = { title: '', time: '', repeat: 'none', sphere: '', date: '', important: false };

const TaskForm = forwardRef<TaskFormHandle, Props>(function TaskForm({ visible, initial, spheres, useTelegramButton, onClose, onSave, onDelete }, ref) {
  const { colors, serif } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<TaskDraft>(initial || EMPTY);
  const [error, setError] = useState('');
  const custom = parseRepeat(draft.repeat);
  const setRepeat = (repeat: RepeatRule) => setDraft((current) => ({ ...current, repeat }));
  const pickEvery = () => {
    if (custom?.kind !== 'every') setRepeat(makeEveryRule(2));
  };
  const pickDays = () => {
    if (custom?.kind !== 'days') setRepeat(makeDaysRule([draft.date ? dayIndex(fromDateKey(draft.date)) : 0], 1));
  };
  const toggleWeekDay = (index: number) => {
    if (custom?.kind !== 'days') return;
    const next = custom.days.includes(index) ? custom.days.filter((day) => day !== index) : [...custom.days, index];
    if (next.length > 0) setRepeat(makeDaysRule(next, custom.weeks));
  };

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
    const sphere = draft.sphere || spheres[0]?.id || '';
    onSave({ ...draft, title: draft.title.trim(), sphere });
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
              <FieldLabel>Важность</FieldLabel>
              <Pressable
                onPress={() => setDraft((current) => ({ ...current, important: !current.important }))}
                accessibilityRole="switch"
                accessibilityState={{ checked: draft.important }}
                style={[styles.importantRow, { backgroundColor: draft.important ? colors.terraSoft : colors.input, borderColor: draft.important ? colors.terra : colors.border }]}
              >
                <View style={[styles.importantDot, { backgroundColor: draft.important ? colors.terra : colors.border }]} />
                <Text style={[styles.importantText, { color: draft.important ? colors.terra : colors.text }]}>
                  {draft.important ? 'Важная задача — будет вверху списка' : 'Сделать важной'}
                </Text>
                <Ionicons name={draft.important ? 'flag' : 'flag-outline'} size={18} color={draft.important ? colors.terra : colors.muted} />
              </Pressable>
              <FieldLabel>Повтор</FieldLabel>
              <View style={styles.wrap}>
                {REPEAT_OPTIONS.map((option) => <ChoiceChip key={option.id} label={option.label} small selected={draft.repeat === option.id} color={colors.forest} onPress={() => setDraft((current) => ({ ...current, repeat: option.id as RepeatRule }))} />)}
                <ChoiceChip label="Свой интервал" small selected={custom?.kind === 'every'} color={colors.forest} onPress={pickEvery} />
                <ChoiceChip label="По дням недели" small selected={custom?.kind === 'days'} color={colors.forest} onPress={pickDays} />
              </View>
              {custom?.kind === 'every' && (
                <View style={styles.stepperRow}>
                  <Text style={[styles.stepperLabel, { color: colors.text }]}>Повторять каждые</Text>
                  <Stepper value={custom.step} min={1} max={MAX_EVERY_DAYS} unit={daysWord(custom.step)} onChange={(step) => setRepeat(makeEveryRule(step))} />
                </View>
              )}
              {custom?.kind === 'days' && (
                <>
                  <View style={styles.weekRow}>
                    {DAYS_SHORT.map((label, index) => <ChoiceChip key={label} label={label} small selected={custom.days.includes(index)} color={colors.forest} onPress={() => toggleWeekDay(index)} />)}
                  </View>
                  <View style={styles.stepperRow}>
                    <Text style={[styles.stepperLabel, { color: colors.text }]}>Раз в</Text>
                    <Stepper value={custom.weeks} min={1} max={MAX_WEEK_INTERVAL} unit={weeksWord(custom.weeks)} onChange={(weeks) => setRepeat(makeDaysRule(custom.days, weeks))} />
                  </View>
                </>
              )}
              <Text style={[styles.hint, { color: colors.muted }]}>{repeatDescription(draft.repeat, draft.date)}</Text>
              <SpherePicker spheres={spheres} value={draft.sphere || spheres[0]?.id || ''} onChange={(sphere) => setDraft((current) => ({ ...current, sphere }))} />
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

function Stepper({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  const { colors } = useTheme();
  const stepButton = (icon: 'remove' | 'add', label: string, next: number, disabled: boolean) => (
    <Pressable onPress={() => onChange(next)} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={[styles.stepButton, { backgroundColor: colors.subtle, opacity: disabled ? 0.4 : 1 }]}>
      <Ionicons name={icon} size={18} color={colors.forest} />
    </Pressable>
  );
  return (
    <View style={[styles.stepper, { borderColor: colors.border, backgroundColor: colors.input }]}>
      {stepButton('remove', 'Меньше', value - 1, value <= min)}
      <Text style={[styles.stepValue, { color: colors.text }]}>{`${value} ${unit}`}</Text>
      {stepButton('add', 'Больше', value + 1, value >= max)}
    </View>
  );
}

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
  stepperRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  stepperLabel: { fontSize: 14.5, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 6, paddingVertical: 5, gap: 8 },
  stepButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 15, fontWeight: '600', minWidth: 78, textAlign: 'center' },
  weekRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: 9 },
  importantRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, minHeight: 48 },
  importantDot: { width: 9, height: 9, borderRadius: 5 },
  importantText: { flex: 1, fontSize: 14.5, fontWeight: '600' },
  saveButton: { marginTop: 22 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 11, marginTop: 16 },
  error: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18, paddingVertical: 10 },
  deleteText: { fontSize: 14.5, fontWeight: '600' },
});

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../lib/constants';
import { freeColor, MAX_SPHERE_NAME, MAX_SPHERES, SPHERE_COLORS, makeSphereId, cleanSphereName } from '../lib/spheres';
import type { SphereCustom } from '../lib/types';
import { useTheme } from '../lib/theme';
import { FieldLabel, PrimaryButton } from './UI';

export interface SpheresSheetHandle { save: () => void }

const SpheresSheet = forwardRef<SpheresSheetHandle, {
  visible: boolean;
  spheres: SphereCustom[];
  noteCount: (id: string) => number;
  useTelegramButton: boolean;
  onClose: () => void;
  onSave: (spheres: SphereCustom[]) => void;
  onDelete: (sphere: SphereCustom) => void;
}>(function SpheresSheet({
  visible,
  spheres,
  noteCount,
  useTelegramButton,
  onClose,
  onSave,
  onDelete,
}, ref) {
  const { colors, serif } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<SphereCustom[]>(spheres);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft(spheres.map((sphere) => ({ ...sphere })));
      setNewName('');
      setError('');
    }
  }, [visible, spheres]);

  const canAdd = draft.length < MAX_SPHERES;
  const filled = useMemo(() => draft.filter((sphere) => sphere.name.trim()).length, [draft]);

  const rename = (id: string, value: string) => {
    setDraft((current) => current.map((sphere) => sphere.id === id ? { ...sphere, name: value.slice(0, MAX_SPHERE_NAME) } : sphere));
    setError('');
  };

  const add = () => {
    const name = cleanSphereName(newName);
    if (!name) {
      setError('Напишите название новой сферы');
      return;
    }
    if (!canAdd) {
      setError(`Больше ${MAX_SPHERES} сфер добавить нельзя`);
      return;
    }
    const next: SphereCustom = { id: makeSphereId(), name, color: freeColor(draft, draft.length) };
    setDraft((current) => [...current, next]);
    setNewName('');
    setError('');
  };

  const save = () => {
    let working = draft.map((sphere) => ({ ...sphere, name: cleanSphereName(sphere.name) })).filter((sphere) => sphere.name);
    const pending = cleanSphereName(newName);
    if (pending && working.length < MAX_SPHERES) {
      const duplicate = working.some((sphere) => sphere.name.toLocaleLowerCase('ru-RU') === pending.toLocaleLowerCase('ru-RU'));
      if (!duplicate) working = [...working, { id: makeSphereId(), name: pending, color: freeColor(working, working.length) }];
    }
    const cleaned = working;
    if (cleaned.length === 0) {
      setError('Оставьте хотя бы одну сферу с названием');
      return;
    }
    const names = cleaned.map((sphere) => sphere.name.toLocaleLowerCase('ru-RU'));
    if (new Set(names).size !== names.length) {
      setError('Названия сфер не должны повторяться');
      return;
    }
    onSave(cleaned);
  };
  useImperativeHandle(ref, () => ({ save }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderColor: colors.border }]}>
          <Pressable onPress={onClose} style={[styles.back, { backgroundColor: colors.card }]} accessibilityLabel="Назад"><Ionicons name="arrow-back" size={23} color={colors.forest} /></Pressable>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: serif }]}>Сферы жизни</Text>
          <View style={{ width: 42 }} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: useTelegramButton ? 110 : Math.max(insets.bottom + 30, 42) }]}>
          <Text style={[styles.intro, { color: colors.muted }]}>
            Назовите сферы по-своему, добавьте новые или уберите лишние. Задачи, заметки и привычки останутся на своих местах.
          </Text>
          <FieldLabel>Ваши сферы</FieldLabel>
          {draft.map((sphere, index) => {
            const used = noteCount(sphere.id);
            return (
              <View key={sphere.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.colorStripe, { backgroundColor: sphere.color }]} />
                <View style={styles.rowBody}>
                  <TextInput
                    value={sphere.name}
                    onChangeText={(value) => rename(sphere.id, value)}
                    placeholder="Название сферы"
                    placeholderTextColor={colors.muted}
                    maxLength={MAX_SPHERE_NAME}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
                    accessibilityLabel={`Название сферы ${index + 1}`}
                  />
                  <View style={styles.palette}>
                    {SPHERE_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        onPress={() => setDraft((current) => current.map((item) => item.id === sphere.id ? { ...item, color } : item))}
                        accessibilityLabel={`Цвет ${color}`}
                        accessibilityState={{ selected: sphere.color === color }}
                        style={[styles.swatch, { backgroundColor: color }, sphere.color === color && { borderColor: colors.text, borderWidth: 2 }]}
                      >
                        {sphere.color === color && <Ionicons name="checkmark" size={12} color={colors.cream} />}
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.rowMeta}>
                    <Text style={[styles.counter, { color: colors.muted }]}>{`${sphere.name.length}/${MAX_SPHERE_NAME}`}</Text>
                    {used > 0 && <Text style={[styles.used, { color: colors.sage }]}>{`записей: ${used}`}</Text>}
                    <Pressable onPress={() => onDelete(sphere)} hitSlop={10} style={styles.deleteHit} accessibilityLabel={`Удалить сферу ${sphere.name}`}>
                      <Ionicons name="trash-outline" size={19} color={colors.terra} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}

          <FieldLabel optional>Новая сфера</FieldLabel>
          <View style={styles.addRow}>
            <TextInput
              value={newName}
              onChangeText={(value) => { setNewName(value.slice(0, MAX_SPHERE_NAME)); setError(''); }}
              placeholder="Например, Творчество"
              placeholderTextColor={colors.muted}
              maxLength={MAX_SPHERE_NAME}
              returnKeyType="done"
              onSubmitEditing={add}
              editable={canAdd}
              style={[styles.input, styles.addInput, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border, opacity: canAdd ? 1 : 0.55 }]}
            />
            <Pressable onPress={add} disabled={!canAdd} style={({ pressed }) => [styles.addButton, { backgroundColor: canAdd ? colors.terra : colors.subtle }, pressed && { opacity: 0.85 }]} accessibilityLabel="Добавить сферу">
              <Ionicons name="add" size={24} color={canAdd ? colors.cream : colors.muted} />
            </Pressable>
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>
            {canAdd ? `Можно до ${MAX_SPHERES} сфер и ${SPHERE_COLORS.length} цветов — каждому свой, в названии до ${MAX_SPHERE_NAME} символов` : `Достигнут предел: ${MAX_SPHERES} сфер`}
          </Text>
          {filled === 0 && <Text style={[styles.hint, { color: colors.terra }]}>Оставьте хотя бы одну сферу</Text>}
          {!!error && <View style={[styles.errorBox, { backgroundColor: colors.terraSoft }]}><Ionicons name="alert-circle-outline" size={18} color={colors.terra} /><Text style={[styles.error, { color: colors.terra }]}>{error}</Text></View>}
          {!useTelegramButton && <View style={styles.save}><PrimaryButton label="Сохранить" icon="checkmark" onPress={save} /></View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default SpheresSheet;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22 },
  content: { padding: 18 },
  intro: { fontSize: 14.5, lineHeight: 21 },
  row: { flexDirection: 'row', borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 10 },
  colorStripe: { width: 7 },
  rowBody: { flex: 1, padding: 11, gap: 7 },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15.5, minHeight: 44 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 },
  counter: { fontSize: 11 },
  used: { fontSize: 11, flex: 1 },
  deleteHit: { padding: 3 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 2, paddingTop: 2 },
  swatch: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  addInput: { flex: 1 },
  addButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 11, marginTop: 14 },
  error: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  save: { marginTop: 22 },
});

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SPHERES } from '../lib/constants';
import type { SphereId } from '../lib/types';
import { useTheme } from '../lib/theme';
import { ChoiceChip, FieldLabel, PrimaryButton } from './UI';

export interface HabitFormHandle { save: () => void }

const HabitForm = forwardRef<HabitFormHandle, {
  visible: boolean;
  useTelegramButton: boolean;
  onClose: () => void;
  onSave: (name: string, sphere: SphereId) => void;
}>(function HabitForm({ visible, useTelegramButton, onClose, onSave }, ref) {
  const { colors, serif } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [sphere, setSphere] = useState<SphereId>('home');
  const [error, setError] = useState('');
  useEffect(() => { if (visible) { setName(''); setSphere('home'); setError(''); } }, [visible]);
  const save = () => {
    if (!name.trim()) { setError('Напишите название привычки'); return; }
    onSave(name.trim(), sphere);
  };
  useImperativeHandle(ref, () => ({ save }));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.backdrop, { backgroundColor: colors.dark ? 'rgba(30,24,20,0.76)' : 'rgba(74,59,46,0.38)' }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: useTelegramButton ? 76 : Math.max(insets.bottom, 20) }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Новая привычка</Text>
              <Pressable onPress={onClose} style={[styles.close, { backgroundColor: colors.subtle }]}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Выберите маленький шаг, который легко повторять.</Text>
            <FieldLabel>Название</FieldLabel>
            <TextInput value={name} onChangeText={(value) => { setName(value); setError(''); }} placeholder="Например, прогулка перед сном" placeholderTextColor={colors.muted} autoFocus returnKeyType="done" onSubmitEditing={save} maxLength={100} style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]} />
            <FieldLabel>Сфера</FieldLabel>
            <View style={styles.spheres}>{(Object.keys(SPHERES) as SphereId[]).map((id) => <ChoiceChip key={id} label={SPHERES[id].name} small selected={sphere === id} color={SPHERES[id].color} onPress={() => setSphere(id)} />)}</View>
            {!!error && <Text style={[styles.error, { color: colors.terra }]}>{error}</Text>}
            {!useTelegramButton && <View style={styles.save}><PrimaryButton label="Сохранить" icon="checkmark" onPress={save} /></View>}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default HabitForm;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10 },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 27, flex: 1 },
  close: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, minHeight: 52 },
  spheres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  save: { marginTop: 24 },
  error: { marginTop: 14, fontSize: 15 },
});

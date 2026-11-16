import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import type { Task } from '../lib/types';
import { PrimaryButton } from './UI';

export default function RitualSheet({ visible, onClose, tasks, doneCount, total, onMove }: {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  doneCount: number;
  total: number;
  onMove: (task: Task) => void;
}) {
  const { colors, serif } = useTheme();
  const pending = tasks.filter((task) => !task.completed && task.repeat === 'none');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.dark ? 'rgba(30,24,20,0.76)' : 'rgba(74,59,46,0.38)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Закрыть" />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.head}>
            <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Итоги дня</Text>
            <Pressable onPress={onClose} style={[styles.close, { backgroundColor: colors.subtle }]} accessibilityLabel="Закрыть"><Ionicons name="close" size={21} color={colors.text} /></Pressable>
          </View>
          <Text style={[styles.summary, { color: colors.text }]}>Сделано {doneCount} из {total}</Text>
          {pending.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>Всё, что запланировано, уже готово или не требует переноса. Отличный день.</Text>
          ) : (
            <>
              <Text style={[styles.hint, { color: colors.muted }]}>Не успели? Перенесите на завтра, или оставьте как есть.</Text>
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {pending.map((task) => (
                  <View key={task.id} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.input }]}>
                    <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>{task.title}</Text>
                    <Pressable onPress={() => onMove(task)} style={[styles.move, { backgroundColor: colors.terra }]} accessibilityLabel={`Перенести на завтра: ${task.title}`}>
                      <Text style={[styles.moveText, { color: colors.cream }]}>На завтра</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
          <View style={styles.button}><PrimaryButton label="Готово" icon="checkmark" onPress={onClose} /></View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 10, paddingBottom: 28, maxHeight: '85%' },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 27 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  summary: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  hint: { fontSize: 13.5, lineHeight: 19, marginTop: 6, marginBottom: 12 },
  empty: { fontSize: 14.5, lineHeight: 21, marginTop: 10, marginBottom: 18 },
  list: { maxHeight: 320 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 9 },
  rowTitle: { flex: 1, fontSize: 14.5, fontWeight: '600' },
  move: { borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  moveText: { fontSize: 12.5, fontWeight: '700' },
  button: { marginTop: 14 },
});

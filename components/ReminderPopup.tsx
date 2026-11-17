import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { sphereById } from '../lib/spheres';
import { useTheme } from '../lib/theme';
import type { SphereCustom, Task } from '../lib/types';
import { PrimaryButton } from './UI';

export default function ReminderPopup({ tasks, spheres, onDone, onClose }: {
  tasks: Task[];
  spheres: SphereCustom[];
  onDone: (task: Task) => void;
  onClose: () => void;
}) {
  const { colors, serif } = useTheme();
  return (
    <Modal visible={tasks.length > 0} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.dark ? 'rgba(30,24,20,0.76)' : 'rgba(74,59,46,0.38)' }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.terra }]}>
          <View style={styles.head}>
            <View style={[styles.icon, { backgroundColor: colors.terraSoft }]}>
              <Ionicons name="alarm-outline" size={22} color={colors.terra} />
            </View>
            <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Пора заняться делом</Text>
          </View>
          {tasks.map((task) => (
            <View key={task.id} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.input }]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>{task.title}</Text>
                <Text style={[styles.rowMeta, { color: colors.muted }]}>{task.time} · {sphereById(spheres, task.sphere).name}</Text>
              </View>
              <Pressable onPress={() => onDone(task)} accessibilityLabel={`Отметить выполненной: ${task.title}`} style={[styles.done, { backgroundColor: colors.forest }]}>
                <Ionicons name="checkmark" size={18} color={colors.cream} />
              </Pressable>
            </View>
          ))}
          <View style={styles.button}>
            <PrimaryButton label="Понятно" icon="checkmark" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 22 },
  card: { borderWidth: 1.5, borderRadius: 26, padding: 20 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 22, lineHeight: 27 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 9 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12.5, marginTop: 3 },
  done: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  button: { marginTop: 6 },
});

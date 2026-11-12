import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SPHERES } from '../lib/constants';
import type { Task } from '../lib/types';
import { useTheme } from '../lib/theme';
import SparkBurst from './SparkBurst';
import { FadeIn } from './UI';

export default function TaskCard({ task, done, onToggle, onPress, index = 0 }: {
  task: Task;
  done: boolean;
  onToggle: () => void;
  onPress: () => void;
  index?: number;
}) {
  const { colors, cardShadow } = useTheme();
  const [sparks, setSparks] = useState(0);
  const sphere = SPHERES[task.sphere];
  const toggle = () => {
    if (!done) setSparks((value) => value + 1);
    onToggle();
  };
  return (
    <FadeIn delay={Math.min(index * 45, 240)} style={styles.fade}>
      <View style={[styles.card, { backgroundColor: done ? colors.subtle : colors.card, borderColor: colors.border }, cardShadow]}>
        <SparkBurst trigger={sparks} />
        <Pressable
          onPress={toggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={done ? `Снять отметку: ${task.title}` : `Выполнить: ${task.title}`}
          hitSlop={10}
          style={({ pressed }) => [styles.check, { borderColor: done ? colors.forest : colors.sage, backgroundColor: done ? colors.forest : 'transparent' }, pressed && { transform: [{ scale: 0.88 }] }]}
        >
          {done && <Ionicons name="checkmark" size={18} color={colors.cream} />}
        </Pressable>
        <Pressable onPress={onPress} style={styles.content} accessibilityLabel={`Редактировать задачу: ${task.title}`}>
          <Text style={[styles.title, { color: done ? colors.muted : colors.text }, done && styles.done]}>{task.title}</Text>
          <View style={styles.meta}>
            {!!task.time && <View style={styles.metaItem}><Ionicons name="time-outline" size={14} color={colors.muted} /><Text style={[styles.metaText, { color: colors.muted }]}>{task.time}</Text></View>}
            {task.repeat !== 'none' && <View style={styles.metaItem}><Ionicons name="repeat-outline" size={15} color={colors.muted} /><Text style={[styles.metaText, { color: colors.muted }]}>{task.repeat === 'daily' ? 'ежедневно' : task.repeat === 'weekdays' ? 'по будням' : 'еженедельно'}</Text></View>}
          </View>
        </Pressable>
        <View style={[styles.sphereTag, { backgroundColor: sphere.color }]}>
          <Text style={[styles.sphereText, { color: colors.cream }]} numberOfLines={2}>{sphere.shortName}</Text>
        </View>
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  fade: { marginBottom: 10 },
  card: { minHeight: 76, borderRadius: 20, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', overflow: 'visible' },
  check: { width: 29, height: 29, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12, zIndex: 3 },
  content: { flex: 1, minWidth: 0, paddingRight: 8, paddingVertical: 2 },
  title: { fontSize: 15.5, lineHeight: 21, fontWeight: '600' },
  done: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12.5, lineHeight: 16 },
  sphereTag: { maxWidth: 91, minWidth: 53, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sphereText: { fontSize: 11, lineHeight: 13, fontWeight: '700', textAlign: 'center' },
});

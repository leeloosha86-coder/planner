import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatLongDate, greeting, isTaskDone, tasksForDate } from '../lib/date';
import { filtersFor } from '../lib/spheres';
import type { SphereCustom, SphereFilter, Task } from '../lib/types';
import { useTheme } from '../lib/theme';
import ExperienceCard from '../components/ExperienceCard';
import TaskCard from '../components/TaskCard';
import { ChoiceChip, EmptyState } from '../components/UI';
import { LeafMark } from '../components/Decor';

export default function TodayScreen({ tasks, spheres, xp, today, filter, botStarted, syncError, refreshing, celebrationSignal, onFilter, onToggle, onEdit, onRefresh, onOpenBot, onRetry, onManageSpheres }: {
  tasks: Task[];
  spheres: SphereCustom[];
  xp: number;
  today: string;
  filter: SphereFilter;
  botStarted: boolean;
  syncError: string;
  refreshing: boolean;
  celebrationSignal: number;
  onFilter: (filter: SphereFilter) => void;
  onToggle: (task: Task) => void;
  onEdit: (task: Task, date: string) => void;
  onRefresh: () => void;
  onOpenBot: () => void;
  onRetry: () => void;
  onManageSpheres: () => void;
}) {
  const { colors, serif } = useTheme();
  const now = new Date();
  const allToday = tasksForDate(tasks, today);
  const visible = filter === 'all' ? allToday : allToday.filter((task) => task.sphere === filter);
  const done = visible.filter((task) => isTaskDone(task, today)).length;
  const filters = useMemo(() => filtersFor(spheres, colors.forest), [colors.forest, spheres]);

  const header = (
    <View>
      <View style={styles.brandRow}>
        <View style={styles.brand}><LeafMark size={29} /><Text style={[styles.brandText, { color: colors.forest, fontFamily: serif }]}>Мой планировщик</Text></View>
        <View style={[styles.seasonPill, { backgroundColor: colors.forestSoft }]}><View style={[styles.seasonDot, { backgroundColor: colors.sage }]} /><Text style={[styles.seasonText, { color: colors.forest }]}>тихий день</Text></View>
      </View>
      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <Text style={[styles.greeting, { color: colors.text, fontFamily: serif }]}>{greeting(now)}</Text>
          <Text style={[styles.date, { color: colors.terra }]}>{`\u00b7 ${formatLongDate(now)}`}</Text>
        </View>
        {visible.length > 0 && <View style={[styles.counter, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
          <Text style={[styles.counterNumber, { color: colors.gold, fontFamily: serif }]}>{done}/{visible.length}</Text>
          <Text style={[styles.counterLabel, { color: colors.text }]}>готово</Text>
        </View>}
      </View>
      <ExperienceCard xp={xp} celebrationSignal={celebrationSignal} />
      {!botStarted && <View style={[styles.reminder, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
        <View style={[styles.reminderIcon, { backgroundColor: colors.card }]}><Ionicons name="notifications-outline" size={21} color={colors.gold} /></View>
        <Text style={[styles.reminderText, { color: colors.text }]}>Нажмите /start у бота, чтобы получать напоминания</Text>
        <Pressable onPress={onOpenBot} hitSlop={8} accessibilityLabel="Открыть бота"><Ionicons name="arrow-forward" size={20} color={colors.forest} /></Pressable>
      </View>}
      {!!syncError && <Pressable onPress={onRetry} style={[styles.syncError, { backgroundColor: colors.terraSoft }]}>
        <Ionicons name="cloud-offline-outline" size={19} color={colors.terra} />
        <Text style={[styles.syncErrorText, { color: colors.text }]}>{syncError}</Text>
        <Text style={[styles.retry, { color: colors.terra }]}>Повторить</Text>
      </Pressable>}
      <View style={styles.filterHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: serif }]}>Задачи на сегодня</Text>
        <Pressable onPress={onManageSpheres} hitSlop={8} accessibilityLabel="Настроить сферы жизни" style={styles.captionRow}>
          <Text style={[styles.sectionCaption, { color: colors.muted }]}>сферы жизни</Text>
          <Ionicons name="options-outline" size={14} color={colors.terra} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => <ChoiceChip key={item.id} label={item.name} selected={filter === item.id} color={item.color} onPress={() => onFilter(item.id)} small />)}
        <Pressable onPress={onManageSpheres} style={({ pressed }) => [styles.manageChip, { borderColor: colors.border, backgroundColor: colors.card }, pressed && { opacity: 0.7 }]} accessibilityLabel="Добавить или изменить сферы">
          <Ionicons name="add" size={15} color={colors.terra} />
          <Text style={[styles.manageChipText, { color: colors.terra }]}>Добавить</Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={visible}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => <TaskCard task={item} spheres={spheres} index={index} done={isTaskDone(item, today)} onToggle={() => onToggle(item)} onPress={() => onEdit(item, today)} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState title="На сегодня задач нет" subtitle="Нажмите «+», чтобы добавить задачу" icon="leaf-outline" />}
      contentContainerStyle={[styles.content, visible.length === 0 && { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} progressBackgroundColor={colors.card} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 17, paddingTop: 8, paddingBottom: 128 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandText: { fontSize: 17 },
  seasonPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
  seasonDot: { width: 5, height: 5, borderRadius: 3 },
  seasonText: { fontSize: 11.5, fontWeight: '600' },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  greetingText: { flex: 1 },
  greeting: { fontSize: 29, lineHeight: 34 },
  date: { fontSize: 15, lineHeight: 20, marginTop: 3, textTransform: 'capitalize' },
  counter: { minWidth: 65, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 18, borderWidth: 1, alignItems: 'center', marginBottom: 1 },
  counterNumber: { fontSize: 22, lineHeight: 24 },
  counterLabel: { fontSize: 11.5, lineHeight: 15 },
  reminder: { borderRadius: 18, borderWidth: 1, padding: 11, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  reminderIcon: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reminderText: { flex: 1, fontSize: 13, lineHeight: 18 },
  syncError: { borderRadius: 16, padding: 12, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncErrorText: { flex: 1, fontSize: 12.5, lineHeight: 17 },
  retry: { fontSize: 12.5, fontWeight: '700' },
  filterHeader: { marginTop: 25, marginBottom: 12, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 23, lineHeight: 28 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionCaption: { fontSize: 12 },
  filters: { gap: 8, paddingRight: 20, paddingBottom: 17 },
  manageChip: { minHeight: 35, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  manageChipText: { fontSize: 13, fontWeight: '600' },
});

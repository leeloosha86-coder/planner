import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SPHERES } from '../lib/constants';
import { addDays, dateKey, formatLongDate, fromDateKey, isTaskDone, shortDay, tasksForDate, weekDates } from '../lib/date';
import type { Task } from '../lib/types';
import { useTheme } from '../lib/theme';
import { EmptyState, FadeIn } from '../components/UI';

const HOURS = Array.from({ length: 18 }, (_, index) => index + 6);

function TimelineTask({ task, done, onPress, onToggle }: { task: Task; done: boolean; onPress: () => void; onToggle: () => void }) {
  const { colors } = useTheme();
  const sphere = SPHERES[task.sphere];
  return (
    <View style={[styles.timelineTask, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.taskStripe, { backgroundColor: sphere.color }]} />
      <Pressable onPress={onPress} style={styles.timelineTaskContent}>
        <Text numberOfLines={2} style={[styles.timelineTaskTitle, { color: done ? colors.muted : colors.text }, done && { textDecorationLine: 'line-through' }]}>{task.title}</Text>
        <Text style={[styles.timelineTaskMeta, { color: sphere.color }]}>{task.time} · {sphere.name}</Text>
      </Pressable>
      <Pressable onPress={onToggle} hitSlop={8} style={[styles.smallCheck, { borderColor: sphere.color, backgroundColor: done ? sphere.color : 'transparent' }]} accessibilityRole="checkbox" accessibilityState={{ checked: done }}>
        {done && <Ionicons name="checkmark" size={14} color={colors.cream} />}
      </Pressable>
    </View>
  );
}

export default function ScheduleScreen({ tasks, refreshing, onRefresh, onAdd, onEdit, onToggle }: {
  tasks: Task[];
  refreshing: boolean;
  onRefresh: () => void;
  onAdd: (date: string, time: string) => void;
  onEdit: (task: Task, date: string) => void;
  onToggle: (task: Task, date: string) => void;
}) {
  const { colors, serif } = useTheme();
  const today = dateKey(new Date());
  const [selected, setSelected] = useState(today);
  const selectedDate = fromDateKey(selected);
  const days = useMemo(() => weekDates(selectedDate), [selected]);
  const dayTasks = tasksForDate(tasks, selected);
  const withoutTime = dayTasks.filter((task) => !task.time);
  const timed = dayTasks.filter((task) => !!task.time);
  const now = new Date();

  const shiftWeek = (direction: number) => setSelected(dateKey(addDays(selectedDate, direction * 7)));
  const header = (
    <View>
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Расписание</Text>
          <Text style={[styles.subtitle, { color: colors.terra }]}>{formatLongDate(selectedDate)}</Text>
        </View>
        <View style={[styles.calendarIcon, { backgroundColor: colors.forestSoft }]}><Ionicons name="calendar-outline" size={24} color={colors.forest} /></View>
      </View>
      <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable onPress={() => shiftWeek(-1)} hitSlop={8} style={styles.weekArrow} accessibilityLabel="Предыдущая неделя"><Ionicons name="chevron-back" size={19} color={colors.muted} /></Pressable>
        {days.map((day) => {
          const key = dateKey(day);
          const active = key === selected;
          const isToday = key === today;
          const hasTasks = tasksForDate(tasks, key).length > 0;
          return (
            <Pressable key={key} onPress={() => setSelected(key)} style={[styles.day, { backgroundColor: active ? colors.forest : 'transparent', borderColor: isToday && !active ? colors.gold : 'transparent' }]} accessibilityState={{ selected: active }} accessibilityLabel={`${shortDay(day)}, ${day.getDate()}`}>
              <Text style={[styles.dayName, { color: active ? colors.cream : colors.muted }]}>{shortDay(day)}</Text>
              <Text style={[styles.dayNumber, { color: active ? colors.cream : colors.text }]}>{day.getDate()}</Text>
              <View style={[styles.taskDot, { backgroundColor: hasTasks ? (active ? colors.gold : colors.terra) : 'transparent' }]} />
            </Pressable>
          );
        })}
        <Pressable onPress={() => shiftWeek(1)} hitSlop={8} style={styles.weekArrow} accessibilityLabel="Следующая неделя"><Ionicons name="chevron-forward" size={19} color={colors.muted} /></Pressable>
      </View>
      {selected !== today && <Pressable onPress={() => setSelected(today)} style={styles.todayButton}><Ionicons name="locate-outline" size={15} color={colors.terra} /><Text style={[styles.todayButtonText, { color: colors.terra }]}>Вернуться к сегодня</Text></Pressable>}
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: serif }]}>Без времени</Text>
        <Text style={[styles.sectionCount, { color: colors.muted }]}>{withoutTime.length}</Text>
      </View>
      {withoutTime.length > 0 ? <View style={styles.noTimeList}>{withoutTime.map((task) => <TimelineTask key={task.id} task={task} done={isTaskDone(task, selected)} onPress={() => onEdit(task, selected)} onToggle={() => onToggle(task, selected)} />)}</View> : <View style={[styles.noTimeEmpty, { borderColor: colors.border }]}><Ionicons name="checkmark-done-outline" size={18} color={colors.sage} /><Text style={[styles.noTimeEmptyText, { color: colors.muted }]}>Здесь появятся задачи без точного времени</Text></View>}
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: serif }]}>По часам</Text>
        <View style={styles.hourHint}><Ionicons name="add" size={15} color={colors.terra} /><Text style={[styles.hourHintText, { color: colors.muted }]}>нажмите на час</Text></View>
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={HOURS}
      keyExtractor={(hour) => String(hour)}
      ListHeaderComponent={header}
      renderItem={({ item: hour, index }) => {
        const hourTasks = timed.filter((task) => Number(task.time.split(':')[0]) === hour);
        const isCurrent = selected === today && now.getHours() === hour;
        return (
          <FadeIn delay={Math.min(index * 20, 180)}>
            <View style={styles.hourRow}>
              <View style={styles.hourLabelWrap}>
                <Text style={[styles.hourLabel, { color: isCurrent ? colors.terra : colors.muted }]}>{String(hour).padStart(2, '0')}:00</Text>
                {isCurrent && <View style={[styles.nowDot, { backgroundColor: colors.terra }]} />}
              </View>
              <Pressable disabled={hourTasks.length > 0} onPress={() => onAdd(selected, `${String(hour).padStart(2, '0')}:00`)} style={[styles.hourSlot, { borderTopColor: isCurrent ? colors.terra : colors.border }]}>
                {hourTasks.length > 0 ? <View style={styles.hourTasks}>{hourTasks.map((task) => <TimelineTask key={task.id} task={task} done={isTaskDone(task, selected)} onPress={() => onEdit(task, selected)} onToggle={() => onToggle(task, selected)} />)}</View> : <View style={styles.emptyHour}><View style={[styles.emptyHourButton, { backgroundColor: colors.subtle }]}><Ionicons name="add" size={18} color={colors.sage} /></View><Text style={[styles.emptyHourText, { color: colors.muted }]}>Свободно</Text></View>}
              </Pressable>
            </View>
          </FadeIn>
        );
      }}
      ListEmptyComponent={<EmptyState title="День свободен" subtitle="Нажмите на любой час, чтобы добавить дело" />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} progressBackgroundColor={colors.card} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 125 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 2 },
  title: { fontSize: 31, lineHeight: 37 },
  subtitle: { fontSize: 15, lineHeight: 20, marginTop: 4, textTransform: 'capitalize' },
  calendarIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  weekCard: { borderRadius: 20, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekArrow: { width: 21, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  day: { width: 36, minHeight: 61, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', paddingVertical: 7 },
  dayName: { fontSize: 10.5, lineHeight: 14, fontWeight: '600' },
  dayNumber: { fontSize: 16, lineHeight: 21, fontWeight: '700', marginTop: 2 },
  taskDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  todayButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11 },
  todayButtonText: { fontSize: 13.5, fontWeight: '600' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 11, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 22, lineHeight: 27 },
  sectionCount: { fontSize: 14, fontWeight: '700' },
  noTimeList: { gap: 8 },
  noTimeEmpty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  noTimeEmptyText: { flex: 1, fontSize: 13, lineHeight: 18 },
  hourHint: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  hourHintText: { fontSize: 12 },
  hourRow: { flexDirection: 'row', minHeight: 70 },
  hourLabelWrap: { width: 55, paddingTop: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  hourLabel: { fontSize: 12.5, lineHeight: 17, fontWeight: '600', transform: [{ translateY: -8 }] },
  nowDot: { width: 6, height: 6, borderRadius: 3, transform: [{ translateY: -3 }] },
  hourSlot: { flex: 1, borderTopWidth: 1, minHeight: 70, paddingBottom: 8 },
  emptyHour: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 12, paddingLeft: 7 },
  emptyHourButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emptyHourText: { fontSize: 12.5 },
  hourTasks: { gap: 7, paddingTop: 8 },
  timelineTask: { borderRadius: 16, borderWidth: 1, minHeight: 62, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingRight: 11 },
  taskStripe: { width: 5, alignSelf: 'stretch' },
  timelineTaskContent: { flex: 1, paddingHorizontal: 11, paddingVertical: 10 },
  timelineTaskTitle: { fontSize: 14.5, lineHeight: 19, fontWeight: '600' },
  timelineTaskMeta: { fontSize: 11.5, lineHeight: 15, marginTop: 4 },
  smallCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

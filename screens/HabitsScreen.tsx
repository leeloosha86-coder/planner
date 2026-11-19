import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { addDays, currentStreak, dateKey, daysWord, formatLongDate, formatShortDate, fromDateKey, lastThirtyDays } from '../lib/date';
import { sphereById } from '../lib/spheres';
import type { Habit, SphereCustom } from '../lib/types';
import { useTheme } from '../lib/theme';
import { EmptyState, FadeIn, PrimaryButton } from '../components/UI';
import { ForestCorner, GoldSpark } from '../components/Decor';

function HabitCard({ habit, spheres, index, onToggleDay }: { habit: Habit; spheres: SphereCustom[]; index: number; onToggleDay: (day: string) => void }) {
  const { colors, serif, cardShadow } = useTheme();
  const [page, setPage] = useState(0);
  const sphere = sphereById(spheres, habit.sphere);
  const history = new Set(habit.history);
  const now = new Date();
  const today = dateKey(now);
  const created = dateKey(new Date(habit.createdAt));
  const markedToday = history.has(today);
  const streak = currentStreak(habit.history);
  const days = lastThirtyDays(addDays(now, -page * 30));
  const canGoEarlier = days[0] > created;
  const canGoLater = page > 0;
  return (
    <FadeIn delay={Math.min(index * 80, 240)} style={styles.habitFade}>
      <View style={[styles.habitCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow]}>
        <View style={[styles.sphereLine, { backgroundColor: sphere.color }]} />
        <View style={styles.habitTop}>
          <View style={styles.habitNameWrap}>
            <View style={[styles.spherePill, { backgroundColor: colors.subtle }]}><View style={[styles.sphereDot, { backgroundColor: sphere.color }]} /><Text style={[styles.sphereName, { color: sphere.color }]}>{sphere.name}</Text></View>
            <Text style={[styles.habitName, { color: colors.text, fontFamily: serif }]}>{habit.name}</Text>
          </View>
          <View style={styles.streakWrap}>
            <Text style={[styles.streakNumber, { color: colors.gold, fontFamily: serif }]}>{streak}</Text>
            <Text style={[styles.streakLabel, { color: colors.muted }]}>{daysWord(streak)}</Text>
          </View>
        </View>
        <View style={styles.gridHeader}>
          <View style={styles.pagerRow}><Pressable onPress={() => setPage((value) => value + 1)} disabled={!canGoEarlier} hitSlop={8} accessibilityRole="button" accessibilityLabel="Раньше" style={[styles.pager, { opacity: canGoEarlier ? 1 : 0.3 }]}><Ionicons name="chevron-back" size={18} color={colors.forest} /></Pressable><Text style={[styles.gridTitle, { color: colors.muted }]}>{page === 0 ? 'Последние 30 дней' : `${formatShortDate(days[0])} – ${formatShortDate(days[days.length - 1])}`}</Text><Pressable onPress={() => setPage((value) => value - 1)} disabled={!canGoLater} hitSlop={8} accessibilityRole="button" accessibilityLabel="Позже" style={[styles.pager, { opacity: canGoLater ? 1 : 0.3 }]}><Ionicons name="chevron-forward" size={18} color={colors.forest} /></Pressable></View>
          <View style={styles.gridLegend}><View style={[styles.legendDot, { backgroundColor: sphere.color }]} /><Text style={[styles.gridLegendText, { color: colors.muted }]}>отмечено</Text></View>
        </View>
        <View style={styles.grid}>
          {days.map((day) => {
            const marked = history.has(day);
            const isToday = day === today;
            const editable = day >= created;
            return (
              <Pressable key={day} disabled={!editable} onPress={() => onToggleDay(day)} accessibilityRole="button" accessibilityLabel={`${formatLongDate(fromDateKey(day))}, ${marked ? 'отмечено' : 'не отмечено'}`} style={styles.dotCell}>
                <View style={[styles.dayDot, { backgroundColor: marked ? sphere.color : colors.subtle, borderColor: isToday ? colors.gold : 'transparent', borderWidth: isToday ? 2 : 0, opacity: editable ? 1 : 0.35 }]}>{marked && <View style={[styles.dotShine, { backgroundColor: colors.cream }]} />}</View>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton label={markedToday ? 'Отмечено сегодня' : 'Отметить сегодня'} icon={markedToday ? 'checkmark-circle' : 'add-circle-outline'} variant={markedToday ? 'soft' : 'forest'} disabled={markedToday} onPress={() => onToggleDay(today)} compact />
        {!markedToday && <Text style={[styles.rewardHint, { color: colors.gold }]}>+10 XP и ещё один день в ряду</Text>}
      </View>
    </FadeIn>
  );
}

export default function HabitsScreen({ habits, spheres, refreshing, onRefresh, onToggleDay, onAdd }: {
  habits: Habit[];
  spheres: SphereCustom[];
  refreshing: boolean;
  onRefresh: () => void;
  onToggleDay: (habitId: string, day: string) => void;
  onAdd: () => void;
}) {
  const { colors, serif } = useTheme();
  const best = habits.length ? Math.max(...habits.map((habit) => currentStreak(habit.history))) : 0;
  const header = (
    <View>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Привычки</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Маленькие шаги создают большой лес</Text>
        </View>
        <PrimaryButton label="Новая" icon="add" variant="terra" compact onPress={onAdd} />
      </View>
      <View style={[styles.summary, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
        <ForestCorner />
        <View style={[styles.summaryIcon, { backgroundColor: colors.card }]}><Ionicons name="flame-outline" size={27} color={colors.gold} /></View>
        <View style={styles.summaryText}>
          <Text style={[styles.summaryEyebrow, { color: colors.muted }]}>Самый длинный ряд сейчас</Text>
          <View style={styles.summaryNumberRow}>
            <Text style={[styles.summaryNumber, { color: colors.gold, fontFamily: serif }]}>{best}</Text>
            <Text style={[styles.summaryLabel, { color: colors.text }]}>{`${daysWord(best)}\nподряд`}</Text>
          </View>
        </View>
        <GoldSpark size={23} />
      </View>
      {habits.length > 0 && <View style={styles.listHeading}><Text style={[styles.listTitle, { color: colors.text, fontFamily: serif }]}>Ваши ритуалы</Text><Text style={[styles.listCount, { color: colors.muted }]}>{habits.length}</Text></View>}
    </View>
  );
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={habits}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => <HabitCard habit={item} spheres={spheres} index={index} onToggleDay={(day) => onToggleDay(item.id, day)} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState icon="leaf-outline" title="Пока нет привычек" subtitle="Начните с одного простого действия — золотые точки покажут ваш путь" actionLabel="Добавить привычку" onAction={onAdd} />}
      contentContainerStyle={[styles.content, habits.length === 0 && { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} progressBackgroundColor={colors.card} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 128 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 19 },
  title: { fontSize: 31, lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 19, marginTop: 4 },
  summary: { borderWidth: 1, borderRadius: 22, padding: 17, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  summaryIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  summaryText: { flex: 1, zIndex: 2 },
  summaryEyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  summaryNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  summaryNumber: { fontSize: 46, lineHeight: 49 },
  summaryLabel: { fontSize: 14, lineHeight: 17, fontWeight: '600' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 12 },
  listTitle: { fontSize: 23 },
  listCount: { fontSize: 14, fontWeight: '700' },
  habitFade: { marginBottom: 13 },
  habitCard: { borderWidth: 1, borderRadius: 22, padding: 16, overflow: 'hidden' },
  sphereLine: { position: 'absolute', left: 0, top: 20, bottom: 20, width: 4, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  habitTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  habitNameWrap: { flex: 1, minWidth: 0 },
  spherePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
  sphereDot: { width: 6, height: 6, borderRadius: 3 },
  sphereName: { fontSize: 11.5, fontWeight: '700' },
  habitName: { fontSize: 20, lineHeight: 25 },
  streakWrap: { alignItems: 'center', minWidth: 54 },
  streakNumber: { fontSize: 40, lineHeight: 43 },
  streakLabel: { fontSize: 11.5, lineHeight: 15 },
  gridHeader: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 9 },
  gridTitle: { fontSize: 12, fontWeight: '600' },
  pagerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pager: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  gridLegend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  gridLegendText: { fontSize: 10.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  dotCell: { width: '10%', alignItems: 'center', marginBottom: 8 },
  dayDot: { width: 13, height: 13, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  dotShine: { width: 3, height: 3, borderRadius: 2, opacity: 0.6, position: 'absolute', top: 2, left: 2 },
  rewardHint: { fontSize: 11.5, lineHeight: 15, textAlign: 'center', marginTop: 7, fontWeight: '600' },
});

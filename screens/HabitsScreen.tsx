import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SPHERES } from '../lib/constants';
import { currentStreak, dateKey, daysWord, lastThirtyDays } from '../lib/date';
import type { Habit } from '../lib/types';
import { useTheme } from '../lib/theme';
import { EmptyState, FadeIn, PrimaryButton } from '../components/UI';
import { ForestCorner, GoldSpark } from '../components/Decor';

function HabitCard({ habit, index, onMark }: { habit: Habit; index: number; onMark: () => void }) {
  const { colors, serif, cardShadow } = useTheme();
  const sphere = SPHERES[habit.sphere];
  const history = new Set(habit.history);
  const today = dateKey(new Date());
  const markedToday = history.has(today);
  const streak = currentStreak(habit.history);
  const days = lastThirtyDays();
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
          <Text style={[styles.gridTitle, { color: colors.muted }]}>Последние 30 дней</Text>
          <View style={styles.gridLegend}><View style={[styles.legendDot, { backgroundColor: sphere.color }]} /><Text style={[styles.gridLegendText, { color: colors.muted }]}>отмечено</Text></View>
        </View>
        <View style={styles.grid}>
          {days.map((day) => {
            const marked = history.has(day);
            const isToday = day === today;
            return <View key={day} style={styles.dotCell}><View style={[styles.dayDot, { backgroundColor: marked ? sphere.color : colors.subtle, borderColor: isToday ? colors.gold : 'transparent', borderWidth: isToday ? 2 : 0 }]}>{marked && <View style={[styles.dotShine, { backgroundColor: colors.cream }]} />}</View></View>;
          })}
        </View>
        <PrimaryButton label={markedToday ? 'Отмечено сегодня' : 'Отметить сегодня'} icon={markedToday ? 'checkmark-circle' : 'add-circle-outline'} variant={markedToday ? 'soft' : 'forest'} disabled={markedToday} onPress={onMark} compact />
        {!markedToday && <Text style={[styles.rewardHint, { color: colors.gold }]}>+10 XP и ещё один день в ряду</Text>}
      </View>
    </FadeIn>
  );
}

export default function HabitsScreen({ habits, refreshing, onRefresh, onMark, onAdd }: {
  habits: Habit[];
  refreshing: boolean;
  onRefresh: () => void;
  onMark: (habit: Habit) => void;
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
      renderItem={({ item, index }) => <HabitCard habit={item} index={index} onMark={() => onMark(item)} />}
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
  gridHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 9 },
  gridTitle: { fontSize: 12, fontWeight: '600' },
  gridLegend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  gridLegendText: { fontSize: 10.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  dotCell: { width: '10%', alignItems: 'center', marginBottom: 8 },
  dayDot: { width: 13, height: 13, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  dotShine: { width: 3, height: 3, borderRadius: 2, opacity: 0.6, position: 'absolute', top: 2, left: 2 },
  rewardHint: { fontSize: 11.5, lineHeight: 15, textAlign: 'center', marginTop: 7, fontWeight: '600' },
});

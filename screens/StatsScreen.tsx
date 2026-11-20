import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LEVELS } from '../lib/constants';
import { fromDateKey, shortDay } from '../lib/date';
import { bestHabit, dayStats, doneThisWeek } from '../lib/stats';
import type { PlannerData } from '../lib/types';
import { useTheme } from '../lib/theme';
import { EmptyState } from '../components/UI';
import ExperienceCard from '../components/ExperienceCard';

export default function StatsScreen({ data, refreshing, onRefresh, celebrationSignal }: {
  data: PlannerData;
  refreshing: boolean;
  onRefresh: () => void;
  celebrationSignal: number;
}) {
  const { colors, serif, cardShadow } = useTheme();
  const days = useMemo(() => dayStats(data), [data]);
  const week = doneThisWeek(data);
  const best = bestHabit(data.habits);
  const maxDone = Math.max(1, ...days.map((day) => day.done));

  if (data.tasks.length === 0 && data.habits.length === 0) {
    return <EmptyState icon="bar-chart-outline" title="Пока нечего считать" subtitle="Создайте задачи и отмечайте привычки — здесь появится ваша неделя" />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} progressBackgroundColor={colors.card} />}
    >
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Итоги</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Маленькие шаги за неделю</Text>
        </View>
        <View style={[styles.calendarIcon, { backgroundColor: colors.forestSoft }]}><Ionicons name="bar-chart-outline" size={24} color={colors.forest} /></View>
      </View>

      <View style={styles.tiles}>
        <View style={[styles.tile, { backgroundColor: colors.goldSoft, borderColor: colors.gold }, cardShadow]}>
          <Text style={[styles.tileNumber, { color: colors.gold, fontFamily: serif }]}>{week}</Text>
          <Text style={[styles.tileLabel, { color: colors.text }]}>дел закрыто за неделю</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: serif }]}>Последние семь дней</Text>
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow]}>
        {days.map((day) => (
          <View key={day.date} style={styles.chartRow}>
            <Text style={[styles.chartDay, { color: colors.muted }]}>{shortDay(fromDateKey(day.date))}</Text>
            <View style={[styles.chartTrack, { backgroundColor: colors.subtle }]}>
              <View style={[styles.chartBar, { width: `${Math.round((day.done / maxDone) * 100)}%`, backgroundColor: colors.forest }]} />
            </View>
            <Text style={[styles.chartValue, { color: colors.text }]}>{day.done}</Text>
          </View>
        ))}
      </View>

      {best && (
        <View style={[styles.bestCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow]}>
          <View style={[styles.bestIcon, { backgroundColor: colors.goldSoft }]}><Ionicons name="flame-outline" size={22} color={colors.gold} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bestLabel, { color: colors.muted }]}>Лучший ряд сейчас</Text>
            <Text style={[styles.bestName, { color: colors.text }]} numberOfLines={2}>{best.name}</Text>
          </View>
          <Text style={[styles.bestNumber, { color: colors.gold, fontFamily: serif }]}>{best.streak}</Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: serif }]}>Ваш уровень</Text>
      <ExperienceCard xp={data.xp} celebrationSignal={celebrationSignal} />
      <Text style={[styles.levelHint, { color: colors.muted }]}>
        Следующая ступень: {LEVELS.find((level) => level.xp > data.xp)?.name || 'всё пройдено'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 128 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 19 },
  title: { fontSize: 31, lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 19, marginTop: 4 },
  calendarIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', gap: 11 },
  tile: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 15, minHeight: 104, justifyContent: 'center' },
  tileNumber: { fontSize: 38, lineHeight: 42 },
  tileLabel: { fontSize: 12.5, lineHeight: 16, marginTop: 2 },
  sectionTitle: { fontSize: 22, marginTop: 24, marginBottom: 11 },
  chartCard: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 9 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  chartDay: { width: 26, fontSize: 12, fontWeight: '600' },
  chartTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  chartBar: { height: 10, borderRadius: 5, minWidth: 2 },
  chartValue: { width: 18, fontSize: 12.5, fontWeight: '700', textAlign: 'right' },
  bestCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 20, padding: 14, marginTop: 13 },
  bestIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bestLabel: { fontSize: 11.5, lineHeight: 15 },
  bestName: { fontSize: 15.5, lineHeight: 20, fontWeight: '600', marginTop: 2 },
  bestNumber: { fontSize: 32, lineHeight: 36 },
  levelHint: { fontSize: 12.5, marginTop: 10, textAlign: 'center' },
});

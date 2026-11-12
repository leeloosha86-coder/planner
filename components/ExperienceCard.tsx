import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LEVELS, MAX_XP } from '../lib/constants';
import { useTheme } from '../lib/theme';
import ElfPortrait from './ElfPortrait';
import { ForestCorner, GoldSpark } from './Decor';
import SparkBurst from './SparkBurst';

export default function ExperienceCard({ xp, celebrationSignal }: { xp: number; celebrationSignal: number }) {
  const { colors, serif, cardShadow } = useTheme();
  const level = LEVELS.reduce((result, item, index) => xp >= item.xp ? index : result, 0);
  const current = LEVELS[level];
  const next = LEVELS[level + 1];
  const progress = next ? Math.max(0, Math.min(1, (xp - current.xp) / (next.xp - current.xp))) : 1;
  const lastCelebration = useRef(celebrationSignal);
  const [bar] = useState(() => new Animated.Value(progress));
  const [flash] = useState(() => new Animated.Value(0));
  const [sparks, setSparks] = useState(0);
  const [announcement, setAnnouncement] = useState(false);

  useEffect(() => {
    Animated.timing(bar, { toValue: progress, duration: 520, useNativeDriver: false }).start();
  }, [bar, progress]);

  useEffect(() => {
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    if (celebrationSignal !== lastCelebration.current) {
      lastCelebration.current = celebrationSignal;
      startTimer = setTimeout(() => {
        setAnnouncement(true);
        setSparks((value) => value + 1);
        flash.setValue(0);
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: 650, useNativeDriver: true }),
        ]).start();
        hideTimer = setTimeout(() => setAnnouncement(false), 2400);
      }, 0);
    }
    return () => {
      if (startTimer) clearTimeout(startTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [celebrationSignal, flash]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow]}>
      <ForestCorner />
      <SparkBurst trigger={sparks} />
      <View style={styles.portraitWrap}>
        <Animated.View style={{ transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}>
          <ElfPortrait level={level} size={126} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { backgroundColor: colors.gold, opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.48] }) }]} />
        <View style={[styles.levelBadge, { backgroundColor: colors.goldSoft, borderColor: colors.gold }]}>
          <GoldSpark size={11} />
          <Text style={[styles.levelBadgeText, { color: colors.text }]}>{level + 1} / 5</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.eyebrow, { color: colors.terra }]}>Ваша эльфийка</Text>
        <Text style={[styles.levelName, { color: colors.forest, fontFamily: serif }]}>{current.name}</Text>
        <View style={[styles.barTrack, { backgroundColor: colors.goldSoft }]}>
          <Animated.View style={[styles.barFill, { backgroundColor: colors.gold, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}>
            <View style={[styles.barGlow, { backgroundColor: colors.cream }]} />
          </Animated.View>
        </View>
        <View style={styles.xpRow}>
          <Text style={[styles.xpText, { color: colors.gold }]}>{xp} XP</Text>
          {next && <Text style={[styles.nextXp, { color: colors.muted }]}>{next.xp} XP</Text>}
        </View>
        <Text style={[styles.hint, { color: colors.muted }]}>
          {next ? `Ещё ${next.xp - xp} XP до „${next.genitive}“` : `Высшая стадия · ${MAX_XP} XP`}
        </Text>
        <Text style={[styles.reward, { color: colors.sage }]}>+10 XP за каждое доброе дело</Text>
      </View>
      {announcement && <Animated.View style={[styles.announcement, { backgroundColor: colors.gold, opacity: flash.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 1, 0.94] }) }]}>
        <GoldSpark size={17} />
        <Text style={[styles.announcementText, { color: colors.dark ? colors.darkBg : colors.brown }]}>Новый уровень!</Text>
        <GoldSpark size={17} />
      </Animated.View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 15, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', minHeight: 176 },
  portraitWrap: { width: 126, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  flash: { borderRadius: 63 },
  levelBadge: { position: 'absolute', bottom: -2, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  levelBadgeText: { fontSize: 11, fontWeight: '700' },
  info: { flex: 1, minWidth: 0, paddingLeft: 14, paddingRight: 2, zIndex: 2 },
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 },
  levelName: { fontSize: 20, lineHeight: 24, marginBottom: 12 },
  barTrack: { height: 11, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6, overflow: 'hidden' },
  barGlow: { height: 2, opacity: 0.45, marginHorizontal: 3, marginTop: 2, borderRadius: 1 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  xpText: { fontSize: 12, fontWeight: '800' },
  nextXp: { fontSize: 11 },
  hint: { fontSize: 12.5, lineHeight: 17, marginTop: 6 },
  reward: { fontSize: 11.5, lineHeight: 15, marginTop: 5, fontWeight: '600' },
  announcement: { position: 'absolute', top: 10, alignSelf: 'center', zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 16 },
  announcementText: { fontSize: 15, fontWeight: '800' },
});

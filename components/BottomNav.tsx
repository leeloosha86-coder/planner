import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabId } from '../lib/types';
import { useTheme } from '../lib/theme';

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'today', label: 'Сегодня', icon: 'sunny-outline', activeIcon: 'sunny' },
  { id: 'schedule', label: 'Расписание', icon: 'calendar-outline', activeIcon: 'calendar' },
  { id: 'habits', label: 'Привычки', icon: 'leaf-outline', activeIcon: 'leaf' },
  { id: 'notes', label: 'Заметки', icon: 'document-text-outline', activeIcon: 'document-text' },
  { id: 'shopping', label: 'Покупки', icon: 'cart-outline', activeIcon: 'cart' },
];

export default function BottomNav({ active, onChange, raised = false, telegramBottom = 0 }: {
  active: TabId;
  onChange: (tab: TabId) => void;
  raised?: boolean;
  telegramBottom?: number;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, telegramBottom, 8);
  return (
    <View style={[
      styles.wrap,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
        paddingBottom: safeBottom,
        bottom: raised ? 52 : 0,
        shadowColor: colors.shadow,
      },
    ]}>
      {TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.65, transform: [{ scale: 0.97 }] }]}
          >
            <View style={[styles.iconWrap, selected && { backgroundColor: colors.forestSoft }]}>
              <Ionicons name={selected ? tab.activeIcon : tab.icon} size={21} color={selected ? colors.forest : colors.muted} />
              {selected && <View style={[styles.dot, { backgroundColor: colors.gold }]} />}
            </View>
            <Text numberOfLines={1} style={[styles.label, { color: selected ? colors.forest : colors.muted }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 0, right: 0, minHeight: 70, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start',
    borderTopLeftRadius: 22, borderTopRightRadius: 22, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 12, zIndex: 30,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52, paddingHorizontal: 1 },
  iconWrap: { width: 43, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 1 },
  label: { fontSize: 11.5, lineHeight: 15, fontWeight: '500', textAlign: 'center' },
});

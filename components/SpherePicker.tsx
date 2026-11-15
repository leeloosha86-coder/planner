import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import type { SphereCustom } from '../lib/types';
import { ChoiceChip, FieldLabel } from './UI';

// Выбор сферы в форме. Если сфер много, блок прокручивается вбок.
export default function SpherePicker({ spheres, value, onChange, label = 'Сфера' }: {
  spheres: SphereCustom[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {spheres.map((sphere) => (
          <ChoiceChip key={sphere.id} label={sphere.name} small selected={value === sphere.id} color={sphere.color} onPress={() => onChange(sphere.id)} />
        ))}
        {spheres.length === 0 && <Text style={[styles.empty, { color: colors.muted }]}>Сначала добавьте сферу в настройках</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8, paddingVertical: 1 },
  empty: { fontSize: 13.5, lineHeight: 19 },
});

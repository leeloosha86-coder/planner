import React, { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import type { UndoState } from '../lib/types';

export default function UndoBar({ state, onClose }: { state: UndoState | null; onClose: () => void }) {
  const { colors } = useTheme();
  const [value] = React.useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!state) return;
    Animated.timing(value, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [state, onClose, value]);

  if (!state) return null;
  return (
    <Animated.View style={[styles.wrap, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <View style={[styles.bar, { backgroundColor: colors.brown }]}>
        <Text style={[styles.text, { color: colors.cream }]} numberOfLines={2}>{state.message}</Text>
        <Pressable onPress={() => { state.restore(); onClose(); }} hitSlop={8} accessibilityLabel="Отменить" style={styles.button}>
          <Ionicons name="arrow-undo-outline" size={16} color={colors.gold} />
          <Text style={[styles.buttonText, { color: colors.gold }]}>Отменить</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, bottom: 96, zIndex: 90 },
  bar: { borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1, fontSize: 13.5, lineHeight: 18 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 6 },
  buttonText: { fontSize: 13.5, fontWeight: '700' },
});

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';

export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: object }) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(value, { toValue: 1, duration: 360, delay, useNativeDriver: true }).start();
  }, [delay, value]);
  return (
    <Animated.View style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [9, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export function PrimaryButton({ label, onPress, icon, variant = 'forest', disabled = false, loading = false, compact = false }: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'forest' | 'terra' | 'outline' | 'soft';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const palette = {
    forest: { background: colors.forest, text: colors.cream, border: colors.forest },
    terra: { background: colors.terra, text: colors.cream, border: colors.terra },
    outline: { background: 'transparent', text: colors.forest, border: colors.border },
    soft: { background: colors.forestSoft, text: colors.forest, border: colors.forestSoft },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: palette.background, borderColor: palette.border },
        (disabled || loading) && { opacity: 0.52 },
        pressed && !disabled && { opacity: 0.86, transform: [{ scale: 0.985 }] },
      ]}
    >
      {loading ? <ActivityIndicator color={palette.text} size="small" /> : <>
        {icon && <Ionicons name={icon} size={compact ? 17 : 19} color={palette.text} />}
        <Text style={[styles.buttonText, compact && styles.buttonTextCompact, { color: palette.text }]}>{label}</Text>
      </>}
    </Pressable>
  );
}

export function ChoiceChip({ label, selected, color, onPress, small = false }: {
  label: string;
  selected: boolean;
  color: string;
  onPress: () => void;
  small?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        small && { minHeight: 35, paddingHorizontal: 12, paddingVertical: 7 },
        { backgroundColor: selected ? color : colors.card, borderColor: selected ? color : colors.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.chipText, small && { fontSize: 13 }, { color: selected ? colors.cream : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ icon = 'leaf-outline', title, subtitle, actionLabel, onAction }: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <FadeIn style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.forestSoft }]}>
        <Ionicons name={icon} size={30} color={colors.forest} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.muted }]}>{subtitle}</Text>
      {actionLabel && onAction && <PrimaryButton label={actionLabel} onPress={onAction} icon="add" compact />}
    </FadeIn>
  );
}

export function ConfirmDialog({ state, onClose }: { state: { title: string; message: string; confirmLabel: string; onConfirm: () => void } | null; onClose: () => void }) {
  const { colors, serif } = useTheme();
  return (
    <Modal visible={Boolean(state)} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.confirmBackdrop, { backgroundColor: colors.dark ? 'rgba(30,24,20,0.78)' : 'rgba(74,59,46,0.42)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Закрыть" />
        <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.confirmIcon, { backgroundColor: colors.terraSoft }]}>
            <Ionicons name="trash-outline" size={25} color={colors.terra} />
          </View>
          <Text style={[styles.confirmTitle, { color: colors.text, fontFamily: serif }]}>{state?.title}</Text>
          <Text style={[styles.confirmMessage, { color: colors.muted }]}>{state?.message}</Text>
          <View style={styles.confirmButtons}>
            <View style={{ flex: 1 }}><PrimaryButton label="Отмена" variant="outline" onPress={onClose} compact /></View>
            <View style={{ flex: 1 }}><PrimaryButton label={state?.confirmLabel || 'Удалить'} variant="terra" onPress={() => { state?.onConfirm(); onClose(); }} compact /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function FieldLabel({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) {
  const { colors } = useTheme();
  return <Text style={[styles.fieldLabel, { color: colors.text }]}>{children}{optional && <Text style={{ color: colors.muted, fontWeight: '400' }}> · необязательно</Text>}</Text>;
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 18, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonCompact: { minHeight: 43, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 10 },
  buttonText: { fontSize: 16, lineHeight: 21, fontWeight: '700', textAlign: 'center' },
  buttonTextCompact: { fontSize: 15, lineHeight: 19 },
  chip: { borderRadius: 16, borderWidth: 1, minHeight: 40, paddingHorizontal: 15, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 15, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  emptyWrap: { alignItems: 'center', paddingHorizontal: 26, paddingVertical: 36 },
  emptyIcon: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 7 },
  emptySubtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 18, maxWidth: 280 },
  confirmBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmCard: { width: '100%', maxWidth: 390, borderRadius: 24, padding: 24, borderWidth: 1, zIndex: 2 },
  confirmIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmTitle: { fontSize: 24, lineHeight: 29, marginBottom: 9 },
  confirmMessage: { fontSize: 15, lineHeight: 22, marginBottom: 22 },
  confirmButtons: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 15, lineHeight: 20, fontWeight: '700', marginBottom: 9, marginTop: 18 },
});

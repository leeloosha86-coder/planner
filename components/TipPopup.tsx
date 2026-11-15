import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { FadeIn } from './UI';

export default function TipPopup({ text, onClose }: { text: string; onClose: () => void }) {
  const { colors, serif, cardShadow } = useTheme();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.dark ? 'rgba(30,24,20,0.7)' : 'rgba(74,59,46,0.38)' }]}>
        <FadeIn style={[styles.card, { backgroundColor: colors.card, borderColor: colors.gold }, cardShadow]}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Закрыть совет" style={[styles.close, { backgroundColor: colors.subtle }]}>
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>
          <View style={[styles.badge, { backgroundColor: colors.goldSoft }]}>
            <Ionicons name="bulb-outline" size={18} color={colors.gold} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>Совет на сегодня</Text>
          <Text style={[styles.text, { color: colors.text, fontFamily: serif }]}>{text}</Text>
        </FadeIn>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 24, borderWidth: 1, paddingTop: 26, paddingBottom: 22, paddingHorizontal: 22 },
  close: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 12 },
  text: { fontSize: 19, lineHeight: 27, marginTop: 6 },
});

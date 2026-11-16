import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { PrimaryButton } from './UI';

const PRESETS = [15, 25, 45];

export default function FocusSheet({ visible, onClose, onFinish }: {
  visible: boolean;
  onClose: () => void;
  onFinish: (minutes: number) => void;
}) {
  const { colors, serif } = useTheme();
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const finished = useRef(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (!visible) {
      setRunning(false);
      return;
    }
    setLeft(minutes * 60);
    finished.current = false;
  }, [visible, minutes]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setLeft((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setRunning(false);
          if (!finished.current) {
            finished.current = true;
            finishRef.current(minutes);
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, minutes]);

  const done = left === 0;
  const progress = 1 - left / (minutes * 60);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.dark ? 'rgba(30,24,20,0.76)' : 'rgba(74,59,46,0.38)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Закрыть" />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.head}>
            <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Фокус</Text>
            <Pressable onPress={onClose} style={[styles.close, { backgroundColor: colors.subtle }]} accessibilityLabel="Закрыть"><Ionicons name="close" size={21} color={colors.text} /></Pressable>
          </View>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{done ? 'Готово. Можно выдохнуть и заглянуть в свой лес.' : 'Выберите время и займитесь одним делом'}</Text>

          <View style={styles.timerWrap}>
            <View style={[styles.ring, { borderColor: colors.subtle }]} />
            <View style={[styles.ring, { borderColor: colors.forest, borderTopColor: 'transparent', borderRightColor: progress > 0.5 ? colors.forest : 'transparent', transform: [{ rotate: `${progress * 360}deg` }] }]} />
            <Text style={[styles.time, { color: colors.text, fontFamily: serif }]}>{mm}:{ss}</Text>
          </View>

          <View style={styles.presets}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => { setMinutes(preset); setLeft(preset * 60); setRunning(false); finished.current = false; }}
                disabled={running}
                style={[styles.preset, { borderColor: minutes === preset ? colors.forest : colors.border, backgroundColor: minutes === preset ? colors.forestSoft : 'transparent', opacity: running ? 0.5 : 1 }]}
              >
                <Text style={[styles.presetText, { color: minutes === preset ? colors.forest : colors.text }]}>{preset} мин</Text>
              </Pressable>
            ))}
          </View>

          {done ? (
            <PrimaryButton label="Готово" icon="checkmark" onPress={onClose} />
          ) : (
            <PrimaryButton
              label={running ? 'Пауза' : left === minutes * 60 ? 'Начать' : 'Продолжить'}
              icon={running ? 'pause' : 'play'}
              variant={running ? 'outline' : 'forest'}
              onPress={() => setRunning((current) => !current)}
            />
          )}
          <Text style={[styles.hint, { color: colors.muted }]}>Одна сессия добавляет 10 XP</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 10, paddingBottom: 28 },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 27 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 14.5, lineHeight: 20, marginTop: 6 },
  timerWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 22, height: 168 },
  ring: { position: 'absolute', width: 168, height: 168, borderRadius: 84, borderWidth: 8 },
  time: { fontSize: 46, lineHeight: 52 },
  presets: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  preset: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  presetText: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 11 },
});

import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { makeId } from '../lib/date';
import { buildElfContext, levelIndexFor } from '../lib/elf';
import type { ElfMessage } from '../lib/elf';
import { askElf } from '../lib/storage';
import { useTheme } from '../lib/theme';
import type { PlannerData } from '../lib/types';
import ElfPortrait from './ElfPortrait';

interface ChatItem {
  id: string;
  role: 'user' | 'assistant' | 'note';
  text: string;
}

const GREETING: ChatItem = {
  id: 'greeting',
  role: 'assistant',
  text: 'Привет! Я Рыжий Эльф. Расскажи, что на душе или что сегодня не складывается, и подумаем вместе.',
};

export default function ElfChat({ visible, data, name, topInset, bottomInset, onClose }: {
  visible: boolean;
  data: PlannerData;
  name: string;
  topInset: number;
  bottomInset: number;
  onClose: () => void;
}) {
  const { colors, serif } = useTheme();
  const [items, setItems] = useState<ChatItem[]>([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatItem>>(null);
  const text = input.trim();
  const canSend = text.length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    const userItem: ChatItem = { id: makeId('elf'), role: 'user', text };
    const history: ElfMessage[] = [...items, userItem].flatMap((item) => (
      item.role === 'note' || item.id === GREETING.id ? [] : [{ role: item.role, content: item.text }]
    ));
    setItems((current) => [...current, userItem]);
    setInput('');
    setSending(true);
    try {
      const reply = await askElf(history, buildElfContext(data, new Date(), name));
      setItems((current) => [...current, { id: makeId('elf'), role: 'assistant', text: reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Эльфийка сейчас недоступна.';
      setItems((current) => [...current, { id: makeId('elf'), role: 'note', text: message }]);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    if (item.role === 'note') return <Text style={[styles.note, { color: colors.terra }]}>{item.text}</Text>;
    const mine = item.role === 'user';
    return (
      <View style={[styles.bubble, mine ? [styles.bubbleMine, { backgroundColor: colors.forest }] : [styles.bubbleElf, { backgroundColor: colors.card, borderColor: colors.border }]]}>
        <Text style={[styles.bubbleText, { color: mine ? colors.cream : colors.text }]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.root, { paddingTop: topInset }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть эльфийку" style={[styles.back, { backgroundColor: colors.card }]}>
              <Ionicons name="arrow-back" size={23} color={colors.forest} />
            </Pressable>
            <ElfPortrait level={levelIndexFor(data.xp)} size={46} />
            <View style={styles.titleBox}>
              <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Рыжий Эльф</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>Планы, привычки и немного хулиганства</Text>
            </View>
          </View>
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={sending ? (
              <View style={styles.thinking}>
                <ActivityIndicator size="small" color={colors.forest} />
                <Text style={[styles.thinkingText, { color: colors.muted }]}>Эльфийка думает…</Text>
              </View>
            ) : null}
          />
          <Text style={[styles.disclaimer, { color: colors.muted }]}>Я не врач и не психолог. Вижу задачи и привычки на сегодня, уровень и время суток. Если тебе очень плохо, позвони 112 или близким.</Text>
          <View style={[styles.inputRow, { paddingBottom: Math.max(bottomInset, 12) }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Напиши, что на душе или что планируешь"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={1000}
              accessibilityLabel="Сообщение эльфийке"
              style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
            />
            <Pressable onPress={send} disabled={!canSend} accessibilityRole="button" accessibilityLabel="Отправить" style={[styles.send, { backgroundColor: colors.forest, opacity: canSend ? 1 : 0.4 }]}>
              <Ionicons name="send" size={18} color={colors.cream} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 17, paddingVertical: 10 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleBox: { flex: 1 },
  title: { fontSize: 24, lineHeight: 29 },
  subtitle: { fontSize: 13, lineHeight: 17, marginTop: 2 },
  list: { paddingHorizontal: 17, paddingVertical: 12, gap: 10, flexGrow: 1 },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  bubbleElf: { alignSelf: 'flex-start', borderWidth: 1, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  note: { alignSelf: 'center', fontSize: 13, lineHeight: 18, textAlign: 'center', paddingHorizontal: 12 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  thinkingText: { fontSize: 13, fontStyle: 'italic' },
  disclaimer: { fontSize: 11.5, lineHeight: 16, paddingHorizontal: 17, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 17, paddingTop: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, maxHeight: 120, minHeight: 46 },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});

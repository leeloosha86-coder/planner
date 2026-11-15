import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ShoppingItem } from '../lib/types';
import { useTheme } from '../lib/theme';
import { EmptyState, FadeIn } from '../components/UI';

const MAX_TITLE = 120;

function ShoppingRow({ item, index, onToggle, onRemove }: { item: ShoppingItem; index: number; onToggle: () => void; onRemove: () => void }) {
  const { colors, cardShadow } = useTheme();
  return (
    <FadeIn delay={Math.min(index * 35, 200)} style={styles.rowFade}>
      <View style={[styles.row, { backgroundColor: item.done ? colors.subtle : colors.card, borderColor: colors.border }, cardShadow]}>
        <Pressable
          onPress={onToggle}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.done }}
          accessibilityLabel={item.done ? `Снять отметку: ${item.title}` : `Куплено: ${item.title}`}
          style={[styles.check, { borderColor: item.done ? colors.forest : colors.sage, backgroundColor: item.done ? colors.forest : 'transparent' }]}
        >
          {item.done && <Ionicons name="checkmark" size={16} color={colors.cream} />}
        </Pressable>
        <Pressable onPress={onToggle} style={styles.titleWrap}>
          <Text style={[styles.title, { color: item.done ? colors.muted : colors.text }, item.done && styles.done]}>{item.title}</Text>
        </Pressable>
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Удалить: ${item.title}`} style={styles.remove}>
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>
      </View>
    </FadeIn>
  );
}

export default function ShoppingScreen({ items, refreshing, onRefresh, onAdd, onToggle, onRemove, onClear }: {
  items: ShoppingItem[];
  refreshing: boolean;
  onRefresh: () => void;
  onAdd: (title: string) => void;
  onToggle: (item: ShoppingItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const { colors, serif } = useTheme();
  const [draft, setDraft] = useState('');
  const sorted = useMemo(() => [...items.filter((item) => !item.done), ...items.filter((item) => item.done)], [items]);
  const doneCount = items.filter((item) => item.done).length;
  const canAdd = draft.trim().length > 0;

  const submit = () => {
    if (!canAdd) return;
    onAdd(draft.trim());
    setDraft('');
  };

  const header = (
    <View>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: colors.text, fontFamily: serif }]}>Покупки</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{items.length ? `Куплено ${doneCount} из ${items.length}` : 'Список пока пуст'}</Text>
        </View>
        {items.length > 0 && (
          <Pressable onPress={onClear} accessibilityLabel="Удалить список и начать новый" style={[styles.clearButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Ionicons name="trash-outline" size={16} color={colors.terra} />
            <Text style={[styles.clearText, { color: colors.terra }]}>Новый список</Text>
          </Pressable>
        )}
      </View>
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder="Что купить?"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          maxLength={MAX_TITLE}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel="Название продукта"
        />
        <Pressable
          onPress={submit}
          disabled={!canAdd}
          accessibilityLabel="Добавить продукт"
          style={({ pressed }) => [styles.addButton, { backgroundColor: canAdd ? colors.terra : colors.subtle }, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="add" size={22} color={canAdd ? colors.cream : colors.muted} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => <ShoppingRow item={item} index={index} onToggle={() => onToggle(item)} onRemove={() => onRemove(item.id)} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState icon="cart-outline" title="Список пуст" subtitle="Напишите первый продукт в строку выше" />}
      contentContainerStyle={[styles.content, sorted.length === 0 && { flexGrow: 1 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} progressBackgroundColor={colors.card} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 128 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  screenTitle: { fontSize: 31, lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 19, marginTop: 4 },
  clearButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  clearText: { fontSize: 12.5, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingLeft: 15, paddingRight: 7, paddingVertical: 7, gap: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 8 },
  addButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowFade: { marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 13, minHeight: 58 },
  check: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  done: { textDecorationLine: 'line-through' },
  remove: { padding: 4, marginLeft: 6 },
});

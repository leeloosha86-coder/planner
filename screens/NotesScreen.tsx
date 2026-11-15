import React, { useMemo, useState } from 'react';
import { Animated, FlatList, PanResponder, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatNoteDate } from '../lib/date';
import { sphereById } from '../lib/spheres';
import type { Note, SphereCustom } from '../lib/types';
import { useTheme } from '../lib/theme';
import { EmptyState, FadeIn, PrimaryButton } from '../components/UI';

function SwipeableNote({ note, spheres, index, onEdit, onRequestDelete }: { note: Note; spheres: SphereCustom[]; index: number; onEdit: () => void; onRequestDelete: () => void }) {
  const { colors, serif, cardShadow } = useTheme();
  const [translate] = useState(() => new Animated.Value(0));
  const sphere = sphereById(spheres, note.sphere);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderMove: (_, gesture) => translate.setValue(Math.max(-112, Math.min(0, gesture.dx))),
    onPanResponderRelease: (_, gesture) => {
      const shouldDelete = gesture.dx < -72;
      Animated.spring(translate, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start(() => { if (shouldDelete) onRequestDelete(); });
    },
    onPanResponderTerminate: () => Animated.spring(translate, { toValue: 0, useNativeDriver: true }).start(),
  }), [onRequestDelete, translate]);
  return (
    <FadeIn delay={Math.min(index * 55, 220)} style={styles.noteFade}>
      <View style={styles.swipeWrap}>
        <View style={[styles.deleteUnderlay, { backgroundColor: colors.terra }]}><Ionicons name="trash-outline" size={24} color={colors.cream} /><Text style={[styles.deleteUnderlayText, { color: colors.cream }]}>Удалить</Text></View>
        <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: translate }] }}>
          <Pressable onPress={onEdit} style={({ pressed }) => [styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow, pressed && { opacity: 0.84 }]}>
            <View style={[styles.noteStripe, { backgroundColor: sphere.color }]} />
            <View style={styles.noteTop}>
              <Text numberOfLines={2} style={[styles.noteTitle, { color: colors.text, fontFamily: serif }]}>{note.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.sage} />
            </View>
            {!!note.text && <Text numberOfLines={3} style={[styles.noteText, { color: colors.muted }]}>{note.text}</Text>}
            <View style={styles.noteBottom}>
              <View style={styles.noteDateRow}><Ionicons name="time-outline" size={13} color={colors.muted} /><Text style={[styles.noteDate, { color: colors.muted }]}>{formatNoteDate(note.updatedAt)}</Text></View>
              <View style={styles.noteSphereRow}><View style={[styles.noteSphereDot, { backgroundColor: sphere.color }]} /><Text style={[styles.noteSphere, { color: sphere.color }]}>{sphere.name}</Text></View>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </FadeIn>
  );
}

export default function NotesScreen({ notes, spheres, refreshing, onRefresh, onAdd, onEdit, onDelete }: {
  notes: Note[];
  spheres: SphereCustom[];
  refreshing: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  const { colors, serif } = useTheme();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ru-RU');
    return [...notes]
      .filter((note) => !needle || `${note.title} ${note.text}`.toLocaleLowerCase('ru-RU').includes(needle))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, query]);
  const header = (
    <View>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text, fontFamily: serif }]}>Заметки</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Мысли, идеи и важные мелочи</Text>
        </View>
        <PrimaryButton label="Новая" icon="add" variant="terra" compact onPress={onAdd} />
      </View>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={21} color={colors.sage} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Найти заметку" placeholderTextColor={colors.muted} returnKeyType="search" autoCapitalize="none" style={[styles.searchInput, { color: colors.text }]} />
        {!!query && <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Очистить поиск"><Ionicons name="close-circle" size={20} color={colors.muted} /></Pressable>}
      </View>
      <View style={styles.listInfo}>
        <Text style={[styles.listInfoText, { color: colors.muted }]}>{query ? `Найдено: ${filtered.length}` : 'Свежие заметки сверху'}</Text>
        <View style={styles.swipeHint}><Ionicons name="arrow-back" size={13} color={colors.sage} /><Text style={[styles.swipeHintText, { color: colors.sage }]}>свайп для удаления</Text></View>
      </View>
    </View>
  );
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => <SwipeableNote note={item} spheres={spheres} index={index} onEdit={() => onEdit(item)} onRequestDelete={() => onDelete(item)} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState icon={query ? 'search-outline' : 'document-text-outline'} title={query ? 'Ничего не найдено' : 'Пока нет заметок'} subtitle={query ? 'Попробуйте изменить запрос или очистить поиск' : 'Сохраните первую идею, чтобы она не потерялась'} actionLabel={query ? 'Очистить поиск' : 'Добавить заметку'} onAction={query ? () => setQuery('') : onAdd} />}
      contentContainerStyle={[styles.content, filtered.length === 0 && { flexGrow: 1 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} progressBackgroundColor={colors.card} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 128 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 19 },
  title: { fontSize: 31, lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 19, marginTop: 4 },
  search: { minHeight: 52, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 13 },
  listInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 12, gap: 6 },
  listInfoText: { fontSize: 11.5 },
  swipeHint: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  swipeHintText: { fontSize: 10.5 },
  noteFade: { marginBottom: 12 },
  swipeWrap: { position: 'relative' },
  deleteUnderlay: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 105, borderRadius: 20, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 19 },
  deleteUnderlayText: { fontSize: 11.5, marginTop: 4, fontWeight: '600' },
  noteCard: { borderWidth: 1, borderRadius: 20, padding: 16, paddingLeft: 20, overflow: 'hidden' },
  noteStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  noteTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteTitle: { flex: 1, fontSize: 20, lineHeight: 25 },
  noteText: { fontSize: 14.5, lineHeight: 21, marginTop: 8 },
  noteBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 14 },
  noteDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteDate: { fontSize: 11.5 },
  noteSphereRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  noteSphereDot: { width: 6, height: 6, borderRadius: 3 },
  noteSphere: { fontSize: 11, fontWeight: '600' },
});

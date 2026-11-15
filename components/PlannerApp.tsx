import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, LEVELS, MAX_XP, TASK_XP } from '../lib/constants';
import { dateKey, isTaskDone, makeId } from '../lib/date';
import { botUsername, createInitialData, loadData, persistLocal, persistRemote } from '../lib/storage';
import { buildTheme, ThemeProvider } from '../lib/theme';
import { useTelegram } from '../lib/telegram';
import { fallbackSphereId } from '../lib/spheres';
import { tipForDate } from '../lib/tips';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConfirmState, Habit, Note, NoteDraft, PlannerData, ShoppingItem, SphereCustom, SphereFilter, TabId, Task, TaskDraft } from '../lib/types';
import BottomNav from './BottomNav';
import TaskForm, { TaskFormHandle } from './TaskForm';
import NoteEditor, { NoteEditorHandle } from './NoteEditor';
import HabitForm, { HabitFormHandle } from './HabitForm';
import SpheresSheet, { SpheresSheetHandle } from './SpheresSheet';
import TipPopup from './TipPopup';
import { ConfirmDialog, FadeIn } from './UI';
import ElfPortrait from './ElfPortrait';
import SparkBurst from './SparkBurst';
import { GoldSpark } from './Decor';
import TodayScreen from '../screens/TodayScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HabitsScreen from '../screens/HabitsScreen';
import NotesScreen from '../screens/NotesScreen';
import ShoppingScreen from '../screens/ShoppingScreen';

const TIP_SHOWN_KEY = 'moy-planirovshchik-tip-shown-on';

export default function PlannerApp() {
  const systemScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { webApp, isTelegram, sdkReady, haptic, notify } = useTelegram();
  const theme = buildTheme(systemScheme, webApp);
  const { colors, serif } = theme;
  const [data, setData] = useState<PlannerData>(() => createInitialData());
  const [hydrated, setHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [filter, setFilter] = useState<SphereFilter>('all');
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [habitFormVisible, setHabitFormVisible] = useState(false);
  const [spheresVisible, setSpheresVisible] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const tipShown = useRef(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [levelUpEvent, setLevelUpEvent] = useState<{ id: number; level: number } | null>(null);
  const [levelUpSignal, setLevelUpSignal] = useState(0);
  const trackedLevel = useRef(0);
  const levelTrackingReady = useRef(false);
  const taskFormRef = useRef<TaskFormHandle>(null);
  const noteEditorRef = useRef<NoteEditorHandle>(null);
  const habitFormRef = useRef<HabitFormHandle>(null);
  const spheresSheetRef = useRef<SpheresSheetHandle>(null);
  const today = dateKey(new Date());
  const telegramBottom = Math.max(webApp?.safeAreaInset?.bottom || 0, webApp?.contentSafeAreaInset?.bottom || 0);
  const topInset = Math.max(insets.top, webApp?.contentSafeAreaInset?.top || 0, webApp?.safeAreaInset?.top || 0);

  const commit = useCallback((updater: (current: PlannerData) => PlannerData) => {
    setData((current) => ({ ...updater(current), updatedAt: new Date().toISOString() }));
  }, []);

  const hydrate = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await loadData();
      setData(result.data);
      setSyncError(result.error || '');
    } catch {
      setSyncError('Не удалось обновить данные. Попробуйте ещё раз.');
    } finally {
      setHydrated(true);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!sdkReady) return;
    const timer = setTimeout(hydrate, 0);
    return () => clearTimeout(timer);
  }, [hydrate, sdkReady]);

  useEffect(() => {
    if (!hydrated) return;
    const nextLevel = LEVELS.reduce((result, item, index) => data.xp >= item.xp ? index : result, 0);
    if (!levelTrackingReady.current) {
      trackedLevel.current = nextLevel;
      levelTrackingReady.current = true;
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (nextLevel > trackedLevel.current) {
      timer = setTimeout(() => {
        const id = Date.now();
        setLevelUpSignal(id);
        setLevelUpEvent({ id, level: nextLevel });
        notify('success');
      }, 0);
    }
    trackedLevel.current = nextLevel;
    return () => { if (timer) clearTimeout(timer); };
  }, [data.xp, hydrated, notify]);

  useEffect(() => {
    if (!levelUpEvent) return;
    const timer = setTimeout(() => setLevelUpEvent((current) => current?.id === levelUpEvent.id ? null : current), 2600);
    return () => clearTimeout(timer);
  }, [levelUpEvent]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(data).catch(() => setSyncError('Не удалось сохранить данные на устройстве.'));
    const timer = setTimeout(() => {
      persistRemote(data).then(() => setSyncError('')).catch(() => {
        if (isTelegram) setSyncError('Сервер пока недоступен. Изменения сохранены на устройстве.');
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [data, hydrated, isTelegram]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = colors.bg;
      document.documentElement.style.backgroundColor = colors.bg;
    }
    if (!webApp) return;
    try {
      webApp.setHeaderColor(colors.bg);
      webApp.setBackgroundColor(colors.bg);
    } catch {
      // Старые версии Telegram просто используют цвета интерфейса.
    }
  }, [colors.bg, webApp]);

  useEffect(() => {
    if (!hydrated || tipShown.current) return;
    tipShown.current = true;
    const today = dateKey(new Date());
    AsyncStorage.getItem(TIP_SHOWN_KEY).then((shownOn) => {
      if (shownOn === today) return;
      const text = tipForDate(new Date());
      if (!text) return;
      setTip(text);
      return AsyncStorage.setItem(TIP_SHOWN_KEY, today);
    }).catch(() => undefined);
  }, [hydrated]);

  const openNewTask = useCallback((date = dateKey(new Date()), time = '') => {
    setTaskDraft({
      title: '', time, repeat: 'none', sphere: filter === 'all' ? (data.spheres[0]?.id || '') : filter, date,
    });
  }, [data.spheres, filter]);

  const closeTop = useCallback(() => {
    if (confirm) setConfirm(null);
    else if (taskDraft) setTaskDraft(null);
    else if (noteDraft) setNoteDraft(null);
    else if (habitFormVisible) setHabitFormVisible(false);
    else if (spheresVisible) setSpheresVisible(false);
  }, [confirm, habitFormVisible, noteDraft, spheresVisible, taskDraft]);

  useEffect(() => {
    if (!webApp) return;
    const formOpen = Boolean(taskDraft || noteDraft || habitFormVisible || spheresVisible);
    const visible = formOpen || activeTab === 'today';
    const handler = () => {
      if (taskDraft) taskFormRef.current?.save();
      else if (noteDraft) noteEditorRef.current?.save();
      else if (habitFormVisible) habitFormRef.current?.save();
      else if (spheresVisible) spheresSheetRef.current?.save();
      else openNewTask();
    };
    webApp.MainButton.setParams({
      text: formOpen ? 'Сохранить' : 'Добавить задачу',
      color: COLORS.forest,
      text_color: COLORS.cream,
      is_visible: visible,
      is_active: true,
    });
    if (visible) webApp.MainButton.show(); else webApp.MainButton.hide();
    webApp.MainButton.onClick(handler);
    return () => webApp.MainButton.offClick(handler);
  }, [activeTab, habitFormVisible, noteDraft, openNewTask, spheresVisible, taskDraft, webApp]);

  useEffect(() => {
    if (!webApp) return;
    const visible = Boolean(taskDraft || noteDraft || habitFormVisible || spheresVisible || confirm);
    if (visible) webApp.BackButton.show(); else webApp.BackButton.hide();
    webApp.BackButton.onClick(closeTop);
    return () => webApp.BackButton.offClick(closeTop);
  }, [closeTop, confirm, habitFormVisible, noteDraft, spheresVisible, taskDraft, webApp]);

  const toggleTask = useCallback((task: Task, occurrenceDate = today) => {
    const wasDone = isTaskDone(task, occurrenceDate);
    haptic('light');
    commit((current) => ({
      ...current,
      xp: Math.max(0, Math.min(MAX_XP, current.xp + (wasDone ? -TASK_XP : TASK_XP))),
      tasks: current.tasks.map((item) => {
        if (item.id !== task.id) return item;
        if (item.repeat === 'none') return { ...item, completed: !wasDone };
        return {
          ...item,
          completedDates: wasDone ? item.completedDates.filter((key) => key !== occurrenceDate) : [...new Set([...item.completedDates, occurrenceDate])],
        };
      }),
    }));
  }, [commit, haptic, today]);

  const editTask = useCallback((task: Task) => {
    setTaskDraft({ id: task.id, title: task.title, time: task.time, repeat: task.repeat, sphere: task.sphere, date: task.date });
  }, []);

  const saveTask = (draft: TaskDraft) => {
    haptic('light');
    commit((current) => {
      if (draft.id) {
        return { ...current, tasks: current.tasks.map((task) => task.id === draft.id ? { ...task, ...draft, id: task.id } : task) };
      }
      const task: Task = {
        id: makeId('task'), title: draft.title, time: draft.time, repeat: draft.repeat,
        sphere: draft.sphere, date: draft.date, createdAt: new Date().toISOString(), completed: false, completedDates: [],
      };
      return { ...current, tasks: [...current.tasks, task] };
    });
    setTaskDraft(null);
  };

  const requestDeleteTask = () => {
    if (!taskDraft?.id) return;
    const id = taskDraft.id;
    setConfirm({
      title: 'Удалить задачу?',
      message: 'Задача и её повторы будут удалены. Полученный опыт сохранится.',
      confirmLabel: 'Удалить',
      onConfirm: () => {
        commit((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
        setTaskDraft(null);
        haptic('medium');
      },
    });
  };

  const markHabit = (habit: Habit) => {
    if (habit.history.includes(today)) return;
    haptic('light');
    commit((current) => ({
      ...current,
      xp: Math.min(MAX_XP, current.xp + TASK_XP),
      habits: current.habits.map((item) => item.id === habit.id ? { ...item, history: [...new Set([...item.history, today])].sort() } : item),
    }));
  };

  const saveHabit = (name: string, sphere: string) => {
    haptic('light');
    const habit: Habit = { id: makeId('habit'), name, sphere, history: [], createdAt: new Date().toISOString() };
    commit((current) => ({ ...current, habits: [...current.habits, habit] }));
    setHabitFormVisible(false);
  };

  const openNewNote = () => setNoteDraft({ title: '', text: '', sphere: data.spheres[0]?.id || '' });
  const openNote = (note: Note) => setNoteDraft({ id: note.id, title: note.title, text: note.text, sphere: note.sphere });
  const saveNote = (draft: NoteDraft) => {
    haptic('light');
    const now = new Date().toISOString();
    commit((current) => {
      if (draft.id) {
        return { ...current, notes: current.notes.map((note) => note.id === draft.id ? { ...note, ...draft, id: note.id, updatedAt: now } : note) };
      }
      const note: Note = { id: makeId('note'), title: draft.title, text: draft.text, sphere: draft.sphere, createdAt: now, updatedAt: now };
      return { ...current, notes: [note, ...current.notes] };
    });
    setNoteDraft(null);
  };
  const requestDeleteNote = (note: Note) => {
    setConfirm({
      title: 'Удалить заметку?',
      message: `«${note.title}» будет удалена без возможности восстановления.`,
      confirmLabel: 'Удалить',
      onConfirm: () => {
        commit((current) => ({ ...current, notes: current.notes.filter((item) => item.id !== note.id) }));
        haptic('medium');
      },
    });
  };

  const changeSpheres = (next: SphereCustom[]) => {
    haptic('light');
    commit((current) => {
      const keep = (id: string) => fallbackSphereId(next, id);
      return {
        ...current,
        spheres: next,
        tasks: current.tasks.map((task) => ({ ...task, sphere: keep(task.sphere) })),
        habits: current.habits.map((habit) => ({ ...habit, sphere: keep(habit.sphere) })),
        notes: current.notes.map((note) => ({ ...note, sphere: keep(note.sphere) })),
      };
    });
    setSpheresVisible(false);
  };

  const countSphereUsage = useCallback((id: string) => {
    const tasks = data.tasks.filter((task) => task.sphere === id).length;
    const habits = data.habits.filter((habit) => habit.sphere === id).length;
    const notes = data.notes.filter((note) => note.sphere === id).length;
    return tasks + habits + notes;
  }, [data.habits, data.notes, data.tasks]);

  const requestDeleteSphere = (sphere: SphereCustom) => {
    if (data.spheres.length <= 1) {
      setSyncError('Должна остаться хотя бы одна сфера');
      return;
    }
    const used = countSphereUsage(sphere.id);
    const target = data.spheres.find((item) => item.id !== sphere.id) || data.spheres[0];
    setConfirm({
      title: `Удалить сферу «${sphere.name}»?`,
      message: used > 0
        ? `К этой сфере привязано записей: ${used}. Они не пропадут и перейдут в сферу «${target.name}».`
        : 'Сфера пустая, её можно удалить без потерь.',
      confirmLabel: 'Удалить',
      onConfirm: () => {
        changeSpheres(data.spheres.filter((item) => item.id !== sphere.id));
      },
    });
  };

  const addShoppingItem = (title: string) => {
    haptic('light');
    commit((current) => ({ ...current, shopping: [...current.shopping, { id: makeId('item'), title, done: false }] }));
  };

  const toggleShoppingItem = (item: ShoppingItem) => {
    haptic('light');
    commit((current) => ({
      ...current,
      shopping: current.shopping.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry),
    }));
  };

  const removeShoppingItem = (id: string) => {
    haptic('light');
    commit((current) => ({ ...current, shopping: current.shopping.filter((entry) => entry.id !== id) }));
  };

  const requestNewShoppingList = () => {
    setConfirm({
      title: 'Удалить список?',
      message: 'Все продукты будут удалены. После этого можно начать новый список.',
      confirmLabel: 'Удалить',
      onConfirm: () => {
        commit((current) => ({ ...current, shopping: [] }));
        haptic('medium');
      },
    });
  };

  const openBot = () => {
    const url = botUsername ? `https://t.me/${botUsername}?start=planner` : 'https://t.me/';
    if (webApp) webApp.openTelegramLink(url);
    else Linking.openURL(url).catch(() => setSyncError('Вернитесь в чат с ботом и отправьте /start, чтобы включить напоминания.'));
  };
  const changeTab = (tab: TabId) => {
    haptic('soft');
    setActiveTab(tab);
  };
  const fabBottom = (isTelegram && activeTab === 'today' ? 52 : 0) + Math.max(insets.bottom, telegramBottom) + 79;

  return (
    <ThemeProvider value={theme}>
      <View style={[styles.outer, { backgroundColor: colors.subtle }]}>
        <StatusBar style={colors.dark ? 'light' : 'dark'} />
        <View style={[styles.frame, { backgroundColor: colors.bg }, Platform.OS === 'web' && { shadowColor: colors.shadow }]}>
          <View style={[styles.screen, { paddingTop: topInset }]}>
            {!hydrated ? <View style={styles.loader}>
              <ElfPortrait level={0} size={132} />
              <ActivityIndicator color={colors.gold} size="small" style={{ marginTop: 20 }} />
              <Text style={[styles.loaderTitle, { color: colors.forest, fontFamily: serif }]}>Просыпаем лес…</Text>
              <Text style={[styles.loaderText, { color: colors.muted }]}>Собираем ваши дела и заметки</Text>
            </View> : <>
              {activeTab === 'today' && <TodayScreen tasks={data.tasks} spheres={data.spheres} xp={data.xp} today={today} filter={filter} botStarted={data.botStarted} syncError={syncError} refreshing={refreshing} onFilter={setFilter} onToggle={(task) => toggleTask(task, today)} onEdit={editTask} onRefresh={hydrate} celebrationSignal={levelUpSignal} onOpenBot={openBot} onRetry={hydrate} onManageSpheres={() => setSpheresVisible(true)} />}
              {activeTab === 'schedule' && <ScheduleScreen tasks={data.tasks} spheres={data.spheres} refreshing={refreshing} onRefresh={hydrate} onAdd={(date, time) => openNewTask(date, time)} onEdit={editTask} onToggle={toggleTask} />}
              {activeTab === 'habits' && <HabitsScreen habits={data.habits} spheres={data.spheres} refreshing={refreshing} onRefresh={hydrate} onMark={markHabit} onAdd={() => setHabitFormVisible(true)} />}
              {activeTab === 'notes' && <NotesScreen notes={data.notes} spheres={data.spheres} refreshing={refreshing} onRefresh={hydrate} onAdd={openNewNote} onEdit={openNote} onDelete={requestDeleteNote} />}
              {activeTab === 'shopping' && <ShoppingScreen items={data.shopping} refreshing={refreshing} onRefresh={hydrate} onAdd={addShoppingItem} onToggle={toggleShoppingItem} onRemove={removeShoppingItem} onClear={requestNewShoppingList} />}
            </>}
          </View>
          {hydrated && activeTab === 'today' && <Pressable onPress={() => openNewTask()} accessibilityLabel="Добавить задачу" style={({ pressed }) => [styles.fab, { backgroundColor: colors.terra, bottom: fabBottom, shadowColor: colors.shadow }, pressed && { transform: [{ scale: 0.92 }] }]}>
            <Ionicons name="add" size={31} color={colors.cream} />
          </Pressable>}
          {hydrated && <BottomNav active={activeTab} onChange={changeTab} raised={isTelegram && activeTab === 'today'} telegramBottom={telegramBottom} />}
          {levelUpEvent && <View pointerEvents="none" style={[styles.toastPosition, { top: topInset + 12 }]}>
            <FadeIn key={levelUpEvent.id} style={[styles.levelToast, { backgroundColor: colors.card, borderColor: colors.gold, shadowColor: colors.shadow }]}>
              <SparkBurst trigger={levelUpEvent.id} />
              <ElfPortrait level={levelUpEvent.level} size={62} />
              <View style={styles.levelToastText}>
                <Text style={[styles.levelToastTitle, { color: colors.gold, fontFamily: serif }]}>Новый уровень!</Text>
                <Text style={[styles.levelToastName, { color: colors.text }]}>{LEVELS[levelUpEvent.level].name}</Text>
              </View>
              <GoldSpark size={22} />
            </FadeIn>
          </View>}
        </View>
        <TaskForm ref={taskFormRef} visible={Boolean(taskDraft)} initial={taskDraft} spheres={data.spheres} useTelegramButton={isTelegram} onClose={() => setTaskDraft(null)} onSave={saveTask} onDelete={taskDraft?.id ? requestDeleteTask : undefined} />
        <NoteEditor ref={noteEditorRef} visible={Boolean(noteDraft)} initial={noteDraft} spheres={data.spheres} useTelegramButton={isTelegram} onClose={() => setNoteDraft(null)} onSave={saveNote} />
        <HabitForm ref={habitFormRef} visible={habitFormVisible} spheres={data.spheres} useTelegramButton={isTelegram} onClose={() => setHabitFormVisible(false)} onSave={saveHabit} />
        <SpheresSheet ref={spheresSheetRef} visible={spheresVisible} spheres={data.spheres} noteCount={countSphereUsage} useTelegramButton={isTelegram} onClose={() => setSpheresVisible(false)} onSave={changeSpheres} onDelete={requestDeleteSphere} />
        {tip && <TipPopup text={tip} onClose={() => setTip(null)} />}
        <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  frame: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 24 },
  screen: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 70 },
  loaderTitle: { fontSize: 25, marginTop: 16 },
  loaderText: { fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 7 },
  fab: { position: 'absolute', right: 20, width: 59, height: 59, borderRadius: 30, alignItems: 'center', justifyContent: 'center', zIndex: 40, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  toastPosition: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  levelToast: { width: '100%', maxWidth: 400, borderRadius: 20, borderWidth: 1.5, padding: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 10, overflow: 'visible' },
  levelToastText: { flex: 1 },
  levelToastTitle: { fontSize: 22, lineHeight: 26 },
  levelToastName: { fontSize: 14, lineHeight: 18, marginTop: 2 },
});

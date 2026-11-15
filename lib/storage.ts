import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey, makeId, rolloverOverdueTasks } from './date';
import { DEFAULT_SPHERES, fallbackSphereId, modernSphereId, normalizeSpheres } from './spheres';
import { getTelegram } from './telegram';
import type { Habit, Note, PlannerData, Task } from './types';

const STORAGE_KEY = 'moy-planirovshchik-data-v1';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

function timezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
  } catch {
    return 'Europe/Moscow';
  }
}

function initialTasks(): Task[] {
  const now = new Date();
  const today = dateKey(now);
  const createdAt = now.toISOString();
  return [
    { id: makeId('task'), title: 'Разобрать рабочую почту', time: '09:30', repeat: 'none', sphere: 'work', date: today, createdAt, completed: true, completedDates: [] },
    { id: makeId('task'), title: 'Полить фиалки и проверить ростки', time: '', repeat: 'none', sphere: 'home', date: today, createdAt, completed: false, completedDates: [] },
    { id: makeId('task'), title: 'Сфотографировать новое изделие', time: '16:00', repeat: 'none', sphere: 'hobby', date: today, createdAt, completed: false, completedDates: [] },
    { id: makeId('task'), title: 'Прочитать двадцать страниц', time: '20:30', repeat: 'daily', sphere: 'health', date: today, createdAt, completed: false, completedDates: [] },
    { id: makeId('task'), title: 'Спокойная прогулка перед сном', time: '19:00', repeat: 'none', sphere: 'home', date: today, createdAt, completed: false, completedDates: [] },
  ];
}

function initialHabits(): Habit[] {
  const now = new Date();
  const keys = Array.from({ length: 12 }, (_, index) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (11 - index));
    return dateKey(day);
  });
  return [
    { id: makeId('habit'), name: 'Стакан тёплой воды утром', sphere: 'health', history: keys.slice(4, 11), createdAt: now.toISOString() },
    { id: makeId('habit'), name: 'Пятнадцать минут рукоделия', sphere: 'hobby', history: [2, 4, 6, 7, 8, 9, 10].map((index) => keys[index]), createdAt: now.toISOString() },
  ];
}

function initialNotes(): Note[] {
  const now = new Date();
  return [
    {
      id: makeId('note'),
      title: 'Идеи для тихого вечера',
      text: 'Заварить чай с чабрецом, зажечь свечу и достать недоконченную вышивку. Оставить телефон в другой комнате.',
      sphere: 'hobby',
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: makeId('note'),
      title: 'Список к выходным',
      text: 'Сухие травы, лён цвета овса, маленькие деревянные пуговицы и новый блокнот для набросков.',
      sphere: 'home',
      createdAt: new Date(now.getTime() - 172800000).toISOString(),
      updatedAt: new Date(now.getTime() - 172800000).toISOString(),
    },
  ];
}

export function createInitialData(): PlannerData {
  return {
    tasks: initialTasks(),
    habits: initialHabits(),
    notes: initialNotes(),
    spheres: DEFAULT_SPHERES.map((sphere) => ({ ...sphere })),
    xp: 30,
    botStarted: false,
    updatedAt: new Date().toISOString(),
    timezone: timezone(),
  };
}

export function normalize(value: Partial<PlannerData>): PlannerData {
  const fallback = createInitialData();
  const spheres = normalizeSpheres(value.spheres);
  const adopt = (id: unknown) => fallbackSphereId(spheres, modernSphereId(typeof id === 'string' ? id : ''));
  const tasks = Array.isArray(value.tasks) ? rolloverOverdueTasks(value.tasks) : fallback.tasks;
  const habits = Array.isArray(value.habits) ? value.habits : fallback.habits;
  const notes = Array.isArray(value.notes) ? value.notes : fallback.notes;
  return {
    tasks: tasks.map((task) => ({ ...task, sphere: adopt(task.sphere) })),
    habits: habits.map((habit) => ({ ...habit, sphere: adopt(habit.sphere) })),
    notes: notes.map((note) => ({ ...note, sphere: adopt(note.sphere) })),
    spheres,
    xp: Math.max(0, Math.min(500, Number(value.xp) || 0)),
    botStarted: Boolean(value.botStarted),
    updatedAt: value.updatedAt || fallback.updatedAt,
    timezone: value.timezone || timezone(),
  };
}

function request(path: string, init: RequestInit = {}): Promise<Response> {
  const initData = getTelegram()?.initData || '';
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData,
      ...(init.headers || {}),
    },
  });
}

export async function loadData(): Promise<{ data: PlannerData; remote: boolean; error?: string }> {
  let local: PlannerData | null = null;
  let hasLocalCopy = false;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    hasLocalCopy = Boolean(raw);
    local = raw ? normalize(JSON.parse(raw)) : createInitialData();
  } catch {
    local = createInitialData();
  }
  const initData = getTelegram()?.initData;
  if (!API_URL || !initData) return { data: local, remote: false };
  try {
    const response = await request('/api/state');
    if (!response.ok) throw new Error('request failed');
    const payload = await response.json();
    const remote = normalize(payload.data);
    const chosen = !hasLocalCopy || new Date(remote.updatedAt).getTime() >= new Date(local.updatedAt).getTime() ? remote : local;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chosen));
    return { data: chosen, remote: true };
  } catch {
    return { data: local, remote: false, error: 'Сервер пока недоступен. Изменения сохранятся на этом устройстве.' };
  }
}

export async function persistLocal(data: PlannerData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function persistRemote(data: PlannerData): Promise<void> {
  if (!API_URL || !getTelegram()?.initData) return;
  const response = await request('/api/state', { method: 'PUT', body: JSON.stringify({ data }) });
  if (!response.ok) throw new Error('request failed');
}

export async function refreshRemote(): Promise<PlannerData | null> {
  if (!API_URL || !getTelegram()?.initData) return null;
  const response = await request('/api/state');
  if (!response.ok) throw new Error('request failed');
  const payload = await response.json();
  return normalize(payload.data);
}

export const hasRemoteConfiguration = Boolean(API_URL);
export const botUsername = process.env.EXPO_PUBLIC_BOT_USERNAME || '';

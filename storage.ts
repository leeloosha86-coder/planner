import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey, isValidRepeat, makeId, rolloverOverdueTasks } from './date';
import { DEFAULT_SPHERES, fallbackSphereId, modernSphereId, normalizeSpheres } from './spheres';
import { getTelegram } from './telegram';
import type { Habit, Note, PlannerData, ShoppingItem, ShoppingTemplate, Task } from './types';
import type { ElfContext, ElfMessage } from './elf';

const STORAGE_KEY = 'moy-planirovshchik-data-v1';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

// Пояс берём с устройства: сервер не знает, где живёт человек.
export function deviceTimezone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zone === 'string' && zone ? zone : 'UTC';
  } catch {
    return 'UTC';
  }
}

function initialTasks(): Task[] {
  const now = new Date();
  const today = dateKey(now);
  const createdAt = now.toISOString();
  return [
    { id: makeId('task'), title: 'Разобрать рабочую почту', time: '09:30', repeat: 'none', sphere: 'work', date: today, createdAt, completed: true, completedDates: [], important: false },
    { id: makeId('task'), title: 'Полить фиалки и проверить ростки', time: '', repeat: 'none', sphere: 'home', date: today, createdAt, completed: false, completedDates: [], important: false },
    { id: makeId('task'), title: 'Сфотографировать новое изделие', time: '16:00', repeat: 'none', sphere: 'hobby', date: today, createdAt, completed: false, completedDates: [], important: false },
    { id: makeId('task'), title: 'Прочитать двадцать страниц', time: '20:30', repeat: 'daily', sphere: 'health', date: today, createdAt, completed: false, completedDates: [], important: false },
    { id: makeId('task'), title: 'Спокойная прогулка перед сном', time: '19:00', repeat: 'none', sphere: 'home', date: today, createdAt, completed: false, completedDates: [], important: false },
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
    shopping: [],
    templates: [],
    xp: 30,
    botStarted: false,
    updatedAt: new Date().toISOString(),
    timezone: deviceTimezone(),
  };
}

function normalizeShopping(value: unknown): ShoppingItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ShoppingItem => typeof item === 'object' && item !== null && typeof item.id === 'string' && typeof item.title === 'string')
    .slice(0, 300)
    .map((item) => ({ id: item.id, title: item.title.slice(0, 120), done: Boolean(item.done) }));
}

function normalizeTemplates(value: unknown): ShoppingTemplate[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ShoppingTemplate => typeof item === 'object' && item !== null && typeof item.id === 'string' && typeof item.name === 'string' && Array.isArray(item.items))
    .slice(0, 50)
    .map((item) => ({
      id: item.id,
      name: item.name.slice(0, 60),
      items: item.items.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0).slice(0, 300).map((entry) => entry.slice(0, 120)),
    }));
}

export function normalize(value: Partial<PlannerData>): PlannerData {
  const fallback = createInitialData();
  const spheres = normalizeSpheres(value.spheres);
  const adopt = (id: unknown) => fallbackSphereId(spheres, modernSphereId(typeof id === 'string' ? id : ''));
  const tasks = Array.isArray(value.tasks) ? rolloverOverdueTasks(value.tasks) : fallback.tasks;
  const habits = Array.isArray(value.habits) ? value.habits : fallback.habits;
  const notes = Array.isArray(value.notes) ? value.notes : fallback.notes;
  return {
    tasks: tasks.map((task) => ({ ...task, repeat: isValidRepeat(task.repeat) ? task.repeat : 'none', sphere: adopt(task.sphere), important: Boolean(task.important) })),
    habits: habits.map((habit) => ({ ...habit, sphere: adopt(habit.sphere) })),
    notes: notes.map((note) => ({ ...note, sphere: adopt(note.sphere) })),
    spheres,
    shopping: normalizeShopping(value.shopping),
    templates: normalizeTemplates(value.templates),
    xp: Math.max(0, Math.min(500, Number(value.xp) || 0)),
    botStarted: Boolean(value.botStarted),
    updatedAt: value.updatedAt || fallback.updatedAt,
    timezone: deviceTimezone(),
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
    const remoteZone = payload?.data?.timezone;
    const remote = normalize(payload.data);
    const chosen = !hasLocalCopy || new Date(remote.updatedAt).getTime() >= new Date(local.updatedAt).getTime() ? remote : local;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chosen));
    // Сервер мог хранить чужой пояс (например, Москву по умолчанию) — исправляем.
    if (remoteZone !== chosen.timezone) {
      syncTimezone(chosen.timezone).catch(() => undefined);
    }
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

// Сообщаем серверу пояс устройства. Нужно для напоминаний:
// сервер сравнивает время задачи с местным временем пользователя.
export async function syncTimezone(zone: string): Promise<void> {
  if (!API_URL || !getTelegram()?.initData) return;
  const response = await request('/api/timezone', { method: 'POST', body: JSON.stringify({ timezone: zone }) });
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

export async function askElf(messages: ElfMessage[], context: ElfContext): Promise<string> {
  if (!hasRemoteConfiguration) throw new Error('Эльфийка будет доступна, когда приложение подключено к серверу.');
  const response = await request('/api/elf/chat', { method: 'POST', body: JSON.stringify({ messages, context }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Эльфийка сейчас недоступна.');
  return String(payload.reply || '');
}

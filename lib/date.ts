import type { RepeatRule, Task } from './types';

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAYS_FULL = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function mondayOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(12, 0, 0, 0);
  return result;
}

export function weekDates(anchor: Date): Date[] {
  const monday = mondayOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function dayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function shortDay(date: Date): string {
  return DAYS_SHORT[dayIndex(date)];
}

export function fullDay(date: Date): string {
  return DAYS_FULL[dayIndex(date)];
}

export function formatLongDate(date: Date): string {
  return `${fullDay(date)}, ${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

export function formatShortDate(key: string): string {
  const date = fromDateKey(key);
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

export function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 17) return 'Добрый день';
  if (hour >= 17 && hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

export function taskOccursOn(task: Task, key: string): boolean {
  if (task.repeat === 'none') return task.date === key;
  if (key < task.date) return false;
  if (task.repeat === 'daily') return true;
  const index = dayIndex(fromDateKey(key));
  if (task.repeat === 'weekdays') return index < 5;
  return index === dayIndex(fromDateKey(task.date));
}

export function isTaskDone(task: Task, key: string): boolean {
  return task.repeat === 'none' ? task.completed : task.completedDates.includes(key);
}

export function tasksForDate(tasks: Task[], key: string): Task[] {
  return tasks
    .filter((task) => taskOccursOn(task, key))
    .sort((a, b) => {
      const doneA = isTaskDone(a, key) ? 1 : 0;
      const doneB = isTaskDone(b, key) ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      if (!a.time && !b.time) return a.createdAt.localeCompare(b.createdAt);
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
}

export function rolloverOverdueTasks(tasks: Task[], today = dateKey(new Date())): Task[] {
  const tomorrow = dateKey(addDays(new Date(), 1));
  return tasks.map((task) => {
    if (task.repeat === 'none' && !task.completed && task.date < today) {
      return { ...task, date: tomorrow };
    }
    return task;
  });
}

export function currentStreak(history: string[], now = new Date()): number {
  const marks = new Set(history);
  const today = dateKey(now);
  let cursor = marks.has(today) ? now : addDays(now, -1);
  if (!marks.has(dateKey(cursor))) return 0;
  let streak = 0;
  while (marks.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function lastThirtyDays(now = new Date()): string[] {
  return Array.from({ length: 30 }, (_, index) => dateKey(addDays(now, index - 29)));
}

export function daysWord(value: number): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

export function formatNoteDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (dateKey(date) === dateKey(now)) return `сегодня, ${time}`;
  if (dateKey(date) === dateKey(addDays(now, -1))) return `вчера, ${time}`;
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}, ${time}`;
}

export function repeatDescription(rule: RepeatRule, key: string): string {
  if (rule === 'daily') return 'Задача будет появляться каждый день';
  if (rule === 'weekdays') return 'Задача будет появляться с понедельника по пятницу';
  if (rule === 'weekly') return `Задача будет появляться каждую неделю: ${DAYS_FULL[dayIndex(fromDateKey(key))]}`;
  return 'Один раз, без повторения';
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

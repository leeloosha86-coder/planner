import { LEVELS } from './constants';
import { currentStreak, dateKey, isTaskDone, tasksForDate } from './date';
import type { PlannerData } from './types';

export interface ElfMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ElfContext {
  name: string;
  time: string;
  partOfDay: string;
  level: string;
  xp: number;
  tasks: { title: string; time: string; done: boolean }[];
  habits: { name: string; streak: number; markedToday: boolean }[];
}

export function levelIndexFor(xp: number): number {
  return LEVELS.reduce((result, item, index) => (xp >= item.xp ? index : result), 0);
}

function partOfDay(hour: number): string {
  if (hour < 5) return 'ночь';
  if (hour < 12) return 'утро';
  if (hour < 17) return 'день';
  if (hour < 23) return 'вечер';
  return 'ночь';
}

export function buildElfContext(data: PlannerData, now: Date, name: string): ElfContext {
  const today = dateKey(now);
  return {
    name,
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    partOfDay: partOfDay(now.getHours()),
    level: LEVELS[levelIndexFor(data.xp)].name,
    xp: data.xp,
    tasks: tasksForDate(data.tasks, today).map((task) => ({ title: task.title, time: task.time, done: isTaskDone(task, today) })),
    habits: data.habits.map((habit) => ({ name: habit.name, streak: currentStreak(habit.history, now), markedToday: habit.history.includes(today) })),
  };
}

import { addDays, dateKey, isTaskDone, tasksForDate } from './date';
import type { Habit, PlannerData } from './types';

export interface DayStat {
  date: string;
  done: number;
  total: number;
  focus: number;
}

function lastNDays(n: number, now = new Date()): string[] {
  return Array.from({ length: n }, (_, index) => dateKey(addDays(now, index - (n - 1))));
}

export function dayStats(data: PlannerData, now = new Date()): DayStat[] {
  return lastNDays(7, now).map((date) => {
    const dayTasks = tasksForDate(data.tasks, date);
    return {
      date,
      done: dayTasks.filter((task) => isTaskDone(task, date)).length,
      total: dayTasks.length,
      focus: data.focus.filter((session) => session.date === date).reduce((sum, session) => sum + session.minutes, 0),
    };
  });
}

export function doneThisWeek(data: PlannerData, now = new Date()): number {
  return dayStats(data, now).reduce((sum, day) => sum + day.done, 0);
}

export function focusThisWeek(data: PlannerData, now = new Date()): number {
  return data.focus
    .filter((session) => lastNDays(7, now).includes(session.date))
    .reduce((sum, session) => sum + session.minutes, 0);
}

export function bestHabit(habits: Habit[]): { name: string; streak: number } | null {
  if (!habits.length) return null;
  let best: { name: string; streak: number } | null = null;
  for (const habit of habits) {
    const marks = new Set(habit.history);
    let cursor = new Date();
    if (!marks.has(dateKey(cursor))) cursor = addDays(cursor, -1);
    let streak = 0;
    while (marks.has(dateKey(cursor))) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    if (!best || streak > best.streak) best = { name: habit.name, streak };
  }
  return best;
}

export function doneToday(data: PlannerData, now = new Date()): number {
  const key = dateKey(now);
  return tasksForDate(data.tasks, key).filter((task) => isTaskDone(task, key)).length;
}

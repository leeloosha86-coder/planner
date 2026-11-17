import { dateKey, isTaskDone, tasksForDate } from './date';
import type { Task } from './types';

// Таймер в фоне может сработать с задержкой, поэтому окно шире одной минуты.
const WINDOW_MINUTES = 2;

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function dueReminders(tasks: Task[], now: Date, shown: Set<string>): Task[] {
  const key = dateKey(now);
  shown.forEach((id) => {
    if (!id.endsWith(`|${key}`)) shown.delete(id);
  });
  const current = now.getHours() * 60 + now.getMinutes();
  const due = tasksForDate(tasks, key).filter((task) => {
    if (!task.time || isTaskDone(task, key) || shown.has(`${task.id}|${key}`)) return false;
    const since = current - minutesOf(task.time);
    return since >= 0 && since <= WINDOW_MINUTES;
  });
  due.forEach((task) => shown.add(`${task.id}|${key}`));
  return due;
}

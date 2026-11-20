export type SphereId = string;
export type SphereFilter = 'all' | SphereId;
export type PresetRepeat = 'none' | 'daily' | 'weekdays' | 'weekly' | 'quarterly' | 'yearly';
export type RepeatRule = PresetRepeat | `every:${number}` | `days:${string}`;
export type TabId = 'today' | 'schedule' | 'habits' | 'notes' | 'shopping';

export interface SphereCustom {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  repeat: RepeatRule;
  sphere: SphereId;
  date: string;
  createdAt: string;
  completed: boolean;
  completedDates: string[];
  important: boolean;
}

export interface Habit {
  id: string;
  name: string;
  sphere: SphereId;
  history: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  text: string;
  sphere: SphereId;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  title: string;
  done: boolean;
}

export interface ShoppingTemplate {
  id: string;
  name: string;
  items: string[];
}

export interface PlannerData {
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
  spheres: SphereCustom[];
  shopping: ShoppingItem[];
  templates: ShoppingTemplate[];
  xp: number;
  botStarted: boolean;
  updatedAt: string;
  timezone: string;
}

export interface TaskDraft {
  id?: string;
  title: string;
  time: string;
  repeat: RepeatRule;
  sphere: SphereId;
  date: string;
  important: boolean;
}

export interface NoteDraft {
  id?: string;
  title: string;
  text: string;
  sphere: SphereId;
}

export interface UndoState {
  message: string;
  restore: () => void;
}

export interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

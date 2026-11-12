export type SphereId = 'work' | 'home' | 'craft' | 'study';
export type SphereFilter = 'all' | SphereId;
export type RepeatRule = 'none' | 'daily' | 'weekdays' | 'weekly';
export type TabId = 'today' | 'schedule' | 'habits' | 'notes';

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

export interface PlannerData {
  tasks: Task[];
  habits: Habit[];
  notes: Note[];
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
}

export interface NoteDraft {
  id?: string;
  title: string;
  text: string;
  sphere: SphereId;
}

export interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

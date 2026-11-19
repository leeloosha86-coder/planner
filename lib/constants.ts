export const COLORS = {
  cream: '#F6EFE0',
  card: '#FBF7EE',
  sage: '#9DAE8F',
  forest: '#5E6F52',
  terra: '#C06A45',
  gold: '#C9A24D',
  brown: '#4A3B2E',
  craft: '#A8829E',
  study: '#6E8FA8',
  darkBg: '#2A221C',
  darkCard: '#352B23',
} as const;

export const LEVELS = [
  { xp: 0, name: 'Сонная мечтательница', genitive: 'Сонной мечтательницы' },
  { xp: 50, name: 'Любознательная эльфийка', genitive: 'Любознательной эльфийки' },
  { xp: 150, name: 'Умелая планировщица', genitive: 'Умелой планировщицы' },
  { xp: 300, name: 'Мастерица свершений', genitive: 'Мастерицы свершений' },
  { xp: 500, name: 'Хранительница времени', genitive: 'Хранительницы времени' },
] as const;

export const REPEAT_OPTIONS = [
  { id: 'none', label: 'Нет' },
  { id: 'daily', label: 'Каждый день' },
  { id: 'weekdays', label: 'По будням' },
  { id: 'weekly', label: 'Раз в неделю' },
  { id: 'quarterly', label: 'Раз в квартал' },
  { id: 'yearly', label: 'Раз в год' },
] as const;

export const MAX_XP = 500;
export const TASK_XP = 10;
export const FOCUS_XP = 10;

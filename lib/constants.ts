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
  { xp: 0, name: 'Лесная искра', genitive: 'Лесной искры' },
  { xp: 50, name: 'Лиственная следопытка', genitive: 'Лиственной следопытки' },
  { xp: 150, name: 'Хранительница грибов', genitive: 'Хранительницы грибов' },
  { xp: 300, name: 'Цветочная дева', genitive: 'Цветочной девы' },
  { xp: 500, name: 'Светлая эльфийка леса', genitive: 'Светлой эльфийки леса' },
] as const;

export const REPEAT_OPTIONS = [
  { id: 'none', label: 'Нет' },
  { id: 'daily', label: 'Каждый день' },
  { id: 'weekdays', label: 'По будням' },
  { id: 'weekly', label: 'Раз в неделю' },
] as const;

export const MAX_XP = 500;
export const TASK_XP = 10;

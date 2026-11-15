import { COLORS } from './constants';
import type { SphereCustom } from './types';

// Сколько сфер может быть у одного человека и какая длина названия допустима.
export const MAX_SPHERES = 12;
export const MAX_SPHERE_NAME = 20;

// Сферы, которые видит новый пользователь. Идентификаторы остаются прежними,
// чтобы задачи, заметки и привычки не теряли связь со своей сферой.
export const DEFAULT_SPHERES: SphereCustom[] = [
  { id: 'home', name: 'Дом', color: COLORS.terra },
  { id: 'work', name: 'Работа', color: COLORS.forest },
  { id: 'health', name: 'Здоровье', color: COLORS.study },
  { id: 'hobby', name: 'Хобби', color: COLORS.craft },
];

// Цвета для новых сфер: берём по кругу, чтобы они не повторялись подряд.
export const SPHERE_COLORS = [COLORS.forest, COLORS.terra, COLORS.craft, COLORS.study, COLORS.sage, COLORS.gold];

// Старые идентификаторы из первых версий приложения.
const LEGACY_ALIASES: Record<string, string> = { craft: 'hobby', study: 'health' };

export function modernSphereId(id: string): string {
  return LEGACY_ALIASES[id] || id;
}

export function cleanSphereName(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, MAX_SPHERE_NAME) : '';
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function makeSphereId(): string {
  return `sph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function colorForIndex(index: number): string {
  return SPHERE_COLORS[index % SPHERE_COLORS.length];
}

// Приводит любой набор сфер к рабочему виду: без пустых названий,
// без повторов идентификаторов, не больше MAX_SPHERES.
export function normalizeSpheres(value: unknown): SphereCustom[] {
  if (!Array.isArray(value)) return DEFAULT_SPHERES.map((sphere) => ({ ...sphere }));
  const seen = new Set<string>();
  const result: SphereCustom[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<SphereCustom>;
    const id = modernSphereId(typeof item.id === 'string' ? item.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) : '');
    const name = cleanSphereName(item.name);
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, name, color: isHexColor(item.color) ? item.color : colorForIndex(result.length) });
    if (result.length >= MAX_SPHERES) break;
  }
  if (result.length === 0) return DEFAULT_SPHERES.map((sphere) => ({ ...sphere }));
  return result;
}

// Сфера по идентификатору. Если такой нет — первая из списка,
// чтобы старые записи никогда не оставались без цвета и названия.
export function sphereById(spheres: SphereCustom[], id: string): SphereCustom {
  const found = spheres.find((sphere) => sphere.id === id);
  if (found) return found;
  const legacy = spheres.find((sphere) => sphere.id === modernSphereId(id));
  return legacy || spheres[0] || DEFAULT_SPHERES[0];
}

// Идентификатор, к которому нужно привязать запись, если её сфера удалена.
export function fallbackSphereId(spheres: SphereCustom[], id: string): string {
  return sphereById(spheres, id).id;
}

export function filtersFor(spheres: SphereCustom[], allColor: string): { id: string; name: string; color: string }[] {
  return [{ id: 'all', name: 'Все', color: allColor }, ...spheres.map((sphere) => ({ id: sphere.id, name: sphere.name, color: sphere.color }))];
}

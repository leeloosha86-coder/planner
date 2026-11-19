import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const COLLECTIONS = {
  base: 'Базовый',
  autumn: 'Осенний',
} as const;

export type CollectionId = keyof typeof COLLECTIONS;

// Отдельный ключ: выбор коллекции не входит в данные, которые сохраняет сервер.
const STORAGE_KEY = 'moy-planirovshchik-collection-v1';
const IDS = Object.keys(COLLECTIONS) as CollectionId[];

let selected: CollectionId = 'base';
let loadStarted = false;
const listeners = new Set<(id: CollectionId) => void>();

function isCollectionId(value: string | null): value is CollectionId {
  return IDS.some((id) => id === value);
}

function applyCollection(id: CollectionId) {
  selected = id;
  listeners.forEach((listener) => listener(id));
}

export function switchCollection() {
  const next = IDS[(IDS.indexOf(selected) + 1) % IDS.length];
  applyCollection(next);
  AsyncStorage.setItem(STORAGE_KEY, next);
}

export function useCollection(): CollectionId {
  const [value, setValue] = useState<CollectionId>(selected);

  useEffect(() => {
    listeners.add(setValue);
    if (!loadStarted) {
      loadStarted = true;
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (isCollectionId(raw)) applyCollection(raw);
      });
    }
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  return value;
}

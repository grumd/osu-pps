import storage from 'localforage';

import type { Mode } from '@/constants/modes';

export const getMapsDataStorageKey = (mode: Mode) => `data-${mode}`;
export const getRankingsStorageKey = (mode: Mode) => `rankings-${mode}`;
export const getLastUpdatedStorageKey = (mode: Mode) => `last-updated-data-${mode}`;
export const getRankingsDateStorageKey = (mode: Mode) => `last-updated-rankings-${mode}`;

export const getLastUpdated = async (mode: Mode): Promise<Date | null> => {
  const timestamp = await storage.getItem<number>(getLastUpdatedStorageKey(mode));
  return timestamp ? new Date(timestamp) : null;
};

export const setLastUpdated = async (mode: Mode, date: Date): Promise<void> => {
  await storage.setItem(getLastUpdatedStorageKey(mode), date.getTime());
};

export const getStorageItem = async <T>(storageKey: string): Promise<T | null> =>
  storage.getItem<T>(storageKey);

export const setStorageItem = async <T>(storageKey: string, data: T): Promise<void> => {
  await storage.setItem(storageKey, data);
};

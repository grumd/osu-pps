import storage from 'localforage';

import { Mode } from 'constants/modes';
import { Beatmap } from 'features/maps/types';

export const getMapsDataStorageKey = (mode: Mode) => `data-${mode}`;
export const getRankingsStorageKey = (mode: Mode) => `rankings-${mode}`;
export const getLastUpdatedStorageKey = (mode: Mode) => `last-updated-data-${mode}`;
export const getRankingsDateStorageKey = (mode: Mode) => `last-updated-rankings-${mode}`;

export const getLastUpdated = async (mode: Mode): Promise<Date | null> => {
  const timestamp = await storage.getItem<number>(getLastUpdatedStorageKey(mode));
  return timestamp ? new Date(timestamp) : null;
};

export const getMapsData = async (mode: Mode): Promise<Beatmap[] | null> => {
  return storage.getItem<Beatmap[]>(getMapsDataStorageKey(mode));
};

export const getStorageItem = async <T>(storageKey: string): Promise<T | null> => {
  return storage.getItem<T>(storageKey);
};

export const setLastUpdated = async (mode: Mode, date: Date): Promise<void> => {
  await storage.setItem(getLastUpdatedStorageKey(mode), date.getTime());
};

export const setMapsData = async (mode: Mode, beatmaps: Beatmap[]): Promise<void> => {
  await storage.setItem(getLastUpdatedStorageKey(mode), beatmaps);
};

export const setStorageItem = async <T>(storageKey: string, data: T): Promise<void> => {
  await storage.setItem(storageKey, data);
};

import Papa from 'papaparse';

import { DEBUG_FETCH } from 'constants/api';
import { Mode } from 'constants/modes';

import { Metadata } from 'types/metadata';

import {
  getLastUpdated,
  setMapsData,
  getMapsData,
  setLastUpdated,
  getStorageItem,
  setStorageItem,
} from 'utils/storage';

export const fetchJson = async <T>({ url }: { url: string }): Promise<T> => {
  try {
    const response = await fetch(url);
    if (response.status >= 200 && response.status < 300) {
      const data = await response.json();
      return data as T;
    } else {
      throw Error('HTTP Status ' + response.status);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

export const fetchCsv = async <T>({ url }: { url: string }): Promise<T[]> => {
  try {
    const response = await fetch(url);
    if (response.status >= 200 && response.status < 300) {
      const text = await response.text();
      return await new Promise((resolve) => {
        Papa.parse<T>(text, {
          header: true,
          dynamicTyping: true,
          worker: true,
          complete: (result) => {
            resolve(result.data);
          },
        });
      });
    } else {
      throw Error('HTTP Status ' + response.status);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

export const fetchWithPersist =
  <T extends any[], Args extends [Mode, ...any[]]>({
    storageKey,
    metadata,
    action,
  }: {
    storageKey: string;
    metadata: Metadata | undefined;
    action: (...args: Args) => Promise<T | null>;
  }): ((...args: Args) => Promise<T | null>) =>
  async (...args: Args): Promise<T | null> => {
    if (!metadata) {
      return null;
    }

    const [mode] = args;
    const lastUpdatedFromMetadata = new Date(metadata.lastUpdated);
    const lastUpdatedFromStorage = await getLastUpdated(mode);

    if (lastUpdatedFromStorage && lastUpdatedFromStorage >= lastUpdatedFromMetadata) {
      // Storage data is fresh
      const data = await getStorageItem<T>(storageKey);
      if (data && data.length && !DEBUG_FETCH) {
        return data;
      }
    }

    const data = await action(...args);

    if (!DEBUG_FETCH) {
      void setLastUpdated(mode, lastUpdatedFromMetadata);
      void setStorageItem(storageKey, data);
    }

    return data;
  };

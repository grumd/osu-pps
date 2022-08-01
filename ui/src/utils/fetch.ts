import axios from 'axios';
import Papa from 'papaparse';

import { DEBUG_FETCH } from '@/constants/api';
import { Mode } from '@/constants/modes';
import { Metadata } from '@/types/metadata';
import { getLastUpdated, getStorageItem, setLastUpdated, setStorageItem } from '@/utils/storage';

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

export const fetchCsvWithProgress = async <T>({
  path,
  setProgress,
}: {
  path: string;
  setProgress: (progress: number) => void;
}): Promise<T[]> => {
  setProgress(0);

  // Github API
  // https://api.github.com/repos/grumd/osu-pps/contents/data/maps/osu/diffs.csv?ref=data
  const apiResponse = await axios.get(
    `https://api.github.com/repos/grumd/osu-pps/contents/${path}?ref=data`
  );
  const contentSize = apiResponse.data.size;
  const downloadUrl = apiResponse.data.download_url;

  setProgress(0.05);

  const response = await axios.get(downloadUrl, {
    responseType: 'text',
    onDownloadProgress: (progressEvent) => {
      // Math.min for the sanity check, just in case downloaded content is bigger than contentSize
      setProgress(Math.min(0.95, (progressEvent.loaded / contentSize) * 0.9 + 0.05));
    },
  });

  setProgress(0.95);

  const parsed = await new Promise<T[]>((resolve) => {
    Papa.parse<T>(response.data, {
      header: true,
      dynamicTyping: true,
      worker: true,
      complete: (result) => {
        resolve(result.data);
      },
    });
  });

  setProgress(1);

  return parsed;
};

export const fetchCsv = async <T>({ url }: { url: string }): Promise<T[]> => {
  try {
    const response = await fetch(url);
    if (response.status >= 200 && response.status < 300) {
      const text = await response.text();
      const parsePromise = new Promise<T[]>((resolve) => {
        Papa.parse<T>(text, {
          header: true,
          dynamicTyping: true,
          worker: true,
          complete: (result) => {
            resolve(result.data);
          },
        });
      });

      return parsePromise;
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

import axios from 'axios';
import Papa from 'papaparse';

import { DEBUG_FETCH } from '@/constants/api';

interface GithubFileApiResponse {
  size: number;
  download_url: string;
}

export const fetchJson = async <T>({ url }: { url: string }): Promise<T> => {
  try {
    const response = await fetch(url);
    if (response.status >= 200 && response.status < 300) {
      const data = (await response.json()) as T;
      await new Promise((res) => setTimeout(res, 2000));
      return data;
    }
    throw Error(`HTTP Status ${response.status}`);
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
  const apiResponse = DEBUG_FETCH
    ? { data: { size: 1, download_url: `http://localhost:5174/${path}` } }
    : await axios.get<GithubFileApiResponse>(
        `https://api.github.com/repos/grumd/osu-pps/contents/${path}?ref=data`
      );
  const contentSize = apiResponse.data.size;
  const downloadUrl = apiResponse.data.download_url;

  setProgress(0.1);

  const response = await axios.get<string>(downloadUrl, {
    responseType: 'text',
    onDownloadProgress: (progressEvent: { loaded: number }) => {
      // Math.min for the sanity check, just in case downloaded content is bigger than contentSize
      setProgress(Math.min(0.9, (progressEvent.loaded / contentSize) * 0.8 + 0.1));
    },
  });

  setProgress(0.9);

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

      return await parsePromise;
    }
    throw Error(`HTTP Status ${response.status}`);
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

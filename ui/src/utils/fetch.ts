import axios from 'axios';
import Papa from 'papaparse';

import { API_PREFIX, DEBUG_FETCH } from '@/constants/api';

/**
 * Total size of a remote file, for the download progress bar.
 * Prefers Content-Length from a HEAD request; falls back to a 1-byte Range
 * request and reads the total from Content-Range ("bytes 0-0/12345").
 * NOTE: the bucket's CORS config must expose Content-Length/Content-Range.
 */
const getRemoteFileSize = async (url: string): Promise<number> => {
  const head = await fetch(url, { method: 'HEAD' });
  if (!head.ok) throw Error(`HTTP Status ${head.status}`);
  const length = head.headers.get('content-length');
  if (length) {
    const size = Number(length);
    if (Number.isFinite(size) && size > 0) return size;
  }
  const ranged = await fetch(url, { headers: { Range: 'bytes=0-0' } });
  const range = ranged.headers.get('content-range');
  if (range) {
    const size = Number(range.split('/')[1]);
    if (Number.isFinite(size) && size > 0) return size;
  }
  throw Error(`Could not determine file size for ${url}`);
};

export const fetchJson = async <T>({ url }: { url: string }): Promise<T> => {
  try {
    const response = await fetch(url);
    if (response.status >= 200 && response.status < 300) {
      const data = (await response.json()) as T;
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

  const downloadUrl = `${API_PREFIX}/${path}`;
  // Local mode: size is unknown and irrelevant, keep the old placeholder value.
  const contentSize = DEBUG_FETCH ? 1 : await getRemoteFileSize(downloadUrl);

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

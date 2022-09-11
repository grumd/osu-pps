/* eslint-disable no-restricted-globals */
import type { Mode } from '@/constants/modes';

import type { ModToggleState } from '../../components/ModToggle';
import type { Beatmap, Filters } from '../../types';

// Specialized equality function for performance
const isEqualMaps = (x: Beatmap[], y: Beatmap[]): boolean => {
  return (
    x.length === y.length &&
    x.every((it, i) => {
      return x[i].beatmapId === y[i].beatmapId;
    })
  );
};

// Normal deep equals
const deepEqual = (x: unknown, y: unknown): boolean => {
  return x && y && typeof x === 'object' && typeof y === 'object'
    ? Object.keys(x).length === Object.keys(y).length &&
        Object.keys(x).every((key) =>
          deepEqual((x as Record<string, unknown>)[key], (y as Record<string, unknown>)[key])
        )
    : x === y;
};

const state: {
  maps?: Beatmap[];
  mode?: Mode;
  filters?: Filters;
} = {};

const getMods = (map: Beatmap) => ({
  dt: (map.mods & 64) === 64,
  hd: (map.mods & 8) === 8,
  hr: (map.mods & 16) === 16,
  fl: (map.mods & 1024) === 1024,
  ht: (map.mods & 256) === 256,
});

const matchesMaxMin = (
  min: number | null | undefined,
  max: number | null | undefined,
  value: number
): boolean => (!min || value >= min) && (!max || value <= max);

function modAllowed(selectValue: ModToggleState, hasMod: boolean) {
  return (
    (selectValue !== 'yes' && selectValue !== 'no') ||
    (selectValue === 'yes' && hasMod) ||
    (selectValue === 'no' && !hasMod)
  );
}

function filter() {
  const { maps, filters, mode } = state;

  if (!maps || !filters || !mode) {
    console.log('skip filtering');
    return [];
  }

  const {
    songName,
    calcMode,
    count,
    bpmMax,
    bpmMin,
    ppMax,
    ppMin,
    lengthMax,
    lengthMin,
    diffMax,
    diffMin,
    dt,
    hd,
    hr,
    fl,
    languages,
    genres,
    ranked,
    maniaKeys,
  } = filters;

  console.time('filter worker task');

  const filterFns: ((map: Beatmap, mods: ReturnType<typeof getMods>) => boolean)[] = [];

  if (songName) {
    const searchWords = songName?.toLowerCase().split(' ');
    filterFns.push((map) => {
      const name = map.artist
        ? `${map.artist} - ${map.title} [${map.version}] ${map.mapsetId} ${map.beatmapId}`.toLowerCase()
        : `${map.mapsetId} ${map.beatmapId}`;

      return searchWords.every((word) => name.includes(word));
    });
  }

  if (bpmMax || bpmMin) {
    filterFns.push((map, mods) => {
      let realBpm = map.bpm;
      if (mods.dt) realBpm = map.bpm * 1.5;
      if (mods.ht) realBpm = map.bpm * 0.75;
      return matchesMaxMin(bpmMin, bpmMax, realBpm);
    });
  }

  if (ppMax || ppMin) {
    filterFns.push((map) => !!map.pp && matchesMaxMin(ppMin, ppMax, map.pp));
  }

  if (lengthMax || lengthMin) {
    filterFns.push((map) => matchesMaxMin(lengthMin, lengthMax, map.length));
  }

  if (diffMax || diffMin) {
    filterFns.push((map) => matchesMaxMin(diffMin, diffMax, map.difficulty));
  }

  if (mode === 'mania' && maniaKeys && maniaKeys !== 'any') {
    filterFns.push((map) => maniaKeys === map.maniaKeys);
  }
  if (dt && dt !== 'any') {
    filterFns.push((map, mods) => modAllowed(dt, mods.dt) && (dt !== 'invert' || mods.ht));
  }
  if (hd && hd !== 'any') {
    filterFns.push((map, mods) => modAllowed(hd, mods.hd));
  }
  if (hr && hr !== 'any') {
    filterFns.push((map, mods) => modAllowed(hr, mods.hr));
  }
  if (fl && fl !== 'any') {
    filterFns.push((map, mods) => modAllowed(fl, mods.fl));
  }

  if (languages && languages.length) {
    filterFns.push((map) => languages.some((v) => v.value === map.language));
  }
  if (genres && genres.length) {
    filterFns.push((map) => genres.some((v) => v.value === map.genre));
  }
  if (ranked && ranked.value > 0) {
    const hoursNow = Date.now() / 1000 / 60 / 60;
    filterFns.push((map) => {
      return (hoursNow - map.approvedHoursTimestamp) / 24 < ranked.value;
    });
  }

  const filtered = filterFns.length
    ? maps.filter((map) => {
        const mods = getMods(map);
        return filterFns.every((fn) => fn(map, mods));
      })
    : maps.slice(); // Make a copy to prevent sorting array in-place

  const sorted = calcMode
    ? filtered.sort((a, b) => b.farmValues[calcMode] - a.farmValues[calcMode])
    : filtered;

  const truncated = sorted.slice(0, count ?? 20);

  console.timeEnd('filter worker task');

  return truncated;
}

self.onmessage = (
  e:
    | MessageEvent<['maps', Beatmap[]]>
    | MessageEvent<['filters', Filters]>
    | MessageEvent<['mode', Mode]>
) => {
  const [type, data] = e.data;

  if (type === 'mode') {
    state.mode = data;
    return; // Do not filter data here, just update the state
  }

  if (type === 'maps' && !isEqualMaps(state.maps || [], data)) {
    console.log('maps are new');
    state.maps = data;
    self.postMessage(filter());
  } else if (type === 'filters' && !deepEqual(state.filters, data)) {
    console.log('filters are new');
    state.filters = data;
    self.postMessage(filter());
  }
};

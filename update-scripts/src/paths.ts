import path from 'node:path';

import { PACKAGE_ROOT } from './config.ts';
import type { Mode } from './modes.ts';

/** The published data folder. */
export const DATA_ROOT = process.env.OSU_PPS_DATA_DIR ?? path.resolve(PACKAGE_ROOT, '..', 'data');
/** Local working files, gitignored. */
const TEMP_ROOT = process.env.OSU_PPS_TEMP_DIR ?? path.join(PACKAGE_ROOT, 'temp');

const temp = (mode: Mode, fileName: string) => path.join(TEMP_ROOT, mode.text, fileName);
const data = (category: string, mode: Mode, ...fileName: string[]) =>
  path.join(DATA_ROOT, category, mode.text, ...fileName);

export const files = {
  // static inputs
  countriesList: (mode: Mode) => path.join(PACKAGE_ROOT, `countries-${mode.text}.json`),

  // temp working files
  userIdsDate: (mode: Mode) => temp(mode, 'user-ids-date.json'),
  userIdsList: (mode: Mode) => temp(mode, 'user-ids.json'),
  userScoresList: (mode: Mode) => temp(mode, 'user-scores.json'),
  userScoresDates: (mode: Mode) => temp(mode, 'user-scores-dates.json'),
  mapInfoCache: (mode: Mode) => temp(mode, 'map-cache.json'),
  mapsList: (mode: Mode) => temp(mode, 'maps.json'),
  mapsDetailedList: (mode: Mode) => temp(mode, 'maps-detailed.json'),
  ppBlocks: (mode: Mode) => temp(mode, 'pp-blocks.json'),
  rankingsFull: (mode: Mode) => temp(mode, 'data-rankings-full.json'),
  mappersPlaycountTxt: (mode: Mode) => temp(mode, 'mappers-playcount.txt'),
  mappersFavsTxt: (mode: Mode) => temp(mode, 'mappers-favs.txt'),

  // published data files
  mapsetsCsv: (mode: Mode) => data('maps', mode, 'mapsets.csv'),
  diffsCsv: (mode: Mode) => data('maps', mode, 'diffs.csv'),
  /** Sharded by map+mods id — see utils/shards.ts */
  beatmapScoresDir: (mode: Mode) => data('maps', mode, 'maps-scores'),
  ppMappers: (mode: Mode) => data('mappers', mode, 'pp-mappers.json'),
  favoredMappers: (mode: Mode) => data('mappers', mode, 'favored-mappers.json'),
  /** Sharded by mapper id — see utils/shards.ts */
  favoredMappersMapsDir: (mode: Mode) => data('mappers', mode, 'favored-mappers-maps'),
  rankingsCompressed: (mode: Mode) => data('ranking', mode, 'compressed.json'),
  rankingsMapInfos: (mode: Mode) => data('ranking', mode, 'map-infos.json'),
  rankingsCsv: (mode: Mode) => data('ranking', mode, 'players.csv'),
  /** Sharded by player id — see utils/shards.ts */
  rankingsPlayerScoresDir: (mode: Mode) => data('ranking', mode, 'player-scores'),
  metadata: (mode: Mode) => data('metadata', mode, 'metadata.json'),
};

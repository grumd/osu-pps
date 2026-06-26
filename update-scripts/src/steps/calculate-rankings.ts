import Papa from 'papaparse';

import type { Mode } from '../modes.ts';
import { files } from '../paths.ts';
import type {
  DetailedMapRecord,
  UserListEntry,
  UserScoreDatesFile,
  UserScoresFile,
} from '../data/types.ts';
import { readJson, writeFile, writeJson } from '../utils/io.ts';
import { simplifyMods, trimModsToDtHt } from '../utils/mods.ts';

/** Maps with overweightness above this are counted towards the average. */
const MIN_RELEVANT_OVERWEIGHTNESS = 0.00005;
/** Penalty scale for scores on overweighted maps. */
const OVERWEIGHTED_PENALTY = 0.2;
/** Bonus scale for scores on underweighted maps. */
const UNDERWEIGHTED_BONUS = 0.125;
/** Standard osu! total-pp weighting. */
const PP_WEIGHT_DECAY = 0.95;
/** Only this many top scores are kept in the legacy compressed rankings file. */
const COMPRESSED_SCORES_LIMIT = 50;

/** Overweightness: farmability normalized by player-base size at the map's level and map age. */
const overweightness = (x: number, adj: number, hours: number) =>
  x / Math.pow(adj || 1, 0.65) / Math.pow(hours || 1, 0.35);

interface RecalculatedScore {
  /** "Artist - Title [Version]" */
  name: string;
  /** full legacy mods bitmask as a string (the UI expects a string here) */
  mods: string;
  beatmapId: number;
  ppOld: number;
  ppNew: number;
}

interface PlayerRanking {
  name: string;
  id: number;
  /** total pp from the official rankings */
  ppOld: number;
  /** recalculated total pp */
  ppNew: number;
  /** sum of per-score pp changes */
  ppDiff: number;
  /** when the player's scores were fetched, in unix minutes */
  minuteUpdated: number | undefined;
  scores: RecalculatedScore[];
}

/**
 * Step 4: recalculates every player's pp with a penalty for scores set on overweighted
 * ("farmy") maps, and writes the adjusted player rankings.
 */
export async function calculateRankings(mode: Mode): Promise<void> {
  console.log(`4. CALCULATING RANKINGS - ${mode.text}`);

  const players = await readJson<UserListEntry[]>(files.userIdsList(mode));
  players.sort((a, b) => b.pp - a.pp);
  const scoresPerUser = await readJson<UserScoresFile>(files.userScoresList(mode));
  const updateDatePerUser = await readJson<UserScoreDatesFile>(files.userScoresDates(mode));
  const mapsData = await readJson<DetailedMapRecord[]>(files.mapsDetailedList(mode));

  console.log('Calculating overweightness for every map');
  let maxOW = 0;
  let owSum = 0;
  let owCount = 0;
  const mapsWithOW = mapsData.map((map) => {
    const ow = overweightness(map.x, map.adj, map.h);
    maxOW = Math.max(maxOW, ow);
    if (ow > MIN_RELEVANT_OVERWEIGHTNESS) {
      owSum += ow;
      owCount++;
    }
    return { ...map, ow };
  });
  const averageOW = owSum / owCount;
  console.log('Max OW:', maxOW, 'Avg OW:', averageOW);

  console.log('Creating a maps dictionary');
  const mapsPerBeatmapId = new Map<number, (DetailedMapRecord & { ow: number })[]>();
  for (const map of mapsWithOW) {
    const list = mapsPerBeatmapId.get(map.b);
    if (list) {
      list.push(map);
    } else {
      mapsPerBeatmapId.set(map.b, [map]);
    }
  }

  const recalculateScore = (scoreString: string, playerName: string): RecalculatedScore => {
    // score strings are "<beatmapId>_<modsBitmask>_<pp>"
    const [beatmapIdRaw = '', modsRaw = '', ppRaw = ''] = scoreString.split('_');
    const beatmapId = Number(beatmapIdRaw);
    const mods = Number(modsRaw);
    const pp = Number(ppRaw);

    const mapsOfBeatmap = mapsPerBeatmapId.get(beatmapId);
    if (!mapsOfBeatmap || mapsOfBeatmap.length === 0) {
      console.log(`${playerName} - not found any maps - ${scoreString}`);
      return {
        name: String(beatmapId),
        mods: modsRaw,
        beatmapId,
        ppOld: Math.round(pp),
        ppNew: Math.round(pp),
      };
    }

    // The score's "effective" overweightness blends the exact mod combination played (3x),
    // the most overweighted mod combination, and the base (nomod/DT) version of the map.
    const thisMap = mapsOfBeatmap.find((map) => map.m === simplifyMods(mods, mode.id));
    const thisMapOW = thisMap ? thisMap.ow : 0;
    const maxOWOfBeatmap = Math.max(...mapsOfBeatmap.map((map) => map.ow), 0);
    const baseModsOW = mapsOfBeatmap
      .filter((map) => map.m === trimModsToDtHt(mods))
      .reduce((max, map) => Math.max(max, map.ow), 0);
    const effectiveOW = (maxOWOfBeatmap + baseModsOW + 3 * thisMapOW) / 5;

    const isOverweighted = effectiveOW > averageOW;
    const adjustment = isOverweighted
      ? OVERWEIGHTED_PENALTY * Math.sqrt((effectiveOW - averageOW) / (maxOW - averageOW))
      : UNDERWEIGHTED_BONUS * (Math.sqrt(effectiveOW / averageOW) - 1);
    const adjustedPp = pp * (1 - adjustment);

    const firstMap = mapsOfBeatmap[0]!;
    return {
      name: `${firstMap.art} - ${firstMap.t} [${firstMap.v}]`,
      mods: modsRaw,
      beatmapId,
      ppOld: Math.round(pp),
      ppNew: Math.round(adjustedPp),
    };
  };

  const recalculatePlayer = (player: UserListEntry): PlayerRanking | null => {
    const scoreStrings = scoresPerUser[player.id];
    if (!scoreStrings || scoreStrings.length === 0) return null;

    const scores = scoreStrings
      .map((scoreString) => recalculateScore(scoreString, player.name))
      .sort((a, b) => b.ppNew - a.ppNew);

    const ppDiff = scores.reduce((sum, score) => sum + score.ppNew - score.ppOld, 0);
    const ppNew = scores.reduce(
      (sum, score, index) => sum + score.ppNew * Math.pow(PP_WEIGHT_DECAY, index),
      0
    );

    return {
      name: player.name,
      id: player.id,
      ppOld: player.pp,
      ppNew,
      ppDiff,
      minuteUpdated: updateDatePerUser[player.id],
      scores,
    };
  };

  const rankings = players
    .map(recalculatePlayer)
    .filter((player): player is PlayerRanking => player !== null);

  console.log('Writing temp rankings data');
  await writeJson(files.rankingsFull(mode), rankings);

  console.log('Writing player rankings and per-player scores');
  const csvRows = [];
  for (const player of rankings) {
    csvRows.push({
      id: player.id,
      name: player.name,
      ppOld: player.ppOld,
      ppNew: player.ppNew.toFixed(2),
      ppDiff: player.ppDiff,
      minuteUpdated: player.minuteUpdated,
    });

    await writeJson(
      files.rankingsPlayerScores(mode, player.id),
      player.scores.map((score) => ({
        title: score.name,
        mods: score.mods,
        beatmapId: score.beatmapId,
        ppOld: score.ppOld,
        ppNew: score.ppNew,
      }))
    );
  }
  csvRows.sort((a, b) => Number(b.ppNew) - Number(a.ppNew));
  writeFile(files.rankingsCsv(mode), Papa.unparse(csvRows));

  // Legacy compressed format — not used by the current UI, kept for compatibility
  const mapInfoStrings: string[] = [];
  const mapInfoIndexes = new Map<string, number>();
  const compressed = rankings.map((player) => {
    const scores = player.scores.slice(0, COMPRESSED_SCORES_LIMIT).map((score) => {
      const text = `${score.beatmapId} ${score.name}`;
      let index = mapInfoIndexes.get(text);
      if (index === undefined) {
        index = mapInfoStrings.push(text) - 1;
        mapInfoIndexes.set(text, index);
      }
      return `${index}_${score.mods}_${score.ppOld}_${score.ppNew}`;
    });
    return [player.name, player.minuteUpdated, player.ppDiff, scores];
  });
  await writeJson(files.rankingsCompressed(mode), compressed);
  await writeJson(files.rankingsMapInfos(mode), mapInfoStrings);

  console.log('Finished calculating rankings!');
}

import Papa from 'papaparse';

import type { Mode } from '../modes.ts';
import { files } from '../paths.ts';
import type { DetailedMapRecord } from '../data/types.ts';
import { readJson, writeFile, writeJson } from '../utils/io.ts';
import { uniqBy } from '../utils/misc.ts';

/**
 * Step 6: exports the detailed map list as the two CSV files the UI loads on the maps page,
 * and stamps the metadata file with the update time.
 */
export async function exportFrontendData(mode: Mode): Promise<void> {
  console.log(`5. EXPORTING FRONTEND DATA - ${mode.text}`);

  const mapsData = await readJson<DetailedMapRecord[]>(files.mapsDetailedList(mode));

  console.log('Compressing maps data to csv');
  const mapsets = uniqBy(
    mapsData.map((map) => ({ art: map.art, t: map.t, bpm: map.bpm, s: map.s })),
    (mapset) => mapset.s
  );
  const diffs = mapsData.map((map) => ({
    m: map.m,
    b: map.b,
    x: map.x,
    pp99: map.pp99,
    adj: map.adj,
    v: map.v,
    s: map.s,
    l: map.l,
    d: map.d,
    p: map.p,
    h: map.h,
    appr_h: map.appr_h,
    ar: map.ar,
    accuracy: map.accuracy,
    cs: map.cs,
    drain: map.drain,
  }));

  writeFile(files.mapsetsCsv(mode), Papa.unparse(mapsets));
  writeFile(files.diffsCsv(mode), Papa.unparse(diffs));

  console.log('Creating metadata');
  await writeJson(files.metadata(mode), { lastUpdated: new Date() });

  console.log('Finished organizing data');
}

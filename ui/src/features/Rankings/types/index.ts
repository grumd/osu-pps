export interface Ranking {
  id: number;
  name: string;
  ppOld: number;
  ppNew: number;
  ppDiff: number;
  minuteUpdated: number;
}

export interface DataItem extends Ranking {
  place: number;
  placeOld: number;
}

export interface Score {
  title: string;
  mods: string;
  beatmapId: number;
  ppOld: number;
  ppNew: number;
}

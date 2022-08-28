export interface PpMapperMap {
  id: number;
  m: number;
  ow: number;
  pp: number;
  text: string;
}

export interface PpMapper {
  id: number;
  name: string;
  points: number;
  mapsRecorded: PpMapperMap[];
}

export interface PpMappersBody {
  top20: PpMapper[];
  top20adj: PpMapper[];
  top20age: PpMapper[];
}

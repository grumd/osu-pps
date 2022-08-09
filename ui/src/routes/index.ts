import { route } from 'typesafe-routes';

import { Mode } from '@/constants/modes';

import { mappers } from './mappers';
import { maps } from './maps';
import { rankings } from './rankings';

export const faq = route('faq', {}, {});

const modeParser = {
  parse: (param: string): Mode =>
    Object.values<string>(Mode).includes(param) ? (param as Mode) : Mode.osu,
  serialize: (mode: Mode) => mode,
};

export const mode = route(
  ':mode',
  { mode: modeParser },
  {
    maps,
    mappers,
    rankings,
  }
);

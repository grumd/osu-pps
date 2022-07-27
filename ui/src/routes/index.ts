import { route, stringParser } from 'typesafe-routes';

import { maps } from './maps';
import { mappers } from './mappers';
import { rankings } from './rankings';

import { Mode } from 'constants/modes';

export const faq = route('faq', {}, {});

const modeParser = {
  parse: (param: string): Mode => {
    return Object.values<string>(Mode).includes(param) ? (param as Mode) : Mode.osu;
  },
  serialize: (mode: Mode) => {
    return mode;
  },
};

export const mode = route(
  ':mode',
  { mode: modeParser },
  {
    maps,
    mappers,
    rankings,
  },
);

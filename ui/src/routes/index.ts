import { route, stringParser } from 'typesafe-routes';

import { maps } from './maps';
import { mappers } from './mappers';
import { rankings } from './rankings';

export const faq = route('faq', {}, {});

export const mode = route(
  ':mode',
  { mode: stringParser },
  {
    maps,
    mappers,
    rankings,
  },
);

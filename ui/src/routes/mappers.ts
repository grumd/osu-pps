import { route } from 'typesafe-routes';

export const pp = route('pp', {}, {});
export const fav = route('fav', {}, {});
export const mappers = route('mappers', {}, { pp, fav });

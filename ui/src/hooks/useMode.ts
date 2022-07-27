import { useRouteParams } from 'typesafe-routes';

import { Mode } from 'constants/modes';

import { mode } from 'routes';

export const useMode = (): Mode => {
  const params = useRouteParams(mode);
  return params.mode;
};

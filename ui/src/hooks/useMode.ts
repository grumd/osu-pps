import { useRouteParams } from 'typesafe-routes/react-router';

import type { Mode } from '@/constants/modes';
import { mode } from '@/routes';

export const useMode = (): Mode => {
  const params = useRouteParams(mode);
  return params.mode;
};

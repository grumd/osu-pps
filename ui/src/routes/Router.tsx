import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Mode } from '@/constants/modes';
import { Faq } from '@/features/Faq';
import { Mappers } from '@/features/Mappers';
import { MappersFav } from '@/features/Mappers/FavMappers';
import { MappersPp } from '@/features/Mappers/PpMappers';
import { Maps } from '@/features/Maps';
import { Rankings } from '@/features/Rankings';
import { RootLayout } from '@/features/RootLayout';
import { faq, mode } from '@/routes';
import { fav, mappers, pp } from '@/routes/mappers';
import { maps } from '@/routes/maps';
import { rankings } from '@/routes/rankings';

export const Router = () => {
  // Routes can be extracted to the features folder and nested as needed
  // Our app is not big enough for that, it's better to keep the routes all in one place
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Navigate to={mode({ mode: Mode.osu }).$} replace />} />
          <Route path={faq.template} element={<Faq />} />
          <Route path={mode.template}>
            <Route index element={<Navigate to={`./${maps({}).$}`} replace />} />
            <Route path={maps.template} element={<Maps />} />
            <Route path={rankings.template} element={<Rankings />} />
            <Route path={mappers.template} element={<Mappers />}>
              <Route index element={<Navigate to={`./${pp({}).$}`} replace />} />
              <Route path={pp.template} element={<MappersPp />} />
              <Route path={fav.template} element={<MappersFav />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

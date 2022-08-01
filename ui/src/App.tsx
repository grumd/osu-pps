import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Mode } from '@/constants/modes';
import { RootLayout } from '@/features/RootLayout';
import { Faq } from '@/features/faq/Faq';
import { MappersFav } from '@/features/mappers/favs/MappersFav';
import { MappersPp } from '@/features/mappers/pp/MappersPp';
import { Maps } from '@/features/maps';
import { Rankings } from '@/features/rankings/Rankings';
import { faq, mode } from '@/routes';
import { fav, mappers, pp } from '@/routes/mappers';
import { maps } from '@/routes/maps';
import { rankings } from '@/routes/rankings';
import { globalStyles } from '@/styles/global';

const queryClient = new QueryClient();

function App() {
  globalStyles();
  // Routes can be extracted to the features folder and nested as needed
  // Our app is not big enough for that, it's better to keep the routes all in one place
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Navigate to={mode({ mode: Mode.osu }).$} replace />} />
            <Route path={faq.template} element={<Faq />} />
            <Route path={mode.template}>
              <Route index element={<Navigate to={`./${maps({}).$}`} replace />} />
              <Route path={maps.template} element={<Maps />} />
              <Route path={rankings.template} element={<Rankings />} />
              <Route path={mappers.template}>
                <Route path={pp.template} element={<MappersPp />} />
                <Route path={fav.template} element={<MappersFav />} />
                <Route index element={<Navigate to={`./${pp({}).$}`} replace />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

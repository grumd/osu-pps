import { useCallback, useMemo, useState } from 'react';

import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import {
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/components/Scroll/Scroll';
import { space, styled } from '@/styles';

import { useCalcMode } from '../hooks/useCalcMode';
import { useLoadingProgress, useMaps } from '../hooks/useMaps';
import { BeatmapCard } from './BeatmapCard';
import { Filters } from './Filters';
import { ProgressBar } from './ProgressBar';

const LoadingBar = () => {
  const { progress } = useLoadingProgress();
  if (progress === null) {
    return null;
  }
  return <ProgressBar progress={progress} />;
};

const StyledMain = styled('main', {
  flex: '1 1 0px',
  display: 'flex',
  flexFlow: 'column nowrap',

  '& > footer': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[75],
  },
});

export const Maps = () => {
  const { isLoading, error, data } = useMaps();
  const calcMode = useCalcMode();
  const [count, setCount] = useState(20);

  const visibleMaps = useMemo(() => {
    return data?.sort((a, b) => b.farmValues[calcMode] - a.farmValues[calcMode]).slice(0, count);
  }, [count, data]);

  const onScroll = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    console.log(event);
    if (
      event.target instanceof Element &&
      Math.abs(event.target.scrollTop + event.target.clientHeight - event.target.scrollHeight) < 2
    ) {
      setCount((c) => c + 20);
    }
  }, []);

  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      <header>
        <Filters />
      </header>
      <ScrollArea
        css={{ flex: '1 1 0px', display: 'flex', flexFlow: 'column nowrap', alignItems: 'center' }}
      >
        <ScrollAreaScrollbar orientation="vertical">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
        <ScrollAreaCorner />
        <ScrollAreaViewport onScroll={onScroll}>
          {isLoading && <LoadingBar />}
          {!isLoading &&
            visibleMaps?.map((map) => {
              return <BeatmapCard key={`${map.beatmapId}_${map.mods}`} map={map} />;
            })}
        </ScrollAreaViewport>
      </ScrollArea>
    </StyledMain>
  );
};

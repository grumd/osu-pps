import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar';
import {
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/components/Scroll/Scroll';
import { space, styled } from '@/styles';

import { RankingsTable } from './components/RankingsTable';
import { useRankings } from './hooks/useRankings';

const StyledMain = styled('main', {
  flex: '1 1 0px',
  display: 'flex',
  flexFlow: 'column nowrap',

  '& > footer': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
  },
});

export function Rankings() {
  const { isLoading, error, data, progress } = useRankings();
  console.log(data, isLoading);
  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      <header>{isLoading && progress !== null && <ProgressBar progress={progress} />}</header>
      <ScrollArea
        css={{
          flex: '1 1 0px',
          display: 'flex',
          flexFlow: 'column nowrap',
          alignItems: 'center',
        }}
      >
        <ScrollAreaViewport>{data && <RankingsTable rankings={data} />}</ScrollAreaViewport>
        <ScrollAreaScrollbar orientation="vertical">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
        <ScrollAreaCorner />
      </ScrollArea>
    </StyledMain>
  );
}

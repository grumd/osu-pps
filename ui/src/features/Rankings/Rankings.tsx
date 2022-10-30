import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar';
import { ScrollArea } from '@/components/Scroll/Scroll';
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

  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      <header>
        {isLoading && progress !== null && (
          <ProgressBar css={{ margin: '0 auto' }} progress={progress} />
        )}
      </header>
      <ScrollArea
        css={{
          flex: '1 1 0px',
          display: 'flex',
          flexFlow: 'column nowrap',
          alignItems: 'center',
        }}
      >
        {data && <RankingsTable rankings={data} />}
      </ScrollArea>
    </StyledMain>
  );
}

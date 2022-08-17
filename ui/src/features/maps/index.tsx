import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar';
import { space, styled } from '@/styles';

import { Filters } from './components/Filters';
import { ScrolledFilteredMaps } from './components/ScrolledFilteredMaps';
import { useMaps } from './hooks/useMaps';

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

export function Maps() {
  const { isLoading, error, data, progress } = useMaps();

  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      <header>
        {isLoading && progress !== null && <ProgressBar progress={progress} />}
        {!isLoading && <Filters />}
      </header>
      {!isLoading && <ScrolledFilteredMaps maps={data} />}
    </StyledMain>
  );
}

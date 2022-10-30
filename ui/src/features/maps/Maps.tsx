import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import Loader from '@/components/Loader/Loader';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar';
import { space, styled } from '@/styles';

import { Filters } from './components/Filters';
import { ScrolledFilteredMaps } from './components/ScrolledFilteredMaps';
import { useMaps } from './hooks/useMaps';

const StyledMain = styled('main', {
  flex: '1 1 auto',
  display: 'flex',
  flexFlow: 'column nowrap',

  '& > header': {
    alignSelf: 'center',
    width: space.pageMaxWidth,
    maxWidth: '100%',
  },
});

export function Maps() {
  const { isLoading, error, data, progress } = useMaps();

  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      <header>
        {isLoading && progress === null && <Loader />}
        {isLoading && progress !== null && (
          <>
            <ProgressBar progress={progress} />
            <p>{`Loading all the maps is going to take a minute, but we'll save the data in your browser so it's faster next time`}</p>
          </>
        )}
        {!isLoading && <Filters />}
      </header>
      {!isLoading && <ScrolledFilteredMaps maps={data} />}
    </StyledMain>
  );
}

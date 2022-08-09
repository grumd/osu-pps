import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import { space, styled } from '@/styles';

import { useLoadingProgress, useMaps } from '../hooks/useMaps';
import { Filters } from './Filters';
import { ProgressBar } from './ProgressBar';
import { ScrolledFilteredMaps } from './ScrolledFilteredMaps';

function LoadingBar() {
  const progress = useLoadingProgress((state) => state.progress);
  if (progress === null) {
    return null;
  }
  return <ProgressBar progress={progress} />;
}

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
  const { isLoading, error, data } = useMaps();

  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      <header>
        {isLoading && <LoadingBar />}
        {!isLoading && <Filters />}
      </header>
      {!isLoading && <ScrolledFilteredMaps maps={data} />}
    </StyledMain>
  );
}

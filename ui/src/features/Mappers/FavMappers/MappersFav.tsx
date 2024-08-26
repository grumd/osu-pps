import { matchSorter } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import { Input } from '@/components/Input/Input';
import Loader from '@/components/Loader/Loader';
import { ScrollArea } from '@/components/Scroll/Scroll';
import { MappersTableExpandable } from '@/features/Mappers/components/MappersTableExpandable/MappersTableExpandable';
import type { MapperItem } from '@/features/Mappers/components/MappersTableExpandable/types';
import { space, styled } from '@/styles';

import { FavMapperExpandableRow } from './components/FavMapperExpandableRow';
import { useFavMappers } from './hooks/useFavMappers';

const StyledMain = styled('main', {
  flex: '1 1 auto',
  display: 'flex',
  flexFlow: 'column nowrap',
});

const FilterContainer = styled('div', {
  alignSelf: 'center',
  padding: space.md,
  width: space.tableMaxWidth,
  maxWidth: '100%',
  margin: '0 auto',
});

const initialCount = 50;

export function MappersFav() {
  const { data, isLoading, error } = useFavMappers();
  const [showCount, setShowCount] = useState(1);
  const [filter, setFilter] = useState('');
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);

  const maxValue = data?.[0] ? data[0].value : 0;

  const filteredMappers = useMemo(() => {
    if (filter && data) {
      return matchSorter(data, filter, {
        keys: ['namesString'],
        baseSort: (a, b) => a.index - b.index, // prioritize higher ranking mappers in the search
      });
    }
    return data;
  }, [data, filter]);

  const renderExpandedRow = useCallback(({ mapper }: { mapper: MapperItem }) => {
    return <FavMapperExpandableRow mapper={mapper} />;
  }, []);

  const loadMore = useCallback(() => {
    if (filteredMappers && filteredMappers.length > showCount)
      setShowCount((c) => c + initialCount);
  }, [filteredMappers, showCount]);

  const visibleMappers = useMemo(() => {
    return filteredMappers?.slice(0, showCount);
  }, [showCount, filteredMappers]);

  useEffect(() => {
    // Reset pagination when data changes or filtering changes
    setShowCount(initialCount);
  }, [data, filter]);

  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      {isLoading && <Loader css={{ padding: `${space.md} 0` }} />}
      {visibleMappers && (
        <>
          <FilterContainer>
            <Input placeholder="search names..." type="text" onChange={setFilter} value={filter} />
          </FilterContainer>
          <ScrollArea css={{ flex: '1 1 0px' }} ref={setScrollParent}>
            {visibleMappers.length ? (
              <MappersTableExpandable
                mappers={visibleMappers}
                scrollParent={scrollParent ?? undefined}
                loadMore={loadMore}
                maxValue={maxValue}
                renderExpandedRow={renderExpandedRow}
              />
            ) : (
              `Didn't find a mapper with this name :(`
            )}
          </ScrollArea>
        </>
      )}
    </StyledMain>
  );
}

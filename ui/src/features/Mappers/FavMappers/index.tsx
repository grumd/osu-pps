import { matchSorter } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';

import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import { Input } from '@/components/Input/Input';
import Loader from '@/components/Loader/Loader';
import {
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/components/Scroll/Scroll';
import { space, styled } from '@/styles';

import { MapperMaps } from './components/MapperMaps';
import { Cells, Row } from './components/MapperRow';
import { useFavMappers } from './hooks/useFavMappers';

const StyledMain = styled('main', {
  flex: '1 1 auto',
  display: 'flex',
  flexFlow: 'column nowrap',
  alignItems: 'center',
});

const FilterContainer = styled('div', {
  padding: space.md,
  width: '100%',
});

const Table = styled('table', {
  borderCollapse: 'collapse',
  width: '100%',
  maxWidth: space.tableMaxWidth,
});

const initialCount = 50;

export function MappersFav() {
  const { data, isLoading, error } = useFavMappers();
  const [showCount, setShowCount] = useState(1);
  const [filter, setFilter] = useState('');
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const maxCount = data ? data[0].count : 0;

  const onToggleMapper = useCallback((mapperId: number) => {
    setExpanded((exp) => ({ ...exp, [mapperId]: !exp[mapperId] }));
  }, []);

  const filteredMappers = useMemo(() => {
    let filtered = data || [];
    if (filter && data) {
      filtered = matchSorter(data, filter, {
        keys: ['namesString'],
        baseSort: (a, b) => a.index - b.index, // prioritize higher ranking mappers in the search
      });
    }
    return filtered;
  }, [data, filter]);

  const loadMore = useCallback(() => {
    if (filteredMappers.length > showCount) setShowCount((c) => c + initialCount);
  }, [filteredMappers, showCount]);

  const visibleMappers = useMemo(() => {
    return filteredMappers?.slice(0, showCount);
  }, [showCount, filteredMappers]);

  const mappersWithMaps = useMemo(() => {
    return visibleMappers?.reduce(
      (acc: ({ isMapsRow?: boolean } & typeof filteredMappers[number])[], mapper) => {
        acc.push(mapper);
        if (expanded[mapper.mapperId]) {
          acc.push({ ...mapper, isMapsRow: true });
        }
        return acc;
      },
      []
    );
  }, [visibleMappers, expanded]);

  useEffect(() => {
    // Reset page when data changes or filtering changes
    setShowCount(initialCount);
  }, [data, filter]);

  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      {isLoading && <Loader css={{ padding: `${space.md} 0` }} />}
      {mappersWithMaps && (
        <>
          <ScrollArea css={{ flex: '1 1 0px', width: '100%', maxWidth: space.tableMaxWidth }}>
            <FilterContainer>
              <Input
                placeholder="search names..."
                type="text"
                onChange={setFilter}
                value={filter}
              />
            </FilterContainer>
            <ScrollAreaViewport ref={setScrollParent}>
              <TableVirtuoso
                style={{ width: '100%' }}
                data={mappersWithMaps}
                endReached={loadMore}
                overscan={1000}
                components={{ TableRow: Row, Table }}
                itemContent={(i, mapper) =>
                  mapper.isMapsRow ? (
                    <td colSpan={3}>
                      <MapperMaps mapper={mapper} />
                    </td>
                  ) : (
                    <Cells
                      isExpanded={expanded[mapper.mapperId]}
                      key={mapper.mapperId}
                      onToggleMapper={onToggleMapper}
                      mapper={mapper}
                      place={mapper.place}
                      maxCount={maxCount}
                    />
                  )
                }
                customScrollParent={scrollParent ?? undefined}
              />
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="vertical">
              <ScrollAreaThumb />
            </ScrollAreaScrollbar>
            <ScrollAreaCorner />
          </ScrollArea>
        </>
      )}
    </StyledMain>
  );
}

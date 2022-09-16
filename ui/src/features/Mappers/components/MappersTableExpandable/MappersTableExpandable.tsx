import { useCallback, useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';

import { colors, space, styled } from '@/styles';

import { Cells } from './MapperRow';
import type { MapperItem } from './types';

const Table = styled('table', {
  borderCollapse: 'collapse',
  width: space.tableMaxWidth,
  maxWidth: '100%',
  margin: '0 auto',
});

const TableRow = styled('tr', {
  width: '100%',
  borderBottom: `${space.borderWidth} solid ${colors.border}`,
});

interface MappersTableExpandableProps<Item extends MapperItem> {
  mappers: Item[];
  maxValue: number;
  loadMore?: () => void;
  scrollParent?: HTMLElement;
  renderExpandedRow: ({ mapper, index }: { mapper: Item; index: number }) => JSX.Element;
}

export const MappersTableExpandable = <Item extends MapperItem>({
  mappers,
  maxValue,
  loadMore,
  renderExpandedRow,
  scrollParent,
}: MappersTableExpandableProps<Item>) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const onToggleMapper = useCallback((id: number) => {
    setExpanded((exp) => ({ ...exp, [id]: !exp[id] }));
  }, []);

  const mappersWithExpanded = useMemo(() => {
    return mappers?.reduce(
      (acc: ({ isExpandRow?: boolean } & typeof mappers[number])[], mapper) => {
        acc.push(mapper);
        if (expanded[mapper.id]) {
          acc.push({ ...mapper, isExpandRow: true });
        }
        return acc;
      },
      []
    );
  }, [mappers, expanded]);

  return (
    <TableVirtuoso
      style={{ width: '100%' }}
      data={mappersWithExpanded}
      endReached={loadMore}
      overscan={1000}
      components={{ TableRow, Table }}
      itemContent={(i, mapper) =>
        mapper.isExpandRow ? (
          <td colSpan={3}>{renderExpandedRow({ mapper, index: i })}</td>
        ) : (
          <Cells
            isExpanded={expanded[mapper.id]}
            onToggleMapper={onToggleMapper}
            mapper={mapper}
            maxValue={maxValue}
          />
        )
      }
      customScrollParent={scrollParent}
    />
  );
};

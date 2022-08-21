import { matchSorter } from 'match-sorter';
import { useMemo, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { space, styled } from '@/styles';

import type { DataItem, Ranking } from '../types';
import { DataRow } from './DataRow';

const showPerPage = 20;

const TableWrapper = styled('div', {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const Table = styled('table', {
  maxWidth: space.tableMaxWidth,
  width: '100%',
  borderSpacing: `0 ${space.xs}`,
  borderCollapse: 'separate',
});

const Th = styled('th', {
  whiteSpace: 'nowrap',
});

const NameFilterInput = styled(Input, {
  fontWeight: 'normal',
  maxWidth: '20em',
  width: '95%',
});

const PagesControls = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: space.xs,

  '& > input': {
    width: '2em',
  },
});

export const RankingsTable = ({ rankings }: { rankings: Ranking[] }) => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  const mappedRankings = useMemo((): DataItem[] => {
    return rankings
      .sort((a, b) => b.ppOld - a.ppOld)
      .map((ranking, index) => ({ ...ranking, placeOld: index + 1 }))
      .sort((a, b) => b.ppNew - a.ppNew)
      .map((ranking, index) => ({ ...ranking, place: index + 1 }));
  }, [rankings]);

  const { data, pagesCount } = useMemo(() => {
    let filteredData = mappedRankings;
    if (filter) {
      filteredData = matchSorter(mappedRankings, filter, { keys: ['name'] });
    }
    return {
      data: filteredData.slice((page - 1) * showPerPage, page * showPerPage),
      pagesCount: Math.ceil(filteredData.length / showPerPage),
    };
  }, [mappedRankings, page, filter]);

  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th colSpan={2}>
              <PagesControls>
                <Button color="sand" iconButton onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <FaChevronLeft />
                </Button>
                <Input
                  type="number"
                  value={page}
                  onChange={(value) => setPage(Math.min(pagesCount, Math.max(1, value ?? 1)))}
                />
                <Button
                  color="sand"
                  iconButton
                  onClick={() => setPage((p) => Math.min(pagesCount, p + 1))}
                >
                  <FaChevronRight />
                </Button>
              </PagesControls>
            </Th>
            <Th css={{ textAlign: 'left' }}>
              <NameFilterInput placeholder="search names..." type="text" onChange={setFilter} />
            </Th>
            <Th>pp</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && filter ? (
            <tr>
              <td style={{ textAlign: 'center' }} colSpan={5}>
                {`Didn't find a user with this name :(`}
              </td>
            </tr>
          ) : null}
          {data.map((item) => {
            return <DataRow key={item.id} item={item} />;
          })}
        </tbody>
      </Table>
    </TableWrapper>
  );
};

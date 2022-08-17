import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

import { Button } from '@/components/Button/Button';
import { Link } from '@/components/Link/Link';
import { colors, fonts, space, styled } from '@/styles';

import type { DataItem } from '../types';
import { RankChange } from './RankChange';
import { Scores } from './Scores';

const HideShowScoresArrow = styled(FaChevronDown, {
  marginRight: space.sm,
  transition: 'transform 150ms ease-in-out',
  variants: {
    flipped: {
      true: {
        transform: 'scaleY(-1)',
      },
    },
  },
});

const Tr = styled('tr', {
  background: colors.bgElement,
  borderRadius: space.sm,

  '& > td:first-child': {
    borderTopLeftRadius: space.sm,
    borderBottomLeftRadius: space.sm,
  },

  '& > td:last-child': {
    borderTopRightRadius: space.sm,
    borderBottomRightRadius: space.sm,
  },
});

const Td = styled('td', {
  whiteSpace: 'nowrap',
  padding: `${space.xs} ${space.md}`,
});

export const DataRow = ({ item }: { item: DataItem }) => {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <>
      <Tr>
        <Td css={{ width: '4.8em' }}>#{item.place}</Td>
        <Td css={{ width: '4.8em' }}>
          <RankChange delta={item.placeOld - item.place} />
        </Td>
        <Td css={{ width: '55%' }}>
          <Link href={`https://osu.ppy.sh/users/${item.id}`}>{item.name}</Link>
        </Td>
        <Td css={{ textAlign: 'center', fontWeight: 'bold' }}>{Math.round(item.ppNew)}</Td>
        <Td
          css={{
            textAlign: 'right',
            width: '1em',
            fontSize: fonts[75],
            padding: space.xs,
          }}
        >
          <Button color="indigo" onClick={() => setExpanded((v) => !v)}>
            <HideShowScoresArrow flipped={isExpanded} /> scores
          </Button>
        </Td>
      </Tr>
      {isExpanded && (
        <Tr>
          <Td colSpan={5}>
            <Scores item={item} />
          </Td>
        </Tr>
      )}
    </>
  );
};

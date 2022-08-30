import { useState } from 'react';

import { Button } from '@/components/Button/Button';
import { FlipArrowIcon } from '@/components/FlipArrowIcon/FlipArrowIcon';
import { ExternalLink } from '@/components/Link/ExternalLink';
import { colors, fonts, space, styled } from '@/styles';

import type { DataItem } from '../types';
import { RankChange } from './RankChange';
import { Scores } from './Scores';

const HideShowScoresArrow = styled(FlipArrowIcon, {
  marginRight: space.sm,
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
          <ExternalLink url={`https://osu.ppy.sh/users/${item.id}`}>{item.name}</ExternalLink>
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

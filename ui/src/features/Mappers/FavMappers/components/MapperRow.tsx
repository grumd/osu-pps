import { memo } from 'react';
import { FaChevronDown } from 'react-icons/fa';

import { ExternalLink } from '@/components/Link/ExternalLink';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar';
import { colors, fonts, space, styled } from '@/styles';

import type { FavMapper } from '../types';

const AriaButton = styled('button', {
  all: 'unset',
  width: '100%',
  cursor: 'pointer',
  borderRadius: space.sm,

  '&:hover': {
    background: colors.sand4,
  },

  variants: {
    expanded: {
      true: {
        background: colors.sand4,
      },
    },
  },
});

const CountContainer = styled('div', {
  width: '100%',
  padding: `${space.xxs} ${space.sm}`,
  borderRadius: space.sm,
  display: 'flex',
  flexFlow: 'row nowrap',
  alignItems: 'center',
  gap: space.md,
});

const TdIndex = styled('td', {
  fontSize: fonts[75],
});

const TdMapperName = styled('td', {
  padding: space.xs,
  paddingRight: space.md,
});

const TdCount = styled('td', {
  width: '85%',
  fontWeight: 'bold',
  fontSize: fonts[150],
  padding: space.xxs,
  paddingRight: space.sm, // more space for the scrollbar
});

const MapperName = styled('div', {
  variants: {
    first: {
      true: {
        fontSize: fonts[125],
      },
      false: {
        fontSize: fonts[75],
      },
    },
  },
});

const ArrowIcon = styled(FaChevronDown, {
  transition: 'transform 150ms ease-in-out',
  variants: {
    flipped: {
      true: {
        transform: 'scaleY(-1)',
      },
    },
  },
});

const CountBar = styled(ProgressBar, {
  flex: '1 1 auto',
  borderRadius: space.xs,
  height: '1em',
  width: 'auto',
});

const Count = styled('div', {
  minWidth: '2em',
});

export const Row = styled('tr', {
  width: '100%',
  borderBottom: `${space.borderWidth} solid ${colors.border}`,
});

const MapperNames = ({ names }: { names: string[] }) => {
  return (
    <>
      {names.map((name, index) => (
        <MapperName key={index} first={index === 0}>
          {name}
        </MapperName>
      ))}
    </>
  );
};

const getProgressColor = (place: number) => {
  return (
    {
      [1]: 'gold',
      [2]: 'silver',
      [3]: colors.bronze.toString(),
    }[place] || 'grey'
  );
};

export const Cells = memo(function _Cells({
  mapper,
  place,
  maxCount,
  isExpanded,
  onToggleMapper,
}: {
  mapper: FavMapper;
  place: number;
  maxCount: number;
  onToggleMapper: (mapperId: number) => void;
  isExpanded: boolean;
}): JSX.Element {
  return (
    <>
      <TdIndex>{place}.</TdIndex>
      <TdMapperName>
        <ExternalLink url={`https://osu.ppy.sh/users/${mapper.mapperId}`}>
          <MapperNames names={mapper.names} />
        </ExternalLink>
      </TdMapperName>
      <TdCount>
        <AriaButton expanded={isExpanded} onClick={() => onToggleMapper(mapper.mapperId)}>
          <CountContainer>
            <Count>{Math.round(mapper.count)}</Count>
            <CountBar progress={mapper.count / maxCount} color={getProgressColor(place)} />
            <ArrowIcon flipped={isExpanded} />
          </CountContainer>
        </AriaButton>
      </TdCount>
    </>
  );
});

import { memo } from 'react';

import { FlipArrowIcon } from '@/components/FlipArrowIcon/FlipArrowIcon';
import { ExternalLink } from '@/components/Link/ExternalLink';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar';
import { colors, fonts, space, styled } from '@/styles';
import { getUserUrl } from '@/utils/externalLinks';

import type { MapperItem } from './types';

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
  justifyContent: 'flex-end',
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

const CountBar = styled(ProgressBar, {
  flex: '1 1 auto',
  borderRadius: space.xs,
  height: '1em',
  width: 'auto',
});

const Count = styled('div', {
  // Constant width to keep every row aligned, and allow for up to 5 digits to fit
  minWidth: '3em',
  textAlign: 'center',
});

const getProgressColor = (place: number) => {
  return (
    {
      [1]: 'gold',
      [2]: 'silver',
      [3]: colors.bronze.toString(),
    }[place] || 'grey'
  );
};

const MapperNames = ({ names }: { names: React.ReactNode[] }) => {
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

export const Cells = memo(function _Cells({
  mapper,
  maxValue,
  isExpanded,
  onToggleMapper,
}: {
  mapper: MapperItem;
  maxValue: number;
  onToggleMapper: (id: number) => void;
  isExpanded: boolean;
}): JSX.Element {
  return (
    <>
      <TdIndex>{mapper.place}.</TdIndex>
      <TdMapperName>
        <ExternalLink url={getUserUrl(mapper.id)}>
          <MapperNames names={mapper.names} />
        </ExternalLink>
      </TdMapperName>
      <TdCount>
        <AriaButton expanded={isExpanded} onClick={() => onToggleMapper(mapper.id)}>
          <CountContainer>
            <Count>{Math.round(mapper.value)}</Count>
            <CountBar progress={mapper.value / maxValue} color={getProgressColor(mapper.place)} />
            <FlipArrowIcon flipped={isExpanded} />
          </CountContainer>
        </AriaButton>
      </TdCount>
    </>
  );
});

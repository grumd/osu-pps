import { memo, useState } from 'react';
import { FaRegClock, FaStar } from 'react-icons/fa';
import { GiFarmer } from 'react-icons/gi';

import { Button } from '@/components/Button/Button';
import { FlipArrowIcon } from '@/components/FlipArrowIcon/FlipArrowIcon';
import { Input } from '@/components/Input/Input';
import { TimeInput } from '@/components/TimeInput/TimeInput';
import { fonts, space, styled } from '@/styles';

import { setFilter, useFilters } from '../hooks/useFilters';
import { CardGridLayout } from './CardGridLayout';
import { ModToggle } from './ModToggle';

const FarmerIcon = styled(GiFarmer, {
  fontSize: fonts[200],
});

const ModsContainer = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
});

const ModBlock = styled('div', {
  flex: '0 0 auto',
});

const MinMaxBlock = styled('div', {
  display: 'flex',
  flexFlow: 'column nowrap',
  alignItems: 'center',

  '& > span, & > svg': {
    marginBottom: space.xs,
    fontWeight: 'bold',
    lineHeight: 1.1,
  },

  '& > div': {
    display: 'flex',
    flexFlow: 'row nowrap',
    '& > input': {
      width: '2.1em',
      '& + input': {
        marginLeft: space.xs,
      },
    },
  },
});

const SongNameFilter = styled('div', {
  display: 'flex',
  alignItems: 'flex-end',
  height: '100%',
  '& > input': {
    flex: '1 1 5em',
    minWidth: '5em',
    maxWidth: '25em',
  },
});

const FiltersContainer = styled('div', {
  paddingBottom: space.sm,
});

const FilterButtons = styled('div', {
  display: 'flex',
  flexFlow: 'column nowrap',
  alignItems: 'stretch',
  justifyContent: 'center',
  fontSize: fonts[75],
});

const HideButton = styled(Button, {
  '@beatmapCardLg': {
    display: 'none',
  },

  variants: {
    hidden: {
      true: {
        width: 'max-content',
      },
      false: {
        marginBottom: space.lg,
      },
    },
  },
});

const MoreButton = styled(Button, {
  variants: {
    hidden: {
      true: {
        '@beatmapCardMd': {
          display: 'none',
        },
        '@beatmapCardSm': {
          display: 'none',
        },
      },
    },
  },
});

export const Filters = memo(function Filters() {
  const filters = useFilters();
  const [hidden, setHidden] = useState(false);

  return (
    <FiltersContainer>
      <CardGridLayout filter hidden={hidden}>
        <FilterButtons>
          <HideButton hidden={hidden} onClick={() => setHidden((v) => !v)} color="indigo">
            <FlipArrowIcon flipped={!hidden} css={{ marginRight: space.sm }} />
            {hidden ? 'show filters' : 'hide'}
          </HideButton>
          <MoreButton hidden={hidden} color="green">
            <FlipArrowIcon css={{ marginRight: space.sm }} />
            more
          </MoreButton>
        </FilterButtons>
        <SongNameFilter>
          <Input
            type="text"
            placeholder="song name..."
            value={filters.songName ?? ''}
            onChange={(value) => setFilter('songName', value)}
          />
        </SongNameFilter>
        <MinMaxBlock>
          <span>pp</span>
          <div>
            <Input
              type="number"
              min={0}
              max={filters.ppMax ?? undefined}
              placeholder="min"
              value={filters.ppMin ?? ''}
              onChange={(value) => setFilter('ppMin', value)}
            />
            <Input
              type="number"
              min={filters.ppMin ?? undefined}
              placeholder="max"
              value={filters.ppMax ?? ''}
              onChange={(value) => setFilter('ppMax', value)}
            />
          </div>
        </MinMaxBlock>
        <ModsContainer>
          <ModBlock>
            <ModToggle
              state={filters.dt ?? 'any'}
              withOther
              otherLabel="HT"
              onChange={(value) => setFilter('dt', value)}
            >
              DT
            </ModToggle>
          </ModBlock>
          <ModBlock>
            <ModToggle state={filters.hd ?? 'any'} onChange={(value) => setFilter('hd', value)}>
              HD
            </ModToggle>
          </ModBlock>
          <ModBlock>
            <ModToggle state={filters.hr ?? 'any'} onChange={(value) => setFilter('hr', value)}>
              HR
            </ModToggle>
          </ModBlock>
          <ModBlock>
            <ModToggle state={filters.fl ?? 'any'} onChange={(value) => setFilter('fl', value)}>
              FL
            </ModToggle>
          </ModBlock>
        </ModsContainer>
        <MinMaxBlock>
          <FaRegClock />
          <div>
            <TimeInput
              placeholder="0:00"
              seconds={filters.lengthMin ?? null}
              onChange={(value) => setFilter('lengthMin', value)}
            />
            <TimeInput
              placeholder="0:00"
              seconds={filters.lengthMax ?? null}
              onChange={(value) => setFilter('lengthMax', value)}
            />
          </div>
        </MinMaxBlock>
        <MinMaxBlock>
          <span>bpm</span>
          <div>
            <Input
              type="number"
              min={0}
              max={filters.bpmMax ?? undefined}
              placeholder="min"
              value={filters.bpmMin ?? ''}
              onChange={(value) => setFilter('bpmMin', value)}
            />
            <Input
              type="number"
              min={filters.bpmMin ?? undefined}
              placeholder="max"
              value={filters.bpmMax ?? ''}
              onChange={(value) => setFilter('bpmMax', value)}
            />
          </div>
        </MinMaxBlock>
        <MinMaxBlock>
          <FaStar />
          <div>
            <Input
              type="number"
              min={0}
              max={filters.diffMax ?? undefined}
              placeholder="min"
              value={filters.diffMin ?? ''}
              onChange={(value) => setFilter('diffMin', value)}
            />
            <Input
              type="number"
              min={filters.diffMin ?? undefined}
              placeholder="max"
              value={filters.diffMax ?? ''}
              onChange={(value) => setFilter('diffMax', value)}
            />
          </div>
        </MinMaxBlock>
        <MinMaxBlock>
          <span>
            <FarmerIcon />
          </span>
        </MinMaxBlock>
      </CardGridLayout>
    </FiltersContainer>
  );
});

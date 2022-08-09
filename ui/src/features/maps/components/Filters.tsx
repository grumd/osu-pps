import { memo } from 'react';
import { FaRegClock, FaStar } from 'react-icons/fa';
import { GiFarmer } from 'react-icons/gi';

import { Input } from '@/components/Input/Input';
import { TimeInput } from '@/components/TimeInput/TimeInput';
import { fonts, space, styled } from '@/styles';

import { setFilter, useFilters } from '../hooks/useFilters';
import { ModToggle } from './ModToggle';

const FarmerIcon = styled(GiFarmer, {
  fontSize: fonts[200],
});

const ModBlock = styled('div', {
  flex: '0 0 auto',
});

const MinMaxBlock = styled('div', {
  flex: '1 1 0px',
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
  flex: '3 1 0px',

  '& > input': {
    width: '97%',
  },
});

const FiltersContainer = styled('div', {
  display: 'flex',
  flexFlow: 'row nowrap',
  alignItems: 'flex-end',
  gap: space.md,
  paddingBottom: space.sm,
  paddingLeft: `calc(${space.beatmapHeight} + ${space.md})`,
});

export const Filters = memo(function Filters() {
  const filters = useFilters();

  return (
    <FiltersContainer>
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
    </FiltersContainer>
  );
});

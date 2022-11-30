import _ from 'lodash/fp';
import { memo, useState } from 'react';
import { FaRegClock, FaStar } from 'react-icons/fa';
import { FaUndoAlt } from 'react-icons/fa';
import { GiFarmer } from 'react-icons/gi';

import { Button } from '@/components/Button/Button';
import { FlipArrowIcon } from '@/components/FlipArrowIcon/FlipArrowIcon';
import { Input } from '@/components/Input/Input';
import { Select } from '@/components/Select/Select';
import { TimeInput } from '@/components/TimeInput/TimeInput';
import { Mode } from '@/constants/modes';
import { genreOptions, languageOptions, rankedDateOptions } from '@/constants/options';
import { useMode } from '@/hooks/useMode';
import { fonts, space, styled } from '@/styles';

import { resetFilter, setFilter, useFilters } from '../hooks/useFilters';
import { useFiltersCount } from '../hooks/useFiltersCount';
import type { Filters as TFilters } from '../types';
import { CardGridLayout } from './CardGridLayout';
import { ManiaKeysToggle, ModToggle } from './ModToggle';

const FarmerIcon = styled(GiFarmer, {
  fontSize: fonts[200],
});

const ModsContainer = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
});

const ModBlock = styled('div', {
  flex: `0 0 auto`,
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
  width: space.pageMaxWidth,
  maxWidth: '100%',
  margin: '0 auto',

  '@beatmapCardSm': {
    width: space.cardSmallMaxWidth,
  },
});

const FilterButtons = styled('div', {
  justifySelf: 'center',
  width: '7em',
  maxWidth: '7em',
  display: 'flex',
  flexFlow: 'column nowrap',
  alignItems: 'stretch',
  justifyContent: 'center',
  gap: space.sm,
  fontSize: fonts[75],
});

const HideButton = styled(Button, {
  paddingTop: space.sm,
  paddingBottom: space.sm,

  '@beatmapCardLg': {
    display: 'none',
  },

  variants: {
    hidden: {
      true: {
        width: 'max-content',
      },
    },
  },
});

const FilterButton = styled(Button, {
  '& svg': {
    marginRight: space.sm,
  },

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

const AdditionalFilters = styled('div', {
  display: 'flex',
  gap: space.md,
  marginTop: space.sm,
  '& > *': {
    flex: '1 1 0',
  },
});

// Mod filter options
const anyYesNo = ['any', 'yes', 'no'] as const;
const anyYesNoInvert = ['any', 'yes', 'no', 'invert'] as const;
const anyInvert = ['any', 'invert'] as const;

export const Filters = memo(function Filters() {
  const mode = useMode();
  const filters = useFilters();
  const [hidden, setHidden] = useState(false);
  const { moreCount, filtersCount } = useFiltersCount(mode, filters);

  const isMania = mode === Mode.mania;

  const onClickHide = () => setHidden((v) => !v);
  const onClickMore = () => {
    setFilter(mode, 'isShowingMore', !filters.isShowingMore);
  };
  const onClickReset = () => {
    if (window.confirm('Reset all filters?')) resetFilter(mode);
  };

  const onChange = (key: keyof TFilters) => (value: TFilters[keyof TFilters]) => {
    setFilter(mode, key, value);
  };

  return (
    <FiltersContainer>
      <CardGridLayout filter hidden={hidden}>
        <FilterButtons>
          <HideButton hidden={hidden} onClick={onClickHide} color="indigo">
            <FlipArrowIcon flipped={!hidden} css={{ marginRight: space.sm }} />
            {hidden ? ['show filters', filtersCount ? `(${filtersCount})` : ''].join(' ') : 'hide'}
          </HideButton>
          <FilterButton hidden={hidden} onClick={onClickReset} color="red">
            <FaUndoAlt /> reset
          </FilterButton>
          <FilterButton hidden={hidden} onClick={onClickMore} color="green">
            <FlipArrowIcon flipped={filters.isShowingMore} />
            {filters.isShowingMore ? 'less' : ['more', moreCount ? `(${moreCount})` : ''].join(' ')}
          </FilterButton>
        </FilterButtons>
        <SongNameFilter>
          <Input
            type="text"
            placeholder="song name..."
            value={filters.songName ?? ''}
            onChange={onChange('songName')}
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
              onChange={onChange('ppMin')}
            />
            <Input
              type="number"
              min={filters.ppMin ?? undefined}
              placeholder="max"
              value={filters.ppMax ?? ''}
              onChange={onChange('ppMax')}
            />
          </div>
        </MinMaxBlock>
        <ModsContainer>
          {mode === Mode.mania && (
            <ModBlock>
              <ManiaKeysToggle
                state={filters.maniaKeys === undefined ? 'any' : filters.maniaKeys}
                onChange={onChange('maniaKeys')}
              >
                {_.isNumber(filters.maniaKeys) ? `${filters.maniaKeys}K` : '?K'}
              </ManiaKeysToggle>
            </ModBlock>
          )}
          <ModBlock>
            <ModToggle
              state={filters.dt ?? 'any'}
              options={anyYesNoInvert}
              otherLabel="HT"
              onChange={onChange('dt')}
            >
              DT
            </ModToggle>
          </ModBlock>
          {!isMania && (
            <ModBlock>
              <ModToggle options={anyYesNo} state={filters.hd ?? 'any'} onChange={onChange('hd')}>
                HD
              </ModToggle>
            </ModBlock>
          )}
          {isMania ? (
            <ModBlock>
              <ModToggle
                options={anyInvert}
                otherLabel="EZ"
                state={filters.hr ?? 'any'}
                onChange={onChange('hr')}
              >
                EZ
              </ModToggle>
            </ModBlock>
          ) : (
            <ModBlock>
              <ModToggle
                state={filters.hr ?? 'any'}
                options={anyYesNoInvert}
                otherLabel="EZ"
                onChange={onChange('hr')}
              >
                HR
              </ModToggle>
            </ModBlock>
          )}
          {!isMania && (
            <ModBlock>
              <ModToggle options={anyYesNo} state={filters.fl ?? 'any'} onChange={onChange('fl')}>
                FL
              </ModToggle>
            </ModBlock>
          )}
        </ModsContainer>
        <MinMaxBlock>
          <FaRegClock />
          <div>
            <TimeInput
              placeholder="0:00"
              seconds={filters.lengthMin ?? null}
              onChange={onChange('lengthMin')}
            />
            <TimeInput
              placeholder="0:00"
              seconds={filters.lengthMax ?? null}
              onChange={onChange('lengthMax')}
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
              onChange={onChange('bpmMin')}
            />
            <Input
              type="number"
              min={filters.bpmMin ?? undefined}
              placeholder="max"
              value={filters.bpmMax ?? ''}
              onChange={onChange('bpmMax')}
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
              onChange={onChange('diffMin')}
            />
            <Input
              type="number"
              min={filters.diffMin ?? undefined}
              placeholder="max"
              value={filters.diffMax ?? ''}
              onChange={onChange('diffMax')}
            />
          </div>
        </MinMaxBlock>
        <MinMaxBlock>
          <span>
            <FarmerIcon />
          </span>
        </MinMaxBlock>
      </CardGridLayout>
      {filters.isShowingMore && !hidden && (
        <AdditionalFilters>
          <Select
            placeholder="when song was ranked"
            value={filters.ranked ?? null}
            isMulti={false}
            isClearable
            onChange={onChange('ranked')}
            options={rankedDateOptions}
          />
          <Select
            placeholder="language (empty = any)"
            value={filters.languages ?? []}
            isMulti
            isClearable
            onChange={(selected) => onChange('languages')([...selected])}
            options={languageOptions}
          />
          <Select
            placeholder="genre (empty = any)"
            value={filters.genres ?? []}
            isMulti
            isClearable
            onChange={(selected) => onChange('genres')([...selected])}
            options={genreOptions}
          />
        </AdditionalFilters>
      )}
    </FiltersContainer>
  );
});

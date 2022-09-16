import { memo, useMemo } from 'react';
import TimeAgo from 'react-timeago';

import { ColorCodedCell } from '@/components/ColorCodedCell/ColorCodedCell';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/HoverCard/HoverCard';
import { ExternalLink } from '@/components/Link/ExternalLink';
import { Mode } from '@/constants/modes';
import { genreMap, languageMap } from '@/constants/options';
import { opacityByStyle, useColorCodeStyle } from '@/hooks/useColorCodeStyle';
import { useMode } from '@/hooks/useMode';
import { colors, fonts, space, styled } from '@/styles';
import { secondsToFormatted, truncateFloat } from '@/utils';
import {
  getBpmColour,
  getDiffColour,
  getLengthColour,
  getMapNameLink,
  getMods,
} from '@/utils/beatmap';

import { useFiltersStore } from '../hooks/useFilters';
import type { Beatmap } from '../types';
import { CardGridLayout } from './CardGridLayout';

const BeatmapCardDiv = styled('div', {
  color: colors.textWhite,
  borderRadius: space.md,
  backgroundColor: colors.bgElement,
  width: space.pageMaxWidth,
  maxWidth: '100%',
  margin: `0 auto ${space.sm} auto`,

  '@beatmapCardSm': {
    width: space.cardSmallMaxWidth,
  },
});

const MapCoverLink = styled(ExternalLink, {
  borderRadius: space.md,
  overflow: 'hidden',
  height: space.beatmapHeight,
  width: space.beatmapHeight,
});

const MapCoverBackground = styled('div', {
  width: '100%',
  height: '100%',
  backgroundImage: 'var(--bg)',
  backgroundPosition: '50%',
  backgroundSize: 'cover',
  '@highDpi': {
    backgroundImage: 'var(--bg2x, var(--bg))',
  },
});

const MapLinkContainer = styled('div', {
  padding: `${space.xs} 0`,
});

const ExtraInfo = styled('dl', {
  fontSize: fonts[75],
  margin: `${space.sm} 0 0 0`,
  '& > *': {
    display: 'inline',
  },
  '& > dt': {
    color: colors.sand10,
  },
  '& > dd': {
    margin: 0,
  },
});

const MapLink = styled(ExternalLink, {
  wordBreak: 'break-word',
});

const PpNumber = styled('span', {
  textAlign: 'center',

  '& > span:first-child': {
    fontSize: fonts['150'],
    fontWeight: 'bold',
  },

  '& > span:last-child': {
    color: colors.textInactive,
  },
});

const ModsContainer = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
});

const ModBlock = styled('div', {
  fontSize: fonts[125],
  padding: `${space.sm} ${space.md}`,
  borderRadius: space.sm,
  background: colors.sand6,
  color: colors.textInactive,
  width: space.modBlock,
  textAlign: 'center',

  variants: {
    active: {
      true: {
        background: colors.bgOrange,
        fontWeight: 'bold',
        color: colors.textPrimary,
      },
    },
    inverted: {
      true: {
        background: colors.bgBlue,
        fontWeight: 'bold',
        color: colors.textPrimary,
      },
    },
  },
});

const TextCell = styled('span', {
  fontSize: fonts[125],
  textAlign: 'center',
});

function CoverImage({ url, mapsetId }: { url: string; mapsetId: number }) {
  return (
    // Hidden for screen readers because we have a text link next to it
    <MapCoverLink aria-hidden="true" tabIndex={-1} url={url}>
      <MapCoverBackground
        style={{
          '--bg': `url("https://assets.ppy.sh/beatmaps/${mapsetId}/covers/list.jpg")`,
          '--bg2x': `url("https://assets.ppy.sh/beatmaps/${mapsetId}/covers/list@2x.jpg")`,
        }}
      />
    </MapCoverLink>
  );
}

export const BeatmapCard = memo(function _BeatmapCard({ map }: { map: Beatmap }) {
  const mods = getMods(map.mods);
  const calcMode = useFiltersStore((state) => state.filters.calcMode);
  const isShowingMore = useFiltersStore((state) => state.filters.isShowingMore);
  const mode = useMode();
  const colorCodeStyle = useColorCodeStyle();
  const colorOpacity = opacityByStyle[colorCodeStyle];

  const isMania = mode === Mode.mania;
  const { link: mapLink, name: linkText } = getMapNameLink(map);
  const bpmFactor = mods.dt ? 1.5 : mods.ht ? 0.75 : 1;

  const rankedDate = useMemo(() => {
    return new Date(map.approvedHoursTimestamp * 60 * 60 * 1000);
  }, [map.approvedHoursTimestamp]);

  return (
    <BeatmapCardDiv>
      <CardGridLayout>
        <CoverImage url={mapLink} mapsetId={map.mapsetId} />
        <MapLinkContainer>
          <MapLink url={mapLink}>{linkText}</MapLink>
          {isShowingMore && (
            <ExtraInfo>
              <dt>ranked:</dt>
              <dd>
                {' '}
                <TimeAgo date={rankedDate} />
                {', '}
              </dd>
              {map.language && (
                <>
                  <dt>language:</dt>
                  <dd> {languageMap[map.language]}, </dd>
                </>
              )}
              {map.genre && (
                <>
                  <dt>genre:</dt>
                  <dd> {genreMap[map.genre]}</dd>
                </>
              )}
            </ExtraInfo>
          )}
        </MapLinkContainer>
        <PpNumber>
          <span>{map.pp?.toFixed(0) ?? '?'}</span>
          <span>pp</span>
        </PpNumber>
        <ModsContainer aria-label="Selected mods">
          {isMania && (
            <ModBlock active={!!map.maniaKeys}>
              {map.maniaKeys ? `${map.maniaKeys}K` : '?'}
            </ModBlock>
          )}
          <ModBlock active={mods.dt} inverted={mods.ht} aria-hidden={!mods.dt && !mods.ht}>
            {mods.ht ? 'HT' : 'DT'}
          </ModBlock>
          <ModBlock active={mods.hd} aria-hidden={!mods.hd}>
            HD
          </ModBlock>
          <ModBlock active={mods.hr} aria-hidden={!mods.hr}>
            HR
          </ModBlock>
          <ModBlock active={mods.fl} aria-hidden={!mods.fl}>
            FL
          </ModBlock>
        </ModsContainer>
        <ColorCodedCell
          aria-label="length"
          kind={colorCodeStyle}
          color={getLengthColour(map.length, colorOpacity)}
        >
          {secondsToFormatted(map.length)}
        </ColorCodedCell>
        <ColorCodedCell
          aria-label="bpm"
          kind={colorCodeStyle}
          color={getBpmColour(map.bpm * bpmFactor, colorOpacity)}
        >
          {mods.dt || mods.ht ? (
            <HoverCard css={{ flex: '1 1 0' }}>
              <HoverCardTrigger>{truncateFloat(map.bpm * bpmFactor)}*</HoverCardTrigger>
              <HoverCardContent>
                <div>Original BPM: {truncateFloat(map.bpm)}</div>
                <div>
                  With {mods.dt ? 'DT' : 'HT'}: {truncateFloat(map.bpm * bpmFactor)}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            truncateFloat(map.bpm)
          )}
        </ColorCodedCell>
        <ColorCodedCell
          aria-label="difficulty"
          kind={colorCodeStyle}
          color={getDiffColour(map.difficulty, colorOpacity)}
        >
          {map.difficulty.toFixed(2)}
        </ColorCodedCell>
        <TextCell aria-label="overweightness">{map.farmValues[calcMode].toFixed(0)}</TextCell>
      </CardGridLayout>
    </BeatmapCardDiv>
  );
});

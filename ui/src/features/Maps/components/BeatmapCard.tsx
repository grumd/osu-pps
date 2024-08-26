import { memo, useMemo } from 'react';
import { MdDownload } from 'react-icons/md';
import TimeAgo from 'react-timeago';

import { Button } from '@/components/Button/Button';
import { ClipboardButton } from '@/components/Button/ClipboardButton';
import { ColorCodedCell } from '@/components/ColorCodedCell/ColorCodedCell';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/HoverCard/HoverCard';
import { ExternalLink } from '@/components/Link/ExternalLink';
import { Mode } from '@/constants/modes';
import { opacityByStyle, useColorCodeStyle } from '@/hooks/useColorCodeStyle';
import { useMode } from '@/hooks/useMode';
import { useOsuDirect } from '@/hooks/useOsuDirect';
import { colors, fonts, space, styled } from '@/styles';
import { secondsToFormatted, truncateFloat } from '@/utils';
import {
  getBpmColour,
  getDiffColour,
  getLengthColour,
  getMapNameLink,
  getMods,
  getRealAr,
} from '@/utils/beatmap';

import { useFiltersStore } from '../hooks/useFilters';
import type { Beatmap } from '../types';
import { PpButton } from './BeatmapPpData/PpButton';
import { CardGridLayout } from './CardGridLayout';

const MapButtons = styled('div', {
  display: 'flex',
  gridArea: 'buttons',
  gap: space.sm,

  '@beatmapCardLg': {
    flexDirection: 'column',
  },
  '@beatmapCardMd': {
    flexDirection: 'row',
  },
  '@beatmapCardSm': {
    flexDirection: 'row',
    gap: space.md,
  },
});

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

  '@beatmapCardLg': {
    [`&:not(:hover) ${MapButtons}`]: {
      display: 'none',
    },
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
  alignSelf: 'stretch',
  display: 'grid',
  alignItems: 'center',
  gridTemplateAreas: ` 
    'link buttons'
    'info buttons'
  `,
  gridTemplateColumns: 'auto min-content',
  gridTemplateRows: '1fr auto',
});

const ExtraInfo = styled('dl', {
  gridArea: 'info',
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
  gridArea: 'link',
  wordBreak: 'break-word',
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
  const mode = useMode();
  const calcMode = useFiltersStore((state) => state.filters[mode].calcMode);
  const isShowingMore = useFiltersStore((state) => state.filters[mode].isShowingMore);
  const colorCodeStyle = useColorCodeStyle();
  const hasDirectLink = useOsuDirect();
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
          {hasDirectLink && (
            <MapButtons>
              <ClipboardButton content={`${map.beatmapId}`} title="copy beatmap ID" />
              <Button iconButtonKind="compact" kind="light" tabIndex={-1}>
                <ExternalLink
                  title="osu!direct download (osu! supporter only)"
                  css={{ lineHeight: 0 }}
                  url={`osu://b/${map.beatmapId}`}
                >
                  <MdDownload />
                </ExternalLink>
              </Button>
            </MapButtons>
          )}
          {isShowingMore && (
            <ExtraInfo>
              <dt>ranked:</dt>
              <dd>
                {' '}
                <TimeAgo date={rankedDate} />
                {', '}
              </dd>
              <dt>AR:</dt>
              <dd>
                {' '}
                {getRealAr(
                  map.ar,
                  mods.hr ? 1.4 : mods.ez ? 0.5 : 1,
                  mods.dt ? 1.5 : mods.ht ? 0.75 : 1
                )}
                ,{' '}
              </dd>
              <dt>CS:</dt>
              <dd> {map.cs}, </dd>
              <dt>OD:</dt>
              <dd> {map.accuracy}, </dd>
              <dt>HP:</dt>
              <dd> {map.drain}</dd>
            </ExtraInfo>
          )}
        </MapLinkContainer>
        <div>
          <PpButton
            beatmapName={linkText}
            pp={map.pp}
            beatmapId={map.beatmapId}
            modsBitmask={map.mods}
          />
        </div>
        <ModsContainer aria-label="Selected mods">
          {isMania && (
            <ModBlock active={!!map.maniaKeys}>
              {map.maniaKeys ? `${map.maniaKeys}K` : '?'}
            </ModBlock>
          )}
          <ModBlock active={mods.dt} inverted={mods.ht} aria-hidden={!mods.dt && !mods.ht}>
            {mods.ht ? 'HT' : 'DT'}
          </ModBlock>
          {!isMania && (
            <ModBlock active={mods.hd} aria-hidden={!mods.hd}>
              HD
            </ModBlock>
          )}
          {isMania ? (
            <ModBlock inverted={mods.ez} aria-hidden={!mods.ez}>
              EZ
            </ModBlock>
          ) : (
            <ModBlock active={mods.hr} inverted={mods.ez} aria-hidden={!mods.hr && !mods.ez}>
              {mods.ez ? 'EZ' : 'HR'}
            </ModBlock>
          )}
          {!isMania && (
            <ModBlock active={mods.fl} aria-hidden={!mods.fl}>
              FL
            </ModBlock>
          )}
        </ModsContainer>
        <ColorCodedCell
          aria-label="length"
          kind={colorCodeStyle}
          color={getLengthColour(map.length, colorOpacity)}
        >
          {mods.dt || mods.ht ? (
            <HoverCard css={{ flex: '1 1 0' }}>
              <HoverCardTrigger>
                {secondsToFormatted(Math.round(map.length / bpmFactor))}*
              </HoverCardTrigger>
              <HoverCardContent>
                <div>Original length: {secondsToFormatted(map.length)}</div>
                <div>
                  With {mods.dt ? 'DT' : 'HT'}:{' '}
                  {secondsToFormatted(Math.round(map.length / bpmFactor))}
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            secondsToFormatted(map.length)
          )}
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

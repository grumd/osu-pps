import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/HoverCard/HoverCard';
import { ExternalLink } from '@/components/Link/ExternalLink';
import { Mode } from '@/constants/modes';
import { useMode } from '@/hooks/useMode';
import { colors, fonts, space, styled } from '@/styles';
import { getBpmColour, getDiffColour, getLengthColour, getMapNameLink } from '@/utils/beatmap';

import { ColorCodeStyle, useColorCodeStyle } from '../hooks/useColorCodeStyle';
import { useFiltersStore } from '../hooks/useFilters';
import type { Beatmap } from '../types';

const Article = styled('article', {
  display: 'flex',
  alignItems: 'center',
  color: colors.textWhite,
  borderRadius: space.md,
  background: colors.bgElement,
  gap: space.md,
  height: space.beatmapHeight,
  marginBottom: space.sm,
});

const MapCoverLink = styled(ExternalLink, {
  borderRadius: space.md,
  overflow: 'hidden',
  height: '100%',
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

const MapLink = styled(ExternalLink, {
  flex: '3 1 0',
});

const PpNumber = styled('span', {
  flex: '1 1 0',
  textAlign: 'center',

  '& > span:first-child': {
    fontSize: fonts['150'],
    fontWeight: 'bold',
  },

  '& > span:last-child': {
    color: colors.textInactiveSecondary,
  },
});

const ModBlock = styled('div', {
  fontSize: fonts[125],
  padding: `${space.sm} ${space.md}`,
  borderRadius: space.sm,
  background: colors.sand6,
  color: colors.textInactiveSecondary,

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
  flex: '1 1 0',
  textAlign: 'center',
});

const ColoredCellContainer = styled('span', {
  flex: '1 1 0',
  fontWeight: 'bold',
  display: 'flex',
  flexFlow: 'row nowrap',
  justifyContent: 'center',
  alignItems: 'center',
});

const ColoredCellSpan = styled('span', {
  fontSize: fonts['125'],
  textAlign: 'center',
  padding: `${space.xs} ${space.md}`,

  variants: {
    kind: {
      [ColorCodeStyle.None]: {},
      [ColorCodeStyle.Background]: {
        flex: '0 1 auto',
        borderRadius: space.sm,
        backgroundColor: 'var(--color)',
      },
      [ColorCodeStyle.Underline]: {
        flex: '1 1 0',
        fontWeight: 'bold',
        position: 'relative',

        '&::before': {
          position: 'absolute',
          content: '',
          top: '100%',
          left: '25%',
          height: '6px',
          width: '50%',
          borderRadius: '3px',
          backgroundColor: 'var(--color)',
        },
      },
      [ColorCodeStyle.Border]: {
        flex: '0 1 auto',
        borderColor: 'var(--color)',
        borderWidth: '3px',
        borderStyle: 'solid',
        background: '$sand7',
      },
      [ColorCodeStyle.TextColor]: {
        flex: '1 1 0',
        color: 'var(--color)',
        fontWeight: 'bold',
      },
    },
  },
});

function ColoredCell({
  color,
  children,
  kind = ColorCodeStyle.Background,
}: {
  color?: string;
  children: React.ReactNode;
  kind?: ColorCodeStyle;
}) {
  return (
    <ColoredCellContainer>
      <ColoredCellSpan kind={kind} style={{ '--color': color }}>
        {children}
      </ColoredCellSpan>
    </ColoredCellContainer>
  );
}

const truncateFloat = (number: number) => Math.round(number * 100) / 100;

const secondsToFormatted = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${`0${seconds % 60}`.slice(-2)}`;

const getMods = ({ mods }: Beatmap) => ({
  dt: (mods & 64) === 64,
  hd: (mods & 8) === 8,
  hr: (mods & 16) === 16,
  fl: (mods & 1024) === 1024,
  ht: (mods & 256) === 256,
});

function CoverImage({ url, mapsetId }: { url: string; mapsetId: number }) {
  return (
    <MapCoverLink tabIndex={-1} url={url}>
      <MapCoverBackground
        style={{
          '--bg': `url("https://assets.ppy.sh/beatmaps/${mapsetId}/covers/list.jpg")`,
          '--bg2x': `url("https://assets.ppy.sh/beatmaps/${mapsetId}/covers/list@2x.jpg")`,
        }}
      />
    </MapCoverLink>
  );
}

export function BeatmapCard({ map }: { map: Beatmap }) {
  const mods = getMods(map);
  const calcMode = useFiltersStore((state) => state.filters.calcMode);
  const mode = useMode();
  const colorCodeStyle = useColorCodeStyle();

  const isMania = mode === Mode.mania;
  const { link: mapLink, name: linkText } = getMapNameLink(map);
  const bpmFactor = mods.dt ? 1.5 : mods.ht ? 0.75 : 1;

  const colorOpacity = 0.25;

  return (
    <Article>
      <CoverImage url={mapLink} mapsetId={map.mapsetId} />
      <MapLink url={mapLink}>{linkText}</MapLink>
      <PpNumber>
        <span>{map.pp.toFixed(0)}</span>
        <span>pp</span>
      </PpNumber>
      {isMania && (
        <ModBlock active={!!map.maniaKeys}>{map.maniaKeys ? `${map.maniaKeys}K` : '?'}</ModBlock>
      )}
      <ModBlock active={mods.dt} inverted={mods.ht}>
        {mods.ht ? 'HT' : 'DT'}
      </ModBlock>
      <ModBlock active={mods.hd}>HD</ModBlock>
      <ModBlock active={mods.hr}>HR</ModBlock>
      <ModBlock active={mods.fl}>FL</ModBlock>
      <ColoredCell kind={colorCodeStyle} color={getLengthColour(map.length, colorOpacity)}>
        {secondsToFormatted(map.length)}
      </ColoredCell>
      <ColoredCell kind={colorCodeStyle} color={getBpmColour(map.bpm * bpmFactor, colorOpacity)}>
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
      </ColoredCell>
      <ColoredCell kind={colorCodeStyle} color={getDiffColour(map.difficulty, colorOpacity)}>
        {map.difficulty.toFixed(2)}
      </ColoredCell>
      <TextCell>{map.farmValues[calcMode].toFixed(0)}</TextCell>
    </Article>
  );
}

import * as AspectRatio from '@radix-ui/react-aspect-ratio';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/HoverCard/HoverCard';
import { ExternalLink } from '@/components/Link/ExternalLink';
import { Mode } from '@/constants/modes';
import { useMode } from '@/hooks/useMode';
import { colors, fonts, space, styled } from '@/styles';
import { getBpmColour, getDiffColour, getLengthColour } from '@/utils/beatmap';

import { useCalcMode } from '../hooks/useCalcMode';
import { ColorCodeStyle, useColorCodeStyle } from '../hooks/useColorCodeStyle';
import { Beatmap } from '../types';

const Article = styled('article', {
  display: 'flex',
  alignItems: 'center',
  color: colors.textWhite,
  borderRadius: space[100],
  background: colors.bgElement,
  margin: `${space[75]} 0`,
  gap: space[100],
});

const MapCoverLink = styled(ExternalLink, {
  borderRadius: space[100],
  overflow: 'hidden',
  height: '100%',
  width: '5em',
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
  flex: '3.5 1 0',
});

const PpNumber = styled('span', {
  flex: '1 1 0',

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
  padding: `${space[75]} ${space[100]}`,
  borderRadius: space[75],
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

const BeatmapDetailsBlock = styled('div', {
  flex: '3 1 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const ColoredCellContainer = styled('span', {
  flex: '0 1 33%',
  fontWeight: 'bold',
  display: 'flex',
  flexFlow: 'row nowrap',
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    size: {
      auto: { flex: '0 1 33%' },
      lg: { flex: '1 0 auto' },
    },
  },
});

const ColoredCellSpan = styled('span', {
  fontSize: fonts['125'],
  textAlign: 'center',
  padding: `${space[50]} ${space[100]}`,

  variants: {
    kind: {
      [ColorCodeStyle.None]: {},
      [ColorCodeStyle.Background]: {
        flex: '0 1 auto',
        borderRadius: space[75],
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

const ColoredCell = ({
  size = 'auto',
  color,
  children,
  kind = ColorCodeStyle.Background,
}: {
  size?: 'auto' | 'lg';
  color?: string;
  children: React.ReactNode;
  kind?: ColorCodeStyle;
}) => {
  return (
    <ColoredCellContainer size={size}>
      <ColoredCellSpan kind={kind} style={{ '--color': color }}>
        {children}
      </ColoredCellSpan>
    </ColoredCellContainer>
  );
};

const truncateFloat = (number: number) => {
  return Math.round(number * 100) / 100;
};

const secondsToFormatted = (seconds: number) => {
  return `${Math.floor(seconds / 60)}:${('0' + (seconds % 60)).slice(-2)}`;
};

const getMods = ({ mods }: Beatmap) => {
  return {
    dt: (mods & 64) === 64,
    hd: (mods & 8) === 8,
    hr: (mods & 16) === 16,
    fl: (mods & 1024) === 1024,
    ht: (mods & 256) === 256,
  };
};

const CoverImage = ({ url, mapsetId }: { url: string; mapsetId: number }) => {
  return (
    <MapCoverLink url={url}>
      <AspectRatio.Root ratio={1}>
        <MapCoverBackground
          style={{
            '--bg': `url("https://assets.ppy.sh/beatmaps/${mapsetId}/covers/list.jpg")`,
            '--bg2x': `url("https://assets.ppy.sh/beatmaps/${mapsetId}/covers/list@2x.jpg")`,
          }}
        />
      </AspectRatio.Root>
    </MapCoverLink>
  );
};

export const BeatmapCard = ({ map }: { map: Beatmap }) => {
  const mods = getMods(map);
  const calcMode = useCalcMode();
  const mode = useMode();
  const colorCodeStyle = useColorCodeStyle();

  const isMania = mode === Mode.mania;
  const mapLink = `https://osu.ppy.sh/beatmapsets/${map.mapsetId}#osu/${map.beatmapId}`;
  const linkText = map.artist ? `${map.artist} - ${map.title} [${map.version}]` : mapLink;
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
        <ModBlock active={!!map.maniaKeys}>{map.maniaKeys ? map.maniaKeys + 'K' : '?'}</ModBlock>
      )}
      <ModBlock active={mods.dt} inverted={mods.ht}>
        {mods.ht ? 'HT' : 'DT'}
      </ModBlock>
      <ModBlock active={mods.hd}>HD</ModBlock>
      <ModBlock active={mods.hr}>HR</ModBlock>
      <ModBlock active={mods.fl}>FL</ModBlock>
      <BeatmapDetailsBlock>
        <ColoredCell kind={colorCodeStyle} color={getLengthColour(map.length, colorOpacity)}>
          {secondsToFormatted(map.length)}
        </ColoredCell>
        {mods.dt || mods.ht ? (
          <HoverCard>
            <HoverCardTrigger>
              <ColoredCell
                kind={colorCodeStyle}
                size="lg"
                color={getBpmColour(map.bpm * bpmFactor, colorOpacity)}
              >
                {map.bpm * bpmFactor}*
              </ColoredCell>
            </HoverCardTrigger>
            <HoverCardContent>
              <div>Original BPM: {map.bpm}</div>
              <div>
                With {mods.dt ? 'DT' : 'HT'}: {map.bpm * bpmFactor}
              </div>
            </HoverCardContent>
          </HoverCard>
        ) : (
          <ColoredCell
            kind={colorCodeStyle}
            size="lg"
            color={getBpmColour(map.bpm * bpmFactor, colorOpacity)}
          >
            {map.bpm}
          </ColoredCell>
        )}
        <ColoredCell kind={colorCodeStyle} color={getDiffColour(map.difficulty, colorOpacity)}>
          {map.difficulty.toFixed(2)}
        </ColoredCell>
      </BeatmapDetailsBlock>
      {/* <TextCell>{secondsToFormatted(map.length)}</TextCell> */}
      {/* <TextCell>
        <Bpm bpm={map.bpm} multiplier={mods.dt ? 1.5 : mods.ht ? 0.75 : 1} />
      </TextCell> */}
      <TextCell>{map.farmValues[calcMode].toFixed(0)}</TextCell>
      {/* 
      <td className="text-center">{secondsToFormatted(item.l)}</td>
      <td className="text-center">{bpm}</td>
      <td className="text-center">{item.d}</td>
      <td className="text-center">{overweightnessText}</td> */}
    </Article>
  );
};

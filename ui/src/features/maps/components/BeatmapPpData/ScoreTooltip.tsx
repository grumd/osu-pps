import { Mode } from '@/constants/modes';
import { colors, space, styled } from '@/styles';

import type { DataPoint } from '../../hooks/useMapPpData';

const TooltipRoot = styled('div', {
  background: colors.sand5,
  color: colors.textPrimary,
  padding: space.lg,
  borderRadius: space.sm,
  boxShadow: `0 0 ${space.md} black`,
  fontSize: '80%',
  width: '25em',

  '& dt': {
    fontWeight: 'bold',
    marginBottom: space.xxs,
    background: colors.sand3,
    borderRadius: space.xs,
    padding: '0.2em 0',
  },
  '& dd': {
    fontSize: '120%',
  },

  // To force tooltip to fit in the small screen
  '@media (max-width: 700px)': {
    fontSize: '60%',
  },
});

const StatsRow = styled('dl', {
  display: 'flex',
  flexFlow: 'row nowrap',
  textAlign: 'center',
  gap: space.sm,

  '& + &': {
    marginTop: space.sm,
  },

  '& > *': {
    flex: '1 1 0',
  },
});

const Grade = styled('div', {
  fontSize: '220%',
  textAlign: 'center',
});

const Miss = styled('span', {
  variants: {
    red: {
      true: {
        color: colors.red11,
      },
    },
  },
});

const Subtext = styled('div', {
  color: colors.textInactive,
  marginTop: space.md,
});

interface ScoreTooltipProps {
  score: DataPoint;
  hideLinkText: boolean;
  mode: Mode;
}

export const ScoreTooltip = ({ score, hideLinkText, mode }: ScoreTooltipProps): JSX.Element => {
  const { count_300, count_100, count_50, count_miss, count_geki, count_katu } = score.statistics;
  const stats = {
    [Mode.osu]: [
      ['300', count_300],
      ['100', count_100],
      ['50', count_50],
    ],
    [Mode.mania]: [
      ['max', count_geki],
      ['300', count_300],
      ['200', count_katu],
      ['100', count_100],
      ['50', count_50],
    ],
    [Mode.taiko]: [
      ['great', count_300],
      ['good', count_100],
    ],
    [Mode.fruits]: [
      ['fruits', count_300],
      ['ticks', count_100],
      ['drp miss', count_katu],
    ],
  }[mode];
  return (
    <TooltipRoot>
      <StatsRow>
        <Grade>{score.rank === 'X' ? 'SS' : score.rank === 'XH' ? 'SSH' : score.rank}</Grade>
        <div>
          <dt>accuracy</dt>
          <dd>
            <b>{score.accuracy}%</b>
          </dd>
        </div>
        <div>
          <dt>combo</dt>
          <dd>{score.maxcombo}</dd>
        </div>
        <div>
          <dt>PP</dt>
          <dd>
            <b>{score.pp.toFixed(1)}</b>
          </dd>
        </div>
      </StatsRow>
      <StatsRow>
        {stats.map(([dt, dd]) => {
          return (
            <div key={dt}>
              <dt>{dt}</dt>
              <dd>{dd}</dd>
            </div>
          );
        })}
        <div>
          <dt>miss</dt>
          <dd>
            <Miss red={count_miss > 0}>{count_miss}</Miss>
          </dd>
        </div>
      </StatsRow>
      {!hideLinkText && <Subtext>Click to open this score in a new tab</Subtext>}
    </TooltipRoot>
  );
};

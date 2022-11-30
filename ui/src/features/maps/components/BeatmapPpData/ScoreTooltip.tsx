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

  // To force tooltip to fit in the small screen
  '@media (max-width: 700px)': {
    fontSize: '60%',
  },
});

const GradeStats = styled('dl', {
  display: 'grid',
  gap: space.sm,
  gridTemplateColumns: 'repeat(4, minmax(5em, 1fr))',
  textAlign: 'center',

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
}

export const ScoreTooltip = ({ score, hideLinkText }: ScoreTooltipProps): JSX.Element => {
  return (
    <TooltipRoot>
      <GradeStats>
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
        <div>
          <dt>300</dt>
          <dd>{score.count300}</dd>
        </div>
        <div>
          <dt>100</dt>
          <dd>{score.count100}</dd>
        </div>
        <div>
          <dt>50</dt>
          <dd>{score.count50}</dd>
        </div>
        <div>
          <dt>miss</dt>
          <dd>
            <Miss red={score.countmiss > 0}>{score.countmiss}</Miss>
          </dd>
        </div>
      </GradeStats>
      {!hideLinkText && <Subtext>Click to open this score in a new tab</Subtext>}
    </TooltipRoot>
  );
};

import { colors, fonts, styled } from '@/styles';

interface RankChangeProps {
  delta: number;
}

const RankChangeStyled = styled('span', {
  display: 'flex',
  alignItems: 'center',

  variants: {
    type: {
      zero: {
        color: colors.textBlue,
      },
      negative: {
        color: colors.textRed,
      },
      positive: {
        color: colors.textGreen,
      },
    },
  },
});

const DeltaSymbol = styled('span', {
  width: '0.8rem',
  fontSize: '80%',

  variants: {
    small: {
      true: {
        fontSize: '60%',
      },
    },
  },
});

export const RankChange = ({ delta }: RankChangeProps) => {
  return (
    <RankChangeStyled type={delta === 0 ? 'zero' : delta > 0 ? 'positive' : 'negative'}>
      <DeltaSymbol small={Math.abs(delta) < 8}>
        {delta === 0 ? '■' : delta > 0 ? '▲' : '▼'}
      </DeltaSymbol>
      {Math.abs(delta)}
    </RankChangeStyled>
  );
};

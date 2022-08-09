import { colors, space, styled } from '@/styles';

export const Button = styled('button', {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: space.xs,
  padding: `${space.md} ${space.lg}`,
  lineHeight: 1.2,
  cursor: 'pointer',
  fontWeight: 600,

  '&:focus': { boxShadow: `0 0 0 0.1em black` },

  variants: {
    variant: {
      green: {
        backgroundColor: colors.grassA9,
        color: colors.grassA12,
        boxShadow: `0 0 0.6em -0.2em ${colors.grassA9}`,
        '&:hover': { backgroundColor: colors.grassA10 },
      },
      red: {
        backgroundColor: colors.redA9,
        color: colors.redA12,
        boxShadow: `0 0 0.6em -0.2em ${colors.redA9}`,
        '&:hover': { backgroundColor: colors.redA10 },
      },
      indigo: {
        backgroundColor: colors.indigoA9,
        color: colors.indigoA12,
        boxShadow: `0 0 0.6em -0.2em ${colors.indigoA9}`,
        '&:hover': { backgroundColor: colors.indigoA10 },
      },
    },
  },

  defaultVariants: {
    variant: 'green',
  },
});

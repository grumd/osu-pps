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
    color: {
      sand: {
        color: colors.sand11,
        boxShadow: `0 0 0.6em -0.2em ${colors.sand3}`,
        backgroundColor: colors.sand3,
        border: `1px solid ${colors.sand7}`,

        '&:hover': {
          backgroundColor: colors.sand4,
          border: `1px solid ${colors.sand8}`,
        },
      },
      green: {
        color: colors.grassA11,
        boxShadow: `0 0 0.6em -0.2em ${colors.grassA3}`,
        backgroundColor: colors.grassA3,
        border: `1px solid ${colors.grassA7}`,

        '&:hover': {
          backgroundColor: colors.grassA4,
          border: `1px solid ${colors.grassA8}`,
        },
      },
      red: {
        color: colors.redA11,
        boxShadow: `0 0 0.6em -0.2em ${colors.redA3}`,
        backgroundColor: colors.redA3,
        border: `1px solid ${colors.redA7}`,

        '&:hover': {
          backgroundColor: colors.redA4,
          border: `1px solid ${colors.redA8}`,
        },
      },
      indigo: {
        color: colors.indigoA11,
        boxShadow: `0 0 0.6em -0.2em ${colors.indigoA3}`,
        backgroundColor: colors.indigoA3,
        border: `1px solid ${colors.indigoA7}`,

        '&:hover': {
          backgroundColor: colors.indigoA4,
          border: `1px solid ${colors.indigoA8}`,
        },
      },
    },
    iconButton: {
      true: {
        padding: space.md,
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'transparent',
        boxShadow: 'none',

        '&:hover': {
          border: 'none',
          boxShadow: 'none',
        },
      },
    },
  },

  compoundVariants: [
    {
      iconButton: true,
      color: 'sand',
      css: {
        color: colors.sand11,
        backgroundColor: 'transparent',
        boxShadow: 'none',
        border: 'none',

        '&:hover': {
          backgroundColor: colors.sand4,
          boxShadow: 'none',
          border: 'none',
        },
      },
    },
    {
      iconButton: true,
      color: 'green',
      css: {
        color: colors.grassA11,
        backgroundColor: 'transparent',
        boxShadow: 'none',
        border: 'none',

        '&:hover': {
          backgroundColor: colors.grassA4,
          boxShadow: 'none',
          border: 'none',
        },
      },
    },
  ],

  defaultVariants: {
    color: 'sand',
  },
});

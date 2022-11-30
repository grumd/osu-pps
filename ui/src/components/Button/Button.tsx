import { colors, space, styled } from '@/styles';

export const Button = styled('button', {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: space.xs,
  padding: `${space.sm} ${space.md}`,
  lineHeight: 1.2,
  cursor: 'pointer',
  fontWeight: 600,

  '&:focus-visible': { boxShadow: `0 0 0 0.1em black` },

  variants: {
    kind: {
      default: {},
      light: {
        border: 'none',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        '&:hover': {
          border: 'none',
          boxShadow: 'none',
        },
      },
    },
    color: {
      sand: {
        color: colors.sand12,
        '&:hover': {
          backgroundColor: colors.sand5,
        },
      },
      green: {
        color: colors.grassA11,
        '&:hover': {
          backgroundColor: colors.grassA4,
        },
      },
      red: {
        color: colors.redA11,
        '&:hover': {
          backgroundColor: colors.redA4,
        },
      },
      indigo: {
        color: colors.indigoA11,
        '&:hover': {
          backgroundColor: colors.indigoA4,
        },
      },
    },
    iconButtonKind: {
      default: {
        padding: space.md,
        borderRadius: '50%',
      },
      compact: {
        padding: space.xs,
        borderRadius: '0.4em',
        lineHeight: 1,
      },
      none: {},
    },
  },

  compoundVariants: [
    {
      kind: 'default',
      color: 'sand',
      css: {
        boxShadow: `0 0 0.6em -0.2em ${colors.sand3}`,
        backgroundColor: colors.sand3,
        border: `1px solid ${colors.sand7}`,

        '&:hover': {
          border: `1px solid ${colors.sand8}`,
        },
      },
    },
    {
      kind: 'default',
      color: 'green',
      css: {
        boxShadow: `0 0 0.6em -0.2em ${colors.grassA3}`,
        backgroundColor: colors.grassA3,
        border: `1px solid ${colors.grassA7}`,

        '&:hover': {
          border: `1px solid ${colors.grassA8}`,
        },
      },
    },
    {
      kind: 'default',
      color: 'red',
      css: {
        boxShadow: `0 0 0.6em -0.2em ${colors.redA3}`,
        backgroundColor: colors.redA3,
        border: `1px solid ${colors.redA7}`,

        '&:hover': {
          border: `1px solid ${colors.redA8}`,
        },
      },
    },
    {
      kind: 'default',
      color: 'indigo',
      css: {
        boxShadow: `0 0 0.6em -0.2em ${colors.indigoA3}`,
        backgroundColor: colors.indigoA3,
        border: `1px solid ${colors.indigoA7}`,

        '&:hover': {
          border: `1px solid ${colors.indigoA8}`,
        },
      },
    },
  ],

  defaultVariants: {
    color: 'sand',
    kind: 'default',
    iconButtonKind: 'none',
  },
});

Button.displayName = 'Button';

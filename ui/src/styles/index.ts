import { createStitches } from '@stitches/react';
import type * as Stitches from '@stitches/react';

export const { styled, createTheme, globalCss, theme, config } = createStitches({
  media: {
    small: '(max-width: 1280px)',
  },
  theme: {
    colors: {
      bgGrey300: 'hsl(0, 0%, 18%)',
      bgGrey400: 'hsl(0, 0%, 23%)',
      bgGrey500: 'hsl(0, 0%, 28%)',
      bgGrey800: 'hsl(0, 0%, 43%)',
      bgOrange: 'hsla(33, 67%, 63%, 0.3)',
      bgBlue: 'hsla(197, 40%, 53%, 0.45)',
      textPrimary: 'white',
      textInactive: 'hsl(0, 0%, 33%)',
      textInactiveSecondary: 'grey',
      link: '#e0b074',
      linkActive: '#a77d58',
      textPlus: 'green',
      textMinus: '#ff4500',
      textBlue: '#6495ed',
      textBluePale: '#1e90ff',
    },
    space: {
      50: '0.3rem',
      75: '0.45rem',
      100: '0.6rem',
      150: '1rem',
      200: '1.5rem',
      300: '2rem',
      pageWidth: '80rem',
    },
    fonts: {
      base: '16px',
      100: '100%',
      125: '125%',
      150: '150%',
      175: '175%',
      200: '200%',
    },
  },
  utils: {
    marginX: (value: Stitches.ScaleValue<'space'>) => ({
      marginLeft: value,
      marginRight: value,
    }),
  },
});

export const lightTheme = createTheme({
  colors: {
    bgGrey300: '#f0f0f0',
    bgGrey400: '#d3d3d3',
    bgGrey500: '#bcbcbc',
    bgGrey800: '#6f6f6f',
    bgOrange: 'rgba(224,168,98,.3)',
    bgBlue: 'rgba(87,156,183,.45)',
    textPrimary: '#1a1a1a',
    textInactive: '#b2b2b2',
    textInactiveSecondary: '#555',
    link: '#e0b074',
    linkActive: '#a77d58',
    textPlus: 'green',
    textMinus: '#ff4500',
    textBlue: '#6495ed',
    textBluePale: '#1e90ff',
  },
});

export const { colors, space, fonts } = theme;

export type CSS = Stitches.CSS<typeof config>;

import {
  amberA,
  amberDarkA,
  grassA,
  grassDarkA,
  indigo,
  indigoA,
  indigoDark,
  indigoDarkA,
  red,
  redA,
  redDark,
  redDarkA,
  sand,
  sandDark,
} from '@radix-ui/colors';
import { createStitches } from '@stitches/react';
import type * as Stitches from '@stitches/react';

const colorAliases = {
  bgMain: '$sand2',
  bgElement: '$sand4',
  bgOrange: '$amberA6',
  bgBrightOrange: '$amberA8',
  bgBlue: '$indigoA6',
  bgError: '$redA5',
  textPrimary: '$sand12',
  textInactive: '$sand9',
  textInactiveSecondary: '$sand10',
  textBlue: '$indigo11',
  textRed: '$redA11',
};

export const { styled, createTheme, globalCss, theme, config, keyframes } = createStitches({
  media: {
    small: '(max-width: 1280px)',
    highDpi:
      'only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 120dpi)',
  },
  theme: {
    colors: {
      ...sandDark,
      ...redDarkA,
      ...grassDarkA,
      ...amberDarkA,
      ...indigoDark,
      ...indigoDarkA,
      ...redDark,
      ...colorAliases,
      textWhite: 'white',
      link: '#ebaf66',
      linkActive: '#a77d58',
      textGreen: 'green',
      textRed: '#ff4500',
    },
    space: {
      xs: '0.3rem',
      sm: '0.45rem',
      md: '0.6rem',
      lg: '1rem',
      xl: '1.5rem',
      pageWidth: '80rem',
      beatmapHeight: '5em',
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
    ...sand,
    ...redA,
    ...grassA,
    ...amberA,
    ...indigo,
    ...indigoA,
    ...red,
    ...colorAliases,
    textWhite: 'black',
    link: '#6a4416',
    linkActive: '#b6a697',
    textGreen: 'green',
    textRed: '#ff4500',
  },
});

export const { colors, space, fonts } = theme;

export type CSS = Stitches.CSS<typeof config>;

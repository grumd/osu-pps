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
  textInactive: '$sand10',
  textBlue: '$indigo11',
  textRed: '$redA11',
  border: '$sand6',
};

export const { styled, createTheme, globalCss, theme, config, keyframes } = createStitches({
  media: {
    minimum: '(max-width: 542px)',
    wrappedHeader: '(max-width: 732px)',
    highDpi:
      'only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 120dpi)',
    beatmapCardLg: '(min-width: 1141px)',
    beatmapCardMd: '(max-width: 1140px) and (min-width: 891px)',
    beatmapCardSm: '(max-width: 890px)',
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
      fade10: 'rgba(255, 255, 255, 0.1)',
      bronze: 'rgb(205, 127, 50)',
    },
    space: {
      xxs: '0.2em',
      xs: '0.3em',
      sm: '0.45em',
      md: '0.6em',
      lg: '1em',
      xl: '1.5em',
      modBlock: '2.5em',
      pageMaxWidth: '80rem',
      tableMaxWidth: '60rem',
      cardSmallMaxWidth: '40rem',
      beatmapHeight: '5em',
      borderWidth: '0.5px', // workaround for inconsistent border width in Chrome when display scaling is more than 100%
    },
    fonts: {
      base: '16px',
      75: '75%',
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
    paddingX: (value: Stitches.ScaleValue<'space'>) => ({
      paddingLeft: value,
      paddingRight: value,
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
    fade10: 'rgba(0, 0, 0, 0.1)',
    bronze: 'rgb(205, 127, 50)',
  },
});

export const { colors, space, fonts } = theme;

export type CSS = Stitches.CSS<typeof config>;

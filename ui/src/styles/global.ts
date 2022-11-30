import { fonts, globalCss, space } from '@/styles';

export const globalStyles = globalCss({
  'html, body, #root': {
    margin: 0,
    padding: 0,
    height: '100%',
    width: '100%',
  },

  '*': {
    boxSizing: 'border-box',
  },

  p: {
    marginTop: space.lg,
    marginBottom: space.lg,
  },

  ':root': {
    fontFamily:
      'Exo, "Exo 2", BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, ' +
      'Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    textRendering: 'optimizeLegibility',
    '-webkit-font-smoothing': 'antialiased',
    '-moz-osx-font-smoothing': 'grayscale',
    '-webkit-text-size-adjust': '100%',

    // font-size has to be in the :root element in order for rem units to work
    fontSize: fonts.base,
    '@minimum': {
      fontSize: '2.95vw',
    },
  },

  '.visx-tooltip-reset': {
    background: 'inherit !important',
    padding: 'inherit !important',
    fontWeight: 'inherit !important',
    color: 'inherit !important',
    borderRadius: 'inherit !important',
    fontSize: 'inherit !important',
    boxShadow: 'inherit !important',
    lineHeight: 'inherit !important',
    fontFamily: 'inherit !important',
  },

  'dl, dd': {
    margin: 0,
  },
});

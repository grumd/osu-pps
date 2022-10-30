import { colors, styled } from '@/styles';

export const ScrollArea = styled('div', {
  overflow: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: colors.sand8,

  '&::-webkit-scrollbar': {
    width: '0.4rem', // for vertical scrollbars
    height: '0.4rem', // for horizontal scrollbars
  },

  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },

  '&::-webkit-scrollbar-thumb': {
    backgroundColor: colors.sand8,
    borderRadius: '0.2rem',

    '&:hover': {
      backgroundColor: colors.sand9,
    },
  },
});

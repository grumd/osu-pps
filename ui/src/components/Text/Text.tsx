import { colors, styled } from '@/styles';

export const Text = styled('span', {
  variants: {
    nowrap: {
      true: {
        whiteSpace: 'nowrap',
      },
    },
    bold: {
      true: {
        fontWeight: 'bold',
      },
    },
    faded: {
      true: {
        color: colors.textInactive,
      },
    },
    color: {
      red: {
        color: colors.textRed,
      },
      green: {
        color: colors.textGreen,
      },
      blue: {
        color: colors.textBlue,
      },
    },
  },
});

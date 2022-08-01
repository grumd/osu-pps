import { colors, styled } from '@/styles';

export const Link = styled('a', {
  color: colors.link,
  textDecoration: 'none',
  cursor: 'pointer',

  '&:hover': {
    color: colors.link,
    textDecoration: 'underline',
  },
  '&:visited, &:active': {
    color: colors.linkActive,
  },
});

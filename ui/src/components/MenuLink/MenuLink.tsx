import { NavLink } from 'react-router-dom';

import { colors, fonts, styled } from '@/styles';

export const MenuLink = styled(NavLink, {
  fontSize: fonts[175],
  color: colors.textInactive,
  textDecoration: 'none',

  '&.active': {
    color: colors.textPrimary,
    pointerEvents: 'none',
    cursor: 'default',
    fontWeight: 600,
  },
  '&:hover': {
    color: colors.textPrimary,
    textDecoration: 'underline',
  },
});

MenuLink.displayName = 'MenuLink';

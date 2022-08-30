import { colors, fonts, space, styled } from '@/styles';

export const FakeListItem = styled('li', {
  fontSize: fonts[175],
  fontWeight: 600,
  color: colors.textPrimary,
  cursor: 'default',
});

FakeListItem.displayName = 'FakeListItem';

export const NavMenu = styled('nav', {
  display: 'flex',
  flexFlow: 'row wrap',

  '& > ul': {
    padding: 0,
    margin: 0,
    display: 'flex',
    flexFlow: 'row wrap',
    alignItems: 'center',
    listStyleType: 'none',

    '& > li > a': {
      marginX: space.xs,
    },
    '& > li:first-child > a': {
      marginLeft: 0,
    },
    [`& > li:not(${FakeListItem}) + li::before`]: {
      fontSize: fonts[175],
      color: colors.textInactive,
      content: '•',
    },
  },
});

NavMenu.displayName = 'NavMenu';

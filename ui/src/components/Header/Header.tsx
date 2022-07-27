import type * as React from 'react';
import { space, styled } from 'styles';

import { HeaderAside } from './HeaderAside';
import { HeaderNavigation } from './HeaderNavigation';

const HeaderContainer = styled('header', {
  padding: `${space[75]} 0`,
  display: 'flex',
  flexFlow: 'row nowrap',
  justifyContent: 'space-between',
});

export const Header = ({ themeToggle }: { themeToggle: React.ReactNode }) => {
  return (
    <HeaderContainer>
      <HeaderNavigation />
      <HeaderAside themeToggle={themeToggle} />
    </HeaderContainer>
  );
};

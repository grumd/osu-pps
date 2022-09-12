import type { ReactNode } from 'react';

import { space, styled } from '@/styles';

import { HeaderAside } from './HeaderAside';
import { HeaderNavigation } from './HeaderNavigation';

const HeaderContainer = styled('header', {
  padding: `${space.sm} 0`,
  display: 'flex',
  flexFlow: 'row wrap',
  justifyContent: 'space-between',
  rowGap: space.xs,

  '@beatmapCardMd': {
    paddingX: space.sm,
  },

  '@beatmapCardSm': {
    paddingX: space.md,
  },
});

export function Header({ themeToggle }: { themeToggle: ReactNode }) {
  return (
    <HeaderContainer>
      <HeaderNavigation />
      <HeaderAside themeToggle={themeToggle} />
    </HeaderContainer>
  );
}

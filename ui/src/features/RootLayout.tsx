import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from '@/components/Header/Header';
import { SunMoonToggle } from '@/components/SunMoonToggle/SunMoonToggle';
import { useThemeWithDefault } from '@/hooks/useTheme';
import { colors, lightTheme, space, styled } from '@/styles';

const RootContainer = styled('div', {
  display: 'flex',
  flexFlow: 'column nowrap',
  background: colors.bgMain,
  color: colors.textPrimary,
  minHeight: '100%',
  paddingLeft: space.lg,
  paddingRight: space.lg,

  '@beatmapCardMd': {
    paddingLeft: space.sm,
    paddingRight: space.sm,
  },

  '@beatmapCardSm': {
    paddingLeft: space.xs,
    paddingRight: space.xs,
  },

  variants: {
    theme: {
      dark: {
        colorScheme: 'dark',
      },
      light: {
        colorScheme: 'light',
      },
      'no-preference': {},
    },
  },
});

export function RootLayout() {
  const [theme, setTheme] = useThemeWithDefault('dark');

  return (
    <RootContainer theme={theme} className={theme === 'light' ? lightTheme : ''}>
      <Header
        themeToggle={
          <SunMoonToggle
            dark={theme !== 'light'}
            onChange={(dark) => setTheme(dark ? 'dark' : 'light')}
          />
        }
      />
      <Suspense>
        <Outlet />
      </Suspense>
    </RootContainer>
  );
}

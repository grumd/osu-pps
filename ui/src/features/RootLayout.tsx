import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from '@/components/Header/Header';
import { SunMoonToggle } from '@/components/SunMoonToggle/SunMoonToggle';
import { useThemeWithDefault } from '@/hooks/useTheme';
import { colors, lightTheme, space, styled } from '@/styles';

const RootContainer = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  background: colors.bgMain,
  color: colors.textPrimary,
  width: '100%',
  minHeight: '100%',
  oveflow: 'hidden',

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

const LayoutContainer = styled('div', {
  width: space.pageWidth,
  paddingLeft: space.lg,
  paddingRight: space.lg,
  display: 'flex',
  flexFlow: 'column nowrap',

  '& > header': {
    flex: '0 0 auto',
  },
});

export function RootLayout() {
  const [theme, setTheme] = useThemeWithDefault('dark');

  return (
    <RootContainer theme={theme} className={theme === 'light' ? lightTheme : ''}>
      <LayoutContainer>
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
      </LayoutContainer>
    </RootContainer>
  );
}

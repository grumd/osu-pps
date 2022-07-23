import { Outlet } from 'react-router-dom';

import { lightTheme, styled, colors, space } from 'styles';

import { useThemeWithDefault } from 'hooks/useTheme';

import { Header } from 'components/Header/Header';
import { SunMoonToggle } from 'components/SunMoonToggle/SunMoonToggle';

const RootContainer = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  background: colors.bgGrey300,
  color: colors.textPrimary,
  width: '100%',
  minHeight: '100%',

  variants: {
    theme: {
      dark: {
        colorScheme: 'dark',
      },
      light: {
        colorScheme: 'light',
      },
      ['no-preference']: {},
    },
  },
});

const LayoutContainer = styled('div', {
  width: space.pageWidth,
});

export const RootLayout = () => {
  const [theme, setTheme] = useThemeWithDefault('dark');

  return (
    <RootContainer theme={theme} className={theme === 'light' ? lightTheme : ''}>
      <LayoutContainer>
        <Header
          themeToggle={
            <SunMoonToggle
              night={theme !== 'light'}
              onChange={(night) => setTheme(night ? 'dark' : 'light')}
            />
          }
        />
        <main>
          <Outlet />
        </main>
      </LayoutContainer>
    </RootContainer>
  );
};

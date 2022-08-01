import { useCallback, useEffect, useState } from 'react';

export type ColorScheme = 'light' | 'dark' | 'no-preference';

const storageKey = 'dark-light-theme';
const defaultSelected = (localStorage.getItem(storageKey) as ColorScheme) ?? 'no-preference';
const defaultPreferred = typeof window.matchMedia === 'function' ? 'dark' : 'light';

export function useThemeWithPreference(): [ColorScheme, (theme: ColorScheme) => void] {
  const [preferred, setPreferred] = useState<ColorScheme>(defaultPreferred);
  const [selected, setSelected] = useState<ColorScheme>(defaultSelected);

  // Update preferred color scheme
  useEffect(() => {
    if (!window.matchMedia) {
      setPreferred('light'); // For old browsers
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    setPreferred(mediaQuery.matches ? 'dark' : 'light');

    const onChange = (event: MediaQueryListEvent) => {
      setPreferred(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', onChange);

    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  // Update selected color scheme
  const onChangeTheme = useCallback((theme: ColorScheme) => {
    setSelected(theme);
    localStorage.setItem(storageKey, theme);
  }, []);

  return [selected === 'no-preference' ? preferred : selected, onChangeTheme];
}

export function useThemeWithDefault(
  defaultTheme: ColorScheme = 'dark'
): [ColorScheme, (theme: ColorScheme) => void] {
  const [selected, setSelected] = useState<ColorScheme>(
    defaultSelected === 'no-preference' ? defaultTheme : defaultSelected
  );

  // Update selected color scheme
  const onChangeTheme = useCallback((theme: ColorScheme) => {
    setSelected(theme);
    localStorage.setItem(storageKey, theme);
  }, []);

  return [selected, onChangeTheme];
}

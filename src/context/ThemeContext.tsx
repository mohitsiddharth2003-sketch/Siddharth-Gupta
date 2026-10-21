import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'accountspro_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (saved === 'dark') return 'dark';
    if (saved === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    let actualTheme: ResolvedTheme = 'light';

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      actualTheme = mediaQuery.matches ? 'dark' : 'light';

      const handleChange = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        if (newResolved === 'dark') {
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.setAttribute('data-theme', 'light');
          root.style.colorScheme = 'light';
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      actualTheme = theme;
    }

    setResolvedTheme(actualTheme);

    if (actualTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const currentResolved =
        prev === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : prev;
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

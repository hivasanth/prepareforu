import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Dark is the default theme — only persist a preference if the user has toggled
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Always default to dark; CSS dark vars are baseline
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      // Dark mode: remove .light so CSS dark-first vars take effect
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      // Light mode: add .light so :root.light overrides kick in
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/* DS-006 Theme capability — Auth visual-language provider.
   Additive Foundation mechanism that lets every auth page declare the SAME
   light-forced theme mode through one reusable unit, instead of hand-rolling
   <ThemeContext.Provider value={{isDark:false}}> + <div className="light">.
   Renders a `.light` wrapper so the existing CSS light-first overrides apply.
   Does NOT modify the global ThemeProvider or useTheme behaviour. */
export function AuthThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
      <div className="light">{children}</div>
    </ThemeContext.Provider>
  );
}

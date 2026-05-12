import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme?: (theme: Theme | ((prev: Theme) => Theme)) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const setThemeFunction = (newTheme: Theme | ((prev: Theme) => Theme)) => {
    const themeToSet = typeof newTheme === 'function' ? newTheme(theme) : newTheme;
    setThemeState(themeToSet);
    if (switchable) {
      localStorage.setItem("theme", themeToSet);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    let effectiveTheme: string = theme;

    // Handle system theme — always resolve to light to avoid surprise dark mode
    if (theme === "system") {
      effectiveTheme = "light";
    }

    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = switchable
    ? () => {
        setThemeFunction((prev: Theme) => {
          if (prev === "light") return "dark";
          if (prev === "dark") return "system";
          return "light";
        });
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeFunction, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

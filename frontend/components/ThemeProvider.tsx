"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const THEME_COOKIE_NAME = "theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getCookieValue(name: string): string | null {
  const namePrefix = `${name}=`;
  const cookies = document.cookie.split(";");

  for (const rawCookie of cookies) {
    const cookie = rawCookie.trim();

    if (cookie.startsWith(namePrefix)) {
      return cookie.slice(namePrefix.length);
    }
  }

  return null;
}

function setCookieValue(name: string, value: string) {
  const maxAgeInSeconds = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeInSeconds}; SameSite=Lax`;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = getCookieValue(THEME_COOKIE_NAME);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme =
      theme === "dark" ? "dark" : "light";
    setCookieValue(THEME_COOKIE_NAME, theme);
  }, [theme]);

  const toggleDarkMode = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      toggleDarkMode,
    }),
    [theme, toggleDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}

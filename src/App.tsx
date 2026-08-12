import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import Landing from "./screens/Landing";
import Overview from "./screens/Overview";
import WordSearchBuilder from "./screens/WordSearchBuilder";
import WordleBuilder from "./screens/WordleBuilder";
import Navbar from "./screens/Navbar";
import Footer from "./screens/Footer";
import Settings from "./screens/Settings";

type Theme = "light" | "dark";

const THEME_COOKIE_NAME = "theme";

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
  const storedTheme = getCookieValue(THEME_COOKIE_NAME);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
    setCookieValue(THEME_COOKIE_NAME, theme);
  }, [theme]);

  const toggleDarkMode = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/wordsearch" element={<WordSearchBuilder />} />
        <Route path="/wordle" element={<WordleBuilder />} />
        <Route path="/about" element={<Overview />} />
        <Route
          path="/settings"
          element={
            <Settings
              isDarkMode={theme === "dark"}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;

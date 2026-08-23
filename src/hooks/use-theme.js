import { useEffect, useState } from "react";

const STORAGE_KEY = "salary-tracker-theme";

export function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? "#05080c" : "#f8fafc");
  document
    .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    ?.setAttribute("content", isDark ? "black-translucent" : "default");
}

export function useTheme() {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }, [theme]);

  return { theme, setTheme };
}

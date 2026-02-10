/**
 * Theme Context
 * Manages light/dark/system theme for admin & officer dashboards only.
 * Stored in localStorage (per device); same preference used for both admin and officer.
 * Public pages (home, file complaint, etc.) are not themed - dark class is only applied on /admin and /officer routes.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { STORAGE_KEYS } from "@/lib/constants";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode | null;
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

function setStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, mode);
  } catch {}
}

function getSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return getSystemDark() ? "dark" : "light";
}

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  resolvedTheme: ResolvedTheme;
  isDashboardRoute: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [systemDark, setSystemDark] = useState(getSystemDark);

  const isDashboardRoute =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/officer");

  const resolvedTheme = useMemo(
    () => resolveTheme(theme),
    [theme, systemDark]
  );

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    setStoredTheme(mode);
  }, []);

  // Listen for system preference changes when theme is "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply dark class only on dashboard routes; use resolved theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDashboardRoute && resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    return () => {
      root.classList.remove("dark");
    };
  }, [isDashboardRoute, resolvedTheme]);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, setTheme, resolvedTheme, isDashboardRoute }),
    [theme, setTheme, resolvedTheme, isDashboardRoute]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

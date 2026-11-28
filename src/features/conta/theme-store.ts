"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "neximob-theme";
const STORAGE_KEY = THEME_STORAGE_KEY;
const THEME_EVENT = "neximob-theme-change";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function getSnapshot(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isThemePreference(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      callback();
    }
  };
  const onThemeEvent = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, onThemeEvent);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, onThemeEvent);
  };
}

export function applyThemePreference(pref: ThemePreference): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", pref);
  }
}

export function setThemePreference(pref: ThemePreference): void {
  if (typeof window !== "undefined") {
    try {
      if (pref === "system") {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, pref);
      }
    } catch {
      // Ignora falha de armazenamento em navegação restrita.
    }
    applyThemePreference(pref);
    window.dispatchEvent(new Event(THEME_EVENT));
  }
}

export function useThemePreference(): {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
} {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyThemePreference(preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setThemePreference(next);
  }, []);

  return { preference, setPreference };
}

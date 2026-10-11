"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const themeEvent = "knowledge-theme-change";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function themeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function serverThemeSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(themeEvent, onChange);
  return () => window.removeEventListener(themeEvent, onChange);
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem("theme", theme);
  window.dispatchEvent(new Event(themeEvent));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    themeSnapshot,
    serverThemeSnapshot,
  );

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== "theme") {
        return;
      }

      applyTheme(
        event.newValue === "dark" || event.newValue === "light"
          ? event.newValue
          : systemTheme(),
      );
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme} theme`;

  return (
    <button
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-body transition hover:bg-surface-subtle hover:text-ink"
      onClick={() => applyTheme(nextTheme)}
      title={label}
      type="button"
    >
      {nextTheme === "dark" ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

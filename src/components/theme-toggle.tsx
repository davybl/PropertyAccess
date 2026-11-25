"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-9 w-24 rounded-full border border-subtle bg-card animate-pulse" />
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label="Cycle color theme"
      className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-card px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-emerald-brand"
    >
      {theme === "dark" && (
        <>
          <Moon className="h-3.5 w-3.5 text-emerald-brand" />
          <span>Dark</span>
        </>
      )}
      {theme === "light" && (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-featured" />
          <span>Light</span>
        </>
      )}
      {theme === "system" && (
        <>
          <Monitor className="h-3.5 w-3.5 text-ink-secondary" />
          <span>System</span>
        </>
      )}
    </button>
  );
}

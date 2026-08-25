"use client";
let themeIsDark = false;
const listeners = new Set<() => void>();
function subscribeTheme(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function syncTheme() { themeIsDark = document.documentElement.classList.contains("dark"); listeners.forEach((l) => l()); }
if (typeof document !== "undefined") themeIsDark = document.documentElement.classList.contains("dark");

import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  // read the live DOM class rather than mirroring it into an effect
  const dark = useSyncExternalStore(subscribeTheme, () => themeIsDark, () => false);
  return (
    <button
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        syncTheme();
        try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
      }}
      className="eyebrow rounded-sm border border-[var(--rule)] px-2.5 py-1.5 hover:bg-secondary
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}

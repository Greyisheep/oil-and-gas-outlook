"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { TrendingUp, SlidersHorizontal, FlaskConical, FileText, Target, PanelLeftClose, PanelLeftOpen, ExternalLink, Sun, Moon } from "lucide-react";
import { Icon } from "./icon";
import type { GlyphName } from "@/lib/glyphs";
import { RangeProvider, RangeSelector } from "./range";

export type SectionId =
  | "production" | "prices" | "shipping" | "drilling" | "projection" | "outlook" | "decks" | "method";

export type Section = {
  id: SectionId;
  label: string;
  group: string;
  blurb: string;
  content: ReactNode;
};

/** Domain glyphs where they read better than a generic UI icon. */
const GLYPH: Partial<Record<SectionId, GlyphName>> = {
  production: "barrel",
  shipping: "cargo_ship",
  drilling: "oil_rig",
};
const LUCIDE: Partial<Record<SectionId, typeof TrendingUp>> = {
  prices: TrendingUp,
  projection: Target,
  outlook: SlidersHorizontal,
  decks: FileText,
  method: FlaskConical,
};

function NavIcon({ id, size = 15 }: { id: SectionId; size?: number }) {
  const glyph = GLYPH[id];
  if (glyph) return <Icon name={glyph} size={size + 2} className="shrink-0" />;
  const L = LUCIDE[id]!;
  return <L size={size} strokeWidth={2} className="shrink-0" aria-hidden />;
}

/** Tracks the `dark` class the head script restores, so the label never desyncs. */
function useDark() {
  return useSyncExternalStore(
    (notify) => {
      const o = new MutationObserver(notify);
      o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => o.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
}

/** Sun and moon, as drawn, rather than a text toggle. */
function ThemeButtons() {
  const dark = useDark();
  const base =
    "flex h-7 w-7 items-center justify-center rounded-[9px] transition-colors " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]";
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setTheme(false)}
        aria-label="Light theme"
        aria-pressed={!dark}
        className={`${base} ${!dark ? "bg-[var(--plot)] text-foreground" : "text-[var(--lighter)] hover:text-foreground"}`}
      >
        <Sun size={15} aria-hidden />
      </button>
      <button
        onClick={() => setTheme(true)}
        aria-label="Dark theme"
        aria-pressed={dark}
        className={`${base} ${dark ? "bg-[var(--plot)] text-foreground" : "text-[var(--lighter)] hover:text-foreground"}`}
      >
        <Moon size={15} aria-hidden />
      </button>
    </div>
  );
}

export function Shell({
  sections, dataTo, repoUrl,
}: { sections: Section[]; dataTo: string; repoUrl: string }) {
  const [active, setActive] = useState<SectionId>(sections[0].id);
  const [collapsed, setCollapsed] = useState(false);

  const current = sections.find((s) => s.id === active) ?? sections[0];
  const groups = Array.from(new Set(sections.map((s) => s.group)));

  return (
    <RangeProvider>
    <div className="flex min-h-screen">
      {/* ── sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`hidden shrink-0 flex-col border-r-[0.8px] border-[var(--rule)] bg-[var(--card)]
                    lg:flex ${collapsed ? "w-[72px]" : "w-[280px]"}`}
      >
        <div className={`flex h-[68px] items-center border-b-[0.8px] border-[var(--rule)] ${collapsed ? "justify-center px-2" : "px-4"}`}>
          {collapsed ? (
            <span className="wordmark text-[17px] leading-6">OG</span>
          ) : (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--plot)]">
                <Icon name="barrel" size={17} className="text-[var(--brass)]" />
              </span>
              <div className="min-w-0">
                <div className="wordmark text-[14px] leading-[1.2]">Oil &amp; Gas Outlook</div>
                <div className="caption leading-[1.3]">Nigeria · OPEC primary data</div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {groups.map((g) => (
            <div key={g} className="mb-5">
              {!collapsed && <div className="eyebrow mb-1.5 px-3 text-[13px]">{g}</div>}
              <div className="flex flex-col gap-0.5">
                {sections.filter((s) => s.group === g).map((s) => {
                  const on = s.id === active;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActive(s.id)}
                      aria-current={on ? "page" : undefined}
                      title={collapsed ? s.label : undefined}
                      className={`navitem ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      <NavIcon id={s.id} />
                      {!collapsed && <span className="truncate">{s.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t-[0.8px] border-[var(--rule)] p-2.5">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`navitem ${collapsed ? "justify-center px-0" : ""}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={15} aria-hidden /> : <PanelLeftClose size={15} aria-hidden />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── main column ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b-[0.8px] border-[var(--rule)] bg-[var(--card)]/95 backdrop-blur">
          <div className="flex items-start justify-between gap-6 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h1 className="heading">{current.label}</h1>
              <p className="caption mt-0.5 max-w-[92ch]">{current.blurb}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a href={repoUrl} target="_blank" rel="noreferrer" className="pill shrink-0">
                <span className="max-sm:hidden">Source</span> <ExternalLink size={13} aria-hidden />
              </a>
              <ThemeButtons />
            </div>
          </div>

          {/* mobile / tablet nav rail */}
          <div className="flex items-center gap-1 overflow-x-auto border-t-[0.8px] border-[var(--rule)] px-3 py-2 lg:hidden">
            {sections.map((s) => {
              const on = s.id === active;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  aria-current={on ? "page" : undefined}
                  className="navitem w-auto shrink-0 whitespace-nowrap"
                >
                  <NavIcon id={s.id} size={14} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-5 flex items-center gap-3">
            <RangeSelector />
            <span className="caption">to {dataTo}</span>
          </div>
          {current.content}
        </main>
      </div>
    </div>
    </RangeProvider>
  );
}

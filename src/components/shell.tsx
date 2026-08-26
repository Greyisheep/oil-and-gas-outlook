"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { TrendingUp, SlidersHorizontal, FlaskConical, FileText, Target, PanelLeftClose, PanelLeftOpen, ExternalLink } from "lucide-react";
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

function ThemeButton() {
  const dark = useDark();
  return (
    <button
      onClick={() => {
        const next = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", next);
        try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
      }}
      className="pill"
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
    >
      {dark ? "Light" : "Dark"}
    </button>
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
            <div className="min-w-0">
              <div className="wordmark text-[15px] leading-[1.15]">Oil and Gas<br />Outlook</div>
              <div className="eyebrow mt-0.5 text-[13px]">Nigeria · OPEC primary data</div>
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
          <div className="flex h-[68px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-baseline gap-2.5">
              <span className="wordmark text-[15px] leading-none lg:hidden">Oil and Gas Outlook</span>
              <h1 className="heading truncate max-lg:hidden">{current.label}</h1>
              <span className="body truncate max-xl:hidden">
                {current.blurb}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <RangeSelector className="max-md:hidden" />
              <span className="eyebrow max-lg:hidden">to {dataTo}</span>
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="pill shrink-0"
              >
                <ExternalLink size={13} aria-hidden /> <span className="max-sm:hidden">Source</span>
              </a>
              <ThemeButton />
            </div>
          </div>

          {/* mobile / tablet nav rail */}
          <div className="flex items-center gap-1 overflow-x-auto border-t-[0.8px] border-[var(--rule)] px-3 py-2 lg:hidden">
            <RangeSelector className="mr-2 shrink-0 md:hidden" />
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

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-6">
          <div className="mb-4 xl:hidden">
            <h2 className="heading text-[18px] leading-6 lg:hidden">{current.label}</h2>
            <p className="body mt-1.5 max-w-[72ch]">{current.blurb}</p>
          </div>
          {current.content}
        </main>
      </div>
    </div>
    </RangeProvider>
  );
}

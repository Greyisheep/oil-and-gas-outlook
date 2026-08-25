"use client";

import { useState, type ReactNode } from "react";
import {
  Droplets, TrendingUp, Ship, Layers, SlidersHorizontal, FlaskConical,
  PanelLeftClose, PanelLeftOpen, ExternalLink,
} from "lucide-react";

export type SectionId =
  | "production" | "prices" | "shipping" | "drilling" | "outlook" | "method";

export type Section = {
  id: SectionId;
  label: string;
  group: string;
  blurb: string;
  content: ReactNode;
};

const ICONS: Record<SectionId, typeof Droplets> = {
  production: Droplets,
  prices: TrendingUp,
  shipping: Ship,
  drilling: Layers,
  outlook: SlidersHorizontal,
  method: FlaskConical,
};

function ThemeButton() {
  const [dark, setDark] = useState(false);
  return (
    <button
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
      }}
      className="eyebrow rounded-sm border border-[var(--rule)] px-2.5 py-2 hover:bg-secondary
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
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
    <div className="flex min-h-screen">
      {/* ── sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--card)]
                    lg:flex ${collapsed ? "w-[64px]" : "w-[248px]"}`}
      >
        <div className={`flex h-[61px] items-center border-b border-[var(--rule)] ${collapsed ? "justify-center px-2" : "px-4"}`}>
          {collapsed ? (
            <span className="wordmark text-[17px] leading-none text-[var(--primary)]">BL</span>
          ) : (
            <div className="min-w-0">
              <div className="wordmark text-[16px] leading-none">Barrel Ledger</div>
              <div className="eyebrow mt-1.5 leading-none">Nigeria · OPEC primary data</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          {groups.map((g) => (
            <div key={g} className="mb-5">
              {!collapsed && <div className="eyebrow mb-2 px-2.5">{g}</div>}
              <div className="flex flex-col gap-0.5">
                {sections.filter((s) => s.group === g).map((s) => {
                  const Icon = ICONS[s.id];
                  const on = s.id === active;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActive(s.id)}
                      aria-current={on ? "page" : undefined}
                      title={collapsed ? s.label : undefined}
                      className={`navitem ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      <Icon size={15} strokeWidth={2} className="shrink-0" aria-hidden />
                      {!collapsed && <span className="truncate">{s.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--rule)] p-2.5">
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
        <header className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[var(--card)]/95 backdrop-blur">
          <div className="flex h-[61px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-baseline gap-2.5">
              <span className="wordmark text-[15px] leading-none lg:hidden">Barrel Ledger</span>
              <h1 className="display truncate text-[17px] leading-none max-lg:hidden">{current.label}</h1>
              <span className="truncate text-[12.5px] leading-none text-muted-foreground max-xl:hidden">
                {current.blurb}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="eyebrow max-sm:hidden">Data to {dataTo}</span>
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="eyebrow flex items-center gap-1.5 rounded-sm border border-[var(--rule)] px-2.5 py-2
                           hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                <ExternalLink size={13} aria-hidden /> <span className="max-sm:hidden">Source</span>
              </a>
              <ThemeButton />
            </div>
          </div>

          {/* mobile / tablet nav rail */}
          <div className="flex gap-1 overflow-x-auto border-t border-[var(--rule)] px-3 py-2 lg:hidden">
            {sections.map((s) => {
              const Icon = ICONS[s.id];
              const on = s.id === active;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  aria-current={on ? "page" : undefined}
                  className="navitem w-auto shrink-0 whitespace-nowrap"
                >
                  <Icon size={14} aria-hidden />
                  {s.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 xl:hidden">
            <h2 className="display text-[19px] leading-tight lg:hidden">{current.label}</h2>
            <p className="mt-1 max-w-[70ch] text-[13px] leading-[1.55] text-muted-foreground">{current.blurb}</p>
          </div>
          {current.content}
        </main>
      </div>
    </div>
  );
}

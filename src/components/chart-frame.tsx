"use client";
import { useState, type ReactNode } from "react";

export type LegendItem = { label: string; color: string; dash?: boolean };

/**
 * Chart panel. Title and legend lead; the explanatory note is secondary and
 * collapsible so a wall of prose never sits between the reader and the data.
 */
export function ChartFrame({
  n, title, note, source, legend, children, className = "", defaultOpen = false,
}: {
  n: string; title: string; note?: ReactNode; source?: string;
  legend?: LegendItem[]; children: ReactNode; className?: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`panel flex flex-col ${className}`}>
      <header className="flex items-center gap-2 px-4 pt-3.5 pb-2.5">
        <span className="eyebrow shrink-0 text-[var(--brass)]">{n}</span>
        <h2 className="display truncate text-[14.5px] leading-tight">{title}</h2>
        {note && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="eyebrow ml-auto shrink-0 rounded-sm border border-[var(--rule)] px-2 py-1.5
                       hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-[var(--ring)]"
          >
            {open ? "Hide note" : "Note"}
          </button>
        )}
      </header>

      {note && open && (
        <p className="mb-1 max-w-[76ch] px-4 text-[12.5px] leading-[1.55] text-muted-foreground">
          {note}
        </p>
      )}

      {/* legend always present for >=2 series: identity is never colour-alone */}
      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 pb-2.5 pt-1">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <svg width="14" height="8" aria-hidden="true" className="shrink-0">
                <line x1="0" y1="4" x2="14" y2="4" stroke={l.color} strokeWidth="2.5"
                      strokeDasharray={l.dash ? "3 2.5" : undefined} strokeLinecap="round" />
              </svg>
              {l.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 px-1.5 pb-2">{children}</div>

      {source && (
        <footer className="border-t border-[var(--rule)] px-4 py-2">
          <p className="source">{source}</p>
        </footer>
      )}
    </section>
  );
}

"use client";
import { useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";

export type LegendItem = { label: string; color: string; dash?: boolean };

/**
 * Chart panel with two tiers of text.
 *
 *   plain  - one short sentence in business language, always visible.
 *   detail - how it was worked out, behind an info toggle for the minority
 *            who want it. Nothing in `plain` should require it.
 */
export function ChartFrame({
  n, title, plain, detail, source, legend, children, className = "",
}: {
  n: string;
  title: string;
  plain?: ReactNode;
  detail?: ReactNode;
  source?: string;
  legend?: LegendItem[];
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`panel relative flex flex-col ${className}`}>
      <header className="px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="eyebrow shrink-0 text-[var(--brass)]">{n}</span>
          <h2 className="display truncate text-[14.5px] leading-tight">{title}</h2>
          {detail && (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Hide how this works" : "How this works"}
              className={`ml-auto shrink-0 rounded-sm border p-1.5 transition-colors
                          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${
                open
                  ? "border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "border-[var(--rule)] text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Info size={13} aria-hidden />
            </button>
          )}
        </div>
        {plain && (
          <p className="mt-1.5 max-w-[74ch] text-[12.5px] leading-[1.5] text-muted-foreground">
            {plain}
          </p>
        )}
      </header>

      {/* method, on demand */}
      {detail && open && (
        <div className="mx-4 mb-2.5 rounded-sm border border-[var(--rule)] bg-[var(--secondary)] px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="eyebrow">How this works</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X size={12} aria-hidden />
            </button>
          </div>
          <div className="max-w-[80ch] text-[12px] leading-[1.6] text-muted-foreground">{detail}</div>
        </div>
      )}

      {/* legend always present for >=2 series: identity is never colour-alone */}
      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 pb-2.5">
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

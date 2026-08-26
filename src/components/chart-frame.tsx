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
    <section className={`panel relative flex flex-col p-3 ${className}`}>
      <header className="px-2 pt-1.5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 text-[13px] font-medium leading-5 text-muted-foreground">{n}</span>
          <h2 className="display truncate">{title}</h2>
          {detail && (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Hide how this works" : "How this works"}
              className="pill ml-auto shrink-0"
            >
              <Info size={14} aria-hidden />
              Note
            </button>
          )}
        </div>
        {plain && <p className="body mt-2 max-w-[78ch]">{plain}</p>}
      </header>

      {/* method, on demand */}
      {detail && open && (
        <div className="mx-2 mb-3 rounded-[var(--radius-plot)] border-[0.8px] border-[var(--rule)] bg-[var(--secondary)] px-4 py-3">
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
          <div className="body max-w-[82ch]">{detail}</div>
        </div>
      )}

      {/* legend always present for >=2 series: identity is never colour-alone */}
      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-2 pb-2.5">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-2 text-[13px] leading-5 text-muted-foreground">
              <svg width="14" height="8" aria-hidden="true" className="shrink-0">
                <line x1="0" y1="4" x2="14" y2="4" stroke={l.color} strokeWidth="2.5"
                      strokeDasharray={l.dash ? "3 2.5" : undefined} strokeLinecap="round" />
              </svg>
              {l.label}
            </span>
          ))}
        </div>
      )}

      <div className="well flex-1 overflow-hidden">{children}</div>

      {source && (
        <footer className="border-t border-[var(--rule)] px-4 py-2">
          <p className="source">{source}</p>
        </footer>
      )}
    </section>
  );
}

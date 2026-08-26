"use client";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

export type LegendItem = { label: string; color: string; dash?: boolean };

/**
 * Chart panel.
 *
 *   plain  - one short sentence, always visible. Short enough that nobody
 *            needs to open anything to understand the chart.
 *   detail - how it was worked out. On a hover/focus tooltip, not a toggle,
 *            because a note this short no longer needs hiding.
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
  return (
    <section className={`panel relative flex flex-col p-3 ${className}`}>
      <header className="px-2 pt-1.5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 text-[13px] font-medium leading-5 text-muted-foreground">{n}</span>
          <h2 className="display truncate">{title}</h2>

          {detail && (
            <span className="group relative ml-auto shrink-0">
              <button
                type="button"
                aria-label="How this was worked out"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground
                           transition-colors hover:bg-secondary hover:text-foreground
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                <Info size={15} aria-hidden />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-8 z-30 w-[300px] rounded-[12px]
                           border-[0.8px] border-[var(--rule)] bg-[var(--popover)] px-3.5 py-3
                           text-[13px] leading-5 text-muted-foreground opacity-0 shadow-lg
                           transition-opacity duration-100
                           group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {detail}
              </span>
            </span>
          )}
        </div>

        {plain && <p className="body mt-1.5 max-w-[68ch]">{plain}</p>}
      </header>

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

      {source && <p className="caption px-4 pb-1 pt-3 text-center">{source}</p>}
    </section>
  );
}

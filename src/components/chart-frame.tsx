"use client";
import { useState, type ReactNode } from "react";

export type LegendItem = { label: string; color: string; dash?: boolean };

export function ChartFrame({
  n, title, note, source, legend, table, children, className = "",
}: {
  n: string; title: string; note?: ReactNode; source: string;
  legend?: LegendItem[]; table?: ReactNode; children: ReactNode; className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={`panel flex flex-col ${className}`}>
      <header className="flex items-start justify-between gap-4 px-4 pt-3.5 pb-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="eyebrow text-[var(--brass)]">{n}</span>
            <h2 className="font-[family-name:var(--font-plex-serif)] text-[15px] font-semibold leading-tight">
              {title}
            </h2>
          </div>
          {note && <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted-foreground max-w-[62ch]">{note}</p>}
        </div>
        {table && (
          <button
            onClick={() => setShowTable((v) => !v)}
            className="eyebrow shrink-0 rounded-sm border border-[var(--rule)] px-2 py-1 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            aria-pressed={showTable}
          >
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </header>

      {/* legend is always present for >=2 series: identity is never colour-alone */}
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

      <div className="flex-1 px-1.5 pb-1">
        {showTable && table ? <div className="max-h-[300px] overflow-auto px-2.5">{table}</div> : children}
      </div>

      <footer className="rule-t mx-4 mt-1 py-2">
        <p className="source">{source}</p>
      </footer>
    </section>
  );
}

"use client";
import type { ReactNode } from "react";
import { useWindow, useRange } from "./range";

export type Col = {
  key: string;
  label: string;
  unit?: string;
  align?: "left" | "right";
  dp?: number;
  emphasis?: boolean;
  /** Draw a proportional bar behind the value, scaled to this column's range. */
  bar?: boolean;
};

export type Cell = number | string | null | undefined;

/**
 * Full data table. Sticky header and first column, tabular numerics, optional
 * in-cell magnitude bars, and it follows the shared time range.
 */
export function DataTable({
  n, title, note, source, cols, rows, maxHeight = 460, windowed = true,
}: {
  n: string;
  title: string;
  note?: ReactNode;
  source: string;
  cols: Col[];
  rows: Record<string, Cell>[];
  maxHeight?: number;
  windowed?: boolean;
}) {
  const all = rows;
  const windowedRows = useWindow(rows);
  const shown = windowed ? windowedRows : all;
  const { range } = useRange();

  // per-column extent, so a bar is scaled against its own column only
  const extent: Record<string, [number, number]> = {};
  for (const c of cols) {
    if (!c.bar) continue;
    const vals = shown.map((r) => r[c.key]).filter((v): v is number => typeof v === "number");
    if (vals.length) extent[c.key] = [Math.min(...vals), Math.max(...vals)];
  }

  return (
    <section className="flex flex-col">
      <header className="px-4 pt-3.5 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="eyebrow text-[var(--brass)]">{n}</span>
          <h2 className="display">{title}</h2>
          <span className="eyebrow ml-auto shrink-0">
            {shown.length} of {all.length} rows
            {windowed && range !== "all" ? ` · ${range.toUpperCase()}` : ""}
          </span>
        </div>
        {note && (
          <p className="caption mt-1 max-w-[92ch]">{note}</p>
        )}
      </header>

      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full border-separate border-spacing-0 text-[14px] leading-5">
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`sticky top-0 z-20 whitespace-nowrap border-b-[0.8px] border-[var(--rule)]
                              bg-[var(--card)] px-3.5 py-2.5 text-[14px] font-medium leading-5 text-foreground ${
                    (c.align ?? "right") === "left" ? "text-left" : "text-right"
                  } ${i === 0 ? "left-0 z-30" : ""}`}
                >
                  {c.label}
                  {c.unit && <span className="ml-1 font-normal text-[var(--lighter)]">{c.unit}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {shown.map((r, ri) => (
              <tr key={ri} className="group">
                {cols.map((c, ci) => {
                  const v = r[c.key];
                  const isNum = typeof v === "number";
                  const txt =
                    v == null || v === ""
                      ? "·"
                      : isNum
                        ? v.toLocaleString("en-US", {
                            minimumFractionDigits: c.dp ?? 0,
                            maximumFractionDigits: c.dp ?? 0,
                          })
                        : v;
                  const ext = extent[c.key];
                  const pct =
                    c.bar && isNum && ext && ext[1] !== ext[0]
                      ? ((v - ext[0]) / (ext[1] - ext[0])) * 100
                      : null;
                  return (
                    <td
                      key={c.key}
                      className={`relative whitespace-nowrap border-b-[0.8px] border-[var(--rule)]/55 px-3.5 py-2
                                  group-hover:bg-secondary/70 ${
                        (c.align ?? "right") === "left" ? "text-left" : "text-right"
                      } ${v == null ? "text-[var(--lighter)]" : ""} ${
                        ci === 0 ? "sticky left-0 z-10 bg-[var(--card)] group-hover:bg-secondary/70" : ""
                      }`}
                    >
                      {pct != null && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-[3px] right-0 rounded-[2px]"
                          style={{ width: `${Math.max(2, pct)}%`, background: "var(--chart-1)", opacity: 0.14 }}
                        />
                      )}
                      {c.emphasis && v != null ? (
                        <span className="relative inline-block rounded-[6px] bg-[var(--plot)] px-2 py-[3px] font-medium text-foreground">
                          {txt}
                        </span>
                      ) : (
                        <span className="relative">{txt}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="caption pt-3 text-center">{source}</p>
    </section>
  );
}

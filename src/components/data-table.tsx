import type { ReactNode } from "react";

export type Col = {
  key: string;
  label: string;
  unit?: string;
  align?: "left" | "right";
  dp?: number;
  emphasis?: boolean;
};

export type Cell = number | string | null | undefined;

/**
 * Full data table. Sticky header, tabular numerics, scrolls inside its own
 * container so the page never scrolls sideways.
 */
export function DataTable({
  n, title, note, source, cols, rows, maxHeight = 460,
}: {
  n: string;
  title: string;
  note?: ReactNode;
  source: string;
  cols: Col[];
  rows: Record<string, Cell>[];
  maxHeight?: number;
}) {
  return (
    <section className="panel flex flex-col">
      <header className="px-4 pt-3.5 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="eyebrow text-[var(--brass)]">{n}</span>
          <h2 className="display text-[14.5px] leading-tight">{title}</h2>
          <span className="eyebrow ml-auto shrink-0">{rows.length} rows</span>
        </div>
        {note && (
          <p className="mt-1.5 max-w-[76ch] text-[12.5px] leading-[1.5] text-muted-foreground">{note}</p>
        )}
      </header>

      <div className="overflow-auto border-t border-[var(--rule)]" style={{ maxHeight }}>
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 z-10 bg-[var(--card)]">
            <tr className="border-b border-[var(--rule)]">
              {cols.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`eyebrow whitespace-nowrap px-3 py-2 ${
                    (c.align ?? "right") === "left" ? "text-left" : "text-right"
                  }`}
                >
                  {c.label}
                  {c.unit && <span className="ml-1 opacity-60 normal-case">{c.unit}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[var(--rule)]/55 last:border-0 hover:bg-secondary/60">
                {cols.map((c) => {
                  const v = r[c.key];
                  const txt =
                    v == null || v === ""
                      ? "·"
                      : typeof v === "number"
                        ? v.toLocaleString("en-US", {
                            minimumFractionDigits: c.dp ?? 0,
                            maximumFractionDigits: c.dp ?? 0,
                          })
                        : v;
                  return (
                    <td
                      key={c.key}
                      className={`whitespace-nowrap px-3 py-1.5 ${
                        (c.align ?? "right") === "left" ? "text-left font-sans" : "text-right"
                      } ${c.emphasis ? "font-medium text-foreground" : ""} ${
                        v == null ? "text-muted-foreground" : ""
                      }`}
                    >
                      {txt}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-[var(--rule)] px-4 py-2">
        <p className="source">{source}</p>
      </footer>
    </section>
  );
}

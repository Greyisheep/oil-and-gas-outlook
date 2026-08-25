"use client";

export const GRID = "var(--grid)";
export const INK3 = "var(--muted-foreground)";

export const AXIS = {
  stroke: GRID,
  tickLine: false as const,
  tick: { fill: INK3, fontSize: 10.5, fontFamily: "var(--font-plex-mono)" },
};

export type TipRow = { name?: string; value?: number | string | null; color?: string };
export type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: (TipRow & { payload?: Record<string, unknown> })[];
  unit?: string;
  prefix?: string;
  dp?: number;
  /** Show the change against the previous point, when the row carries one. */
  deltaKey?: string;
};

const nf = (v: number, dp: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/**
 * One tooltip for every chart: month header, a swatch per series, aligned
 * numerics, and the month-on-month change where the series provides it.
 */
export function Tip({ active, payload, label, unit = "", prefix = "", dp = 0, deltaKey }: TipProps) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value != null);
  if (!rows.length) return null;

  return (
    <div
      className="min-w-[186px] rounded-[3px] border border-[var(--rule)] bg-[var(--popover)] px-3 py-2.5"
      style={{ boxShadow: "0 4px 14px -4px rgb(0 0 0 / 0.14), 0 1px 3px rgb(0 0 0 / 0.06)" }}
    >
      <div className="eyebrow mb-2 border-b border-[var(--rule)] pb-1.5">{label}</div>
      <div className="flex flex-col gap-1.5">
        {rows.map((p) => {
          const d = deltaKey ? (p.payload?.[deltaKey] as number | undefined) : undefined;
          return (
            <div key={String(p.name)} className="flex items-baseline justify-between gap-4">
              <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <span
                  className="inline-block h-[3px] w-3.5 shrink-0 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="truncate">{p.name}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2 font-mono tabular-nums">
                <span className="text-[12.5px] font-medium">
                  {prefix}
                  {nf(Number(p.value), dp)}
                  {unit}
                </span>
                {d != null && (
                  <span
                    className="text-[10.5px]"
                    style={{ color: d >= 0 ? "var(--chart-2)" : "var(--chart-3)" }}
                  >
                    {d >= 0 ? "▲" : "▼"} {nf(Math.abs(d), dp)}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Dashed crosshair used across every time-series chart. */
export const CURSOR = { stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" };
export const BAR_CURSOR = { fill: "var(--secondary)" };

/** Emphasised endpoint dot, so the latest value reads without a label. */
export const endDot = (color: string) => ({
  r: 3.5,
  fill: color,
  stroke: "var(--card)",
  strokeWidth: 2,
});

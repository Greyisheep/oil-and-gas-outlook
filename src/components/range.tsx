"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { MONTHS } from "@/lib/opec-data";

export const RANGES = [
  { key: "6m", label: "6M", months: 6 },
  { key: "12m", label: "12M", months: 12 },
  { key: "18m", label: "18M", months: 18 },
  { key: "all", label: "All", months: MONTHS.length },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

const Ctx = createContext<{ range: RangeKey; setRange: (r: RangeKey) => void; months: number }>({
  range: "all", setRange: () => {}, months: MONTHS.length,
});

export function RangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<RangeKey>("all");
  const months = RANGES.find((r) => r.key === range)!.months;
  return <Ctx.Provider value={{ range, setRange, months }}>{children}</Ctx.Provider>;
}

export const useRange = () => useContext(Ctx);

/** Keep the last n entries of a series aligned to the month spine. */
export function useWindow<T>(rows: T[]): T[] {
  const { months } = useRange();
  return months >= rows.length ? rows : rows.slice(rows.length - months);
}

export function RangeSelector({ className = "" }: { className?: string }) {
  const { range, setRange } = useRange();
  return (
    <div
      role="group"
      aria-label="Time range"
      className={`inline-flex items-center gap-1 rounded-full border-[0.8px] border-[var(--rule)] p-1 ${className}`}
    >
      {RANGES.map((r) => {
        const on = r.key === range;
        return (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            aria-pressed={on}
            className={`rounded-full px-3 py-1 text-[13px] font-medium leading-5 transition-colors ${
              on
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            } focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

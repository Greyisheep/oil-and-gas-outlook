import { fmt } from "@/lib/model";

export type Kpi = { label: string; value: string; sub: string; tone?: "good" | "warn" | "bad" };

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <div className="panel grid divide-y divide-[var(--rule)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5
                    sm:[&>*:not(:nth-child(-n+2))]:border-t sm:[&>*:nth-child(even)]:border-l
                    lg:[&>*]:border-t-0 lg:[&>*:not(:first-child)]:border-l lg:[&>*]:border-[var(--rule)]">
      {items.map((k) => (
        <div key={k.label} className="flex flex-col gap-1 px-4 py-3.5 border-[var(--rule)]">
          <span className="eyebrow">{k.label}</span>
          <span
            className="font-mono text-[21px] font-medium leading-none tabular-nums"
            style={
              k.tone
                ? { color: k.tone === "good" ? "var(--chart-2)" : k.tone === "bad" ? "var(--chart-3)" : "var(--chart-1)" }
                : undefined
            }
          >
            {k.value}
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">{k.sub}</span>
        </div>
      ))}
    </div>
  );
}
export { fmt };

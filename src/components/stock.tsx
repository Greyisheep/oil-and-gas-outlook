import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { STOCK } from "@/lib/stock";

/**
 * Flow balance first: what arrived against what left, per month. The gap
 * between the two bars is the inventory movement, which is the number a
 * sourcing desk cares about and nobody reports directly.
 */
export function StockFlows() {
  const max = Math.max(...STOCK.months.map((m) => Math.max(m.receipts, m.truckout))) * 1.06;

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-1">
      {STOCK.months.map((m) => {
        const net = +(m.receipts - m.truckout).toFixed(1);
        return (
          <div key={m.month} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="display">{m.month}</span>
              <span className="flex items-center gap-1 text-[13px] font-medium tabular-nums"
                    style={{ color: net >= 0 ? "var(--chart-2)" : "var(--chart-3)" }}>
                {net >= 0 ? <ArrowUpRight size={14} aria-hidden /> : <ArrowDownRight size={14} aria-hidden />}
                {net >= 0 ? "+" : ""}{net} m litres a day
              </span>
            </div>

            {[
              { k: "Received", v: m.receipts, c: "var(--chart-4)" },
              { k: "Trucked out", v: m.truckout, c: "var(--chart-1)" },
            ].map((row) => (
              <div key={row.k} className="flex items-center gap-2.5">
                <span className="w-[84px] shrink-0 text-[12.5px] text-[var(--muted-foreground)]">{row.k}</span>
                <div className="h-[9px] flex-1 rounded-full bg-[var(--track)]">
                  <div className="h-[9px] rounded-full"
                       style={{ width: `${(row.v / max) * 100}%`, background: row.c, opacity: 0.85 }} />
                </div>
                <span className="w-[42px] shrink-0 text-right text-[12.5px] tabular-nums">{row.v}</span>
              </div>
            ))}

            <span className="caption">
              {net >= 0
                ? `stock building at ${net} m litres a day, ${Math.round(net * m.days)} m over the month`
                : `stock drawing down ${Math.abs(net)} m litres a day`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The reconciliation. Three published numbers, three different answers to
 * "did stock rise or fall", because the cover denominator is never stated.
 */
export function StockReconciliation() {
  const span = Math.max(...STOCK.readings.map((r) => Math.abs(r.value)));

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-4 pt-1">
      <div className="flex items-baseline gap-2">
        <span className="text-[13px] text-[var(--muted-foreground)]">Days of cover moved</span>
        <span className="text-[15px] font-semibold tabular-nums">
          {STOCK.coverFrom} → {STOCK.coverTo}
        </span>
        <span className="caption">against a {STOCK.target}-day target</span>
      </div>

      <div className="flex flex-col gap-3 border-t-[0.8px] border-[var(--rule)] pt-3">
        {STOCK.readings.map((r) => {
          const up = r.value >= 0;
          const w = (Math.abs(r.value) / span) * 46;
          return (
            <div key={r.label} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] font-medium">{r.label}</span>
                <span className="text-[13px] font-semibold tabular-nums"
                      style={{ color: up ? "var(--chart-2)" : "var(--chart-3)" }}>
                  {up ? "+" : ""}{r.value.toLocaleString("en-US")} m litres
                </span>
              </div>
              <div className="relative h-4">
                <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[var(--track)]" />
                <div className="absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full"
                     style={{ background: up ? "var(--chart-2)" : "var(--chart-3)",
                              width: `${w}%`, left: up ? "50%" : undefined, right: up ? undefined : "50%" }} />
                <div className="absolute bottom-0 left-1/2 top-0 w-[1.5px] -translate-x-1/2
                                bg-[var(--foreground)] opacity-60" aria-hidden />
              </div>
              <span className="caption">{r.basis}</span>
            </div>
          );
        })}
      </div>

      <p className="caption border-t-[0.8px] border-[var(--rule)] pt-2.5">
        Same months, same regulator, three answers. Two of them disagree on whether stock rose at
        all. The denominator behind days of cover is not published, which is what leaves the
        question open.
      </p>
    </div>
  );
}

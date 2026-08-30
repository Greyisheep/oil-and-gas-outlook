import type { Stage } from "@/lib/funnels";

/**
 * Attrition funnel as stepped horizontal bars.
 *
 * Deliberately NOT the tapered marketing-funnel shape: that form encodes area
 * that means nothing and makes small stages unreadable. Bar length is the
 * measure, and the conversion rate is stated between stages rather than left
 * to be eyeballed.
 *
 * Where a stage carries both a count and a size (licences and capacity), the
 * bar is scaled by size, because that is the quantity that actually attrites.
 */
export function Funnel({
  stages, scaleBy = "size", barLabel,
}: { stages: Stage[]; scaleBy?: "size" | "count"; barLabel: string }) {
  const val = (s: Stage) => (scaleBy === "size" ? (s.size ?? 0) : s.count);
  const max = Math.max(...stages.map(val), 1);
  const fmt = (n: number) => n.toLocaleString("en-US");

  const tone = (s: Stage) =>
    s.tone === "live" ? "var(--chart-2)"
    : s.tone === "dead" ? "var(--chart-3)"
    : s.tone === "pending" ? "var(--chart-1)"
    : "var(--muted-foreground)";

  return (
    <div className="flex flex-col px-4 pb-4 pt-1">
      <p className="caption mb-3">{barLabel}</p>

      {stages.map((s, i) => {
        const v = val(s);
        const pct = max ? (v / max) * 100 : 0;
        const prev = i > 0 ? val(stages[i - 1]) : null;
        const conv = prev && prev > 0 ? (v / prev) * 100 : null;

        return (
          <div key={s.label}>
            {/* conversion between this stage and the one above */}
            {conv !== null && prev !== null && (
              <div className="flex items-center gap-2 py-1.5 pl-[3px]">
                <span className="h-3 w-[1.5px] shrink-0 bg-[var(--rule)]" aria-hidden />
                <span className="caption">
                  {conv.toFixed(conv < 10 ? 1 : 0)}% carried through
                  {prev - v > 0 && (
                    <span className="text-[var(--fade)]">
                      {" "}· {fmt(Math.round(prev - v))} {scaleBy === "size" ? s.sizeUnit ?? "" : s.countUnit} lost
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="display truncate">{s.label}</span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums">
                  {fmt(s.count)} <span className="font-normal text-[var(--fade)]">{s.countUnit}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-6 flex-1 rounded-[6px] bg-[var(--track)]">
                  <div
                    className="h-6 rounded-[6px]"
                    style={{ width: `${Math.max(pct, v > 0 ? 1.5 : 0)}%`, background: tone(s) }}
                  />
                </div>
                {s.size !== undefined && (
                  <span className="w-[124px] shrink-0 text-right text-[13px] tabular-nums text-[var(--muted-foreground)]">
                    {fmt(s.size)} <span className="text-[var(--fade)]">{s.sizeUnit}</span>
                  </span>
                )}
              </div>

              {s.note && <p className="caption">{s.note}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

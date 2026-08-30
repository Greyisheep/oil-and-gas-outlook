import { REVISION_MODEL as M, THEFT_MODEL as T } from "@/lib/models";

/**
 * Settled-value nowcast. OPEC's first print is unbiased but noisy, so the
 * useful statement is not a corrected number, it is a range.
 */
export function SettledNowcast() {
  const lo = Math.min(...M.provisional.map((p) => p.lo));
  const hi = Math.max(...M.provisional.map((p) => p.hi));
  const pad = 25;
  const x = (v: number) => ((v - lo + pad) / (hi - lo + pad * 2)) * 100;

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-1">
      {M.provisional.map((p) => (
        <div key={p.month} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="display">
              {p.month}
              <span className="font-normal text-[var(--lighter)]">
                {" "}· {p.looks} of 3 looks
              </span>
            </span>
            <span className="text-[13px] tabular-nums text-[var(--muted-foreground)]">
              printed <span className="font-medium text-foreground">{p.current}</span> tb/d
            </span>
          </div>

          <div className="relative h-8">
            <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--track)]" />
            <div
              className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full"
              style={{ left: `${x(p.lo)}%`, width: `${x(p.hi) - x(p.lo)}%`,
                       background: "var(--chart-1)", opacity: 0.34 }}
            />
            <div
              className="absolute top-1/2 h-4 w-[2.5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${x(p.current)}%`, background: "var(--chart-1)" }}
            />
            <span className="absolute top-0 -translate-x-1/2 text-[11px] tabular-nums text-[var(--lighter)]"
                  style={{ left: `${x(p.lo)}%` }}>{p.lo.toFixed(0)}</span>
            <span className="absolute top-0 -translate-x-1/2 text-[11px] tabular-nums text-[var(--lighter)]"
                  style={{ left: `${x(p.hi)}%` }}>{p.hi.toFixed(0)}</span>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t-[0.8px] border-[var(--rule)] pt-3">
        <span className="caption">Bias <span className="tabular-nums text-foreground">{M.mean > 0 ? "+" : ""}{M.mean} tb/d</span></span>
        <span className="caption">Spread <span className="tabular-nums text-foreground">± {M.sd}</span></span>
        <span className="caption">Fitted on <span className="tabular-nums text-foreground">{M.n}</span> settled months</span>
        <span className="caption ml-auto">8 times in 10</span>
      </div>
    </div>
  );
}

/** Why the print cannot simply be corrected: nothing predicts the revision. */
export function RevisionPredictors() {
  const rows = [
    { label: "Size of the first print", r: M.rLevel },
    { label: "Last month's revision", r: M.rSerial },
  ];
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
      {rows.map((row) => {
        const frac = Math.abs(row.r) / M.rCrit;
        return (
          <div key={row.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-medium">{row.label}</span>
              <span className="text-[13px] tabular-nums text-[var(--muted-foreground)]">
                r = {row.r}
              </span>
            </div>
            <div className="relative h-5 rounded-[5px] bg-[var(--track)]">
              <div className="h-5 rounded-[5px]"
                   style={{ width: `${Math.min(frac, 1) * 100}%`, background: "var(--muted-foreground)", opacity: 0.45 }} />
              <div className="absolute bottom-0 top-0 w-[1.5px] bg-[var(--chart-3)]" style={{ left: "100%" }} />
            </div>
          </div>
        );
      })}
      <p className="caption">
        The red line is the strength a correlation would need to be real at this sample size
        (r = {M.rCrit}, n = {M.n}). Neither candidate gets close, so the revision is noise.
      </p>
    </div>
  );
}

/**
 * Theft against the production gap. The decline is real and large; the
 * argument is about what is left, not what was recovered.
 */
export function TheftDecomposition() {
  const max = T.series[0].bpd;
  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-1">
      <div className="flex flex-col gap-2">
        {T.series.map((s, i) => {
          const prev = i > 0 ? T.series[i - 1].bpd : null;
          const yoy = prev ? ((s.bpd / prev - 1) * 100) : null;
          return (
            <div key={s.year} className="flex items-center gap-3">
              <span className="w-[38px] shrink-0 text-[13px] tabular-nums text-[var(--muted-foreground)]">{s.year}</span>
              <div className="h-5 flex-1 rounded-[5px] bg-[var(--track)]">
                <div className="h-5 rounded-[5px]"
                     style={{ width: `${(s.bpd / max) * 100}%`,
                              background: i === 0 ? "var(--chart-3)" : "var(--chart-1)",
                              opacity: i === 0 ? 0.85 : 0.85 - i * 0.06 }} />
              </div>
              <span className="w-[62px] shrink-0 text-right text-[13px] tabular-nums">
                {(s.bpd / 1000).toFixed(1)}k
              </span>
              <span className="w-[52px] shrink-0 text-right text-[12px] tabular-nums text-[var(--lighter)]">
                {yoy !== null ? `${yoy.toFixed(0)}%` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* What is missing NOW, split into its two real causes. Recovered theft
          is context below, not a slice: it is not part of the shortfall. */}
      <div className="flex flex-col gap-2 border-t-[0.8px] border-[var(--rule)] pt-3">
        <span className="caption">
          The {(T.gap / 1000).toFixed(0)}k bpd still missing from the budget benchmark, by cause
        </span>
        <div className="flex h-8 overflow-hidden rounded-[6px]">
          <div className="flex items-center justify-center"
               style={{ width: `${T.remainingShareOfGap}%`, background: "var(--chart-3)", minWidth: 34 }}>
            <span className="text-[11px] font-semibold text-white">{T.remainingShareOfGap}%</span>
          </div>
          <div className="flex flex-1 items-center px-3" style={{ background: "var(--track)" }}>
            <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
              {T.undrilledShareOfGap}% · {(T.undrilled / 1000).toFixed(0)}k bpd of production never brought online
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="caption">
            <span className="mr-1 inline-block h-2 w-2 rounded-[1px] align-middle" style={{ background: "var(--chart-3)" }} />
            Still being stolen · {T.remaining.toLocaleString("en-US")} bpd
          </span>
        </div>
        <p className="caption pt-1">
          Recovered theft is not a slice of this bar, because it is no longer missing. Its effect is
          the size of the bar itself: without the {(T.recovered / 1000).toFixed(0)}k bpd already
          recovered, the shortfall would be {(T.gapWithoutRecovery / 1000).toFixed(0)}k rather
          than {(T.gap / 1000).toFixed(0)}k.
        </p>
      </div>
    </div>
  );
}

/**
 * The annual reserves position, NUPRC, as at 1 January 2026.
 *
 * Published: the closing positions, their component splits, the percentage
 * changes and the reserves life index.
 *
 * NOT published: the volume produced during the year, or a reserve
 * replacement ratio. The release attributes the oil change to "2025
 * production and reserves update due to field performance and technical
 * evaluation" without separating those two effects, so the produced and
 * added legs of a replacement calculation cannot be recovered from it. This
 * panel therefore shows the net change only, and says so. Splitting it would
 * mean pairing NUPRC's crude-plus-condensate reserves basis with a
 * production figure from another basis, which is the same mistake logged as
 * a basis mismatch elsewhere in this project.
 *
 * Opening positions: NUPRC reported 37.28bn for oil at 1 Jan 2025, so that
 * published figure is used rather than a derived one. No 2025 gas position
 * was reported alongside, so gas is recovered by inverting the published
 * percentage: 215.19 / 1.0221 = 210.54. The same inversion on oil gives
 * 37.286, agreeing with the reported 37.28 to 0.006bn, which is what gives
 * confidence in the gas figure. Derived openings are marked in the panel.
 */

const R = [
  {
    name: "Oil and condensate",
    unit: "bn bbl",
    open: 37.28, close: 37.01, pct: -0.74, openPublished: true,
    life: 59,
    split: [
      { label: "Crude oil", value: 31.09 },
      { label: "Condensate", value: 5.92 },
    ],
    cause: "2025 production, and field-performance revisions",
  },
  {
    name: "Natural gas",
    unit: "tcf",
    open: 210.54, close: 215.19, pct: 2.21, openPublished: false,
    life: 85,
    split: [
      { label: "Non-associated", value: 114.98 },
      { label: "Associated", value: 100.21 },
    ],
    cause: "new discoveries and improved reservoir studies",
  },
];

const SCALE = 3; // % either side of zero

export function ReservesChange() {
  const half = (p: number) => Math.min(Math.abs(p) / SCALE, 1) * 50;

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-1">
      {R.map((r) => {
        const up = r.pct >= 0;
        const colour = up ? "var(--chart-2)" : "var(--chart-3)";
        return (
          <div key={r.name} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="display">{r.name}</span>
              <span className="text-[13px] tabular-nums text-[var(--muted-foreground)]">
                {r.open.toFixed(2)}
                {!r.openPublished && <span className="text-[var(--fade)]"> est.</span>}
                {" → "}
                <span className="font-medium text-foreground">{r.close.toFixed(2)}</span>{" "}
                <span className="text-[var(--fade)]">{r.unit}</span>
              </span>
            </div>

            {/* diverging bar on percentage change, zero in the centre */}
            <div className="relative h-7 rounded-[6px] bg-[var(--track)]">
              <div className="absolute bottom-0 left-1/2 top-0 w-[1.5px] -translate-x-1/2 bg-[var(--rule)]" aria-hidden />
              <div
                className="absolute top-1/2 h-5 -translate-y-1/2 rounded-[5px]"
                style={{
                  background: colour,
                  width: `${half(r.pct)}%`,
                  left: up ? "50%" : undefined,
                  right: up ? undefined : "50%",
                }}
              />
              <span
                className="absolute top-1/2 -translate-y-1/2 text-[13px] font-medium tabular-nums"
                style={{
                  color: colour,
                  left: up ? `calc(50% + ${half(r.pct)}% + 8px)` : undefined,
                  right: up ? undefined : `calc(50% + ${half(r.pct)}% + 8px)`,
                }}
              >
                {up ? "+" : ""}{r.pct}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {r.split.map((s) => (
                <span key={s.label} className="caption">
                  {s.label} <span className="tabular-nums text-foreground">{s.value}</span>
                </span>
              ))}
              <span className="caption ml-auto">
                Lasts <span className="tabular-nums text-foreground">{r.life}</span> years at current output
              </span>
            </div>
            <p className="caption">{r.cause}</p>
          </div>
        );
      })}

      <p className="caption border-t-[0.8px] border-[var(--rule)] pt-2.5">
        NUPRC publishes the net change only, not the volume produced or the volume added, so no
        replacement ratio can be derived from the release. That gap is the reason this panel stops here.
        The gas opening position is marked est. because NUPRC reported the percentage change without
        the prior-year figure; it is recovered by inverting that percentage.
      </p>
    </div>
  );
}

import { REVISION as R } from "@/lib/revision";

/* Grid geometry. Rows are data months, columns are the report each figure
   appeared in, so the filled cells fall along a diagonal band. */
const CELL = 15, GAP = 2;
const LEFT = 62, TOP = 58;
const W = LEFT + R.vintages.length * (CELL + GAP) + 12;
const H = TOP + R.months.length * (CELL + GAP) + 10;

/* Diverging scale on the revision, capped so one outlier does not flatten
   everything else. Zero is a neutral grey, not a colour. */
const CAP = 40;
function fill(rev: number, look: number) {
  if (look === 0) return { bg: "var(--track)", op: 1 };          // first print
  const t = Math.min(Math.abs(rev) / CAP, 1);
  if (rev === 0) return { bg: "var(--track)", op: 1 };
  return { bg: rev > 0 ? "var(--chart-2)" : "var(--chart-3)", op: 0.18 + t * 0.72 };
}

export function RevisionTriangle() {
  return (
    <div className="overflow-x-auto px-2 pb-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H, minWidth: 640 }}
        role="img"
        aria-label={`Revision grid: ${R.months.length} months of Nigerian production against the ${R.vintages.length} OPEC reports they appeared in. Only ${R.stats.coverage}% of the grid is filled because each report carries three months of history.`}
      >
        {/* column headers, every third vintage so they stay legible */}
        {R.vintages.map((v, i) =>
          i % 3 === 0 ? (
            <text
              key={v}
              x={LEFT + i * (CELL + GAP) + CELL / 2}
              y={TOP - 8}
              transform={`rotate(-52 ${LEFT + i * (CELL + GAP) + CELL / 2} ${TOP - 8})`}
              textAnchor="start"
              className="fill-[var(--lighter)]"
              style={{ fontSize: 11 }}
            >
              {v}
            </text>
          ) : null,
        )}

        {/* row labels, every other month */}
        {R.months.map((m, i) =>
          i % 2 === 0 ? (
            <text
              key={m}
              x={LEFT - 8}
              y={TOP + i * (CELL + GAP) + CELL / 2 + 4}
              textAnchor="end"
              className="fill-[var(--lighter)]"
              style={{ fontSize: 11 }}
            >
              {m}
            </text>
          ) : null,
        )}

        {R.cells.map((c) => {
          const { bg, op } = fill(c.rev, c.look);
          return (
            <rect
              key={`${c.m}-${c.v}`}
              x={LEFT + c.v * (CELL + GAP)}
              y={TOP + c.m * (CELL + GAP)}
              width={CELL} height={CELL} rx={3}
              fill={bg} fillOpacity={op}
              stroke={c.look === 0 ? "var(--muted-foreground)" : "none"}
              strokeOpacity={0.35} strokeWidth={0.8}
            >
              <title>
                {R.months[c.m]} as published in the {R.vintages[c.v]} report: {c.val} tb/d
                {c.look === 0 ? " (first estimate)" : `, ${c.rev > 0 ? "+" : ""}${c.rev} vs first`}
              </title>
            </rect>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-2 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] border-[0.8px] border-[var(--muted-foreground)]/40 bg-[var(--track)]" aria-hidden />
          <span className="caption">First estimate</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px]" style={{ background: "var(--chart-3)", opacity: 0.8 }} aria-hidden />
          <span className="caption">Revised down</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px]" style={{ background: "var(--chart-2)", opacity: 0.8 }} aria-hidden />
          <span className="caption">Revised up</span>
        </span>
        <span className="caption ml-auto">Darker means a larger revision · empty means never published</span>
      </div>
    </div>
  );
}

/** How fast a month settles: the first correction does nearly all the work. */
export function SettleSteps() {
  const steps = [
    { label: "First look to second", v: R.stats.firstStep },
    { label: "Second look to third", v: R.stats.secondStep },
  ];
  const max = Math.max(...steps.map((s) => s.v));
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
      {steps.map((s) => (
        <div key={s.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium">{s.label}</span>
            <span className="text-[13px] tabular-nums text-[var(--muted-foreground)]">
              {s.v} tb/d
            </span>
          </div>
          <div className="h-5 rounded-[5px] bg-[var(--track)]">
            <div className="h-5 rounded-[5px]" style={{ width: `${(s.v / max) * 100}%`, background: "var(--chart-1)" }} />
          </div>
        </div>
      ))}
      <p className="caption">
        Average size of each correction, ignoring direction. After two months the figure is
        effectively final.
      </p>
    </div>
  );
}

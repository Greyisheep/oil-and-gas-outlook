/**
 * Days of national fuel cover, against the 30-day benchmark.
 *
 * A dumbbell rather than a bar: what matters is the distance from the
 * benchmark, in both directions, and a bar can only show one end of that.
 *
 * NMDPRA "State of the Midstream and Downstream Sector" fact sheet,
 * October 2025, extracted from the published PDF.
 */

const BENCHMARK = 30;

const FUELS = [
  { label: "Cooking gas (LPG)", days: 5 },
  { label: "Petrol (PMS)", days: 11 },
  { label: "Aviation fuel (ATK)", days: 15 },
  { label: "Diesel (AGO)", days: 38 },
  { label: "Low pour fuel oil", days: 49 },
];

const MAX = 56;

export function Sufficiency() {
  const x = (d: number) => (d / MAX) * 100;

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
      <div className="relative">
        {/* benchmark rule, labelled once at the top */}
        <div
          className="absolute bottom-0 top-0 w-[1.5px] bg-[var(--rule)]"
          style={{ left: `calc(${x(BENCHMARK)}% )` }}
          aria-hidden
        />
        <div className="flex flex-col gap-3.5">
          {FUELS.map((f) => {
            const short = f.days < BENCHMARK;
            const lo = Math.min(f.days, BENCHMARK), hi = Math.max(f.days, BENCHMARK);
            const colour = short ? "var(--chart-3)" : "var(--chart-2)";
            return (
              <div key={f.label} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium">{f.label}</span>
                  <span className="shrink-0 text-[13px] tabular-nums" style={{ color: colour }}>
                    {short ? "−" : "+"}{Math.abs(f.days - BENCHMARK)} days
                  </span>
                </div>
                <div className="relative h-4">
                  {/* connector between the reading and the benchmark */}
                  <div
                    className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                    style={{ left: `${x(lo)}%`, width: `${x(hi) - x(lo)}%`, background: colour, opacity: 0.42 }}
                  />
                  <div
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--card)]"
                    style={{ left: `${x(BENCHMARK)}%`, boxShadow: "0 0 0 1.5px var(--muted-foreground)" }}
                    aria-hidden
                  />
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${x(f.days)}%`, background: colour }}
                  />
                  <span
                    className="absolute top-1/2 -translate-y-1/2 text-[12px] tabular-nums text-[var(--muted-foreground)]"
                    style={{ left: `calc(${x(f.days)}% + 14px)` }}
                  >
                    {f.days}d
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 border-t-[0.8px] border-[var(--rule)] pt-2.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--card)]"
                style={{ boxShadow: "0 0 0 1.5px var(--muted-foreground)" }} aria-hidden />
          <span className="caption">30-day benchmark</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--chart-3)" }} aria-hidden />
          <span className="caption">Below</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--chart-2)" }} aria-hidden />
          <span className="caption">Above</span>
        </span>
      </div>
    </div>
  );
}

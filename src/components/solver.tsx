"use client";
import { useState, useMemo } from "react";
import { RIG_LAG } from "@/lib/rig-lag";
import { NG_RIGS } from "@/lib/opec-data";
import { fmt, BENCH } from "@/lib/model";
import { Icon } from "./icon";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)";
const R = RIG_LAG;

// the rig counts actually observed; anything past this is extrapolation and is
// labelled as such rather than quietly returned as though it were a projection
const OBSERVED = NG_RIGS.filter((v): v is number => v != null);
const OBS_MIN = Math.min(...OBSERVED);
const OBS_MAX = Math.max(...OBSERVED);
const CURRENT_RIGS = R.projection[R.projection.length - 1].rigs;
const CURRENT_PROD = R.fitted[R.fitted.length - 1].actual;

const PRESETS = [
  { label: "OPEC quota", value: BENCH.opecQuota },
  { label: "Today", value: CURRENT_PROD },
  { label: "Budget benchmark", value: BENCH.budget },
  { label: "MTEF target", value: BENCH.mtefTarget },
];

export function TargetSolver() {
  const [target, setTarget] = useState<number>(BENCH.budget);

  const out = useMemo(() => {
    const need = (target - R.intercept) / R.slope;
    return {
      need,
      gap: need - CURRENT_RIGS,
      multiple: need / CURRENT_RIGS,
      extrapolating: need > OBS_MAX,
      beyondObs: need / OBS_MAX,
      belowObs: need < OBS_MIN,
    };
  }, [target]);

  const shown = Math.min(Math.ceil(Math.max(out.need, CURRENT_RIGS)), 60);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-1">
      {/* target input */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="target" className="eyebrow">Target production</label>
          <span className="font-mono text-[19px] font-medium tabular-nums">
            {fmt(target)} <span className="text-[12px] text-muted-foreground">tb/d</span>
          </span>
        </div>
        <input
          id="target" type="range" min={1400} max={2100} step={5} value={target}
          onChange={(e) => setTarget(+e.target.value)}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--input)]
                     accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-4
                     focus-visible:outline-[var(--ring)]"
        />
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setTarget(p.value)}
              aria-pressed={target === p.value}
              className={`eyebrow rounded-sm border border-[var(--rule)] px-2 py-1.5 transition-colors ${
                target === p.value
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "hover:bg-secondary hover:text-foreground"
              } focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring)]`}
            >
              {p.label} · {fmt(p.value)}
            </button>
          ))}
        </div>
      </div>

      {/* the answer */}
      <div className="rule-t grid gap-x-8 gap-y-3 pt-3.5 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">Rigs required</span>
          <span className="font-mono text-[27px] font-medium leading-none tabular-nums"
                style={{ color: out.extrapolating ? C3 : C2 }}>
            {out.need.toFixed(0)}
          </span>
          <span className="text-[10.5px] text-muted-foreground">
            drilling now, for oil in {R.lag} months
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">Against today</span>
          <span className="font-mono text-[27px] font-medium leading-none tabular-nums">
            {out.gap >= 0 ? "+" : ""}{out.gap.toFixed(0)}
          </span>
          <span className="text-[10.5px] text-muted-foreground">
            on a current fleet of {CURRENT_RIGS}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">Multiple of today</span>
          <span className="font-mono text-[27px] font-medium leading-none tabular-nums">
            {out.multiple.toFixed(1)}×
          </span>
          <span className="text-[10.5px] text-muted-foreground">
            highest ever observed was {OBS_MAX}
          </span>
        </div>
      </div>

      {/* current fleet against required fleet, one derrick each */}
      <div className="rule-t flex flex-col gap-2 pt-3.5">
        <div className="flex flex-wrap items-end gap-[3px]">
          {Array.from({ length: shown }).map((_, i) => {
            const have = i < CURRENT_RIGS;
            const needed = i < Math.round(out.need);
            const isExtra = i >= OBS_MAX;
            return (
              <Icon
                key={i}
                name="oil_rig"
                size={19}
                style={{
                  color: have ? C1 : needed ? (isExtra ? C3 : C2) : "var(--muted)",
                  opacity: needed || have ? 1 : 0.35,
                }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="flex items-baseline gap-1.5 text-[11.5px] text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: C1 }} />
            Drilling today ({CURRENT_RIGS})
          </span>
          <span className="flex items-baseline gap-1.5 text-[11.5px] text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: C2 }} />
            Additional, within what Nigeria has run before
          </span>
          <span className="flex items-baseline gap-1.5 text-[11.5px] text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: C3 }} />
            More than Nigeria has ever run
          </span>
        </div>
      </div>

      {/* the caveat, sized to how far out you have gone */}
      {out.extrapolating && (
        <p className="rounded-sm border border-[var(--rule)] bg-[var(--secondary)] px-3 py-2.5
                      text-[12px] leading-[1.6]">
          <strong>Nigeria has never drilled at this level.</strong> Everything here is measured on
          fleets of between {OBS_MIN} and {OBS_MAX} rigs. At {out.need.toFixed(0)} rigs you are{" "}
          {out.beyondObs.toFixed(1)}× past anything Nigeria has actually run, and there is no evidence
          each rig would still deliver the same barrels at that scale. Treat it as a sense of the
          distance rather than a plan. The useful reading is that the target sits far outside what
          current drilling has ever produced.
        </p>
      )}
      {!out.extrapolating && (
        <p className="text-[12px] leading-[1.6] text-muted-foreground">
          This sits inside the range of fleets Nigeria has actually operated, so it rests on observed
          behaviour rather than assumption. It still carries the model&rsquo;s usual margin of about
          ± {R.band80} thousand barrels a day.
        </p>
      )}
    </div>
  );
}

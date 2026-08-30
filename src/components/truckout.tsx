"use client";
import {
  ComposedChart, Line, ReferenceArea, ReferenceLine, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Tip, AXIS, CURSOR, GRID } from "./chart-kit";
import { TRUCKOUT as T } from "@/lib/truckout";

const C1 = "var(--chart-1)", C3 = "var(--chart-3)";

/**
 * The same series, read two ways. A near-flat band holds both half-year
 * averages, 0.29 m litres apart; the monthly line falls steeply straight
 * through it. That picture is the whole reconciliation: a level comparison
 * and a path comparison of one dataset, both true.
 */
export function TruckoutChart() {
  const data = T.months.map((m) => ({
    label: m.label,
    "Daily average": m.value,
    provisional: m.provisional ?? false,
  }));

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 14, right: 18, left: -6, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...AXIS} />
          <YAxis {...AXIS} width={44} domain={[30, 66]} />
          <Tooltip content={<Tip unit=" m litres/day" dp={1} />} cursor={CURSOR} />

          {/* both half-year averages, drawn as one band because that is how
              far apart they actually are */}
          <ReferenceArea
            y1={Math.min(T.avg2025, T.avg2026)}
            y2={Math.max(T.avg2025, T.avg2026)}
            fill={C3} fillOpacity={0.5} stroke="none"
          />
          <ReferenceLine y={T.avg2025} stroke={C3} strokeWidth={1.6}
            label={{ value: `H1 2025 avg ${T.avg2025}`, position: "insideTopLeft",
                     fill: C3, fontSize: 11 }} />
          <ReferenceLine y={T.avg2026} stroke={C3} strokeWidth={1.6} strokeDasharray="4 3"
            label={{ value: `H1 2026 avg ${T.avg2026}`, position: "insideBottomLeft",
                     fill: C3, fontSize: 11 }} />

          <Line type="monotone" dataKey="Daily average" stroke={C1} strokeWidth={2.5}
                dot={{ r: 3.5, fill: C1 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* the two readings, side by side */}
      <div className="grid gap-3 px-4 pb-1 sm:grid-cols-2">
        {[
          { k: "Level", q: "Half against half", v: T.levelPct, note: `${T.avg2026} against ${T.avg2025} m litres a day`, who: "the regulator's figure" },
          { k: "Path", q: "January to the May trough", v: T.pathPct, note: `${T.months[0].value} down to ${T.trough} m litres a day`, who: "the marketers' figure" },
        ].map((r) => (
          <div key={r.k} className="flex flex-col gap-0.5 rounded-[10px] bg-[var(--plot)] px-3.5 py-3">
            <span className="caption">{r.q}</span>
            <span className="text-[26px] font-semibold leading-none tabular-nums tracking-[-0.6px]"
                  style={{ color: Math.abs(r.v) > 5 ? C3 : "var(--foreground)" }}>
              {r.v}%
            </span>
            <span className="caption">{r.note}</span>
            <span className="caption text-[var(--fade)]">{r.who}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

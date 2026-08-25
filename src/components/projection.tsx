"use client";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { RIG_LAG } from "@/lib/rig-lag";
import { monthLabel, fmt, BENCH } from "@/lib/model";
import { Tip, AXIS, CURSOR, BAR_CURSOR, GRID, INK3 } from "./chart-kit";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)";
const R = RIG_LAG;

/* ── Realised actuals, then the path implied by rigs already turning ────── */
const SERIES = [
  ...R.fitted.map((f) => ({
    label: monthLabel(f.month),
    actual: f.actual as number | null,
    projected: null as number | null,
    band: null as [number, number] | null,
  })),
  ...R.projection.map((p, i) => ({
    label: monthLabel(p.month),
    // join the two lines at the handover so there is no visual gap
    actual: null,
    projected: p.pred,
    band: [p.pred - R.realtime.band80, p.pred + R.realtime.band80] as [number, number],
    rigs: p.rigs,
    from: monthLabel(p.fromMonth),
    _first: i === 0,
  })),
];
// carry the last actual into the projected series so the two lines meet, and
// pin the band to zero width at the handover rather than opening abruptly
const lastActualIdx = R.fitted.length - 1;
const handover = R.fitted[lastActualIdx].actual;
if (SERIES[lastActualIdx + 1]) {
  SERIES[lastActualIdx].projected = handover;
  SERIES[lastActualIdx].band = [handover, handover];
}

export function ProjectionChart() {
  return (
    <ResponsiveContainer width="100%" height={264}>
      <ComposedChart data={SERIES} margin={{ top: 10, right: 16, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} interval={2} />
        <YAxis {...AXIS} width={48} domain={[1300, 1900]} />
        <Tooltip content={<Tip unit=" tb/d" />} cursor={CURSOR} />

        <ReferenceLine y={BENCH.budget} stroke={INK3} strokeDasharray="4 3" strokeWidth={1.5}
          label={{ value: `budget ${fmt(BENCH.budget)}`, position: "insideTopRight",
                   fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <ReferenceLine x={monthLabel(R.fitted[lastActualIdx].month)} stroke={INK3}
          strokeDasharray="2 3" strokeWidth={1.5}
          label={{ value: "last actual", position: "top", fill: INK3,
                   fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />

        <Area type="monotone" dataKey="band" name="80% band" stroke="none"
              fill="url(#bandFill)" isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="actual" name="Actual" stroke={C2} strokeWidth={2}
              dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="projected" name="Implied by rigs already turning"
              stroke={C1} strokeWidth={2} strokeDasharray="5 3" dot={false}
              isAnimationActive={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ── Real-time backtest: the dataset is rebuilt from the OPEC vintages, so the
      model sees only the figures that existed on the day. ─────────────────── */
const BT = R.realtime.rows.map((b) => ({
  label: monthLabel(b.target),
  Actual: b.actual,
  "Model, as it stood": b.pred,
  err: b.err,
  slope: b.slope,
  trainN: b.trainN,
}));

export function BacktestRibbon() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={BT} margin={{ top: 10, right: 16, left: -6, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={48} domain={[1350, 1650]} />
        <Tooltip content={<Tip unit=" tb/d" />} cursor={CURSOR} />
        <Line type="monotone" dataKey="Actual" stroke={C2} strokeWidth={2.5}
              dot={{ r: 3, fill: C2 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="Model, as it stood" stroke={C1} strokeWidth={2}
              strokeDasharray="5 3" dot={{ r: 3, fill: C1 }} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ── Backtest errors, so the spread is visible rather than asserted ─────── */
export function BacktestErrors() {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={BT} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={44} domain={[-95, 95]} />
        <Tooltip content={<Tip unit=" tb/d" dp={1} />} cursor={BAR_CURSOR} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
        <ReferenceLine y={R.realtime.band80} stroke={C1} strokeDasharray="3 3" strokeWidth={1.2}
          label={{ value: "80% band", position: "insideTopRight", fill: C1,
                   fontSize: 9.5, fontFamily: "var(--font-plex-mono)" }} />
        <ReferenceLine y={-R.realtime.band80} stroke={C1} strokeDasharray="3 3" strokeWidth={1.2} />
        <Bar dataKey="err" name="Error" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {BT.map((d, i) => (
            <Cell key={i} fill={Math.abs(d.err) <= R.realtime.band80 ? C2 : C3} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Model card: what a sceptic would ask, answered before they ask ────── */
export function ModelCard() {
  const RT = R.realtime;
  const beatRT = Math.round((1 - RT.mase) * 100);
  const beatRevised = Math.round((1 - R.mase) * 100);
  const rows: [string, string, string?][] = [
    ["What it says", `each extra rig adds about ${Math.round(R.slope)} thousand barrels a day, ${R.lag} months later`],
    ["Built from", `${R.n} months of drilling and production figures`],
    ["Tested on", `${RT.origins} months, using only the figures that existed at the time`],
    ["Typical error", `${RT.mae} thousand barrels a day, against ${RT.naiveMae} for simply assuming no change`],
    ["Accuracy", `${beatRT}% better than assuming next month looks like this one`],
    ["Expected range", `8 months in 10 land within ± ${RT.band80} thousand barrels a day`],
    ["Worst miss", `${RT.bandMax} thousand barrels a day`],
  ];
  return (
    <div className="flex flex-col divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
      {rows.map(([k, v, extra]) => (
        <div key={k} className="flex items-baseline gap-3 px-4 py-2">
          <span className="eyebrow w-[112px] shrink-0">{k}</span>
          <span className="flex-1 text-[12.5px] leading-[1.5]">{v}</span>
          {extra && (
            <span className="shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ color: C2, background: "var(--secondary)" }}>
              {extra}
            </span>
          )}
        </div>
      ))}
      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        <p className="max-w-[80ch] text-[12px] leading-[1.6] text-muted-foreground">
          <strong className="text-foreground">Why this looks worse than it could.</strong> OPEC revises
          its figures for months after first publishing them. Score the model against those corrected
          numbers and it comes out {beatRevised}% better than a naive guess. Score it against only what
          was actually on the desk at the time, which is the fair test, and it is {beatRT}%. The larger
          figure is the one most published models quote. This shows the smaller one.
        </p>
        <p className="max-w-[80ch] text-[12px] leading-[1.6] text-muted-foreground">
          <strong className="text-foreground">It did not work at first.</strong> Run month by month, the
          model was wrong by an average of {RT.earlyMae} thousand barrels a day over its first{" "}
          {RT.earlyN} attempts and {RT.lateMae} over the last {RT.lateN}. The relationship only became
          visible once enough months had accumulated. Four good months is not proof it will stay good.
        </p>
        <p className="max-w-[80ch] text-[12px] leading-[1.6] text-muted-foreground">
          <strong className="text-foreground">The equation, if you want it.</strong>{" "}
          <span className="font-mono">production = {fmt(R.intercept)} + {R.slope} x rigs, {R.lag} months earlier</span>
        </p>
      </div>
    </div>
  );
}

/* ── How the relationship firmed up as months accumulated ───────────────── */
export function SlopeDrift() {
  const data = R.realtime.rows.map((r) => ({
    label: monthLabel(r.vintage),
    "Barrels per rig": r.slope,
    months: r.trainN,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} width={42} domain={[-4, 16]} />
        <Tooltip content={<Tip unit=" tb/d per rig" dp={2} />} cursor={CURSOR} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1}
          label={{ value: "no relationship", position: "insideTopLeft", fill: INK3,
                   fontSize: 9.5, fontFamily: "var(--font-plex-mono)" }} />
        <ReferenceLine y={R.slope} stroke={C2} strokeDasharray="4 3" strokeWidth={1.5}
          label={{ value: `settles near ${Math.round(R.slope)}`, position: "insideBottomRight",
                   fill: C2, fontSize: 9.5, fontFamily: "var(--font-plex-mono)" }} />
        <Line type="monotone" dataKey="Barrels per rig" stroke={C1} strokeWidth={2.5}
              dot={{ r: 3, fill: C1 }} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

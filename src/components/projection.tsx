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
    band: [p.pred - R.band80, p.pred + R.band80] as [number, number],
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

/* ── Backtest: what the model would have said, refitted at each origin ──── */
const BT = R.backtest.map((b) => ({
  label: monthLabel(b.month),
  Actual: b.actual,
  "Model, refitted": b.pred,
  err: b.err,
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
        <Line type="monotone" dataKey="Model, refitted" stroke={C1} strokeWidth={2}
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
        <YAxis {...AXIS} width={44} domain={[-90, 90]} />
        <Tooltip content={<Tip unit=" tb/d" dp={1} />} cursor={BAR_CURSOR} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
        <ReferenceLine y={R.band80} stroke={C1} strokeDasharray="3 3" strokeWidth={1.2}
          label={{ value: "80% band", position: "insideTopRight", fill: C1,
                   fontSize: 9.5, fontFamily: "var(--font-plex-mono)" }} />
        <ReferenceLine y={-R.band80} stroke={C1} strokeDasharray="3 3" strokeWidth={1.2} />
        <Bar dataKey="err" name="Error" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {BT.map((d, i) => (
            <Cell key={i} fill={Math.abs(d.err) <= R.band80 ? C2 : C3} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Model card: the numbers a sceptic would ask for, before they ask ──── */
export function ModelCard() {
  const beat = Math.round((1 - R.mase) * 100);
  const rows: [string, string, string?][] = [
    ["Form", `production(t) = ${fmt(R.intercept)} + ${R.slope} x rigs(t − ${R.lag})`],
    ["Reads as", `each additional rig implies about ${Math.round(R.slope)} tb/d, ${R.lag} months later`],
    ["Fitted on", `${R.n} monthly observations`],
    ["Backtest", `${R.origins} rolling origins, refitted at each, no look-ahead`],
    ["Error", `${R.mae} tb/d mean absolute, against ${R.naiveMae} for carrying the last value forward`],
    ["MASE", `${R.mase}`, beat > 0 ? `${beat}% better than naive` : "no better than naive"],
    ["80% band", `± ${R.band80} tb/d, split-conformal from backtest residuals`],
    ["Largest miss", `${R.bandMax} tb/d`],
  ];
  return (
    <div className="flex flex-col divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
      {rows.map(([k, v, extra]) => (
        <div key={k} className="flex items-baseline gap-3 px-4 py-2">
          <span className="eyebrow w-[104px] shrink-0">{k}</span>
          <span className="flex-1 font-mono text-[12px] tabular-nums">{v}</span>
          {extra && (
            <span className="shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ color: C2, background: "var(--secondary)" }}>
              {extra}
            </span>
          )}
        </div>
      ))}
      <div className="px-4 py-3">
        <p className="max-w-[80ch] text-[12px] leading-[1.6] text-muted-foreground">
          <strong className="text-foreground">Where this breaks.</strong> Fitted on data before
          February 2026 the slope is {R.stability.preSlope}; fitted on everything it is{" "}
          {R.stability.fullSlope}, a {R.stability.shiftPct}% shift. The direction has held but the
          coefficient has not, so treat the shape of the path as the signal and the level as
          indicative. With {R.origins} backtest origins only the 80% band is honestly supported,
          which is why there is no 95% band on this chart.
        </p>
      </div>
    </div>
  );
}

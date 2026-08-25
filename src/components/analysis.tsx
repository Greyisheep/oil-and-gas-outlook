"use client";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { buildSeries, correlationTable, lagProfile, CORR_SERIES, firstDiff } from "@/lib/model";
import { WAF_USGC_SUEZ, WAF_EAST_VLCC, ME_EAST_VLCC, OECD_DAYS_COVER, OECD_CRUDE_STOCK, MONTHS } from "@/lib/opec-data";
import { monthLabel } from "@/lib/model";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)", C4 = "var(--chart-4)";
const GRID = "var(--grid)", INK3 = "var(--muted-foreground)";
const axis = { stroke: GRID, tickLine: false as const,
  tick: { fill: INK3, fontSize: 10.5, fontFamily: "var(--font-plex-mono)" } };

type TipProps = { active?: boolean; label?: string | number;
  payload?: { name?: string; value?: number | string | null; color?: string }[]; unit?: string; dp?: number };

function Tip({ active, payload, label, unit = "", dp = 0 }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel px-2.5 py-2 text-[11.5px]" style={{ background: "var(--popover)" }}>
      <div className="eyebrow mb-1">{label}</div>
      {payload.filter((p) => p.value != null).map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2.5px] w-3 rounded-full" style={{ background: p.color }} />{p.name}
          </span>
          <span className="font-medium">{Number(p.value).toFixed(dp)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

const freight = MONTHS.map((m, i) => ({
  label: monthLabel(m),
  "WAF to US Gulf (Suezmax)": WAF_USGC_SUEZ[i],
  "WAF to East (VLCC)": WAF_EAST_VLCC[i],
  "Gulf to East (VLCC)": ME_EAST_VLCC[i],
}));

/* ── Freight: Nigeria's own export routes against the Gulf ───────────────── */
export function FreightChart() {
  return (
    <ResponsiveContainer width="100%" height={208}>
      <LineChart data={freight} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={3} />
        <YAxis {...axis} width={44} tickFormatter={(v) => `WS${v}`} />
        <Tooltip content={<Tip />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
        <Line type="monotone" dataKey="WAF to US Gulf (Suezmax)" stroke={C1} strokeWidth={2.5} dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="WAF to East (VLCC)" stroke={C2} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="Gulf to East (VLCC)" stroke={C3} strokeWidth={2} strokeDasharray="4 3" dot={false} isAnimationActive={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── OECD stocks and days of forward cover ──────────────────────────────── */
const stocks = MONTHS.map((m, i) => ({
  label: monthLabel(m), "OECD crude stocks": OECD_CRUDE_STOCK[i], "Days of cover": OECD_DAYS_COVER[i],
}));
export function StocksChart() {
  return (
    <div className="flex flex-col gap-1">
      <ResponsiveContainer width="100%" height={104}>
        <ComposedChart data={stocks} margin={{ top: 8, right: 14, left: -8, bottom: 0 }} syncId="stk">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis {...axis} width={44} domain={[1250, 1450]} />
          <Tooltip content={<Tip unit=" mb" />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="OECD crude stocks" stroke={C1} strokeWidth={2} fill={C1} fillOpacity={0.12} dot={false} isAnimationActive={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={104}>
        <LineChart data={stocks} margin={{ top: 4, right: 14, left: -8, bottom: 0 }} syncId="stk">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...axis} interval={3} />
          <YAxis {...axis} width={44} domain={[55, 66]} />
          <Tooltip content={<Tip unit=" days" dp={1} />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Line type="monotone" dataKey="Days of cover" stroke={C2} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Levels vs changes: which correlations survive differencing ─────────── */
export function CorrelationPanel() {
  const rows = correlationTable().slice(0, 12);
  return (
    <div className="overflow-x-auto px-2.5 pb-1">
      <table className="w-full text-[11.5px]">
        <thead>
          <tr className="border-b border-[var(--rule)]">
            <th className="eyebrow px-1.5 py-1.5 text-left">Pair</th>
            <th className="eyebrow px-1.5 py-1.5 text-right">r, levels</th>
            <th className="eyebrow px-1.5 py-1.5 text-right">r, changes</th>
            <th className="eyebrow px-1.5 py-1.5 text-left">Verdict</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {rows.map((r) => {
            const survives = Math.abs(r.changes) >= 0.5;
            const verdict = r.identity ? "identity" : survives ? "survives" : "collapses";
            const tone = r.identity ? INK3 : survives ? "var(--chart-2)" : "var(--chart-3)";
            return (
              <tr key={r.a + r.b} className="border-b border-[var(--rule)]/60">
                <td className="px-1.5 py-1 font-sans">{r.a} <span className="text-muted-foreground">~</span> {r.b}</td>
                <td className="px-1.5 py-1 text-right">{r.levels >= 0 ? "+" : ""}{r.levels.toFixed(2)}</td>
                <td className="px-1.5 py-1 text-right font-medium">{r.changes >= 0 ? "+" : ""}{r.changes.toFixed(2)}</td>
                <td className="px-1.5 py-1">
                  <span className="rounded-sm px-1.5 py-0.5 text-[10px] font-sans font-medium"
                        style={{ color: tone, background: "var(--secondary)" }}>{verdict}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Full lag profile for freight vs differential: the p-hacking trap ────── */
export function FreightLagChart() {
  const prof = lagProfile(firstDiff(CORR_SERIES["WAF to US Gulf freight"]),
                          firstDiff(CORR_SERIES["Bonny differential"]), 6);
  return (
    <ResponsiveContainer width="100%" height={176}>
      <BarChart data={prof} margin={{ top: 8, right: 14, left: -12, bottom: 6 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="lag" {...axis}
          label={{ value: "freight leads by, months", position: "insideBottom", offset: -4, fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <YAxis {...axis} width={40} domain={[-1, 1]} />
        <Tooltip content={<Tip dp={3} />} cursor={{ fill: "var(--secondary)" }} />
        <ReferenceArea y1={-0.5} y2={0.5} fill={INK3} fillOpacity={0.07} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
        <Bar dataKey="r" name="correlation" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {prof.map((p) => <Cell key={p.lag} fill={Math.abs(p.r) >= 0.5 ? C3 : "var(--muted)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ShareVsFreightChart() {
  const S = buildSeries();
  const d = MONTHS.map((m, i) => ({
    label: monthLabel(m),
    "Nigeria share of OPEC": S[i].opecShare as number | null,
    "Gulf to East freight": ME_EAST_VLCC[i],
  }));
  return (
    <div className="flex flex-col gap-1">
      <ResponsiveContainer width="100%" height={104}>
        <LineChart data={d} margin={{ top: 8, right: 14, left: -8, bottom: 0 }} syncId="svf">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis {...axis} width={44} domain={[4, 9]} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<Tip unit="%" dp={2} />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Line type="monotone" dataKey="Nigeria share of OPEC" stroke={C2} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={104}>
        <LineChart data={d} margin={{ top: 4, right: 14, left: -8, bottom: 0 }} syncId="svf">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...axis} interval={3} />
          <YAxis {...axis} width={44} tickFormatter={(v) => `WS${v}`} />
          <Tooltip content={<Tip />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Line type="monotone" dataKey="Gulf to East freight" stroke={C4} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Changes scatter: what "collapses under differencing" looks like ─────── */
export function FreightScatter() {
  const a = firstDiff(CORR_SERIES["WAF to US Gulf freight"]);
  const b = firstDiff(CORR_SERIES["Gulf to East freight"]);
  const pts = a.map((v, i) => ({ x: b[i], y: v, label: monthLabel(MONTHS[i + 1]) }))
               .filter((p) => p.x != null && p.y != null);
  return (
    <ResponsiveContainer width="100%" height={208}>
      <ScatterChart margin={{ top: 10, right: 16, left: -6, bottom: 16 }}>
        <CartesianGrid stroke={GRID} />
        <XAxis type="number" dataKey="x" {...axis} name="Gulf to East, change"
          label={{ value: "Gulf to East, monthly change (WS)", position: "insideBottom", offset: -8, fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <YAxis type="number" dataKey="y" {...axis} width={44} name="WAF to US Gulf, change" />
        <ZAxis range={[46, 46]} />
        <Tooltip cursor={{ strokeDasharray: "3 3", stroke: INK3 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as { x: number; y: number; label: string };
            return (
              <div className="panel px-2.5 py-2 text-[11.5px] font-mono" style={{ background: "var(--popover)" }}>
                <div className="eyebrow mb-1">{d.label}</div>
                <div>Gulf to East {d.x >= 0 ? "+" : ""}{d.x.toFixed(0)} WS</div>
                <div>WAF to USGC {d.y >= 0 ? "+" : ""}{d.y.toFixed(0)} WS</div>
              </div>
            );
          }} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
        <ReferenceLine x={0} stroke={INK3} strokeWidth={1} />
        <Scatter data={pts} fill={C1} fillOpacity={0.75} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

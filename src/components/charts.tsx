"use client";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from "recharts";
import { buildSeries, indexed, rigLag, monthLabel, BENCH } from "@/lib/model";
import { MONTHS, NG_SECONDARY, PEERS } from "@/lib/opec-data";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)", C4 = "var(--chart-4)";
const GRID = "var(--grid)", INK3 = "var(--muted-foreground)";
const data = buildSeries();

const axis = {
  stroke: GRID,
  tick: { fill: INK3, fontSize: 10.5, fontFamily: "var(--font-plex-mono)" },
  tickLine: false as const,
};

type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number | string | null; color?: string }[];
  unit?: string; dp?: number;
};
function Tip({ active, payload, label, unit = "", dp = 0 }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel px-2.5 py-2 text-[11.5px] shadow-sm" style={{ background: "var(--popover)" }}>
      <div className="eyebrow mb-1">{label}</div>
      {payload.filter((p) => p.value != null).map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2.5px] w-3 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium">{Number(p.value).toFixed(dp)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

const H = 208;

/* ── 1. Nigeria crude production, two official bases ─────────────────────── */
export function ProductionChart() {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={3} />
        <YAxis {...axis} domain={[1200, 2150]} width={44} />
        <Tooltip content={<Tip unit=" tb/d" />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
        <ReferenceLine y={BENCH.budget} stroke={INK3} strokeDasharray="4 3" strokeWidth={1.5}
          label={{ value: "budget benchmark 1,840", position: "insideTopRight", fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <ReferenceLine y={BENCH.opecQuota} stroke={INK3} strokeDasharray="2 3" strokeWidth={1.5}
          label={{ value: "OPEC quota 1,500", position: "insideBottomRight", fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <Line isAnimationActive={false} type="monotone" dataKey="secondary" name="Secondary sources" stroke={C1} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
        <Line isAnimationActive={false} type="monotone" dataKey="direct" name="Direct communication" stroke={C2} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 2. Nigeria's share of OPEC crude, the Hormuz reallocation ──────────── */
export function ShareChart() {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <AreaChart data={data} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="shareFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={3} />
        <YAxis {...axis} width={44} domain={[4, 9]} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<Tip unit="%" dp={2} />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
        <Area isAnimationActive={false} type="monotone" dataKey="opecShare" name="Nigeria share of OPEC crude"
          stroke={C2} strokeWidth={2} fill="url(#shareFill)" dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── 3. Peer producers, indexed: who kept their barrels ────────────────── */
const peerData = MONTHS.map((m, i) => ({
  label: monthLabel(m),
  Nigeria: indexed(NG_SECONDARY)[i],
  "Saudi Arabia": indexed(PEERS.sa)[i],
  Iraq: indexed(PEERS.iq)[i],
  Kuwait: indexed(PEERS.kw)[i],
}));
export function PeerChart() {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={peerData} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={3} />
        <YAxis {...axis} width={40} domain={[0, 130]} />
        <Tooltip content={<Tip dp={1} />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
        <ReferenceLine y={100} stroke={INK3} strokeDasharray="4 3" strokeWidth={1.5} />
        <Line isAnimationActive={false} type="monotone" dataKey="Nigeria" stroke={C2} strokeWidth={2.5} dot={false} />
        <Line isAnimationActive={false} type="monotone" dataKey="Saudi Arabia" stroke={C1} strokeWidth={2} dot={false} />
        <Line isAnimationActive={false} type="monotone" dataKey="Iraq" stroke={C3} strokeWidth={2} dot={false} />
        <Line isAnimationActive={false} type="monotone" dataKey="Kuwait" stroke={C4} strokeWidth={2} strokeDasharray="4 3" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 4. Rigs lead barrels: small multiples, never a dual axis ───────────── */
export function RigChart() {
  return (
    <div className="flex flex-col gap-1">
      <ResponsiveContainer width="100%" height={104}>
        <AreaChart data={data} margin={{ top: 8, right: 14, left: -8, bottom: 0 }} syncId="riglag">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis {...axis} width={44} domain={[0, 24]} />
          <Tooltip content={<Tip unit=" rigs" />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area isAnimationActive={false} type="stepAfter" dataKey="rigs" name="Active rigs (OPEC count)" stroke={C1} strokeWidth={2} fill={C1} fillOpacity={0.14} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={104}>
        <LineChart data={data} margin={{ top: 4, right: 14, left: -8, bottom: 0 }} syncId="riglag">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...axis} interval={3} />
          <YAxis {...axis} width={44} domain={[1350, 1650]} />
          <Tooltip content={<Tip unit=" tb/d" />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Line isAnimationActive={false} type="monotone" dataKey="secondary" name="Crude production" stroke={C2} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── 5. Rig/production cross-correlation by lag ─────────────────────────── */
export function LagChart() {
  const lags = rigLag(14);
  const best = lags.reduce((a, b) => (b.r > a.r ? b : a), lags[0]);
  return (
    <ResponsiveContainer width="100%" height={168}>
      <BarChart data={lags} margin={{ top: 8, right: 14, left: -12, bottom: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="lag" {...axis} label={{ value: "lag, months", position: "insideBottom", offset: -2, fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <YAxis {...axis} width={40} domain={[-1, 1]} />
        <Tooltip content={<Tip dp={3} />} cursor={{ fill: "var(--secondary)" }} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
        <Bar isAnimationActive={false} dataKey="r" name="correlation" radius={[2, 2, 0, 0]}>
          {lags.map((l) => (
            <Cell key={l.lag} fill={l.lag === best.lag ? C2 : "var(--muted)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
/* ── 6. Prices ───────────────────────────────────────────────────────────── */
export function PriceChart() {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={3} />
        <YAxis {...axis} width={44} domain={[50, 130]} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<Tip unit="/b" dp={2} />} cursor={{ stroke: INK3, strokeWidth: 1, strokeDasharray: "3 3" }} />
        <ReferenceLine y={BENCH.budgetPrice} stroke={INK3} strokeDasharray="4 3" strokeWidth={1.5}
          label={{ value: "budget $64.85", position: "insideBottomRight", fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <Line isAnimationActive={false} type="monotone" dataKey="bonny" name="Bonny Light" stroke={C1} strokeWidth={2} dot={false} />
        <Line isAnimationActive={false} type="monotone" dataKey="dated" name="North Sea Dated" stroke={C2} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 7. Bonny differential and the reporting gap ─────────────────────────── */
export function DiffChart() {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={data} margin={{ top: 8, right: 14, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={3} />
        <YAxis {...axis} width={40} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<Tip unit="/b" dp={2} />} cursor={{ fill: "var(--secondary)" }} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
        <Bar isAnimationActive={false} dataKey="diff" name="Bonny Light vs Dated" fill={C1} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GapChart() {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={data} margin={{ top: 8, right: 14, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={3} />
        <YAxis {...axis} width={40} />
        <Tooltip content={<Tip unit=" tb/d" />} cursor={{ fill: "var(--secondary)" }} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
        <Bar isAnimationActive={false} dataKey="gap" name="Secondary minus direct" radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={(d.gap as number) >= 0 ? C1 : C3} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

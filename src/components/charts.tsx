"use client";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from "recharts";
import { buildSeries, indexed, rigLag, monthLabel, BENCH } from "@/lib/model";
import { MONTHS, NG_SECONDARY, PEERS } from "@/lib/opec-data";
import { Tip, AXIS, CURSOR, BAR_CURSOR, GRID, INK3 } from "./chart-kit";
import { useWindow } from "./range";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)", C4 = "var(--chart-4)";
const ALL = buildSeries();


const H = 208;

/* ── 1. Nigeria crude production, two official bases ─────────────────────── */
export function ProductionChart() {
  const data = useWindow(ALL);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} interval={3} />
        <YAxis {...AXIS} domain={[1200, 2150]} width={44} />
        <Tooltip content={<Tip unit=" tb/d" />} cursor={CURSOR} />
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
  const data = useWindow(ALL);
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
        <XAxis dataKey="label" {...AXIS} interval={3} />
        <YAxis {...AXIS} width={44} domain={[4, 9]} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<Tip unit="%" dp={2} />} cursor={CURSOR} />
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
  const data = useWindow(peerData);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} interval={3} />
        <YAxis {...AXIS} width={40} domain={[0, 130]} />
        <Tooltip content={<Tip dp={1} />} cursor={CURSOR} />
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
  const data = useWindow(ALL);
  return (
    <div className="flex flex-col gap-1">
      <ResponsiveContainer width="100%" height={104}>
        <AreaChart data={data} margin={{ top: 8, right: 14, left: -8, bottom: 0 }} syncId="riglag">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis {...AXIS} width={44} domain={[0, 24]} />
          <Tooltip content={<Tip unit=" rigs" />} cursor={CURSOR} />
          <Area isAnimationActive={false} type="stepAfter" dataKey="rigs" name="Active rigs (OPEC count)" stroke={C1} strokeWidth={2} fill={C1} fillOpacity={0.14} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={104}>
        <LineChart data={data} margin={{ top: 4, right: 14, left: -8, bottom: 0 }} syncId="riglag">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...AXIS} interval={3} />
          <YAxis {...AXIS} width={44} domain={[1350, 1650]} />
          <Tooltip content={<Tip unit=" tb/d" />} cursor={CURSOR} />
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
        <XAxis dataKey="lag" {...AXIS} label={{ value: "lag, months", position: "insideBottom", offset: -2, fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <YAxis {...AXIS} width={40} domain={[-1, 1]} />
        <Tooltip content={<Tip dp={3} />} cursor={BAR_CURSOR} />
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
  const data = useWindow(ALL);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 14, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} interval={3} />
        <YAxis {...AXIS} width={44} domain={[50, 130]} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<Tip unit="/b" dp={2} />} cursor={CURSOR} />
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
  const data = useWindow(ALL);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={data} margin={{ top: 8, right: 14, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} interval={3} />
        <YAxis {...AXIS} width={40} tickFormatter={(v) => `$${v}`} />
        <Tooltip content={<Tip unit="/b" dp={2} />} cursor={BAR_CURSOR} />
        <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
        <Bar isAnimationActive={false} dataKey="diff" name="Bonny Light vs Dated" fill={C1} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GapChart() {
  const data = useWindow(ALL);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={data} margin={{ top: 8, right: 14, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} interval={3} />
        <YAxis {...AXIS} width={40} />
        <Tooltip content={<Tip unit=" tb/d" />} cursor={BAR_CURSOR} />
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

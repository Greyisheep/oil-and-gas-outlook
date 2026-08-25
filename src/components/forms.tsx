"use client";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { MONTHS, PEERS, NG_SECONDARY, NG_RIGS, OECD_DAYS_COVER } from "@/lib/opec-data";
import { fmt, BENCH, monthLabel } from "@/lib/model";
import { Icon } from "./icon";
import { useWindow } from "./range";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)", C4 = "var(--chart-4)";
const LAST = MONTHS.length - 1;

/* ── Slope chart: two points, one line each. The clearest possible read of
      "who kept their barrels" between two dates. ──────────────────────────── */
const SLOPE = [
  { name: "Saudi Arabia", a: PEERS.sa[0], b: PEERS.sa[LAST] },
  { name: "Iraq", a: PEERS.iq[0], b: PEERS.iq[LAST] },
  { name: "UAE", a: PEERS.ae[0], b: PEERS.ae[LAST] },
  { name: "Iran", a: PEERS.ir[0], b: PEERS.ir[LAST] },
  { name: "Kuwait", a: PEERS.kw[0], b: PEERS.kw[LAST] },
  { name: "Libya", a: PEERS.ly[0], b: PEERS.ly[LAST] },
  { name: "Nigeria", a: NG_SECONDARY[0], b: NG_SECONDARY[LAST] },
  { name: "Algeria", a: PEERS.dz[0], b: PEERS.dz[LAST] },
].filter((d) => d.a != null && d.b != null) as { name: string; a: number; b: number }[];

export function SlopeChart() {
  const W = 560, H = 330, PAD_T = 30, PAD_B = 20, X1 = 138, X2 = 418, MIN_GAP = 14;
  const vals = SLOPE.flatMap((d) => [d.a, d.b]);
  // log scale: Saudi is ~8x Nigeria, and on a linear axis everyone below 3,000
  // tb/d collapses into a sliver. On a log axis equal percentage moves also
  // produce equal slopes, which is what this chart is actually comparing.
  const lo = Math.log10(Math.min(...vals) * 0.85);
  const hi = Math.log10(Math.max(...vals) * 1.15);
  const q = (n: number) => Math.round(n * 1000) / 1000;   // stable SSR serialisation
  const y = (v: number) => q(PAD_T + (1 - (Math.log10(v) - lo) / (hi - lo)) * (H - PAD_T - PAD_B));

  // push overlapping labels apart while keeping their order
  const place = (key: "a" | "b") => {
    const order = [...SLOPE].sort((m, n) => y(m[key]) - y(n[key]));
    const out = new Map<string, number>();
    let prev = -Infinity;
    for (const d of order) {
      const want = y(d[key]);
      const at = q(Math.max(want, prev + MIN_GAP));
      out.set(d.name, at);
      prev = at;
    }
    return out;
  };
  const la = place("a"), lb = place("b");

  return (
    <div className="overflow-x-auto px-2.5 pb-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[330px] w-full min-w-[520px]" role="img"
           aria-label="Slope chart of OPEC member crude production between June 2024 and July 2026">
        <text x={X1} y={14} textAnchor="end" className="fill-[var(--muted-foreground)]"
              style={{ fontSize: 10, fontFamily: "var(--font-plex-mono)", letterSpacing: "0.08em" }}>
          {monthLabel(MONTHS[0]).toUpperCase()}
        </text>
        <text x={X2} y={14} textAnchor="start" className="fill-[var(--muted-foreground)]"
              style={{ fontSize: 10, fontFamily: "var(--font-plex-mono)", letterSpacing: "0.08em" }}>
          {monthLabel(MONTHS[LAST]).toUpperCase()}
        </text>
        <line x1={X1} y1={PAD_T - 10} x2={X1} y2={H - PAD_B} stroke="var(--rule)" />
        <line x1={X2} y1={PAD_T - 10} x2={X2} y2={H - PAD_B} stroke="var(--rule)" />

        {SLOPE.map((d) => {
          const up = d.b >= d.a;
          const stroke = up ? C2 : C3;
          const pct = ((d.b - d.a) / d.a) * 100;
          const ya = y(d.a), yb = y(d.b);
          const ta = la.get(d.name)!, tb = lb.get(d.name)!;
          return (
            <g key={d.name}>
              <line x1={X1} y1={ya} x2={X2} y2={yb} stroke={stroke} strokeWidth={2}
                    strokeOpacity={0.85} strokeLinecap="round" />
              <circle cx={X1} cy={ya} r={3.2} fill={stroke} />
              <circle cx={X2} cy={yb} r={3.2} fill={stroke} />
              {/* leader from the label to its dot when de-collision moved it */}
              <line x1={X1 - 6} y1={ta} x2={X1 - 2} y2={ya} stroke="var(--rule)" strokeWidth={1} />
              <line x1={X2 + 2} y1={yb} x2={X2 + 6} y2={tb} stroke="var(--rule)" strokeWidth={1} />
              <text x={X1 - 9} y={ta + 3.5} textAnchor="end" className="fill-[var(--foreground)]"
                    style={{ fontSize: 11, fontFamily: "var(--font-plex-sans)" }}>
                {d.name} <tspan className="fill-[var(--muted-foreground)]"
                  style={{ fontFamily: "var(--font-plex-mono)" }}>{fmt(d.a)}</tspan>
              </text>
              <text x={X2 + 9} y={tb + 3.5} className="fill-[var(--foreground)]"
                    style={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }}>
                {fmt(d.b)}
                <tspan fill={stroke} style={{ fontSize: 10 }}> {pct >= 0 ? "+" : ""}{pct.toFixed(0)}%</tspan>
              </text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="fill-[var(--muted-foreground)]"
              style={{ fontSize: 9.5, fontFamily: "var(--font-plex-mono)", letterSpacing: "0.06em" }}>
          LOG SCALE · EQUAL SLOPES MEAN EQUAL PERCENTAGE MOVES
        </text>
      </svg>
    </div>
  );
}

/* ── Radial bars: OPEC crude by member for the latest month. Part to whole,
      which is the one job a circular form does better than a bar. ────────── */
const RADIAL = [...SLOPE]
  .map((d) => ({ name: d.name, value: d.b }))
  .sort((x, y2) => y2.value - x.value)
  .slice(0, 7)
  .map((d, i) => ({ ...d, fill: d.name === "Nigeria" ? C2 : i % 2 ? C1 : C4 }));

export function RadialShare() {
  const max = Math.max(...RADIAL.map((d) => d.value)) * 1.08;
  return (
    <ResponsiveContainer width="100%" height={288}>
      <RadialBarChart data={RADIAL} innerRadius="24%" outerRadius="98%" startAngle={90} endAngle={-270}>
        <PolarAngleAxis type="number" domain={[0, max]} tick={false} />
        <RadialBar background={{ fill: "var(--muted)" }} dataKey="value" cornerRadius={3} isAnimationActive={false} />
        <Tooltip
          cursor={false}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as { name: string; value: number };
            return (
              <div className="panel px-2.5 py-2 text-[11.5px]" style={{ background: "var(--popover)" }}>
                <div className="eyebrow mb-1">{d.name}</div>
                <div className="font-mono font-medium">{fmt(d.value)} tb/d</div>
              </div>
            );
          }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export function RadialLegend() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 pb-3 sm:grid-cols-4">
      {RADIAL.map((d) => (
        <span key={d.name} className="flex items-baseline gap-1.5 text-[11.5px]">
          <span className="mt-[3px] inline-block h-2 w-2 shrink-0 rounded-[1px]" style={{ background: d.fill }} />
          <span className="truncate text-muted-foreground">{d.name}</span>
          <span className="ml-auto font-mono tabular-nums">{fmt(d.value)}</span>
        </span>
      ))}
    </div>
  );
}

/* ── Barrel pictogram: output against the budget benchmark, one barrel per
      100 tb/d. A progress read, which is what a pictogram is actually for.
      Drum glyph is Game-icons.net by Delapouite, CC BY 3.0. ──────────────── */
export function BarrelGauge() {
  const actual = NG_SECONDARY[LAST] as number;
  const unit = 25;
  const target = Math.round(BENCH.budget / unit);      // 74 barrels
  const filled = Math.floor(actual / unit);
  const partial = (actual % unit) / unit;
  const shortfall = BENCH.budget - actual;

  return (
    <div className="flex flex-col gap-3 px-4 pb-3">
      <div className="flex flex-wrap items-end gap-[3px]">
        {Array.from({ length: target }).map((_, i) => (
          <span key={i} className="relative inline-flex" title={`${(i + 1) * unit} tb/d`}>
            {i < filled ? (
              <Icon name="barrel" size={21} style={{ color: C1 }} />
            ) : i === filled ? (
              <span className="relative inline-block leading-[0]">
                <Icon name="barrel" size={21} style={{ color: "var(--muted)" }} />
                <span className="absolute inset-0 overflow-hidden leading-[0]"
                      style={{ width: `${partial * 100}%` }}>
                  <Icon name="barrel" size={21} style={{ color: C1 }} />
                </span>
              </span>
            ) : (
              <Icon name="barrel" size={21} style={{ color: "var(--muted)" }} />
            )}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="flex items-baseline gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: C1 }} />
          <span className="text-[11.5px] text-muted-foreground">Produced</span>
          <span className="font-mono text-[13px] font-medium tabular-nums">{fmt(actual)}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: "var(--muted)" }} />
          <span className="text-[11.5px] text-muted-foreground">Short of benchmark</span>
          <span className="font-mono text-[13px] font-medium tabular-nums" style={{ color: C3 }}>
            {fmt(shortfall)}
          </span>
        </span>
        <span className="eyebrow ml-auto">One barrel = {unit} tb/d</span>
      </div>
    </div>
  );
}

/* ── Days of forward cover, as a count. Each mark is ten days. ──────────── */
export function CoverPictogram() {
  const cover = OECD_DAYS_COVER[LAST] ?? OECD_DAYS_COVER.filter(Boolean).slice(-1)[0] as number;
  const marks = 7;
  const filled = cover / 10;
  return (
    <div className="flex flex-col gap-2.5 px-4 pb-3">
      <div className="flex items-end gap-1.5">
        {Array.from({ length: marks }).map((_, i) => {
          const frac = Math.max(0, Math.min(1, filled - i));
          return (
            <span key={i} className="relative inline-block h-7 w-[26px]">
              <span className="absolute inset-0 rounded-[2px]" style={{ background: "var(--muted)" }} />
              <span className="absolute bottom-0 left-0 right-0 rounded-[2px]"
                    style={{ background: C4, height: `${frac * 100}%` }} />
            </span>
          );
        })}
        <span className="ml-2 font-mono text-[19px] font-medium tabular-nums leading-none">
          {cover.toFixed(1)}
        </span>
        <span className="mb-[2px] text-[11.5px] text-muted-foreground">days</span>
      </div>
      <p className="eyebrow">Each block = 10 days of forward cover</p>
    </div>
  );
}

/* ── Rig pictogram: rig count is an actual count, so one glyph per rig is an
      honest encoding. Splits the current fleet into the trough level and what
      has been added since, because the doubling is the story. Follows the
      shared time range, so the trough is the trough of what you are looking
      at. Derrick glyph is Game-icons.net by Delapouite, CC BY 3.0. ────────── */
export function RigPictogram() {
  const rigs = useWindow(NG_RIGS.map((v, i) => ({ v, m: MONTHS[i] })));
  const seen = rigs.filter((r) => r.v != null) as { v: number; m: string }[];
  if (!seen.length) return null;

  const current = seen[seen.length - 1];
  const trough = seen.reduce((a, b) => (b.v < a.v ? b : a));
  const peak = seen.reduce((a, b) => (b.v > a.v ? b : a));
  const added = Math.max(0, current.v - trough.v);
  const slots = Math.max(peak.v, current.v);

  return (
    <div className="flex flex-col gap-3 px-4 pb-3">
      <div className="flex flex-wrap items-end gap-[4px]">
        {Array.from({ length: slots }).map((_, i) => {
          const isBase = i < trough.v;
          const isAdded = i >= trough.v && i < current.v;
          return (
            <Icon
              key={i}
              name="oil_rig"
              size={26}
              title={i < current.v ? `Rig ${i + 1} of ${current.v}` : undefined}
              style={{ color: isBase ? C1 : isAdded ? C2 : "var(--muted)" }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5">
        <span className="flex items-baseline gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: C1 }} />
          <span className="text-[11.5px] text-muted-foreground">Trough, {monthLabel(trough.m)}</span>
          <span className="font-mono text-[13px] font-medium tabular-nums">{trough.v}</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: C2 }} />
          <span className="text-[11.5px] text-muted-foreground">Added since</span>
          <span className="font-mono text-[13px] font-medium tabular-nums" style={{ color: C2 }}>
            +{added}
          </span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[11.5px] text-muted-foreground">Now, {monthLabel(current.m)}</span>
          <span className="font-mono text-[15px] font-medium tabular-nums">{current.v}</span>
        </span>
        <span className="eyebrow ml-auto">One derrick = one active rig</span>
      </div>
    </div>
  );
}

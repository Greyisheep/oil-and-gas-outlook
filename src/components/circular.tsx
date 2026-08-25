"use client";
import { useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { MONTHS, PEERS, PEERS2, NG_SECONDARY } from "@/lib/opec-data";
import { fmt, monthLabel, BENCH } from "@/lib/model";

const LAST = MONTHS.length - 1;
const C1 = "var(--chart-1)", C2 = "var(--chart-2)";

/* ── Sunburst: OPEC total, then bloc, then member. A real two-level
      hierarchy, which is the case a sunburst is actually for. ───────────── */
type Node = { name: string; value: number };
const BLOCS: { name: string; hue: string; members: Node[] }[] = [
  {
    name: "Gulf", hue: "#eda100",
    members: [
      { name: "Saudi Arabia", value: PEERS.sa[LAST] as number },
      { name: "Iraq", value: PEERS.iq[LAST] as number },
      { name: "UAE", value: PEERS.ae[LAST] as number },
      { name: "Iran", value: PEERS.ir[LAST] as number },
      { name: "Kuwait", value: PEERS.kw[LAST] as number },
    ],
  },
  {
    name: "Africa", hue: "#1baf7a",
    members: [
      { name: "Nigeria", value: NG_SECONDARY[LAST] as number },
      { name: "Libya", value: PEERS.ly[LAST] as number },
      { name: "Algeria", value: PEERS.dz[LAST] as number },
      { name: "Congo", value: PEERS2.cg[LAST] as number },
      { name: "Gabon", value: PEERS2.ga[LAST] as number },
      { name: "Eq. Guinea", value: PEERS2.gq[LAST] as number },
    ],
  },
  {
    name: "Americas", hue: "#e34948",
    members: [{ name: "Venezuela", value: PEERS2.ve[LAST] as number }],
  },
].map((b) => ({ ...b, members: b.members.filter((m) => m.value != null) }));

const TOTAL = BLOCS.reduce((s, b) => s + b.members.reduce((t, m) => t + m.value, 0), 0);

/** Lighten a hex toward white by t, for member steps inside a bloc hue. */
function tint(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (c: number) => Math.round(c + (255 - c) * t);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

/** Round to 3dp. Server and client otherwise serialise trig results to
    different precision, which trips a React hydration mismatch. */
const q = (n: number) => Math.round(n * 1000) / 1000;

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const pt = (r: number, a: number) => [q(cx + r * Math.cos(a)), q(cy + r * Math.sin(a))];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1);
  const [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${large} 0 ${x3},${y3} Z`;
}

export function Sunburst() {
  const [hover, setHover] = useState<{ name: string; value: number; pct: number } | null>(null);
  const SZ = 372, cx = SZ / 2, cy = SZ / 2;
  const R = { hole: 46, blocIn: 46, blocOut: 96, memIn: 100, memOut: 158 };
  // barrel-top framing: a drum seen from above is already concentric rings, so
  // the decoration sits outside the data radius and changes no geometry.
  const RIM = { chime: 176, outer: 169, inner: 164 };
  const GAP = 0.012;

  let a = -Math.PI / 2;
  const blocArcs: React.ReactElement[] = [];
  const memArcs: React.ReactElement[] = [];

  BLOCS.forEach((bloc) => {
    const blocVal = bloc.members.reduce((t, m) => t + m.value, 0);
    const span = (blocVal / TOTAL) * Math.PI * 2;
    const a0 = a, a1 = a + span;

    blocArcs.push(
      <path
        key={bloc.name}
        d={arcPath(cx, cy, R.blocIn, R.blocOut, a0 + GAP, a1 - GAP)}
        fill={bloc.hue}
        stroke="var(--card)"
        strokeWidth={1.5}
        onMouseEnter={() => setHover({ name: bloc.name, value: blocVal, pct: (blocVal / TOTAL) * 100 })}
        onMouseLeave={() => setHover(null)}
        style={{ cursor: "pointer" }}
      />
    );

    // bloc label along the middle of its arc
    const mid = (a0 + a1) / 2;
    const lr = (R.blocIn + R.blocOut) / 2;
    blocArcs.push(
      <text
        key={`${bloc.name}-t`}
        x={q(cx + lr * Math.cos(mid))}
        y={q(cy + lr * Math.sin(mid) + 3.5)}
        textAnchor="middle"
        pointerEvents="none"
        style={{ fontSize: 11, fontFamily: "var(--font-plex-sans)", fontWeight: 600, fill: "#1a1a17" }}
      >
        {span > 0.35 ? bloc.name : ""}
      </text>
    );

    let ma = a0;
    bloc.members.forEach((m, i) => {
      const mspan = (m.value / TOTAL) * Math.PI * 2;
      const isNg = m.name === "Nigeria";
      memArcs.push(
        <path
          key={m.name}
          d={arcPath(cx, cy, R.memIn, isNg ? R.memOut + 8 : R.memOut, ma + GAP, ma + mspan - GAP)}
          fill={tint(bloc.hue, 0.12 + (i / Math.max(1, bloc.members.length)) * 0.55)}
          stroke={isNg ? "var(--foreground)" : "var(--card)"}
          strokeWidth={isNg ? 1.8 : 1.2}
          onMouseEnter={() => setHover({ name: m.name, value: m.value, pct: (m.value / TOTAL) * 100 })}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: "pointer" }}
        />
      );
      const mm = ma + mspan / 2;
      if (mspan > 0.19) {
        const rr = (R.memIn + R.memOut) / 2;
        memArcs.push(
          <text
            key={`${m.name}-t`}
            x={q(cx + rr * Math.cos(mm))}
            y={q(cy + rr * Math.sin(mm) + 3)}
            textAnchor="middle"
            pointerEvents="none"
            style={{ fontSize: 9.5, fontFamily: "var(--font-plex-mono)", fill: "#1a1a17" }}
          >
            {m.name.length > 11 ? m.name.slice(0, 9) + "…" : m.name}
          </text>
        );
      }
      ma += mspan;
    });
    a = a1;
  });

  const centre = hover ?? { name: "OPEC crude", value: TOTAL, pct: 100 };

  return (
    <div className="flex flex-col items-center gap-2 px-4 pb-2">
      <svg viewBox={`0 0 ${SZ} ${SZ}`} width="100%" style={{ maxWidth: 400 }} role="img"
           aria-label={`Sunburst of OPEC crude production by bloc and member, ${monthLabel(MONTHS[LAST])}`}>
        {/* barrel chime and hoops, framing only */}
        <circle cx={cx} cy={cy} r={RIM.chime} fill="none" stroke="var(--rule)" strokeWidth={7} />
        <circle cx={cx} cy={cy} r={RIM.chime} fill="none" stroke="var(--muted)" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={RIM.outer} fill="none" stroke="var(--rule)" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={RIM.inner} fill="none" stroke="var(--rule)" strokeWidth={1} />
        {blocArcs}
        {memArcs}
        {/* bung cap at the centre */}
        <circle cx={cx} cy={cy} r={R.hole - 2} fill="var(--card)" stroke="var(--rule)" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={R.hole - 7} fill="none" stroke="var(--rule)" strokeWidth={1} />
        <text x={cx} y={cy - 8} textAnchor="middle"
              style={{ fontSize: 10, fontFamily: "var(--font-plex-mono)", letterSpacing: "0.06em",
                       fill: "var(--muted-foreground)", textTransform: "uppercase" }}>
          {centre.name.length > 13 ? centre.name.slice(0, 12) + "…" : centre.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle"
              style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-plex-mono)", fill: "var(--foreground)" }}>
          {fmt(centre.value)}
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle"
              style={{ fontSize: 9.5, fontFamily: "var(--font-plex-mono)", fill: "var(--muted-foreground)" }}>
          {centre.pct.toFixed(1)}%
        </text>
      </svg>
      <p className="eyebrow">A barrel from above · inner ring is bloc, outer ring is member · hover a segment</p>
    </div>
  );
}

/* ── Radar: months wrap around a circle, so calendar seasonality is the one
      time-series shape a radar reads better than a line. ─────────────────── */
const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const radarData = MN.map((m, i) => {
  const key = (y: string) => MONTHS.indexOf(`${y}-${String(i + 1).padStart(2, "0")}`);
  const i25 = key("2025"), i26 = key("2026");
  return {
    month: m,
    "2025": i25 >= 0 ? NG_SECONDARY[i25] : null,
    "2026": i26 >= 0 ? NG_SECONDARY[i26] : null,
  };
});

export function SeasonalRadar() {
  return (
    <ResponsiveContainer width="100%" height={310}>
      <RadarChart data={radarData} outerRadius="72%">
        <PolarGrid stroke="var(--grid)" />
        <PolarAngleAxis dataKey="month"
          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-plex-mono)" }} />
        <PolarRadiusAxis angle={90} domain={[1200, 1700]} tickCount={4}
          tick={{ fill: "var(--muted-foreground)", fontSize: 9.5, fontFamily: "var(--font-plex-mono)" }} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="panel px-2.5 py-2 text-[11.5px]" style={{ background: "var(--popover)" }}>
                <div className="eyebrow mb-1">{label}</div>
                {payload.filter((p) => p.value != null).map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-3 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-[2.5px] w-3 rounded-full" style={{ background: p.color }} />
                      {p.name}
                    </span>
                    <span className="font-medium">{fmt(Number(p.value))} tb/d</span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11.5, fontFamily: "var(--font-plex-sans)" }} />
        <Radar name="2025" dataKey="2025" stroke={C1} fill={C1} fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
        <Radar name="2026" dataKey="2026" stroke={C2} fill={C2} fillOpacity={0.22} strokeWidth={2} isAnimationActive={false} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ── Gauge: one value against one target. ───────────────────────────────── */
export function BenchmarkGauge() {
  const v = NG_SECONDARY[LAST] as number;
  const pct = (v / BENCH.budget) * 100;
  const SZ = 240, cx = SZ / 2, cy = 138, r0 = 74, r1 = 104;
  const A0 = Math.PI, A1 = 2 * Math.PI;            // half circle, left to right
  const at = (p: number) => A0 + (Math.min(p, 120) / 120) * (A1 - A0);
  const quota = (BENCH.opecQuota / BENCH.budget) * 100;

  return (
    <div className="flex flex-col items-center px-4 pb-3">
      <svg viewBox={`0 0 ${SZ} 168`} width="100%" style={{ maxWidth: 300 }} role="img"
           aria-label={`Gauge: crude output at ${pct.toFixed(1)} percent of the budget benchmark`}>
        <path d={arcPath(cx, cy, r0, r1, A0, A1)} fill="var(--muted)" />
        <path d={arcPath(cx, cy, r0, r1, A0, at(pct))} fill={C1} />
        {/* the OPEC quota, marked on the same scale */}
        <line
          x1={q(cx + r0 * Math.cos(at(quota)))} y1={q(cy + r0 * Math.sin(at(quota)))}
          x2={q(cx + (r1 + 5) * Math.cos(at(quota)))} y2={q(cy + (r1 + 5) * Math.sin(at(quota)))}
          stroke="var(--foreground)" strokeWidth={1.5}
        />
        <text x={q(cx + (r1 + 13) * Math.cos(at(quota)))} y={q(cy + (r1 + 13) * Math.sin(at(quota)))}
              textAnchor="middle"
              style={{ fontSize: 9, fontFamily: "var(--font-plex-mono)", fill: "var(--muted-foreground)" }}>
          quota
        </text>
        <text x={cx} y={cy - 26} textAnchor="middle"
              style={{ fontSize: 27, fontWeight: 600, fontFamily: "var(--font-plex-mono)", fill: "var(--foreground)" }}>
          {pct.toFixed(1)}%
        </text>
        <text x={cx} y={cy - 8} textAnchor="middle"
              style={{ fontSize: 10, fontFamily: "var(--font-plex-mono)", fill: "var(--muted-foreground)",
                       letterSpacing: "0.06em" }}>
          OF BUDGET BENCHMARK
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle"
              style={{ fontSize: 11, fontFamily: "var(--font-plex-mono)", fill: "var(--muted-foreground)" }}>
          {fmt(v)} of {fmt(BENCH.budget)} tb/d
        </text>
      </svg>
    </div>
  );
}

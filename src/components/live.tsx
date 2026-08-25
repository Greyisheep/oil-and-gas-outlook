"use client";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import type { LivePrices } from "@/lib/live-prices";
import { Tip, AXIS, CURSOR, GRID, INK3 } from "./chart-kit";
import { BENCH } from "@/lib/model";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C4 = "var(--chart-4)";

const fmtDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1]}`;
};

/** Crude, then gas. Different units, so two panels rather than two scales. */
export function LivePriceChart({ data }: { data: LivePrices }) {
  const rows = data.points.map((p) => ({
    label: fmtDate(p.date),
    Brent: p.brent,
    WTI: p.wti,
    "Henry Hub": p.gas,
  }));
  const step = Math.max(1, Math.floor(rows.length / 7));

  return (
    <div className="flex flex-col gap-1">
      <ResponsiveContainer width="100%" height={186}>
        <LineChart data={rows} margin={{ top: 10, right: 14, left: -8, bottom: 0 }} syncId="live">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis {...AXIS} width={46} tickFormatter={(v) => `$${v}`} domain={["auto", "auto"]} />
          <Tooltip content={<Tip prefix="$" dp={2} />} cursor={CURSOR} />
          <ReferenceLine y={BENCH.budgetPrice} stroke={INK3} strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: `Nigeria budget $${BENCH.budgetPrice}`, position: "insideBottomRight",
                     fill: INK3, fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
          <Line type="monotone" dataKey="Brent" stroke={C1} strokeWidth={2} dot={false}
                isAnimationActive={false} connectNulls />
          <Line type="monotone" dataKey="WTI" stroke={C2} strokeWidth={2} dot={false}
                isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={112}>
        <AreaChart data={rows} margin={{ top: 6, right: 14, left: -8, bottom: 0 }} syncId="live">
          <defs>
            <linearGradient id="gasFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.26} />
              <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...AXIS} interval={step} />
          <YAxis {...AXIS} width={46} tickFormatter={(v) => `$${v}`} domain={["auto", "auto"]} />
          <Tooltip content={<Tip prefix="$" dp={2} />} cursor={CURSOR} />
          <Area type="monotone" dataKey="Henry Hub" stroke={C4} strokeWidth={2}
                fill="url(#gasFill)" dot={false} isAnimationActive={false} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Latest values with a freshness stamp, so nobody quotes a stale figure. */
export function LiveTicker({ data }: { data: LivePrices }) {
  const L = data.latest;
  const vsBudget = L.brent != null ? L.brent - BENCH.budgetPrice : null;
  const items: { label: string; value: string; sub: string; tone?: "good" | "bad" }[] = [
    { label: "Brent", value: L.brent != null ? `$${L.brent.toFixed(2)}` : "—", sub: "per barrel" },
    { label: "WTI", value: L.wti != null ? `$${L.wti.toFixed(2)}` : "—", sub: "per barrel" },
    { label: "Brent over WTI", value: data.spread != null ? `$${data.spread.toFixed(2)}` : "—", sub: "the discount US crude trades at" },
    { label: "Henry Hub gas", value: L.gas != null ? `$${L.gas.toFixed(2)}` : "—", sub: "per million BTU" },
    {
      label: "Against Nigeria's budget",
      value: vsBudget != null ? `${vsBudget >= 0 ? "+" : ""}$${vsBudget.toFixed(2)}` : "—",
      sub: `budget assumed $${BENCH.budgetPrice}`,
      tone: vsBudget != null && vsBudget >= 0 ? "good" : "bad",
    },
  ];
  return (
    <div className="flex flex-col gap-2 px-4 pb-1 pt-1">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((i) => (
          <div key={i.label} className="flex flex-col gap-0.5">
            <span className="eyebrow">{i.label}</span>
            <span className="font-mono text-[21px] font-medium leading-none tabular-nums"
                  style={i.tone ? { color: i.tone === "good" ? C2 : "var(--chart-3)" } : undefined}>
              {i.value}
            </span>
            <span className="text-[10.5px] leading-tight text-muted-foreground">{i.sub}</span>
          </div>
        ))}
      </div>
      <p className="eyebrow flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: data.live ? C2 : "var(--chart-3)" }}
          aria-hidden
        />
        {data.live
          ? `Live · last close ${L.date} · refreshes hourly`
          : `Feed unavailable · showing last known close ${L.date}`}
      </p>
    </div>
  );
}

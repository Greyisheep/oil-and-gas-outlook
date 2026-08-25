"use client";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from "recharts";
import { CLAIMS, VERDICT_LABEL, PRICE_CALLS, type Verdict } from "@/lib/scorecard";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)";
const GRID = "var(--grid)", INK3 = "var(--muted-foreground)";

const TONE: Record<Verdict, string> = {
  miss: C3,
  "wrong-sign": C3,
  basis: C1,
  "self-contradicted": C3,
  unsupported: C1,
  held: C2,
};

/** Forecast against outturn, one pair per call. */
export function PriceCallChart() {
  return (
    <ResponsiveContainer width="100%" height={216}>
      <BarChart data={PRICE_CALLS} margin={{ top: 10, right: 14, left: -8, bottom: 4 }} barGap={3}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" stroke={GRID} tickLine={false}
               tick={{ fill: INK3, fontSize: 10.5, fontFamily: "var(--font-plex-mono)" }} />
        <YAxis stroke={GRID} tickLine={false} width={46} domain={[0, 100]}
               tick={{ fill: INK3, fontSize: 10.5, fontFamily: "var(--font-plex-mono)" }}
               tickFormatter={(v) => `$${v}`} />
        <Tooltip
          cursor={{ fill: "var(--secondary)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="panel px-2.5 py-2 text-[11.5px]" style={{ background: "var(--popover)" }}>
                <div className="eyebrow mb-1">{label}</div>
                {payload.map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-3 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-[1px]" style={{ background: p.color }} />
                      {p.name}
                    </span>
                    <span className="font-medium">${Number(p.value).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <ReferenceLine y={91.35} stroke={C2} strokeDasharray="4 3" strokeWidth={1.5}
          label={{ value: "realised $91.35", position: "insideTopRight", fill: C2,
                   fontSize: 10, fontFamily: "var(--font-plex-mono)" }} />
        <Bar dataKey="forecast" name="Forecast" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {PRICE_CALLS.map((_, i) => <Cell key={i} fill={C3} />)}
        </Bar>
        <Bar dataKey="outturn" name="Realised" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {PRICE_CALLS.map((_, i) => <Cell key={i} fill={C2} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** The claim ledger itself. Each row expands to its working. */
export function ClaimLedger() {
  const [open, setOpen] = useState<string | null>("E1");
  return (
    <div className="flex flex-col divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
      {CLAIMS.map((c) => {
        const on = open === c.id;
        return (
          <div key={c.id}>
            <button
              onClick={() => setOpen(on ? null : c.id)}
              aria-expanded={on}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary/60
                         focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring)]"
            >
              <span className="eyebrow mt-[3px] w-7 shrink-0 text-[var(--brass)]">{c.id}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] leading-[1.5]">{c.claim}</span>
                <span className="eyebrow mt-1 flex flex-wrap items-center gap-1.5 normal-case tracking-normal">
                  {c.medium === "talk" && (
                    <span className="rounded-sm border border-[var(--rule)] px-1 py-px text-[9px] uppercase tracking-[0.08em]">
                      spoken
                    </span>
                  )}
                  {c.source} · {c.where}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="hidden text-right font-mono text-[11.5px] tabular-nums sm:block">
                  <span className="block text-muted-foreground line-through">{c.forecast}</span>
                  <span className="block font-medium">{c.outturn}</span>
                </span>
                <span
                  className="w-[104px] shrink-0 rounded-sm px-1.5 py-1 text-center text-[10px] font-medium"
                  style={{ color: TONE[c.verdict], background: "var(--secondary)" }}
                >
                  {VERDICT_LABEL[c.verdict]}
                </span>
              </span>
            </button>
            {on && (
              <p className="max-w-[86ch] px-4 pb-3.5 pl-[52px] text-[12px] leading-[1.6] text-muted-foreground">
                {c.note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { ChartFrame } from "./chart-frame";
import { projectCompany, nationalView, fmt, BENCH, type Scenario, type CompanyInput } from "@/lib/model";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)";
const GRID = "var(--grid)", INK3 = "var(--muted-foreground)";

function Lever({ label, unit, value, min, max, step, onChange, hint }: {
  label: string; unit: string; value: number; min: number; max: number;
  step: number; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="eyebrow" htmlFor={label}>{label}</label>
        <span className="font-mono text-[13px] font-medium tabular-nums">
          {unit === "$" ? "$" : ""}{fmt(value, step < 1 ? 2 : 0)}{unit !== "$" ? unit : ""}
        </span>
      </div>
      <input
        id={label} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--input)]
                   accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-4
                   focus-visible:outline-[var(--ring)]"
      />
      {hint && <p className="text-[10.5px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NumField({ label, unit, value, step = 1, onChange }: {
  label: string; unit: string; value: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span className="flex items-center gap-1 rounded-sm border border-[var(--input)] bg-[var(--card)] px-2 py-1.5
                       focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-[var(--ring)]">
        <input
          type="number" value={value} step={step}
          onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)}
          className="w-full bg-transparent font-mono text-[13px] tabular-nums outline-none"
        />
        <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">{unit}</span>
      </span>
    </label>
  );
}

type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number | string | null; color?: string }[];
  unit?: string; dp?: number;
};
function TipBox({ active, payload, label }: TipProps) {
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
          <span className="font-medium">${Number(p.value).toFixed(1)}m</span>
        </div>
      ))}
    </div>
  );
}

export function Console() {
  const [s, setS] = useState<Scenario>({ brent: 83.4, diff: 3.06, ngn: 1346.9, natProd: 1546 });
  const [c, setC] = useState<CompanyInput>({
    gross: 25000, wi: 45, opex: 24, royalty: 15, tax: 30, decline: 0.9, capex: 4,
  });
  const set = <K extends keyof Scenario>(k: K) => (v: Scenario[K]) => setS((p) => ({ ...p, [k]: v }));
  const setC_ = <K extends keyof CompanyInput>(k: K) => (v: CompanyInput[K]) => setC((p) => ({ ...p, [k]: v }));

  const rows = useMemo(() => projectCompany(s, c), [s, c]);
  const nat = useMemo(() => nationalView(s), [s]);
  const total = rows[rows.length - 1];
  const breakeven = c.opex / (1 - c.royalty / 100);

  return (
    <div className="flex flex-col gap-3">
      {/* ── levers ─────────────────────────────────────────────────────── */}
      <section className="panel px-4 py-4">
        <div className="mb-3.5 flex items-baseline gap-2">
          <span className="eyebrow text-[var(--brass)]">04</span>
          <h2 className="font-[family-name:var(--font-plex-serif)] text-[15px] font-semibold">Scenario levers</h2>
          <span className="text-[12px] text-muted-foreground">Every figure below and to the right responds live.</span>
        </div>
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <Lever label="Brent / Dated" unit="$" value={s.brent} min={40} max={140} step={0.5}
                 onChange={set("brent")} hint="Realised H1 2026 average was $91. Jan outlooks assumed $55 to $61." />
          <Lever label="Your differential" unit="$" value={s.diff} min={-10} max={12} step={0.01}
                 onChange={set("diff")} hint="Bonny vs Dated. Spot collapsed to +$0.05 in the Aug MOMR." />
          <Lever label="NGN per USD" unit="" value={s.ngn} min={800} max={2200} step={1}
                 onChange={set("ngn")} hint="₦1,346.90 on 21 Aug 2026. Fair-value estimates ₦1,130 to ₦1,142." />
          <Lever label="National output" unit=" tb/d" value={s.natProd} min={1100} max={2200} step={1}
                 onChange={set("natProd")} hint={`Budget benchmark ${fmt(BENCH.budget)} · MTEF target ${fmt(BENCH.mtefTarget)}`} />
        </div>

        <div className="rule-t mt-4 grid gap-x-6 gap-y-3 pt-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="National revenue, monthly" value={`$${nat.monthlyRev.toFixed(2)}bn`}
                sub={`vs $${nat.benchRev.toFixed(2)}bn at benchmark`} tone={nat.delta >= 0 ? "good" : "bad"} />
          <Stat label="Versus benchmark" value={`${nat.delta >= 0 ? "+" : ""}$${nat.delta.toFixed(2)}bn`}
                sub="per month" tone={nat.delta >= 0 ? "good" : "bad"} />
          <Stat label="Volume gap" value={`${nat.volGap >= 0 ? "+" : ""}${fmt(nat.volGap)} tb/d`}
                sub="against 1,840 budget" tone={nat.volGap >= 0 ? "good" : "bad"} />
          <Stat label="Price gap" value={`${nat.priceGap >= 0 ? "+" : ""}$${nat.priceGap.toFixed(2)}`}
                sub="against $64.85 budget" tone={nat.priceGap >= 0 ? "good" : "bad"} />
        </div>
      </section>

      {/* ── company outlook ────────────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <section className="panel px-4 py-4">
          <div className="mb-3.5 flex items-baseline gap-2">
            <span className="eyebrow text-[var(--brass)]">05</span>
            <h2 className="font-[family-name:var(--font-plex-serif)] text-[15px] font-semibold">Your position</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <NumField label="Gross field" unit="bpd" value={c.gross} step={500} onChange={setC_("gross")} />
            <NumField label="Working interest" unit="%" value={c.wi} onChange={setC_("wi")} />
            <NumField label="Opex" unit="$/bbl" value={c.opex} onChange={setC_("opex")} />
            <NumField label="Royalty" unit="%" value={c.royalty} onChange={setC_("royalty")} />
            <NumField label="Tax rate" unit="%" value={c.tax} onChange={setC_("tax")} />
            <NumField label="Decline" unit="%/mo" value={c.decline} step={0.1} onChange={setC_("decline")} />
            <NumField label="Capex" unit="$m/mo" value={c.capex} step={0.5} onChange={setC_("capex")} />
            <div className="flex flex-col justify-end">
              <span className="eyebrow">Cash breakeven</span>
              <span className="font-mono text-[13px] font-medium tabular-nums">${breakeven.toFixed(2)}/bbl</span>
            </div>
          </div>
          <div className="rule-t mt-3.5 flex flex-col gap-2.5 pt-3.5">
            <Stat label="Net entitlement, month 1" value={`${fmt(rows[0].prod)} bpd`} sub={`${c.wi}% of ${fmt(c.gross)} bpd gross`} />
            <Stat label="12-month net cash" value={`$${total.cum.toFixed(1)}m`}
                  sub={`₦${(total.cum * s.ngn / 1000).toFixed(1)}bn at ₦${fmt(s.ngn)}`}
                  tone={total.cum >= 0 ? "good" : "bad"} />
          </div>
          <p className="mt-3 text-[10.5px] leading-[1.5] text-muted-foreground">
            Illustrative fiscal model: tax applies to revenue net of royalty, opex and capex.
            Nigeria&rsquo;s actual PIA terms (PPT/HCT/CIT split, capital allowances, PSC cost
            recovery) are materially more complex. Order-of-magnitude, not a tax computation.
          </p>
        </section>

        <ChartFrame
          n="06"
          title="Twelve-month forward outlook"
          note="Monthly net cash and cumulative position under the levers above, from September 2026. Drag any lever and this redraws."
          source="Model output. Price and differential seeded from OPEC MOMR August 2026; FX from CBN/NAFEM 21 Aug 2026."
          legend={[
            { label: "Net cash, month", color: C1 },
            { label: "Cumulative", color: C2 },
          ]}
          table={<OutlookTable rows={rows} />}
        >
          <ResponsiveContainer width="100%" height={296}>
            <ComposedChart data={rows} margin={{ top: 10, right: 14, left: -6, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" stroke={GRID} tickLine={false}
                     tick={{ fill: INK3, fontSize: 10.5, fontFamily: "var(--font-plex-mono)" }} />
              <YAxis stroke={GRID} tickLine={false} width={52}
                     tick={{ fill: INK3, fontSize: 10.5, fontFamily: "var(--font-plex-mono)" }}
                     tickFormatter={(v) => `$${v}m`} />
              <Tooltip content={<TipBox />} cursor={{ fill: "var(--secondary)" }} />
              <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
              <Bar isAnimationActive={false} dataKey="netCash" name="Net cash, month" fill={C1} radius={[2, 2, 0, 0]} />
              <Line isAnimationActive={false} type="monotone" dataKey="cum" name="Cumulative" stroke={C2} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="eyebrow">{label}</span>
      <span className="font-mono text-[17px] font-medium leading-none tabular-nums"
            style={tone ? { color: tone === "good" ? "var(--chart-2)" : "var(--chart-3)" } : undefined}>
        {value}
      </span>
      {sub && <span className="text-[10.5px] leading-tight text-muted-foreground">{sub}</span>}
    </div>
  );
}

function OutlookTable({ rows }: { rows: ReturnType<typeof projectCompany> }) {
  const H = ["Month", "bpd net", "$/bbl", "Revenue", "Royalty", "Opex", "Tax", "Net cash", "Cumulative", "₦bn"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11.5px]">
        <thead>
          <tr className="rule-t border-b border-[var(--rule)]">
            {H.map((h, i) => (
              <th key={h} className={`eyebrow py-1.5 ${i === 0 ? "text-left" : "text-right"} whitespace-nowrap px-1.5`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {rows.map((r) => (
            <tr key={r.month} className="border-b border-[var(--rule)]/60">
              <td className="whitespace-nowrap px-1.5 py-1 text-left">{r.label}</td>
              <td className="px-1.5 py-1 text-right">{fmt(r.prod)}</td>
              <td className="px-1.5 py-1 text-right">{r.realised.toFixed(2)}</td>
              <td className="px-1.5 py-1 text-right">{r.revenue.toFixed(1)}</td>
              <td className="px-1.5 py-1 text-right text-muted-foreground">{r.royalty.toFixed(1)}</td>
              <td className="px-1.5 py-1 text-right text-muted-foreground">{r.opex.toFixed(1)}</td>
              <td className="px-1.5 py-1 text-right text-muted-foreground">{r.tax.toFixed(1)}</td>
              <td className="px-1.5 py-1 text-right font-medium">{r.netCash.toFixed(1)}</td>
              <td className="px-1.5 py-1 text-right font-medium">{r.cum.toFixed(1)}</td>
              <td className="px-1.5 py-1 text-right">{r.ngn.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";
import { useMemo, useState, type ReactNode } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import {
  CalendarDays, GitCompareArrows, CircleDollarSign, Landmark, Scale,
  BarChart3, Coins, FileText, LineChart, Table2, ChevronsUpDown, HandCoins,
} from "lucide-react";
import { projectCompany, nationalView, fmt, BENCH, type Scenario, type CompanyInput } from "@/lib/model";

const C1 = "var(--chart-1)", C2 = "var(--chart-2)", C3 = "var(--chart-3)", C4 = "var(--chart-4)";
const GRID = "var(--grid)", INK3 = "var(--muted-foreground)";

/* ── Panel title: 14px colored glyph + Body-04/Medium, per the frame ─────── */
function PanelTitle({ icon, tint, children, right }: {
  icon: ReactNode; tint: string; children: ReactNode; right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: tint }} className="shrink-0 [&>svg]:h-[14px] [&>svg]:w-[14px]">{icon}</span>
      <h2 className="display">{children}</h2>
      {right && <span className="caption ml-auto shrink-0">{right}</span>}
    </div>
  );
}

/* ── Lever: label + value over a 4px track, caption under. As drawn. ─────── */
function Lever({ icon, tint, label, display, value, min, max, step, onChange, hint }: {
  icon: ReactNode; tint: string; label: string; display: string;
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; hint: string;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span style={{ color: tint }} className="shrink-0 [&>svg]:h-[14px] [&>svg]:w-[14px]">{icon}</span>
        <label className="display flex-1 truncate" htmlFor={label}>{label}</label>
        <span className="display tnum shrink-0 text-right">{display}</span>
      </div>
      <input
        id={label} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="lever-track"
      />
      <p className="caption">{hint}</p>
    </div>
  );
}

/* ── Outcome: icon + label, H6 value in the semantic colour, caption ─────── */
function Outcome({ icon, label, sub, value, caption, tone }: {
  icon: ReactNode; label: string; sub?: string; value: string; caption: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-foreground [&>svg]:h-[14px] [&>svg]:w-[14px]">{icon}</span>
        <span className="display">
          {label}
          {sub && <span className="font-normal text-[var(--lighter)]"> · {sub}</span>}
        </span>
      </div>
      <span className="value" style={tone ? { color: tone === "good" ? "var(--pos)" : "var(--neg)" } : undefined}>
        {value}
      </span>
      <span className="body">{caption}</span>
    </div>
  );
}

/* ── Input field: 32px, r12, hairline, unit at the right. As drawn. ──────── */
function Field({ label, unit, value, step = 1, onChange }: {
  label: string; unit: string; value: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="caption font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="flex h-8 items-center justify-between gap-2 rounded-[12px] border-[0.8px] border-[var(--rule)]
                       bg-[var(--card)] px-3 focus-within:border-[var(--foreground)]">
        <input
          type="number" value={value} step={step}
          onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)}
          className="no-spinner w-full bg-transparent text-[12px] font-medium tabular-nums outline-none"
        />
        <span className="flex shrink-0 items-center gap-1 text-[var(--fade)]">
          <ChevronsUpDown size={11} aria-hidden />
          <span className="caption">{unit}</span>
        </span>
      </span>
    </label>
  );
}

type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number | string | null; color?: string }[];
};
function TipBox({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel px-3 py-2.5 text-[12px]" style={{ background: "var(--popover)" }}>
      <div className="caption mb-1">{label}</div>
      {payload.filter((p) => p.value != null).map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 tabular-nums">
          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: p.color }} />
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
    <div className="flex flex-col gap-4">
      {/* ── Scenario levers ──────────────────────────────────────────────── */}
      <section className="panel p-5">
        <PanelTitle icon={<LineChart />} tint={C4}>Scenario levers</PanelTitle>
        <p className="body mt-1">Every figure below and to the right responds live.</p>

        <div className="mt-4 grid rounded-[12px] border-[0.8px] border-[var(--rule)]
                        max-lg:divide-y lg:grid-cols-4 lg:divide-x divide-[var(--rule)] [&>*]:min-w-0">
          <Lever icon={<CalendarDays />} tint={C4} label="Brent / Dated"
                 display={`$${s.brent.toFixed(2)}`} value={s.brent} min={40} max={140} step={0.5}
                 onChange={set("brent")} hint="2026 avg: $91. Jan outlook: $55–$61." />
          <Lever icon={<GitCompareArrows />} tint={C3} label="Your differential"
                 display={`$${s.diff.toFixed(2)}`} value={s.diff} min={-10} max={12} step={0.01}
                 onChange={set("diff")} hint="Bonny vs Dated. Spot fell to +$0.05 in Aug." />
          <Lever icon={<CircleDollarSign />} tint={C2} label="NGN per USD"
                 display={fmt(s.ngn)} value={s.ngn} min={800} max={2200} step={1}
                 onChange={set("ngn")} hint="₦1,346.90 on 21 Aug 2026. Fair-value estimates ₦1,130 to ₦1,142." />
          <Lever icon={<Landmark />} tint={C1} label="National output"
                 display={`${fmt(s.natProd)} tb/d`} value={s.natProd} min={1100} max={2200} step={1}
                 onChange={set("natProd")} hint={`Budget benchmark ${fmt(BENCH.budget)} · MTEF target ${fmt(BENCH.mtefTarget)}`} />
        </div>

        <div className="mt-2 grid lg:grid-cols-4 [&>*]:min-w-0">
          <Outcome icon={<HandCoins />} label="National revenue" sub="Monthly"
                   value={`$${nat.monthlyRev.toFixed(2)}bn`}
                   caption={`vs $${nat.benchRev.toFixed(2)}bn at benchmark`}
                   tone={nat.delta >= 0 ? "good" : "bad"} />
          <Outcome icon={<Scale />} label="Versus benchmark"
                   value={`${nat.delta >= 0 ? "+" : ""}$${nat.delta.toFixed(2)}bn`}
                   caption="per month" tone={nat.delta >= 0 ? "good" : "bad"} />
          <Outcome icon={<BarChart3 />} label="Volume gap"
                   value={`${nat.volGap >= 0 ? "+" : ""}${fmt(nat.volGap)} tb/d`}
                   caption={`against ${fmt(BENCH.budget)} budget`} tone={nat.volGap >= 0 ? "good" : "bad"} />
          <Outcome icon={<Coins />} label="Price gap"
                   value={`${nat.priceGap >= 0 ? "+" : ""}$${nat.priceGap.toFixed(2)}`}
                   caption={`against $${BENCH.budgetPrice} budget`} tone={nat.priceGap >= 0 ? "good" : "bad"} />
        </div>
      </section>

      {/* ── Your position + forward outlook ─────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <section className="panel flex flex-col p-5">
          <PanelTitle icon={<FileText />} tint={C3}>Your position</PanelTitle>
          <p className="body mt-1">
            Fiscal model: tax on revenue after royalty, opex, capex. Nigeria&rsquo;s PIA terms are complex.
          </p>

          <div className="mt-4 grid grid-cols-2 border-b-[0.8px] border-[var(--rule)] pb-4">
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <HandCoins size={13} aria-hidden className="text-foreground" />
                <span className="caption font-medium text-[var(--muted-foreground)]">Net entitlement, month 1</span>
              </span>
              <span className="text-[18px] font-semibold leading-6 tabular-nums tracking-[-0.3px]">
                {fmt(rows[0].prod)} bpd
              </span>
              <span className="caption">{c.wi}% of {fmt(c.gross)} bpd gross</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <Coins size={13} aria-hidden className="text-foreground" />
                <span className="caption font-medium text-[var(--muted-foreground)]">12-month net cash</span>
              </span>
              <span className="text-[18px] font-semibold leading-6 tabular-nums tracking-[-0.3px]"
                    style={{ color: total.cum >= 0 ? "var(--pos)" : "var(--neg)" }}>
                ${total.cum.toFixed(1)}m
              </span>
              <span className="caption">₦{(total.cum * s.ngn / 1000).toFixed(1)}bn at ₦{fmt(s.ngn)}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3.5">
            <Field label="Gross field" unit="bpd" value={c.gross} step={500} onChange={setC_("gross")} />
            <Field label="Working interest" unit="%" value={c.wi} onChange={setC_("wi")} />
            <Field label="Opex" unit="$/bbl" value={c.opex} onChange={setC_("opex")} />
            <Field label="Royalty" unit="%" value={c.royalty} onChange={setC_("royalty")} />
            <Field label="Tax rate" unit="%" value={c.tax} onChange={setC_("tax")} />
            <Field label="Decline" unit="%/mo" value={c.decline} step={0.1} onChange={setC_("decline")} />
            <Field label="Capex" unit="$m/mo" value={c.capex} step={0.5} onChange={setC_("capex")} />
            <div className="flex flex-col justify-end gap-0.5">
              <span className="caption font-medium text-[var(--muted-foreground)]">Cash breakeven</span>
              <span className="text-[18px] font-semibold leading-6 tabular-nums tracking-[-0.3px]">
                ${breakeven.toFixed(2)}/bbl
              </span>
            </div>
          </div>
        </section>

        <section className="panel flex flex-col p-5">
          <PanelTitle icon={<LineChart />} tint={C2}>Twelve-month forward outlook</PanelTitle>
          <p className="body mt-1">
            Monthly net cash and cumulative position under the levers above, from September 2026.
            Drag any lever and this redraws.
          </p>

          <div className="well mt-4 flex-1 px-2 py-3">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={rows} margin={{ top: 8, right: 14, left: -6, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" stroke={GRID} tickLine={false}
                       tick={{ fill: INK3, fontSize: 11 }} />
                <YAxis stroke={GRID} tickLine={false} width={52}
                       tick={{ fill: INK3, fontSize: 11 }}
                       tickFormatter={(v) => `$${v}m`} />
                <Tooltip content={<TipBox />} cursor={{ fill: "var(--accent)" }} />
                <ReferenceLine y={0} stroke={INK3} strokeWidth={1} />
                <Bar isAnimationActive={false} dataKey="netCash" name="Net cash, month" fill={C1} radius={[2, 2, 0, 0]} />
                <Line isAnimationActive={false} type="monotone" dataKey="cum" name="Cumulative" stroke={C2} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* legend and source sit under the plot, centered, as drawn */}
          <div className="mt-3 flex items-center justify-center gap-5">
            {[{ l: "Net cash, month", c: C1 }, { l: "Cumulative", c: C2 }].map((x) => (
              <span key={x.l} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px]" style={{ background: x.c }} aria-hidden />
                <span className="text-[10px] leading-[14px] tracking-[0.25px] text-foreground">{x.l}</span>
              </span>
            ))}
          </div>
          <p className="mx-auto mt-1 max-w-[52ch] text-center text-[10px] leading-[14px] tracking-[0.25px] text-[var(--fade)]">
            Model output. Price and differential seeded from OPEC MOMR August 2026; FX from CBN/NAFEM
            21 Aug 2026.
          </p>
        </section>
      </div>

      {/* ── Projection detail ───────────────────────────────────────────── */}
      <section className="panel p-5">
        <PanelTitle icon={<Table2 />} tint={C3} right={`${rows.length} Months`}>
          Projection detail
        </PanelTitle>
        <div className="mt-4 overflow-x-auto">
          <OutlookTable rows={rows} />
        </div>
        <p className="caption mt-3">
          Model output. Illustrative fiscal treatment, not a tax computation.
        </p>
      </section>
    </div>
  );
}

function OutlookTable({ rows }: { rows: ReturnType<typeof projectCompany> }) {
  const H: { l: string; u?: string; left?: boolean }[] = [
    { l: "Month", left: true }, { l: "Net", u: "bpd" }, { l: "Realised", u: "$/bbl" },
    { l: "Revenue", u: "$m" }, { l: "Royalty", u: "$m" }, { l: "Opex", u: "$m" },
    { l: "Tax", u: "$m" }, { l: "Net cash", u: "$m" }, { l: "Cumulative", u: "$m" },
    { l: "Position", u: "₦bn" },
  ];
  return (
    <table className="w-full text-[14px] leading-5">
      <thead>
        <tr className="bg-[var(--plot)]">
          {H.map((h, i) => (
            <th key={h.l}
                className={`whitespace-nowrap px-3 py-2 font-medium text-foreground
                            ${h.left ? "text-left" : "text-right"}
                            ${i === 0 ? "rounded-l-[8px]" : ""} ${i === H.length - 1 ? "rounded-r-[8px]" : ""}`}>
              {h.l}{h.u && <span className="ml-1 font-normal text-[var(--fade)]">{h.u}</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {rows.map((r) => (
          <tr key={r.month} className="border-b-[0.8px] border-[var(--rule)] last:border-0">
            <td className="whitespace-nowrap px-3 py-2 text-left">{r.label}</td>
            <td className="px-3 py-2 text-right">{fmt(r.prod)}</td>
            <td className="px-3 py-2 text-right">{r.realised.toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{r.revenue.toFixed(1)}</td>
            <td className="px-3 py-2 text-right text-[var(--muted-foreground)]">{r.royalty.toFixed(1)}</td>
            <td className="px-3 py-2 text-right text-[var(--muted-foreground)]">{r.opex.toFixed(1)}</td>
            <td className="px-3 py-2 text-right text-[var(--muted-foreground)]">{r.tax.toFixed(1)}</td>
            <td className="px-3 py-2 text-right">
              <span className="inline-block rounded-[6px] bg-[var(--chip)] px-1.5 py-0.5 font-medium">
                {r.netCash.toFixed(1)}
              </span>
            </td>
            <td className="px-3 py-2 text-right font-medium">{r.cum.toFixed(1)}</td>
            <td className="px-3 py-2 text-right">{r.ngn.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

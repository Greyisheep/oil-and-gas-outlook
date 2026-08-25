import { KpiStrip, type Kpi } from "@/components/kpi";
import { ThemeToggle } from "@/components/masthead";
import { ChartFrame } from "@/components/chart-frame";
import { Console } from "@/components/console";
import {
  ProductionChart, ShareChart, PeerChart, RigChart, LagChart,
  PriceChart, DiffChart, GapChart,
} from "@/components/charts";
import {
  FreightChart, StocksChart, CorrelationPanel, FreightLagChart, ShareVsFreightChart, FreightScatter,
} from "@/components/analysis";
import { fmt, BENCH, monthLabel, buildSeries, rigLag, correlationTable, pearson, firstDiff, CORR_SERIES } from "@/lib/model";

const seriesData = buildSeries();
const lagCurve = rigLag(14);
import { MONTHS } from "@/lib/opec-data";

const last = seriesData[seriesData.length - 1];
const first = seriesData[0];
const L = {
  sec: last.secondary as number,
  dir: last.direct as number,
  share: last.opecShare as number,
  rigs: last.rigs as number,
  bonny: last.bonny as number,
  diff: last.diff as number,
  month: monthLabel(MONTHS[MONTHS.length - 1]),
};
const shareGain = L.share - (first.opecShare as number);
const lag = lagCurve.reduce((a, b) => (b.r > a.r ? b : a), lagCurve[0]);
const corrRows = correlationTable();
const nSurvive = corrRows.slice(0, 12).filter((r) => Math.abs(r.changes) >= 0.5 && !r.identity).length;
const nCollapse = corrRows.slice(0, 12).filter((r) => Math.abs(r.changes) < 0.5).length;
const shareFreight = pearson(firstDiff(CORR_SERIES["Nigeria share of OPEC"]), firstDiff(CORR_SERIES["Gulf to East freight"]));
const wafGulf = pearson(firstDiff(CORR_SERIES["WAF to US Gulf freight"]), firstDiff(CORR_SERIES["Gulf to East freight"]));
const wafGulfLevels = pearson(CORR_SERIES["WAF to US Gulf freight"], CORR_SERIES["Gulf to East freight"]);

const kpis: Kpi[] = [
  { label: `Crude output · ${L.month}`, value: fmt(L.sec), sub: "tb/d, OPEC secondary sources" },
  { label: "Versus budget benchmark", value: `${fmt(L.sec - BENCH.budget)}`, sub: `tb/d against ${fmt(BENCH.budget)}`, tone: "bad" },
  { label: "Share of OPEC crude", value: `${L.share.toFixed(2)}%`, sub: `${shareGain >= 0 ? "+" : ""}${shareGain.toFixed(2)}pp since Jun 2024`, tone: "good" },
  { label: "Reporting gap", value: `${fmt(L.sec - L.dir)}`, sub: "tb/d, secondary over Nigeria's own figure", tone: "warn" },
  { label: "Bonny Light", value: `$${L.bonny.toFixed(2)}`, sub: `${L.diff >= 0 ? "+" : ""}$${L.diff.toFixed(2)} vs Dated, monthly average` },
];

const SRC_MOMR = "OPEC Monthly Oil Market Report, 22 editions Sep 2024 to Aug 2026. Extracted from source PDFs; latest-vintage value per data month.";

function MiniTable({ cols, rows }: { cols: string[]; rows: (string | number | null)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11.5px]">
        <thead>
          <tr className="border-b border-[var(--rule)]">
            {cols.map((c, i) => (
              <th key={c} className={`eyebrow whitespace-nowrap px-1.5 py-1.5 ${i === 0 ? "text-left" : "text-right"}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--rule)]/60">
              {r.map((v, j) => (
                <td key={j} className={`px-1.5 py-1 ${j === 0 ? "text-left" : "text-right"}`}>{v ?? "·"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const prodRows = seriesData.map((d) => [d.label as string, d.secondary as number, d.direct as number, d.gap as number]);
const priceRows = seriesData.map((d) => [d.label as string, d.bonny as number, d.dated as number, d.diff as number]);
const rigRows = seriesData.map((d) => [d.label as string, d.rigs as number, d.secondary as number]);
const shareRows = seriesData.map((d) => [d.label as string, d.opecShare as number, d.secondary as number]);

export default function Page() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      {/* ── masthead ─────────────────────────────────────────────────────── */}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--rule)] pb-5">
        <div>
          <p className="eyebrow mb-2">Nigeria · upstream &amp; downstream · rebuilt from primary sources</p>
          <h1 className="font-[family-name:var(--font-plex-serif)] text-[27px] font-semibold leading-[1.1] sm:text-[33px]">
            Barrel Ledger
          </h1>
          <p className="mt-2 max-w-[68ch] text-[13px] leading-[1.55] text-muted-foreground">
            Twenty-six months of Nigerian production, pricing and drilling activity, parsed out of
            twenty-two OPEC Monthly Oil Market Reports rather than retyped from a summary deck.
            Every panel names its source and its vintage. The levers are live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="eyebrow hidden sm:inline">Data to {L.month}</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="mb-3"><KpiStrip items={kpis} /></div>

      {/* ── upstream ─────────────────────────────────────────────────────── */}
      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <ChartFrame
          n="01"
          title="Two official numbers for the same barrels"
          note={
            <>Nigeria&rsquo;s own submission runs consistently <em>below</em> the independent estimate,
            {" "}{fmt(L.dir)} against {fmt(L.sec)} tb/d in {L.month}. Direct communication sits just under
            the {fmt(BENCH.opecQuota)} tb/d quota; secondary sources put Nigeria over it. Both are official.</>
          }
          source={SRC_MOMR}
          legend={[{ label: "Secondary sources", color: "var(--chart-1)" }, { label: "Direct communication", color: "var(--chart-2)" }]}
          table={<MiniTable cols={["Month", "Secondary", "Direct", "Gap"]} rows={prodRows} />}
        >
          <ProductionChart />
        </ChartFrame>

        <ChartFrame
          n="02"
          title="Nigeria's share of OPEC crude"
          note={
            <>The Hormuz reallocation, in one line. Gulf output collapsed through 2026 while Nigeria held
            and grew, lifting its share {shareGain.toFixed(2)} points to {L.share.toFixed(2)}%.
            Nigeria did not produce dramatically more; it produced while others could not.</>
          }
          source={SRC_MOMR}
          legend={[{ label: "Nigeria share of OPEC crude", color: "var(--chart-2)" }]}
          table={<MiniTable cols={["Month", "Share %", "Nigeria tb/d"]} rows={shareRows} />}
        >
          <ShareChart />
        </ChartFrame>
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <ChartFrame
          n="03"
          title="Who kept their barrels, indexed to June 2024"
          note="Saudi Arabia, Iraq and Kuwait all fell sharply as the Strait closed. Nigeria is the flat line. Indexed to a common base so unlike volumes share one axis, never a second y-scale."
          source={SRC_MOMR}
          legend={[
            { label: "Nigeria", color: "var(--chart-2)" },
            { label: "Saudi Arabia", color: "var(--chart-1)" },
            { label: "Iraq", color: "var(--chart-3)" },
            { label: "Kuwait", color: "var(--chart-4)", dash: true },
          ]}
        >
          <PeerChart />
        </ChartFrame>

        <ChartFrame
          n="07"
          title="Bonny Light against North Sea Dated"
          note={
            <>Realised prices, monthly average. Brent ran far above Nigeria&rsquo;s ${BENCH.budgetPrice} budget
            benchmark through 2026. The price excuse was removed and the volume gap held anyway.</>
          }
          source={`${SRC_MOMR} Monthly averages; the MOMR narrative also quotes a spot differential, which is a different measure.`}
          legend={[{ label: "Bonny Light", color: "var(--chart-1)" }, { label: "North Sea Dated", color: "var(--chart-2)" }]}
          table={<MiniTable cols={["Month", "Bonny", "Dated", "Diff"]} rows={priceRows} />}
        >
          <PriceChart />
        </ChartFrame>
      </div>

      {/* ── the console ──────────────────────────────────────────────────── */}
      <div className="mb-3"><Console /></div>

      {/* ── lag & differentials ──────────────────────────────────────────── */}
      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <ChartFrame
          n="08"
          title="Rigs lead barrels"
          note="Active rigs above, crude output below, sharing one time axis. Two measures of different scale get two panels, not two y-scales."
          source={SRC_MOMR}
          legend={[{ label: "Active rigs", color: "var(--chart-1)" }, { label: "Crude production", color: "var(--chart-2)" }]}
          table={<MiniTable cols={["Month", "Rigs", "Crude tb/d"]} rows={rigRows} />}
          className="lg:col-span-2"
        >
          <RigChart />
        </ChartFrame>

        <ChartFrame
          n="09"
          title="How long the lag runs"
          note={<>Cross-correlation of rig count against production at each lag. Peak at{" "}
            <strong>{lag.lag} months</strong> (r = {lag.r.toFixed(2)}). Predictive, not causal, because rigs
            respond to price too.</>}
          source="Derived from the OPEC rig and production series above."
          legend={[{ label: "Correlation at lag", color: "var(--chart-2)" }]}
        >
          <LagChart />
        </ChartFrame>
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <ChartFrame
          n="10"
          title="The Bonny differential"
          note="Monthly-average premium of Bonny Light over North Sea Dated. Widened sharply with the Gulf disruption, then gave most of it back, a marketing and scheduling outcome, not a geopolitical one."
          source={SRC_MOMR}
          legend={[{ label: "Bonny Light vs Dated", color: "var(--chart-1)" }]}
          table={<MiniTable cols={["Month", "Bonny", "Dated", "Diff"]} rows={priceRows} />}
        >
          <DiffChart />
        </ChartFrame>

        <ChartFrame
          n="11"
          title="The reporting gap, month by month"
          note="Secondary-source estimate minus Nigeria's own submission. Persistently positive: independent assessors consistently see more Nigerian crude than Nigeria reports."
          source={SRC_MOMR}
          legend={[{ label: "Secondary above direct", color: "var(--chart-1)" }, { label: "Secondary below direct", color: "var(--chart-3)" }]}
          table={<MiniTable cols={["Month", "Secondary", "Direct", "Gap"]} rows={prodRows} />}
        >
          <GapChart />
        </ChartFrame>
      </div>


      {/* ── freight and the shipping layer ───────────────────────────────── */}
      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <ChartFrame
          n="12"
          title="Freight on Nigeria's own export routes"
          note={
            <>Worldscale spot rates. West Africa to US Gulf Coast is the Nigerian export leg, and it ran
            roughly 130% above year-earlier levels through mid 2026. The Gulf to East route is shown for
            contrast: it moved on Hormuz, West African rates largely did not follow it month to month.</>
          }
          source="OPEC Monthly Oil Market Report Tables 7-1 and 7-2, sourced to Argus and OPEC. Worldscale points, not dollars per tonne."
          legend={[
            { label: "WAF to US Gulf (Suezmax)", color: "var(--chart-1)" },
            { label: "WAF to East (VLCC)", color: "var(--chart-2)" },
            { label: "Gulf to East (VLCC)", color: "var(--chart-3)", dash: true },
          ]}
        >
          <FreightChart />
        </ChartFrame>

        <ChartFrame
          n="13"
          title="The one relationship that holds up"
          note={
            <>Nigeria&rsquo;s share of OPEC crude against Gulf freight rates, on a shared time axis.
            On month to month changes this is r = {shareFreight ? shareFreight.r.toFixed(2) : "n/a"},
            the strongest non trivial relationship in the whole set. Both are driven by the same
            disruption, so read it as a common cause, not as one causing the other.</>
          }
          source="Derived from OPEC production Table 5-7 and freight Table 7-1."
          legend={[
            { label: "Nigeria share of OPEC crude", color: "var(--chart-2)" },
            { label: "Gulf to East freight", color: "var(--chart-4)" },
          ]}
        >
          <ShareVsFreightChart />
        </ChartFrame>
      </div>

      {/* ── the honesty panel ────────────────────────────────────────────── */}
      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <ChartFrame
          n="14"
          title="Which correlations survive differencing"
          note={
            <>Every pair ranked by correlation on levels, then re run on month to month changes.
            Correlating two trending series inflates r towards 1 whether or not they are related, so
            the second column is the honest one. Of the twelve strongest, {nSurvive} survive,
            {" "}{nCollapse} collapse, and the rest are identities that cannot fail.</>
          }
          source="Pearson r. Levels use raw monthly values; changes use first differences. Identities are pairs where one series is computed from the other."
          className="lg:col-span-2"
        >
          <CorrelationPanel />
        </ChartFrame>

        <ChartFrame
          n="15"
          title="A finding that is not one"
          note={
            <>Freight against the Bonny differential at every lag. The two month bar clears 0.5, but the
            bars either side sit near zero. A real lag decays smoothly; a lone spike across seven tested
            lags at n under 20 is what searching for a result looks like. Shown so you can see it.</>
          }
          source="First differences of WAF to US Gulf freight against the Bonny to Dated differential. Shaded band marks the region where correlation is too weak to act on."
          legend={[{ label: "Correlation at lag", color: "var(--chart-3)" }]}
        >
          <FreightLagChart />
        </ChartFrame>
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <ChartFrame
          n="16"
          title="OECD stocks and days of forward cover"
          note="Commercial crude stocks above, days of forward cover below. Cover is the tighter measure because it normalises inventory against demand, and it has been running below both the five year and the 2015 to 2019 averages."
          source="OPEC Monthly Oil Market Report Table 9-1, sourced to EIA, IEA, METI, OilX and OPEC."
          legend={[
            { label: "OECD crude stocks, mb", color: "var(--chart-1)" },
            { label: "Days of forward cover", color: "var(--chart-2)" },
          ]}
        >
          <StocksChart />
        </ChartFrame>

        <ChartFrame
          n="17"
          title="West Africa is not simply following the Gulf"
          note={
            <>The two freight markets correlate at {wafGulfLevels ? wafGulfLevels.r.toFixed(2) : "n/a"} on
            levels, which looks like tight coupling. On changes that falls to
            {" "}{wafGulf ? wafGulf.r.toFixed(2) : "n/a"}. The apparent link is shared trend. West African
            rates are set by their own balance of tonnage and cargo. Each dot below is one month: if the
            two moved together the cloud would lie on a diagonal, and it does not.</>
          }
          source="Each point is one month. Axes are month on month changes in Worldscale points, so the shared trend is removed. 20 overlapping months."
          legend={[{ label: "One month, both routes", color: "var(--chart-1)" }]}
        >
          <FreightScatter />
        </ChartFrame>
      </div>

      <footer className="rule-t mt-6 pt-4">
        <div className="grid gap-4 text-[11.5px] leading-[1.6] text-muted-foreground sm:grid-cols-3">
          <p>
            <span className="eyebrow mb-1 block text-foreground">Sources</span>
            OPEC Monthly Oil Market Report (22 editions). Benchmarks: 2026 federal budget
            (1,840 tb/d, $64.85/b) and 2026-28 MTEF target (2,060 tb/d). FX from CBN/NAFEM.
          </p>
          <p>
            <span className="eyebrow mb-1 block text-foreground">Method</span>
            Tables parsed directly from the report PDFs, keyed by publication vintage, so revisions
            are preserved rather than overwritten. Crude-only throughout. Condensate is excluded,
            which is what makes quota comparisons valid.
          </p>
          <p>
            <span className="eyebrow mb-1 block text-foreground">Caveats</span>
            The fiscal model is illustrative. Rig-lag correlation is predictive, not causal.
            Where two official figures disagree, both are shown rather than averaged.
          </p>
        </div>
      </footer>
    </main>
  );
}

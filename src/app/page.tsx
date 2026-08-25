import { KpiStrip, type Kpi } from "@/components/kpi";
import { ChartFrame } from "@/components/chart-frame";
import { DataTable, type Col } from "@/components/data-table";
import { IconCredits } from "@/components/icon";
import { Shell, type Section } from "@/components/shell";
import { Console } from "@/components/console";
import {
  ProductionChart, ShareChart, PeerChart, RigChart, LagChart,
  PriceChart, DiffChart, GapChart,
} from "@/components/charts";
import {
  FreightChart, StocksChart, CorrelationPanel, FreightLagChart,
  ShareVsFreightChart, FreightScatter,
} from "@/components/analysis";
import { SlopeChart, BarrelGauge, CoverPictogram, RigPictogram } from "@/components/forms";
import { Sunburst, SeasonalRadar, BenchmarkGauge } from "@/components/circular";
import { ClaimLedger, PriceCallChart } from "@/components/scorecard";
import { ProjectionChart, BacktestRibbon, BacktestErrors, ModelCard } from "@/components/projection";
import { TargetSolver } from "@/components/solver";
import { RIG_LAG } from "@/lib/rig-lag";
import { SCORE } from "@/lib/scorecard";
import {
  fmt, BENCH, monthLabel, buildSeries, rigLag, correlationTable,
  pearson, firstDiff, CORR_SERIES,
} from "@/lib/model";
import {
  MONTHS, PEERS, WAF_USGC_SUEZ, WAF_EAST_VLCC, ME_EAST_VLCC, ME_WEST_VLCC,
  OECD_CRUDE_STOCK, OECD_DAYS_COVER, ORB, WTI,
} from "@/lib/opec-data";

const S = buildSeries();
const last = S[S.length - 1];
const first = S[0];
const lagCurve = rigLag(14);
const lag = lagCurve.reduce((a, b) => (b.r > a.r ? b : a), lagCurve[0]);
const corrRows = correlationTable();
const nTotal = corrRows.length;
const nSurvive = corrRows.filter((r) => Math.abs(r.changes) >= 0.5 && !r.identity).length;
const nCollapse = corrRows.filter((r) => Math.abs(r.changes) < 0.5).length;
const nIdentity = corrRows.filter((r) => r.identity).length;
const shareFreight = pearson(firstDiff(CORR_SERIES["Nigeria share of OPEC"]), firstDiff(CORR_SERIES["Gulf to East freight"]));
const wafGulf = pearson(firstDiff(CORR_SERIES["WAF to US Gulf freight"]), firstDiff(CORR_SERIES["Gulf to East freight"]));
const wafGulfLevels = pearson(CORR_SERIES["WAF to US Gulf freight"], CORR_SERIES["Gulf to East freight"]);

const L = {
  sec: last.secondary as number,
  dir: last.direct as number,
  share: last.opecShare as number,
  bonny: last.bonny as number,
  diff: last.diff as number,
  month: monthLabel(MONTHS[MONTHS.length - 1]),
};
const shareGain = L.share - (first.opecShare as number);

const REPO = "https://github.com/Greyisheep/oil-and-gas-outlook";
const MOMR = "OPEC Monthly Oil Market Report, 22 editions Sep 2024 to Aug 2026.";

const kpis: Kpi[] = [
  { label: `Crude output · ${L.month}`, value: fmt(L.sec), sub: "tb/d, OPEC secondary sources" },
  { label: "Versus budget benchmark", value: fmt(L.sec - BENCH.budget), sub: `tb/d against ${fmt(BENCH.budget)}`, tone: "bad" },
  { label: "Share of OPEC crude", value: `${L.share.toFixed(2)}%`, sub: `${shareGain >= 0 ? "+" : ""}${shareGain.toFixed(2)}pp since Jun 2024`, tone: "good" },
  { label: "Reporting gap", value: fmt(L.sec - L.dir), sub: "tb/d, secondary over Nigeria's own figure", tone: "warn" },
  { label: "Bonny Light", value: `$${L.bonny.toFixed(2)}`, sub: `${L.diff >= 0 ? "+" : ""}$${L.diff.toFixed(2)} vs Dated, monthly average` },
];

/* ── table row builders ────────────────────────────────────────────────── */
const prodRows = S.map((d, i) => ({
  month: d.label, secondary: d.secondary, direct: d.direct, gap: d.gap,
  share: d.opecShare, saudi: PEERS.sa[i], iraq: PEERS.iq[i],
}));
const priceRows = S.map((d, i) => ({
  month: d.label, orb: ORB[i], bonny: d.bonny, dated: d.dated, wti: WTI[i], diff: d.diff,
}));
const freightRows = MONTHS.map((m, i) => ({
  month: monthLabel(m), wafUsgc: WAF_USGC_SUEZ[i], wafEast: WAF_EAST_VLCC[i],
  gulfEast: ME_EAST_VLCC[i], gulfWest: ME_WEST_VLCC[i],
}));
const activityRows = S.map((d, i) => ({
  month: d.label, rigs: d.rigs, prod: d.secondary,
  stock: OECD_CRUDE_STOCK[i], cover: OECD_DAYS_COVER[i],
}));
const corrTableRows = corrRows.map((r) => ({
  pair: `${r.a} ~ ${r.b}`, levels: r.levels, changes: r.changes, n: r.n,
  verdict: r.identity ? "identity" : Math.abs(r.changes) >= 0.5 ? "survives" : "collapses",
}));

const C: Record<string, Col> = {
  month: { key: "month", label: "Month", align: "left" },
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="eyebrow">{label}</span>
      <span
        className="font-mono text-[19px] font-medium leading-none tabular-nums"
        style={
          tone
            ? { color: tone === "good" ? "var(--chart-2)" : tone === "warn" ? "var(--chart-1)" : "var(--chart-3)" }
            : undefined
        }
      >
        {value}
      </span>
    </span>
  );
}

/* ── sections ──────────────────────────────────────────────────────────── */
const sections: Section[] = [
  {
    id: "production",
    label: "Production",
    group: "Market",
    blurb: "Nigerian crude on both official bases, its share of OPEC, and how it compares with the Gulf.",
    content: (
      <div className="flex flex-col gap-3">
        <KpiStrip items={kpis} />
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="01" title="Two official numbers for the same barrels"
            note={<>Nigeria&rsquo;s own submission runs consistently below the independent estimate,
              {" "}{fmt(L.dir)} against {fmt(L.sec)} tb/d in {L.month}. Direct communication sits just under
              the {fmt(BENCH.opecQuota)} tb/d quota; secondary sources put Nigeria over it. Both are official.</>}
            legend={[{ label: "Secondary sources", color: "var(--chart-1)" }, { label: "Direct communication", color: "var(--chart-2)" }]}
          ><ProductionChart /></ChartFrame>

          <ChartFrame
            n="02" title="Nigeria's share of OPEC crude"
            note={<>The Hormuz reallocation in one line. Gulf output collapsed through 2026 while Nigeria
              held and grew, lifting its share {shareGain.toFixed(2)} points to {L.share.toFixed(2)}%.
              Nigeria did not produce dramatically more, it produced while others could not.</>}
            legend={[{ label: "Nigeria share of OPEC crude", color: "var(--chart-2)" }]}
          ><ShareChart /></ChartFrame>

          <ChartFrame
            n="03" title="Output against the budget benchmark"
            note={<>Each barrel is 25 tb/d. Nigeria filled {fmt(L.sec)} of the {fmt(BENCH.budget)} tb/d the
              2026 budget assumed, leaving {fmt(BENCH.budget - L.sec)} tb/d unfilled. At the Brent price
              actually realised this year, that shortfall is worth roughly $0.8bn a month in gross export
              value, which is more than the price gain the year delivered.</>}
          ><BarrelGauge /></ChartFrame>

          <ChartFrame
            n="04" title="Who kept their barrels"
            note="Every OPEC member's crude output at the start and end of the window. Green gained, red lost. Saudi Arabia, Iraq and Kuwait each lost a fifth or more of their volume as the Strait closed. Nigeria is one of the few that finished higher than it started."
            legend={[{ label: "Gained", color: "var(--chart-2)" }, { label: "Lost", color: "var(--chart-3)" }]}
          ><SlopeChart /></ChartFrame>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="05" title={`OPEC crude by bloc and member, ${L.month}`} defaultOpen
            note={<>OPEC crude for the month, by bloc on the inner ring and member on the outer. The Gulf
              still carries most of it, but the African arc is wider than at any earlier point in this
              series: Gulf output fell hard as the Strait closed while African producers held their volumes.
              Nigeria is the largest African member and is outlined.</>}
          ><Sunburst /></ChartFrame>

          <ChartFrame
            n="06" title="The reporting gap, month by month"
            note="Secondary-source estimate minus Nigeria's own submission. Persistently positive: independent assessors consistently see more Nigerian crude than Nigeria reports."
            legend={[{ label: "Secondary above direct", color: "var(--chart-1)" }, { label: "Secondary below direct", color: "var(--chart-3)" }]}
          ><GapChart /></ChartFrame>
        </div>

        <div className="grid gap-3 xl:grid-cols-[320px_1fr]">
          <ChartFrame
            n="07" title="Against benchmark and quota"
            note="Nigeria produced 84% of the volume the 2026 budget assumed. The tick marks the 1,500 tb/d OPEC quota, which sits below the budget line. Nigeria is above its quota and below its budget at the same time, which is why compliance and fiscal performance point in opposite directions."
          ><BenchmarkGauge /></ChartFrame>

          <ChartFrame
            n="08" title="Monthly shape, 2025 against 2026"
            note="Nigerian output by calendar month, one ring per year. February is the weak month in both years, but the 2026 dip is far deeper, and the recovery through the second quarter is correspondingly steeper. The 2026 ring stops at July because that is where the data ends."
            legend={[{ label: "2025", color: "var(--chart-1)" }, { label: "2026", color: "var(--chart-2)" }]}
          ><SeasonalRadar /></ChartFrame>
        </div>

        <ChartFrame
          n="09" title="Peer producers over time, indexed to June 2024"
          note="The same producers month by month, so you can see when each one broke rather than only where it ended. The Gulf declines are abrupt and dated to the closure of the Strait; Nigeria's line is comparatively flat throughout."
          legend={[
            { label: "Nigeria", color: "var(--chart-2)" },
            { label: "Saudi Arabia", color: "var(--chart-1)" },
            { label: "Iraq", color: "var(--chart-3)" },
            { label: "Kuwait", color: "var(--chart-4)", dash: true },
          ]}
        ><PeerChart /></ChartFrame>

        <DataTable
          n="T1" title="Monthly production" maxHeight={520}
          note="Crude only, condensate excluded, which is what makes the quota comparison valid."
          source={`${MOMR} Tables 5-7 and 5-8. Latest-vintage value per data month.`}
          cols={[
            C.month,
            { key: "secondary", label: "Secondary", unit: "tb/d", emphasis: true, bar: true },
            { key: "direct", label: "Direct", unit: "tb/d" },
            { key: "gap", label: "Gap", unit: "tb/d" },
            { key: "share", label: "OPEC share", unit: "%", dp: 2 },
            { key: "saudi", label: "Saudi", unit: "tb/d" },
            { key: "iraq", label: "Iraq", unit: "tb/d" },
          ]}
          rows={prodRows}
        />
      </div>
    ),
  },
  {
    id: "prices",
    label: "Prices",
    group: "Market",
    blurb: "Realised crude prices and what Nigerian grades actually fetch against the benchmark.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="10" title="Bonny Light against North Sea Dated"
            note={<>Realised prices, monthly average. Brent ran far above Nigeria&rsquo;s ${BENCH.budgetPrice} budget
              benchmark through 2026. The price excuse was removed and the volume gap held anyway.</>}
            legend={[{ label: "Bonny Light", color: "var(--chart-1)" }, { label: "North Sea Dated", color: "var(--chart-2)" }]}
          ><PriceChart /></ChartFrame>

          <ChartFrame
            n="11" title="The Bonny differential"
            note="Monthly-average premium of Bonny Light over North Sea Dated. Widened sharply with the Gulf disruption, then gave most of it back, which is a marketing and scheduling outcome rather than a geopolitical one."
            source="The MOMR narrative also quotes a spot differential, a different measure that fell to a premium of $0.05/b in the August edition."
            legend={[{ label: "Bonny Light vs Dated", color: "var(--chart-1)" }]}
          ><DiffChart /></ChartFrame>
        </div>

        <DataTable
          n="T2" title="Monthly prices" maxHeight={520}
          note="OPEC Reference Basket alongside the two benchmarks that matter for Nigerian barrels."
          source={`${MOMR} Table 1-1, sourced to Argus, direct communication and OPEC.`}
          cols={[
            C.month,
            { key: "orb", label: "ORB", unit: "$/b", dp: 2 },
            { key: "bonny", label: "Bonny Light", unit: "$/b", dp: 2, emphasis: true, bar: true },
            { key: "dated", label: "N Sea Dated", unit: "$/b", dp: 2 },
            { key: "wti", label: "WTI", unit: "$/b", dp: 2 },
            { key: "diff", label: "Bonny diff", unit: "$/b", dp: 2, emphasis: true },
          ]}
          rows={priceRows}
        />
      </div>
    ),
  },
  {
    id: "shipping",
    label: "Shipping",
    group: "Market",
    blurb: "Tanker freight on Nigeria's own export routes, and whether they follow the Gulf.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="12" title="Freight on Nigeria's own export routes" defaultOpen
            note={<>Worldscale spot rates. West Africa to US Gulf Coast is the Nigerian export leg, and it ran
              roughly 130% above year-earlier levels through mid 2026. The Gulf to East route is shown for
              contrast: it moved on Hormuz, West African rates largely did not follow it month to month.</>}
            legend={[
              { label: "WAF to US Gulf (Suezmax)", color: "var(--chart-1)" },
              { label: "WAF to East (VLCC)", color: "var(--chart-2)" },
              { label: "Gulf to East (VLCC)", color: "var(--chart-3)", dash: true },
            ]}
          ><FreightChart /></ChartFrame>

          <ChartFrame
            n="13" title="The one relationship that holds up"
            note={<>Nigeria&rsquo;s share of OPEC crude against Gulf freight rates on a shared time axis.
              On month to month changes this is r = {shareFreight ? shareFreight.r.toFixed(2) : "n/a"},
              the strongest non trivial relationship in the set. Both are driven by the same disruption,
              so read it as common cause, not one causing the other.</>}
            legend={[
              { label: "Nigeria share of OPEC crude", color: "var(--chart-2)" },
              { label: "Gulf to East freight", color: "var(--chart-4)" },
            ]}
          ><ShareVsFreightChart /></ChartFrame>
        </div>

        <ChartFrame
          n="14" title="West Africa is not simply following the Gulf" defaultOpen
          note={<>The two freight markets correlate at {wafGulfLevels ? wafGulfLevels.r.toFixed(2) : "n/a"} on
            levels, which looks like tight coupling. On changes that falls to
            {" "}{wafGulf ? wafGulf.r.toFixed(2) : "n/a"}. The apparent link is shared trend. West African
            rates are set by their own balance of tonnage and cargo available on this coast, not by what
            happens in the Gulf. Each dot is one month of change in both routes.</>}
          source="Axes are month on month changes in Worldscale points, so the shared trend is removed. 20 overlapping months."
          legend={[{ label: "One month, both routes", color: "var(--chart-1)" }]}
        ><FreightScatter /></ChartFrame>

        <DataTable
          n="T3" title="Spot tanker freight rates" maxHeight={520}
          note="Worldscale points, not dollars per tonne. The first column is the Nigeria to US Gulf leg."
          source={`${MOMR} Tables 7-1 and 7-2, sourced to Argus and OPEC.`}
          cols={[
            C.month,
            { key: "wafUsgc", label: "WAF to USGC", unit: "WS", emphasis: true, bar: true },
            { key: "wafEast", label: "WAF to East", unit: "WS" },
            { key: "gulfEast", label: "Gulf to East", unit: "WS" },
            { key: "gulfWest", label: "Gulf to West", unit: "WS" },
          ]}
          rows={freightRows}
        />
      </div>
    ),
  },
  {
    id: "drilling",
    label: "Drilling & stocks",
    group: "Activity",
    blurb: "Rig activity as a leading indicator, and OECD inventory cover as the tightness measure.",
    content: (
      <div className="flex flex-col gap-3">
        <ChartFrame
          n="15" title="The rig fleet, one derrick per rig" defaultOpen
          note="Nigeria's active fleet has roughly doubled off its low, from 9 rigs to 18. Gold is the trough level, green is what has been added since. The fleet is still thin: Nigeria produces about 86 tb/d per active rig against Algeria's 24 and Saudi Arabia's 27. That reflects high flow rates per well, but also very little sustaining drilling to hold the base."
          source="OPEC Monthly Oil Market Report Table 11-5. OPEC's count differs from NUPRC's fleet disposition; see Method."
        ><RigPictogram /></ChartFrame>

        <div className="grid gap-3 xl:grid-cols-3">
          <ChartFrame
            n="16" title="Rigs lead barrels" className="xl:col-span-2"
            note="Active rigs above, crude output below, on a shared time axis. Rigs bottomed in May 2025 and output bottomed in February 2026, so the fleet turns roughly three quarters before the barrels do. That lag is the reason rig count is worth watching at all."
            legend={[{ label: "Active rigs", color: "var(--chart-1)" }, { label: "Crude production", color: "var(--chart-2)" }]}
          ><RigChart /></ChartFrame>

          <ChartFrame
            n="17" title="How long the lag runs"
            note={<>Cross-correlation of rig count against production at each lag. Peak at{" "}
              <strong>{lag.lag} months</strong> (r = {lag.r.toFixed(2)}). Predictive, not causal, because
              rigs respond to price too.</>}
            legend={[{ label: "Correlation at lag", color: "var(--chart-2)" }]}
          ><LagChart /></ChartFrame>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <ChartFrame
          n="18" title="OECD stocks and days of forward cover"
          note="Commercial crude stocks above, days of forward cover below. Both have drifted lower through 2026. Cover is the tighter of the two because it normalises inventory against demand: a stock build means little if consumption is rising faster than the barrels going in."
          source={`${MOMR} Table 9-1, sourced to EIA, IEA, METI, OilX and OPEC.`}
          legend={[
            { label: "OECD crude stocks, mb", color: "var(--chart-1)" },
            { label: "Days of forward cover", color: "var(--chart-2)" },
          ]}
        ><StocksChart /></ChartFrame>

        <ChartFrame
          n="19" title="Where cover sits right now" defaultOpen
          note="How many days of demand OECD commercial stocks would cover. Each block is ten days. The five year average sits near 61 days and the 2015 to 2019 average near 62, so the current reading is below both, which is the tightest read in this dataset."
        ><CoverPictogram /></ChartFrame>
        </div>

        <DataTable
          n="T4" title="Rig activity and inventory" maxHeight={520}
          source={`${MOMR} Tables 11-5 and 9-1. OPEC's rig count differs from NUPRC's fleet count; see Method.`}
          cols={[
            C.month,
            { key: "rigs", label: "Nigeria rigs", unit: "units", emphasis: true, bar: true },
            { key: "prod", label: "Crude output", unit: "tb/d" },
            { key: "stock", label: "OECD crude stocks", unit: "mb" },
            { key: "cover", label: "Days cover", unit: "days", dp: 1 },
          ]}
          rows={activityRows}
        />
      </div>
    ),
  },
  {
    id: "projection",
    label: "Projection",
    group: "Analysis",
    blurb: "What rigs already turning imply for output nine months out, and how the model has actually performed.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="panel px-5 py-4">
          <p className="max-w-[88ch] text-[13px] leading-[1.6]">
            This is not a forecast of drilling. Those rigs have already turned. Nigerian output follows
            its rig count by about <strong>{RIG_LAG.lag} months</strong>, so the fleet that was working
            through late 2025 and the first half of 2026 already implies a production path out to{" "}
            <strong>{monthLabel(RIG_LAG.projection[RIG_LAG.projection.length - 1].month)}</strong>.
            No assumption about future rigs, prices or policy is required to draw it.
          </p>
          <div className="rule-t mt-3.5 flex flex-wrap gap-x-8 gap-y-2 pt-3.5">
            <Stat label="Lag" value={`${RIG_LAG.lag} months`} />
            <Stat label="Per additional rig" value={`+${Math.round(RIG_LAG.slope)} tb/d`} tone="good" />
            <Stat label="MASE vs naive" value={String(RIG_LAG.mase)} tone={RIG_LAG.mase < 1 ? "good" : "bad"} />
            <Stat label="Backtest origins" value={String(RIG_LAG.origins)} tone="warn" />
            <Stat label="80% band" value={`± ${RIG_LAG.band80} tb/d`} />
          </div>
        </div>

        <ChartFrame
          n="20" title="What would it take?" defaultOpen
          note={<>The model runs backwards as easily as forwards. Set a production target and it returns
            the rig count that Nigeria&rsquo;s own historical relationship says would be required, and how
            far that sits from the fleet actually drilling. This is the honest form of the question:
            not what output will be, but what a given output would demand.</>}
          source="Inversion of the same fitted relationship. Extrapolation beyond the observed rig range is flagged in the panel rather than returned silently."
        ><TargetSolver /></ChartFrame>

        <ChartFrame
          n="21" title="Output implied by rigs already turning" defaultOpen
          note={<>Solid green is what happened. Dashed gold is the path implied by rigs that were already
            drilling, carried forward {RIG_LAG.lag} months. The shaded band is the 80% conformal interval
            taken from the model&rsquo;s own backtest errors, not from its standard errors, so it reflects
            how wrong this model has actually been rather than how wrong it believes it could be.</>}
          source={`Fitted on ${RIG_LAG.n} observations of OPEC secondary-source production against OPEC rig counts. Coefficients and bands regenerate from data-pipeline/rig_lag.py.`}
          legend={[
            { label: "Actual", color: "var(--chart-2)" },
            { label: "Implied by rigs already turning", color: "var(--chart-1)", dash: true },
          ]}
        ><ProjectionChart /></ChartFrame>

        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="22" title="What it would have said at the time" defaultOpen
            note="Rolling-origin backtest. At each month the model is refitted on only the data available then, and asked for that month. Nothing downstream of the origin is used, so this is what it would genuinely have printed rather than a fit drawn through known answers."
            legend={[
              { label: "Actual", color: "var(--chart-2)" },
              { label: "Model, refitted at each origin", color: "var(--chart-1)", dash: true },
            ]}
          ><BacktestRibbon /></ChartFrame>

          <ChartFrame
            n="23" title="How wrong it was, month by month"
            note={<>The same backtest as errors. Green sits inside the 80% band, red outside. Two of{" "}
              {RIG_LAG.origins} fall outside, which is roughly what an 80% band should do. The band is
              wide because the model has genuinely missed by that much, not because the interval was
              padded for comfort.</>}
            legend={[
              { label: "Inside the band", color: "var(--chart-2)" },
              { label: "Outside", color: "var(--chart-3)" },
            ]}
          ><BacktestErrors /></ChartFrame>
        </div>

        <section className="panel flex flex-col">
          <header className="flex items-baseline gap-2 px-4 pt-3.5 pb-3">
            <span className="eyebrow text-[var(--brass)]">23</span>
            <h2 className="display text-[14.5px] leading-tight">The model, and where it breaks</h2>
          </header>
          <ModelCard />
        </section>
      </div>
    ),
  },
  {
    id: "outlook",
    label: "Outlook",
    group: "Analysis",
    blurb: "Move the levers, get a twelve-month forward projection for your own position.",
    content: <Console />,
  },
  {
    id: "decks",
    label: "Outlook vs outturn",
    group: "Analysis",
    blurb: "What the published outlooks forecast for 2026, scored against the primary data.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="panel px-5 py-4">
          <p className="max-w-[86ch] text-[13px] leading-[1.6]">
            Nigerian sector outlooks publish in <strong>January</strong>. The Middle East escalation
            began <strong>28 February 2026</strong> and the Strait of Hormuz closed. Every
            January-vintage deck was built on a Brent assumption near $55 to $61, and almost none has
            been re-based since. Anything downstream of the price deck inherits the error.
          </p>
          <div className="rule-t mt-3.5 flex flex-wrap gap-x-8 gap-y-2 pt-3.5">
            <Stat label="Claims scored" value={String(SCORE.total)} />
            <Stat label="Forecast missed" value={String(SCORE.missed)} tone="bad" />
            <Stat label="Self-contradicted" value={String(SCORE.contradicted)} tone="bad" />
            <Stat label="Basis mismatch" value={String(SCORE.basis)} tone="warn" />
            <Stat label="Held up" value={String(SCORE.held)} tone="good" />
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_400px]">
          <ChartFrame
            n="24" title="The claim ledger" defaultOpen
            note="Each claim quoted verbatim from the published deck, then scored against the series extracted from OPEC reports. Click a row for the working. The last row is included so this does not read as one-directional: the structural calls in these decks are generally sound, it is the quantified forecasts that failed."
            source="Claims from PwC Nigeria's January 2026 presentation to the Lagos Chamber of Commerce. Outturns from OPEC Monthly Oil Market Reports and the IEA Oil Market Report, August 2026."
          ><ClaimLedger /></ChartFrame>

          <ChartFrame
            n="25" title="Every price call against the outturn" defaultOpen
            note="Four Brent assumptions that Nigerian planning ran on in 2026, against what North Sea Dated actually averaged from January to July."
            legend={[{ label: "Forecast", color: "var(--chart-3)" }, { label: "Realised", color: "var(--chart-2)" }]}
          ><PriceCallChart /></ChartFrame>
        </div>

        <div className="panel px-5 py-4 text-[12.5px] leading-[1.6] text-muted-foreground">
          <h3 className="display mb-1.5 text-[13px] text-foreground">Why this section exists</h3>
          <p className="max-w-[86ch]">
            Not to embarrass anyone. Every one of these numbers was reasonable when written, and the
            same exercise run on any January 2026 outlook would produce a similar result. The point is
            that a deck is a snapshot of a forecast, and a platform reading the primary series monthly
            is not. The single question worth asking of any outlook in the room:{" "}
            <strong className="text-foreground">what price deck were you running, and when did you set it?</strong>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "method",
    label: "Method",
    group: "Analysis",
    blurb: "What survives statistical scrutiny, what does not, and how the numbers were obtained.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 xl:grid-cols-3">
          <ChartFrame
            n="26" title="Which correlations survive differencing" className="xl:col-span-2" defaultOpen
            note={<>Every pair ranked by correlation on levels, then re-run on month to month changes.
              Correlating two trending series inflates r towards 1 whether or not they are related, so the
              second column is the honest one. Of <strong>{nTotal} pairs tested, {nSurvive} survive</strong>,
              {" "}{nCollapse} collapse and {nIdentity} are identities that cannot fail. Most of what looks
              like a relationship in this sector is shared trend.</>}
          ><CorrelationPanel /></ChartFrame>

          <ChartFrame
            n="27" title="A finding that is not one" defaultOpen
            note={<>Freight against the Bonny differential at every lag. The two month bar clears 0.5, but the
              bars either side sit near zero. A real lag decays smoothly; a lone spike across seven tested
              lags at n under 20 is what searching for a result looks like. Shown so you can see it.</>}
            legend={[{ label: "Correlation at lag", color: "var(--chart-3)" }]}
          ><FreightLagChart /></ChartFrame>
        </div>

        <DataTable
          n="T5" title="Full correlation audit" maxHeight={460} windowed={false}
          note="Pearson r. Levels use raw monthly values; changes use first differences. Identities are pairs where one series is computed from the other and so cannot fail."
          source="Derived from the extracted series. Nothing here is causal evidence."
          cols={[
            { key: "pair", label: "Pair", align: "left" },
            { key: "levels", label: "r levels", dp: 2 },
            { key: "changes", label: "r changes", dp: 2, emphasis: true },
            { key: "n", label: "n" },
            { key: "verdict", label: "Verdict", align: "left" },
          ]}
          rows={corrTableRows}
        />

        <div className="panel grid gap-5 px-5 py-5 text-[12.5px] leading-[1.6] text-muted-foreground sm:grid-cols-3">
          <div>
            <h3 className="display mb-1.5 text-[13px] text-foreground">How the data was obtained</h3>
            Tables parsed directly from 22 OPEC Monthly Oil Market Report PDFs and keyed by publication
            vintage, so revisions are preserved rather than overwritten. OPEC revises Nigeria by up to
            51 tb/d after the fact. The pipeline is in the repository.
          </div>
          <div>
            <h3 className="display mb-1.5 text-[13px] text-foreground">Known conflicts</h3>
            OPEC puts Nigeria at 12 to 18 rigs; NUPRC reports a fleet of 73 with 31 active. Different
            definitions, both quoted as &ldquo;the rig count&rdquo;. Nigeria&rsquo;s direct submission and the
            secondary-source estimate disagree every month. Where two official figures disagree, both are
            shown rather than averaged.
          </div>
          <div>
            <h3 className="display mb-1.5 text-[13px] text-foreground">Limits</h3>
            The fiscal model in Outlook is illustrative: tax applies to revenue net of royalty, opex and
            capex, whereas Nigeria&rsquo;s PIA terms are materially more complex. Lag correlations are
            predictive, not causal. Benchmarks are the 2026 federal budget (1,840 tb/d at $64.85/b) and the
            2026-28 MTEF target (2,060 tb/d).
          </div>
          <div className="sm:col-span-3">
            <IconCredits />
          </div>
        </div>
      </div>
    ),
  },
];

export default function Page() {
  return <Shell sections={sections} dataTo={L.month} repoUrl={REPO} />;
}

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
import { SlopeChart, BarrelGauge, CoverPictogram } from "@/components/forms";
import { Sunburst, SeasonalRadar, BenchmarkGauge } from "@/components/circular";
import { ClaimLedger, PriceCallChart } from "@/components/scorecard";
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
            note={<>One barrel per 100 tb/d. Nigeria filled {fmt(L.sec)} of the {fmt(BENCH.budget)} tb/d the
              2026 budget assumed, leaving {fmt(BENCH.budget - L.sec)} tb/d unfilled. The gap is the point,
              and it is easier to count than to read off an axis.</>}
          ><BarrelGauge /></ChartFrame>

          <ChartFrame
            n="04" title="Who kept their barrels"
            note="Every OPEC member's crude output at the start and end of the window, one line each. Green gained, red lost. The Gulf producers fell hard as the Strait closed; Nigeria is among the few that rose."
            legend={[{ label: "Gained", color: "var(--chart-2)" }, { label: "Lost", color: "var(--chart-3)" }]}
          ><SlopeChart /></ChartFrame>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="05" title={`OPEC crude by bloc and member, ${L.month}`} defaultOpen
            note={<>A real two-level hierarchy, which is the case a sunburst is actually for: OPEC total in
              the centre, bloc on the inner ring, member on the outer. Nigeria is pulled out and outlined.
              Africa now carries a visibly larger arc than its Gulf-dominated history would suggest.</>}
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
            note="One value, two targets. The filled arc is output as a share of the 1,840 tb/d budget benchmark; the tick marks where the 1,500 tb/d OPEC quota falls on the same scale."
          ><BenchmarkGauge /></ChartFrame>

          <ChartFrame
            n="08" title="Monthly shape, 2025 against 2026"
            note="Calendar months wrap around a circle, which is the one time-series shape a radar reads better than a line. The 2026 ring is incomplete because the year is only seven months old in this data."
            legend={[{ label: "2025", color: "var(--chart-1)" }, { label: "2026", color: "var(--chart-2)" }]}
          ><SeasonalRadar /></ChartFrame>
        </div>

        <ChartFrame
          n="09" title="Peer producers over time, indexed to June 2024"
          note="The same story as the slope chart but continuous, so you can see when each producer broke rather than only where they ended."
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
            n="08" title="Bonny Light against North Sea Dated"
            note={<>Realised prices, monthly average. Brent ran far above Nigeria&rsquo;s ${BENCH.budgetPrice} budget
              benchmark through 2026. The price excuse was removed and the volume gap held anyway.</>}
            legend={[{ label: "Bonny Light", color: "var(--chart-1)" }, { label: "North Sea Dated", color: "var(--chart-2)" }]}
          ><PriceChart /></ChartFrame>

          <ChartFrame
            n="09" title="The Bonny differential"
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
            n="10" title="Freight on Nigeria's own export routes" defaultOpen
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
            n="11" title="The one relationship that holds up"
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
          n="12" title="West Africa is not simply following the Gulf" defaultOpen
          note={<>The two freight markets correlate at {wafGulfLevels ? wafGulfLevels.r.toFixed(2) : "n/a"} on
            levels, which looks like tight coupling. On changes that falls to
            {" "}{wafGulf ? wafGulf.r.toFixed(2) : "n/a"}. The apparent link is shared trend. West African
            rates are set by their own balance of tonnage and cargo. Each dot is one month: if the two moved
            together the cloud would lie on a diagonal, and it does not.</>}
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
        <div className="grid gap-3 xl:grid-cols-3">
          <ChartFrame
            n="13" title="Rigs lead barrels" className="xl:col-span-2"
            note="Active rigs above, crude output below, sharing one time axis. Two measures of different scale get two panels, not two y-scales."
            legend={[{ label: "Active rigs", color: "var(--chart-1)" }, { label: "Crude production", color: "var(--chart-2)" }]}
          ><RigChart /></ChartFrame>

          <ChartFrame
            n="14" title="How long the lag runs"
            note={<>Cross-correlation of rig count against production at each lag. Peak at{" "}
              <strong>{lag.lag} months</strong> (r = {lag.r.toFixed(2)}). Predictive, not causal, because
              rigs respond to price too.</>}
            legend={[{ label: "Correlation at lag", color: "var(--chart-2)" }]}
          ><LagChart /></ChartFrame>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <ChartFrame
          n="15" title="OECD stocks and days of forward cover"
          note="Commercial crude stocks above, days of forward cover below. Cover is the tighter measure because it normalises inventory against demand, and it has been running below both the five year and the 2015 to 2019 averages."
          source={`${MOMR} Table 9-1, sourced to EIA, IEA, METI, OilX and OPEC.`}
          legend={[
            { label: "OECD crude stocks, mb", color: "var(--chart-1)" },
            { label: "Days of forward cover", color: "var(--chart-2)" },
          ]}
        ><StocksChart /></ChartFrame>

        <ChartFrame
          n="16" title="Where cover sits right now" defaultOpen
          note="Days of forward cover as a count rather than a line. Each block is ten days. The five year average sits near 61 days and the 2015 to 2019 average near 62, so the current reading is below both."
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
            n="19" title="The claim ledger" defaultOpen
            note="Each claim quoted verbatim from the published deck, then scored against the series extracted from OPEC reports. Click a row for the working. The last row is included so this does not read as one-directional: the structural calls in these decks are generally sound, it is the quantified forecasts that failed."
            source="Claims from PwC Nigeria's January 2026 presentation to the Lagos Chamber of Commerce. Outturns from OPEC Monthly Oil Market Reports and the IEA Oil Market Report, August 2026."
          ><ClaimLedger /></ChartFrame>

          <ChartFrame
            n="20" title="Every price call against the outturn" defaultOpen
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
            n="17" title="Which correlations survive differencing" className="xl:col-span-2" defaultOpen
            note={<>Every pair ranked by correlation on levels, then re-run on month to month changes.
              Correlating two trending series inflates r towards 1 whether or not they are related, so the
              second column is the honest one. Of <strong>{nTotal} pairs tested, {nSurvive} survive</strong>,
              {" "}{nCollapse} collapse and {nIdentity} are identities that cannot fail. Most of what looks
              like a relationship in this sector is shared trend.</>}
          ><CorrelationPanel /></ChartFrame>

          <ChartFrame
            n="18" title="A finding that is not one" defaultOpen
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

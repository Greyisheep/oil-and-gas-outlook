import { KpiStrip, type Kpi } from "@/components/kpi";
import { ChartFrame } from "@/components/chart-frame";
import { DataTable, type Col } from "@/components/data-table";
import { IconCredits } from "@/components/icon";
import { Shell, type Section } from "@/components/shell";
import { LivePriceChart, LiveTicker } from "@/components/live";
import { getLivePrices, type LivePrices } from "@/lib/live-prices";
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
import { ProjectionChart, BacktestRibbon, BacktestErrors, ModelCard, SlopeDrift } from "@/components/projection";
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
function buildSections(live: LivePrices): Section[] {
  return [
  {
    id: "production",
    label: "Production",
    group: "Market",
    blurb: "How much oil Nigeria produces, how that compares with the rest of OPEC, and why two official figures disagree.",
    content: (
      <div className="flex flex-col gap-3">
        <KpiStrip items={kpis} />
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="01" title="Two official numbers for the same barrels"
            plain={<>Nigeria reports less oil to OPEC than OPEC&rsquo;s own assessors measure. In {L.month} the gap was {fmt(L.sec - L.dir)} thousand barrels a day.</>}
            detail={<>OPEC publishes two production figures every month: what each member submits itself, and an independent estimate compiled from secondary sources. Nigeria&rsquo;s own submission of {fmt(L.dir)} sits just under its {fmt(BENCH.opecQuota)} quota. The independent estimate of {fmt(L.sec)} puts it over. Both are official, and neither is ever reconciled to the other.</>}
            legend={[{ label: "Secondary sources", color: "var(--chart-1)" }, { label: "Direct communication", color: "var(--chart-2)" }]}
          ><ProductionChart /></ChartFrame>

          <ChartFrame
            n="02" title="Nigeria's share of OPEC crude"
            plain={<>Nigeria now supplies {L.share.toFixed(1)}% of OPEC&rsquo;s oil, up from {(L.share - shareGain).toFixed(1)}% two years ago. It did not produce much more. The Gulf produced much less.</>}
            detail={<>Share is Nigerian output divided by total OPEC crude. When Gulf volumes fell after the Strait of Hormuz closed, every other member&rsquo;s share rose arithmetically even at flat production. This line is as much about what happened elsewhere as about Nigeria.</>}
            legend={[{ label: "Nigeria share of OPEC crude", color: "var(--chart-2)" }]}
          ><ShareChart /></ChartFrame>

          <ChartFrame
            n="03" title="Output against the budget benchmark"
            plain={<>Nigeria produced {fmt(L.sec)} of the {fmt(BENCH.budget)} thousand barrels a day the 2026 budget assumed. The missing {fmt(BENCH.budget - L.sec)} is worth roughly $0.8bn a month at the prices oil actually sold for.</>}
            detail={<>Each barrel drawn is 25 thousand barrels a day. The benchmark is the production volume the federal budget was built on, not a target anyone committed to hitting. The cash figure values the shortfall at realised Brent rather than the budget price.</>}
          ><BarrelGauge /></ChartFrame>

          <ChartFrame
            n="04" title="Who kept their barrels"
            plain="Saudi Arabia, Iraq and Kuwait each lost a fifth or more of their output. Nigeria finished higher than it started."
            detail="Each line runs from the first month in view to the last. The scale is logarithmic, so the same percentage change has the same steepness whatever the starting volume. Without that, Saudi Arabia's size flattens everyone else into a single band."
            legend={[{ label: "Gained", color: "var(--chart-2)" }, { label: "Lost", color: "var(--chart-3)" }]}
          ><SlopeChart /></ChartFrame>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="05" title={`OPEC crude by bloc and member, ${L.month}`}
            plain="Where OPEC's oil actually came from this month. The African share is the widest it has been in this data."
            detail="The inner ring is the producing bloc, the outer ring the individual country, each sized by output. Nigeria is outlined. The rim and hoops are decoration, a barrel seen from above; they sit outside the data and do not change any segment size."
          ><Sunburst /></ChartFrame>

          <ChartFrame
            n="06" title="The reporting gap, month by month"
            plain="Independent assessors have seen more Nigerian oil than Nigeria itself reported in almost every month."
            detail="The independent estimate minus Nigeria's own submission. Positive means the assessors saw more oil than was declared. The consistency of the sign matters more than the size of any single month."
            legend={[{ label: "Secondary above direct", color: "var(--chart-1)" }, { label: "Secondary below direct", color: "var(--chart-3)" }]}
          ><GapChart /></ChartFrame>
        </div>

        <div className="grid gap-3 xl:grid-cols-[320px_1fr]">
          <ChartFrame
            n="07" title="Against benchmark and quota"
            plain="Nigeria is producing above its OPEC quota and below its own budget at the same time."
            detail="The filled arc is output as a share of the 1,840 budget benchmark. The tick marks where the 1,500 OPEC quota falls on the same scale. Because the quota sits below the budget, the two targets pull in opposite directions: meeting one means missing the other."
          ><BenchmarkGauge /></ChartFrame>

          <ChartFrame
            n="08" title="Monthly shape, 2025 against 2026"
            plain="February is the weak month in both years, and the 2026 dip was far deeper than 2025."
            detail="Each ring is one calendar year of monthly output, with the months running clockwise. The 2026 ring stops at July because that is where the data ends, not because production stopped."
            legend={[{ label: "2025", color: "var(--chart-1)" }, { label: "2026", color: "var(--chart-2)" }]}
          ><SeasonalRadar /></ChartFrame>
        </div>

        <ChartFrame
          n="09" title="Peer producers, month by month"
          plain="When each producer broke, rather than only where they ended up."
            detail="Every producer starts at 100 in June 2024, so the lines compare rates of change rather than volumes. A country producing 8 million barrels and one producing 1 million can then be read on the same axis."
          legend={[
            { label: "Nigeria", color: "var(--chart-2)" },
            { label: "Saudi Arabia", color: "var(--chart-1)" },
            { label: "Iraq", color: "var(--chart-3)" },
            { label: "Kuwait", color: "var(--chart-4)", dash: true },
          ]}
        ><PeerChart /></ChartFrame>

        <DataTable
          n="T1" title="Monthly production" maxHeight={520}
          note="Crude oil only. Condensate is excluded, which is what makes the comparison against the OPEC quota valid."
          source={`${MOMR} Tables 5-7 and 5-8. Where a month was later revised, the most recent figure is used.`}
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
    blurb: "What oil and gas are trading at today, what Nigerian crude actually sold for, and the premium it commands.",
    content: (
      <div className="flex flex-col gap-3">
        <ChartFrame
          n="L1" title="Today's market"
          plain="Crude and natural gas as they closed most recently, updated through the day. Everything else in this dashboard is monthly and ends in July, so this is the bridge to now."
          detail="Brent and West Texas Intermediate are the two crude benchmarks most contracts price against; Henry Hub is the US natural gas reference. Oil is priced per barrel and gas per million BTU, so they get separate panels rather than a shared scale. Figures come from the US Energy Information Administration by way of FRED and refresh hourly."
          source="US Energy Information Administration, published through FRED. Brent DCOILBRENTEU, WTI DCOILWTICO, Henry Hub DHHNGSP."
          legend={[
            { label: "Brent", color: "var(--chart-1)" },
            { label: "WTI", color: "var(--chart-2)" },
            { label: "Henry Hub gas", color: "var(--chart-4)" },
          ]}
        >
          <LiveTicker data={live} />
          <LivePriceChart data={live} />
        </ChartFrame>

        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="10" title="Bonny Light against North Sea Dated"
            plain={<>Oil sold well above the ${BENCH.budgetPrice} a barrel the budget assumed, all year. Whatever went wrong with revenue, it was not the price.</>}
            detail="Monthly average realised prices. Bonny Light is Nigeria's benchmark grade; North Sea Dated is the global reference most contracts are priced against. The dashed line is the oil price the 2026 federal budget was built on."
            legend={[{ label: "Bonny Light", color: "var(--chart-1)" }, { label: "North Sea Dated", color: "var(--chart-2)" }]}
          ><PriceChart /></ChartFrame>

          <ChartFrame
            n="11" title="The Bonny differential"
            plain="The premium buyers pay for Nigerian crude over the global benchmark. It spiked with the Gulf disruption, then gave most of it back."
            detail="Monthly average of Bonny Light minus North Sea Dated. OPEC's written commentary quotes a spot differential instead, which is a different measure taken at a point in time; it had fallen to five cents by the August report."
            source="OPEC's written commentary quotes a different measure, taken at a point in time, which had fallen to five cents by the August report."
            legend={[{ label: "Bonny Light vs Dated", color: "var(--chart-1)" }]}
          ><DiffChart /></ChartFrame>
        </div>

        <DataTable
          n="T2" title="Monthly prices" maxHeight={520}
          note="Nigeria's own grade alongside the global benchmarks it is priced against."
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
    blurb: "What it costs to ship Nigerian crude, and whether those costs follow the Gulf or move on their own.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="12" title="Freight on Nigeria's own export routes"
            plain="Shipping Nigerian crude to the US Gulf cost roughly 130% more than a year earlier."
            detail="Worldscale is a freight index rather than a dollar rate, so the level matters less than the movement. West Africa to US Gulf Coast is the Nigerian export leg. The Gulf route is shown only for contrast."
            legend={[
              { label: "WAF to US Gulf (Suezmax)", color: "var(--chart-1)" },
              { label: "WAF to East (VLCC)", color: "var(--chart-2)" },
              { label: "Gulf to East (VLCC)", color: "var(--chart-3)", dash: true },
            ]}
          ><FreightChart /></ChartFrame>

          <ChartFrame
            n="13" title="The one relationship that holds up"
            plain="Nigeria's share of OPEC and Gulf shipping costs move almost in lockstep. Neither causes the other; the same disruption drives both."
            detail={<>Measured on month-to-month changes the two move together at {shareFreight ? shareFreight.r.toFixed(2) : "n/a"} on a scale where 1.0 is perfect. That is the strongest genuine relationship anywhere in this data. It is a common cause, not a mechanism: closing the Strait raised Gulf freight and cut Gulf output at the same time.</>}
            legend={[
              { label: "Nigeria share of OPEC crude", color: "var(--chart-2)" },
              { label: "Gulf to East freight", color: "var(--chart-4)" },
            ]}
          ><ShareVsFreightChart /></ChartFrame>
        </div>

        <ChartFrame
          n="14" title="West Africa is not simply following the Gulf"
          plain="West African shipping costs look tied to the Gulf, but month to month they move largely on their own."
            detail={<>Compared on levels the two routes track at {wafGulfLevels ? wafGulfLevels.r.toFixed(2) : "n/a"}, which looks like tight coupling. Compared on how much each moved from one month to the next, that falls to {wafGulf ? wafGulf.r.toFixed(2) : "n/a"}. The apparent link was mostly both drifting upward together. Each dot is one month.</>}
          source="Each point is one month, plotted as how far each route moved rather than where it sat. 20 months overlap."
          legend={[{ label: "One month, both routes", color: "var(--chart-1)" }]}
        ><FreightScatter /></ChartFrame>

        <DataTable
          n="T3" title="Shipping costs, month by month" maxHeight={520}
          note="A freight index rather than a dollar rate, so movement matters more than level. The first column is the Nigeria to US Gulf route."
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
    blurb: "Drilling activity, which turns up before production does, and how much oil the world is holding in storage.",
    content: (
      <div className="flex flex-col gap-3">
        <ChartFrame
          n="15" title="The rig fleet, one derrick per rig"
          plain="Nigeria has doubled its drilling fleet, from 9 rigs to 18. It still runs fewer rigs than Algeria, which produces a third less oil."
            detail="Gold marks the fleet at its lowest point, green what has been added since. Nigeria gets about 86 thousand barrels a day per rig against Algeria's 24 and Saudi Arabia's 27. High flow per well is part of that; so is very little drilling done simply to hold existing production steady."
          source="OPEC Monthly Oil Market Report Table 11-5. NUPRC counts Nigeria's fleet differently, which is covered in Method."
        ><RigPictogram /></ChartFrame>

        <div className="grid gap-3 xl:grid-cols-3">
          <ChartFrame
            n="16" title="Rigs lead barrels" className="xl:col-span-2"
            plain="Drilling turns up about nine months before the oil does. Rigs bottomed in May 2025; output bottomed in February 2026."
            detail="Two panels rather than two scales on one chart, because rigs are counted in tens and barrels in thousands. Reading down the same date line shows the offset between the two."
            legend={[{ label: "Active rigs", color: "var(--chart-1)" }, { label: "Crude production", color: "var(--chart-2)" }]}
          ><RigChart /></ChartFrame>

          <ChartFrame
            n="17" title="How long the lag runs"
            plain={<>Nine months is where the link between drilling and output is strongest.</>}
            detail={<>Each bar measures how closely rig counts line up with production if you shift them by that many months. The tallest bar, at {lag.lag} months, is the best fit. This predicts, it does not explain: rigs also respond to price, so both can move for a third reason.</>}
            legend={[{ label: "Correlation at lag", color: "var(--chart-2)" }]}
          ><LagChart /></ChartFrame>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <ChartFrame
          n="18" title="OECD stocks and days of forward cover"
          plain="How much oil the developed world is holding, and how long it would last."
            detail="Stocks are the raw volume in commercial storage. Cover converts that into days of demand, which is the more useful measure: a build means little if consumption is rising faster than the barrels going in."
          source={`${MOMR} Table 9-1, sourced to EIA, IEA, METI, OilX and OPEC.`}
          legend={[
            { label: "OECD crude stocks, mb", color: "var(--chart-1)" },
            { label: "Days of forward cover", color: "var(--chart-2)" },
          ]}
        ><StocksChart /></ChartFrame>

        <ChartFrame
          n="19" title="Where cover sits right now"
          plain="Storage would cover 58.7 days of demand, below the five-year average of about 61."
            detail="Each block is ten days. Lower cover means less slack in the system, so any disruption feeds through to price faster."
        ><CoverPictogram /></ChartFrame>
        </div>

        <DataTable
          n="T4" title="Drilling and storage, month by month" maxHeight={520}
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
    blurb: "What today's drilling implies for output next year, what a production target would require, and how well this has actually worked.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="panel px-5 py-4">
          <p className="max-w-[88ch] text-[13px] leading-[1.6]">
            Oil shows up about <strong>{RIG_LAG.lag} months</strong> after the drilling that produced it.
            The rigs that were working through late 2025 and the first half of 2026 have already done
            their work, so they tell you something about output as far ahead as{" "}
            <strong>{monthLabel(RIG_LAG.projection[RIG_LAG.projection.length - 1].month)}</strong>{" "}
            without anyone having to guess at future drilling, prices or policy.
          </p>
          <div className="rule-t mt-3.5 flex flex-wrap gap-x-8 gap-y-2 pt-3.5">
            <Stat label="Oil follows drilling by" value={`${RIG_LAG.lag} months`} />
            <Stat label="Each extra rig adds" value={`+${Math.round(RIG_LAG.slope)} tb/d`} tone="good" />
            <Stat label="Better than a naive guess by" value={`${Math.round((1 - RIG_LAG.realtime.mase) * 100)}%`} tone={RIG_LAG.realtime.mase < 1 ? "good" : "bad"} />
            <Stat label="Months tested on" value={String(RIG_LAG.realtime.origins)} tone="warn" />
            <Stat label="Usual margin" value={`± ${RIG_LAG.realtime.band80} tb/d`} />
          </div>
        </div>

        <ChartFrame
          n="20" title="What would it take?"
          plain="Set a production target and see how many rigs Nigeria would need drilling today to reach it."
            detail={<>The relationship between rigs and barrels runs backwards as easily as forwards. Rather than claiming what output will be, this asks what a chosen output would demand. Beyond the range of rig counts Nigeria has actually operated, the panel says so instead of quietly returning a number.</>}
          source="The same drilling relationship, run backwards. Where a target would need more rigs than Nigeria has ever operated, the panel says so."
        ><TargetSolver /></ChartFrame>

        <ChartFrame
          n="21" title="Output implied by rigs already turning"
          plain={<>Those rigs have already drilled. This is the output they imply through {monthLabel(RIG_LAG.projection[RIG_LAG.projection.length - 1].month)}, with no assumption about future drilling, prices or policy.</>}
            detail={<>Because drilling shows up in production about {RIG_LAG.lag} months later, activity already recorded implies a path that far ahead without forecasting anything. The shaded band comes from the model&rsquo;s own past errors rather than from theory, so it shows how wrong this model has actually been. Eight months in ten should land inside it.</>}
          source={`Built from ${RIG_LAG.n} months of OPEC production and rig figures. The code that produces it is in the repository.`}
          legend={[
            { label: "Actual", color: "var(--chart-2)" },
            { label: "Implied by rigs already turning", color: "var(--chart-1)", dash: true },
          ]}
        ><ProjectionChart /></ChartFrame>

        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            n="22" title="What it would have said at the time"
            plain={<>The fair test: the model rebuilt each month using only the figures that existed then. It was {Math.round((1 - RIG_LAG.realtime.mase) * 100)}% more accurate than assuming next month looks like this one.</>}
            detail="OPEC keeps revising its figures for months after first publishing them. Most tests quietly use the corrected numbers, which the forecaster did not have. Here the whole dataset is rebuilt from what OPEC had actually printed by that date, so the model is judged on the same information a person would have had."
            legend={[
              { label: "Actual", color: "var(--chart-2)" },
              { label: "Model, refitted at each origin", color: "var(--chart-1)", dash: true },
            ]}
          ><BacktestRibbon /></ChartFrame>

          <ChartFrame
            n="23" title="How wrong it was, month by month"
            plain={<>Every month it got wrong, and by how much. The early attempts were poor and the recent ones close, which is the pattern to watch.</>}
            detail={<>The dashed lines mark the range the model expects to stay inside eight times out of ten. It missed by an average of {RIG_LAG.realtime.earlyMae} over its first {RIG_LAG.realtime.earlyN} attempts and {RIG_LAG.realtime.lateMae} over the last {RIG_LAG.realtime.lateN}. Judge it on the recent record, while remembering that four good months is not proof.</>}
            legend={[
              { label: "Inside the band", color: "var(--chart-2)" },
              { label: "Outside", color: "var(--chart-3)" },
            ]}
          ><BacktestErrors /></ChartFrame>
        </div>

        <ChartFrame
          n="24" title="The model finding the relationship"
          plain="Early on, the data said more drilling meant less oil. It took about a year of months before the relationship pointed the right way and settled."
          detail="Each point is the barrels-per-rig figure the model would have arrived at on that date, using only the data published by then. It starts negative, which is nonsense, crosses zero in early 2026 and settles near thirteen. This is the clearest argument for not trusting a relationship fitted on a short history, and for re-checking it as months accumulate."
          source="Refitted at each OPEC publication date from that date's own figures."
          legend={[{ label: "Barrels per rig, as known then", color: "var(--chart-1)" }]}
        ><SlopeDrift /></ChartFrame>

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
    blurb: "Put in your own field and assumptions, get a twelve-month cash projection.",
    content: <Console />,
  },
  {
    id: "decks",
    label: "Outlook vs outturn",
    group: "Analysis",
    blurb: "What the 2026 outlooks and industry talks predicted, and what actually happened.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="panel px-5 py-4">
          <p className="max-w-[86ch] text-[13px] leading-[1.6]">
            Sector outlooks come out in <strong>January</strong>. The Middle East escalation began on{" "}
            <strong>28 February 2026</strong> and the Strait of Hormuz closed. Everything published
            before that assumed oil near <strong>$55 to $61</strong>, including the US Energy
            Information Administration, which is the reference forecaster for this market. Oil has
            averaged <strong>$91</strong>. Almost none of it has been updated since, so every revenue,
            investment and risk judgement built on those numbers inherited the error.
          </p>
          <div className="rule-t mt-3.5 flex flex-wrap gap-x-8 gap-y-2 pt-3.5">
            <Stat label="Claims checked" value={String(SCORE.total)} />
            <Stat label="Got the number wrong" value={String(SCORE.missed)} tone="bad" />
            <Stat label="Contradict their own deck" value={String(SCORE.contradicted)} tone="bad" />
            <Stat label="Measure a different thing" value={String(SCORE.basis)} tone="warn" />
            <Stat label="Held up" value={String(SCORE.held)} tone="good" />
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_400px]">
          <ChartFrame
            n="25" title="The claim ledger"
            plain={<>{SCORE.total} forecasts from published 2026 outlooks and recorded industry talks, checked against what actually happened. Click any row to see the working.</>}
            detail={<>Each claim is quoted word for word, then compared with what OPEC and the IEA published afterwards. {SCORE.talks} come from recorded talks rather than documents, taken from automatic transcripts, so their wording may differ slightly from the spoken original. One row held up and is included on purpose: the structural judgements in these outlooks are generally sound. It is the specific numbers that failed.</>}
          source="Claims from PwC Nigeria's January 2026 presentation to the Lagos Chamber of Commerce. What happened, from OPEC monthly reports and the IEA Oil Market Report of August 2026."
          ><ClaimLedger /></ChartFrame>

          <ChartFrame
            n="26" title="Every price call against the outturn"
            plain="Five oil price assumptions in circulation this year, against what oil actually sold for. The US government's own forecaster was the second lowest."
            detail="All of these were set in January. The escalation that moved the price began on 28 February. The EIA is the reference forecaster for this market and it called $56 while the price sat at $65, on the view that a supply overhang would persist. This is not a criticism of anyone; it shows how quickly a price assumption expires."
          legend={[{ label: "Forecast", color: "var(--chart-3)" }, { label: "Realised", color: "var(--chart-2)" }]}
          ><PriceCallChart /></ChartFrame>
        </div>

        <div className="panel px-5 py-4 text-[12.5px] leading-[1.6] text-muted-foreground">
          <h3 className="display mb-1.5 text-[13px] text-foreground">Why this section exists</h3>
          <p className="max-w-[86ch]">
            Not to embarrass anyone. Every one of these numbers was reasonable when it was written, and
            the same exercise on any other January 2026 outlook would look much the same. The point is
            that a document is fixed at the moment it is printed, and the underlying figures are not.
            One question is worth asking of any outlook:{" "}
            <strong className="text-foreground">what oil price did you assume, and when did you decide it?</strong>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "method",
    label: "Method",
    group: "Analysis",
    blurb: "Which apparent relationships are real, which are not, and where every number came from.",
    content: (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 xl:grid-cols-3">
          <ChartFrame
            n="27" title="Which relationships are real"
            plain={<>Most things that look connected in this sector are simply both trending upward. Only {nSurvive} of {nTotal} pairs survive a proper test.</>}
            detail={<>Two numbers that both rise over time will look related even when they are not. The fix is to compare how much each moved from one month to the next, rather than their levels. The second column does that. {nCollapse} pairs collapse under it, and {nIdentity} are pairs where one number is calculated from the other and so could never have failed.</>}
          ><CorrelationPanel /></ChartFrame>

          <ChartFrame
            n="28" title="A finding that is not one"
            plain="A result that looks convincing and is not. Included deliberately."
            detail="One bar clears the threshold while the bars either side sit near zero. A genuine relationship fades in and out gradually; a lone spike surrounded by noise is usually what turns up when you test enough combinations. With this few months of data, it is the pattern to distrust."
          legend={[{ label: "Correlation at lag", color: "var(--chart-3)" }]}
          ><FreightLagChart /></ChartFrame>
        </div>

        <DataTable
          n="T5" title="Every relationship tested" maxHeight={460} windowed={false}
          note="Scored from minus one to plus one. Levels compare the raw monthly numbers; changes compare how much each moved month to month, which is the more honest test. Identities are pairs where one number is calculated from the other."
          source="Built from the series above. A relationship here means two things moved together, not that one caused the other."
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
            Every figure is read straight out of 22 OPEC monthly reports, and each is kept against the
            month it was published. OPEC later revises Nigeria by as much as 51 thousand barrels a day,
            so keeping the original alongside the correction matters. The code that does this is in the
            repository.
          </div>
          <div>
            <h3 className="display mb-1.5 text-[13px] text-foreground">Known conflicts</h3>
            OPEC counts Nigeria at 12 to 18 rigs. NUPRC reports a fleet of 73, of which 31 are active.
            Both are published as &ldquo;the rig count&rdquo; and they are counting different things.
            Nigeria&rsquo;s own production submission and the independent estimate also differ every
            month. Where two official numbers disagree, both are shown rather than split.
          </div>
          <div>
            <h3 className="display mb-1.5 text-[13px] text-foreground">Limits</h3>
            The cash model in Outlook is simplified and is there for scale, not for a tax position. The
            drilling relationship predicts, it does not explain: rigs also respond to price, so both can
            move for a third reason. Benchmarks throughout are the 2026 federal budget of 1,840 thousand
            barrels a day at $64.85, and the 2026-28 target of 2,060.
          </div>
          <div className="sm:col-span-3 border-t border-[var(--rule)] pt-4">
            <h3 className="display mb-1.5 text-[13px] text-foreground">Recorded talks used</h3>
            <p className="max-w-[92ch]">
              Spoken claims are quoted from automatic transcripts, so wording may differ slightly from
              what was said. Sources: the US Energy Information Administration&rsquo;s briefing on its
              January 2026 Short-Term Energy Outlook; OPEC&rsquo;s launch of the World Oil Outlook 2026;
              and the WP Intelligence Oil and Gas Lookahead 2026.
            </p>
          </div>
          <div className="sm:col-span-3">
            <IconCredits />
          </div>
        </div>
      </div>
    ),
  },
  ];
}

export default async function Page() {
  const live = await getLivePrices();
  return <Shell sections={buildSections(live)} dataTo={L.month} repoUrl={REPO} />;
}

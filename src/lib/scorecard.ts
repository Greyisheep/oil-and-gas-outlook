/**
 * Claims taken verbatim from published Nigerian oil and gas outlooks, scored
 * against the primary series extracted from OPEC reports.
 *
 * The point is not that any one author was careless. It is that the whole
 * January-vintage literature was written before the 28 February 2026 Middle
 * East escalation, on a Brent assumption near $55 to $61, and almost none of
 * it has been re-based since. Anything downstream of the price deck inherits
 * the error.
 */

export type Verdict = "miss" | "wrong-sign" | "basis" | "self-contradicted" | "unsupported" | "held";

export type Claim = {
  id: string;
  claim: string;
  source: string;
  where: string;
  forecast: string;
  outturn: string;
  verdict: Verdict;
  note: string;
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  miss: "missed",
  "wrong-sign": "wrong direction",
  basis: "basis mismatch",
  "self-contradicted": "self-contradicted",
  unsupported: "unsupported",
  held: "held up",
};

export const CLAIMS: Claim[] = [
  {
    id: "P1",
    claim: "Brent crude is expected to average roughly $61.00 per barrel in 2026, a price level that threatens Nigeria's fiscal stability.",
    source: "PwC Nigeria, presented to the Lagos Chamber of Commerce",
    where: "Slide 17, January 2026",
    forecast: "$61.00/b",
    outturn: "$91.35/b",
    verdict: "miss",
    note: "North Sea Dated, January to July 2026 average, from OPEC Table 1-1. Out by $30.35, and in the opposite fiscal direction: Nigeria's budget benchmark is $64.85, so the realised price was a windfall rather than a threat.",
  },
  {
    id: "P2",
    claim: "Brent prices stabilising around US$55/bbl, supporting stronger export earnings and reserves.",
    source: "PwC Nigeria",
    where: "Slide 19, January 2026",
    forecast: "$55.00/b",
    outturn: "$91.35/b",
    verdict: "miss",
    note: "The same deck carries two different Brent forecasts six pages apart, $61 and $55. Both were overtaken.",
  },
  {
    id: "P3",
    claim: "Concern over a global market glut, with supply projected to exceed demand by 3.85 million bpd.",
    source: "PwC Nigeria",
    where: "Slide 17, January 2026",
    forecast: "3.85 mb/d surplus",
    outturn: "Supply falling 4.3 mb/d",
    verdict: "wrong-sign",
    note: "IEA Oil Market Report, August 2026, forecasts world supply declining 4.3 mb/d in 2026 to 102 mb/d with the Strait of Hormuz closed. The risk register led with oversupply; the realised risk was the opposite sign.",
  },
  {
    id: "P4",
    claim: "Global oil demand is expected to rise by ~860 kb/d in 2026.",
    source: "PwC Nigeria",
    where: "Slide 19, January 2026",
    forecast: "+0.86 mb/d",
    outturn: "−1.6 mb/d",
    verdict: "wrong-sign",
    note: "IEA now forecasts world oil demand falling 1.6 mb/d in 2026. A swing of roughly 2.5 mb/d against the forecast.",
  },
  {
    id: "P5",
    claim: "As of January 2026, Nigeria's crude production averaged 1.64 million barrels per day in 2025.",
    source: "PwC Nigeria",
    where: "Slide 16, January 2026",
    forecast: "1,640 tb/d",
    outturn: "1,514 tb/d",
    verdict: "basis",
    note: "Not an error, a basis mismatch. 1.64 mb/d is crude plus condensate. OPEC secondary sources put crude alone at 1,514 tb/d for 2025 and Nigeria's own submission at 1,453. The deck compares it against the 2.06 mb/d target without saying which basis either uses.",
  },
  {
    id: "P6",
    claim: "IOCs have committed over $82 billion elsewhere since Nigeria's last deepwater project reached FID in 2013.",
    source: "PwC Nigeria",
    where: "Slide 17, January 2026",
    forecast: "Last deepwater FID 2013",
    outturn: "Bonga North, December 2024",
    verdict: "self-contradicted",
    note: "Slide 14 of the same deck states Bonga North's FID was announced in December 2024. The two slides cannot both be right.",
  },
  {
    id: "P7",
    claim: "Pipeline sabotage, theft (~200,000 bpd), and under-investment continue to constrain output.",
    source: "PwC Nigeria",
    where: "Slide 21, January 2026",
    forecast: "~200,000 bpd stolen",
    outturn: "9,600 to 11,300 bpd",
    verdict: "self-contradicted",
    note: "Slide 16 of the same deck puts theft at 9,600 to 11,300 bpd by late 2025. Slide 21 is roughly twenty times higher. Separately, slide 16 states losses of up to $15bn a year, which at 10,000 bpd and $70/b implies about $255m.",
  },
  {
    id: "P8",
    claim: "Indigenous producers control approximately 55% of Nigeria's total oil production.",
    source: "PwC Nigeria",
    where: "Slide 12, January 2026",
    forecast: "55%",
    outturn: "27% on equity",
    verdict: "basis",
    note: "Sourced to “PwC Analysis” with no external citation. Wood Mackenzie puts indigenous producers at 27% measured on equity share. 55% is an operatorship denominator. Both are in circulation this year and neither states which it uses.",
  },
  {
    id: "P9",
    claim: "In 2025, AI-enabled predictive maintenance reduced unplanned downtime by 30 to 50% and cut operating costs by up to 20% across leading oil and gas operators.",
    source: "PwC Nigeria",
    where: "Slide 4, January 2026",
    forecast: "30 to 50% downtime cut",
    outturn: "20 to 30%, sector-specific",
    verdict: "unsupported",
    note: "The 30 to 50% range traces to McKinsey's 2017 work on manufacturing analytics. McKinsey's own oil and gas research gives 20 to 30%. The literature also reports maintenance cost reductions, not operating cost, and isolates no AI-specific effect. Slide 19 of the same deck says technology adoption in 2025 remained moderate.",
  },
  {
    id: "P10",
    claim: "The trend of IOCs selling onshore assets to indigenous firms has accelerated.",
    source: "PwC Nigeria",
    where: "Slide 17, January 2026",
    forecast: "Divestment accelerating",
    outturn: "Consistent with the record",
    verdict: "held",
    note: "Supported by the completed Shell to Renaissance and ExxonMobil to Seplat transactions. Included so the scorecard is not read as one-directional: structural calls in these decks are generally sound. It is the quantified forecasts that failed.",
  },
];

export const SCORE = {
  total: CLAIMS.length,
  missed: CLAIMS.filter((c) => c.verdict === "miss" || c.verdict === "wrong-sign").length,
  contradicted: CLAIMS.filter((c) => c.verdict === "self-contradicted").length,
  basis: CLAIMS.filter((c) => c.verdict === "basis").length,
  held: CLAIMS.filter((c) => c.verdict === "held").length,
};

/** Forecast against outturn, for the price chart. */
export const PRICE_CALLS = [
  { label: "PwC slide 19", forecast: 55.0, outturn: 91.35 },
  { label: "PwC slide 17", forecast: 61.0, outturn: 91.35 },
  { label: "Budget benchmark", forecast: 64.85, outturn: 91.35 },
  { label: "Planning assumption", forecast: 60.0, outturn: 91.35 },
];

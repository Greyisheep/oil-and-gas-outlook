/**
 * Nigeria's gas balance: where every cubic foot produced actually goes.
 *
 * Two sources, two vintages, kept apart on purpose.
 *
 * STAGE 1 — NUPRC, full-year 2025, in bscf:
 *   production 2,710 (headline, "2.71 tscf")  ·  field operations 776.6
 *   flared 203.9 (7.54%)  ·  domestic market 780.6  ·  export 942.7
 *
 *   The four uses sum to 2,703.8, not 2,710. That gap is rounding in the
 *   headline, not a missing flow, and the flare percentage proves it:
 *   203.9 / 0.0754 = 2,704.2, which lands on the sum of the components to
 *   within 0.02%. So the balance is drawn on 2,703.8 and closes exactly,
 *   rather than carrying an invented 6 bscf of "unallocated".
 *
 * STAGE 2 — NMDPRA "State of the Midstream and Downstream Sector" fact
 * sheet, October 2025 edition, covering Q1–Q3 2025, already in bscf/d:
 *   gas-to-power 0.641  ·  commercial 0.522  ·  gas-based industry 0.409
 *
 *   These are labelled "strategic sectors" and are a SUBSET of domestic
 *   supply, so the remainder is genuinely other domestic offtake, not an
 *   error. It is drawn grey and named as not itemised. Note also that the
 *   two stages cover different periods; the diagram says so.
 */

const DAYS = 365;
const perDay = (bscfYear: number) => +(bscfYear / DAYS).toFixed(3);

/** NUPRC full-year 2025, bscf. */
export const GAS_2025_BSCF = {
  headlineProduction: 2710,
  fieldOperations: 776.6,
  flared: 203.9,
  domestic: 780.6,
  export: 942.7,
  flarePct: 7.54,
} as const;

const USES = GAS_2025_BSCF.fieldOperations + GAS_2025_BSCF.flared +
             GAS_2025_BSCF.domestic + GAS_2025_BSCF.export;

/** Production implied by the flare share, used to check the components sum. */
export const IMPLIED_PRODUCTION = +(GAS_2025_BSCF.flared / (GAS_2025_BSCF.flarePct / 100)).toFixed(1);
export const RECONCILIATION = {
  componentsSum: +USES.toFixed(1),
  impliedByFlareShare: IMPLIED_PRODUCTION,
  gapPct: +(Math.abs(IMPLIED_PRODUCTION - USES) / USES * 100).toFixed(3),
  headlineRoundingGap: +(GAS_2025_BSCF.headlineProduction - USES).toFixed(1),
};

/** NMDPRA fact sheet, Q1–Q3 2025, bscf/d. Strategic sectors only. */
export const STRATEGIC_BSCFD = {
  power: 0.641,
  commercial: 0.522,
  industry: 0.409,
} as const;

export type GasNode = {
  id: string; label: string; value: number; col: number;
  color: string; note?: string;
};
export type GasLink = { from: string; to: string; value: number };

const domesticDay = perDay(GAS_2025_BSCF.domestic);
const strategicSum = +(STRATEGIC_BSCFD.power + STRATEGIC_BSCFD.commercial + STRATEGIC_BSCFD.industry).toFixed(3);
const otherDomestic = +(domesticDay - strategicSum).toFixed(3);

export const GAS_NODES: GasNode[] = [
  { id: "prod", label: "Gross production", value: perDay(USES), col: 0,
    color: "var(--foreground)", note: "NUPRC, 2025 average" },

  { id: "export", label: "Export, mostly LNG", value: perDay(GAS_2025_BSCF.export), col: 1,
    color: "var(--chart-4)" },
  { id: "domestic", label: "Domestic market", value: domesticDay, col: 1,
    color: "var(--chart-2)" },
  { id: "field", label: "Field operations", value: perDay(GAS_2025_BSCF.fieldOperations), col: 1,
    color: "var(--chart-1)", note: "fuel and reinjection" },
  { id: "flare", label: "Flared", value: perDay(GAS_2025_BSCF.flared), col: 1,
    color: "var(--chart-3)", note: `${GAS_2025_BSCF.flarePct}% of production` },

  { id: "power", label: "Gas to power", value: STRATEGIC_BSCFD.power, col: 2,
    color: "var(--chart-2)" },
  { id: "commercial", label: "Commercial", value: STRATEGIC_BSCFD.commercial, col: 2,
    color: "color-mix(in oklab, var(--chart-2) 68%, var(--card))" },
  { id: "industry", label: "Gas-based industry", value: STRATEGIC_BSCFD.industry, col: 2,
    color: "color-mix(in oklab, var(--chart-2) 44%, var(--card))" },
  { id: "other", label: "Other domestic", value: otherDomestic, col: 2,
    color: "var(--muted-foreground)", note: "not itemised by sector" },
];

export const GAS_LINKS: GasLink[] = [
  { from: "prod", to: "export", value: perDay(GAS_2025_BSCF.export) },
  { from: "prod", to: "domestic", value: domesticDay },
  { from: "prod", to: "field", value: perDay(GAS_2025_BSCF.fieldOperations) },
  { from: "prod", to: "flare", value: perDay(GAS_2025_BSCF.flared) },
  { from: "domestic", to: "power", value: STRATEGIC_BSCFD.power },
  { from: "domestic", to: "commercial", value: STRATEGIC_BSCFD.commercial },
  { from: "domestic", to: "industry", value: STRATEGIC_BSCFD.industry },
  { from: "domestic", to: "other", value: otherDomestic },
];

export const GAS_FACTS = {
  productionDay: perDay(USES),
  exportShare: +(GAS_2025_BSCF.export / USES * 100).toFixed(1),
  domesticShare: +(GAS_2025_BSCF.domestic / USES * 100).toFixed(1),
  powerShare: +(STRATEGIC_BSCFD.power / perDay(USES) * 100).toFixed(1),
  flareShare: GAS_2025_BSCF.flarePct,
  otherDomestic,
  strategicSum,
};

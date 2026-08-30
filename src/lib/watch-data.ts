/**
 * Data behind the theft decomposition, the electricity settlement rate, and
 * the capital trackers. Every figure verified against a named source before
 * it was written here.
 */

/* ── Crude losses, NUPRC annual series ──────────────────────────────────
   2021 was the worst year in roughly 23 years. The 2025 figure covers
   January to July, the period NUPRC reported as a 16-year low. */
export const THEFT = [
  { year: "2021", bpd: 102_900, mbbl: 37.6 },
  { year: "2022", bpd: 57_200, mbbl: 20.9 },
  { year: "2023", bpd: 11_900, mbbl: 4.3 },
  { year: "2024", bpd: 11_300, mbbl: 4.1 },
  { year: "2025", bpd: 9_600, mbbl: 2.04, partial: "Jan to Jul" },
] as const;

const RECOVERED = THEFT[0].bpd - THEFT[THEFT.length - 1].bpd;

/* July 2026 crude, NUPRC, against the 2026 budget benchmark. */
const JULY_CRUDE = 1_505_000;
const BUDGET = 1_840_000;

export const THEFT_FACTS = {
  peakBpd: THEFT[0].bpd,
  nowBpd: THEFT[THEFT.length - 1].bpd,
  recovered: RECOVERED,
  cutPct: +(RECOVERED / THEFT[0].bpd * 100).toFixed(1),
  gapToBudget: BUDGET - JULY_CRUDE,
  /* What is left to steal, against what is still missing. This is the whole
     argument: ending theft entirely would close 2.9% of the remaining gap. */
  remainingTheftShareOfGap: +(THEFT[THEFT.length - 1].bpd / (BUDGET - JULY_CRUDE) * 100).toFixed(1),
  julyCrude: JULY_CRUDE,
  budget: BUDGET,
};

/* ── Electricity settlement, NBET market data via GenCo reporting ─────── */
export const SETTLEMENT = [
  { month: "Jan", invoiced: 252.48, paid: 113.21 },
  { month: "Feb", invoiced: 198.68, paid: 79.58 },
  { month: "Mar", invoiced: 208.51, paid: 86.75 },
  { month: "Apr", invoiced: 194.31, paid: 83.59 },
] as const;

const INV = SETTLEMENT.reduce((a, m) => a + m.invoiced, 0);
const PAID = SETTLEMENT.reduce((a, m) => a + m.paid, 0);

export const SETTLEMENT_FACTS = {
  ratePct: +(PAID / INV * 100).toFixed(2),
  avgInvoiced: +(INV / SETTLEMENT.length).toFixed(1),
  avgPaid: +(PAID / SETTLEMENT.length).toFixed(1),
  shortfallMonthly: +((INV - PAID) / SETTLEMENT.length).toFixed(1),
  /* NERC/GenCo reporting for the full prior year, and the tariff shortfall
     accumulated April 2025 to April 2026. */
  prevYearRatePct: 39,
  tariffShortfallTn: 1.783,
  debtBy2033Tn: 17.1,
};

/* ── Deepwater FID watch ────────────────────────────────────────────────
   The panel wish was "at least one of two deepwater FIDs". Neither has
   happened. Dates are what has actually been announced. */
export const FID_WATCH = [
  { date: "Mar 2026", label: "Presidential approval of fiscal incentives", done: true },
  { date: "Aug 2026", label: "Production tax credit gazetted at $11.50/bbl", done: true },
  { date: "2027", label: "Bonga South West / Aparo final investment decision", done: false },
  { date: "not set", label: "Zabazaba final investment decision", done: false },
];

export const FID_FACTS = { taken: 0, watched: 2 };

/* ── Africa Energy Bank ─────────────────────────────────────────────────
   Authorised capital $5bn, about 45% subscribed. Launch has slipped
   repeatedly; the operational date claimed most recently is 1 July 2026. */
export const AEB = {
  authorisedBn: 5,
  subscribedPct: 45,
  slips: [
    { when: "Mid 2025", what: "First operational date indicated" },
    { when: "Jul 2026", what: "Latest stated launch, Abuja headquarters complete" },
  ],
};

/* ── 2025 licensing round, NUPRC ────────────────────────────────────────
   Offered 1 Dec 2025; commercial bid conference 21 Jul 2026; ministerial
   approval and contracting expected July to October 2026. Thirteen blocks
   attracted no bid at all. */
export const LICENSING = {
  offered: 50,
  bidFor: 37,
  awarded: 37,
  firms: 31,
  executed: 0,
};

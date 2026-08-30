/**
 * Petrol stock cover: what came in, what went out, and how many days were
 * reportedly held. All three figures are NMDPRA's own, for the same months.
 *
 * They do not reconcile, and that is the finding.
 *
 *   Flows:  receipts minus truck-out implies a build of about 400m litres
 *           across June and July.
 *   Cover:  days-of-cover moved 19.7 to 22.4. Read against each month's own
 *           truck-out that implies stock FELL 134m litres; read against a
 *           fixed 50m litres/day benchmark it implies a rise of 135m.
 *
 * Neither reading reproduces the flow balance, because the denominator behind
 * "days of sufficiency" is never published. It is the same unstated-
 * denominator problem as the refining utilisation figure in Downstream, and
 * it matters more here: an inventory build and an inventory drawdown are
 * opposite signals for anyone sourcing cargoes.
 */

export const STOCK_MONTHS = [
  { month: "June 2026", days: 30, receipts: 50.6, truckout: 47.4, cover: 19.7 },
  { month: "July 2026", days: 31, receipts: 45.5, truckout: 35.7, cover: 22.4 },
] as const;

const flowBuild = STOCK_MONTHS.reduce((a, m) => a + (m.receipts - m.truckout) * m.days, 0);

const first = STOCK_MONTHS[0];
const last = STOCK_MONTHS[STOCK_MONTHS.length - 1];

/** Benchmark consumption NMDPRA elsewhere treats as normal daily demand. */
const BENCHMARK = 50;

export const STOCK = {
  months: STOCK_MONTHS,
  flowBuild: Math.round(flowBuild),
  readings: [
    {
      label: "What the flows say",
      basis: "receipts minus truck-out, day by day",
      value: Math.round(flowBuild),
    },
    {
      label: "Cover against actual truck-out",
      basis: `${last.cover} × ${last.truckout} less ${first.cover} × ${first.truckout}`,
      value: Math.round(last.cover * last.truckout - first.cover * first.truckout),
    },
    {
      label: `Cover against a ${BENCHMARK} m litre benchmark`,
      basis: `${last.cover} × ${BENCHMARK} less ${first.cover} × ${BENCHMARK}`,
      value: Math.round((last.cover - first.cover) * BENCHMARK),
    },
  ],
  julyNet: +(last.receipts - last.truckout).toFixed(1),
  juneNet: +(first.receipts - first.truckout).toFixed(1),
  coverFrom: first.cover,
  coverTo: last.cover,
  benchmark: BENCHMARK,
  /** Days of cover the sector treats as the target. */
  target: 30,
};

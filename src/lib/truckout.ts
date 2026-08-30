/**
 * Petrol truck-out, NMDPRA, 2026. Daily averages in million litres.
 *
 * These monthly figures multiplied by days in month sum to 9,316m litres,
 * matching NMDPRA's published H1 total exactly, which is what proves the
 * two competing headlines are readings of one series rather than rival
 * datasets:
 *
 *   the regulator's -0.56%  is H1 2026 against H1 2025, a LEVEL comparison
 *   the marketers' -22.3%   is January against the May trough, a PATH one
 *
 * MEMAN's own report is built on this same NMDPRA truck-out data. Its 22.3%
 * implies endpoints marginally different from the published series, which
 * gives -23.1%; the construction is not in doubt, the third decimal is.
 *
 * July is carried but flagged. NMDPRA reported receipts of 45.5m litres a day
 * against truck-out of 35.7, so the market was building stock: a 25% fall in
 * truck-out beside a 10% fall in receipts is a distribution signal before it
 * is a demand one.
 */

const DAYS = { Jan: 31, Feb: 28, Mar: 31, Apr: 30, May: 31, Jun: 30, Jul: 31 };

type Month = { label: string; value: number; provisional?: boolean };

export const TRUCKOUT = {
  months: [
    { label: "Jan", value: 60.2 },
    { label: "Feb", value: 56.9 },
    { label: "Mar", value: 47.3 },
    { label: "Apr", value: 51.1 },
    { label: "May", value: 46.3 },
    { label: "Jun", value: 47.4 },
    { label: "Jul", value: 35.7, provisional: true },
  ] as Month[],
  /** H1 only: 9,316m and 9,368m litres over the same 181 days. */
  avg2026: 51.47,
  avg2025: 51.76,
  levelPct: -0.56,
  pathPct: -23.1,
  trough: 46.3,
  h1Total2026: 9316,
  h1Total2025: 9368,
  h1Days: 181,
  /** Where the half-year exited, against the prior half-year average. */
  exitJunPct: -8.4,
  exitJulPct: -31.0,
  julyReceipts: 45.5,
  julyTruckout: 35.7,
} as const;

export const TRUCKOUT_DAYS = DAYS;

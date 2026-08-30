/**
 * NMDPRA "State of the Midstream and Downstream Sector" fact sheet,
 * October 2025, extracted from the published PDF in this repo's pipeline.
 *
 * One caveat carried into the UI: the 61.58% refining figure is printed
 * without a denominator. Against installed capacity it would imply about
 * 693,000 bpsd of throughput running through 467,000 bpsd of active plant,
 * which is impossible, so it can only be utilisation of the refineries
 * actually operating. The panel says so rather than picking silently.
 */

type Util = {
  label: string; pct: number; period: string; note: string; caveat?: boolean;
};

export const UTILISATION: Util[] = [
  {
    label: "Refineries running",
    pct: 61.58,
    period: "Q1–Q3 2025",
    note: "denominator unstated; can only be the active plants",
    caveat: true,
  },
  { label: "Gas processing plants", pct: 64.7, period: "Oct 2025", note: "3.94 of 6.1 bscf/d" },
  { label: "NLNG trains 1 to 6", pct: 71.68, period: "Oct 2025", note: "3.5 bscf/d capacity" },
  { label: "Escravos gas plant", pct: 75.57, period: "Oct 2025", note: "0.68 bscf/d capacity" },
];

/** Presidential CNG Initiative. Each row carries its own scale. */
export const PCNGI_VEHICLES = [
  { label: "Cars", count: 100_000, per: 10_000, icon: "car" as const },
  { label: "Trucks", count: 16_000, per: 2_000, icon: "truck" as const,
    note: "includes Dangote's 4,000" },
  { label: "Tricycles", count: 4_613, per: 500, icon: "bike" as const },
  { label: "Buses", count: 547, per: 100, icon: "bus" as const },
];

export const PCNGI_STATIONS = {
  built: 68,
  building: 150,
  mother: 27,
  investmentBn: 0.99,
  jobsDirect: 10_000,
  jobsIndirect: 70_000,
  wholesalePerMmbtu: 1.57,
};

export const NETWORK = [
  { label: "Retail outlets", value: 22_681, unit: "approx.", icon: "store" as const },
  { label: "Product depots", value: 256, unit: "nationwide", icon: "warehouse" as const },
  { label: "Tanker trucks", value: 25_000, unit: "and more", icon: "truck" as const },
];

export const STORAGE = [
  { label: "Petrol", bnLitres: 4.72 },
  { label: "Diesel", bnLitres: 2.54 },
  { label: "Aviation fuel", bnLitres: 0.464 },
];

/**
 * Dangote against its own plan. The fact sheet's 18.03 covers October 2024
 * to October 2025 and has since been overtaken, so both points are shown:
 * presenting the 2025 average as current would be a year out of date.
 */
export const DANGOTE = {
  plannedMlPerDay: 35,
  points: [
    { label: "Oct 2024 – Oct 2025", value: 18.03, source: "NMDPRA fact sheet" },
    { label: "June 2026", value: 39.1, source: "NMDPRA monthly supply" },
  ],
};

export const PCNGI_TOTAL = PCNGI_VEHICLES.reduce((a, v) => a + v.count, 0);

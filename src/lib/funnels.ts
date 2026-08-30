/**
 * Two attrition funnels. Both answer the conference's own question — does a
 * stated intention become a real thing — and both are drawn from figures
 * already verified elsewhere in this project.
 */

export type Stage = {
  label: string;
  /** The headline count for the stage. */
  count: number;
  countUnit: string;
  /** Optional second measure carried alongside, e.g. capacity. */
  size?: number;
  sizeUnit?: string;
  note?: string;
  /** Terminal stages that represent a real, working outcome. */
  tone?: "live" | "pending" | "dead";
};

/**
 * Refining: NMDPRA "State of the Midstream and Downstream Sector" fact sheet,
 * October 2025, extracted from the published PDF.
 *
 *   LTE = Licence to Establish, LTC = Licence to Construct.
 *   The sheet notes the 47 LTEs are inclusive of the 31 LTCs, so these are
 *   nested stages of one pipeline rather than separate populations.
 *
 * One wrinkle worth carrying: the sheet lists 4 active refineries in its
 * headline (Dangote, Aradel, Edo, Waltersmith) but its own footnote refers to
 * "the 6 operational private refineries". Both appear on the same page. The
 * funnel uses the headline 4 and the panel says the footnote disagrees.
 */
export const REFINING_FUNNEL: Stage[] = [
  { label: "Licensed to establish", count: 47, countUnit: "licences",
    size: 1_752_000, sizeUnit: "bpsd", note: "granted since 2000" },
  { label: "Advanced to construction licence", count: 31, countUnit: "licences",
    size: 1_228_000, sizeUnit: "bpsd" },
  { label: "Running today", count: 4, countUnit: "refineries",
    size: 467_000, sizeUnit: "bpsd", note: "Dangote, Aradel, Edo, Waltersmith", tone: "live" },
];

/**
 * Deliberately NOT a funnel stage. The three refineries under construction are
 * in flight now; the four that are running were built earlier. Both descend
 * from the 31 construction licences in parallel, so stacking them as
 * consecutive stages would imply the running four came out of the building
 * three and produce a nonsense conversion rate above 100%.
 */
export const REFINING_IN_FLIGHT = {
  count: 3,
  capacity: 47_000,
  names: "Waltersmith Train 2, AIPCC, Azikel",
};

export const FUNNEL_FACTS = {
  refiningCapacityKept: +(467_000 / 1_752_000 * 100).toFixed(1),
  refiningLicensedMbpsd: 1.752,
  refiningActiveKbpsd: 467,
};

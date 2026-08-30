/**
 * The conference wishes and their current readings.
 *
 * Kept in a plain module rather than beside the component: a "use client"
 * file only hands the server a client-reference proxy for its exports, so
 * reading WATCH_COUNTS.total in a server component silently produced
 * nothing. Data lives here, the component imports it, and so can the page.
 */
export type Status = "moving" | "stalled" | "unmeasured";

type Wish = {
  wish: string;
  who: string;
  metric: string;
  reading: string;
  status: Status;
  note: string;
};

export const LABEL: Record<Status, string> = {
  moving: "moving",
  stalled: "stalled",
  unmeasured: "not measurable",
};
export const TONE: Record<Status, string> = {
  moving: "var(--chart-2)",
  stalled: "var(--chart-3)",
  unmeasured: "var(--muted-foreground)",
};

/**
 * What the panels asked for in the next twelve months, each converted to
 * something that can actually be checked. Wishes are paraphrased from notes
 * taken at the conference on 27 August 2026, not transcribed.
 */
export const WISHES: Wish[] = [
  {
    wish: "At least one of two deepwater investment decisions",
    who: "Oliver",
    metric: "Deepwater FIDs signed",
    reading: "0 of 2",
    status: "stalled",
    note: "Fiscal incentives were approved in March and the $11.50 production tax credit gazetted in August, both real. Neither is a decision. Bonga South West targets 2027, Zabazaba has no date.",
  },
  {
    wish: "The big licensing rounds need to be concluded",
    who: "Oliver",
    metric: "Concession contracts executed",
    reading: "0 of 37 awarded",
    status: "stalled",
    note: "37 blocks went provisionally to 31 companies on 21 July 2026. Signature bonuses and contracting run to October. Thirteen of the fifty blocks drew no bid at all.",
  },
  {
    wish: "No capital for the energy bank",
    who: "Oliver",
    metric: "Africa Energy Bank capital subscribed",
    reading: "about 45% of $5bn",
    status: "stalled",
    note: "Stated as a concern rather than a wish, and the figures support it. The Abuja headquarters is finished; the launch date has moved more than once.",
  },
  {
    wish: "Indigenous operators step up after the divestments",
    who: "Nneka",
    metric: "Asset-level output after handover",
    reading: "27% equity, over 50% operatorship",
    status: "unmeasured",
    note: "The share itself has no agreed denominator, so the question cannot be settled as posed. Output per asset after each handover would settle it, and is not published.",
  },
  {
    wish: "Keep publishing the analytics",
    who: "Rotimi",
    metric: "Regulator reporting cadence",
    reading: "22 consecutive OPEC editions parsed",
    status: "moving",
    note: "This dashboard is itself the evidence. NUPRC and NMDPRA have kept to schedule; the revision behaviour of those releases is measured in Method.",
  },
  {
    wish: "Reliability and asset integrity",
    who: "Grace",
    metric: "Unplanned downtime by asset",
    reading: "not published",
    status: "unmeasured",
    note: "No Nigerian operator publishes asset-level downtime. The wish exists precisely because the series does not, and that gap is the finding.",
  },
  {
    wish: "Speed of execution and approval",
    who: "Grace",
    metric: "Submission to approval lag",
    reading: "partially visible",
    status: "unmeasured",
    note: "NUPRC announces approvals and operates a 90-day fast-track window, but submission dates are rarely public, so the lag cannot be computed from outside.",
  },
  {
    wish: "Reserve replacement over five years",
    who: "Oliver",
    metric: "Reserves added against produced",
    reading: "oil −0.74%, gas +2.21%",
    status: "unmeasured",
    note: "NUPRC publishes the net change and no replacement ratio, and gives no production or additions figure to derive one. Direction is clear, the ratio is not available.",
  },
  {
    wish: "More barrels, more investment",
    who: "Olajumoke",
    metric: "Crude output against benchmark",
    reading: "1,505 against 1,840 tb/d",
    status: "stalled",
    note: "July output was 4% below June. The price excuse was removed this year: Brent ran far above the $64.85 the budget assumed, and the volume gap held anyway.",
  },
  {
    wish: "Do not overlook gas",
    who: "Rotimi",
    metric: "Gas reaching the domestic market",
    reading: "28.9% of production",
    status: "moving",
    note: "Gas reserves grew while oil fell, and the reserves life index is 85 years against 59. The constraint is downstream: the power sector settles at 42%.",
  },
];

export const WATCH_COUNTS = {
  total: WISHES.length,
  moving: WISHES.filter((w) => w.status === "moving").length,
  stalled: WISHES.filter((w) => w.status === "stalled").length,
  unmeasured: WISHES.filter((w) => w.status === "unmeasured").length,
};


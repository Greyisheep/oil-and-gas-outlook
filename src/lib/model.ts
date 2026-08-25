import { MONTHS, NG_SECONDARY, NG_DIRECT, OPEC_TOTAL, NG_RIGS, BONNY, DATED, ORB } from "./opec-data";

/** Benchmarks in circulation for Nigeria, 2026. Keep crude-only and crude+condensate apart. */
export const BENCH = {
  opecQuota: 1500,      // tb/d, crude only
  budget: 1840,         // tb/d, 2026 budget benchmark
  mtefTarget: 2060,     // tb/d, 2026-28 MTEF target
  budgetPrice: 64.85,   // US$/b, 2026 budget benchmark price
};

export const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const monthLabel = (m: string) => {
  const [y, mm] = m.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+mm - 1]} ${y.slice(2)}`;
};

export type Row = Record<string, number | string | null>;

/** Wide table for the charts: one row per month, all series joined. */
export function buildSeries(): Row[] {
  return MONTHS.map((m, i) => {
    const sec = NG_SECONDARY[i], dir = NG_DIRECT[i], tot = OPEC_TOTAL[i];
    const bl = BONNY[i], dt = DATED[i];
    return {
      month: m,
      label: monthLabel(m),
      secondary: sec,
      direct: dir,
      gap: sec != null && dir != null ? +(sec - dir).toFixed(0) : null,
      quota: BENCH.opecQuota,
      budget: BENCH.budget,
      opecShare: sec != null && tot ? +((sec / tot) * 100).toFixed(2) : null,
      rigs: NG_RIGS[i],
      bonny: bl,
      dated: dt,
      orb: ORB[i],
      diff: bl != null && dt != null ? +(bl - dt).toFixed(2) : null,
    };
  });
}

/** Index a series to 100 at its first non-null value. Lets unlike scales share one axis. */
export function indexed(vals: (number | null)[]): (number | null)[] {
  const base = vals.find((v) => v != null) as number | undefined;
  if (!base) return vals;
  return vals.map((v) => (v == null ? null : +((v / base) * 100).toFixed(1)));
}

/** Cross-correlation of rigs (lead) against production (lag), in months. */
export function rigLag(maxLag = 15) {
  const r = NG_RIGS, p = NG_SECONDARY;
  const out: { lag: number; r: number }[] = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    const xs: number[] = [], ys: number[] = [];
    for (let i = 0; i + lag < r.length; i++) {
      const a = r[i], b = p[i + lag];
      if (a != null && b != null) { xs.push(a); ys.push(b); }
    }
    if (xs.length < 6) continue;
    const mx = xs.reduce((s, v) => s + v, 0) / xs.length;
    const my = ys.reduce((s, v) => s + v, 0) / ys.length;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < xs.length; i++) {
      const a = xs[i] - mx, b = ys[i] - my;
      num += a * b; dx += a * a; dy += b * b;
    }
    out.push({ lag, r: +(num / Math.sqrt(dx * dy)).toFixed(3) });
  }
  return out;
}

export type Scenario = {
  brent: number;      // US$/b
  diff: number;       // US$/b, your grade vs Dated
  ngn: number;        // NGN per USD
  natProd: number;    // tb/d national
};

export type CompanyInput = {
  gross: number;      // bpd gross field production
  wi: number;         // working interest %
  opex: number;       // US$/bbl
  royalty: number;    // %
  tax: number;        // %
  decline: number;    // % per month
  capex: number;      // US$m per month
};

export type OutlookRow = {
  month: string; label: string; prod: number; realised: number;
  revenue: number; royalty: number; opex: number; tax: number;
  netCash: number; cum: number; ngn: number;
};

const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Twelve-month forward projection for a single company.
 * Deliberately simple: realised price = Brent + differential; tax applies to
 * revenue net of royalty, opex and capex. Nigeria's actual PIA fiscal terms
 * (PPT/HCT/CIT split, capital allowances, PSC cost recovery) are materially
 * more complex. This is an order-of-magnitude tool, not a tax computation.
 */
export function projectCompany(s: Scenario, c: CompanyInput, startFrom = new Date(2026, 7, 1)): OutlookRow[] {
  const rows: OutlookRow[] = [];
  let prod = c.gross * (c.wi / 100);
  let cum = 0;
  for (let i = 0; i < 12; i++) {
    const d = new Date(startFrom.getFullYear(), startFrom.getMonth() + i, 1);
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const realised = s.brent + s.diff;
    const revenue = (prod * days * realised) / 1e6;          // US$m
    const royalty = revenue * (c.royalty / 100);
    const opex = (prod * days * c.opex) / 1e6;
    const base = revenue - royalty - opex - c.capex;
    const tax = base > 0 ? base * (c.tax / 100) : 0;
    const netCash = base - tax;
    cum += netCash;
    rows.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MN[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      prod: Math.round(prod), realised: +realised.toFixed(2),
      revenue: +revenue.toFixed(1), royalty: +royalty.toFixed(1),
      opex: +opex.toFixed(1), tax: +tax.toFixed(1),
      netCash: +netCash.toFixed(1), cum: +cum.toFixed(1),
      ngn: +((netCash * s.ngn) / 1000).toFixed(2),           // NGN bn
    });
    prod *= 1 - c.decline / 100;
  }
  return rows;
}

/** National-level readout driven by the same levers. */
export function nationalView(s: Scenario) {
  const days = 30.44;
  const monthlyRev = (s.natProd * 1000 * days * (s.brent + s.diff)) / 1e9;    // US$bn
  const benchRev = (BENCH.budget * 1000 * days * BENCH.budgetPrice) / 1e9;
  return {
    monthlyRev,
    benchRev,
    delta: monthlyRev - benchRev,
    volGap: s.natProd - BENCH.budget,
    priceGap: s.brent + s.diff - BENCH.budgetPrice,
    annualised: monthlyRev * 12,
  };
}

/* ── Correlation utilities ───────────────────────────────────────────────── */
import {
  WAF_USGC_SUEZ, WAF_EAST_VLCC, ME_EAST_VLCC, OECD_DAYS_COVER, OECD_CRUDE_STOCK,
  OPEC_TOTAL as OPEC_TOT,
} from "./opec-data";

type Ser = (number | null)[];

export function pearson(a: Ser, b: Ser, minN = 8): { r: number; n: number } | null {
  const xs: [number, number][] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i], y = b[i];
    if (x != null && y != null) xs.push([x, y]);
  }
  if (xs.length < minN) return null;
  const n = xs.length;
  const mx = xs.reduce((s, p) => s + p[0], 0) / n;
  const my = xs.reduce((s, p) => s + p[1], 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (const [x, y] of xs) { const u = x - mx, v = y - my; num += u * v; dx += u * u; dy += v * v; }
  const den = Math.sqrt(dx * dy);
  return den ? { r: +(num / den).toFixed(3), n } : null;
}

/** First differences. Removes the shared trend that inflates correlations on levels. */
export function firstDiff(a: Ser): Ser {
  return a.slice(1).map((v, i) => (v == null || a[i] == null ? null : v - (a[i] as number)));
}

const S = buildSeries();
const col = (k: keyof (typeof S)[number]) => S.map((r) => r[k] as number | null);

export const CORR_SERIES: Record<string, Ser> = {
  "Nigeria output": col("secondary"),
  "Nigeria rigs": col("rigs"),
  "Nigeria share of OPEC": col("opecShare"),
  "OPEC total": OPEC_TOT,
  "Bonny Light": col("bonny"),
  "Bonny differential": col("diff"),
  "WAF to US Gulf freight": WAF_USGC_SUEZ,
  "WAF to East freight": WAF_EAST_VLCC,
  "Gulf to East freight": ME_EAST_VLCC,
  "OECD days of cover": OECD_DAYS_COVER,
  "OECD crude stocks": OECD_CRUDE_STOCK,
};

export type CorrRow = { a: string; b: string; levels: number; changes: number; n: number; identity?: boolean };

/** Pairs ranked by |r| on levels, each shown against its differenced counterpart. */
export function correlationTable(): CorrRow[] {
  const keys = Object.keys(CORR_SERIES);
  const out: CorrRow[] = [];
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i], b = keys[j];
      const L = pearson(CORR_SERIES[a], CORR_SERIES[b]);
      const C = pearson(firstDiff(CORR_SERIES[a]), firstDiff(CORR_SERIES[b]));
      if (!L || !C) continue;
      const identity =
        (a.includes("share") && b.includes("OPEC total")) || (b.includes("share") && a.includes("OPEC total")) ||
        (a === "Bonny Light" && b === "Bonny differential") || (b === "Bonny Light" && a === "Bonny differential");
      out.push({ a, b, levels: L.r, changes: C.r, n: C.n, identity });
    }
  return out.sort((x, y) => Math.abs(y.levels) - Math.abs(x.levels));
}

/** Full lag profile, so a lone spike is visible as a lone spike. */
export function lagProfile(lead: Ser, follow: Ser, maxLag = 6) {
  const out: { lag: number; r: number; n: number }[] = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    const a = lag ? lead.slice(0, lead.length - lag) : lead;
    const b = follow.slice(lag);
    const c = pearson(a, b, 6);
    if (c) out.push({ lag, r: c.r, n: c.n });
  }
  return out;
}

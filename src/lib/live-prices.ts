/**
 * Live daily energy prices from FRED, which republishes the EIA series.
 *
 * Keyless CSV endpoints, fetched on the server and cached for an hour. If FRED
 * is unreachable the page falls back to the last snapshot committed here, so a
 * failed request degrades to stale-but-labelled rather than to an empty chart.
 */

export type Point = { date: string; brent: number | null; wti: number | null; gas: number | null };

export type LivePrices = {
  points: Point[];
  latest: { brent: number | null; wti: number | null; gas: number | null; date: string };
  spread: number | null;      // Brent over WTI
  live: boolean;              // false when serving the fallback
  fetchedAt: string;
};

const SERIES = {
  brent: "DCOILBRENTEU",      // Brent, Europe, daily, US$/bbl
  wti: "DCOILWTICO",          // WTI, Cushing, daily, US$/bbl
  gas: "DHHNGSP",             // Henry Hub natural gas spot, daily, US$/MMBtu
} as const;

/** Last known values, used only when the live fetch fails. */
const FALLBACK: Point[] = [
  { date: "2026-08-14", brent: 93.11, wti: 85.4, gas: 2.74 },
  { date: "2026-08-17", brent: 92.43, wti: 86.04, gas: 2.77 },
  { date: "2026-08-18", brent: 95.29, wti: 86.48, gas: 2.82 },
];

async function series(id: string): Promise<Map<string, number>> {
  const res = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`, {
    next: { revalidate: 3600 },
    headers: { "User-Agent": "oil-and-gas-outlook/1.0" },
  });
  if (!res.ok) throw new Error(`${id}: ${res.status}`);
  const out = new Map<string, number>();
  for (const line of (await res.text()).split("\n").slice(1)) {
    const [date, raw] = line.trim().split(",");
    if (!date || !raw || raw === ".") continue;      // FRED marks holidays with a dot
    const v = Number(raw);
    if (Number.isFinite(v)) out.set(date, v);
  }
  return out;
}

export async function getLivePrices(days = 260): Promise<LivePrices> {
  let points: Point[];
  let live = true;
  try {
    const [b, w, g] = await Promise.all([series(SERIES.brent), series(SERIES.wti), series(SERIES.gas)]);
    const dates = [...new Set([...b.keys(), ...w.keys(), ...g.keys()])].sort();
    points = dates.slice(-days).map((d) => ({
      date: d,
      brent: b.get(d) ?? null,
      wti: w.get(d) ?? null,
      gas: g.get(d) ?? null,
    }));
    if (!points.length) throw new Error("no rows");
  } catch {
    points = FALLBACK;
    live = false;
  }

  const lastWith = (k: "brent" | "wti" | "gas") =>
    [...points].reverse().find((p) => p[k] != null)?.[k] ?? null;
  const brent = lastWith("brent"), wti = lastWith("wti");
  const latestDate = [...points].reverse().find((p) => p.brent != null)?.date ?? points[points.length - 1].date;

  return {
    points,
    latest: { brent, wti, gas: lastWith("gas"), date: latestDate },
    spread: brent != null && wti != null ? +(brent - wti).toFixed(2) : null,
    live,
    fetchedAt: new Date().toISOString(),
  };
}

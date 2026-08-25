#!/usr/bin/env python3
"""Real-time backtest: fit only on the data that existed at each publication date.

The earlier backtest refitted at every origin but trained on today's revised
figures. That still leaks information, because those revisions had not happened
yet. Here the dataset is rebuilt from the vintages themselves, so the model sees
exactly what a forecaster would have had on the day.
"""
import json, pathlib

M = json.load(open("data-pipeline/momr_data.json"))
REPORTS = sorted(M["secondary"])
LAG = 9

def stitch(block, vintage):
    """Series for Nigeria as it was known at `vintage`: for each month take the
    value from the most recent report published on or before that date."""
    out = {}
    for rep in REPORTS:
        if rep > vintage: break
        for mo, v in block[rep].get("Nigeria", {}).items():
            out[mo] = v           # later report overwrites earlier: that is a revision
    return out

def ols(xy):
    n = len(xy)
    mx = sum(p[0] for p in xy)/n; my = sum(p[1] for p in xy)/n
    sxx = sum((p[0]-mx)**2 for p in xy); sxy = sum((p[0]-mx)*(p[1]-my) for p in xy)
    b = sxy/sxx if sxx else 0.0
    return my - b*mx, b

def shift(m, k):
    y, mm = int(m[:4]), int(m[5:]); t = (y*12+mm-1)+k
    return f"{t//12}-{t%12+1:02d}"

SETTLED = stitch(M["secondary"], REPORTS[-1])      # today's best estimate
SETTLED_RIGS = stitch(M["rigs"], REPORTS[-1])

rows = []
for V in REPORTS:
    prod_rt = stitch(M["secondary"], V)
    rigs_rt = stitch(M["rigs"], V)
    if not prod_rt or not rigs_rt: continue

    pairs = [(rigs_rt[shift(m, -LAG)], prod_rt[m])
             for m in sorted(prod_rt) if shift(m, -LAG) in rigs_rt]
    if len(pairs) < 6: continue

    p_last = max(prod_rt)
    target = shift(p_last, 1)
    src = shift(target, -LAG)
    if src not in rigs_rt: continue
    if target not in SETTLED: continue            # no settled actual to score against

    a, b = ols(pairs)
    pred = a + b*rigs_rt[src]
    rows.append({
        "vintage": V, "target": target, "trainN": len(pairs),
        "pred": round(pred, 1), "actual": SETTLED[target],
        "err": round(SETTLED[target]-pred, 1),
        "rigsUsed": rigs_rt[src], "slope": round(b, 3),
        # what the same month looked like when first published, vs settled now
        "firstPrint": None,
    })

# first-print value for each target, from the earliest report that carried it
for r in rows:
    for rep in REPORTS:
        v = M["secondary"][rep].get("Nigeria", {}).get(r["target"])
        if v is not None:
            r["firstPrint"] = v
            break

def mae(xs): return sum(abs(x) for x in xs)/len(xs)
errs = [r["err"] for r in rows]
naive = [SETTLED[r["target"]] - SETTLED[shift(r["target"], -1)]
         for r in rows if shift(r["target"], -1) in SETTLED]

print(f"real-time origins: {len(rows)}  ({rows[0]['vintage']} .. {rows[-1]['vintage']})\n")
print(f"{'vintage':>8} {'target':>8} {'n':>3} {'rigs':>5} {'slope':>7} {'pred':>7} {'actual':>7} {'err':>7}")
for r in rows:
    print(f"{r['vintage']:>8} {r['target']:>8} {r['trainN']:3d} {r['rigsUsed']:5.0f} "
          f"{r['slope']:7.2f} {r['pred']:7.1f} {r['actual']:7.0f} {r['err']:+7.1f}")

print(f"\nreal-time MAE   {mae(errs):.1f} tb/d")
print(f"naive MAE       {mae(naive):.1f} tb/d")
print(f"real-time MASE  {mae(errs)/mae(naive):.3f}")
print(f"slope drifted   {min(r['slope'] for r in rows):.2f} to {max(r['slope'] for r in rows):.2f} across vintages")

pathlib.Path("data-pipeline/realtime.json").write_text(json.dumps({
  "lag": LAG, "origins": len(rows),
  "mae": round(mae(errs), 1), "naiveMae": round(mae(naive), 1),
  "mase": round(mae(errs)/mae(naive), 3),
  "slopeMin": round(min(r["slope"] for r in rows), 3),
  "slopeMax": round(max(r["slope"] for r in rows), 3),
  "rows": rows,
}, indent=1))
print("\nwrote data-pipeline/realtime.json")

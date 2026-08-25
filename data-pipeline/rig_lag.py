#!/usr/bin/env python3
"""Rig-to-barrel lag model with rolling-origin backtest and conformal bands.

Deliberately minimal: with 26 monthly observations a distributed lag with many
terms would fit noise. One lagged regressor, evaluated honestly.
"""
import json, pathlib, statistics as st

D = json.load(open("data-pipeline/dashboard_data.json"))
M, RIGS, PROD = D["months"], D["ng_rigs"], D["ng_sec"]

def pairs(lag):
    """(rig at t-lag, production at t, month t)"""
    out = []
    for t in range(len(M)):
        s = t - lag
        if s < 0: continue
        if RIGS[s] is None or PROD[t] is None: continue
        out.append((RIGS[s], PROD[t], M[t]))
    return out

def ols(xy):
    n = len(xy)
    mx = sum(p[0] for p in xy)/n; my = sum(p[1] for p in xy)/n
    sxx = sum((p[0]-mx)**2 for p in xy)
    sxy = sum((p[0]-mx)*(p[1]-my) for p in xy)
    b = sxy/sxx if sxx else 0.0
    return my - b*mx, b

def r2(xy, a, b):
    my = sum(p[1] for p in xy)/len(xy)
    ss_t = sum((p[1]-my)**2 for p in xy)
    ss_r = sum((p[1]-(a+b*p[0]))**2 for p in xy)
    return 1 - ss_r/ss_t if ss_t else 0.0

print("=== in-sample fit by lag (this is selection, see backtest below) ===")
print(f"{'lag':>3} {'n':>3} {'slope':>8} {'intercept':>10} {'R2':>7}")
fits = {}
for L in range(0, 13):
    xy = pairs(L)
    if len(xy) < 12: continue
    a, b = ols(xy)
    fits[L] = (a, b, r2(xy, a, b), len(xy))
    print(f"{L:3d} {len(xy):3d} {b:8.2f} {a:10.1f} {r2(xy,a,b):7.3f}")

# ── rolling-origin backtest: refit at each origin, no look-ahead ────────────
def backtest(lag, min_train=10):
    xy = pairs(lag)
    rows = []
    for k in range(min_train, len(xy)):
        train, (x, y, m) = xy[:k], xy[k]
        a, b = ols(train)
        pred = a + b*x
        rows.append({"month": m, "actual": y, "pred": pred, "err": y-pred, "n_train": k})
    return rows

def naive_backtest(lag, min_train=10):
    """Benchmark: last observed production carried forward."""
    xy = pairs(lag); rows = []
    for k in range(min_train, len(xy)):
        pred = xy[k-1][1]
        rows.append({"err": xy[k][1]-pred})
    return rows

def mae(rows): return sum(abs(r["err"]) for r in rows)/len(rows)

print("\n=== rolling-origin backtest, MAE tb/d (lower is better) ===")
print(f"{'lag':>3} {'origins':>8} {'model':>8} {'naive':>8} {'MASE':>7}")
best = None
for L in sorted(fits):
    bt = backtest(L); nv = naive_backtest(L)
    if len(bt) < 5: continue
    m_mae, n_mae = mae(bt), mae(nv)
    mase = m_mae/n_mae if n_mae else float("inf")
    print(f"{L:3d} {len(bt):8d} {m_mae:8.1f} {n_mae:8.1f} {mase:7.3f}")
    if best is None or mase < best[1]: best = (L, mase, bt)

L, mase, bt = best
a, b, R2, n = fits[L]
print(f"\nBEST BY BACKTEST: lag={L} months · MASE={mase:.3f} · in-sample R2={R2:.3f} · n={n}")
print(f"  production = {a:.1f} + {b:.2f} x rigs(t-{L})")
print(f"  each additional rig implies ~{b:.0f} tb/d after {L} months")

# ── conformal intervals from backtest residuals ────────────────────────────
res = sorted(abs(r["err"]) for r in bt)
def q(p):
    if not res: return 0.0
    i = min(len(res)-1, int((len(res))*p + 0.999999) - 1)
    return res[max(0, i)]
bands = {"80": q(0.80), "90": q(0.90), "95": q(0.95)}
print(f"\nconformal half-widths from {len(res)} backtest residuals:")
for k, v in bands.items(): print(f"  {k}%: +/- {v:.0f} tb/d")

out = {
  "lag": L, "intercept": round(a, 2), "slope": round(b, 3),
  "r2": round(R2, 3), "n": n, "mase": round(mase, 3),
  "mae": round(mae(bt), 1), "naiveMae": round(mae(naive_backtest(L)), 1),
  "origins": len(bt),
  "bands": {k: round(v, 1) for k, v in bands.items()},
  "backtest": [{"month": r["month"], "actual": round(r["actual"]),
                "pred": round(r["pred"], 1)} for r in bt],
  "lagScan": [{"lag": k, "slope": round(v[1], 2), "r2": round(v[2], 3)} for k, v in sorted(fits.items())],
}
pathlib.Path("data-pipeline/rig_lag.json").write_text(json.dumps(out, indent=1))
print("\nwrote data-pipeline/rig_lag.json")

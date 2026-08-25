#!/usr/bin/env python3
"""Freight, stocks and world-balance series from OPEC MOMR PDFs."""
import re, json, subprocess, pathlib, sys
SRC = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2])
MON = {m:i+1 for i,m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())}
MN  = {"january":1,"february":2,"march":3,"april":4,"may":5,"june":6,"july":7,
       "august":8,"september":9,"october":10,"november":11,"december":12}
MTOK = r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'
COL = re.compile(r'\b(' + MTOK + r')\s*(\d{2})\b')
# the Change column repeats month names ("Jun 26/May 26"); strip it before counting
RATIO = re.compile(MTOK + r'\s*\d{2}\s*/\s*' + MTOK + r'\s*\d{2}')
NUM = re.compile(r'-?[\d,]+\.?\d*')

ROWS = {
  "waf_east_vlcc":   (r'West Africa/East',            "Table 7 - 1"),
  "waf_usgc_suez":   (r'West Africa/US Gulf Coast',   "Table 7 - 2"),
  "me_west_vlcc":    (r'Middle East/West',            "Table 7 - 1"),
  "me_east_vlcc":    (r'Middle East/East',            "Table 7 - 1"),
  "stock_crude":     (r'Crude oil',                   "Table 9 - 1"),
  "stock_product":   (r'Products',                    "Table 9 - 1"),
  "days_cover":      (r'Days of forward cover',       "Table 9 - 1"),
}

def grab(lines, anchor, rowpat):
    i = next((k for k,l in enumerate(lines) if anchor in l), None)
    if i is None: return None
    months, hi = None, None
    for j in range(i, min(i+8, len(lines))):
        c = COL.findall(RATIO.sub('', lines[j]))
        if len(c) >= 2: months, hi = [f"20{y}-{MON[m.lower()]:02d}" for m,y in c], j; break
    if not months: return None
    for j in range(hi+1, min(hi+16, len(lines))):
        if re.match(r'\s*'+rowpat+r'\s{2,}', lines[j]):
            nums = [float(n.replace(",","")) for n in NUM.findall(lines[j])]
            if len(nums) >= len(months)+1:
                return dict(zip(months, nums[-(len(months)+1):-1]))
    return None

out = {}
for pdf in sorted(SRC.glob("momr-*.pdf")):
    mname, yr = pdf.stem.replace("momr-","").rsplit("-",1)
    lines = subprocess.run(["pdftotext","-layout",str(pdf),"-"],
                           capture_output=True, text=True).stdout.split("\n")
    for key,(rowpat, anchor) in ROWS.items():
        got = grab(lines, anchor, rowpat)
        if got:
            for m,v in got.items(): out.setdefault(key, {})[m] = v

OUT.write_text(json.dumps(out, indent=1))
for k,v in out.items():
    ms = sorted(v)
    print(f"{k:16s} n={len(ms):2d} {ms[0] if ms else '-'}..{ms[-1] if ms else '-'}  last={[v[m] for m in ms[-4:]]}")

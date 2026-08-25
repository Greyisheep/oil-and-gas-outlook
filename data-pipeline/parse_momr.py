#!/usr/bin/env python3
"""Extract structured series from OPEC Monthly Oil Market Report PDFs."""
import re, json, subprocess, pathlib, sys

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
MON = {m: i+1 for i, m in enumerate(
    "jan feb mar apr may jun jul aug sep oct nov dec".split())}
MONTHNAME = {"january":1,"february":2,"march":3,"april":4,"may":5,"june":6,
             "july":7,"august":8,"september":9,"october":10,"november":11,"december":12}

# "Apr 26" / "Jun 25" -> 2026-04
COLPAT = re.compile(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{2})\b')
NUMPAT = re.compile(r'-?[\d,]+(?:\.\d+)?')

def text_of(pdf):
    return subprocess.run(["pdftotext","-layout",str(pdf),"-"],
                          capture_output=True, text=True).stdout

def parse_table(lines, start, countries):
    """Find header with month cols, then read country rows."""
    header, hdr_i = None, None
    for i in range(start, min(start+12, len(lines))):
        cols = COLPAT.findall(lines[i])
        if len(cols) >= 2:
            header, hdr_i = cols, i
            break
    if not header:
        return None, None
    months = [f"20{y}-{MON[m.lower()]:02d}" for m, y in header]
    rows = {}
    for i in range(hdr_i+1, min(hdr_i+45, len(lines))):
        ln = lines[i]
        for c in countries:
            if re.match(r'\s*'+re.escape(c)+r'\**\s{2,}', ln):
                nums = [float(n.replace(",","")) for n in NUMPAT.findall(ln)]
                # month cols are the last len(months)+1 values (incl. change col)
                if len(nums) >= len(months)+1:
                    vals = nums[-(len(months)+1):-1]
                    rows.setdefault(c, dict(zip(months, vals)))
    return months, rows

COUNTRIES = ["Algeria","Congo","Equatorial Guinea","Gabon","IR Iran","Iran","Iraq",
             "Kuwait","Libya","Nigeria","Saudi Arabia","UAE","Venezuela",
             "Total OPEC","Total DoC","Russia","Kazakhstan"]

out = {"secondary": {}, "direct": {}, "rigs": {}, "reports": []}

for pdf in sorted(SRC.glob("momr-*.pdf")):
    stem = pdf.stem.replace("momr-","")
    mname, yr = stem.rsplit("-",1)
    rep = f"{yr}-{MONTHNAME[mname]:02d}"
    txt = text_of(pdf)
    lines = txt.split("\n")
    out["reports"].append(rep)
    for i, ln in enumerate(lines):
        low = ln.lower()
        if "based on secondary sources" in low and "table" in low:
            m, r = parse_table(lines, i, COUNTRIES)
            if r: out["secondary"][rep] = r
        elif "based on direct communication" in low and "table" in low:
            m, r = parse_table(lines, i, COUNTRIES)
            if r: out["direct"][rep] = r
        elif "world rig count" in low and re.search(r'\b20\d\d\b', ln):
            m, r = parse_table(lines, i-1, COUNTRIES + ["OPEC rig count"])
            if r: out["rigs"][rep] = r

out["reports"] = sorted(set(out["reports"]))
print(json.dumps({k: (len(v) if isinstance(v,dict) else v) for k,v in out.items()}, indent=1))
pathlib.Path(sys.argv[2] if len(sys.argv)>2 else "momr_data.json").write_text(json.dumps(out, indent=1))

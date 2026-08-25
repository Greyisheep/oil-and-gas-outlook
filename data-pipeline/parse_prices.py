#!/usr/bin/env python3
import re, json, subprocess, pathlib, sys
SRC = pathlib.Path(sys.argv[1])
MON = {m:i+1 for i,m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())}
MN  = {"january":1,"february":2,"march":3,"april":4,"may":5,"june":6,"july":7,
       "august":8,"september":9,"october":10,"november":11,"december":12}
COL = re.compile(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{2})\b')
NUM = re.compile(r'-?\d+\.\d+')
WANT = ["ORB","Bonny Light","North Sea Dated","Dubai","WTI","Urals","Arab Light","Es Sider","Sahara Blend"]
out = {}
for pdf in sorted(SRC.glob("momr-*.pdf")):
    mname, yr = pdf.stem.replace("momr-","").rsplit("-",1)
    rep = f"{yr}-{MN[mname]:02d}"
    lines = subprocess.run(["pdftotext","-layout",str(pdf),"-"],
                           capture_output=True,text=True).stdout.split("\n")
    for i,ln in enumerate(lines):
        if "OPEC Reference Basket and selected crudes" in ln:
            hdr=None
            for j in range(i,i+6):
                c=COL.findall(lines[j])
                if len(c)>=2: hdr=[f"20{y}-{MON[m.lower()]:02d}" for m,y in c[:2]]; break
            if not hdr: break
            for j in range(i,i+40):
                for w in WANT:
                    if re.match(r'\s*'+re.escape(w)+r'\s{2,}', lines[j]):
                        v=NUM.findall(lines[j])
                        if len(v)>=2:
                            for k,mo in enumerate(hdr):
                                out.setdefault(w,{})[mo]=float(v[k])
            break
# derive Bonny differential vs North Sea Dated
bl, nsd = out.get("Bonny Light",{}), out.get("North Sea Dated",{})
out["Bonny diff vs Dated"] = {m: round(bl[m]-nsd[m],2) for m in sorted(set(bl)&set(nsd))}
pathlib.Path(sys.argv[2]).write_text(json.dumps(out,indent=1))
for k in ["ORB","Bonny Light","North Sea Dated","Bonny diff vs Dated"]:
    s=out.get(k,{}); ms=sorted(m for m in s if m>="2024-06")
    print(f"{k:22s} n={len(ms):2d}  " + " ".join(f"{m[2:]}:{s[m]}" for m in ms[-14:]))

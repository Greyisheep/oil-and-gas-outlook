// Auto-generated. Two small models, both fitted on data extracted here.
//
// REVISION_MODEL: how OPEC's first published Nigerian production figure
// relates to the value it eventually settles at. Fitted only on months that
// have had all three of their looks, since OPEC never revisits after that.
// The finding is that the first print is unbiased, mean revision +0.00 tb/d
// with t=0.0, and unpredictable: neither the print level
// (r=-0.169) nor the previous month's revision (r=-0.203) explains it, both
// far short of the 0.497 needed for significance at n=16. So the print cannot be
// corrected, only bracketed, which is what the empirical interval does.
//
// THEFT: a smooth exponential was fitted and rejected. It returns R2 0.85 on
// logs but its residuals are patterned, over-predicting 2023 by about 12,000
// bpd, because the series is not a decay: it is a step change across 2022-23
// followed by a floor near 10,000 bpd. Reporting the fit would have been
// tidier and wrong.
export const REVISION_MODEL = {"n":16,"mean":0.0,"sd":27.47,"se":6.87,"t":0.0,"ciLo":-14.6,"ciHi":14.6,"rLevel":-0.169,"rSerial":-0.203,"rCrit":0.497,"q10":-31.5,"q50":-7.0,"q90":34.5,"band":66.0,"provisional":[{"month":"Jun 26","looks":2,"current":1583.0,"lo":1551.5,"hi":1617.5},{"month":"Jul 26","looks":1,"current":1546.0,"lo":1514.5,"hi":1580.5}],"hist":[-40.0,-32.0,-31.0,-23.0,-20.0,-14.0,-10.0,-10.0,-4.0,5.0,10.0,18.0,31.0,34.0,35.0,51.0]} as const;
export const THEFT_MODEL = {"series":[{"year":"2021","bpd":102900},{"year":"2022","bpd":57200},{"year":"2023","bpd":11900},{"year":"2024","bpd":11300},{"year":"2025","bpd":9600}],"yoy":[{"span":"2021-22","pct":-44.4},{"span":"2022-23","pct":-79.2},{"span":"2023-24","pct":-5.0},{"span":"2024-25","pct":-15.0}],"collapsePct":-88.4,"plateauPerYearPct":-10.2,"recovered":93300,"remaining":9600,"gap":335000,"recoveredShareOfGap":27.9,"remainingShareOfGap":2.9,"irreducible":325400} as const;

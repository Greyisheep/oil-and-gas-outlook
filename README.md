# Barrel Ledger

An interactive console for Nigerian oil and gas indicators, rebuilt from primary sources.

Most sector dashboards retype numbers out of a summary deck. This one parses them out of
**22 OPEC Monthly Oil Market Report PDFs** (September 2024 to August 2026) and keeps the
publication vintage of every figure, so revisions are preserved rather than overwritten.

**Live:** https://barrel-ledger-130785602363.europe-west1.run.app · **Data to:** July 2026

---

## What it shows

| # | Panel | Why it's here |
|---|---|---|
| 01 | Two official numbers for the same barrels | Nigeria's own submission to OPEC runs consistently *below* the independent secondary-source estimate: 1,505 vs 1,546 tb/d in July 2026. Direct communication sits just under the 1,500 tb/d quota; secondary sources put Nigeria over it. |
| 02 | Nigeria's share of OPEC crude | Gulf output collapsed through 2026 as the Strait of Hormuz closed. Nigeria held and grew, lifting its share from 5.2% to 6.5%. Nigeria did not produce dramatically more, it produced while others could not. |
| 03 | Who kept their barrels | Saudi Arabia, Iraq and Kuwait indexed against Nigeria on a common base. |
| 04-06 | Scenario levers + company outlook | Move Brent, differential, FX and national output; get a twelve-month forward projection for **your own** position: net entitlement, netback, tax, cumulative cash, in USD and NGN. |
| 07, 10 | Bonny Light and its differential | Realised monthly prices against North Sea Dated. |
| 08-09 | Rigs lead barrels | Rig count cross-correlated against production at each lag, to estimate the drilling-to-barrels transmission time. |
| 11 | The reporting gap | Secondary-source estimate minus Nigeria's own submission, month by month. |

## Method and honesty notes

- **Crude only.** Condensate is excluded throughout, which is what makes quota comparisons valid. Nigeria's headline 1.6 to 1.7 mb/d figures are crude *plus* condensate; the 1.5 mb/d OPEC quota is crude alone. Mixing them makes Nigeria look alternately compliant and in breach.
- **Vintages preserved.** Each report is keyed by publication month, so a data month seen in three reports keeps all three values. OPEC revises Nigeria by up to 51 tb/d after the fact.
- **The rig lag is predictive, not causal.** Rigs respond to price too.
- **The fiscal model is illustrative.** Tax applies to revenue net of royalty, opex and capex. Nigeria's actual PIA terms (PPT/HCT/CIT split, capital allowances, PSC cost recovery) are materially more complex.
- **Where two official figures disagree, both are shown** rather than averaged.

## Stack

Next.js 16 (App Router, standalone output) · TypeScript · Tailwind 4 · shadcn/ui · Recharts · Docker · Cloud Run

Chart colours are a CVD-safe categorical set validated in **both** light and dark modes
(gold `#eda100`, green `#1baf7a`, red `#e34948`). The green↔red pair sits in the
colour-vision-deficiency warning band, so every chart also ships an always-on legend,
direct labels and a table view, so identity is never carried by colour alone.

## Data pipeline

```bash
cd data-pipeline
python3 parse_momr.py /path/to/momr-pdfs momr_data.json   # production + rig tables
python3 parse_prices.py /path/to/momr-pdfs prices.json    # OPEC basket + crude prices
```

Requires `pdftotext` (poppler). Regenerate `src/lib/opec-data.ts` from the JSON output.

## Develop

```bash
npm install
npm run dev
```

## Container

```bash
docker build -t barrel-ledger .
docker run -p 8080:8080 barrel-ledger
```

## Deploy to Cloud Run

```bash
gcloud run deploy barrel-ledger --source . --region europe-west1 --allow-unauthenticated
```

CI (`.github/workflows/deploy.yml`) typechecks, lints and builds on every push to `main`,
then deploys if two repository secrets are present. It skips the deploy step cleanly if
they are not:

- `GCP_SA_KEY`: service account JSON with Cloud Build and Cloud Run permissions
- `GCP_PROJECT_ID`: target project id

## Sources

OPEC Monthly Oil Market Report (22 editions). Benchmarks: 2026 federal budget
(1,840 tb/d at $64.85/b) and the 2026-28 MTEF target (2,060 tb/d). FX from CBN/NAFEM.

## Licence

MIT

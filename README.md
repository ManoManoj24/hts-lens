# HTS Lens

A zero-budget, deterministic US HTS research MVP built from the official USITC 2026 HTS Revision 18 CSV.

## What works

- 29,860 versioned HTS tariff lines with source provenance
- MiniSearch keyword, prefix, and typo-tolerant candidate retrieval
- Published general, special, and Column 2 duty text exactly as released
- Guided product-fact questions, official source links, and disclaimer
- Reproducible JSON and Markdown export
- Frozen benchmark harness for top-1 and top-3 heading accuracy

No AI, database, private data, or paid service is required. Optional Upstash caching can be added later without changing the stateless baseline.

## Run

```bash
npm install
npm run dev
npm run benchmark
```

## Refresh official data

Replace `data/hts_2026_rev18.csv` with a new official full release, update the manifest below, then run `npm run ingest`, `npm run benchmark`, and `npm run build`.

## Provenance

- Revision: 2026 HTS Revision 18
- Release page: https://www.usitc.gov/2026_hts_revision_18
- Official CSV: https://www.usitc.gov/sites/default/files/tata/hts/hts_2026_revision_18_csv.csv
- Published: September 2, 2026

## Boundary

Research estimate only. This is not legal advice or a binding CBP ruling. Classification depends on complete product facts. Chapter 99, trade remedies, and AD/CVD require separate review.

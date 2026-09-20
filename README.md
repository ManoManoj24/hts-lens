# HTS Lens

A zero-budget, deterministic US HTS research MVP built from the official USITC 2026 HTS Revision 19 CSV.

## What works

- 29,860 versioned HTS tariff lines with source provenance
- MiniSearch keyword, prefix, and typo-tolerant candidate retrieval
- Published general, special, and Column 2 duty text exactly as released (blank cells stay blank / "Not listed", never invented as Free)
- Guided product-fact questions, official source links, and disclaimer
- Reproducible JSON and Markdown export
- Frozen benchmark harness for top-1 and top-3 heading accuracy, now scored with the production ranking path

No AI, database, private data, or paid service is required. Optional Jev AI Assist only reorders the retrieved shortlist. Optional Upstash caching can replace the in-memory assist cache later without changing that unpaid baseline.

## Run

```bash
npm install
npm run dev
npm test
npm run benchmark
```

## Refresh official data

Replace `data/hts_2026_rev19.csv` with a new official full release, update `data/manifest.json` if needed, then run `npm run ingest`, `npm run benchmark`, and `npm run build`.

The previous Revision 18 extract is archived at `data/archive/hts_2026_rev18.csv` and is not used by ingest.

## Provenance

- Revision: 2026 HTS Revision 19
- Release page: https://www.usitc.gov/2026_hts_revision_19
- Official CSV: https://www.usitc.gov/sites/default/files/tata/hts/hts_2026_revision_19_csv.csv
- Published: September 15, 2026

## Boundary

Research estimate only. This is not legal advice or a binding CBP ruling. Classification depends on complete product facts. Chapter 99, trade remedies, and AD/CVD require separate review. AI Assist never creates an HTS code.

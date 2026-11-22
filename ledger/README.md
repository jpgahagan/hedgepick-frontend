# HedgePick pick ledger

A public, hash-chained record of every stock pick the [HedgePick](https://hedgepick.com) screener publishes, so anyone can confirm that no pick was added, removed or changed after the fact.

Results for these picks, scored against the S&P 500, are at [hedgepick.com/proof](https://hedgepick.com/proof).

## How it works

- After each US market close, a GitHub Action fetches that day's published picks from `https://hedgepick.com/api/track-record/ledger?date=YYYY-MM-DD` and saves them unchanged in `ledger/days/`.
- `ledger.csv` records each file's SHA-256 and a chain hash: `sha256(previous chain hash + this file's hash)`. Editing or inserting any past day changes every later chain hash.
- The commit time comes from GitHub, and each update is also submitted to the [Internet Archive](https://web.archive.org/), which gives a second, independent timestamp.

## Verify it yourself

```
git clone https://github.com/jpgahagan/hedgepick-frontend && cd hedgepick-frontend/ledger && python3 verify.py
```

You can also compare any `ledger/days/` file with the live API, or with the debates published at `hedgepick.com/analysis/TICKER/DATE`.

## Coverage

Independent timestamps start on **November 23, 2026**. Days before that were backfilled from HedgePick's database on that date and are marked `no (backfilled)` in `ledger.csv`. They match the picks published on hedgepick.com at the time, but this repository cannot prove when they were made.

## Fields

`rank`, `ticker`, `name`, `price_at_pick`, `score`, `sector`, `published_at_utc` (when the screener published the pick), `ai_verdict` (the AI panel's BUY / HOLD / SELL call for top-5 picks, if any).

Not investment advice.

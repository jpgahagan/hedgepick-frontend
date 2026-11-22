"""Recompute every hash in ledger.csv from the files in days/. Prints OK or the first broken day."""
import csv, hashlib
chain = "0" * 64
for r in csv.DictReader(open("ledger.csv")):
    fh = hashlib.sha256(open(f"days/{r['date']}.json", "rb").read()).hexdigest()
    chain = hashlib.sha256((chain + fh).encode()).hexdigest()
    if fh != r["file_sha256"] or chain != r["chain_sha256"]:
        raise SystemExit(f"BROKEN at {r['date']}")
print("OK: every file and chain hash matches")

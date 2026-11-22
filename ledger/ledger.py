"""Appends each published HedgePick screener day to a hash-chained public ledger.

For every day the HedgePick API serves that is not yet in days/, this writes the
canonical JSON of that day's picks, its SHA-256, and a chain hash
sha256(previous_chain + file_sha256) to ledger.csv. Changing or inserting any
past day changes every later chain hash, and git history plus the Internet
Archive record when each entry first appeared."""
import csv, hashlib, json, os, sys, time, urllib.request
from datetime import datetime, timezone

API = "https://hedgepick.com/api/track-record/ledger"
FIRST_LIVE = "2026-11-23"   # entries recorded before this date were backfilled from the database


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "hedgepick-ledger"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


rows = []
if os.path.exists("ledger.csv"):
    with open("ledger.csv") as f:
        rows = list(csv.DictReader(f))
have = {r["date"] for r in rows}
chain = rows[-1]["chain_sha256"] if rows else "0" * 64
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
live = now[:10] >= FIRST_LIVE
new = []
for day in get(API)["dates"]:
    if day in have:
        continue
    data = get(f"{API}?date={day}")
    body = json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    with open(f"days/{day}.json", "w") as f:
        f.write(body)
    fh = hashlib.sha256(body.encode()).hexdigest()
    chain = hashlib.sha256((chain + fh).encode()).hexdigest()
    rows.append({"date": day, "picks": len(data["picks"]), "file_sha256": fh, "chain_sha256": chain,
                 "recorded_utc": now, "independently_timestamped": "yes" if live else "no (backfilled)"})
    new.append(day)
    time.sleep(0.3)

with open("ledger.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["date", "picks", "file_sha256", "chain_sha256", "recorded_utc", "independently_timestamped"])
    w.writeheader()
    w.writerows(rows)
print(f"Added {len(new)} day(s): {', '.join(new) or 'none'}")
with open(os.environ.get("GITHUB_OUTPUT", "/dev/null"), "a") as f:
    f.write(f"added={len(new)}\n")

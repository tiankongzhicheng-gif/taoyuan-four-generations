"""Edit keyword counts in a spreadsheet instead of JSON.

1. Export the current counts to a CSV that opens in Excel:
       python analysis/apply_counts.py export
   This writes keyword_counts.csv in the site folder.

2. Open keyword_counts.csv in Excel, change the 挖掘次数 column, save as CSV (UTF-8).

3. Apply it and rebuild the page data:
       python analysis/apply_counts.py apply --label "Describe your corpus" --chars g2=12000 g3=9000 g4=8000
   --label and --chars are optional but should describe where the counts came from;
   they are shown on the page under the chart.

4. Publish:
       git add data keyword_counts.csv
       git commit -m "Update keyword counts"
       git push
"""
import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MINED = ROOT / "data" / "mined.json"
CSV = ROOT / "keyword_counts.csv"
ZH_GEN = {"g2": "第二代", "g3": "第三代", "g4": "第四代"}
GEN_ZH = {v: k for k, v in ZH_GEN.items()}
HEADER = ["代际", "分析维度", "关键词", "挖掘次数"]


def export(data):
    with open(CSV, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        for gid in data["generations"]:
            for d in data["dimensions"]:
                for r in d["codes"][gid]:
                    w.writerow([ZH_GEN[gid], d["zh"], r["term"], r["count"]])
    print(f"Wrote {CSV}. Open it in Excel, change the 挖掘次数 column, save, then run: python analysis/apply_counts.py apply")


def apply(data, label, chars):
    if not CSV.exists():
        sys.exit("keyword_counts.csv not found. Run: python analysis/apply_counts.py export")
    dims = {d["zh"]: d for d in data["dimensions"]}
    changed = 0
    missing = []
    with open(CSV, newline="", encoding="utf-8-sig") as f:
        for i, row in enumerate(csv.DictReader(f), start=2):
            gid = GEN_ZH.get((row.get("代际") or "").strip())
            dim = dims.get((row.get("分析维度") or "").strip())
            term = (row.get("关键词") or "").strip()
            raw = (row.get("挖掘次数") or "").strip()
            if not (gid and dim and term):
                missing.append(f"row {i}: {row}")
                continue
            try:
                count = int(float(raw))
            except ValueError:
                sys.exit(f"Row {i}: 挖掘次数 must be a number, got {raw!r}")
            hit = next((r for r in dim["codes"][gid] if r["term"] == term), None)
            if hit is None:
                missing.append(f"row {i}: {ZH_GEN[gid]} / {dim['zh']} / {term} is not in the codebook")
                continue
            if hit["count"] != count:
                changed += 1
            hit["count"] = count

    for spec in chars or []:
        gid, _, value = spec.partition("=")
        if gid in data["generations"] and value.isdigit():
            data["generations"][gid]["characters"] = int(value)
            data["generations"][gid]["tokens"] = None
    if label:
        data["corpus_label"] = label
    for d in data["dimensions"]:
        for gid, rows in d["codes"].items():
            size = max(data["generations"][gid].get("tokens") or data["generations"][gid]["characters"], 1)
            for r in rows:
                r["per10k"] = round(r["count"] / size * 10000, 1)

    MINED.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    for m in missing:
        print("Skipped", m)
    print(f"Updated {changed} counts in {MINED}.")
    subprocess.run([sys.executable, str(ROOT / "analysis" / "build.py")], check=True)
    print("Done. Now publish with: git add data keyword_counts.csv && git commit -m \"Update keyword counts\" && git push")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("action", choices=["export", "apply"])
    ap.add_argument("--label", help="what the counts were mined from, shown on the page")
    ap.add_argument("--chars", nargs="*", help="corpus size per generation, e.g. g2=12000 g3=9000 g4=8000")
    args = ap.parse_args()
    data = json.loads(MINED.read_text(encoding="utf-8"))
    export(data) if args.action == "export" else apply(data, args.label, args.chars)


if __name__ == "__main__":
    main()

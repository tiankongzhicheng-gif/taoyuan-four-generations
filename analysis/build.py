"""Build the site's data files from data/family.json.

Outputs (all in data/):
  persons.csv, places.csv, residences.csv, moves.csv, events.csv, relations.csv
  places.geojson, moves.geojson
  keyness.json   log-likelihood keyness per generation
  family.js      everything above as globals for the page

Run:  python analysis/build.py
"""
import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
LL_CRITICAL = 3.84  # p < 0.05, one degree of freedom


def write_csv(name, rows, fields):
    with open(DATA / name, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: (";".join(v) if isinstance(v, list) else v) for k, v in r.items()})


def log_likelihood(a, b, c, d):
    """Dunning log-likelihood for a term seen a times in c target tokens and b times in d reference tokens."""
    e1 = c * (a + b) / (c + d)
    e2 = d * (a + b) / (c + d)
    ll = 0.0
    if a:
        ll += a * math.log(a / e1)
    if b:
        ll += b * math.log(b / e2)
    return 2 * ll


def keyness(block, top=8):
    corpora = block["corpora"]
    result = {"notice": block["notice"], "critical": LL_CRITICAL, "generations": [], "shared": []}
    for gid, meta in corpora.items():
        c = meta["tokens"]
        d = sum(m["tokens"] for k, m in corpora.items() if k != gid)
        rows = []
        for t in block["terms"]:
            a = t["counts"][gid]
            b = sum(v for k, v in t["counts"].items() if k != gid)
            ll = log_likelihood(a, b, c, d)
            over = (a / c) > (b / d)
            rows.append({
                "zh": t["zh"], "py": t["py"], "en": t["en"], "count": a,
                "per10k": round(a / c * 10000, 1), "ref_per10k": round(b / d * 10000, 1),
                "ll": round(ll if over else -ll, 1),
            })
        rows = [r for r in rows if r["ll"] >= LL_CRITICAL]
        rows.sort(key=lambda r: r["ll"], reverse=True)
        result["generations"].append({"id": gid, **meta, "terms": rows[:top]})

    # terms no generation uses significantly more than the others
    for t in block["terms"]:
        best = 0.0
        for gid, meta in corpora.items():
            c = meta["tokens"]
            d = sum(m["tokens"] for k, m in corpora.items() if k != gid)
            a = t["counts"][gid]
            b = sum(v for k, v in t["counts"].items() if k != gid)
            if (a / c) > (b / d):
                best = max(best, log_likelihood(a, b, c, d))
        if best < 15 and sum(t["counts"].values()) >= 60:
            per10k = {gid: round(t["counts"][gid] / m["tokens"] * 10000, 1) for gid, m in corpora.items()}
            result["shared"].append({"zh": t["zh"], "py": t["py"], "en": t["en"], "max_ll": round(best, 1), "per10k": per10k})
    return result


def main():
    fam = json.loads((DATA / "family.json").read_text(encoding="utf-8"))
    places = {p["id"]: p for p in fam["places"]}

    write_csv("persons.csv", fam["persons"], ["id", "name", "zh", "generation", "born", "born_approx", "sex", "role", "education", "occupation", "note"])
    write_csv("places.csv", fam["places"], ["id", "name", "zh", "lat", "lng", "type", "approx"])
    write_csv("residences.csv", fam["residences"], ["person", "place", "from", "to", "approx", "note"])
    write_csv("moves.csv", fam["moves"], ["id", "person", "with", "from", "to", "year", "approx", "trigger", "label", "text"])
    write_csv("events.csv", fam["events"], ["id", "from", "to", "scope", "lens", "label", "text", "persons", "approx"])
    write_csv("relations.csv", fam["relations"], ["source", "target", "type"])

    (DATA / "places.geojson").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [p["lng"], p["lat"]]},
            "properties": {k: p[k] for k in ("id", "name", "zh", "type", "approx")},
        } for p in fam["places"]],
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    (DATA / "moves.geojson").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": [
                [places[m["from"]]["lng"], places[m["from"]]["lat"]],
                [places[m["to"]]["lng"], places[m["to"]]["lat"]],
            ]},
            "properties": {k: m.get(k) for k in ("id", "person", "year", "approx", "trigger", "label")},
        } for m in fam["moves"]],
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    key = keyness(fam["keywords_simulated"])
    (DATA / "keyness.json").write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding="utf-8")

    js = "window.FAMILY = " + json.dumps(fam, ensure_ascii=False) + ";\nwindow.KEYNESS = " + json.dumps(key, ensure_ascii=False) + ";\n"
    (DATA / "family.js").write_text(js, encoding="utf-8")

    for g in key["generations"]:
        print(g["label"], " ".join(f'{t["zh"]}({t["ll"]})' for t in g["terms"]))
    print("shared:", " ".join(f'{t["zh"]}({t["max_ll"]})' for t in key["shared"]))


if __name__ == "__main__":
    main()

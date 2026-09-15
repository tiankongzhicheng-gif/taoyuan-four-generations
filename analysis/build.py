"""Build the site's data files from data/family.json.

Outputs (all in data/):
  persons.csv, places.csv, residences.csv, moves.csv, events.csv, relations.csv
  places.geojson, moves.geojson
  family.js      family data plus data/mined.json (from analysis/mine.py) as globals for the page

Run:  python analysis/build.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def write_csv(name, rows, fields):
    with open(DATA / name, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: (";".join(v) if isinstance(v, list) else v) for k, v in r.items()})


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

    mined_path = DATA / "mined.json"
    mined = json.loads(mined_path.read_text(encoding="utf-8")) if mined_path.exists() else None
    if mined:
        codebook = json.loads((ROOT / "analysis" / "codebook.json").read_text(encoding="utf-8"))
        mined["themes"] = codebook.get("themes", [])
        mined["themes_note"] = codebook.get("themes_note", "")
    stale = DATA / "keyness.json"
    if stale.exists():
        stale.unlink()

    js = "window.FAMILY = " + json.dumps(fam, ensure_ascii=False) + ";\nwindow.MINED = " + json.dumps(mined, ensure_ascii=False) + ";\n"
    (DATA / "family.js").write_text(js, encoding="utf-8")
    print("family.js written;", "mined.json included" if mined else "no mined.json yet (run analysis/mine.py)")


if __name__ == "__main__":
    main()

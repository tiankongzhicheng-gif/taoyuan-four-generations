# Four Generations from Taoyuan

A static oral-history site about one family from Taoyuan County, Hunan, 1910 to today. Plain HTML, CSS, and JavaScript; no build step for the page.

- `data/family.json` is the single source for people, places, residences, moves, events, relationships, national statistics, and the keyword counts.
- `python analysis/build.py` regenerates the CSV and GeoJSON exports, the log-likelihood keyness results (`data/keyness.json`), and `data/family.js`, which the page loads.
- The keyword counts are simulated until interview transcripts exist; the page says so.

Family names are pseudonyms. Photographs are public-domain or openly licensed period images from Wikimedia Commons (see `images/credits.json`) and do not show the family.

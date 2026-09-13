"""Keyword mining for the Words section. Runs locally; no text leaves this computer.

Put each generation's transcripts in its own folder (any number of .txt files, UTF-8):

    my_corpus/
      g2/  interview-grandfather.txt ...
      g3/  interview-mother.txt ...
      g4/  my-notes.txt ...

(A single file per generation, my_corpus/g2.txt, also works.)

Then run:

    pip install jieba
    python analysis/mine.py my_corpus --label "Interview transcripts"
    python analysis/build.py

The output, data/mined.json, contains only counts and corpus sizes, never text.
It also prints the results as a Markdown table so they can be checked by eye.

Method: jieba segmentation (precise mode) with every codebook term added to the
dictionary so that terms are kept whole, then exact token matching. A term is
counted once per occurrence; terms that appear in several dimensions are counted
in each.
"""
import argparse
import collections
import datetime
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STOP = set(
    "进入 处于 时期 开始 成为 出生 接受 经历 享受 完成 选择 带来 属于 继续 进行 没有 已经 逐渐 分别 "
    "当时 当地 这代 一代 年代 他们 我们 你们 自己 其他 这份 一家人 状态 时候 觉得 就是 然后 还是 什么 "
    "这个 那个 因为 所以 但是 可以 知道 现在 那时候 一个 一些 这样 怎么 这些 那些 问题".split()
)


def read_generation(corpus: Path, gid: str) -> str:
    folder = corpus / gid
    files = sorted(folder.glob("*.txt")) if folder.is_dir() else [corpus / f"{gid}.txt"]
    parts = []
    for f in files:
        if f.exists():
            lines = f.read_text(encoding="utf-8").splitlines()
            parts.append("\n".join(l for l in lines if l.strip() and not l.lstrip().startswith("#")))
    return "\n".join(parts)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("corpus", type=Path, help="folder with g2, g3, g4 transcripts")
    ap.add_argument("--label", default="Family accounts", help="what the corpus is, shown on the page")
    ap.add_argument("--out", type=Path, default=ROOT / "data" / "mined.json")
    args = ap.parse_args()

    import jieba
    import jieba.posseg as pseg
    jieba.setLogLevel(60)

    codebook = json.loads((ROOT / "analysis" / "codebook.json").read_text(encoding="utf-8"))
    for dim in codebook["dimensions"]:
        for codes in dim["codes"].values():
            for term, _ in codes:
                for v in term.split("/"):
                    jieba.add_word(v, freq=200000)

    result = {
        "corpus_label": args.label,
        "generated": datetime.date.today().isoformat(),
        "method": "jieba segmentation with codebook terms added to the dictionary; exact token matching",
        "note": codebook["note"],
        "generations": {},
        "dimensions": [],
    }
    tokens_by_gen = {}
    for gid, meta in codebook["generations"].items():
        text = read_generation(args.corpus, gid)
        tokens = [t for t in jieba.lcut(text) if t.strip() and not re.fullmatch(r"[\W_]+", t)]
        tokens_by_gen[gid] = collections.Counter(tokens)
        content = collections.Counter(
            w for w, flag in pseg.cut(text)
            if len(w) >= 2 and flag[:1] in ("n", "v") and not re.search(r"\d", w) and w not in STOP
        )
        result["generations"][gid] = {
            **meta,
            "characters": len(re.sub(r"\s", "", text)),
            "tokens": len(tokens),
            "top_words": content.most_common(12),
        }

    for dim in codebook["dimensions"]:
        d = {k: dim[k] for k in ("id", "label", "zh", "question")}
        d["codes"] = {}
        for gid, codes in dim["codes"].items():
            total = max(result["generations"][gid]["tokens"], 1)
            rows = []
            for term, en in codes:
                n = sum(tokens_by_gen[gid][v] for v in term.split("/"))
                rows.append({"term": term, "en": en, "count": n, "per10k": round(n / total * 10000, 1)})
            d["codes"][gid] = rows
        result["dimensions"].append(d)

    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")

    names = {"g2": "第二代", "g3": "第三代", "g4": "第四代"}
    print(f"| 代际 | 分析维度 | 关键词 | 挖掘次数 |\n|---|---|---|---:|")
    for gid in codebook["generations"]:
        for d in result["dimensions"]:
            for i, r in enumerate(d["codes"][gid]):
                print(f"| {names[gid] if i == 0 else ''} | {d['zh'] if i == 0 else ''} | {r['term']} | {r['count']} |")
    for gid, g in result["generations"].items():
        print(f"{gid}: {g['characters']} characters, {g['tokens']} tokens")
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()

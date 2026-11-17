"""배정 대상 제목을 골라 묶음 파일을 만든다.

- 같은 부서·같은 문서구분에서 숫자만 다른 제목은 (부서명, 문서구분, 제목키)로 묶어 한 번만 판단한다.
  생산 문서와 접수 문서는 같은 제목이라도 배정이 달라질 수 있어 따로 묶는다.
- 묶음은 부서별로 나누고, 부서에 대응하는 분류기준표 항목 전체와 부서공통 항목을 함께 넣는다.
- 다른 부서 소관일 가능성에 대비해 제목과 글자 구성이 비슷한 타 부서 기록물철을 '추가후보'로 붙인다.

산출물: _workspace/{run}/batches/batch_NNNN.json, _workspace/{run}/manifest.json
"""
import argparse
import collections
import hashlib
import json
import math
import re
import sqlite3
import sys

from common import DATA, OUT, WORK, dump_json, load_json

TAIL = re.compile(r"\s*(관련 )?자료를 관리하(는|기 위한) 기록물철\.?$")


def grams(text):
    t = re.sub(r"[\s\d\W_]+", "", text)
    return [t[i:i + 2] for i in range(len(t) - 1)]


class Lexical:
    """글자 2개 단위 TF-IDF로 기록물철을 찾는다."""

    def __init__(self, files):
        self.files = files
        self.docs = [collections.Counter(grams(" ".join([f["소기능"], f["단위업무명"], f["기록물철명"] * 2, f["설명"]]))) for f in files]
        df = collections.Counter(g for d in self.docs for g in d)
        n = len(files)
        self.idf = {g: math.log(1 + n / c) for g, c in df.items()}
        self.norm = [math.sqrt(sum((1 + math.log(v)) ** 2 * self.idf[g] ** 2 for g, v in d.items())) or 1 for d in self.docs]
        self.inv = collections.defaultdict(list)
        for i, d in enumerate(self.docs):
            for g, v in d.items():
                self.inv[g].append((i, (1 + math.log(v)) * self.idf[g]))

    def search(self, title, exclude, k):
        q = collections.Counter(grams(title))
        score = collections.defaultdict(float)
        for g, v in q.items():
            w = self.idf.get(g)
            if not w:
                continue
            for i, dw in self.inv[g]:
                score[i] += v * w * dw
        ranked = sorted(((s / self.norm[i], i) for i, s in score.items() if self.files[i]["file_id"] not in exclude), reverse=True)
        return [self.files[i] for s, i in ranked[:k] if s > 0.6]


def catalog_for(cls, mapping):
    d1 = set(mapping.get("부서1", []))
    d2 = set(mapping.get("부서2", []))
    files = [f for f in cls["files"] if f["부서1"] in d1 and (not d2 or f["부서2"] in d2)]
    by_unit = collections.OrderedDict()
    for f in files:
        by_unit.setdefault(f["unit_id"], []).append(f)
    units = []
    for uid, fs in by_unit.items():
        u = {"unit_id": uid, "부서": f"{fs[0]['부서1']} {fs[0]['부서2']}".strip(), "소기능": fs[0]["소기능"], "단위업무명": fs[0]["단위업무명"], "기록물철": []}
        for f in fs:
            if f["철배정가능"]:
                u["기록물철"].append({"file_id": f["file_id"], "기록물철명": f["기록물철명"], "설명": TAIL.sub("", f["설명"])})
            else:
                u.setdefault("참고", []).append(TAIL.sub("", f["설명"]))
        units.append(u)
    return units, {f["file_id"] for f in files}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True, help="실행 이름. _workspace/{run}에 저장")
    ap.add_argument("--dept", action="append", help="부서명(문서목록 기준). 여러 번 지정 가능. 생략하면 전체")
    ap.add_argument("--year", action="append", help="연도. 여러 번 지정 가능")
    ap.add_argument("--kind", choices=["생산", "접수"])
    ap.add_argument("--contains", help="제목에 들어 있는 문자열")
    ap.add_argument("--limit", type=int, default=200, help="판단할 고유 제목 수 상한(기본 200)")
    ap.add_argument("--order", choices=["freq", "sample"], default="freq", help="freq: 건수 많은 제목부터, sample: 고정 표본")
    ap.add_argument("--batch-size", type=int, default=40)
    ap.add_argument("--redo", action="store_true", help="이미 확정된 제목도 다시 판단")
    a = ap.parse_args()

    run_dir = WORK / a.run
    if (run_dir / "manifest.json").exists():
        sys.exit(f"{run_dir}가 이미 있다. 다른 --run 이름을 쓰거나 기존 폴더를 옮긴다.")
    cls = load_json(DATA / "classification.json")
    dept_map = load_json(DATA / "dept_map.json")
    ledger = load_json(OUT / "ledger.json") if (OUT / "ledger.json").exists() and not a.redo else {}

    where, params = ["제목 <> ''"], []
    for col, vals in (("부서명", a.dept), ("연도", a.year)):
        if vals:
            where.append(f"{col} in ({','.join('?' * len(vals))})")
            params += vals
    if a.kind:
        where.append("문서구분 = ?")
        params.append(a.kind)
    if a.contains:
        where.append("제목 like ?")
        params.append(f"%{a.contains}%")
    con = sqlite3.connect(DATA / "production.sqlite")
    rows = con.execute(f"""select 부서명, 제목키, count(*) n, min(제목), 문서구분, max(수신발신처)
        from docs where {' and '.join(where)} group by 부서명, 문서구분, 제목키""", params).fetchall()
    if not rows:
        sys.exit("조건에 맞는 문서가 없다. 부서명은 문서목록의 표기(예: 김포운영단)를 쓴다.")
    scope_docs = sum(r[2] for r in rows)
    unmapped = sorted({r[0] for r in rows if r[0] not in dept_map})
    skipped = [r for r in rows if f"{r[0]}|{r[4]}|{r[1]}" in ledger]
    rows = [r for r in rows if f"{r[0]}|{r[4]}|{r[1]}" not in ledger]
    if a.order == "freq":
        rows.sort(key=lambda r: (-r[2], r[0], r[1], r[4]))
    else:
        rows.sort(key=lambda r: hashlib.md5(f"{r[0]}|{r[4]}|{r[1]}".encode()).hexdigest())
    picked = rows[:a.limit]

    lex = Lexical([f for f in cls["files"] if f["철배정가능"]])
    commons = [{"common_id": c["common_id"], "소기능": c["소기능"], "기록물철명": c["기록물철명"], "소관업무": c["소관업무"]} for c in cls["commons"]]
    by_dept = collections.defaultdict(list)
    for r in picked:
        by_dept[r[0]].append(r)
    batches, no = [], 0
    for dept in sorted(by_dept):
        mapping = dept_map.get(dept, {"유형": "대상외", "부서1": [], "비고": "dept_map.json에 없는 부서"})
        units, in_catalog = catalog_for(cls, mapping)
        items = by_dept[dept]
        for s in range(0, len(items), a.batch_size):
            no += 1
            bid = f"batch_{no:04d}"
            out_items = []
            for j, r in enumerate(items[s:s + a.batch_size], start=1):
                extra = lex.search(r[3], in_catalog, 5 if in_catalog else 8)
                out_items.append({
                    "key": f"k{j:03d}", "제목": r[3], "문서구분": r[4], "수신발신처_예": r[5], "건수": r[2], "제목키": r[1],
                    "추가후보": [{"file_id": f["file_id"], "unit_id": f["unit_id"], "부서": f"{f['부서1']} {f['부서2']}", "단위업무명": f["단위업무명"], "기록물철명": f["기록물철명"], "설명": TAIL.sub("", f["설명"])} for f in extra],
                })
            dump_json(run_dir / "batches" / f"{bid}.json", {
                "batch_id": bid, "부서명": dept, "부서대응": mapping,
                "부서후보": units, "부서공통후보": commons, "items": out_items,
            })
            batches.append({"batch_id": bid, "부서명": dept, "items": len(out_items)})
    dump_json(run_dir / "manifest.json", {
        "run": a.run, "조건": {"dept": a.dept, "year": a.year, "kind": a.kind, "contains": a.contains, "limit": a.limit, "order": a.order},
        "범위_문서수": scope_docs, "범위_고유제목수": len(rows) + len(skipped), "기확정_제외": len(skipped),
        "이번_판단_고유제목수": len(picked), "이번_판단_문서수": sum(r[2] for r in picked),
        "남은_고유제목수": len(rows) - len(picked), "대응표에_없는_부서": unmapped, "batches": batches,
    })
    print(json.dumps({k: v for k, v in load_json(run_dir / "manifest.json").items() if k != "batches"}, ensure_ascii=False, indent=1))
    print(f"묶음 {len(batches)}개: {run_dir / 'batches'}")


if __name__ == "__main__":
    main()

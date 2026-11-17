"""의심 묶음에서 점검할 제목을 골라 묶음 파일을 만든다. 같은 실행 안에서 여러 번 부르면 이미 묶음에 넣은 제목은 빼고 이어서 만든다.

- 독립 판단용 묶음 파일(batches/)에는 기존 분류를 넣지 않는다. 독립 판단 에이전트가 기존 분류에 끌려가지 않게 하기 위해서다.
- 기존 분류와 의심 신호는 labels/에 따로 둔다. compare.py만 이 파일을 읽는다.

사용: python3 make_batches.py {run} [--limit 200] [--control 0] [--dept 부서명 ...] [--batch-size 40]
산출물: _workspace/{run}/batches/batch_NNNN.json, labels/batch_NNNN.json, manifest.json
"""
import argparse
import collections
import hashlib
import json
import sqlite3
import sys

from common import DATA, TAIL, WORK, Lexical, dump_json, load_json


def catalog_for(cls, mapping):
    d1, d2 = set(mapping.get("부서1", [])), set(mapping.get("부서2", []))
    by_unit = collections.OrderedDict()
    for f in cls["files"]:
        if f["부서1"] in d1 and (not d2 or f["부서2"] in d2):
            by_unit.setdefault(f["unit_id"], []).append(f)
    units, ids = [], set()
    for uid, fs in by_unit.items():
        u = {"unit_id": uid, "부서": f"{fs[0]['부서1']} {fs[0]['부서2']}".strip(), "소기능": fs[0]["소기능"], "단위업무명": fs[0]["단위업무명"], "기록물철": []}
        for f in fs:
            ids.add(f["file_id"])
            if f["철배정가능"]:
                u["기록물철"].append({"file_id": f["file_id"], "기록물철명": f["기록물철명"], "설명": TAIL.sub("", f["설명"])})
            else:
                u.setdefault("참고", []).append(TAIL.sub("", f["설명"]))
        units.append(u)
    return units, ids


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run")
    ap.add_argument("--limit", type=int, default=200, help="이번에 넣을 의심 제목(부서·제목키) 수 상한")
    ap.add_argument("--control", type=int, default=0, help="의심 신호가 없는 제목 가운데 대조 표본으로 넣을 수")
    ap.add_argument("--dept", action="append")
    ap.add_argument("--batch-size", type=int, default=40)
    a = ap.parse_args()
    run_dir = WORK / a.run
    con = sqlite3.connect(run_dir / "records.sqlite")
    if not con.execute("select name from sqlite_master where name='groups'").fetchone():
        sys.exit("groups 표가 없다. screen.py를 먼저 실행한다.")
    man = load_json(run_dir / "manifest.json") if (run_dir / "manifest.json").exists() else {"run": a.run, "batches": [], "keys": []}
    done = set(man["keys"])
    cls, dept_map = load_json(DATA / "classification.json"), load_json(DATA / "dept_map.json")

    groups = collections.defaultdict(list)
    for g in con.execute("select 부서명, 제목키, label_kind, label_unit, label_file, n, 대표제목, signals, score from groups"):
        if a.dept and g[0] not in a.dept:
            continue
        groups[(g[0], g[1])].append(g)
    todo = {k: v for k, v in groups.items() if f"{k[0]}|{k[1]}" not in done}
    flagged = sorted((k for k, v in todo.items() if max(g[8] for g in v) > 0),
                     key=lambda k: (-max(g[8] for g in todo[k]), -sum(g[5] for g in todo[k]), k))
    clean_keys = sorted((k for k, v in todo.items() if max(g[8] for g in v) == 0), key=lambda k: hashlib.md5("|".join(k).encode()).hexdigest())
    picked = [(k, False) for k in flagged[:a.limit]] + [(k, True) for k in clean_keys[:a.control]]
    if not picked:
        sys.exit("새로 넣을 제목이 없다(의심 묶음을 모두 묶음에 넣었거나 조건에 맞는 부서가 없다).")

    lex = Lexical([(f["file_id"], " ".join([f["소기능"], f["단위업무명"], f["기록물철명"] * 2, f["설명"]])) for f in cls["files"] if f["철배정가능"]])
    files = {f["file_id"]: f for f in cls["files"]}
    commons = [{"common_id": c["common_id"], "소기능": c["소기능"], "기록물철명": c["기록물철명"], "소관업무": c["소관업무"]} for c in cls["commons"]]
    by_dept = collections.defaultdict(list)
    for k, control in picked:
        by_dept[k[0]].append((k, control))
    no, rnd, new = len(man["batches"]), max([b["round"] for b in man["batches"]], default=0) + 1, []
    for dept in sorted(by_dept):
        mapping = dept_map.get(dept, {"유형": "대상외", "부서1": [], "비고": "dept_map.json에 없는 부서"})
        units, in_catalog = catalog_for(cls, mapping)
        items = by_dept[dept]
        for s in range(0, len(items), a.batch_size):
            no += 1
            bid = f"batch_{no:04d}"
            out_items, labels = [], {}
            for j, (k, control) in enumerate(items[s:s + a.batch_size], start=1):
                gs = todo[k]
                title = max(gs, key=lambda g: g[5])[6]
                kinds, counterpart = con.execute("select group_concat(distinct 문서구분), max(수신발신처) from records where 부서명=? and 제목키=?", k).fetchone()
                sc = lex.scores(title)
                top = sorted(((v, i) for i, v in sc.items() if i not in in_catalog and v > 0.12), reverse=True)[:5 if in_catalog else 8]
                key = f"k{j:03d}"
                out_items.append({"key": key, "제목": title, "문서구분": kinds or "", "수신발신처_예": counterpart or "", "건수": sum(g[5] for g in gs),
                                  "추가후보": [{"file_id": i, "unit_id": files[i]["unit_id"], "부서": f"{files[i]['부서1']} {files[i]['부서2']}", "단위업무명": files[i]["단위업무명"],
                                            "기록물철명": files[i]["기록물철명"], "설명": TAIL.sub("", files[i]["설명"])} for v, i in top]})
                labels[key] = {"제목키": k[1], "대조표본": control,
                               "labels": [{"no": n, "kind": g[2], "unit": g[3], "file": g[4], "n": g[5], "signals": json.loads(g[7])} for n, g in enumerate(gs, start=1)]}
                man["keys"].append(f"{k[0]}|{k[1]}")
            dump_json(run_dir / "batches" / f"{bid}.json", {"batch_id": bid, "부서명": dept, "부서대응": mapping, "부서후보": units, "부서공통후보": commons, "items": out_items})
            dump_json(run_dir / "labels" / f"{bid}.json", {"batch_id": bid, "부서명": dept, "items": labels})
            new.append({"batch_id": bid, "부서명": dept, "items": len(out_items), "round": rnd})
    man["batches"] += new
    man["남은_의심_제목수"] = len(flagged) - min(a.limit, len(flagged))
    dump_json(run_dir / "manifest.json", man)
    print(json.dumps({"이번_회차": rnd, "새_묶음": [b["batch_id"] for b in new], "의심_제목": min(a.limit, len(flagged)),
                      "대조표본": min(a.control, len(clean_keys)), "남은_의심_제목수": man["남은_의심_제목수"]}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

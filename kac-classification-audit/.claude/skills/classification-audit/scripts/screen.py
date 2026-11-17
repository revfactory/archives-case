"""의심 신호를 계산한다. 전수를 모델에 보내지 않기 위해, 기존 분류가 틀렸을 가능성이 있는 묶음을 스크립트로 먼저 추린다.

판단 단위(묶음): (부서명, 제목키, 기존 분류). 신호
- S1 분류 불일치: 같은 부서·같은 제목키의 문서가 서로 다른 단위업무에 나뉘어 있다.
- S2 낮은 유사도: 제목과 기존 단위업무의 글자 유사도가 낮고, 다른 단위업무와는 --margin 이상 더 높다.
- S3 소관 외: 기존 단위업무가 부서 대응표상 그 부서의 단위업무가 아니다(부서공통 항목은 제외).
- S4 분류명 미대응: 기존 분류명이 분류기준표에 없다.

사용: python3 screen.py {run} [--margin 0.15] [--min-other 0.2]
산출물: records.sqlite의 groups 표, _workspace/{run}/screen_summary.json
"""
import argparse
import collections
import json
import sqlite3

from common import DATA, WORK, dept_units, dump_json, load_json, unit_index

WEIGHT = {"S1": 2.0, "S2": 1.0, "S3": 2.0, "S4": 1.0}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run")
    ap.add_argument("--margin", type=float, default=0.15)
    ap.add_argument("--min-other", type=float, default=0.2)
    a = ap.parse_args()
    run_dir = WORK / a.run
    cls, dept_map = load_json(DATA / "classification.json"), load_json(DATA / "dept_map.json")
    units = {u["unit_id"]: u for u in cls["units"]}
    lex = unit_index(cls)
    con = sqlite3.connect(run_dir / "records.sqlite")
    rows = con.execute("""select 부서명, 제목키, label_kind, label_unit, label_file, count(*), min(제목)
        from records where label_kind <> '없음' group by 부서명, 제목키, label_kind, label_unit, label_file""").fetchall()
    per_key = collections.defaultdict(collections.Counter)
    for dept, key, kind, unit, file, n, title in rows:
        per_key[(dept, key)][unit or "미대응"] += n
    own_cache, out, sig_count, sig_docs = {}, [], collections.Counter(), collections.Counter()
    for dept, key, kind, unit, file, n, title in rows:
        if dept not in own_cache:
            own_cache[dept] = dept_units(cls, dept_map.get(dept, {}))
        sig, score = [], 0.0
        dist = per_key[(dept, key)]
        if len(dist) > 1:
            share = dist[unit or "미대응"] / sum(dist.values())
            sig.append({"신호": "S1", "설명": f"같은 부서·같은 유형의 제목이 단위업무 {len(dist)}개에 나뉘어 있고 이 분류의 비중은 {share:.0%}"})
            score += WEIGHT["S1"] * (1.5 - share)
        if kind == "미대응":
            sig.append({"신호": "S4", "설명": "기존 분류명이 분류기준표에 없음"})
            score += WEIGHT["S4"]
        else:
            sc = lex.scores(title)
            mine = sc.get(unit, 0.0)
            other_id, other = max(((i, s) for i, s in sc.items() if i != unit and (i in own_cache[dept] or i[0] == "C")), key=lambda x: x[1], default=("", 0.0))
            if other >= a.min_other and other - mine >= a.margin:
                name = units[other_id]["단위업무명"] if other_id[0] == "U" else "부서공통 항목"
                sig.append({"신호": "S2", "설명": f"제목과 기존 단위업무의 유사도 {mine:.2f}, 다른 단위업무({name})와는 {other:.2f}"})
                score += WEIGHT["S2"] * (1 + other - mine)
            if kind in ("U", "F") and unit not in own_cache[dept]:
                u = units[unit]
                sig.append({"신호": "S3", "설명": f"기존 단위업무는 {u['부서1']} {u['부서2']} 소관이고 부서 대응표상 {dept}의 단위업무가 아님"})
                score += WEIGHT["S3"]
        for s in sig:
            sig_count[s["신호"]] += 1
            sig_docs[s["신호"]] += n
        out.append((dept, key, kind, unit, file, n, title, json.dumps(sig, ensure_ascii=False), round(score, 3)))
    con.execute("drop table if exists groups")
    con.execute("""create table groups(group_id integer primary key autoincrement, 부서명 text, 제목키 text, label_kind text,
        label_unit text, label_file text, n integer, 대표제목 text, signals text, score real)""")
    con.executemany("insert into groups(부서명,제목키,label_kind,label_unit,label_file,n,대표제목,signals,score) values(?,?,?,?,?,?,?,?,?)", out)
    con.commit()
    flagged = [o for o in out if o[8] > 0]
    summary = {"묶음수": len(out), "문서수": sum(o[5] for o in out),
               "의심_묶음수": len(flagged), "의심_문서수": sum(o[5] for o in flagged),
               "의심_고유제목수(부서·제목키)": len({(o[0], o[1]) for o in flagged}),
               "신호별_묶음수": dict(sig_count), "신호별_문서수": dict(sig_docs),
               "기준": {"margin": a.margin, "min_other": a.min_other}}
    dump_json(run_dir / "screen_summary.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

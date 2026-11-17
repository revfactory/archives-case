"""부서별 생산·접수 문서 제목을 업무 묶음(군집) 자료로 줄인다.

처리 순서
1. (부서명, 제목키)별 건수·연도·문서구분을 집계한다.
2. 여러 부서가 같은 제목으로 접수한 문서(공통 수신 공문)를 따로 모은다.
3. 부서공통 사무로 보이는 제목(data/common_keywords.json)을 분류별 묶음으로 따로 모은다.
4. 나머지 제목을 글자 구성이 비슷한 것끼리 군집으로 묶는다.
5. 부서에 대응하는 분류기준표 단위업무마다 글자 구성이 비슷한 제목의 문서 수를 추정한다.

산출물: _workspace/{run}/{부서명}/ 아래 clusters.json, parts/part_NN.json, existing_units.json, excluded.json
        _workspace/{run}/manifest.json, _workspace/{run}/workflow_args.json
"""
import argparse
import collections
import json
import math
import sqlite3
import sys

from common import DATA, SHARED_DATA, WORK, dump_json, grams, load_json, tfidf, tokens

COMMON_MIN_DEPTS = 8      # 이 수 이상의 부서가 같은 제목키로 접수했으면 공통 수신 공문으로 본다
CENTROID_MEMBERS = 30     # 군집 중심을 갱신하는 구성원 수 상한
UNIT_MATCH_MIN = 0.22     # 제목과 기존 단위업무가 비슷하다고 보는 점수 하한


def common_received_keys(con):
    cache = DATA / "cache_common_received.json"
    if cache.exists():
        return set(load_json(cache))
    rows = con.execute("""select 제목키 from docs where 문서구분='접수' group by 제목키
        having count(distinct 부서명) >= ?""", (COMMON_MIN_DEPTS,)).fetchall()
    keys = sorted(r[0] for r in rows)
    dump_json(cache, keys)
    return set(keys)


def catalog_units(cls, mapping):
    d1, d2 = set(mapping.get("부서1", [])), set(mapping.get("부서2", []))
    files = {f["file_id"]: f for f in cls["files"]}
    units = []
    for u in cls["units"]:
        if u["부서1"] in d1 and (not d2 or u["부서2"] in d2):
            fs = [files[i] for i in u["file_ids"]]
            units.append({
                "unit_id": u["unit_id"], "부서": f"{u['부서1']} {u['부서2']}".strip(), "중기능": u["중기능"], "소기능": u["소기능"],
                "단위업무명": u["단위업무명"], "단위업무명_출처": u["단위업무명_출처"],
                "기록물철": [{"기록물철명": f["기록물철명"], "보존기간": f["보존기간"]} for f in fs],
                "_text": " ".join([u["소기능"], u["단위업무명"], u["단위업무명"]] + [f["기록물철명"] + " " + f["설명"] for f in fs]),
            })
    return units


class UnitMatcher:
    def __init__(self, units):
        self.units = units
        counters = [grams(tokens(u["_text"])) for u in units]
        df = collections.Counter(g for c in counters for g in c)
        self.idf = {g: math.log(1 + len(units) / n) for g, n in df.items()}
        self.inv = collections.defaultdict(list)
        for i, c in enumerate(counters):
            for g, w in tfidf(c, self.idf).items():
                self.inv[g].append((i, w))

    def best(self, counter):
        v = tfidf(counter, self.idf)
        score = collections.defaultdict(float)
        for g, w in v.items():
            for i, uw in self.inv[g]:
                score[i] += w * uw
        if not score:
            return None, 0.0
        i = max(score, key=score.get)
        return (self.units[i]["unit_id"], score[i]) if score[i] >= UNIT_MATCH_MIN else (None, score[i])


def cluster(keys, counters, weight, threshold):
    """건수가 많은 제목부터 차례로, 가장 비슷한 군집에 넣거나 새 군집을 만든다."""
    n = len(keys)
    df = collections.Counter(g for c in counters for g in c)
    idf = {g: math.log(1 + n / d) for g, d in df.items() if d / n <= 0.3 or n < 50}
    vecs = [tfidf(c, idf) for c in counters]
    order = sorted(range(n), key=lambda i: (-weight[i], keys[i]))
    sums, norms, members = [], [], []
    inv = collections.defaultdict(dict)
    empty = []
    for i in order:
        v = vecs[i]
        if not v:
            empty.append(i)
            continue
        score = collections.defaultdict(float)
        for g, w in v.items():
            for cid, cw in inv[g].items():
                score[cid] += w * cw
        best, best_s = None, 0.0
        for cid, s in score.items():
            s /= norms[cid]
            if s > best_s:
                best, best_s = cid, s
        if best is None or best_s < threshold:
            best = len(sums)
            sums.append({})
            norms.append(1.0)
            members.append([])
        members[best].append(i)
        if len(members[best]) <= CENTROID_MEMBERS:
            sm = sums[best]
            for g, w in v.items():
                sm[g] = sm.get(g, 0.0) + w
                inv[g][best] = sm[g]
            norms[best] = math.sqrt(sum(x * x for x in sm.values()))
    return members, empty


def summarize(idx_list, rows, unit_of, n_titles=8):
    idx_list = sorted(idx_list, key=lambda i: (-rows[i]["n"], rows[i]["제목"]))
    years, kinds, partners, words, unit_docs = (collections.Counter() for _ in range(5))
    docs = 0
    for i in idx_list:
        r = rows[i]
        docs += r["n"]
        years.update(r["연도"])
        kinds.update(r["구분"])
        if r["수신발신처"]:
            partners[r["수신발신처"][:30]] += r["n"]
        for w in set(tokens(r["제목"])):
            words[w] += r["n"]
        unit_docs[unit_of[i]] += r["n"]
    titles = [{"제목": rows[i]["제목"], "건수": rows[i]["n"]} for i in idx_list[:n_titles]]
    rest = idx_list[n_titles:]
    if rest:  # 건수가 적은 제목도 일정 간격으로 4개 더 보여 준다
        step = max(1, len(rest) // 4)
        titles += [{"제목": rows[i]["제목"], "건수": rows[i]["n"]} for i in rest[::step][:4]]
    return {
        "문서수": docs, "고유제목수": len(idx_list), "연도별_문서수": dict(sorted(years.items())),
        "생산": kinds.get("생산", 0), "접수": kinds.get("접수", 0),
        "핵심어": [w for w, _ in words.most_common(6)], "대표제목": titles,
        "주요_수신발신처": [p for p, _ in partners.most_common(3)],
        "기존단위업무_유사": [{"unit_id": u, "문서비율": round(c / docs, 2)} for u, c in unit_docs.most_common(3) if u],
    }


def prepare(con, cls, dept_map, common_kw, common_keys, dept, a, run_dir):
    mapping = dept_map.get(dept, {"유형": "대상외", "부서1": [], "비고": "dept_map.json에 없는 부서"})
    where, params = ["부서명 = ?", "제목 <> ''"], [dept]
    if a.year:
        where.append(f"연도 in ({','.join('?' * len(a.year))})")
        params += a.year
    agg = {}
    for key, year, kind, n, title, partner in con.execute(
            f"select 제목키, 연도, 문서구분, count(*), min(제목), max(수신발신처) from docs where {' and '.join(where)} group by 제목키, 연도, 문서구분", params):
        r = agg.setdefault(key, {"제목키": key, "제목": title, "n": 0, "연도": collections.Counter(), "구분": collections.Counter(), "수신발신처": partner})
        r["n"] += n
        r["연도"][year] += n
        r["구분"][kind] += n
    if not agg:
        print(f"[{dept}] 조건에 맞는 문서가 없다. 부서명은 문서목록의 표기(예: 김포운영단)를 쓴다.", file=sys.stderr)
        return None
    all_rows = sorted(agg.values(), key=lambda r: r["제목키"])
    total_docs = sum(r["n"] for r in all_rows)

    received, tagged, rows = [], collections.defaultdict(list), []
    for r in all_rows:
        if r["제목키"] in common_keys and not r["구분"].get("생산"):
            received.append(r)
            continue
        cat = next((c for c, kws in common_kw.items() if any(k in r["제목"] for k in kws)), None)
        (tagged[cat] if cat else rows).append(r)

    units = catalog_units(cls, mapping)
    matcher = UnitMatcher(units) if units else None
    counters = [grams(tokens(r["제목"])) for r in rows]
    unit_of, unit_stat = [], collections.defaultdict(lambda: {"문서수": 0, "제목": []})
    for r, c in zip(rows, counters):
        uid = matcher.best(c)[0] if matcher else None
        unit_of.append(uid)
        if uid:
            unit_stat[uid]["문서수"] += r["n"]
            unit_stat[uid]["제목"].append((r["n"], r["제목"]))

    members, empty = cluster([r["제목키"] for r in rows], counters, [r["n"] for r in rows], a.threshold)
    members.sort(key=lambda m: -sum(rows[i]["n"] for i in m))
    big = [m for m in members if sum(rows[i]["n"] for i in m) >= a.min_docs][:a.top_clusters]
    big_set = {id(m) for m in big}
    small = [i for m in members if id(m) not in big_set for i in m] + empty

    clusters = []
    for no, m in enumerate(big, start=1):
        clusters.append({"cluster_id": f"c{no:03d}", "종류": "군집", **summarize(m, rows, unit_of)})
    # 부서공통 추정 묶음도 군집과 같은 형식으로 넘겨 주관 부서 여부를 에이전트가 판단하게 한다.
    for no, (cat, rs) in enumerate(sorted(tagged.items(), key=lambda kv: -sum(r["n"] for r in kv[1])), start=1):
        idx = list(range(len(rs)))
        clusters.append({"cluster_id": f"g{no:02d}", "종류": f"부서공통 추정({cat})", **summarize(idx, rs, [None] * len(rs))})

    ddir = run_dir / dept
    for u in units:
        st = unit_stat.get(u["unit_id"], {"문서수": 0, "제목": []})
        u["추정문서수"] = st["문서수"]
        u["추정_대표제목"] = [t for _, t in sorted(st["제목"], reverse=True)[:3]]
        del u["_text"]
    small_docs = sum(rows[i]["n"] for i in small)
    step = max(1, len(small) // 40)
    stats = {
        "부서명": dept, "부서대응": mapping, "모드": "대조" if mapping.get("유형") == "직접" else "초안",
        "조건_연도": a.year, "전체_문서수": total_docs, "전체_고유제목수": len(all_rows),
        "공통수신_문서수": sum(r["n"] for r in received), "부서공통추정_문서수": sum(r["n"] for rs in tagged.values() for r in rs),
        "군집대상_문서수": sum(r["n"] for r in rows), "제시군집_수": len(big),
        "제시군집_문서수": sum(c["문서수"] for c in clusters if c["종류"] == "군집"),
        "소규모군집_문서수": small_docs, "소규모군집_고유제목수": len(small),
        "기존단위업무_수": len(units), "추정문서수_0건_단위업무": sum(1 for u in units if u["추정문서수"] == 0),
        "신설근거_최소문서수": a.min_evidence,
    }
    dump_json(ddir / "clusters.json", {"통계": stats, "clusters": clusters})
    dump_json(ddir / "existing_units.json", {
        "유의": "추정문서수는 제목과 단위업무 설명의 글자 구성 유사도로 센 값이다. 0건이어도 실제 문서가 다른 표현으로 있을 수 있으므로 군집 자료로 다시 확인한다."
                + (" 이 부서는 분류기준표에 자체 항목이 없거나 추정 연결이라 다른 부서 기준표를 참고용으로 실었다." if stats["모드"] == "초안" else ""),
        "units": units})
    dump_json(ddir / "excluded.json", {
        "공통수신": {"설명": f"{COMMON_MIN_DEPTS}개 이상 부서가 같은 제목으로 접수한 문서. 이 부서의 고유 업무 근거로 쓰지 않는다.",
                 "문서수": stats["공통수신_문서수"], "예시": [r["제목"] for r in sorted(received, key=lambda r: -r["n"])[:20]]},
        "소규모군집": {"설명": f"문서 수 {a.min_docs}건 미만이거나 상위 {a.top_clusters}개에 들지 못한 군집. 일정 간격으로 뽑은 예시만 싣는다.",
                  "문서수": small_docs, "예시": [rows[i]["제목"] for i in small[::step][:40]]},
    })
    parts = []
    for p, s in enumerate(range(0, len(clusters), a.part_size), start=1):
        name = f"part_{p:02d}"
        dump_json(ddir / "parts" / f"{name}.json", {"part": name, "부서명": dept, "부서대응": mapping, "모드": stats["모드"], "clusters": clusters[s:s + a.part_size]})
        parts.append(name)
    stats["parts"] = parts
    return stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True, help="실행 이름. _workspace/{run}에 저장")
    ap.add_argument("--dept", action="append", required=True, help="부서명(문서목록 기준). 여러 번 지정 가능")
    ap.add_argument("--year", action="append", help="연도. 여러 번 지정 가능. 생략하면 전체 연도")
    ap.add_argument("--threshold", type=float, default=0.33, help="같은 군집으로 묶는 유사도 하한(기본 0.33). 높이면 군집이 잘게 나뉜다")
    ap.add_argument("--top-clusters", type=int, default=90, help="에이전트에 제시할 군집 수 상한")
    ap.add_argument("--min-docs", type=int, default=5, help="제시할 군집의 최소 문서 수")
    ap.add_argument("--part-size", type=int, default=30, help="해석 에이전트 한 명이 맡는 군집 수")
    ap.add_argument("--min-evidence", type=int, default=10, help="신설·초안 제안에 필요한 근거 문서 수 기준")
    a = ap.parse_args()
    run_dir = WORK / a.run
    if (run_dir / "manifest.json").exists():
        sys.exit(f"{run_dir}가 이미 있다. 다른 --run 이름을 쓰거나 기존 폴더를 옮긴다.")
    con = sqlite3.connect(SHARED_DATA / "production.sqlite")
    cls = load_json(SHARED_DATA / "classification.json")
    dept_map = load_json(SHARED_DATA / "dept_map.json")
    common_kw = {k: v for k, v in load_json(DATA / "common_keywords.json").items() if not k.startswith("_")}
    common_keys = common_received_keys(con)
    depts = [s for s in (prepare(con, cls, dept_map, common_kw, common_keys, d, a, run_dir) for d in a.dept) if s]
    if not depts:
        sys.exit("준비된 부서가 없다.")
    dump_json(run_dir / "manifest.json", {"run": a.run, "옵션": vars(a), "depts": depts})
    dump_json(run_dir / "workflow_args.json", {
        "run": a.run, "root": str(WORK.parent), "maxRounds": 1,
        "depts": [{"dept": d["부서명"], "mode": d["모드"], "parts": d["parts"]} for d in depts]})
    for d in depts:
        print(json.dumps({k: v for k, v in d.items() if k != "부서대응"}, ensure_ascii=False))
    print(f"Workflow 인자: {run_dir / 'workflow_args.json'}")


if __name__ == "__main__":
    main()

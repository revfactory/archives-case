"""조직 개편 검토에 쓰는 사실 자료를 분류기준표 색인과 문서목록 DB에서 계산한다.

모든 수치에는 근거 ID가 붙는다. 대안과 보고서는 이 ID와 값을 인용해야 하고,
check_citations.py가 인용값이 여기 값과 같은지 검사한다.

산출물(data/facts/)
- facts.json          : {근거ID: {"구분", "설명", "값": {항목: 값}}}
- 01_부서현황.md      : DP- 분류기준표 부서별 단위업무·기록물철 수, 보존기간 구성
- 02_기능분산.md      : DS- 같은 단위업무명·소기능·중기능이 여러 부서에 있는 정도
- 03_유사단위업무.md  : SM- 서로 다른 부서의 이름·내용이 비슷한 단위업무 쌍
- 04_문서량.md        : VL- 부서별·연도별 생산·접수 문서 수와 점유율 변화
- 05_수발신.md        : CM- 부서 간 수신·발신 문서 수(수신발신처 열에서 내부 부서장 명칭을 찾아 집계)
- 단위업무목록.md     : 단위업무 전체 목록(unit_id, 부서, 기능, 기록물철 수). 근거 ID 없음
"""
import collections
import math
import re
import sqlite3

from common import FACTS, SHARED_DATA, dump_json, load_json

facts = {}


def add(fid, kind, desc, values):
    facts[fid] = {"구분": kind, "설명": desc, "값": values}


def table(title, note, head, rows):
    out = [f"## {title}", "", note, "", "| " + " | ".join(head) + " |", "|" + " --- |" * len(head)]
    out += ["| " + " | ".join(str(c).replace("|", "/") for c in r) + " |" for r in rows]
    return "\n".join(out) + "\n"


def grams(text):
    t = re.sub(r"[\s\d\W_]+", "", text)
    return [t[i:i + 2] for i in range(len(t) - 1)]


def dept_profile(cls):
    files = {f["file_id"]: f for f in cls["files"]}
    d1 = collections.defaultdict(lambda: collections.defaultdict(list))
    for u in cls["units"]:
        d1[u["부서1"]][u["부서2"]].append(u)
    rows1, rows2 = [], []
    for i, (dept1, subs) in enumerate(sorted(d1.items(), key=lambda x: -sum(len(v) for v in x[1].values())), start=1):
        us = [u for v in subs.values() for u in v]
        fs = [files[f] for u in us for f in u["file_ids"]]
        long_term = sum(1 for f in fs if f["보존기간"].startswith(("30년", "50년", "준영구", "영구")))
        vals = {"부서레벨2 수": len(subs), "단위업무 수": len(us), "기록물철 수": len(fs),
                "중기능 수": len({u["중기능"] for u in us}), "소기능 수": len({u["소기능"] for u in us}),
                "보존기간 30년 이상 기록물철 수": long_term}
        fid = f"DP-{i:03d}"
        add(fid, "부서현황", f"분류기준표 부서레벨(1) '{dept1}'", vals)
        rows1.append([fid, dept1, *vals.values()])
        for j, (dept2, us2) in enumerate(sorted(subs.items()), start=1):
            fs2 = [files[f] for u in us2 for f in u["file_ids"]]
            vals2 = {"단위업무 수": len(us2), "기록물철 수": len(fs2), "중기능 수": len({u["중기능"] for u in us2}),
                     "소기능 수": len({u["소기능"] for u in us2})}
            fid2 = f"DP-{i:03d}-{j:02d}"
            add(fid2, "부서현황", f"분류기준표 '{dept1} / {dept2}'", vals2)
            rows2.append([fid2, dept1, dept2, *vals2.values(), ", ".join(sorted({u["중기능"] for u in us2}))])
    tot = {"부서레벨1 수": len(d1), "부서레벨2 수": sum(len(v) for v in d1.values()), "단위업무 수": len(cls["units"]), "기록물철 수": len(cls["files"])}
    add("DP-000", "부서현황", "분류기준표 전체", tot)
    md = "# 01 부서현황 (분류기준표 기준)\n\n" + f"전체 [DP-000]: {tot}\n\n"
    md += table("부서레벨(1)별", "단위업무 수가 많은 순.", ["근거ID", "부서레벨1", *list(facts['DP-001']['값'])], rows1)
    md += "\n" + table("부서레벨(2)별", "", ["근거ID", "부서레벨1", "부서레벨2", "단위업무 수", "기록물철 수", "중기능 수", "소기능 수", "중기능 목록"], rows2)
    (FACTS / "01_부서현황.md").write_text(md, encoding="utf-8")


def dispersion(cls):
    md = "# 02 기능 분산 (분류기준표 기준)\n\n같은 이름의 단위업무·소기능·중기능이 둘 이상의 부서에 있는 경우를 센다. 부서 수가 많을수록 같은 기능이 여러 부서에 나뉘어 있다는 뜻이다.\n\n"
    for prefix, field, label in (("DS-U", "단위업무명", "단위업무명"), ("DS-S", "소기능", "소기능"), ("DS-M", "중기능", "중기능")):
        g = collections.defaultdict(list)
        for u in cls["units"]:
            g[u[field]].append(u)
        multi1 = {k: v for k, v in g.items() if len({u["부서1"] for u in v}) > 1}
        multi2 = {k: v for k, v in g.items() if len({(u["부서1"], u["부서2"]) for u in v}) > 1}
        add(f"{prefix}000", "기능분산", f"{label} 분산 요약", {
            f"{label} 종류 수": len(g), "둘 이상의 부서레벨1에 있는 종류 수": len(multi1), "둘 이상의 부서레벨2에 있는 종류 수": len(multi2)})
        rows = []
        for i, (k, v) in enumerate(sorted(multi2.items(), key=lambda x: (-len({(u['부서1'], u['부서2']) for u in x[1]}), x[0])), start=1):
            depts = sorted({f"{u['부서1']}/{u['부서2']}" for u in v})
            vals = {"부서레벨1 수": len({u["부서1"] for u in v}), "부서레벨2 수": len(depts), "단위업무 수": len(v),
                    "기록물철 수": sum(len(u["file_ids"]) for u in v)}
            fid = f"{prefix}{i:03d}"
            add(fid, "기능분산", f"{label} '{k}'", vals)
            rows.append([fid, k, *vals.values(), "; ".join(depts), " ".join(u["unit_id"] for u in v) if field != "중기능" else "(단위업무목록.md 참고)"])
        md += f"요약 [{prefix}000]: {facts[prefix + '000']['값']}\n\n"
        md += table(f"{label}이 여러 부서에 있는 경우", "", ["근거ID", label, "부서레벨1 수", "부서레벨2 수", "단위업무 수", "기록물철 수", "부서", "unit_id"], rows) + "\n"
    (FACTS / "02_기능분산.md").write_text(md, encoding="utf-8")


def similar(cls):
    files = {f["file_id"]: f for f in cls["files"]}
    docs = []
    for u in cls["units"]:
        text = " ".join([u["단위업무명"] * 2, u["소기능"]] + [files[f]["기록물철명"] for f in u["file_ids"]])
        docs.append(collections.Counter(grams(text)))
    df = collections.Counter(g for d in docs for g in d)
    n = len(docs)
    vecs = []
    for d in docs:
        v = {g: (1 + math.log(c)) * math.log(1 + n / df[g]) for g, c in d.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1
        vecs.append({g: x / norm for g, x in v.items()})
    inv = collections.defaultdict(list)
    for i, v in enumerate(vecs):
        for g, x in v.items():
            inv[g].append((i, x))
    pairs = []
    for i, v in enumerate(vecs):
        score = collections.defaultdict(float)
        for g, x in v.items():
            for j, y in inv[g]:
                if j > i:
                    score[j] += x * y
        for j, s in score.items():
            a, b = cls["units"][i], cls["units"][j]
            if s >= 0.45 and (a["부서1"], a["부서2"]) != (b["부서1"], b["부서2"]):
                pairs.append((s, a, b))
    pairs.sort(key=lambda x: -x[0])
    by_dept = collections.Counter()
    for s, a, b in pairs:
        if a["부서1"] != b["부서1"]:
            by_dept[tuple(sorted((a["부서1"], b["부서1"])))] += 1
    add("SM-000", "유사단위업무", "유사도 0.45 이상인 서로 다른 부서의 단위업무 쌍", {
        "쌍 수": len(pairs), "부서레벨1이 다른 쌍 수": sum(1 for s, a, b in pairs if a["부서1"] != b["부서1"])})
    rows_d = []
    for i, (k, c) in enumerate(by_dept.most_common(40), start=1):
        fid = f"SM-D{i:02d}"
        add(fid, "유사단위업무", f"'{k[0]}'와 '{k[1]}' 사이의 유사 단위업무 쌍", {"쌍 수": c})
        rows_d.append([fid, k[0], k[1], c])
    rows = []
    for i, (s, a, b) in enumerate(pairs[:300], start=1):
        fid = f"SM-{i:03d}"
        add(fid, "유사단위업무", f"{a['unit_id']}({a['부서1']}/{a['부서2']} {a['단위업무명']})와 {b['unit_id']}({b['부서1']}/{b['부서2']} {b['단위업무명']})", {"유사도": round(s, 2)})
        rows.append([fid, round(s, 2), a["unit_id"], f"{a['부서1']}/{a['부서2']}", a["단위업무명"], b["unit_id"], f"{b['부서1']}/{b['부서2']}", b["단위업무명"]])
    md = ("# 03 유사 단위업무 (분류기준표 기준)\n\n단위업무명·소기능·기록물철명의 글자 2개 단위 구성으로 계산한 유사도(0~1)다. "
          "글자 구성이 비슷하다는 뜻이며 업무 내용이 같다는 판정이 아니다. 대안에 쓰기 전에 단위업무목록.md와 분류 색인에서 내용을 확인한다.\n\n"
          f"요약 [SM-000]: {facts['SM-000']['값']}\n\n")
    md += table("부서레벨(1) 쌍별 유사 단위업무 쌍 수 (상위 40)", "", ["근거ID", "부서 A", "부서 B", "쌍 수"], rows_d) + "\n"
    md += table("유사 단위업무 쌍 (상위 300)", "", ["근거ID", "유사도", "unit A", "부서 A", "단위업무 A", "unit B", "부서 B", "단위업무 B"], rows)
    (FACTS / "03_유사단위업무.md").write_text(md, encoding="utf-8")


def volume(con, dept_map):
    years = [r[0] for r in con.execute("select distinct 연도 from docs order by 1")]
    data = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))
    for dept, y, kind, n in con.execute("select 부서명, 연도, 문서구분, count(*) from docs group by 1,2,3"):
        data[dept][y][0 if kind == "생산" else 1] += n
    ytot = {y: sum(sum(data[d][y]) for d in data) for y in years}
    for y in years:
        add(f"VL-Y{y}", "문서량", f"{y}년 전체 문서 수", {"문서 수": ytot[y], "생산": sum(data[d][y][0] for d in data), "접수": sum(data[d][y][1] for d in data)})
    rows = []
    for i, dept in enumerate(sorted(data, key=lambda d: -sum(sum(v) for v in data[d].values())), start=1):
        m = dept_map.get(dept, {})
        tot = sum(sum(v) for v in data[dept].values())
        prod = sum(v[0] for v in data[dept].values())
        vals = {"전체 문서 수": tot, "생산 비율(%)": round(100 * prod / tot, 1)}
        for y in years:
            vals[f"{y} 문서 수"] = sum(data[dept][y])
        for y in years:
            vals[f"{y} 점유율(%)"] = round(100 * sum(data[dept][y]) / ytot[y], 2)
        vals["점유율 변화 2022→2025(%p)"] = round(vals["2025 점유율(%)"] - vals["2022 점유율(%)"], 2)
        fid = f"VL-{i:03d}"
        add(fid, "문서량", f"문서목록 부서 '{dept}' (분류기준표 대응: {m.get('유형', '없음')} {'·'.join(m.get('부서1', []))})", vals)
        rows.append([fid, dept, f"{m.get('유형', '없음')}: {'·'.join(m.get('부서1', [])) or '-'}", *vals.values()])
    md = ("# 04 문서량 (문서목록 기준)\n\n문서목록의 부서명은 분류기준표와 표기가 다르다. '분류기준표 대응' 열은 kac-shared/data/dept_map.json의 값이며 준용·승계추정은 추정이다.\n\n"
          "주의: 2021년과 2026년 시트의 문서 수는 2022~2025년의 약 3배다. 연도별 수록 범위가 다를 수 있으므로 문서 수의 연도 간 증감을 그대로 비교하지 말고 점유율을 쓴다. "
          "문서목록에는 단위업무 열이 없어 단위업무별 문서 수는 알 수 없다.\n\n")
    md += "연도별 전체: " + ", ".join(f"[VL-Y{y}] {ytot[y]:,}건" for y in years) + "\n\n"
    md += table("부서별 문서 수와 점유율", "", ["근거ID", "부서명", "분류기준표 대응", *list(facts['VL-001']['값'])], rows)
    (FACTS / "04_문서량.md").write_text(md, encoding="utf-8")


def aliases(depts):
    """문서목록 부서명 → 수신발신처에 나오는 부서장 명칭."""
    out = {}
    for d in depts:
        if re.search(r"(실|단|센터|본부|원|공항)$", d) and len(d) >= 3:
            out[d + "장"] = d
    for full, short in (("김포공항 운영단장", "김포운영단"), ("김포공항 시설단장", "김포시설단"), ("김포공항 기술단장", "김포기술단"),
                        ("제주공항 운영단장", "제주운영단"), ("제주공항 시설단장", "제주시설단"), ("김해공항 운영단장", "김해운영단"), ("김해공항 시설단장", "김해시설단")):
        out[full] = short
    return out


def communication(con):
    depts = [r[0] for r in con.execute("select distinct 부서명 from docs")]
    al = aliases(depts)
    pat = re.compile("|".join(sorted(map(re.escape, al), key=len, reverse=True)))
    flow = collections.Counter()
    n_all = n_hit = n_ceo = 0
    for dept, kind, party, n in con.execute("select 부서명, 문서구분, 수신발신처, count(*) from docs where 수신발신처 <> '' group by 1,2,3"):
        n_all += n
        if "한국공항공사 사장" in party or party.strip() == "사장":
            n_ceo += n
        found = {al[m] for m in pat.findall(party)} - {dept}
        if not found:
            continue
        n_hit += n
        for other in found:
            flow[(dept, other) if kind == "생산" else (other, dept)] += n
    add("CM-000", "수발신", "수신발신처 집계 범위", {"수신발신처가 있는 문서 수": n_all, "내부 부서장 명칭이 확인된 문서 수": n_hit,
                                           "수신발신처가 '한국공항공사 사장'인 문서 수(부서를 특정할 수 없어 제외)": n_ceo})
    pair = collections.Counter()
    for (a, b), n in flow.items():
        pair[tuple(sorted((a, b)))] += n
    rows = []
    for i, ((a, b), n) in enumerate(pair.most_common(200), start=1):
        vals = {"문서 수": n, f"{a}→{b}": flow[(a, b)], f"{b}→{a}": flow[(b, a)]}
        fid = f"CM-{i:03d}"
        add(fid, "수발신", f"'{a}'와 '{b}' 사이의 수신·발신 문서", vals)
        rows.append([fid, a, b, n, flow[(a, b)], flow[(b, a)]])
    hub = collections.Counter()
    for (a, b), n in pair.items():
        hub[a] += n
        hub[b] += n
    rows_h = []
    for i, (d, n) in enumerate(hub.most_common(), start=1):
        partners = sum(1 for (a, b) in pair if d in (a, b))
        fid = f"CM-H{i:02d}"
        add(fid, "수발신", f"'{d}'의 부서 간 수신·발신 문서 합계", {"문서 수": n, "상대 부서 수": partners})
        rows_h.append([fid, d, n, partners])
    md = ("# 05 부서 간 수신·발신 (문서목록 기준)\n\n수신발신처 열에서 '○○실장', '○○공항장' 같은 내부 부서장 명칭을 찾아 집계했다. "
          "발신처가 '한국공항공사 사장'으로만 적힌 문서는 발신 부서를 알 수 없어 뺐으므로 실제 부서 간 문서 수보다 적게 집계된다. 부서 사이 문서 왕래의 상대적인 크기를 비교하는 용도로만 쓴다.\n\n"
          f"집계 범위 [CM-000]: {facts['CM-000']['값']}\n\n")
    md += table("부서별 합계", "", ["근거ID", "부서명", "문서 수", "상대 부서 수"], rows_h) + "\n"
    md += table("부서 쌍별 문서 수 (상위 200)", "A→B는 A가 보내고 B가 받은 문서 수.", ["근거ID", "부서 A", "부서 B", "문서 수", "A→B", "B→A"], rows)
    (FACTS / "05_수발신.md").write_text(md, encoding="utf-8")


def unit_list(cls):
    rows = [[u["unit_id"], u["부서1"], u["부서2"], u["중기능"], u["소기능"], u["단위업무명"], len(u["file_ids"])] for u in cls["units"]]
    md = "# 단위업무 목록\n\n기록물철명과 설명은 kac-shared/data/classification.json의 files에서 unit_id로 찾는다.\n\n"
    md += table("전체", "", ["unit_id", "부서레벨1", "부서레벨2", "중기능", "소기능", "단위업무명", "기록물철 수"], rows)
    (FACTS / "단위업무목록.md").write_text(md, encoding="utf-8")


def main():
    FACTS.mkdir(parents=True, exist_ok=True)
    cls = load_json(SHARED_DATA / "classification.json")
    dept_map = load_json(SHARED_DATA / "dept_map.json")
    con = sqlite3.connect(SHARED_DATA / "production.sqlite")
    dept_profile(cls)
    dispersion(cls)
    similar(cls)
    volume(con, dept_map)
    communication(con)
    unit_list(cls)
    dump_json(FACTS / "facts.json", facts)
    kinds = collections.Counter(f["구분"] for f in facts.values())
    print(f"근거 {len(facts)}건: {dict(kinds)}")
    for k in ("DP-000", "DS-U000", "DS-S000", "DS-M000", "SM-000", "CM-000"):
        print(k, facts[k]["값"])


if __name__ == "__main__":
    main()

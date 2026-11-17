"""조직변경 사건별로 영향을 받을 수 있는 단위업무·기록물철 후보와 문서 규모를 조회한다.

후보를 고르는 기준
 1) 사건의 '변경전' 부서에 속한 단위업무 전체 (소속 기준)
 2) 사건의 '업무' 문구와 글자 구성이 비슷한 단위업무·기록물철 (문구 기준, 전 부서 대상)
 3) '변경전' 부서가 분류기준표에 없고 '변경후' 부서가 있으면 변경후 부서의 단위업무 (이미 반영되었는지 확인용)
판정(실제 영향 여부와 조치)은 unit-impact-analyst 에이전트가 한다.

사용: python3 impact_lookup.py {run} [기준차수=색인에 있는 가장 최근 차수]
입력: _workspace/{run}/02_changes.json
산출물: _workspace/{run}/03_candidates/{event_id}.json, 03_candidates/_summary.json
"""
import collections
import math
import re
import sqlite3
import sys

import openpyxl

from common import DATA, REG, ROOT, WORK, clean, dump_json, load_json

HISTORY = ROOT.parent / "(한국공항공사) 기록물분류체계" / "4-1분류체계 정비 및 보존기간 적용 변경 이력.xlsx"


def norm(s):
    return re.sub(r"\s+", "", s or "")


def grams(text):
    t = re.sub(r"[\s\d\W_]+", "", text)
    return {t[i:i + 2] for i in range(len(t) - 1)}


def history_opinions():
    """4-1 변경 이력의 담당부서 의견·반영여부를 file_id별로 읽는다. 파일이 없으면 빈 값."""
    if not HISTORY.exists():
        return {}
    ws = openpyxl.load_workbook(HISTORY, read_only=True, data_only=True).worksheets[0]
    out = {}
    for r in ws.iter_rows(min_row=5, values_only=True):
        if r and r[0] is not None and len(r) > 15 and clean(r[14]):
            out[f"F{int(float(clean(r[0]))):04d}"] = {"담당부서의견": clean(r[14])[:300], "반영여부": clean(r[15])}
    return out


def main():
    run = sys.argv[1]
    index = load_json(REG / "index.json")
    rev = sys.argv[2] if len(sys.argv) > 2 else str(max(x["차수"] for x in index if x["종류"] == "시행세칙"))
    link_path = REG / f"분류기준표_직제대응_{rev}차.json"
    if not link_path.exists():
        sys.exit(f"{link_path.name}이 없다. parse_org.py {rev}, build_org_link.py {rev}를 먼저 실행한다.")
    links = load_json(link_path)["links"]
    changes = load_json(WORK / run / "02_changes.json")
    cls = load_json(DATA / "classification.json")
    dept_map = load_json(DATA / "dept_map.json")
    opinions = history_opinions()
    units = {u["unit_id"]: u for u in cls["units"]}
    files_by_unit = collections.defaultdict(list)
    for f in cls["files"]:
        files_by_unit[f["unit_id"]].append(f)

    # 직제 부서(기관|부서명) → 분류기준표 (부서1, 부서2)
    by_org = collections.defaultdict(set)
    for l in links:
        for k in l["직제부서"]:
            by_org[norm(k)].add((l["부서1"], l["부서2"]))
    unit_gram = {uid: grams(" ".join([u["소기능"], u["단위업무명"]] + [f["기록물철명"] + f["설명"] for f in files_by_unit[uid]])) for uid, u in units.items()}
    df = collections.Counter(g for gs in unit_gram.values() for g in gs)
    idf = {g: math.log(1 + len(units) / c) for g, c in df.items()}
    con = sqlite3.connect(DATA / "production.sqlite")

    def pairs_of(dept):
        """사건에 적힌 부서 {기관, 부서명}를 분류기준표 (부서1, 부서2)로 바꾼다. 실·단 이름이면 부서1로 찾는다."""
        key = norm(f"{dept.get('기관', '본사')}|{dept['부서명']}")
        found = set(by_org.get(key, set()))
        if not found:
            name = norm(dept["부서명"])
            found = {(f["부서1"], f["부서2"]) for f in cls["files"] if norm(f["부서1"]) == name or norm(f["부서1"]) == norm(dept.get("기관", "") + dept["부서명"])}
        return found

    def unit_entry(uid, why):
        u = units[uid]
        fs = files_by_unit[uid]
        e = {"unit_id": uid, "부서1": u["부서1"], "부서2": u["부서2"], "중기능": u["중기능"], "소기능": u["소기능"], "단위업무명": u["단위업무명"],
             "후보사유": why, "기록물철": [{"file_id": f["file_id"], "기록물철명": f["기록물철명"], "보존기간": f["보존기간"]} for f in fs]}
        ops = [{"file_id": f["file_id"], **opinions[f["file_id"]]} for f in fs if f["file_id"] in opinions]
        if ops:
            e["과거_정비의견"] = ops[:3]
        return e

    def doc_volume(d1_set):
        """분류기준표 부서1에 대응하는 문서목록 부서의 연도별 건수. 준용·승계추정 부서는 따로 표시한다."""
        out = {}
        for name, m in dept_map.items():
            if name.startswith("_") or not set(m.get("부서1", [])) & d1_set:
                continue
            rows = con.execute("select 연도, count(*) from docs where 부서명 = ? group by 연도", (name,)).fetchall()
            out[name] = {"대응유형": m["유형"], "부서2_한정": m.get("부서2"), "연도별_문서수": dict(rows), "합계": sum(n for _, n in rows)}
        return out

    summary = []
    for ev in changes["events"]:
        cand, notes = collections.OrderedDict(), []
        before_pairs = set()
        for d in ev.get("변경전", []):
            ps = pairs_of(d)
            if not ps:
                notes.append(f"변경전 부서 '{d.get('기관', '')}|{d['부서명']}'는 분류기준표에 대응 항목이 없다")
            before_pairs |= ps
        for uid, u in units.items():
            if (u["부서1"], u["부서2"]) in before_pairs:
                cand[uid] = unit_entry(uid, "변경전 부서 소속")
        if ev.get("변경전") and not before_pairs:
            after_pairs = set()
            for d in ev.get("변경후", []):
                after_pairs |= pairs_of(d)
            for uid, u in units.items():
                if (u["부서1"], u["부서2"]) in after_pairs:
                    cand[uid] = unit_entry(uid, "변경후 부서 소속(분류기준표에 이미 반영되었는지 확인)")
            if after_pairs:
                notes.append("변경후 부서가 분류기준표에 이미 있다. 이 변경이 이미 반영되었을 수 있다")
        for duty in ev.get("업무", []):
            q = grams(duty["문구"])
            qn = sum(idf.get(g, 0) for g in q) or 1
            scored = sorted(((sum(idf.get(g, 0) for g in q & gs) / qn, uid) for uid, gs in unit_gram.items()), reverse=True)[:6]
            for s, uid in scored:
                if s < 0.35:
                    continue
                why = f"업무 문구 유사({s:.2f}): {duty['문구'][:40]}"
                src = norm((duty.get("이전부서") or "").split("|")[-1])
                if src and src in norm(units[uid]["부서2"] + units[uid]["부서1"]):
                    why += " [이전부서 소속]"
                if uid in cand:
                    cand[uid]["후보사유"] += " / " + why
                else:
                    cand[uid] = unit_entry(uid, why)
        d1_set = {p[0] for p in before_pairs} | {c["부서1"] for c in cand.values() if c["후보사유"].startswith("변경")}
        n_files = sum(len(c["기록물철"]) for c in cand.values())
        dump_json(WORK / run / "03_candidates" / f"{ev['event_id']}.json", {
            "event": ev, "기준차수": int(rev), "유의": notes, "후보_단위업무": list(cand.values()),
            "문서규모": doc_volume(d1_set),
            "문서규모_설명": "문서목록에는 부(부서레벨2)·단위업무 정보가 없어 실·단·공항 단위의 전체 건수만 제공한다. 특정 단위업무의 문서 수가 아니다.",
        })
        summary.append({"event_id": ev["event_id"], "유형": ev["유형"], "요약": ev["요약"], "후보_단위업무수": len(cand), "후보_기록물철수": n_files, "유의": notes})
        print(f"{ev['event_id']} {ev['유형']}: 후보 단위업무 {len(cand)}개, 기록물철 {n_files}개 {notes or ''}")
    dump_json(WORK / run / "03_candidates" / "_summary.json", summary)


if __name__ == "__main__":
    main()

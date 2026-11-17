"""개편 대안 파일(JSON)의 형식, 단위업무 이동 내용, 인용한 근거값을 검사하고 영향 규모를 계산한다.

사용: python3 check_option.py {대안 JSON 경로} [--write]
- 오류가 없으면 영향 규모를 출력하고 종료 코드 0. --write를 주면 대안 파일의 '영향규모' 항목을 계산값으로 채운다.
- 오류가 있으면 오류 목록을 출력하고 종료 코드 1.

검사 내용
1. 필수 항목과 값의 종류
2. 조치의 unit_id가 분류 색인에 있는지, 한 단위업무가 두 조치에 들어가지 않았는지
3. 조치 유형별 규칙: 이관·통합은 '대상부서'가 필요하고 현재 부서와 달라야 한다. 신설은 '대상부서'가 기존에 없는 이름이어야 한다
4. 근거의 fact_id가 data/facts/facts.json에 있고, 인용한 항목의 값이 같은지
"""
import collections
import sys

from common import FACTS, SHARED_DATA, dump_json, load_json

ACTIONS = {"이관", "통합", "신설", "분리", "폐지검토"}
REQUIRED = ["option_id", "관점", "대안명", "전략방향", "요약", "조치", "기대효과", "위험", "전제·확인필요"]


def same(a, b):
    try:
        return abs(float(a) - float(b)) < 1e-9
    except (TypeError, ValueError):
        return str(a).strip() == str(b).strip()


def main():
    path = sys.argv[1]
    opt = load_json(path)
    cls = load_json(SHARED_DATA / "classification.json")
    facts = load_json(FACTS / "facts.json")
    units = {u["unit_id"]: u for u in cls["units"]}
    files = {f["file_id"]: f for f in cls["files"]}
    depts = {(u["부서1"], u["부서2"]) for u in cls["units"]}
    dept1_units = collections.Counter(u["부서1"] for u in cls["units"])
    errs = [f"필수 항목 없음: {k}" for k in REQUIRED if k not in opt]
    if errs:
        print("\n".join(errs))
        sys.exit(1)

    seen, moved = {}, []
    if not isinstance(opt["조치"], list) or not opt["조치"]:
        errs.append("'조치'는 1건 이상의 배열이어야 한다")
    n_evidence = 0
    for i, a in enumerate(opt["조치"] if isinstance(opt["조치"], list) else [], start=1):
        tag = f"조치 {i}({a.get('조치명', '')})"
        if a.get("유형") not in ACTIONS:
            errs.append(f"{tag}: 유형은 {sorted(ACTIONS)} 중 하나여야 한다")
        ids = a.get("unit_ids") or []
        if not ids:
            errs.append(f"{tag}: unit_ids가 비었다")
        target = a.get("대상부서") or {}
        t1, t2 = target.get("부서1", ""), target.get("부서2", "")
        if a.get("유형") in ("이관", "통합", "신설", "분리") and not t1:
            errs.append(f"{tag}: 대상부서.부서1이 필요하다")
        if a.get("유형") == "신설" and (t1, t2) in depts:
            errs.append(f"{tag}: 신설인데 대상부서 '{t1}/{t2}'가 이미 분류기준표에 있다. 이관이나 통합으로 적는다")
        if a.get("유형") in ("이관", "통합") and t1 and t1 not in dept1_units:
            errs.append(f"{tag}: 대상부서 부서1 '{t1}'이 분류기준표에 없다. 새 부서면 유형을 신설로 적는다")
        for uid in ids:
            if uid not in units:
                errs.append(f"{tag}: {uid}는 분류 색인에 없는 단위업무다")
                continue
            if uid in seen:
                errs.append(f"{tag}: {uid}가 조치 {seen[uid]}에도 들어 있다")
            seen[uid] = i
            u = units[uid]
            if a.get("유형") in ("이관", "통합") and (u["부서1"], u["부서2"]) == (t1, t2):
                errs.append(f"{tag}: {uid}는 이미 '{t1}/{t2}' 소속이다")
            moved.append((u, a.get("유형"), t1, t2))
        ev = a.get("근거") or []
        if not ev:
            errs.append(f"{tag}: 근거가 없다. 조치마다 근거 1건 이상을 적는다")
        for e in ev:
            n_evidence += 1
            fid, item = e.get("fact_id"), e.get("항목")
            if fid not in facts:
                errs.append(f"{tag}: 근거 {fid}가 facts.json에 없다")
            elif item not in facts[fid]["값"]:
                errs.append(f"{tag}: 근거 {fid}에 항목 '{item}'이 없다. 있는 항목: {list(facts[fid]['값'])}")
            elif not same(facts[fid]["값"][item], e.get("값")):
                errs.append(f"{tag}: 근거 {fid} '{item}'의 값은 {facts[fid]['값'][item]}인데 {e.get('값')}로 인용했다")
    if errs:
        print("\n".join(errs))
        sys.exit(1)

    src = collections.Counter(u["부서1"] for u, *_ in moved)
    n_files = sum(len(u["file_ids"]) for u, *_ in moved)
    long_term = sum(1 for u, *_ in moved for f in u["file_ids"] if files[f]["보존기간"].startswith(("30년", "50년", "준영구", "영구")))
    impact = {
        "대상 단위업무 수": len(moved),
        "전체 단위업무 대비 비율(%)": round(100 * len(moved) / len(units), 1),
        "대상 기록물철 수": n_files,
        "보존기간 30년 이상 기록물철 수": long_term,
        "유형별 단위업무 수": dict(collections.Counter(t for _, t, *_ in moved)),
        "단위업무가 빠지는 부서(부서레벨1)": {d: {"단위업무 수": n, "해당 부서 단위업무 대비 비율(%)": round(100 * n / dept1_units[d], 1)} for d, n in src.most_common()},
        "단위업무를 받는 부서": dict(collections.Counter(f"{t1}/{t2}".rstrip("/") for _, t, t1, t2 in moved if t1)),
        "부서레벨2 소속이 바뀌는 단위업무 수": sum(1 for u, t, t1, t2 in moved if t1 and (u["부서1"], u["부서2"]) != (t1, t2)),
        "부서레벨1 소속이 바뀌는 단위업무 수": sum(1 for u, t, t1, t2 in moved if t1 and u["부서1"] != t1),
        "확인한 근거 수": n_evidence,
    }
    if "--write" in sys.argv:
        opt["영향규모"] = impact
        dump_json(path, opt)
    import json
    print("OK")
    print(json.dumps(impact, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

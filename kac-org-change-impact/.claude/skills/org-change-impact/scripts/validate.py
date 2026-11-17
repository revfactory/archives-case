"""에이전트가 쓴 파일의 형식을 검사한다. 오류가 없으면 'OK'를 출력하고 종료 코드 0을 낸다.

사용: python3 validate.py {run} changes
      python3 validate.py {run} proposal {event_id}
      python3 validate.py {run} verify {event_id}
"""
import sys

from common import DATA, WORK, load_json

EVENT_TYPES = {"부서신설", "부서폐지", "부서통합", "부서분리", "명칭변경", "상위조직변경", "업무이관", "업무신설", "업무폐지"}
CONF = {"높음", "보통", "낮음"}
IMPACT = {"있음", "없음", "불명"}
ACTIONS = {"부서레벨변경", "이관", "단위업무명변경", "폐지후보", "유지"}
VERDICTS = {"타당", "수정필요", "근거부족"}


def need(obj, fields, where, errs):
    for f in fields:
        if f not in obj or obj[f] in (None, ""):
            errs.append(f"{where}: '{f}'가 없다")


def check_changes(run, errs):
    data = load_json(WORK / run / "02_changes.json")
    evs = data.get("events")
    if not isinstance(evs, list) or not evs:
        errs.append("'events' 배열이 비었다. 조직변경이 없으면 events를 비우지 말고 사용자에게 보고한다")
        return
    need(data, ["입력유형", "기준"], "최상위", errs)
    ids = [e.get("event_id") for e in evs]
    if len(ids) != len(set(ids)):
        errs.append("event_id가 중복된다")
    for e in evs:
        w = e.get("event_id", "?")
        need(e, ["event_id", "유형", "요약", "근거", "확신도", "분류기준표_영향"], w, errs)
        if e.get("유형") not in EVENT_TYPES:
            errs.append(f"{w}: 유형은 {sorted(EVENT_TYPES)} 중 하나")
        if e.get("확신도") not in CONF:
            errs.append(f"{w}: 확신도는 {sorted(CONF)} 중 하나")
        if e.get("분류기준표_영향") not in IMPACT:
            errs.append(f"{w}: 분류기준표_영향은 {sorted(IMPACT)} 중 하나")
        for side in ("변경전", "변경후"):
            for d in e.get(side, []):
                if not isinstance(d, dict) or not d.get("부서명"):
                    errs.append(f"{w}: {side} 항목은 {{'기관', '부서명'}} 객체여야 한다")
        if not e.get("변경전") and not e.get("변경후"):
            errs.append(f"{w}: 변경전·변경후 가운데 하나는 있어야 한다")
        for d in e.get("업무", []):
            if not isinstance(d, dict) or not d.get("문구"):
                errs.append(f"{w}: 업무 항목은 {{'문구', '이전부서', '변경부서'}} 객체여야 한다")


def check_proposal(run, eid, errs):
    cand = load_json(WORK / run / "03_candidates" / f"{eid}.json")
    data = load_json(WORK / run / "04_proposals" / f"{eid}.json")
    cls = load_json(DATA / "classification.json")
    units = {u["unit_id"]: u for u in cls["units"]}
    cand_ids = {c["unit_id"] for c in cand["후보_단위업무"]}
    if data.get("event_id") != eid:
        errs.append(f"event_id가 {eid}가 아니다")
    props = data.get("proposals")
    if not isinstance(props, list):
        errs.append("'proposals' 배열이 있어야 한다")
        props = []
    seen = set()
    for p in props:
        uid = p.get("unit_id")
        w = f"proposals[{uid}]"
        if uid not in units:
            errs.append(f"{w}: 분류기준표에 없는 unit_id")
            continue
        need(p, ["조치", "근거", "확신도"], w, errs)
        if p.get("조치") not in ACTIONS:
            errs.append(f"{w}: 조치는 {sorted(ACTIONS)} 중 하나")
        if p.get("확신도") not in CONF:
            errs.append(f"{w}: 확신도는 {sorted(CONF)} 중 하나")
        fids = p.get("대상_file_ids", [])
        bad = [f for f in fids if f not in units[uid]["file_ids"]]
        if bad:
            errs.append(f"{w}: 대상_file_ids {bad}는 이 단위업무의 기록물철이 아니다")
        if p.get("조치") in ("부서레벨변경", "이관"):
            need(p, ["변경후_부서1", "변경후_부서2"], w, errs)
            if (p.get("변경후_부서1"), p.get("변경후_부서2")) == (units[uid]["부서1"], units[uid]["부서2"]):
                errs.append(f"{w}: 변경후 부서가 현재와 같다. 변화가 없으면 조치를 '유지'로 적는다")
        if p.get("조치") == "단위업무명변경":
            need(p, ["변경후_단위업무명"], w, errs)
        key = (uid, tuple(sorted(fids)))
        if key in seen:
            errs.append(f"{w}: 같은 단위업무·기록물철 범위에 제안이 두 번 있다")
        seen.add(key)
    missing = cand_ids - {p.get("unit_id") for p in props}
    if missing:
        errs.append(f"후보 단위업무 가운데 판정이 빠진 것: {sorted(missing)} (영향이 없으면 조치 '유지'로 적는다)")
    for i, n in enumerate(data.get("new_units", [])):
        need(n, ["부서1", "부서2", "단위업무명", "소기능", "근거"], f"new_units[{i}]", errs)
        if not isinstance(n.get("기록물철_제안", []), list):
            errs.append(f"new_units[{i}]: 기록물철_제안은 배열")


def check_verify(run, eid, errs):
    prop = load_json(WORK / run / "04_proposals" / f"{eid}.json")
    data = load_json(WORK / run / "05_verify" / f"{eid}.json")
    targets = {p["unit_id"] for p in prop["proposals"]} | {f"new:{i + 1}" for i in range(len(prop.get("new_units", [])))}
    vs = data.get("verdicts")
    if not isinstance(vs, list):
        errs.append("'verdicts' 배열이 있어야 한다")
        vs = []
    got = [v.get("대상") for v in vs]
    if set(targets) - set(got):
        errs.append(f"판정이 빠진 대상: {sorted(set(targets) - set(got))}")
    if set(got) - set(targets):
        errs.append(f"제안에 없는 대상: {sorted(set(got) - set(targets))}")
    for v in vs:
        if v.get("판정") not in VERDICTS:
            errs.append(f"{v.get('대상')}: 판정은 {sorted(VERDICTS)} 중 하나")
        if v.get("판정") != "타당" and not str(v.get("의견", "")).strip():
            errs.append(f"{v.get('대상')}: 타당이 아니면 의견을 적는다")
    if not isinstance(data.get("누락", []), list):
        errs.append("'누락'은 배열")


def main():
    run, stage = sys.argv[1:3]
    errs = []
    try:
        if stage == "changes":
            check_changes(run, errs)
        elif stage == "proposal":
            check_proposal(run, sys.argv[3], errs)
        elif stage == "verify":
            check_verify(run, sys.argv[3], errs)
        else:
            sys.exit("단계는 changes, proposal, verify 중 하나")
    except FileNotFoundError as e:
        sys.exit(f"파일이 없다: {e.filename}")
    except ValueError as e:
        sys.exit(f"JSON으로 읽을 수 없다: {e}")
    if errs:
        print("\n".join(errs[:60]))
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()

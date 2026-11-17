"""에이전트가 쓴 결과 파일을 검사한다. 오류가 없으면 'OK'를 출력하고 종료 코드 0을 낸다.

사용: python3 validate.py {run} {부서명} interpret {part_NN}
      python3 validate.py {run} {부서명} proposals
      python3 validate.py {run} {부서명} review
"""
import re
import sys

from common import WORK, load_json

NATURE = {"고유업무", "부서공통", "타부서 소관 수신", "혼합", "판단불가"}
FIT = {"일치", "부분", "없음"}
TYPES = {"신설", "개명", "통합·폐지 검토", "유지", "초안"}
CONF = {"높음", "보통", "낮음"}
VERDICT = {"통과", "수정필요", "기각"}


def fail(errs, warns=()):
    for w in warns:
        print("주의:", w)
    if errs:
        print("\n".join(errs[:60]))
        sys.exit(1)


def check_interpret(ddir, part):
    src = load_json(ddir / "parts" / f"{part}.json")
    data = load_json(ddir / "interpret" / f"{part}.json")
    unit_ids = {u["unit_id"] for u in load_json(ddir / "existing_units.json")["units"]}
    want = [c["cluster_id"] for c in src["clusters"]]
    rows = data.get("clusters")
    if not isinstance(rows, list):
        sys.exit("최상위에 'clusters' 배열이 있어야 한다")
    got = [r.get("cluster_id") for r in rows]
    errs = []
    if sorted(got) != sorted(want):
        errs.append(f"cluster_id가 맞지 않는다. 빠짐: {sorted(set(want) - set(got))}, 묶음에 없음: {sorted(set(got) - set(want))}, 중복 여부: {len(got) != len(set(got))}")
    for r in rows:
        cid = r.get("cluster_id")
        if not str(r.get("업무내용", "")).strip():
            errs.append(f"{cid}: 업무내용이 비었다")
        if r.get("성격") not in NATURE:
            errs.append(f"{cid}: 성격은 {sorted(NATURE)} 중 하나여야 한다")
        ex = r.get("기존단위업무") or {}
        if ex.get("적합도") not in FIT:
            errs.append(f"{cid}: 기존단위업무.적합도는 {sorted(FIT)} 중 하나여야 한다")
        elif ex["적합도"] == "없음":
            if ex.get("unit_id"):
                errs.append(f"{cid}: 적합도가 '없음'이면 unit_id는 null이어야 한다")
        elif ex.get("unit_id") not in unit_ids:
            errs.append(f"{cid}: unit_id {ex.get('unit_id')!r}는 existing_units.json에 없다")
        if r.get("성격") == "고유업무" and not str(r.get("임시업무명", "")).strip():
            errs.append(f"{cid}: 고유업무는 임시업무명을 적는다")
    fail(errs)
    print("OK", len(rows))


def check_proposals(ddir):
    cl = load_json(ddir / "clusters.json")
    stats = cl["통계"]
    clusters = {c["cluster_id"]: c for c in cl["clusters"]}
    units = {u["unit_id"]: u for u in load_json(ddir / "existing_units.json")["units"]}
    data = load_json(ddir / "proposals.json")
    props = data.get("proposals")
    if not isinstance(props, list) or not isinstance(data.get("보류"), list):
        sys.exit("최상위에 'proposals' 배열과 '보류' 배열이 있어야 한다")
    errs, warns = [], []
    mode = stats["모드"]
    pids = [p.get("proposal_id") for p in props]
    if len(pids) != len(set(pids)) or any(not re.fullmatch(r"P\d{3}", str(x)) for x in pids):
        errs.append("proposal_id는 P001 형식이고 중복이 없어야 한다")
    used, names, existing_seen = set(), {}, {}
    existing_names = {u["단위업무명"] for u in units.values()} if mode == "대조" else set()
    for p in props:
        pid, typ = p.get("proposal_id"), p.get("유형")
        if typ not in TYPES:
            errs.append(f"{pid}: 유형은 {sorted(TYPES)} 중 하나여야 한다")
            continue
        if mode == "초안" and typ != "초안":
            errs.append(f"{pid}: 이 부서는 초안 모드이므로 유형은 '초안'만 쓴다")
        if mode == "대조" and typ == "초안":
            errs.append(f"{pid}: 이 부서는 대조 모드이므로 '초안' 유형을 쓰지 않는다")
        if p.get("확신도") not in CONF:
            errs.append(f"{pid}: 확신도는 {sorted(CONF)} 중 하나여야 한다")
        if not str(p.get("사유", "")).strip():
            errs.append(f"{pid}: 사유가 비었다")
        cids = p.get("근거_cluster_ids") or []
        bad = [c for c in cids if c not in clusters]
        if bad:
            errs.append(f"{pid}: 없는 cluster_id {bad}")
            continue
        used.update(cids)
        pool = {t["제목"] for c in cids for t in clusters[c]["대표제목"]}
        wrong = [t for t in (p.get("대표제목") or []) if t not in pool]
        if wrong:
            errs.append(f"{pid}: 대표제목은 근거 군집의 대표제목에서 그대로 옮긴다. 일치하지 않음: {wrong[:2]}")
        docs = sum(clusters[c]["문서수"] for c in cids)
        uid = p.get("기존_unit_id")
        name = str(p.get("제안_단위업무명", "")).strip()
        if typ in ("신설", "초안"):
            if typ == "신설" and uid:
                errs.append(f"{pid}: 신설은 기존_unit_id를 null로 둔다")
            if typ == "초안" and p.get("준용_unit_id") and p["준용_unit_id"] not in units:
                errs.append(f"{pid}: 준용_unit_id {p['준용_unit_id']}는 existing_units.json에 없다")
            if not cids or not p.get("대표제목"):
                errs.append(f"{pid}: {typ}은 근거_cluster_ids와 대표제목이 있어야 한다")
            if not p.get("기록물철_초안"):
                errs.append(f"{pid}: {typ}은 기록물철_초안을 1개 이상 적는다")
            if docs < stats["신설근거_최소문서수"] and p.get("확신도") != "낮음":
                errs.append(f"{pid}: 근거 문서가 {docs}건으로 기준({stats['신설근거_최소문서수']}건)보다 적다. 확신도를 '낮음'으로 하거나 보류로 옮긴다")
            if typ == "신설" and name in existing_names:
                errs.append(f"{pid}: '{name}'은 이미 기준표에 있는 단위업무명이다")
        else:
            if uid not in units:
                errs.append(f"{pid}: {typ}은 existing_units.json에 있는 기존_unit_id가 필요하다 (현재 {uid!r})")
                continue
            if uid in existing_seen:
                errs.append(f"{pid}: 기존_unit_id {uid}가 {existing_seen[uid]}와 겹친다")
            existing_seen[uid] = pid
            if typ == "개명":
                if not cids:
                    errs.append(f"{pid}: 개명은 근거_cluster_ids가 있어야 한다")
                if not name or name == units[uid]["단위업무명"]:
                    errs.append(f"{pid}: 개명은 기존 이름과 다른 제안_단위업무명이 필요하다")
            if typ == "통합·폐지 검토" and p.get("통합대상_unit_id") and p["통합대상_unit_id"] not in units:
                errs.append(f"{pid}: 통합대상_unit_id {p['통합대상_unit_id']}는 existing_units.json에 없다")
        if typ in ("신설", "초안", "개명"):
            if not (2 <= len(name) <= 25):
                errs.append(f"{pid}: 제안_단위업무명은 2~25자로 쓴다 (현재 {len(name)}자)")
            if re.search(r"\d{4}|[.!?]$|\(|\)", name):
                errs.append(f"{pid}: 제안_단위업무명에 연도·괄호·마침표를 넣지 않는다")
            if name in names:
                errs.append(f"{pid}: 제안_단위업무명 '{name}'이 {names[name]}와 같다")
            names[name] = pid
            for f in p.get("기록물철_초안") or []:
                if not str(f.get("기록물철명", "")).strip() or not str(f.get("설명", "")).strip():
                    errs.append(f"{pid}: 기록물철_초안의 기록물철명과 설명을 모두 적는다")
    if mode == "대조":
        miss = sorted(set(units) - set(existing_seen))
        if miss:
            errs.append(f"기존 단위업무마다 유지·개명·통합·폐지 검토 가운데 하나를 정해야 한다. 빠짐: {miss}")
    held = {h.get("cluster_id") for h in data["보류"]}
    for h in data["보류"]:
        if h.get("cluster_id") not in clusters or not str(h.get("사유", "")).strip():
            errs.append(f"보류 항목 {h.get('cluster_id')!r}: 있는 cluster_id와 사유가 필요하다")
    left = sorted(set(clusters) - used - held)
    if left:
        errs.append(f"제안의 근거로 쓰지도 보류에 넣지도 않은 군집: {left}")
    both = sorted(used & held)
    if both:
        warns.append(f"제안 근거와 보류에 함께 있는 군집: {both}")
    fail(errs, warns)
    print("OK", len(props), "보류", len(held))


def check_review(ddir):
    props = load_json(ddir / "proposals.json")["proposals"]
    data = load_json(ddir / "review.json")
    rows = data.get("reviews")
    if not isinstance(rows, list):
        sys.exit("최상위에 'reviews' 배열이 있어야 한다")
    want, got = [p["proposal_id"] for p in props], [r.get("proposal_id") for r in rows]
    errs = []
    if sorted(want) != sorted(got):
        errs.append(f"proposal_id가 맞지 않는다. 빠짐: {sorted(set(want) - set(got))}, 제안에 없음: {sorted(set(got) - set(want))}")
    for r in rows:
        if r.get("판정") not in VERDICT:
            errs.append(f"{r.get('proposal_id')}: 판정은 {sorted(VERDICT)} 중 하나여야 한다")
        elif r["판정"] != "통과" and not (r.get("지적") or []):
            errs.append(f"{r.get('proposal_id')}: 통과가 아니면 지적을 1개 이상 적는다")
    fail(errs)
    print("OK", len(rows))


def main():
    run, dept, stage = sys.argv[1:4]
    ddir = WORK / run / dept
    target = {"interpret": lambda: ddir / "interpret" / f"{sys.argv[4]}.json", "proposals": lambda: ddir / "proposals.json", "review": lambda: ddir / "review.json"}[stage]()
    if not target.exists():
        sys.exit(f"파일이 없다: {target}")
    try:
        load_json(target)
    except Exception as e:
        sys.exit(f"JSON으로 읽을 수 없다: {e}")
    if stage == "interpret":
        check_interpret(ddir, sys.argv[4])
    elif stage == "proposals":
        check_proposals(ddir)
    else:
        check_review(ddir)


if __name__ == "__main__":
    main()

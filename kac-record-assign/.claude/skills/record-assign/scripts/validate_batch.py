"""에이전트가 쓴 결과 파일의 형식을 검사한다. 오류가 없으면 'OK'를 출력하고 종료 코드 0을 낸다.

사용: python3 validate_batch.py {run} {assign|verify|arbitrate} {batch_id}
- assign: _workspace/{run}/results/{batch_id}.json     최상위 "results"
- verify: _workspace/{run}/verify/{batch_id}.json      최상위 "verdicts"
- arbitrate: _workspace/{run}/arbitrate/{batch_id}.json 최상위 "rulings" (검증에서 동의가 아닌 key만)
"""
import sys

from common import DATA, WORK, load_json

LEVELS = {"철": "F", "단위업무": "U", "부서공통": "C", "미배정": None}
CONF = {"높음", "보통", "낮음"}
UNASSIGNED = {"분류기준표에 해당 업무 없음", "제목 정보 부족", "기타"}
VERDICTS = {"동의", "불일치", "판단불가"}
DECISIONS = {"배정안 채택", "대안 채택", "제3안", "보류"}
STAGE = {"assign": ("results", "results"), "verify": ("verify", "verdicts"), "arbitrate": ("arbitrate", "rulings")}


def allowed_ids(batch, cls):
    """묶음 전체에서 쓸 수 있는 ID와 항목별 추가후보 ID."""
    base = set()
    for u in batch["부서후보"]:
        base.add(u["unit_id"])
        base.update(f["file_id"] for f in u["기록물철"])
    base.update(c["common_id"] for c in batch["부서공통후보"])
    per_item = {}
    for it in batch["items"]:
        ids = set()
        for f in it["추가후보"]:
            ids.update((f["file_id"], f["unit_id"]))
        per_item[it["key"]] = ids
    return base, per_item


def check_choice(r, key, base, per_item, errs, where):
    level, cid = r.get("level"), r.get("id")
    if level not in LEVELS:
        errs.append(f"{where} {key}: level은 {sorted(LEVELS)} 중 하나여야 한다 (현재 {level!r})")
        return
    if level == "미배정":
        if cid not in (None, ""):
            errs.append(f"{where} {key}: 미배정이면 id는 null이어야 한다")
        return
    if not isinstance(cid, str) or not cid.startswith(LEVELS[level]):
        errs.append(f"{where} {key}: level {level}의 id는 {LEVELS[level]}로 시작해야 한다 (현재 {cid!r})")
    elif cid not in base and cid not in per_item.get(key, set()):
        errs.append(f"{where} {key}: {cid}는 이 묶음의 후보(부서후보·부서공통후보·해당 항목의 추가후보)에 없다")


def main():
    run, stage, bid = sys.argv[1:4]
    run_dir = WORK / run
    batch = load_json(run_dir / "batches" / f"{bid}.json")
    cls = load_json(DATA / "classification.json")
    base, per_item = allowed_ids(batch, cls)
    keys = [it["key"] for it in batch["items"]]
    if stage not in STAGE:
        sys.exit(f"단계는 {sorted(STAGE)} 중 하나여야 한다")
    if stage == "arbitrate":
        vd = load_json(run_dir / "verify" / f"{bid}.json")["verdicts"]
        keys = [v["key"] for v in vd if v["verdict"] != "동의"]
    path = run_dir / STAGE[stage][0] / f"{bid}.json"
    if not path.exists():
        sys.exit(f"파일이 없다: {path}")
    try:
        data = load_json(path)
    except Exception as e:
        sys.exit(f"JSON으로 읽을 수 없다: {e}")
    errs = []
    rows = data.get(STAGE[stage][1])
    if not isinstance(rows, list):
        sys.exit(f"최상위에 '{STAGE[stage][1]}' 배열이 있어야 한다")
    got = [r.get("key") for r in rows]
    missing, extra = sorted(set(keys) - set(got)), sorted(set(got) - set(keys))
    if missing:
        errs.append(f"빠진 key: {missing}")
    if extra:
        errs.append(f"묶음에 없는 key: {extra}")
    if len(got) != len(set(got)):
        errs.append("중복된 key가 있다")
    for r in rows:
        key = r.get("key")
        if not str(r.get("reason", "")).strip():
            errs.append(f"{key}: reason이 비었다")
        if stage == "assign":
            check_choice(r, key, base, per_item, errs, "배정")
            if r.get("confidence") not in CONF:
                errs.append(f"{key}: confidence는 {sorted(CONF)} 중 하나여야 한다")
            if r.get("level") == "미배정" and r.get("unassigned_type") not in UNASSIGNED:
                errs.append(f"{key}: 미배정이면 unassigned_type을 {sorted(UNASSIGNED)} 중에서 적는다")
        elif stage == "arbitrate":
            if r.get("decision") not in DECISIONS:
                errs.append(f"{key}: decision은 {sorted(DECISIONS)} 중 하나여야 한다")
            elif r["decision"] != "보류":
                check_choice(r, key, base, per_item, errs, "중재")
        else:
            if r.get("verdict") not in VERDICTS:
                errs.append(f"{key}: verdict는 {sorted(VERDICTS)} 중 하나여야 한다")
            elif r["verdict"] == "불일치":
                check_choice(r, key, base, per_item, errs, "대안")
    if errs:
        print("\n".join(errs[:60]))
        sys.exit(1)
    print("OK", len(rows))


if __name__ == "__main__":
    main()

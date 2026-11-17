"""에이전트가 쓴 결과 파일의 형식을 검사한다. 오류가 없으면 'OK'를 출력하고 종료 코드 0을 낸다.

사용: python3 validate_batch.py {run} {blind|judge|challenge} {batch_id}
- blind: results/{batch_id}.json  {"batch_id", "results":[{key, level, id, confidence, reason, unassigned_type}]}
- judge: judge/{batch_id}.json    {"batch_id", "verdicts":[{item, verdict, level, id, reason}]}
- challenge: challenge/{batch_id}.json {"batch_id", "challenges":[{item, result, reason}]}
"""
import sys

from common import DATA, WORK, load_json, norm_unit

LEVELS = {"철": "F", "단위업무": "U", "부서공통": "C", "미배정": None}
CONF = {"높음", "보통", "낮음"}
UNASSIGNED = {"분류기준표에 해당 업무 없음", "제목 정보 부족", "기타"}
VERDICTS = {"기존 타당", "오류", "판단불가"}
CHALLENGE = {"반박 실패", "반박 성공", "판단불가"}
DIRS = {"blind": ("results", "results"), "judge": ("judge", "verdicts"), "challenge": ("challenge", "challenges")}


def allowed_ids(batch):
    base = set()
    for u in batch["부서후보"]:
        base.add(u["unit_id"])
        base.update(f["file_id"] for f in u["기록물철"])
    base.update(c["common_id"] for c in batch["부서공통후보"])
    per = {it["key"]: {x for f in it["추가후보"] for x in (f["file_id"], f["unit_id"])} for it in batch["items"]}
    return base, per


def check_choice(r, name, key, base, per, errs, allow_none):
    level, cid = r.get("level"), r.get("id")
    if level not in LEVELS or (level == "미배정" and not allow_none):
        errs.append(f"{name}: level은 {[k for k in LEVELS if allow_none or k != '미배정']} 중 하나여야 한다 (현재 {level!r})")
    elif level == "미배정":
        if cid not in (None, ""):
            errs.append(f"{name}: 미배정이면 id는 null이어야 한다")
    elif not isinstance(cid, str) or not cid.startswith(LEVELS[level]):
        errs.append(f"{name}: level {level}의 id는 {LEVELS[level]}로 시작해야 한다 (현재 {cid!r})")
    elif cid not in base and cid not in per.get(key, set()):
        errs.append(f"{name}: {cid}는 이 묶음의 후보(부서후보·부서공통후보·해당 제목의 추가후보)에 없다")


def main():
    run, stage, bid = sys.argv[1:4]
    run_dir = WORK / run
    batch = load_json(run_dir / "batches" / f"{bid}.json")
    base, per = allowed_ids(batch)
    sub, field = DIRS[stage]
    path = run_dir / sub / f"{bid}.json"
    if not path.exists():
        sys.exit(f"파일이 없다: {path}")
    try:
        rows = load_json(path).get(field)
    except Exception as e:
        sys.exit(f"JSON으로 읽을 수 없다: {e}")
    if not isinstance(rows, list):
        sys.exit(f"최상위에 '{field}' 배열이 있어야 한다")
    errs, idf = [], "key" if stage == "blind" else "item"
    if stage == "blind":
        want = [it["key"] for it in batch["items"]]
    else:
        cp = run_dir / "compare" / f"{bid}.json"
        if not cp.exists():
            sys.exit(f"compare.py를 먼저 실행한다: {cp}")
        cmp_items = {i["item"]: i for i in load_json(cp)["items"]}
        if stage == "judge":
            want = [k for k, v in cmp_items.items() if v["판정필요"]]
        else:
            jp = run_dir / "judge" / f"{bid}.json"
            if not jp.exists():
                sys.exit(f"판정 결과가 없다: {jp}")
            want = [v["item"] for v in load_json(jp)["verdicts"] if v.get("verdict") == "오류"]
    got = [r.get(idf) for r in rows]
    if sorted(set(want) - set(got)):
        errs.append(f"빠진 {idf}: {sorted(set(want) - set(got))}")
    if sorted(set(got) - set(want), key=str):
        errs.append(f"대상이 아닌 {idf}: {sorted(set(got) - set(want), key=str)}")
    if len(got) != len(set(got)):
        errs.append(f"중복된 {idf}가 있다")
    files = {f["file_id"]: f for f in load_json(DATA / "classification.json")["files"]}
    for r in rows:
        name = r.get(idf)
        if not str(r.get("reason", "")).strip():
            errs.append(f"{name}: reason이 비었다")
        if stage == "blind":
            check_choice(r, name, name, base, per, errs, True)
            if r.get("confidence") not in CONF:
                errs.append(f"{name}: confidence는 {sorted(CONF)} 중 하나여야 한다")
            if r.get("level") == "미배정" and r.get("unassigned_type") not in UNASSIGNED:
                errs.append(f"{name}: 미배정이면 unassigned_type을 {sorted(UNASSIGNED)} 중에서 적는다")
        elif stage == "judge":
            if r.get("verdict") not in VERDICTS:
                errs.append(f"{name}: verdict는 {sorted(VERDICTS)} 중 하나여야 한다")
            elif r["verdict"] == "오류" and name in cmp_items:
                n0 = len(errs)
                check_choice(r, name, cmp_items[name]["key"], base, per, errs, False)
                old = cmp_items[name]["기존분류"]
                if len(errs) == n0 and r["id"] == old.get("id"):
                    errs.append(f"{name}: 정정안이 기존 분류와 같다. 기존 분류가 맞으면 verdict를 '기존 타당'으로 적는다")
                elif len(errs) == n0 and old.get("구분") == "철" and r["level"] == "단위업무" and r["id"] == old.get("unit_id"):
                    errs.append(f"{name}: 정정안이 기존 철의 단위업무와 같다. 단위업무가 맞으면 '기존 타당' 또는 다른 철을 적는다")
        else:
            if r.get("result") not in CHALLENGE:
                errs.append(f"{name}: result는 {sorted(CHALLENGE)} 중 하나여야 한다")
    if errs:
        print("\n".join(errs[:60]))
        sys.exit(1)
    print("OK", len(rows))


if __name__ == "__main__":
    main()

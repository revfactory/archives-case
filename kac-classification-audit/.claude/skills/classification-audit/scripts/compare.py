"""독립 판단 결과와 기존 분류를 비교해 판정이 필요한 항목을 고른다.

사용: python3 compare.py {run} {batch_id}
입력: batches/{batch_id}.json, labels/{batch_id}.json, results/{batch_id}.json
산출물: _workspace/{run}/compare/{batch_id}.json
- 항목 ID는 '{key}-{기존 분류 번호}' 형식이다(예: k003-1). 같은 제목에 기존 분류가 여러 개면 항목도 여러 개다.
- '판정필요'가 true인 항목만 판정 에이전트가 다룬다.
"""
import sys

from common import DATA, WORK, cls_maps, dump_json, label_text, load_json, norm_unit


def build(run, bid):
    run_dir = WORK / run
    batch = load_json(run_dir / "batches" / f"{bid}.json")
    labels = load_json(run_dir / "labels" / f"{bid}.json")["items"]
    rp = run_dir / "results" / f"{bid}.json"
    if not rp.exists():
        return None
    res = {r["key"]: r for r in load_json(rp)["results"]}
    maps = cls_maps(load_json(DATA / "classification.json"))
    files, units, commons = maps
    items = []
    for it in batch["items"]:
        r = res.get(it["key"])
        if r is None:
            continue
        blind_unit = norm_unit(r["level"], r.get("id"), files)
        blind = {"level": r["level"], "id": r.get("id"), "confidence": r["confidence"], "reason": r["reason"]}
        if r["level"] == "철" and r["id"] in files:
            blind.update(단위업무명=files[r["id"]]["단위업무명"], 기록물철명=files[r["id"]]["기록물철명"], unit_id=blind_unit)
        elif r["level"] == "단위업무" and r["id"] in units:
            blind.update(단위업무명=units[r["id"]]["단위업무명"])
        elif r["level"] == "부서공통" and r["id"] in commons:
            blind.update(단위업무명=commons[r["id"]]["단위업무명"], 기록물철명=commons[r["id"]]["기록물철명"])
        for lb in labels[it["key"]]["labels"]:
            if lb["kind"] == "미대응":
                cmp_ = "기존 분류명 미대응"
            elif r["level"] == "미배정":
                cmp_ = "독립 판단 미배정"
            elif blind_unit != lb["unit"]:
                cmp_ = "단위업무 차이"
            elif lb["kind"] == "F" and r["level"] == "철" and r["id"] != lb["file"]:
                cmp_ = "철 차이"
            else:
                cmp_ = "일치"
            items.append({"item": f"{it['key']}-{lb['no']}", "key": it["key"], "제목": it["제목"], "문서구분": it["문서구분"],
                          "수신발신처_예": it["수신발신처_예"], "이_분류의_문서수": lb["n"],
                          "기존분류": label_text(maps, lb["kind"], lb["unit"], lb["file"]), "의심신호": lb["signals"],
                          "독립판단": blind, "비교": cmp_, "판정필요": cmp_ in ("단위업무 차이", "철 차이", "독립 판단 미배정")})
    return {"batch_id": bid, "부서명": batch["부서명"], "items": items}


def main():
    run, bid = sys.argv[1:3]
    out = build(run, bid)
    if out is None:
        sys.exit(f"독립 판단 결과가 없다: _workspace/{run}/results/{bid}.json")
    dump_json(WORK / run / "compare" / f"{bid}.json", out)
    need = [i["item"] for i in out["items"] if i["판정필요"]]
    print(f"항목 {len(out['items'])}건, 판정 필요 {len(need)}건: {need}")


if __name__ == "__main__":
    main()

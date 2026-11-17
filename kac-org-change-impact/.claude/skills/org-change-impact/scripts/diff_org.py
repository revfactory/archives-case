"""시행세칙 두 차수의 업무분장을 비교해 조직변경 후보를 뽑는다.

부서는 (기관, 부서명)으로 식별한다. 한쪽에만 있는 부서, 상위 조직이 바뀐 부서,
업무분장 항목이 추가·삭제·수정된 부서를 찾고, 삭제된 항목과 글자 구성이 비슷한
추가 항목이 다른 부서에 있으면 이관 후보로 적는다. 해석(신설·통합·분리 등 판정)은
org-change-interpreter 에이전트가 한다.

사용: python3 diff_org.py {run} 46 47
산출물: _workspace/{run}/01_org_diff.json
"""
import difflib
import re
import sys

from common import REG, WORK, dump_json, load_json


def norm(s):
    return re.sub(r"[\s․·・‧,.()]+", "", s)


def sim(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def key(d):
    return f"{d['기관']}|{d['부서명']}"


def main():
    run, old_rev, new_rev = sys.argv[1:4]
    for r in (old_rev, new_rev):
        if not (REG / f"조직_{r}차.json").exists():
            sys.exit(f"조직_{r}차.json이 없다. extract_hwpx.py와 parse_org.py {r}를 먼저 실행한다.")
    old = {key(d): d for d in load_json(REG / f"조직_{old_rev}차.json")}
    new = {key(d): d for d in load_json(REG / f"조직_{new_rev}차.json")}
    removed_depts = [old[k] for k in old if k not in new]
    added_depts = [new[k] for k in new if k not in old]

    removed_items, added_items, changed, moved_parent = [], [], [], []
    for k in old:
        if k not in new:
            removed_items += [(k, t) for t in old[k]["업무"]]
            continue
        o, n = old[k], new[k]
        if o["경로"] != n["경로"]:
            moved_parent.append({"부서": k, "이전경로": o["경로"], "변경경로": n["경로"]})
        o_only = [t for t in o["업무"] if norm(t) not in {norm(x) for x in n["업무"]}]
        n_only = [t for t in n["업무"] if norm(t) not in {norm(x) for x in o["업무"]}]
        edits = []
        for t in list(o_only):
            best = max(n_only, key=lambda x: sim(t, x), default=None)
            if best and sim(t, best) >= 0.6:
                edits.append({"이전": t, "변경": best})
                o_only.remove(t)
                n_only.remove(best)
        if o_only or n_only or edits:
            changed.append({"부서": k, "경로": n["경로"], "삭제항목": o_only, "추가항목": n_only, "문구수정": edits})
        removed_items += [(k, t) for t in o_only]
        added_items += [(k, t) for t in n_only]
    for d in added_depts:
        added_items += [(key(d), t) for t in d["업무"]]

    transfers = []
    for src, t in removed_items:
        cands = sorted(((sim(t, x), dst, x) for dst, x in added_items if dst != src), reverse=True)[:1]
        if cands and cands[0][0] >= 0.6:
            s, dst, x = cands[0]
            transfers.append({"업무": t, "이전부서": src, "변경부서": dst, "변경후문구": x, "유사도": round(s, 2)})

    def similar_depts(d, pool):
        out = []
        for p in pool:
            hit = sum(1 for t in d["업무"] if any(sim(t, x) >= 0.6 for x in p["업무"]))
            if hit:
                out.append({"부서": key(p), "겹치는_업무항목수": hit, "전체": len(d["업무"])})
        return sorted(out, key=lambda x: -x["겹치는_업무항목수"])[:5]

    result = {
        "비교": f"시행세칙 {old_rev}차 → {new_rev}차",
        "부서수": {"이전": len(old), "변경": len(new)},
        "없어진_부서": [{**d, "업무를_받은_것으로_보이는_부서": similar_depts(d, list(new.values()))} for d in removed_depts],
        "새로_생긴_부서": [{**d, "업무를_넘긴_것으로_보이는_부서": similar_depts(d, list(old.values()))} for d in added_depts],
        "상위조직이_바뀐_부서": moved_parent,
        "업무분장이_바뀐_부서": changed,
        "이관_후보_항목": transfers,
    }
    dump_json(WORK / run / "01_org_diff.json", result)
    print(f"{result['비교']}: 없어진 부서 {len(removed_depts)}, 새로 생긴 부서 {len(added_depts)}, 상위조직 변경 {len(moved_parent)}, "
          f"업무분장 변경 부서 {len(changed)}, 이관 후보 항목 {len(transfers)}")
    for d in removed_depts:
        print("  없어짐:", key(d), "→", [x["부서"] for x in result["없어진_부서"][removed_depts.index(d)]["업무를_받은_것으로_보이는_부서"][:2]])
    for d in added_depts:
        print("  새로 생김:", key(d), "←", [x["부서"] for x in result["새로_생긴_부서"][added_depts.index(d)]["업무를_넘긴_것으로_보이는_부서"][:2]])


if __name__ == "__main__":
    main()

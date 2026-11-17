"""분류기준표의 (부서레벨1, 부서레벨2)를 시행세칙 업무분장의 부서(기관|부서명)에 대응시킨다.

이름의 공백을 없애고 비교하며, 표기가 다른 부서는 data/org_alias.json으로 맞춘다.
'인사부/ 노사협력부'처럼 여러 부서를 함께 적은 칸은 각각 대응시킨다.

사용: python3 build_org_link.py 47
산출물: _workspace/_regulations/분류기준표_직제대응_{차수}차.json
"""
import re
import sys

from common import DATA, REG, ROOT, dump_json, load_json


def norm(s):
    return re.sub(r"\s+", "", s)


def main():
    rev = sys.argv[1]
    org = load_json(REG / f"조직_{rev}차.json")
    alias = load_json(ROOT / "data" / "org_alias.json")
    cls = load_json(DATA / "classification.json")
    pairs = sorted({(f["부서1"], f["부서2"]) for f in cls["files"]})
    links, unmatched = [], []
    for d1, d2 in pairs:
        ctx = alias["부서1기관"].get(d1, {"기관": "본사", "상위": d1})
        if d2 in alias.get("부서2다중", {}):
            parts = alias["부서2다중"][d2]
        else:
            parts = [p.strip() for p in re.split(r"[/,]", d2) if p.strip()] if d2 != d1 else [d2]
        keys, miss = [], []
        for part in parts:
            if part in alias["직제에_없음"]:
                miss.append(f"{part}(세칙 {rev}차 업무분장에 없음)")
                continue
            name = norm(alias["부서2별칭"].get(part, part))
            cands = [o for o in org if o["기관"] == ctx["기관"] and norm(o["부서명"]) == name]
            if ctx["상위"]:
                narrowed = [o for o in cands if norm(ctx["상위"]) in [norm(p) for p in o["경로"]]]
                cands = narrowed or cands
            if not cands and d2 == d1:      # 부 없이 실·센터 단위로 적힌 경우
                cands = [o for o in org if o["기관"] == ctx["기관"] and norm(d1) in [norm(p) for p in o["경로"]]]
            if cands:
                keys += [f"{o['기관']}|{o['부서명']}" for o in cands]
            else:
                miss.append(part)
        links.append({"부서1": d1, "부서2": d2, "직제부서": sorted(set(keys)), "대응실패": miss})
        if miss:
            unmatched.append(f"{d1} / {d2}: {miss}")
    used = {k for l in links for k in l["직제부서"]}
    not_in_table = [f"{o['기관']}|{' > '.join(o['경로'])}" for o in org if f"{o['기관']}|{o['부서명']}" not in used]
    dump_json(REG / f"분류기준표_직제대응_{rev}차.json", {"차수": int(rev), "links": links, "분류기준표에_항목이_없는_직제부서": not_in_table})
    print(f"분류기준표 부서 표기 {len(pairs)}개 중 대응 성공 {sum(1 for l in links if l['직제부서'] and not l['대응실패'])}개")
    print("대응 실패:", *unmatched, sep="\n  ")
    print(f"분류기준표에 항목이 없는 직제 부서 {len(not_in_table)}개:", *not_in_table[:60], sep="\n  ")


if __name__ == "__main__":
    main()

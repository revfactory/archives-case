"""시험 자료의 정답(answer.csv)과 대조해 탐지 성능을 계산한다. 시험 자료로 만든 실행에만 쓴다.

사용: python3 evaluate.py {run} [--answer _workspace/testdata/answer.csv]
- 선별 단계: 주입한 오류 가운데 의심 신호가 붙은 비율(선별 재현율), 주입하지 않은 문서 가운데 신호가 붙은 비율.
- 최종 단계(output/{run}/점검결과.csv가 있을 때): 주입한 오류 가운데 '정정 권고'가 된 비율, 정정안이 기본 분류와 같은 비율,
  주입하지 않은 문서에 나온 '정정 권고' 수.
주의: 기본 분류는 글자 유사도로 붙인 것이라 틀릴 수 있다. 주입하지 않은 문서의 '정정 권고'를 모두 오탐으로 보면 안 되고 사람이 표본을 확인한다.
"""
import argparse
import collections
import csv
import sqlite3

from common import DATA, OUT, WORK, load_json


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run")
    ap.add_argument("--answer", default=str(WORK / "testdata" / "answer.csv"))
    a = ap.parse_args()
    ans = {r["문서번호"]: r for r in csv.DictReader(open(a.answer, encoding="utf-8-sig"))}
    con = sqlite3.connect(WORK / a.run / "records.sqlite")
    rows = con.execute("""select r.문서번호, g.score, g.signals from records r join groups g
        on g.부서명=r.부서명 and g.제목키=r.제목키 and g.label_kind=r.label_kind and g.label_unit=r.label_unit and g.label_file=r.label_file""").fetchall()
    c = collections.Counter()
    by_type = collections.defaultdict(collections.Counter)
    for no, score, _ in rows:
        t = ans[no]["주입유형"]
        inj = t != "주입 안 함"
        c[("주입", score > 0) if inj else ("정상", score > 0)] += 1
        by_type[t][score > 0] += 1
    inj, ok = c[("주입", True)] + c[("주입", False)], c[("정상", True)] + c[("정상", False)]
    print("## 선별 단계")
    print(f"주입한 오류 {inj}건 가운데 의심 신호 {c[('주입', True)]}건 (선별 재현율 {c[('주입', True)] / max(inj, 1):.1%})")
    print(f"주입하지 않은 문서 {ok}건 가운데 의심 신호 {c[('정상', True)]}건 ({c[('정상', True)] / max(ok, 1):.1%})")
    for t, v in by_type.items():
        print(f"  - {t}: {v[True]}/{v[True] + v[False]}건에 신호")
    p = OUT / a.run / "점검결과.csv"
    if not p.exists():
        print("\n최종 단계: 점검결과.csv가 없어 계산하지 않았다(merge_results.py 실행 뒤 다시 실행).")
        return
    units = {u["unit_id"]: u for u in load_json(DATA / "classification.json")["units"]}
    files = {f["file_id"]: f for f in load_json(DATA / "classification.json")["files"]}
    f = collections.Counter()
    for r in csv.DictReader(open(p, encoding="utf-8-sig")):
        t = ans[r["문서번호"]]
        kind = "주입" if t["주입유형"] != "주입 안 함" else "정상"
        f[(kind, r["최종구분"])] += 1
        if kind == "주입" and r["최종구분"] == "정정 권고":
            fix = r["정정안_ID"]
            fix_unit = files[fix]["unit_id"] if fix in files else fix
            f["정정안=기본분류"] += fix_unit == t["기본_unit_id"]
    print("\n## 최종 단계(점검한 문서만)")
    for kind in ("주입", "정상"):
        print(f"{kind}: " + ", ".join(f"{k} {f[(kind, k)]}건" for k in ("정정 권고", "유지", "사람 확인 필요")))
    print(f"주입한 오류의 정정 권고 가운데 정정안이 기본 분류의 단위업무와 같은 건: {f['정정안=기본분류']}건")


if __name__ == "__main__":
    main()

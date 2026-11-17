"""독립 판단·판정·반박 검증 결과를 합쳐 최종 구분을 정하고 결과표와 요약을 만든다.

최종 구분
- 유지: 독립 판단이 기존 분류와 일치하거나, 판정이 '기존 타당'.
- 정정 권고: 판정이 '오류'이고 반박 검증이 '반박 실패'.
- 사람 확인 필요: 판정 '판단불가', 반박 '반박 성공'·'판단불가', 기존 분류명이 분류기준표에 없음, 단계 결과 누락.

사용: python3 merge_results.py {run}
산출물: output/{run}/점검결과.csv(문서 1건당 1행), 정정안.csv, 사람확인.csv(둘 다 제목·기존 분류 묶음 단위), 요약.md
"""
import collections
import csv
import sqlite3
import sys

import compare
from common import DATA, OUT, WORK, cls_maps, load_json


def main():
    run = sys.argv[1]
    run_dir, out_dir = WORK / run, OUT / run
    out_dir.mkdir(parents=True, exist_ok=True)
    man = load_json(run_dir / "manifest.json")
    files, units, commons = cls_maps(load_json(DATA / "classification.json"))
    con = sqlite3.connect(run_dir / "records.sqlite")

    def describe(level, cid):
        if level == "철" and cid in files:
            f = files[cid]
            return [f"{f['부서1']} {f['부서2']}", f["단위업무명"], f["기록물철명"]]
        if level == "단위업무" and cid in units:
            u = units[cid]
            return [f"{u['부서1']} {u['부서2']}", u["단위업무명"], ""]
        if level == "부서공통" and cid in commons:
            return ["부서공통", commons[cid]["단위업무명"], commons[cid]["기록물철명"]]
        return ["", "", ""]

    stat, stat_docs, sig_stat, missing, grp_rows = collections.Counter(), collections.Counter(), collections.Counter(), [], []
    control = collections.Counter()
    fp = open(out_dir / "점검결과.csv", "w", newline="", encoding="utf-8-sig")
    w = csv.writer(fp)
    tail_head = ["최종구분", "세부사유", "의심신호", "독립판단_수준", "독립판단_ID", "독립판단_단위업무명", "독립판단_기록물철명", "독립판단_확신도",
                 "판정", "판정근거", "정정안_수준", "정정안_ID", "정정안_부서", "정정안_단위업무명", "정정안_기록물철명", "반박검증", "반박검증_의견"]
    w.writerow(["행번호", "부서명", "문서구분", "등록일자", "문서번호", "제목", "기존_단위업무명", "기존_기록물철명", *tail_head])
    for b in man["batches"]:
        bid = b["batch_id"]
        cmp_ = compare.build(run, bid)
        if cmp_ is None:
            missing.append(f"{bid}({b['부서명']}, 제목 {b['items']}건): 독립 판단 결과 없음 → 이번 결과표에서 빠짐")
            continue
        labels = load_json(run_dir / "labels" / f"{bid}.json")["items"]
        jp, cp = run_dir / "judge" / f"{bid}.json", run_dir / "challenge" / f"{bid}.json"
        judge = {v["item"]: v for v in load_json(jp)["verdicts"]} if jp.exists() else {}
        chal = {v["item"]: v for v in load_json(cp)["challenges"]} if cp.exists() else {}
        need = [i for i in cmp_["items"] if i["판정필요"]]
        if need and not jp.exists():
            missing.append(f"{bid}({b['부서명']}): 판정 결과 없음 → 판정 필요 {len(need)}건을 '사람 확인 필요'로 둠")
        for it in cmp_["items"]:
            lab_item = labels[it["key"]]
            lb = next(x for x in lab_item["labels"] if f"{it['key']}-{x['no']}" == it["item"])
            j, c, bl = judge.get(it["item"]), chal.get(it["item"]), it["독립판단"]
            fix = ["", "", "", "", ""]
            if it["비교"] == "일치":
                final, why = "유지", "독립 판단과 일치"
            elif it["비교"] == "기존 분류명 미대응":
                final, why = "사람 확인 필요", "기존 분류명이 분류기준표에 없음(독립 판단을 참고안으로 제시)"
            elif j is None:
                final, why = "사람 확인 필요", "판정 결과 누락"
            elif j["verdict"] == "기존 타당":
                final, why = "유지", "판정에서 기존 분류가 타당하다고 봄"
            elif j["verdict"] == "판단불가":
                final, why = "사람 확인 필요", "판정 판단불가"
            else:
                fix = [j["level"], j["id"], *describe(j["level"], j["id"])]
                if c is None:
                    final, why = "사람 확인 필요", "반박 검증 결과 누락"
                elif c["result"] == "반박 실패":
                    final, why = "정정 권고", "오류 판정이 반박 검증을 통과"
                elif c["result"] == "반박 성공":
                    final, why = "사람 확인 필요", "반박 검증에서 기존 분류가 타당할 근거가 나옴"
                else:
                    final, why = "사람 확인 필요", "반박 검증 판단불가"
            sig = "; ".join(f"{s['신호']} {s['설명']}" for s in it["의심신호"])
            tail = [final, why, sig, bl["level"], bl.get("id") or "", bl.get("단위업무명", ""), bl.get("기록물철명", ""), bl["confidence"],
                    j["verdict"] if j else "", j["reason"] if j else "", *fix, c["result"] if c else "", c["reason"] if c else ""]
            docs = con.execute("""select rec_id, 부서명, 문서구분, 등록일자, 문서번호, 제목, 기존_단위업무명, 기존_기록물철명 from records
                where 부서명=? and 제목키=? and label_kind=? and label_unit=? and label_file=? order by rec_id""",
                               (cmp_["부서명"], lab_item["제목키"], lb["kind"], lb["unit"], lb["file"])).fetchall()
            for d in docs:
                w.writerow([*d, *tail])
            stat[final] += 1
            stat_docs[final] += len(docs)
            if lab_item["대조표본"]:
                control[final] += 1
            for s in it["의심신호"]:
                sig_stat[(s["신호"], final)] += 1
            if final != "유지" and docs:
                grp_rows.append([cmp_["부서명"], it["제목"], len(docs), docs[0][6], docs[0][7], *tail])
    fp.close()
    head = ["부서명", "대표제목", "문서수", "기존_단위업무명", "기존_기록물철명", *tail_head]
    for name, kind in (("정정안.csv", "정정 권고"), ("사람확인.csv", "사람 확인 필요")):
        with open(out_dir / name, "w", newline="", encoding="utf-8-sig") as f2:
            w2 = csv.writer(f2)
            w2.writerow(head)
            w2.writerows(sorted((r for r in grp_rows if r[5] == kind), key=lambda r: -r[2]))

    total_docs = con.execute("select count(*) from records").fetchone()[0]
    scr = load_json(run_dir / "screen_summary.json")
    total = sum(stat.values())
    lines = [f"# 분류 점검 결과 요약: {run}", "",
             f"- 입력 문서 {total_docs:,}건, 의심 신호가 있는 묶음 {scr['의심_묶음수']:,}개(문서 {scr['의심_문서수']:,}건)",
             f"- 이번까지 점검한 묶음(제목·기존 분류 단위) {total:,}개, 문서 {sum(stat_docs.values()):,}건",
             f"- 아직 점검하지 않은 의심 제목 {man.get('남은_의심_제목수', 0):,}건",
             "- 의심 신호가 없는 문서는 점검하지 않았다. 이 문서들에 오류가 없다는 뜻이 아니다.", "",
             "## 최종 구분", "", "| 최종 구분 | 묶음 수 | 문서 수 |", "| --- | ---: | ---: |"]
    lines += [f"| {k} | {stat[k]:,} | {stat_docs[k]:,} |" for k in ("정정 권고", "유지", "사람 확인 필요") if stat[k]]
    lines += ["", "## 의심 신호별 최종 구분(묶음 수)", "", "| 신호 | 정정 권고 | 유지 | 사람 확인 필요 |", "| --- | ---: | ---: | ---: |"]
    for s in ("S1", "S2", "S3", "S4"):
        lines.append(f"| {s} | {sig_stat[(s, '정정 권고')]} | {sig_stat[(s, '유지')]} | {sig_stat[(s, '사람 확인 필요')]} |")
    if control:
        lines += ["", f"## 대조 표본(의심 신호 없는 제목) 결과: {dict(control)}", "",
                  "대조 표본에서 정정 권고가 나오면 선별 기준이 놓치는 오류가 있다는 뜻이므로 screen.py의 기준을 낮춰 다시 선별한다."]
    if missing:
        lines += ["", "## 누락", ""] + [f"- {m}" for m in missing]
    (out_dir / "요약.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

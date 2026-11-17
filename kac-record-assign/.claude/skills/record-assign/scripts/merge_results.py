"""배정 결과와 검증 결과를 합쳐 문서 단위 결과표와 요약을 만든다.

사용: python3 merge_results.py {run}
산출물
- output/{run}/배정결과.csv (문서 1건당 1행, 엑셀에서 열 수 있는 UTF-8 BOM)
- output/{run}/검토필요.csv (고유 제목 단위, 사람이 확인할 항목)
- output/{run}/배정결과.xlsx (문서 수가 20만 건 이하일 때만)
- output/{run}/요약.md
- output/ledger.json (확정된 (부서명|문서구분|제목키) 누적 기록. 다음 실행에서 제외하는 데 쓴다)
"""
import collections
import csv
import sqlite3
import sys

from common import DATA, OUT, WORK, dump_json, load_json


def main():
    run = sys.argv[1]
    run_dir, out_dir = WORK / run, OUT / run
    out_dir.mkdir(parents=True, exist_ok=True)
    man = load_json(run_dir / "manifest.json")
    cls = load_json(DATA / "classification.json")
    files = {f["file_id"]: f for f in cls["files"]}
    units = {u["unit_id"]: u for u in cls["units"]}
    commons = {c["common_id"]: c for c in cls["commons"]}
    ledger = load_json(OUT / "ledger.json") if (OUT / "ledger.json").exists() else {}

    def describe(level, cid):
        if level == "철" and cid in files:
            f = files[cid]
            return [f["부서1"], f["부서2"], f["단위업무명"], f["기록물철명"], f["보존기간"]]
        if level == "단위업무" and cid in units:
            u = units[cid]
            return [u["부서1"], u["부서2"], u["단위업무명"], "", ""]
        if level == "부서공통" and cid in commons:
            c = commons[cid]
            return ["부서공통", "", c["단위업무명"], c["기록물철명"], ""]
        return ["", "", "", "", ""]

    cond = man["조건"]
    where, params = ["부서명 = ?", "제목키 = ?", "문서구분 = ?"], []
    for col, vals in (("연도", cond["year"]),):
        if vals:
            where.append(f"{col} in ({','.join('?' * len(vals))})")
            params += vals
    if cond["contains"]:
        where.append("제목 like ?")
        params.append(f"%{cond['contains']}%")
    con = sqlite3.connect(DATA / "production.sqlite")
    sql = f"select doc_id, 연도, 부서명, 문서구분, 등록일자, 문서번호, 제목 from docs where {' and '.join(where)} order by doc_id"

    stat = collections.Counter()
    level_docs = collections.Counter()
    unassigned = collections.Counter()
    missing_batches, review_rows, n_docs = [], [], 0
    with open(out_dir / "배정결과.csv", "w", newline="", encoding="utf-8-sig") as fp:
        w = csv.writer(fp)
        w.writerow(["doc_id", "연도", "부서명", "문서구분", "등록일자", "문서번호", "제목", "상태", "배정수준", "배정ID",
                    "분류_부서1", "분류_부서2", "단위업무명", "기록물철명", "보존기간", "확신도", "배정근거",
                    "검증판정", "검증의견", "검증대안수준", "검증대안ID"])
        for b in man["batches"]:
            bid = b["batch_id"]
            batch = load_json(run_dir / "batches" / f"{bid}.json")
            rp, vp = run_dir / "results" / f"{bid}.json", run_dir / "verify" / f"{bid}.json"
            if not rp.exists():
                missing_batches.append(f"{bid}({b['부서명']}, {b['items']}건): 배정 결과 없음")
                continue
            res = {r["key"]: r for r in load_json(rp)["results"]}
            ver = {v["key"]: v for v in load_json(vp)["verdicts"]} if vp.exists() else {}
            if not vp.exists():
                missing_batches.append(f"{bid}({b['부서명']}): 검증 결과 없음 → 상태 '미검증'")
            ap = run_dir / "arbitrate" / f"{bid}.json"
            arb = {x["key"]: x for x in load_json(ap)["rulings"]} if ap.exists() else {}
            for it in batch["items"]:
                r, v, x = res.get(it["key"]), ver.get(it["key"]), arb.get(it["key"])
                if r is None:
                    stat["결과 누락"] += 1
                    continue
                if v is None:
                    status = "미검증"
                elif v["verdict"] == "동의":
                    status = "확정" if r["confidence"] != "낮음" else "검토필요(확신 낮음)"
                elif x and x["decision"] != "보류":
                    status = "확정(중재)"
                elif v["verdict"] == "불일치":
                    status = "검토필요(검증 불일치)"
                else:
                    status = "검토필요(검증 판단불가)"
                # 중재로 확정된 건은 중재 결과를 최종 배정으로 쓰고, 처음 배정안은 근거 열에 남긴다.
                first = f"{r['level']} {r.get('id') or ''}".strip()
                if status == "확정(중재)":
                    r = dict(r, level=x["level"], id=x.get("id"), confidence="중재 결정", reason=f"[중재: {x['decision']}] {x['reason']} / [처음 배정안: {first}] {r['reason']}")
                elif x:
                    r = dict(r, reason=f"{r['reason']} / [중재 보류] {x['reason']}")
                tail = [status, r["level"], r.get("id") or "", *describe(r["level"], r.get("id")), r["confidence"],
                        r["reason"] + (f" [미배정 유형: {r.get('unassigned_type')}]" if r["level"] == "미배정" else ""),
                        v["verdict"] if v else "", v.get("reason", "") if v else "",
                        v.get("level", "") if v and v["verdict"] == "불일치" else "", (v.get("id") or "") if v and v["verdict"] == "불일치" else ""]
                docs = con.execute(sql, [batch["부서명"], it["제목키"], it["문서구분"], *params]).fetchall()
                for d in docs:
                    w.writerow([*d, *tail])
                n_docs += len(docs)
                stat[status] += 1
                level_docs[(status.split("(")[0], r["level"])] += len(docs)
                if r["level"] == "미배정":
                    unassigned[r.get("unassigned_type")] += len(docs)
                lk = f"{batch['부서명']}|{it['문서구분']}|{it['제목키']}"
                if status.startswith("확정"):
                    ledger[lk] = {"level": r["level"], "id": r.get("id"), "run": run}
                else:
                    review_rows.append([batch["부서명"], it["제목"], len(docs), *tail])
    with open(out_dir / "검토필요.csv", "w", newline="", encoding="utf-8-sig") as fp:
        w = csv.writer(fp)
        w.writerow(["부서명", "대표제목", "문서수", "상태", "배정수준", "배정ID", "분류_부서1", "분류_부서2", "단위업무명", "기록물철명",
                    "보존기간", "확신도", "배정근거", "검증판정", "검증의견", "검증대안수준", "검증대안ID"])
        w.writerows(sorted(review_rows, key=lambda x: -x[2]))
    dump_json(OUT / "ledger.json", ledger)
    if n_docs <= 200_000:
        import openpyxl
        wb = openpyxl.Workbook(write_only=True)
        for name in ("배정결과", "검토필요"):
            ws = wb.create_sheet(name)
            with open(out_dir / f"{name}.csv", encoding="utf-8-sig", newline="") as fp:
                for row in csv.reader(fp):
                    ws.append(row)
        wb.save(out_dir / "배정결과.xlsx")

    total = sum(stat.values())
    lines = [f"# 배정 결과 요약: {run}", "",
             f"- 조건: {cond}",
             f"- 범위 안 문서 {man['범위_문서수']:,}건, 고유 제목 {man['범위_고유제목수']:,}건 (이전 실행에서 확정되어 제외 {man['기확정_제외']:,}건)",
             f"- 이번에 판단한 고유 제목 {total:,}건, 결과표에 실린 문서 {n_docs:,}건",
             f"- 아직 판단하지 않은 고유 제목 {man['남은_고유제목수']:,}건", "",
             "## 상태별 고유 제목 수", "", "| 상태 | 고유 제목 수 | 비율 |", "| --- | ---: | ---: |"]
    for k, v in stat.most_common():
        lines.append(f"| {k} | {v:,} | {v / total:.1%} |" if total else f"| {k} | {v} | - |")
    lines += ["", "## 상태·배정수준별 문서 수", "", "| 상태 | 배정수준 | 문서 수 |", "| --- | --- | ---: |"]
    for (s, lv), v in sorted(level_docs.items()):
        lines.append(f"| {s} | {lv} | {v:,} |")
    if unassigned:
        lines += ["", "## 미배정 유형별 문서 수", "", "| 유형 | 문서 수 |", "| --- | ---: |"]
        lines += [f"| {k} | {v:,} |" for k, v in unassigned.most_common()]
    if missing_batches:
        lines += ["", "## 누락", ""] + [f"- {m}" for m in missing_batches]
    if man["대응표에_없는_부서"]:
        lines += ["", f"## 부서 대응표에 없는 부서: {man['대응표에_없는_부서']}"]
    (out_dir / "요약.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

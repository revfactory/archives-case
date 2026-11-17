"""부서별 제안과 검토 결과를 합쳐 제안표와 요약을 만든다.

사용: python3 build_report.py {run}
산출물: output/{run}/단위업무_제안표.xlsx (요약 시트 + 부서별 시트 + 보류 군집 시트)
        output/{run}/단위업무_제안표.csv (전체 부서, UTF-8 BOM), output/{run}/요약.md
"""
import collections
import csv
import sys

import openpyxl
from openpyxl.styles import Alignment, Font

from common import OUT, WORK, load_json

HEAD = ["부서명", "제안ID", "유형", "기존 단위업무명", "제안 단위업무명", "제안 소기능", "기록물철 초안", "기록물철 설명 초안",
        "보존기간 제안", "근거 문서 수", "근거 군집", "대표 제목", "사유", "확신도", "검토 판정", "검토 의견"]
ORDER = {"신설": 0, "초안": 0, "개명": 1, "통합·폐지 검토": 2, "유지": 3}


def main():
    run = sys.argv[1]
    run_dir, out_dir = WORK / run, OUT / run
    out_dir.mkdir(parents=True, exist_ok=True)
    man = load_json(run_dir / "manifest.json")
    wb = openpyxl.Workbook()
    ws_sum = wb.active
    ws_sum.title = "요약"
    ws_sum.append(["부서명", "모드", "전체 문서 수", "공통 수신 문서 수", "제시 군집 문서 수", "제시 군집 비율", "신설·초안", "개명", "통합·폐지 검토", "유지", "보류 군집", "검토 미통과", "비고"])
    all_rows, held_rows, lines, missing = [], [], [f"# 단위업무명 제안 요약: {run}", ""], []
    for d in man["depts"]:
        dept = d["부서명"]
        ddir = run_dir / dept
        if not (ddir / "proposals.json").exists():
            missing.append(f"{dept}: 제안 파일 없음")
            ws_sum.append([dept, d["모드"], d["전체_문서수"], d["공통수신_문서수"], d["제시군집_문서수"], "", "", "", "", "", "", "", "제안 파일 없음"])
            continue
        clusters = {c["cluster_id"]: c for c in load_json(ddir / "clusters.json")["clusters"]}
        units = {u["unit_id"]: u for u in load_json(ddir / "existing_units.json")["units"]}
        data = load_json(ddir / "proposals.json")
        review = {r["proposal_id"]: r for r in load_json(ddir / "review.json")["reviews"]} if (ddir / "review.json").exists() else {}
        if not review:
            missing.append(f"{dept}: 검토 결과 없음 → 검토 판정 '미검토'")
        cnt, rows = collections.Counter(), []
        for p in sorted(data["proposals"], key=lambda p: (ORDER.get(p["유형"], 9), -sum(clusters[c]["문서수"] for c in p.get("근거_cluster_ids") or [] if c in clusters))):
            cids = [c for c in p.get("근거_cluster_ids") or [] if c in clusters]
            rv = review.get(p["proposal_id"])
            verdict = rv["판정"] if rv else "미검토"
            old = units.get(p.get("기존_unit_id") or p.get("준용_unit_id") or "", {}).get("단위업무명", "")
            if p["유형"] == "초안" and old:
                old = f"(준용 참고) {old}"
            files = p.get("기록물철_초안") or []
            rows.append([dept, p["proposal_id"], p["유형"], old, p.get("제안_단위업무명", ""), p.get("제안_소기능", ""),
                         "\n".join(f["기록물철명"] for f in files), "\n".join(f"{f['기록물철명']}: {f['설명']}" for f in files),
                         p.get("보존기간_제안", ""), sum(clusters[c]["문서수"] for c in cids), ", ".join(cids),
                         "\n".join(p.get("대표제목") or []), p["사유"], p["확신도"], verdict,
                         "\n".join((rv.get("지적") or []) + ([f"수정안: {rv['수정안']}"] if rv.get("수정안") else [])) if rv else ""])
            cnt[p["유형"]] += 1
            if verdict in ("수정필요", "기각"):
                cnt["미통과"] += 1
        ws = wb.create_sheet(dept[:31])
        ws.append(HEAD)
        for r in rows:
            ws.append(r)
        for h in data["보류"]:
            c = clusters.get(h["cluster_id"], {})
            held_rows.append([dept, h["cluster_id"], c.get("종류", ""), c.get("문서수", ""), "\n".join(t["제목"] for t in c.get("대표제목", [])[:4]), h["사유"]])
        all_rows += rows
        ratio = d["제시군집_문서수"] / d["군집대상_문서수"] if d["군집대상_문서수"] else 0
        ws_sum.append([dept, d["모드"], d["전체_문서수"], d["공통수신_문서수"], d["제시군집_문서수"], f"{ratio:.0%}", cnt["신설"] + cnt["초안"], cnt["개명"],
                       cnt["통합·폐지 검토"], cnt["유지"], len(data["보류"]), cnt["미통과"], d["부서대응"].get("비고", "")])
        lines += [f"## {dept} ({d['모드']} 모드)", "",
                  f"- 문서 {d['전체_문서수']:,}건 가운데 공통 수신 {d['공통수신_문서수']:,}건을 뺀 뒤, 상위 군집 {d['제시군집_수']}개(문서 {d['제시군집_문서수']:,}건, 군집 대상의 {ratio:.0%})를 분석했다.",
                  f"- 분석하지 않은 소규모 군집 문서: {d['소규모군집_문서수']:,}건",
                  f"- 제안: 신설·초안 {cnt['신설'] + cnt['초안']}건, 개명 {cnt['개명']}건, 통합·폐지 검토 {cnt['통합·폐지 검토']}건, 유지 {cnt['유지']}건, 보류 군집 {len(data['보류'])}개",
                  f"- 검토를 통과하지 못한 제안: {cnt['미통과']}건", ""]
        top = [r for r in rows if r[2] in ("신설", "초안", "개명")][:10]
        if top:
            lines += ["| 유형 | 기존 단위업무명 | 제안 단위업무명 | 근거 문서 수 | 검토 판정 |", "| --- | --- | --- | ---: | --- |"]
            lines += [f"| {r[2]} | {r[3]} | {r[4]} | {r[9]:,} | {r[14]} |" for r in top] + [""]
    ws_h = wb.create_sheet("보류 군집")
    ws_h.append(["부서명", "군집", "종류", "문서 수", "대표 제목", "보류 사유"])
    for r in held_rows:
        ws_h.append(r)
    for ws in wb.worksheets:
        for c in ws[1]:
            c.font = Font(bold=True)
        for row in ws.iter_rows(min_row=2):
            for c in row:
                c.alignment = Alignment(wrap_text=True, vertical="top")
        for i, col in enumerate(ws.columns, start=1):
            ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = min(50, max(10, max(len(str(c.value or "").split("\n")[0]) for c in col) * 1.6))
        ws.freeze_panes = "A2"
    wb.save(out_dir / "단위업무_제안표.xlsx")
    with open(out_dir / "단위업무_제안표.csv", "w", newline="", encoding="utf-8-sig") as fp:
        w = csv.writer(fp)
        w.writerow(HEAD)
        w.writerows(all_rows)
    if missing:
        lines += ["## 누락", ""] + [f"- {m}" for m in missing]
    (out_dir / "요약.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    print(f"산출물: {out_dir}")


if __name__ == "__main__":
    main()

"""사건별 제안과 검증 결과를 합쳐 분류기준표 변경안과 영향도 집계를 만든다.

사용: python3 build_change_table.py {run}
입력: _workspace/{run}/02_changes.json, 03_candidates/, 04_proposals/, 05_verify/
산출물 (output/{run}/)
- 분류기준표_변경안.csv        영향을 받는 기록물철 1건당 1행(변경 전·후, 조치, 근거, 검증, 상태)
- 신설_단위업무_제안.csv       새로 만들 단위업무·기록물철 제안
- 분류기준표_변경적용본.csv    분류기준표 전체 행에 '확정안'만 적용한 표(검토필요 항목은 적용하지 않고 표시만 함)
- 06_impact_stats.json         사건별 영향 규모 집계(보고서 작성 에이전트가 읽는다. _workspace/{run}/에도 저장)
상태: 확정안(검증 '타당'이고 확신도가 낮음이 아님), 검토필요, 미검증(검증 결과 없음)
"""
import collections
import csv
import sys

from common import DATA, OUT, WORK, dump_json, load_json


def main():
    run = sys.argv[1]
    run_dir, out_dir = WORK / run, OUT / run
    out_dir.mkdir(parents=True, exist_ok=True)
    changes = load_json(run_dir / "02_changes.json")
    cls = load_json(DATA / "classification.json")
    files = {f["file_id"]: f for f in cls["files"]}
    units = {u["unit_id"]: u for u in cls["units"]}

    rows, new_rows, stats, missing = [], [], [], []
    applied = {}          # file_id -> 확정안 변경 내용
    flagged = collections.defaultdict(list)
    for ev in changes["events"]:
        eid = ev["event_id"]
        pp, vp, cp = run_dir / "04_proposals" / f"{eid}.json", run_dir / "05_verify" / f"{eid}.json", run_dir / "03_candidates" / f"{eid}.json"
        if not pp.exists():
            reason = "분류기준표 영향 없음으로 분류되어 분석하지 않음" if ev["분류기준표_영향"] == "없음" else "제안 파일 없음(분석 실패 또는 미실행)"
            missing.append({"event_id": eid, "사유": reason})
            stats.append({"event_id": eid, "유형": ev["유형"], "요약": ev["요약"], "분석": reason})
            continue
        prop = load_json(pp)
        ver = load_json(vp) if vp.exists() else None
        verdicts = {v["대상"]: v for v in ver["verdicts"]} if ver else {}
        cand = load_json(cp) if cp.exists() else {}
        st = collections.Counter()
        keep_by_period = collections.Counter()
        for p in prop["proposals"]:
            u = units[p["unit_id"]]
            v = verdicts.get(p["unit_id"])
            if p["조치"] == "유지":
                st["유지(영향 없음) 단위업무"] += 1
                continue
            if ver is None:
                status = "미검증"
            elif v and v["판정"] == "타당" and p["확신도"] != "낮음":
                status = "확정안"
            else:
                status = "검토필요"
            fids = p.get("대상_file_ids") or u["file_ids"]
            st[f"{p['조치']} 단위업무"] += 1
            for fid in fids:
                f = files[fid]
                after = {
                    "부서1": p.get("변경후_부서1") or f["부서1"], "부서2": p.get("변경후_부서2") or f["부서2"],
                    "단위업무명": p.get("변경후_단위업무명") or f["단위업무명"],
                }
                rows.append([eid, ev["유형"], status, fid, p["unit_id"], f["부서1"], f["부서2"], f["소기능"], f["단위업무명"], f["기록물철명"], f["보존기간"],
                             p["조치"], after["부서1"], after["부서2"], after["단위업무명"], p["확신도"], p["근거"],
                             v["판정"] if v else "", v.get("의견", "") if v else ""])
                st[f"{p['조치']} 기록물철"] += 1
                st[f"상태 {status} 기록물철"] += 1
                keep_by_period[f["보존기간"]] += 1
                if status == "확정안":
                    applied[fid] = {"조치": p["조치"], **after, "event_id": eid}
                else:
                    flagged[fid].append(f"{eid}:{p['조치']}({status})")
        for i, n in enumerate(prop.get("new_units", []), start=1):
            v = verdicts.get(f"new:{i}")
            status = "미검증" if ver is None else ("확정안" if v and v["판정"] == "타당" else "검토필요")
            new_rows.append([eid, status, n["부서1"], n["부서2"], n["소기능"], n["단위업무명"], " / ".join(n.get("기록물철_제안", [])), n["근거"],
                             v["판정"] if v else "", v.get("의견", "") if v else ""])
            st["신설 단위업무 제안"] += 1
        stats.append({
            "event_id": eid, "유형": ev["유형"], "요약": ev["요약"], "확신도": ev["확신도"],
            "집계": dict(st), "변경대상_기록물철_보존기간별": dict(keep_by_period),
            "검증_누락지적": (ver or {}).get("누락", []), "미해결": prop.get("미해결", []),
            "문서규모": cand.get("문서규모", {}), "문서규모_설명": cand.get("문서규모_설명", ""),
        })

    with open(out_dir / "분류기준표_변경안.csv", "w", newline="", encoding="utf-8-sig") as fp:
        w = csv.writer(fp)
        w.writerow(["사건", "사건유형", "상태", "file_id", "unit_id", "현_부서레벨1", "현_부서레벨2", "소기능", "현_단위업무명", "기록물철명", "보존기간",
                    "조치", "변경후_부서레벨1", "변경후_부서레벨2", "변경후_단위업무명", "확신도", "근거", "검증판정", "검증의견"])
        w.writerows(rows)
    with open(out_dir / "신설_단위업무_제안.csv", "w", newline="", encoding="utf-8-sig") as fp:
        w = csv.writer(fp)
        w.writerow(["사건", "상태", "부서레벨1", "부서레벨2", "소기능", "단위업무명(제안)", "기록물철(제안)", "근거", "검증판정", "검증의견"])
        w.writerows(new_rows)
    with open(out_dir / "분류기준표_변경적용본.csv", "w", newline="", encoding="utf-8-sig") as fp:
        w = csv.writer(fp)
        w.writerow(["구분", "부서레벨(1)", "부서레벨(2)", "대기능", "중기능", "소기능", "단위업무명", "기록물철명", "보존기간", "변경표시", "검토필요_표시"])
        for f in cls["files"]:
            a = applied.get(f["file_id"])
            mark = f"{a['event_id']}:{a['조치']}" if a else ""
            w.writerow([int(f["file_id"][1:]), a["부서1"] if a else f["부서1"], a["부서2"] if a else f["부서2"], f["대기능"], f["중기능"], f["소기능"],
                        a["단위업무명"] if a else f["단위업무명"], f["기록물철명"], f["보존기간"], mark, "; ".join(flagged.get(f["file_id"], []))])
    total = {
        "입력유형": changes["입력유형"], "기준": changes["기준"], "사건수": len(changes["events"]),
        "변경안_기록물철_행수": len(rows), "확정안_적용_기록물철수": len(applied), "검토필요·미검증_기록물철수": len(flagged),
        "신설_단위업무_제안수": len(new_rows), "분석되지_않은_사건": missing, "사건별": stats,
    }
    dump_json(run_dir / "06_impact_stats.json", total)
    dump_json(out_dir / "06_impact_stats.json", total)
    print({k: v for k, v in total.items() if k != "사건별"})


if __name__ == "__main__":
    main()

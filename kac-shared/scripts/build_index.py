"""기록물분류기준표와 비공개 세부기준(부서공통)을 읽어 배정 후보 색인을 만든다.

산출물
- data/classification.json : 기록물철(F), 단위업무(U), 부서공통 단위업무(C)
"""
import collections
import re
import sys

import openpyxl

from kac_common import SHARED_DATA as DATA, clean, dump_json, source_path

PLACEHOLDER = re.compile(r"나열 희망|과제별 기록물철 생산")


def rows_of(path, first_row=5):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    return [r for r in ws.iter_rows(min_row=first_row, values_only=True) if r and r[0] is not None]


def main():
    files, units, unit_ids = [], [], {}
    for r in rows_of(source_path("분류기준표")):
        no = int(float(clean(r[0])))
        dept1, dept2 = clean(r[1]), clean(r[2])
        unit_name, file_name = clean(r[6]), clean(r[7])
        flags = []
        if not unit_name:
            flags.append("단위업무명 공란")
        if not file_name:
            flags.append("기록물철명 공란")
        elif PLACEHOLDER.search(file_name):
            flags.append("기록물철명 미확정")
        # 단위업무명이 비어 있으면 소기능 이름으로 단위업무를 식별한다.
        unit_label = unit_name or clean(r[5])
        ukey = (dept1, dept2, unit_label)
        if ukey not in unit_ids:
            unit_ids[ukey] = f"U{len(unit_ids) + 1:04d}"
            units.append({
                "unit_id": unit_ids[ukey], "부서1": dept1, "부서2": dept2,
                "대기능": clean(r[3]), "중기능": clean(r[4]), "소기능": clean(r[5]),
                "단위업무명": unit_label, "단위업무명_출처": "단위업무명" if unit_name else "소기능(단위업무명 공란)",
                "file_ids": [],
            })
        fid = f"F{no:04d}"
        units[int(unit_ids[ukey][1:]) - 1]["file_ids"].append(fid)
        files.append({
            "file_id": fid, "unit_id": unit_ids[ukey], "부서1": dept1, "부서2": dept2,
            "대기능": clean(r[3]), "중기능": clean(r[4]), "소기능": clean(r[5]),
            "단위업무명": unit_label, "기록물철명": file_name, "설명": clean(r[8]),
            "보존기간": clean(r[9]), "유의": flags,
            # 철명이 비었거나 미확정이면 철 단위로 배정하지 않고 단위업무 단위로만 배정한다.
            "철배정가능": not flags or flags == ["단위업무명 공란"],
        })
    dup = [k for k, v in collections.Counter(f["file_id"] for f in files).items() if v > 1]
    if dup:
        sys.exit(f"구분 번호가 중복된다: {dup[:10]}")

    commons, seen = [], {}
    for r in rows_of(source_path("비공개세부기준")):
        if clean(r[7]) != "부서공통":
            continue
        key = (clean(r[3]), clean(r[5]), clean(r[6]))
        if key in seen:
            continue
        seen[key] = f"C{len(seen) + 1:03d}"
        commons.append({
            "common_id": seen[key], "중기능": clean(r[2]), "소기능": clean(r[3]),
            "단위업무명": clean(r[5]), "기록물철명": clean(r[6]), "소관업무": clean(r[4]),
        })

    dump_json(DATA / "classification.json", {
        "출처": {"기록물철·단위업무": "기록물분류기준표 최종(안)", "부서공통": "비공개 세부기준 v2.2의 부서공통 항목"},
        "files": files, "units": units, "commons": commons,
    })
    ok = sum(1 for f in files if f["철배정가능"])
    print(f"기록물철 {len(files)}건(철 단위 배정 가능 {ok}건), 단위업무 {len(units)}건, 부서공통 {len(commons)}건")
    print("부서1 목록:", sorted({f['부서1'] for f in files}))


if __name__ == "__main__":
    main()

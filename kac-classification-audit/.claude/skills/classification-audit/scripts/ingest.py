"""기존 분류가 들어 있는 입력 파일(xlsx 또는 csv)을 읽어 실행 폴더의 records.sqlite로 옮기고,
기존 분류명을 분류 색인의 ID에 대응시킨다.

사용: python3 ingest.py --run {run} --input {파일} [--columns config/columns.json] [--sheet 시트이름]
산출물: _workspace/{run}/records.sqlite (records 표), _workspace/{run}/ingest_summary.json
"""
import argparse
import collections
import csv
import re
import sqlite3
import sys
from pathlib import Path

from common import CONFIG, DATA, WORK, clean, dept_units, dump_json, load_json, squeeze, title_key

ID = re.compile(r"^(U\d{4}|F\d{4}|C\d{3})$")


def read_rows(path, sheet):
    if path.suffix.lower() == ".csv":
        with open(path, newline="", encoding="utf-8-sig") as fp:
            yield from csv.reader(fp)
        return
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    for ws in ([wb[sheet]] if sheet else wb.worksheets):
        first = True
        for r in ws.iter_rows(values_only=True):
            if first and sheet is None and ws is not wb.worksheets[0]:
                first = False  # 둘째 시트부터는 머리글 행을 건너뛴다
                continue
            first = False
            yield r


class Resolver:
    def __init__(self, cls, dept_map):
        self.cls, self.dept_map = cls, dept_map
        self.by_file, self.by_unit, self.by_common = collections.defaultdict(list), collections.defaultdict(list), {}
        for f in cls["files"]:
            if f["기록물철명"]:
                self.by_file[squeeze(f["기록물철명"])].append(f)
        for u in cls["units"]:
            self.by_unit[squeeze(u["단위업무명"])].append(u)
        for c in cls["commons"]:
            self.by_common[squeeze(c["기록물철명"])] = c
            self.by_common.setdefault(squeeze(c["단위업무명"]), c)
        self.units = {u["unit_id"]: u for u in cls["units"]}
        self.files = {f["file_id"]: f for f in cls["files"]}
        self.commons = {c["common_id"]: c for c in cls["commons"]}
        self.cache = {}

    def own(self, dept):
        if dept not in self.cache:
            self.cache[dept] = dept_units(self.cls, self.dept_map.get(dept, {}))
        return self.cache[dept]

    def resolve(self, dept, unit_name, file_name):
        """(kind, unit, file, 비고). kind: F 철, U 단위업무, C 부서공통, 없음, 미대응"""
        if not unit_name and not file_name:
            return "없음", "", "", ""
        for v in (file_name, unit_name):
            if ID.match(v):
                if v[0] == "F" and v in self.files:
                    return "F", self.files[v]["unit_id"], v, ""
                if v[0] == "U" and v in self.units:
                    return "U", v, "", ""
                if v[0] == "C" and v in self.commons:
                    return "C", v, "", ""
                return "미대응", "", "", f"색인에 없는 ID {v}"
        own, un, fn = self.own(dept), squeeze(unit_name), squeeze(file_name)
        if fn:
            cand = self.by_file.get(fn, [])
            if un:
                cand = [f for f in cand if squeeze(f["단위업무명"]) == un] or cand
            pick = [f for f in cand if f["unit_id"] in own] or cand
            if pick:
                return "F", pick[0]["unit_id"], pick[0]["file_id"], "같은 이름의 기록물철이 여러 개" if len(pick) > 1 else ""
            if fn in self.by_common and (not un or un == squeeze(self.by_common[fn]["단위업무명"])):
                return "C", self.by_common[fn]["common_id"], "", ""
        if un:
            cand = self.by_unit.get(un, [])
            pick = [u for u in cand if u["unit_id"] in own] or cand
            if pick:
                note = "기록물철명은 색인에 없어 단위업무만 대응" if fn else ("같은 이름의 단위업무가 여러 부서에 있음" if len(pick) > 1 else "")
                return "U", pick[0]["unit_id"], "", note
            if un in self.by_common:
                return "C", self.by_common[un]["common_id"], "", ""
        return "미대응", "", "", "분류기준표에 없는 분류명"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True)
    ap.add_argument("--input", required=True)
    ap.add_argument("--columns", default=str(CONFIG / "columns.json"))
    ap.add_argument("--sheet")
    a = ap.parse_args()
    run_dir = WORK / a.run
    if (run_dir / "records.sqlite").exists():
        sys.exit(f"{run_dir}에 이미 수집한 자료가 있다. 다른 --run 이름을 쓰거나 기존 폴더를 옮긴다.")
    run_dir.mkdir(parents=True, exist_ok=True)
    colmap = {k: v for k, v in load_json(a.columns).items() if not k.startswith("_")}
    rows = read_rows(Path(a.input), a.sheet)
    head = [clean(c) for c in next(rows)]
    idx = {k: head.index(v) for k, v in colmap.items() if v and v in head}
    need = [k for k in ("부서명", "제목") if k not in idx]
    if need or not ({"기존_단위업무명", "기존_기록물철명"} & set(idx)):
        sys.exit(f"입력 파일 머리글 {head}에서 필수 열을 찾지 못했다(부서명, 제목, 기존 분류 열 1개 이상). {a.columns}의 열 이름을 고친다.")

    rs = Resolver(load_json(DATA / "classification.json"), load_json(DATA / "dept_map.json"))
    con = sqlite3.connect(run_dir / "records.sqlite")
    con.execute("""create table records(rec_id integer primary key, 부서명 text, 문서구분 text, 등록일자 text, 문서번호 text,
        제목 text, 수신발신처 text, 제목키 text, 기존_단위업무명 text, 기존_기록물철명 text,
        label_kind text, label_unit text, label_file text, label_note text)""")
    get = lambda r, k: clean(r[idx[k]]) if k in idx and idx[k] < len(r) else ""
    kinds, unresolved, buf, memo = collections.Counter(), collections.Counter(), [], {}
    for n, r in enumerate(rows, start=1):
        if not r or not get(r, "부서명") or not get(r, "제목"):
            continue
        dept, un, fn = get(r, "부서명"), get(r, "기존_단위업무명"), get(r, "기존_기록물철명")
        if (dept, un, fn) not in memo:
            memo[(dept, un, fn)] = rs.resolve(dept, un, fn)
        kind, unit, file, note = memo[(dept, un, fn)]
        kinds[kind] += 1
        if kind == "미대응":
            unresolved[f"{un} / {fn}"] += 1
        title = get(r, "제목")
        buf.append((n, dept, get(r, "문서구분"), get(r, "등록일자"), get(r, "문서번호"), title, get(r, "수신발신처")[:200],
                    title_key(title), un, fn, kind, unit, file, note))
    con.executemany("insert into records values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", buf)
    con.execute("create index ix_key on records(부서명, 제목키)")
    con.commit()
    summary = {"입력": a.input, "문서수": len(buf),
               "기존분류_대응": {"철(F)": kinds["F"], "단위업무(U)": kinds["U"], "부서공통(C)": kinds["C"], "분류 없음": kinds["없음"], "분류기준표에 없는 분류명": kinds["미대응"]},
               "분류기준표에_없는_분류명_상위": unresolved.most_common(30),
               "부서대응표에_없는_부서": sorted({b[1] for b in buf} - set(rs.dept_map))}
    dump_json(run_dir / "ingest_summary.json", summary)
    import json
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

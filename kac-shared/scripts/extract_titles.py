"""생산·접수 문서목록 엑셀(연도별 시트)을 SQLite로 옮긴다. 연도마다 열 순서가 달라 머리글 이름으로 읽는다.
담당자·결재자 이름은 배정에 쓰지 않으므로 옮기지 않는다.

산출물: data/production.sqlite (docs 표)
"""
import sqlite3

import openpyxl

from kac_common import SHARED_DATA as DATA, clean, source_path, title_key


def main():
    db = DATA / "production.sqlite"
    if db.exists():
        db.unlink()
    con = sqlite3.connect(db)
    con.execute("""create table docs(
        doc_id text primary key, 연도 text, 부서명 text, 문서구분 text, 등록일자 text,
        문서번호 text, 제목 text, 수신발신처 text, 공개여부 text, 제목키 text)""")
    wb = openpyxl.load_workbook(source_path("생산접수목록"), read_only=True, data_only=True)
    total = 0
    for ws in wb.worksheets:
        it = ws.iter_rows(values_only=True)
        head = [clean(c) for c in next(it)]
        col = {name: head.index(name) for name in head if name}
        no_col = col.get("등록번호", col.get("문서번호"))
        buf = []
        for n, r in enumerate(it, start=2):
            if not r or r[col["부서명"]] is None:
                continue
            title = clean(r[col["제목"]])
            buf.append((
                f"{ws.title}-{n:06d}", ws.title, clean(r[col["부서명"]]), clean(r[col["문서구분"]]),
                clean(r[col["등록일자"]]), clean(r[no_col]) if no_col is not None else "",
                title, clean(r[col["수신_발신처"]])[:200], clean(r[col["공개여부"]]), title_key(title),
            ))
        con.executemany("insert into docs values(?,?,?,?,?,?,?,?,?,?)", buf)
        con.commit()
        total += len(buf)
        print(f"{ws.title} 시트: {len(buf):,}건")
    con.execute("create index ix_dept on docs(부서명, 연도)")
    con.execute("create index ix_key on docs(부서명, 제목키)")
    con.commit()
    uniq = con.execute("select count(*) from (select 1 from docs group by 부서명, 제목키)").fetchone()[0]
    print(f"전체 {total:,}건, (부서명, 제목키) 기준 고유 {uniq:,}건")


if __name__ == "__main__":
    main()

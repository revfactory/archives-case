"""직제규정·시행세칙 hwpx에서 본문을 뽑아 텍스트 파일로 저장한다.

hwpx는 zip이고 본문은 Contents/section*.xml에 있다. 문단은 한 줄로, 표는 행마다
'[표] 칸1 | 칸2 | ...' 한 줄로 적는다. 표 안의 표는 바깥 칸의 글자로 합친다.

사용: python3 extract_hwpx.py            # 원본 폴더의 hwpx 전부
      python3 extract_hwpx.py 파일.hwpx  # 지정 파일만
산출물: _workspace/_regulations/{종류}_{차수}차.txt       사람·에이전트가 읽는 본문
        _workspace/_regulations/{종류}_{차수}차.tables.json  표의 칸 위치·병합 정보(parse_org.py가 읽는다)
        _workspace/_regulations/index.json
"""
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from common import REG, SRC_REG, dump_json

HP = "{http://www.hancom.co.kr/hwpml/2011/paragraph}"


def text_of(node):
    """노드 아래 hp:t 글자를 문서 순서대로 합친다."""
    parts = []
    for t in node.iter(HP + "t"):
        parts.append("".join(t.itertext()))
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def cell_text(tc):
    """칸 안의 문단을 줄바꿈으로 구분해 돌려준다."""
    lines = [text_of(p) for p in tc.iter(HP + "p")]
    return "\n".join(x for x in lines if x)


def grid_of(tbl):
    rows = []
    for tr in tbl.findall(HP + "tr"):
        for tc in tr.findall(HP + "tc"):
            addr, span = tc.find(HP + "cellAddr"), tc.find(HP + "cellSpan")
            rows.append({"r": int(addr.get("rowAddr")), "c": int(addr.get("colAddr")),
                         "rs": int(span.get("rowSpan")), "cs": int(span.get("colSpan")), "t": cell_text(tc)})
    return rows


def emit(par, out, tables_out):
    tables = [t for run in par.findall(HP + "run") for t in run.findall(HP + "tbl")]
    if not tables:
        line = text_of(par)
        if line:
            out.append(line)
        return
    # 표를 품은 문단: 표 밖 글자를 먼저 적고 표를 행 단위로 적는다.
    outside = []
    for run in par.findall(HP + "run"):
        for t in run.findall(HP + "t"):
            outside.append("".join(t.itertext()))
    line = re.sub(r"\s+", " ", "".join(outside)).strip()
    if line:
        out.append(line)
    for tbl in tables:
        tables_out.append({"본문줄": len(out) + 1, "열수": int(tbl.get("colCnt", 0)), "cells": grid_of(tbl)})
        for tr in tbl.findall(HP + "tr"):
            cells = [text_of(tc) for tc in tr.findall(HP + "tc")]
            if any(cells):
                out.append("[표] " + " | ".join(cells))


def extract(path):
    out, tables_out = [], []
    with zipfile.ZipFile(path) as z:
        secs = sorted(n for n in z.namelist() if re.fullmatch(r"Contents/section\d+\.xml", n))
        for n in secs:
            root = ET.fromstring(z.read(n))
            for par in root.findall(HP + "p"):
                emit(par, out, tables_out)
    return out, tables_out


def label(path):
    name = unicodedata.normalize("NFC", Path(path).stem)
    kind = "시행세칙" if "시행세" in name else "직제규정"
    m = re.search(r"(\d+)차[_ ]?(\d{6})?", name)
    return kind, (m.group(1) if m else "00"), (m.group(2) or "" if m else "")


def main():
    targets = [Path(p) for p in sys.argv[1:]] or sorted(SRC_REG.rglob("*.hwpx"))
    if not targets:
        sys.exit(f"hwpx 파일이 없다: {SRC_REG}")
    REG.mkdir(parents=True, exist_ok=True)
    index = []
    for p in targets:
        kind, rev, date = label(p)
        lines, tables = extract(p)
        dst = REG / f"{kind}_{rev}차.txt"
        dst.write_text("\n".join(lines) + "\n", encoding="utf-8")
        dump_json(REG / f"{kind}_{rev}차.tables.json", tables)
        index.append({"종류": kind, "차수": int(rev), "시행일표기": date, "원본": str(p), "본문": str(dst), "줄수": len(lines)})
        print(f"{kind} {rev}차({date}): {len(lines):,}줄 -> {dst.name}")
    index.sort(key=lambda x: (x["종류"], x["차수"]))
    dump_json(REG / "index.json", index)


if __name__ == "__main__":
    main()

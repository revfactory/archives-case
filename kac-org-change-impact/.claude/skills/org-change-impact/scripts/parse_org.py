"""시행세칙 별표 3(부서별 업무분장)을 부서 단위 구조로 바꾼다.

표의 병합 칸을 풀어 부서 계층(상위 조직 > 실·단 > 부)과 업무분장 항목 목록을 만든다.

사용: python3 parse_org.py 47        # 시행세칙 47차
산출물: _workspace/_regulations/조직_{차수}차.json
  [{"기관": "본사", "경로": ["안전보안본부", "안전보안실", "안전기획부"], "부서명": "안전기획부",
    "업무": ["안전기본계획 수립, 시행", ...]}]
"""
import re
import sys

from common import REG, dump_json, load_json

HEAD = re.compile(r"부\s*서\s*명")
SECTION = re.compile(r"^(?:\d+\.|○|◦|o)\s*(.+)$")


def squeeze(name):
    """'비 서 실'처럼 글자 사이에 넣은 공백을 없앤다."""
    name = name.replace("\n", " ").strip()
    if re.fullmatch(r"(\S\s+)+\S", name):
        return re.sub(r"\s+", "", name)
    return re.sub(r"\s+", " ", name)


def duties_of(text):
    """'1. ... 2. ...' 형식의 업무분장을 항목 목록으로 나눈다. 번호가 순서대로 나올 때만 끊는다."""
    flat = re.sub(r"\s*\n\s*", " ", text).strip()
    items, pos, n = [], [], 1
    for m in re.finditer(r"(?<![\d.])(\d{1,2})\.\s*(?=\D)", flat):
        if int(m.group(1)) == n:
            pos.append((m.start(), m.end()))
            n += 1
    if not pos:
        return [flat] if flat else []
    for i, (s, e) in enumerate(pos):
        end = pos[i + 1][0] if i + 1 < len(pos) else len(flat)
        item = flat[e:end].strip()
        if item:
            items.append(item)
    return items


def expand(table):
    """병합 칸을 풀어 행×열 격자로 만든다."""
    grid = {}
    for c in table["cells"]:
        for dr in range(c["rs"]):
            for dc in range(c["cs"]):
                grid[(c["r"] + dr, c["c"] + dc)] = c["t"]
    nrow = 1 + max(r for r, _ in grid)
    ncol = 1 + max(c for _, c in grid)
    return [[grid.get((r, c), "") for c in range(ncol)] for r in range(nrow)]


def main():
    rev = sys.argv[1]
    lines = (REG / f"시행세칙_{rev}차.txt").read_text(encoding="utf-8").split("\n")
    tables = load_json(REG / f"시행세칙_{rev}차.tables.json")
    start = next(i for i, l in enumerate(lines, 1) if l.startswith("(별표 3)"))
    end = next((i for i, l in enumerate(lines, 1) if i > start and re.match(r"\(별표 [4-9]", l)), len(lines) + 1)
    # 표 사이의 기관 제목('1. 본 사', '○ 제주공항')을 본문 줄 번호로 찾는다.
    sections = [(i, squeeze(SECTION.match(l).group(1))) for i, l in enumerate(lines, 1)
                if start < i < end and not l.startswith("[표]") and SECTION.match(l)]
    depts, skipped = [], 0
    for t in tables:
        if not (start < t["본문줄"] < end):
            continue
        rows = expand(t)
        if not rows or not HEAD.search(rows[0][0]):
            skipped += 1
            continue
        org = next((name for i, name in reversed(sections) if i <= t["본문줄"]), "")
        for row in rows[1:]:
            if HEAD.search(row[0]):
                continue
            path = []
            for cell in row[:-1]:
                name = squeeze(cell)
                if name and (not path or path[-1] != name):
                    path.append(name)
            duties = duties_of(row[-1])
            if not path or not duties:
                continue
            if depts and depts[-1]["기관"] == org and depts[-1]["경로"] == path:
                depts[-1]["업무"] += duties      # 쪽이 넘어가 나뉜 행을 잇는다
            else:
                depts.append({"기관": org, "경로": path, "부서명": path[-1], "업무": duties})
    dump_json(REG / f"조직_{rev}차.json", depts)
    print(f"시행세칙 {rev}차: 부서 {len(depts)}개, 업무분장 항목 {sum(len(d['업무']) for d in depts):,}개, 업무분장 형식이 아닌 표 {skipped}개 제외")
    print("기관:", sorted({d["기관"] for d in depts}))


if __name__ == "__main__":
    main()

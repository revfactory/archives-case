"""직제규정·직제규정시행세칙·정관·한국공항공사법 hwpx 파일에서 본문 글자를 뽑아 data/regulations/*.txt로 저장한다.

hwpx는 zip 파일이고 본문은 Contents/section*.xml에 있다. 문단(hp:p)마다 한 줄로 쓴다.
같은 규정의 여러 차수가 있으면 모두 뽑고, 목록(index.json)에 파일명과 글자 수를 적는다.
"""
import re
import zipfile
from xml.etree import ElementTree as ET

from common import REGS, SOURCE_DIR, dump_json

TARGETS = ["1-2. 직제규정시행세칙", "1-3. 법령.내규.정관"]


def text_of(path):
    lines = []
    with zipfile.ZipFile(path) as z:
        names = sorted(n for n in z.namelist() if re.match(r"Contents/section\d+\.xml$", n))
        for n in names:
            root = ET.fromstring(z.read(n))
            for p in root.iter():
                if p.tag.endswith("}p"):
                    s = "".join(t.text or "" for t in p.iter() if t.tag.endswith("}t"))
                    s = re.sub(r"\s+", " ", s).strip()
                    if s and (not lines or lines[-1] != s):
                        lines.append(s)
    return lines


def main():
    REGS.mkdir(parents=True, exist_ok=True)
    index = []
    for t in TARGETS:
        for p in sorted((SOURCE_DIR / t).rglob("*.hwpx")):
            try:
                lines = text_of(p)
            except Exception as e:  # 손상된 파일은 건너뛰고 목록에 남긴다
                index.append({"원본": str(p.relative_to(SOURCE_DIR)), "오류": str(e)})
                continue
            out = REGS / (p.stem + ".txt")
            out.write_text("\n".join(lines), encoding="utf-8")
            index.append({"원본": str(p.relative_to(SOURCE_DIR)), "추출": out.name, "줄 수": len(lines), "글자 수": sum(map(len, lines))})
            print(f"{out.name}: {len(lines)}줄")
    dump_json(REGS / "index.json", index)


if __name__ == "__main__":
    main()

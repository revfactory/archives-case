"""직제규정·시행세칙 준비 작업을 한 번에 실행한다: 본문 추출 → 업무분장 구조화(전 차수) → 분류기준표 대응표(최신 차수).

사용: python3 prepare.py
새 차수 hwpx를 원본 폴더에 넣은 뒤 다시 실행하면 그 차수까지 포함된다.
"""
import subprocess
import sys
from pathlib import Path

from common import REG, load_json

HERE = Path(__file__).resolve().parent


def run(*args):
    subprocess.run([sys.executable, str(HERE / args[0]), *args[1:]], check=True)


def main():
    run("extract_hwpx.py")
    revs = sorted(x["차수"] for x in load_json(REG / "index.json") if x["종류"] == "시행세칙")
    for r in revs:
        run("parse_org.py", str(r))
    run("build_org_link.py", str(revs[-1]))
    print(f"준비 완료. 시행세칙 차수: {revs}, 분류기준표 대응 기준: {revs[-1]}차")


if __name__ == "__main__":
    main()

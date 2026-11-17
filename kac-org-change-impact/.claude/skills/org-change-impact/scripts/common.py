"""이 하네스의 경로와 공용 함수. 공용 데이터는 ../kac-shared/data에 있고 읽기만 한다."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT.parent / "kac-shared" / "scripts"))
from kac_common import SHARED_DATA as DATA, clean, dump_json, load_json  # noqa: E402,F401

WORK = ROOT / "_workspace"
OUT = ROOT / "output"
REG = WORK / "_regulations"          # 직제규정·시행세칙 본문 추출 결과(실행 간 공용)
SRC_REG = ROOT.parent / "(한국공항공사) 기록물분류체계" / "1-2. 직제규정시행세칙"

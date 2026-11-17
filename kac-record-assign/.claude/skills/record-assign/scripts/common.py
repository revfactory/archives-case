"""이 하네스의 경로와 공용 함수. 공용 데이터는 ../kac-shared/data에 있다."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT.parent / "kac-shared" / "scripts"))
from kac_common import SHARED_DATA as DATA, clean, dump_json, load_json, title_key  # noqa: E402,F401

WORK = ROOT / "_workspace"
OUT = ROOT / "output"

"""여러 하네스가 함께 쓰는 함수와 공용 데이터 경로.

하네스 스크립트에서는 다음처럼 불러온다.
    import sys; from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[5] / "kac-shared" / "scripts"))
    from kac_common import SHARED_DATA, clean, title_key, load_json, dump_json
"""
import json
import re
from pathlib import Path

SHARED = Path(__file__).resolve().parents[1]
SHARED_DATA = SHARED / "data"


def source_path(key):
    conf = json.loads((SHARED_DATA / "sources.json").read_text(encoding="utf-8"))
    p = Path(conf[key])
    if not p.is_absolute():
        p = (SHARED / p).resolve()
    if not p.exists():
        raise SystemExit(f"원본 파일을 찾지 못했다: {key} -> {p} (kac-shared/data/sources.json 경로를 고친다)")
    return p


def clean(v):
    """셀 값을 문자열로 바꾸고 줄바꿈·중복 공백을 없앤다."""
    if v is None:
        return ""
    return re.sub(r"\s+", " ", str(v)).strip()


def title_key(title):
    """같은 유형의 제목을 하나로 묶는 키. 공백을 없애고 숫자열을 0으로 바꾼다.
    '2026년 1월 무기·탄약 관리현황 통보'와 '2026년 2월 ...'이 같은 키가 된다."""
    t = re.sub(r"\s+", "", title)
    return re.sub(r"\d+", "0", t)


def load_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def dump_json(p, obj):
    Path(p).parent.mkdir(parents=True, exist_ok=True)
    Path(p).write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")

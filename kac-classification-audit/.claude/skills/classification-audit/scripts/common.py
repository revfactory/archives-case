"""이 하네스의 경로와 공용 함수. 공용 데이터는 ../kac-shared/data에 있고 읽기만 한다."""
import collections
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT.parent / "kac-shared" / "scripts"))
from kac_common import SHARED_DATA as DATA, clean, dump_json, load_json, title_key  # noqa: E402,F401

WORK = ROOT / "_workspace"
OUT = ROOT / "output"
CONFIG = ROOT / "config"
TAIL = re.compile(r"\s*(관련 )?자료를 관리하(는|기 위한) 기록물철\.?$")


def grams(text):
    t = re.sub(r"[\s\d\W_]+", "", text)
    return [t[i:i + 2] for i in range(len(t) - 1)]


def squeeze(text):
    """이름 대조용. 공백과 가운뎃점류를 없앤다."""
    return re.sub(r"[\s·ㆍ‧・,]+", "", text or "")


class Lexical:
    """글자 2개 단위 TF-IDF 코사인 유사도. entries는 (id, 글) 목록."""

    def __init__(self, entries):
        self.ids = [e[0] for e in entries]
        docs = [collections.Counter(grams(e[1])) for e in entries]
        df = collections.Counter(g for d in docs for g in d)
        n = len(entries)
        self.idf = {g: math.log(1 + n / c) for g, c in df.items()}
        self.inv = collections.defaultdict(list)
        for i, d in enumerate(docs):
            w = {g: (1 + math.log(v)) * self.idf[g] for g, v in d.items()}
            norm = math.sqrt(sum(x * x for x in w.values())) or 1
            for g, x in w.items():
                self.inv[g].append((i, x / norm))

    def scores(self, title):
        """{id: 유사도(0~1)}. 겹치는 글자가 없는 항목은 들어가지 않는다."""
        q = collections.Counter(grams(title))
        w = {g: (1 + math.log(v)) * self.idf[g] for g, v in q.items() if g in self.idf}
        norm = math.sqrt(sum(x * x for x in w.values())) or 1
        score = collections.defaultdict(float)
        for g, x in w.items():
            for i, dw in self.inv[g]:
                score[i] += x / norm * dw
        return {self.ids[i]: s for i, s in score.items()}


def unit_index(cls):
    """단위업무(U)와 부서공통 항목(C)을 한 색인에 넣는다."""
    files = collections.defaultdict(list)
    for f in cls["files"]:
        files[f["unit_id"]].append(f)
    entries = []
    for u in cls["units"]:
        body = " ".join(f"{f['기록물철명']} {TAIL.sub('', f['설명'])}" for f in files[u["unit_id"]])
        entries.append((u["unit_id"], f"{u['소기능']} {u['단위업무명']} {u['단위업무명']} {body}"))
    for c in cls["commons"]:
        entries.append((c["common_id"], f"{c['소기능']} {c['단위업무명']} {c['기록물철명']} {c['기록물철명']} {c['소관업무']}"))
    return Lexical(entries)


def dept_units(cls, mapping):
    """부서 대응표에 따른 그 부서의 단위업무 ID 집합."""
    d1, d2 = set(mapping.get("부서1", [])), set(mapping.get("부서2", []))
    return {u["unit_id"] for u in cls["units"] if u["부서1"] in d1 and (not d2 or u["부서2"] in d2)}


def label_text(cls_maps, kind, unit, file):
    """기존 분류를 사람이 읽을 수 있는 정보로 바꾼다."""
    files, units, commons = cls_maps
    if kind == "C":
        c = commons[unit]
        return {"구분": "부서공통", "id": unit, "단위업무명": c["단위업무명"], "기록물철명": c["기록물철명"], "소관업무": c["소관업무"]}
    if kind in ("U", "F"):
        u = units[unit]
        out = {"구분": "단위업무" if kind == "U" else "철", "id": file or unit, "unit_id": unit, "부서": f"{u['부서1']} {u['부서2']}",
               "소기능": u["소기능"], "단위업무명": u["단위업무명"],
               "단위업무의_기록물철": [files[i]["기록물철명"] for i in u["file_ids"] if files[i]["기록물철명"]]}
        if kind == "F":
            out["기록물철명"] = files[file]["기록물철명"]
            out["설명"] = TAIL.sub("", files[file]["설명"])
        return out
    return {"구분": "분류기준표에 없는 분류명"}


def cls_maps(cls):
    return ({f["file_id"]: f for f in cls["files"]}, {u["unit_id"]: u for u in cls["units"]}, {c["common_id"]: c for c in cls["commons"]})


def norm_unit(level, cid, files):
    """판단 결과를 단위업무 수준 ID로 바꾼다. 철이면 그 철이 속한 단위업무."""
    if level == "철":
        return files[cid]["unit_id"] if cid in files else None
    if level in ("단위업무", "부서공통"):
        return cid
    return None

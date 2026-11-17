"""이 하네스의 경로와 공용 함수, 제목 낱말 분리 함수. 공용 데이터는 ../kac-shared/data에 있다(읽기 전용)."""
import collections
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT.parent / "kac-shared" / "scripts"))
from kac_common import SHARED_DATA, clean, dump_json, load_json, title_key  # noqa: E402,F401

DATA = ROOT / "data"
WORK = ROOT / "_workspace"
OUT = ROOT / "output"

# 문서의 처리 행위나 시점만 나타내 업무 주제를 구별하지 못하는 낱말
STOP = set("""알림 요청 제출 보고 결과 결과보고 계획 통보 송부 회신 협조 안내 관련 건 및 등 위한 따른 대한 관한 대해 따라 위해
년 년도 월 일 주 분기 차 제 상반기 하반기 실시 시행 개최 추진 검토 의뢰 요구 자료 현황 변경 수정 참석 의견 조회 계획보고
공문 접수 발송 보고서 재알림 재요청 협조요청 요청서 신청서 신청 승인 확인 한국공항공사 공사""".split())
SUFFIX = ["결과보고", "계획보고", "협조요청", "재알림", "재요청", "알림", "요청", "제출", "보고", "통보", "송부", "회신", "안내", "의뢰", "요구"]
BRACKET = re.compile(r"\([^)]*\)|\[[^\]]*\]|<[^>]*>")
SPLIT = re.compile(r"[^가-힣A-Za-z]+")


def tokens(text):
    """제목에서 업무 주제를 나타내는 낱말만 남긴다. 괄호 안 내용(업체명·세부 건명)과 숫자는 뺀다."""
    t = BRACKET.sub(" ", text)
    if len(re.sub(r"[^가-힣A-Za-z]", "", t)) < 4:
        t = text
    out = []
    for w in SPLIT.split(t):
        changed = True
        while changed:
            changed = False
            for s in SUFFIX:
                if w.endswith(s) and len(w) > len(s):
                    w, changed = w[:-len(s)], True
        if len(w) >= 2 and w not in STOP:
            out.append(w.upper() if w.isascii() else w)
    return out


def grams(toks):
    """한글 낱말은 글자 2개 단위, 영문 낱말은 통째로 특징으로 쓴다."""
    c = collections.Counter()
    for w in toks:
        if w.isascii() or len(w) == 2:
            c[w] += 1
        else:
            for i in range(len(w) - 1):
                c[w[i:i + 2]] += 1
    return c


def tfidf(counter, idf):
    v = {g: (1 + math.log(n)) * idf[g] for g, n in counter.items() if g in idf}
    norm = math.sqrt(sum(x * x for x in v.values()))
    return {g: x / norm for g, x in v.items()} if norm else {}

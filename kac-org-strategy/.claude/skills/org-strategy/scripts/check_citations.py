"""보고서·검토서(Markdown)에 쓴 근거 표기를 검사한다.

표기 형식: [근거ID 항목=값]  예) [DP-003 단위업무 수=118]   또는 값 없이 [근거ID]
- 근거ID가 facts.json에 없거나, 항목이 없거나, 값이 다르면 오류로 출력한다.
- 숫자가 들어 있는데 근거 표기가 없는 줄을 '확인 필요'로 출력한다(표의 구분선, 제목, 날짜·조문 번호만 있는 줄은 제외).
  --strict를 주면 '확인 필요'가 있어도 종료 코드 1을 낸다.
- 대안 파일의 '영향규모' 값은 [영향 OPT-A 대상 단위업무 수=12]처럼 적고, --options로 대안 파일들을 주면 값을 대조한다.

사용: python3 check_citations.py {md 경로} [--options 대안1.json 대안2.json ...] [--strict]
"""
import re
import sys

from common import FACTS, load_json

CITE = re.compile(r"\[((?:DP|DS|SM|VL|CM)-[A-Z0-9-]+)(?:\s+([^=\]]+)=([^\]]+))?\]")
IMPACT = re.compile(r"\[영향\s+(\S+)\s+([^=\]]+)=([^\]]+)\]")
NUM = re.compile(r"\d[\d,.]*\s*(건|개|%|%p|명|배|쌍|곳)")


def norm(v):
    return str(v).replace(",", "").strip()


def same(a, b):
    try:
        return abs(float(norm(a)) - float(norm(b))) < 1e-9
    except ValueError:
        return norm(a) == norm(b)


def main():
    args = sys.argv[1:]
    strict = "--strict" in args
    args = [a for a in args if a != "--strict"]
    opts = {}
    if "--options" in args:
        k = args.index("--options")
        for p in args[k + 1:]:
            o = load_json(p)
            opts[o["option_id"]] = o.get("영향규모", {})
        args = args[:k]
    text = open(args[0], encoding="utf-8").read()
    facts = load_json(FACTS / "facts.json")
    errs, warn, n = [], [], 0
    for ln, line in enumerate(text.splitlines(), start=1):
        cites = CITE.findall(line)
        impacts = IMPACT.findall(line)
        for fid, item, val in cites:
            n += 1
            if fid not in facts:
                errs.append(f"{ln}행: 근거 {fid}가 facts.json에 없다")
            elif item:
                item = item.strip()
                if item not in facts[fid]["값"]:
                    errs.append(f"{ln}행: 근거 {fid}에 항목 '{item}'이 없다. 있는 항목: {list(facts[fid]['값'])}")
                elif not same(facts[fid]["값"][item], val):
                    errs.append(f"{ln}행: 근거 {fid} '{item}'의 값은 {facts[fid]['값'][item]}인데 {val.strip()}로 적었다")
        for oid, item, val in impacts:
            n += 1
            if opts and oid not in opts:
                errs.append(f"{ln}행: 대안 {oid}가 --options로 준 파일에 없다")
            elif opts and (item.strip() not in opts[oid] or not same(opts[oid][item.strip()], val)):
                errs.append(f"{ln}행: 대안 {oid}의 영향규모 '{item.strip()}' 값은 {opts[oid].get(item.strip())}인데 {val.strip()}로 적었다")
        bare = IMPACT.sub("", CITE.sub("", line))
        if not cites and not impacts and "[영향 " not in line and NUM.search(bare) and not line.lstrip().startswith("#"):
            warn.append(f"{ln}행: 수치가 있는데 근거 표기가 없다 → {line.strip()[:80]}")
    print(f"근거 표기 {n}건 확인, 오류 {len(errs)}건, 확인 필요 {len(warn)}건")
    for e in errs:
        print("오류 |", e)
    for w in warn:
        print("확인 필요 |", w)
    sys.exit(1 if errs or (strict and warn) else 0)


if __name__ == "__main__":
    main()

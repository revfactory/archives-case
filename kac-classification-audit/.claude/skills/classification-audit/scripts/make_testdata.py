"""시험 자료를 만든다. 현재 문서목록에는 사람이 고른 분류 열이 없으므로,
문서목록 제목에 분류기준표의 단위업무를 붙이고 일부를 일부러 틀리게 바꾼다.

- 기본 분류: 그 부서의 단위업무 가운데 제목과 글자 유사도가 가장 높은 것(유사도 --min-sim 이상인 제목만 사용).
  사람이 확인한 정답이 아니므로 기본 분류 자체가 틀릴 수 있다.
- 오류 주입: --error-rate 비율의 문서를 다른 단위업무로 바꾼다(같은 부서의 다른 단위업무 60%, 다른 부서의 단위업무 40%).
- 표본과 주입 대상은 --seed와 문서 ID의 해시로 정하므로 같은 인자로 다시 실행하면 결과가 같다.

사용: python3 make_testdata.py [--n 600] [--error-rate 0.2] [--seed 7] [--dept 부서명 ...] [--year 2026]
산출물: _workspace/testdata/sample_input.csv (하네스 입력), _workspace/testdata/answer.csv (정답. 에이전트에게 주지 않는다)
"""
import argparse
import csv
import hashlib
import sqlite3

from common import DATA, WORK, dept_units, load_json, unit_index


def h(seed, *parts):
    return int(hashlib.md5("|".join([str(seed), *map(str, parts)]).encode()).hexdigest(), 16)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=600)
    ap.add_argument("--error-rate", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--dept", action="append")
    ap.add_argument("--year", default="2026")
    ap.add_argument("--min-sim", type=float, default=0.25)
    a = ap.parse_args()
    cls, dept_map = load_json(DATA / "classification.json"), load_json(DATA / "dept_map.json")
    depts = a.dept or ["감사실", "인사혁신실", "경영관리실", "안전보안실", "김포운영단"]
    units = {u["unit_id"]: u for u in cls["units"]}
    files = {f["file_id"]: f for f in cls["files"]}
    lex = unit_index(cls)
    con = sqlite3.connect(DATA / "production.sqlite")
    out, ans = [], []
    all_units = sorted(units)
    for dept in depts:
        own = sorted(dept_units(cls, dept_map[dept]))
        rows = con.execute("select doc_id, 부서명, 문서구분, 등록일자, 문서번호, 제목, 수신발신처 from docs where 부서명=? and 연도=? and 문서구분='생산'", (dept, a.year)).fetchall()
        rows.sort(key=lambda r: h(a.seed, r[0]))
        got = 0
        for r in rows:
            if got >= a.n // len(depts):
                break
            sc = lex.scores(r[5])
            best = max(own, key=lambda u: sc.get(u, 0))
            if sc.get(best, 0) < a.min_sim:
                continue
            got += 1
            label, kind = best, "주입 안 함"
            if h(a.seed, "err", r[0]) % 10000 < a.error_rate * 10000:
                if h(a.seed, "type", r[0]) % 10 < 6 and len(own) > 1:
                    pool, kind = [u for u in own if u != best], "같은 부서의 다른 단위업무"
                else:
                    pool, kind = [u for u in all_units if u not in own], "다른 부서의 단위업무"
                label = pool[h(a.seed, "pick", r[0]) % len(pool)]
            u = units[label]
            # 단위업무에 기록물철이 있으면 첫 번째 철 이름도 함께 적는다(철 수준 분류가 있는 입력을 흉내 낸다).
            fname = files[u["file_ids"][0]]["기록물철명"] if kind == "주입 안 함" and h(a.seed, "file", r[0]) % 2 == 0 else ""
            out.append([r[1], r[2], r[3], r[0], r[5], r[6], u["단위업무명"], fname])
            ans.append([r[0], r[1], r[5], kind, label, u["단위업무명"], best, units[best]["단위업무명"], round(sc.get(best, 0), 3)])
    d = WORK / "testdata"
    d.mkdir(parents=True, exist_ok=True)
    with open(d / "sample_input.csv", "w", newline="", encoding="utf-8-sig") as fp:
        w = csv.writer(fp)
        w.writerow(["부서명", "문서구분", "등록일자", "문서번호", "제목", "수신_발신처", "단위업무명", "기록물철명"])
        w.writerows(out)
    with open(d / "answer.csv", "w", newline="", encoding="utf-8-sig") as fp:
        w = csv.writer(fp)
        w.writerow(["문서번호", "부서명", "제목", "주입유형", "붙인_unit_id", "붙인_단위업무명", "기본_unit_id", "기본_단위업무명", "기본_유사도"])
        w.writerows(ans)
    inj = sum(1 for x in ans if x[3] != "주입 안 함")
    print(f"시험 자료 {len(out)}건(오류 주입 {inj}건): {d / 'sample_input.csv'}\n정답: {d / 'answer.csv'}")


if __name__ == "__main__":
    main()

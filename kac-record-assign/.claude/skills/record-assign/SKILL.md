---
name: record-assign
description: 한국공항공사 생산·접수 문서목록의 제목을 기록물분류기준표의 기록물철 또는 단위업무에 배정하는 전체 작업을 조율한다. '기록물철 배정', '단위업무 배정', '문서 제목 분류', '생산현황 배정', '○○부서 문서 배정해줘', '2026년 문서 분류해줘'처럼 문서 제목을 분류기준표에 대응시키는 요청이면 반드시 이 스킬을 쓴다. '배정 다시 실행', '이어서 배정', '남은 제목 계속', '검토필요 건만 다시', '부서 대응표를 고쳤으니 재실행', '이전 결과 보완·수정' 같은 후속 요청에도 쓴다. 분류기준표 자체의 개정, 이미 사람이 분류해 둔 결과의 오류 점검, 단위업무명 신설 제안은 이 스킬의 범위가 아니다.
---

# 기록물철·단위업무 배정 오케스트레이터

문서목록(약 107만 건)의 제목을 분류기준표(기록물철 1,663개, 단위업무 703개)와 부서공통 항목(46개)에 배정한다. 문서목록에는 정답 열이 없으므로 배정 → 독립 검증 → 불일치 중재의 세 단계를 거쳐 확정 건과 사람 검토 건을 나눈다.

## 구성

| 구성 요소 | 역할 | 모델 |
| --- | --- | --- |
| `record-assigner` | 묶음의 모든 항목을 배정 | sonnet (절차가 정해져 있고 묶음 수가 많음) |
| `assignment-verifier` | 배정 결과를 독립적으로 다시 판단 | opus (교차 검증) |
| `assignment-arbiter` | 불일치·판단불가 항목을 최종 판단 | opus (두 근거의 비교) |
| `record-assignment-rules` 스킬 | 세 에이전트가 함께 쓰는 판단 기준과 결과 파일 형식 | - |
| `scripts/` | 묶음 생성, 형식 검사, 결과 병합 | - |

**실행 모드:** 준비와 병합은 메인이 스크립트로 처리하고, 배정·검증·중재는 워크플로로 조율한다. 처리할 묶음 목록과 단계 순서가 미리 정해지고 묶음 수가 수십 개 이상으로 늘어나기 때문이다. 이 스킬을 사용자가 불러왔다면 워크플로 실행에 동의한 것으로 본다.

## 경로

모든 명령은 하네스 폴더(`kac-record-assign/`)에서 실행한다. 아래에서 `S`는 `.claude/skills/record-assign/scripts`다.

| 경로 | 내용 |
| --- | --- |
| `../kac-shared/data/` | 분류 색인, 부서 대응표, 문서목록 DB (여러 하네스 공용) |
| `_workspace/{run}/batches/` | 묶음 파일 |
| `_workspace/{run}/results/`, `verify/`, `arbitrate/` | 단계별 에이전트 결과 |
| `output/{run}/` | `배정결과.csv`, `배정결과.xlsx`, `검토필요.csv`, `요약.md` |
| `output/ledger.json` | 확정된 (부서명, 문서구분, 제목키)의 누적 기록 |

## 0단계: 상황 확인

1. `../kac-shared/data/classification.json`과 `production.sqlite`가 있는지 확인한다. 없으면 `python3 ../kac-shared/scripts/build_index.py`와 `python3 ../kac-shared/scripts/extract_titles.py`를 실행한다(문서목록 변환은 약 1분).
2. `_workspace/`와 `output/ledger.json`을 보고 요청을 구분한다.

| 상황 | 처리 |
| --- | --- |
| 처음 실행 | 1단계부터 |
| 이어서 실행("남은 것 계속") | 새 `run` 이름으로 1단계부터. 확정된 제목은 `ledger.json`에 따라 자동으로 빠진다 |
| 중단된 실행 재개 | 같은 `run`에서 결과 파일이 없는 묶음만 2단계에 넘긴다. 직전 워크플로의 `runId`가 있으면 `resumeFromRunId`로 재개한다 |
| 특정 묶음·단계만 다시 | 해당 묶음의 `results/`·`verify/`·`arbitrate/` 파일 가운데 다시 만들 단계부터 지우고 그 묶음만 2단계에 넘긴 뒤 3단계를 다시 실행한다 |
| 부서 대응표·분류기준표를 고친 뒤 재실행 | 영향받는 부서를 `--dept`로 지정하고 `--redo`를 붙여 새 `run`으로 실행한다 |
| 검토필요 건에 대한 사용자 판정 반영 | 4단계의 「사람 판정 반영」을 따른다 |

3. 실행 범위를 정한다. 사용자가 부서, 연도, 건수를 말하지 않았으면 범위를 묻지 않고 기본값(고유 제목 200개, 건수 많은 제목부터)으로 실행한 뒤 남은 양을 보고한다. 전체 고유 제목은 약 65만 7천 개이므로 "전체"를 요청받으면 예상 묶음 수(고유 제목 수 ÷ 40)를 알리고 부서 단위로 나누어 진행할지 확인한다.

## 1단계: 묶음 생성

**실행 모드:** 메인이 스크립트 실행

```bash
python3 S/make_batches.py --run {run} [--dept 부서명]... [--year 2026]... [--kind 생산|접수] \
  [--contains 문자열] [--limit 200] [--order freq|sample] [--batch-size 40] [--redo]
```

- `run`은 `r20261112a`처럼 날짜와 순번으로 짓는다. 같은 이름의 폴더가 있으면 스크립트가 멈춘다.
- `--dept`에는 문서목록의 부서 표기를 쓴다(예: `김포운영단`, `청주공항`). 표기를 모르면 `sqlite3 ../kac-shared/data/production.sqlite "select 부서명, count(*) from docs group by 1"`로 확인한다.
- 같은 부서·같은 문서구분에서 숫자만 다른 제목은 한 항목으로 묶인다. `--order freq`는 문서 수가 많은 제목부터, `--order sample`은 고정된 표본을 고른다. 품질을 가늠하려는 시험에는 `sample`을 쓴다.
- 출력되는 `대응표에_없는_부서`가 비어 있지 않으면 `../kac-shared/data/dept_map.json`에 그 부서를 추가할지 사용자에게 알린다. 추가하지 않으면 부서공통후보와 추가후보만으로 배정된다.

## 2단계: 배정 → 검증 → 중재

**실행 모드:** 워크플로 조율

`_workspace/{run}/manifest.json`의 `batches`에서 처리할 묶음 ID 목록을 뽑아 `args`로 넘긴다. 워크플로 스크립트는 파일을 읽을 수 없으므로 에이전트가 경로를 받아 직접 읽고, 결과도 파일로 쓴다. 반환값에는 건수만 담아 메인의 문맥을 아낀다.

```javascript
export const meta = {
  name: 'kac-record-assign',
  description: '문서 제목 묶음을 기록물철·단위업무에 배정하고 검증·중재한다',
  phases: [
    { title: '배정', detail: '묶음마다 record-assigner가 배정', model: 'sonnet' },
    { title: '검증', detail: 'assignment-verifier가 독립 재판단', model: 'opus' },
    { title: '중재', detail: '불일치 항목만 assignment-arbiter가 판단', model: 'opus' },
  ],
}

const { root, run, batchIds } = args
const SUMMARY = {
  type: 'object',
  properties: {
    batch_id: { type: 'string' },
    validated: { type: 'boolean', description: 'validate_batch.py가 OK를 출력했는지' },
    count: { type: 'integer', description: '결과 파일에 쓴 항목 수' },
    open_count: { type: 'integer', description: '검증: 동의가 아닌 항목 수 / 중재: 보류 건수 / 배정: 미배정 건수' },
    note: { type: 'string' },
  },
  required: ['batch_id', 'validated', 'count', 'open_count'],
}
const where = `하네스 폴더는 ${root} 이다. 이 폴더로 이동해 작업한다. 실행 이름 run=${run}.`

const out = await pipeline(
  batchIds,
  id => agent(`${where} 묶음 ${id}를 배정하라. 입력 _workspace/${run}/batches/${id}.json, 출력 _workspace/${run}/results/${id}.json. 검사: validate_batch.py ${run} assign ${id}`,
    { agentType: 'record-assigner', phase: '배정', label: `배정:${id}`, schema: SUMMARY }),
  (a, id) => {
    if (!a || !a.validated) throw new Error(`${id} 배정 실패`)
    return agent(`${where} 묶음 ${id}의 배정 결과를 검증하라. 입력 batches/${id}.json과 results/${id}.json, 출력 _workspace/${run}/verify/${id}.json. 검사: validate_batch.py ${run} verify ${id}`,
      { agentType: 'assignment-verifier', phase: '검증', label: `검증:${id}`, schema: SUMMARY })
  },
  (v, id) => {
    if (!v || !v.validated) throw new Error(`${id} 검증 실패`)
    if (v.open_count === 0) return { batch_id: id, stage: '검증', open: 0, held: 0 }
    return agent(`${where} 묶음 ${id}에서 검증 판정이 동의가 아닌 항목을 중재하라. 입력 batches/, results/, verify/의 ${id}.json, 출력 _workspace/${run}/arbitrate/${id}.json. 검사: validate_batch.py ${run} arbitrate ${id}`,
      { agentType: 'assignment-arbiter', phase: '중재', label: `중재:${id}`, schema: SUMMARY })
      .then(r => ({ batch_id: id, stage: '중재', open: v.open_count, held: r ? r.open_count : v.open_count, arbitrated: Boolean(r && r.validated) }))
  },
)

const done = out.filter(Boolean)
log(`묶음 ${batchIds.length}개 중 ${done.length}개 완료, ${batchIds.length - done.length}개 미완료`)
return { run, done, failed: batchIds.filter((id, i) => !out[i]) }
```

- `args`는 `{ "root": "<하네스 폴더 절대 경로>", "run": "<run>", "batchIds": ["batch_0001", ...] }` 형태의 JSON 값으로 넘긴다.
- 묶음이 서로 독립이라 `pipeline()`만 쓴다. 한 묶음이 검증 중일 때 다른 묶음은 배정 단계에 있어도 된다.
- 사용자 정의 에이전트 유형이 이 세션에 등록되어 있지 않으면(하네스 폴더가 아닌 곳에서 세션을 시작한 경우) `agentType`을 빼고, 프롬프트 앞에 "`.claude/agents/{이름}.md`와 `.claude/skills/record-assignment-rules/SKILL.md`를 먼저 읽고 그 정의대로 작업하라"를 붙인다. 이때 배정 단계에는 `model: 'sonnet'`, 검증·중재 단계에는 `model: 'opus'`를 지정한다.
- 묶음이 3개 이하인 시험 실행은 워크플로 대신 `Agent` 도구를 묶음마다 호출해도 된다. 순서와 파일 경로는 같다.

## 3단계: 병합과 보고

**실행 모드:** 메인이 스크립트 실행

```bash
python3 S/merge_results.py {run}
```

- 제목 단위 판단을 범위 안의 모든 문서에 펼쳐 `output/{run}/배정결과.csv`를 만든다(문서 20만 건 이하면 xlsx도 만든다).
- 상태는 다음과 같이 정해진다.

| 상태 | 조건 |
| --- | --- |
| `확정` | 검증자가 동의했고 확신도가 높음 또는 보통 |
| `확정(중재)` | 불일치·판단불가였으나 중재자가 결정 |
| `검토필요(확신 낮음)` | 검증자가 동의했지만 배정 확신도가 낮음 |
| `검토필요(검증 불일치)`, `검토필요(검증 판단불가)` | 중재가 보류했거나 중재 결과가 없음 |
| `미검증` | 검증 결과 파일이 없음 |

- 확정 건만 `output/ledger.json`에 쌓인다.
- 사용자에게는 `요약.md`의 수치(상태별 고유 제목 수, 수준별 문서 수, 미배정 유형, 누락 묶음, 남은 고유 제목 수)와 산출물 경로를 보고한다. 미배정 유형 `분류기준표에 해당 업무 없음`이 많은 부서는 분류기준표에 그 부서 항목이 부족하다는 뜻이므로 부서명과 함께 알린다.

## 4단계: 사람 판정 반영(후속 요청)

사용자가 `검토필요.csv`를 보고 판정을 주면 해당 `부서명|문서구분|제목키`를 `output/ledger.json`에 `{"level": ..., "id": ..., "run": "사람 판정"}`으로 추가한다. 같은 유형의 지적이 두 번 이상 나오면 `record-assignment-rules` 스킬의 기준이나 `references/edge-cases.md`에 일반화해 반영하자고 제안한다(`harness:evolve`).

## 데이터 전달

| 구간 | 방법 |
| --- | --- |
| 메인 → 워크플로 | `args`(폴더 경로, run, 묶음 ID 목록) |
| 워크플로 → 에이전트 | 프롬프트에 적은 파일 경로 |
| 에이전트 → 다음 단계 | `_workspace/{run}/` 아래 단계별 JSON 파일. 형식은 `validate_batch.py`가 검사 |
| 에이전트 → 워크플로 | 스키마에 맞춘 건수 요약 |
| 워크플로 → 메인 | 완료·실패 묶음 목록 |

## 오류 처리

| 상황 | 처리 |
| --- | --- |
| 묶음의 배정 또는 검증이 실패(`failed`에 포함) | 해당 묶음만 한 번 다시 실행한다. 또 실패하면 그대로 병합한다. 병합 스크립트가 `요약.md`의 「누락」에 적는다 |
| 중재만 실패 | 다시 실행하지 않아도 된다. 불일치 건이 `검토필요`로 남는다 |
| 사용량 한도 소진, 인증 만료, 권한 거부 | 다시 시도하지 않는다. `_workspace/{run}/results/` 등에 실제로 있는 파일을 세어 어디까지 진행됐는지 확인하고, 완료된 묶음만으로 병합한 뒤 누락과 재개 방법(같은 `run`, 남은 묶음 ID)을 보고한다. 사용량 한도면 풀리는 시각도 알린다 |
| 에이전트가 쓴 파일이 검사를 통과하지 못한 채 남음 | 메인이 내용을 추측해 고치지 않는다. 해당 묶음을 다시 실행하거나 누락으로 보고한다 |
| 원본 엑셀 경로가 바뀜 | `../kac-shared/data/sources.json`을 고치고 공용 준비 스크립트를 다시 실행한다 |

## 알아 둘 제약

- 제목만 보고 배정한다. 본문·첨부를 보지 않으므로 `검토필요` 건은 사람이 확인해야 한다.
- 문서목록의 부서명에는 부(部) 단위 정보가 없다. 부서 대응표의 `준용`·`승계추정` 항목은 추정이며 직제규정으로 확인한 것이 아니다.
- 분류기준표에 항목이 적은 부서(ESG경영실 2건, 양양공항 1건)와 기준표가 없는 지방 공항은 미배정 비율이 높게 나온다.
- 부서공통 항목은 분류기준표가 아니라 비공개 세부기준의 「부서공통」 항목에서 가져왔다. 기록물철로 공식 등록된 항목인지는 기록관리 담당자의 확인이 필요하다.

## 테스트 시나리오

**정상 흐름**

1. `python3 S/make_batches.py --run t1 --dept 감사실 --year 2026 --limit 25 --order sample --batch-size 25` → 묶음 1개 생성, `대응표에_없는_부서`가 빈 목록.
2. 워크플로(또는 `Agent` 호출)로 `batch_0001` 배정 → `validate_batch.py t1 assign batch_0001`이 `OK 25`.
3. 검증 → `validate_batch.py t1 verify batch_0001`이 `OK 25`. 동의가 아닌 항목이 있으면 중재 → `arbitrate` 검사 `OK`.
4. `python3 S/merge_results.py t1` → `output/t1/요약.md`의 상태별 합계가 25, `배정결과.csv`의 행 수가 `이번_판단_문서수`와 같다.

**오류 흐름**

1. 묶음 2개로 실행하던 중 `batch_0002`의 배정 에이전트가 실패해 워크플로 반환값의 `failed`에 들어간다.
2. `batch_0002`만 다시 실행한다. 다시 실패하면 병합을 진행한다.
3. `요약.md`의 「누락」에 `batch_0002(부서명, N건): 배정 결과 없음`이 나오고, 그 묶음의 제목은 `ledger.json`에 들어가지 않아 다음 실행에서 다시 대상이 된다.

**형식 오류 흐름**

에이전트가 묶음에 없는 ID(예: 기억으로 지어낸 `F9999`)를 쓰면 `validate_batch.py`가 `k003: F9999는 이 묶음의 후보에 없다`를 출력하고 종료 코드 1을 낸다. 에이전트는 해당 항목을 고쳐 다시 검사한다.

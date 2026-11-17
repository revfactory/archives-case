---
name: classification-audit
description: 한국공항공사 기록물 생산현황에서 사람이 고른 단위업무·기록물철 분류가 제목과 맞는지 점검하고, 잘못 분류된 건을 찾아 정정안을 만드는 오케스트레이터. 기존 분류 열이 들어 있는 xlsx·csv를 받아 의심 건 선별, 독립 판단, 판정, 반박 검증, 결과표 작성까지 실행한다. '분류 점검', '오분류 찾아줘', '단위업무가 제대로 분류됐는지 확인', '잘못 분류된 기록물 정정', '분류 정정안'을 요청받으면 반드시 사용한다. '점검 다시 실행', '남은 의심 건 이어서', '이 부서만 다시', '이전 결과를 바탕으로 보완', '결과 개선' 같은 후속 요청에도 사용한다. 분류가 없는 제목에 처음으로 기록물철을 배정하는 일은 kac-record-assign 하네스의 record-assign 스킬이 맡는다.
---

# 분류 점검·정정 오케스트레이터

사람이 고른 기존 분류 가운데 틀린 것을 찾아 정정안을 만든다. 전수를 모델에 보내지 않고 스크립트로 의심 건을 먼저 추린 뒤, 에이전트 세 단계를 거친다.

## 먼저 확인할 데이터 제약

- 공용 문서목록(`../kac-shared/data/production.sqlite`)에는 사람이 고른 단위업무·기록물철 열이 **없다**. 이 하네스는 기존 분류 열이 들어 있는 입력 파일이 있어야 실제 점검을 할 수 있다.
- 입력 파일이 없으면 사용자에게 아래 형식의 파일을 요청한다. 시험 자료(`make_testdata.py`)는 스크립트 동작과 탐지율 계산 방법을 확인하는 용도이며, 그 결과를 실제 점검 결과로 보고하지 않는다.

### 입력 파일 형식

xlsx(첫 행이 머리글. 시트가 여러 개면 모두 읽으며 `--sheet`로 하나만 지정 가능) 또는 csv(UTF-8).

| 항목 | 필수 | 내용 |
| --- | --- | --- |
| 부서명 | 필수 | 문서목록의 표기(예: 김포운영단). `../kac-shared/data/dept_map.json`에 있는 이름 |
| 제목 | 필수 | 기록물 제목 |
| 기존 단위업무명 | 둘 중 하나 이상 | 사람이 고른 단위업무 이름. 분류 색인 ID(U0001, C001)도 가능 |
| 기존 기록물철명 | 둘 중 하나 이상 | 사람이 고른 기록물철 이름. 분류 색인 ID(F0001)도 가능 |
| 문서구분, 등록일자, 문서번호, 수신·발신처 | 선택 | 있으면 판단과 결과표에 쓴다 |

입력 파일의 머리글이 다르면 `config/columns.json`의 값을 실제 머리글로 고친다.

## 구성

| 에이전트 | 모델 | 단계 | 하는 일 |
| --- | --- | --- | --- |
| `blind-classifier` | sonnet | 독립 판단 | 기존 분류를 보지 않고 제목만으로 단위업무·기록물철 판단 |
| `label-judge` | opus | 판정 | 독립 판단과 기존 분류가 다른 항목의 오류 여부 판정, 정정안 제시 |
| `correction-challenger` | opus | 반박 검증 | '오류' 판정에 대해 기존 분류가 타당할 근거를 찾아 반박 시도 |

세 에이전트의 판단 기준과 결과 파일 형식은 `classification-audit-rules` 스킬에 있다. 스크립트는 이 스킬의 `scripts/`에 있고 프로젝트 루트(`kac-classification-audit/`)에서 실행한다.

| 스크립트 | 하는 일 |
| --- | --- |
| `ingest.py` | 입력 파일을 `_workspace/{run}/records.sqlite`로 옮기고 기존 분류명을 분류 색인 ID에 대응 |
| `screen.py` | 의심 신호 S1~S4 계산(`groups` 표, `screen_summary.json`) |
| `make_batches.py` | 의심 제목을 부서별 묶음으로 작성. `batches/`(기존 분류 없음)와 `labels/`(기존 분류·신호)를 분리 |
| `compare.py` | 독립 판단과 기존 분류 비교, 판정 필요 항목 선정(`compare/`) |
| `validate_batch.py` | 단계별 결과 파일 형식 검사(`blind`, `judge`, `challenge`) |
| `merge_results.py` | 최종 구분 결정, 결과표·요약 작성(`output/{run}/`) |
| `make_testdata.py`, `evaluate.py` | 오류를 주입한 시험 자료 생성, 정답 대조 평가 |

## 0단계: 실행 상황 확인

**실행 모드:** 메인이 직접 수행

1. `../kac-shared/data/classification.json`과 `dept_map.json`이 있는지 확인한다. 없으면 `../kac-shared/README.md`의 준비 스크립트를 먼저 실행해야 한다고 알린다(공용 폴더는 이 하네스가 고치지 않는다).
2. `_workspace/`의 실행 폴더와 `manifest.json`을 확인하고 요청을 다음 가운데 하나로 구분한다.

| 상황 | 처리 |
| --- | --- |
| 새 입력 파일을 받음 | 새 실행 이름(예: `audit_20261112`)으로 1단계부터 실행. 기존 실행 폴더는 그대로 둔다 |
| 같은 입력의 남은 의심 건을 이어서 점검 | 같은 실행 이름으로 3단계의 `make_batches.py`부터 실행. 이미 묶음에 넣은 제목은 자동으로 빠진다 |
| 특정 묶음·단계만 다시 | 해당 묶음의 그 단계 결과 파일을 `_workspace/{run}/redo_{순번}/`으로 옮긴 뒤 4단계에서 그 묶음만 실행. 앞 단계를 다시 하면 뒤 단계 파일도 함께 옮긴다 |
| 선별 기준만 바꿈 | `screen.py`를 새 기준으로 다시 실행. 이미 만든 묶음은 유지되고 새로 의심 건이 된 제목만 다음 `make_batches.py`에 들어간다 |
| 직전 워크플로가 중단됨 | 같은 스크립트와 `args`로 `resumeFromRunId`를 지정해 재개. 끝난 에이전트 호출은 저장된 결과를 쓴다 |

3. 점검 범위(부서, 이번에 볼 의심 제목 수)를 사용자 요청에서 정한다. 요청에 없으면 의심 제목 200건을 기본으로 하고, 사용자가 '전수', '철저히'를 요구했을 때만 늘린다.

## 1단계: 수집

**실행 모드:** 메인이 스크립트 실행

```bash
python3 .claude/skills/classification-audit/scripts/ingest.py --run {run} --input {입력 파일}
```

출력된 요약에서 다음을 확인하고 사용자에게 알린다.

- `분류기준표에 없는 분류명`이 전체의 20%를 넘으면 열 대응이 틀렸거나 입력의 분류 체계가 분류기준표와 다른 판본일 수 있다. 진행하기 전에 사용자에게 확인한다.
- `부서대응표에_없는_부서`가 있으면 그 부서는 부서 후보 없이 부서공통·추가후보만으로 판단하게 된다.

## 2단계: 의심 건 선별

**실행 모드:** 메인이 스크립트 실행

```bash
python3 .claude/skills/classification-audit/scripts/screen.py {run}
```

| 신호 | 뜻 |
| --- | --- |
| S1 | 같은 부서·같은 유형의 제목(숫자만 다른 제목)이 서로 다른 단위업무에 나뉘어 있음 |
| S2 | 제목과 기존 단위업무의 글자 유사도가 낮고 다른 단위업무와는 `--margin`(기본 0.15) 이상 높음 |
| S3 | 기존 단위업무가 부서 대응표상 그 부서 소관이 아님 |
| S4 | 기존 분류명이 분류기준표에 없음 |

의심 묶음이 전체의 절반을 넘으면 `--margin`을 올려 다시 실행할지 사용자와 정한다. 신호가 없는 문서는 점검하지 않으므로, 최종 보고에 점검하지 않은 문서 수를 반드시 적는다.

## 3단계: 묶음 작성

**실행 모드:** 메인이 스크립트 실행

```bash
python3 .claude/skills/classification-audit/scripts/make_batches.py {run} --limit 200 --control 20
```

- `--control`은 의심 신호가 없는 제목을 대조 표본으로 넣는다. 선별이 놓친 오류가 있는지 확인하는 용도이며 첫 실행에서는 넣는다.
- 출력의 `새_묶음` 목록을 4단계에 넘긴다.

## 4단계: 독립 판단 → 판정 → 반박 검증

**실행 모드:** 워크플로 조율. 처리할 묶음 목록과 단계 순서가 정해져 있고 묶음끼리 독립이므로 `pipeline()`으로 묶음마다 세 단계를 이어 실행한다. 사용자가 이 스킬을 불러 점검을 요청한 것은 `Workflow` 실행에 동의한 것으로 본다. 묶음이 한두 개뿐이면 같은 순서로 `Agent`를 직접 호출해도 된다.

워크플로 스크립트는 파일을 읽지 못한다. 에이전트가 경로를 받아 파일을 읽고, 결과 파일을 쓰고, 검사 스크립트를 통과시킨 뒤 건수만 반환한다.

`args`: `{"root": "{프로젝트 루트 절대 경로}", "run": "{run}", "batches": ["batch_0001", ...]}`

```javascript
export const meta = {
  name: 'classification-audit',
  description: '기존 분류 점검: 묶음마다 독립 판단, 판정, 반박 검증을 차례로 실행',
  phases: [
    { title: '독립 판단', detail: '기존 분류를 보지 않고 제목으로 판단', model: 'sonnet' },
    { title: '판정', detail: '기존 분류와 다른 항목의 오류 여부 판정', model: 'opus' },
    { title: '반박 검증', detail: '오류 판정에 대한 반박 시도', model: 'opus' },
  ],
}

const { root, run, batches } = args
const scripts = '.claude/skills/classification-audit/scripts'
const SUMMARY = {
  type: 'object',
  properties: {
    batch_id: { type: 'string' },
    validated: { type: 'boolean', description: 'validate_batch.py가 OK를 출력했는지' },
    count: { type: 'integer', description: '결과 파일에 쓴 항목 수' },
    errors: { type: 'integer', description: '판정 단계에서 verdict가 오류인 항목 수. 다른 단계는 0' },
    note: { type: 'string' },
  },
  required: ['batch_id', 'validated', 'count', 'errors'],
}
const head = (bid) => `작업 폴더: ${root}\n실행 이름: ${run}\n묶음: ${bid}\n모든 명령은 작업 폴더에서 실행한다.\n`

const done = await pipeline(
  batches,
  (bid) => agent(
    head(bid) +
    `_workspace/${run}/batches/${bid}.json의 제목을 classification-audit-rules 스킬의 「1. 독립 판단」에 따라 판단해 ` +
    `_workspace/${run}/results/${bid}.json에 쓰고, python3 ${scripts}/validate_batch.py ${run} blind ${bid} 검사를 통과시켜라. ` +
    `labels, compare, judge, challenge 폴더는 열지 않는다.`,
    { agentType: 'blind-classifier', phase: '독립 판단', label: `독립 판단 ${bid}`, schema: SUMMARY }),
  (blind, bid) => {
    if (!blind || !blind.validated) return { batch_id: bid, stage: '독립 판단', failed: true }
    return agent(
      head(bid) +
      `python3 ${scripts}/compare.py ${run} ${bid}를 실행한 뒤, _workspace/${run}/compare/${bid}.json에서 판정필요가 true인 항목을 ` +
      `classification-audit-rules 스킬의 「2. 판정」에 따라 판정해 _workspace/${run}/judge/${bid}.json에 쓰고, ` +
      `python3 ${scripts}/validate_batch.py ${run} judge ${bid} 검사를 통과시켜라. errors에는 verdict가 오류인 항목 수를 적는다.`,
      { agentType: 'label-judge', phase: '판정', label: `판정 ${bid}`, schema: SUMMARY })
  },
  (judge, bid) => {
    if (!judge || judge.failed) return judge || { batch_id: bid, stage: '판정', failed: true }
    if (!judge.validated) return { batch_id: bid, stage: '판정', failed: true }
    if (judge.errors === 0) return { batch_id: bid, stage: '완료', errors: 0, challenged: 0 }
    return agent(
      head(bid) +
      `_workspace/${run}/judge/${bid}.json에서 verdict가 오류인 항목을 classification-audit-rules 스킬의 「3. 반박 검증」에 따라 검증해 ` +
      `_workspace/${run}/challenge/${bid}.json에 쓰고, python3 ${scripts}/validate_batch.py ${run} challenge ${bid} 검사를 통과시켜라.`,
      { agentType: 'correction-challenger', phase: '반박 검증', label: `반박 검증 ${bid}`, schema: SUMMARY })
      .then((c) => (c && c.validated)
        ? { batch_id: bid, stage: '완료', errors: judge.errors, challenged: c.count }
        : { batch_id: bid, stage: '반박 검증', failed: true })
  })

const results = done.filter(Boolean)
const failed = results.filter((r) => r.failed)
log(`묶음 ${batches.length}개 가운데 완료 ${results.length - failed.length}개, 단계 실패 ${failed.length}개, 결과 없음 ${batches.length - results.length}개`)
return { completed: results.filter((r) => !r.failed), failed, missing: batches.length - results.length }
```

## 5단계: 병합과 보고

**실행 모드:** 메인이 스크립트 실행

```bash
python3 .claude/skills/classification-audit/scripts/merge_results.py {run}
```

| 최종 구분 | 조건 |
| --- | --- |
| 정정 권고 | 판정이 '오류'이고 반박 검증이 '반박 실패' |
| 유지 | 독립 판단이 기존 분류와 일치하거나 판정이 '기존 타당' |
| 사람 확인 필요 | 판정 '판단불가', 반박 '반박 성공'·'판단불가', 기존 분류명이 분류기준표에 없음, 단계 결과 누락 |

산출물은 `output/{run}/`의 `점검결과.csv`(문서 1건당 1행), `정정안.csv`, `사람확인.csv`(제목·기존 분류 묶음 단위), `요약.md`다. 사용자에게는 요약의 수치, 정정안 상위 몇 건, 점검하지 않은 문서 수, 누락된 묶음을 알린다. 대조 표본에서 정정 권고가 나왔으면 선별 기준을 낮춰 다시 선별하자고 제안한다.

원본 입력 파일과 등록 시스템의 분류는 이 하네스가 고치지 않는다. 정정안을 반영하는 일은 사용자가 정한다.

## 데이터 전달

| 단계 | 읽는 파일 | 쓰는 파일 |
| --- | --- | --- |
| 수집 | 입력 xlsx·csv, `config/columns.json`, 공용 색인 | `_workspace/{run}/records.sqlite`, `ingest_summary.json` |
| 선별 | `records.sqlite` | `records.sqlite`의 `groups` 표, `screen_summary.json` |
| 묶음 | `groups` 표, 공용 색인 | `batches/{bid}.json`, `labels/{bid}.json`, `manifest.json` |
| 독립 판단 | `batches/{bid}.json` | `results/{bid}.json` |
| 판정 | `batches/`, `labels/`, `results/` → `compare/{bid}.json` | `judge/{bid}.json` |
| 반박 검증 | `judge/`, `compare/`, `batches/` | `challenge/{bid}.json` |
| 병합 | 위 전부 | `output/{run}/` |

워크플로의 반환값은 묶음별 건수뿐이다. 판단 내용은 모두 파일로 전달하며 `_workspace/`는 사후 확인을 위해 지우지 않는다.

## 오류 처리

- 워크플로가 반환한 `failed`와 `missing` 묶음은 해당 단계부터 한 번만 다시 실행한다. 또 실패하면 그 묶음 없이 병합하고, `요약.md`의 「누락」에 적힌 내용을 사용자에게 그대로 알린다. `merge_results.py`는 판정이나 반박 결과가 없는 항목을 '사람 확인 필요'로 둔다.
- 사용량 한도 소진, 인증 만료, 권한 거부로 실패했으면 다시 시도하지 않는다. `results/`, `judge/`, `challenge/`에 실제로 있는 파일을 확인해 어디까지 진행됐는지 사용자에게 알리고, 사용량 한도라면 풀리는 시각도 알린다.
- 실패한 묶음의 결과 파일을 메인이 대신 작성하지 않는다. 에이전트의 판단을 추측해 채우면 점검 기록이 사실과 달라진다.
- 검사를 통과하지 못한 결과 파일은 병합 전에 `validate_batch.py`로 다시 확인하고, 통과하지 못하면 그 파일을 `redo_{순번}/`으로 옮겨 누락으로 처리한다.
- 판정과 반박 검증의 결론이 다른 건은 지우지 않고 양쪽 근거를 `사람확인.csv`에 함께 남긴다.

## 테스트 시나리오

### 정상 흐름(시험 자료)

1. `python3 .claude/skills/classification-audit/scripts/make_testdata.py` → 600건, 오류 주입 128건(같은 인자면 항상 같은 결과).
2. `ingest.py --run test01 --input _workspace/testdata/sample_input.csv` → 600건 모두 U 또는 F로 대응.
3. `screen.py test01` → `evaluate.py test01`에서 선별 재현율 97.7%(주입 128건 가운데 125건에 신호), 주입하지 않은 문서의 11.4%에 신호.
4. `make_batches.py test01 --limit 60 --control 10 --batch-size 30` → 묶음 5개.
5. 4단계 워크플로를 묶음 5개로 실행 → `merge_results.py test01` → `evaluate.py test01`로 주입한 오류의 정정 권고 비율과 주입하지 않은 문서의 정정 권고 수를 확인한다.

시험 자료의 기본 분류는 글자 유사도로 붙였고 선별 신호 S2도 같은 유사도를 쓰므로, 시험 자료의 선별 재현율은 실제 자료보다 높게 나온다. 실제 자료에서는 대조 표본 결과로 선별 누락을 확인한다. `answer.csv`는 에이전트에게 주지 않는다.

### 오류 흐름

1. 독립 판단 에이전트가 후보에 없는 ID를 쓰거나 key를 빠뜨림 → `validate_batch.py`가 종료 코드 1과 함께 해당 key와 사유를 출력 → 에이전트가 고쳐 다시 검사.
2. 한 묶음의 반박 검증이 실패해 `challenge/{bid}.json`이 없음 → 한 번 재실행 → 또 실패하면 병합 시 그 묶음의 '오류' 판정 항목이 모두 '사람 확인 필요(반박 검증 결과 누락)'가 되고, 사용자 보고에 누락 묶음을 적는다.
3. 입력 파일에 기존 분류 열이 없음 → `ingest.py`가 필수 열을 찾지 못했다는 메시지와 함께 종료 → 사용자에게 입력 파일 형식을 안내한다.

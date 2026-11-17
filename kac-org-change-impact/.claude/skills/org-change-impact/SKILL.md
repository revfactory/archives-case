---
name: org-change-impact
description: 한국공항공사 조직변경(부서 신설·폐지·통합·분리·명칭 변경·업무 이관, 신규 기관장 취임이나 신규사업 추진에 따른 직제 개편)이 기록물분류기준표의 단위업무·기록물철에 주는 영향을 분석하고 분류기준표 변경안과 영향도 보고서를 만든다. 직제규정·시행세칙 신구 차수 비교와 말로 준 조직변경 시나리오를 모두 입력으로 받는다. '조직개편 영향 분석', '직제 개정 반영', '시행세칙 48차 반영', '부서 통합하면 단위업무 어떻게 되나', '분류기준표 변경안', '조직변경 영향도' 요청에 반드시 사용한다. '다시 실행', '재실행', '업데이트', '수정', '보완', '특정 사건만 다시', '이전 결과를 바탕으로', '결과 개선', '보고서만 다시' 같은 후속 요청에도 사용한다. 문서 제목을 기록물철에 배정하는 일, 조직을 어떻게 바꿀지 추천하는 일, 보존기간 책정에는 쓰지 않는다.
---

# 조직변경 영향 분석 오케스트레이터

조직변경을 사건 단위로 정리하고, 사건마다 영향받는 단위업무·기록물철을 판정·검증해 분류기준표 변경안을 만든다.

## 전제

- Claude Code 세션을 이 폴더(`kac-org-change-impact/`)에서 시작한다. 그래야 `.claude/agents/`의 사용자 정의 에이전트가 등록된다. 등록되지 않았으면 `general-purpose` 유형을 쓰고 프롬프트 첫 줄에 "`.claude/agents/{이름}.md`를 읽고 그 역할과 규칙을 따르라"를 넣는다.
- 공용 데이터 `../kac-shared/data/`는 읽기만 한다. 분류기준표 원본도 고치지 않는다. 변경안은 `output/{run}/`의 CSV로만 낸다.
- 스크립트 경로는 `.claude/skills/org-change-impact/scripts/`다. 아래에서는 `S/`로 줄여 쓴다.

## 구성

| 에이전트 | 모델 | 하는 일 | 스킬 |
| --- | --- | --- | --- |
| `org-change-interpreter` | opus | 차수 비교·시나리오를 사건 목록으로 정리 | `unit-task-impact-rules` |
| `unit-impact-analyst` | opus | 사건별 단위업무 영향 판정과 조치 제안 | `unit-task-impact-rules` |
| `change-proposal-verifier` | opus | 제안 검증과 누락 검토 | `unit-task-impact-rules` |
| `impact-report-writer` | sonnet | 영향도 보고서 작성 | 이 스킬의 `references/report-outline.md` |

모델을 이렇게 고른 이유: 앞의 셋은 범위가 정해진 문구 대조·교차 검증이라 opus, 보고서는 집계된 결과를 정해진 목차로 옮기는 일이라 sonnet이다. 전체 흐름은 스크립트와 이 문서가 정하므로 장기 자율 실행용 모델(fable)은 쓰지 않는다.

파일 형식은 `references/data-contracts.md`에 있다. 에이전트를 부를 때 이 경로를 알려 준다.

## 0단계: 실행 상황 판단

`_workspace/`와 `output/`을 확인해 셋 중 하나로 정한다.

| 상황 | 판단 기준 | 할 일 |
| --- | --- | --- |
| 처음 실행 | 요청한 조직변경에 해당하는 `_workspace/{run}/`이 없음 | 1단계부터. `{run}`은 `세칙46-47`, `시나리오-신공항통합`처럼 내용이 드러나는 이름으로 정한다 |
| 새 입력으로 다시 실행 | 같은 이름의 실행 폴더가 있는데 입력(차수·시나리오)이 바뀜 | 기존 `_workspace/{run}`과 `output/{run}`을 `{run}_{YYYYMMDD-HHMM}`으로 옮긴 뒤 1단계부터 |
| 부분 재실행 | 실행 폴더가 있고 "E03만 다시", "보고서만 다시", "검증 의견 반영" 요청 | 아래 표의 해당 단계만 |

| 요청 | 다시 실행할 단계 |
| --- | --- |
| 사건 정리 수정 | 2단계(해당 사건만) → 고친 사건의 3~5단계 |
| 특정 사건 다시 분석 | 그 사건의 `04_proposals`, `05_verify` 파일을 지우고 4단계를 그 사건만 → 5·6단계 |
| 검증 의견·사용자 피드백 반영 | `unit-impact-analyst`를 그 사건으로 다시 호출(피드백 전달) → 검증 다시 → 5·6단계 |
| 보고서만 수정 | 6단계 |

직전 Workflow의 `runId`를 알고 있고 스크립트와 `args`가 같으면 `resumeFromRunId`로 재개한다. 끝난 사건은 저장된 결과를 쓴다.

## 1단계: 준비

**실행 모드:** 메인이 스크립트 실행

```bash
python3 S/prepare.py     # hwpx 본문 추출 → 업무분장 구조화(전 차수) → 분류기준표 부서 대응표
```

- `_workspace/_regulations/index.json`이 있고 원본 폴더에 새 hwpx가 없으면 건너뛴다.
- 출력의 "대응 실패" 목록에 새 부서 표기가 나오면 `data/org_alias.json`에 별칭을 추가하고 다시 실행한다. 세칙에 없는 TF 등은 `직제에_없음`에 넣는다.
- 새 차수 파일은 `(한국공항공사) 기록물분류체계/1-2. 직제규정시행세칙/` 아래에 hwpx로 둔다. 파일명에 `NN차`가 있어야 차수를 읽는다. pdf만 있으면 사용자에게 hwpx를 요청한다.

## 2단계: 조직변경을 사건으로 정리

**실행 모드:** 서브에이전트 위임(`org-change-interpreter` 1회)

입력 준비

- (가) 차수 비교: `python3 S/diff_org.py {run} {구차수} {신차수}` → `01_org_diff.json`. 출력에 변경이 0건이면(예: 46차 → 47차는 정원만 개정) 사건이 없다고 사용자에게 알리고 끝낸다.
- (나) 시나리오: 사용자 문장을 고치지 않고 `_workspace/{run}/00_scenario.md`에 저장한다.
- 둘 다 주어지면 한 실행에 함께 넣는다.

`org-change-interpreter`를 호출해 `02_changes.json`을 받는다. 프롬프트에 실행 폴더, 입력 파일, `references/data-contracts.md` 경로를 적는다.

**사용자 확인:** 사건 표(ID, 유형, 요약, 확신도, 분류기준표 영향)와 `확인필요` 질문을 보여 주고 확인받는다. 사건 해석이 틀리면 뒤 단계 전체가 틀리기 때문이다. 수정 요청은 같은 에이전트를 다시 호출해 반영한다.

## 3단계: 영향 후보 조회

**실행 모드:** 메인이 스크립트 실행

```bash
python3 S/impact_lookup.py {run}      # → 03_candidates/{event_id}.json, _summary.json
```

`_summary.json`에서 후보가 0개인 사건과 `유의`를 확인한다. 후보가 0개이고 `분류기준표_영향`이 `있음`이면 부서명 표기가 세칙과 다른 것이므로 `02_changes.json`의 부서명을 고치고 다시 실행한다.

## 4단계: 사건별 분석과 검증

**실행 모드:** 워크플로 조율(사건 목록을 `pipeline()`으로 처리. 사건마다 분석 → 검증)

사건 목록과 처리 순서가 정해져 있고 사건끼리 독립이므로 워크플로를 쓴다. 대상은 `02_changes.json`에서 `분류기준표_영향`이 `없음`이 아닌 사건이다. 사건이 2건 이하이면 워크플로 대신 `Agent`로 분석 → 검증을 순서대로 호출해도 된다.

`Workflow`의 `args`에 `{ "run": "{run}", "events": [{"event_id": "E01", "요약": "..."}] }`를 넘긴다(JSON 값으로 넘기고 문자열로 감싸지 않는다).

```javascript
export const meta = {
  name: 'org-change-impact',
  description: '조직변경 사건별로 단위업무 영향을 분석하고 제안을 검증한다',
  phases: [
    { title: '영향 분석', detail: '사건마다 unit-impact-analyst 1회' },
    { title: '검증', detail: '사건마다 change-proposal-verifier 1회' },
  ],
}

const run = args.run
const SUMMARY = {
  type: 'object',
  properties: {
    event_id: { type: 'string' },
    validated: { type: 'boolean', description: 'validate.py가 OK를 냈는가' },
    counts: { type: 'object', description: '조치별 또는 판정별 개수' },
    notes: { type: 'string', description: '미해결·누락·오류 요약' },
  },
  required: ['event_id', 'validated', 'notes'],
}
const CONTRACT = '.claude/skills/org-change-impact/references/data-contracts.md'

const results = await pipeline(
  args.events,
  ev => agent(
    `조직변경 사건 ${ev.event_id}(${ev.요약})의 분류기준표 영향을 분석하라. ` +
    `입력: _workspace/${run}/03_candidates/${ev.event_id}.json. ` +
    `출력: _workspace/${run}/04_proposals/${ev.event_id}.json (형식: ${CONTRACT}). ` +
    `쓴 뒤 validate.py ${run} proposal ${ev.event_id}를 실행해 OK를 확인하라.`,
    { agentType: 'unit-impact-analyst', schema: SUMMARY, label: `분석:${ev.event_id}`, phase: '영향 분석' }),
  (analysis, ev) => {
    if (!analysis || !analysis.validated) {
      return { event_id: ev.event_id, analysis, verify: null }
    }
    return agent(
      `조직변경 사건 ${ev.event_id}(${ev.요약})의 변경 제안을 검증하라. ` +
      `입력: _workspace/${run}/04_proposals/${ev.event_id}.json, 03_candidates/${ev.event_id}.json. ` +
      `출력: _workspace/${run}/05_verify/${ev.event_id}.json (형식: ${CONTRACT}). ` +
      `쓴 뒤 validate.py ${run} verify ${ev.event_id}를 실행해 OK를 확인하라.`,
      { agentType: 'change-proposal-verifier', schema: SUMMARY, label: `검증:${ev.event_id}`, phase: '검증' })
      .then(verify => ({ event_id: ev.event_id, analysis, verify }))
  }
)

const done = results.filter(Boolean)
const failed = args.events.length - done.filter(r => r.analysis && r.analysis.validated).length
const unverified = done.filter(r => r.analysis && r.analysis.validated && !(r.verify && r.verify.validated)).length
log(`사건 ${args.events.length}건 중 분석 실패 ${failed}건, 검증 누락 ${unverified}건`)
return { run, results: done, failed, unverified }
```

워크플로가 끝나면 메인이 사건마다 `validate.py {run} proposal {id}`와 `verify {id}`를 직접 실행해 파일이 실제로 있고 형식이 맞는지 확인한다. 에이전트의 `validated` 반환값만 믿지 않는다.

## 5단계: 변경안 표 생성

**실행 모드:** 메인이 스크립트 실행

```bash
python3 S/build_change_table.py {run}
```

`output/{run}/`에 `분류기준표_변경안.csv`, `신설_단위업무_제안.csv`, `분류기준표_변경적용본.csv`, `06_impact_stats.json`이 생긴다. 출력의 `분석되지_않은_사건`을 확인한다.

## 6단계: 영향도 보고서

**실행 모드:** 서브에이전트 위임(`impact-report-writer` 1회)

`output/{run}/영향도_보고서.md`를 받는다. 메인은 보고서의 핵심 숫자를 `06_impact_stats.json`과 대조한 뒤 사용자에게 요약(사건 수, 확정안·검토필요 기록물철 수, 사람이 결정할 사항)과 파일 경로를 알린다.

## 데이터 전달

| 단계 | 쓰는 주체 | 파일 | 읽는 주체 |
| --- | --- | --- | --- |
| 1 | `prepare.py` | `_workspace/_regulations/` (본문, `조직_NN차.json`, `분류기준표_직제대응_NN차.json`) | 전 단계 |
| 2 | `diff_org.py` / 메인 | `_workspace/{run}/01_org_diff.json` / `00_scenario.md` | `org-change-interpreter` |
| 2 | `org-change-interpreter` | `02_changes.json` | `impact_lookup.py`, 메인 |
| 3 | `impact_lookup.py` | `03_candidates/{event_id}.json` | `unit-impact-analyst`, `change-proposal-verifier` |
| 4 | `unit-impact-analyst` | `04_proposals/{event_id}.json` | `change-proposal-verifier`, `build_change_table.py` |
| 4 | `change-proposal-verifier` | `05_verify/{event_id}.json` | `build_change_table.py` |
| 5 | `build_change_table.py` | `06_impact_stats.json`, `output/{run}/*.csv` | `impact-report-writer` |
| 6 | `impact-report-writer` | `output/{run}/영향도_보고서.md` | 사용자 |

에이전트 사이의 전달은 모두 파일로 한다. 워크플로의 반환값은 통과 여부와 개수만 담는다. `_workspace/`는 사후 확인을 위해 지우지 않는다.

## 오류 처리

- 에이전트가 실패하거나 형식 검사를 통과하지 못하면 그 사건만 한 번 다시 호출한다. 또 실패하면 그 사건 없이 진행한다. `build_change_table.py`가 "제안 파일 없음"으로 기록하고 보고서 7절에 실린다.
- 검증만 실패한 사건은 상태가 `미검증`으로 표에 실린다. 확정안으로 취급하지 않는다.
- 사용량 한도 소진, 인증 만료, 권한 거부는 다시 시도하지 않는다. `04_proposals/`와 `05_verify/`에 실제로 있는 파일을 확인해 어느 사건까지 끝났는지 사용자에게 알리고, 사용량 한도라면 풀리는 시각도 알린다.
- 실패한 에이전트의 판정을 메인이 추측해서 채우지 않는다. 메인이 대신 적을 수 있는 것은 스크립트 출력처럼 직접 확인한 사실뿐이다.
- 워크플로에서 실패한 `agent()`는 `null`을 반환한다. 스크립트는 `null`을 걸러 내고 실패 건수를 `log()`로 알린다.
- hwpx 구조가 달라 `parse_org.py`가 부서를 0개로 읽으면 본문(`시행세칙_NN차.txt`)에서 "(별표 3)" 위치와 표 머리글("부 서 명 | 업 무 분 장")을 확인한다. 고칠 수 없으면 시나리오 입력으로 바꿔 진행할지 사용자에게 묻는다.
- 분류기준표가 바뀌었으면 `../kac-shared/scripts/build_index.py`를 다시 실행해야 `unit_id`·`file_id`가 맞는다. 이전 실행의 ID는 새 색인과 다를 수 있으므로 이전 `_workspace/{run}`을 이어 쓰지 않는다.

## 알려진 제약

- 세칙 46차 → 47차는 업무분장 변경이 없다(정원만 개정). 실제 변경이 있는 비교는 44 → 45차(신공항건설부를 1부·2부로 분리)와 45 → 46차(청주공항 분리, 3개 부 신설)다.
- 분류기준표는 이 변경들을 이미 반영하고 있어, 과거 차수 비교를 넣으면 대부분 "이미 반영됨(유지)"으로 나온다. 차수 비교 입력은 48차 이후 개정에 쓰고, 그 전에는 시나리오 입력으로 쓴다.
- 분류기준표에는 세칙 47차 업무분장에 없는 부서(디지털트윈사업부, 건설사업TF부, 개선사업TF부)가 있고, 세칙에 있는 부서 31개(제주·김해 운영단·시설단, 무안공항 등)는 분류기준표에 항목이 없다. 이 부서의 변경은 `분류기준표_영향: 불명`으로 처리한다.
- 문서 규모는 문서목록의 부서명 단위 건수다. 부·단위업무 단위 건수는 낼 수 없다.
- 직제규정(39~41차)은 본문만 추출한다. 본부·실 단위 기구표(별표 2)는 그림이라 글자로 읽히지 않으므로 부서 구조는 시행세칙 별표 3에서 읽는다.

## 테스트 시나리오

**정상 흐름 (시나리오 입력)**

1. 요청: "신공항추진단 신공항건설1부를 건설사업실 소속으로 옮기고, KAC-BIM 사업관리 업무는 스마트공항추진실 데이터융합부로 이관하면 분류기준표가 어떻게 바뀌나?"
2. 0단계: 실행 폴더 없음 → 처음 실행, `run = 시나리오-신공항건설1부이동`.
3. 1단계 `prepare.py`(이미 준비되어 있으면 생략) → 2단계 `00_scenario.md` 저장, `org-change-interpreter`가 사건 2건(상위조직변경 E01, 업무이관 E02) 작성, `validate.py changes` OK, 사용자 확인.
4. 3단계 `impact_lookup.py`: E01 후보 2개 단위업무(U0086, U0087), E02 후보에 디지털트윈사업부의 BIM 단위업무(U0079 등)가 문구 유사로 올라옴.
5. 4단계 워크플로: 사건 2건 각각 분석 → 검증. 기대 결과: E01은 U0087 부서레벨변경, U0086(1부·2부 공동)은 이관 또는 미해결. E02는 KAC-BIM이 이미 디지털트윈사업부 소관으로 표에 있다는 점이 미해결 또는 검증 의견에 드러남.
6. 5단계 CSV 3종과 집계, 6단계 보고서. 메인이 숫자를 대조하고 보고.

**정상 흐름 (차수 비교, 변경 없음)**

1. 요청: "시행세칙 46차에서 47차로 바뀐 것 반영해 줘."
2. `diff_org.py`가 변경 0건을 출력 → 사건이 없다고 알리고 끝낸다. 에이전트를 호출하지 않는다.

**오류 흐름 (사건 1건 분석 실패)**

1. 4단계에서 E02의 `unit-impact-analyst`가 형식 검사를 통과하지 못해 `validated: false` 반환 → 워크플로가 E02 검증을 건너뛰고 `log`에 "분석 실패 1건"을 남김.
2. 메인이 E02만 `Agent`로 한 번 다시 호출. 또 실패하면 E02 없이 5단계 진행.
3. `build_change_table.py`가 E02를 `분석되지_않은_사건`에 "제안 파일 없음"으로 기록 → 보고서 7절과 사용자 보고에 누락 사실을 적는다.

**오류 흐름 (부서명 불일치)**

1. 시나리오에 "AS운영부"처럼 세칙과 다른 표기가 들어와 3단계에서 후보 0개 + "분류기준표에 대응 항목이 없다" 유의가 나옴.
2. `조직_47차.json`에서 세칙 표기(에어사이드 운영부)를 찾아 `02_changes.json`을 고치고 3단계를 다시 실행한다.

---
name: org-strategy
description: 한국공항공사의 단위업무(기록물분류기준표)를 기준으로 전략적 조직 개편 대안을 만들고 경영진용 추천 보고서를 쓰는 오케스트레이터. "조직 개편안 추천해줘", "단위업무 기준으로 조직을 어떻게 바꿀지", "안전 기능 통합 방안", "신사업 전담 조직 검토", "지방 공항 조직 효율화", "경영진 보고용 조직 개편 대안"처럼 조직을 어떻게 바꿀지 묻는 요청에 반드시 사용한다. "조직 개편 다시 실행", "전략 방향 바꿔서 재실행", "OPT-B만 다시", "보고서만 수정", "이전 결과를 바탕으로 보완" 같은 후속 요청에도 사용한다. 이미 결정된 조직 변경이 단위업무·분류기준표에 미치는 영향을 계산하는 일, 문서 제목을 기록물철에 배정하는 일, 단위업무명을 새로 제안하는 일은 이 스킬의 범위가 아니다.
---

# 조직 개편 추천 오케스트레이터

단위업무 703개가 부서에 배치된 현재 상태를 자료로 진단하고, 관점이 다른 대안 3건을 독립적으로 설계해 반박 검토를 거친 뒤 경영진용 보고서로 종합한다.

## 실행 모드

**워크플로 조율**이다. 처리 목록(관점 3개)과 단계(진단·제약 → 설계 → 검토 → 보완 → 종합), 보완 횟수(1회)를 미리 코드로 정할 수 있기 때문이다. 사용자가 이 스킬을 불러 조직 개편 추천을 요청했으면 `Workflow` 실행에 동의한 것으로 본다. 0단계·1단계와 5단계는 메인이 직접 한다. 일부만 다시 실행할 때는 **서브에이전트 위임**(`Agent` 한 번 호출)을 쓴다.

## 구성

| 에이전트 | 모델 | 역할 | 쓰는 스킬 |
| --- | --- | --- | --- |
| `org-diagnostician` | opus | 사실 자료로 조직 진단 | `unit-task-org-design` |
| `regulation-constraint-checker` | sonnet | 법·정관·직제규정의 제약 추출 | - |
| `org-option-designer` | opus | 관점별 대안 설계·보완(3회 호출) | `unit-task-org-design` |
| `org-option-critic` | opus | 대안별 반박 검토 | `org-option-review` |
| `executive-report-writer` | opus | 보고서 종합 | `references/report-format.md` |

에이전트 호출은 기본 9건, 보완이 모두 생기면 15건이다.

## 데이터 전달

파일로 전달한다. 워크플로 스크립트는 파일을 읽지 못하므로 에이전트에게 경로를 주고, 에이전트는 짧은 요약만 스키마에 맞춰 반환한다.

| 단계 | 쓰는 쪽 | 파일 |
| --- | --- | --- |
| 준비 | 메인(스크립트) | `data/facts/*.md`, `data/facts/facts.json`, `data/regulations/*.txt` |
| 진단 | org-diagnostician | `_workspace/{run}/01_diagnosis.md` |
| 제약 | regulation-constraint-checker | `_workspace/{run}/02_constraints.md` |
| 설계 | org-option-designer | `_workspace/{run}/03_option_{OPT-A,OPT-B,OPT-C}.json` |
| 검토 | org-option-critic | `_workspace/{run}/04_review_{option_id}.md` |
| 종합 | executive-report-writer | `output/{run}/조직개편_추천보고서.md`, 조합 추천안이면 `_workspace/{run}/05_option_OPT-R.json` |
| 기록 | 메인 | `_workspace/{run}/run.json`(전략 방향, 시각, 워크플로 runId, 단계별 결과) |

## 절차

### 0단계: 실행 종류 판단

`_workspace/`와 `output/`을 확인한다.

- **처음 실행**: `_workspace/`가 없거나 사용자가 새 전략 방향을 주었다. 새 `run` 이름을 정한다(`YYYYMMDD-주제`, 예: `20261112-safety`). 기존 run 폴더는 지우지 않는다.
- **부분 재실행**: 기존 run이 있고 "OPT-B만 다시", "검토 의견 반영", "보고서만 수정"처럼 일부를 고쳐 달라는 요청이다. 「부분 재실행」 절로 간다.
- **중단된 실행 재개**: `run.json`에 워크플로 runId가 있고 산출물이 일부만 있으면, 같은 스크립트와 `args`로 `resumeFromRunId`를 지정해 다시 실행한다. 끝난 `agent()` 호출은 저장된 결과를 쓴다.
- **단순 질문**("단위업무가 가장 많은 부서는?")에는 `data/facts/`를 읽고 직접 답한다.

전략 방향이 요청에 없으면 묻지 않고 "지정 없음"으로 진행한다. 진단에서 찾은 문제를 기준으로 대안을 만든다. 사용자가 방향을 주었으면 문장 그대로 `args.strategy`에 넣는다.

### 1단계: 사실 자료 준비 (메인, 스크립트)

```bash
python3 .claude/skills/org-strategy/scripts/build_facts.py          # data/facts/ (약 10초)
python3 .claude/skills/org-strategy/scripts/extract_regulations.py  # data/regulations/
```

`data/facts/facts.json`이 있고 `../kac-shared/data/classification.json`·`production.sqlite`보다 새것이면 다시 만들지 않는다. 공용 데이터가 없으면 `../kac-shared/README.md`의 준비 스크립트를 먼저 실행한다. `_workspace/{run}/run.json`에 전략 방향과 시작 시각을 적는다.

### 2~4단계: 워크플로 실행

**실행 모드: 워크플로 조율.** 아래 스크립트를 `Workflow`의 `script`로 넘기고 `args`에 `{"root": "<프로젝트 절대 경로>", "run": "<run>", "strategy": "<전략 방향 또는 '지정 없음'>"}`를 준다. 반환된 runId를 `run.json`에 적는다.

```javascript
export const meta = {
  name: 'kac-org-strategy',
  description: '단위업무 기준 조직 개편 대안 3건을 설계·검토하고 경영진 보고서로 종합한다',
  phases: [
    { title: '진단·제약', detail: '사실 자료 진단과 규정 제약 추출' },
    { title: '대안 설계', detail: '관점 3개에서 독립적으로 대안 설계' },
    { title: '반박 검토', detail: '대안별 근거·내용·규정 검토' },
    { title: '보완', detail: '보완 필요 판정을 받은 대안 수정과 2차 검토' },
    { title: '종합', detail: '경영진용 보고서 작성' },
  ],
}

const { root, run, strategy } = args
const ws = `${root}/_workspace/${run}`
const base = `프로젝트 경로: ${root}\n실행 폴더: ${ws}\n전략 방향: ${strategy}\n모든 명령은 프로젝트 경로에서 실행한다.`

const PERSPECTIVES = [
  { id: 'OPT-A', name: '기능통합' },
  { id: 'OPT-B', name: '전략사업' },
  { id: 'OPT-C', name: '현장운영' },
]
const PATH_SCHEMA = {
  type: 'object',
  properties: { path: { type: 'string' }, items: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } },
  required: ['path', 'items'],
}
const DESIGN_SCHEMA = {
  type: 'object',
  properties: {
    option_id: { type: 'string' }, path: { type: 'string' }, check_passed: { type: 'boolean' },
    actions: { type: 'integer' }, summary: { type: 'string' },
  },
  required: ['option_id', 'path', 'check_passed', 'summary'],
}
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    option_id: { type: 'string' },
    verdict: { type: 'string', enum: ['채택 가능', '보완 필요', '부적합'] },
    issues: { type: 'array', items: { type: 'object', properties: {
      action: { type: 'string' }, issue: { type: 'string' }, severity: { type: 'string', enum: ['중대', '보통', '경미'] } },
      required: ['issue', 'severity'] } },
    review_path: { type: 'string' },
  },
  required: ['option_id', 'verdict', 'issues', 'review_path'],
}
const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    report_path: { type: 'string' }, recommendation: { type: 'string' }, summary: { type: 'string' },
    citation_check: { type: 'string' }, excluded: { type: 'array', items: { type: 'string' } },
  },
  required: ['report_path', 'recommendation', 'summary', 'citation_check'],
}

// 진단과 제약은 설계자 세 명이 모두 읽으므로 두 결과를 함께 기다린다.
phase('진단·제약')
const [diagnosis, constraints] = await parallel([
  () => agent(`${base}\n조직 진단서를 ${ws}/01_diagnosis.md에 쓴다.`,
    { agentType: 'org-diagnostician', label: '진단', phase: '진단·제약', schema: PATH_SCHEMA }),
  () => agent(`${base}\n규정 제약 목록을 ${ws}/02_constraints.md에 쓴다.`,
    { agentType: 'regulation-constraint-checker', label: '규정 제약', phase: '진단·제약', schema: PATH_SCHEMA }),
])
if (!diagnosis) log('진단서를 만들지 못했다. 설계자는 사실 자료만으로 설계한다.')
if (!constraints) log('규정 제약 목록을 만들지 못했다. 대안의 규정 검토가 빠진다.')

// 관점별로 설계 → 검토 → (필요하면) 보완 → 2차 검토를 독립적으로 진행한다.
const results = await pipeline(
  PERSPECTIVES,
  p => agent(`${base}\n관점: ${p.name}, option_id: ${p.id}\n대안 1건을 ${ws}/03_option_${p.id}.json에 쓴다. 다른 관점의 대안 파일은 읽지 않는다.`,
    { agentType: 'org-option-designer', label: `설계:${p.name}`, phase: '대안 설계', schema: DESIGN_SCHEMA }),
  (design, p) => {
    if (!design) return null
    return agent(`${base}\noption_id: ${p.id}, 검토 차수: 1차\n${ws}/03_option_${p.id}.json을 검토해 ${ws}/04_review_${p.id}.md에 쓴다.`,
      { agentType: 'org-option-critic', label: `검토:${p.name}`, phase: '반박 검토', schema: REVIEW_SCHEMA })
      .then(review => ({ design, review }))
  },
  async (r, p) => {
    if (!r || !r.review || r.review.verdict !== '보완 필요') return r
    const revised = await agent(`${base}\n관점: ${p.name}, option_id: ${p.id}\n보완 요청이다. 검토서 ${ws}/04_review_${p.id}.md의 지적을 반영해 ${ws}/03_option_${p.id}.json을 고친다.`,
      { agentType: 'org-option-designer', label: `보완:${p.name}`, phase: '보완', schema: DESIGN_SCHEMA })
    if (!revised) return { ...r, revised: false }
    const review2 = await agent(`${base}\noption_id: ${p.id}, 검토 차수: 2차\n보완된 ${ws}/03_option_${p.id}.json을 다시 검토해 ${ws}/04_review_${p.id}.md에 "2차 검토" 절을 덧붙인다.`,
      { agentType: 'org-option-critic', label: `2차 검토:${p.name}`, phase: '보완', schema: REVIEW_SCHEMA })
    return { design: revised, review: review2 || r.review, revised: true, second_review_missing: !review2 }
  },
)

const options = results.filter(Boolean)
const dropped = PERSPECTIVES.length - options.length
if (dropped) log(`관점 ${dropped}개의 대안이 만들어지지 않았다. 보고서의 「검토 범위와 한계」에 적는다.`)
if (!options.length) return { ok: false, reason: '대안이 하나도 만들어지지 않았다', diagnosis, constraints }

const verdicts = options.map(o => `${o.design.option_id}: ${o.review ? o.review.verdict : '검토 없음'}${o.revised ? '(보완 후)' : ''}`).join(', ')
phase('종합')
const report = await agent(`${base}\n실행 이름: ${run}\n대안별 판정: ${verdicts}\n만들어지지 않은 대안 수: ${dropped}\n경영진용 보고서를 ${root}/output/${run}/조직개편_추천보고서.md에 쓴다.`,
  { agentType: 'executive-report-writer', label: '보고서', phase: '종합', schema: REPORT_SCHEMA })

return { ok: Boolean(report), diagnosis, constraints, options, dropped, report }
```

### 5단계: 최종 확인과 보고 (메인)

1. 인용 검사를 메인이 직접 다시 실행한다. 작성자의 보고만 믿지 않기 위해서다.

   ```bash
   python3 .claude/skills/org-strategy/scripts/check_citations.py output/{run}/조직개편_추천보고서.md --options _workspace/{run}/0[35]_option_*.json
   for f in _workspace/{run}/0[35]_option_*.json; do python3 .claude/skills/org-strategy/scripts/check_option.py "$f"; done
   ```

2. 오류가 있으면 `Agent(subagent_type: "executive-report-writer")`에 오류 목록을 주고 한 번 고치게 한다. 그래도 남으면 남은 오류를 사용자에게 그대로 알린다.
3. `run.json`에 단계별 결과(판정, 누락, 검사 결과)를 적는다.
4. 사용자에게 보고한다: 추천안 요약, 대안별 판정, 영향 규모, 경영진이 결정할 사항, 자료의 한계, 보고서 경로. 누락된 단계가 있으면 먼저 알린다.

## 부분 재실행

**실행 모드: 서브에이전트 위임.** 해당 에이전트만 `Agent`로 호출하고, 그 뒤 단계를 이어서 실행한다.

| 요청 | 다시 실행할 것 |
| --- | --- |
| 특정 대안만 다시("OPT-B만 다시", "전략사업 관점에 ○○을 반영") | `org-option-designer`(해당 option_id, 사용자 의견 전달) → `org-option-critic` → `executive-report-writer` |
| 검토 의견에 대한 사용자 반박 | `org-option-critic`(해당 option_id, 사용자 의견 전달) → 판정이 바뀌면 `executive-report-writer` |
| 보고서 문구·구성 수정 | `executive-report-writer`만 |
| 규정 해석 수정 | `regulation-constraint-checker` → 관련 제약 ID를 쓴 대안의 설계자·검토자 → 보고서 |
| 전략 방향 변경, 분류기준표·문서목록 갱신 | 처음 실행(새 run). 자료가 바뀌었으면 1단계 스크립트부터 |

재실행 뒤에는 5단계의 검사를 다시 한다.

## 오류 처리

- **에이전트 1건 실패**(`agent()`가 `null`): 워크플로는 멈추지 않는다. 진단서나 제약 목록이 없으면 `log()`로 알리고 설계를 계속한다. 대안이 빠지면 남은 대안으로 보고서를 쓰고 「검토 범위와 한계」에 빠진 관점을 적는다. 워크플로가 끝난 뒤 메인이 빠진 에이전트를 `Agent`로 한 번 다시 실행해 볼 수 있다. 또 실패하면 누락을 보고한다.
- **검사 미통과 대안**(`check_passed: false`): 검토자가 스크립트 오류를 확인해 `보완 필요`나 `부적합`으로 판정한다. 보완 뒤에도 통과하지 못한 대안은 추천에서 뺀다.
- **2차 검토 누락**: `second_review_missing`이 참이면 1차 판정(`보완 필요`)이 유지된다. 보고서 작성자는 이 대안을 "보완했으나 재검토하지 못함"으로 적는다.
- **사용량 한도, 인증 만료, 권한 거부**: 다시 시도하지 않는다. `_workspace/{run}/`의 파일을 열어 어디까지 만들어졌는지 확인하고 `run.json`에 누락을 적은 뒤 사용자에게 알린다. 한도라면 풀리는 시각도 알린다. 이후 `resumeFromRunId`로 재개한다.
- **멈춘 에이전트의 빈 곳**: 메인이 대신 채울 때는 스크립트로 확인한 사실(검사 결과, 영향 규모)만 적는다. 설계자의 이유나 검토자의 판정을 추측해 쓰지 않는다.
- **공용 데이터 없음**: `../kac-shared/data/classification.json`이나 `production.sqlite`가 없으면 `../kac-shared/README.md`의 준비 스크립트를 실행한다. 원본 엑셀도 없으면 멈추고 사용자에게 알린다.
- **대안 사이의 충돌**: 두 대안이 같은 단위업무를 서로 다른 부서로 옮기려 하면 어느 쪽도 지우지 않는다. 보고서 작성자가 두 안을 나란히 적고 추천안에는 한쪽만 넣으며 이유를 쓴다.

## 스크립트

| 스크립트 | 용도 |
| --- | --- |
| `scripts/build_facts.py` | 분류 색인과 문서목록 DB에서 근거 ID가 붙은 사실 자료 생성 |
| `scripts/extract_regulations.py` | 법·정관·직제규정·시행세칙 hwpx 본문 추출 |
| `scripts/check_option.py {대안.json} [--write]` | 대안 형식·unit_id·인용값 검사, 영향 규모 계산 |
| `scripts/check_citations.py {문서.md} [--options ...] [--strict]` | 진단서·검토서·보고서의 근거 표기 대조 |

## 테스트 시나리오

**정상 흐름**: "안전·보안 기능을 통합하는 방향으로 조직 개편안을 추천해줘"
1. 0단계에서 처음 실행으로 판단하고 run을 `20261112-safety`로 정한다. 1단계에서 `data/facts/facts.json`(근거 약 800건)과 `data/regulations/*.txt`(11개)가 생긴다.
2. 워크플로에서 `01_diagnosis.md`, `02_constraints.md`, `03_option_OPT-{A,B,C}.json`, `04_review_OPT-{A,B,C}.md`가 생긴다. 대안 파일마다 `check_option.py`가 `OK`를 낸다.
3. `output/20261112-safety/조직개편_추천보고서.md`가 생기고 `check_citations.py`가 오류 0건을 낸다. 보고서에 대안 비교표, 추천안, 결정 사항, 한계 절이 있다.

**오류 흐름 1(대안 1건 누락)**: 현장운영 관점 설계자가 실패해 `null`이 반환된다. 워크플로는 `관점 1개의 대안이 만들어지지 않았다`를 기록하고 두 대안으로 보고서를 쓴다. 메인은 5단계에서 누락을 먼저 알리고, 사용자가 원하면 부분 재실행으로 OPT-C를 만든다.

**오류 흐름 2(인용값 불일치)**: 보고서에 `[DP-005 단위업무 수=40]`이 있다(실제 값 38). 5단계의 `check_citations.py`가 종료 코드 1과 `근거 DP-005 '단위업무 수'의 값은 38인데 40로 적었다`를 낸다. 메인은 작성자에게 오류 목록을 주고 고치게 한 뒤 다시 검사한다.

**부분 재실행**: "OPT-A에서 감사실 관련 조치는 빼고 다시 정리해줘" → 설계자(OPT-A, 사용자 의견) → 검토자 → 보고서 작성자 순으로 `Agent`를 호출하고 5단계 검사를 한다.

**호출 경계**: "직제 개편으로 스마트공항추진실이 둘로 나뉘었는데 분류기준표를 어떻게 고쳐야 해?"는 이미 결정된 변경의 영향 계산이므로 이 스킬을 쓰지 않는다. "이 문서 제목은 어느 기록물철이야?"도 쓰지 않는다.

---
name: unit-task-naming
description: 한국공항공사 생산·접수 문서목록의 제목을 부서별로 분석해 단위업무명(기록물철명·설명 초안 포함)을 추천하는 작업 전체를 조율한다. 분류기준표에 없는 업무의 신설, 문서와 맞지 않는 단위업무의 개명, 문서가 거의 없는 단위업무의 통합·폐지 검토, 기준표가 없는 부서(제주·김해 운영단·시설단, 지방 공항 등)의 단위업무 목록 초안을 제안표(xlsx·csv)로 만든다. "단위업무명 추천", "단위업무 제안", "생산현황 보고 단위업무 뽑아줘", "○○부서 단위업무 초안", "분류기준표에 빠진 업무 찾아줘" 같은 요청과 "다시 실행", "○○부서만 다시", "제안 수정", "검토 의견 반영", "이전 결과 보완" 같은 후속 요청에 반드시 사용한다. 문서 한 건을 기존 기록물철에 배정하는 작업(kac-record-assign), 조직 개편 영향 분석, 분류 오류 정정에는 쓰지 않는다.
---

# 단위업무명 추천 오케스트레이터

부서의 문서 제목을 스크립트로 군집 자료로 줄이고, 에이전트 세 유형이 해석, 제안, 검토를 차례로 수행한 뒤 스크립트로 제안표를 만든다.

**실행 모드:** 워크플로 조율(3단계). 1·2·4단계는 메인이 스크립트를 직접 실행한다.

## 구성

| 에이전트 | 모델 | 맡는 일 | 호출 횟수(부서당) |
| --- | --- | --- | --- |
| `work-cluster-analyst` | sonnet | 군집 묶음(part)별 업무 해석 | part 수(보통 3~4) |
| `unit-task-namer` | opus | 단위업무명 제안, 검토 의견 반영 | 1~2 |
| `naming-reviewer` | opus | 제안 검토 | 1~2 |

세 에이전트는 `unit-task-naming-rules` 스킬을 따른다. 에이전트 정의는 `.claude/agents/`에 있으므로 Claude Code 세션을 이 폴더(`kac-unit-task-naming`)에서 시작해야 사용자 정의 유형으로 불린다.

스크립트는 `.claude/skills/unit-task-naming/scripts/`에 있다. 아래에서는 `S=.claude/skills/unit-task-naming/scripts`로 줄여 쓴다.

| 스크립트 | 하는 일 |
| --- | --- |
| `prepare_dept.py` | 부서별 제목 집계, 공통 수신·부서공통 분리, 군집화, 기존 단위업무별 문서 수 추정 |
| `validate.py` | 에이전트 결과 파일 형식·참조 검사 |
| `build_report.py` | 제안표(xlsx·csv)와 요약 작성 |

## 0단계: 실행 맥락 확인

1. 공용 데이터 `../kac-shared/data/`에 `classification.json`, `dept_map.json`, `production.sqlite`가 있는지 확인한다. 없으면 `../kac-shared/README.md`의 명령으로 만든다. 이 하네스는 `kac-shared`를 읽기만 한다.
2. `_workspace/`를 보고 요청을 다음 가운데 하나로 구분한다.
   - **처음 실행**: 해당 부서의 실행 폴더가 없다. 1단계부터 진행한다. 실행 이름(run)은 `{YYYYMMDD}-{부서 또는 묶음 이름}`으로 정한다.
   - **부분 재실행**: 같은 run에서 특정 부서의 제안·검토만 다시 하거나 사용자 피드백을 반영한다. 1단계를 건너뛰고 해당 부서만 3단계의 필요한 구간부터 실행한다. 피드백은 `unit-task-namer` 프롬프트에 그대로 넣고 수정 단계로 호출한다.
   - **새 조건으로 다시 실행**: 연도 범위나 군집 옵션이 바뀌었다. 새 run 이름으로 1단계부터 실행한다. 기존 run 폴더는 지우지 않는다.
   - **워크플로 재개**: 직전 워크플로가 중간에 멈췄고 `runId`를 알고 있으면 같은 스크립트와 인자로 `resumeFromRunId`를 써서 재개한다. 끝난 `agent()` 호출은 저장된 결과를 쓴다.
3. 부서명은 문서목록의 표기를 쓴다(예: `김포운영단`, `제주시설단`). 사용자가 다른 표기로 말하면 `dept_map.json`의 키에서 찾아 확인한다.
4. 사용자가 부서를 지정하지 않았으면 부서 1~2개로 시작하자고 제안한다. 부서당 에이전트 호출이 5~8건이므로 전체 65개 부서를 한 번에 돌리지 않는다.

## 1단계: 군집 자료 준비

```bash
python3 $S/prepare_dept.py --run {run} --dept 감사실 --dept 제주운영단
```

주요 옵션: `--year 2025 --year 2026`(연도 한정), `--threshold 0.33`(군집 유사도 하한), `--top-clusters 90`(제시 군집 수), `--min-docs 5`, `--part-size 30`, `--min-evidence 10`(신설 근거 문서 수 기준).

산출물(`_workspace/{run}/`)

- `manifest.json`: 옵션과 부서별 통계
- `workflow_args.json`: 3단계 워크플로에 넘길 인자
- `{부서명}/clusters.json`, `parts/part_NN.json`, `existing_units.json`, `excluded.json`

## 2단계: 군집 품질 확인

출력된 부서별 통계와 `clusters.json`의 상위 군집 10개를 읽고 다음을 확인한다.

- 제시 군집 문서 수가 군집 대상 문서 수의 절반에 못 미치면 `--top-clusters`를 늘려 새 run으로 다시 준비한다.
- 상위 군집의 대표제목에 서로 다른 업무가 여럿 섞였으면 `--threshold`를 0.05씩 올리고, 같은 업무가 여러 군집으로 잘게 나뉘었으면 내린다.
- 모드(대조·초안)와 `부서대응.비고`를 사용자에게 알린다. 준용·승계추정 부서는 참고 기준표가 추정 연결임을 함께 알린다.

이 확인은 에이전트 호출 비용을 쓰기 전에 입력 품질을 바로잡기 위한 것이다.

## 3단계: 해석 → 제안 → 검토 → 수정

**실행 모드:** 워크플로 조율

`workflow_args.json`을 읽어 그 내용을 `Workflow` 도구의 `args`로 넘기고 아래 스크립트를 실행한다. 사용자가 이 스킬을 불러 실행을 요청했으면 워크플로 실행에 동의한 것으로 본다. 검토 후 수정 횟수는 `args.maxRounds`(기본 1)로 정한다.

```javascript
export const meta = {
  name: 'unit-task-naming',
  description: '부서별 문서 제목 군집을 해석해 단위업무명을 제안하고 검토한다',
  phases: [
    { title: '해석', detail: '군집 묶음별 업무 해석 (sonnet)' },
    { title: '제안', detail: '부서별 단위업무명 제안 (opus)' },
    { title: '검토', detail: '제안 검토 (opus)' },
    { title: '수정', detail: '검토 의견 반영 (opus)' },
  ],
}

const DONE = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, summary: { type: 'string' } },
  required: ['ok', 'summary'],
}
const REVIEWED = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' }, pass: { type: 'integer' }, fix: { type: 'integer' },
    reject: { type: 'integer' }, summary: { type: 'string' },
  },
  required: ['ok', 'pass', 'fix', 'reject', 'summary'],
}

const { run, root, depts } = args
const maxRounds = args.maxRounds === undefined ? 1 : args.maxRounds
const head = d => `프로젝트 루트: ${root}\n실행 이름(run): ${run}\n부서명: ${d.dept}\n모드: ${d.mode}\n` +
  `작업 폴더: ${root}/_workspace/${run}/${d.dept}\n모든 명령은 프로젝트 루트에서 실행한다.\n`
const tail = '\nok에는 validate.py가 OK를 냈는지를, summary에는 건수 요약을 한두 문장으로 적는다.'

const review = (d, round) => agent(
  head(d) + `단계: 검토(${round}회차). proposals.json의 모든 제안을 검토해 review.json을 쓰고 validate.py review를 통과시킨다.` +
  (round > 1 ? ' 이전 review.json은 review_v{n}.json으로 남긴 뒤 다시 판정한다.' : '') +
  '\npass·fix·reject에는 통과·수정필요·기각 건수를 적는다.' + tail,
  { agentType: 'naming-reviewer', phase: '검토', label: `검토${round}:${d.dept}`, schema: REVIEWED })

const results = await pipeline(depts, async d => {
  // 제안 단계가 부서의 모든 해석 결과를 함께 읽어야 하므로 부서 안에서는 part 전체를 기다린다.
  const parts = (await parallel(d.parts.map(p => () => agent(
    head(d) + `단계: 해석. part: ${p}\nparts/${p}.json의 군집을 해석해 interpret/${p}.json을 쓰고 validate.py interpret ${p}를 통과시킨다.` + tail,
    { agentType: 'work-cluster-analyst', phase: '해석', label: `해석:${d.dept}:${p}`, schema: DONE },
  ).then(r => r && { part: p, ok: r.ok })))).filter(Boolean)
  const okParts = parts.filter(r => r.ok).map(r => r.part)
  const missingParts = d.parts.filter(p => !okParts.includes(p))
  if (missingParts.length) log(`${d.dept}: 해석 실패 part ${missingParts.join(', ')} (전체 ${d.parts.length}개)`)
  if (!okParts.length) return { dept: d.dept, status: '해석 실패', missingParts }

  const proposed = await agent(
    head(d) + '단계: 제안. interpret/part_*.json 전부와 clusters.json, existing_units.json, excluded.json을 읽고 proposals.json을 쓴 뒤 validate.py proposals를 통과시킨다.' +
    (missingParts.length ? `\n해석 결과가 없는 part: ${missingParts.join(', ')}. 해당 군집은 보류에 넣는다.` : '') + tail,
    { agentType: 'unit-task-namer', phase: '제안', label: `제안:${d.dept}`, schema: DONE })
  if (!proposed || !proposed.ok) return { dept: d.dept, status: '제안 실패', missingParts, detail: proposed && proposed.summary }

  let rv = await review(d, 1)
  let rounds = 0
  while (rv && rv.ok && rv.fix + rv.reject > 0 && rounds < maxRounds) {
    rounds++
    const fixed = await agent(
      head(d) + `단계: 수정(${rounds}회차). review.json에서 수정필요·기각인 제안만 고치고 검토반영을 적는다. 고치기 전에 proposals.json을 proposals_v{n}.json으로 남긴다. validate.py proposals를 통과시킨다.` + tail,
      { agentType: 'unit-task-namer', phase: '수정', label: `수정${rounds}:${d.dept}`, schema: DONE })
    if (!fixed || !fixed.ok) { log(`${d.dept}: 수정 ${rounds}회차 실패`); break }
    rv = await review(d, rounds + 1)
  }
  if (!rv || !rv.ok) return { dept: d.dept, status: '검토 실패', missingParts, rounds }
  return { dept: d.dept, status: '완료', missingParts, rounds, pass: rv.pass, fix: rv.fix, reject: rv.reject }
})

const done = results.filter(Boolean)
if (done.length < depts.length) log(`결과가 없는 부서 ${depts.length - done.length}개`)
return { run, depts: done, missing: depts.length - done.length }
```

워크플로 스크립트는 파일을 읽지 못한다. 에이전트가 경로를 받아 파일을 읽고, 결과 파일을 쓴 뒤 `validate.py`를 통과시키고, 통과 여부만 구조화된 반환값으로 돌려준다.

`Workflow` 도구를 쓸 수 없거나 사용자 정의 유형이 등록되지 않은 세션이면 **서브에이전트 위임**으로 같은 순서를 밟는다. 해석은 part 수만큼 `Agent`를 한 메시지에서 병렬 호출하고(`subagent_type: "work-cluster-analyst"`, 등록되지 않았으면 `general-purpose`에 "`.claude/agents/work-cluster-analyst.md`와 `unit-task-naming-rules` 스킬 파일을 읽고 그 역할로 작업하라"고 지시), 모두 끝난 뒤 제안, 검토, 수정, 재검토를 한 번씩 차례로 호출한다.

## 4단계: 제안표 작성

워크플로 반환값에서 부서별 `status`를 확인한 뒤 실행한다.

```bash
python3 $S/build_report.py {run}
```

산출물(`output/{run}/`): `단위업무_제안표.xlsx`(요약 시트, 부서별 시트, 보류 군집 시트), `단위업무_제안표.csv`, `요약.md`.

## 5단계: 사용자 보고

다음을 빠짐없이 알린다.

- 부서별 제안 건수(신설·초안, 개명, 통합·폐지 검토, 유지)와 근거 문서 수가 많은 신설·개명 제안 몇 건
- 검토를 통과하지 못하고 남은 제안 수
- 분석 범위의 한계: 제시 군집이 차지한 문서 비율, 분석하지 않은 소규모 군집 문서 수, 공통 수신으로 뺀 문서 수
- 누락: 해석에 실패한 part, 제안·검토에 실패한 부서
- 제안은 문서 제목만 본 추천이며 담당부서 확인이 필요하다는 점. 통합·폐지 검토는 문서목록에 보이지 않는다는 사실에 근거한 검토 요청이라는 점

## 데이터 전달

| 구간 | 방법 | 경로 |
| --- | --- | --- |
| 준비 스크립트 → 해석 에이전트 | 파일 | `_workspace/{run}/{부서명}/parts/part_NN.json`, `existing_units.json` |
| 해석 → 제안 | 파일 | `interpret/part_NN.json` |
| 제안 ↔ 검토 | 파일 | `proposals.json`, `review.json`(이전 판은 `_v{n}`으로 남김) |
| 에이전트 → 워크플로 | 구조화된 반환값 | `{ok, summary}` 또는 `{ok, pass, fix, reject, summary}` |
| 워크플로 → 메인 | 구조화된 반환값 | 부서별 `status`, `missingParts`, 판정 건수 |
| 메인 → 사용자 | 파일 | `output/{run}/` |

`_workspace/`는 지우지 않는다. 제안의 근거를 나중에 확인하는 데 쓴다.

## 오류 처리

| 상황 | 대응 |
| --- | --- |
| `prepare_dept.py`가 "조건에 맞는 문서가 없다"를 출력 | 부서명 표기를 `dept_map.json`에서 확인하고 다시 실행한다 |
| 같은 run 이름이 이미 있음 | 다른 run 이름을 쓴다. 기존 폴더를 덮어쓰지 않는다 |
| 일부 part 해석 실패 | 워크플로가 남은 part로 계속한다. 제안 에이전트가 해당 군집을 보류에 넣는다. 보고서에 빠진 part를 적는다 |
| 제안·검토 에이전트 실패 | 해당 부서만 한 번 다시 실행한다(부분 재실행). 또 실패하면 그 부서 없이 `build_report.py`를 실행하고 요약의 「누락」을 사용자에게 알린다 |
| 검토 결과 없이 제안만 있음 | `build_report.py`가 검토 판정을 `미검토`로 싣는다. 사용자에게 검토되지 않았다고 알린다 |
| 수정 뒤에도 수정필요·기각이 남음 | 더 반복하지 않는다. 제안표의 검토 판정·검토 의견 열에 그대로 남겨 사람이 판단하게 한다 |
| 사용량 한도 소진, 인증 만료, 권한 거부 | 다시 시도하지 않는다. `_workspace/{run}/`에서 어느 부서의 어느 파일까지 만들어졌는지 확인해 사용자에게 알리고, 한도가 풀린 뒤 `resumeFromRunId` 또는 부분 재실행으로 이어 간다 |
| 멈춘 에이전트가 남긴 빈 곳 | 메인이 제안이나 판정을 대신 써넣지 않는다. 빠진 사실만 보고한다 |

## 테스트 시나리오

**정상 흐름**

1. 요청: "감사실 생산현황으로 단위업무명 추천해줘"
2. 0단계에서 처음 실행으로 판단, run을 `20261112-감사실`로 정한다.
3. `prepare_dept.py --run 20261112-감사실 --dept 감사실` → 모드 `대조`, 기존 단위업무 23개, 제시 군집 90개와 부서공통 추정 묶음 7개, part 4개.
4. 워크플로: 해석 4건, 제안 1건, 검토 1건, 수정필요가 있으면 수정 1건과 재검토 1건.
5. `validate.py`가 세 단계 모두 `OK`. 기존 단위업무 23개가 모두 유지·개명·통합·폐지 검토 가운데 하나로 처리되고 모든 군집이 근거 또는 보류에 들어간다.
6. `build_report.py` → `output/20261112-감사실/단위업무_제안표.xlsx`에 `요약`, `감사실`, `보류 군집` 시트가 생긴다.

**오류 흐름: part 하나 해석 실패**

1. 해석 4건 가운데 `part_03`이 `ok: false`를 반환한다.
2. 워크플로가 "해석 실패 part part_03"을 기록하고 제안 단계 프롬프트에 빠진 part를 넣는다.
3. 제안 에이전트가 `part_03`의 군집을 "해석 결과 없음" 사유로 보류에 넣어 `validate.py proposals`를 통과한다.
4. 최종 보고에 `part_03` 누락을 적고, 사용자가 원하면 해당 part 해석과 그 부서의 제안·검토만 다시 실행한다.

**오류 흐름: 부서명 표기 불일치**

1. 요청: "제주공항 운영단 단위업무 초안 만들어줘"
2. `--dept "제주공항 운영단"`은 문서가 없다고 나온다. `dept_map.json`에서 `제주운영단`을 찾아 사용자에게 확인하고 다시 실행한다. 모드는 `초안`, 참고 기준표는 김포공항 운영단이다.

**호출하지 않는 경계 사례**: "이 문서 제목을 어느 기록물철에 넣어야 해?"(개별 문서 배정), "조직 개편으로 단위업무를 어느 부서로 옮겨야 해?"(조직 변경 영향), "잘못 분류된 문서를 찾아 고쳐줘"(분류 오류 정정)는 다른 하네스가 맡는다.

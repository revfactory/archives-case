# archives-case — 한국공항공사 기록물 분류 하네스

한국공항공사의 기록물 분류 과제 네 가지를 Claude Code 하네스 다섯 개로 실행한 기록이다. 하네스 구성(에이전트·스킬·스크립트), 실행 결과, 발표자료를 담았다.

- 발표자료(39장): <https://revfactory.github.io/archives-case/>
- 발표자료 원본과 제작 기록: [`harness-deck/`](harness-deck/)

## 과제와 하네스

| 과제 | 하네스 | 폴더 | 에이전트 | 이번 실행 결과 |
| --- | --- | --- | --- | --- |
| 생산현황 분류 정정 | 제목으로 기록물철 배정 | [`kac-record-assign`](kac-record-assign/) | 3 | [`output/t1`](kac-record-assign/output/t1/) |
| 생산현황 분류 정정 | 생산현황 오분류 점검 | [`kac-classification-audit`](kac-classification-audit/) | 3 | [`output/test01`](kac-classification-audit/output/test01/) |
| 단위업무명 추천·제안 | 단위업무명 추천 | [`kac-unit-task-naming`](kac-unit-task-naming/) | 3 | [`output/20261117-감사실`](kac-unit-task-naming/output/20261117-감사실/) |
| 조직변경 영향도 | 조직 변경 시 단위업무 변경 | [`kac-org-change-impact`](kac-org-change-impact/) | 4 | [`output/시나리오-신공항건설1부이동`](kac-org-change-impact/output/시나리오-신공항건설1부이동/) |
| 전략적 조직 설계 | 단위업무 기준 조직 개편 추천 | [`kac-org-strategy`](kac-org-strategy/) | 5 | [`output/20261117-safety`](kac-org-strategy/output/20261117-safety/) |

모든 결과는 사람이 검토할 추천이다. 하네스는 고칠 안과 근거를 파일로 내고, 반영 여부는 담당자와 경영진이 정한다.

## 하네스 폴더 구성

각 하네스 폴더는 Claude Code 프로젝트 하나다. 폴더에서 `claude` 를 실행하면 `CLAUDE.md` 의 호출 조건에 따라 오케스트레이터 스킬이 동작한다.

| 경로 | 내용 |
| --- | --- |
| `CLAUDE.md` | 하네스 목표, 호출 조건, 변경 이력 |
| `.claude/agents/*.md` | 전용 에이전트 정의(역할, 모델, 쓸 수 있는 도구) |
| `.claude/skills/<오케스트레이터>/` | 실행 순서, 단계 사이 파일 전달 규칙, 스크립트(`scripts/`) |
| `.claude/skills/<규칙 스킬>/` | 판단 기준(배정·판정·이름 짓기 규칙 등) |
| `data/`, `config/` | 하네스가 쓰는 가공 자료와 설정 |
| `_workspace/` | 실행 중간 파일(단계별 JSON, 검증 결과) |
| `output/` | 최종 결과(CSV·XLSX·보고서) |

다섯 하네스가 함께 읽는 자료와 준비 스크립트는 [`kac-shared/`](kac-shared/)에 있다.

## 올리지 않은 것

- 원자료 폴더 `(한국공항공사) 기록물분류체계/`: 기록물분류기준표, 비공개 세부기준, 보존기간 책정기준, 부서별 생산·접수 문서목록, 직제규정·시행세칙, 조직도.
- `kac-shared/data/production.sqlite`(생산·접수 문서목록 1,076,767건, 408MB): GitHub 의 파일당 100MB 제한을 넘는다.

원자료를 저장소 루트의 `(한국공항공사) 기록물분류체계/` 에 두고 아래를 실행하면 공용 자료를 다시 만들 수 있다. 원본 경로는 `kac-shared/data/sources.json` 에 있다.

```bash
python3 kac-shared/scripts/build_index.py      # → kac-shared/data/classification.json
python3 kac-shared/scripts/extract_titles.py   # → kac-shared/data/production.sqlite (약 1분)
```

## 발표자료

[`docs/`](docs/)는 GitHub Pages 로 게시하는 발표 사이트다. [`harness-deck/deck/`](harness-deck/deck/)에서 아래 명령으로 만든다.

```bash
cd harness-deck/deck
python3 tools/build_fonts.py      # 쓰인 글자만 남긴 폰트
python3 tools/build_publish.py    # 폰트·스크립트를 한 파일에 넣은 페이지
python3 tools/build_pages.py      # → ../../docs/
```

조작: →·Space 다음, ← 이전, N 발표자 노트, F 전체 화면. 1장은 120초 인트로 영상이고 소리가 있다.

인트로 영상 「기록관리 하네스」는 하네스 첫 구성(에이전트 15개)의 시험 실행을 다룬다. 이 발표의 수치는 네 과제에 맞춰 새로 구성한 하네스(에이전트 18개)의 실행 결과다. 장 첫 영상에는 Higgsfield(kling3_0_turbo)로 만든 작업장 클립을 합성했다.

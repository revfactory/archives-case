# 기록물분류 하네스 5종 — 발표 덱 제작 노트

78장짜리 웹 슬라이드다. 장마다 주장 하나만 담았고, 에이전트는 역할별 그림(만들기·검증·판정·보고서·스크립트·사람)으로 보여 준다. 120초 필름 「기록관리 하네스」로 시작하고, 표지는 필름의 마지막 화면(엔드카드)에서 그대로 이어진다. 하네스 장의 순서와 디자인(종이색 바탕, 남색, 하네스 색 다섯 개, Paperlogy 제목, 기록연구사의 질문 말풍선)은 필름을 따른다. 하네스 장마다 10초짜리 첫 영상이 있다.

## 순서(필름 구간과 같다)

| 장 | 내용 | 필름 구간 |
| --- | --- | --- |
| 1 | 인트로 필름(120초, `media/film.mp4`) | A~J |
| 2 | 표지: 필름 엔드카드와 같은 자리·크기로 시작해 질문이 빠지고 발표 표지로 바뀐다 | J |
| 3 | 문서 1,076,767건. 필름 첫 질문 「이 문서, 어느 기록물철에 넣어야 하죠?」로 시작한다 | A |
| 4–9 | 분류기준표(단위업무 703개, 기록물철 1,663개), 자료만으로는 기록물철을 정할 수 없는 문서 | B |
| 10 | 일을 다섯 가지로 나눠 하네스 다섯 개를 만들었다 | C |
| 11–18 | 공통 구조: 에이전트의 역할 여섯 가지, 만들기·검증·중재의 흐름, 하네스의 구성, 함께 쓰는 자료, 에이전트 18개 | C |
| 19–25 | 1 제목 배정(`kac-record-assign`) · 과제 생산현황 분류 정정 | D |
| 26–35 | 2 오분류 점검(`kac-classification-audit`) · 과제 생산현황 분류 정정 | E |
| 36–46 | 3 단위업무명 추천(`kac-unit-task-naming`) · 과제 단위업무명 추천·제안 | F |
| 47–57 | 4 조직 변경 영향(`kac-org-change-impact`) · 과제 조직변경 영향도 | G |
| 58–72 | 5 조직 개편 추천(`kac-org-strategy`) · 과제 전략적 조직 설계 | H |
| 73–74 | 하네스는 정할 수 있는 것만 판정하고, 검토와 승인은 사람이 한다 | I |
| 75–77 | 요약, 한계와 다음 단계 | — |
| 78 | 맺음: 표지와 같은 건물, 필름 마지막 질문 「그럼, 첫 문서부터 분류해 볼까요?」와 다음 실행 | J |

## 필름과 다른 수치

- 에이전트 수: 필름은 하네스 첫 구성(에이전트 15개)을, 이 발표는 네 과제에 맞춰 새로 구성한 하네스(에이전트 18개: 3·3·3·4·5)를 다룬다. 1장 노트에 적었다.
- 단위업무 수: 덱의 703개는 부서별로 센 수, 필름의 658개는 이름이 같은 단위업무를 하나로 센 수(이름 657개 + 빈 이름 1)다. 4장 노트에 적었다.

## 폴더

| 경로 | 내용 |
| --- | --- |
| `deck/index.html` | 로컬에서 여는 덱. 정적 서버로 연다(`python3 -m http.server -d deck 8000` → `http://localhost:8000`) |
| `deck/slides/s01~s07*.js` | 장 정의. 파일 순서는 `index.html` 의 script 순서(s01, s02a, s02, s04, s06, s03, s05, s07)이고, `place: { before }` 로 옮긴 장이 있다 |
| `deck/deck.js`, `deck/kit.js`, `deck/deck.css` | 덱 실행부, 화면 부품(`K.HZ` 하네스 이름·색·질문, `K.AG` 에이전트 한글 이름·역할, `K.actor` 에이전트 그림, `K.doc`·`K.travel`·`K.loop`·`K.say` 문서 이동과 반복 움직임), 공통 스타일 |
| `deck/img/` | 필름 그림(g01~g10)을 줄인 것과 물체 주변만 자른 `_c.jpg`, 에이전트 역할 그림 `ag_<역할>.jpg` |
| `deck/REVISE_BRIEF.md` | 78장 개정 지침(한 장에 주장 하나, 화면에서 지울 것, 글자 크기, 쓰지 않는 말, 움직임 규칙) |
| `assets/agents/` | 에이전트 역할 그림 원본(codex 이미지 생성). `deck/tools/prep_agents.py` 로 잘라 `deck/img/` 에 넣는다 |
| `deck/media/` | 필름(`film.mp4`·`.jpg`)과 장 첫 영상(`ch_<하네스>.mp4`·`.jpg`) |
| `publish/` | Artifact 게시용 한 장짜리 페이지와 `media/`, `img/`(저장소에는 올리지 않는다. GitHub Pages 용은 저장소 루트의 `docs/`, `tools/build_pages.py` 로 만든다) |
| `video/film/film_deck.mp4` | 필름 원본(61MB)을 덱용으로 줄인 것(2패스 820kbps, 14.4MB, -14.1 LUFS) |
| `video/chapters2/` | 장 첫 영상 프로젝트(장면 `reel/scenes_ch.js`, 합성·포장 `compose2.py`) |
| `assets/hf2/` | Higgsfield 클립 5개(kling3_0_turbo, 8초, 필름 그림을 첫 프레임으로 씀). 작업 번호는 `jobs.txt` |
| `video/intro/`, `video/chapters/`, `video/v1_media/` | 이전 판(48초 인트로·챕터 영상). 지금 덱에서는 쓰지 않는다 |
| `qa/` | 검수 스틸과 시트 |

## 조작

→·Space·Enter 다음, ← 이전, N 발표자 노트, F 전체 화면, R 다시 보기, 숫자+Enter 장 이동. 화면 왼쪽 3분의 1을 누르면 이전, 나머지를 누르면 다음이다. 영상 장은 들어가면 소리와 함께 재생된다. 브라우저가 소리 재생을 막으면 "▶ 재생" 단추가 나오고, 첫 → 키나 클릭으로 재생된다.

## 다시 만들기

```bash
S=~/.claude/skills/showreel/scripts
# 장 첫 영상: 50초 렌더 → 10초씩 클립 합성·음악·효과음 → deck/media/ch_*.mp4
node $S/render.mjs --dir video/chapters2/reel --out video/chapters2/out/reel.mp4 --sub 4 --format png
python3 video/chapters2/compose2.py

cd deck
python3 tools/build_fonts.py      # 문구를 바꾸면 다시(쓰인 글자만 남긴 폰트, Paperlogy 800·900 포함)
python3 tools/build_publish.py    # → ../publish/ (쓰는 영상만 복사, img/ 포함)
python3 tools/build_pages.py      # → 저장소 루트 docs/ (GitHub Pages)
node tools/shoot.mjs --pages 1-78 --times 8 --out ../qa/full_t8 --scale 0.5   # 검수 스틸(--ids 'c2-*' 처럼 장 id 로도 고른다)
node tools/navtest.mjs            # 78장 넘김 시험
```

장 첫 영상의 합성: 클립 배경(약 250,238,220)을 채널별로 키워 종이색(253,243,226)에 맞추고 RGB darken 으로 그래픽과 겹친다. 클립 왼쪽 가장자리는 220px 에 걸쳐 풀고, 말풍선이 다 나온 뒤(0.74초)에는 말풍선 자리를 비워 말풍선이 앞에 온다. 음악은 필름 `audio/music/music_edit.wav` 의 해당 하네스 구간(24.05·40.05·56.05·72.05·88.05초부터 10초), 효과음은 필름 `audio/sfx` 의 bubble·click·pop 이다. 음량은 -16 LUFS 로 맞췄다.

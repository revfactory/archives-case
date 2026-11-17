# 장 작성 지침 (사례 장을 맡은 작성자용)

덱 폴더: `harness-deck/deck/`

## 먼저 읽을 것

1. `../concept.md` — 색의 뜻, 서체, 움직임의 성격(종이와 도장)
2. `../storyboard.md` — 장 번호·제목·내용·출처. 맡은 장의 행만 쓴다
3. `deck.css`, `kit.js`, `deck.js` — 쓸 수 있는 클래스와 함수
4. `slides/s01_open.js` — 완성된 예시 장 6개. 같은 수준과 같은 문법으로 쓴다
5. 출처 파일(storyboard.md 상단 표) — 화면 숫자를 직접 확인한다. 출처에 없는 숫자는 쓰지 않는다

## 장 등록 형식

```js
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css } = RH;
  const C = K.C;
  const CH = '사례 1 · 조직변경 영향도';   // 하단 챕터 표시
  DECK.slide({
    id: 'c1-input', title: '과제와 입력', chapter: CH, bg: 'paper',
    notes: '발표자 노트(2~5문장). 화면에 없는 설명, 숫자의 뜻, 출처 파일 경로를 적는다.',
    setup(root, d) { /* 요소 만들기. d 에 참조 저장 */ },
    render(lt, d) { /* lt = 장에 들어온 뒤 초. lt 만으로 모든 상태를 정한다 */ },
  });
  // 챕터 영상 장:
  DECK.slide({ id: 'ch2', title: '사례 1 챕터 영상', bg: 'black', video: 'media/ch2.mp4', poster: 'media/ch2.jpg', notes: '…' });
})();
```

## 지킬 것

- **결정성**: render 는 lt 의 순수 함수다. `Math.random`, `Date.now`, CSS transition·animation, 이전 프레임 값에 기대는 코드를 쓰지 않는다. 난수는 `K.rand(i, salt)`. 반복 강조는 `K.cycle`, 왕복은 `K.wave`.
- **움직임 설계**: 장마다 (1) 0~3초 안에 끝나는 등장 연출(제목 → 핵심 → 세부 순서, 요소마다 0.05~0.15초 간격), (2) 머무는 동안 계속되는 작은 움직임 하나 이상(선 위 점 흐름 `K.draw`+`K.dots`, 행 강조 순환 `K.cycle`+`K.mark`, 처리 중 표시 등). 판정·결과에는 도장 `K.stamp`를 쓴다(장마다 한두 개, 남발하지 않는다).
- **배치**: 무대 1920×1080. 좌우 여백 120px(x 120~1800). 제목은 `K.title(root, {kicker, title, sub})` 기본 위치(y=96). 내용은 y≈300부터 y≈990까지. y 1000 아래는 하단 장 정보 자리라 비운다. 요소끼리 겹치지 않게 좌표를 계산한다.
- **글자 크기 하한**: 본문 22px 이상, 표 셀 20px 이상, 보조 설명 19px 이상. 한 장에 글이 많으면 줄이고 노트로 옮긴다.
- **색**: 군청(`C.blue`) = 에이전트·하네스, 초록(`C.ok`) = 확정·통과·타당, 주황(`C.warn`) = 검토필요·보완·수정필요, 주홍(`C.bad`) = 오류·정정·반박·기각, 먹색 = 원자료. 칩 클래스 `chip ok|warn|bad|blue|ink|id|ghost`, 도장 `stamp ok|warn|bad|blue`. 에이전트 노드 `K.agent(root, {name, role, model:'opus'|'sonnet', kind:'make'|'check'|'judge'|'write', x, y, w})`, 스크립트 노드 `K.script`, 사람 단계 `K.human`.
- **서체**: Pretendard(기본), ID·파일명·스크립트 이름은 `mono` 클래스(JetBrains Mono). 인용(시나리오 원문 등)은 `.quote` 클래스(Noto Serif KR 600, 글자 수가 적어 덱 빌드 때 부분 폰트로 만든다).
- **문장**: 한국어로 자연스럽게 쓴다. 번역투("~를 통해", "~에 있어서", "~하는 것이 가능")를 쓰지 않는다. **비유를 쓰지 않는다**(은유·직유·의인화·관용적 비유 모두. 예: "~의 벽", "~의 손발", "~은 팀원이다", "~의 지도", "~의 뼈대", "길잡이", "두뇌"). 대상을 직접 가리키는 말을 쓴다. 장식용 영문 대문자 라벨을 쓰지 않는다.
- **번호 표기**: 순서가 실제로 있는 것(파이프라인 단계)만 번호를 붙인다.
- **이모지 금지**. 아이콘이 필요하면 도형(SVG)으로 그린다.
- 다른 장 파일, `deck.js`, `kit.js`, `deck.css` 는 고치지 않는다. 공통 함수가 더 필요하면 자기 장 파일 안에 지역 함수로 만든다.

## 검수(반드시 한다)

```bash
cd harness-deck/deck
node tools/shoot.mjs --pages <맡은 장 범위> --times 0.6,1.5,8 --out ../qa/deck_<파일이름>
python3 tools/sheet.py ../qa/deck_<파일이름> ../qa/sheet_<파일이름>_t8.png --cols 2 --match t8
python3 tools/sheet.py ../qa/deck_<파일이름> ../qa/sheet_<파일이름>_t1.png --cols 3 --match t1_5
```

- 시트를 Read 로 열어 직접 본다. 겹침, 잘림, 빈 공간 쏠림, 글자 크기, 정렬, 등장 순서(t0.6·t1.5)를 확인하고 고친다. 고친 뒤 다시 찍어 확인한다. 최소 2회 반복한다.
- `오류:` 아래에 pageerror 가 나오면 반드시 고친다(404 한 건은 영상·폰트 파일이 아직 없어서 생기니 무시한다).
- 영상 장은 포스터(`media/chN.jpg`)가 아직 없을 수 있다. 영상 장은 검수하지 않아도 된다.

## 끝나면 보고할 것

맡은 장 목록(장 번호, id, 제목), 화면에 쓴 숫자와 그 출처 파일, 출처와 storyboard.md 가 다른 곳(있으면), 남은 문제.

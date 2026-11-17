/* 조직 개편 추천 — 과제 「전략적 조직 설계」. 필름 H 구간에 이어진다. 출처는 storyboard.md 「4. 사례 3」
   하네스: kac-org-strategy. 숫자는 output/20261117-safety/조직개편_추천보고서.md 와 _workspace/20261117-safety/ 에서 확인했다. */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css, kf } = RH;
  const C = K.C;
  const CH = '조직 개편 추천 · 전략적 조직 설계';

  // ── 이 장 파일 안에서만 쓰는 함수 ─────────────────────────
  // 글 상자: K.at + 인라인 스타일
  const T = (parent, box, html, st) => {
    const e = K.at(parent, '', box, html);
    if (st) e.style.cssText += ';' + st;
    return e;
  };
  // 글자 모양 한 줄
  const F = (wt, px, color, lh = 1.3) => `font:${wt} ${px}px/${lh} var(--sans);letter-spacing:-0.02em;color:${color || 'var(--ink)'}`;
  // 에이전트 그림: 이름표와 하는 일이 그림 폭보다 넓어도 가운데에 오게 한다
  const actor = (root, o) => {
    const a = K.actor(root, o);
    css(a.el, { display: 'flex', flexDirection: 'column', alignItems: 'center' });
    if (a.job) { a.job.style.marginLeft = '0'; a.job.style.whiteSpace = 'nowrap'; a.job.style.width = 'auto'; }
    return a;
  };
  // 큰 숫자 + 단위. 반환값 { el, n }
  const bigNum = (root, box, size, unit, color, st) => {
    const el = T(root, box, '', 'display:flex;align-items:baseline;gap:' + Math.round(size * 0.06) + 'px;white-space:nowrap;' + (st || ''));
    const n = h('span', 'num', el, '0');
    n.style.cssText = `font:900 ${size}px/1 var(--display);letter-spacing:-0.03em;color:${color || 'var(--ink)'}`;
    if (unit) { const u = h('span', '', el, unit); u.style.cssText = `font:800 ${Math.round(size * 0.36)}px/1 var(--sans);color:${color || 'var(--ink)'}`; }
    return { el, n };
  };
  // 말풍선·도장처럼 켰다 끄는 요소
  const show = (el, on, p = 1) => { el.style.opacity = on ? '1' : '0'; el.style.transform = `scale(${on ? lerp(0.8, 1, p).toFixed(3) : 0.8})`; };
  const fadeIO = (loc, per, e = 0.2) => clamp(Math.min(loc / e, (per - loc) / e, 1));

  // 28. 챕터 영상
  DECK.slide({
    id: 'ch-strategy', title: '조직 개편 추천 챕터 영상', bg: 'paper', harness: 'strategy', video: 'media/ch_strategy.mp4', poster: 'media/ch_strategy.jpg',
    notes: '10초 챕터 영상. 필름 H 구간의 작업장(배치 시안을 놓은 원탁)이 움직이고, 질문 「어떻게 개편할지도 제안받을 수 있나요?」에 kac-org-strategy가 답한다. 필름은 이 하네스를 절차로만 보여 줬고, 여기서는 실제 실행 결과(대안 3개, 추천안 OPT-R, 경영진 결정 6가지)를 본다. 끝나면 → 키로 넘긴다.',
  });

  // 입력: 방향 한 줄
  DECK.slide({
    id: 'c3-input', title: '받은 것은 방향 한 줄이다', chapter: CH, harness: 'strategy',
    notes: '사람이 준 입력은 전략 방향 한 줄 "안전·보안 기능을 통합하는 방향"이다.\n나머지는 스크립트가 준비한다. build_facts.py 가 분류기준표와 문서목록에서 근거 803개를 계산한다(data/facts/facts.json). 종류별로는 수발신 260, 유사 단위업무 251, 부서 현황 122, 기능 분산 99, 문서량 71이다. 근거 하나는 "안전보안실 단위업무 수 44"(DP-004), "안전보안실 수발신 문서 수 7,577"(CM-H01), "재난방재부 단위업무 수 12"(DP-004-03)처럼 번호가 붙은 숫자 하나다.\nextract_regulations.py 가 규정 파일 11개를 텍스트로 뽑는다(data/regulations/). 직제규정 3, 직제규정시행세칙 4, 정관 1, 한국공항공사법 3이다.\n출처: kac-org-strategy/_workspace/20261117-safety/run.json, data/facts/facts.json, data/regulations/index.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 입력', title: '받은 것은 방향 한 줄이다' });
      d.card = K.at(root, 'card', { x: 120, y: 300, w: 1680, h: 230 });
      d.lab = T(root, { x: 168, y: 326 }, '사람이 준 방향', F(700, 28, 'var(--mute)'));
      d.quote = K.at(root, 'quote', { x: 164, y: 372, w: 1600 }, '');
      css(d.quote, { fontSize: '78px', lineHeight: '1.3', whiteSpace: 'nowrap' });
      const B = [
        { x: 120, v: 803, lab: '스크립트가 계산한 근거', ex: ['안전보안실 단위업무 44개', '안전보안실이 주고받은 문서 7,577건', '재난방재부 단위업무 12개'] },
        { x: 1000, v: 11, lab: '규정 파일', ex: ['직제규정 3개', '직제규정 시행세칙 4개', '정관 1개', '한국공항공사법 3개'] },
      ];
      d.blk = B.map(o => {
        const lab = T(root, { x: o.x, y: 584 }, o.lab, F(800, 36));
        const num = bigNum(root, { x: o.x - 6, y: 644 }, 190, '개', C.blue);
        const ex = o.ex.map(t => { const e = K.doc(root, `<span style="color:var(--mute);font-weight:600;margin-right:12px">예</span>${t}`, { x: o.x, y: 872 }); e.style.fontSize = '30px'; return e; });
        return { lab, num, ex, v: o.v };
      });
      d.rule = T(root, { x: 920, y: 590, w: 3, h: 340 }, '', 'background:var(--rule)');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.card, lt, 0.35, { y: 20 }); K.rise(d.lab, lt, 0.45, { y: 8 });
      K.type(d.quote, '“안전·보안 기능을 통합하는 방향”', lt, 0.6, 20);
      K.wipe(d.rule, lt, 1.3, 0.5, 'down');
      const PER = 1.7, T0 = 2.3;
      const k = lt < T0 ? -1 : Math.floor((lt - T0) / PER), loc = k < 0 ? 0 : (lt - T0) % PER;
      d.blk.forEach((b, i) => {
        K.rise(b.lab, lt, 1.2 + i * 0.2, { y: 10 });
        K.rise(b.num.el, lt, 1.3 + i * 0.2, { y: 16 }); K.count(b.num.n, lt, 1.3 + i * 0.2, 1.0, b.v);
        b.ex.forEach((e, j) => {
          const on = k >= 0 && k % b.ex.length === j;
          const a = on ? fadeIO(loc, PER) : 0;
          e.style.opacity = a.toFixed(3); e.style.transform = `translateY(${((1 - a) * 10).toFixed(1)}px)`;
        });
      });
    },
  });

  // 진행 순서
  DECK.slide({
    id: 'c3-flow', title: '대안을 만들고, 반박하고, 고쳐서 다시 검토한다', chapter: CH, harness: 'strategy',
    notes: '진단 에이전트(org-diagnostician)와 규정 확인 에이전트(regulation-constraint-checker)가 함께 일한다. 진단은 문제 10개(ISSUE-01~10), 규정 확인은 제약 18건(RC-01~18)을 냈다.\n대안 설계 에이전트(org-option-designer)는 관점 셋(기능통합·전략사업·현장운영)으로 대안을 하나씩 만든다. 반박 에이전트(org-option-critic)는 대안 파일을 고칠 수 없고 검토서만 쓴다. 세 대안 모두 1차 검토에서 "보완 필요"를 받았고, 설계 에이전트가 고친 뒤 2차 검토에서 "채택 가능"이 됐다.\n보고서 에이전트(executive-report-writer)가 종합해 추천보고서를 쓰고, 마지막에 스크립트 check_citations.py 가 보고서의 근거 표기 64건을 사실 자료와 다시 비교했다(오류 0건). 모델은 규정 확인만 sonnet, 나머지는 opus 다.\n출처: kac-org-strategy/_workspace/20261117-safety/run.json, .claude/skills/org-strategy/SKILL.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 진행 순서', title: '대안을 만들고, 반박하고, 고쳐서 다시 검토한다' });
      const BASE = 650, W = 180;
      const A = [
        { id: 'org-diagnostician', job: '문제를 찾는다' },
        { id: 'regulation-constraint-checker', job: '규정을 정리한다' },
        { id: 'org-option-designer', job: '대안을 만들고 고친다' },
        { id: 'org-option-critic', job: '대안을 반박한다' },
        { id: 'executive-report-writer', job: '추천안을 쓴다' },
        { kind: 'script', name: '스크립트', job: '인용을 검사한다' },
      ];
      d.svg = K.svg(root);
      d.act = A.map((a, i) => {
        const kind = a.kind || K.AG[a.id].kind;
        return actor(root, Object.assign({ x: 120 + i * 300, y: BASE - W * K.AGR[kind], w: W, size: 26 }, a));
      });
      d.act.forEach(a => { a.job.style.fontSize = '24px'; });
      d.plus = T(root, { x: 335, y: 532, w: 50 }, '+', 'text-align:center;font:800 56px/1 var(--sans);color:var(--mute)');
      const P = (pts, color) => K.path(d.svg, pts, { color: color || C.ink2, width: 4, arrow: true });
      d.arr = [
        P([[612, 570], [706, 570]]),
        P([[912, 545], [1006, 545]], C.blue),
        P([[1008, 600], [914, 600]], C.bad),
        P([[1212, 570], [1306, 570]]),
        P([[1512, 570], [1606, 570]]),
      ];
      // 대안 설계와 반박을 묶는 줄과 검토 차수 표시
      d.br = K.path(d.svg, [[720, 800], [720, 822], [1200, 822], [1200, 800]], { color: C.warn, width: 3, radius: 10 });
      const box = (x, w) => T(root, { x, y: 850, w, h: 88 }, '', 'box-sizing:border-box;border-radius:14px;display:flex;align-items:center;justify-content:center;font:800 34px/1 var(--sans);letter-spacing:-0.02em;white-space:nowrap');
      d.nm = box(420, 310); css(d.nm, { background: C.ink, color: '#fff' });
      d.r1 = box(770, 340); d.r2 = box(1150, 340);
      d.doc = K.doc(root, '대안 A', { x: 0, y: 0 });
      d.pos = d.act.map(a => [a.cx - 52, a.top - 64]);
      d.s1 = K.say(root, '보완 필요', { x: 1182, y: 352 }, 'warn', 'l');
      d.s2 = K.say(root, '고쳤습니다', { x: 882, y: 376 }, 'blue', 'l');
      d.s3 = K.say(root, '채택 가능', { x: 1182, y: 352 }, 'ok', 'l');
      d.s4 = K.say(root, '오류 0건', { x: 1652, y: 326 }, 'ok', 'b');
      d.OPT = [['대안 A', '기능통합'], ['대안 B', '전략사업'], ['대안 C', '현장운영']];
    },
    render(lt, d) {
      d.T.render(lt);
      d.act.forEach((a, i) => a.render(lt, 0.5 + i * 0.14));
      K.rise(d.plus, lt, 0.7, { y: 0 });
      d.arr.forEach((p, i) => K.draw(p, lt, 0.9 + i * 0.14, 0.3));
      K.draw(d.br, lt, 1.6, 0.4);
      [d.nm, d.r1, d.r2].forEach((e, i) => K.rise(e, lt, 1.8 + i * 0.12, { y: 12 }));
      // 대안 한 건의 진행. 바퀴마다 대안 A → B → C
      const L = K.loop(lt, 2.7, [1.2, 0.9, 0.8, 1.3, 0.8, 1.2, 0.8, 1.3, 0.9, 0.9, 1.6]);
      const st = L.i, u = L.u, o = d.OPT[L.lap % 3];
      d.nm.textContent = `${o[0]} · ${o[1]}`;
      const done1 = st < 0 || st > 3 || (st === 3 && u > 0.35), done2 = st < 0 || st > 7 || (st === 7 && u > 0.35);
      const setR = (e, on, idle, txt, bg, bd, fg) => { e.textContent = on ? txt : idle; css(e, { background: on ? bg : 'transparent', border: on ? `3px solid ${bd}` : '3px dashed rgba(27,42,74,.3)', color: on ? fg : C.mute }); };
      setR(d.r1, done1, '1차 검토', '1차 · 보완 필요', 'rgba(232,147,12,.14)', C.warn, '#965A00');
      setR(d.r2, done2, '2차 검토', '2차 · 채택 가능', 'rgba(25,169,116,.13)', C.ok, '#0B7A52');
      if (lt > 2.5) {
        d.act[0].act(lt, st === 0); d.act[1].act(lt, st === 0);
        d.act[2].act(lt, st === 1 || st === 5); d.act[3].act(lt, st === 3 || st === 7);
        d.act[4].act(lt, st === 9); d.act[5].act(lt, st === 10 && u > 0.45);
      }
      show(d.s1, st === 3 && u > 0.35); show(d.s2, st === 5 && u > 0.3); show(d.s3, st === 7 && u > 0.35); show(d.s4, st === 10 && u > 0.5);
      if (st < 1) { d.doc.style.opacity = '0'; return; }
      const [ , , D, Cr, Wr, Sc] = d.pos;
      d.doc.textContent = st >= 9 ? '보고서' : o[0];
      d.doc.className = 'doc' + (st >= 9 ? ' blue' : (st === 7 && u > 0.35) || st === 8 ? ' ok' : (st === 3 && u > 0.35) || st === 4 || st === 5 ? ' warn' : '');
      const mv = (a, b) => K.travel(d.doc, u, 0, 1, a, b, { arc: 34 }), at = a => K.travel(d.doc, 1, 0, 1, a, a);
      if (st === 1 || st === 5) at(D); else if (st === 2 || st === 6) mv(D, Cr); else if (st === 3 || st === 7) at(Cr);
      else if (st === 4) mv(Cr, D); else if (st === 8) mv(Cr, Wr); else if (st === 9) at(Wr);
      else K.travel(d.doc, clamp(u / 0.45), 0, 1, Wr, Sc, { arc: 34 });
      d.doc.style.opacity = (st === 1 ? clamp(u / 0.3) : st === 10 ? clamp((1 - u) / 0.12) : 1).toFixed(3);
    },
  });

  // 진단: 문제 10개
  DECK.slide({
    id: 'c3-diag', title: '진단 에이전트가 문제 10개를 찾았다', chapter: CH, harness: 'strategy',
    notes: '진단 에이전트(org-diagnostician)가 사실 자료로 조직상 문제 10개를 찾았다. 진단서의 번호는 ISSUE-01~10이다. 모든 수치에 근거 번호를 붙였고, 진단서 단계의 인용 검사도 오류 0건이었다(근거 164건).\n진단서의 원래 제목: 1 안전보안본부가 분류기준표에서 두 부서레벨1로 나뉘고 기능 분류 수준이 다르다(안전보안실은 단위업무 44·중기능 28, 안전보안본부는 단위업무 24·중기능 1). 2 재난 대응 업무가 재난방재부와 중앙통제센터에 겹친다. 3 상황실 운영과 보고 경로가 항공보안·재난·사이버로 나뉜다. 4 항공보안 수준관리·점검이 본사 두 부에 나뉜다. 5 보호구역 출입·One ID 업무가 나뉜다. 6 정보보안·일반보안이 사이버보안센터 밖 부서에 있다. 7 산업안전·건설안전이 안전기획부와 건설안전부에 나뉜다. 8 항공안전이 본사에서는 두 본부로 나뉜다. 9 국가중요시설·비상대비 업무가 본사 세 부서와 김포공항 세 부서에 나뉜다. 10 공항의 안전·보안 보고가 안전보안실로 모인다.\n다음 두 장에서 문제 2와 문제 10을 사례로 본다.\n출처: kac-org-strategy/_workspace/20261117-safety/01_diagnosis.md, run.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 조직 진단', title: '진단 에이전트가 문제 10개를 찾았다' });
      d.a = actor(root, { id: 'org-diagnostician', job: '자료에서 문제를 찾는다', x: 170, y: 330, w: 250 });
      d.n = bigNum(root, { x: 150, y: 770 }, 190, '개', C.blue);
      const N = [
        '본부 하나를 두 부서로 적었다', '재난 대응이 두 부서에 겹친다', '상황실이 셋으로 나뉘어 있다', '항공보안 점검이 두 부에 있다', '출입증·신분확인이 나뉘어 있다',
        '정보보안이 본부 밖에도 있다', '산업안전·건설안전이 나뉘어 있다', '항공안전이 두 본부에 나뉘어 있다', '비상대비가 여러 부서에 있다', '공항 보고가 한 실로 몰린다',
      ];
      d.it = N.map((t, i) => {
        const x = 580 + Math.floor(i / 5) * 620, y = 300 + (i % 5) * 132;
        const e = K.at(root, 'card flat', { x, y, w: 600, h: 114 });
        css(e, { display: 'flex', alignItems: 'center', gap: '20px', padding: '0 26px' });
        const b = h('span', '', e, `문제 ${i + 1}`); b.style.cssText = F(800, 28, C.blue) + ';white-space:nowrap;flex:none;width:112px';
        const n = h('span', '', e, t); n.style.cssText = F(700, 30);
        return { e, b };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.a.render(lt, 0.5);
      K.rise(d.n.el, lt, 0.8, { y: 16 }); K.count(d.n.n, lt, 0.8, 1.2, 10);
      const k = K.cycle(lt, 2.8, 1.2, 10);
      if (lt > 2.4) d.a.act(lt, true);
      d.it.forEach((it, i) => {
        K.rise(it.e, lt, 0.7 + i * 0.12, { x: 24, y: 0 });
        const on = k === i;
        css(it.e, { borderColor: on ? C.blue : 'rgba(27,42,74,.14)', borderWidth: on ? '3px' : '1.5px', background: on ? '#E6EFFF' : 'var(--paper-3)' });
      });
    },
  });

  // 사례 1: 재난 대응이 두 부서에 겹친다
  DECK.slide({
    id: 'c3-dup', title: '재난 대응 업무가 두 부서에 겹친다', chapter: CH, harness: 'strategy',
    notes: '문제 2(ISSUE-02)의 사례다. 재난방재부는 단위업무 12개(DP-004-03, U0607~U0618), 중앙통제센터는 6개(DP-014-03, U0641~U0646)다.\n기록물철 설명을 비교하니 네 가지 일이 양쪽에 있다. 위기관리 매뉴얼(U0608과 U0641), 재난안전통신망·NDMS(U0613과 U0641), 항공기사고 수습(U0615와 U0645·U0646), 자연재난 정보·대응지시(U0617과 U0642·U0643).\n두 부서의 단위업무 이름이 달라서 글자 유사도 자료(218쌍)에는 잡히지 않았고, 진단 에이전트가 기록물철 설명으로 찾았다. 세칙은 재난방재부에 수습대책본부 운영과 항공기 사고 수습을, 중앙통제센터에 상황전파·지휘통제를 둔다. 분류기준표의 기록물철 배치는 이 구분과 다르다.\n출처: kac-org-strategy/_workspace/20261117-safety/01_diagnosis.md(ISSUE-02), output/20261117-safety/조직개편_추천보고서.md 3절 (2), data/facts/facts.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 진단 사례', title: '재난 대응 업무가 두 부서에 겹친다' });
      const rect = (x, bg) => T(root, { x, y: 300, w: 1080, h: 580 }, '', `box-sizing:border-box;border:3px solid ${C.ink};border-radius:28px;background:${bg}`);
      d.rL = rect(120, 'rgba(47,123,255,.08)'); d.rR = rect(720, 'rgba(232,147,12,.12)');
      d.nmL = T(root, { x: 170, y: 340 }, '재난방재부', F(800, 46));
      d.nL = bigNum(root, { x: 162, y: 430 }, 230, '개');
      d.lbL = T(root, { x: 170, y: 690 }, '단위업무', F(700, 36, 'var(--ink-2)'));
      d.nmR = T(root, { x: 1230, y: 340, w: 520 }, '중앙통제센터', F(800, 46) + ';text-align:right');
      d.nR = bigNum(root, { x: 1230, y: 430, w: 520 }, 230, '개', null, 'justify-content:flex-end');
      d.lbR = T(root, { x: 1230, y: 690, w: 520 }, '단위업무', F(700, 36, 'var(--ink-2)') + ';text-align:right');
      d.hd = T(root, { x: 720, y: 338, w: 480 }, '양쪽에 다 있는 일', F(800, 34, '#965A00') + ';text-align:center');
      d.pill = ['위기관리 매뉴얼', '재난안전통신망', '항공기사고 수습', '자연재난 대응지시'].map((t, i) =>
        T(root, { x: 752, y: 412 + i * 106, w: 416, h: 88 }, t, 'box-sizing:border-box;border-radius:16px;display:flex;align-items:center;justify-content:center;white-space:nowrap;' + F(800, 36)));
      d.dL = K.doc(root, '기록물철', { x: 0, y: 0 }, 'blue'); d.dR = K.doc(root, '기록물철', { x: 0, y: 0 }, 'warn');
      d.cap = T(root, { x: 120, y: 908, w: 1680 }, '업무 이름이 달라서, 기록물철 설명을 비교해 찾았다.', F(600, 30, 'var(--ink-2)') + ';text-align:center');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.rL, lt, 0.4, { x: -80, y: 0 }); K.rise(d.rR, lt, 0.5, { x: 80, y: 0 });
      [d.nmL, d.nL.el, d.lbL].forEach((e, i) => K.rise(e, lt, 0.7 + i * 0.1, { y: 12 }));
      [d.nmR, d.nR.el, d.lbR].forEach((e, i) => K.rise(e, lt, 0.8 + i * 0.1, { y: 12 }));
      K.count(d.nL.n, lt, 0.8, 1.0, 12); K.count(d.nR.n, lt, 0.9, 1.0, 6);
      K.rise(d.hd, lt, 1.3, { y: 10 }); K.rise(d.cap, lt, 2.0, { y: 10 });
      // 양쪽 기록물철이 같은 일로 모인다
      const L = K.loop(lt, 2.6, [1.7, 1.7, 1.7, 1.7]);
      d.pill.forEach((p, i) => {
        K.pop(p, lt, 1.4 + i * 0.1);
        const on = L.i === i && L.u > 0.42;
        css(p, { background: on ? C.warn : '#fff', color: on ? '#fff' : C.ink, border: `3px solid ${on || L.i === i ? C.warn : 'rgba(27,42,74,.3)'}` });
      });
      if (L.i < 0) { d.dL.style.opacity = '0'; d.dR.style.opacity = '0'; return; }
      const y = 412 + L.i * 106 + 18, a = Math.min(clamp(L.u / 0.1), clamp((0.5 - L.u) / 0.08));
      K.travel(d.dL, L.u, 0, 0.4, [470, y], [622, y], { fade: false });
      K.travel(d.dR, L.u, 0, 0.4, [1330, y], [1178, y], { fade: false });
      d.dL.style.opacity = a.toFixed(3); d.dR.style.opacity = a.toFixed(3);
    },
  });

  // 사례 2: 문서가 한 실로 몰린다
  DECK.slide({
    id: 'c3-hub', title: '문서가 안전보안실 한 곳으로 모인다', chapter: CH, harness: 'strategy',
    notes: '문제 10(ISSUE-10)의 사례다. 안전보안실은 부서끼리 주고받은 문서가 가장 많은 부서다. 문서 7,577건, 상대 부서 52개(CM-H01). 청주공항에서 안전보안실로 간 문서만 396건이다(CM-018). 지방 공항의 안전·재난 보고와 항공보안 보고가 함께 들어온다.\n두 번째로 많은 곳은 사이버보안센터다(2,779건, 상대 부서 43개, CM-H13). 정보보안이 본부 밖 부서에도 있다는 문제 6과 이어진다.\n이 값은 부서장 이름이 확인된 문서만 센 상대 비교값이다. 사장 명의 문서 130,378건이 빠져 있어서, 보고서는 이 값을 "문서가 오간다"는 사실 확인에만 썼다.\n출처: kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md 3절 (8), _workspace/20261117-safety/01_diagnosis.md(ISSUE-10), data/facts/facts.json(CM-H01, CM-018, CM-H13)',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 진단 사례', title: '문서가 안전보안실 한 곳으로 모인다' });
      d.svg = K.svg(root);
      const cx = 520, cy = 640, R = 300, r0 = 96, N = 52;
      d.sp = [];
      for (let i = 0; i < N; i++) {
        const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
        const x1 = cx + Math.cos(a) * (r0 + 8), y1 = cy + Math.sin(a) * (r0 + 8), x2 = cx + Math.cos(a) * R, y2 = cy + Math.sin(a) * R;
        const l = s('line', { x1, y1, x2, y2, stroke: 'rgba(27,42,74,.22)', 'stroke-width': 2 }, d.svg);
        const n = s('circle', { cx: x2, cy: y2, r: 8, fill: i === 7 ? C.warn : C.ink }, d.svg);
        const dt = s('circle', { r: 6, fill: C.blue, opacity: 0 }, d.svg);
        d.sp.push({ l, n, dt, x1, y1, x2, y2 });
      }
      d.core = T(root, { x: cx - r0, y: cy - r0, w: r0 * 2, h: r0 * 2 }, '안전보안실', `border-radius:50%;background:${C.blue};display:flex;align-items:center;justify-content:center;white-space:nowrap;` + F(800, 34, '#fff'));
      d.ex = K.doc(root, '청주공항 396건', { x: d.sp[7].x2 + 22, y: d.sp[7].y2 - 58 }, 'warn'); d.ex.style.fontSize = '28px';
      d.lab = T(root, { x: 1010, y: 330 }, '부서끼리 주고받은 문서', F(800, 38));
      d.n1 = bigNum(root, { x: 1000, y: 400 }, 210, '건', C.blue);
      d.n2 = bigNum(root, { x: 1004, y: 660 }, 120, '개');
      d.l2 = T(root, { x: 1010, y: 800 }, '문서를 주고받은 상대 부서', F(700, 34, 'var(--ink-2)'));
      d.cap = T(root, { x: 1010, y: 888, w: 790 }, '지방 공항의 안전·재난·보안 보고가 함께 들어온다.', F(600, 28, 'var(--ink-2)'));
    },
    render(lt, d) {
      d.T.render(lt);
      K.pop(d.core, lt, 0.5);
      d.sp.forEach((sp, i) => {
        const p = prog(lt, 0.6 + (i / d.sp.length) * 0.9, 0.3);
        sp.l.style.opacity = p.toFixed(3); sp.n.style.opacity = p.toFixed(3);
        // 상대 부서에서 안전보안실로 들어오는 문서(점). 속도와 출발 시점은 고정 난수
        const run = lt - 1.8;
        if (run < 0) { sp.dt.setAttribute('opacity', 0); return; }
        const u = (run * (0.24 + 0.2 * K.rand(i, 3)) + K.rand(i, 9)) % 1;
        sp.dt.setAttribute('cx', lerp(sp.x2, sp.x1, u).toFixed(1)); sp.dt.setAttribute('cy', lerp(sp.y2, sp.y1, u).toFixed(1));
        sp.dt.setAttribute('opacity', (Math.min(u / 0.15, (1 - u) / 0.15, 1) * clamp(run / 0.4)).toFixed(3));
      });
      K.pop(d.ex, lt, 1.8);
      K.rise(d.lab, lt, 0.8, { y: 10 });
      K.rise(d.n1.el, lt, 0.9, { y: 16 }); K.count(d.n1.n, lt, 0.9, 1.4, 7577);
      K.rise(d.n2.el, lt, 1.3, { y: 14 }); K.count(d.n2.n, lt, 1.3, 1.0, 52);
      K.rise(d.l2, lt, 1.5, { y: 8 }); K.rise(d.cap, lt, 1.9, { y: 8 });
      d.core.style.boxShadow = lt > 1.8 ? `0 0 0 ${(8 + 10 * K.wave(lt, 1.6)).toFixed(1)}px rgba(47,123,255,.18)` : 'none';
    },
  });

  // 대안 셋
  DECK.slide({
    id: 'c3-options', title: '관점 셋으로 대안 셋을 만들었다', chapter: CH, harness: 'strategy',
    notes: '대안 설계 에이전트(org-option-designer)는 같은 진단서와 규정 제약 목록을 받아, 관점 셋에서 서로의 파일을 보지 않고 대안을 하나씩 만들었다. 대안의 원래 표기는 OPT-A, OPT-B, OPT-C다.\n대안 A 기능통합: 같은 일을 두 부서가 나눠 기록하는 단위업무를 한 부서로 모으고, 항공안전·위기대응 업무를 안전보안본부로 옮긴다. 새 부서를 만들지 않는다. 단위업무 11개, 기록물철 22개.\n대안 B 전략사업: 항공보안기술센터와 항공안전부를 새로 둔다. 단위업무 17개, 기록물철 54개.\n대안 C 현장운영: 김포·청주공항에 공항장 직속 안전보안부를 새로 둔다. 단위업무 29개, 기록물철 77개.\n화면의 숫자는 보완 뒤(2차) 값이다. 보완하면서 대안 A 16→11, 대안 B 18→17, 대안 C 32→29로 줄었다.\n출처: kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md 4.1·4.2절, _workspace/20261117-safety/03_option_OPT-A.json, 03_option_OPT-B.json, 03_option_OPT-C.json, run.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 대안', title: '관점 셋으로 대안 셋을 만들었다' });
      d.a = actor(root, { id: 'org-option-designer', job: '관점마다 따로 만든다', x: 150, y: 400, w: 230 });
      const O = [
        ['대안 A', '기능통합', '겹치는 일을<br>한 부서로 모은다', 11],
        ['대안 B', '전략사업', '새 센터와<br>새 부를 만든다', 17],
        ['대안 C', '현장운영', '공항에 안전보안부를<br>새로 둔다', 29],
      ];
      d.cd = O.map((o, i) => {
        const x = 480 + i * 446, e = K.at(root, 'card', { x, y: 300, w: 426, h: 660 });
        T(e, { x: 32, y: 28 }, o[0], F(800, 32, C.blue));
        T(e, { x: 32, y: 76 }, o[1], 'font:900 68px/1.1 var(--display);letter-spacing:-0.03em;color:var(--ink);white-space:nowrap');
        T(e, { x: 32, y: 172, w: 370 }, o[2], F(600, 30, 'var(--ink-2)', 1.35));
        const sq = [];
        for (let j = 0; j < o[3]; j++) sq.push(T(e, { x: 32 + (j % 10) * 36, y: 284 + Math.floor(j / 10) * 36, w: 28, h: 28 }, '', 'border-radius:6px'));
        const num = bigNum(e, { x: 26, y: 410 }, 180, '개', C.blue);
        T(e, { x: 32, y: 592 }, '옮기는 단위업무', F(700, 32, 'var(--ink-2)'));
        return { e, sq, num, v: o[3] };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.a.render(lt, 0.5);
      const L = K.loop(lt, 2.6, [1.8, 1.8, 1.8]);
      if (lt > 2.4) d.a.act(lt, L.i >= 0 && L.u < 0.7);
      d.cd.forEach((c, i) => {
        K.rise(c.e, lt, 0.8 + i * 0.18, { x: 40, y: 0 });
        K.count(c.num.n, lt, 1.1 + i * 0.18, 1.0, c.v);
        const on = L.i === i;
        css(c.e, { borderColor: on ? C.blue : 'rgba(27,42,74,.14)', borderWidth: on ? '3px' : '1.5px' });
        c.sq.forEach((q, j) => {
          const fill = on ? L.u * 1.5 * c.v > j : true;
          q.style.background = fill ? (on ? C.blue : 'rgba(27,42,74,.55)') : 'rgba(27,42,74,.14)';
          q.style.opacity = prog(lt, 1.2 + i * 0.18 + j * 0.02, 0.2).toFixed(3);
        });
      });
    },
  });

  // 반박: 1차 보완 필요 → 2차 채택 가능
  DECK.slide({
    id: 'c3-critic', title: '반박 에이전트가 세 대안을 모두 돌려보냈다', chapter: CH, harness: 'strategy',
    notes: '반박 에이전트(org-option-critic)는 대안 파일을 고칠 수 없고 검토서만 쓴다. 세 대안 모두 1차 검토에서 "보완 필요" 판정을 받았다. 1차 지적은 대안 A 보통 6·경미 6, 대안 B 보통 6·경미 3, 대안 C 보통 6·경미 5였다.\n대안 설계 에이전트(org-option-designer)가 대안을 고쳤고, 2차 검토에서 세 대안 모두 "채택 가능"이 됐다. 2차에 남은 지적은 대안 A 보통 1·경미 3, 대안 B 경미 3, 대안 C 경미 2다. 대안 A에 남은 보통 지적 한 건은 재난안전통신망·자연재난 대응지시(U0613·U0617)를 중앙통제센터로 옮기는 부분이다. 문서를 실제로 만드는 부서가 안전보안실이어서 중복 정리가 아니라 업무 이전이라는 지적이다. 추천안은 이 이동을 뺐다.\n출처: kac-org-strategy/_workspace/20261117-safety/04_review_OPT-A.md, 04_review_OPT-B.md, 04_review_OPT-C.md, run.json, output/20261117-safety/조직개편_추천보고서.md 4.4절',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 반박 검토', title: '반박 에이전트가 세 대안을 모두 돌려보냈다' });
      const BASE = 700;
      d.dz = actor(root, { id: 'org-option-designer', job: '대안을 만들고 고친다', x: 140, y: BASE - 240 * K.AGR.make, w: 240 });
      d.cr = actor(root, { id: 'org-option-critic', job: '대안을 반박한다', x: 590, y: BASE - 240 * K.AGR.check, w: 240 });
      d.svg = K.svg(root);
      d.p1 = K.path(d.svg, [[400, 560], [570, 560]], { color: C.blue, width: 5, arrow: true });
      d.p2 = K.path(d.svg, [[570, 630], [400, 630]], { color: C.bad, width: 5, arrow: true });
      d.cap = T(root, { x: 120, y: 900, w: 900 }, '고친 뒤 2차 검토에서 세 대안 모두 채택 가능이 됐다.', F(600, 30, 'var(--ink-2)'));
      // 결과 표
      const X = 1090, CW = [190, 260, 260];
      d.th = ['', '1차 검토', '2차 검토'].map((t, i) => T(root, { x: X + CW.slice(0, i).reduce((a, b) => a + b, 0), y: 372, w: CW[i] }, t, F(700, 28, 'var(--mute)') + ';text-align:center'));
      const cell = (x, y, w, t, bg, bd, fg) => T(root, { x: x + 10, y, w: w - 20, h: 84 }, t, `box-sizing:border-box;border-radius:14px;border:3px solid ${bd};background:${bg};display:flex;align-items:center;justify-content:center;white-space:nowrap;` + F(800, 32, fg));
      d.rows = ['대안 A', '대안 B', '대안 C'].map((t, i) => {
        const y = 430 + i * 124;
        const bg = T(root, { x: X - 14, y: y - 14, w: 738, h: 112 }, '', 'border-radius:18px');
        const nm = T(root, { x: X, y, w: CW[0], h: 84 }, t, 'display:flex;align-items:center;justify-content:center;' + F(800, 38));
        const c1 = cell(X + CW[0], y, CW[1], '보완 필요', 'rgba(232,147,12,.14)', C.warn, '#965A00');
        const c2 = cell(X + CW[0] + CW[1], y, CW[2], '채택 가능', 'rgba(25,169,116,.13)', C.ok, '#0B7A52');
        return { bg, nm, c1, c2 };
      });
      d.doc = K.doc(root, '대안 A', { x: 0, y: 0 });
      d.P = { d: [d.dz.cx - 54, d.dz.top - 66], c: [d.cr.cx - 54, d.cr.top - 66] };
      d.s1 = K.say(root, '보완 필요', { x: 800, y: 330 }, 'warn', 'l');
      d.s2 = K.say(root, '고쳤습니다', { x: 330, y: 350 }, 'blue', 'l');
      d.stamp = K.stampEl(root, '채택 가능', 'ok', { x: 806, y: 318 });
    },
    render(lt, d) {
      d.T.render(lt);
      d.dz.render(lt, 0.5); d.cr.render(lt, 0.7);
      K.draw(d.p1, lt, 1.0, 0.35); K.draw(d.p2, lt, 1.2, 0.35);
      d.th.forEach((e, i) => K.rise(e, lt, 1.2 + i * 0.05, { y: 8 }));
      K.rise(d.cap, lt, 2.2, { y: 10 });
      const L = K.loop(lt, 2.7, [0.5, 0.9, 1.4, 0.9, 1.3, 0.9, 1.6]);
      const st = L.i, u = L.u, row = L.lap % 3;
      d.rows.forEach((r, i) => {
        K.rise(r.nm, lt, 1.3 + i * 0.12, { y: 10 }); K.pop(r.c1, lt, 1.6 + i * 0.12); K.pop(r.c2, lt, 2.0 + i * 0.12);
        const on = st >= 0 && row === i;
        r.bg.style.background = on ? 'rgba(47,123,255,.10)' : 'transparent';
        r.c1.style.boxShadow = on && (st === 2 || st === 3) ? '0 0 0 6px rgba(232,147,12,.3)' : 'none';
        r.c2.style.boxShadow = on && st === 6 ? '0 0 0 6px rgba(25,169,116,.3)' : 'none';
      });
      if (lt > 2.5) { d.dz.act(lt, st === 0 || st === 4); d.cr.act(lt, st === 2 || st === 6); }
      show(d.s1, st === 2 && u > 0.3); show(d.s2, st === 4 && u > 0.3);
      if (st === 6 && u > 0.3) K.stamp(d.stamp, u * 1.6, 0.48, { rot: -6 }); else d.stamp.style.opacity = '0';
      if (st < 0) { d.doc.style.opacity = '0'; return; }
      d.doc.textContent = ['대안 A', '대안 B', '대안 C'][row];
      d.doc.className = 'doc' + (st === 6 && u > 0.3 ? ' ok' : (st === 2 && u > 0.3) || st === 3 || st === 4 ? ' warn' : '');
      const mv = (a, b) => K.travel(d.doc, u, 0, 1, a, b, { arc: 40 }), at = a => K.travel(d.doc, 1, 0, 1, a, a);
      if (st === 0 || st === 4) at(d.P.d); else if (st === 1 || st === 5) mv(d.P.d, d.P.c); else if (st === 3) mv(d.P.c, d.P.d); else at(d.P.c);
      d.doc.style.opacity = (st === 0 ? clamp(u / 0.5) : st === 6 ? clamp((1 - u) / 0.1) : 1).toFixed(3);
    },
  });

  // 대안끼리 부딪힌 4건
  DECK.slide({
    id: 'c3-conflict', title: '서로 달랐던 4건은 기능통합 쪽으로 정리했다', chapter: CH, harness: 'strategy',
    notes: '같은 단위업무를 대안마다 다른 부서로 옮기려는 곳이 세 군데, 같은 업무를 반대 방향으로 모으려는 곳이 한 군데 있었다. 보고서 에이전트(executive-report-writer)는 넷 다 대안 A(OPT-A, 기능통합) 쪽을 택했다.\n1 U0636 항공보안점검·수검관리: 대안 A는 테러대응부로, 대안 C는 새로 두는 공항안전보안점검부로. 세칙이 이미 국내 점검·수검을 테러대응부에 둔다.\n2 U0248 항공보안관리(김포 시설단, 출입증 발급): 대안 A는 김포공항 운영단 보안관리부로, 대안 C는 새로 두는 김포공항 안전보안부로. 세칙 김포 운영단 보안관리부 4항이 이미 출입증 관리를 둔다.\n3 U0535 공항운영규정·증명관리, U0537 이동지역 안전관리, U0167 이동지역건설사업안전성검토: 대안 A는 안전기획부로, 대안 B는 새로 두는 항공안전부로. 둘 다 직제규정 별표 4를 고쳐야 하지만 대안 A는 새 부와 부장 직위를 만들지 않는다.\n4 항공기사고 수습: 대안 A는 중앙통제센터의 U0646을 재난방재부로, 대안 C는 재난방재부의 U0615를 중앙통제센터로. 세칙은 수습대책본부 운영과 항공기 사고 수습을 재난방재부에 둔다.\n출처: kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md 4.3절',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 대안 비교', title: '서로 달랐던 4건은 기능통합 쪽으로 정리했다' });
      d.hd = [[760, '대안 A · 기능통합'], [1290, '다른 대안']].map(([x, t]) => T(root, { x, y: 296 }, t, F(700, 28, 'var(--mute)')));
      const R = [
        ['항공보안 점검·수검', '테러대응부', 'C', '새 점검부'],
        ['김포공항 출입증 발급', '운영단 보안관리부', 'C', '새 안전보안부'],
        ['공항운영증명·이동지역 안전', '안전기획부', 'B', '새 항공안전부'],
        ['항공기사고 수습', '재난방재부', 'C', '중앙통제센터'],
      ];
      d.rows = R.map((r, i) => {
        const y = 346 + i * 128;
        const e = K.at(root, 'card flat', { x: 120, y, w: 1680, h: 112 });
        T(e, { x: 36, y: 0, w: 580, h: 112 }, r[0], 'display:flex;align-items:center;white-space:nowrap;' + F(800, 36));
        const win = T(e, { x: 620, y: 16, w: 480, h: 80 }, `<svg width="30" height="30" viewBox="0 0 30 30" style="margin-right:12px;flex:none"><path d="M5 16 L12 23 L25 8" fill="none" stroke="#0B7A52" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>${r[1]}`, `box-sizing:border-box;border-radius:14px;border:3px solid ${C.ok};background:rgba(25,169,116,.13);display:flex;align-items:center;justify-content:center;white-space:nowrap;` + F(800, 34, '#0B7A52'));
        const lose = T(e, { x: 1170, y: 0, h: 112 }, `<span style="${F(700, 28, C.mute)};margin-right:16px">대안 ${r[2]}</span><span class="t" style="position:relative">${r[3]}</span>`, 'display:flex;align-items:center;white-space:nowrap;' + F(700, 34, C.mute));
        const ln = h('span', '', lose.querySelector('.t')); ln.style.cssText = `position:absolute;left:-6px;top:52%;height:4px;border-radius:2px;background:${C.bad};width:0`;
        return { e, win, ln };
      });
      d.cap = T(root, { x: 120, y: 884, w: 1250 }, '세 건은 지금 세칙과 같고, 한 건은 새 부서를 만들지 않는 쪽이다.', F(600, 30, 'var(--ink-2)'));
      d.stamp = K.stampEl(root, '대안 A 쪽으로', 'ok', { x: 1480, y: 878 });
    },
    render(lt, d) {
      d.T.render(lt);
      d.hd.forEach((e, i) => K.rise(e, lt, 0.5 + i * 0.1, { y: 8 }));
      const L = K.loop(lt, 3.2, [1.7, 1.7, 1.7, 1.7]);
      d.rows.forEach((r, i) => {
        K.rise(r.e, lt, 0.6 + i * 0.15, { y: 20 });
        K.pop(r.win, lt, 1.3 + i * 0.15);
        const on = L.i === i;
        r.ln.style.width = `calc(${((on ? prog(L.u * 1.7, 0.25, 0.4) : prog(lt, 1.8 + i * 0.15, 0.35)) * 100).toFixed(1)}% + ${on && L.u * 1.7 < 0.25 ? 0 : 12}px)`;
        css(r.e, { borderColor: on ? C.blue : 'rgba(27,42,74,.14)', borderWidth: on ? '3px' : '1.5px' });
        r.win.style.boxShadow = on && L.u * 1.7 > 0.5 ? '0 0 0 7px rgba(25,169,116,.28)' : 'none';
      });
      K.rise(d.cap, lt, 2.4, { y: 10 });
      K.stamp(d.stamp, lt, 2.8, { rot: -5 });
    },
  });

  // 추천안의 크기
  DECK.slide({
    id: 'c3-plan', title: '추천안은 단위업무 10개만 옮긴다', chapter: CH, harness: 'strategy',
    notes: '추천안의 원래 표기는 OPT-R이다. 대안 A(OPT-A)를 기본으로 하고, 2차 검토에서 해소되지 않은 U0613·U0617 이동을 뺀 뒤, 부딪히지 않는 대안 B(OPT-B)의 신분확인 이관(R-4)을 더했다.\n옮기는 단위업무는 10개로, 분류기준표 전체 703개의 1.4%다. 함께 옮겨지는 기록물철은 22개이고 그 가운데 11개가 보존기간 30년 이상이다. 부서레벨1 소속이 바뀌는 단위업무는 8개, 그 가운데 본부를 넘는 이동이 6개다. 새 본부·실·부는 만들지 않는다.\n단계별로는 1단계 4개(R-1~R-4), 2단계 3개(R-5·R-6), 3단계 3개(R-7)다. 화면의 네모 703개에서 색이 다른 10개의 자리는 임의로 놓았다.\n출처: kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md 1절·5.1절·부록 A, _workspace/20261117-safety/05_option_OPT-R.json, run.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 추천안', title: '추천안은 단위업무 10개만 옮긴다' });
      d.svg = K.svg(root);
      const COLS = 37, P = 22, S = 16, X0 = 120, Y0 = 316;
      const HOT = [57, 131, 208, 266, 330, 395, 451, 520, 588, 655];
      d.sq = [];
      for (let i = 0; i < 703; i++) d.sq.push(s('rect', { x: X0 + (i % COLS) * P, y: Y0 + Math.floor(i / COLS) * P, width: S, height: S, rx: 3, fill: 'rgba(27,42,74,.2)' }, d.svg));
      d.hot = HOT.map((i, k) => {
        const cx = X0 + (i % COLS) * P + S / 2, cy = Y0 + Math.floor(i / COLS) * P + S / 2;
        const ring = s('circle', { cx, cy, r: 26, fill: 'rgba(47,123,255,.22)' }, d.svg);
        const r = s('rect', { x: cx - 15, y: cy - 15, width: 30, height: 30, rx: 6, fill: C.blue }, d.svg);
        return { ring, r, st: k < 4 ? 0 : k < 7 ? 1 : 2 };
      });
      d.gcap = T(root, { x: 120, y: 752 }, '분류기준표의 단위업무 703개', F(700, 32, 'var(--ink-2)'));
      d.chips = ['1단계 4개', '2단계 3개', '3단계 3개'].map((t, i) => T(root, { x: 120 + i * 222, y: 812, w: 206, h: 64 }, t, 'box-sizing:border-box;border-radius:12px;display:flex;align-items:center;justify-content:center;white-space:nowrap;' + F(800, 30)));
      d.cap = T(root, { x: 120, y: 912, w: 900 }, '대안 A에 대안 B의 조치 한 가지를 더했다.', F(600, 28, 'var(--ink-2)'));
      const NB = [[10, '개', 200, '옮기는 단위업무', 306, C.blue], [22, '개', 130, '함께 옮겨지는 기록물철', 560, C.ink], [0, '개', 130, '새로 만드는 부서', 744, C.ink]];
      d.nb = NB.map(([v, u, size, lab, y, col]) => {
        const num = bigNum(root, { x: 1040, y, w: 330 }, size, u, col, 'justify-content:flex-end');
        const l = T(root, { x: 1400, y: y + size * 0.42, w: 400 }, lab, F(800, 36));
        return { num, l, v };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.svg.style.opacity = prog(lt, 0.4, 0.6).toFixed(3);
      d.sq.forEach((r, i) => { r.style.opacity = prog(lt, 0.4 + (i % 37) * 0.012, 0.3).toFixed(3); });
      const L = K.loop(lt, 2.8, [1.6, 1.6, 1.6]);
      d.hot.forEach((o, k) => {
        const p = prog(lt, 1.3 + k * 0.08, 0.4, ease.pop), on = L.i === o.st;
        css(o.r, { transformBox: 'fill-box', transformOrigin: 'center', transform: `scale(${p.toFixed(3)})` });
        css(o.ring, { transformBox: 'fill-box', transformOrigin: 'center', transform: `scale(${(on ? 0.7 + 0.5 * K.wave(lt, 0.8) : 0).toFixed(3)})` });
      });
      K.rise(d.gcap, lt, 1.0, { y: 8 }); K.rise(d.cap, lt, 2.2, { y: 8 });
      d.chips.forEach((c, i) => {
        K.pop(c, lt, 1.8 + i * 0.1);
        const on = L.i === i;
        css(c, { background: on ? C.blue : 'transparent', color: on ? '#fff' : C.ink, border: `3px solid ${on ? C.blue : 'rgba(27,42,74,.3)'}` });
      });
      d.nb.forEach((n, i) => { K.rise(n.num.el, lt, 0.8 + i * 0.2, { y: 16 }); K.count(n.num.n, lt, 0.8 + i * 0.2, 1.0, n.v); K.rise(n.l, lt, 0.9 + i * 0.2, { x: 16, y: 0 }); });
    },
  });

  // 세 단계로 옮긴다
  DECK.slide({
    id: 'c3-move', title: '세 단계로 나눠 옮긴다', chapter: CH, harness: 'strategy',
    notes: '추천안(OPT-R)의 조치 일곱 가지(R-1~R-7)를 세 단계로 나눴다.\n1단계(4개): R-1 U0636 항공보안점검·수검관리 보안계획부→테러대응부, R-4 U0620 신분확인·바이오패스관리 테러대응부→보안계획부, R-2 U0646 수습·사후관리 중앙통제센터→재난방재부, R-3 U0248 항공보안관리 김포공항 시설단 AS운영부→운영단 보안관리부. R-1~R-3은 세칙과 같은 방향이라 세칙을 고치지 않고 분류기준표만 고친다. R-4는 안전보안실장의 업무분장 조정으로 한다.\n2단계(3개): R-5 U0003 보안진단(인사혁신실 총무복지부), U0473 정보보안·개인정보보호관리(경영관리실 경영정보부)를 사이버보안센터로, R-6 U0538 항공운송마비(공항시설실 AS운영부)를 중앙통제센터로. 본부를 넘는 이동이라 직제규정시행세칙 별표 3(업무분장)과 별표 2(정원)를 고친다. 직제규정은 그대로 둔다.\n3단계(3개): R-7 U0535 공항운영규정·증명관리, U0537 이동지역 안전관리(공항시설실 AS운영부), U0167 이동지역건설사업안전성검토(건설사업실 건설안전부)를 안전기획부로. 직제규정 별표 4(업무분장)를 고쳐야 하고 세칙 별표 2·3도 함께 고친다.\n단계마다 분류기준표 개정 시행일을 조직 개편 시행일과 맞춘다. 인원·예산은 자료가 없어 적지 않았다.\n출처: kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md 5.2절·6절·부록 A, _workspace/20261117-safety/05_option_OPT-R.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 실행 순서', title: '세 단계로 나눠 옮긴다' });
      const ST = [
        { nm: '1단계', n: 4, cap: '규정은 그대로 둔다', hl: '지금 부서', hr: '받는 부서',
          mv: [['항공보안점검·수검관리', '보안계획부', '테러대응부'], ['신분확인·바이오패스관리', '테러대응부', '보안계획부'], ['수습·사후관리', '중앙통제센터', '재난방재부'], ['항공보안관리', '김포공항<br>시설단', '김포공항<br>운영단']] },
        { nm: '2단계', n: 3, cap: '시행세칙을 고친다', hl: '지금 부서 · 다른 본부', hr: '받는 부서 · 안전보안본부',
          mv: [['보안진단', '인사혁신실', '사이버보안센터'], ['정보보안·개인정보보호관리', '경영관리실', '사이버보안센터'], ['항공운송마비', '공항시설실', '중앙통제센터']] },
        { nm: '3단계', n: 3, cap: '직제규정을 고친다', hl: '지금 부서 · 건설기술본부', hr: '받는 부서 · 안전보안본부',
          mv: [['공항운영규정·증명관리', '공항시설실', '안전기획부'], ['이동지역 안전관리', '공항시설실', '안전기획부'], ['이동지역건설사업안전성검토', '건설사업실', '안전기획부']] },
      ];
      d.tabs = ST.map((S, i) => {
        const e = K.at(root, 'card flat', { x: 120 + i * 570, y: 296, w: 540, h: 116 });
        e.style.overflow = 'hidden';
        T(e, { x: 28, y: 16 }, `${S.nm} <span class="c" style="margin-left:10px">${S.n}개</span>`, 'font:900 42px/1.1 var(--display);letter-spacing:-0.02em;white-space:nowrap');
        T(e, { x: 28, y: 70 }, S.cap, F(700, 28, 'var(--ink-2)'));
        const bar = T(e, { x: 0, y: 0, w: 540, h: 8 }, '', `background:${C.blue};transform-origin:0 50%`);
        return { e, bar, c: e.querySelector('.c') };
      });
      const RY0 = 500, RP = 112, RH_ = 96, LBX = 120, RBX = 1152, BW = 648, LW = 216, CWd = 400, CHh = 76;
      d.stg = ST.map(S => {
        const g = K.at(root, '', { x: 0, y: 0, w: 1920, h: 1080 });
        T(g, { x: LBX, y: 440 }, S.hl, F(700, 28, 'var(--mute)'));
        T(g, { x: RBX, y: 440 }, S.hr, F(700, 28, 'var(--mute)'));
        const svg = K.svg(g);
        [1, 2].forEach(key => {
          const bx = key === 1 ? LBX : RBX;
          for (let i = 0; i < S.mv.length;) {
            let j = i; while (j + 1 < S.mv.length && S.mv[j + 1][key] === S.mv[i][key]) j++;
            const hh = (j - i) * RP + RH_;
            const e = K.at(g, 'card flat', { x: bx, y: RY0 + i * RP, w: BW, h: hh });
            if (key === 2) css(e, { borderColor: C.blue, borderWidth: '2.5px', background: 'rgba(47,123,255,.05)' });
            T(e, { x: 22, y: 0, w: LW - 10, h: hh }, S.mv[i][key], 'display:flex;align-items:center;' + F(800, 28, null, 1.25));
            i = j + 1;
          }
        });
        const arrows = [], cards = [];
        S.mv.forEach((m, i) => {
          const y = RY0 + i * RP + (RH_ - CHh) / 2, fx = LBX + LW + 16, tx = RBX + LW + 16;
          [fx, tx].forEach(x => T(g, { x, y, w: CWd, h: CHh }, '', 'box-sizing:border-box;border:2.5px dashed rgba(27,42,74,.28);border-radius:12px'));
          arrows.push(K.path(svg, [[LBX + BW + 16, y + CHh / 2], [RBX - 16, y + CHh / 2]], { color: 'rgba(27,42,74,.35)', width: 3, arrow: true }));
          const c = T(g, { x: fx, y, w: CWd, h: CHh }, m[0], 'box-sizing:border-box;border-radius:12px;border:3px solid ' + C.ink + ';background:#fff;display:flex;align-items:center;justify-content:center;white-space:nowrap;' + F(800, 28));
          cards.push({ c, from: [fx, y], to: [tx, y] });
        });
        return { g, arrows, cards };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      const PER = 3.6, L = K.loop(lt, 1.0, [PER, PER, PER]);
      const cur = L.i < 0 ? 0 : L.i, loc = L.i < 0 ? 0 : L.u * PER;
      d.tabs.forEach((t, i) => {
        K.rise(t.e, lt, 0.4 + i * 0.12, { y: 16 });
        const on = cur === i;
        css(t.e, { borderColor: on ? C.blue : 'rgba(27,42,74,.14)', borderWidth: on ? '3px' : '1.5px', background: on ? '#E6EFFF' : 'var(--paper-3)' });
        t.c.style.color = on ? C.blue : C.mute;
        t.bar.style.transform = `scaleX(${(on && L.i >= 0 ? L.u : 0).toFixed(3)})`;
      });
      d.stg.forEach((S, si) => {
        const on = cur === si;
        const a = !on ? 0 : L.i < 0 ? prog(lt, 0.7, 0.3) : (L.lap === 0 && si === 0 ? clamp((PER - loc) / 0.25) : fadeIO(loc, PER, 0.25));
        S.g.style.opacity = a.toFixed(3);
        if (!on) return;
        S.arrows.forEach(p => K.draw(p, 1, 0, 0.1));
        S.cards.forEach((cd, j) => {
          const p = K.travel(cd.c, loc, 0.7 + j * 0.18, 1.0, cd.from, cd.to, { fade: false });
          const lift = Math.sin(p * Math.PI);
          css(cd.c, { borderColor: p > 0 ? C.blue : C.ink, background: p >= 1 ? '#E6EFFF' : '#fff', transform: `scale(${(1 + 0.05 * lift).toFixed(3)})`, zIndex: p > 0 && p < 1 ? 5 : 1,
            boxShadow: lift > 0.01 ? `0 ${(18 * lift).toFixed(1)}px ${(30 * lift).toFixed(1)}px -14px rgba(47,123,255,.6)` : 'none' });
        });
      });
    },
  });

  // 경영진이 정할 여섯 가지(두 장)
  const REC = { yes: ['예', '#0B7A52', C.ok], no: ['지금은 아니오', '#B3261E', C.bad], hold: ['보류', '#965A00', C.warn] };
  const decide = (o) => DECK.slide({
    id: o.id, title: o.title, chapter: CH, harness: 'strategy', notes: o.notes,
    setup(root, d) {
      d.T = K.title(root, { kicker: o.kicker, title: o.title });
      d.cd = o.q.map((q, i) => {
        const e = K.at(root, 'card', { x: 120 + i * 570, y: 300, w: 540, h: 650 });
        T(e, { x: 36, y: 32, w: 64, h: 64 }, String(o.from + i), `border-radius:50%;background:${C.ink};display:flex;align-items:center;justify-content:center;font:900 36px/1 var(--display);color:#fff`);
        T(e, { x: 36, y: 122, w: 468 }, q[0], F(800, 40, null, 1.32));
        T(e, { x: 36, y: 344, w: 468, h: 3 }, '', 'background:var(--rule)');
        T(e, { x: 36, y: 372 }, '하네스의 추천', F(700, 28, 'var(--mute)'));
        const r = REC[q[1]];
        const rec = T(e, { x: 36, y: 424, w: 468 }, r[0], `font:900 78px/1.1 var(--display);letter-spacing:-0.03em;color:${r[1]};white-space:nowrap;transform-origin:0% 50%`);
        const why = T(e, { x: 36, y: 548, w: 468 }, q[2], F(600, 28, 'var(--ink-2)'));
        return { e, rec, why, col: r[2] };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      const PER = 2.0, L = K.loop(lt, 2.8, [PER, PER, PER]);
      d.cd.forEach((c, i) => {
        K.rise(c.e, lt, 0.5 + i * 0.18, { y: 26 });
        K.rise(c.why, lt, 1.5 + i * 0.18, { y: 8 });
        const on = L.i === i, loc = L.u * PER;
        css(c.e, { borderColor: on ? c.col : 'rgba(27,42,74,.14)', borderWidth: on ? '4px' : '1.5px' });
        // 질문이 강조되면 추천이 다시 찍힌다
        if (on) {
          c.rec.style.opacity = clamp((loc - 0.45) / 0.06).toFixed(3);
          c.rec.style.transform = `scale(${kf(loc, [[0.45, 1.5], [0.59, 0.96, ease.inQuad], [0.71, 1, ease.outQuad]]).toFixed(4)})`;
        } else K.pop(c.rec, lt, 1.2 + i * 0.18, { from: 1.3 });
      });
    },
  });
  decide({
    id: 'c3-decide', title: '경영진이 정할 것은 여섯 가지다', kicker: '전략적 조직 설계 · 경영진 결정 1~3', from: 1,
    notes: '보고서 7절은 경영진이 정할 질문 여섯 가지와 하네스의 추천을 적었다. 이 장은 1~3번이다. 먼저 정할 것은 1번과 2번이다.\n1 원문: 공항운영증명·이동지역 안전 업무를 건설기술본부에서 안전보안본부 안전기획부로 옮기기 위해 직제규정 별표 4(업무분장) 개정을 추진하는가? 추천: 예. 별도 항공안전부 신설은 택하지 않는다(R-7, 3단계).\n2 원문: 재난안전통신망 단말기 관리와 자연재난 대응지시(U0613·U0617)를 세칙 중앙통제센터 3항에 맞춰 중앙통제센터로 옮기는가? 추천: 지금은 아니오. 실제 운영대로 재난방재부에 두고, 중앙통제센터에 있는 재난안전통신망 철을 재난방재부로 재배정하는 분류 정비를 검토한다. 옮기기로 하면 넘어가는 업무량과 정원 이동을 먼저 산정한다.\n3 원문: 항공보안 종합상황실(U0627)을 중앙통제센터로 옮겨 공항 상황실이 보고할 본사 부서를 하나로 하는가? 추천: 대테러 관련 법령이 상황실 운영 주체를 정하는지 확인하기 전에는 보류. 그동안 테러대응부와 중앙통제센터가 공항 상황 보고 양식과 기준을 함께 정한다.\n출처: kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md 7절',
    q: [
      ['직제규정을 고쳐 공항운영증명 업무를 안전기획부로 옮길까?', 'yes', '새 항공안전부는 만들지 않는다'],
      ['재난안전통신망 관리를 중앙통제센터로 옮길까?', 'no', '지금처럼 재난방재부에 둔다'],
      ['항공보안 종합상황실을 중앙통제센터로 옮길까?', 'hold', '관련 법령을 먼저 확인한다'],
    ],
  });
  decide({
    id: 'c3-decide2', title: '여섯 가지 모두에 추천을 붙였다', kicker: '전략적 조직 설계 · 경영진 결정 4~6', from: 4,
    notes: '보고서 7절의 4~6번이다.\n4 원문: 공항운영증명의 구조·소방 요건을 확인한 뒤 김포·청주공항에 공항장 직속 안전보안부를 두는 개편을 추진하는가? 추천: 예. 다만 요건 확인과 김해·제주·중소 공항 적용 방식 정리가 끝난 뒤 김포공항부터 결정한다(대안 C, OPT-C 조치 1·2).\n5 원문: 불법드론 대응시스템·안티드론 연구개발과 항공보안장비를 모은 항공보안기술센터를 새로 두는가? 추천: 지금은 아니오. 센터의 직제 위치와 경비과학화시설 분리 문제를 정리한 뒤 다시 검토한다(대안 B, OPT-B 조치 1).\n6 원문: 각 단계 시행일에 분류기준표(단위업무와 기록물철 배정)를 함께 개정하는가? 추천: 예. 세칙만 고치고 분류기준표를 그대로 두면, 새 부서가 만든 문서가 원래 부서의 단위업무로 편철된다.\n출처: kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md 6절·7절',
    q: [
      ['김포·청주공항에 공항장 직속 안전보안부를 둘까?', 'yes', '요건을 확인한 뒤 김포공항부터'],
      ['항공보안기술센터를<br>새로 만들까?', 'no', '센터를 어디에 둘지 먼저 정한다'],
      ['단계마다 분류기준표도<br>같은 날 고칠까?', 'yes', '조직 개편 시행일에 맞춘다'],
    ],
  });

  // 근거 번호와 인용 검사
  DECK.slide({
    id: 'c3-cite', title: '숫자마다 근거 번호를 붙였고, 스크립트가 64건을 모두 검사했다', chapter: CH, harness: 'strategy',
    notes: '보고서 에이전트(executive-report-writer)는 보고서의 모든 숫자를 [근거 번호 항목=값] 형식으로 적었다. 예: [DP-004 단위업무 수=44], [CM-H01 문서 수=7577], [DP-014-03 단위업무 수=6], [영향 OPT-R 대상 단위업무 수=10].\n보고서가 끝난 뒤 스크립트 check_citations.py 가 근거 표기 64건을 사실 자료(data/facts/facts.json)와 다시 비교했고, 64건 모두 값이 같았다(오류 0건). 진단서 단계에서도 같은 검사를 했다(근거 164건, 오류 0건). 대안 파일은 check_option 검사를 통과했다(대안 A·B·C와 추천안 모두 OK).\n인원·예산·업무량·처리 시간은 자료가 없어 숫자를 쓰지 않았다. 보고서는 이 부분을 "자료 없음, 별도 산정 필요"로 남겼다.\n출처: kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md 8절·부록 D·부록 E, _workspace/20261117-safety/run.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 근거 검사', title: '숫자마다 근거 번호를 붙였고,\n스크립트가 64건을 모두 검사했다', size: 62 });
      const BASE = 740;
      d.wr = actor(root, { id: 'executive-report-writer', job: '숫자에 근거 번호를 붙인다', x: 150, y: BASE - 220 * K.AGR.write, w: 220 });
      d.sc = actor(root, { kind: 'script', name: '스크립트', job: '사실 자료와 비교한다', x: 900, y: BASE - 220 * K.AGR.script, w: 220 });
      d.svg = K.svg(root);
      d.p = K.path(d.svg, [[400, 640], [870, 640]], { color: C.ink2, width: 4, arrow: true });
      d.EX = [['안전보안실 단위업무 44개', 'DP-004'], ['안전보안실 문서 7,577건', 'CM-H01']];
      d.doc = d.EX.map(([t, id]) => {
        const e = K.doc(root, `<div style="font-size:30px">${t}</div><div style="margin-top:8px;${F(700, 24, C.blue)}">근거 번호 <span class="mono">${id}</span></div>`, { x: 0, y: 0 });
        e.style.padding = '14px 22px 16px';
        return e;
      });
      d.say = K.say(root, '자료와 같다', { x: 1140, y: 560 }, 'ok', 'l');
      d.lab = T(root, { x: 1380, y: 392 }, '검사한 근거 표기', F(800, 34));
      d.n = bigNum(root, { x: 1372, y: 446 }, 200, '건', C.blue);
      d.stamp = K.stampEl(root, '오류 0건', 'ok', { x: 1400, y: 700 }); d.stamp.style.fontSize = '54px';
      d.cap = T(root, { x: 120, y: 912, w: 1680 }, '인원·예산은 자료가 없어 숫자를 쓰지 않았다.', F(600, 30, 'var(--ink-2)'));
    },
    render(lt, d) {
      d.T.render(lt);
      d.wr.render(lt, 0.6); d.sc.render(lt, 0.8);
      K.draw(d.p, lt, 1.1, 0.4);
      K.rise(d.lab, lt, 1.3, { y: 8 }); K.rise(d.n.el, lt, 1.4, { y: 16 }); K.count(d.n.n, lt, 1.4, 1.2, 64);
      K.stamp(d.stamp, lt, 2.5, { rot: -5 }); K.rise(d.cap, lt, 2.2, { y: 10 });
      // 근거 표기 한 건이 보고서 에이전트에서 스크립트로 간다
      const L = K.loop(lt, 2.9, [1.1, 1.0, 1.5]);
      if (lt > 2.7) { d.wr.act(lt, L.i === 0); d.sc.act(lt, L.i === 2); }
      show(d.say, L.i === 2 && L.u > 0.3);
      d.doc.forEach((e, i) => {
        if (L.i < 0 || L.lap % 2 !== i) { e.style.opacity = '0'; return; }
        const A = [130, 356], B = [800, 392];
        if (L.i === 0) K.travel(e, 1, 0, 1, A, A); else if (L.i === 1) K.travel(e, L.u, 0, 1, A, B, { arc: 40 }); else K.travel(e, 1, 0, 1, B, B);
        e.className = 'doc' + (L.i === 2 && L.u > 0.3 ? ' ok' : '');
        e.style.opacity = (L.i === 0 ? clamp(L.u / 0.3) : L.i === 2 ? clamp((1 - L.u) / 0.12) : 1).toFixed(3);
      });
    },
  });

  // 결과 숫자
  DECK.slide({
    id: 'c3-result', title: '방향 한 줄로 추천안 하나를 냈다', chapter: CH, harness: 'strategy',
    notes: '조직 개편 추천 하네스(kac-org-strategy)의 실행 결과다. 입력은 방향 한 줄 "안전·보안 기능을 통합하는 방향"이었다.\n진단 에이전트가 문제 10개를 찾았고, 대안 설계 에이전트가 관점 셋으로 대안 3개를 만들었다. 반박 에이전트가 세 대안을 두 번씩 검토했고, 보고서 에이전트가 추천안 1개(OPT-R, 단위업무 10개·기록물철 22개 이동)와 경영진이 정할 질문 6가지를 냈다. 마지막에 스크립트 check_citations.py 가 보고서의 근거 표기 64건을 검사했고 오류는 0건이었다.\n결과물은 추천보고서 한 건이다. 사람(경영진)이 여섯 가지를 정해야 다음 단계로 간다.\n출처: kac-org-strategy/_workspace/20261117-safety/run.json, output/20261117-safety/조직개편_추천보고서.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 결과', title: '방향 한 줄로 추천안 하나를 냈다' });
      d.svg = K.svg(root);
      const R = [[10, '개', '찾은 문제', C.ink], [3, '개', '만든 대안', C.ink], [1, '개', '추천안', C.blue], [6, '가지', '경영진이 정할 것', C.ink]];
      d.col = R.map((r, i) => {
        const x = 120 + i * 430;
        const num = bigNum(root, { x, y: 340, w: 390 }, 210, r[1], r[3], 'justify-content:center');
        const lab = T(root, { x, y: 590, w: 390 }, r[2], F(800, 40) + ';text-align:center');
        return { num, lab, v: r[0] };
      });
      d.arr = [0, 1, 2].map(i => { const p = K.path(d.svg, [[120 + i * 430 + 384, 450], [120 + (i + 1) * 430 + 6, 450]], { color: C.ink2, width: 5, arrow: true }); return p; });
      d.band = K.at(root, 'card', { x: 120, y: 730, w: 1680, h: 190 });
      d.t = T(root, { x: 180, y: 730, h: 190 }, '<span>스크립트가 근거 표기</span><span class="n num" style="font:900 120px/1 var(--display);color:' + C.blue + ';margin:0 6px 0 22px">0</span><span>건을 모두 검사했다</span>', 'display:flex;align-items:baseline;padding-top:28px;box-sizing:border-box;white-space:nowrap;' + F(800, 44));
      d.n = d.t.querySelector('.n');
      d.stamp = K.stampEl(root, '오류 0건', 'ok', { x: 1420, y: 778 }); d.stamp.style.fontSize = '54px';
    },
    render(lt, d) {
      d.T.render(lt);
      const L = K.loop(lt, 2.9, [1.3, 1.3, 1.3, 1.3]);
      d.col.forEach((c, i) => {
        K.rise(c.num.el, lt, 0.5 + i * 0.25, { y: 20 }); K.count(c.num.n, lt, 0.5 + i * 0.25, 0.9, c.v);
        K.rise(c.lab, lt, 0.65 + i * 0.25, { y: 10 });
        const on = L.i === i;
        if (lt > 2.6) c.num.el.style.transform = `scale(${(on ? 1 + 0.07 * Math.sin(clamp(L.u * 2.5) * Math.PI / 2) * (1 - prog(L.u, 0.7, 0.3)) : 1).toFixed(4)})`;
        c.lab.style.color = on ? C.blue : C.ink;
      });
      d.arr.forEach((p, i) => K.draw(p, lt, 0.75 + i * 0.25, 0.25));
      K.rise(d.band, lt, 1.6, { y: 20 });
      K.rise(d.t, lt, 1.9, { y: 8 }); K.count(d.n, lt, 1.95, 0.9, 64);
      K.stamp(d.stamp, lt, 2.7, { rot: -5 });
    },
  });
})();

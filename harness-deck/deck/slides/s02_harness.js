/* 공통 구조 — 하네스 하나의 구성, 함께 읽는 자료, 스크립트와 에이전트가 일을 나누는 방식, 에이전트 18개, 파일 검사.
   「사람이 정할 것」 두 장(h-human, h-human2)은 맺음 앞으로 옮긴다(place). */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css } = RH;
  const C = K.C;
  const CH = '공통 구조';

  // ── 이 장 파일에서만 쓰는 도우미 ───────────────────────────
  // 절대 위치 글 상자
  const tx = (parent, box, html, style, cls = '') => {
    const el = K.at(parent, cls, box, html);
    if (style) el.style.cssText += ';' + style;
    return el;
  };
  // 보였다 숨기기(말풍선·도장처럼 단계마다 켜고 끄는 요소)
  const vis = (el, on) => { el.style.opacity = on ? '1' : '0'; el.style.transform = `scale(${on ? 1 : 0.8})`; };
  // 요소를 (x, y) 에 놓고 투명도를 정한다
  const put = (el, pos, o) => { el.style.left = pos[0].toFixed(1) + 'px'; el.style.top = pos[1].toFixed(1) + 'px'; el.style.opacity = clamp(o).toFixed(3); };
  // 에이전트 그림이 아닌 구성 요소의 이름표(K.actor 의 이름표와 같은 꼴)
  const ptag = (parent, box, text) => tx(parent, box,
    `<span style="display:inline-block;padding:8px 18px 9px;border-radius:999px;background:var(--paper-3);border:3px solid var(--ink-2);color:var(--ink);font:800 28px/1.1 var(--sans);letter-spacing:-0.02em;white-space:nowrap">${text}</span>`,
    'text-align:center');
  // 작은 에이전트 그림: 그림은 폭 w, 이름표는 폭 wide 안에서 가운데 정렬(이름표가 그림보다 넓다)
  const mini = (root, o) => {
    const kind = o.kind || K.AG[o.id].kind;
    const ih = o.w * K.AGR[kind], wide = o.wide ?? 252;
    const a = K.actor(root, { id: o.id, kind: o.kind, name: o.name, x: o.cx - o.w / 2, y: o.base - ih, w: o.w, size: o.size ?? 24 });
    a.el.style.left = (o.cx - wide / 2) + 'px';
    a.el.style.width = wide + 'px';
    a.img.style.margin = '0 auto';
    return a;
  };
  // 종이 그림: rules = 확인 표시가 줄마다 있는 종이, table = 표가 그려진 종이 두 장
  const icon = (parent, kind, x, y, w) => {
    const el = s('svg', { width: w, height: w * 190 / 150, viewBox: '0 0 150 190' }, parent);
    css(el, { position: 'absolute', left: x + 'px', top: y + 'px', overflow: 'visible', transformOrigin: '50% 100%' });
    const line = 'rgba(27,42,74,.35)';
    if (kind === 'rules') {
      s('rect', { x: 6, y: 6, width: 138, height: 178, rx: 12, fill: '#fff', stroke: C.ink, 'stroke-width': 5 }, el);
      [52, 98, 144].forEach(yy => {
        s('path', { d: `M 26 ${yy} L 38 ${yy + 12} L 58 ${yy - 12}`, fill: 'none', stroke: C.blue, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
        s('path', { d: `M 76 ${yy} L 124 ${yy}`, stroke: line, 'stroke-width': 7, 'stroke-linecap': 'round' }, el);
      });
    } else {
      s('rect', { x: 26, y: 6, width: 118, height: 150, rx: 10, fill: C.paper2, stroke: C.ink, 'stroke-width': 5 }, el);
      s('rect', { x: 6, y: 34, width: 118, height: 150, rx: 10, fill: '#fff', stroke: C.ink, 'stroke-width': 5 }, el);
      s('rect', { x: 9, y: 37, width: 112, height: 34, rx: 7, fill: 'rgba(25,169,116,.28)' }, el);
      [72, 108, 146].forEach(yy => s('path', { d: `M 9 ${yy} L 121 ${yy}`, stroke: line, 'stroke-width': 4 }, el));
      [46, 84].forEach(xx => s('path', { d: `M ${xx} 37 L ${xx} 181`, stroke: line, 'stroke-width': 4 }, el));
    }
    return el;
  };
  const pulse = (el, lt, on) => { el.style.transform = `scale(${(on ? 1 + 0.07 * K.wave(lt, 0.9) : 1).toFixed(4)})`; };

  // 하네스 하나의 구성
  DECK.slide({
    id: 'h-parts', title: '하네스 하나는 다섯 가지로 이루어진다', chapter: CH,
    notes: '하네스 하나는 폴더 하나이고, 그 안에 다섯 가지가 있다. 진행 순서, 에이전트, 판단 규칙, 스크립트, 결과 파일이다.\n제목 배정 하네스(kac-record-assign)로 보면 이렇다. 진행 순서는 오케스트레이터 스킬 record-assign(.claude/skills/record-assign/SKILL.md)에 적혀 있다. 묶음을 만들고, 배정·검증·중재를 하고, 결과를 합쳐 보고한다. 언제 이 하네스를 쓰는지는 CLAUDE.md에 적혀 있다.\n에이전트는 .claude/agents/ 에 있는 record-assigner, assignment-verifier, assignment-arbiter 세 개다. 판단 규칙은 record-assignment-rules 스킬에 따로 두어 세 에이전트가 같은 기준을 읽는다.\n스크립트는 make_batches.py(묶음 만들기), validate_batch.py(형식 검사), merge_results.py(결과 합치기), common.py(공용 경로) 네 개다. 단계마다 나오는 JSON 파일은 _workspace/t1/ 에, 사람이 읽는 결과(배정결과.csv, 배정결과.xlsx, 검토필요.csv, 요약.md)는 output/t1/ 에 남는다.\n다섯 하네스가 모두 이 구성이다.\n출처: kac-record-assign/ 폴더, 각 하네스의 .claude/agents/',
    setup(root, d) {
      d.T = K.title(root, { kicker: '하네스의 구성', title: '하네스 하나는 다섯 가지로 이루어진다' });
      d.frame = tx(root, { x: 120, y: 300, w: 1680, h: 580 }, '', 'border:3px solid rgba(27,42,74,.26);border-radius:28px;box-sizing:border-box');
      d.ftab = tx(root, { x: 166, y: 278 }, '하네스 하나', 'padding:0 16px;background:var(--paper);font:800 30px/1.45 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)');
      // 진행 순서: 단계 셋이 차례로 켜진다
      d.seqTag = ptag(root, { x: 150, y: 355, w: 240 }, '진행 순서');
      d.strip = tx(root, { x: 400, y: 340, w: 1370, h: 80 }, '', 'background:var(--paper-2);border-radius:18px');
      d.steps = [['문서를 추린다', 600], ['판단한다', 1125], ['결과를 모은다', 1600]].map(([t, cx]) =>
        tx(root, { x: cx - 150, y: 350, w: 300, h: 60 }, t, 'text-align:center;border-radius:30px;font:800 30px/60px var(--sans);letter-spacing:-0.02em'));
      d.svg = K.svg(root);
      d.sa = [[[772, 380], [952, 380]], [[1298, 380], [1428, 380]]].map(p => K.path(d.svg, p, { color: C.ink2, width: 3, arrow: true }));
      // 에이전트와 판단 규칙을 한데 묶는 바탕
      d.grp = tx(root, { x: 820, y: 446, w: 610, h: 406 }, '', 'background:rgba(47,123,255,.08);border-radius:24px');
      d.sc = K.actor(root, { kind: 'script', name: '스크립트', job: '추리고, 묶고, 검사한다', x: 500, y: 700 - 200 * K.AGR.script, w: 200, jobW: 320 });
      d.ag = K.actor(root, { kind: 'make', name: '에이전트', job: '문서를 읽고 판단한다', x: 880, y: 700 - 200 * K.AGR.make, w: 200, jobW: 280 });
      d.ru = icon(root, 'rules', 1195, 535, 130);
      d.ruTag = ptag(root, { x: 1120, y: 706, w: 280 }, '판단 규칙');
      d.ruJob = tx(root, { x: 1100, y: 768, w: 320 }, '에이전트가 함께 읽는 기준', 'text-align:center;font:600 26px/1.3 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)');
      d.out = icon(root, 'table', 1530, 523, 140);
      d.outTag = ptag(root, { x: 1460, y: 706, w: 280 }, '결과 파일');
      d.outJob = tx(root, { x: 1440, y: 768, w: 320 }, '사람이 읽는 표와 요약', 'text-align:center;font:600 26px/1.3 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)');
      d.pa = K.path(d.svg, [[712, 610], [806, 610]], { color: C.ink2, width: 4, arrow: true });
      d.pb = K.path(d.svg, [[1442, 610], [1516, 610]], { color: C.ink2, width: 4, arrow: true });
      d.pr = K.path(d.svg, [[1092, 610], [1186, 610]], { color: C.blue, width: 4, dash: '4 10' });
      d.cap = tx(root, { x: 120, y: 908, w: 1680 }, '다섯 하네스가 모두 같은 구성이다', 'text-align:center;font:800 42px/1.2 var(--display);letter-spacing:-0.02em;color:var(--ink)');
    },
    render(lt, d) {
      d.T.render(lt);
      d.frame.style.opacity = prog(lt, 0.3, 0.4).toFixed(3);
      K.rise(d.ftab, lt, 0.35, { y: 8 });
      K.pop(d.seqTag, lt, 0.5);
      K.wipe(d.strip, lt, 0.55, 0.5);
      d.steps.forEach((e, i) => K.rise(e, lt, 0.75 + i * 0.12, { y: 8 }));
      d.sa.forEach((p, i) => K.draw(p, lt, 0.95 + i * 0.12, 0.3));
      d.grp.style.opacity = prog(lt, 1.35, 0.4).toFixed(3);   // 에이전트 그림이 다 나타난 뒤에 바탕을 깐다
      d.sc.render(lt, 0.9); d.ag.render(lt, 1.1);
      K.rise(d.ru, lt, 1.3, { y: 16 }); K.pop(d.ruTag, lt, 1.4); K.rise(d.ruJob, lt, 1.55, { y: 8 });
      K.rise(d.out, lt, 1.6, { y: 16 }); K.pop(d.outTag, lt, 1.7); K.rise(d.outJob, lt, 1.85, { y: 8 });
      K.draw(d.pa, lt, 1.3, 0.3); K.draw(d.pr, lt, 1.5, 0.3); K.draw(d.pb, lt, 1.8, 0.3);
      K.rise(d.cap, lt, 2.1, { y: 14 });
      // 진행 순서의 단계가 켜지면 그 단계에서 일하는 구성 요소가 움직인다
      const L = K.loop(lt, 2.7, [1.5, 1.8, 1.5]);
      d.steps.forEach((e, i) => {
        RH.set(e, 'background', L.i === i ? C.ink : 'transparent');
        RH.set(e, 'color', L.i === i ? '#fff' : C.ink);
      });
      if (lt > 2.5) {
        d.sc.act(lt, L.i === 0 || L.i === 2);
        d.ag.act(lt, L.i === 1);
        pulse(d.ru, lt, L.i === 1);
        pulse(d.out, lt, L.i === 2);
      }
      d.pa.setAttribute('stroke', L.i === 0 ? C.blue : C.ink2);
      d.pb.setAttribute('stroke', L.i === 2 ? C.blue : C.ink2);
    },
  });

  // 다섯 하네스가 함께 읽는 자료
  DECK.slide({
    id: 'h-data', title: '다섯 하네스가 같은 자료를 읽기만 한다', chapter: CH,
    notes: '분류기준표와 문서목록은 kac-shared/data 폴더에 한 벌만 둔다. 다섯 하네스는 이 자료를 읽기만 하고 고치지 않는다.\n분류기준표 색인(classification.json)에는 기록물철 1,663개, 단위업무 703개, 부서공통 항목 46개가 들어 있다. 문서목록(production.sqlite)은 생산·접수 문서 1,076,767건이다. 문서목록의 부서 이름과 분류기준표의 부서 이름을 잇는 부서 대응표(dept_map.json)도 같은 폴더에 있다.\n원본 엑셀이 바뀌면 build_index.py 와 extract_titles.py 를 다시 실행해 이 자료를 새로 만든다.\n출처: kac-shared/README.md, kac-shared/data/classification.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '함께 쓰는 자료', title: '다섯 하네스가 같은 자료를 읽기만 한다' });
      d.svg = K.svg(root);
      const CX = i => 240 + i * 360;
      d.hz = K.HZ_ORDER.map((k, i) => {
        const sp = K.sprite(root, K.HZ[k].img, { crop: true, x: CX(i), y: 408, w: 180, origin: '50% 100%' });
        const lab = tx(root, { x: CX(i) - 170, y: 512, w: 340 }, '', 'text-align:center');
        K.hchip(lab, k);
        const pts = i === 2 ? [[960, 772], [960, 588]] : [[960, 772], [960, 690], [CX(i), 690], [CX(i), 588]];
        const p = K.path(d.svg, pts, { color: C.ink2, width: 3, arrow: true, radius: 20 });
        K.dots(d.svg, p, 2, { r: 7, color: C.blue });
        return { sp, lab, p };
      });
      d.rd = tx(root, { x: 990, y: 708 }, '읽기만 한다', 'font:800 36px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--blue-2);white-space:nowrap');
      d.card = K.at(root, 'card', { x: 330, y: 772, w: 1260, h: 190 });
      const itemD = (x, kind, name, sub) => {
        icon(d.card, kind, x, 28, 104);
        tx(d.card, { x: x + 132, y: 40 }, name, 'font:900 48px/1.1 var(--display);letter-spacing:-0.03em;color:var(--ink);white-space:nowrap');
        tx(d.card, { x: x + 132, y: 106 }, sub, 'font:600 30px/1.2 var(--sans);letter-spacing:-0.01em;color:var(--ink-2);white-space:nowrap');
      };
      itemD(70, 'rules', '분류기준표', '기록물철 <span class="num">1,663</span>개');
      itemD(680, 'table', '문서목록', '문서 <span class="num">1,076,767</span>건');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.card, lt, 0.5, { y: 20 });
      d.hz.forEach((z, i) => {
        K.rise(z.sp, lt, 0.8 + i * 0.12, { y: 20 });
        K.pop(z.lab, lt, 1.0 + i * 0.12);
        K.draw(z.p, lt, 1.5 + i * 0.1, 0.5, { speed: 150 });
      });
      K.rise(d.rd, lt, 2.1, { x: -12, y: 0 });
      // 하네스 하나씩: 그 하네스로 가는 선이 굵어지고 그림이 커진다
      const k = K.cycle(lt, 2.8, 1.4, d.hz.length);
      d.hz.forEach((z, i) => {
        const on = i === k;
        z.p.setAttribute('stroke-width', on ? 6 : 3);
        z.p.setAttribute('stroke', on ? C.blue : C.ink2);
        if (lt > 2.6) z.sp.style.transform = `scale(${(on ? 1 + 0.08 * Math.sin(Math.PI * clamp(((lt - 2.8) % 1.4) / 1.4)) : 1).toFixed(4)})`;
      });
    },
  });

  // 스크립트가 줄이고, 에이전트가 판단한다
  DECK.slide({
    id: 'h-p1', title: '스크립트가 줄이고, 에이전트가 판단한다', chapter: CH,
    notes: '문서를 전부 에이전트에게 보내지 않는다. 스크립트가 먼저 문서를 묶거나 추리고, 남은 것만 에이전트가 읽고 판단한다.\n화면은 제목 배정 하네스(kac-record-assign)의 시험 실행 t1 이다. 감사실과 제주운영단의 2026년 문서 21,357건을 make_batches.py 가 숫자만 다른 제목끼리 묶어 서로 다른 제목 14,299개로 줄였다. 이번 시험에서는 그 가운데 40개를 골라 record-assigner 가 판단했다. 아직 판단하지 않은 제목이 14,259개 남아 있다.\n움직이는 예는 감사실 문서 4건이다. 「국민권익위원회 국가청렴권익교육원 한국형 온라인 공개강좌(K-MOOC) 2026-1기 개강 안내」부터 4기까지 숫자만 다른 제목 4건이 한 항목으로 묶였고, 「청렴교육」 철(F0238)로 확정됐다. 화면에서는 제목 앞부분을 줄여 적었다.\n다른 두 하네스도 같다. 오분류 점검(kac-classification-audit, test01)은 시험 자료 600건에서 screen.py 가 의심 신호가 있는 묶음 158개(문서 179건)를 골랐고, 그중 100묶음(문서 121건)을 blind-classifier 가 다시 분류했다. 단위업무명 추천(kac-unit-task-naming, 감사실)은 문서 8,978건에서 prepare_dept.py 가 공통 수신 2,152건과 부서공통 추정 193건을 빼고 남은 6,633건을 제목이 비슷한 묶음으로 만들어, 큰 묶음 90개(문서 4,597건)를 work-cluster-analyst 에게 넘겼다.\n막대 길이는 21,357건에 대한 비율이고, 40개는 보이도록 최소 폭을 줬다.\n출처: kac-record-assign/output/t1/요약.md, 배정결과.csv, _workspace/t1/batches/batch_0001.json, kac-classification-audit/output/test01/요약.md, kac-unit-task-naming/output/20261117-감사실/요약.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '제목 배정 하네스의 예', title: '스크립트가 줄이고, 에이전트가 판단한다' });
      d.svg = K.svg(root);
      const NUM = (x, v, unit, label, col, wbar) => {
        const g = K.at(root, '', { x, y: 536 });
        const line = h('div', '', g); line.style.cssText = 'white-space:nowrap;line-height:1';
        const n = h('span', 'num', line, '0'); n.style.cssText = `font:900 100px/1 var(--display);letter-spacing:-0.04em;color:${col}`;
        const u = h('span', '', line, unit); u.style.cssText = `font:800 44px/1 var(--sans);margin-left:8px;color:${col}`;
        const lb = h('div', '', g, label); lb.style.cssText = 'margin-top:12px;font:700 28px/1.3 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);white-space:nowrap';
        const bar = h('div', '', g); bar.style.cssText = `margin-top:14px;height:22px;border-radius:5px;background:${col};width:0`;
        return { g, n, bar, v, wbar };
      };
      d.n1 = NUM(120, 21357, '건', '두 부서의 2026년 문서', C.ink, 380);
      d.sc = K.actor(root, { kind: 'script', name: '스크립트', job: '숫자만 다른 제목을 묶는다', x: 585, y: 750 - 200 * K.AGR.script, w: 200, jobW: 330 });
      d.n2 = NUM(855, 14299, '개', '서로 다른 제목', C.ink, 254);
      d.n3 = NUM(1318, 40, '개', '이번에 판단한 제목', C.blue, 8);
      d.ag = K.actor(root, { id: 'record-assigner', job: '기록물철을 고른다', x: 1565, y: 750 - 220 * K.AGR.make, w: 220, jobW: 280 });
      d.arr = [[[532, 586], [572, 586]], [[798, 586], [842, 586]], [[1262, 586], [1304, 586]], [[1512, 586], [1554, 586]]]
        .map(p => K.path(d.svg, p, { color: C.ink2, width: 4, arrow: true }));
      // 실제 사례: 숫자만 다른 제목 4건이 제목 1개로 묶인다
      d.docs = [1, 2, 3, 4].map(j => K.doc(root, `…K-MOOC 2026-${j}기 개강 안내`, { x: 0, y: 0 }));
      d.one = K.doc(root, '…K-MOOC 2026-○기 개강 안내 <span style="margin-left:8px;padding:2px 10px;border-radius:999px;background:var(--ink);color:#fff;font-size:22px">4건</span>', { x: 0, y: 0 }, 'blue');
      d.say = K.say(root, '「청렴교육」 철입니다', { x: 1480, y: 368 }, 'blue', 'l');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.n1.g, lt, 0.5, { y: 14 });
      K.count(d.n1.n, lt, 0.5, 0.8, d.n1.v);
      d.n1.bar.style.width = (d.n1.wbar * prog(lt, 0.6, 0.6, ease.snap)).toFixed(1) + 'px';
      K.draw(d.arr[0], lt, 0.9, 0.2);
      d.sc.render(lt, 0.9);
      K.draw(d.arr[1], lt, 1.2, 0.2);
      // 앞 숫자에서 줄어든다
      [[d.n2, d.n1, 1.3], [d.n3, d.n2, 1.9]].forEach(([a, b, t0]) => {
        K.rise(a.g, lt, t0, { y: 14 });
        const p = prog(lt, t0 + 0.1, 0.7, ease.inOutCubic);
        a.n.textContent = RH.count(p, a.v, { from: b.v });
        a.bar.style.width = lerp(b.wbar, a.wbar, p).toFixed(1) + 'px';
      });
      K.draw(d.arr[2], lt, 1.8, 0.2); K.draw(d.arr[3], lt, 2.3, 0.2);
      d.ag.render(lt, 2.3);
      // 제목 4건 → 스크립트가 1개로 묶는다 → 에이전트가 철을 고른다
      const L = K.loop(lt, 2.9, [1.2, 1.2, 0.6, 1.2, 2.2]), st = L.i, u = L.u;
      const T = [517, 478], A = [1385, 440];
      d.docs.forEach((c, j) => {
        const S = [130 + j * 22, 300 + j * 46];
        if (st === 0) put(c, S, (u - j * 0.15) / 0.2);
        else if (st === 1) { const p = ease.inOutCubic(clamp((u - j * 0.08) / 0.7)); put(c, [lerp(S[0], T[0], p), lerp(S[1], T[1], p)], 1); }
        else if (st === 2) put(c, T, 1 - u / 0.5);
        else put(c, T, 0);
      });
      if (st === 2) put(d.one, T, u / 0.5);
      else if (st === 3) { K.travel(d.one, u, 0, 1, T, A, { arc: 36 }); d.one.style.opacity = '1'; }
      else if (st === 4) put(d.one, A, (1 - u) / 0.08);
      else put(d.one, T, 0);
      vis(d.say, st === 4 && u > 0.2 && u < 0.92);
      if (lt > 2.8) { d.sc.act(lt, (st === 1 && u > 0.4) || st === 2); d.ag.act(lt, st === 4 && u < 0.92); }
    },
  });

  // 에이전트 18개: 하네스 한 줄 × 역할 세 칸. 줄 수가 많아 두 장으로 나눈다.
  const HEAD = [['만들기', C.blue, '#1456C8', 430, 760], ['검증·반박', C.bad, '#B3261E', 1215, 250], ['판정·보고서', C.warn, '#965A00', 1515, 250]];
  const COLX = { make: [557, 810, 1063], check: [1340], judge: [1640] };
  const gridSlide = o => DECK.slide({
    id: o.id, title: o.title, chapter: CH, notes: o.notes,
    setup(root, d) {
      d.T = K.title(root, { kicker: o.kicker, title: o.title });
      d.heads = HEAD.map(([t, c, ci, x, w]) => tx(root, { x, y: 286, w, h: 56 }, t,
        `border-top:5px solid ${c};padding-top:8px;box-sizing:border-box;font:800 32px/1.2 var(--sans);letter-spacing:-0.02em;color:${ci}`));
      d.rows = o.rows.map((r, ri) => {
        const y = o.y0 + ri * o.pitch, base = y + o.baseOff;
        const bg = tx(root, { x: 104, y: y + 2, w: 1712, h: o.pitch - 6 }, '', 'border-radius:18px');
        const line = ri < o.rows.length - 1 ? tx(root, { x: 120, y: y + o.pitch - 2, w: 1680, h: 2 }, '', 'background:var(--rule)') : null;
        const lab = tx(root, { x: 120, y: base - o.w * 0.5 - 27 }, '');
        K.hchip(lab, r.hk);
        const acts = {};
        ['make', 'check', 'judge'].forEach(col => r[col].forEach((id, j) => { acts[id] = mini(root, { id, cx: COLX[col][j], base, w: o.w }); }));
        return { bg, line, lab, all: Object.values(acts), seq: r.order.map(id => acts[id]) };
      });
      d.flat = [];
      d.rows.forEach((r, ri) => r.seq.forEach(a => d.flat.push([ri, a])));
      if (o.foot) d.foot = tx(root, { x: 120, y: o.footY, w: 1680 }, o.foot, 'text-align:center;font:800 40px/1.2 var(--display);letter-spacing:-0.02em;color:var(--ink)');
    },
    render(lt, d) {
      d.T.render(lt);
      d.heads.forEach((e, i) => K.rise(e, lt, 0.35 + i * 0.12, { y: 12 }));
      d.rows.forEach((r, ri) => {
        K.rise(r.lab, lt, 0.5 + ri * 0.12, { x: -20, y: 0 });
        if (r.line) K.wipe(r.line, lt, 0.6 + ri * 0.12, 0.6);
        r.all.forEach(a => a.render(lt, 0.8 + ri * 0.12 + ((a.cx - 557) / 1083) * 0.9));
      });
      if (d.foot) K.rise(d.foot, lt, 2.2, { y: 14 });
      // 하네스 한 줄씩, 실제로 일하는 순서대로 에이전트가 움직인다
      const L = K.loop(lt, 2.9, d.flat.map(() => 1.0));
      const cur = L.i >= 0 ? d.flat[L.i] : null;
      d.rows.forEach((r, ri) => {
        K.mark(r.bg, !!cur && cur[0] === ri, 'rgba(27,42,74,.055)');
        if (lt > 2.8) r.all.forEach(a => a.act(lt, !!cur && cur[1] === a));
      });
    },
  });
  gridSlide({
    id: 'h-p2', kicker: '에이전트 18개 가운데 9개', title: '하네스마다 에이전트가 역할을 나눠 맡는다',
    y0: 348, pitch: 208, w: 112, baseOff: 146,
    notes: '다섯 하네스에 에이전트가 18개 있다. 역할로 나누면 만들기 9개, 검증·반박 5개, 판정·보고서 4개다. 이 장은 앞의 세 하네스 9개다.\n제목 배정(kac-record-assign): record-assigner 가 철을 고르고, assignment-verifier 가 따로 다시 판단하고, 둘이 다르면 assignment-arbiter 가 정한다.\n오분류 점검(kac-classification-audit)은 순서가 다르다. blind-classifier 가 기존 분류를 보지 않고 다시 분류하고, label-judge 가 기존 분류가 오류인지 판정한 뒤, correction-challenger 가 그 판정을 반박한다. 반박을 받고도 판정이 바뀌지 않은 것만 정정 권고가 된다.\n단위업무명 추천(kac-unit-task-naming): work-cluster-analyst 가 문서 묶음이 어떤 업무인지 해석하고, unit-task-namer 가 이름을 제안하고, naming-reviewer 가 검토한다. 지적이 있으면 이름 제안 에이전트가 고쳐 다시 검토를 받는다. 이 하네스에는 판정 에이전트가 없다.\n화면의 움직임은 하네스마다 에이전트가 실제로 불리는 순서다.\n모델은 화면에서 뺐다. opus 13개(검증·반박·중재와 진단·설계·이름 제안), sonnet 5개(양이 많은 1차 배정·분류·묶음 해석, 규정 조항 정리, 보고서 정리)다.\n출처: 각 하네스 .claude/agents/*.md 의 머리말(name, model, tools)과 본문',
    rows: [
      { hk: 'assign', make: ['record-assigner'], check: ['assignment-verifier'], judge: ['assignment-arbiter'],
        order: ['record-assigner', 'assignment-verifier', 'assignment-arbiter'] },
      { hk: 'audit', make: ['blind-classifier'], check: ['correction-challenger'], judge: ['label-judge'],
        order: ['blind-classifier', 'label-judge', 'correction-challenger'] },
      { hk: 'naming', make: ['work-cluster-analyst', 'unit-task-namer'], check: ['naming-reviewer'], judge: [],
        order: ['work-cluster-analyst', 'unit-task-namer', 'naming-reviewer', 'unit-task-namer', 'naming-reviewer'] },
    ],
  });
  gridSlide({
    id: 'h-p2b', kicker: '에이전트 18개 가운데 나머지 9개', title: '조직을 다루는 두 하네스에는 보고서 에이전트가 있다',
    y0: 352, pitch: 250, w: 140, baseOff: 186, footY: 892,
    foot: '<span style="color:#B3261E">검증하는 에이전트</span>는 만든 쪽의 파일을 고치지 않는다',
    notes: '뒤의 두 하네스 9개다. 두 하네스는 마지막에 보고서 에이전트가 앞 단계의 결과를 사람이 읽는 보고서로 정리한다.\n조직 변경 영향(kac-org-change-impact): org-change-interpreter 가 조직 변경 내용을 해석하고, unit-impact-analyst 가 단위업무마다 영향을 분석해 변경안을 내고, change-proposal-verifier 가 검증하고, impact-report-writer 가 보고서를 쓴다.\n조직 개편 추천(kac-org-strategy): org-diagnostician 이 조직을 진단하고, regulation-constraint-checker 가 규정에서 지켜야 할 조항을 정리하고, org-option-designer 가 대안을 설계한다. org-option-critic 이 대안을 반박하면 설계 에이전트가 보완해 다시 검토를 받는다. 마지막에 executive-report-writer 가 보고서를 쓴다.\n검증하는 에이전트는 만든 쪽의 파일을 고치지 않는다는 말의 근거는 이렇다. change-proposal-verifier, org-option-critic, naming-reviewer 는 도구 목록에 Edit 가 없어서 상대의 파일을 고칠 수 없고 자기 검토 파일만 쓴다. assignment-verifier 는 Edit 가 있지만 에이전트 정의에 배정 결과 파일을 고치지 않는다고 적혀 있다. correction-challenger 는 Edit 가 있고, 판정 파일과 별도로 자기 반박 파일을 쓴다.\n출처: 각 하네스 .claude/agents/*.md 의 머리말(name, model, tools)과 본문',
    rows: [
      { hk: 'orgchange', make: ['org-change-interpreter', 'unit-impact-analyst'], check: ['change-proposal-verifier'], judge: ['impact-report-writer'],
        order: ['org-change-interpreter', 'unit-impact-analyst', 'change-proposal-verifier', 'impact-report-writer'] },
      { hk: 'strategy', make: ['org-diagnostician', 'regulation-constraint-checker', 'org-option-designer'], check: ['org-option-critic'], judge: ['executive-report-writer'],
        order: ['org-diagnostician', 'regulation-constraint-checker', 'org-option-designer', 'org-option-critic', 'org-option-designer', 'org-option-critic', 'executive-report-writer'] },
    ],
  });

  // 결과는 파일로 남기고, 스크립트가 형식을 검사한다
  DECK.slide({
    id: 'h-p3', title: '결과는 파일로 남기고, 스크립트가 형식을 검사한다', chapter: CH,
    notes: '에이전트끼리 대화로 결과를 넘기지 않는다. 앞 단계의 에이전트가 결과를 JSON 파일로 남기면 다음 단계가 그 파일을 읽는다. 판단 내용이 파일에 남아서 나중에 사람이 확인할 수 있다.\n파일을 쓴 에이전트는 바로 검사 스크립트(validate_batch.py)를 실행한다. 스크립트는 빠지거나 겹친 항목이 없는지, 정해진 말로 적었는지(배정 수준은 철·단위업무·부서공통·미배정, 확신도는 높음·보통·낮음), 고른 번호가 그 묶음의 후보 안에 있는지, 미배정이면 유형을 적었는지, 근거를 적었는지를 본다. 화면에는 세 가지만 적었다.\n틀린 곳이 있으면 스크립트가 그 항목과 이유를 알려 주고, 에이전트는 그 항목만 고쳐 다시 검사한다. 세 번 고쳐도 통과하지 못하면 남은 오류를 보고하고 멈춘다.\n제목 배정 하네스의 시험 실행 t1 에서는 묶음 3개마다 배정(results/), 검증(verify/), 중재(arbitrate/) 파일이 하나씩 _workspace/t1/ 에 남았다. 진행을 맡은 오케스트레이터(record-assign 스킬)에는 통과 여부와 건수만 돌아온다.\n출처: kac-record-assign/.claude/skills/record-assign/SKILL.md, scripts/validate_batch.py, .claude/agents/record-assigner.md, _workspace/t1/',
    setup(root, d) {
      d.T = K.title(root, { kicker: '결과를 주고받는 방식', title: '결과는 파일로 남기고, 스크립트가 형식을 검사한다' });
      d.svg = K.svg(root);
      d.a1 = K.actor(root, { kind: 'make', name: '만드는 에이전트', job: '결과를 파일로 남긴다', x: 130, y: 640 - 230 * K.AGR.make, w: 230, jobW: 300 });
      d.sc = K.actor(root, { kind: 'script', name: '스크립트', job: '형식을 검사한다', x: 770, y: 640 - 210 * K.AGR.script, w: 210, jobW: 300 });
      d.a2 = K.actor(root, { kind: 'check', name: '검증 에이전트', job: '통과한 파일을 읽는다', x: 1500, y: 640 - 220 * K.AGR.check, w: 220, jobW: 300 });
      d.p1 = K.path(d.svg, [[385, 540], [750, 540]], { color: C.ink2, width: 4, arrow: true });
      d.p2 = K.path(d.svg, [[1000, 540], [1480, 540]], { color: C.ok, width: 5, arrow: true });
      d.p3 = K.path(d.svg, [[660, 846], [245, 846], [245, 768]], { color: C.bad, width: 5, arrow: true, radius: 24 });
      d.l2 = tx(root, { x: 1150, y: 478 }, '통과하면', 'font:800 34px/1 var(--sans);color:var(--ok)');
      d.l3 = tx(root, { x: 275, y: 866 }, '틀리면 그 항목만 다시 쓴다', 'font:800 30px/1.2 var(--sans);letter-spacing:-0.02em;color:#B3261E;white-space:nowrap');
      // 검사 항목 셋
      d.box = tx(root, { x: 670, y: 762, w: 430, h: 170 }, '', 'border:2.5px dashed var(--rule-2);border-radius:16px;box-sizing:border-box');
      d.ck = ['빠진 항목이 없는가', '후보에 있는 번호인가', '근거를 적었는가'].map((t, i) => {
        const r = tx(root, { x: 684, y: 776 + i * 48, w: 402, h: 44 }, '', 'display:flex;align-items:center;gap:14px;padding:0 12px;box-sizing:border-box;border-radius:10px');
        const ic = s('svg', { width: 34, height: 34, viewBox: '0 0 34 34' }, r);
        ic.style.flex = 'none';
        const ring = s('circle', { cx: 17, cy: 17, r: 14, fill: 'none', stroke: 'rgba(27,42,74,.3)', 'stroke-width': 3 }, ic);
        const ok = s('path', { d: 'M 9 17.5 L 15 23 L 25 11', fill: 'none', stroke: C.ok, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ic);
        const no = s('path', { d: 'M 11 11 L 23 23 M 23 11 L 11 23', fill: 'none', stroke: C.bad, 'stroke-width': 4, 'stroke-linecap': 'round' }, ic);
        const lb = h('span', '', r, t); lb.style.cssText = 'font:700 28px/1 var(--sans);letter-spacing:-0.02em;color:var(--ink);white-space:nowrap';
        return { r, ring, ok, no };
      });
      d.st = K.stampEl(root, '통과', 'ok', { x: 1170, y: 590 });
      d.st.style.fontSize = '44px';
      d.doc = K.doc(root, '결과 파일', { x: 0, y: 0 });
      d.say = K.say(root, '다시 씁니다', { x: 340, y: 322 }, 'blue', 'l');
    },
    render(lt, d) {
      d.T.render(lt);
      d.a1.render(lt, 0.5); d.sc.render(lt, 0.8); d.a2.render(lt, 1.1);
      K.draw(d.p1, lt, 0.8, 0.4); K.draw(d.p2, lt, 1.2, 0.4);
      K.rise(d.l2, lt, 1.4, { y: 8 });
      d.box.style.opacity = prog(lt, 1.4, 0.3).toFixed(3);
      d.ck.forEach((c, i) => K.rise(c.r, lt, 1.5 + i * 0.12, { y: 10 }));
      K.draw(d.p3, lt, 1.9, 0.6); K.rise(d.l3, lt, 2.1, { y: 8 });
      // 파일 하나의 진행. 짝수 바퀴는 통과하고, 홀수 바퀴는 둘째 항목이 틀려 만든 쪽으로 돌아간다.
      const L = K.loop(lt, 2.8, [1.0, 0.9, 1.8, 1.0, 1.5]), st = L.i, u = L.u;
      const fail = L.lap % 2 === 1;
      const A = [177, 326], S = [807, 358], V = [1542, 307];
      d.ck.forEach((c, i) => {
        const done = st > 2 || (st === 2 && u > (i + 1) * 0.29);
        const bad = done && fail && i === 1;
        c.ring.style.opacity = done ? '0' : '1';
        c.ok.style.opacity = done && !bad ? '1' : '0';
        c.no.style.opacity = bad ? '1' : '0';
        K.mark(c.r, bad, 'rgba(232,72,58,.14)');
      });
      K.stamp(d.st, !fail && st >= 3 ? L.t : -1, 3.9, { rot: -7 });
      vis(d.say, fail && st === 4 && u > 0.3);
      d.p2.setAttribute('stroke-width', !fail && st >= 3 ? 8 : 5);
      d.p3.setAttribute('stroke-width', fail && st >= 3 ? 8 : 5);
      if (lt > 2.7) {
        d.a1.act(lt, st === 0 || (fail && st === 4));
        d.sc.act(lt, st === 2);
        d.a2.act(lt, !fail && st === 4);
      }
      if (st < 0) { d.doc.style.opacity = '0'; return; }
      d.doc.className = 'doc' + (st >= 3 ? (fail ? ' bad' : ' ok') : '');
      if (st === 0) put(d.doc, A, u / 0.25);
      else if (st === 1) { K.travel(d.doc, u, 0, 1, A, S, { arc: 40 }); d.doc.style.opacity = '1'; }
      else if (st === 2) put(d.doc, S, 1);
      else if (st === 3) { K.travel(d.doc, u, 0, 1, S, fail ? A : V, { arc: 40 }); d.doc.style.opacity = '1'; }
      else put(d.doc, fail ? A : V, (1 - u) / 0.12);
    },
  });

  // ── 사람이 정할 것: 하네스 한 줄에 판정 이름과 건수 ─────────────
  const STC = { ok: '#0B7A52', warn: '#965A00', bad: '#B3261E', ghost: C.ink2, blue: C.blue };
  const ROWH = 124, PITCH = 132, Y0 = 300;
  // rows = [{ hk, items: [[수, 단위, 판정 이름, 색]], basis }]
  const statRows = (root, d, rows, o) => rows.map((r, i) => {
    const y = Y0 + i * PITCH;
    const row = tx(root, { x: 110, y, w: o.w, h: ROWH }, '', 'border-radius:18px');
    const line = i < rows.length - 1 ? tx(root, { x: 120, y: y + ROWH + 3, w: o.w - 20, h: 2 }, '', 'background:var(--rule)') : null;
    const lab = tx(row, { x: 10, y: 0, h: ROWH }, '', 'display:flex;align-items:center');
    K.hchip(lab, r.hk);
    const items = r.items.map(([v, unit, name, cls], j) => {
      const g = tx(row, { x: o.ix[j], y: 0, h: ROWH }, '', 'display:flex;align-items:center;white-space:nowrap;transform-origin:0 50%');
      const n = h('span', 'num', g, '0'); n.style.cssText = `font:900 96px/1 var(--display);letter-spacing:-0.04em;color:${STC[cls]}`;
      const u = h('span', '', g, unit); u.style.cssText = `font:800 32px/1 var(--sans);margin:30px 18px 0 10px;color:${STC[cls]}`;
      h('span', 'chip lg ' + cls, g, name).style.cssText = 'font-size:32px;height:58px;padding:0 20px';
      return { g, n, v };
    });
    const basis = r.basis ? tx(row, { x: o.bx, y: 0, h: ROWH }, r.basis, 'display:flex;align-items:center;font:600 28px/1.3 var(--sans);letter-spacing:-0.02em;color:var(--mute);white-space:nowrap') : null;
    return { row, line, lab, items, basis, cy: y + ROWH / 2 };
  });
  const statIn = (lt, rows) => rows.forEach((r, i) => {
    const t0 = 0.5 + i * 0.14;
    K.rise(r.lab, lt, t0, { x: -20, y: 0 });
    if (r.line) K.wipe(r.line, lt, t0 + 0.1, 0.6);
    r.items.forEach((it, j) => { K.rise(it.g, lt, t0 + 0.15 + j * 0.15, { y: 12 }); K.count(it.n, lt, t0 + 0.15 + j * 0.15, 0.8, it.v); });
    if (r.basis) K.rise(r.basis, lt, t0 + 0.5, { y: 8 });
  });

  // 하네스가 낸 판정
  DECK.slide({
    id: 'h-human', title: '하네스는 정할 수 있는 것만 판정했다', chapter: '맺음', place: { before: 'summary' }, wimg: 'g07_review',
    notes: '다섯 하네스가 시험 실행에서 낸 판정이다. 하네스는 근거가 있는 것만 판정하고, 정할 수 없는 것은 따로 표시해 사람에게 넘긴다(다음 장).\n제목 배정(kac-record-assign, t1): 제목 40개 가운데 33개는 검증이 동의해 확정했고, 7개는 중재를 거쳐 확정했다.\n오분류 점검(kac-classification-audit, test01): 점검한 묶음 100개 가운데 정정 권고 68, 유지 29.\n단위업무명 추천(kac-unit-task-naming, 감사실): 제안 23건 가운데 통과 21.\n조직 변경 영향(kac-org-change-impact): 확정안 2건(F0164, F0153). 확정안도 사람이 검토한 뒤 적용한다.\n조직 개편 추천(kac-org-strategy): 대안 3개가 모두 1차 검토에서 보완 필요, 보완한 뒤 2차 검토에서 채택 가능 판정을 받았다. 추천안은 OPT-R 이다.\n출처: 각 하네스 output/ 의 요약.md, 영향도_보고서.md, 조직개편_추천보고서.md, 단위업무_제안표.csv',
    setup(root, d) {
      d.T = K.title(root, { kicker: '하네스가 낸 판정', title: '하네스는 정할 수 있는 것만 판정했다', w: 1460 });
      d.rows = statRows(root, d, [
        { hk: 'assign', items: [[33, '개', '확정', 'ok'], [7, '개', '확정(중재)', 'ok']], basis: '제목 40개 가운데' },
        { hk: 'audit', items: [[68, '묶음', '정정 권고', 'bad'], [29, '묶음', '유지', 'ok']], basis: '묶음 100개 가운데' },
        { hk: 'naming', items: [[21, '건', '통과', 'ok']], basis: '제안 23건 가운데' },
        { hk: 'orgchange', items: [[2, '건', '확정안', 'ok']], basis: '기록물철 <span class="mono" style="font-size:26px;margin-left:10px;color:var(--ink-2)">F0164, F0153</span>' },
        { hk: 'strategy', items: [[3, '개', '2차 채택 가능', 'ok']], basis: '대안 3개 모두, 1차는 보완 필요' },
      ], { w: 1700, ix: [390, 850], bx: 1300 });
    },
    render(lt, d) {
      d.T.render(lt);
      statIn(lt, d.rows);
      // 하네스 한 줄씩 강조한다
      const k = K.cycle(lt, 2.9, 1.5, d.rows.length);
      d.rows.forEach((r, i) => {
        K.mark(r.row, i === k, 'rgba(27,42,74,.06)');
        if (lt > 2.8) r.items.forEach(it => { it.g.style.transform = `scale(${(i === k ? 1 + 0.05 * Math.sin(Math.PI * clamp(((lt - 2.9) % 1.5) / 0.7)) : 1).toFixed(4)})`; });
      });
    },
  });

  // 사람에게 넘긴 것
  DECK.slide({
    id: 'h-human2', title: '검토와 승인은 사람이 한다', chapter: '맺음', place: { before: 'summary' }, wimg: 'g07_review',
    notes: '필름 I 구간과 같은 말이다. 다섯 하네스는 추천까지만 하고, 검토와 승인은 사람이 한다. 하네스가 정할 수 없던 것은 상태를 표시해 사람에게 넘겼다.\n제목 배정(t1): 제목 정보가 부족한 문서 5건은 철을 정하지 않고 미배정으로 남겼다. 검토필요는 이번 실행에 없었다.\n오분류 점검(test01): 3묶음은 사람 확인이 필요하다고 표시했다. 판정과 반박 근거를 함께 남겼고, 정정안을 반영할지는 사용자가 정한다.\n단위업무명 추천(감사실): 수정필요 2건은 검토 의견과 함께 제안표에 남겼다. 이름을 제안하지 않고 보류한 문서 묶음이 21개다.\n조직 변경 영향: 검토필요 1건(F0162), 그리고 시나리오에 답이 없어 사람이 정해야 하는 질문 4가지(이관 범위, 디지털트윈사업부 거취, 신공항건설2부 거취, 부 이름).\n조직 개편 추천: 경영진이 결정할 질문 6가지를 남겼고, 질문마다 하네스의 추천을 붙였다.\n출처: 각 하네스 output/ 의 요약.md, 영향도_보고서.md, 조직개편_추천보고서.md, 단위업무_제안표.csv',
    setup(root, d) {
      d.T = K.title(root, { kicker: '사람에게 넘긴 것', title: '검토와 승인은 사람이 한다', w: 1460 });
      d.svg = K.svg(root);
      d.rows = statRows(root, d, [
        { hk: 'assign', items: [[5, '건', '미배정', 'ghost']] },
        { hk: 'audit', items: [[3, '묶음', '사람 확인', 'warn']] },
        { hk: 'naming', items: [[2, '건', '수정필요', 'warn'], [21, '묶음', '보류', 'ghost']] },
        { hk: 'orgchange', items: [[1, '건', '검토필요', 'warn'], [4, '가지', '확인필요 질문', 'ghost']] },
        { hk: 'strategy', items: [[6, '가지', '경영진 결정', 'blue']] },
      ], { w: 1230, ix: [390, 800] });
      const HW = 180, HH = HW * K.AGR.human, HY = 630 - HH / 2;
      d.hu = K.actor(root, { kind: 'human', name: '사람', job: '검토하고 승인한다', x: 1570, y: HY, w: HW, jobW: 300 });
      d.paths = d.rows.map(r => {
        const pts = Math.abs(r.cy - 630) < 2 ? [[1352, 630], [1552, 630]] : [[1352, r.cy], [1450, r.cy], [1450, 630], [1552, 630]];
        return K.path(d.svg, pts, { color: C.warn, width: 3, arrow: true, radius: 22 });
      });
      d.docs = ['미배정 5건', '사람 확인 3묶음', '수정필요 2건', '검토필요 1건', '경영진 결정 6가지'].map(t => K.doc(root, t, { x: 0, y: 0 }, 'warn'));
      d.hy = HY;
    },
    render(lt, d) {
      d.T.render(lt);
      statIn(lt, d.rows);
      d.hu.render(lt, 1.3);
      d.paths.forEach((p, i) => K.draw(p, lt, 1.6 + i * 0.1, 0.5));
      // 하네스 한 줄씩: 넘긴 것이 사람에게 간다
      const L = K.loop(lt, 2.9, d.rows.map(() => 1.8));
      d.rows.forEach((r, i) => {
        const on = L.i === i;
        K.mark(r.row, on, 'rgba(232,147,12,.12)');
        d.paths[i].setAttribute('stroke-width', on ? 6 : 3);
        const c = d.docs[i];
        if (!on) { c.style.opacity = '0'; return; }
        K.travel(c, L.u, 0.05, 0.5, [1200, r.cy - 26], [1575, d.hy - 62], { arc: 30 });
        c.style.opacity = Math.min(clamp(L.u / 0.08), clamp((1 - L.u) / 0.1)).toFixed(3);
      });
      if (lt > 2.8) d.hu.act(lt, L.i >= 0 && L.u > 0.55);
    },
  });
})();

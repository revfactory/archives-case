/* 제목 배정·오분류 점검 — 과제 「생산현황 분류 정정」. 필름의 D·E 구간에 이어진다. 출처는 장마다 노트에 적은 파일.
   배정: kac-record-assign/output/t1, _workspace/t1 · 점검: kac-classification-audit/output/test01, _workspace/test01 */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css } = RH;
  const C = K.C;
  const CH_A = '제목 배정 · 생산현황 분류 정정', CH_B = '오분류 점검 · 생산현황 분류 정정';

  // ── 지역 함수 ─────────────────────────────────────────
  const at = (p, cls, box, html, st) => { const e = K.at(p, cls, box, html); if (st) e.style.cssText += ';' + st; return e; };
  const el = (tag, p, cls, html, st) => { const e = h(tag, cls, p, html); if (st) e.style.cssText += ';' + st; return e; };
  const cnv = (root, x, y, w, hh) => {
    const cv = h('canvas', '', root);
    css(cv, { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' });
    cv.width = w * 2; cv.height = hh * 2;
    const ctx = cv.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    return ctx;
  };
  // 글 속 ID 표기(F0002 등)
  const idt = (t, col) => `<span class="mono" style="font-size:20px;font-weight:500;color:${col || 'var(--ink)'};background:var(--paper-3);border:1.5px solid var(--rule-2);border-radius:5px;padding:0 6px">${t}</span>`;
  const KIND = { make: [C.blue, 'var(--blue-2)'], check: [C.bad, '#B3261E'], judge: [C.warn, '#965A00'] };

  // 20. 챕터 영상
  DECK.slide({
    id: 'ch-assign', title: '제목 배정 챕터 영상', bg: 'paper', harness: 'assign', video: 'media/ch_assign.mp4', poster: 'media/ch_assign.jpg',
    notes: '10초 챕터 영상. 필름 D 구간의 작업장(컨베이어)이 움직이고, 기록연구사의 질문 「제목만 보고 기록물철을 고를 수 있나요?」에 이 발표의 하네스 kac-record-assign이 답한다.\n과제 「생산현황 분류 정정」은 일이 둘이라 하네스 두 개(제목 배정, 오분류 점검)로 나눴다. 이 챕터는 배정을 먼저 본다. 끝나면 → 키로 넘긴다.',
  });

  // 21. 두 하네스가 나눠 맡는다
  const SPLIT = [
    { x: 120, name: 'kac-record-assign', role: '분류가 없는 문서를 기록물철에 배정한다', mode: 'fill',
      agents: [['record-assigner', '배정', 'sonnet', 'make'], ['assignment-verifier', '검증', 'opus', 'check'], ['assignment-arbiter', '중재', 'opus', 'judge']],
      outs: [['확정', 'ok'], ['확정(중재)', 'ok'], ['검토필요', 'warn']],
      files: '배정결과.csv · 검토필요.csv · 요약.md',
      note: '입력: 문서목록의 제목·부서·문서구분. 단위업무·기록물철 칸이 없다.',
      ex: [['감사실 · 생산 · t1', '모·자회사 자체감사기구 책임자 회의 개최 알림', 'F0204 공공감사기구 교류·협력 관리'],
        ['제주운영단 · 생산 · t1', '개찰 결과 보고(제주공항 수하물처리시설 개선공사)', 'F1638 공사계약'],
        ['제주운영단 · 생산 · t1', '사외교육 출장 결과보고', 'C042 국내출장관리 (부서공통)']] },
    { x: 1020, name: 'kac-classification-audit', role: '이미 붙은 분류를 점검해 정정안을 낸다', mode: 'fix',
      agents: [['blind-classifier', '독립 판단', 'sonnet', 'make'], ['label-judge', '판정', 'opus', 'judge'], ['correction-challenger', '반박 검증', 'opus', 'check']],
      outs: [['정정 권고', 'bad'], ['유지', 'ok'], ['사람 확인', 'warn']],
      files: '정정안.csv · 사람확인.csv · 점검결과.csv',
      note: '입력: 기존 분류 열이 있는 파일. 공용 문서목록에는 이 열이 없어, 이번에는 오류를 넣은 시험 자료 600건으로 돌렸다.',
      ex: [['경영관리실 · 시험 자료', '2026년 3월(누계) 본지사 월차결산 보고', 'F1004 월차·연차 결산', '국고보조금관리'],
        ['인사혁신실 · 시험 자료', '2026년 단체상해보험 가입 계약 의뢰', 'F0040 단체상해보험 운영', '항공보안인력관리'],
        ['안전보안실 · 시험 자료', '2026년 건강검진 계획(안)', 'F1410 임직원 건강검진', '항공 산업 온실가스 감축 관리']] },
  ];
  DECK.slide({
    id: 'c2-split', title: '두 하네스가 나눠 맡는다', chapter: CH_A, harness: 'assign',
    notes: '과제 「생산현황 분류 정정」은 일이 둘이라 하네스도 둘로 나눴다. 왼쪽 kac-record-assign은 분류 칸이 없는 문서 제목을 기록물철·단위업무·부서공통 가운데 하나에 배정하고, 근거가 부족하면 미배정이나 검토필요로 남긴다. 오른쪽 kac-classification-audit은 사람이 이미 고른 분류가 제목과 맞는지 점검해 정정안을 낸다.\n공용 문서목록(production.sqlite)에는 사람이 고른 분류 열이 없다. 그래서 점검 하네스는 make_testdata.py로 만든 시험 자료(600건, 오류 128건 주입)로 동작을 확인했고, 실제 점검에는 기존 분류 열이 있는 파일이 필요하다.\n카드의 예시는 실제 결과 행이다. 왼쪽: kac-record-assign/output/t1/배정결과.csv, 오른쪽: kac-classification-audit/output/test01/정정안.csv',
    setup(root, d) {
      d.T = K.title(root, { kicker: '과제 · 생산현황 분류 정정', title: '두 하네스가 나눠 맡는다', sub: '분류가 없는 문서는 기록물철에 배정하고, 이미 붙은 분류는 맞는지 점검해 정정안을 낸다.' });
      d.mid = at(root, '', { x: 959, y: 340, w: 2, h: 626 }, '', 'background:var(--rule)');
      d.cols = SPLIT.map(c => {
        const o = { c, k: -2 };
        o.svg = K.svg(root);
        o.line = K.path(o.svg, [[c.x + 7, 690], [c.x + 7, 778]], { color: 'rgba(27,42,74,.3)', width: 2 });
        K.dots(o.svg, o.line, 2, { r: 4.5, color: C.blue });
        o.name = at(root, 'mono', { x: c.x, y: 336 }, c.name, 'font-size:26px;font-weight:500;color:var(--blue-2);border:2px solid var(--blue);border-radius:10px;padding:5px 16px;background:var(--paper-3)');
        o.role = at(root, '', { x: c.x, y: 400, w: 780 }, c.role, 'font-size:30px;font-weight:800;letter-spacing:-0.02em');
        o.card = K.at(root, 'card', { x: c.x, y: 460, w: 780, h: 186 });
        o.inner = at(o.card, '', { x: 0, y: 0, w: 776, h: 182 });
        o.meta = at(o.inner, '', { x: 26, y: 22 }, '', 'font-size:20px;font-weight:600;color:var(--mute)');
        o.tt = at(o.inner, '', { x: 26, y: 56, w: 728 }, '', 'font-size:28px;font-weight:800;letter-spacing:-0.02em;white-space:nowrap');
        o.row = at(o.inner, '', { x: 26, y: 112 }, '', 'display:flex;align-items:center;gap:14px');
        if (c.mode === 'fill') {
          o.blank = el('div', o.row, '', '분류 없음', 'height:44px;padding:0 18px;border:2.5px dashed var(--warn);border-radius:8px;color:#965A00;font-size:22px;font-weight:700;display:flex;align-items:center;box-sizing:border-box;background:var(--warn-soft)');
        } else {
          o.old = el('span', o.row, 'chip id', '', 'position:relative;height:44px;font-family:var(--sans);font-weight:600;color:var(--ink-2)');
          o.oldTx = el('span', o.old, '', '');
          o.strike = el('span', o.old, '', '', 'position:absolute;left:-6px;right:-6px;top:20px;height:4px;background:var(--bad);border-radius:2px');
        }
        o.arrow = el('span', o.row, '', '→', 'font-size:28px;font-weight:700;color:var(--ink-2)');
        o.res = el('span', o.row, 'chip ' + (c.mode === 'fill' ? 'ok' : 'bad'), '', 'height:44px');
        o.rows = c.agents.map((a, i) => {
          const r = at(root, '', { x: c.x, y: 672 + i * 44, w: 780, h: 36 });
          at(r, '', { x: 0, y: 11, w: 14, h: 14 }, '', `border-radius:50%;background:${KIND[a[3]][0]}`);
          at(r, 'mono', { x: 32, y: 2 }, a[0], `font-size:21px;font-weight:500;color:${KIND[a[3]][1]}`);
          at(r, '', { x: 330, y: 1 }, a[1], 'font-size:22px;font-weight:700');
          at(r, 'mono', { x: 470, y: 4 }, a[2], 'font-size:19px;color:var(--mute)');
          return r;
        });
        o.outLab = at(root, '', { x: c.x, y: 820 }, '결과', 'font-size:21px;font-weight:700;color:var(--mute)');
        o.outRow = at(root, '', { x: c.x + 64, y: 812 }, '', 'display:flex;gap:10px');
        o.outs = c.outs.map(([t, k]) => el('span', o.outRow, 'chip ' + k, t));
        o.files = at(root, 'mono', { x: c.x, y: 870, w: 780 }, c.files, 'font-size:20px;color:var(--ink-2)');
        o.note = at(root, '', { x: c.x, y: 908, w: 780 }, c.note, 'font-size:20px;line-height:1.45;color:var(--mute)');
        return o;
      });
    },
    render(lt, d) {
      d.T.render(lt);
      K.wipe(d.mid, lt, 0.5, 0.8, 'down');
      const PER = 4.5, T0 = 0.9;
      const k = K.cycle(lt, T0, PER, 3);
      const loc = k >= 0 ? (lt - T0) % PER : -1;
      d.cols.forEach((o, ci) => {
        const t0 = 0.35 + ci * 0.15;
        K.rise(o.name, lt, t0, { x: -20, y: 0 });
        K.rise(o.role, lt, t0 + 0.08, { y: 14 });
        K.rise(o.card, lt, t0 + 0.16, { y: 20 });
        o.rows.forEach((r, i) => K.rise(r, lt, t0 + 0.5 + i * 0.1, { x: -16, y: 0 }));
        K.draw(o.line, lt, t0 + 0.5, 0.5, { speed: 70 });
        K.rise(o.outLab, lt, t0 + 0.85, { y: 8 });
        o.outs.forEach((c, i) => K.pop(c, lt, t0 + 0.9 + i * 0.08));
        K.rise(o.files, lt, t0 + 1.1, { y: 10 });
        K.rise(o.note, lt, t0 + 1.2, { y: 10 });
        // 예시 카드: 4.5초마다 실제 결과 행이 바뀐다
        if (k < 0) { o.inner.style.opacity = '0'; return; }
        const ex = o.c.ex[k];
        if (o.k !== k) {
          o.k = k;
          o.meta.textContent = ex[0]; o.tt.textContent = ex[1]; o.res.textContent = ex[2];
          if (o.oldTx) o.oldTx.textContent = ex[3];
        }
        const v = Math.min(prog(loc, 0, 0.35), 1 - prog(loc, PER - 0.35, 0.3, ease.exit));
        o.inner.style.opacity = v.toFixed(3);
        o.inner.style.transform = `translateY(${((1 - prog(loc, 0, 0.4)) * 10).toFixed(1)}px)`;
        if (o.c.mode === 'fill') {
          o.blank.style.opacity = (1 - 0.6 * prog(loc, 1.25, 0.3)).toFixed(3);
          o.blank.style.borderColor = `rgba(232,147,12,${(0.45 + 0.55 * K.wave(loc, 0.8)).toFixed(3)})`;
          K.rise(o.arrow, loc, 1.0, { x: -12, y: 0, blur: 0 });
          K.pop(o.res, loc, 1.25);
        } else {
          K.wipe(o.strike, loc, 0.9, 0.35);
          o.old.style.opacity = (1 - 0.22 * prog(loc, 1.1, 0.3)).toFixed(3);
          K.rise(o.arrow, loc, 1.2, { x: -12, y: 0, blur: 0 });
          K.pop(o.res, loc, 1.45);
        }
      });
    },
  });

  // 22. 배정 흐름
  const B_SET = new Set([4, 9, 15, 21, 26, 31, 37]);   // 40개 가운데 중재로 가는 7개(t1 비율)
  DECK.slide({
    id: 'c2-assign-flow', title: '배정 흐름', chapter: CH_A, harness: 'assign',
    notes: '배정 → 검증 → 중재 세 단계다. record-assigner(sonnet)가 묶음 파일의 후보 안에서 배정하고, assignment-verifier(opus)는 배정 결과를 보기 전에 제목과 후보만으로 자기 답을 정한 뒤 비교한다. 동의하지 않은 항목만 assignment-arbiter(opus)가 받아 네 결정 가운데 하나를 고른다. 보류는 검토필요.csv로 가서 사람이 본문을 확인한다.\nt1에서는 제목 40개 중 33개가 동의, 7개가 불일치(판단불가 0)였고 중재 7건은 모두 대안 채택이었다. 흐르는 사각형 40개 중 7개가 중재로 가는 것도 이 비율이다.\n오른쪽 문장은 record-assigner.md 작업 원칙 3의 원문이다. 같은 이유로 확신도가 낮으면 철 대신 단위업무로 올려 배정한다(record-assignment-rules).\n출처: kac-record-assign/.claude/agents/*.md, .claude/skills/record-assign/SKILL.md, _workspace/t1/verify·arbitrate',
    setup(root, d) {
      d.T = K.title(root, { kicker: 'kac-record-assign · 배정 흐름', title: '배정하고, 따로 검증하고, 갈린 것만 중재한다',
        sub: '세 에이전트가 같은 판단 기준(record-assignment-rules)을 읽고, 결과는 파일로 넘긴다.' });
      d.svg = K.svg(root);
      const P = (pts, o) => K.path(d.svg, pts, Object.assign({ color: C.blue, width: 3 }, o));
      d.p1 = P([[370, 408], [430, 408]]); K.dots(d.svg, d.p1, 1, { r: 5 });
      d.p2 = P([[750, 408], [830, 408]]); K.dots(d.svg, d.p2, 1, { r: 5 });
      d.p3 = P([[1190, 408], [1560, 408]], { color: C.ok, arrow: true });
      d.p4 = P([[1010, 474], [1010, 606], [1200, 606]], { color: C.warn });
      d.p5 = P([[1550, 606], [1680, 606], [1680, 450]], { color: C.ok, arrow: true });
      // 사각형이 지나는 길(보이지 않음)
      d.rA = K.path(d.svg, [[1190, 408], [1560, 408]], { width: 0 });
      d.rB = K.path(d.svg, [[1010, 474], [1010, 606], [1680, 606], [1680, 450]], { width: 0, radius: 18 });
      d.tok = [];
      for (let i = 0; i < 14; i++) d.tok.push(s('rect', { width: 14, height: 14, rx: 3, opacity: 0 }, d.svg));
      d.nodes = [
        K.script(root, { name: 'make_batches.py', cap: '제목을 묶음 파일로', x: 120, y: 368, w: 250 }),
        K.agent(root, { name: 'record-assigner', role: '후보 안에서 배정', model: 'sonnet', kind: 'make', x: 430, y: 340, w: 320, note: '확신도와 근거를 함께 쓴다' }),
        K.agent(root, { name: 'assignment-verifier', role: '따로 다시 판단', model: 'opus', kind: 'check', x: 830, y: 340, w: 360, note: '배정을 보기 전에 자기 답부터' }),
        K.agent(root, { name: 'assignment-arbiter', role: '갈린 항목만 판단', model: 'opus', kind: 'judge', x: 1200, y: 540, w: 350, note: '두 의견과 후보 설명을 대조' }),
        K.script(root, { name: 'merge_results.py', cap: '상태를 정해 결과표로', x: 1560, y: 368, w: 240 }),
      ];
      d.l3 = at(root, '', { x: 1224, y: 364 }, '동의 <b class="num">33</b> → 확정', 'font-size:22px;font-weight:600;color:#0B7A52');
      d.l4 = at(root, '', { x: 1026, y: 500 }, '불일치 <b class="num">7</b>', 'font-size:22px;font-weight:600;color:#965A00');
      d.l5 = at(root, '', { x: 1562, y: 620 }, '확정(중재) <b class="num">7</b>', 'font-size:22px;font-weight:600;color:#0B7A52');
      d.dh = at(root, '', { x: 120, y: 694 }, '중재 결정 4가지 <span style="font-size:20px;font-weight:500;color:var(--mute);margin-left:10px">assignment-arbiter가 하나를 고른다 · 숫자는 t1 결과</span>', 'font-size:26px;font-weight:800;letter-spacing:-0.02em');
      const DEC = [['배정안 채택', '처음 배정안이 맞다', 0, 'ok'], ['대안 채택', '검증자가 낸 대안이 맞다', 7, 'ok'],
        ['제3안', '둘 다 아니고 더 맞는 후보가 있다', 0, 'ok'], ['보류', '제목만으로 가릴 수 없다. 검토필요.csv로 넘긴다', 0, 'warn']];
      d.dec = DEC.map((r, i) => {
        const c = K.at(root, 'card', { x: 120 + i * 245, y: 744, w: 225, h: 226 });
        c.style.overflow = 'hidden';
        at(c, '', { x: 0, y: 0, w: 225, h: 6 }, '', `background:${r[3] === 'warn' ? C.warn : C.ok}`);
        at(c, '', { x: 20, y: 24, w: 190 }, r[0], 'font-size:28px;font-weight:800;letter-spacing:-0.02em');
        at(c, '', { x: 20, y: 70, w: 190 }, r[1], 'font-size:21px;line-height:1.4;color:var(--ink-2)');
        at(c, 'num', { x: 20, y: 172 }, `${r[2]}건`, `font-size:30px;font-weight:800;color:${r[2] ? '#0B7A52' : 'rgba(27,42,74,.3)'}`);
        return c;
      });
      d.rbar = at(root, '', { x: 1150, y: 700, w: 4, h: 262 }, '', 'background:var(--blue);border-radius:2px');
      d.rk = at(root, '', { x: 1178, y: 700 }, '배정 규칙', 'font-size:22px;font-weight:700;color:var(--blue)');
      d.rh = at(root, '', { x: 1178, y: 736, w: 640 }, '틀린 철보다 미배정이 낫다', 'font-size:50px;font-weight:850;letter-spacing:-0.035em;line-height:1.1');
      d.rq = K.at(root, 'quote', { x: 1178, y: 818, w: 622 }, '“틀린 기록물철 배정은 보존기간이 잘못 적용되는 결과로 이어지므로 미배정보다 손해가 크다.”<span class="src">record-assigner.md · 작업 원칙 3</span>');
      d.rq.style.fontSize = '26px';
    },
    render(lt, d) {
      d.T.render(lt);
      d.nodes.forEach((n, i) => K.rise(n, lt, [0.35, 0.5, 0.65, 0.95, 0.8][i], { y: 18 }));
      K.draw(d.p1, lt, 0.55, 0.3, { speed: 90 });
      K.draw(d.p2, lt, 0.7, 0.3, { speed: 90 });
      K.draw(d.p3, lt, 0.85, 0.5);
      K.draw(d.p4, lt, 0.9, 0.4);
      K.draw(d.p5, lt, 1.15, 0.4);
      K.rise(d.l3, lt, 1.1, { y: 8 }); K.rise(d.l4, lt, 1.2, { y: 8 }); K.rise(d.l5, lt, 1.4, { y: 8 });
      K.rise(d.dh, lt, 1.3, { y: 10 });
      d.dec.forEach((c, i) => K.rise(c, lt, 1.4 + i * 0.1, { y: 22 }));
      K.wipe(d.rbar, lt, 1.6, 0.5, 'down');
      K.rise(d.rk, lt, 1.6, { x: -12, y: 0 });
      K.rise(d.rh, lt, 1.7, { y: 16 });
      K.rise(d.rq, lt, 1.9, { y: 12 });
      // 제목 하나 = 사각형 하나. 검증을 나온 뒤 동의는 곧장, 불일치는 중재를 거쳐 병합으로 간다.
      const T0 = 2.2, GAP = 0.32, SP = 240;
      const n = Math.floor((lt - T0) / GAP);
      let busy = false;
      d.tok.forEach((r, m) => {
        const j = n - m;
        if (lt < T0 || j < 0) { r.setAttribute('opacity', 0); return; }
        const isB = B_SET.has(j % 40);
        const path = isB ? d.rB : d.rA;
        const dist = (lt - T0 - j * GAP) * SP;
        if (dist > path._len) { r.setAttribute('opacity', 0); return; }
        const pt = path.getPointAtLength(dist);
        if (isB && pt.y > 590 && pt.x > 1200 && pt.x < 1550) busy = true;
        r.setAttribute('x', (pt.x - 7).toFixed(1)); r.setAttribute('y', (pt.y - 7).toFixed(1));
        r.setAttribute('fill', isB && pt.x < 1375 ? C.warn : C.ok);
        const fade = Math.min(1, dist / 30, (path._len - dist) / 30);
        r.setAttribute('opacity', fade.toFixed(3));
      });
      d.dec[1].style.boxShadow = busy ? '0 0 0 4px rgba(25,169,116,.32)' : '';
    },
  });

  // 23. 배정 결과(t1)
  const UNIT_SIZES = [4, 2, 1, 1, 2, 9, 4, 1, 2, 2, 2, 2, 1, 1, 3, 3, 3, 6, 1, 1, 3, 1, 2]; // 감사실 단위업무 23개의 기록물철 수(합 57)
  DECK.slide({
    id: 'c2-assign-t1', title: '배정 결과(t1)', chapter: CH_A, harness: 'assign',
    notes: 't1은 감사실·제주운영단의 2026년 문서에서 고정 표본(order sample) 제목 40개를 돌린 시험이다. 범위 안 문서 21,357건, 고유 제목 14,299개 가운데 40개(문서 56건)를 판단했고 14,259개가 남았다.\n오른쪽 예시는 감사실이 받은 문서다. 배정자는 감사실 기록물철 57개, 부서공통 46개, 다른 부서 추가후보 5개 가운데 F0242 자회사 특정감사 실시를 확신도 보통으로 고르고 경쟁 후보 F0220을 적었다. 검증자는 \'후속조치\'라는 절차 표현만 맞는 F0220을 버리는 것이 판단 순서 3에 맞다고 보고 동의했다.\n문서목록에는 정답이 없으므로 \'확정\'은 검증이 동의했거나 중재가 결정했다는 뜻이다. 미배정 5건은 모두 \'제목 정보 부족\'이다.\n출처: kac-record-assign/output/t1/요약.md, 배정결과.csv, _workspace/t1/batches·results·verify/batch_0001.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '배정 시험 t1 · 감사실·제주운영단 2026년 문서', title: '제목 40개 중 33개는 검증이 바로 동의했다' });
      d.svg = K.svg(root);
      // 왼쪽: 범위 → 이번 판단
      const F = [[21357, '범위 안 문서', '감사실·제주운영단, 2026년'], [14299, '고유 제목', '숫자만 다른 제목은 하나로 센다'],
        [40, '이번에 판단한 제목', '문서 56건'], [14259, '아직 판단하지 않은 제목', '다음 실행에서 이어서 배정한다']];
      d.fun = F.map((r, i) => {
        const y = 300 + i * 82;
        const g = at(root, '', { x: 120, y, w: 600, h: 78 });
        const n = at(g, 'num', { x: 0, y: 0, w: 160 }, '0', `font-size:42px;font-weight:800;letter-spacing:-0.03em;text-align:right;color:${i === 2 ? 'var(--blue)' : 'var(--ink)'}`);
        at(g, '', { x: 184, y: 0 }, r[1], `font-size:23px;font-weight:700;color:${i === 2 ? 'var(--blue)' : 'var(--ink)'}`);
        at(g, '', { x: 184, y: 31 }, r[2], 'font-size:19px;color:var(--mute)');
        const b = at(g, '', { x: 0, y: 64, h: 6 }, '', `border-radius:3px;background:${i === 2 ? C.blue : i === 3 ? 'rgba(27,42,74,.2)' : 'rgba(27,42,74,.7)'}`);
        return { g, n, b, v: r[0] };
      });
      d.sh = at(root, '', { x: 120, y: 642 }, '제목 40개의 상태', 'font-size:24px;font-weight:800');
      d.sq = [];
      for (let i = 0; i < 40; i++) {
        d.sq.push(at(root, '', { x: 120 + (i % 20) * 29, y: 684 + Math.floor(i / 20) * 29, w: 23, h: 23 }, '',
          i < 33 ? `background:${C.ok};border-radius:4px` : `border:3px solid ${C.ok};border-radius:4px;box-sizing:border-box;background:var(--ok-soft)`));
      }
      const sw = (st) => `<span style="display:inline-block;width:16px;height:16px;border-radius:3px;vertical-align:-2px;margin-right:6px;box-sizing:border-box;${st}"></span>`;
      d.sl = at(root, '', { x: 120, y: 748, w: 640 }, `${sw('background:' + C.ok)}확정 <b class="num">33</b> (82.5%) &nbsp;&nbsp;${sw('border:3px solid ' + C.ok + ';background:var(--ok-soft)')}확정(중재) <b class="num">7</b> (17.5%) &nbsp;&nbsp;검토필요 <b class="num">0</b>`, 'font-size:21px;color:var(--ink-2)');
      d.dh = at(root, '', { x: 120, y: 804 }, '문서 56건의 배정 수준', 'font-size:24px;font-weight:800');
      const LV = [['철', 41, 'background:' + C.ink], ['단위업무', 7, 'background:rgba(27,42,74,.48)'], ['부서공통', 3, 'background:rgba(27,42,74,.2)'], ['미배정', 5, 'border:2.5px solid ' + C.ink]];
      d.dq = [];
      let q = 0;
      LV.forEach(lv => { for (let i = 0; i < lv[1]; i++, q++) d.dq.push(at(root, '', { x: 120 + (q % 28) * 21, y: 846 + Math.floor(q / 28) * 21, w: 16, h: 16 }, '', `border-radius:3px;box-sizing:border-box;${lv[2]}`)); });
      d.dl = at(root, '', { x: 120, y: 896, w: 640 }, LV.map(lv => `${sw(lv[2])}${lv[0]} <b class="num">${lv[1]}</b>`).join(' &nbsp;&nbsp;'), 'font-size:21px;color:var(--ink-2)');
      d.dn = at(root, '', { x: 120, y: 932, w: 640 }, '미배정 5건은 모두 \'제목 정보 부족\'. 맞는 철이 없으면 철을 고르지 않는다.', 'font-size:19px;color:var(--mute)');
      // 오른쪽: 실제 제목 하나가 지나간 단계
      d.card = K.at(root, 'card', { x: 800, y: 300, w: 1000, h: 134 });
      d.cmeta = at(d.card, '', { x: 26, y: 20 }, '', 'display:flex;gap:8px');
      ['감사실', '접수', 'batch_0001 · k001'].forEach((t, i) => el('span', d.cmeta, 'chip sm ' + (i === 2 ? 'ghost' : 'id'), t, i < 2 ? 'font-family:var(--sans);font-weight:600' : 'font-family:var(--mono)'));
      at(d.card, '', { x: 26, y: 70, w: 948 }, '자회사 특정감사 결과통보에 따른 후속조치 관련 자료 요청', 'font-size:32px;font-weight:800;letter-spacing:-0.025em');
      d.stamp = K.stampEl(root, '확정', 'ok', { x: 1630, y: 302 });
      d.track = K.path(d.svg, [[836, 470], [836, 916]], { color: 'rgba(27,42,74,.22)', width: 2 });
      K.dots(d.svg, d.track, 2, { r: 5, color: C.blue });
      d.mkY = [476, 586, 722, 852];
      d.mk = d.mkY.map(y => s('circle', { cx: 836, cy: y, r: 9, fill: C.paper, stroke: C.blue, 'stroke-width': 3 }, d.svg));
      const head = (y, lab, name, model, col) => {
        const g = at(root, '', { x: 864, y }, '', 'display:flex;align-items:baseline;gap:14px');
        el('span', g, '', lab, 'font-size:23px;font-weight:800');
        if (name) el('span', g, 'mono', name, `font-size:20px;font-weight:500;color:${col}`);
        if (model) el('span', g, 'mono', model, 'font-size:19px;color:var(--mute)');
        return g;
      };
      // 단계 1: 후보
      d.s1 = [head(462, '후보'), at(root, '', { x: 940, y: 464 }, '감사실 기록물철 <b>57</b> · 부서공통 <b>46</b> · 다른 부서 추가후보 <b>5</b>', 'font-size:21px;color:var(--ink-2)')];
      d.cand = [];
      let off = 0;
      for (let i = 0; i < 108; i++) {
        const x = 864 + (i % 54) * 15, y = 506 + Math.floor(i / 54) * 15;
        const st = i < 57 ? 'background:rgba(27,42,74,.42)' : i < 103 ? 'background:rgba(27,42,74,.16)' : 'border:1.5px dashed rgba(27,42,74,.5)';
        d.cand.push(at(root, '', { x, y, w: 11, h: 11 }, '', `border-radius:2px;box-sizing:border-box;${st}`));
      }
      off = 0; d.unitStart = UNIT_SIZES.map(n => { const o = off; off += n; return o; });
      d.cl = [[25, 'F0242', 'var(--blue-2)'], [32, 'F0220', '#965A00']].map(([i, t, c]) => at(root, 'mono', { x: 864 + i * 15 - 24, y: 534, w: 60 }, t, `font-size:19px;font-weight:700;text-align:center;color:${c}`));
      // 단계 2: 배정
      d.s2 = [head(572, '배정', 'record-assigner', 'sonnet', 'var(--blue-2)'),
        at(root, '', { x: 864, y: 610 }, '', 'display:flex;gap:10px;align-items:center'),
        at(root, '', { x: 864, y: 662 }, '<b style="color:#965A00">경쟁 후보</b>로 F0220 감사처분 조치이행관리를 적었다', 'font-size:21px;color:var(--ink-2)')];
      el('span', d.s2[1], 'chip id', '<span class="mono">F0242</span> 자회사 특정감사 실시', 'font-family:var(--sans);font-weight:600;border-color:var(--blue);border-width:2px');
      el('span', d.s2[1], 'chip ghost', '확신도 보통');
      // 단계 3: 검증
      d.s3 = [head(706, '검증', 'assignment-verifier', 'opus', '#B3261E'),
        K.chip(root, '동의', 'ok', { x: 864, y: 746 }),
        at(root, '', { x: 950, y: 744, w: 850 }, '주제어 \'자회사 특정감사\'가 F0242를 가리킨다. F0220은 \'후속조치\'라는 절차 표현만 맞아 버린다.', 'font-size:21px;line-height:1.45;color:var(--ink-2)')];
      // 단계 4: 결과
      d.s4 = [head(836, '결과'),
        at(root, '', { x: 864, y: 872 }, '<span class="mono" style="font-weight:500">F0242</span> 자회사 특정감사 실시', 'font-size:28px;font-weight:800;letter-spacing:-0.02em'),
        at(root, '', { x: 864, y: 914 }, '감사실 감사기획부 · 단위업무 특정감사 관리 · 보존기간 30년', 'font-size:21px;color:var(--ink-2)')];
    },
    render(lt, d) {
      d.T.render(lt);
      d.fun.forEach((f, i) => {
        K.rise(f.g, lt, 0.3 + i * 0.12, { y: 14 });
        K.count(f.n, lt, 0.3 + i * 0.12, 1.1, f.v);
        K.bar(f.b, lt, 0.4 + i * 0.12, Math.max(f.v / 21357, 0.008), 600, 0.9);
      });
      K.rise(d.sh, lt, 0.9, { y: 10 });
      d.sq.forEach((e, i) => K.pop(e, lt, 1.0 + i * 0.015));
      K.rise(d.sl, lt, 1.6, { y: 8 });
      K.rise(d.dh, lt, 1.3, { y: 10 });
      d.dq.forEach((e, i) => K.pop(e, lt, 1.4 + i * 0.01));
      K.rise(d.dl, lt, 2.0, { y: 8 });
      K.rise(d.dn, lt, 2.1, { y: 8 });
      // 오른쪽 장면
      K.rise(d.card, lt, 0.4, { x: 40, y: 0 });
      K.draw(d.track, lt, 0.8, 1.6, { speed: 120, ease: ease.linear });
      const st = [0.8, 1.5, 2.1, 2.6];
      d.mk.forEach((m, i) => { const p = prog(lt, st[i], 0.3, ease.pop); m.setAttribute('r', (9 * p).toFixed(2)); });
      d.s1.forEach((e, i) => K.rise(e, lt, 0.8 + i * 0.06, { x: -14, y: 0 }));
      const nar = prog(lt, 1.5, 0.4);   // 후보가 둘로 좁혀진다
      d.cand.forEach((e, i) => {
        const p = K.pop(e, lt, 0.85 + i * 0.004, { from: 0.4 });
        const keep = i === 25 || i === 32;
        e.style.opacity = (p * (keep ? 1 : 1 - 0.65 * nar)).toFixed(3);
        if (i === 25) e.style.background = lt > 2.4 ? C.ok : nar > 0.5 ? C.blue : '';
        if (i === 32) e.style.boxShadow = nar > 0.5 ? `0 0 0 3px ${C.warn}` : '';
      });
      d.cl.forEach((e, i) => K.rise(e, lt, 1.6 + i * 0.1, { y: 6 }));
      d.s2.forEach((e, i) => K.rise(e, lt, 1.5 + i * 0.08, { x: -14, y: 0 }));
      d.s3.forEach((e, i) => K.rise(e, lt, 2.1 + i * 0.08, { x: -14, y: 0 }));
      d.s4.forEach((e, i) => K.rise(e, lt, 2.6 + i * 0.08, { x: -14, y: 0 }));
      K.stamp(d.stamp, lt, 2.95, { rot: -7 });
      // 머무는 동안: 단계 표시가 위에서 아래로 돈다
      const k = K.cycle(lt, 3.6, 1.4, 4);
      d.mk.forEach((m, i) => { m.setAttribute('fill', k === i ? C.blue : C.paper); });
    },
  });

  // 24. 점검 흐름
  // 오분류 점검 챕터 영상
  DECK.slide({
    id: 'ch-audit', title: '오분류 점검 챕터 영상', bg: 'paper', harness: 'audit', video: 'media/ch_audit.mp4', poster: 'media/ch_audit.jpg',
    notes: '10초 챕터 영상. 필름 E 구간의 작업장(서랍 선반과 렌즈 두 개)이 움직이고, 질문 「이미 분류한 문서는 맞게 분류됐을까요?」에 kac-classification-audit이 답한다.\n같은 과제 「생산현황 분류 정정」의 둘째 하네스다. 사람이 이미 고른 분류가 맞는지 다시 판정해 정정안을 낸다. 끝나면 → 키로 넘긴다.',
  });

  DECK.slide({
    id: 'c2-audit-flow', title: '점검 흐름', chapter: CH_B, harness: 'audit',
    notes: '점검 하네스는 전수를 에이전트에 보내지 않는다. screen.py가 의심 신호로 묶음을 추리고, make_batches.py가 묶음을 제목·후보만 담은 batches/와 기존 분류·신호를 담은 labels/로 나눈다.\nblind-classifier(sonnet)는 labels/를 열지 않고 제목만으로 분류한다. 기존 분류를 먼저 보면 그 분류에 맞춰 판단하게 되기 때문이다. compare.py가 둘을 맞춰 보고, 다른 것만 label-judge(opus)가 판정한다. 오류 판정은 correction-challenger(opus)가 기존 분류 편에서 반박하고, 반박에 실패한 것만 정정 권고가 된다.\ntest01: 점검 100 묶음 중 일치 29(유지), 다름 71 → 판정 오류 71 → 반박 실패 68(정정 권고), 반박 성공 1과 판단불가 2(사람 확인).\n출처: kac-classification-audit/.claude/skills/classification-audit/SKILL.md, _workspace/test01/compare·judge·challenge',
    setup(root, d) {
      d.T = K.title(root, { kicker: 'kac-classification-audit · 점검 흐름', title: '기존 분류를 가리고 다시 분류한 뒤, 다르면 따진다',
        sub: '기존 분류를 모르는 에이전트가 먼저 판단하고, 결과가 다를 때만 판정과 반박을 거친다.' });
      d.svg = K.svg(root);
      const P = (pts, o) => K.path(d.svg, pts, Object.assign({ color: C.blue, width: 3 }, o));
      d.paths = [
        [P([[350, 622], [400, 622]]), 0.45, 1],
        [P('M 650 608 C 725 608, 725 418, 800 418'), 0.7, 2],
        [P('M 650 636 C 725 636, 725 826, 800 826', { color: C.ink, width: 2.5, dash: '7 7' }), 0.75, 0],
        [P('M 1120 418 C 1150 418, 1140 608, 1170 608'), 1.2, 2],
        [P('M 1120 826 C 1150 826, 1140 636, 1170 636', { color: C.ink, width: 2.5 }), 1.55, 2],
        [P('M 1380 608 C 1410 608, 1410 378, 1440 378', { color: C.warn }), 1.6, 2],
        [P([[1620, 444], [1620, 498]], { color: C.bad }), 1.95, 1],
        [P([[1620, 632], [1620, 708]], { color: C.bad }), 2.25, 1],
        [P('M 1380 636 C 1410 636, 1410 748, 1440 748', { color: C.ok }), 2.0, 2],
      ];
      d.paths.forEach(([p, , n], i) => { if (n) K.dots(d.svg, p, n, { r: 5, color: i === 4 ? C.ink : i === 5 ? C.warn : i >= 6 && i <= 7 ? C.bad : i === 8 ? C.ok : C.blue }); });
      d.nA = K.script(root, { name: 'screen.py', cap: '의심 신호 S1~S4', x: 120, y: 582, w: 230 });
      d.nB = K.script(root, { name: 'make_batches.py', cap: '두 파일로 나눈다', x: 400, y: 582, w: 250 });
      d.blind = K.agent(root, { name: 'blind-classifier', role: '제목만 보고 분류', model: 'sonnet', kind: 'make', x: 800, y: 352, w: 320, note: '기존 분류를 열지 않는다' });
      // labels/ : 가린 파일
      d.lab = K.at(root, '', { x: 800, y: 758, w: 320, h: 138 });
      d.lab.style.cssText += ';border:2px dashed rgba(27,42,74,.4);border-radius:14px;box-sizing:border-box';
      const lk = K.svg(d.lab, { x: 20, y: 18, w: 26, h: 32 });
      d.lock = [s('path', { d: 'M 6 14 V 9 A 7 7 0 0 1 20 9 V 14', fill: 'none', stroke: C.ink, 'stroke-width': 3 }, lk),
        s('rect', { x: 2, y: 14, width: 22, height: 16, rx: 3, fill: C.ink }, lk)];
      at(d.lab, 'mono', { x: 58, y: 16 }, 'labels/', 'font-size:22px;font-weight:500');
      at(d.lab, '', { x: 58, y: 46 }, '기존 분류 · 의심 신호', 'font-size:20px;color:var(--mute)');
      d.tape = [at(d.lab, '', { x: 20, y: 86, w: 236, h: 14 }), at(d.lab, '', { x: 20, y: 110, w: 168, h: 14 })];
      d.tape.forEach(t => { t.style.cssText += ';border-radius:3px;background:repeating-linear-gradient(-45deg,#1B2A4A 0 8px,#3A4A6B 8px 16px)'; });
      d.laneT = at(root, '', { x: 400, y: 468, w: 290 }, '<span class="mono" style="font-size:21px;color:var(--blue-2)">batches/</span><br>제목·후보만', 'text-align:right;font-size:20px;line-height:1.45;color:var(--ink-2)');
      d.laneB = at(root, '', { x: 400, y: 708, w: 280 }, '<span class="mono" style="font-size:21px;color:var(--ink)">labels/</span><br>기존 분류·의심 신호', 'text-align:right;font-size:20px;line-height:1.45;color:var(--ink-2)');
      d.nC = K.script(root, { name: 'compare.py', cap: '일치 29 · 다름 71', x: 1170, y: 582, w: 210 });
      d.judge = K.agent(root, { name: 'label-judge', role: '기존 분류 오류 판정', model: 'opus', kind: 'judge', x: 1440, y: 312, w: 360, note: '다름 71 → 오류 71' });
      d.chal = K.agent(root, { name: 'correction-challenger', role: '기존 분류 편에서 반박', model: 'opus', kind: 'check', x: 1440, y: 498, w: 360, note: '반박 실패 68 · 성공 1 · 판단불가 2' });
      d.nM = K.script(root, { name: 'merge_results.py', cap: '최종 구분', x: 1440, y: 708, w: 360 });
      d.outRow = at(root, '', { x: 1440, y: 820, w: 360 }, '', 'display:flex;flex-wrap:wrap;gap:10px');
      d.outs = [['정정 권고 68', 'bad'], ['유지 29', 'ok'], ['사람 확인 3', 'warn']].map(([t, k]) => el('span', d.outRow, 'chip ' + k, t));
      d.hl = [d.blind, d.nC, d.judge, d.chal];
      d.why = K.at(root, '', { x: 120, y: 800, w: 580 });
      el('div', d.why, '', '기존 분류를 가리는 이유', 'font-size:21px;font-weight:700;color:var(--blue)');
      const q = el('div', d.why, 'quote', '“기존 분류를 보면 그 분류에 맞춰 판단하게 되어 비교의 의미가 없어진다.”<span class="src">blind-classifier.md · 작업 원칙</span>', 'position:relative;font-size:25px;margin-top:10px');
    },
    render(lt, d) {
      d.T.render(lt);
      d.paths.forEach(([p, t0]) => K.draw(p, lt, t0, 0.45, { speed: 110 }));
      K.rise(d.nA, lt, 0.35, { y: 16 });
      K.rise(d.nB, lt, 0.5, { y: 16 });
      K.rise(d.blind, lt, 0.85, { y: 16 });
      K.rise(d.lab, lt, 0.9, { y: 16 });
      d.tape.forEach((t, i) => K.wipe(t, lt, 1.15 + i * 0.1, 0.4));
      K.rise(d.laneT, lt, 1.0, { y: 8 });
      K.rise(d.laneB, lt, 1.05, { y: 8 });
      K.rise(d.nC, lt, 1.35, { y: 16 });
      K.rise(d.judge, lt, 1.75, { y: 16 });
      K.rise(d.chal, lt, 2.05, { y: 16 });
      K.rise(d.nM, lt, 2.35, { y: 16 });
      d.outs.forEach((c, i) => K.pop(c, lt, 2.5 + i * 0.08));
      K.rise(d.why, lt, 1.3, { y: 12 });
      // 머무는 동안: 자물쇠가 깜박이고, 판단 단계가 차례로 표시된다
      const w = K.wave(lt, 2.2);
      d.lock.forEach((e, i) => e.setAttribute('opacity', (0.55 + 0.45 * w).toFixed(3)));
      const k = K.cycle(lt, 3.2, 1.5, d.hl.length);
      d.hl.forEach((e, i) => { e.style.outline = k === i ? '5px solid rgba(47,123,255,.16)' : 'none'; e.style.outlineOffset = '3px'; });
    },
  });

  // 25. 의심 신호와 선별
  // 시험 자료 600건(부서 순서: 감사실·인사혁신실·경영관리실·안전보안실·김포운영단, 부서 안은 sample_input.csv 순서).
  // 값 = 주입(1) | S1(2) | S2(4) | S3(8) | 점검함(16) | 최종구분(1 정정 권고, 2 유지, 3 사람 확인) << 5
  // 만든 방법: answer.csv + records.sqlite groups 표 + output/test01/점검결과.csv 를 문서번호로 맞춤
  const AUD = '00000000000000003d043d000005000000000000000000500000000000003d0005050000000500000000000005003d00000500000400000000000d3d' +
    '00000000007d00000000050000050000000000003d0505000000000000000005010000000000000000000400000400000000000d0000000000000100' +
    '000000003700005004320000000000000000000005525205520000323f52003d0000000000000000005052057f00005200005200003f0000003d5200' +
    '0000520000003d00003f0000005252373700000000005200005252005200003200723d52000500523f000000370052523f00000004520000003d003d' +
    '3d003d000000003f0000000000000000000000023f520000005200070000520000000000055200003f053f5200000000050005050252000037000052' +
    '0505003d0507005200000000000000520005050000000000000000520005003d0000000005000005000000003d0500523f000000000000003d520000' +
    '0d003d000500003d000000003d0500000d00050004000000000000000000010030003d3d005000000000000000053d0500000000000000003d050000' +
    '003d3d5000053d0000000000053d50000000000000050000000005000000000000000000003000000000000000000000000000000000000550500000' +
    '0037520000000500000000003f00003d000000003f0000003d5200370000000500003f3d3d05003f000005003d520052003d05000500000052000000' +
    '00520000003d0000003d37003d00000000003d3f000000003d0000053d050000000052070505000000370000005200000002000d0000000000000000';
  const DOCS = [];
  for (let i = 0; i < 600; i++) DOCS.push(parseInt(AUD.substr(i * 2, 2), 16));
  const DEPTS = ['감사실', '인사혁신실', '경영관리실', '안전보안실', '김포운영단'];
  DECK.slide({
    id: 'c2-screen', title: '의심 신호와 선별', chapter: CH_B, harness: 'audit',
    notes: '점 하나가 시험 자료 문서 한 건이다(5개 부서 × 120건). screen.py는 부서·제목·기존 분류가 같은 문서를 한 묶음으로 보고(600건 → 553 묶음), 신호 네 가지로 의심 묶음을 고른다. 의심 묶음은 158개(문서 179건, 고유 제목 125개)이고, 신호별로는 S2 132, S3 63, S1 54, S4 0이다. 한 묶음에 신호가 여러 개 붙을 수 있다.\n빨간 테두리는 시험 자료를 만들 때 일부러 틀리게 바꾼 문서 128건이다. 그중 125건에 신호가 붙었다(97.7%). 놓친 3건은 모두 같은 부서의 다른 단위업무로 바꾼 문서다.\n시험 자료의 기본 분류도 글자 유사도로 붙였고 S2가 같은 유사도를 쓰므로, 실제 자료에서는 재현율이 이보다 낮게 나올 수 있다. 실제 점검에서는 신호 없는 대조 표본을 함께 넣어 놓친 오류를 확인한다(test01 대조 표본 10개 제목: 유지 8, 정정 권고 2).\n출처: kac-classification-audit/_workspace/test01/screen_summary.json, evaluate.py test01, output/test01/요약.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '의심 신호 · screen.py', title: '600건 가운데 의심 묶음 158개를 먼저 고른다',
        sub: '전수를 에이전트에 보내지 않는다. 스크립트가 신호 네 가지로 점검할 묶음을 추린다.' });
      d.G = { x: 120, y: 368, pitch: 19, block: 216, r: 6 };
      d.ctx = cnv(root, d.G.x - 10, d.G.y - 10, 1090, 250);
      d.pos = DOCS.map((v, i) => {
        const b = Math.floor(i / 120), j = i % 120;
        return { x: 10 + b * d.G.block + (j % 10) * d.G.pitch + 6.5, y: 10 + Math.floor(j / 10) * d.G.pitch + 6.5, v };
      });
      d.dl = DEPTS.map((t, b) => at(root, '', { x: 120 + b * 216, y: 326 }, t, 'font-size:22px;font-weight:700'));
      d.dc = DEPTS.map((t, b) => {
        let n = 0; for (let j = 0; j < 120; j++) if (DOCS[b * 120 + j] & 14) n++;
        return at(root, '', { x: 120 + b * 216, y: 604 }, `신호 <b class="num">${n}</b>건`, 'font-size:20px;color:#965A00');
      });
      // 숫자 줄
      const chain = [[600, '시험 자료 문서', '553 묶음(부서·제목·기존 분류)', 'var(--ink)'], [158, '의심 묶음', '문서 179건 · 고유 제목 125개', '#965A00'], [100, '이번에 점검한 묶음', '문서 121건 · 대조 표본 포함', 'var(--blue)']];
      d.chain = chain.map((r, i) => {
        const g = at(root, '', { x: 120 + i * 360, y: 656, w: 300 });
        const n = el('div', g, 'num', '0', `font-size:60px;font-weight:900;letter-spacing:-0.04em;line-height:1;color:${r[3]}`);
        el('div', g, '', r[1], 'font-size:23px;font-weight:700;margin-top:8px');
        el('div', g, '', r[2], 'font-size:19px;color:var(--mute);margin-top:2px');
        return { g, n, v: r[0] };
      });
      d.arr = [0, 1].map(i => at(root, '', { x: 120 + i * 360 + 290, y: 668 }, '→', 'font-size:40px;font-weight:700;color:var(--mute)'));
      // 정답 대조
      d.rh = at(root, '', { x: 120, y: 820 }, '정답과 대조 <span class="mono" style="font-size:20px;font-weight:400;color:var(--mute);margin-left:8px">evaluate.py</span>', 'font-size:24px;font-weight:800');
      const ring = `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;border:2.5px solid ${C.bad};box-sizing:border-box;vertical-align:-2px;margin-right:8px"></span>`;
      d.r1 = at(root, '', { x: 120, y: 862 }, `${ring}주입한 오류 <b class="num">128</b>건 중 <b class="num">125</b>건에 신호가 붙었다`, 'font-size:23px');
      d.r2 = at(root, '', { x: 120, y: 900 }, `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${C.warn};vertical-align:-1px;margin-right:9px"></span>주입하지 않은 문서 <b class="num">472</b>건 중 <b class="num">54</b>건에도 신호(11.4%)`, 'font-size:23px');
      d.r3 = at(root, '', { x: 120, y: 942, w: 1060 }, '시험 자료의 기본 분류와 S2가 같은 글자 유사도를 쓴다. 실제 자료에서는 재현율이 이보다 낮을 수 있다.', 'font-size:19px;color:var(--mute)');
      d.st = K.stampEl(root, '재현율 97.7%', 'ok', { x: 820, y: 846 });
      d.st.style.fontSize = '30px';
      // 신호 목록
      const SIG = [['S1', '같은 제목, 다른 단위업무', '같은 부서에서 숫자만 다른 제목이 서로 다른 단위업무에 나뉘어 있다', 54],
        ['S2', '다른 단위업무와 더 닮음', '제목이 붙은 단위업무보다 다른 단위업무와 글자 유사도가 0.15 이상 높다', 132],
        ['S3', '부서 소관이 아님', '붙은 단위업무가 부서 대응표상 그 부서의 단위업무가 아니다', 63],
        ['S4', '기준표에 없는 분류명', '기존 분류명이 분류기준표에 없다', 0]];
      d.sig = SIG.map((r, i) => {
        const y = 318 + i * 112;
        const g = at(root, '', { x: 1236, y, w: 584, h: 104 }, '', 'border-radius:10px');
        el('span', g, 'chip warn mono', r[0], 'position:absolute;left:14px;top:10px;height:34px;font-size:20px;padding:0 10px');
        at(g, '', { x: 76, y: 12 }, r[1], 'font-size:25px;font-weight:800;letter-spacing:-0.02em');
        const n = at(g, 'num', { r: 14, y: 6 }, '0', `font-size:34px;font-weight:800;color:${r[3] ? '#965A00' : 'rgba(27,42,74,.3)'}`);
        at(g, '', { x: 76, y: 48, w: 430 }, r[2], 'font-size:20px;line-height:1.4;color:var(--ink-2)');
        return { g, n, v: r[3] };
      });
      d.sn = at(root, '', { x: 1250, y: 776, w: 550 }, '숫자는 묶음 수다. 한 묶음에 신호가 여러 개 붙을 수 있어 합계가 158보다 크다.', 'font-size:20px;line-height:1.45;color:var(--mute)');
      d.left = at(root, '', { x: 1250, y: 874, w: 550 }, '아직 점검하지 않은 의심 제목 <b class="num" style="font-size:40px;color:#965A00;margin-left:8px;vertical-align:-4px">65</b>개', 'font-size:23px;font-weight:600');
    },
    render(lt, d) {
      d.T.render(lt);
      const ctx = d.ctx, G = d.G;
      ctx.clearRect(0, 0, 1090, 250);
      const sp = prog(lt, 1.2, 1.3, ease.linear);
      const scanX = lerp(-10, 1100, sp);
      const k = K.cycle(lt, 4.2, 2.2, 3);
      const bit = k >= 0 ? [2, 4, 8][k] : 0;
      d.pos.forEach((p, i) => {
        const b = Math.floor(i / 120), j = i % 120;
        const a = prog(lt, 0.25 + b * 0.06 + Math.floor(j / 10) * 0.02 + (j % 10) * 0.004, 0.3, ease.pop);
        if (a <= 0) return;
        const flag = p.v & 14, seen = p.x < scanX;
        let r = G.r * a, col;
        if (!seen) col = 'rgba(27,42,74,.24)';
        else if (!flag) col = 'rgba(27,42,74,.12)';
        else if (bit && (p.v & bit)) { col = '#965A00'; r = 7; }
        else col = bit ? 'rgba(232,147,12,.42)' : C.warn;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        if (p.v & 1) {
          const q = prog(lt, 2.9 + i * 0.0012, 0.3);
          if (q > 0) {
            ctx.strokeStyle = C.bad; ctx.lineWidth = 2.4; ctx.globalAlpha = q;
            ctx.beginPath(); ctx.arc(p.x, p.y, 9.3 + (1 - q) * 6, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      });
      if (sp > 0 && sp < 1) {
        ctx.fillStyle = 'rgba(47,123,255,.10)'; ctx.fillRect(scanX - 40, 0, 40, 250);
        ctx.fillStyle = C.blue; ctx.fillRect(scanX - 1.5, 0, 3, 250);
      }
      d.dl.forEach((e, i) => K.rise(e, lt, 0.2 + i * 0.06, { y: 8 }));
      d.dc.forEach((e, i) => K.rise(e, lt, 1.4 + i * 0.24, { y: 6 }));
      d.chain.forEach((c, i) => { K.rise(c.g, lt, [0.9, 2.4, 2.7][i], { y: 14 }); K.count(c.n, lt, [0.9, 2.4, 2.7][i], 1.0, c.v); });
      d.arr.forEach((e, i) => K.rise(e, lt, [2.3, 2.6][i], { x: -12, y: 0 }));
      d.sig.forEach((g, i) => {
        K.rise(g.g, lt, 0.5 + i * 0.1, { x: 24, y: 0 });
        K.count(g.n, lt, 1.4, 1.2, g.v);
        K.mark(g.g, k === i, 'rgba(232,147,12,.10)');
      });
      K.rise(d.sn, lt, 1.0, { y: 8 });
      K.rise(d.left, lt, 2.9, { y: 8 });
      K.rise(d.rh, lt, 2.9, { y: 10 });
      K.rise(d.r1, lt, 3.0, { y: 8 });
      K.rise(d.r2, lt, 3.1, { y: 8 });
      K.rise(d.r3, lt, 3.2, { y: 8 });
      K.stamp(d.st, lt, 3.4, { rot: -6 });
    },
  });

  // 26. 정답과 대조
  const CELL = [[65, 0, 2], [5, 48, 1]];
  const CAP = [
    ['주입한 오류 65건을 정정 권고했다. 그 정정안 가운데 63건은 주입 전 단위업무와 같다.', '점검한 주입 오류 가운데 기존 분류를 그대로 둔 것은 없다.', '2건은 반박 검증이 판단불가로 두어 사람 확인으로 남았다.'],
    ['5건은 모두 같은 단위업무 안의 철 정정이다. 시험 자료가 붙인 철 이름이 틀린 문서다.', '정상 문서 48건은 기존 분류를 유지했다.', '1건은 반박 검증이 기존 분류의 근거를 찾아 사람 확인으로 남았다.'],
  ];
  DECK.slide({
    id: 'c2-truth', title: '정답과 대조', chapter: CH_B, harness: 'audit',
    notes: '시험 자료는 make_testdata.py가 만들었다. 문서목록에서 5개 부서의 2026년 생산 문서를 부서마다 120건 고르고, 그 부서 단위업무 가운데 제목과 글자가 가장 비슷한 것을 기본 분류로 붙였다(유사도 0.25 이상인 제목만). 그중 약 20%를 다른 단위업무로 바꿔 오류 128건을 넣었다(같은 부서 다른 단위업무 65, 다른 부서 단위업무 63). 정답 파일 answer.csv는 에이전트에게 주지 않았다.\n점검한 121건 기준으로 주입 오류 67건 중 65건이 정정 권고, 2건이 사람 확인이었고 유지로 넘긴 것은 없다. 정정안 63건은 주입 전 단위업무와 같다.\n정상 문서의 정정 권고 5건은 모두 같은 단위업무 안의 철 정정이다. 시험 자료가 단위업무의 첫 번째 철 이름을 붙였기 때문에 생긴 철 오류라서 오탐으로 단정할 수 없다. 의심 제목 65개와 신호 없는 문서 대부분은 이번에 보지 않았다.\n출처: evaluate.py test01, kac-classification-audit/output/test01/요약.md, 점검결과.csv, _workspace/testdata/answer.csv',
    setup(root, d) {
      d.T = K.title(root, { kicker: '정답 대조 · evaluate.py', title: '주입한 오류 67건 중 65건을 정정 권고했다',
        sub: '점검한 121건을 시험 자료의 정답과 맞춰 봤다. 칸의 점 하나가 문서 한 건이다.' });
      // 왼쪽: 시험 자료
      d.card = K.at(root, 'card', { x: 120, y: 326, w: 520, h: 420 });
      d.card.style.padding = '26px 28px';
      const L = d.card;
      el('div', L, '', '시험 자료 600건', 'font-size:30px;font-weight:800;letter-spacing:-0.02em');
      el('div', L, 'mono', 'make_testdata.py', 'font-size:20px;color:var(--mute);margin-top:2px');
      const li = (t) => el('div', L, '', t, 'font-size:22px;line-height:1.45;color:var(--ink-2);margin-top:10px;padding-left:18px;position:relative');
      li('5개 부서 × 120건, 2026년 생산 문서');
      li('기본 분류: 부서 단위업무 중 제목과 글자가 가장 비슷한 것. 사람이 확인한 정답이 아니다');
      li('그중 128건을 다른 단위업무로 바꿨다');
      L.querySelectorAll('div[style*="padding-left"]').forEach(e => { const b = h('span', '', e); b.style.cssText = 'position:absolute;left:0;top:13px;width:7px;height:7px;border-radius:2px;background:var(--ink-2)'; });
      d.bar = el('div', L, '', '', 'display:flex;height:22px;border-radius:4px;overflow:hidden;margin-top:18px;gap:2px');
      [[472, 'rgba(27,42,74,.22)'], [65, C.bad], [63, '#A32019']].forEach(([v, c]) => el('div', d.bar, '', '', `flex:none;width:${(v / 600 * 462 - 2).toFixed(1)}px;background:${c}`));
      const sq = c => `<span style="display:inline-block;width:13px;height:13px;border-radius:2px;background:${c};margin-right:6px;vertical-align:-1px"></span>`;
      el('div', L, '', `${sq('rgba(27,42,74,.22)')}정상 472 &nbsp; ${sq(C.bad)}같은 부서 다른 단위업무 65 &nbsp; ${sq('#A32019')}다른 부서 단위업무 63`, 'font-size:20px;line-height:1.5;color:var(--ink-2);margin-top:10px');
      el('div', L, '', '정답 answer.csv는 에이전트에게 주지 않았다.', 'font-size:20px;color:var(--mute);margin-top:10px');
      d.scope = at(root, '', { x: 120, y: 780, w: 520 }, '', '');
      el('div', d.scope, '', '점검한 문서 121건', 'font-size:26px;font-weight:800;letter-spacing:-0.02em');
      el('div', d.scope, '', '의심 묶음과 대조 표본에서 고른 100 묶음. 주입 오류 67건, 정상 54건이 들어 있다.', 'font-size:21px;line-height:1.45;color:var(--ink-2);margin-top:6px');
      el('div', d.scope, '', '의심 제목 65개는 아직 점검하지 않았다.', 'font-size:21px;font-weight:700;color:#965A00;margin-top:8px');
      // 오른쪽: 행렬
      const CX = [912, 1208, 1504], RY = [372, 620], CW = 284, RH = 236;
      d.cols = [['정정 권고', '#B3261E'], ['유지', '#0B7A52'], ['사람 확인', '#965A00']].map((c, i) => at(root, '', { x: CX[i] + 2, y: 326 }, c[0], `font-size:24px;font-weight:800;color:${c[1]}`));
      d.rows = [['주입한 오류', '점검 67건'], ['정상 문서', '점검 54건']].map((r, i) => {
        const g = at(root, '', { x: 700, y: RY[i] + 22, w: 200 });
        el('div', g, '', r[0], 'font-size:27px;font-weight:800;letter-spacing:-0.02em');
        el('div', g, '', r[1], 'font-size:21px;color:var(--mute);margin-top:4px');
        el('div', g, '', '', `width:40px;height:5px;border-radius:3px;margin-top:14px;background:${i ? 'rgba(27,42,74,.3)' : C.bad}`);
        return g;
      });
      d.cells = [];
      CELL.forEach((row, ri) => row.forEach((v, ci) => {
        const e = K.at(root, 'card flat', { x: CX[ci], y: RY[ri], w: CW, h: RH });
        const n = at(e, 'num', { x: 22, y: 14 }, '0', `font-size:64px;font-weight:900;letter-spacing:-0.04em;line-height:1.1;color:${v ? ['#B3261E', '#0B7A52', '#965A00'][ci] : 'rgba(27,42,74,.28)'}`);
        d.cells.push({ e, n, v, ri, ci });
      }));
      d.tot = at(root, '', { x: 700, y: 872, w: 1100 }, '', 'font-size:22px;color:var(--ink-2)');
      d.tot.innerHTML = '<span style="position:absolute;left:0">합계 <b class="num">121</b>건</span>' +
        [70, 48, 3].map((v, i) => `<span class="num" style="position:absolute;left:${CX[i] - 700 + 22}px;font-weight:700">${v}건</span>`).join('');
      d.cap = at(root, '', { x: 700, y: 926, w: 1100 }, '', 'font-size:23px;font-weight:600;line-height:1.4');
      d.ring = at(root, '', { x: 0, y: 0, w: CW + 12, h: RH + 12 }, '', `border:3px solid ${C.blue};border-radius:18px;box-sizing:border-box;opacity:0`);
      d.st = K.stampEl(root, '유지 0', 'ok', { x: CX[1] + 70, y: RY[0] + 112 });
      // 점: 문서 121건
      d.ctx = cnv(root, 600, 300, 1220, 580);
      d.dots = [];
      let q = 0;
      CELL.forEach((row, ri) => row.forEach((v, ci) => {
        for (let i = 0; i < v; i++, q++) {
          const tx = CX[ci] + 30 + (i % 18) * 14 - 600, ty = RY[ri] + 112 + Math.floor(i / 18) * 14 - 300;
          d.dots.push({ tx, ty, sx: 18 + K.rand(q, 3) * 24, sy: 300 + K.rand(q, 5) * 200, t0: 0.9 + K.rand(q, 9) * 1.3, c: [C.bad, C.ok, C.warn][ci], cell: ri * 3 + ci });
        }
      }));
      d.CX = CX; d.RY = RY;
      d.ck = -2;
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.card, lt, 0.3, { x: -24, y: 0 });
      K.wipe(d.bar, lt, 0.7, 0.8);
      K.rise(d.scope, lt, 1.0, { y: 12 });
      d.cols.forEach((e, i) => K.rise(e, lt, 0.45 + i * 0.08, { y: 10 }));
      d.rows.forEach((e, i) => K.rise(e, lt, 0.55 + i * 0.1, { x: -16, y: 0 }));
      d.cells.forEach((c, i) => {
        K.rise(c.e, lt, 0.6 + i * 0.06, { y: 14, blur: 0 });
      });
      K.rise(d.tot, lt, 2.4, { y: 8 });
      const ctx = d.ctx;
      ctx.clearRect(0, 0, 1220, 580);
      const got = [0, 0, 0, 0, 0, 0];
      d.dots.forEach(p => {
        const u = prog(lt, p.t0, 0.55, ease.inOutCubic);
        if (u >= 1) got[p.cell]++;
        if (u <= 0) return;
        const x = lerp(p.sx, p.tx, u), y = lerp(p.sy, p.ty, u) - Math.sin(u * Math.PI) * 40;
        ctx.globalAlpha = Math.min(1, u * 3);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      d.cells.forEach((c, i) => { c.n.textContent = String(got[i]); });   // 칸에 도착한 점 수
      K.stamp(d.st, lt, 2.9, { rot: -8 });
      // 머무는 동안: 칸을 차례로 짚고 그 칸의 뜻을 적는다
      const k = K.cycle(lt, 3.4, 2.8, 6);
      if (k < 0) { d.ring.style.opacity = '0'; d.cap.style.opacity = '0'; return; }
      const ri = Math.floor(k / 3), ci = k % 3;
      if (d.ck !== k) { d.ck = k; d.cap.textContent = CAP[ri][ci]; d.cap.style.color = ['#B3261E', '#0B7A52', '#965A00'][ci]; }
      const loc = (lt - 3.4) % 2.8;
      d.ring.style.left = (d.CX[ci] - 6) + 'px'; d.ring.style.top = (d.RY[ri] - 6) + 'px';
      d.ring.style.opacity = Math.min(prog(loc, 0, 0.25), 1 - prog(loc, 2.55, 0.25, ease.exit)).toFixed(3);
      K.rise(d.cap, loc, 0, { y: 8, dur: 0.35 });
      if (loc > 2.5) d.cap.style.opacity = (1 - prog(loc, 2.5, 0.3, ease.exit)).toFixed(3);
    },
  });

  // 27. 정정 사례 2건
  const CASES = [
    { y: 290, dept: '인사혁신실', n: '3건', title: '비밀취급 인가 알림', old: '일반보안 · 비밀·대외비 현황', fix: 'F0002 비밀취급 인가·해제',
      foot: '주입하지 않은 문서다. 시험 자료가 붙인 철 이름이 틀렸다.',
      more: '같은 제목 5건: 이 3건과 직원식당 운영관리에 넣은 1건은 정정 권고, 일반보안 단위업무만 붙은 1건은 유지',
      st: [['의심 신호', 'screen.py', 'var(--ink-2)', '<b>S1</b> · 같은 부서의 같은 제목이 단위업무 2개에 나뉘어 있다(이 분류 80%)'],
        ['독립 판단', 'blind-classifier', 'var(--blue-2)', `${idt('F0002', 'var(--blue-2)')} 비밀취급 인가·해제 · 확신도 높음`],
        ['판정', 'label-judge', '#965A00', '<b class="em-bad">오류</b> · 기존 철은 비밀문서 보유현황·암호자재 운용·비밀관리 실태를 다뤄 인가 업무를 담지 않는다'],
        ['반박 검증', 'correction-challenger', '#B3261E', '<b class="em-bad">반박 실패</b> · 정정안 철 설명에 \'직원별 비밀취급 인가 신청·승인·해제\'가 적혀 있다']] },
    { y: 642, dept: '감사실', n: '1건', title: '감사결과 처분요구사항 통보(2026년도 공직기강 특별감사 및 직무감찰)', old: '물품계약관리', fix: 'F0237 공직기강·복무감찰',
      foot: '주입한 오류다. 다른 부서(경영관리실) 단위업무로 바꿔 넣었다.',
      st: [['의심 신호', 'screen.py', 'var(--ink-2)', '<b>S2</b> · 기존 단위업무와 유사도 0.01, 공직기강·감찰관리와 0.39 · <b>S3</b> · 경영관리실 자산계약부 소관'],
        ['독립 판단', 'blind-classifier', 'var(--blue-2)', `${idt('F0220', 'var(--blue-2)')} 감사처분 조치이행관리 · 확신도 보통`],
        ['판정', 'label-judge', '#965A00', `<b class="em-bad">오류</b> · 괄호의 '공직기강 특별감사 및 직무감찰'을 근거로 ${idt('F0237', '#B3261E')}을 골랐다. F0220은 차순위`],
        ['반박 검증', 'correction-challenger', '#B3261E', '<b class="em-bad">반박 실패</b> · 물품계약관리의 두 철은 구매·입찰·납품·대금 지급만 다뤄 감사결과 통보를 담을 수 없다']] },
  ];
  DECK.slide({
    id: 'c2-fix-cases', title: '정정 사례', chapter: CH_B, harness: 'audit',
    notes: '두 건 모두 kac-classification-audit/output/test01/정정안.csv의 실제 행이다.\n위 건은 인사혁신실 \'비밀취급 인가 알림\' 3건이다. 시험 자료가 일반보안 단위업무의 첫 철(비밀·대외비 현황)을 붙인 문서로, 일부러 오류를 넣은 문서가 아니다. 하네스는 철 수준의 오류를 찾아 F0002 비밀취급 인가·해제로 정정안을 냈다. 같은 제목 5건 가운데 직원식당 운영관리에 넣은 1건(주입 오류)도 같은 정정안을 받았고, 일반보안 단위업무만 붙은 1건은 유지됐다.\n아래 건은 다른 부서(경영관리실 자산계약부)의 물품계약관리로 바꿔 넣은 주입 오류다. 독립 판단은 F0220을 냈지만 판정은 괄호 안 \'공직기강 특별감사 및 직무감찰\'을 근거로 F0237을 골랐고, 반박 검증도 F0237이 더 맞다고 보았다. F0237은 주입 전 단위업무(공직기강·감찰관리)에 속한다.\n출처: output/test01/정정안.csv, 점검결과.csv, _workspace/testdata/answer.csv',
    setup(root, d) {
      d.T = K.title(root, { kicker: '정정 사례 · 정정안.csv', title: '반박이 실패한 판정만 정정 권고가 된다' });
      d.svg = K.svg(root);
      d.cs = CASES.map(c => {
        const o = {};
        o.card = K.at(root, 'card', { x: 120, y: c.y, w: 600, h: 318 });
        o.card.style.padding = '22px 26px';
        const m = el('div', o.card, '', '', 'display:flex;gap:8px');
        el('span', m, 'chip sm id', c.dept, 'font-family:var(--sans);font-weight:600');
        el('span', m, 'chip sm ghost', '생산');
        el('span', m, 'chip sm ghost', c.n);
        el('div', o.card, '', c.title, 'font-size:30px;font-weight:800;letter-spacing:-0.025em;line-height:1.3;margin-top:14px');
        const r1 = el('div', o.card, '', '', 'display:flex;align-items:center;gap:12px;margin-top:16px');
        el('span', r1, '', '기존', 'width:62px;font-size:20px;font-weight:700;color:var(--mute)');
        o.old = el('span', r1, 'chip id', '', 'position:relative;font-family:var(--sans);font-weight:600;color:var(--ink-2)');
        el('span', o.old, '', c.old);
        o.strike = el('span', o.old, '', '', 'position:absolute;left:-6px;right:-6px;top:18px;height:4px;background:var(--bad);border-radius:2px');
        o.r2 = el('div', o.card, '', '', 'display:flex;align-items:center;gap:12px;margin-top:10px');
        el('span', o.r2, '', '정정안', 'width:62px;font-size:20px;font-weight:700;color:#B3261E');
        o.fix = el('span', o.r2, 'chip bad', c.fix);
        o.foot = el('div', o.card, '', c.foot, 'font-size:19px;color:var(--mute);margin-top:14px');
        if (c.more) el('div', o.foot, '', c.more, 'font-size:19px;line-height:1.45;color:var(--ink-2);margin-top:8px;padding-top:8px;border-top:1.5px solid var(--rule)');
        o.stamp = K.stampEl(o.card, '정정 권고', 'bad', { r: 20, y: 14 });
        o.stamp.style.fontSize = '26px'; o.stamp.style.padding = '4px 14px'; o.stamp.style.borderWidth = '4px';
        // 단계 줄
        o.track = K.path(d.svg, [[766, c.y + 30], [766, c.y + 30 + 3 * 80]], { color: 'rgba(27,42,74,.22)', width: 2 });
        K.dots(d.svg, o.track, 1, { r: 5, color: C.blue });
        o.rows = c.st.map((r, i) => {
          const y = c.y + 8 + i * 80;
          const g = at(root, '', { x: 744, y, w: 1076, h: 74 }, '', 'border-radius:10px');
          const mk = at(g, '', { x: 12, y: 13, w: 20, h: 20 }, '', `border-radius:50%;background:var(--paper);border:3.5px solid ${r[2]};box-sizing:border-box`);
          at(g, '', { x: 48, y: 6 }, r[0], `font-size:22px;font-weight:800;color:${r[2]}`);
          at(g, 'mono', { x: 48, y: 38 }, r[1], 'font-size:19px;color:var(--mute)');
          at(g, '', { x: 312, y: 6, w: 744 }, r[3], 'font-size:22px;line-height:1.42;color:var(--ink)');
          return { g, mk };
        });
        return o;
      });
    },
    render(lt, d) {
      d.T.render(lt);
      const k = K.cycle(lt, 3.6, 1.3, 8);
      d.cs.forEach((o, ci) => {
        const t0 = 0.35 + ci * 1.0;
        K.rise(o.card, lt, t0, { x: -40, y: 0 });
        K.draw(o.track, lt, t0 + 0.3, 0.9, { speed: 60, ease: ease.linear });
        o.rows.forEach((r, i) => {
          K.rise(r.g, lt, t0 + 0.3 + i * 0.22, { x: -18, y: 0 });
          K.mark(r.g, k === ci * 4 + i, 'rgba(47,123,255,.06)');
        });
        K.wipe(o.strike, lt, t0 + 0.95, 0.35);
        o.old.style.opacity = (1 - 0.22 * prog(lt, t0 + 1.1, 0.3)).toFixed(3);
        K.rise(o.r2, lt, t0 + 1.15, { x: -14, y: 0 });
        K.pop(o.fix, lt, t0 + 1.2);
        K.rise(o.foot, lt, t0 + 1.3, { y: 6 });
        K.stamp(o.stamp, lt, t0 + 1.45, { rot: -7 });
      });
    },
  });
})();

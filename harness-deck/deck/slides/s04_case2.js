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

  // 20. 챕터 영상
  DECK.slide({
    id: 'ch-assign', title: '제목 배정 챕터 영상', bg: 'paper', harness: 'assign', video: 'media/ch_assign.mp4', poster: 'media/ch_assign.jpg',
    notes: '10초 챕터 영상. 필름 D 구간의 작업장(컨베이어)이 움직이고, 기록연구사의 질문 「제목만 보고 기록물철을 고를 수 있나요?」에 이 발표의 하네스 kac-record-assign이 답한다.\n과제 「생산현황 분류 정정」은 일이 둘이라 하네스 두 개(제목 배정, 오분류 점검)로 나눴다. 이 챕터는 배정을 먼저 본다. 끝나면 → 키로 넘긴다.',
  });

  // ── 이 파일의 공통 값과 함수 ─────────────────────────
  const OKD = '#0B7A52', WAD = '#965A00', BADD = '#B3261E';
  const show = (e, on, pre) => { e.style.opacity = on ? '1' : '0'; e.style.transform = (pre || '') + `scale(${on ? 1 : 0.8})`; };
  const TAPE = 'repeating-linear-gradient(-45deg,#1B2A4A 0 10px,#3A4A6B 10px 20px)';

  // 문서 한 건이 에이전트를 차례로 거치는 장. 위쪽 카드에 문서 제목과 분류, 아래에 에이전트.
  // o.st = [{ a: K.actor 옵션, say, cls, blind }], o.doc = { dept, title, oldLab, old, oldCls, strike, newLab, neu, resCls, extra, stamp }
  function procSlide(o) {
    const n = o.st.length;
    const cxs = n === 2 ? [560, 1360] : n === 3 ? [400, 960, 1520] : [330, 763, 1197, 1630];
    const BASE = o.base || 812, AW = o.w || 200, FIN = 2.6;
    const durs = []; o.st.forEach(() => durs.push(0.7, 1.7)); durs.push(FIN);
    DECK.slide({
      id: o.id, title: o.title, chapter: o.chapter, harness: o.harness, notes: o.notes,
      setup(root, d) {
        d.T = K.title(root, { kicker: o.kicker, title: o.title, size: o.size });
        const c = o.doc, res = c.resCls || 'bad';
        d.card = K.at(root, 'card', { x: 120, y: 300, w: 1680, h: 188 });
        at(d.card, '', { x: 34, y: 20 }, c.dept, 'font:600 26px/1.2 var(--sans);color:var(--mute)');
        at(d.card, '', { x: 34, y: 56, w: 1400 }, c.title, 'font:800 38px/1.25 var(--sans);letter-spacing:-0.025em;white-space:nowrap');
        d.row = at(d.card, '', { x: 34, y: 118 }, '', 'display:flex;align-items:center;gap:16px');
        el('span', d.row, '', c.oldLab || '기존 분류', 'font:700 26px/1 var(--sans);color:var(--mute)');
        d.old = el('span', d.row, 'chip lg ' + (c.oldCls || 'id'), '', 'position:relative;font-family:var(--sans);font-weight:700');
        el('span', d.old, '', c.old);
        d.strike = el('span', d.old, '', '', 'position:absolute;left:-6px;right:-6px;top:23px;height:5px;background:var(--bad);border-radius:3px');
        d.tape = el('span', d.old, '', '가림', `position:absolute;left:-8px;right:-8px;top:-6px;bottom:-6px;border-radius:8px;background:${TAPE};color:#fff;font:800 24px/1 var(--sans);display:flex;align-items:center;justify-content:center`);
        d.arrow = el('span', d.row, '', '→', 'font:700 34px/1 var(--sans);color:var(--ink-2)');
        d.newLab = c.newLab ? el('span', d.row, '', c.newLab, `font:700 26px/1 var(--sans);color:${res === 'ok' ? OKD : BADD}`) : null;
        d.neu = el('span', d.row, 'chip lg ' + res, c.neu, 'font-weight:800');
        d.extra = c.extra ? el('span', d.row, '', c.extra, 'font:700 28px/1 var(--sans);color:var(--ink-2)') : null;
        d.stamp = K.stampEl(root, c.stamp || '정정 권고', res, { x: 1560, y: 322 });
        d.svg = K.svg(root);
        d.act = o.st.map((st, i) => {
          const kind = st.a.kind || K.AG[st.a.id].kind, w = st.a.w || AW;
          return K.actor(root, Object.assign({ x: cxs[i] - w / 2, y: BASE - w * K.AGR[kind], w, jobW: n === 4 ? 400 : 440 }, st.a));
        });
        d.arr = cxs.slice(0, -1).map((cx, i) => K.path(d.svg, [[cx + AW / 2 + 18, BASE - 106], [cxs[i + 1] - AW / 2 - 106, BASE - 106]], { color: C.ink2, width: 4, arrow: true }));
        d.say = o.st.map((st, i) => {
          const e = K.say(root, st.say, { y: 500 }, st.cls || 'blue', 'b');
          e.style.fontSize = '30px'; e.style.padding = '12px 22px 13px';
          if (n === 4 && i === 0) e.style.left = (cxs[i] - 120) + 'px';
          else if (n === 4 && i === n - 1) e.style.right = (1920 - cxs[i] - 120) + 'px';
          else { e.style.left = cxs[i] + 'px'; e._pre = 'translateX(-50%) '; }
          return e;
        });
        d.tok = K.doc(root, '문서', { x: 0, y: 0 });
        d.pos = cxs.map(cx => [cx - AW / 2 - 92, BASE - 194]);
      },
      render(lt, d) {
        d.T.render(lt);
        K.rise(d.card, lt, 0.35, { y: 20 });
        d.act.forEach((a, i) => a.render(lt, 0.7 + i * 0.16));
        d.arr.forEach((p, i) => K.draw(p, lt, 1.0 + i * 0.16, 0.35));
        const L = K.loop(lt, 2.4, durs), st = L.i, fin = st === 2 * n, k = st < 0 ? -1 : Math.min(n - 1, Math.floor(st / 2)), odd = st % 2 === 1;
        d.act.forEach((a, i) => { if (lt > 2.3) a.act(lt, !fin && odd && k === i); });
        d.say.forEach((e, i) => show(e, !fin && odd && k === i && L.u > 0.22, e._pre));
        // 기존 분류를 가린다: blind 인 에이전트에게 가는 동안과 그 에이전트가 일하는 동안
        let tp = 0;
        if (k >= 0 && !fin) {
          const cur = !!o.st[k].blind, prev = k > 0 && !!o.st[k - 1].blind;
          tp = odd ? (cur ? 1 : 0) : cur ? (prev ? 1 : clamp(L.u * 1.6)) : prev ? 1 - clamp(L.u * 1.6) : 0;
        }
        d.tape.style.opacity = tp > 0 ? '1' : '0';
        d.tape.style.clipPath = `inset(0 ${((1 - tp) * 100).toFixed(1)}% 0 0)`;
        // 마지막 단계: 결과가 카드에 적히고 도장이 찍힌다
        if (o.doc.strike === false) d.strike.style.opacity = '0'; else K.wipe(d.strike, lt, 1.5, 0.35);
        K.rise(d.arrow, lt, 1.6, { x: -12, y: 0, blur: 0 });
        if (d.newLab) K.rise(d.newLab, lt, 1.65, { x: -12, y: 0, blur: 0 });
        K.pop(d.neu, lt, 1.75);
        if (d.extra) K.rise(d.extra, lt, 1.9, { x: -12, y: 0, blur: 0 });
        K.stamp(d.stamp, fin ? 10 + L.u * FIN : lt, fin ? 10.2 : 2.1, { rot: -6 });
        if (fin && L.u * FIN < 0.2) d.stamp.style.opacity = '1';
        d.neu.style.boxShadow = fin ? '0 0 0 6px ' + (o.doc.resCls === 'ok' ? 'rgba(25,169,116,.28)' : 'rgba(232,72,58,.25)') : 'none';
        // 문서 표식의 이동
        const P = d.pos;
        if (st < 0) { d.tok.style.opacity = '0'; return; }
        if (fin) { K.travel(d.tok, 1, 0, 1, P[n - 1], P[n - 1]); d.tok.style.opacity = clamp(1 - L.u / 0.12).toFixed(3); return; }
        if (odd) { K.travel(d.tok, 1, 0, 1, P[k], P[k]); return; }
        K.travel(d.tok, L.u, 0, 1, k === 0 ? [P[0][0], 500] : P[k - 1], P[k], { arc: k === 0 ? 0 : 34 });
        d.tok.style.opacity = (k === 0 ? clamp(L.u / 0.3) : 1).toFixed(3);
      },
    });
  }

  // 두 하네스가 나눠 맡는다
  const SPLIT = [
    { hz: 'assign', x: 120, head: '분류가 없는 문서는<br>기록물철에 배정한다', dept: '감사실 문서', title: '모·자회사 자체감사기구 책임자 회의 개최 알림',
      old: '분류 없음', res: '공공감사기구 교류·협력 관리', cls: 'ok', stamp: '확정' },
    { hz: 'audit', x: 1020, head: '이미 붙은 분류는<br>맞는지 점검한다', dept: '인사혁신실 문서', title: '2026년 단체상해보험 가입 계약 의뢰',
      old: '항공보안인력관리', res: '단체상해보험 운영', cls: 'bad', stamp: '정정 권고' },
  ];
  DECK.slide({
    id: 'c2-split', title: '두 하네스가 나눠 맡는다', chapter: CH_A, harness: 'assign',
    notes: '과제 「생산현황 분류 정정」은 일이 둘이라 하네스도 둘로 나눴다. 제목 배정 하네스(kac-record-assign)는 분류 칸이 없는 문서 제목을 기록물철·단위업무·부서공통 가운데 하나에 배정하고, 정할 수 없으면 미배정이나 검토필요로 남긴다. 오분류 점검 하네스(kac-classification-audit)는 사람이 이미 고른 분류가 제목과 맞는지 점검해 정정안을 낸다.\n에이전트는 하네스마다 세 개다. 배정: record-assigner(sonnet), assignment-verifier(opus), assignment-arbiter(opus). 점검: blind-classifier(sonnet), label-judge(opus), correction-challenger(opus). 결과 파일은 배정결과.csv·검토필요.csv·요약.md, 정정안.csv·사람확인.csv·점검결과.csv다.\n공용 문서목록(production.sqlite)에는 사람이 고른 분류 열이 없다. 그래서 점검 하네스는 make_testdata.py로 만든 시험 자료(600건, 오류 128건을 일부러 넣음)로 동작을 확인했다. 실제 점검에는 기존 분류 열이 있는 파일이 필요하다.\n화면의 두 문서는 실제 결과 행이다. 왼쪽은 F0204 공공감사기구 교류·협력 관리로 확정됐고(kac-record-assign/output/t1/배정결과.csv), 오른쪽은 기존 단위업무 항공보안인력관리를 F0040 단체상해보험 운영으로 정정 권고했다(kac-classification-audit/output/test01/정정안.csv).',
    setup(root, d) {
      d.T = K.title(root, { kicker: '과제 · 생산현황 분류 정정', title: '두 하네스가 나눠 맡는다' });
      d.mid = at(root, '', { x: 959, y: 310, w: 2, h: 640 }, '', 'background:var(--rule)');
      d.cols = SPLIT.map(c => {
        const o = { c };
        o.chip = K.hchip(root, c.hz, { x: c.x, y: 306 });
        o.head = at(root, '', { x: c.x, y: 380, w: 780 }, c.head, 'font:900 56px/1.22 var(--display);letter-spacing:-0.035em');
        o.card = K.at(root, 'card', { x: c.x, y: 556, w: 780, h: 330 });
        at(o.card, '', { x: 32, y: 26 }, c.dept, 'font:600 26px/1.2 var(--sans);color:var(--mute)');
        at(o.card, '', { x: 32, y: 66, w: 730 }, c.title, 'font:800 36px/1.25 var(--sans);letter-spacing:-0.03em;white-space:nowrap');
        o.old = at(o.card, 'chip lg ' + (c.hz === 'assign' ? 'ghost' : 'id'), { x: 32, y: 146 }, '', 'height:60px;font-size:30px;font-family:var(--sans);font-weight:700');
        el('span', o.old, '', c.old);
        o.strike = c.hz === 'audit' ? el('span', o.old, '', '', 'position:absolute;left:-6px;right:-6px;top:27px;height:5px;background:var(--bad);border-radius:3px') : null;
        o.arrow = at(o.card, '', { x: 36, y: 234 }, '→', 'font:700 40px/1 var(--sans);color:var(--ink-2)');
        o.res = at(o.card, 'chip lg ' + c.cls, { x: 96, y: 226 }, c.res, 'height:60px;font-size:32px;font-weight:800;transform-origin:0 50%');
        o.stamp = K.stampEl(root, c.stamp, c.cls, { x: c.x + (c.hz === 'assign' ? 610 : 520), y: 774 });
        return o;
      });
    },
    render(lt, d) {
      d.T.render(lt);
      K.wipe(d.mid, lt, 0.5, 0.8, 'down');
      const L = K.loop(lt, 3.0, [0.2, 0.2, 3.0]);
      d.cols.forEach((o, ci) => {
        const t0 = 0.4 + ci * 0.25;
        K.pop(o.chip, lt, t0);
        K.rise(o.head, lt, t0 + 0.1, { y: 18 });
        K.rise(o.card, lt, t0 + 0.3, { y: 24 });
        const dl = ci * 0.25;
        if (o.strike) K.wipe(o.strike, lt, 1.3 + dl, 0.35);
        else o.old.style.borderColor = `rgba(232,147,12,${(0.5 + 0.5 * K.wave(lt, 0.9)).toFixed(3)})`;
        K.rise(o.arrow, lt, 1.45 + dl, { x: -14, y: 0, blur: 0 });
        K.pop(o.res, lt, 1.6 + dl);
        // 결과는 계속 보이고, 반복할 때는 도장만 다시 찍힌다
        const again = L.i >= 0 && L.lap % 2 === ci && L.i === 2;
        K.stamp(o.stamp, again ? 10 + L.u * 3.0 : lt, again ? 10.15 : 2.0 + dl, { rot: -6 });
        if (again) o.stamp.style.opacity = '1';
        o.res.style.boxShadow = again ? '0 0 0 6px ' + (ci ? 'rgba(232,72,58,.25)' : 'rgba(25,169,116,.28)') : 'none';
      });
    },
  });

  // 문서 한 건: 배정 → 검증 → 확정
  procSlide({
    id: 'c2-assign-flow', title: '문서 한 건이 배정과 검증을 거쳐 확정된다', kicker: '제목 배정 · 실제 문서 한 건', chapter: CH_A, harness: 'assign',
    notes: '공통 구조에서 본 흐름(만들기 → 검증 → 중재)을 실제 문서 한 건으로 따라간다. 감사실이 2026년에 접수한 문서 「자회사 특정감사 결과통보에 따른 후속조치 관련 자료 요청」이다.\n배정 에이전트(record-assigner, sonnet)는 감사실 기록물철 57개, 부서공통 46개, 다른 부서 추가후보 5개 가운데 F0242 자회사 특정감사 실시를 확신도 보통으로 고르고 경쟁 후보 F0220 감사처분 조치이행관리를 함께 적었다. 검증 에이전트(assignment-verifier, opus)는 배정 결과를 보기 전에 제목과 후보만으로 자기 답을 정한 뒤 비교한다. 여기서는 주제어 「자회사 특정감사」가 F0242를 가리키고 F0220은 「후속조치」라는 절차 표현만 맞는다고 보아 동의했다.\n두 판단이 같아 중재 없이 확정됐다. 결과: F0242 자회사 특정감사 실시, 감사실 감사기획부, 단위업무 특정감사 관리, 보존기간 30년.\n문서목록에는 정답이 없으므로 「확정」은 검증이 동의했거나 중재가 결정했다는 뜻이다.\n스크립트 make_batches.py가 제목을 묶음 파일로 만들고 merge_results.py가 상태를 정해 결과표로 합친다.\n출처: kac-record-assign/output/t1/배정결과.csv 첫 행, _workspace/t1/batches·results·verify/batch_0001.json(k001)',
    doc: { dept: '감사실이 받은 문서', title: '자회사 특정감사 결과통보에 따른 후속조치 관련 자료 요청', oldLab: '기록물철', old: '없음', oldCls: 'ghost', strike: false,
      neu: '자회사 특정감사 실시', resCls: 'ok', extra: '보존기간 30년', stamp: '확정' },
    st: [
      { a: { id: 'record-assigner', job: '후보 가운데 철을 고른다', w: 220 }, say: '자회사 특정감사 실시 철입니다', cls: 'blue' },
      { a: { id: 'assignment-verifier', job: '배정을 보지 않고<br>다시 고른다', w: 205 }, say: '저도 같은 철을 골랐습니다', cls: 'ok' },
    ],
  });

  // 제목 40개 중 33개는 검증이 바로 동의했다
  const BS = [4, 9, 15, 21, 26, 31, 37], B_SET = new Set(BS);   // 40칸 가운데 중재로 간 7칸(자리는 그림용으로 고르게 흩었다)
  DECK.slide({
    id: 'c2-assign-t1', title: '제목 40개 중 33개는 검증이 바로 동의했다', chapter: CH_A, harness: 'assign',
    notes: '시험 실행 t1은 감사실·제주운영단의 2026년 문서에서 고정 표본(order sample)으로 제목 40개를 뽑아 돌렸다. 범위 안 문서는 21,357건이고, 숫자만 다른 제목을 하나로 세면 서로 다른 제목이 14,299개다. 그 가운데 40개(문서 56건)를 판단했고 14,259개는 아직 판단하지 않았다. 다음 실행에서 이어서 배정한다.\n제목 40개 중 33개(82.5%)는 검증 에이전트가 배정에 동의해 바로 확정됐다. 7개(17.5%)는 판단이 달라 중재로 갔고 모두 확정(중재)가 됐다. 검토필요는 0개다.\n화면의 칸 40개에서 주황 칸 7개의 자리는 그림을 위해 고르게 흩어 놓은 것이고, 실제 제목 순서와는 관계없다.\n출처: kac-record-assign/output/t1/요약.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '제목 배정 · 시험 실행', title: '제목 40개 중 33개는 검증이 바로 동의했다' });
      const F = [[21357, '범위 안 문서', 120, 'var(--ink)'], [14299, '서로 다른 제목', 720, 'var(--ink)'], [40, '이번에 판단한 제목', 1320, 'var(--blue)']];
      d.fun = F.map(r => {
        const g = at(root, '', { x: r[2], y: 300, w: 480 });
        const n = el('div', g, 'num', '0', `font:900 124px/1.05 var(--display);letter-spacing:-0.04em;color:${r[3]}`);
        el('div', g, '', r[1], `font:800 34px/1.2 var(--sans);letter-spacing:-0.02em;margin-top:6px;color:${r[3]}`);
        return { g, n, v: r[0] };
      });
      d.arr = [570, 1170].map(x => at(root, '', { x, y: 328 }, '→', 'font:700 76px/1 var(--sans);color:var(--mute)'));
      d.sq = [];
      for (let i = 0; i < 40; i++) d.sq.push(at(root, '', { x: 120 + (i % 20) * 84, y: 560 + Math.floor(i / 20) * 84, w: 68, h: 68 }, '', 'border-radius:12px'));
      d.n1 = at(root, 'num', { x: 120, y: 770, w: 190 }, '0', 'font:900 150px/1 var(--display);letter-spacing:-0.04em;color:var(--ok)');
      d.c1 = at(root, '', { x: 330, y: 836 }, '개는 검증이 바로 동의', 'font:800 40px/1.2 var(--sans);letter-spacing:-0.025em');
      d.n2 = at(root, 'num', { x: 980, y: 770, w: 100 }, '0', 'font:900 150px/1 var(--display);letter-spacing:-0.04em;color:var(--warn)');
      d.c2 = at(root, '', { x: 1100, y: 836 }, '개는 판단이 달라 중재로', 'font:800 40px/1.2 var(--sans);letter-spacing:-0.025em');
    },
    render(lt, d) {
      d.T.render(lt);
      d.fun.forEach((f, i) => { K.rise(f.g, lt, 0.4 + i * 0.3, { y: 18 }); K.count(f.n, lt, 0.4 + i * 0.3, 0.9, f.v); });
      d.arr.forEach((e, i) => K.rise(e, lt, 0.6 + i * 0.3, { x: -16, y: 0 }));
      [d.n1, d.c1, d.n2, d.c2].forEach((e, i) => K.rise(e, lt, 1.6 + i * 0.1, { y: 14 }));
      // 칸이 하나씩 판정된다: 초록 = 검증이 동의, 주황 = 중재로
      // 칸은 등장한 뒤 색이 칠해진 채로 있다. 반복할 때는 주황 칸 7개를 차례로 테두리로 짚는다.
      const k = K.cycle(lt, 2.8, 0.9, 7);
      d.sq.forEach((e, i) => {
        K.pop(e, lt, 1.0 + i * 0.02);
        const isB = B_SET.has(i);
        e.style.background = isB ? C.warn : C.ok;
        e.style.boxShadow = isB && BS[k] === i ? '0 0 0 6px rgba(27,42,74,.85)' : 'none';
      });
      K.count(d.n1, lt, 1.6, 0.9, 33); K.count(d.n2, lt, 1.7, 0.9, 7);
    },
  });

  // 판단이 다른 7개는 중재 에이전트가 정했다
  const DEC = [['배정안 채택', '처음 배정안대로', 0], ['대안 채택', '검증 에이전트가 낸 답으로', 7], ['제3안', '둘 다 아닌 다른 후보로', 0], ['보류', '사람이 확인하도록 넘김', 0]];
  DECK.slide({
    id: 'c2-assign-arb', title: '판단이 다른 7개는 중재 에이전트가 정했다', chapter: CH_A, harness: 'assign',
    notes: '검증이 동의하지 않은 제목만 중재 에이전트(assignment-arbiter, opus)가 받는다. 두 의견과 후보 설명을 비교해 네 결정 가운데 하나를 고른다. 배정안 채택(처음 배정안이 맞다), 대안 채택(검증 에이전트가 낸 대안이 맞다), 제3안(둘 다 아니고 더 맞는 후보가 있다), 보류(제목만으로 정할 수 없다. 검토필요.csv로 넘겨 사람이 본문을 확인한다).\n시험 실행 t1에서는 7개가 모두 대안 채택이었다. 예: 제주운영단이 받은 「수용자 티웨이항공 탑승(호송) 협조 요청」은 배정 에이전트가 단위업무 보안검색관리까지만 정했고, 검증 에이전트는 철 F1601 보안검색 운영·감독 및 수준관리를 골랐다. 중재 에이전트는 경쟁 후보가 다른 단위업무에 속해 단위업무로 올려도 정해지지 않는다는 이유로 검증 쪽 답을 채택했다.\n출처: kac-record-assign/output/t1/배정결과.csv(배정근거 열의 [중재: 대안 채택]), _workspace/t1/arbitrate, .claude/agents/assignment-arbiter.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '제목 배정 · 중재', title: '판단이 다른 7개는 중재 에이전트가 정했다' });
      d.a = K.actor(root, { id: 'assignment-arbiter', job: '두 판단을 비교해 정한다', x: 150, y: 400, w: 250, jobW: 360 });
      d.svg = K.svg(root);
      const Y0 = 306, RH2 = 150, GAP = 16, RX = 680;
      d.rows = DEC.map((r, i) => {
        const y = Y0 + i * (RH2 + GAP), on = r[2] > 0;
        const c = K.at(root, 'card', { x: RX, y, w: 1120, h: RH2 });
        at(c, '', { x: 40, y: 26 }, r[0], 'font:900 46px/1.1 var(--display);letter-spacing:-0.03em');
        at(c, '', { x: 40, y: 92 }, r[1], 'font:600 30px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)');
        const n = at(c, 'num', { r: 96, y: 20 }, '0', `font:900 104px/1 var(--display);letter-spacing:-0.04em;color:${on ? 'var(--ok)' : 'rgba(27,42,74,.25)'}`);
        at(c, '', { r: 40, y: 78 }, '개', `font:800 36px/1 var(--sans);color:${on ? 'var(--ok)' : 'rgba(27,42,74,.25)'}`);
        const p = K.path(d.svg, [[430, 556], [540, 556], [540, y + RH2 / 2], [RX - 18, y + RH2 / 2]], { color: on ? C.warn : 'rgba(27,42,74,.22)', width: on ? 5 : 3, arrow: on, radius: 20 });
        if (on) K.dots(d.svg, p, 2, { r: 8, color: C.warn });
        return { c, n, p, v: r[2] };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.a.render(lt, 0.5);
      const L = K.loop(lt, 2.2, [3.5, 3.0]);
      if (lt > 2.1) d.a.act(lt, L.i === 0);
      d.rows.forEach((r, i) => {
        K.rise(r.c, lt, 0.7 + i * 0.12, { x: 30, y: 0 });
        K.draw(r.p, lt, 1.1 + i * 0.1, 0.5, { speed: 260 });
        K.count(r.n, lt, 1.3, 0.9, r.v);
        if (r.v) r.c.style.boxShadow = L.i === 0 && (L.u * 7) % 1 < 0.4 ? '0 0 0 6px rgba(25,169,116,.30)' : '';
      });
    },
  });

  // 틀린 철보다 미배정이 낫다
  DECK.slide({
    id: 'c2-assign-rule', title: '틀린 철보다 미배정이 낫다', chapter: CH_A, harness: 'assign',
    notes: '배정 에이전트의 작업 원칙 3이다. 원문: 「제목만으로 판단이 서지 않으면 억지로 기록물철을 고르지 않는다. 단위업무로 올려 배정하거나 미배정으로 두고 이유를 적는다. 틀린 기록물철 배정은 보존기간이 잘못 적용되는 결과로 이어지므로 미배정보다 손해가 크다.」(kac-record-assign/.claude/agents/record-assigner.md)\n화면의 문서는 시험 실행 t1의 실제 사례다. 제주운영단이 받은 「제주국제공항 시설물 지원 협조 요청」 5건은 어떤 시설물을 어떤 목적으로 쓰려는 협조인지 제목만으로 알 수 없어 미배정이 됐고, 미배정 유형은 모두 「제목 정보 부족」이다. 검증 에이전트도 이 판단에 동의했다.\n같은 이유로, 철을 정할 수 없지만 단위업무는 알 수 있으면 단위업무까지만 배정한다(판단 기준 record-assignment-rules).\n출처: kac-record-assign/output/t1/배정결과.csv, 요약.md(미배정 유형별 문서 수)',
    setup(root, d) {
      d.T = K.title(root, { kicker: '제목 배정 · 배정 원칙', title: '틀린 철보다 미배정이 낫다' });
      d.card = K.at(root, 'card', { x: 120, y: 312, w: 700, h: 150 });
      at(d.card, '', { x: 32, y: 24 }, '제주운영단이 받은 문서', 'font:600 26px/1.2 var(--sans);color:var(--mute)');
      at(d.card, '', { x: 32, y: 66 }, '제주국제공항 시설물 지원 협조 요청', 'font:800 38px/1.25 var(--sans);letter-spacing:-0.03em;white-space:nowrap');
      d.a = K.actor(root, { id: 'record-assigner', x: 150, y: 548, w: 270 });
      d.say = K.say(root, '어떤 시설물인지<br>제목만으로는 알 수 없습니다', { x: 440, y: 650 }, 'blue', 'l');
      d.say.style.fontSize = '30px'; d.say.style.padding = '14px 22px 15px';
      const pane = (y, lab, big, col) => {
        const c = K.at(root, 'card', { x: 1000, y, w: 800, h: 210 });
        c.style.borderWidth = '3px';
        at(c, '', { x: 40, y: 34 }, lab, 'font:700 32px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)');
        at(c, '', { x: 40, y: 92 }, big, `font:900 58px/1.15 var(--display);letter-spacing:-0.04em;white-space:nowrap;color:${col}`);
        return c;
      };
      d.pA = pane(312, '틀린 철에 넣으면', '보존기간이 잘못 적용된다', 'var(--bad)');
      d.pB = pane(552, '정할 수 없으면', '미배정으로 두고 이유를 적는다', 'var(--ink)');
      d.stamp = K.stampEl(root, '미배정', 'blue', { x: 1610, y: 566 });
      d.n = at(root, 'num', { x: 1000, y: 800, w: 110 }, '5', 'font:900 150px/1 var(--display);letter-spacing:-0.04em;color:var(--blue)');
      d.nc = at(root, '', { x: 1110, y: 870 }, '건을 미배정으로 두었다', 'font:800 40px/1.2 var(--sans);letter-spacing:-0.025em');
      d.nc2 = at(root, '', { x: 1560, y: 880 }, '문서 56건 중', 'font:600 28px/1.2 var(--sans);color:var(--mute)');
      d.svg = K.svg(root);
      d.x1 = K.path(d.svg, [[912, 478], [972, 538]], { color: C.bad, width: 9 });
      d.x2 = K.path(d.svg, [[972, 478], [912, 538]], { color: C.bad, width: 9 });
      d.tok = K.doc(root, '문서', { x: 0, y: 0 });
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.card, lt, 0.4, { y: 20 });
      d.a.render(lt, 0.7);
      K.rise(d.pA, lt, 0.9, { x: 30, y: 0 }); K.rise(d.pB, lt, 1.1, { x: 30, y: 0 });
      [d.n, d.nc, d.nc2].forEach((e, i) => K.rise(e, lt, 1.5 + i * 0.1, { y: 14 }));
      const L = K.loop(lt, 2.4, [0.8, 1.9, 1.5, 1.0, 2.6]), st = L.i, u = L.u;
      if (lt > 2.3) d.a.act(lt, st === 1);
      show(d.say, st >= 1 && (st > 1 || u > 0.2));
      const xo = st === 2 ? clamp((u - 0.35) / 0.1) : 0;
      d.x1.style.opacity = d.x2.style.opacity = String(xo);
      d.pA.style.borderColor = st === 2 && u > 0.35 ? C.bad : '';
      d.pB.style.borderColor = st === 4 ? C.blue : '';
      K.stamp(d.stamp, st === 4 ? 10 + u * 2.6 : lt, st === 4 ? 10.25 : 1.9, { rot: -6 });
      if (st === 4) d.stamp.style.opacity = '1';
      const A = [245, 486], T = [808, 484], B = [896, 566];
      if (st < 0) { d.tok.style.opacity = '0'; return; }
      if (st === 0) { K.travel(d.tok, u, 0, 1, [A[0], 440], A); d.tok.style.opacity = clamp(u / 0.3).toFixed(3); }
      else if (st === 1) K.travel(d.tok, 1, 0, 1, A, A);
      else if (st === 2) { const g = Math.sin(clamp(u) * Math.PI); K.travel(d.tok, g, 0, 1, A, T, { ease: ease.linear }); }
      else if (st === 3) K.travel(d.tok, u, 0, 1, A, B, { arc: 30 });
      else { K.travel(d.tok, 1, 0, 1, B, B); d.tok.style.opacity = clamp((1 - u) / 0.1).toFixed(3); }
    },
  });

  // 제목 배정의 결과
  const LV = [['기록물철까지', 41, C.blue, 'var(--blue)'], ['단위업무까지', 7, '#8CC2F2', '#3E86D8'], ['부서공통', 3, 'rgba(27,42,74,.45)', 'var(--ink-2)'], ['미배정', 5, '', 'var(--ink)']];
  DECK.slide({
    id: 'c2-assign-result', title: '문서 56건 중 41건을 기록물철까지 배정했다', chapter: CH_A, harness: 'assign',
    notes: '제목 배정 하네스의 시험 실행 t1 결과다. 판단한 제목 40개에 딸린 문서는 56건이다. 배정 수준별로 기록물철 41건, 단위업무 7건, 부서공통 3건, 미배정 5건이다. 단위업무 7건은 철을 정할 근거가 제목에 없어 단위업무까지만 배정한 것이고, 미배정 5건은 모두 「제목 정보 부족」이다.\n제목 기준으로는 40개가 모두 확정됐다(확정 33, 확정(중재) 7, 검토필요 0). 문서목록에는 정답이 없으므로 「확정」은 검증이 동의했거나 중재가 결정했다는 뜻이고, 사람이 맞다고 확인했다는 뜻은 아니다.\n범위 안 서로 다른 제목 14,299개 가운데 14,259개는 아직 판단하지 않았다.\n결과 파일: 배정결과.csv, 배정결과.xlsx, 검토필요.csv, 요약.md\n출처: kac-record-assign/output/t1/요약.md, 배정결과.csv',
    setup(root, d) {
      d.T = K.title(root, { kicker: '제목 배정 · 결과', title: '문서 56건 중 41건을 기록물철까지 배정했다' });
      d.sq = []; d.grp = [];
      let q = 0;
      LV.forEach((lv, gi) => { for (let i = 0; i < lv[1]; i++, q++) {
        d.sq.push(at(root, '', { x: 120 + (q % 28) * 60, y: 316 + Math.floor(q / 28) * 60, w: 48, h: 48 }, '', `border-radius:9px;box-sizing:border-box;${lv[2] ? 'background:' + lv[2] : 'border:4px dashed ' + C.ink}`));
        d.grp.push(gi);
      } });
      d.blk = LV.map((lv, i) => {
        const g = at(root, '', { x: 120 + i * 420, y: 462, w: 400 });
        const row = el('div', g, '', '', 'display:flex;align-items:baseline;gap:10px');
        const n = el('span', row, 'num', '0', `font:900 190px/1 var(--display);letter-spacing:-0.04em;color:${lv[3]}`);
        el('span', row, '', '건', `font:800 46px/1 var(--sans);color:${lv[3]}`);
        el('div', g, '', lv[0], 'font:800 44px/1.2 var(--sans);letter-spacing:-0.025em;margin-top:10px');
        const bar = el('div', g, '', '', `width:150px;height:9px;border-radius:5px;margin-top:16px;background:${lv[3]}`);
        return { g, n, bar, v: lv[1] };
      });
      d.foot = at(root, '', { x: 120, y: 864 }, '', 'display:flex;align-items:center;gap:16px');
      el('span', d.foot, '', '제목 40개', 'font:800 32px/1 var(--sans);letter-spacing:-0.02em;margin-right:8px');
      [['확정 33', 'ok'], ['확정(중재) 7', 'ok'], ['검토필요 0', 'warn']].forEach(([t, k]) => el('span', d.foot, 'chip lg ' + k, t, 'font-weight:800'));
    },
    render(lt, d) {
      d.T.render(lt);
      const L = K.loop(lt, 2.8, [1.5, 1.5, 1.5, 1.5, 2.6]), g = L.i >= 0 && L.i < 4 ? L.i : -1;
      d.sq.forEach((e, i) => {
        const a = K.pop(e, lt, 0.4 + i * 0.015);
        e.style.opacity = (a * (g < 0 || d.grp[i] === g ? 1 : 0.28)).toFixed(3);
      });
      d.blk.forEach((b, i) => {
        K.rise(b.g, lt, 1.0 + i * 0.15, { y: 20 });
        K.count(b.n, lt, 1.0 + i * 0.15, 0.9, b.v);
        b.bar.style.opacity = g === i ? '1' : '0';
      });
      K.rise(d.foot, lt, 1.9, { y: 12 });
    },
  });

  // 오분류 점검 챕터 영상
  DECK.slide({
    id: 'ch-audit', title: '오분류 점검 챕터 영상', bg: 'paper', harness: 'audit', video: 'media/ch_audit.mp4', poster: 'media/ch_audit.jpg',
    notes: '10초 챕터 영상. 필름 E 구간의 작업장(서랍 선반과 렌즈 두 개)이 움직이고, 질문 「이미 분류한 문서는 맞게 분류됐을까요?」에 kac-classification-audit이 답한다.\n같은 과제 「생산현황 분류 정정」의 둘째 하네스다. 사람이 이미 고른 분류가 맞는지 다시 판정해 정정안을 낸다. 끝나면 → 키로 넘긴다.',
  });

  // 기존 분류를 가리고 다시 분류한 뒤, 다르면 따진다
  procSlide({
    id: 'c2-audit-flow', title: '기존 분류를 가리고 다시 분류한 뒤, 다르면 따진다', kicker: '오분류 점검 · 진행 순서', chapter: CH_B, harness: 'audit',
    notes: '오분류 점검 하네스의 에이전트 세 개다. 다시 분류 에이전트(blind-classifier, sonnet)는 기존 분류를 보지 않고 제목과 후보만으로 분류한다. 스크립트 compare.py가 그 결과를 기존 분류와 맞춰 보고, 다른 것만 판정 에이전트(label-judge, opus)가 받아 기존 분류가 오류인지 정한다. 오류 판정은 반박 에이전트(correction-challenger, opus)가 기존 분류가 맞다는 근거를 찾아 반박한다. 반박 에이전트가 뒤집지 못한 판정만 정정 권고가 된다.\n기존 분류를 가리는 방법: 스크립트 make_batches.py가 묶음을 제목·후보만 담은 batches/ 폴더와 기존 분류·의심 신호를 담은 labels/ 폴더로 나누고, 다시 분류 에이전트는 labels/를 열지 않는다.\n화면의 문서는 시험 자료의 실제 행이다. 안전보안실 「2026년 건강검진 계획(안)」에 다른 부서 단위업무 「항공 산업 온실가스 감축 관리」가 붙어 있었고, 다시 분류와 판정 모두 F1410 임직원 건강검진을 골랐으며 반박은 실패했다.\n시험 실행 test01 전체: 점검한 묶음 100개 중 같음 29(유지), 다름 71 → 판정 오류 71 → 반박 실패 68(정정 권고), 반박 성공 1과 판단불가 2(사람 확인).\n출처: kac-classification-audit/.claude/skills/classification-audit/SKILL.md, output/test01/정정안.csv, _workspace/test01/compare·judge·challenge',
    doc: { dept: '안전보안실 문서', title: '2026년 건강검진 계획(안)', old: '항공 산업 온실가스 감축 관리', newLab: '정정안', neu: '임직원 건강검진', stamp: '정정 권고' },
    st: [
      { a: { id: 'blind-classifier', job: '기존 분류를 보지 않고<br>제목만으로 분류한다', w: 215 }, say: '제목만 보면 임직원 건강검진입니다', cls: 'blue', blind: true },
      { a: { id: 'label-judge', job: '기존 분류와 다르면<br>어느 쪽이 맞는지 정한다', w: 200 }, say: '기존 분류가 오류입니다', cls: 'warn' },
      { a: { id: 'correction-challenger', job: '기존 분류가 맞다는<br>근거를 찾아 반박한다', w: 200 }, say: '기존 분류가 맞다는 근거가 없습니다', cls: 'bad' },
    ],
  });

  // 왜 가리는가
  DECK.slide({
    id: 'c2-audit-why', title: '기존 분류를 먼저 보면 그 분류에 맞춰 판단하게 된다', chapter: CH_B, harness: 'audit',
    notes: '다시 분류 에이전트(blind-classifier)의 작업 원칙이다. 원문: 「기존 분류를 보지 않는다. labels/, compare/, judge/, challenge/ 폴더와 records.sqlite를 열지 않는다. 기존 분류를 보면 그 분류에 맞춰 판단하게 되어 비교의 의미가 없어진다.」\n그래서 스크립트 make_batches.py가 같은 묶음을 두 파일로 나눈다. batches/에는 문서 제목과 분류 후보만, labels/에는 기존 분류와 의심 신호를 넣는다. 다시 분류 에이전트는 batches/만 읽는다. 기존 분류와 맞춰 보는 일은 스크립트 compare.py가 한다.\n출처: kac-classification-audit/.claude/agents/blind-classifier.md, .claude/skills/classification-audit/SKILL.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '오분류 점검 · 기존 분류를 가리는 이유', title: '기존 분류를 먼저 보면 그 분류에 맞춰 판단하게 된다', size: 60 });
      const pane = (x, lab, col, items, bar) => {
        const c = K.at(root, 'card', { x, y: 336, w: 500, h: 500 });
        c.style.borderWidth = '3px'; c.style.borderColor = col;
        at(c, '', { x: 44, y: 44 }, lab, `font:800 40px/1.2 var(--sans);letter-spacing:-0.02em;color:${col}`);
        const its = items.map((t, i) => {
          const e = at(c, '', { x: 44, y: 160 + i * 150 }, '', 'font:900 70px/1.15 var(--display);letter-spacing:-0.04em;white-space:nowrap');
          const m = bar ? el('span', e, '', '×', `display:inline-block;margin-right:16px;font-family:var(--sans);font-weight:900;color:${C.bad}`) : null;
          el('span', e, '', t);
          return m;
        });
        return { c, its };
      };
      d.L = pane(120, '받는 것', OKD, ['문서 제목', '분류 후보'], false);
      d.R = pane(1300, '받지 않는 것', BADD, ['기존 분류', '의심 신호'], true);
      d.a = K.actor(root, { id: 'blind-classifier', x: 830, y: 420, w: 260 });
      d.svg = K.svg(root);
      d.p1 = K.path(d.svg, [[640, 580], [812, 580]], { color: C.ok, width: 6, arrow: true });
      d.p2 = K.path(d.svg, [[1280, 580], [1110, 580]], { color: 'rgba(27,42,74,.3)', width: 5, dash: '10 12' });
      d.blk = at(root, '', { x: 1186, y: 520, w: 14, h: 120 }, '', `background:${C.bad};border-radius:7px`);
      d.t1 = K.doc(root, '문서 제목', { x: 0, y: 0 }, 'ok');
      d.t2 = K.doc(root, '기존 분류', { x: 0, y: 0 }, 'bad');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.L.c, lt, 0.5, { x: -30, y: 0 }); K.rise(d.R.c, lt, 0.7, { x: 30, y: 0 });
      d.R.its.forEach((b, i) => K.pop(b, lt, 1.3 + i * 0.2, { from: 0.3 }));
      d.a.render(lt, 0.9);
      K.draw(d.p1, lt, 1.2, 0.4); K.draw(d.p2, lt, 1.4, 0.4);
      K.wipe(d.blk, lt, 1.6, 0.3, 'down');
      // 제목은 건너가고, 기존 분류는 막대에서 멈췄다가 돌아간다
      const L = K.loop(lt, 2.4, [1.5, 1.2, 1.7, 1.0]), st = L.i, u = L.u;
      if (lt > 2.3) d.a.act(lt, st === 1);
      if (st === 0) { K.travel(d.t1, u, 0, 1, [640, 500], [770, 500]); d.t1.style.opacity = Math.min(clamp(u / 0.2), clamp((1 - u) / 0.15)).toFixed(3); }
      else d.t1.style.opacity = '0';
      if (st === 2) { const g = Math.sin(clamp(u) * Math.PI); K.travel(d.t2, Math.min(1, g * 1.25), 0, 1, [1290, 500], [1215, 500], { ease: ease.linear }); d.t2.style.opacity = Math.min(clamp(u / 0.15), clamp((1 - u) / 0.15)).toFixed(3); }
      else d.t2.style.opacity = '0';
      d.blk.style.transform = `scaleY(${st === 2 && u > 0.3 && u < 0.7 ? 1.15 : 1})`;
    },
  });

  // 600건 → 의심 묶음 158개 → 이번에 점검한 100개
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
    id: 'c2-screen', title: '600건 가운데 의심 묶음 158개를 먼저 고른다', chapter: CH_B, harness: 'audit',
    notes: '점검 하네스는 모든 문서를 에이전트에 보내지 않는다. 스크립트 screen.py가 의심 신호로 점검할 묶음을 먼저 고른다.\n점 하나가 시험 자료 문서 한 건이다(5개 부서 × 120건). 부서·제목·기존 분류가 같은 문서를 한 묶음으로 보면 600건이 553 묶음이다. 그 가운데 의심 신호가 붙은 묶음이 158개(문서 179건, 서로 다른 제목 125개)이고 주황 점이 그 문서들이다.\n이번 시험 실행 test01에서는 그중 100 묶음(문서 121건)을 점검했다. 파란 테두리 점이 점검한 문서다. 여기에는 신호가 없는 대조 표본 제목 10개가 들어 있어, 주황이 아닌 점에도 파란 테두리가 있다. 아직 점검하지 않은 의심 제목은 65개다.\n출처: kac-classification-audit/_workspace/test01/screen_summary.json, output/test01/요약.md, 점검결과.csv. 점 자료는 _workspace/testdata/answer.csv와 records.sqlite의 groups 표, 점검결과.csv를 문서번호로 맞춰 만들었다.',
    setup(root, d) {
      d.T = K.title(root, { kicker: '오분류 점검 · 스크립트가 먼저 고른다', title: '600건 가운데 의심 묶음 158개를 먼저 고른다' });
      d.G = { pitch: 27, block: 336, r: 9 };
      d.ctx = cnv(root, 106, 346, 1660, 352);
      d.pos = DOCS.map((v, i) => {
        const b = Math.floor(i / 120), j = i % 120;
        return { x: 14 + b * d.G.block + (j % 10) * d.G.pitch + 13, y: 14 + Math.floor(j / 10) * d.G.pitch + 13, v };
      });
      d.dl = DEPTS.map((t, b) => at(root, '', { x: 120 + b * 336, y: 302 }, t, 'font:700 28px/1.2 var(--sans);letter-spacing:-0.02em'));
      const CH3 = [[600, '시험 자료 문서', '건', 'var(--ink)', 120], [158, '의심 묶음', '개', WAD, 720], [100, '이번에 점검한 묶음', '개', 'var(--blue)', 1320]];
      d.chain = CH3.map(r => {
        const g = at(root, '', { x: r[4], y: 706, w: 470 }, '', 'transform-origin:0 60%');
        const row = el('div', g, '', '', 'display:flex;align-items:baseline;gap:8px');
        const n = el('span', row, 'num', '0', `font:900 150px/1 var(--display);letter-spacing:-0.04em;color:${r[3]}`);
        el('span', row, '', r[2], `font:800 44px/1 var(--sans);color:${r[3]}`);
        el('div', g, '', r[1], `font:800 38px/1.2 var(--sans);letter-spacing:-0.025em;margin-top:6px;color:${r[3]}`);
        const bar = el('div', g, '', '', `width:150px;height:9px;border-radius:5px;margin-top:14px;background:${r[3]}`);
        return { g, n, bar, v: r[0] };
      });
      d.arr = [560, 1160].map(x => at(root, '', { x, y: 756 }, '→', 'font:700 76px/1 var(--sans);color:var(--mute)'));
    },
    render(lt, d) {
      d.T.render(lt);
      const ctx = d.ctx, G = d.G;
      ctx.clearRect(0, 0, 1660, 352);
      const sp = prog(lt, 1.0, 1.3, ease.linear), scanX = lerp(-10, 1670, sp);
      const L = K.loop(lt, 3.0, [1.7, 1.7, 2.2]), ph = L.i;   // 0: 문서 600건, 1: 의심 묶음, 2: 점검한 묶음
      d.pos.forEach((p, i) => {
        const b = Math.floor(i / 120), j = i % 120;
        const a = prog(lt, 0.3 + b * 0.06 + Math.floor(j / 10) * 0.02, 0.3, ease.pop);
        if (a <= 0) return;
        const flag = (p.v & 14) !== 0, chk = (p.v & 16) !== 0;
        let col;
        col = flag && p.x < scanX ? C.warn : ph === 0 ? 'rgba(27,42,74,.5)' : 'rgba(27,42,74,.22)';
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, (G.r + (ph === 1 && flag ? 2 : 0)) * a, 0, Math.PI * 2); ctx.fill();
        const ra = prog(lt, 2.2, 0.4);
        if (chk && ra > 0) { ctx.globalAlpha = ra; ctx.strokeStyle = C.blue; ctx.lineWidth = ph === 2 ? 4.5 : 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
      });
      if (sp > 0 && sp < 1) { ctx.fillStyle = C.blue; ctx.fillRect(scanX - 2, 0, 4, 352); }
      d.dl.forEach((e, i) => K.rise(e, lt, 0.3 + i * 0.06, { y: 8 }));
      d.chain.forEach((c, i) => {
        K.rise(c.g, lt, [0.8, 1.6, 2.0][i], { y: 16 });
        K.count(c.n, lt, [0.8, 1.6, 2.0][i], 0.9, c.v);
        c.bar.style.opacity = ph === i ? '1' : '0';
      });
      d.arr.forEach((e, i) => K.rise(e, lt, [1.5, 1.9][i], { x: -16, y: 0 }));
    },
  });

  // 의심 신호 네 가지
  const SIG = [['같은 제목인데 단위업무가 다름', 54], ['다른 단위업무와 제목이 더 비슷함', 132], ['그 부서의 단위업무가 아님', 63], ['기준표에 없는 분류 이름', 0]];
  DECK.slide({
    id: 'c2-signals', title: '스크립트가 신호 네 가지로 의심 묶음을 고른다', chapter: CH_B, harness: 'audit',
    notes: '스크립트 screen.py가 쓰는 의심 신호 네 가지와, 시험 자료에서 각 신호가 붙은 묶음 수다.\nS1(54 묶음): 같은 부서에서 숫자만 다른 제목이 서로 다른 단위업무에 나뉘어 있다.\nS2(132 묶음): 제목이 지금 붙은 단위업무보다 다른 단위업무와 글자 유사도가 0.15 이상 높다.\nS3(63 묶음): 붙은 단위업무가 부서 대응표로 볼 때 그 부서의 단위업무가 아니다.\nS4(0 묶음): 기존 분류 이름이 분류기준표에 없다. 시험 자료는 기준표의 이름으로 만들었기 때문에 0이다.\n한 묶음에 신호가 여러 개 붙을 수 있어 합계(249)는 의심 묶음 158개보다 크다. 막대 길이는 의심 묶음 158개에 대한 비율이다.\n출처: kac-classification-audit/_workspace/test01/screen_summary.json(신호별_묶음수), .claude/skills/classification-audit/SKILL.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '오분류 점검 · 의심 신호', title: '스크립트가 신호 네 가지로 의심 묶음을 고른다' });
      d.a = K.actor(root, { kind: 'script', name: '스크립트', job: '의심 묶음을 고른다', x: 150, y: 450, w: 240, jobW: 320 });
      d.rows = SIG.map((r, i) => {
        const g = at(root, '', { x: 520, y: 304 + i * 166, w: 1280, h: 150 }, '', 'border-radius:16px');
        at(g, '', { x: 28, y: 22 }, r[0], 'font:800 42px/1.2 var(--sans);letter-spacing:-0.03em;white-space:nowrap');
        at(g, '', { x: 28, y: 92, w: 900, h: 30 }, '', 'border-radius:6px;background:rgba(27,42,74,.08)');
        const b = at(g, '', { x: 28, y: 92, h: 30 }, '', `border-radius:6px;background:${C.warn}`);
        const n = at(g, 'num', { r: 130, y: 18 }, '0', `font:900 110px/1 var(--display);letter-spacing:-0.04em;color:${r[1] ? WAD : 'rgba(27,42,74,.28)'}`);
        at(g, '', { r: 28, y: 82 }, '묶음', `font:800 36px/1 var(--sans);color:${r[1] ? WAD : 'rgba(27,42,74,.28)'}`);
        return { g, b, n, v: r[1] };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.a.render(lt, 0.5);
      const L = K.loop(lt, 2.6, [1.6, 1.6, 1.6, 1.6]);
      if (lt > 2.3) d.a.act(lt, L.i >= 0 && L.u < 0.5);
      d.rows.forEach((r, i) => {
        K.rise(r.g, lt, 0.7 + i * 0.14, { x: 30, y: 0 });
        K.count(r.n, lt, 1.0 + i * 0.14, 0.9, r.v);
        K.bar(r.b, lt, 1.0 + i * 0.14, r.v / 158, 900, 0.8);
        K.mark(r.g, L.i === i, 'rgba(232,147,12,.13)');
      });
    },
  });

  // 넣어 둔 오류 128건 중 125건에 신호가 붙었다
  const MISS = new Set();
  { let q = 0; DOCS.forEach(v => { if (v & 1) { if (!(v & 14)) MISS.add(q); q++; } }); }
  DECK.slide({
    id: 'c2-recall', title: '넣어 둔 오류 128건 중 125건에 신호가 붙었다', chapter: CH_B, harness: 'audit',
    notes: '시험 자료에는 일부러 틀리게 바꾼 문서가 128건 들어 있다(같은 부서의 다른 단위업무로 바꾼 것 65건, 다른 부서 단위업무로 바꾼 것 63건). 정답 파일 answer.csv는 에이전트에게 주지 않았다.\n스크립트 screen.py의 의심 신호는 그 128건 중 125건에 붙었다. 넣어 둔 오류 중 찾아낸 비율이 97.7%다. 놓친 3건은 모두 같은 부서의 다른 단위업무로 바꾼 문서다. 오류를 넣지 않은 문서 472건 중에서도 54건(11.4%)에 신호가 붙었다.\n주의할 점: 시험 자료의 기본 분류를 글자 유사도로 붙였고 신호 S2도 같은 유사도를 쓴다. 실제 자료에서는 이 비율이 더 낮게 나올 수 있다. 그래서 실제 점검에서는 신호가 없는 대조 표본을 함께 넣어 놓친 오류를 확인한다(test01의 대조 표본 제목 10개: 유지 8, 정정 권고 2).\n점 128개에서 빈 점 3개의 자리는 시험 자료 순서에서 실제로 놓친 문서의 자리다.\n출처: kac-classification-audit/scripts/evaluate.py test01 실행 결과, _workspace/testdata/answer.csv, output/test01/요약.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '오분류 점검 · 정답과 비교', title: '넣어 둔 오류 128건 중 125건에 신호가 붙었다' });
      d.dots = [];
      for (let i = 0; i < 128; i++) d.dots.push(at(root, '', { x: 120 + (i % 16) * 60, y: 336 + Math.floor(i / 16) * 60, w: 44, h: 44 }, '', `border-radius:50%;box-sizing:border-box;border:5px solid ${C.bad}`));
      const sw = (st) => `<span style="display:inline-block;width:30px;height:30px;border-radius:50%;box-sizing:border-box;border:4px solid ${C.bad};vertical-align:-5px;margin-right:12px;${st}"></span>`;
      d.lg = at(root, '', { x: 120, y: 846 }, `${sw('background:' + C.warn)}신호가 붙음 <b class="num">125</b>건<span style="display:inline-block;width:56px"></span>${sw('')}놓침 <b class="num">3</b>건`, 'font:700 34px/1.2 var(--sans);letter-spacing:-0.02em');
      d.pct = at(root, 'num', { x: 1140, y: 430, w: 660 }, '0%', 'font:900 196px/1 var(--display);letter-spacing:-0.05em;color:var(--ok)');
      d.pl = at(root, '', { x: 1160, y: 670, w: 660 }, '넣어 둔 오류 중 찾아낸 비율', 'font:800 44px/1.2 var(--sans);letter-spacing:-0.03em');
      d.pn = at(root, '', { x: 1160, y: 744, w: 640 }, '시험 자료 기준. 실제 자료에서는 더 낮을 수 있다', 'font:600 28px/1.35 var(--sans);letter-spacing:-0.02em;color:var(--mute)');
    },
    render(lt, d) {
      d.T.render(lt);
      const done = Math.floor(prog(lt, 1.2, 1.2, ease.linear) * 128);
      const pulse = lt > 2.8 && (lt - 2.8) % 2.4 < 1.2;
      d.dots.forEach((e, i) => {
        K.pop(e, lt, 0.4 + i * 0.008);
        e.style.background = i < done && !MISS.has(i) ? C.warn : 'transparent';
        e.style.boxShadow = pulse && MISS.has(i) ? '0 0 0 7px rgba(232,72,58,.28)' : 'none';
      });
      K.rise(d.pn, lt, 1.8, { y: 10 });
      K.rise(d.lg, lt, 1.6, { y: 12 });
      K.rise(d.pct, lt, 1.2, { y: 20 }); K.count(d.pct, lt, 1.2, 1.1, 97.7, { decimals: 1, suffix: '%' });
      K.rise(d.pl, lt, 1.5, { y: 12 });
    },
  });

  // 정답과 비교: 2×3 칸
  const CELL = [[65, 0, 2], [5, 48, 1]];
  DECK.slide({
    id: 'c2-truth', title: '시험용으로 넣어 둔 오류 67건 중 65건을 정정 권고했다', chapter: CH_B, harness: 'audit',
    notes: '점검한 문서 121건(100 묶음)을 시험 자료의 정답과 맞춰 본 표다. 칸의 점 하나가 문서 한 건이다. 121건에는 시험용으로 넣어 둔 오류 67건과 정상 문서 54건이 들어 있다.\n넣어 둔 오류 67건: 정정 권고 65, 유지 0, 사람 확인 2. 기존 분류를 그대로 둔 것은 없다. 정정안 65건 가운데 63건은 오류를 넣기 전의 단위업무와 같다. 사람 확인 2건은 반박 에이전트가 판단불가로 둔 것이다.\n정상 문서 54건: 정정 권고 5, 유지 48, 사람 확인 1. 정정 권고 5건은 모두 같은 단위업무 안에서 철만 바꾼 것이다. 시험 자료가 단위업무의 첫 번째 철 이름을 붙였기 때문에 생긴 철 오류라서 잘못 짚은 것이라고 단정할 수 없다. 사람 확인 1건은 반박 에이전트가 기존 분류의 근거를 찾은 것이다.\n합계는 정정 권고 70건, 유지 48건, 사람 확인 3건이다.\n시험 자료는 스크립트 make_testdata.py가 만들었다. 문서목록에서 5개 부서의 2026년 생산 문서를 부서마다 120건 고르고, 그 부서 단위업무 가운데 제목과 글자가 가장 비슷한 것을 기본 분류로 붙였다(유사도 0.25 이상인 제목만). 사람이 확인한 정답이 아니다. 그중 128건을 다른 단위업무로 바꿨다(같은 부서 65, 다른 부서 63). 정답 파일 answer.csv는 에이전트에게 주지 않았다. 의심 제목 65개와 신호 없는 문서 대부분은 이번에 점검하지 않았다.\n출처: kac-classification-audit/scripts/evaluate.py test01 실행 결과, output/test01/요약.md, 점검결과.csv, _workspace/testdata/answer.csv',
    setup(root, d) {
      d.T = K.title(root, { kicker: '오분류 점검 · 정답과 비교', title: '시험용으로 넣어 둔 오류 67건 중 65건을 정정 권고했다', size: 60 });
      const CX = [480, 930, 1380], RY = [376, 676], CW = 420, RH2 = 280, COL = [BADD, OKD, WAD];
      d.cols = ['정정 권고', '유지', '사람 확인'].map((t, i) => at(root, '', { x: CX[i] + 4, y: 314 }, t, `font:800 38px/1.2 var(--sans);letter-spacing:-0.025em;color:${COL[i]}`));
      d.rows = [['넣어 둔 오류', '점검 67건'], ['정상 문서', '점검 54건']].map((r, i) => {
        const g = at(root, '', { x: 120, y: RY[i] + 70, w: 340 });
        el('div', g, '', r[0], 'font:800 44px/1.2 var(--sans);letter-spacing:-0.03em');
        el('div', g, '', r[1], 'font:600 32px/1.2 var(--sans);color:var(--mute);margin-top:8px');
        return g;
      });
      d.cells = [];
      CELL.forEach((row, ri) => row.forEach((v, ci) => {
        const e = K.at(root, 'card flat', { x: CX[ci], y: RY[ri], w: CW, h: RH2 });
        const n = at(e, 'num', { x: 30, y: 18 }, '0', `font:900 130px/1 var(--display);letter-spacing:-0.04em;color:${v ? COL[ci] : 'rgba(27,42,74,.25)'}`);
        d.cells.push({ e, n, v, ri, ci });
      }));
      d.ring = at(root, '', { x: 0, y: 0, w: CW + 16, h: RH2 + 16 }, '', `border:5px solid ${C.blue};border-radius:22px;box-sizing:border-box;opacity:0`);
      d.st = K.stampEl(root, '유지 0건', 'ok', { x: CX[1] + 190, y: RY[0] + 60 });
      d.ctx = cnv(root, 100, 300, 1720, 680);
      d.dots = [];
      let q = 0;
      CELL.forEach((row, ri) => row.forEach((v, ci) => {
        for (let i = 0; i < v; i++, q++) {
          const tx = CX[ci] + 36 + (i % 22) * 17 - 100, ty = RY[ri] + 186 + Math.floor(i / 22) * 17 - 300;
          d.dots.push({ tx, ty, sx: 60 + K.rand(q, 3) * 240, sy: RY[ri] + 60 + K.rand(q, 5) * 120 - 300, t0: 0.9 + K.rand(q, 9) * 1.3, c: [C.bad, C.ok, C.warn][ci], cell: ri * 3 + ci });
        }
      }));
      d.CX = CX; d.RY = RY;
    },
    render(lt, d) {
      d.T.render(lt);
      d.cols.forEach((e, i) => K.rise(e, lt, 0.45 + i * 0.08, { y: 10 }));
      d.rows.forEach((e, i) => K.rise(e, lt, 0.55 + i * 0.1, { x: -16, y: 0 }));
      d.cells.forEach((c, i) => K.rise(c.e, lt, 0.6 + i * 0.06, { y: 14, blur: 0 }));
      const ctx = d.ctx;
      ctx.clearRect(0, 0, 1720, 680);
      const got = [0, 0, 0, 0, 0, 0];
      d.dots.forEach(p => {
        const u = prog(lt, p.t0, 0.55, ease.inOutCubic);
        if (u >= 1) got[p.cell]++;
        if (u <= 0) return;
        const x = lerp(p.sx, p.tx, u), y = lerp(p.sy, p.ty, u) - Math.sin(u * Math.PI) * 40;
        ctx.globalAlpha = Math.min(1, u * 3);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      d.cells.forEach((c, i) => { c.n.textContent = String(got[i]); });   // 칸에 도착한 점 수
      K.stamp(d.st, lt, 2.8, { rot: -8 });
      // 머무는 동안: 칸을 차례로 짚는다
      const k = K.cycle(lt, 3.2, 1.6, 6);
      if (k < 0) { d.ring.style.opacity = '0'; return; }
      const loc = (lt - 3.2) % 1.6;
      d.ring.style.left = (d.CX[k % 3] - 8) + 'px'; d.ring.style.top = (d.RY[Math.floor(k / 3)] - 8) + 'px';
      d.ring.style.opacity = Math.min(prog(loc, 0, 0.2), 1 - prog(loc, 1.4, 0.2, ease.exit)).toFixed(3);
    },
  });

  // 정정 사례 1: 같은 단위업무 안에서 철이 틀린 문서
  procSlide({
    id: 'c2-fix-cases', title: '반박 에이전트가 뒤집지 못한 판정만 정정 권고가 된다', size: 60, kicker: '오분류 점검 · 정정 사례 1', chapter: CH_B, harness: 'audit',
    notes: '정정안.csv의 실제 행이다. 인사혁신실 「비밀취급 인가 알림」 3건에는 단위업무 일반보안의 철 「비밀·대외비 현황」이 붙어 있었다. 시험용으로 오류를 넣은 문서가 아니라, 시험 자료가 붙인 철 이름이 틀린 문서다.\n스크립트 screen.py가 신호 S1을 붙였다(같은 부서의 같은 제목이 단위업무 2개에 나뉘어 있고 이 분류의 비중은 80%).\n다시 분류 에이전트(blind-classifier)는 F0002 비밀취급 인가·해제를 확신도 높음으로 골랐다.\n판정 에이전트(label-judge)는 오류로 판정했다. 기존 철은 비밀문서 보유현황·암호자재 운용·비밀관리 실태를 다뤄 인가 업무를 담지 않는다는 이유다.\n반박 에이전트(correction-challenger)는 반박에 실패했다. 정정안 철의 설명에 「직원별 비밀취급 인가 신청·승인·해제」가 적혀 있어 정정안이 더 맞다고 보았다.\n같은 제목 5건 가운데 이 3건과 직원식당 운영관리에 넣은 1건(시험용 오류)은 정정 권고가 됐고, 일반보안 단위업무만 붙은 1건은 유지됐다.\n출처: kac-classification-audit/output/test01/정정안.csv, 점검결과.csv, _workspace/testdata/answer.csv',
    doc: { dept: '인사혁신실 문서 3건', title: '비밀취급 인가 알림', oldLab: '기존 철', old: '비밀·대외비 현황', newLab: '정정안', neu: '비밀취급 인가·해제', stamp: '정정 권고' },
    base: 856, w: 230,
    st: [
      { a: { kind: 'script', name: '스크립트' }, say: '같은 제목이 단위업무 2개에 나뉘어 있습니다', cls: 'ink' },
      { a: { id: 'blind-classifier' }, say: '비밀취급 인가·해제 철입니다', cls: 'blue', blind: true },
      { a: { id: 'label-judge' }, say: '기존 철은 인가 업무를 담지 않습니다', cls: 'warn' },
      { a: { id: 'correction-challenger' }, say: '기존 철이 맞다는 근거가 없습니다', cls: 'bad' },
    ],
  });

  // 정정 사례 2: 다른 부서 단위업무가 붙은 문서
  procSlide({
    id: 'c2-fix-case2', title: '다른 부서 단위업무가 붙은 감사 문서를 찾아 정정했다', size: 60, kicker: '오분류 점검 · 정정 사례 2', chapter: CH_B, harness: 'audit',
    notes: '정정안.csv의 실제 행이다. 감사실 「감사결과 처분요구사항 통보(2026년도 공직기강 특별감사 및 직무감찰)」 1건은 시험용으로 넣어 둔 오류다. 다른 부서(경영관리실 자산계약부)의 단위업무 물품계약관리로 바꿔 넣었다.\n스크립트 screen.py가 신호 두 개를 붙였다. S2: 제목과 기존 단위업무의 유사도 0.01, 다른 단위업무(공직기강·감찰관리)와는 0.39. S3: 기존 단위업무가 부서 대응표로 볼 때 감사실의 단위업무가 아니다.\n다시 분류 에이전트(blind-classifier)는 F0220 감사처분 조치이행관리를 확신도 보통으로 골랐다.\n판정 에이전트(label-judge)는 기존 분류를 오류로 판정하면서 정정안은 F0237 공직기강·복무감찰로 골랐다. 제목 괄호 안의 「공직기강 특별감사 및 직무감찰」이 근거이고 F0220은 차순위로 두었다. 다시 분류한 결과를 그대로 받지 않은 사례다.\n반박 에이전트(correction-challenger)는 반박에 실패했다. 물품계약관리의 두 철은 구매·입찰·납품·대금 지급만 다뤄 감사결과 통보를 담을 수 없다고 보았다. F0237은 오류를 넣기 전의 단위업무(공직기강·감찰관리)에 속한다.\n출처: kac-classification-audit/output/test01/정정안.csv, 점검결과.csv, _workspace/testdata/answer.csv',
    doc: { dept: '감사실 문서 1건', title: '감사결과 처분요구사항 통보(2026년도 공직기강 특별감사 및 직무감찰)', oldLab: '기존 단위업무', old: '물품계약관리', newLab: '정정안', neu: '공직기강·복무감찰', stamp: '정정 권고' },
    base: 856, w: 230,
    st: [
      { a: { kind: 'script', name: '스크립트' }, say: '감사실의 단위업무가 아닙니다', cls: 'ink' },
      { a: { id: 'blind-classifier' }, say: '감사처분 조치이행관리 철입니다', cls: 'blue', blind: true },
      { a: { id: 'label-judge' }, say: '공직기강·복무감찰 철이 더 맞습니다', cls: 'warn' },
      { a: { id: 'correction-challenger' }, say: '물품계약 업무로는 볼 수 없습니다', cls: 'bad' },
    ],
  });

  // 오분류 점검의 결과
  const FIN3 = [['정정 권고', 68, 70, C.bad, BADD], ['유지', 29, 48, C.ok, OKD], ['사람 확인', 3, 3, C.warn, WAD]];
  DECK.slide({
    id: 'c2-audit-result', title: '점검한 묶음 100개 중 68개에 정정 권고를 냈다', chapter: CH_B, harness: 'audit',
    notes: '오분류 점검 하네스의 시험 실행 test01 결과다. 점검한 묶음(제목·기존 분류 단위) 100개, 문서 121건의 최종 구분은 정정 권고 68 묶음(문서 70건), 유지 29 묶음(문서 48건), 사람 확인 3 묶음(문서 3건)이다. 요약.md에는 「사람 확인 필요」로 적혀 있다.\n진행: 다시 분류한 결과가 기존 분류와 같은 29 묶음은 유지, 다른 71 묶음은 판정 에이전트가 모두 오류로 판정했고, 반박 에이전트가 뒤집지 못한 68 묶음이 정정 권고, 반박 성공 1과 판단불가 2가 사람 확인이 됐다.\n아직 점검하지 않은 의심 제목이 65개 남아 있다. 의심 신호가 없는 문서는 점검하지 않았고, 이 문서들에 오류가 없다는 뜻이 아니다. 대조 표본(신호 없는 제목 10개)에서는 유지 8, 정정 권고 2가 나왔다. 대조 표본에서 정정 권고가 나오면 screen.py의 기준을 낮춰 다시 고른다.\n결과 파일: 정정안.csv, 사람확인.csv, 점검결과.csv, 요약.md. 정정안은 권고이고, 실제로 고치는 일은 사람이 검토한 뒤에 한다.\n출처: kac-classification-audit/output/test01/요약.md, _workspace/test01/compare·judge·challenge',
    setup(root, d) {
      d.T = K.title(root, { kicker: '오분류 점검 · 결과', title: '점검한 묶음 100개 중 68개에 정정 권고를 냈다' });
      d.sq = []; d.grp = [];
      let q = 0;
      FIN3.forEach((f, gi) => { for (let i = 0; i < f[1]; i++, q++) {
        d.sq.push(at(root, '', { x: 120 + (q % 50) * 33.6, y: 316 + Math.floor(q / 50) * 34, w: 27, h: 27 }, '', `border-radius:6px;background:${f[3]}`));
        d.grp.push(gi);
      } });
      d.blk = FIN3.map((f, i) => {
        const g = at(root, '', { x: [120, 760, 1340][i], y: 420, w: 560 });
        const row = el('div', g, '', '', 'display:flex;align-items:baseline;gap:10px');
        const n = el('span', row, 'num', '0', `font:900 230px/1 var(--display);letter-spacing:-0.05em;color:${f[3]}`);
        el('span', row, '', '개', `font:800 56px/1 var(--sans);color:${f[4]}`);
        el('div', g, '', f[0], `font:900 50px/1.2 var(--display);letter-spacing:-0.03em;margin-top:8px;color:${f[4]}`);
        el('div', g, '', `문서 ${f[2]}건`, 'font:600 32px/1.2 var(--sans);color:var(--mute);margin-top:10px');
        const bar = el('div', g, '', '', `width:170px;height:10px;border-radius:5px;margin-top:18px;background:${f[3]}`);
        return { g, n, bar, v: f[1] };
      });
      d.foot = at(root, '', { x: 120, y: 912 }, `아직 점검하지 않은 의심 제목 <b class="num">65</b>개`, `font:700 34px/1.2 var(--sans);letter-spacing:-0.02em;color:${WAD}`);
    },
    render(lt, d) {
      d.T.render(lt);
      const L = K.loop(lt, 2.8, [1.6, 1.6, 1.6, 2.6]), g = L.i >= 0 && L.i < 3 ? L.i : -1;
      d.sq.forEach((e, i) => {
        const a = K.pop(e, lt, 0.4 + i * 0.008);
        e.style.opacity = (a * (g < 0 || d.grp[i] === g ? 1 : 0.25)).toFixed(3);
      });
      d.blk.forEach((b, i) => {
        K.rise(b.g, lt, 1.0 + i * 0.18, { y: 20 });
        K.count(b.n, lt, 1.0 + i * 0.18, 0.9, b.v);
        b.bar.style.opacity = g === i ? '1' : '0';
      });
      K.rise(d.foot, lt, 2.0, { y: 12 });
    },
  });
})();

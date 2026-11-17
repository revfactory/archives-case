/* 맺음 — 사람이 정할 것(s02 의 h-human 이 place 로 이 앞에 온다), 다섯 하네스 정리, 한계, 다음 단계, 맺음. 맺음 장은 표지(필름 엔드카드)의 건물로 돌아간다. */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css } = RH;
  const C = K.C;
  const CH = '맺음';
  const T = (root, html, x, y, st, w) => { const e = K.at(root, '', { x, y, w }, html); e.style.cssText += ';' + st; return e; };

  // 다섯 하네스 정리: 받는 것 → 내는 것 → 사람이 정하는 것
  DECK.slide({
    id: 'summary', title: '다섯 하네스 모두 마지막에는 사람이 정한다', chapter: CH,
    notes: '다섯 하네스를 받는 것, 내는 것, 사람이 정하는 것으로 정리했다. 공통점은 하네스가 결과 파일과 근거를 남기고, 반영 여부는 사람이 정한다는 점이다.\n제목 배정(kac-record-assign): 문서 제목(부서·연도 조건)을 받아 배정 · 검증 · 중재 에이전트 3개가 배정결과.csv · 배정결과.xlsx · 검토필요.csv 를 낸다. 사람은 검토필요·미배정 문서를 확인한다.\n오분류 점검(kac-classification-audit): 분류가 붙은 생산현황을 받아 다시 분류 · 판정 · 반박 에이전트 3개가 정정안.csv · 사람확인.csv 를 낸다. 사람은 정정 권고를 반영할지 정하고 사람 확인 건을 판정한다.\n단위업무명 추천(kac-unit-task-naming): 부서 생산현황을 받아 묶음 해석 · 이름 제안 · 검토 에이전트 3개가 단위업무_제안표.csv · .xlsx 를 낸다. 사람은 이름 변경·통합을 받아들일지, 보류한 묶음을 어떻게 할지 정한다.\n조직 변경 영향(kac-org-change-impact): 조직변경 시나리오를 받아 변경 해석 · 영향 분석 · 검증 · 보고서 에이전트 4개가 영향도_보고서.md · 분류기준표_변경안.csv 를 낸다. 사람은 이관 범위, 부서 거취, 부 이름을 정한다.\n조직 개편 추천(kac-org-strategy): 전략 방향 한 문장을 받아 진단 · 규정 확인 · 대안 설계 · 반박 · 보고서 에이전트 5개가 조직개편_추천보고서.md 를 낸다. 경영진이 결정할 것은 6가지다.\n결과 파일 위치: 각 하네스 폴더의 output/ 아래.',
    setup(root, d) {
      d.T = K.title(root, { kicker: '정리', title: '다섯 하네스 모두 마지막에는 사람이 정한다' });
      const X = [120, 470, 880, 1330], HD = ['하네스', '받는 것', '내는 것', '사람이 정하는 것'];
      d.hd = HD.map((t, i) => T(root, t, X[i] + (i ? 0 : 6), 290, `font:700 28px/1 var(--sans);color:${i === 3 ? 'var(--ink)' : 'var(--mute)'}`));
      d.rule = K.at(root, '', { x: 120, y: 334, w: 1680, h: 3 }); d.rule.style.background = C.ink;
      // 필름과 같은 순서
      const rows = [
        ['assign', '문서 제목', '철 배정 결과표', '검토필요·미배정 문서'],
        ['audit', '이미 분류한 문서목록', '정정안', '정정 권고를 반영할지'],
        ['naming', '부서의 문서목록', '단위업무 제안표', '이름 변경·통합을 받아들일지'],
        ['orgchange', '조직 변경 시나리오', '영향도 보고서, 기준표 변경안', '이관 범위, 부서 이름'],
        ['strategy', '전략 방향 한 문장', '조직 개편 추천 보고서', '경영진 결정 6가지'],
      ];
      d.svg = K.svg(root);
      d.rows = rows.map((r, i) => {
        const y = 350 + i * 122;
        const row = K.at(root, '', { x: 100, y, w: 1720, h: 112 }); row.style.borderRadius = '16px';
        const chip = K.hchip(row, r[0], { x: 20, y: 28 }); chip.style.fontSize = '32px';
        const cell = (t, x, st) => T(row, t, x - 100, 0, 'height:112px;display:flex;align-items:center;font:700 32px/1.25 var(--sans);letter-spacing:-0.03em;color:var(--ink-2);' + (st || ''), 0);
        const a = cell(r[1], X[1]); a.style.width = '340px';
        const b = cell(r[2], X[2]); b.style.width = '370px';
        const c = cell(r[3], X[3], 'font-weight:800;color:var(--ink)'); c.style.width = '470px';
        const cy = y + 56;
        const p1 = K.path(d.svg, [[X[2] - 62, cy], [X[2] - 22, cy]], { color: K.HZ[r[0]].c, width: 4, arrow: true });
        const p2 = K.path(d.svg, [[X[3] - 62, cy], [X[3] - 22, cy]], { color: K.HZ[r[0]].c, width: 4, arrow: true });
        return { row, a, b, c, p1, p2 };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.hd.forEach((e, i) => K.rise(e, lt, 0.4 + i * 0.06, { y: 8 }));
      K.wipe(d.rule, lt, 0.5, 0.6);
      d.rows.forEach((r, i) => {
        const t0 = 0.7 + i * 0.14;
        K.rise(r.row, lt, t0, { y: 16, blur: 4 });
        K.draw(r.p1, lt, t0 + 0.3, 0.3); K.draw(r.p2, lt, t0 + 0.45, 0.3);
      });
      // 한 줄씩: 받는 것 → 내는 것 → 사람이 정하는 것 순서로 짚는다
      const L = K.loop(lt, 2.6, Array(5).fill(2.1));
      d.rows.forEach((r, i) => {
        const on = L.i === i, st = on ? Math.min(2, Math.floor(L.u * 3)) : -1;
        K.mark(r.row, on, 'rgba(27,42,74,.06)');
        [r.a, r.b, r.c].forEach((e, j) => { e.style.opacity = L.i < 0 || !on || j <= st ? '1' : '0.28'; });
      });
    },
  });

  // 한계
  DECK.slide({
    id: 'limits', title: '이번 결과에는 한계가 네 가지 있다', chapter: CH,
    notes: '한계를 먼저 말씀드린다.\n첫째, 하네스는 문서 제목만 보고 판단한다. 문서목록에는 본문·첨부가 없다. 제목이 짧으면 미배정·사람 확인으로 남긴다.\n둘째, 시험 규모가 작다. 제목 배정은 제목 40개(문서 56건), 오분류 점검은 문서 600건(시험용으로 넣어 둔 오류 128건)으로 시험했다.\n셋째, 생산현황 문서 535,148건은 분류기준표에 없는 부서가 만들었다. 다른 공항 기준표를 적용한 부서 522,546건, 없어진 부서(현재 부서로 추정) 12,185건, 적용 대상이 아닌 부서 417건이다.\n넷째, 조직 개편 추천안은 인원·예산 자료가 없어 「별도 산정 필요」로 남겼다.\n출처: kac-record-assign/output/t1/요약.md, kac-classification-audit/output/test01/요약.md, kac-shared/data/dept_map.json, kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '남은 일', title: '이번 결과에는 한계가 네 가지 있다' });
      const big = 'font:900 104px/1 var(--display);letter-spacing:-0.04em;color:var(--warn);white-space:nowrap';
      const unit = 'font-size:54px;color:var(--ink);margin-left:4px';
      const sm = 'font:700 30px/1 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);margin-left:12px;margin-right:36px';
      const L = [
        [`<span style="${big}">제목만</span>`, '본문과 첨부는 보지 않았다'],
        [`<span class="num" style="${big}">40<span style="${unit}">개</span></span><span style="${sm}">제목</span><span class="num" style="${big}">600<span style="${unit}">건</span></span><span style="${sm}">문서</span>`, '시험한 양이 적다'],
        [`<span class="num" style="${big}">535,148<span style="${unit}">건</span></span>`, '분류기준표에 없는 부서의 문서'],
        [`<span style="${big}">인원·예산</span>`, '자료가 없어 계산하지 않았다'],
      ];
      d.cards = L.map((it, i) => {
        const c = K.at(root, 'card', { x: 120 + (i % 2) * 860, y: 300 + Math.floor(i / 2) * 330, w: 820, h: 300 });
        const a = h('div', '', c, it[0]); a.style.cssText = 'position:absolute;left:44px;top:54px;white-space:nowrap;display:flex;align-items:baseline';
        const b = h('div', '', c, it[1]); b.style.cssText = 'position:absolute;left:46px;top:192px;font:700 42px/1.2 var(--sans);letter-spacing:-0.03em;color:var(--ink)';
        return c;
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.cards.forEach((c, i) => K.rise(c, lt, 0.6 + i * 0.18, { y: 22 }));
      // 한계를 차례로 짚는다
      const k = K.cycle(lt, 2.6, 1.6, 4);
      d.cards.forEach((c, i) => {
        if (lt > 2.4) c.style.transform = `translateY(${k === i ? -8 : 0}px)`;
        RH.set(c, 'boxShadow', k === i ? '0 0 0 5px ' + C.warn : '0 18px 40px -24px rgba(27,42,74,.30)');
      });
    },
  });

  // 다음 단계
  DECK.slide({
    id: 'limits-2', title: '다음에는 세 가지를 한다', chapter: CH,
    notes: '다음 단계는 세 가지다.\n첫째, 남은 제목을 이어서 배정한다. 감사실·제주운영단 2026년의 남은 고유 제목이 14,259개이고, 그다음은 다른 부서·연도다.\n둘째, 사람이 확인한 결과를 규칙에 반영한다. 검토필요·사람 확인 건을 사람이 판정하면 그 결과를 규칙 스킬에 넣는다.\n셋째, 분류기준표를 고친 뒤 같은 하네스를 다시 실행한다. 비상계획실의 이름이 빈 34행, 다른 공항 기준표를 적용한 부서의 기준표가 대상이다.\n출처: kac-record-assign/output/t1/요약.md, kac-shared/data/classification.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '남은 일', title: '다음에는 세 가지를 한다' });
      d.svg = K.svg(root);
      d.a1 = K.actor(root, { kind: 'make', name: '배정 에이전트', x: 270, y: 330, w: 250 });
      d.hu = K.actor(root, { kind: 'human', name: '사람', x: 870, y: 300, w: 186 });
      // 분류기준표: 빈 칸이 있는 작은 표
      d.tb = K.at(root, 'card', { x: 1390, y: 372, w: 290, h: 220 });
      d.tc = [];
      for (let i = 0; i < 9; i++) {
        const e = K.at(d.tb, '', { x: 22 + (i % 3) * 84, y: 22 + Math.floor(i / 3) * 62, w: 78, h: 50 });
        const blank = [4, 5, 7, 8].includes(i);
        e.style.cssText += ';box-sizing:border-box;border-radius:8px;' + (blank ? 'border:3px dashed var(--warn);background:var(--warn-soft)' : 'background:rgba(27,42,74,.78)');
        d.tc.push({ e, blank });
      }
      d.tt = T(root, '분류기준표', 1390, 610, 'text-align:center', 290);
      d.tt.innerHTML = '<span style="display:inline-block;padding:8px 18px 9px;border-radius:999px;background:var(--paper-3);border:3px solid var(--ink-2);font:800 28px/1.1 var(--sans);letter-spacing:-0.02em;color:var(--ink)">분류기준표</span>';
      const cap = (html, cx) => T(root, html, cx - 250, 696, 'text-align:center;font:700 34px/1.35 var(--sans);letter-spacing:-0.03em;color:var(--ink)', 500);
      const em = 'color:var(--blue);font-weight:900';
      d.c1 = cap(`남은 제목 <span class="num" style="${em}">14,259개</span>를<br>이어서 배정한다`, 395);
      d.c2 = cap('사람이 확인한 결과를<br>규칙에 넣는다', 963);
      d.c3 = cap(`빈 <span class="num" style="${em}">34행</span>을 채우고<br>다시 실행한다`, 1535);
      d.p1 = K.path(d.svg, [[560, 480], [830, 480]], { color: C.ink2, width: 4, arrow: true });
      d.p2 = K.path(d.svg, [[1096, 480], [1360, 480]], { color: C.ink2, width: 4, arrow: true });
      d.p3 = K.path(d.svg, [[1535, 800], [1535, 880], [395, 880], [395, 806]], { color: C.blue, width: 4, arrow: true, radius: 26 });
      d.pl = T(root, '다시 실행', 860, 858, 'text-align:center;font:800 32px/1.4 var(--sans);letter-spacing:-0.02em;color:#1456C8;background:var(--paper)', 210);
      d.doc = K.doc(root, '문서 제목', { x: 0, y: 0 });
    },
    render(lt, d) {
      d.T.render(lt);
      d.a1.render(lt, 0.5); d.hu.render(lt, 0.7);
      K.pop(d.tb, lt, 0.9); K.rise(d.tt, lt, 1.0, { y: 8 });
      K.draw(d.p1, lt, 0.9, 0.35); K.draw(d.p2, lt, 1.1, 0.35);
      [d.c1, d.c2, d.c3].forEach((e, i) => K.rise(e, lt, 1.2 + i * 0.15, { y: 12 }));
      K.draw(d.p3, lt, 1.7, 0.8); K.rise(d.pl, lt, 2.2, { y: 0 });
      // 배정 → 사람 확인 → 기준표 고치기 → 다시 실행
      const L = K.loop(lt, 2.6, [1.4, 1.0, 1.4, 1.0, 1.5, 1.3]);
      const st = L.i, u = L.u;
      d.a1.act(lt, st === 0 && u > 0.2); d.hu.act(lt, st === 2);
      [d.c1, d.c2, d.c3].forEach((e, i) => { if (lt > 2.4) e.style.opacity = st < 0 || [[0], [1, 2], [3, 4, 5]][i].includes(st) ? '1' : '0.55'; });
      // 표의 빈 칸이 채워진다(4단계). 다시 실행 단계까지 채워진 채로 있다가 다음 바퀴에 처음으로 돌아간다
      const fill = st === 4 ? u : st === 5 ? 1 : 0;
      let bi = 0;
      d.tc.forEach(c => {
        if (!c.blank) return;
        const on = fill > 0.15 + bi * 0.18; bi++;
        RH.set(c.e, 'background', on ? C.ok : 'rgba(232,147,12,.14)');
        RH.set(c.e, 'borderColor', on ? C.ok : C.warn); RH.set(c.e, 'borderStyle', on ? 'solid' : 'dashed');
      });
      if (lt > 1.4) RH.set(d.tb, 'boxShadow', st === 4 ? '0 0 0 5px ' + C.ok : '0 18px 40px -24px rgba(27,42,74,.30)');
      if (st < 0) { d.doc.style.opacity = '0'; return; }
      const P = { in: [150, 268], a1: [330, 268], hu: [905, 240], tb: [1470, 310] };
      d.doc.className = 'doc' + (st >= 2 && st <= 3 ? ' ok' : '');
      if (st === 0) K.travel(d.doc, u, 0, 0.4, P.in, P.a1, { arc: 20 });
      else if (st === 1) K.travel(d.doc, u, 0, 1, P.a1, P.hu, { arc: 36 });
      else if (st === 2) K.travel(d.doc, 1, 0, 1, P.hu, P.hu);
      else if (st === 3) K.travel(d.doc, u, 0, 1, P.hu, P.tb, { arc: 36 });
      else K.travel(d.doc, 1, 0, 1, P.tb, P.tb);
      d.doc.style.opacity = (st === 0 ? clamp(u / 0.15) : st === 4 ? clamp((1 - u) / 0.2) : st === 5 ? 0 : 1).toFixed(3);
      // 다시 실행: 아래 선을 따라 점이 에이전트로 돌아간다
      if (!d.dot) d.dot = s('circle', { r: 10, fill: C.blue }, d.svg);
      if (st === 5) {
        const pt = d.p3.getPointAtLength(ease.inOutCubic(u) * d.p3._len);
        d.dot.setAttribute('cx', pt.x.toFixed(1)); d.dot.setAttribute('cy', pt.y.toFixed(1));
        d.dot.style.opacity = Math.min(1, u / 0.1, (1 - u) / 0.1).toFixed(3);
      } else d.dot.style.opacity = '0';
    },
  });

  // 맺음: 표지와 같은 건물로 돌아온다. 맺음 문장과 기록연구사의 질문만 둔다
  DECK.slide({
    id: 'close', title: '맺음', chapter: CH,
    notes: '하네스는 고칠 안과 근거를 파일로 내고, 반영 여부는 담당자와 경영진이 정한다. 필름의 마지막 말과 같다: 모든 산출물은 사람이 검토할 추천이다.\n화면의 질문은 필름이 끝난 질문 「그럼, 첫 문서부터 분류해 볼까요?」다. 다음 실행은 감사실·제주운영단 2026년의 남은 고유 제목 14,259개다(다음 단계 장). 질문을 받겠다.\n결과 파일 위치:\n제목 배정 — kac-record-assign/output/t1/배정결과.xlsx\n오분류 점검 — kac-classification-audit/output/test01/정정안.csv\n단위업무명 추천 — kac-unit-task-naming/output/20261117-감사실/단위업무_제안표.xlsx\n조직 변경 영향 — kac-org-change-impact/output/시나리오-신공항건설1부이동/영향도_보고서.md\n조직 개편 추천 — kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md',
    setup(root, d) {
      d.arch = K.sprite(root, 'g01_archive', { x: 1440, y: 560, w: 1040, origin: '50% 70%' });
      d.l1 = K.at(root, '', { x: 116, y: 170, w: 1300 }, '하네스는 고칠 안과 근거를 내고,');
      d.l2 = K.at(root, '', { x: 116, y: 280, w: 1300 }, '결정은 사람이 한다.');
      [d.l1, d.l2].forEach(e => { e.style.cssText += ';font:900 88px/1.18 var(--display);letter-spacing:-0.04em;color:var(--ink);white-space:nowrap'; });
      d.l2.style.color = K.C.ok;
      d.w1 = RH.split(d.l1, 'char', { mask: true }); d.w2 = RH.split(d.l2, 'char', { mask: true });
      // 필름 마지막 질문으로 끝낸다. 표지가 이 질문에서 시작했다
      d.Q = K.question(root, '그럼, 첫 문서부터 분류해 볼까요?', { x: 70, y: 600, person: { x: 102, y: 150, w: 235 }, bx: 225, by: 70, size: 50, pad: '26px 38px 28px', tagSize: 26 });
    },
    render(lt, d) {
      d.w1.forEach((w, i) => { const p = RH.stagger(lt, 0.15, 0.025, 0.55, i); w.style.transform = `translateY(${((1 - p) * 120).toFixed(1)}%)`; });
      d.w2.forEach((w, i) => { const p = RH.stagger(lt, 0.65, 0.03, 0.55, i); w.style.transform = `translateY(${((1 - p) * 120).toFixed(1)}%)`; });
      d.Q.render(lt, 1.4, 24);
      // 건물은 천천히 다가왔다 물러나기를 되풀이한다
      const pa = prog(lt, 0.2, 0.9, ease.outCubic);
      d.arch.style.opacity = pa.toFixed(3);
      d.arch.style.transform = `translateY(${((1 - pa) * 40).toFixed(1)}px) scale(${(1 + 0.035 * K.wave(Math.max(0, lt - 1), 14)).toFixed(4)})`;
    },
  });
})();

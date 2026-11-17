/* 공통 구조 — 다섯 하네스가 같이 따르는 구성과 원칙 세 가지. 「사람이 정할 것」 장은 맺음 앞으로 옮긴다(place). */
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
  // 작은 칩(모노): 에이전트·스크립트·파일 이름
  const CHIP = {
    agent: 'border:2px solid var(--blue);color:var(--blue-2);background:var(--paper-3)',
    script: 'border:2px dashed var(--rule-2);color:var(--ink-2);background:transparent',
    file: 'border:1.5px solid var(--rule-2);color:var(--ink);background:var(--paper-3)',
    out: 'border:1.5px solid var(--rule-2);color:var(--ink);background:var(--paper-2)',
  };
  const mchip = (parent, text, kind) => {
    const el = h('span', 'mono', parent, text);
    el.style.cssText = `display:inline-flex;align-items:center;height:34px;padding:0 12px;border-radius:8px;box-sizing:border-box;font-size:19px;font-weight:500;white-space:nowrap;${CHIP[kind]}`;
    return el;
  };
  // 모델 표시: opus 는 채움, sonnet 은 테두리
  const mtag = (parent, m) => {
    const el = h('span', 'mono', parent, m);
    el.style.cssText = 'display:inline-flex;align-items:center;height:28px;padding:0 9px;border-radius:6px;box-sizing:border-box;font-size:19px;font-weight:700;flex:none;' +
      (m === 'opus' ? 'background:var(--ink);color:#fff' : 'border:2px solid var(--ink-2);color:var(--ink-2)');
    return el;
  };
  // 점 하나 = 에이전트 하나(채움 opus, 빈 점 sonnet)
  const adot = (parent, m, sz = 16) => {
    const el = h('span', '', parent);
    el.style.cssText = `display:inline-block;width:${sz}px;height:${sz}px;border-radius:50%;box-sizing:border-box;flex:none;` +
      (m === 'o' ? 'background:var(--ink)' : 'border:2.5px solid var(--ink)');
    return el;
  };
  // Edit 도구 없음 표시: 연필에 사선
  const noEdit = (parent, sz = 26) => {
    const el = s('svg', { width: sz, height: sz, viewBox: '0 0 24 24' }, parent);
    el.style.flex = 'none';
    s('path', { d: 'M5 19 L6 14.5 L15.5 5 L19 8.5 L9.5 18 Z', fill: 'none', stroke: C.bad, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, el);
    s('path', { d: 'M3.5 3.5 L20.5 20.5', stroke: C.bad, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, el);
    return el;
  };
  // 체크 표시(원 안의 꺾쇠)
  const tick = (parent, sz = 26) => {
    const el = s('svg', { width: sz, height: sz, viewBox: '0 0 26 26' }, parent);
    el.style.flex = 'none';
    el._c = s('circle', { cx: 13, cy: 13, r: 11, fill: 'none', stroke: C.ok, 'stroke-width': 2.2 }, el);
    el._p = s('path', { d: 'M7.5 13.5 L11.5 17.2 L18.5 9.2', fill: 'none', stroke: C.ok, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
    el._len = 17;
    return el;
  };
  const tickDraw = (el, p) => {
    el._p.style.strokeDasharray = `${el._len} ${el._len}`;
    el._p.style.strokeDashoffset = ((1 - p) * el._len).toFixed(2);
    el._c.style.opacity = (0.25 + 0.75 * p).toFixed(3);
  };
  const KIND = { make: C.blue, check: C.bad, judge: C.warn, write: C.ink2 };
  const SOFT = { make: 'rgba(47,123,255,.10)', check: 'rgba(232,72,58,.10)', judge: 'rgba(232,147,12,.12)', write: 'rgba(27,42,74,.07)' };

  // 9. 하네스는 무엇으로 이루어지나
  DECK.slide({
    id: 'h-parts', title: '하네스는 무엇으로 이루어지나', chapter: CH,
    notes: '하네스 하나는 폴더 하나다. kac-record-assign 폴더를 위에서부터 열면 이 순서다. CLAUDE.md에는 언제 이 하네스를 쓰는지만 적고, 실제 진행 순서는 오케스트레이터 스킬 record-assign(SKILL.md)에 있다.\n판단 기준은 record-assignment-rules 스킬에 따로 두어 에이전트 세 개가 같은 기준을 읽는다. 묶음 만들기·형식 검사·병합은 스크립트 4개가 맡고, 단계별 JSON은 _workspace/t1/, 사람이 읽는 결과는 output/t1/에 남는다.\n다섯 하네스가 같은 구성을 따르고, 에이전트는 모두 18개다(4·3·3·5·3). 분류기준표 색인·부서 대응표·문서목록은 kac-shared/data에 한 벌만 두고 다섯 하네스가 읽기만 한다.\n출처: kac-record-assign/ 폴더, 각 하네스 .claude/agents/, kac-shared/README.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '구성 · kac-record-assign 폴더', title: '하네스는 무엇으로 이루어지나' });
      d.svg = K.svg(root);
      const L = [
        { k: '호출 조건', path: 'CLAUDE.md', role: '문서 제목 배정·재실행·보완을 요청받으면 record-assign 스킬을 쓴다', c: C.ink },
        { k: '진행 순서', path: '.claude/skills/record-assign/SKILL.md', role: '오케스트레이터. 묶음 생성 → 배정·검증·중재 → 병합과 보고', c: C.blue },
        { k: '에이전트', path: '.claude/agents/', chips: ['record-assigner', 'assignment-verifier', 'assignment-arbiter'], ck: 'agent', role: '배정한다 · 독립적으로 다시 판단한다 · 갈린 항목을 중재한다', c: C.blue },
        { k: '판단 규칙', path: '.claude/skills/record-assignment-rules/SKILL.md', role: '배정 수준·확신도 기준과 결과 파일 형식. 세 에이전트가 같은 기준을 읽는다', c: C.blue },
        { k: '스크립트', path: 'scripts/', chips: ['make_batches.py', 'validate_batch.py', 'merge_results.py', 'common.py'], ck: 'script', role: '묶음 만들기 · 형식 검사 · 결과 병합 · 공용 경로', c: C.ink2 },
        { k: '작업 파일', path: '_workspace/t1/', chips: ['batches/', 'results/', 'verify/', 'arbitrate/'], ck: 'file', role: '단계마다 JSON 파일을 쓰고, 다음 단계가 그 파일을 읽는다', c: C.ink },
        { k: '결과', path: 'output/t1/', chips: ['배정결과.csv', '배정결과.xlsx', '검토필요.csv', '요약.md'], ck: 'out', role: '사람이 읽는 결과표와 요약', c: C.ink },
      ];
      const Y0 = 296, P = 96, RHh = 86, SX = 142;
      d.cy = L.map((r, i) => Y0 + i * P + RHh / 2);
      d.spine = K.path(d.svg, [[SX, d.cy[0]], [SX, d.cy[L.length - 1]]], { color: 'rgba(27,42,74,.30)', width: 2.5 });
      d.rows = L.map((r, i) => {
        const y = Y0 + i * P;
        const row = K.at(root, '', { x: 120, y, w: 1140, h: RHh });
        row.style.borderRadius = '12px';
        tx(row, { x: 50, y: 14, w: 160 }, r.k, `font-size:23px;font-weight:800;letter-spacing:-0.02em;color:${r.c}`);
        const l1 = K.at(row, '', { x: 220, y: 9 });
        l1.style.cssText += ';display:flex;align-items:center;gap:8px;height:34px;white-space:nowrap';
        const p = h('span', 'mono', l1, r.path);
        p.style.cssText = 'font-size:21px;font-weight:500;color:var(--ink);margin-right:8px';
        const chips = (r.chips || []).map(t => mchip(l1, t, r.ck));
        tx(row, { x: 220, y: 50, w: 910 }, r.role, 'font-size:21px;line-height:1.35;color:var(--ink-2);letter-spacing:-0.01em');
        const node = s('circle', { cx: SX, cy: d.cy[i], r: 0, fill: C.paper, stroke: r.c, 'stroke-width': 3 }, d.svg);
        return { row, chips, node };
      });
      d.runner = s('circle', { r: 7, fill: C.blue, opacity: 0 }, d.svg);
      // 오른쪽: 다섯 하네스와 공통 데이터
      d.rh = tx(root, { x: 1310, y: 294, w: 490 }, '<span>다섯 하네스</span><span style="float:right;color:var(--blue)">에이전트 18</span>', 'font-size:24px;font-weight:800;letter-spacing:-0.02em');
      // 필름과 같은 순서·이름·색
      const HS = [
        ['kac-record-assign', K.HZ.assign.short, 'oos', K.HZ.assign.c],
        ['kac-classification-audit', K.HZ.audit.short, 'oos', K.HZ.audit.c],
        ['kac-unit-task-naming', K.HZ.naming.short, 'oos', K.HZ.naming.c],
        ['kac-org-change-impact', K.HZ.orgchange.short, 'ooos', K.HZ.orgchange.c],
        ['kac-org-strategy', K.HZ.strategy.short, 'oooos', K.HZ.strategy.c],
      ];
      d.hcy = [];
      d.hs = HS.map((r, i) => {
        const y = 346 + i * 82;
        d.hcy.push(y + 36);
        const c = K.at(root, 'card flat', { x: 1350, y, w: 450, h: 72 });
        c.style.borderRadius = '12px';
        const hot = r[0] === 'kac-record-assign';
        c.style.borderLeft = `8px solid ${r[3]}`;
        if (hot) { c.style.border = '2px solid var(--blue)'; c.style.borderLeft = `8px solid ${r[3]}`; c.style.background = 'rgba(47,123,255,.06)'; }
        tx(c, { x: 16, y: 7 }, r[0], 'font-size:20px;font-weight:500;color:var(--blue-2);white-space:nowrap', 'mono');
        tx(c, { r: 16, y: 9 }, r[1], `font-size:20px;font-weight:800;color:${r[3]}`);
        const l2 = K.at(c, '', { x: 16, y: 40 });
        l2.style.cssText += ';display:flex;align-items:center;gap:6px';
        const dots = [...r[2]].map(m => adot(l2, m));
        const n = h('span', '', l2, `에이전트 ${r[2].length}`);
        n.style.cssText = 'font-size:20px;font-weight:600;color:var(--ink-2);margin-left:8px';
        if (hot) { const tg = h('span', '', l2, '· 왼쪽 폴더'); tg.style.cssText = 'font-size:20px;font-weight:700;color:var(--blue);margin-left:4px'; }
        return { c, dots };
      });
      d.sh = K.at(root, 'card', { x: 1310, y: 806, w: 490, h: 156 });
      d.sh.style.padding = '16px 20px';
      d.sh.innerHTML = '<div><span class="mono" style="font-size:21px;font-weight:700">kac-shared/data/</span><span style="float:right;font-size:20px;font-weight:600;color:var(--mute)">공통 데이터</span></div>' +
        ['classification.json|분류기준표 색인', 'dept_map.json|부서 대응표', 'production.sqlite|문서목록'].map(t => {
          const [a, b] = t.split('|');
          return `<div style="margin-top:6px;font-size:20px;color:var(--ink-2)"><span class="mono" style="font-size:19px;color:var(--ink)">${a}</span> · ${b}</div>`;
        }).join('');
      const TX = 1330;
      d.trunk = K.path(d.svg, [[TX, 806], [TX, d.hcy[0]]], { color: C.ink2, width: 2.5 });
      K.dots(d.svg, d.trunk, 3, { r: 5, color: C.ink2 });
      d.ticks = d.hcy.map(y => K.path(d.svg, [[TX, y], [1350, y]], { color: C.ink2, width: 2.5 }));
      d.ro = tx(root, { x: 1342, y: 768 }, '다섯 하네스가 읽기만 한다', 'font-size:20px;font-weight:600;color:var(--mute)');
    },
    render(lt, d) {
      d.T.render(lt);
      K.draw(d.spine, lt, 0.35, 0.9, { ease: ease.linear });
      d.rows.forEach((r, i) => {
        const t0 = 0.4 + i * 0.12;
        K.rise(r.row, lt, t0, { x: -24, y: 0 });
        r.chips.forEach((c, j) => K.pop(c, lt, t0 + 0.2 + j * 0.06));
        r.node.setAttribute('r', (8 * prog(lt, t0, 0.35, ease.pop)).toFixed(2));
      });
      // 위에서 아래로 한 층씩 강조가 내려간다(호출 → 진행 → … → 결과)
      const T0 = 2.8, PER = 1.15, n = d.rows.length;
      const k = K.cycle(lt, T0, PER, n + 1);   // 마지막 한 칸은 쉼
      d.rows.forEach((r, i) => K.mark(r.row, k === i, 'rgba(47,123,255,.07)'));
      if (k >= 0 && k < n) {
        const u = ((lt - T0) % PER) / PER;
        const from = k === 0 ? d.cy[0] : d.cy[k - 1];
        const y = lerp(from, d.cy[k], ease.inOutCubic(clamp(u / 0.4)));
        d.runner.setAttribute('cx', 142); d.runner.setAttribute('cy', y.toFixed(1));
        d.runner.setAttribute('opacity', (k === 0 ? clamp(u / 0.2) : 1).toFixed(3));
      } else d.runner.setAttribute('opacity', 0);
      // 오른쪽
      K.rise(d.rh, lt, 0.9, { y: 10 });
      d.hs.forEach((r, i) => {
        K.rise(r.c, lt, 1.0 + i * 0.08, { x: 24, y: 0 });
        r.dots.forEach((dt, j) => K.pop(dt, lt, 1.25 + i * 0.08 + j * 0.04));
      });
      K.rise(d.sh, lt, 1.45, { y: 18 });
      K.draw(d.trunk, lt, 1.7, 0.55, { speed: 120 });
      d.ticks.forEach((t, i) => K.draw(t, lt, 2.0 + (4 - i) * 0.06, 0.2));
      K.rise(d.ro, lt, 2.1, { y: 8 });
    },
  });

  // 10. 원칙 1
  DECK.slide({
    id: 'h-p1', title: '원칙 1. 스크립트가 범위를 줄이고, 에이전트가 판단한다', chapter: CH,
    notes: '문서를 전부 에이전트에게 보내지 않는다. 결정적인 스크립트가 같은 제목을 묶고, 의심 신호로 거르고, 군집으로 줄인 뒤 남은 것만 에이전트가 읽고 판단한다.\n배정(t1): 감사실·제주운영단의 2026년 문서 21,357건을 make_batches.py가 숫자만 다른 제목끼리 묶어 고유 제목 14,299개로 줄였고, 이번 시험에서는 표본 40개를 판단했다(남은 고유 제목 14,259).\n점검(test01): 시험 자료 600건에서 screen.py가 의심 신호가 있는 묶음 158개(문서 179건)를 골랐고, 그중 100묶음(문서 121건)을 점검했다. 신호가 없는 문서는 점검하지 않았다.\n이름 제안(감사실): 문서 8,978건에서 prepare_dept.py가 공통 수신 2,152건과 부서공통 추정 193건을 빼고 남은 6,633건을 군집으로 묶어 상위 군집 90개(문서 4,597건)를 넘겼다. 소규모 군집 2,036건은 이번에 분석하지 않았다.\n막대 길이는 각 하네스 첫 단계에 대한 비율이고, 아주 작은 값은 보이도록 최소 폭을 줬다. 출처: kac-record-assign/output/t1/요약.md, kac-classification-audit/output/test01/요약.md, kac-unit-task-naming/output/20261117-감사실/요약.md 와 _workspace/20261117-감사실/manifest.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '원칙 1', title: '스크립트가 범위를 줄이고, 에이전트가 판단한다', size: 68 });
      d.svg = K.svg(root);
      const F = [
        { hn: 'kac-record-assign', cond: '배정 t1 · 감사실·제주운영단 2026년',
          st: [[21357, '건', '범위 안 문서'], [14299, '개', '고유 제목'], [40, '개', '이번에 판단한 제목']],
          sc: [['make_batches.py', '숫자만 다른 제목을 한 항목으로'], ['make_batches.py --limit 40', '시험 표본 고르기']],
          ag: { name: 'record-assigner', role: '제목 40개를 철에 배정', model: 'sonnet' } },
        { hn: 'kac-classification-audit', cond: '점검 test01 · 시험 자료 5개 부서',
          st: [[600, '건', '입력 문서'], [158, '개', '의심 묶음'], [100, '개', '이번에 점검한 묶음']],
          sc: [['screen.py', '의심 신호 S1~S4 계산'], ['make_batches.py', '이번 점검 범위(묶음 파일 5개)']],
          ag: { name: 'blind-classifier', role: '기존 분류를 가리고 다시 분류', model: 'sonnet' } },
        { hn: 'kac-unit-task-naming', cond: '이름 제안 · 감사실 대조 모드',
          st: [[8978, '건', '감사실 문서'], [6633, '건', '군집 대상'], [90, '개', '상위 군집']],
          sc: [['prepare_dept.py', '공통 수신 2,152건 등 제외'], ['prepare_dept.py', '제목을 군집으로 묶어 상위 90개']],
          ag: { name: 'work-cluster-analyst', role: '군집 90개의 업무 해석', model: 'sonnet' } },
      ];
      const W = 520, LY = [374, 540, 706], BY = [426, 592, 758], BH = 28;
      d.cols = F.map((f, i) => {
        const x0 = 120 + i * 580;
        const hd = tx(root, { x: x0, y: 290, w: W }, `<div class="mono" style="font-size:22px;font-weight:500;color:var(--blue-2)">${f.hn}</div><div style="font-size:20px;font-weight:500;color:var(--mute);margin-top:4px">${f.cond}</div>`);
        const max = f.st[0][0];
        const ws = f.st.map(v => Math.max(7, (v[0] / max) * W));
        const LX = x0 + 26;   // 흐름 선(x0+9) 오른쪽에서 글자가 시작한다
        const st = f.st.map((v, j) => {
          const col = j === 2 ? 'var(--blue)' : 'var(--ink)';
          const lab = tx(root, { x: LX, y: LY[j], w: W - 26 }, `<span class="num" style="font-size:40px;font-weight:800;letter-spacing:-0.03em;color:${col}">0</span><span style="font-size:22px;font-weight:700;margin-left:3px;color:${col}">${v[1]}</span><span style="font-size:21px;font-weight:600;color:var(--ink-2);margin-left:12px">${v[2]}</span>`, 'line-height:1;white-space:nowrap');
          const ghost = j > 0 ? tx(root, { x: x0, y: BY[j], w: ws[j - 1], h: BH }, '', 'border:2px dashed rgba(27,42,74,.26);border-radius:4px;box-sizing:border-box') : null;
          const bar = tx(root, { x: x0, y: BY[j], w: ws[j], h: BH }, '', `background:${j === 2 ? C.blue : j === 0 ? 'rgba(27,42,74,.80)' : 'rgba(27,42,74,.55)'};border-radius:4px`);
          return { lab, num: lab.firstChild, bar, ghost, v: v[0], w: ws[j], pw: j > 0 ? ws[j - 1] : 0, pv: j > 0 ? f.st[j - 1][0] : 0 };
        });
        const sc = f.sc.map((c, j) => {
          const box = tx(root, { x: LX, y: BY[j] + BH + 16 }, `<span class="mono" style="font-size:19px;font-weight:500;color:var(--ink-2)">${c[0]}</span><span style="font-size:19px;color:var(--mute);margin-left:10px">${c[1]}</span>`,
            'border:2px dashed var(--rule-2);border-radius:9px;padding:8px 14px;white-space:nowrap;background:var(--paper)');
          return box;
        });
        // 흐름: 단계가 지날수록 점이 줄어든다(4 → 2 → 1)
        const FX = x0 + 9;
        const segs = [[BY[0] + BH, BY[1]], [BY[1] + BH, BY[2]], [BY[2] + BH, 812]].map((yy, j) => {
          const p = K.path(d.svg, [[FX, yy[0]], [FX, yy[1]]], { color: j === 2 ? C.blue : 'rgba(27,42,74,.35)', width: 2.5 });
          K.dots(d.svg, p, [4, 2, 1][j], { r: 5, color: j === 2 ? C.blue : C.ink2 });
          return p;
        });
        const ag = K.agent(root, { name: f.ag.name, role: f.ag.role, model: f.ag.model, kind: 'make', x: x0, y: 812, w: W });
        return { hd, st, sc, segs, ag, cs: i * 0.14 };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.cols.forEach((c, i) => {
        const cs = c.cs;
        K.rise(c.hd, lt, 0.3 + cs, { y: 12 });
        // 1단계: 막대가 왼쪽부터 자라고 숫자가 센다
        const s0 = c.st[0];
        K.rise(s0.lab, lt, 0.45 + cs, { y: 12 });
        K.count(s0.num, lt, 0.45 + cs, 0.8, s0.v);
        K.wipe(s0.bar, lt, 0.5 + cs, 0.5);
        // 2·3단계: 앞 단계 폭으로 나타나 줄어든다. 줄어든 자리에 점선 윤곽이 남는다
        [1, 2].forEach(j => {
          const sj = c.st[j], ta = (j === 1 ? 1.1 : 1.75) + cs;
          K.rise(c.sc[j - 1], lt, ta - 0.15, { y: 8 });
          K.rise(sj.lab, lt, ta, { y: 10 });
          const p = prog(lt, ta + 0.12, 0.7, ease.inOutCubic);
          sj.bar.style.width = lerp(sj.pw, sj.w, p).toFixed(1) + 'px';
          sj.bar.style.opacity = prog(lt, ta, 0.2, ease.linear).toFixed(3);
          sj.ghost.style.opacity = (prog(lt, ta + 0.2, 0.3, ease.linear)).toFixed(3);
          sj.num.textContent = RH.count(p, sj.v, { from: sj.pv });
          if (lt < ta) sj.num.textContent = sj.pv.toLocaleString('ko-KR');
        });
        K.draw(c.segs[0], lt, 0.95 + cs, 0.3, { speed: 70 });
        K.draw(c.segs[1], lt, 1.6 + cs, 0.3, { speed: 70 });
        K.draw(c.segs[2], lt, 2.3 + cs, 0.2, { speed: 40 });
        K.pop(c.ag, lt, 2.35 + cs);
        // 처리 중 표시: 에이전트 테두리 바깥 띠의 두께와 진하기가 2.2초 주기로 오르내린다
        if (lt > 3) {
          const w = K.wave(lt, 2.2, i * 0.3);
          c.ag.style.boxShadow = `0 16px 36px -22px rgba(47,123,255,.55), 0 0 0 ${(2 + 5 * w).toFixed(1)}px rgba(47,123,255,${(0.10 + 0.10 * w).toFixed(3)})`;
        } else c.ag.style.boxShadow = '';
      });
    },
  });

  // 11. 원칙 2
  DECK.slide({
    id: 'h-p2', title: '원칙 2. 만드는 쪽과 반박하는 쪽을 나눈다', chapter: CH,
    notes: '에이전트 18개를 맡은 일로 나누면 만드는 쪽 9, 반박하는 쪽 5, 가르고 정리하는 쪽 4다. 만든 결과를 다른 에이전트가 틀렸을 가능성부터 따지고, 둘이 갈리면 중재 에이전트나 정해진 규칙이 가른다.\n점검 하네스는 순서가 다르다. blind-classifier가 기존 분류를 가린 채 분류하고, label-judge가 기존 분류가 오류인지 판정한 뒤, correction-challenger가 그 오류 판정을 반박한다. 반박에 실패한 건만 정정 권고가 된다.\n모델: opus 13개는 다른 판단을 다시 따지는 검증·중재·설계에, sonnet 5개는 절차가 정해진 일(양이 많은 1차 배정·분류·군집 해석, 규정 조항 추출, 집계된 결과를 보고서로 옮기기)에 썼다.\nchange-proposal-verifier, org-option-critic, naming-reviewer는 도구 목록에 Edit가 없어 상대가 만든 파일을 고치지 못하고 자기 검토 파일만 쓴다. assignment-verifier는 Edit가 있지만 정의 본문에서 배정 결과 파일을 고치지 말라고 정했다.\n출처: 각 하네스 .claude/agents/*.md 머리말(name·model·tools)과 본문',
    setup(root, d) {
      d.T = K.title(root, { kicker: '원칙 2', title: '만드는 쪽과 반박하는 쪽을 나눈다' });
      d.svg = K.svg(root);
      const COLS = [
        { k: 'make', x: 420, w: 480, a: '생성', b: '만든다', n: 9 },
        { k: 'check', x: 935, w: 435, a: '검증', b: '반박한다', n: 5 },
        { k: 'judge', x: 1405, w: 395, a: '중재·정리', b: '가르고 정리한다', n: 4 },
      ];
      d.heads = COLS.map(c => {
        const e = tx(root, { x: c.x, y: 278, w: c.w, h: 50 }, `<span style="color:${KIND[c.k]}">${c.a}</span><span class="num" style="color:${KIND[c.k]};margin-left:8px">${c.n}</span><span style="font-size:21px;font-weight:600;color:var(--ink-2);margin-left:12px">${c.b}</span>`,
          `font-size:26px;font-weight:800;letter-spacing:-0.02em;border-top:4px solid ${KIND[c.k]};padding-top:8px;box-sizing:border-box`);
        return e;
      });
      // 열 사이 화살표: 생성 → 검증 → 중재·정리
      d.harr = [[906, 924], [1376, 1394]].map(([a, b]) => K.path(d.svg, [[a, 303], [b, 303]], { color: C.ink2, width: 2.5, arrow: true }));
      d.hh = tx(root, { x: 120, y: 290 }, '하네스', 'font-size:21px;font-weight:700;color:var(--mute)');
      // 행: [이름, 역할, 모델, 종류, Edit 없음]
      // 필름과 같은 순서
      const R = [
        { hn: 'kac-record-assign', cs: K.HZ.assign.short, hk: 'assign',
          make: [['record-assigner', 'sonnet']], check: [['assignment-verifier', 'opus']], judge: [['assignment-arbiter', 'opus']],
          order: ['record-assigner', 'assignment-verifier', 'assignment-arbiter'] },
        { hn: 'kac-classification-audit', cs: K.HZ.audit.short, hk: 'audit',
          make: [['blind-classifier', 'sonnet']], check: [['correction-challenger', 'opus']], judge: [['label-judge', 'opus']],
          order: ['blind-classifier', 'label-judge', 'correction-challenger'] },
        { hn: 'kac-unit-task-naming', cs: K.HZ.naming.short, hk: 'naming',
          make: [['work-cluster-analyst', 'sonnet'], ['unit-task-namer', 'opus']], check: [['naming-reviewer', 'opus', 1]], judge: [],
          order: ['work-cluster-analyst', 'unit-task-namer', 'naming-reviewer', 'unit-task-namer', 'naming-reviewer'] },
        { hn: 'kac-org-change-impact', cs: K.HZ.orgchange.short, hk: 'orgchange',
          make: [['org-change-interpreter', 'opus'], ['unit-impact-analyst', 'opus']],
          check: [['change-proposal-verifier', 'opus', 1]], judge: [['impact-report-writer', 'sonnet', 0, 'write']],
          order: ['org-change-interpreter', 'unit-impact-analyst', 'change-proposal-verifier', 'impact-report-writer'] },
        { hn: 'kac-org-strategy', cs: K.HZ.strategy.short, hk: 'strategy',
          make: [['org-diagnostician', 'opus'], ['regulation-constraint-checker', 'sonnet'], ['org-option-designer', 'opus']],
          check: [['org-option-critic', 'opus', 1]], judge: [['executive-report-writer', 'opus']],
          order: ['org-diagnostician', 'regulation-constraint-checker', 'org-option-designer', 'org-option-critic', 'org-option-designer', 'org-option-critic', 'executive-report-writer'] },
      ];
      const TH = 46, TG = 8, PAD = 10;
      let y = 340;
      d.rows = R.map((r, ri) => {
        const n = Math.max(r.make.length, r.check.length, r.judge.length, 1);
        const rh = n * TH + (n - 1) * TG + PAD * 2;
        const bg = K.at(root, '', { x: 110, y, w: 1700, h: rh });
        bg.style.borderRadius = '10px';
        const line = K.at(root, '', { x: 120, y: y + rh, w: 1680, h: 1.5 }); line.style.background = 'var(--rule)';
        const lab = tx(root, { x: 120, y: y + rh / 2 - 27, w: 300 }, `<div class="mono" style="font-size:19px;font-weight:500;color:var(--ink-2)">${r.hn}</div><div style="font-size:23px;font-weight:900;font-family:var(--display);color:${K.HZ[r.hk].c};margin-top:3px">${r.cs}</div>`);
        const tiles = {};
        const all = [];
        COLS.forEach(c => {
          const list = r[c.k];
          const top = y + (rh - (list.length * TH + (list.length - 1) * TG)) / 2;
          list.forEach((a, j) => {
            const kind = a[3] || c.k;
            const t = K.at(root, '', { x: c.x, y: top + j * (TH + TG), w: c.w, h: TH });
            t.style.cssText += `;display:flex;align-items:center;gap:10px;padding:0 10px 0 14px;box-sizing:border-box;border-radius:10px;background:var(--paper-3);border:2px solid ${KIND[kind]}`;
            const nm = h('span', 'mono', t, a[0]);
            nm.style.cssText = `font-size:20px;font-weight:500;flex:1;white-space:nowrap;color:${kind === 'make' ? 'var(--blue-2)' : kind === 'check' ? '#B3261E' : kind === 'judge' ? '#965A00' : 'var(--ink-2)'}`;
            if (a[2]) noEdit(t, 26);
            mtag(t, a[1]);
            t._kind = kind;
            tiles[a[0]] = t; all.push(t);
          });
        });
        const out = { bg, line, lab, all, seq: r.order.map(nm => tiles[nm]), y, rh };
        y += rh;
        return out;
      });
      // 아래: 모델 배치와 Edit 없음
      const by = 904;
      const mk = (yy, cnt, filled, lab, desc) => {
        const g = K.at(root, '', { x: 120, y: yy, w: 1240 });
        g.style.cssText += ';display:flex;align-items:center;gap:6px;white-space:nowrap';
        const boxes = [];
        for (let i = 0; i < cnt; i++) {
          const b = h('span', '', g);
          b.style.cssText = `width:20px;height:20px;border-radius:4px;box-sizing:border-box;flex:none;${filled ? 'background:var(--ink)' : 'border:2.5px solid var(--ink)'}`;
          boxes.push(b);
        }
        const sp = h('span', '', g); sp.style.cssText = `width:${(13 - cnt) * 26 + 14}px;flex:none`;
        const l = h('span', 'mono', g, lab); l.style.cssText = 'font-size:22px;font-weight:700;width:120px;flex:none';
        const ds = h('span', '', g, desc); ds.style.cssText = 'font-size:21px;color:var(--ink-2)';
        return { g, boxes };
      };
      d.m1 = mk(by, 13, true, 'opus 13', '검증·반박·중재, 그리고 깊은 분석이 필요한 진단·설계·작명');
      d.m2 = mk(by + 46, 5, false, 'sonnet 5', '절차가 정해진 일: 양이 많은 1차 배정·분류·군집 해석, 조항 추출, 보고서 정리');
      d.ed = K.at(root, '', { x: 1405, y: by - 4, w: 395 });
      d.ed.style.cssText += ';display:flex;gap:12px;align-items:flex-start';
      noEdit(d.ed, 34);
      const et = h('div', '', d.ed, '<div style="font-size:22px;font-weight:800;color:#B3261E">Edit 도구 없음 3개</div><div style="font-size:20px;line-height:1.4;color:var(--ink-2);margin-top:2px">검증 쪽이 상대 파일을 고치지 못하고 자기 검토 파일만 쓴다</div>');
      et.style.flex = '1';
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.hh, lt, 0.3, { y: 8 });
      d.heads.forEach((e, i) => K.rise(e, lt, 0.35 + i * 0.12, { y: 12 }));
      d.harr.forEach((p, i) => K.draw(p, lt, 0.5 + i * 0.12, 0.25));
      // 열 순서대로 타일이 붙는다: 생성 → 검증 → 중재·정리
      d.rows.forEach((r, ri) => {
        K.rise(r.lab, lt, 0.55 + ri * 0.08, { x: -20, y: 0 });
        K.wipe(r.line, lt, 0.6 + ri * 0.08, 0.6);
        r.all.forEach(t => {
          const ci = t._kind === 'make' ? 0 : t._kind === 'check' ? 1 : 2;
          K.rise(t, lt, 0.7 + ci * 0.45 + ri * 0.07, { y: 14, blur: 4 });
        });
      });
      d.m1.boxes.forEach((b, i) => K.pop(b, lt, 2.2 + i * 0.03));
      d.m2.boxes.forEach((b, i) => K.pop(b, lt, 2.35 + i * 0.03));
      K.rise(d.m1.g, lt, 2.1, { y: 8 });
      K.rise(d.m2.g, lt, 2.25, { y: 8 });
      K.rise(d.ed, lt, 2.4, { x: 16, y: 0 });
      // 머무는 동안: 한 하네스씩 실제 호출 순서대로 타일이 켜진다
      const T0 = 3.0, PER = 3.2;
      const k = K.cycle(lt, T0, PER, d.rows.length);
      d.rows.forEach((r, ri) => {
        K.mark(r.bg, ri === k, 'rgba(47,123,255,.05)');
        let act = null;
        if (ri === k) {
          const u = (lt - T0) % PER;
          const step = 2.6 / r.seq.length;
          const idx = Math.floor(u / step);
          if (idx < r.seq.length) act = r.seq[idx];
        }
        r.all.forEach(t => {
          const on = t === act;
          RH.set(t, 'background', on ? SOFT[t._kind] : 'var(--paper-3)');
          RH.set(t, 'boxShadow', on ? `0 0 0 4px ${SOFT[t._kind]}` : 'none');
        });
      });
    },
  });

  // 12. 원칙 3
  DECK.slide({
    id: 'h-p3', title: '원칙 3. 파일로 주고받고, 스크립트로 검사한다', chapter: CH,
    notes: '에이전트끼리 대화로 결과를 넘기지 않는다. 앞 단계가 _workspace에 JSON 파일을 쓰면 다음 단계가 그 파일을 읽는다(kac-record-assign t1: 묶음 3개, 단계마다 파일 3개).\n파일을 쓴 에이전트는 바로 validate_batch.py를 실행한다. key 누락·중복, 정해진 한글 표기(level, confidence), ID 접두와 묶음 후보 포함 여부, 미배정 유형, 빈 근거를 검사하고, 오류가 있으면 해당 key와 이유를 출력하며 종료 코드 1을 낸다. 에이전트는 OK가 나올 때까지 고치고, 세 번 고쳐도 통과하지 못하면 남은 오류를 보고하고 멈춘다(배정·검증 에이전트 정의).\n오케스트레이터에는 통과 여부와 건수만 돌아온다. 판단 내용은 파일에 남아 사후에 확인할 수 있다. 화면의 반환값은 results/batch_0001.json 기준(항목 6, 미배정 1)이고, 오류 예는 SKILL.md의 시험 항목이다.\n출처: kac-record-assign/.claude/skills/record-assign/SKILL.md, scripts/validate_batch.py, .claude/agents/record-assigner.md, _workspace/t1/',
    setup(root, d) {
      d.T = K.title(root, { kicker: '원칙 3 · kac-record-assign t1', title: '파일로 주고받고, 스크립트로 검사한다' });
      d.svg = K.svg(root);
      // 위: 단계별 폴더
      const FL = [
        ['batches/', '3개', 'make_batches.py', 'script'],
        ['results/', '3개', 'record-assigner', 'make'],
        ['verify/', '3개', 'assignment-verifier', 'check'],
        ['arbitrate/', '3개', 'assignment-arbiter', 'judge'],
        ['output/t1/', 'csv·xlsx·md', 'merge_results.py', 'script'],
      ];
      d.fl = FL.map((f, i) => {
        const x = 120 + i * 345;
        const sc = f[3] === 'script';
        const b = K.at(root, '', { x, y: 288, w: 300, h: 90 });
        b.style.cssText += `;border-radius:12px;box-sizing:border-box;padding:12px 16px;background:${sc ? 'transparent' : 'var(--paper-3)'};border:2px ${sc ? 'dashed var(--rule-2)' : 'solid ' + KIND[f[3]]}`;
        b.innerHTML = `<div><span class="mono" style="font-size:22px;font-weight:700">${f[0]}</span><span style="float:right;font-size:20px;font-weight:600;color:var(--mute)">${f[1]}</span></div>` +
          `<div style="margin-top:8px;font-size:19px;color:var(--mute);white-space:nowrap">작성 <span class="mono" style="font-size:19px;font-weight:500;color:${sc ? 'var(--ink-2)' : KIND[f[3]]}">${f[2]}</span></div>`;
        let p = null;
        if (i < FL.length - 1) { p = K.path(d.svg, [[x + 300, 333], [x + 343, 333]], { color: C.ink2, width: 2.5, arrow: true }); K.dots(d.svg, p, 1, { r: 5, color: C.blue }); }
        return { b, p };
      });
      // 확대 표시: results/ → 파일 카드
      d.zoom = s('path', { d: 'M 465 378 L 765 378 L 800 440 L 120 440 Z', fill: 'rgba(47,123,255,.06)', stroke: 'rgba(47,123,255,.35)', 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }, d.svg);
      // 파일 카드(실제 내용 일부)
      d.card = K.at(root, 'card', { x: 120, y: 440, w: 680, h: 350 });
      d.card.style.overflow = 'hidden';
      const hd = tx(d.card, { x: 0, y: 0, w: 680, h: 46 }, '_workspace/t1/results/batch_0001.json', 'font-size:20px;font-weight:500;color:var(--ink-2);background:var(--paper-2);padding:10px 20px;box-sizing:border-box;border-bottom:1.5px solid var(--rule)', 'mono');
      const k = (t, f) => `<span class="fk" data-f="${f || ''}" style="color:var(--ink-2)">"${t}"</span>`;
      const v = (t, f) => `<span class="fv" data-f="${f || ''}" style="color:var(--blue-2)">${t}</span>`;
      const LN = [
        `{${k('batch_id')}: ${v('"batch_0001"')}, ${k('results')}: [`,
        `&nbsp;&nbsp;{${k('key', 'key')}: ${v('"k001"', 'key')}, ${k('level', 'level')}: ${v('"철"', 'level')},`,
        `&nbsp;&nbsp;&nbsp;${k('id', 'id')}: ${v('"F0242"', 'id')}, ${k('confidence', 'conf')}: ${v('"보통"', 'conf')},`,
        `&nbsp;&nbsp;&nbsp;${k('reason', 'reason')}: ${v('"제목의 \'자회사 특정감사…\'"', 'reason')}},`,
        `&nbsp;&nbsp;{${k('key', 'key')}: ${v('"k003"', 'key')}, ${k('level', 'level')}: ${v('"미배정"', 'level')}, ${k('id', 'id')}: ${v('null', 'id')},`,
        `&nbsp;&nbsp;&nbsp;${k('unassigned_type', 'ut')}: ${v('"분류기준표에 해당 업무 없음"', 'ut')},`,
        `&nbsp;&nbsp;&nbsp;${k('reason', 'reason')}: ${v('"폭력예방교육 우수기관…"', 'reason')}},`,
        `&nbsp;&nbsp;<span style="color:var(--mute)">… 항목 6개</span>`,
        `]}`,
      ];
      d.lines = LN.map((l, i) => tx(d.card, { x: 20, y: 60 + i * 31, w: 650 }, l, 'font-size:19px;line-height:1.45;white-space:nowrap;color:var(--ink)', 'mono'));
      d.fields = [...d.card.querySelectorAll('[data-f]')].filter(e => e.dataset.f);
      // 검사 스크립트
      d.val = K.at(root, '', { x: 850, y: 440, w: 490, h: 350 });
      d.val.style.cssText += ';border:2.5px dashed var(--rule-2);border-radius:14px;box-sizing:border-box;background:rgba(251,250,246,.6)';
      tx(d.val, { x: 22, y: 16 }, 'validate_batch.py', 'font-size:24px;font-weight:700;color:var(--ink)', 'mono');
      tx(d.val, { x: 22, y: 50 }, 't1 assign batch_0001', 'font-size:19px;color:var(--mute)', 'mono');
      const CK = [
        ['key', '<span class="mono">key</span> 빠짐·중복·없는 key'],
        ['level', '<span class="mono">level</span>: 철·단위업무·부서공통·미배정'],
        ['id', '<span class="mono">id</span>: F·U·C 접두, 묶음 후보 안의 ID'],
        ['conf', '<span class="mono">confidence</span>: 높음·보통·낮음'],
        ['ut', '미배정이면 <span class="mono">unassigned_type</span>'],
        ['reason', '<span class="mono">reason</span> 이 비지 않음'],
      ];
      d.ck = CK.map((c, i) => {
        const r = K.at(d.val, '', { x: 12, y: 92 + i * 41, w: 466, h: 38 });
        r.style.cssText += ';display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:8px;box-sizing:border-box';
        const tk = tick(r, 24);
        const t = h('span', '', r, c[1]); t.style.cssText = 'font-size:20px;color:var(--ink);white-space:nowrap';
        t.querySelectorAll('.mono').forEach(m => { m.style.fontSize = '19px'; m.style.color = 'var(--ink-2)'; });
        return { r, tk, f: c[0] };
      });
      d.a1 = K.path(d.svg, [[800, 560], [848, 560]], { color: C.ink2, width: 2.5, arrow: true }); K.dots(d.svg, d.a1, 1, { r: 5, color: C.blue });
      d.a2 = K.path(d.svg, [[1340, 500], [1388, 500]], { color: C.ok, width: 2.5, arrow: true });
      d.a3 = K.path(d.svg, [[1340, 690], [1388, 690]], { color: C.bad, width: 2.5, arrow: true });
      // 결과: 통과 / 걸림
      d.ok = K.stampEl(root, 'OK 6', 'ok', { x: 1420, y: 452 });
      d.ok.style.fontSize = '46px';
      d.okc = tx(root, { x: 1400, y: 546, w: 400 }, 'OK와 항목 수를 출력한다(종료 코드 0)', 'font-size:20px;color:var(--ink-2)');
      d.fail = K.at(root, '', { x: 1400, y: 610, w: 400, h: 180 });
      d.fail.style.cssText += ';border:2px solid rgba(232,72,58,.5);background:var(--bad-soft);border-radius:12px;padding:14px 16px;box-sizing:border-box';
      d.fail.innerHTML = '<div style="font-size:20px;font-weight:800;color:#B3261E">걸렸을 때(시험 항목 예)</div>' +
        '<div style="font-size:19px;margin-top:8px;color:var(--ink);white-space:nowrap"><span class="mono" style="font-size:19px">k003: F9999</span>는 이 묶음의 후보에 없다</div>' +
        '<div style="font-size:20px;line-height:1.4;margin-top:8px;color:var(--ink-2)">종료 코드 1. 에이전트가 그 항목을 고쳐 다시 검사한다</div>';
      // 고쳐서 다시: 걸림 카드 → 파일 카드
      d.loop = K.path(d.svg, [[1600, 790], [1600, 818], [460, 818], [460, 796]], { color: C.bad, width: 2.5, dash: '8 7', arrow: true, radius: 14 });
      K.dots(d.svg, d.loop, 3, { r: 5, color: C.bad });
      d.lt = tx(root, { x: 560, y: 826, w: 1000 }, '고쳐서 다시 검사한다 · 세 번 고쳐도 통과하지 못하면 남은 오류를 보고하고 멈춘다', 'font-size:20px;font-weight:600;color:#B3261E;text-align:center');
      // 아래: 오케스트레이터로 돌아오는 값
      d.ret = K.at(root, '', { x: 120, y: 880, w: 1680, h: 98 });
      d.ret.style.cssText += ';border-top:2px solid var(--ink)';
      tx(d.ret, { x: 0, y: 12 }, '에이전트가 돌려주는 값(배정 단계, 묶음 하나)', 'font-size:20px;font-weight:600;color:var(--mute)');
      d.obj = tx(d.ret, { x: 0, y: 46 }, `{ batch_id: <span style="color:var(--blue-2)">'batch_0001'</span>, validated: <span style="color:var(--ok)">true</span>, count: <b>6</b>, open_count: <b>1</b> }`, 'font-size:22px;font-weight:500;white-space:nowrap;color:var(--ink)', 'mono');
      d.a4 = K.path(d.svg, [[1030, 941], [1084, 941]], { color: C.blue, width: 2.5, arrow: true }); K.dots(d.svg, d.a4, 1, { r: 5, color: C.blue });
      d.orc = K.at(root, '', { x: 1092, y: 906, w: 330, h: 70 });
      d.orc.style.cssText += ';border:2px solid var(--blue);border-radius:12px;background:var(--paper-3);padding:8px 16px;box-sizing:border-box';
      d.orc.innerHTML = '<div class="mono" style="font-size:20px;font-weight:500;color:var(--blue-2)">record-assign</div><div style="font-size:19px;color:var(--ink-2)">오케스트레이터(워크플로)</div>';
      d.rc = tx(root, { x: 1446, y: 908, w: 354 }, '판단 내용은 파일에 남고, 돌아오는 것은 건수뿐이다', 'font-size:21px;font-weight:700;line-height:1.4;color:var(--ink)');
    },
    render(lt, d) {
      d.T.render(lt);
      d.fl.forEach((f, i) => {
        K.rise(f.b, lt, 0.35 + i * 0.09, { y: 14 });
        if (f.p) K.draw(f.p, lt, 0.55 + i * 0.09, 0.3, { speed: 60 });
      });
      d.zoom.style.opacity = prog(lt, 0.85, 0.4, ease.linear).toFixed(3);
      K.rise(d.card, lt, 0.9, { y: 18 });
      d.lines.forEach((l, i) => K.wipe(l, lt, 1.0 + i * 0.07, 0.35));
      K.draw(d.a1, lt, 1.4, 0.25, { speed: 50 });
      K.rise(d.val, lt, 1.35, { x: 20, y: 0 });
      // 검사 항목이 차례로 통과
      d.ck.forEach((c, i) => {
        K.rise(c.r, lt, 1.5 + i * 0.06, { y: 8, blur: 0 });
        tickDraw(c.tk, prog(lt, 1.75 + i * 0.09, 0.25, ease.outCubic));
      });
      K.draw(d.a2, lt, 2.25, 0.2);
      K.stamp(d.ok, lt, 2.4, { rot: -7 });
      K.rise(d.okc, lt, 2.55, { y: 8 });
      K.draw(d.a3, lt, 2.5, 0.2);
      K.rise(d.fail, lt, 2.6, { x: 16, y: 0 });
      K.draw(d.loop, lt, 2.75, 0.5, { speed: 160 });
      K.rise(d.lt, lt, 2.9, { y: 6 });
      K.rise(d.ret, lt, 2.0, { y: 12 });
      K.draw(d.a4, lt, 2.4, 0.25, { speed: 60 });
      K.rise(d.orc, lt, 2.5, { x: 16, y: 0 });
      K.rise(d.rc, lt, 2.7, { y: 8 });
      // 머무는 동안: 검사 항목을 하나씩 짚고, 파일 카드에서 해당 칸이 함께 켜진다
      const k = K.cycle(lt, 3.3, 1.1, d.ck.length);
      const f = k >= 0 ? d.ck[k].f : '';
      d.ck.forEach((c, i) => K.mark(c.r, i === k, 'rgba(25,169,116,.12)'));
      d.fields.forEach(e => RH.set(e, 'background', e.dataset.f === f ? 'rgba(25,169,116,.20)' : 'transparent'));
    },
  });

  // 13. 사람이 정할 것은 남겨 둔다
  DECK.slide({
    id: 'h-human', title: '추천까지만, 검토와 승인은 사람이', chapter: '맺음', place: { before: 'summary' }, wimg: 'g07_review',
    notes: '필름 I 구간과 같은 말이다: 다섯 하네스는 추천까지만 하고, 검토와 승인은 사람이 한다. 하네스는 근거가 선 것만 판정하고, 나머지는 상태값으로 표시해 사람에게 넘긴다.\n조직변경 영향도: 확정안 2건(F0164, F0153)도 사람이 검토한 뒤 적용한다. 검토필요 1건(F0162)과 시나리오에 답이 없는 질문 4가지(이관 범위, 디지털트윈사업부 거취, 신공항건설2부 거취, 부 이름)는 사람이 정한다.\n배정 t1: 확정 33, 확정(중재) 7. 검토필요는 이번 실행에 없었고, 제목 정보가 부족한 문서 5건은 철을 정하지 않았다. 점검 test01: 정정 권고 68, 유지 29, 사람 확인 필요 3묶음. 정정안 반영 여부는 사용자가 정한다.\n조직 설계: 대안 3개가 1차 보완 필요, 2차 채택 가능 판정을 받았고, 추천안 OPT-R과 함께 경영진이 결정할 질문 6가지를 남겼다. 단위업무명(감사실): 제안 23건 중 통과 21, 수정필요 2는 검토 의견과 함께 제안표에 남겼고, 보류 군집이 21개다.\n출처: 각 하네스 output/ 의 영향도_보고서.md, 요약.md, 조직개편_추천보고서.md, 단위업무_제안표.csv',
    setup(root, d) {
      d.T = K.title(root, { kicker: '다섯 하네스는 추천까지만 한다', title: '검토와 승인은 사람이 한다' });
      d.svg = K.svg(root);
      const BY = 680;   // 경계: 위는 하네스가 낸 판정, 아래는 사람에게 넘기는 것
      d.band = K.at(root, '', { x: 100, y: BY, w: 1720, h: 300 });
      d.band.style.cssText += ';background:var(--warn-soft);border-radius:18px';
      d.bl = s('path', { d: `M 120 ${BY} L 1800 ${BY}`, stroke: C.warn, 'stroke-width': 2.5, 'stroke-dasharray': '10 8', fill: 'none' }, d.svg);
      d.ul = K.path(d.svg, [[330, 402], [1800, 402]], { color: 'rgba(25,169,116,.45)', width: 2 });
      d.up = K.human(root, { text: '하네스가 낸 판정', x: 120, y: 380 });
      d.up.style.background = '#0B7A52';
      d.hu = K.human(root, { text: '사람에게 넘기는 것', x: 120, y: BY - 22 });
      d.hu.style.background = '#965A00';
      const W = 316, G = 341;
      const ST = (cls, t, n) => ({ cls, t, n });
      // 필름과 같은 순서
      const COLS = [
        { hn: 'kac-record-assign', cs: K.HZ.assign.short, hk: 'assign',
          up: [ST('ok', '확정', '33'), ST('ok', '확정(중재)', '7')], usub: '고유 제목 40개',
          dn: [ST('warn', '검토필요', '0'), ST('ghost', '미배정 문서', '5')], dsub: '제목 정보가 부족한 문서는 철을 정하지 않았다' },
        { hn: 'kac-classification-audit', cs: K.HZ.audit.short, hk: 'audit',
          up: [ST('bad', '정정 권고', '68'), ST('ok', '유지', '29')], usub: '점검한 묶음 100개',
          dn: [], stamp: ['사람 확인 필요', 'warn', '3'], dsub: '판정과 반박 근거를 함께 남긴다. 정정안 반영은 사용자가 정한다' },
        { hn: 'kac-unit-task-naming', cs: K.HZ.naming.short, hk: 'naming',
          up: [ST('ok', '통과', '21')], usub: '감사실 제안 23건',
          dn: [ST('warn', '수정필요', '2'), ST('ghost', '보류 군집', '21')], dsub: '검토 의견과 함께 제안표에 남긴다' },
        { hn: 'kac-org-change-impact', cs: K.HZ.orgchange.short, hk: 'orgchange',
          up: [ST('ok', '확정안', '2')], usub: 'F0164 · F0153<br>적용 전에 사람이 검토한다',
          dn: [ST('warn', '검토필요', '1'), ST('ghost', '확인필요 질문', '4')], dsub: '이관 범위, 디지털트윈사업부·신공항건설2부 거취, 부 이름' },
        { hn: 'kac-org-strategy', cs: K.HZ.strategy.short, hk: 'strategy',
          up: [ST('warn', '1차 보완 필요', ''), ST('ok', '2차 채택 가능', '')], usub: '대안 3개 모두 · 추천안 OPT-R',
          dn: [], stamp: ['경영진 결정', 'blue', '6'], dsub: '결정 사항마다 하네스의 추천을 붙였다' },
      ];
      const item = (it, x, y) => {
        const g = K.at(root, '', { x, y });
        g.style.cssText += ';display:flex;align-items:center;gap:14px;white-space:nowrap';
        h('span', 'chip lg ' + it.cls, g, it.t);
        if (it.n !== '') { const n = h('span', 'num', g, it.n); n.style.cssText = 'font-size:46px;font-weight:850;letter-spacing:-0.03em;line-height:1'; }
        return g;
      };
      const UY = 440, DY = BY + 42, PIT = 66;
      d.cols = COLS.map((c, i) => {
        const x = 120 + i * G;
        const hd = K.at(root, '', { x: x - 10, y: 284, w: W + 20, h: 80 });
        hd.style.cssText += ';border-radius:10px';
        tx(hd, { x: 10, y: 8 }, c.hn, 'font-size:19px;font-weight:500;color:var(--ink-2);white-space:nowrap', 'mono');
        tx(hd, { x: 10, y: 36 }, c.cs, 'font-size:27px;font-weight:900;letter-spacing:-0.02em;font-family:var(--display);color:' + K.HZ[c.hk].c);
        const ups = c.up.map((it, j) => item(it, x, UY + j * PIT));
        const us = tx(root, { x, y: UY + c.up.length * PIT + 4, w: W - 36 }, c.usub, 'font-size:21px;line-height:1.4;color:var(--ink-2)');
        const dns = c.dn.map((it, j) => item(it, x, DY + j * PIT));
        let st = null, stn = null;
        if (c.stamp) {
          st = K.stampEl(root, c.stamp[0], c.stamp[1], { x: x + 4, y: DY + 2 });
          st.style.fontSize = '28px'; st.style.borderWidth = '4px'; st.style.padding = '6px 14px';
          stn = tx(root, { x: x + (c.stamp[0].length > 5 ? 248 : 204), y: DY + 6 }, c.stamp[2], 'font-size:48px;font-weight:850;letter-spacing:-0.03em;line-height:1;color:' + (c.stamp[1] === 'blue' ? 'var(--blue)' : '#965A00'), 'num');
        }
        const dy = c.stamp ? DY + 88 : DY + c.dn.length * PIT + 6;
        const ds = tx(root, { x, y: dy, w: W - 20 }, c.dsub, 'font-size:21px;line-height:1.45;color:var(--ink-2)');
        const px = x + W - 18;
        const p = K.path(d.svg, [[px, BY - 46], [px, BY + 30]], { color: C.warn, width: 2.5, arrow: true });
        K.dots(d.svg, p, 2, { r: 5, color: C.warn });
        return { hd, ups, us, dns, st, stn, ds, p };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      K.pop(d.up, lt, 0.35);
      K.draw(d.ul, lt, 0.45, 0.6);
      d.cols.forEach((c, i) => {
        const t0 = 0.45 + i * 0.1;
        K.rise(c.hd, lt, t0, { y: 12 });
        c.ups.forEach((u, j) => K.rise(u, lt, t0 + 0.2 + j * 0.08, { y: 10 }));
        K.rise(c.us, lt, t0 + 0.35, { y: 8 });
      });
      K.wipe(d.band, lt, 1.2, 0.6, 'down');
      d.bl.style.opacity = prog(lt, 1.2, 0.3, ease.linear).toFixed(3);
      K.pop(d.hu, lt, 1.35);
      d.cols.forEach((c, i) => {
        const t1 = 1.55 + i * 0.1;
        K.draw(c.p, lt, t1, 0.3, { speed: 46 });
        c.dns.forEach((u, j) => K.rise(u, lt, t1 + 0.15 + j * 0.08, { y: 10 }));
        if (c.st) { K.stamp(c.st, lt, t1 + 0.6, { rot: -6 }); K.rise(c.stn, lt, t1 + 0.75, { y: 8 }); }
        K.rise(c.ds, lt, t1 + 0.35, { y: 8 });
      });
      // 머무는 동안: 하네스 하나씩 강조가 옮겨 가고, 그 열의 넘김 선이 굵어진다
      const k = K.cycle(lt, 3.2, 1.8, d.cols.length);
      d.cols.forEach((c, i) => {
        K.mark(c.hd, i === k, 'rgba(47,123,255,.08)');
        if (lt > 2.4) c.p.setAttribute('stroke-width', i === k ? 4 : 2.5);
      });
    },
  });
})();

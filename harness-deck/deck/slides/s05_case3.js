/* 조직 개편 추천 — 과제 「전략적 조직 설계」. 필름 H 구간에 이어진다. 출처는 storyboard.md 「4. 사례 3」
   하네스: kac-org-strategy. 숫자는 output/20261117-safety/조직개편_추천보고서.md 와 _workspace/20261117-safety/ 에서 확인했다. */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css } = RH;
  const C = K.C;
  const CH = '조직 개편 추천 · 전략적 조직 설계';

  // ── 이 장 파일 안에서만 쓰는 함수 ─────────────────────────
  // 글 상자: K.at + 인라인 스타일
  const T = (parent, box, html, st) => {
    const e = K.at(parent, '', box, html);
    if (st) e.style.cssText += ';' + st;
    return e;
  };
  // 에이전트 노드: 이름이 긴 노드가 있어 모델 표시를 오른쪽 아래로 내린다
  const agentNode = (root, o) => {
    const el = K.agent(root, o);
    const md = el.querySelector('.md');
    if (md) { md.style.top = 'auto'; md.style.bottom = '12px'; }
    return el;
  };
  // 작은 칩(보조 글자 19px)
  const mini = (cls, text) => `<span class="chip ${cls}" style="height:30px;font-size:19px;padding:0 9px;border-radius:6px">${text}</span>`;
  // 두 점 사이 S자 곡선. bend 는 양 끝의 세로 휨
  const sCurve = (x1, y1, x2, y2, bend = 0) => {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1 + bend}, ${mx} ${y2 + bend}, ${x2} ${y2}`;
  };

  // 28. 챕터 영상
  DECK.slide({
    id: 'ch-strategy', title: '조직 개편 추천 챕터 영상', bg: 'paper', harness: 'strategy', video: 'media/ch_strategy.mp4', poster: 'media/ch_strategy.jpg',
    notes: '10초 챕터 영상. 필름 H 구간의 작업장(배치 시안을 놓은 원탁)이 움직이고, 질문 「어떻게 개편할지도 제안받을 수 있나요?」에 kac-org-strategy가 답한다. 필름은 이 하네스를 절차로만 보여 줬고, 여기서는 실제 실행 결과(대안 3개, 추천안 OPT-R, 경영진 결정 6가지)를 본다. 끝나면 → 키로 넘긴다.',
  });

  // 29. 과제와 흐름
  DECK.slide({
    id: 'c3-flow', title: '과제와 흐름', chapter: CH, harness: 'strategy',
    notes: '사용자가 준 입력은 전략 방향 한 줄이다. 스크립트가 분류기준표·문서목록에서 근거 ID 803개를 계산하고(facts.json), 직제규정·시행세칙·정관·공사법 11개 파일을 텍스트로 뽑는다.\n진단 에이전트(문제 10개)와 규정 제약 에이전트(제약 18건)가 함께 돌고, 설계자가 관점 셋으로 대안을 하나씩 만든다. 반박 검토자는 대안 파일을 고칠 수 없고 검토서만 쓴다. 세 대안 모두 1차 검토 → 보완 → 2차 검토를 거쳤다.\n마지막에 보고서 작성자가 종합하고, 메인이 check_citations.py 로 근거 표기 64건을 다시 대조했다(오류 0건).\n출처: kac-org-strategy/_workspace/20261117-safety/run.json, data/facts/facts.json, data/regulations/index.json, .claude/skills/org-strategy/SKILL.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 과제와 흐름', title: '방향 한 줄을 받아 대안 셋을 만들고 반박한다' });
      // 입력 줄
      d.inLab = T(root, { x: 120, y: 300 }, '전략 방향 · 사용자가 준 입력', 'font-size:22px;font-weight:700;color:var(--mute)');
      d.qbar = T(root, { x: 120, y: 346, w: 6, h: 76 }, '', `background:${C.ink};border-radius:3px`);
      d.quote = K.at(root, 'quote', { x: 148, y: 344, w: 720 }, '“안전·보안 기능을 통합하는 방향”');
      d.quote.style.fontSize = '46px'; d.quote.style.lineHeight = '1.6';
      d.stats = [
        { x: 960, v: 803, lab: '근거 ID', cap: '수발신 260 · 유사단위업무 251 · 부서현황 122<br>기능분산 99 · 문서량 71', src: 'data/facts/facts.json' },
        { x: 1420, v: 11, lab: '규정 파일', cap: '직제규정 3 · 직제규정시행세칙 4<br>정관 1 · 한국공항공사법 3', src: 'data/regulations/' },
      ].map(o => {
        const g = K.at(root, '', { x: o.x, y: 290, w: o.x === 960 ? 410 : 380 });
        const top = h('div', '', g); top.style.cssText = 'display:flex;align-items:baseline;gap:14px';
        const n = h('span', 'num', top, '0'); n.style.cssText = 'font-size:84px;font-weight:850;letter-spacing:-0.045em;line-height:1';
        const l = h('span', '', top, o.lab); l.style.cssText = 'font-size:26px;font-weight:700';
        const c = h('div', '', g, o.cap); c.style.cssText = 'font-size:19px;line-height:1.45;margin-top:10px;color:var(--ink-2)';
        const sr = h('div', 'mono', g, o.src); sr.style.cssText = 'font-size:19px;color:var(--mute);margin-top:4px';
        return { g, n, v: o.v };
      });
      // 흐름
      d.svg = K.svg(root);
      d.s1 = K.script(root, { x: 120, y: 528, w: 300, name: 'build_facts.py', cap: '근거 ID 803개' });
      d.s2 = K.script(root, { x: 120, y: 760, w: 300, name: 'extract_regulations.py', cap: '규정 본문 11개 파일' });
      d.a1 = agentNode(root, { name: 'org-diagnostician', role: '조직 진단', model: 'opus', x: 470, y: 500, w: 410, note: '문제 10개 · ISSUE-01~10' });
      d.a2 = agentNode(root, { name: 'regulation-constraint-checker', role: '규정 제약 정리', model: 'sonnet', x: 470, y: 736, w: 410, note: '제약 18건 · RC-01~18' });
      d.dz = agentNode(root, { name: 'org-option-designer', role: '관점별 대안 설계·보완', model: 'opus', x: 990, y: 500, w: 380, note: '대안 1건 = JSON 1개' });
      d.cr = agentNode(root, { name: 'org-option-critic', role: '대안별 반박 검토', model: 'opus', kind: 'check', x: 990, y: 790, w: 380, note: '대안 파일은 고치지 않는다' });
      d.wr = agentNode(root, { name: 'executive-report-writer', role: '경영진 보고서', model: 'opus', kind: 'write', x: 1460, y: 500, w: 340, note: '비교 · 추천 · 실행 순서' });
      d.ck = K.script(root, { x: 1460, y: 704, w: 340, name: 'check_citations.py', cap: '근거 표기 64건 · 오류 0건' });
      d.out = K.chip(root, '조직개편_추천보고서.md', 'id', { x: 1460, y: 872 });
      d.out.style.fontSize = '21px';
      const P = (pts, o = {}) => { const p = K.path(d.svg, pts, { color: o.color || C.blue, width: 2.5, arrow: true, radius: 14 }); K.dots(d.svg, p, o.n ?? 2, { r: 5, color: o.color || C.blue }); return p; };
      d.paths = [
        P([[420, 564], [466, 564]], { n: 1 }),
        P([[420, 796], [466, 796]], { n: 1 }),
        P([[880, 564], [986, 564]]),
        P([[880, 800], [936, 800], [936, 600], [986, 600]]),
        P([[1300, 790], [1300, 632]], { color: C.bad }),
        P([[1370, 564], [1456, 564]]),
        P([[1630, 630], [1630, 700]], { n: 1 }),
        P([[1630, 778], [1630, 868]], { n: 1 }),
      ];
      d.down = P([[1060, 632], [1060, 786]]);
      // 반복 표시: 관점 칩과 차수 칩
      d.loopLab = T(root, { x: 1090, y: 650, w: 190 }, '', 'text-align:center');
      d.persp = [['OPT-A', '기능통합'], ['OPT-B', '전략사업'], ['OPT-C', '현장운영']].map(([id, nm]) => {
        const e = T(d.loopLab, { x: 0, y: 0, w: 190 }, `<span class="mono" style="font-size:20px;color:var(--blue-2);font-weight:700">${id}</span> <span style="font-size:22px;font-weight:800">${nm}</span>`, 'text-align:center');
        return e;
      });
      d.r1 = T(root, { x: 1090, y: 696, w: 190 }, mini('warn', '1차 보완 필요'), 'text-align:center');
      d.r2 = T(root, { x: 1090, y: 696, w: 190 }, mini('ok', '2차 채택 가능'), 'text-align:center');
      d.loopCap = T(root, { x: 1090, y: 740, w: 190 }, '세 관점 모두 두 번 검토', 'font-size:19px;color:var(--mute);text-align:center');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.inLab, lt, 0.3, { y: 10 });
      K.wipe(d.qbar, lt, 0.35, 0.4, 'down');
      K.rise(d.quote, lt, 0.4, { x: -24, y: 0, blur: 8 });
      d.stats.forEach((st, i) => { K.rise(st.g, lt, 0.55 + i * 0.12, { y: 16 }); K.count(st.n, lt, 0.55 + i * 0.12, 1.2, st.v); });
      K.rise(d.s1, lt, 0.9, { x: -20, y: 0 });
      K.rise(d.s2, lt, 1.0, { x: -20, y: 0 });
      K.pop(d.a1, lt, 1.15); K.pop(d.a2, lt, 1.25);
      K.pop(d.dz, lt, 1.5); K.pop(d.cr, lt, 1.6);
      K.pop(d.wr, lt, 1.9); K.rise(d.ck, lt, 2.05, { y: 12 }); K.pop(d.out, lt, 2.2);
      const pt0 = [1.0, 1.1, 1.35, 1.4, 1.75, 1.8, 2.0, 2.15];
      d.paths.forEach((p, i) => K.draw(p, lt, pt0[i], 0.4, { speed: 140 }));
      K.draw(d.down, lt, 1.7, 0.4, { speed: 140 });
      // 대안 ⇄ 검토 반복: 관점이 3초마다 바뀌고, 그 안에서 1차 → 2차
      const T0 = 2.4, PER = 3.0;
      const k = K.cycle(lt, T0, PER, 3);
      const loc = k < 0 ? 0 : (lt - T0) % PER;
      const vis = prog(lt, 1.9, 0.4);
      d.loopLab.style.opacity = vis.toFixed(3);
      d.persp.forEach((e, i) => {
        const on = (k < 0 ? 0 : k) === i;
        const a = on ? Math.min(prog(loc, 0, 0.3), k < 0 ? 1 : 1 - prog(loc, PER - 0.25, 0.25, ease.exit)) : 0;
        e.style.opacity = (k < 0 && i === 0 ? 1 : a).toFixed(3);
        e.style.transform = `translateY(${((1 - (k < 0 ? 1 : a)) * 8).toFixed(1)}px)`;
      });
      const second = k >= 0 && loc > 1.4;
      d.r1.style.opacity = (vis * (second ? 0 : 1)).toFixed(3);
      d.r2.style.opacity = (vis * (second ? 1 : 0)).toFixed(3);
      d.r2.style.transform = second ? `scale(${lerp(1.15, 1, prog(loc, 1.4, 0.3, ease.pop)).toFixed(3)})` : '';
      K.rise(d.loopCap, lt, 2.0, { y: 8 });
      // 검토자 쪽 테두리: 검토 중일 때 진하게
      d.cr.style.boxShadow = k >= 0 && loc < 1.4 ? '0 0 0 5px rgba(232,72,58,.16), 0 16px 36px -22px rgba(232,72,58,.55)' : '';
      d.dz.style.boxShadow = k >= 0 && loc >= 1.4 ? '0 0 0 5px rgba(47,123,255,.14), 0 16px 36px -22px rgba(47,123,255,.55)' : '';
    },
  });

  // 30. 진단
  DECK.slide({
    id: 'c3-diag', title: '진단', chapter: CH, harness: 'strategy',
    notes: 'org-diagnostician 이 사실 자료로 조직상 문제 10개를 찾았다(ISSUE-01~10). 모든 수치에 근거 ID를 붙였고, 진단서 단계의 인용 검사도 오류 0건이었다(근거 164건).\n왼쪽: 분류기준표는 같은 본부를 두 부서레벨1로 적고 분류 수준도 다르다. 안전보안실은 중기능 28개로 잘게, 안전보안본부(중앙통제센터·비상계획실·사이버보안센터)는 중기능 1개로 크게 나뉜다.\n가운데: 기록물철 설명을 대조하니 재난방재부와 중앙통제센터에 같은 일이 있다(이름이 달라 글자 유사도로는 잡히지 않았다).\n오른쪽: 부서 간 수신·발신 문서. 안전보안실이 가장 많다. 이 값은 사장 명의 문서가 빠진 상대 비교값이라 "문서가 오간다"는 확인에만 썼다.\n출처: _workspace/20261117-safety/01_diagnosis.md, data/facts/facts.json(DP-004, DP-014, DP-004-03, DP-014-03, CM-H01, CM-H13)',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 조직 진단', title: '같은 일이 두 부서에 나뉘어 있다' });
      // 문제 10개 줄
      const tabs = [
        '본부를 두 부서로 기록', '재난 대응 중복', '상황관리 분산', '항공보안 점검 분산', '출입·신분확인 분산',
        '정보보안 분산', '산업·건설안전 분산', '항공안전 두 본부', '비상대비 분산', '공항 보고 집중',
      ];
      const TW = (1680 - 9 * 12) / 10;
      d.panelOf = [0, 1, -1, -1, -1, 2, -1, -1, -1, 2];
      d.tabs = tabs.map((t, i) => {
        const x = 120 + i * (TW + 12);
        const rep = d.panelOf[i] >= 0;
        const e = K.at(root, '', { x, y: 290, w: TW, h: 100 });
        e.style.cssText += `;box-sizing:border-box;border-radius:10px;padding:10px 12px;border:1.5px solid ${rep ? 'var(--rule-2)' : 'var(--rule)'};background:${rep ? 'var(--paper-3)' : 'transparent'}`;
        e.innerHTML = `<div class="mono" style="font-size:19px;font-weight:700;color:${rep ? 'var(--blue-2)' : 'var(--mute)'}">ISSUE-${String(i + 1).padStart(2, '0')}</div><div style="font-size:20px;font-weight:${rep ? 700 : 500};line-height:1.25;margin-top:4px;color:${rep ? 'var(--ink)' : 'var(--mute)'}">${t}</div>`;
        return { e, x, cx: x + TW / 2 };
      });
      // 패널 세 개
      const PN = [{ x: 120, w: 480 }, { x: 640, w: 620 }, { x: 1300, w: 500 }];
      d.svgBack = K.svg(root);
      d.panels = PN.map(p => {
        const e = K.at(root, 'card flat', { x: p.x, y: 450, w: p.w, h: 535 });
        return { e, ...p };
      });
      // 탭 → 패널 연결선
      d.links = [[0, 0], [1, 1], [5, 2], [9, 2]].map(([ti, pi]) => {
        const t = d.tabs[ti], p = d.panels[pi];
        const px = p.x + p.w / 2;
        const path = K.path(d.svgBack, `M ${t.cx} 392 C ${t.cx} 428, ${px} 412, ${px} 448`, { color: C.blue, width: 2.5 });
        return { path, pi };
      });
      const head = (p, id, title) => {
        const e = K.at(root, '', { x: p.x + 24, y: 468, w: p.w - 48 });
        e.innerHTML = `<div class="mono" style="font-size:19px;font-weight:700;color:var(--blue-2)">${id}</div><div style="font-size:28px;font-weight:800;letter-spacing:-0.025em;margin-top:2px">${title}</div>`;
        return e;
      };
      // 패널 1: 분류 수준 차이 (ISSUE-01)
      const p1 = d.panels[0];
      d.h1 = head(p1, 'ISSUE-01', '같은 본부, 다른 분류 수준');
      const numRow = (x, y, w, name, a, al, b, bl, cite) => {
        const e = K.at(root, '', { x, y, w });
        e.innerHTML = `<div style="font-size:22px;font-weight:700">${name}</div>` +
          `<div style="display:flex;align-items:baseline;gap:10px;margin-top:2px"><span class="num" style="font-size:56px;font-weight:850;letter-spacing:-0.04em;line-height:1.05">${a}</span><span style="font-size:20px;color:var(--ink-2)">${al}</span>` +
          `<span class="num" style="font-size:56px;font-weight:850;letter-spacing:-0.04em;line-height:1.05;margin-left:18px">${b}</span><span style="font-size:20px;color:var(--ink-2)">${bl}</span>` +
          `<span class="mono" style="font-size:19px;color:var(--mute);margin-left:auto">${cite}</span></div>`;
        return e;
      };
      d.n1a = numRow(p1.x + 24, 548, p1.w - 48, '안전보안실', 44, '단위업무', 28, '중기능', 'DP-004');
      d.n1b = numRow(p1.x + 24, 748, p1.w - 48, '안전보안본부 <span style="font-size:19px;font-weight:500;color:var(--mute)">중앙통제센터·비상계획실·사이버보안센터</span>', 24, '단위업무', 1, '중기능', 'DP-014');
      // 단위업무 칸: 중기능 묶음마다 간격
      const GA = [1, 2, 1, 1, 1, 1, 1, 1, 1, 4, 2, 4, 1, 1, 2, 1, 3, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1];   // classification.json 안전보안실 중기능별 단위업무 수
      const SQ = 20, GI = 3, GB = 11, GW = p1.w - 48;
      const layout = (groups, x0, y0) => {
        const cells = []; let x = 0, y = 0;
        groups.forEach((n, gi) => {
          const need = n * SQ + (n - 1) * GI;
          if (x > 0 && x + need > GW) { x = 0; y += SQ + 8; }
          for (let j = 0; j < n; j++) { cells.push({ x: x0 + x, y: y0 + y, g: gi }); x += SQ + GI; }
          x += GB - GI;
        });
        return cells;
      };
      d.cellsA = layout(GA, p1.x + 24, 650).map(c => ({ ...c, e: T(root, { x: c.x, y: c.y, w: SQ, h: SQ }, '', 'border-radius:3px;background:rgba(27,42,74,.62)') }));
      d.groupA = GA.map((_, gi) => {
        const cs = d.cellsA.filter(c => c.g === gi);
        const x0 = Math.min(...cs.map(c => c.x)), x1 = Math.max(...cs.map(c => c.x)) + SQ, y0 = cs[0].y;
        return T(root, { x: x0 - 4, y: y0 - 4, w: x1 - x0 + 8, h: SQ + 8 }, '', `box-sizing:border-box;border:2.5px solid ${C.blue};border-radius:6px;opacity:0`);
      });
      const cellsB = [];
      for (let i = 0; i < 24; i++) cellsB.push({ x: p1.x + 24 + (i % 12) * (SQ + GI), y: 852 + Math.floor(i / 12) * (SQ + 8) });
      d.cellsB = cellsB.map(c => ({ ...c, e: T(root, { x: c.x, y: c.y, w: SQ, h: SQ }, '', 'border-radius:3px;background:rgba(27,42,74,.62)') }));
      d.boxB = T(root, { x: p1.x + 20, y: 848, w: 12 * (SQ + GI) - GI + 8, h: 2 * SQ + 8 + 8 }, '', `box-sizing:border-box;border:2.5px solid ${C.blue};border-radius:7px`);
      d.n1c = T(root, { x: p1.x + 24, y: 920, w: p1.w - 48 }, '분류기준표는 둘을 다른 부서레벨1로 두지만 직제에서는 한 본부다(RC-17).', 'font-size:19px;line-height:1.45;color:var(--ink-2)');
      // 패널 2: 재난 대응 중복 (ISSUE-02)
      const p2 = d.panels[1];
      d.h2 = head(p2, 'ISSUE-02', '재난 대응이 두 부서에 겹친다');
      const big = (x, y, w, v, lab, cite, align) => {
        const n = `<span class="num" style="font-size:60px;font-weight:850;letter-spacing:-0.04em;line-height:1">${v}</span>`;
        const c = `<span class="mono" style="font-size:19px;color:var(--mute)">${cite}</span>`;
        return T(root, { x, y, w },
          `<div style="display:flex;align-items:baseline;gap:12px;justify-content:${align === 'left' ? 'flex-start' : 'flex-end'}">${align === 'left' ? n + c : c + n}</div><div style="font-size:20px;font-weight:600;margin-top:8px">${lab}</div>`,
          `text-align:${align}`);
      };
      d.n2a = big(p2.x + 24, 548, 260, 12, '재난방재부 단위업무', 'DP-004-03', 'left');
      d.n2b = big(p2.x + p2.w - 284, 548, 260, 6, '중앙통제센터 단위업무', 'DP-014-03', 'right');
      const leftCol1 = ['U0607', 'U0609', 'U0610', 'U0611', 'U0612', 'U0614'];
      const leftCol2 = ['U0608', 'U0613', 'U0615', 'U0616', 'U0617', 'U0618'];
      const right = ['U0641', 'U0642', 'U0643', 'U0644', 'U0645', 'U0646'];
      d.chipPos = {};
      const mkChip = (id, x, y, strong) => {
        const c = K.chip(root, id, 'id', { x, y, w: 104 });
        c.style.justifyContent = 'center'; c.style.fontSize = '20px'; c.style.height = '32px';
        if (!strong) { c.style.color = 'var(--mute)'; c.style.borderColor = 'var(--rule)'; c.style.background = 'transparent'; }
        d.chipPos[id] = { x, y, e: c };
        return c;
      };
      const CY0 = 658, CDY = 38;
      d.chips = [];
      leftCol1.forEach((id, i) => d.chips.push(mkChip(id, p2.x + 24, CY0 + i * CDY, false)));
      leftCol2.forEach((id, i) => d.chips.push(mkChip(id, p2.x + 140, CY0 + i * CDY, id !== 'U0618')));
      right.forEach((id, i) => d.chips.push(mkChip(id, p2.x + p2.w - 128, CY0 + i * CDY, true)));
      d.svg2 = K.svg(root);
      d.themes = [
        ['위기관리 매뉴얼', [['U0608', 'U0641']]],
        ['재난안전통신망·NDMS', [['U0613', 'U0641']]],
        ['항공기사고 수습', [['U0615', 'U0645'], ['U0615', 'U0646']]],
        ['자연재난 정보·대응지시', [['U0617', 'U0642'], ['U0617', 'U0643']]],
      ].map(([nm, pairs], i) => {
        const lines = pairs.map(([a, b]) => {
          const A = d.chipPos[a], B = d.chipPos[b];
          const p = K.path(d.svg2, sCurve(A.x + 104, A.y + 16, B.x, B.y + 16), { color: C.warn, width: 2.5 });
          K.dots(d.svg2, p, 2, { r: 4.5, color: C.warn });
          return p;
        });
        const lab = T(root, { x: p2.x + 24 + (i % 2) * 290, y: i < 2 ? 908 : 942, w: 280 }, nm, 'font-size:20px;font-weight:600;color:var(--ink-2);display:flex;align-items:center;gap:8px');
        lab.insertAdjacentHTML('afterbegin', '<span style="width:12px;height:12px;border-radius:3px;background:var(--warn);flex:none"></span>');
        return { lines, lab, ids: pairs.flat() };
      });
      d.check = K.path(d.svg2, sCurve(d.chipPos.U0616.x + 104, d.chipPos.U0616.y + 16, d.chipPos.U0646.x, d.chipPos.U0646.y + 16), { color: C.mute, width: 2, dash: '5 6' });
      // 패널 3: 수발신 (ISSUE-10, ISSUE-06)
      const p3 = d.panels[2];
      d.h3 = head(p3, 'ISSUE-10 · ISSUE-06', '문서가 한 실로 몰린다');
      d.svg3 = K.svg(root);
      const hub = (cx, cy, N, R, r0, name, docs, cnt, cite) => {
        const g = { sp: [], N };
        for (let i = 0; i < N; i++) {
          const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
          const x1 = cx + Math.cos(a) * (r0 + 6), y1 = cy + Math.sin(a) * (r0 + 6), x2 = cx + Math.cos(a) * R, y2 = cy + Math.sin(a) * R;
          const l = s('line', { x1, y1, x2, y2, stroke: 'rgba(27,42,74,.24)', 'stroke-width': 1.5 }, d.svg3);
          const n = s('circle', { cx: x2, cy: y2, r: 3.5, fill: C.ink }, d.svg3);
          const dt = s('circle', { r: 3, fill: C.blue, opacity: 0 }, d.svg3);
          g.sp.push({ l, n, dt, x1, y1, x2, y2 });
        }
        g.core = s('circle', { cx, cy, r: r0, fill: C.blue }, d.svg3);
        g.txt = T(root, { x: cx + R + 26, y: cy - 66, w: 1800 - (cx + R + 26) },
          `<div style="font-size:22px;font-weight:700">${name}</div><div class="num" style="font-size:52px;font-weight:850;letter-spacing:-0.04em;line-height:1.05"><span>0</span><span style="font-size:26px;font-weight:700;margin-left:4px">건</span></div><div style="font-size:22px;color:var(--ink-2)">상대 부서 ${cnt}개</div><div class="mono" style="font-size:19px;color:var(--mute);margin-top:2px">${cite}</div>`);
        g.num = g.txt.querySelector('.num span');
        g.docs = docs;
        return g;
      };
      d.hubs = [
        hub(p3.x + 112, 648, 52, 92, 30, '안전보안실', 7577, 52, 'CM-H01'),
        hub(p3.x + 112, 868, 43, 80, 18, '사이버보안센터', 2779, 43, 'CM-H13'),
      ];
    },
    render(lt, d) {
      d.T.render(lt);
      d.tabs.forEach((t, i) => K.rise(t.e, lt, 0.3 + i * 0.05, { y: 14 }));
      d.panels.forEach((p, i) => K.rise(p.e, lt, 0.75 + i * 0.12, { y: 24 }));
      [d.h1, d.h2, d.h3].forEach((e, i) => K.rise(e, lt, 0.9 + i * 0.12, { y: 12 }));
      // 패널 1
      K.rise(d.n1a, lt, 1.1, { y: 10 });
      d.cellsA.forEach((c, i) => K.pop(c.e, lt, 1.2 + i * 0.015));
      K.rise(d.n1b, lt, 1.5, { y: 10 });
      d.cellsB.forEach((c, i) => K.pop(c.e, lt, 1.6 + i * 0.015));
      K.pop(d.boxB, lt, 2.0, { from: 1.08 });
      K.rise(d.n1c, lt, 2.1, { y: 8 });
      const ga = lt < 2.4 ? -1 : Math.floor((lt - 2.4) / 0.32) % d.groupA.length;
      d.groupA.forEach((g, i) => { g.style.opacity = i === ga ? '1' : '0'; });
      d.cellsA.forEach(c => { c.e.style.background = c.g === ga ? C.blue : 'rgba(27,42,74,.62)'; });
      const wb = K.wave(lt, 2.4);
      d.cellsB.forEach(c => { c.e.style.background = lt > 2.4 ? `rgba(47,123,255,${(0.55 + 0.4 * wb).toFixed(3)})` : 'rgba(27,42,74,.62)'; });
      // 패널 2
      K.rise(d.n2a, lt, 1.2, { y: 10 }); K.rise(d.n2b, lt, 1.3, { y: 10 });
      d.chips.forEach((c, i) => K.pop(c, lt, 1.35 + i * 0.03));
      const th = K.cycle(lt, 2.8, 2.0, d.themes.length);
      d.themes.forEach((t, i) => {
        t.lines.forEach((p, j) => K.draw(p, lt, 1.9 + i * 0.12 + j * 0.06, 0.5, { speed: 120 }));
        const on = th === i;
        t.lines.forEach(p => { p.setAttribute('stroke-width', on ? 4 : 2.5); if (lt > 2.6) p.style.opacity = on ? '1' : '0.35'; if (p._dots) p._dots.forEach(c => { if (!on) c.setAttribute('opacity', 0); }); });
        K.rise(t.lab, lt, 2.2 + i * 0.08, { y: 8 });
        t.lab.style.color = on ? '#965A00' : 'var(--ink-2)';
        t.lab.style.fontWeight = on ? '800' : '600';
      });
      K.draw(d.check, lt, 2.4, 0.4);
      const hot = th >= 0 ? d.themes[th].ids : [];
      Object.keys(d.chipPos).forEach(id => {
        const c = d.chipPos[id].e;
        c.style.boxShadow = hot.includes(id) ? '0 0 0 4px rgba(232,147,12,.28)' : 'none';
      });
      // 패널 3
      d.hubs.forEach((g, hi) => {
        const t0 = 1.3 + hi * 0.2;
        const pc = K.pop(g.core, lt, t0);
        g.core.style.transformOrigin = 'center'; g.core.style.transformBox = 'fill-box';
        g.sp.forEach((sp, i) => {
          const p = prog(lt, t0 + 0.1 + (i / g.N) * 0.7, 0.3);
          sp.l.style.opacity = p.toFixed(3); sp.n.style.opacity = p.toFixed(3);
          // 상대 부서에서 실로 들어오는 문서(점). 속도·위상은 고정 난수
          const run = lt - 2.6;
          if (run < 0) { sp.dt.setAttribute('opacity', 0); return; }
          const u = (run * (0.22 + 0.18 * K.rand(i, hi + 3)) + K.rand(i, hi + 9)) % 1;
          sp.dt.setAttribute('cx', lerp(sp.x2, sp.x1, u).toFixed(1));
          sp.dt.setAttribute('cy', lerp(sp.y2, sp.y1, u).toFixed(1));
          sp.dt.setAttribute('opacity', (Math.min(u / 0.15, (1 - u) / 0.15, 1) * clamp(run / 0.4)).toFixed(3));
        });
        K.rise(g.txt, lt, t0 + 0.2, { x: 16, y: 0 });
        K.count(g.num, lt, t0 + 0.2, 1.4, g.docs);
        void pc;
      });
      // 패널 강조 순환: 패널과 그 탭을 함께
      const pk = K.cycle(lt, 3.0, 3.0, 3);
      d.panels.forEach((p, i) => { if (lt > 1.2) p.e.style.borderColor = pk === i ? C.blue : 'var(--rule)'; p.e.style.borderWidth = pk === i ? '2.5px' : '1.5px'; });
      d.tabs.forEach((t, i) => {
        const on = pk >= 0 && d.panelOf[i] === pk;
        t.e.style.borderColor = on ? C.blue : d.panelOf[i] >= 0 ? 'var(--rule-2)' : 'var(--rule)';
        t.e.style.background = on ? 'rgba(47,123,255,.08)' : d.panelOf[i] >= 0 ? 'var(--paper-3)' : 'transparent';
      });
      d.links.forEach(l => {
        const on = pk === l.pi;
        const p = prog(lt, 1.0, 0.5);
        l.path.style.strokeDasharray = ''; l.path.style.strokeDashoffset = '';
        l.path.style.opacity = (p * (on ? 1 : 0.18)).toFixed(3);
      });
    },
  });

  // 31. 대안 3개 비교
  DECK.slide({
    id: 'c3-options', title: '대안 3개 비교', chapter: CH, harness: 'strategy',
    notes: '설계자는 같은 진단서·제약 목록을 받아 관점 셋에서 서로의 파일을 보지 않고 대안을 하나씩 만들었다. 숫자는 보완 뒤(2차) 대안의 영향 규모다. 단위업무 수는 보완하면서 OPT-A 16→11, OPT-B 18→17, OPT-C 32→29로 줄었다.\n세 대안 모두 1차 검토에서 보통 지적 6건씩을 받아 "보완 필요", 보완 뒤 2차에서 "채택 가능"이 됐다. 2차에 남은 지적: OPT-A 보통 1·경미 3, OPT-B 경미 3, OPT-C 경미 2.\n오른쪽은 같은 단위업무를 서로 다른 부서로 옮기려는 충돌 4건이다. 넷 다 OPT-A 쪽을 택했다. 세칙이 이미 그렇게 정하고 있거나(U0636, U0248, 항공기사고 수습), 새 부와 부장 직위를 만들지 않기 때문이다(U0535·U0537·U0167).\n출처: 조직개편_추천보고서.md 4.2·4.3절, _workspace/20261117-safety/run.json, 03_option_OPT-A/B/C.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 대안과 반박', title: '세 관점의 대안, 모두 반박을 거쳐 채택 가능' });
      d.svg = K.svg(root);
      // 공통 입력
      d.org = K.at(root, 'card', { x: 120, y: 520, w: 210, h: 170 });
      d.org.style.padding = '20px 22px';
      d.org.innerHTML = '<div style="font-size:20px;font-weight:700;color:var(--mute)">같은 입력</div><div style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin-top:8px;line-height:1.3">진단 문제 10<br>규정 제약 18</div>';
      const L = [
        { id: 'OPT-A', nm: '기능통합', ds: '중복 단위업무 일원화, 항공안전 업무 재배치', u: 11, u1: 16, f: 22, m: 10, x: 6, r1: '보통 6 · 경미 6', r2: '보통 1 · 경미 3 남음' },
        { id: 'OPT-B', nm: '전략사업', ds: '항공보안기술센터·항공안전부 신설', u: 17, u1: 18, f: 54, m: 15, x: 11, r1: '보통 6 · 경미 3', r2: '경미 3 남음' },
        { id: 'OPT-C', nm: '현장운영', ds: '김포·청주 공항장 직속 안전보안부 신설', u: 29, u1: 32, f: 77, m: 18, x: 1, r1: '보통 6 · 경미 5', r2: '경미 2 남음' },
      ];
      const X0 = 380, LW = 980;
      d.lanes = L.map((o, i) => {
        const y = 300 + i * 200;
        const e = K.at(root, 'card', { x: X0, y, w: LW, h: 180 });
        const nm = T(e, { x: 28, y: 22, w: 280 }, `<div class="mono" style="font-size:22px;font-weight:700;color:var(--blue-2)">${o.id}</div><div style="font-size:40px;font-weight:850;letter-spacing:-0.03em;line-height:1.15;margin-top:2px">${o.nm}</div><div style="font-size:19px;line-height:1.4;color:var(--ink-2);margin-top:6px">${o.ds}</div>`);
        const metric = (x, v, lab, sub) => {
          const g = T(e, { x, y: 24, w: 150 }, `<div class="num" style="font-size:66px;font-weight:850;letter-spacing:-0.045em;line-height:1">0</div><div style="font-size:20px;font-weight:600;margin-top:8px">${lab}</div>` + (sub ? `<div style="font-size:19px;color:var(--mute);margin-top:4px">${sub}</div>` : ''));
          return { g, n: g.firstChild, v };
        };
        const ms = [metric(330, o.u, '단위업무', `<span class="u1" style="position:relative">1차 ${o.u1}</span> → ${o.u}`), metric(476, o.f, '기록물철'), metric(612, o.m, '부서레벨1 변경', `본부를 넘는 이동 ${o.x}`)];
        const strike = h('span', '', e.querySelector('.u1'));
        strike.style.cssText = `position:absolute;left:-2px;top:50%;height:2px;background:${C.bad};width:0`;
        const v1 = T(e, { x: 780, y: 24, w: 180 }, `${mini('warn', '1차 보완 필요')}<div style="font-size:19px;color:var(--mute);margin-top:6px">${o.r1}</div>`);
        const v2 = T(e, { x: 780, y: 100, w: 180 }, `${mini('ok', '2차 채택 가능')}<div style="font-size:19px;color:var(--mute);margin-top:6px">${o.r2}</div>`);
        const yc = y + 90;
        const br = K.path(d.svg, sCurve(330, 605, X0, yc), { color: C.blue, width: 2.5 });
        K.dots(d.svg, br, 2, { r: 5 });
        return { e, nm, ms, strike, v1, v2, br, y, yc };
      });
      d.sum = T(root, { x: X0, y: 904, w: LW }, '세 대안 모두 1차 검토에서 <b style="color:#965A00">보완 필요</b> → 설계자가 보완 → 2차 검토에서 <b style="color:#0B7A52">채택 가능</b>', 'font-size:22px;color:var(--ink-2)');
      // 충돌 4건
      const PX = 1440, PW = 360;
      d.ch = T(root, { x: PX, y: 296, w: PW }, '<div style="font-size:34px;font-weight:850;letter-spacing:-0.03em">충돌 4건</div><div style="font-size:20px;color:var(--ink-2);margin-top:4px">추천안은 넷 다 OPT-A 쪽을 택했다</div>');
      const CF = [
        ['U0636', '테러대응부', 'C', '공항안전보안점검부(신설)'],
        ['U0248', '김포 운영단 보안관리부', 'C', '김포 안전보안부(신설)'],
        ['U0535 · U0537 · U0167', '안전기획부', 'B', '항공안전부(신설)'],
        ['U0646 · U0615 수습', '재난방재부로 모음', 'C', '중앙통제센터로 모음'],
      ];
      d.cf = CF.map((c, i) => {
        const y = 392 + i * 118;
        const e = K.at(root, '', { x: PX, y, w: PW, h: 108 });
        e.style.cssText += ';box-sizing:border-box;border-radius:10px;padding:8px 12px;border-top:1.5px solid var(--rule)';
        e.innerHTML = `<div class="mono" style="font-size:20px;font-weight:500">${c[0]}</div>` +
          `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:20px;font-weight:700">${mini('ok', 'A')}<span>${c[1]}</span></div>` +
          `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;font-size:20px;color:var(--mute)">${mini('ghost', c[2])}<span class="lose" style="position:relative">${c[3]}</span></div>`;
        const lose = e.querySelector('.lose');
        const ln = h('span', '', lose); ln.style.cssText = `position:absolute;left:0;top:52%;height:2px;background:${C.bad};width:0`;
        const other = c[2] === 'B' ? 1 : 2;
        const pa = K.path(d.svg, sCurve(PX - 4, y + 52, X0 + LW + 4, d.lanes[0].yc), { color: C.ok, width: 3 });
        const po = K.path(d.svg, sCurve(PX - 4, y + 82, X0 + LW + 4, d.lanes[other].yc), { color: C.bad, width: 2.5, dash: '6 6' });
        K.dots(d.svg, pa, 1, { r: 5, color: C.ok });
        return { e, ln, pa, po, other };
      });
      d.stamp = K.stampEl(root, 'OPT-A 쪽으로 정리', 'ok', { x: PX + 40, y: 878 });
      d.stamp.style.fontSize = '28px';
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.org, lt, 0.35, { x: -24, y: 0 });
      d.lanes.forEach((l, i) => {
        K.draw(l.br, lt, 0.55 + i * 0.1, 0.5, { speed: 160 });
        K.rise(l.e, lt, 0.7 + i * 0.12, { x: 40, y: 0 });
        l.ms.forEach((m, j) => K.count(m.n, lt, 0.9 + i * 0.12 + j * 0.08, 1.0, m.v));
        K.pop(l.v1, lt, 1.5 + i * 0.12);
        K.pop(l.v2, lt, 2.1 + i * 0.12, { from: 1.25 });
        l.strike.style.width = (prog(lt, 2.2 + i * 0.12, 0.3) * 104).toFixed(1) + '%';
      });
      K.rise(d.sum, lt, 2.5, { y: 10 });
      K.rise(d.ch, lt, 1.2, { x: 24, y: 0 });
      const k = K.cycle(lt, 3.6, 2.4, d.cf.length);
      d.cf.forEach((c, i) => {
        K.rise(c.e, lt, 1.35 + i * 0.1, { x: 24, y: 0 });
        c.ln.style.width = (prog(lt, 1.9 + i * 0.1, 0.35) * 100).toFixed(1) + '%';
        const on = k === i;
        K.mark(c.e, on, 'rgba(25,169,116,.08)');
        if (on) {
          const loc = (lt - 3.6) % 2.4;
          K.draw(c.pa, loc, 0, 0.45, { speed: 150 });
          K.draw(c.po, loc, 0.1, 0.4);
        } else {
          c.pa.style.opacity = '0'; c.po.style.opacity = '0';
          if (c.pa._arrow) c.pa._arrow.style.opacity = '0';
          c.pa._dots.forEach(dt => dt.setAttribute('opacity', 0));
        }
      });
      // 충돌이 강조되는 동안 관련 대안 줄 테두리
      d.lanes.forEach((l, i) => {
        const cur = k >= 0 ? d.cf[k] : null;
        const win = cur && i === 0, lose = cur && i === cur.other;
        l.e.style.borderColor = win ? C.ok : lose ? 'rgba(232,72,58,.6)' : 'var(--rule)';
        l.e.style.borderStyle = lose ? 'dashed' : 'solid';
        l.e.style.borderWidth = win || lose ? '2.5px' : '1.5px';
      });
      K.stamp(d.stamp, lt, 2.9, { rot: -5 });
    },
  });

  // 32. 추천안 OPT-R
  DECK.slide({
    id: 'c3-plan', title: '추천안 OPT-R', chapter: CH, harness: 'strategy',
    notes: '추천안 OPT-R은 OPT-A를 기본으로 하고, 2차 검토에서 해소되지 않은 U0613·U0617 이동을 뺀 뒤, 충돌하지 않는 OPT-B의 신분확인 이관(R-4)을 더한 조합이다. R-6은 OPT-C도 같은 이동을 제안했다.\n1단계 R-1 U0636 보안계획부→테러대응부, R-2 U0646 중앙통제센터→재난방재부, R-3 U0248 김포 시설단 AS운영부→운영단 보안관리부, R-4 U0620 테러대응부→보안계획부. R-1~R-3은 세칙과 같은 방향이라 세칙을 고치지 않는다.\n2단계 R-5 U0003·U0473 → 사이버보안센터, R-6 U0538 → 중앙통제센터. 본부를 넘는 이동이라 세칙 별표 3·별표 2를 고친다. 3단계 R-7 U0535·U0537·U0167 → 안전기획부. 직제규정 별표 4를 고쳐야 한다.\n새 본부·실·부를 만들지 않는다. 인원·예산은 자료가 없어 적지 않았다.\n출처: 조직개편_추천보고서.md 5.1절·6절·부록 A, _workspace/20261117-safety/05_option_OPT-R.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 추천안', title: '단위업무 10개를 세 단계로 옮긴다' });
      d.svgTop = K.svg(root);
      // 세 대안 → OPT-R
      d.src = ['OPT-A', 'OPT-B', 'OPT-C'].map((t, i) => { const c = K.chip(root, t, 'id', { x: 120, y: 292 + i * 46, w: 104 }); c.style.justifyContent = 'center'; c.style.fontSize = '20px'; c.style.height = '36px'; return c; });
      d.badge = T(root, { x: 318, y: 324, w: 122, h: 54 }, 'OPT-R', `box-sizing:border-box;border-radius:10px;background:${C.blue};color:#fff;font-family:var(--mono);font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center`);
      d.conv = [
        K.path(d.svgTop, sCurve(226, 310, 318, 351), { color: C.blue, width: 5 }),
        K.path(d.svgTop, sCurve(226, 356, 318, 351), { color: C.blue, width: 2.5 }),
        K.path(d.svgTop, sCurve(226, 402, 318, 351), { color: C.blue, width: 2.5, dash: '4 6' }),
      ];
      d.conv.forEach(p => K.dots(d.svgTop, p, 1, { r: 4.5 }));
      // 영향 규모(왼쪽 숫자 열)
      const NB = [
        [10, '단위업무', '전체 703개의 1.4%'],
        [22, '기록물철', ''],
        [11, '보존기간 30년 이상 철', ''],
        [8, '부서레벨1 소속 변경', '본부를 넘는 이동 6'],
      ];
      d.nums = NB.map((r, i) => {
        const g = T(root, { x: 120, y: 448 + i * 112, w: 330 },
          `<div style="display:flex;align-items:center;gap:16px"><span class="num" style="font-size:76px;font-weight:850;letter-spacing:-0.045em;line-height:1;width:96px">0</span>` +
          `<span><span style="display:block;font-size:22px;font-weight:700;line-height:1.3">${r[1]}</span>${r[2] ? `<span style="display:block;font-size:19px;color:var(--ink-2);margin-top:2px">${r[2]}</span>` : ''}</span></div>`);
        return { g, n: g.querySelector('.num'), v: r[0] };
      });
      d.cite = T(root, { x: 120, y: 900 }, '[영향 OPT-R]', 'font-family:var(--mono);font-size:19px;color:var(--mute)');
      // 부서 상자
      const BX = {
        hr: { x: 480, y: 320, w: 280, n: 1, t: '인사혁신실 총무복지부' },
        mg: { x: 780, y: 320, w: 280, n: 1, t: '경영관리실 경영정보부' },
        as: { x: 480, y: 476, w: 280, n: 3, t: '공항시설실 AS운영부' },
        cs: { x: 780, y: 476, w: 280, n: 1, t: '건설사업실 건설안전부' },
        gf: { x: 480, y: 754, w: 280, n: 1, t: '시설단 AS운영부' },
        gs: { x: 780, y: 754, w: 280, n: 1, t: '운영단 보안관리부' },
        sp: { x: 1160, y: 334, w: 300, n: 1, t: '보안계획부', pre: '안전보안실' },
        tr: { x: 1480, y: 334, w: 300, n: 1, t: '테러대응부', pre: '안전보안실' },
        dz: { x: 1160, y: 458, w: 300, n: 1, t: '재난방재부', pre: '안전보안실' },
        cc: { x: 1480, y: 458, w: 300, n: 1, t: '중앙통제센터' },
        sf: { x: 1160, y: 582, w: 300, n: 3, t: '안전기획부', pre: '안전보안실' },
        cy: { x: 1480, y: 582, w: 300, n: 2, t: '사이버보안센터' },
      };
      d.rowLab = [['운영본부', 290], ['건설기술본부', 446], ['김포공항', 724]].map(([t, y]) => T(root, { x: 480, y }, t, 'font-size:20px;font-weight:700;color:var(--mute)'));
      d.frame = K.at(root, '', { x: 1140, y: 290, w: 660, h: 540 });
      d.frame.style.cssText += `;box-sizing:border-box;border:2.5px solid ${C.blue};border-radius:16px;background:rgba(47,123,255,.035)`;
      d.frameLab = T(root, { x: 1162, y: 298 }, '안전보안본부', 'font-size:22px;font-weight:800;color:var(--blue-2)');
      const CW = 260, CHh = 58, SL = 64;
      d.boxes = {};
      Object.keys(BX).forEach(k => {
        const b = BX[k];
        b.h = 46 + b.n * SL;
        const e = K.at(root, 'card flat', { x: b.x, y: b.y, w: b.w, h: b.h });
        e.style.borderRadius = '12px';
        T(e, { x: 14, y: 10, w: b.w - 28 }, (b.pre ? `<span style="font-weight:500;color:var(--mute);margin-right:6px">${b.pre}</span>` : '') + b.t, 'font-size:20px;font-weight:700;white-space:nowrap');
        b.e = e;
        b.slot = i => ({ x: b.x + (b.w - CW) / 2, y: b.y + 44 + i * SL });
        d.boxes[k] = b;
      });
      // 단위업무 카드: [조치, ID, 이름, 출발 상자, 출발 칸, 도착 상자, 도착 칸, 단계, 휨]
      const MV = [
        ['R-1', 'U0636', '항공보안점검·수검관리', 'sp', 0, 'tr', 0, 1, -70],
        ['R-2', 'U0646', '수습·사후관리', 'cc', 0, 'dz', 0, 1, 70],
        ['R-3', 'U0248', '항공보안관리', 'gf', 0, 'gs', 0, 1, -50],
        ['R-4', 'U0620', '신분확인·바이오패스관리', 'tr', 0, 'sp', 0, 1, 70],
        ['R-5', 'U0003', '보안진단', 'hr', 0, 'cy', 0, 2, 0],
        ['R-5', 'U0473', '정보보안·개인정보보호관리', 'mg', 0, 'cy', 1, 2, 0],
        ['R-6', 'U0538', '항공운송마비', 'as', 0, 'cc', 0, 2, 0],
        ['R-7', 'U0535', '공항운영규정·증명관리', 'as', 1, 'sf', 0, 3, 0],
        ['R-7', 'U0537', '이동지역 안전관리', 'as', 2, 'sf', 1, 3, 0],
        ['R-7', 'U0167', '이동지역건설사업안전성검토', 'cs', 0, 'sf', 2, 3, 0],
      ];
      // 빈 자리 표시(도착 칸)
      d.holes = MV.map(m => { const p = d.boxes[m[5]].slot(m[6]); return T(root, { x: p.x, y: p.y, w: CW, h: CHh }, '', 'box-sizing:border-box;border:2px dashed rgba(47,123,255,.35);border-radius:10px'); });
      d.svg = K.svg(root);
      d.cards = MV.map((m, i) => {
        const a = d.boxes[m[3]].slot(m[4]), b = d.boxes[m[5]].slot(m[6]);
        const sx = a.x + CW / 2, sy = a.y + CHh / 2, ex = b.x + CW / 2, ey = b.y + CHh / 2;
        const path = K.path(d.svg, sCurve(sx, sy, ex, ey, m[8]), { color: C.blue, width: 2.5 });
        K.dots(d.svg, path, 2, { r: 4.5 });
        const ghost = T(root, { x: a.x, y: a.y, w: CW, h: CHh }, '', 'box-sizing:border-box;border:2px dashed rgba(27,42,74,.28);border-radius:10px;opacity:0');
        const c = K.at(root, '', { x: a.x, y: a.y, w: CW, h: CHh });
        c.style.cssText += ';box-sizing:border-box;border-radius:10px;background:var(--paper-3);border:2px solid var(--ink);padding:5px 12px;overflow:hidden';
        c.innerHTML = `<div style="display:flex;gap:10px;align-items:baseline;line-height:1.2"><span class="mono" style="font-size:19px;font-weight:700;color:var(--blue-2)">${m[0]}</span><span class="mono" style="font-size:19px;color:var(--ink-2)">${m[1]}</span></div><div style="font-size:20px;font-weight:700;letter-spacing:-0.025em;line-height:1.25;white-space:nowrap">${m[2]}</div>`;
        return { c, ghost, path, st: m[7], k: i, sx, sy };
      });
      // 단계 띠
      const SG = [
        ['1단계', 'R-1 ~ R-4', '세칙은 그대로 두고 분류기준표 정비<br>R-4는 안전보안실장의 업무분장 조정'],
        ['2단계', 'R-5 · R-6', '세칙 별표 3(업무분장)·별표 2(정원) 개정<br>직제규정은 그대로'],
        ['3단계', 'R-7', '직제규정 별표 4(업무분장) 개정<br>세칙 별표 2·3도 함께 개정'],
      ];
      d.stages = SG.map((g, i) => {
        const x = 480 + i * 444;
        const e = K.at(root, '', { x, y: 884, w: 432, h: 102 });
        e.style.cssText += ';box-sizing:border-box;border-radius:12px;padding:10px 16px;border:1.5px solid var(--rule)';
        e.innerHTML = `<div style="display:flex;align-items:baseline;gap:12px"><span style="font-size:24px;font-weight:850">${g[0]}</span><span class="mono" style="font-size:20px;color:var(--blue-2);font-weight:700">${g[1]}</span></div><div style="font-size:20px;line-height:1.35;color:var(--ink-2);margin-top:4px">${g[2]}</div>`;
        const bar = T(e, { x: 0, y: 0, w: 432, h: 5 }, '', `background:${C.blue};border-radius:12px 12px 0 0;transform-origin:0 50%`);
        return { e, bar };
      });
      d.stamp = K.stampEl(root, '추천안', 'ok', { x: 1640, y: 266 });
      d.stamp.style.fontSize = '26px'; d.stamp.style.background = 'var(--paper)';
      d.CW = CW; d.CHh = CHh;
    },
    render(lt, d) {
      d.T.render(lt);
      d.src.forEach((c, i) => K.rise(c, lt, 0.3 + i * 0.08, { x: -16, y: 0 }));
      d.conv.forEach((p, i) => K.draw(p, lt, 0.55 + i * 0.08, 0.45, { speed: 90 }));
      K.pop(d.badge, lt, 0.95, { from: 0.7 });
      d.nums.forEach((n, i) => { K.rise(n.g, lt, 1.0 + i * 0.1, { y: 14 }); K.count(n.n, lt, 1.0 + i * 0.1, 1.0, n.v); });
      K.rise(d.cite, lt, 1.5, { y: 6 });
      d.rowLab.forEach((e, i) => K.rise(e, lt, 0.4 + i * 0.06, { y: 8 }));
      K.rise(d.frame, lt, 0.45, { y: 0, scale: 0.985 });
      K.rise(d.frameLab, lt, 0.55, { y: 8 });
      Object.keys(d.boxes).forEach((k, i) => K.rise(d.boxes[k].e, lt, 0.5 + i * 0.04, { y: 14 }));
      d.holes.forEach((e, i) => { e.style.opacity = (prog(lt, 1.1, 0.4) * 1).toFixed(3); });
      const ST = { 1: 2.0, 2: 3.5, 3: 5.0 };
      const DUR = 1.0;
      const sk = K.cycle(lt, 6.6, 2.4, 3);   // 머무는 동안 단계 강조 순환
      d.cards.forEach((cd, i) => {
        const t0 = ST[cd.st] + (cd.k % 4) * 0.14;
        const a = prog(lt, 0.8 + i * 0.05, 0.35);
        const mv = prog(lt, t0, DUR, ease.swift);
        const L = cd.path._len;
        const pt = cd.path.getPointAtLength(mv * L);
        const lift = Math.sin(mv * Math.PI);
        cd.c.style.left = (pt.x - d.CW / 2).toFixed(1) + 'px';
        cd.c.style.top = (pt.y - d.CHh / 2).toFixed(1) + 'px';
        cd.c.style.opacity = a.toFixed(3);
        cd.c.style.transform = `scale(${(1 + 0.05 * lift).toFixed(4)})`;
        cd.c.style.zIndex = mv > 0 && mv < 1 ? '20' : '10';
        cd.c.style.boxShadow = lift > 0.01 ? `0 ${(18 * lift).toFixed(1)}px ${(30 * lift).toFixed(1)}px -14px rgba(47,123,255,.55)` : 'none';
        cd.c.style.borderColor = mv > 0 ? C.blue : C.ink;
        cd.c.style.background = mv >= 1 ? '#E6EFFF' : 'var(--paper-3)';
        cd.ghost.style.opacity = mv > 0 ? '1' : '0';
        // 지나간 길: 카드가 지나간 만큼 그려지고, 다 옮긴 뒤에는 그 단계가 강조될 때만 점이 흐른다
        const on = sk >= 0 && sk === cd.st - 1;
        K.draw(cd.path, lt, t0, DUR, { ease: ease.swift, speed: 120 });
        if (lt > t0 + DUR) cd.path.style.opacity = sk < 0 ? '0.55' : on ? '1' : '0.16';
        cd.path._dots.forEach(c => { if (!on) c.setAttribute('opacity', 0); });
        if (on) cd.c.style.boxShadow = '0 0 0 4px rgba(47,123,255,.22)';
      });
      d.stages.forEach((g, i) => {
        K.rise(g.e, lt, 1.2 + i * 0.1, { y: 14 });
        const p = prog(lt, ST[i + 1], DUR + 0.45, ease.linear);
        g.bar.style.transform = `scaleX(${p.toFixed(3)})`;
        const on = sk === i || (sk < 0 && lt >= ST[i + 1] && lt < ST[i + 1] + 1.5);
        g.e.style.borderColor = on ? C.blue : 'var(--rule)';
        g.e.style.background = on ? 'rgba(47,123,255,.07)' : 'transparent';
      });
      K.stamp(d.stamp, lt, 6.2, { rot: -6 });
    },
  });

  // 33. 경영진이 정할 6가지
  DECK.slide({
    id: 'c3-decide', title: '경영진이 정할 6가지', chapter: CH, harness: 'strategy',
    notes: '보고서 7절의 질문 여섯 가지를 문구 그대로 옮겼다. 아래 칩은 하네스의 추천이다. 먼저 정할 것은 1번(직제규정 별표 4 개정)과 2번(재난안전통신망·자연재난 대응지시 이관)이다.\n2번의 추천 전문: 지금은 아니오. 실제 운영대로 재난방재부에 두고, 중앙통제센터에 있는 재난안전통신망 철을 재난방재부로 재배정하는 분류 정비를 검토한다. 옮기기로 하면 넘어가는 업무량과 정원 이동을 먼저 산정한다. 3번은 대테러 관련 법령이 상황실 운영 주체를 정하는지 확인하기 전에는 보류하고, 그동안 테러대응부와 중앙통제센터가 공항 상황 보고 양식과 기준을 함께 정한다.\n보고서의 모든 숫자는 [근거ID 항목=값] 형식으로 적었고, 메인이 check_citations.py 로 다시 대조해 64건 모두 사실 자료와 일치했다. 인원·예산·업무량은 자료가 없어 "자료 없음, 별도 산정 필요"로 남겼다.\n출처: 조직개편_추천보고서.md 7절·8절, _workspace/20261117-safety/run.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '전략적 조직 설계 · 경영진 결정', title: '경영진이 정할 여섯 가지' });
      d.lead = T(root, { x: 1080, y: 214, w: 720 }, '보고서 7절의 질문을 그대로 옮겼다. 칩은 하네스의 추천이다.', 'font-size:22px;color:var(--ink-2);text-align:right');
      const Q = [
        ['공항운영증명·이동지역 안전 업무를 건설기술본부에서 안전보안본부 안전기획부로 옮기기 위해 직제규정 별표 4(업무분장) 개정을 추진하는가?', 'R-7 · 3단계', 'ok', '예', '별도 항공안전부 신설은 택하지 않는다'],
        ['재난안전통신망 단말기 관리와 자연재난 대응지시(U0613·U0617)를 세칙 중앙통제센터 3항에 맞춰 중앙통제센터로 옮기는가?', 'OPT-A 2차-1', 'bad', '지금은 아니오', '실제 운영대로 재난방재부에 둔다'],
        ['항공보안 종합상황실(U0627)을 중앙통제센터로 옮겨 공항 상황실이 보고할 본사 부서를 하나로 하는가?', 'OPT-B·C', 'warn', '보류', '대테러 법령의 운영 주체 확인 전'],
        ['공항운영증명의 구조·소방 요건을 확인한 뒤 김포·청주공항에 공항장 직속 안전보안부를 두는 개편을 추진하는가?', 'OPT-C 조치 1·2', 'ok', '예', '요건 확인 뒤 김포공항부터'],
        ['불법드론 대응시스템·안티드론 연구개발과 항공보안장비를 모은 항공보안기술센터를 새로 두는가?', 'OPT-B 조치 1', 'bad', '지금은 아니오', '직제 위치 정리 뒤 다시 검토'],
        ['각 단계 시행일에 분류기준표(단위업무와 기록물철 배정)를 함께 개정하는가?', '1~3단계', 'ok', '예', '조직 개편 시행일과 맞춘다'],
      ];
      const W = 540, HH = 268;
      d.cards = Q.map((q, i) => {
        const x = 120 + (i % 3) * (W + 30), y = 294 + Math.floor(i / 3) * (HH + 22);
        const e = K.at(root, 'card', { x, y, w: W, h: HH });
        e.style.padding = '20px 24px';
        e.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between"><span class="num" style="font-size:34px;font-weight:850;color:var(--blue);line-height:1">${i + 1}</span>${mini('id', q[1])}</div>` +
          `<div style="font-size:24px;font-weight:600;line-height:1.45;letter-spacing:-0.02em;margin-top:12px;color:var(--ink)">${q[0]}</div>`;
        const rec = T(e, { x: 24, y: HH - 62, w: W - 48 },
          `<span style="font-size:19px;font-weight:700;color:var(--mute)">추천</span><span class="chip ${q[2]}" style="height:38px;font-size:22px;font-weight:800">${q[3]}</span><span style="font-size:19px;color:var(--ink-2);line-height:1.3">${q[4]}</span>`,
          'display:flex;align-items:center;gap:10px');
        return { e, rec };
      });
      // 수치 표기 원칙 띠
      d.rule = T(root, { x: 120, y: 872, w: 1680, h: 2 }, '', `background:${C.ink}`);
      d.c1 = T(root, { x: 120, y: 890, w: 640 }, '<div style="font-size:20px;font-weight:700;color:var(--mute)">숫자는 근거 ID와 함께만 쓴다</div>');
      d.tick = T(root, { x: 120, y: 926, w: 640 }, '', 'display:flex;align-items:center;gap:14px');
      d.tickTxt = h('span', 'mono', d.tick); d.tickTxt.style.cssText = 'font-size:26px;font-weight:500;color:var(--ink);white-space:pre';
      d.tickOk = h('span', '', d.tick, mini('ok', '사실 자료와 일치'));
      d.cites = ['[DP-004 단위업무 수=44]', '[CM-H01 문서 수=7577]', '[DP-014-03 단위업무 수=6]', '[SM-201 유사도=0.47]', '[DP-000 기록물철 수=1663]', '[영향 OPT-R 대상 단위업무 수=10]'];
      d.c2 = T(root, { x: 800, y: 890, w: 470 }, '<div style="font-size:20px;font-weight:700;color:var(--mute)">인원·예산·업무량</div><div style="font-size:28px;font-weight:800;color:#965A00;margin-top:6px;letter-spacing:-0.02em">자료 없음, 별도 산정 필요</div>');
      d.c3 = T(root, { x: 1310, y: 890, w: 490 }, '<div class="mono" style="font-size:20px;font-weight:500;color:var(--mute)">check_citations.py</div><div style="font-size:28px;font-weight:800;margin-top:6px;letter-spacing:-0.02em">근거 표기 64건 · 오류 0건</div>');
      d.sep = [780, 1290].map(x => T(root, { x, y: 892, w: 1.5, h: 88 }, '', 'background:var(--rule-2)'));
      d.stamp = K.stampEl(root, '오류 0', 'ok', { x: 1662, y: 902 });
      d.stamp.style.fontSize = '28px';
      d.kTick = -1;
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.lead, lt, 0.5, { y: 8 });
      const ck = K.cycle(lt, 3.0, 2.2, d.cards.length);
      d.cards.forEach((c, i) => {
        K.rise(c.e, lt, 0.45 + i * 0.1, { y: 26 });
        K.pop(c.rec, lt, 1.2 + i * 0.1, { from: 0.9 });
        const on = ck === i;
        c.e.style.borderColor = on ? C.blue : 'var(--rule)';
        c.e.style.boxShadow = on ? '0 0 0 4px rgba(47,123,255,.14), 0 18px 40px -24px rgba(27,42,74,.35)' : '';
      });
      K.wipe(d.rule, lt, 1.6, 0.7);
      [d.c1, d.c2, d.c3].forEach((e, i) => K.rise(e, lt, 1.75 + i * 0.12, { y: 10 }));
      d.sep.forEach((e, i) => K.wipe(e, lt, 1.8 + i * 0.1, 0.4, 'down'));
      // 근거 표기 하나씩 치고 대조 표시
      const PER = 1.6, T0 = 2.0;
      const k = lt < T0 ? -1 : Math.floor((lt - T0) / PER) % d.cites.length;
      d.tick.style.opacity = prog(lt, 1.9, 0.3).toFixed(3);
      if (k >= 0) {
        const loc = (lt - T0) % PER;
        K.type(d.tickTxt, d.cites[k], loc, 0, 40);
        const okp = prog(loc, 0.85, 0.25, ease.pop);
        d.tickOk.style.opacity = clamp((loc - 0.85) / 0.1).toFixed(3);
        d.tickOk.style.transform = `scale(${lerp(0.8, 1, okp).toFixed(3)})`;
        d.tickOk.style.display = 'inline-flex';
      } else { d.tickTxt.textContent = ''; d.tickOk.style.opacity = '0'; }
      K.stamp(d.stamp, lt, 2.6, { rot: -7 });
    },
  });
})();

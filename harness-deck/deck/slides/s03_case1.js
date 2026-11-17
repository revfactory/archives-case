/* 조직 변경 영향 — 과제 「조직변경 영향도」. 필름 G 구간에 이어진다. 출처는 storyboard.md 「2. 사례 1」.
   화면의 숫자·ID·문구는 아래 파일에서 확인했다(경로는 kac-org-change-impact/ 기준).
   output/시나리오-신공항건설1부이동/영향도_보고서.md, 분류기준표_변경안.csv, 06_impact_stats.json
   _workspace/시나리오-신공항건설1부이동/00_scenario.md, 02_changes.json, 03_candidates/, 04_proposals/, 05_verify/
   _workspace/_regulations/조직_44~47차.json, index.json, .claude/skills/org-change-impact/SKILL.md */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s } = RH;
  const C = K.C;
  const CH = '조직 변경 영향 · 조직변경 영향도';
  const P = '조직변경 영향도 · ';

  // ── 이 장 파일 안에서만 쓰는 함수 ───────────────────────
  const set = RH.set;
  const txt = (parent, box, html, style) => { const e = K.at(parent, '', box, html); if (style) e.style.cssText += ';' + style; return e; };
  const f1 = v => v.toFixed(1);

  // 단위업무 칩의 상태: 기본 → 검토 대상(주황 점선) → 판정(타당 초록 / 수정필요 주황) / 유지(회색)
  const ST = {
    idle: ['transparent', '1.5px dashed rgba(27,42,74,.30)', '#3A4A6B'],
    cand: ['rgba(232,147,12,.13)', '2px dashed #E8930C', '#965A00'],
    ok: ['#19A974', '2px solid #19A974', '#fff'],
    warn: ['#E8930C', '2px solid #E8930C', '#fff'],
    keep: ['rgba(27,42,74,.06)', '1.5px solid rgba(27,42,74,.30)', '#3A4A6B'],
  };
  function paint(el, k) {
    if (el._st === k) return;
    el._st = k;
    const v = ST[k];
    el.style.background = v[0]; el.style.border = v[1]; el.style.color = v[2];
  }
  // 칩: 모노 ID + (선택) 상태 글자
  function uchip(parent, id, o = {}) {
    const el = h('span', 'chip', parent);
    el.style.cssText += `;height:${o.h || 40}px;padding:0 ${o.pad ?? 12}px;gap:10px;justify-content:center;flex:none;` + (o.w ? `width:${o.w}px;` : '');
    const a = h('span', 'mono', el, id); a.style.cssText = `font-size:${o.fs || 20}px;font-weight:500`;
    if (o.label != null) { el._lab = h('span', '', el, o.label); el._lab.style.cssText = 'font-size:19px;font-weight:700'; }
    paint(el, o.st || 'idle');
    return el;
  }
  // 상태가 바뀌는 순간 살짝 튀게(1.12 → 1)
  const bump = (lt, t0) => (lt < t0 || lt > t0 + 0.3 ? 1 : 1 + 0.12 * (1 - ease.outQuad(clamp((lt - t0) / 0.3))));
  // 범례 한 줄
  function legend(root, items, box) {
    const e = K.at(root, '', box);
    e.style.cssText += ';display:flex;gap:22px;align-items:center;font-size:20px;color:var(--ink-2);white-space:nowrap';
    e.innerHTML = items.map(([st, t]) => `<span style="display:inline-flex;align-items:center;gap:8px"><i style="width:24px;height:18px;border-radius:4px;box-sizing:border-box;display:inline-block;${st}"></i>${t}</span>`).join('');
    return e;
  }

  // 14. 챕터 영상
  DECK.slide({
    id: 'ch-orgchange', title: '조직 변경 영향 챕터 영상', bg: 'paper', harness: 'orgchange', video: 'media/ch_orgchange.mp4', poster: 'media/ch_orgchange.jpg',
    notes: '10초 챕터 영상. 필름 G 구간의 작업장(크레인과 부서 블록)이 움직이고, 질문 「조직이 바뀌면 기준표는 어떻게 고치죠?」에 답한다. 조직이 바뀔 때 분류기준표의 어느 단위업무와 기록물철을 고쳐야 하는지 찾는 하네스다(kac-org-change-impact, 에이전트 4개).\n이 챕터는 시나리오 한 건을 입력부터 사람이 정할 질문까지 차례로 따라간다. 끝나면 → 키로 넘긴다.',
  });

  // 15. 과제와 입력
  DECK.slide({
    id: 'c1-input', title: '과제와 입력', chapter: CH, harness: 'orgchange',
    notes: '하네스는 두 가지 입력을 받는다. 시행세칙 신구 차수를 비교한 결과, 또는 말로 준 조직변경 시나리오다. 이번 입력은 시나리오 한 문장이고, org-change-interpreter가 이를 사건 두 개(E01 상위조직변경, E02 업무이관)로 나눴다.\n왼쪽 아래는 실제 시행세칙 개정 이력이다. 44→45차는 신공항건설부를 1부·2부로 나눴고, 45→46차는 청주공항을 분리해 운영기획부·서비스보안부·시설안전부 3개 부를 새로 만들었다. 46→47차는 정원만 바뀌어 업무분장 변경이 0건이다. 분류기준표가 이 변경을 이미 반영하고 있어 과거 차수를 넣으면 대부분 "유지"로 나오므로, 이번 시험은 시나리오로 했다.\n출처: kac-org-change-impact/_workspace/시나리오-신공항건설1부이동/00_scenario.md, 02_changes.json, _workspace/_regulations/조직_44~47차.json·index.json, unit-task-impact-rules 스킬의 사건 유형 정의',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '과제와 입력', title: '조직변경 한 문장을 사건 두 개로 나눈다',
        sub: '입력은 시행세칙 차수 비교나 말로 준 시나리오다. 어느 쪽이든 사건 유형 9가지로 정리한다.' });
      d.svg = K.svg(root);
      // 왼쪽 위: 시나리오 원문(줄을 직접 나눠 사건별 구간을 고정한다)
      const Q0 = 384, LH = 57.6;
      d.qLab = txt(root, { x: 120, y: 338 }, '이번 입력 · 시나리오 원문', 'font-size:22px;font-weight:700;color:var(--ink-2)');
      d.qBar = K.at(root, '', { x: 120, y: Q0 + 6, w: 4, h: 5 * LH - 12 }); d.qBar.style.background = C.ink;
      d.q = K.at(root, 'quote', { x: 150, y: Q0, w: 740 });
      d.q.style.fontSize = '36px'; d.q.style.lineHeight = '1.6';
      const LINES = [[['신공항추진단 ', 0], ['신공항건설1부를', 1]], [['건설사업실 소속으로 옮기고', 1], [',', 0]], [['KAC-BIM 사업관리 업무는', 2]], [['스마트공항추진실 데이터융합부로', 2]], [['이관하면', 2], [' 분류기준표가 어떻게 바뀌나?', 0]]];
      d.mk = [null, [], []];
      d.lines = LINES.map(parts => {
        const ln = h('div', '', d.q); ln.style.whiteSpace = 'nowrap';
        parts.forEach(([t, g]) => {
          const sp = h('span', '', ln); sp.textContent = t;
          if (g) { sp.style.cssText = 'background-repeat:no-repeat;background-position:0 92%;background-size:0% 34%'; d.mk[g].push(sp); }
        });
        return ln;
      });
      // 사건 구간 괄호와 꼬리표
      const brk = (y1, y2) => K.path(d.svg, [[896, y1], [906, y1], [906, y2], [896, y2]], { color: C.blue, width: 2.5, radius: 4 });
      d.br = [brk(Q0 + 10, Q0 + 2 * LH - 10), brk(Q0 + 2 * LH + 10, Q0 + 5 * LH - 10)];
      const cy = [Q0 + LH, Q0 + 3.5 * LH];
      d.tags = ['E01', 'E02'].map((t, i) => { const c = K.chip(root, t, 'blue', { x: 918, y: cy[i] - 20 }); c.classList.add('mono'); return c; });
      // 오른쪽: 사건 유형 9가지
      const TYPES = [['부서신설', '없던 부서가 생김'], ['부서폐지', '부서가 없어지고 업무도 없어짐'], ['부서통합', '둘 이상의 부서가 하나가 됨'], ['부서분리', '한 부서가 둘 이상으로 나뉨'], ['명칭변경', '업무는 같고 이름만 바뀜'],
        ['상위조직변경', '부서는 같고 소속 본부·실·단만 바뀜'], ['업무이관', '부서는 그대로, 일부 업무만 다른 부서로'], ['업무신설', '기존 부서에 새 업무가 추가됨'], ['업무폐지', '업무가 삭제되고 받는 부서가 없음']];
      d.tLab = txt(root, { x: 1120, y: 338 }, '사건 유형 9가지', 'font-size:22px;font-weight:700;color:var(--ink-2)');
      d.types = TYPES.map((t, i) => {
        const y = 384 + i * 56;
        const r = K.at(root, '', { x: 1120, y, w: 680, h: 48 });
        r.style.cssText += ';border-radius:8px;display:flex;align-items:center';
        const bar = K.at(r, '', { x: 0, y: 8, w: 5, h: 32 }); bar.style.cssText += ';background:var(--blue);border-radius:3px;opacity:0';
        const nm = h('span', '', r, t[0]); nm.style.cssText = 'font-size:24px;font-weight:800;letter-spacing:-0.02em;width:200px;padding-left:22px;flex:none;box-sizing:border-box';
        const ds = h('span', '', r, t[1]); ds.style.cssText = 'font-size:21px;color:var(--ink-2)';
        const ln = K.at(root, '', { x: 1120, y: y + 51, w: 680, h: 1.5 }); ln.style.background = 'var(--rule)';
        return { r, bar, nm, ln };
      });
      d.tNote = txt(root, { x: 1120, y: 904, w: 680 }, '사건마다 유형, 변경 전·후 부서, 근거 문구, 확신도를 <span class="mono" style="font-size:19px;color:var(--ink-2)">02_changes.json</span>에 적는다.', 'font-size:20px;line-height:1.5;color:var(--mute)');
      // 원문 구간 → 유형 행 연결선
      d.cn = [[cy[0], 5], [cy[1], 6]].map(([y, r]) => {
        const ry = 384 + r * 56 + 24;
        const p = K.path(d.svg, `M 990 ${y} C 1058 ${y}, 1052 ${ry}, 1118 ${ry}`, { color: C.blue, width: 2.5 });
        K.dots(d.svg, p, 2, { r: 5 });
        return p;
      });
      // 왼쪽 아래: 실제 직제 개정 이력
      d.hLab = txt(root, { x: 120, y: 712 }, '실제 직제 개정 이력 · 시행세칙', 'font-size:22px;font-weight:700;color:var(--ink-2)');
      const NX = [175, 440, 705, 970];
      d.tl = K.at(root, '', { x: 175, y: 799, w: 795, h: 3 }); d.tl.style.background = 'rgba(27,42,74,.35)';
      const VER = [['44차', '2024.12.12'], ['45차', '2025.01.16'], ['46차', '2025.07.09'], ['47차', '2026.02.11']];
      d.ver = VER.map((v, i) => {
        const dot = K.at(root, '', { x: NX[i] - 10, y: 790, w: 20, h: 20 });
        dot.style.cssText += ';border-radius:50%;background:var(--paper);border:3px solid var(--ink);box-sizing:border-box';
        const a = txt(root, { x: NX[i] - 60, y: 750, w: 120 }, v[0], 'font-size:22px;font-weight:700;text-align:center');
        a.classList.add('mono');
        const b = txt(root, { x: NX[i] - 70, y: 818, w: 140 }, v[1], 'font-size:20px;color:var(--mute);text-align:center');
        return { dot, a, b };
      });
      const SEG = [['부서분리', '신공항건설부 → 1부·2부', 3], ['부서신설', '청주공항 분리 · 3개 부', 0], ['사건 없음', '정원만 변경', -1]];
      d.seg = SEG.map((sg, i) => {
        const mx = (NX[i] + NX[i + 1]) / 2;
        const g = K.at(root, '', { x: mx - 130, y: 858, w: 260 }); g.style.textAlign = 'center';
        const c = h('span', sg[2] < 0 ? 'chip ghost' : 'chip id', g, sg[0]);
        c.style.cssText += ';height:36px;font-size:20px;font-family:var(--sans);font-weight:700';
        const t = h('div', '', g, sg[1]); t.style.cssText = 'font-size:20px;color:var(--ink-2);margin-top:8px;white-space:nowrap';
        return { g, c, base: c.className };
      });
      d.cap = txt(root, { x: 120, y: 952, w: 880 }, '분류기준표가 이 개정을 이미 반영하고 있어, 이번 사례는 시나리오로 입력했다.', 'font-size:20px;color:var(--mute)');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.qLab, lt, 0.35, { y: 10 });
      K.wipe(d.qBar, lt, 0.4, 0.5, 'down');
      d.lines.forEach((ln, i) => K.rise(ln, lt, 0.45 + i * 0.08, { y: 14, blur: 4 }));
      K.rise(d.tLab, lt, 0.5, { y: 10 });
      d.types.forEach((t, i) => { K.rise(t.r, lt, 0.55 + i * 0.05, { x: 24, y: 0 }); K.wipe(t.ln, lt, 0.6 + i * 0.05, 0.5); });
      K.rise(d.tNote, lt, 1.2, { y: 8 });
      K.rise(d.hLab, lt, 0.9, { y: 10 });
      K.wipe(d.tl, lt, 1.0, 0.8);
      d.ver.forEach((v, i) => { K.pop(v.dot, lt, 1.05 + i * 0.12); K.rise(v.a, lt, 1.05 + i * 0.12, { y: 8 }); K.rise(v.b, lt, 1.1 + i * 0.12, { y: 8 }); });
      d.seg.forEach((sg, i) => K.rise(sg.g, lt, 1.3 + i * 0.12, { y: 10 }));
      K.rise(d.cap, lt, 1.7, { y: 8 });
      // 사건 표시: 밑줄 → 괄호 → 꼬리표 → 연결선. 그 뒤 네 가지 대응을 돌아가며 강조
      const k = K.cycle(lt, 3.9, 2.4, 4);
      const strongRow = [5, 6, 3, 0][k] ?? -1;
      const lit = [false, false];
      [0, 1].forEach(e => {
        const t0 = 1.5 + e * 0.8;
        const spans = d.mk[e + 1];
        const act = k === e;
        spans.forEach((sp, j) => {
          const p = prog(lt, t0 + j * 0.22, 0.3, ease.inOutCubic);
          sp.style.backgroundSize = `${f1(p * 100)}% 34%`;
          const a = act ? 'rgba(47,123,255,.36)' : 'rgba(47,123,255,.18)';
          set(sp, 'backgroundImage', `linear-gradient(${a}, ${a})`);
        });
        const tEnd = t0 + spans.length * 0.22 + 0.1;
        K.draw(d.br[e], lt, tEnd - 0.2, 0.3);
        K.pop(d.tags[e], lt, tEnd);
        K.draw(d.cn[e], lt, tEnd + 0.15, 0.5, { speed: 160 });
        d.cn[e].setAttribute('stroke-width', act ? 4 : 2.5);
        lit[e] = lt > tEnd + 0.6;
      });
      d.types.forEach((t, i) => {
        const on = (i === 5 && lit[0]) || (i === 6 && lit[1]);
        const st = i === strongRow;
        set(t.r, 'background', st ? 'rgba(47,123,255,.12)' : on ? 'rgba(47,123,255,.05)' : 'transparent');
        set(t.bar, 'opacity', st || on ? '1' : '0');
        set(t.nm, 'color', st || on ? C.blue : C.ink);
      });
      d.seg.forEach((sg, i) => { const cls = k === i + 2 ? 'chip blue' : sg.base; if (sg.c.className !== cls) sg.c.className = cls; });
    },
  });

  // 16. 파이프라인
  const FLOW = [
    { kind: 'script', name: 'prepare.py', read: [['t', '시행세칙 44~47차 · 직제규정 39~41차 hwpx']], write: [['f', '_regulations/조직_47차.json'], ['t', '외']] },
    { kind: 'make', name: 'org-change-interpreter', model: 'opus', read: [['f', '00_scenario.md'], ['f', '조직_47차.json']], write: [['f', '02_changes.json'], ['n', '사건 2 · 확인필요 4']] },
    { kind: 'human', name: '사용자 확인', read: [['f', '02_changes.json'], ['t', '사건 표 · 확인필요 질문 4개']], write: [['t', '확인 · 고칠 곳은 2단계를 다시 부른다']] },
    { kind: 'script', name: 'impact_lookup.py', read: [['f', '02_changes.json']], write: [['f', '03_candidates/E01.json'], ['f', 'E02.json']] },
    { kind: 'make', name: 'unit-impact-analyst', model: 'opus', read: [['f', '03_candidates/E01.json']], write: [['f', '04_proposals/E01.json']] },
    { kind: 'check', name: 'change-proposal-verifier', model: 'opus', read: [['f', '04_proposals/E01.json'], ['f', '03_candidates/']], write: [['f', '05_verify/E01.json']] },
    { kind: 'script', name: 'build_change_table.py', read: [['f', '04_proposals/'], ['f', '05_verify/']], write: [['f', '분류기준표_변경안.csv'], ['f', '06_impact_stats.json']] },
    { kind: 'write', name: 'impact-report-writer', model: 'sonnet', read: [['f', '06_impact_stats.json'], ['f', '분류기준표_변경안.csv']], write: [['f', '영향도_보고서.md']] },
  ];
  // 넘겨주는 파일: [보내는 단계, 칸 순번, 받는 단계, 읽는 칸 순번, 이름, 보내는 칸이 읽는 칸이면 true]
  const HAND = [[0, 0, 1, 1, '조직_47차.json'], [1, 0, 2, 0, '02_changes.json'], [2, 0, 3, 0, '02_changes.json', true], [3, 0, 4, 0, '03_candidates/E01.json'],
    [4, 0, 5, 0, '04_proposals/E01.json'], [5, 0, 6, 1, '05_verify/E01.json'], [6, 1, 7, 0, '06_impact_stats.json'], [7, 0, -1, -1, '영향도_보고서.md']];
  DECK.slide({
    id: 'c1-flow', title: '파이프라인', chapter: CH, harness: 'orgchange',
    notes: '실제 실행 순서다. 점선 칸은 결정적으로 처리하는 스크립트, 실선 칸은 판단하는 에이전트다. 2단계가 끝나면 사건 표와 확인필요 질문을 사람에게 보여 주고 확인을 받는다. 사건 해석이 틀리면 뒤 단계가 모두 틀리기 때문이다.\n5·6단계는 사건마다(E01, E02) 분석 → 검증을 한 번씩 돈다. 에이전트는 쓴 파일을 validate.py로 검사해 OK를 확인한다. 검증 담당(change-proposal-verifier)에는 Edit 도구를 주지 않아 제안 파일을 고칠 수 없다.\n화면의 파일 경로는 앞부분 _workspace/시나리오-신공항건설1부이동/ 을 줄였다. 7·8단계의 결과는 output/시나리오-신공항건설1부이동/ 에 놓인다. 움직이는 칩은 한 단계가 쓴 파일을 다음 단계가 읽는 순서를 보여 준다.\n출처: kac-org-change-impact/.claude/skills/org-change-impact/SKILL.md 「데이터 전달」, .claude/agents/*.md, _workspace/.../03_candidates/_summary.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '파이프라인', title: '단계마다 파일을 읽고, 파일을 쓴다' });
      d.leg = legend(root, [['border:2px dashed rgba(27,42,74,.4)', '스크립트'], ['border:2px solid var(--blue);background:var(--paper-3)', '에이전트'], ['background:var(--ink);border-radius:9px', '사람']], { r: 120, y: 240 });
      d.hd = [['단계', 180], ['읽는 파일', 680], ['쓰는 파일', 1270]].map(([t, x]) => txt(root, { x, y: 284 }, t, 'font-size:20px;font-weight:700;color:var(--mute)'));
      d.hr = K.at(root, '', { x: 120, y: 316, w: 1680, h: 2 }); d.hr.style.background = C.ink;
      const RY = i => 334 + i * 80;
      // 사건마다 도는 구간(5·6단계)
      d.grp = K.at(root, '', { x: 170, y: RY(4) - 9, w: 1630, h: 80 + 58 + 18 });
      d.grp.style.cssText += ';border:2px dashed rgba(47,123,255,.45);border-radius:16px;box-sizing:border-box;background:rgba(47,123,255,.03)';
      d.tab = K.at(root, '', { r: 136, y: RY(4) - 24, h: 30 }, '사건마다 한 번씩 · E01, E02');
      d.tab.style.cssText += ';display:flex;align-items:center;padding:0 12px;font-size:19px;font-weight:700;color:var(--blue);background:var(--paper);border:2px solid rgba(47,123,255,.45);border-radius:8px;box-sizing:border-box';
      d.svg = K.svg(root);
      d.chain = K.path(d.svg, [[150, RY(0) + 29], [150, RY(7) + 29]], { color: 'rgba(27,42,74,.28)', width: 2.5 });
      K.dots(d.svg, d.chain, 4, { r: 5 });
      const NAMECOL = { make: '#1F5FD6', check: '#B3261E', write: C.ink2 }, BORD = { make: C.blue, check: C.bad, write: C.ink2 };
      d.rows = FLOW.map((r, i) => {
        const y = RY(i);
        const num = K.at(root, 'mono', { x: 133, y: y + 12, w: 34, h: 34 }, String(i + 1));
        num.style.cssText += ';border-radius:50%;background:var(--paper);border:2px solid var(--ink-2);box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:700';
        let node;
        if (r.kind === 'script') {
          node = K.at(root, 'script', { x: 180, y, w: 460, h: 58 }, r.name);
          node.style.cssText += ';display:flex;align-items:center;font-size:21px;padding:0 18px;background:var(--paper)';
        } else if (r.kind === 'human') {
          node = K.at(root, 'human', { x: 180, y, w: 460, h: 58 }, r.name);
          node.style.cssText += ';display:flex;align-items:center;padding:0 22px;font-size:23px';
        } else {
          node = K.at(root, '', { x: 180, y, w: 460, h: 58 });
          node.style.cssText += `;box-sizing:border-box;border-radius:12px;background:var(--paper-3);border:2px solid ${BORD[r.kind]};display:flex;align-items:center;padding:0 12px 0 18px;box-shadow:0 14px 30px -22px ${BORD[r.kind]}`;
          const nm = h('span', 'mono', node, r.name); nm.style.cssText = `font-size:21px;font-weight:500;color:${NAMECOL[r.kind]}`;
          const md = h('span', 'mono', node, r.model);
          md.style.cssText = 'margin-left:auto;font-size:19px;font-weight:700;padding:3px 9px;border-radius:5px;' + (r.model === 'opus' ? 'background:var(--ink);color:#fff' : 'border:1.5px solid var(--ink-2);color:var(--ink-2)');
        }
        const cell = (x, w, items) => {
          const c = K.at(root, '', { x, y: y + 11, w, h: 36 });
          c.style.cssText += ';display:flex;gap:8px;align-items:center;white-space:nowrap';
          const chips = items.map(([kd, t]) => {
            if (kd === 'f') { const e = h('span', 'chip id', c, t); e.style.cssText += ';height:36px;font-size:20px;padding:0 10px'; return e; }
            const e = h('span', '', c, t);
            e.style.cssText = kd === 'n' ? 'font-size:20px;font-weight:700;color:var(--blue);margin-left:6px' : 'font-size:21px;color:var(--ink-2)';
            return e;
          });
          return { c, chips, x };
        };
        return { y, num, node, rd: cell(680, 560, r.read), wr: cell(1270, 530, r.write), ring: 'none' };
      });
      // 다음 단계로 넘어가는 파일 칩
      d.tok = K.at(root, 'chip id', { x: 0, y: 0 }, '');
      d.tok.style.cssText += ';height:36px;font-size:20px;padding:0 10px;border:2px solid var(--blue);color:var(--blue-2);box-shadow:0 12px 26px -12px rgba(47,123,255,.6);opacity:0;z-index:5';
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.leg, lt, 0.5, { y: 8 });
      d.hd.forEach((e, i) => K.rise(e, lt, 0.35 + i * 0.05, { y: 8 }));
      K.wipe(d.hr, lt, 0.35, 0.6);
      K.draw(d.chain, lt, 0.5, 1.1, { speed: 120, ease: ease.linear });
      d.rows.forEach((r, i) => {
        const t0 = 0.5 + i * 0.12;
        K.pop(r.num, lt, t0);
        K.rise(r.node, lt, t0 + 0.04, { x: -24, y: 0 });
        K.rise(r.rd.c, lt, t0 + 0.1, { x: -16, y: 0 });
        K.rise(r.wr.c, lt, t0 + 0.16, { x: -16, y: 0 });
      });
      K.rise(d.grp, lt, 1.45, { y: 0, scale: 0.985, blur: 0 });
      K.pop(d.tab, lt, 1.65);
      // 파일 넘김: 1.5초마다 한 단계씩
      const T0 = 2.6, PER = 1.5;
      const k = K.cycle(lt, T0, PER, HAND.length);
      const u = k < 0 ? -1 : (lt - T0) % PER;
      const hd = k >= 0 ? HAND[k] : null;
      const srcChip = hd ? (hd[5] ? d.rows[hd[0]].rd : d.rows[hd[0]].wr).chips[hd[1]] : null;
      d.rows.forEach((r, i) => {
        const send = hd && hd[0] === i && u < 0.45;
        const recv = hd && hd[2] === i && u > 0.95;
        const last = hd && hd[2] < 0 && hd[0] === i;
        set(r.node, 'outline', send || recv || last ? '4px solid rgba(47,123,255,.22)' : 'none');
        set(r.node, 'outlineOffset', '3px');
        r.wr.chips.concat(r.rd.chips).forEach(c => set(c, 'outline', c === srcChip && u < 1.0 ? '3px solid rgba(47,123,255,.45)' : 'none'));
        r.rd.chips.forEach((c, j) => {
          const on = hd && hd[2] === i && hd[3] === j && u > 0.95;
          set(c, 'background', on ? (c.classList.contains('chip') ? 'rgba(47,123,255,.12)' : 'transparent') : '');
          set(c, 'color', on ? C.blue : '');
        });
      });
      if (!hd || hd[2] < 0) { set(d.tok, 'opacity', '0'); return; }
      const src = hd[5] ? d.rows[hd[0]].rd : d.rows[hd[0]].wr, dst = d.rows[hd[2]].rd;
      const sc = src.chips[hd[1]], dc = dst.chips[hd[3]];
      const sx = src.x + sc.offsetLeft, sy = d.rows[hd[0]].y + 11;
      const dx = dst.x + dc.offsetLeft, dy = d.rows[hd[2]].y + 11;
      if (d.tok.textContent !== hd[4]) d.tok.textContent = hd[4];
      const p = prog(u, 0.25, 0.7, ease.inOutCubic);
      const x = lerp(sx, dx, p), y = lerp(sy, dy, p) - 34 * Math.sin(Math.PI * p);
      d.tok.style.left = f1(x) + 'px'; d.tok.style.top = f1(y) + 'px';
      const a = Math.min(prog(u, 0.12, 0.15, ease.linear), 1 - prog(u, 1.0, 0.2, ease.linear));
      d.tok.style.opacity = a.toFixed(3);
      d.tok.style.transform = `scale(${(1 + 0.06 * Math.sin(Math.PI * p)).toFixed(4)})`;
    },
  });

  // 17. 사건 해석 — 조직도에서 부서와 업무가 옮겨 붙는다
  const KX = c => c + 48, KY = i => 410 + i * 64;    // 하위 부서 칸 좌표
  DECK.slide({
    id: 'c1-events', title: '사건 해석', chapter: CH, harness: 'orgchange',
    notes: 'E01은 상위조직변경이다. 신공항건설1부의 소속만 부사장직할 신공항추진단에서 건설기술본부 건설사업실로 바뀐다(확신도 높음). 분류기준표에서 영향을 받는 단위업무는 U0087(철 F0164)과 1부·2부 공동 행인 U0086이다.\nE02는 업무이관이다. 세칙 47차에서 KAC-BIM 사업관리는 신공항건설1부 업무분장 5호인데, 분류기준표의 BIM 단위업무 8개(U0078~U0085)는 세칙에 없는 디지털트윈사업부 아래에 있다. 이관 범위와 디지털트윈사업부 처리가 시나리오에 없어 확신도를 보통으로 뒀다.\n아래 칩의 색: 주황 점선은 검토 대상, 초록은 검증 타당, 주황은 검증 수정필요다. 분석은 U0079만 옮기고 나머지 7개를 "유지"로 뒀는데, 검증이 7개 모두 수정필요로 판정했다.\n문서 6,873건은 신공항추진단 전체의 2021~2026년 생산·접수 문서 수다. 문서목록에 부·단위업무 칸이 없어 1부만의 건수는 낼 수 없다.\n조직도는 세칙 47차(조직_47차.json) 기준이고, 점선 칸 디지털트윈사업부만 분류기준표에서 가져왔다.\n출처: _workspace/.../02_changes.json, 04_proposals·05_verify/E01·E02.json, output/.../06_impact_stats.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '사건 해석', title: '부서 하나가 옮기고, 업무 하나가 따로 간다' });
      d.leg = legend(root, [['border:2px dashed rgba(27,42,74,.4);background:var(--paper-3)', '분류기준표에만 있는 부서'], ['border:2px dashed #E8930C;background:rgba(232,147,12,.13)', '검토 대상'], ['background:#19A974', '타당'], ['background:#E8930C', '수정필요']], { r: 120, y: 244 });
      d.svg = K.svg(root);
      const COLS = [
        { x: 120, top: '부사장직할', name: '신공항추진단', kids: ['신공항계획부', '신공항건설1부', '신공항건설2부', '디지털트윈사업부'] },
        { x: 700, top: '건설기술본부', name: '건설사업실', kids: ['공항계획부', '건설안전부'] },
        { x: 1280, top: '전략기획본부', name: '스마트공항추진실', kids: ['스마트기획부', '데이터융합부', '스마트공항부'] },
      ];
      d.cols = COLS.map(c => {
        const top = txt(root, { x: c.x, y: 292 }, c.top, 'font-size:20px;font-weight:600;color:var(--mute)');
        const par = K.at(root, '', { x: c.x, y: 324, w: 400, h: 60 }, c.name);
        par.style.cssText += ';box-sizing:border-box;border-radius:12px;background:var(--ink);color:#FDF3E2;display:flex;align-items:center;padding:0 22px;font-size:28px;font-weight:800;letter-spacing:-0.02em';
        const spine = K.at(root, '', { x: c.x + 21, y: 384, w: 2.5, h: KY(c.kids.length - 1) + 26 - 384 });
        spine.style.background = 'rgba(27,42,74,.38)';
        const kids = c.kids.map((nm, i) => {
          const x = KX(c.x), y = KY(i), dash = nm === '디지털트윈사업부';
          const tick = K.at(root, '', { x: c.x + 22, y: y + 25, w: 26, h: 2.5 }); tick.style.background = 'rgba(27,42,74,.38)';
          const n = K.at(root, '', { x, y, w: 420, h: 52 }, nm);
          n.style.cssText += `;box-sizing:border-box;border-radius:10px;background:var(--paper-3);border:${dash ? '2px dashed rgba(27,42,74,.38)' : '1.5px solid var(--rule-2)'};display:flex;align-items:center;padding:0 18px;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:${dash ? 'var(--ink-2)' : 'var(--ink)'}`;
          return { n, tick, x, y };
        });
        return { top, par, spine, kids, x: c.x };
      });
      const A = d.cols[0], B = d.cols[1], Cc = d.cols[2];
      d.n1 = A.kids[1];                         // 신공항건설1부
      d.dt = A.kids[3];                         // 디지털트윈사업부
      d.df = Cc.kids[1];                        // 데이터융합부
      d.spB0 = KY(1) + 26 - 384; d.spB1 = KY(2) + 26 - 384;
      // 1부가 떠난 자리
      d.ghost = K.at(root, '', { x: d.n1.x, y: d.n1.y, w: 420, h: 52 }, '신공항건설1부');
      d.ghost.style.cssText += ';box-sizing:border-box;border-radius:10px;border:2px dashed rgba(47,123,255,.35);display:flex;align-items:center;padding:0 18px;font-size:24px;font-weight:700;color:rgba(47,123,255,.35);opacity:0';
      root.insertBefore(d.ghost, d.n1.n);
      // 건설사업실 아래 새 연결
      d.tickB = K.at(root, '', { x: B.x + 22, y: KY(2) + 25, w: 26, h: 2.5 }); d.tickB.style.background = 'rgba(27,42,74,.38)';
      // 디지털트윈사업부의 BIM 단위업무 묶음
      d.bim = K.at(root, 'chip', { x: d.dt.x + 420 - 12 - 172, y: d.dt.y + 8, w: 172, h: 36 }, 'BIM 단위업무 8');
      d.bim.style.cssText += ';justify-content:center;font-size:20px;padding:0';
      paint(d.bim, 'idle');
      // KAC-BIM 사업관리(1부 업무분장 5호) 칩
      d.kacOff = [420 - 12 - 196, 8];
      d.kacGhost = K.at(root, 'chip', { x: KX(B.x) + d.kacOff[0], y: KY(2) + d.kacOff[1], w: 196, h: 36 }, 'KAC-BIM 사업관리');
      d.kacGhost.style.cssText += ';justify-content:center;font-size:20px;padding:0;border:2px dashed rgba(47,123,255,.35);color:rgba(47,123,255,.4);opacity:0;z-index:4';
      d.kac = K.at(root, 'chip', { x: 0, y: 0, w: 196, h: 36 }, 'KAC-BIM 사업관리');
      d.kac.style.cssText += ';justify-content:center;font-size:20px;padding:0;z-index:4';
      // 이동 경로(이동이 끝난 뒤 남는 점선과 점 흐름)
      d.tr = [
        K.path(d.svg, `M 590 ${KY(1) + 26} C 656 ${KY(1) + 26}, 656 ${KY(2) + 26}, 720 ${KY(2) + 26}`, { color: C.blue, width: 2.5, dash: '7 7' }),
        K.path(d.svg, `M 1170 ${KY(2) + 26} C 1236 ${KY(2) + 26}, 1236 ${KY(1) + 26}, 1300 ${KY(1) + 26}`, { color: C.blue, width: 2.5, dash: '7 7' }),
      ];
      d.tr.forEach(p => K.dots(d.svg, p, 2, { r: 5 }));
      d.pill = [[655, 'E01'], [1235, 'E02']].map(([x, t]) => {
        const c = K.chip(root, t, 'blue', { x: x - 28, y: KY(1) + 26 + 32 - 16, w: 56, h: 32 });
        c.classList.add('mono'); c.style.cssText += ';height:32px;font-size:19px;padding:0;justify-content:center';
        return c;
      });
      // 사건 카드
      const EV = [
        { id: 'E01', type: '상위조직변경', conf: '높음', sum: '신공항건설1부 소속을 신공항추진단에서 건설사업실로', n1: 'U0086은 1부·2부 공동 행이라 철 F0162만 옮기는 안을 냈다', n2: '신공항추진단 생산·접수 문서 6,873건(2021~2026)' },
        { id: 'E02', type: '업무이관', conf: '보통', sum: 'KAC-BIM 사업관리를 스마트공항추진실 데이터융합부로', n1: 'BIM 단위업무 8개는 분류기준표에서 디지털트윈사업부 아래에 있다', n2: '분석은 U0079만 옮기고 7개는 유지, 검증은 7개 모두 수정필요' },
      ];
      d.cards = EV.map((ev, i) => {
        const c = K.at(root, 'card', { x: 120 + i * 860, y: 704, w: 820, h: 274 });
        const id = K.chip(c, ev.id, 'blue', { x: 28, y: 22 }); id.classList.add('mono');
        txt(c, { x: 108, y: 22 }, ev.type, 'font-size:30px;font-weight:800;letter-spacing:-0.02em;line-height:40px');
        const cf = K.chip(c, '확신도 ' + ev.conf, ev.conf === '높음' ? 'blue' : 'id', { r: 28, y: 22 });
        if (ev.conf !== '높음') cf.style.cssText += ';font-family:var(--sans);font-weight:700;color:var(--blue-2);border:2px solid var(--blue)';
        txt(c, { x: 28, y: 80, w: 764 }, ev.sum, 'font-size:23px;font-weight:600;color:var(--ink)');
        const row = K.at(c, '', { x: 28, y: 124, w: 764, h: 40 }); row.style.cssText += ';display:flex;gap:6px;align-items:center';
        txt(c, { x: 28, y: 182, w: 764 }, ev.n1, 'font-size:20px;color:var(--ink-2)');
        txt(c, { x: 28, y: 216, w: 764 }, ev.n2, 'font-size:20px;color:var(--mute)');
        return { c, row };
      });
      // 단위업무 칩: [ID, 검토 대상 시각, 판정 시각, 판정]
      d.u1 = [['U0087', 'ok'], ['U0086', 'warn']].map(([id, v]) => ({ el: uchip(d.cards[0].row, id, { label: '', w: 200 }), v }));
      d.u2 = [{ el: uchip(d.cards[1].row, 'U0079', { label: '', w: 200 }), v: 'ok' }];
      ['U0078', 'U0080', 'U0081', 'U0082', 'U0083', 'U0084', 'U0085'].forEach(id => d.u2.push({ el: uchip(d.cards[1].row, id, { w: 73, pad: 0, fs: 19 }), v: 'warn' }));
      d.u2[0].el.style.marginRight = '8px';
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.leg, lt, 0.6, { y: 8 });
      const E1 = { hl: 1.7, mv: 2.0, land: 3.0 }, E2 = { hl: 4.2, mv: 4.5, land: 5.4 };
      // 조직도 등장
      d.cols.forEach((c, ci) => {
        const t0 = 0.35 + ci * 0.1;
        K.rise(c.top, lt, t0, { y: 8 });
        K.pop(c.par, lt, t0 + 0.05);
        K.wipe(c.spine, lt, t0 + 0.3, 0.5, 'down');
        c.kids.forEach((kd, i) => {
          K.wipe(kd.tick, lt, t0 + 0.4 + i * 0.07, 0.25);
          if (kd !== d.n1 || lt < E1.mv) K.rise(kd.n, lt, t0 + 0.42 + i * 0.07, { x: -18, y: 0 });
        });
      });
      // 건설사업실 줄기는 1부가 붙을 때 아래로 늘어난다
      const ext = prog(lt, E1.land - 0.45, 0.4, ease.inOutCubic);
      const B = d.cols[1];
      if (lt > 1.0) B.spine.style.height = f1(lerp(d.spB0, d.spB1, ext)) + 'px';
      K.wipe(d.tickB, lt, E1.land - 0.12, 0.2);
      // E01: 신공항건설1부 가지를 떼어 건설사업실 아래로
      set(d.n1.tick, 'opacity', String(1 - prog(lt, E1.hl + 0.15, 0.2, ease.linear)));
      const p1 = prog(lt, E1.mv, E1.land - E1.mv, ease.inOutCubic);
      const lift = Math.sin(Math.PI * p1);
      const ax = 580 * p1, ay = 64 * p1 - 92 * lift;
      if (lt >= E1.mv) {
        const sq = RH.kf(lt, [[E1.land, 1], [E1.land + 0.07, 0.982, ease.outQuad], [E1.land + 0.2, 1, ease.outQuad]]);
        d.n1.n.style.opacity = '1'; d.n1.n.style.filter = '';
        d.n1.n.style.transform = `translate(${f1(ax)}px, ${f1(ay)}px) scale(${(sq * (1 + 0.035 * lift)).toFixed(4)})`;
      }
      d.n1.n.style.zIndex = '3';
      d.n1.n.style.boxShadow = `0 ${f1(10 + 22 * lift)}px ${f1(26 + 26 * lift)}px -18px rgba(47,123,255,${(0.25 + 0.45 * lift).toFixed(2)})`;
      const moved1 = lt >= E1.hl;
      set(d.n1.n, 'border', moved1 ? '2.5px solid ' + C.blue : '1.5px solid rgba(27,42,74,.28)');
      d.ghost.style.opacity = (prog(lt, E1.mv + 0.1, 0.35, ease.linear) * 1).toFixed(3);
      // 1부를 따라가다가 E02 때 떨어져 데이터융합부로 가는 KAC-BIM 칩
      const n1x = d.n1.x + ax, n1y = d.n1.y + ay;
      const p2 = prog(lt, E2.mv, E2.land - E2.mv, ease.inOutCubic);
      const l2 = Math.sin(Math.PI * p2);
      const sx = KX(B.x) + d.kacOff[0], sy = KY(2) + d.kacOff[1];
      const ex = d.df.x + d.kacOff[0], ey = d.df.y + d.kacOff[1];
      let kx, ky;
      if (lt < E2.mv) { kx = n1x + d.kacOff[0]; ky = n1y + d.kacOff[1]; }
      else { kx = lerp(sx, ex, p2); ky = lerp(sy, ey, p2) - 84 * l2; }
      d.kac.style.left = f1(kx) + 'px'; d.kac.style.top = f1(ky) + 'px';
      const kp = K.pop(d.kac, lt, 0.95);
      if (lt > 1.4) d.kac.style.transform = `scale(${(1 + 0.06 * l2 + 0.035 * lift).toFixed(4)})`;
      d.kac.style.opacity = kp.toFixed(3);
      const busy = lt >= E2.hl && lt < E2.land + 0.5;
      set(d.kac, 'background', busy ? C.blue : 'var(--paper-3)');
      set(d.kac, 'color', busy ? '#fff' : '#1F5FD6');
      set(d.kac, 'border', '2px solid ' + C.blue);
      d.kac.style.boxShadow = l2 > 0.01 ? `0 ${f1(10 + 18 * l2)}px ${f1(24 + 20 * l2)}px -14px rgba(47,123,255,.6)` : 'none';
      d.kacGhost.style.opacity = prog(lt, E2.mv + 0.1, 0.35, ease.linear).toFixed(3);
      // 데이터융합부: 받는 순간 테두리, 그 뒤 군청 유지
      set(d.df.n, 'border', lt >= E2.land ? '2.5px solid ' + C.blue : '1.5px solid rgba(27,42,74,.28)');
      // 디지털트윈사업부 BIM 묶음: E02 때 검토 대상으로 켜진다
      K.pop(d.bim, lt, 1.0);
      paint(d.bim, lt >= E2.hl ? 'cand' : 'idle');
      if (lt >= E2.hl) d.bim.style.borderColor = `rgba(232,147,12,${(0.55 + 0.45 * K.wave(lt, 1.6)).toFixed(3)})`;
      // 이동 경로와 꼬리표
      K.draw(d.tr[0], lt, E1.land + 0.1, 0.4, { speed: 70 });
      K.draw(d.tr[1], lt, E2.land + 0.1, 0.4, { speed: 70 });
      K.pop(d.pill[0], lt, E1.land + 0.3);
      K.pop(d.pill[1], lt, E2.land + 0.3);
      // 사건 카드와 단위업무 칩
      d.cards.forEach((c, i) => K.rise(c.c, lt, 1.0 + i * 0.1, { y: 20 }));
      const chipAt = (u, tc, tv) => {
        const k = lt >= tv ? u.v : lt >= tc ? 'cand' : 'idle';
        paint(u.el, k);
        if (u.el._lab) { const t = k === 'idle' ? '' : k === 'cand' ? '검토 대상' : k === 'ok' ? '타당' : '수정필요'; if (u.el._lab.textContent !== t) u.el._lab.textContent = t; }
        u.el.style.transform = `scale(${Math.max(bump(lt, tc), bump(lt, tv)).toFixed(3)})`;
      };
      d.u1.forEach((u, j) => chipAt(u, E1.land + 0.15 + j * 0.1, E1.land + 0.9 + j * 0.15));
      d.u2.forEach((u, j) => chipAt(u, E2.land + 0.15 + j * 0.05, j === 0 ? E2.land + 0.9 : E2.land + 1.05 + j * 0.07));
      // 머무는 동안: E01과 E02를 번갈아 강조
      const k = K.cycle(lt, 7.6, 2.8, 2);
      const actE = k >= 0 ? k : lt >= E2.hl ? 1 : lt >= E1.hl ? 0 : -1;
      d.cards.forEach((c, i) => {
        set(c.c, 'borderColor', actE === i ? C.blue : '');
        set(c.c, 'background', actE === i ? '#EEF4FF' : '');
      });
      set(d.n1.n, 'outline', actE === 0 ? '4px solid rgba(47,123,255,.18)' : 'none');
      set(d.df.n, 'outline', actE === 1 && lt >= E2.land ? '4px solid rgba(47,123,255,.18)' : 'none');
      d.tr.forEach((p, i) => { if (lt > [E1, E2][i].land + 0.5) p.style.opacity = actE === i ? '1' : '0.4'; });
    },
  });

  // 18. 변경안과 검증
  DECK.slide({
    id: 'c1-verify', title: '변경안과 검증', chapter: CH, harness: 'orgchange',
    notes: '변경안은 영향받는 기록물철 1건당 1행이다(3행). 상태는 스크립트(build_change_table.py)가 정한다. 검증 판정이 타당이고 확신도가 높음·보통이면 확정안, 그 밖은 검토필요다. 확정안 2건(F0164, F0153)도 사람이 검토한 뒤 적용한다.\nF0162는 옮기는 것 자체는 맞지만, 같은 단위업무 U0086의 나머지 철 3개(F0160 울릉, F0161 새만금, F0163 흑산)를 "유지"로 둔 것이 틀렸다는 판정이다. 1부가 떠나면 "신공항건설1부, 2부" 표기가 실제 조직과 맞지 않는다.\nE02의 7개는 세칙 47차에서 BIM 업무분장 문구가 신공항건설1부 5호 하나뿐이고 시나리오가 5호를 범위 제한 없이 옮기므로, 데이터융합부로 부서레벨변경(확신도 보통)이 필요하다는 지적이다. 기록물철은 F0152, F0154~F0159다. 검증 지적은 확정안이 아니어서 변경적용본에 반영하지 않았다.\n신설 단위업무 제안은 0건이다.\n출처: output/.../분류기준표_변경안.csv, 영향도_보고서.md 3.2·5.1·5.2·6절, 06_impact_stats.json, _workspace/.../05_verify/',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '변경안과 검증', title: '변경안 3행, 검증이 찾은 누락 8개' });
      const dept = (b, a, hi) => `<div class="bf" style="position:relative;display:inline-block;font-size:21px;color:var(--mute)">${b}<i class="sk" style="position:absolute;left:-2px;right:-2px;top:54%;height:2px;background:var(--ink-2);transform-origin:0 50%;transform:scaleX(0)"></i></div>`
        + `<div class="af" style="font-size:24px;font-weight:700;margin-top:4px;white-space:nowrap"><span style="color:var(--mute);font-weight:500">→ </span>${a.map((x, i) => (hi[i] ? `<span style="color:var(--blue)">${x}</span>` : x)).join(' / ')}</div>`;
      const fileCell = (f, e, nm) => `<div><span class="mono" style="font-size:22px;color:var(--blue-2);font-weight:500">${f}</span><span class="mono" style="font-size:19px;color:var(--mute);margin-left:10px">${e}</span></div><div style="font-size:24px;font-weight:700;margin-top:2px;letter-spacing:-0.02em">${nm}</div>`;
      const R = [
        { cells: [fileCell('F0164', 'E01', '제주 제2공항 사업관리'), 'U0087', '부서레벨변경', dept('신공항추진단 / 신공항건설1부', ['건설사업실', '신공항건설1부'], [1, 0]), '30년'], v: ['타당', 'ok'], st: ['확정안', 'ok'] },
        { cells: [fileCell('F0162', 'E01', '제주 제2공항 사업관리'), 'U0086', '이관', dept('신공항추진단 / 신공항건설1부, 2부', ['건설사업실', '신공항건설1부'], [1, 0]), '30년'], v: ['수정필요', 'warn'], st: ['검토필요', 'warn'] },
        { cells: [fileCell('F0153', 'E02', 'KAC-BIM 시스템 유지관리'), 'U0079', '부서레벨변경', dept('신공항추진단 / 디지털트윈사업부', ['스마트공항추진실', '데이터융합부'], [1, 1]), '10년'], v: ['타당', 'ok'], st: ['확정안', 'ok'] },
      ];
      d.tb = K.table(root, {
        x: 120, y: 286, w: 1680, rowH: 100,
        cols: [{ label: '기록물철', w: 380 }, { label: '단위업무', w: 120, cls: 'mono' }, { label: '조치', w: 160 }, { label: '부서 표기 (변경 전 → 변경 후)', w: 570 }, { label: '보존기간', w: 110, align: 'center' }, { label: '검증', w: 170, align: 'center' }, { label: '상태', w: 170, align: 'center' }],
        rows: R.map(r => [...r.cells, '', '']),
      });
      d.tb.el.querySelectorAll('.td').forEach(td => { td.style.padding = '12px 14px'; });
      d.tb.rows.forEach(r => { r.children[1].style.fontSize = '22px'; r.children[2].style.fontSize = '23px'; r.children[4].style.fontSize = '23px'; });
      d.R = d.tb.rows.map((row, i) => {
        const td = row.children;
        const sk = td[3].querySelector('.sk'), af = td[3].querySelector('.af');
        const w1 = h('div', '', td[5]); w1.style.cssText = 'display:flex;justify-content:center';
        const stp = h('span', 'stamp ' + R[i].v[1], w1, R[i].v[0]);
        stp.style.cssText = 'position:relative;display:inline-block;font-size:25px;border-width:4px;padding:3px 12px;border-radius:10px;opacity:0';
        const ch = h('span', 'chip ' + R[i].st[1], td[6], R[i].st[0]);
        ch.style.opacity = '0';
        return { row, sk, af, stp, ch };
      });
      d.cap = txt(root, { x: 120, y: 646, w: 1680 }, '상태: 검증이 타당이고 확신도가 높음·보통이면 확정안, 그 밖은 검토필요. 확정안도 사람이 검토한 뒤 적용한다.', 'font-size:20px;color:var(--mute)');
      // 아래: 검증이 찾은 누락
      d.lh = txt(root, { x: 120, y: 700 }, '검증이 찾은 누락 · 단위업무 <span class="num">0</span>개', 'font-size:30px;font-weight:800;letter-spacing:-0.02em');
      d.lhN = d.lh.querySelector('.num');
      d.new0 = K.chip(root, '신설 단위업무 제안 0건', 'ghost', { r: 120, y: 700 });
      d.lrule = K.at(root, '', { x: 120, y: 752, w: 1680, h: 1.5 }); d.lrule.style.background = 'var(--rule)';
      // E01 묶음
      d.b1 = K.at(root, '', { x: 120, y: 770, w: 430, h: 212 });
      const b1h = h('div', '', d.b1); b1h.style.cssText = 'display:flex;align-items:center;gap:10px;height:36px';
      const e1 = h('span', 'chip blue mono', b1h, 'E01'); e1.style.cssText += ';height:32px;font-size:19px;padding:0 10px';
      const e1t = h('span', '', b1h, 'U0086 나머지 철 3개'); e1t.style.cssText = 'font-size:22px;font-weight:700';
      d.t1 = h('span', 'chip', b1h, '유지'); d.t1.style.cssText += ';height:32px;font-size:19px;padding:0 10px;margin-left:auto';
      paint(d.t1, 'keep');
      [['F0160', '울릉공항 건설사업 관리'], ['F0161', '새만금신공항 건설사업 관리'], ['F0163', '흑산공항 사업관리']].forEach(([f, n]) => {
        const r = h('div', '', d.b1); r.style.cssText = 'height:40px;display:flex;align-items:center;gap:12px;font-size:21px;color:var(--ink)';
        r.innerHTML = `<span class="mono" style="font-size:20px;color:var(--ink-2)">${f}</span><span>${n}</span>`;
      });
      d.b1n = h('div', '', d.b1, '→ 신공항추진단 / 신공항건설2부로 이관');
      d.b1n.style.cssText = 'font-size:21px;font-weight:700;color:#965A00;margin-top:6px;white-space:nowrap';
      d.b1.firstChild.style.marginBottom = '6px';
      // E02 묶음
      d.b2h = K.at(root, '', { x: 600, y: 770, w: 1200, h: 36 });
      d.b2h.style.cssText += ';display:flex;align-items:center;gap:10px';
      const e2 = h('span', 'chip blue mono', d.b2h, 'E02'); e2.style.cssText += ';height:32px;font-size:19px;padding:0 10px';
      const e2t = h('span', '', d.b2h, '디지털트윈사업부 BIM 단위업무 7개 → 데이터융합부로 부서레벨변경 필요'); e2t.style.cssText = 'font-size:22px;font-weight:700';
      const L = [['U0078', '공항 BIM 전환사업 관리', '10년'], ['U0080', 'AX·공공기관 혁신과제 추진관리', '30년'], ['U0081', 'KAC-BIM 교육·홍보·확산', '5년'], ['U0082', '공항 BIM 기준·지침·제도 관리', '30년'],
        ['U0083', 'BIM 인증·기술·특허관리', '30년'], ['U0084', 'BIM 대외협력', '10년'], ['U0085', 'BIM 기술 사업화', '10년']];
      d.miss = L.map((r, i) => {
        const x = 600 + (i < 4 ? 0 : 610), y = 816 + (i % 4) * 42;
        const row = K.at(root, '', { x: x - 8, y, w: 598, h: 38 });
        row.style.cssText += ';border-radius:8px';
        const id = K.chip(row, r[0], 'id', { x: 8, y: 2, h: 34 }); id.style.cssText += ';height:34px;font-size:20px;padding:0 10px';
        txt(row, { x: 104, y: 4 }, r[1], 'font-size:21px;white-space:nowrap');
        txt(row, { x: 420, y: 6 }, r[2], 'font-size:20px;color:var(--ink-2)');
        const tag = K.at(row, 'chip', { x: 480, y: 3, w: 108, h: 32 }, '유지');
        tag.style.cssText += ';height:32px;font-size:19px;padding:0;justify-content:center';
        paint(tag, 'keep');
        return { row, tag, cy: y + 19 };
      });
      // 검증 담당이 위에서 아래로 훑는 선
      d.scan = K.at(root, '', { x: 120, y: 0, w: 1680, h: 46 });
      d.scan.style.cssText += ';background:linear-gradient(to bottom, rgba(232,72,58,0), rgba(232,72,58,.10));border-bottom:2.5px solid var(--bad);opacity:0;pointer-events:none';
      d.scanLab = K.at(root, 'chip mono', { r: 120, y: 0 }, 'change-proposal-verifier');
      d.scanLab.style.cssText += ';height:30px;font-size:19px;padding:0 10px;background:var(--bad);color:#fff;opacity:0';
    },
    render(lt, d) {
      d.T.render(lt);
      d.tb.render(lt, 0.4, 0.15);
      d.R.forEach((r, i) => {
        const t0 = 1.0 + i * 0.25;
        r.sk.style.transform = `scaleX(${prog(lt, t0, 0.35, ease.inOutCubic).toFixed(3)})`;
        K.rise(r.af, lt, t0 + 0.25, { x: -18, y: 0, blur: 3 });
        K.stamp(r.stp, lt, 2.0 + i * 0.28, { rot: -7 });
        K.pop(r.ch, lt, 2.35 + i * 0.28);
      });
      K.rise(d.cap, lt, 2.8, { y: 8 });
      K.rise(d.lh, lt, 2.4, { y: 10 });
      K.pop(d.new0, lt, 2.6);
      K.wipe(d.lrule, lt, 2.4, 0.6);
      K.rise(d.b1, lt, 2.6, { y: 12 });
      K.rise(d.b2h, lt, 2.65, { y: 12 });
      d.miss.forEach((m, i) => K.rise(m.row, lt, 2.7 + i * 0.05, { y: 10 }));
      // 훑기: 3.5 → 5.0초
      const S0 = 3.5, S1 = 5.0, y0 = 760, y1 = 990;
      const sp = prog(lt, S0, S1 - S0, ease.linear);
      const sy = lerp(y0, y1, sp);
      const sa = lt < S0 ? 0 : Math.min(clamp((lt - S0) / 0.15), 1 - prog(lt, S1, 0.3, ease.linear));
      d.scan.style.top = f1(sy - 46) + 'px'; d.scan.style.opacity = sa.toFixed(3);
      d.scanLab.style.top = f1(sy - 32) + 'px'; d.scanLab.style.opacity = sa.toFixed(3);
      let n = 0;
      const flip = (tag, cy) => {
        const on = lt >= S0 && sy >= cy;
        paint(tag, on ? 'warn' : 'keep');
        const t = on ? '수정필요' : '유지';
        if (tag.textContent !== t) tag.textContent = t;
        if (on) n++;
        const tHit = S0 + ((cy - y0) / (y1 - y0)) * (S1 - S0);
        tag.style.transform = `scale(${bump(lt, tHit).toFixed(3)})`;
      };
      flip(d.t1, 788);
      d.miss.forEach(m => flip(m.tag, m.cy));
      d.lhN.textContent = String(n);
      K.rise(d.b1n, lt, S0 + 0.2, { x: -12, y: 0 });
      // 머무는 동안: 누락 8개를 차례로 짚는다
      const k = K.cycle(lt, 5.6, 1.2, 8);
      K.mark(d.b1, k === 0, 'rgba(232,147,12,.08)');
      d.b1.style.borderRadius = '10px';
      d.miss.forEach((m, i) => K.mark(m.row, k === i + 1, 'rgba(232,147,12,.10)'));
    },
  });

  // 19. 사람이 정할 4가지
  DECK.slide({
    id: 'c1-decide', title: '사람이 정할 4가지', chapter: CH, harness: 'orgchange',
    notes: '네 가지는 사건 정리 단계에서 org-change-interpreter가 이미 "확인필요"로 올린 질문이고(02_changes.json), 분석과 검증을 거친 뒤에도 답이 없어 보고서 5.4절에 그대로 남았다. 하네스는 이 네 가지를 정하지 않는다.\n디지털트윈사업부는 세칙 47차 정원표 주석의 디지털트윈 관련 정원 6명과 부칙 제2조의 BIM 업무 위탁사업 한시정원 3명이 함께 옮겨 가는지도 판단에 영향을 준다.\n적용 순서(보고서 8절): 확정안 2건(F0164, F0153) 검토 → 검토필요 F0162와 누락 지적, 이 네 질문을 사람이 결정 → 분류기준표에 반영 → kac-shared 색인 재생성.\n출처: output/시나리오-신공항건설1부이동/영향도_보고서.md 5.4절·8절, _workspace/.../02_changes.json 확인필요',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '사람이 정할 것', title: '사람이 정할 네 가지',
        sub: '시나리오에 답이 없어 사람이 정해야 한다. 분석 단계에서 임의로 정하지 않았다.' });
      d.stamp = K.stampEl(root, '확인필요', 'warn', { x: 1280, y: 156 });
      const CARDS = [
        { hd: '이관 범위', ev: 'E02', q: 'KAC-BIM 사업관리를 데이터융합부로 옮길 때 BIM 단위업무 8개(U0078부터 U0085)를 전부 옮기는가, KAC-BIM 시스템 운영 같은 일부만 옮기는가.', note: '현재 변경안은 U0079(F0153)만 옮겼다.', scope: true },
        { hd: '디지털트윈사업부 거취', ev: 'E01 · E02', q: '신공항추진단에 남고 업무만 넘기는가, 데이터융합부에 흡수되는가, 신공항건설1부와 함께 건설사업실로 가는가.',
          note: '세칙 47차 업무분장에 없는 부서다. 8개가 모두 옮겨 가면 분류기준표에서 디지털트윈사업부 행이 없어진다.', opts: ['신공항추진단 잔류', '데이터융합부 흡수', '건설사업실로 이동'] },
        { hd: '신공항건설2부 거취', ev: 'E01', q: '신공항추진단에 남는가. 남으면 U0086 나머지 철의 부서레벨(2)를 “신공항건설2부”로 고치고, 2부도 건설사업실로 가면 부서레벨(1)을 “건설사업실”로 고친다.', note: 'U0086 나머지 철: F0160 울릉, F0161 새만금, F0163 흑산', opts: ['신공항추진단에 잔류', '건설사업실로 이동'] },
        { hd: '부 이름', ev: 'E01', q: '건설사업실로 옮긴 뒤에도 “신공항건설1부”라는 이름을 쓰는가. 2부가 신공항추진단에 남으면 서로 다른 실·단에 1부와 2부가 따로 있게 된다.', note: '시나리오에 바꾼다는 말이 없어 변경안에는 이름을 그대로 적었다.', opts: ['“신공항건설1부” 그대로', '이름을 바꾼다'] },
      ];
      d.cards = CARDS.map((c, i) => {
        const el = K.at(root, 'card', { x: 120 + (i % 2) * 855, y: 334 + Math.floor(i / 2) * 326, w: 825, h: 306 });
        txt(el, { x: 30, y: 24 }, c.hd, 'font-size:32px;font-weight:800;letter-spacing:-0.025em');
        const tg = K.chip(el, c.ev, 'id', { r: 30, y: 26 }); tg.style.cssText += ';height:34px;font-size:19px;padding:0 10px';
        const qb = K.at(el, '', { x: 30, y: 78, w: 765 });
        const qq = h('div', '', qb, c.q); qq.style.cssText = 'font-size:24px;line-height:1.45;color:var(--ink);letter-spacing:-0.01em';
        if (c.note) { const nn = h('div', '', qb, c.note); nn.style.cssText = 'font-size:20px;line-height:1.45;color:var(--mute);margin-top:8px'; }
        const bar = K.at(el, '', { x: 30, y: c.scope ? 226 : 236, w: 765, h: 56 });
        bar.style.cssText += ';display:flex;gap:12px;align-items:flex-start';
        const opts = [];
        if (c.scope) {
          const G = [[['U0079'], '현재 변경안', true], [['U0078', 'U0080'], '시스템·데이터 구축'], [['U0081'], '교육·확산'], [['U0082', 'U0083', 'U0084', 'U0085'], '기준·인증·대외협력·사업화']];
          bar.style.gap = '22px';
          G.forEach(([ids, lab, fixed]) => {
            const g = h('div', '', bar); g.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:6px;border-radius:10px;padding:0';
            const r = h('div', '', g); r.style.cssText = 'display:flex;gap:6px';
            ids.forEach(id => uchip(r, id, { w: 72, pad: 0, fs: 19, h: 34, st: fixed ? 'ok' : 'cand' }));
            const l = h('div', '', g, lab); l.style.cssText = 'font-size:19px;color:' + (fixed ? '#0B7A52' : 'var(--ink-2)') + ';font-weight:' + (fixed ? 700 : 500) + ';white-space:nowrap';
            if (!fixed) opts.push(r);
          });
        } else {
          c.opts.forEach(o => {
            const e = h('div', '', bar);
            e.style.cssText = 'height:48px;display:flex;align-items:center;gap:10px;padding:0 16px;border:1.5px solid var(--rule-2);border-radius:10px;font-size:21px;font-weight:600;color:var(--ink);background:var(--paper);box-sizing:border-box;white-space:nowrap';
            e.innerHTML = '<i style="width:18px;height:18px;border-radius:50%;border:2.5px solid var(--ink-2);box-sizing:border-box;display:inline-block;flex:none"></i>' + o;
            opts.push(e);
          });
        }
        return { el, bar, opts };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      K.stamp(d.stamp, lt, 1.7, { rot: -8 });
      d.cards.forEach((c, i) => {
        K.rise(c.el, lt, 0.45 + i * 0.12, { y: 24 });
        K.rise(c.bar, lt, 0.9 + i * 0.12, { x: -14, y: 0 });
      });
      // 머무는 동안: 카드를 하나씩 짚고, 그 안의 선택지를 차례로 훑는다(아직 고르지 않았다)
      const T0 = 2.4, PER = 3.2;
      const k = K.cycle(lt, T0, PER, 4);
      const u = k < 0 ? 0 : (lt - T0) % PER;
      d.cards.forEach((c, i) => {
        const on = k === i;
        set(c.el, 'borderColor', on ? C.ink : '');
        set(c.el, 'boxShadow', on ? '0 0 0 2px #1B2A4A, 0 18px 40px -24px rgba(27,42,74,.35)' : '');
        const j = on ? Math.floor(u / (PER / c.opts.length)) % c.opts.length : -1;
        c.opts.forEach((o, oi) => set(o, 'outline', oi === j ? '3px solid rgba(27,42,74,.55)' : 'none'));
        c.opts.forEach(o => set(o, 'outlineOffset', '3px'));
      });
    },
  });
})();

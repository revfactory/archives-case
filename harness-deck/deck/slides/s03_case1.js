/* 조직 변경 영향 — 과제 「조직변경 영향도」. 필름 G 구간에 이어진다.
   화면의 숫자·이름은 아래 파일에서 확인했다(경로는 kac-org-change-impact/ 기준).
   output/시나리오-신공항건설1부이동/영향도_보고서.md, 분류기준표_변경안.csv, 06_impact_stats.json
   _workspace/시나리오-신공항건설1부이동/00_scenario.md, 02_changes.json, 03_candidates/, 04_proposals/, 05_verify/
   _workspace/_regulations/조직_44~47차.json, index.json, .claude/skills/org-change-impact/SKILL.md */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h } = RH;
  const C = K.C;
  const CH = '조직 변경 영향 · 조직변경 영향도';
  const P = '조직변경 영향도 · ';

  // ── 이 장 파일 안에서만 쓰는 함수 ───────────────────────
  const set = RH.set;
  const txt = (parent, box, html, style) => { const e = K.at(parent, '', box, html); if (style) e.style.cssText += ';' + style; return e; };
  const f1 = v => v.toFixed(1);
  const LAB = 'font:700 28px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--mute)';
  const CAP = 'text-align:center;font:800 42px/1.25 var(--display);letter-spacing:-0.025em;color:var(--ink)';
  // 보였다 숨기기(매번 opacity·transform 을 직접 정한다)
  const vis = (el, a, sc) => { const v = clamp(a); el.style.opacity = v.toFixed(3); el.style.transform = `scale(${lerp(sc ?? 0.86, 1, v).toFixed(4)})`; };
  // 0→1→0 한 번 튀기
  const bump = u => Math.sin(Math.PI * clamp(u));
  // K.actor 를 감싼다: 이름표가 그림보다 넓어도 가운데에 오게 하고, 하는 일은 한 줄로 둔다
  function actor(root, o) {
    const a = K.actor(root, o);
    a.el.style.cssText += ';display:flex;flex-direction:column;align-items:center';
    if (a.job) a.job.style.whiteSpace = 'nowrap';
    return a;
  }
  const kindOf = o => o.kind || K.AG[o.id].kind;
  // 번호가 붙은 이름표
  const numName = (n, name) => `<span style="opacity:.55;margin-right:9px">${n}</span>${name}`;
  // 네 명을 한 줄로 세운다. 그림 아래 끝을 base 에 맞춘다
  const CX = [330, 750, 1170, 1590];
  function lineUp(root, defs, base, n0) {
    return defs.map((a, i) => {
      const kd = kindOf(a), w = a.w;
      const nm = a.name || K.AG[a.id].ko;
      return actor(root, { kind: kd, name: numName(n0 + i, nm), job: a.job, w, x: CX[i] - w / 2, y: base - w * K.AGR[kd] });
    });
  }

  // 14. 챕터 영상
  DECK.slide({
    id: 'ch-orgchange', title: '조직 변경 영향 챕터 영상', bg: 'paper', harness: 'orgchange', video: 'media/ch_orgchange.mp4', poster: 'media/ch_orgchange.jpg',
    notes: '10초 챕터 영상. 필름 G 구간의 작업장(크레인과 부서 블록)이 움직이고, 질문 「조직이 바뀌면 기준표는 어떻게 고치죠?」에 답한다. 조직이 바뀔 때 분류기준표의 어느 단위업무와 기록물철을 고쳐야 하는지 찾는 하네스다(kac-org-change-impact, 에이전트 4개).\n이 챕터는 시나리오 한 건을 입력부터 사람이 정할 질문까지 차례로 따라간다. 끝나면 → 키로 넘긴다.',
  });

  // ── 입력 1: 한 문장 → 사건 두 개 ─────────────────────────
  DECK.slide({
    id: 'c1-input', title: '한 문장을 사건 두 개로 나눈다', chapter: CH, harness: 'orgchange',
    notes: '하네스는 두 가지 입력을 받는다. 시행세칙 신구 차수를 비교한 결과, 또는 말로 준 조직변경 시나리오다. 이번 입력은 시나리오 한 문장이고, 변경 해석 에이전트(org-change-interpreter)가 이 문장을 사건 두 개로 나눴다. E01은 상위조직변경(신공항건설1부의 소속이 부사장직할 신공항추진단에서 건설기술본부 건설사업실로 바뀐다, 확신도 높음), E02는 업무이관(신공항건설1부의 KAC-BIM 사업관리 업무가 스마트공항추진실 데이터융합부로 간다, 확신도 보통)이다. 사건마다 유형, 변경 전·후 부서, 근거 문구, 확신도를 02_changes.json에 적는다.\n실제 시행세칙 개정 이력은 화면에서 뺐다. 44차(2024.12.12)→45차(2025.01.16)는 신공항건설부를 1부·2부로 나눴고, 45차→46차(2025.07.09)는 청주공항을 분리해 운영기획부·서비스보안부·시설안전부 3개 부를 새로 만들었다. 46차→47차(2026.02.11)는 정원만 바뀌어 업무분장 변경이 0건이다. 분류기준표가 이 개정을 이미 반영하고 있어 과거 차수를 넣으면 대부분 "유지"로 나오므로, 이번 시험은 시나리오로 했다.\n출처: kac-org-change-impact/_workspace/시나리오-신공항건설1부이동/00_scenario.md, 02_changes.json, _workspace/_regulations/조직_44~47차.json·index.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '입력', title: '한 문장을 사건 두 개로 나눈다' });
      d.svg = K.svg(root);
      d.qLab = txt(root, { x: 120, y: 366 }, '입력한 문장', LAB);
      d.qc = K.at(root, 'card', { x: 120, y: 416, w: 720, h: 460 });
      d.q = K.at(d.qc, 'quote', { x: 40, y: 38, w: 660 });
      d.q.style.fontSize = '40px'; d.q.style.lineHeight = '64px';
      const LINES = [[['신공항추진단 ', 0], ['신공항건설1부를', 1]], [['건설사업실 소속으로 옮기고', 1], [',', 0]], [['KAC-BIM 사업관리 업무는', 2]], [['스마트공항추진실 데이터융합부로', 2]], [['이관하면', 2], [' 분류기준표가', 0]], [['어떻게 바뀌나?', 0]]];
      d.mk = [null, [], []];
      d.lines = LINES.map(parts => {
        const ln = h('div', '', d.q); ln.style.whiteSpace = 'nowrap';
        parts.forEach(([t, g]) => {
          const sp = h('span', '', ln); sp.textContent = t;
          if (g) { sp.style.cssText = 'background-repeat:no-repeat;background-position:0 92%;background-size:0% 36%'; d.mk[g].push(sp); }
        });
        return ln;
      });
      d.ag = actor(root, { id: 'org-change-interpreter', job: '문장을 읽고 나눈다', x: 905, y: 490, w: 240 });
      d.eLab = txt(root, { x: 1210, y: 366 }, '사건 두 개', LAB);
      const EV = [['E01', '상위조직변경', '부서의 소속이 바뀐다'], ['E02', '업무이관', '업무 하나가 다른 부서로 간다']];
      d.cards = EV.map((e, i) => {
        const c = K.at(root, 'card', { x: 1210, y: 416 + i * 245, w: 590, h: 215 });
        const id = K.chip(c, e[0], 'blue lg', { x: 32, y: 28 }); id.classList.add('mono');
        txt(c, { x: 32, y: 92 }, e[1], 'font:900 48px/1.15 var(--display);letter-spacing:-0.03em;white-space:nowrap');
        txt(c, { x: 32, y: 158 }, e[2], 'font:600 28px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);white-space:nowrap');
        return c;
      });
      d.p0 = K.path(d.svg, [[850, 646], [898, 646]], { color: C.ink2, width: 4, arrow: true });
      d.ps = [523, 768].map(y => K.path(d.svg, `M 1152 646 C 1184 646, 1172 ${y}, 1200 ${y}`, { color: C.blue, width: 4, arrow: true }));
      // 문장에서 떼어 낸 조각
      d.frag = ['신공항건설1부를 건설사업실로', 'KAC-BIM 업무는 데이터융합부로'].map(t => {
        const e = K.doc(root, t, { x: 0, y: 0, w: 400 }); e.style.textAlign = 'center'; e.style.opacity = '0'; return e;
      });
      d.from = [[280, 474], [280, 634]]; d.to = [d.ag.cx - 200, d.ag.top - 66];
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.qLab, lt, 0.35, { y: 10 }); K.rise(d.qc, lt, 0.4, { y: 20 });
      d.lines.forEach((ln, i) => K.rise(ln, lt, 0.5 + i * 0.07, { y: 14, blur: 4 }));
      d.ag.render(lt, 0.9);
      K.draw(d.p0, lt, 1.1, 0.3);
      K.rise(d.eLab, lt, 1.2, { y: 10 });
      d.cards.forEach((c, i) => K.pop(c, lt, 1.35 + i * 0.18));
      d.ps.forEach((p, i) => K.draw(p, lt, 1.3 + i * 0.18, 0.4));
      // 반복: 조각 하나를 읽고 → 사건 하나를 낸다. 두 번 한 뒤 잠깐 쉰다
      const L = K.loop(lt, 2.5, [1.5, 1.3, 1.5, 1.3, 1.2]);
      const e = L.i < 0 || L.i > 3 ? -1 : L.i >> 1, ph = L.i & 1, u = L.u;
      d.ag.act(lt, e >= 0 && ((ph === 0 && u > 0.55) || (ph === 1 && u < 0.4)));
      if (lt < 1.5) d.ag.render(lt, 0.9);
      [0, 1].forEach(g => {
        const on = e === g;
        const a = on ? 'rgba(47,123,255,.42)' : 'rgba(47,123,255,.18)';
        d.mk[g + 1].forEach((sp, j) => {
          sp.style.backgroundSize = `${f1(prog(lt, 1.5 + g * 0.35 + j * 0.15, 0.3, ease.inOutCubic) * 100)}% 36%`;
          set(sp, 'backgroundImage', `linear-gradient(${a}, ${a})`);
        });
        const fr = d.frag[g];
        if (on && ph === 0) { K.travel(fr, u, 0.2, 0.55, d.from[g], d.to, { arc: 40, fade: false }); fr.style.opacity = clamp((u - 0.1) / 0.12).toFixed(3); }
        else if (on && ph === 1) { K.travel(fr, 1, 0, 1, d.to, d.to, { fade: false }); fr.style.opacity = clamp(1 - u / 0.3).toFixed(3); }
        else fr.style.opacity = '0';
        const hit = on && ph === 1;
        d.ps[g].setAttribute('stroke-width', hit ? 7 : 4);
        set(d.cards[g], 'borderColor', hit ? C.blue : '');
        set(d.cards[g], 'background', hit ? '#EAF2FF' : '');
        set(d.cards[g], 'boxShadow', hit ? '0 0 0 3px #2F7BFF, 0 18px 40px -22px rgba(47,123,255,.6)' : '');
        if (lt > 2.4) d.cards[g].style.transform = `scale(${(1 + (hit ? 0.045 * bump(u / 0.45) : 0)).toFixed(4)})`;
      });
    },
  });

  // ── 입력 2: 사건 유형 아홉 가지 ───────────────────────────
  DECK.slide({
    id: 'c1-types', title: '사건 유형 아홉 가지 가운데 두 가지가 나왔다', chapter: CH, harness: 'orgchange',
    notes: '입력이 시행세칙 차수 비교든 말로 준 시나리오든, 변경 해석 에이전트(org-change-interpreter)는 변경 하나하나를 사건 유형 아홉 가지 가운데 하나로 정리한다. 부서 단위의 변경이 여섯 가지(부서신설, 부서폐지, 부서통합, 부서분리, 명칭변경, 상위조직변경), 업무 단위의 변경이 세 가지(업무이관, 업무신설, 업무폐지)다. 유형에 따라 뒤 단계가 분류기준표에서 찾을 대상과 낼 수 있는 조치가 달라진다.\n이번 시나리오에서는 상위조직변경(E01)과 업무이관(E02)이 나왔다. 실제 개정 이력에서는 44→45차가 부서분리, 45→46차가 부서신설에 해당한다.\n출처: kac-org-change-impact/.claude/skills/unit-task-impact-rules(사건 유형 정의), _workspace/시나리오-신공항건설1부이동/02_changes.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '사건 유형', title: '사건 유형 아홉 가지 가운데 두 가지가 나왔다' });
      const TYPES = [['부서신설', '없던 부서가 생긴다'], ['부서폐지', '부서와 업무가 없어진다'], ['부서통합', '여러 부서가 하나가 된다'], ['부서분리', '한 부서가 여럿으로 나뉜다'], ['명칭변경', '부서 이름만 바뀐다'],
        ['상위조직변경', '부서는 그대로, 소속만 바뀐다'], ['업무이관', '업무 일부가 다른 부서로 간다'], ['업무신설', '부서에 새 업무가 생긴다'], ['업무폐지', '업무가 없어진다']];
      d.hit = { 5: 'E01', 6: 'E02' };
      d.tiles = TYPES.map((t, i) => {
        const el = K.at(root, 'card flat', { x: 120 + (i % 3) * 570, y: 316 + Math.floor(i / 3) * 212, w: 540, h: 184 });
        el.style.borderWidth = '2px';
        const nm = txt(el, { x: 34, y: 34 }, t[0], 'font:900 46px/1.1 var(--display);letter-spacing:-0.03em;white-space:nowrap');
        txt(el, { x: 34, y: 108 }, t[1], 'font:600 28px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);white-space:nowrap');
        let tag = null;
        if (d.hit[i]) { tag = K.chip(el, d.hit[i], 'blue lg', { r: 26, y: 28 }); tag.classList.add('mono'); tag.style.opacity = '0'; }
        return { el, nm, tag };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.tiles.forEach((t, i) => K.rise(t.el, lt, 0.4 + i * 0.07, { y: 22 }));
      // 해당하는 두 칸은 등장 뒤 계속 강조한다. 반복: 두 칸을 번갈아 짚는다
      const L = K.loop(lt, 2.6, [1.8, 1.8]);
      const HI = [5, 6];
      d.tiles.forEach((t, i) => {
        const k = HI.indexOf(i), isHit = k >= 0;
        const t0 = 1.5 + Math.max(0, k) * 0.35, lit = isHit && lt >= t0;
        const cur = isHit && L.i === k;
        set(t.el, 'borderColor', lit ? C.blue : '');
        set(t.el, 'background', lit ? '#EAF2FF' : '');
        set(t.el, 'boxShadow', lit ? (cur ? '0 0 0 6px #2F7BFF, 0 22px 44px -20px rgba(47,123,255,.75)' : '0 0 0 3px #2F7BFF, 0 18px 40px -22px rgba(47,123,255,.6)') : 'none');
        set(t.nm, 'color', lit ? '#1F5FD6' : '');
        if (t.tag) K.pop(t.tag, lt, t0);
        if (isHit && lt >= t0) t.el.style.transform = `scale(${(1 + 0.05 * bump((lt - t0) / 0.35) * (lt < t0 + 0.35 ? 1 : 0) + (cur ? 0.035 * Math.min(1, L.u / 0.15, (1 - L.u) / 0.15) : 0)).toFixed(4)})`;
        if (!isHit && lt > 1.5) t.el.style.opacity = lerp(1, 0.5, clamp((lt - 1.5) / 0.6)).toFixed(3);
      });
    },
  });

  // ── 진행 순서 1: 1~4단계 ─────────────────────────────────
  DECK.slide({
    id: 'c1-flow', title: '사건을 먼저 정하고, 사람이 확인한다', chapter: CH, harness: 'orgchange',
    notes: '진행 순서 여덟 단계 가운데 앞의 네 단계다. 1단계 스크립트(prepare.py)는 시행세칙 44~47차와 직제규정 39~41차 hwpx 파일을 읽어 차수마다 조직 구조와 업무분장을 정리한다(_workspace/_regulations/조직_47차.json 등). 2단계 변경 해석 에이전트(org-change-interpreter, opus)가 시나리오와 정리한 규정을 읽고 사건 표(02_changes.json)를 쓴다. 이번에는 사건 2개와 확인필요 질문 4개가 나왔다.\n3단계에서 사건 표와 확인필요 질문을 사람에게 보여 주고 확인을 받는다. 사건 해석이 틀리면 뒤 단계가 모두 틀리기 때문이다. 고칠 곳이 있으면 2단계를 다시 부른다.\n4단계 스크립트(impact_lookup.py)는 사건마다 분류기준표에서 영향 받을 후보 단위업무와 기록물철을 찾는다(03_candidates/E01.json: 단위업무 2개·기록물철 5개, E02.json: 단위업무 5개·기록물철 8개).\n출처: kac-org-change-impact/.claude/skills/org-change-impact/SKILL.md 「데이터 전달」, .claude/agents/*.md, _workspace/시나리오-신공항건설1부이동/03_candidates/_summary.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '진행 순서 1~4단계', title: '사건을 먼저 정하고, 사람이 확인한다' });
      const BASE = 690;
      d.act = lineUp(root, [
        { kind: 'script', name: '스크립트', job: '규정을 정리한다', w: 210 },
        { id: 'org-change-interpreter', job: '문장을 사건으로 나눈다', w: 220 },
        { kind: 'human', name: '사람', job: '사건을 확인한다', w: 150 },
        { kind: 'script', name: '스크립트', job: '영향 받을 후보를 찾는다', w: 210 },
      ], BASE, 1);
      d.svg = K.svg(root);
      d.arr = [0, 1, 2].map(i => K.path(d.svg, [[CX[i] + 138, BASE - 110], [CX[i + 1] - 138, BASE - 110]], { color: C.ink2, width: 4, arrow: true }));
      d.cap = txt(root, { x: 120, y: 872, w: 1680 }, '사건을 잘못 나누면 뒤 단계가 모두 틀린다', CAP);
      d.doc = K.doc(root, '', { x: 0, y: 0, w: 250 }); d.doc.style.textAlign = 'center'; d.doc.style.opacity = '0';
      d.pos = CX.map(x => [x - 125, 352]);
      d.say = K.say(root, '확인', { x: CX[2] + 84, y: 470 }, 'ok', 'l'); d.say.style.opacity = '0';
      d.IN = ['시행세칙', '정리한 규정', '사건 2개', '사건 2개'];
      d.OUT = ['정리한 규정', '사건 2개', '사건 2개', '후보 단위업무'];
    },
    render(lt, d) {
      d.T.render(lt);
      d.act.forEach((a, i) => a.render(lt, 0.5 + i * 0.18));
      d.arr.forEach((p, i) => K.draw(p, lt, 0.8 + i * 0.18, 0.3));
      K.rise(d.cap, lt, 1.7, { y: 14 });
      // 반복: 문서 한 장이 네 단계를 차례로 지나며 이름이 바뀐다
      const L = K.loop(lt, 2.5, [1.6, 1.6, 1.6, 1.6, 0.5]);
      const st = L.i, u = L.u;
      d.act.forEach((a, i) => { if (lt > 2.3) a.act(lt, st === i && u > 0.35); });
      vis(d.say, st === 2 && u > 0.6 ? 1 : 0);
      if (st < 0) { d.doc.style.opacity = '0'; return; }
      const i = Math.min(st, 3), done = st > 3 || u > 0.68;
      const label = done ? d.OUT[i] : d.IN[i];
      if (d.doc.textContent !== label) d.doc.textContent = label;
      const cls = 'doc' + ((i === 2 && done) || i === 3 ? ' ok' : '');
      if (d.doc.className !== cls) d.doc.className = cls;
      const to = d.pos[i], from = i === 0 ? [to[0] - 150, to[1]] : d.pos[i - 1];
      K.travel(d.doc, st > 3 ? 1 : u, 0, 0.32, from, to, { arc: 30, fade: false });
      d.doc.style.transform = `scale(${(1 + (st <= 3 ? 0.12 * bump((u - 0.68) / 0.2) * (u > 0.68 && u < 0.88 ? 1 : 0) : 0)).toFixed(4)})`;
      d.doc.style.opacity = (st === 0 ? clamp(u / 0.12) : st > 3 ? clamp(1 - u / 0.6) : 1).toFixed(3);
    },
  });

  // ── 진행 순서 2: 5~8단계 ─────────────────────────────────
  DECK.slide({
    id: 'c1-flow2', title: '사건마다 분석과 검증을 한 번씩 되풀이한다', chapter: CH, harness: 'orgchange',
    notes: '진행 순서의 뒤 네 단계다. 5단계 영향 분석 에이전트(unit-impact-analyst, opus)가 사건 하나의 후보(03_candidates/E01.json)를 읽고 단위업무마다 조치와 근거를 적은 변경안(04_proposals/E01.json)을 낸다. 6단계 검증 에이전트(change-proposal-verifier, opus)가 변경안과 후보를 함께 읽고 판정(타당, 수정필요)과 빠진 단위업무를 따로 적는다(05_verify/E01.json). 검증 에이전트에는 Edit 도구를 주지 않아 변경안 파일을 고칠 수 없다. 5·6단계는 사건마다(E01, E02) 한 번씩 돈다. 에이전트는 쓴 파일을 validate.py로 검사해 OK를 확인한다.\n7단계 스크립트(build_change_table.py)가 두 사건의 변경안과 검증 결과를 합쳐 분류기준표_변경안.csv(3행)와 06_impact_stats.json을 만든다. 8단계 보고서 에이전트(impact-report-writer, sonnet)가 이 두 파일만 읽고 영향도_보고서.md를 쓴다. 결과는 output/시나리오-신공항건설1부이동/ 에 놓인다.\n출처: kac-org-change-impact/.claude/skills/org-change-impact/SKILL.md 「데이터 전달」, .claude/agents/*.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '진행 순서 5~8단계', title: '사건마다 분석과 검증을 한 번씩 되풀이한다' });
      const BASE = 735;
      d.box = K.at(root, '', { x: 130, y: 347, w: 830, h: 590 });
      d.box.style.cssText += ';border:3px dashed rgba(47,123,255,.55);border-radius:22px;box-sizing:border-box';
      d.tab = K.at(root, '', { x: 162, y: 321 });
      d.tab.style.cssText += ';display:flex;align-items:center;gap:12px;padding:0 6px 0 0;background:var(--paper)';
      const tl = h('span', 'chip blue lg', d.tab, '사건마다 한 번씩');
      tl.style.fontWeight = '800';
      d.ev = ['E01', 'E02'].map(t => { const c = h('span', 'chip lg mono', d.tab, t); c.style.cssText += ';border:2.5px solid var(--blue);box-sizing:border-box'; return c; });
      d.act = lineUp(root, [
        { id: 'unit-impact-analyst', job: '변경안을 낸다', w: 220 },
        { id: 'change-proposal-verifier', job: '변경안을 따로 확인한다', w: 200 },
        { kind: 'script', name: '스크립트', job: '변경안 표를 만든다', w: 210 },
        { id: 'impact-report-writer', job: '보고서를 쓴다', w: 200 },
      ], BASE, 5);
      d.svg = K.svg(root);
      d.arr = [0, 1, 2].map(i => K.path(d.svg, [[CX[i] + 138, BASE - 110], [CX[i + 1] - 138, BASE - 110]], { color: C.ink2, width: 4, arrow: true }));
      // 다음 사건으로 돌아가는 선
      d.back = K.path(d.svg, [[CX[1], 847], [CX[1], 869], [CX[0], 869], [CX[0], 847]], { color: C.blue, width: 4, arrow: true, radius: 16 });
      d.backLab = txt(root, { x: 440, y: 881, w: 200 }, '다음 사건', 'text-align:center;font:800 28px/1.3 var(--sans);letter-spacing:-0.02em;color:#1F5FD6');
      const mk = () => { const e = K.doc(root, '', { x: 0, y: 0, w: 250 }); e.style.textAlign = 'center'; e.style.opacity = '0'; return e; };
      d.dA = mk(); d.dB = mk(); d.dC = mk();
      d.pos = CX.map(x => [x - 125, 401]);
      d.park = [[CX[2] - 150, 361], [CX[2] - 100, 413]];
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.box, lt, 0.4, { y: 0, scale: 0.98, blur: 0 }); K.pop(d.tab, lt, 0.6);
      d.act.forEach((a, i) => a.render(lt, 0.55 + i * 0.18));
      d.arr.forEach((p, i) => K.draw(p, lt, 0.85 + i * 0.18, 0.3));
      K.draw(d.back, lt, 1.5, 0.5); K.rise(d.backLab, lt, 1.7, { y: 0 });
      // 반복(한 바퀴 13.4초): E01 이 5→6 을 지나 기다리고, E02 가 5→6 을 지난 뒤, 둘을 합쳐 7→8 로 간다
      const L = K.loop(lt, 2.4, [13.4]);
      const T = L.i < 0 ? -1 : L.t, p = d.pos;
      const on = (a, b) => T >= a && T < b;
      if (lt > 2.2) {
        d.act[0].act(lt, on(0.9, 2.1) || on(5.8, 7.0));
        d.act[1].act(lt, on(2.9, 4.1) || on(7.8, 9.0));
        d.act[2].act(lt, on(9.8, 11.0));
        d.act[3].act(lt, on(11.8, 13.0));
      }
      const cur = T < 0 ? -1 : T < 4.9 ? 0 : T < 9.8 ? 1 : 2;
      d.ev.forEach((c, i) => { const a = cur === i; set(c, 'background', a ? C.blue : 'var(--paper-3)'); set(c, 'color', a ? '#fff' : '#1F5FD6'); });
      d.back.setAttribute('stroke-width', on(4.1, 5.4) ? 7 : 4);
      // 사건 하나의 문서: s = 그 사건이 시작한 시각, 마지막에 park 자리로 간다
      const one = (el, name, s, park) => {
        const t = T - s;
        if (T < 0 || t < 0 || T >= 10.5) { el.style.opacity = '0'; return; }
        const label = t < 1.5 ? '사건 ' + name : t < 3.5 ? name + ' 변경안' : name + ' 검증 의견';
        if (el.textContent !== label) el.textContent = label;
        const cls = 'doc' + (t >= 3.5 ? ' bad' : t >= 1.5 ? ' blue' : '');
        if (el.className !== cls) el.className = cls;
        if (t < 2.1) K.travel(el, t, 0, 0.6, [p[0][0] - 150, p[0][1]], p[0], { arc: 20, fade: false });
        else if (t < 4.1) K.travel(el, t, 2.1, 0.7, p[0], p[1], { arc: 34, fade: false });
        else K.travel(el, t, 4.1, 0.8, p[1], park, { arc: 30, fade: false });
        el.style.transform = `scale(${(1 + 0.12 * (bump((t - 1.5) / 0.25) * (t > 1.5 && t < 1.75 ? 1 : 0) + bump((t - 3.5) / 0.25) * (t > 3.5 && t < 3.75 ? 1 : 0))).toFixed(4)})`;
        el.style.opacity = Math.min(clamp(t / 0.2), clamp((10.5 - T) / 0.3)).toFixed(3);
      };
      one(d.dA, 'E01', 0, d.park[0]); one(d.dB, 'E02', 4.9, d.park[1]);
      // 합친 결과
      if (T < 10.3) d.dC.style.opacity = '0';
      else {
        const label = T < 12.4 ? '변경안 3행' : '영향도 보고서';
        if (d.dC.textContent !== label) d.dC.textContent = label;
        K.travel(d.dC, T, 11.0, 0.8, p[2], p[3], { arc: 34, fade: false });
        d.dC.style.transform = `scale(${(1 + 0.12 * bump((T - 12.4) / 0.25) * (T > 12.4 && T < 12.65 ? 1 : 0)).toFixed(4)})`;
        d.dC.style.opacity = Math.min(clamp((T - 10.3) / 0.25), clamp((13.4 - T) / 0.3)).toFixed(3);
      }
    },
  });

  // ── 사건 E01: 부서 상자가 옮겨 간다 ───────────────────────
  // 조직도 한 묶음(위 조직 이름 + 실·단 + 아래 부서들)
  function orgCol(root, o) {
    const top = txt(root, { x: o.x, y: 306 }, o.top, LAB);
    const par = K.at(root, '', { x: o.x, y: 352, w: 560, h: 86 }, o.name);
    par.style.cssText += ';box-sizing:border-box;border-radius:14px;background:var(--ink);color:#FDF3E2;display:flex;align-items:center;padding:0 30px;font:900 40px/1 var(--display);letter-spacing:-0.03em';
    const KY = i => 472 + i * 102;
    const spine = K.at(root, '', { x: o.x + 30, y: 438, w: 4, h: KY(o.kids.length - 1) + 40 - 438 }); spine.style.background = 'rgba(27,42,74,.4)';
    const kids = o.kids.map((nm, i) => {
      const tick = K.at(root, '', { x: o.x + 32, y: KY(i) + 38, w: 38, h: 4 }); tick.style.background = 'rgba(27,42,74,.4)';
      const n = K.at(root, '', { x: o.x + 70, y: KY(i), w: 560, h: 80 }, nm);
      n.style.cssText += ';box-sizing:border-box;border-radius:12px;background:var(--paper-3);border:2px solid var(--rule-2);display:flex;align-items:center;padding:0 28px;font:800 36px/1 var(--sans);letter-spacing:-0.03em;color:var(--ink)';
      return { n, tick, x: o.x + 70, y: KY(i) };
    });
    return { top, par, spine, kids, x: o.x, KY, render(lt, t0) {
      K.rise(top, lt, t0, { y: 8 }); K.pop(par, lt, t0 + 0.05); K.wipe(spine, lt, t0 + 0.3, 0.5, 'down');
      kids.forEach((kd, i) => { K.wipe(kd.tick, lt, t0 + 0.4 + i * 0.08, 0.25); if (!kd.skip) K.rise(kd.n, lt, t0 + 0.42 + i * 0.08, { x: -18, y: 0 }); });
    } };
  }
  DECK.slide({
    id: 'c1-e01', title: '신공항건설1부가 건설사업실로 옮긴다', chapter: CH, harness: 'orgchange',
    notes: '사건 E01은 상위조직변경이다. 신공항건설1부의 소속만 부사장직할 신공항추진단에서 건설기술본부 건설사업실로 바뀐다(확신도 높음). 부 이름은 시나리오에 바꾼다는 말이 없어 그대로 뒀다. 세칙 47차 별표 3에서 신공항건설1부의 업무분장은 1~4호가 제주 제2공항 건설사업, 5호가 KAC-BIM 사업관리다. 5호는 E02에서 데이터융합부로 가므로 건설사업실로 함께 가는 업무는 1~4호다.\n분류기준표에서 이 사건의 후보 단위업무는 2개다. U0087(신공항추진단/신공항건설1부 단독 행, 철 F0164)과 U0086(부서 표기가 "신공항건설1부, 2부"인 공동 행, 철 4개)이다. 신공항추진단의 2021~2026년 생산·접수 문서는 6,873건인데, 문서목록에 부·단위업무 칸이 없어 1부만의 건수는 낼 수 없다.\n조직도는 세칙 47차(조직_47차.json) 기준이다. 분류기준표에만 있는 디지털트윈사업부(신공항추진단 아래, 세칙 업무분장에는 없는 부서)는 화면에서 뺐다.\n출처: kac-org-change-impact/_workspace/시나리오-신공항건설1부이동/02_changes.json, 03_candidates/_summary.json, output/시나리오-신공항건설1부이동/06_impact_stats.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '사건 E01 · 상위조직변경', title: '신공항건설1부가 건설사업실로 옮긴다' });
      d.svg = K.svg(root);
      d.A = orgCol(root, { x: 150, top: '부사장직할', name: '신공항추진단', kids: ['신공항계획부', '신공항건설1부', '신공항건설2부'] });
      d.B = orgCol(root, { x: 1070, top: '건설기술본부', name: '건설사업실', kids: ['공항계획부', '건설안전부'] });
      d.n1 = d.A.kids[1]; d.n1.skip = true;
      d.n1.n.style.zIndex = '3';
      // 떠난 자리(점선)
      d.ghost = K.at(root, '', { x: d.n1.x, y: d.n1.y, w: 560, h: 80 });
      d.ghost.style.cssText += ';box-sizing:border-box;border-radius:12px;border:3px dashed rgba(47,123,255,.4);opacity:0';
      root.insertBefore(d.ghost, d.n1.n);
      d.dst = [d.B.x + 70, d.B.KY(2)];
      d.tickB = K.at(root, '', { x: d.B.x + 32, y: d.dst[1] + 38, w: 38, h: 4 }); d.tickB.style.background = 'rgba(27,42,74,.4)';
      d.spB = [d.B.KY(1) + 40 - 438, d.B.KY(2) + 40 - 438];
      d.trail = K.path(d.svg, `M 790 ${d.n1.y + 40} C 930 ${d.n1.y + 40}, 920 ${d.dst[1] + 40}, 1056 ${d.dst[1] + 40}`, { color: C.blue, width: 4, dash: '10 10', arrow: true });
      d.cap = txt(root, { x: 120, y: 868, w: 1680 }, '하는 일은 그대로이고 소속만 바뀐다', CAP);
    },
    render(lt, d) {
      d.T.render(lt);
      d.A.render(lt, 0.4); d.B.render(lt, 0.55);
      K.rise(d.cap, lt, 1.6, { y: 14 });
      // 반복: 제자리 → 옮겨 간다 → 새 자리에서 머문다 → 처음으로
      const L = K.loop(lt, 2.4, [1.0, 1.4, 2.3, 0.5]);
      const st = L.i, u = L.u;
      const p = st < 1 ? 0 : st === 1 ? ease.inOutCubic(u) : 1;
      const lift = Math.sin(Math.PI * p);
      const a = st === 3 ? Math.abs(1 - 2 * u) : 1;       // 되돌아갈 때 새 자리에서 사라졌다가 원래 자리에 나타난다
      const pp = st === 3 && u > 0.5 ? 0 : p;
      const n = d.n1.n;
      if (lt < 2.4) K.rise(n, lt, 0.9, { x: -18, y: 0 });
      else {
        n.style.filter = ''; n.style.opacity = a.toFixed(3);
        n.style.transform = `translate(${f1((d.dst[0] - d.n1.x) * pp)}px, ${f1((d.dst[1] - d.n1.y) * pp - 80 * (pp === p ? lift : 0))}px) scale(${(1 + 0.04 * lift).toFixed(4)})`;
      }
      const moved = st >= 1 && !(st === 3 && u > 0.5);
      set(n, 'border', (st >= 0 && lt > 2.4) ? '4px solid ' + C.blue : '2px solid var(--rule-2)');
      set(n, 'background', moved ? '#EAF2FF' : 'var(--paper-3)');
      n.style.boxShadow = `0 ${f1(10 + 24 * lift)}px ${f1(26 + 30 * lift)}px -16px rgba(47,123,255,${(0.2 + 0.5 * lift).toFixed(2)})`;
      d.ghost.style.opacity = (moved ? clamp(p / 0.3) * a : 0).toFixed(3);
      set(d.n1.tick, 'opacity', moved ? '0.25' : '1');
      const arrive = st === 1 ? clamp((u - 0.7) / 0.3) : st === 2 ? 1 : st === 3 && u < 0.5 ? a : 0;
      d.B.spine.style.height = lt < 1.5 ? d.B.spine.style.height : f1(lerp(d.spB[0], d.spB[1], arrive)) + 'px';
      if (lt < 1.5) d.B.spine.style.height = d.spB[0] + 'px';
      d.tickB.style.opacity = arrive.toFixed(3);
      K.draw(d.trail, st === 2 ? L.u * 2.3 : 0, 0.05, 0.4);
      if (st === 3 && u < 0.5) { d.trail.style.opacity = a.toFixed(3); if (d.trail._arrow) d.trail._arrow.style.opacity = a.toFixed(3); }
      else if (st !== 2) { d.trail.style.opacity = '0'; if (d.trail._arrow) d.trail._arrow.style.opacity = '0'; }
    },
  });

  // ── 사건 E02: 업무 하나가 다른 부서로 간다 ────────────────
  DECK.slide({
    id: 'c1-e02', title: 'KAC-BIM 업무만 데이터융합부로 간다', chapter: CH, harness: 'orgchange',
    notes: '사건 E02는 업무이관이다. 세칙 47차 별표 3에서 신공항건설1부의 업무분장은 다섯 가지다. 1~4호는 제주 제2공항 건설사업(설계 및 시공관리, 공정계획·공정관리, 총사업비 관리·조정, 이해관계자 협의)이고 5호가 KAC-BIM 사업관리다. 시나리오는 이 5호만 전략기획본부 스마트공항추진실 데이터융합부로 옮긴다. 데이터융합부의 47차 업무분장은 1~12호이고 BIM 문구는 없다.\n확신도는 보통이다. 분류기준표에서 BIM 단위업무 8개(U0078~U0085)가 신공항건설1부가 아니라 세칙 업무분장에 없는 디지털트윈사업부 아래에 있고, 이관 범위와 디지털트윈사업부를 어떻게 할지가 시나리오에 없기 때문이다. 이 문제는 뒤의 「빠진 단위업무 8개」 장과 「사람이 정할 것」 장에서 다시 나온다. 이 사건의 후보는 단위업무 5개·기록물철 8개다.\n출처: kac-org-change-impact/_workspace/시나리오-신공항건설1부이동/02_changes.json(E02 근거), 03_candidates/_summary.json, _workspace/_regulations/조직_47차.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '사건 E02 · 업무이관', title: 'KAC-BIM 업무만 데이터융합부로 간다' });
      d.svg = K.svg(root);
      const panel = (x, lab, name) => {
        const c = K.at(root, 'card', { x, y: 322, w: 680, h: 440 });
        txt(c, { x: 44, y: 34 }, lab, LAB);
        txt(c, { x: 44, y: 78 }, name, 'font:900 42px/1.15 var(--display);letter-spacing:-0.03em;white-space:nowrap');
        return c;
      };
      d.pl = panel(150, '업무를 내보내는 부서', '신공항건설1부');
      d.pr = panel(1090, '업무를 받는 부서', '스마트공항추진실 데이터융합부');
      const item = (x, y, t, mute) => {
        const e = K.at(root, '', { x, y, w: 592, h: 96 }, t);
        e.style.cssText += `;box-sizing:border-box;border-radius:12px;background:${mute ? 'var(--paper-2)' : '#fff'};border:2px solid var(--rule-2);display:flex;align-items:center;padding:0 28px;font:800 34px/1 var(--sans);letter-spacing:-0.03em;color:${mute ? 'var(--ink-2)' : 'var(--ink)'};white-space:nowrap`;
        return e;
      };
      d.it = [item(194, 482, '제주 제2공항 건설사업 업무 4개', true), item(1134, 482, '기존 업무 12개', true)];
      d.src = [194, 622]; d.dst = [1134, 622];
      d.ghost = K.at(root, '', { x: d.src[0], y: d.src[1], w: 592, h: 96 });
      d.ghost.style.cssText += ';box-sizing:border-box;border-radius:12px;border:3px dashed rgba(47,123,255,.4);opacity:0';
      d.slot = K.at(root, '', { x: d.dst[0], y: d.dst[1], w: 592, h: 96 });
      d.slot.style.cssText += ';box-sizing:border-box;border-radius:12px;border:3px dashed rgba(27,42,74,.22)';
      d.mv = item(d.src[0], d.src[1], 'KAC-BIM 사업관리');
      d.mv.style.zIndex = '3';
      d.arrow = K.path(d.svg, [[848, 670], [1072, 670]], { color: C.blue, width: 5, arrow: true });
      d.cap = txt(root, { x: 120, y: 868, w: 1680 }, '부서는 그대로 있고 업무 하나만 옮긴다', CAP);
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.pl, lt, 0.4, { y: 22 }); K.rise(d.pr, lt, 0.55, { y: 22 });
      d.it.forEach((e, i) => K.rise(e, lt, 0.8 + i * 0.15, { y: 14 }));
      K.rise(d.slot, lt, 1.1, { y: 0 });
      K.draw(d.arrow, lt, 1.3, 0.4);
      K.rise(d.cap, lt, 1.6, { y: 14 });
      const L = K.loop(lt, 2.4, [1.0, 1.4, 2.3, 0.5]);
      const st = L.i, u = L.u;
      const p = st < 1 ? 0 : st === 1 ? ease.inOutCubic(u) : 1;
      const lift = Math.sin(Math.PI * p);
      const back = st === 3 && u > 0.5, a = st === 3 ? Math.abs(1 - 2 * u) : 1, pp = back ? 0 : p;
      const n = d.mv;
      if (lt < 2.4) K.rise(n, lt, 0.95, { y: 14 });
      else {
        n.style.filter = ''; n.style.opacity = a.toFixed(3);
        n.style.transform = `translate(${f1((d.dst[0] - d.src[0]) * pp)}px, ${f1(-90 * (back ? 0 : lift))}px) scale(${(1 + 0.04 * lift).toFixed(4)})`;
      }
      const moved = st >= 1 && !back;
      set(n, 'border', lt > 2.4 ? '4px solid ' + C.blue : '2px solid var(--rule-2)');
      set(n, 'background', moved ? '#EAF2FF' : '#fff');
      n.style.boxShadow = `0 ${f1(10 + 24 * lift)}px ${f1(26 + 30 * lift)}px -16px rgba(47,123,255,${(0.2 + 0.5 * lift).toFixed(2)})`;
      d.ghost.style.opacity = (moved ? clamp(p / 0.3) * a : 0).toFixed(3);
      d.arrow.setAttribute('stroke-width', st === 1 ? 8 : 5);
    },
  });

  // ── 변경안 3행과 검증 판정 ───────────────────────────────
  DECK.slide({
    id: 'c1-verify', title: '변경안 3행 가운데 2행이 타당 판정을 받았다', chapter: CH, harness: 'orgchange',
    notes: '변경안은 영향 받는 기록물철 1건당 1행이다. 영향 분석 에이전트(unit-impact-analyst)가 3행을 냈고 검증 에이전트(change-proposal-verifier)가 타당 2, 수정필요 1로 판정했다.\n1행: F0164 제주 제2공항 사업관리(U0087, 신공항추진단/신공항건설1부 단독 행, 30년). 조치는 부서레벨변경, 건설사업실/신공항건설1부로. 판정 타당, 상태 확정안.\n2행: F0162 제주 제2공항 사업관리(U0086, 부서 표기가 "신공항건설1부, 2부"인 공동 행, 30년). 조치는 이관. 판정 수정필요, 상태 검토필요. 이 철을 옮기는 것은 맞지만 같은 단위업무의 나머지 철 3개(F0160 울릉, F0161 새만금, F0163 흑산)를 "유지"로 둔 것이 틀렸다는 판정이다.\n3행: F0153 KAC-BIM 시스템 유지관리(U0079, 신공항추진단/디지털트윈사업부, 10년). 조치는 부서레벨변경, 스마트공항추진실/데이터융합부로. 판정 타당, 상태 확정안.\n상태는 스크립트(build_change_table.py)가 정한다. 검증 판정이 타당이고 확신도가 높음·보통이면 확정안, 그 밖은 검토필요다. 확정안 2건도 사람이 검토한 뒤 적용한다. 신설 단위업무 제안은 0건이다.\n출처: kac-org-change-impact/output/시나리오-신공항건설1부이동/분류기준표_변경안.csv, 영향도_보고서.md 3.2·5.1절, 06_impact_stats.json, _workspace/시나리오-신공항건설1부이동/05_verify/',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '변경안과 검증', title: '변경안 3행 가운데 2행이 타당 판정을 받았다' });
      d.a1 = actor(root, { id: 'unit-impact-analyst', job: '변경안을 낸다', x: 126, y: 392, w: 210, size: 26 });
      d.a2 = actor(root, { id: 'change-proposal-verifier', job: '근거를 다시 본다', x: 1592, y: 376, w: 196 });
      const R = [
        ['제주 제2공항 사업관리', '1부 단독 단위업무', '건설사업실 신공항건설1부', '타당', 'ok'],
        ['제주 제2공항 사업관리', '1부·2부 공동 단위업무', '건설사업실 신공항건설1부', '수정필요', 'warn'],
        ['KAC-BIM 시스템 유지관리', '디지털트윈사업부 단위업무', '스마트공항추진실 데이터융합부', '타당', 'ok'],
      ];
      d.rows = R.map((r, i) => {
        const el = K.at(root, 'card', { x: 392, y: 318 + i * 136, w: 1150, h: 116 });
        txt(el, { x: 32, y: 18 }, r[0], 'font:800 32px/1.2 var(--sans);letter-spacing:-0.03em;white-space:nowrap');
        txt(el, { x: 32, y: 64 }, r[1], 'font:500 25px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--mute);white-space:nowrap');
        txt(el, { x: 432, y: 34 }, '→', 'font:700 36px/1.2 var(--sans);color:var(--blue)');
        txt(el, { x: 486, y: 38 }, r[2], 'font:800 30px/1.2 var(--sans);letter-spacing:-0.03em;color:#1F5FD6;white-space:nowrap');
        const stp = K.stampEl(el, r[3], r[4], { r: 26, y: 26 }); stp.style.opacity = '0';
        return { el, stp, v: r[4] };
      });
      d.tally = [['타당', 2, 'ok', 540], ['수정필요', 1, 'warn', 1000]].map(([t, n, c, x]) => {
        const g = K.at(root, '', { x, y: 770, w: 400, h: 170 });
        g.style.cssText += ';display:flex;align-items:baseline;justify-content:center;gap:18px;white-space:nowrap';
        const lb = h('span', '', g, t); lb.style.cssText = `font:900 52px/1 var(--display);letter-spacing:-0.03em;color:var(--${c})`;
        const num = h('span', '', g, '0'); num.style.cssText = `font:900 170px/1 var(--display);letter-spacing:-0.04em;color:var(--${c})`;
        const un = h('span', '', g, '행'); un.style.cssText = 'font:800 46px/1 var(--display);color:var(--ink-2)';
        return { g, num, n };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.a1.render(lt, 0.5); d.a2.render(lt, 0.7);
      d.rows.forEach((r, i) => K.rise(r.el, lt, 0.7 + i * 0.15, { x: -30, y: 0 }));
      d.tally.forEach((t, i) => { K.rise(t.g, lt, 1.5 + i * 0.15, { y: 14 }); K.count(t.num, lt, 1.6 + i * 0.15, 0.7, t.n); });
      // 도장은 등장할 때 한 번 찍고 남긴다. 반복: 한 행씩 짚고 그 행의 도장을 다시 누른다
      const DUR = 2.0, L = K.loop(lt, 2.4, [DUR, DUR, DUR, 1.8]);
      const st = L.i, u = L.u;
      if (lt > 2.2) { d.a1.act(lt, st >= 0 && st < 3 && u < 0.42); d.a2.act(lt, st >= 0 && st < 3 && u >= 0.42 && u < 0.9); }
      d.rows.forEach((r, i) => {
        const cur = st === i;
        set(r.el, 'borderColor', cur ? C.blue : '');
        set(r.el, 'boxShadow', cur ? '0 0 0 3px #2F7BFF, 0 18px 40px -22px rgba(47,123,255,.6)' : '');
        if (lt > 2.4) r.el.style.transform = `translate(${f1(cur ? -14 * bump(u / 0.4) * (u < 0.4 ? 1 : 0) : 0)}px, 0px)`;
        K.stamp(r.stp, lt, 1.6 + i * 0.25, { rot: -5 });
        if (cur && u >= 0.55) r.stp.style.transform = `rotate(-5deg) scale(${(1 + 0.22 * bump((u - 0.55) / 0.2) * (u < 0.75 ? 1 : 0)).toFixed(4)})`;
      });
    },
  });

  // ── 검증이 찾은 빠진 단위업무 8개 ────────────────────────
  DECK.slide({
    id: 'c1-miss', title: '검증 에이전트가 빠진 단위업무 8개를 찾았다', chapter: CH, harness: 'orgchange',
    notes: '영향 분석 에이전트가 "유지"(영향 없음)로 둔 단위업무 가운데 8개를 검증 에이전트(change-proposal-verifier)가 수정필요로 지적했다.\nE01의 1개는 U0086이다. 변경안은 철 F0162만 옮기고 나머지 철 3개(F0160 울릉공항 건설사업 관리, F0161 새만금신공항 건설사업 관리, F0163 흑산공항 사업관리)를 유지로 뒀다. 1부가 떠나면 "신공항건설1부, 2부" 표기가 실제 조직과 맞지 않으므로 신공항추진단/신공항건설2부로 이관해야 한다는 지적이다.\nE02의 7개는 디지털트윈사업부 아래의 BIM 단위업무 U0078, U0080, U0081, U0082, U0083, U0084, U0085다(기록물철 F0152, F0154~F0159). 세칙 47차에서 BIM 업무분장 문구가 신공항건설1부 5호 하나뿐이고 시나리오가 5호를 범위 제한 없이 옮기므로, 데이터융합부로 부서레벨변경(확신도 보통)이 필요하다는 지적이다. 두 사건 어느 쪽에서도 처리되지 않으면 변경적용본에 세칙 근거가 없는 디지털트윈사업부 행이 남는다.\n검증 지적은 확정안이 아니어서 변경적용본에 반영하지 않았다. 사람이 정한다.\n출처: kac-org-change-impact/output/시나리오-신공항건설1부이동/06_impact_stats.json(검증_누락지적), 영향도_보고서.md 5.2·5.3절, _workspace/시나리오-신공항건설1부이동/05_verify/E01.json·E02.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '검증이 찾은 누락', title: '검증 에이전트가 빠진 단위업무 8개를 찾았다' });
      d.ag = actor(root, { id: 'change-proposal-verifier', job: '‘유지’로 둔 것을 다시 본다', x: 150, y: 372, w: 240 });
      d.num = txt(root, { x: 520, y: 300, w: 140 }, '0', 'text-align:right;font:900 190px/1 var(--display);letter-spacing:-0.04em;color:var(--warn)');
      d.numC = txt(root, { x: 680, y: 356 }, '<div style="font:900 46px/1.2 var(--display);letter-spacing:-0.03em">개가 영향을 받는다</div><div style="font:700 32px/1.3 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);margin-top:10px"><span style="color:var(--mute)">유지</span> → <span style="color:#965A00">수정필요</span></div>', 'white-space:nowrap');
      const TX = i => (i === 0 ? 525 : 790 + (i - 1) * 146), TY = 556, TW = 130, TH = 150;
      d.tiles = Array.from({ length: 8 }, (_, i) => {
        const el = K.at(root, '', { x: TX(i), y: TY, w: TW, h: TH });
        el.style.cssText += ';box-sizing:border-box;border-radius:12px;background:#fff;border:2.5px solid var(--rule-2)';
        [26, 46, 66].forEach((y, j) => { const b = K.at(el, '', { x: 18, y, w: j === 2 ? 56 : 90, h: 8 }); b.style.cssText += ';border-radius:4px;background:rgba(27,42,74,.16)'; });
        const tag = K.at(el, '', { x: 7, y: 94, w: TW - 19, h: 42 }, '유지');
        tag.style.cssText += ';border-radius:8px;display:flex;align-items:center;justify-content:center;font:800 24px/1 var(--sans);letter-spacing:-0.03em';
        return { el, tag };
      });
      d.frame = K.at(root, '', { x: 0, y: TY - 10, w: TW + 20, h: TH + 20 });
      d.frame.style.cssText += ';box-sizing:border-box;border:5px solid var(--bad);border-radius:18px;opacity:0;pointer-events:none';
      d.TX = TX;
      d.svg = K.svg(root);
      d.br = K.path(d.svg, [[790, 722], [790, 738], [1796, 738], [1796, 722]], { color: C.ink2, width: 3, radius: 10 });
      d.g1 = txt(root, { x: 440, y: 754, w: 300 }, '<div style="font:800 32px/1.2 var(--sans);letter-spacing:-0.02em">E01 · 1개</div><div style="font:500 25px/1.3 var(--sans);color:var(--ink-2);margin-top:6px">1부·2부 공동 단위업무</div>', 'text-align:center;white-space:nowrap');
      d.g2 = txt(root, { x: 790, y: 754, w: 1006 }, '<div style="font:800 32px/1.2 var(--sans);letter-spacing:-0.02em">E02 · 7개</div><div style="font:500 25px/1.3 var(--sans);color:var(--ink-2);margin-top:6px">디지털트윈사업부의 BIM 단위업무 <span style="color:var(--mute)">예: 공항 BIM 전환·운영관리(<span class="mono">U0078</span>)</span></div>', 'text-align:center;white-space:nowrap');
      d.cap = txt(root, { x: 120, y: 896, w: 1680 }, '조직이 바뀌면 이 단위업무의 부서 표기도 틀리게 된다', 'text-align:center;font:800 38px/1.25 var(--display);letter-spacing:-0.025em;color:var(--ink)');
    },
    render(lt, d) {
      d.T.render(lt);
      d.ag.render(lt, 0.5);
      K.rise(d.num, lt, 0.7, { y: 16 }); K.rise(d.numC, lt, 0.8, { x: -20, y: 0 });
      d.tiles.forEach((t, i) => K.pop(t.el, lt, 0.9 + i * 0.07));
      K.draw(d.br, lt, 1.5, 0.4); K.rise(d.g1, lt, 1.6, { y: 10 }); K.rise(d.g2, lt, 1.7, { y: 10 });
      K.rise(d.cap, lt, 1.9, { y: 12 });
      // 등장: 여덟 칸이 차례로 ‘수정필요’로 바뀌고 숫자가 8까지 오른다(한 번만). 그 뒤 숫자와 칸은 그대로 둔다
      const E0 = 1.3, ES = 0.13;
      // 반복: 검증이 한 칸씩 다시 본다. 보는 칸만 잠깐 ‘유지’였다가 ‘수정필요’로 바뀐다
      const STEP = 0.9, L = K.loop(lt, 3.0, [...Array(8).fill(STEP), 1.6]);
      let n = 0;
      d.tiles.forEach((t, i) => {
        const first = lt >= E0 + i * ES;
        if (first) n++;
        const cur = L.i === i, back = cur && L.u < 0.4;
        const on = first && !back;
        const label = on ? '수정필요' : '유지';
        if (t.tag.textContent !== label) t.tag.textContent = label;
        set(t.tag, 'background', on ? C.warn : 'rgba(27,42,74,.08)');
        set(t.tag, 'color', on ? '#fff' : '#3A4A6B');
        set(t.el, 'borderColor', on ? C.warn : 'rgba(27,42,74,.30)');
        const s1 = lt - (E0 + i * ES), s2 = cur ? (L.u - 0.4) * STEP : -1;
        if (lt > E0) t.el.style.transform = `scale(${(1 + (s1 >= 0 && s1 < 0.3 ? 0.1 * bump(s1 / 0.3) : 0) + (s2 >= 0 && s2 < 0.3 ? 0.1 * bump(s2 / 0.3) : 0)).toFixed(4)})`;
      });
      d.num.textContent = String(n);
      const at = L.i >= 0 && L.i < 8 ? L.i : -1;
      if (at >= 0) { d.frame.style.left = (d.TX(at) - 10) + 'px'; d.frame.style.opacity = Math.min(1, L.u / 0.12, (1 - L.u) / 0.12).toFixed(3); }
      else d.frame.style.opacity = '0';
      if (lt > 2.0) d.ag.act(lt, at >= 0);
    },
  });

  // ── 사람이 정할 네 가지 ──────────────────────────────────
  DECK.slide({
    id: 'c1-decide', title: '사람이 정할 것이 네 가지 남았다', chapter: CH, harness: 'orgchange',
    notes: '네 가지는 사건 정리 단계에서 변경 해석 에이전트(org-change-interpreter)가 "확인필요"로 올린 질문이고(02_changes.json), 분석과 검증을 거친 뒤에도 답이 없어 보고서 5.4절에 그대로 남았다. 시나리오에 답이 없어서 하네스는 이 네 가지를 정하지 않는다.\n1. 이관 범위: KAC-BIM 사업관리를 데이터융합부로 옮길 때 BIM 단위업무 8개(U0078~U0085)를 전부 옮기는가, KAC-BIM 시스템 운영 같은 일부만 옮기는가. 현재 변경안은 U0079(F0153)만 옮겼다.\n2. 디지털트윈사업부: 신공항추진단에 남고 업무만 넘기는가, 데이터융합부에 흡수되는가, 신공항건설1부와 함께 건설사업실로 가는가. 세칙 47차 업무분장에 없는 부서다. 세칙 47차 정원표 주석의 디지털트윈 관련 정원 6명과 부칙 제2조의 BIM 업무 위탁사업 한시정원 3명이 함께 옮겨 가는지도 판단에 영향을 준다.\n3. 신공항건설2부: 신공항추진단에 남는가. 남으면 U0086 나머지 철(F0160, F0161, F0163)의 부서 표기를 "신공항건설2부"로 고치고, 2부도 건설사업실로 가면 "건설사업실"로 고친다.\n4. 부 이름: 건설사업실로 옮긴 뒤에도 "신공항건설1부"를 쓰는가. 2부가 신공항추진단에 남으면 서로 다른 실·단에 1부와 2부가 따로 있게 된다.\n적용 순서(보고서 8절): 확정안 2건(F0164, F0153) 검토 → 검토필요 F0162와 누락 지적, 이 네 질문을 사람이 결정 → 분류기준표에 반영 → kac-shared 색인 재생성.\n출처: kac-org-change-impact/output/시나리오-신공항건설1부이동/영향도_보고서.md 5.4절·8절, _workspace/시나리오-신공항건설1부이동/02_changes.json 확인필요',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '사람이 정할 것', title: '사람이 정할 것이 네 가지 남았다' });
      d.hu = actor(root, { kind: 'human', name: '사람', job: '답을 정한다', x: 150, y: 400, w: 180 });
      d.stamp = K.stampEl(root, '확인필요', 'warn', { x: 148, y: 838 });
      const Q = [
        ['BIM 단위업무 8개를 모두 옮기는가', ['8개 모두 옮긴다', '일부만 옮긴다']],
        ['디지털트윈사업부를 어디에 두는가', ['신공항추진단에 둔다', '데이터융합부에 합친다', '건설사업실로 옮긴다']],
        ['신공항건설2부는 신공항추진단에 남는가', ['남는다', '건설사업실로 옮긴다']],
        ['‘신공항건설1부’ 이름을 그대로 쓰는가', ['그대로 쓴다', '바꾼다']],
      ];
      d.rows = Q.map((q, i) => {
        const el = K.at(root, '', { x: 430, y: 304 + i * 166, w: 1370, h: 150 });
        el.style.cssText += ';box-sizing:border-box;border-radius:16px;border:2px solid transparent';
        const no = K.at(el, '', { x: 22, y: 20, w: 52, h: 52 }, String(i + 1));
        no.style.cssText += ';border-radius:50%;box-sizing:border-box;border:3px solid var(--ink);display:flex;align-items:center;justify-content:center;font:800 28px/1 var(--sans)';
        txt(el, { x: 96, y: 22 }, q[0], 'font:800 36px/1.3 var(--sans);letter-spacing:-0.03em;white-space:nowrap');
        const bar = K.at(el, '', { x: 96, y: 80, h: 56 }); bar.style.cssText += ';display:flex;gap:16px;white-space:nowrap';
        const opts = q[1].map(o => {
          const e = h('div', '', bar);
          e.style.cssText = 'height:56px;display:flex;align-items:center;gap:12px;padding:0 22px 0 16px;border:2.5px solid var(--rule-2);border-radius:999px;font:700 28px/1 var(--sans);letter-spacing:-0.02em;color:var(--ink);background:var(--paper-3);box-sizing:border-box';
          e.innerHTML = '<i style="width:22px;height:22px;border-radius:50%;border:3px solid var(--ink-2);box-sizing:border-box;display:inline-block;flex:none"></i>' + o;
          return e;
        });
        return { el, no, opts };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.hu.render(lt, 0.5);
      d.rows.forEach((r, i) => K.rise(r.el, lt, 0.6 + i * 0.14, { x: 30, y: 0 }));
      K.stamp(d.stamp, lt, 1.6, { rot: -6 });
      // 반복: 질문을 하나씩 짚고 선택지를 차례로 본다(아직 고르지 않았다)
      const PER = 2.7, L = K.loop(lt, 2.4, [PER, PER, PER, PER]);
      if (lt > 2.2) d.hu.act(lt, L.i >= 0);
      d.rows.forEach((r, i) => {
        const on = L.i === i;
        set(r.el, 'background', on ? '#fff' : 'transparent');
        set(r.el, 'borderColor', on ? C.ink : 'transparent');
        set(r.el, 'boxShadow', on ? '0 18px 40px -24px rgba(27,42,74,.45)' : 'none');
        set(r.no, 'background', on ? C.ink : 'transparent'); set(r.no, 'color', on ? '#fff' : C.ink);
        const j = on ? Math.min(r.opts.length - 1, Math.floor(L.u * r.opts.length)) : -1;
        r.opts.forEach((o, oi) => {
          set(o, 'borderColor', oi === j ? C.warn : 'rgba(27,42,74,.30)');
          set(o, 'background', oi === j ? '#FCE9C4' : '#FFFAF2');
        });
      });
    },
  });

  // ── 결과 숫자 ────────────────────────────────────────────
  DECK.slide({
    id: 'c1-result', title: '한 문장에서 변경안 3행과 질문 네 가지가 나왔다', chapter: CH, harness: 'orgchange',
    notes: '조직 변경 영향 하네스의 결과다. 시나리오 한 문장에서 사건 2개(E01 상위조직변경, E02 업무이관)를 정했고, 변경안은 기록물철 기준 3행(F0164, F0162, F0153)이 나왔다. 검증 판정은 타당 2, 수정필요 1이고 상태는 확정안 2, 검토필요 1이다. 검증 에이전트는 "유지"로 둔 단위업무 8개(E01 1개, E02 7개)가 빠졌다고 지적했다. 사람이 정할 확인필요 질문은 4개다. 신설 단위업무 제안은 0건이다.\n결과물은 다섯 개다. 영향도_보고서.md, 분류기준표_변경안.csv, 분류기준표_변경적용본.csv(확정안 2건만 반영), 신설_단위업무_제안.csv(0건), 06_impact_stats.json. 확정안 2건도 사람이 검토한 뒤 분류기준표에 적용한다.\n에이전트: org-change-interpreter, unit-impact-analyst, change-proposal-verifier, impact-report-writer. 스크립트: prepare.py, impact_lookup.py, build_change_table.py, validate.py.\n출처: kac-org-change-impact/output/시나리오-신공항건설1부이동/06_impact_stats.json(사건수 2, 변경안_기록물철_행수 3, 검증_누락지적 1+7), 영향도_보고서.md 5.4절(확인필요 질문 4개), _workspace/시나리오-신공항건설1부이동/02_changes.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: P + '결과', title: '한 문장에서 변경안 3행과 질문 네 가지가 나왔다' });
      const N = [[2, '개', '사건', '상위조직변경, 업무이관', C.ink], [3, '행', '변경안', '타당 2 · 수정필요 1', C.blue], [8, '개', '검증이 찾은 누락', '‘유지’로 뒀던 단위업무', C.warn], [4, '가지', '사람이 정할 것', '시나리오에 답이 없는 질문', C.ink]];
      d.svg = K.svg(root);
      d.arr = [0, 1, 2].map(i => K.path(d.svg, [[CX[i] + 150, 500], [CX[i + 1] - 170, 500]], { color: 'rgba(27,42,74,.45)', width: 4, arrow: true }));
      d.cols = N.map((n, i) => {
        const g = K.at(root, '', { x: CX[i] - 200, y: 350, w: 400, h: 470 });
        g.style.transformOrigin = '50% 40%';
        const line = h('div', '', g); line.style.cssText = 'display:flex;align-items:baseline;justify-content:center;gap:8px;white-space:nowrap';
        const num = h('span', '', line, '0'); num.style.cssText = `font:900 250px/1 var(--display);letter-spacing:-0.04em;color:${n[4]}`;
        const un = h('span', '', line, n[1]); un.style.cssText = 'font:800 50px/1 var(--display);color:var(--ink-2)';
        const bar = h('div', '', g); bar.style.cssText = `height:8px;width:230px;margin:14px auto 0;border-radius:4px;background:${n[4]};transform-origin:50% 50%`;
        const lab = h('div', '', g, n[2]); lab.style.cssText = 'margin-top:26px;text-align:center;font:900 42px/1.2 var(--display);letter-spacing:-0.03em;white-space:nowrap';
        const sub = h('div', '', g, n[3]); sub.style.cssText = 'margin-top:12px;text-align:center;font:600 27px/1.3 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);white-space:nowrap';
        return { g, num, bar, v: n[0] };
      });
      d.cap = txt(root, { x: 120, y: 880, w: 1680 }, '타당 판정을 받은 2행도 사람이 검토한 뒤 적용한다', 'text-align:center;font:700 34px/1.3 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)');
    },
    render(lt, d) {
      d.T.render(lt);
      d.cols.forEach((c, i) => { K.rise(c.g, lt, 0.5 + i * 0.2, { y: 26 }); K.count(c.num, lt, 0.6 + i * 0.2, 0.8, c.v); });
      d.arr.forEach((p, i) => K.draw(p, lt, 0.9 + i * 0.2, 0.3));
      K.rise(d.cap, lt, 1.8, { y: 12 });
      // 반복: 사건 → 변경안 → 누락 → 사람 순서로 하나씩 짚는다
      const L = K.loop(lt, 2.4, [1.5, 1.5, 1.5, 1.5]);
      d.cols.forEach((c, i) => {
        const on = L.i === i;
        if (lt > 2.4) c.g.style.transform = `scale(${(1 + (on ? 0.06 * Math.min(1, L.u / 0.15, (1 - L.u) / 0.15) : 0)).toFixed(4)})`;
        c.bar.style.transform = `scaleX(${(lt < 2.4 ? prog(lt, 0.9 + i * 0.2, 0.5, ease.outCubic) * 0.45 : on ? lerp(0.45, 1, Math.min(1, L.u / 0.15, (1 - L.u) / 0.15)) : 0.45).toFixed(4)})`;
      });
      d.arr.forEach((p, i) => p.setAttribute('stroke-width', L.i === i + 1 && L.u < 0.4 ? 7 : 4));
    },
  });
})();

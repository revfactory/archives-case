/* 챕터 오프닝 5편(각 10초). 같은 형식: 0~3초 클립(바탕 검정, 합성 때 클립이 비친다) + 챕터 표시 →
   3초에 군청 면 → 사례의 실제 재료가 움직임 → 6초부터 제목 고정(왼쪽 아래). 편마다 재료와 움직임은 다르다. */
const { ease, prog, win, kf, spring, clamp, lerp, rand, noise, split, css, h, s, cue, inout } = REEL;
REEL.config({ duration: 50, fps: 30, width: 1920, height: 1080, audio: null });

const F = 0.5 / 30;
const COL = { paper: '#F2EFE7', ink: '#0F172A', blue: '#2443F0', ok: '#0E9F6E', warn: '#D97706', bad: '#E5484D' };
const W = 'rgba(255,255,255,';
function txt(el, cls, html, st) { const e = h('div', 'a ' + (cls || ''), el, html); if (st) e.style.cssText += ';' + st; return e; }
function stampAt(e, lt, t0, rot = -7) {
  if (lt < t0) { e.style.opacity = 0; return; }
  const k = kf(lt, [[t0, 1.6], [t0 + 0.14, 0.95, ease.inQuad], [t0 + 0.26, 1, ease.outQuad]]);
  e.style.opacity = clamp((lt - t0) / 0.06); e.style.transform = `rotate(${rot}deg) scale(${k.toFixed(4)})`;
}
function drawPath(p, lt, t0, dur) {
  const L = p.getTotalLength(), q = prog(lt, t0, dur, ease.inOutCubic);
  p.style.strokeDasharray = `${L} ${L}`; p.style.strokeDashoffset = ((1 - q) * L).toFixed(1); return q;
}

// 공통 틀: 클립 구간 표시, 군청 면, 제목 고정
function chapter(k, o) {
  const id = 'c' + (k + 1);
  REEL.scene({
    id, start: cue('scene.' + id) - F, end: cue('scene.' + id + '.end') - F,
    setup(el) {
      el.style.background = '#000';
      this.clipLab = txt(el, '', o.title, 'left:120px;top:770px;font-size:40px;font-weight:700;color:rgba(255,255,255,.85)');
      this.clipNum = txt(el, '', o.big, 'left:112px;top:820px;font-size:150px;font-weight:900;color:#fff;letter-spacing:-0.05em;line-height:1');
      this.blue = h('div', 'full', el); this.blue.style.background = COL.blue;
      this.mat = h('div', 'full', el);
      this.k1 = txt(el, '', o.label, `left:120px;top:742px;font-size:34px;font-weight:700;color:${W}.78)`);
      this.t1 = txt(el, '', o.title, 'left:114px;top:790px;font-size:124px;font-weight:900;color:#fff;letter-spacing:-0.05em;line-height:1.02;white-space:nowrap');
      this.tc = split(this.t1, 'char', { mask: true });
      this.hn = txt(el, 'mono', o.harness, `left:120px;top:946px;font-size:28px;font-weight:500;color:${W}.8)`);
      o.setup.call(this, this.mat);
    },
    render(lt) {
      // 클립 구간
      const ci = prog(lt, 0.3, 0.6, ease.snap);
      const co = prog(lt, 2.55, 0.35, ease.exit);
      [this.clipLab, this.clipNum].forEach((e, i) => {
        e.style.opacity = Math.min(prog(lt, 0.3 + i * 0.12, 0.5), 1 - co).toFixed(3);
        e.style.transform = `translateY(${((1 - prog(lt, 0.3 + i * 0.12, 0.6, ease.snap)) * 40 - co * 30).toFixed(1)}px)`;
      });
      // 군청 면: 2.7초부터 왼쪽에서 덮는다
      const bp = prog(lt, 2.7, 0.5, ease.swift);
      this.blue.style.clipPath = `inset(0 ${((1 - bp) * 100).toFixed(2)}% 0 0)`;
      // 제목 고정(6초)
      inout(this.k1, lt, 5.9, null, { rise: 20, blur: 6 });
      this.tc.forEach((c, i) => { const p = prog(lt, 6.0 + i * 0.045, 0.6, ease.snap); c.style.transform = `translateY(${((1 - p) * 112).toFixed(1)}%)`; });
      inout(this.hn, lt, 6.5, null, { rise: 16, blur: 6 });
      this.mat.style.opacity = lt < 3.0 ? '0' : '1';
      // 제목이 고정된 뒤에도 재료 층이 천천히 다가온다
      const push = prog(lt, 5.0, 5.0, ease.linear);
      this.mat.style.transformOrigin = '960px 380px';
      this.mat.style.transform = `scale(${(1 + 0.06 * push).toFixed(4)})`;
      o.render.call(this, lt);
    },
  });
}

// ── 1. 하네스 구조: 노드 18개가 다섯 묶음으로 모인다 ────────────────────
const GROUPS = [['kac-org-change-impact', 4], ['kac-record-assign', 3], ['kac-classification-audit', 3], ['kac-org-strategy', 5], ['kac-unit-task-naming', 3]];
chapter(0, {
  label: '공통 구조', big: '5종 · 18개', title: '하네스 구조', harness: '하네스 5종 · 에이전트 18개 · 공통 데이터 kac-shared',
  setup(el) {
    this.n = [];
    let idx = 0;
    GROUPS.forEach((g, gi) => {
      const gx = 150 + gi * 340;
      for (let j = 0; j < g[1]; j++) {
        const e = h('div', 'a', el); e.style.cssText = `width:140px;height:54px;border-radius:10px;border:3px solid #fff;box-sizing:border-box;background:${W}.12)`;
        const col = j % 2, row = Math.floor(j / 2);
        this.n.push({ e, tx: gx + col * 154, ty: 190 + row * 70, sx: 160 + rand(idx, 3) * 1560, sy: 120 + rand(idx, 4) * 520, gi });
        idx++;
      }
      const lab = txt(el, 'mono', g[0], `left:${gx - 6}px;top:440px;font-size:21px;color:#fff;width:330px;white-space:nowrap`);
      this.n.push({ lab, gi });
    });
    this.svg = s('svg', { width: 1920, height: 1080 }, el); css(this.svg, { position: 'absolute', left: 0, top: 0 });
    this.base = txt(el, 'mono', 'kac-shared · 분류기준표 703 단위업무 · 생산현황 1,076,767건', `left:150px;top:560px;width:1636px;height:64px;border-radius:12px;background:#fff;color:${COL.blue};font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center`);
    this.links = GROUPS.map((g, gi) => s('path', { d: `M ${150 + gi * 340 + 147} 482 V 560`, stroke: '#fff', 'stroke-width': 3, fill: 'none' }, this.svg));
  },
  render(lt) {
    this.n.forEach((n, i) => {
      if (n.lab) { n.lab.style.opacity = prog(lt, 4.6 + n.gi * 0.08, 0.4).toFixed(3); return; }
      const a = prog(lt, 3.05 + i * 0.03, 0.3, ease.pop);
      const p = spring(lt, 3.8 + n.gi * 0.08, 1.9, 0.6);
      const x = lerp(n.sx, n.tx, p), y = lerp(n.sy, n.ty, p);
      n.e.style.opacity = a.toFixed(3);
      n.e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${lerp(0.6, 1, a).toFixed(3)})`;
      n.e.style.background = lt > 6.6 ? '#fff' : lt > 5.2 && K_on(lt, n.gi) ? '#fff' : W + '.12)';
    });
    inout(this.base, lt, 5.0, null, { rise: 30, blur: 8 });
    this.links.forEach((l, i) => drawPath(l, lt, 5.2 + i * 0.06, 0.35));
  },
});
function K_on(lt, gi) { return Math.floor((lt - 5.2) / 0.8) % 5 === gi; }

// ── 2. 사례 1: 부서 가지가 다른 상위 조직 아래로 옮겨 붙는다 ─────────────
chapter(1, {
  label: '사례 1', big: '사례 1', title: '조직변경 영향도', harness: 'kac-org-change-impact · 에이전트 4개',
  setup(el) {
    this.svg = s('svg', { width: 1920, height: 1080 }, el); css(this.svg, { position: 'absolute', left: 0, top: 0 });
    const P = [[520, 170, '신공항추진단'], [1380, 170, '건설사업실']];
    this.P = P.map(p => { const c = s('circle', { cx: p[0], cy: p[1], r: 16, fill: '#fff' }, this.svg); const t = txt(el, '', p[2], `left:${p[0] + 30}px;top:${p[1] - 22}px;font-size:32px;font-weight:800;color:#fff`); return { c, t, x: p[0], y: p[1] }; });
    this.kidsA = [[300, '신공항계획부'], [520, '신공항건설1부'], [740, '디지털트윈사업부']];
    this.kidsB = [[1310, '건설안전부'], [1570, '공항계획부']];
    this.la = this.kidsA.map((k, i) => s('path', { d: `M 520 186 V 270 H ${k[0]} V 344`, stroke: '#fff', 'stroke-width': 3, fill: 'none' }, this.svg));
    this.lb = this.kidsB.map(k => s('path', { d: `M 1380 186 V 270 H ${k[0]} V 344`, stroke: '#fff', 'stroke-width': 3, fill: 'none' }, this.svg));
    this.ka = this.kidsA.map(k => { const c = s('circle', { cx: k[0], cy: 356, r: 11, fill: COL.blue, stroke: '#fff', 'stroke-width': 3 }, this.svg); const t = txt(el, '', k[1], `left:${k[0] - 120}px;top:384px;width:240px;text-align:center;font-size:24px;font-weight:700;color:#fff`); return { c, t }; });
    this.kb = this.kidsB.map(k => { const c = s('circle', { cx: k[0], cy: 356, r: 11, fill: COL.blue, stroke: '#fff', 'stroke-width': 3 }, this.svg); const t = txt(el, '', k[1], `left:${k[0] - 120}px;top:384px;width:240px;text-align:center;font-size:24px;font-weight:700;color:#fff`); return { c, t }; });
    this.nl = s('path', { d: 'M 1380 186 V 270 H 1080 V 344', stroke: '#fff', 'stroke-width': 5, fill: 'none' }, this.svg);
    this.nd = s('circle', { r: 7, fill: '#fff', opacity: 0 }, this.svg);
    this.rows = ['U0087 신공항 건설사업관리', 'U0086 신공항 건설사업관리'].map((r, i) => txt(el, 'mono', r, `width:360px;height:44px;line-height:44px;padding:0 14px;box-sizing:border-box;border-radius:8px;font-size:20px;color:#fff;border:2px solid ${W}.6)`));
    this.tag = txt(el, '', 'E01 상위조직변경', `font-size:24px;font-weight:800;color:${COL.blue};background:#fff;border-radius:8px;padding:6px 14px`);
  },
  render(lt) {
    this.P.forEach((p, i) => { const a = prog(lt, 3.05 + i * 0.1, 0.35, ease.pop); p.c.setAttribute('r', (16 * a).toFixed(1)); p.t.style.opacity = a; });
    this.la.forEach((l, i) => { const q = drawPath(l, lt, 3.2 + i * 0.08, 0.4); if (i === 1) l.style.opacity = (1 - prog(lt, 4.0, 0.3)).toFixed(3); });
    this.lb.forEach((l, i) => drawPath(l, lt, 3.3 + i * 0.08, 0.4));
    this.ka.forEach((k, i) => k.t.style.opacity = prog(lt, 3.5 + i * 0.06, 0.3).toFixed(3));
    this.kb.forEach((k, i) => k.t.style.opacity = prog(lt, 3.6 + i * 0.06, 0.3).toFixed(3));
    const mv = prog(lt, 4.0, 1.2, ease.swift);
    const x = lerp(520, 1080, mv), y = 356 - Math.sin(mv * Math.PI) * 90;
    const k1 = this.ka[1];
    k1.c.setAttribute('cx', x.toFixed(1)); k1.c.setAttribute('cy', y.toFixed(1));
    k1.c.setAttribute('fill', lt > 4.0 && mv < 1 ? COL.warn : mv >= 1 ? '#fff' : COL.blue);
    k1.t.style.left = (x - 120).toFixed(1) + 'px'; k1.t.style.top = (y + 28).toFixed(1) + 'px';
    drawPath(this.nl, lt, 5.2, 0.4);
    if (lt > 5.7) { const L = this.nl.getTotalLength(), u = ((lt - 5.7) % 1.4) / 1.4, pt = this.nl.getPointAtLength(u * L);
      this.nd.setAttribute('cx', pt.x.toFixed(1)); this.nd.setAttribute('cy', pt.y.toFixed(1)); this.nd.setAttribute('opacity', Math.sin(u * Math.PI).toFixed(3)); }
    else this.nd.setAttribute('opacity', 0);
    this.rows.forEach((r, i) => {
      r.style.left = (x - 180).toFixed(1) + 'px'; r.style.top = (y + 80 + i * 54).toFixed(1) + 'px';
      r.style.opacity = prog(lt, 3.7 + i * 0.1, 0.3).toFixed(3);
      r.style.borderColor = lt > 4.0 ? (lt > 5.5 ? '#fff' : COL.warn) : W + '.6)';
      r.style.background = lt > 5.5 ? W + '.14)' : 'transparent';
    });
    this.tag.style.left = '900px'; this.tag.style.top = '566px';
    inout(this.tag, lt, 4.1, null, { rise: 16 });
  },
});

// ── 3. 사례 2: 문서 제목 카드가 점검선을 지나며 판정 도장을 받는다 ─────────
chapter(2, {
  label: '사례 2', big: '사례 2', title: '생산현황 분류 정정', harness: 'kac-record-assign · kac-classification-audit · 에이전트 6개',
  setup(el) {
    // 실제 결과 행: 점검결과.csv(test01)와 배정결과.csv(t1)
    const R = [
      ['비밀취급 인가 알림', '정정 권고', 'bad'],
      ['감사결과 처분요구사항 통보(2026년도 공직기강 특별감사 및 직무감찰)', '정정 권고', 'bad'],
      ['자회사 특정감사 결과통보에 따른 후속조치 관련 자료 요청', '확정', 'ok'],
      ['2026년 3월(누계) 본지사 월차결산 보고', '유지', 'ok'],
      ['감사결과 처분요구사항 통보', '사람 확인', 'warn'],
      ['안티패스 처리절차 개정 알림', '확정(중재)', 'ok'],
      ['제주국제공항 시설물 지원 협조 요청', '미배정', 'warn'],
    ];
    this.cards = R.map((r, i) => {
      const e = txt(el, '', r[0], `width:600px;height:76px;display:flex;align-items:center;padding:0 22px;box-sizing:border-box;border-radius:12px;background:#FBFAF6;color:${COL.ink};font-size:24px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`);
      const st = txt(el, 'stamp', r[1], `font-size:24px;color:${COL[r[2]]};background:#FBFAF6`);
      return { e, st, i };
    });
    this.line = txt(el, '', '', `left:958px;top:110px;width:4px;height:560px;background:#fff`);
    this.ll = txt(el, '', '점검', `left:978px;top:110px;font-size:26px;font-weight:800;color:#fff`);
    // 끝: 두 하네스의 집계(배정결과 요약.md, 점검 요약.md)
    const rows = [
      ['배정 · 제목 40개', [[33, '확정'], [7, '확정(중재)']]],
      ['점검 · 묶음 100개', [[68, '정정 권고'], [29, '유지'], [3, '사람 확인']]],
    ];
    this.sum = rows.map((r, ri) => {
      const y = 112 + ri * 262;
      const lab = txt(el, '', r[0], `left:120px;top:${y}px;font-size:28px;font-weight:700;color:${W}.78)`);
      const items = r[1].map((it, j) => {
        const n = txt(el, 'num', '0', `left:${120 + j * 420}px;top:${y + 40}px;font-size:120px;font-weight:900;color:#fff;letter-spacing:-0.04em;line-height:1`);
        const l = txt(el, '', it[1], `left:${124 + j * 420}px;top:${y + 170}px;font-size:30px;font-weight:700;color:#fff`);
        return { n, l, v: it[0] };
      });
      return { lab, items };
    });
  },
  render(lt) {
    const out = 1 - prog(lt, 5.95, 0.4, ease.exit);
    this.line.style.opacity = (prog(lt, 3.1, 0.3) * out).toFixed(3);
    this.line.style.transform = `scaleY(${prog(lt, 3.1, 0.5, ease.snap).toFixed(3)})`; this.line.style.transformOrigin = '50% 0';
    this.ll.style.opacity = (prog(lt, 3.3, 0.3) * out).toFixed(3);
    // 카드는 세 줄로 오른쪽에서 왼쪽으로 흐른다. 점검선(x=960)을 지날 때 판정 도장
    const v = 900;   // px/s
    this.cards.forEach(c => {
      const lane = c.i % 3, start = 3.0 + c.i * 0.3;
      const x = 1980 - (lt - start) * v;
      const y = 150 + lane * 170;
      c.e.style.left = x.toFixed(1) + 'px'; c.e.style.top = y + 'px';
      c.e.style.opacity = lt < start ? 0 : out.toFixed(3);
      const hit = start + (1980 - 960) / v;      // 카드 왼쪽 끝이 선에 닿는 시각
      c.st.style.left = (x + 380).toFixed(1) + 'px'; c.st.style.top = (y - 22) + 'px';
      stampAt(c.st, lt, hit, -6 + (c.i % 3) * 3);
      if (lt < start) c.st.style.opacity = 0; else if (lt >= hit) c.st.style.opacity = (Math.min(1, (lt - hit) / 0.06) * out).toFixed(3);
    });
    this.sum.forEach((r, ri) => {
      inout(r.lab, lt, 6.45 + ri * 0.25, null, { rise: 16, blur: 6 });
      r.items.forEach((it, j) => {
        const t0 = 6.55 + ri * 0.25 + j * 0.1;
        inout(it.n, lt, t0, null, { rise: 30, blur: 8 });
        inout(it.l, lt, t0 + 0.1, null, { rise: 14 });
        it.n.textContent = Math.round(it.v * prog(lt, t0, 0.8, ease.outCubic || ease.swift)).toString();
      });
    });
  },
});

// ── 4. 사례 3: 대안 세 경로가 갈라졌다가 반박을 거쳐 하나로 모인다 ─────────
chapter(3, {
  label: '사례 3', big: '사례 3', title: '전략적 조직 설계', harness: 'kac-org-strategy · 에이전트 5개',
  setup(el) {
    this.svg = s('svg', { width: 1920, height: 1080 }, el); css(this.svg, { position: 'absolute', left: 0, top: 0 });
    const opts = [['OPT-A 기능통합', 160, '단위업무 11'], ['OPT-B 전략사업', 380, '단위업무 17'], ['OPT-C 현장운영', 600, '단위업무 29']];
    this.paths = opts.map((o, i) => s('path', { d: `M 200 380 C 420 380, 420 ${o[1]}, 640 ${o[1]} L 1060 ${o[1]} C 1300 ${o[1]}, 1300 380, 1520 380`, stroke: '#fff', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, this.svg));
    this.lab = opts.map(o => txt(el, '', `${o[0]} <span style="opacity:.75;font-weight:600;margin-left:10px">${o[2]}</span>`, `left:660px;top:${o[1] - 52}px;font-size:28px;font-weight:800;color:#fff`));
    this.chk = txt(el, '', '', 'left:1130px;top:120px;width:0;height:540px;border-left:4px dashed rgba(255,255,255,.85)');
    this.chl = txt(el, '', '반박 · 보완', 'left:1074px;top:64px;font-size:26px;font-weight:800;color:#fff');
    this.st = opts.map(o => txt(el, 'stamp', '보완 필요', `left:1074px;top:${o[1] - 24}px;font-size:24px;color:${COL.warn};background:${COL.blue};border-color:${COL.warn}`));
    this.src = s('circle', { cx: 200, cy: 380, r: 14, fill: '#fff' }, this.svg);
    this.dst = txt(el, '', 'OPT-R<br><span style="font-size:26px;font-weight:700">단위업무 10개</span>', `left:1540px;top:320px;font-size:52px;font-weight:900;color:${COL.blue};background:#fff;border-radius:16px;padding:14px 26px;line-height:1.1`);
    this.dots = [0, 1, 2].map(() => s('circle', { r: 13, fill: '#fff' }, this.svg));
  },
  render(lt) {
    this.src.setAttribute('r', (14 * prog(lt, 3.05, 0.3, ease.pop)).toFixed(1));
    this.paths.forEach((p, i) => {
      const L = p.getTotalLength();
      const q = prog(lt, 3.2 + i * 0.12, 2.2, ease.inOutCubic);
      p.style.strokeDasharray = `${L} ${L}`; p.style.strokeDashoffset = ((1 - q) * L).toFixed(1);
      const loop = lt > 5.6 ? ((lt - 5.6 + i * 0.5) % 1.8) / 1.8 : -1;
      const u = loop >= 0 ? loop : q;
      const pt = p.getPointAtLength(u * L);
      const d = this.dots[i];
      d.setAttribute('cx', pt.x.toFixed(1)); d.setAttribute('cy', pt.y.toFixed(1)); d.setAttribute('opacity', loop >= 0 ? Math.sin(loop * Math.PI).toFixed(3) : (q > 0 && q < 1 ? 1 : 0));
    });
    this.lab.forEach((l, i) => inout(l, lt, 3.6 + i * 0.12, null, { rise: 14, blur: 6 }));
    this.chk.style.opacity = prog(lt, 3.4, 0.3).toFixed(3);
    this.chl.style.opacity = prog(lt, 3.5, 0.3).toFixed(3);
    this.st.forEach((st, i) => { stampAt(st, lt, 4.3 + i * 0.18, -6); const fade = prog(lt, 5.4, 0.3); if (lt > 4.3) st.style.opacity = (1 - fade).toFixed(3); });
    const dp = prog(lt, 5.5, 0.5, ease.pop);
    this.dst.style.opacity = dp.toFixed(3); this.dst.style.transform = `scale(${lerp(0.7, 1, dp).toFixed(3)})`;
  },
});

// ── 5. 사례 4: 단위업무명이 자모 단위로 다시 조립된다 ──────────────────
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
function dec(ch) { const c = ch.charCodeAt(0) - 0xac00; if (c < 0 || c > 11171) return null; return [Math.floor(c / 588), Math.floor((c % 588) / 28), c % 28]; }
function com(a) { return String.fromCharCode(0xac00 + a[0] * 588 + a[1] * 28 + a[2]); }
// 한 음절을 초성 → 중성 → 종성 순서로 바꾼다. p: 0~1
function morph(a, b, p) {
  const A = dec(a), B = dec(b);
  if (!A || !B) return p < 0.5 ? a : b;
  const st = [A.slice()];
  const cur = A.slice();
  for (let k = 0; k < 3; k++) if (cur[k] !== B[k]) { cur[k] = B[k]; st.push(cur.slice()); }
  return com(st[Math.min(st.length - 1, Math.floor(p * st.length))]);
}
chapter(4, {
  label: '사례 4', big: '사례 4', title: '단위업무명 제안', harness: 'kac-unit-task-naming · 에이전트 3개',
  setup(el) {
    this.old = txt(el, '', '기존 이름', `left:120px;top:150px;font-size:28px;font-weight:700;color:${W}.75)`);
    this.pairs = [['감', '감'], ['사', '사'], ['제', '처'], ['도', '분'], [' ', ' '], ['운', '심'], ['영', '의'], [' ', '·'], ['및', '조'], [' ', '치'], ['지', '이'], ['원', '행'], [' ', ''], ['관', '관'], ['리', '리']];
    this.box = txt(el, '', '', 'left:120px;top:210px;height:150px;white-space:nowrap');
    this.g = this.pairs.map(p => { const e = h('span', '', this.box, p[0] === ' ' ? '\u00a0' : p[0]); e.style.cssText = 'display:inline-block;font-size:100px;font-weight:900;color:#fff;letter-spacing:-0.04em;line-height:1.1;vertical-align:top'; return e; });
    this.nw = txt(el, '', '제안 이름', `left:120px;top:390px;font-size:28px;font-weight:700;color:${W}.75)`);
    this.oldl = txt(el, '', '기존 · 감사제도 운영 및 지원 관리', `left:120px;top:344px;font-size:30px;font-weight:600;color:${W}.6);text-decoration:line-through;text-decoration-thickness:2px`);
    this.meta = txt(el, '', '감사실 · 근거 문서 181건 · 검토 판정', `left:120px;top:414px;font-size:30px;font-weight:600;color:#fff`);
    this.st = txt(el, 'stamp', '수정필요', `left:690px;top:402px;font-size:30px;color:#FFB547;border-color:#FFB547;background:${COL.blue}`);
  },
  render(lt) {
    inout(this.old, lt, 3.1, null, { rise: 12 });
    const nwShow = prog(lt, 4.6, 0.3);
    this.old.style.opacity = (prog(lt, 3.1, 0.3) * (1 - nwShow)).toFixed(3);
    this.nw.style.opacity = nwShow.toFixed(3);
    this.nw.style.top = '150px';
    this.g.forEach((e, i) => {
      const [a, b] = this.pairs[i];
      const a0 = prog(lt, 3.1 + i * 0.03, 0.4, ease.snap);
      const t0 = 3.9 + i * 0.09;
      const p = prog(lt, t0, 0.42, ease.linear);
      const same = a === b;
      const out = p >= 1 ? b : morph(a, b, p) || '';
      e.textContent = out === ' ' ? '\u00a0' : out;
      const moving = !same && p > 0 && p < 1;
      e.style.color = moving ? '#FFD9A8' : '#fff';
      e.style.transform = `translateY(${((1 - a0) * 40 + (moving ? -10 * Math.sin(p * Math.PI) : 0)).toFixed(1)}px)`;
      e.style.opacity = a0.toFixed(3);
      if (b === '' && p >= 1) e.style.display = 'none'; else e.style.display = 'inline-block';
    });
    inout(this.oldl, lt, 5.3, null, { rise: 14 });
    inout(this.meta, lt, 5.6, null, { rise: 14 });
    stampAt(this.st, lt, 6.1, -6);
  },
});

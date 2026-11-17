/* 공용 코드: 팔레트, 아이소메트릭 투영·도형, 일러스트 배치, 질문 말풍선, 하네스 머리말, 자막.
 * 모든 구간(scenes_*.js)이 window.KAC 로 쓴다. 구간 파일에서는 이 파일을 고치지 않는다. */
(function () {
  'use strict';
  const R = window.REEL;
  const { ease, prog, clamp, lerp, css, h, cue, level } = R;
  R.config({ duration: 50, fps: 30, width: 1920, height: 1080, audio: '../audio/mix.wav' });

  const C = {
    paper: '#FDF3E2', paper2: '#F4E6CC', line: '#E3D3B4',
    navy: '#1B2A4A', navy2: '#2B3F6B', ink: '#14203A', dim: 'rgba(27,42,74,.58)',
    blue: '#2F7BFF', sky: '#8CC2F2', orange: '#FF6A2B', green: '#19A974', purple: '#6C4CE0', teal: '#0FA3B1', cream: '#F0E2C6',
    white: '#FFFDF8',
  };
  // 하네스 다섯 개. 소개 순서대로.
  const H5 = [
    { key: 'assign', no: 3, name: '제목으로 기록물철 배정', short: '제목 배정', accent: C.blue, img: 'g02_sort', agents: ['분류 담당', '검증자', '검사 담당'] },
    { key: 'audit', no: 2, name: '생산현황 오분류 점검', short: '오분류 점검', accent: C.orange, img: 'g03_audit', agents: ['판정 담당', '검증자 2관점', '검사 담당'] },
    { key: 'naming', no: 5, name: '단위업무명 추천', short: '단위업무명 추천', accent: C.green, img: 'g04_naming', agents: ['설계 담당', '검증자', '검사 담당'] },
    { key: 'orgchange', no: 1, name: '조직 변경 시 단위업무 변경', short: '조직 변경 영향', accent: C.purple, img: 'g05_orgchange', agents: ['분석 담당', '이름 담당', '검사 담당'] },
    { key: 'strategy', no: 4, name: '단위업무 기준 조직 개편 추천', short: '조직 개편 추천', accent: C.teal, img: 'g06_strategy', agents: ['시안 담당', '심사자 3관점', '검사 담당'] },
  ];

  const F = 1 / R.fps;
  const E = (name) => cue(name) - 0.5 * F;          // 사건 시각: 큐 프레임에 새 상태가 처음 보이게
  const hex = (str) => str[0] === '#' ? [1, 3, 5].map((i) => parseInt(str.slice(i, i + 2), 16)) : str.match(/[\d.]+/g).slice(0, 3).map(Number);   // '#rrggbb' 와 'rgb(r,g,b)' 를 모두 받는다
  const shade = (str, k) => `rgb(${hex(str).map((v) => clamp(Math.round(v * k), 0, 255)).join(',')})`;
  const mix = (a, b, p) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})`; };

  function cv(el, w = R.W, hh = R.H) {
    const c = h('canvas', '', el); c.width = w; c.height = hh;
    css(c, { position: 'absolute', left: 0, top: 0, width: w + 'px', height: hh + 'px' });
    return c.getContext('2d');
  }

  /* 정아이소메트릭(30°). 바닥 좌표 x 는 화면 오른쪽 아래, y 는 왼쪽 아래, z 는 위. */
  function iso(S = 40, cx = 960, cy = 540) {
    const o = { S, cx, cy };
    o.pt = (x, y, z = 0) => [o.cx + (x - y) * o.S * 0.866, o.cy + (x + y) * o.S * 0.5 - z * o.S];
    o.poly = (g, pts, fill, stroke) => {
      g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath();
      g.fillStyle = fill; g.fill(); g.strokeStyle = stroke || fill; g.lineWidth = stroke ? 1.5 : 0.7; g.stroke();
    };
    // 상자: (x,y,z) 에서 가로 w(x축)·세로 d(y축)·높이 hh. col 은 윗면 색. 옆면은 어둡게.
    o.box = (g, x, y, z, w, d, hh, col, opt = {}) => {
      const P = (a, b, c2) => o.pt(x + a, y + b, z + c2);
      const kl = opt.left ?? 0.8, kr = opt.right ?? 0.62;
      o.poly(g, [P(0, d, 0), P(w, d, 0), P(w, d, hh), P(0, d, hh)], opt.leftCol || shade(col, kl));
      o.poly(g, [P(w, 0, 0), P(w, d, 0), P(w, d, hh), P(w, 0, hh)], opt.rightCol || shade(col, kr));
      o.poly(g, [P(0, 0, hh), P(w, 0, hh), P(w, d, hh), P(0, d, hh)], col, opt.edge);
    };
    // 바닥에 누운 사각형(종이·타일). rot 는 z축 회전(라디안), 중심 (x,y).
    o.sheet = (g, x, y, z, w, d, rot, fill, stroke) => {
      const c = Math.cos(rot), s2 = Math.sin(rot);
      const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => o.pt(x + a * c - b * s2, y + a * s2 + b * c, z));
      o.poly(g, pts, fill, stroke); return pts;
    };
    // 바닥 격자선
    o.grid = (g, n, step, color, alpha = 1) => {
      g.save(); g.globalAlpha = alpha; g.strokeStyle = color; g.lineWidth = 1.2; g.beginPath();
      for (let i = -n; i <= n; i++) {
        let a = o.pt(i * step, -n * step), b = o.pt(i * step, n * step); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
        a = o.pt(-n * step, i * step); b = o.pt(n * step, i * step); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
      }
      g.stroke(); g.restore();
    };
    return o;
  }

  /* 생성 일러스트(assets/img/gNN_*.jpg, 2400×1351, 배경색이 paper 와 같다)를 중심 (x,y), 폭 w 로 놓는다.
   * 가장자리는 마스크로 풀어 배경과 이음선이 보이지 않게 한다. 반환한 div 의 transform 을 render 에서 바꾼다. */
  function sprite(el, name, { x = 960, y = 540, w = 900, mask = true } = {}) {
    const im = R.img(`../assets/img/${name}.jpg`);
    const d = h('div', 'a', el); const hh = w * 1351 / 2400;
    css(d, { left: (x - w / 2) + 'px', top: (y - hh / 2) + 'px', width: w + 'px', height: hh + 'px', transformOrigin: '50% 60%' });
    css(im, { width: '100%', height: '100%', display: 'block' });
    if (mask) { const m = 'linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 5%, #000 95%, transparent 100%)'; d.style.maskImage = m; d.style.maskComposite = 'intersect'; d.style.webkitMaskImage = m; d.style.webkitMaskComposite = 'source-in'; }
    d.appendChild(im); return d;
  }

  /* 질문 말풍선: 기록연구사(일러스트)와 질문 글자. 질문 줄(qid)이 발음되는 동안 글자가 차례로 나타난다.
   * 반환 객체의 render(t) 를 장면 render 에서 절대 시각 t 로 부른다. 자리: x 60~1000, y 560~900. */
  function question(el, qid, { until, x = 70, y = 590, accent = C.navy } = {}) {
    const line = (R.TL.vo || []).find((v) => v.id === qid) || { start: 0, end: 2, text: '' };
    const t0 = line.start - 0.35, t1 = until ?? line.end + 0.55;
    const root = h('div', 'a', el); css(root, { left: x + 'px', top: y + 'px', width: '940px', height: '320px' });
    const person = sprite(root, 'g08_person', { x: 105, y: 150, w: 720 }); person.style.mixBlendMode = 'darken';   // 바닥색 위에서도 일러스트 배경 사각형이 보이지 않게
    const bub = h('div', 'a', root);
    css(bub, { left: '225px', top: '70px', padding: '26px 38px 28px', background: C.navy, color: C.white, borderRadius: '30px 30px 30px 6px',
      font: '700 50px/1.2 "Pretendard", sans-serif', letterSpacing: '-0.02em', whiteSpace: 'nowrap', transformOrigin: '0% 100%' });
    const tag = h('div', '', bub, '기록연구사의 질문');
    css(tag, { font: '600 26px/1 "Pretendard", sans-serif', letterSpacing: '0.02em', color: accent === C.navy ? C.sky : accent, marginBottom: '14px', filter: 'brightness(1.25)' });
    const txt = h('div', '', bub); const spans = [...line.text].map((ch) => { const sp = h('span', '', txt, ch === ' ' ? ' ' : ch); return sp; });
    const bars = h('div', 'a', bub); css(bars, { right: '30px', top: '24px', height: '24px', display: 'flex', gap: '4px', alignItems: 'center' });
    const bs = Array.from({ length: 9 }, () => { const b = h('div', '', bars); css(b, { width: '4px', height: '24px', background: C.sky, borderRadius: '2px' }); return b; });
    const n = spans.length, span = Math.max(0.2, line.end - line.start);
    return {
      t0, t1, root,
      render(t) {
        const pin = prog(t, t0, 0.45, ease.outBack), pout = prog(t, t1, 0.3, ease.inCubic);
        root.style.display = (t < t0 - 0.05 || t > t1 + 0.35) ? 'none' : 'block';
        css(person, { transform: `translate(${(1 - prog(t, t0 - 0.1, 0.5, ease.outCubic)) * -360 - pout * 420}px, 0)` });
        css(bub, { transform: `scale(${Math.max(0, pin) * (1 - pout)})`, opacity: pin > 0 ? 1 : 0 });
        spans.forEach((sp, i) => { const p = prog(t, line.start - 0.05 + span * 0.92 * i / n, 0.16, ease.outCubic); sp.style.opacity = p; sp.style.display = 'inline-block'; sp.style.transform = `translateY(${(1 - p) * 14}px)`; });
        bs.forEach((b, i) => { b.style.transform = `scaleY(${0.15 + 0.85 * level(t - i * 0.035, qid)})`; });
      },
    };
  }

  /* 하네스 머리말: 왼쪽 위에 하네스 이름과 에이전트 세 명. at 시각에 들어온다. 자리: x 96~1000, y 70~250. */
  function header(el, hx, at) {
    const root = h('div', 'a', el); css(root, { left: '96px', top: '70px' });
    const bar = h('div', 'a', root); css(bar, { left: 0, top: '8px', width: '14px', height: '92px', background: hx.accent, transformOrigin: '50% 0%' });
    const small = h('div', 'a', root, '기록관리 하네스'); css(small, { left: '34px', top: '2px', font: '600 26px/1 "Pretendard", sans-serif', color: C.dim, whiteSpace: 'nowrap' });
    const name = h('div', 'a', root, hx.name);
    css(name, { left: '32px', top: '36px', font: '900 66px/1.05 "Paperlogy", "Pretendard", sans-serif', letterSpacing: '-0.035em', color: C.navy, whiteSpace: 'nowrap' });
    const chars = R.split(name, 'char', { mask: true });
    const chips = hx.agents.map((a, i) => {
      const c = h('div', 'a', root); css(c, { left: (34 + i * 10) + 'px', top: '128px', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px 9px 12px',
        background: C.white, border: `2px solid ${C.navy}`, borderRadius: '999px', font: '700 26px/1 "Pretendard", sans-serif', color: C.navy, whiteSpace: 'nowrap' });
      const dot = h('div', '', c); css(dot, { width: '22px', height: '22px', background: i === 1 ? hx.accent : C.navy, transform: 'rotate(45deg) scale(.72)' });
      h('span', '', c, a); return c;
    });
    let widths = null;
    return {
      root,
      render(t) {
        if (!widths) { widths = chips.map((c) => c.offsetWidth); let x = 34; chips.forEach((c, i) => { c.style.left = x + 'px'; x += widths[i] + 12; }); }
        const lt = t - at;
        root.style.display = lt < -0.05 ? 'none' : 'block';
        css(bar, { transform: `scaleY(${prog(lt, 0, 0.35, ease.outCubic)})` });
        css(small, { opacity: prog(lt, 0.1, 0.25), transform: `translateX(${(1 - prog(lt, 0.1, 0.35, ease.outCubic)) * -24}px)` });
        chars.forEach((c, i) => { const p = R.stagger(lt, 0.08, 0.028, 0.5, i); css(c, { transform: `translateY(${(1 - p) * 135}%)`, opacity: p > 0 ? 1 : 0 }); });
        chips.forEach((c, i) => { const p = prog(lt, 0.45 + i * 0.09, 0.4, ease.outBack); css(c, { transform: `translateY(${(1 - p) * 26}px) scale(${0.7 + 0.3 * p})`, opacity: clamp(p * 2, 0, 1) }); });
      },
    };
  }

  /* 번인 자막: 설명 나레이션 줄만(질문 줄은 말풍선이 보여 준다). 화면 아래 남색 띠. */
  function subs() {
    const lines = (R.TL.vo || []).filter((l) => !l.nosub);
    let box, cur = null;
    R.overlay((t) => {
      let hit = null;
      for (const l of lines) if (t >= l.start - 0.08 && t < l.end + 0.3) hit = l;
      if (!hit) { box.style.opacity = 0; cur = null; return; }
      if (cur !== hit) { box.textContent = hit.sub || hit.text; cur = hit; }
      box.style.opacity = Math.min(prog(t, hit.start - 0.08, 0.15, ease.linear), 1 - prog(t, hit.end + 0.12, 0.18, ease.linear)).toFixed(3);
    }, { setup: (p) => {
      const wrap = h('div', '', p); wrap.style.cssText = 'position:absolute;left:0;right:0;bottom:50px;text-align:center;pointer-events:none';
      box = h('span', '', wrap);
      box.style.cssText = `display:inline-block;max-width:1560px;padding:13px 34px 15px;background:rgba(20,32,58,.93);color:${C.white};border-radius:16px;` +
        'font:600 39px/1.3 "Pretendard", sans-serif;letter-spacing:-0.015em;word-break:keep-all;opacity:0';
    } });
  }

  window.KAC = { C, H5, F, E, hex, shade, mix, cv, iso, sprite, question, header, subs };
})();

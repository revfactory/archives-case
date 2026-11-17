/* 덱 공통 컴포넌트와 움직임. 모든 움직임 함수는 (el, lt, t0, …) 를 받아 lt 만으로 상태를 정한다.
   setup 에서 요소를 만들고, render 에서 아래 함수로 움직인다. */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css, split, count, kf, rand } = RH;
  const K = (window.K = {});

  // ── 만들기 ─────────────────────────────────────────────
  // 절대 위치 요소: K.at(parent, 'card', {x, y, w, h}, html)
  K.at = (parent, cls, box = {}, html) => {
    const el = h('div', cls, parent, html);
    el.style.position = 'absolute';
    if (box.x != null) el.style.left = box.x + 'px';
    if (box.y != null) el.style.top = box.y + 'px';
    if (box.r != null) el.style.right = box.r + 'px';
    if (box.b != null) el.style.bottom = box.b + 'px';
    if (box.w != null) el.style.width = box.w + 'px';
    if (box.h != null) el.style.height = box.h + 'px';
    return el;
  };
  K.chip = (parent, text, cls = 'id', box) => {
    const el = box ? K.at(parent, 'chip ' + cls, box, text) : h('span', 'chip ' + cls, parent, text);
    return el;
  };
  // 장 제목 묶음. 반환값의 render(lt, t0) 로 등장시킨다.
  // 필름(기록관리 하네스 120초)의 머리말과 같은 꼴: 왼쪽 세로 막대(하네스 색) + 회색 머리글 + Paperlogy 제목.
  K.title = (root, o) => {
    const g = K.at(root, '', { x: o.x ?? 120, y: o.y ?? 96, w: o.w ?? 1680 });
    let kick = null, sub = null;
    const head = h('div', 'thead', g);
    const bar = o.bar === false ? null : h('div', 'tbar', head);
    if (o.kicker) kick = h('div', 'kicker', head, `<span>${o.kicker}</span>`);
    const tt = h('div', o.big ? 'h-xl' : 'h-title', head);
    tt.style.marginTop = o.kicker ? '18px' : '0';
    if (o.size) tt.style.fontSize = o.size + 'px';
    const lines = String(o.title).split('\n');
    const words = [];
    lines.forEach((ln, li) => {
      const line = h('div', '', tt);
      line.textContent = ln;
      words.push(...split(line, 'word', { mask: true }));
    });
    if (o.sub) { sub = h('div', 'h-sub', g, o.sub); sub.style.marginTop = '22px'; if (o.subW) sub.style.maxWidth = o.subW + 'px'; }
    return {
      el: g, title: tt, sub, kick, bar,
      render(lt, t0 = 0) {
        if (bar) bar.style.transform = `scaleY(${prog(lt, t0, 0.35, ease.outCubic).toFixed(4)})`;
        if (kick) K.rise(kick, lt, t0 + 0.08, { y: 0, x: -24, dur: 0.45 });
        words.forEach((w, i) => {
          const p = prog(lt, t0 + 0.08 + i * 0.045, 0.6, ease.snap);
          w.style.transform = `translateY(${((1 - p) * 105).toFixed(1)}%)`;
        });
        if (sub) K.rise(sub, lt, t0 + 0.3 + words.length * 0.03, { y: 18 });
      },
    };
  };
  // 에이전트 노드: kind = make(생성, 군청) | check(검증, 주홍) | judge(중재, 주황) | write(작성, 먹색)
  K.agent = (parent, o) => {
    const el = K.at(parent, 'agent' + (o.kind && o.kind !== 'make' ? ' ' + o.kind : ''), { x: o.x, y: o.y, w: o.w ?? 300, h: o.h });
    h('div', 'nm', el, o.name);
    if (o.role) h('div', 'rl', el, o.role);
    if (o.model) h('div', 'md ' + o.model, el, o.model);
    if (o.note) { const n = h('div', 'small', el, o.note); n.style.marginTop = '6px'; n.style.fontSize = '20px'; n.style.lineHeight = '1.4'; }
    return el;
  };
  K.script = (parent, o) => K.at(parent, 'script', { x: o.x, y: o.y, w: o.w }, o.name + (o.cap ? `<span class="cap">${o.cap}</span>` : ''));
  K.human = (parent, o) => K.at(parent, 'human', { x: o.x, y: o.y, w: o.w }, o.text);
  K.stampEl = (parent, text, cls, box) => K.at(parent, 'stamp ' + cls, box, text);

  // SVG 층: 연결선·점 흐름용. 무대 전체를 덮는다.
  K.svg = (parent, box = { x: 0, y: 0, w: 1920, h: 1080 }) => {
    const el = s('svg', { width: box.w, height: box.h, viewBox: `0 0 ${box.w} ${box.h}` }, parent);
    css(el, { position: 'absolute', left: box.x + 'px', top: box.y + 'px', overflow: 'visible', pointerEvents: 'none' });
    return el;
  };
  // 연결선. pts = [[x,y],…] 이면 꺾은선(모서리 둥글게), d 문자열이면 그대로.
  K.path = (svg, pts, o = {}) => {
    const d = typeof pts === 'string' ? pts : roundPath(pts, o.radius ?? 18);
    const p = s('path', { d, fill: 'none', stroke: o.color || K.C.blue, 'stroke-width': o.width ?? 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    if (o.dash) { p.setAttribute('stroke-dasharray', o.dash); p._dash = true; }
    p._len = p.getTotalLength();
    if (o.arrow) {
      p._arrow = s('path', { d: 'M -14 -8 L 0 0 L -14 8', fill: 'none', stroke: o.color || K.C.blue, 'stroke-width': o.width ?? 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    }
    return p;
  };
  function roundPath(pts, r) {
    if (pts.length < 3 || !r) return 'M ' + pts.map(p => p.join(' ')).join(' L ');
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const l1 = Math.hypot(x1 - x0, y1 - y0), l2 = Math.hypot(x2 - x1, y2 - y1);
      const rr = Math.min(r, l1 / 2, l2 / 2);
      const ax = x1 - ((x1 - x0) / l1) * rr, ay = y1 - ((y1 - y0) / l1) * rr;
      const bx = x1 + ((x2 - x1) / l2) * rr, by = y1 + ((y2 - y1) / l2) * rr;
      d += ` L ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${x1} ${y1} ${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    const l = pts[pts.length - 1];
    return d + ` L ${l[0]} ${l[1]}`;
  }
  // 선 위를 흐르는 점 n 개를 만든다(setup 에서). render 에서 K.flow 로 움직인다.
  K.dots = (svg, path, n = 3, o = {}) => {
    path._dots = [];
    for (let i = 0; i < n; i++) path._dots.push(s('circle', { r: o.r ?? 6, fill: o.color || K.C.blue, opacity: 0 }, svg));
    return path._dots;
  };

  // ── 움직임 ─────────────────────────────────────────────
  // 들어오기: 아래(또는 x 방향)에서 짧게 붙는다. 반환값 0~1.
  K.rise = (el, lt, t0, o = {}) => {
    const p = prog(lt, t0, o.dur ?? 0.5, o.ease || ease.snap);
    const y = (1 - p) * (o.y ?? 28), x = (1 - p) * (o.x ?? 0);
    el.style.opacity = p.toFixed(3);
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` + (o.scale ? ` scale(${lerp(o.scale, 1, p).toFixed(4)})` : '');
    const bl = (1 - p) * (o.blur ?? 6);
    el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(1)}px)` : '';
    return p;
  };
  // 튀어나오기(칩·노드): 0.86 → 1, 살짝 넘침
  K.pop = (el, lt, t0, o = {}) => {
    const p = prog(lt, t0, o.dur ?? 0.45, ease.pop);
    const a = prog(lt, t0, 0.18, ease.linear);
    el.style.opacity = a.toFixed(3);
    el.style.transform = `scale(${lerp(o.from ?? 0.86, 1, p).toFixed(4)})`;
    return a;
  };
  // 도장: 크게(1.6) 나타나 무겁게 내려앉는다
  K.stamp = (el, lt, t0, o = {}) => {
    const rot = o.rot ?? -6;
    if (lt < t0) { el.style.opacity = '0'; return 0; }
    const sc = kf(lt, [[t0, 1.6], [t0 + 0.14, 0.95, ease.inQuad], [t0 + 0.26, 1, ease.outQuad]]);
    el.style.opacity = clamp((lt - t0) / 0.06).toFixed(3);
    el.style.transform = `rotate(${rot}deg) scale(${sc.toFixed(4)})`;
    return 1;
  };
  // 왼쪽부터 드러내기(표 행·막대)
  K.wipe = (el, lt, t0, dur = 0.6, dir = 'left') => {
    const p = prog(lt, t0, dur, ease.swift);
    const c = ((1 - p) * 100).toFixed(2);
    el.style.clipPath = dir === 'left' ? `inset(0 ${c}% 0 0)` : dir === 'right' ? `inset(0 0 0 ${c}%)` : dir === 'down' ? `inset(0 0 ${c}% 0)` : `inset(${c}% 0 0 0)`;
    el.style.opacity = p > 0 ? '1' : '0';
    return p;
  };
  // 선 그리기 + 선 위 점 흐름. speed = 초당 px. 점은 선이 다 그려진 뒤 흐른다.
  K.draw = (path, lt, t0, dur = 0.7, o = {}) => {
    const L = path._len;
    const p = prog(lt, t0, dur, o.ease || ease.inOutCubic);
    if (path._dash) {
      path.style.opacity = p.toFixed(3);   // 점선은 대시 배열을 그리기에 쓸 수 없어 투명도로 드러낸다
    } else {
      path.style.strokeDasharray = `${L.toFixed(1)} ${L.toFixed(1)}`;
      path.style.strokeDashoffset = ((1 - p) * L).toFixed(1);
      path.style.opacity = p > 0 ? '1' : '0';
    }
    if (path._arrow) {
      const pt = path.getPointAtLength(Math.max(0.01, p * L)), pb = path.getPointAtLength(Math.max(0, p * L - 2));
      const ang = Math.atan2(pt.y - pb.y, pt.x - pb.x) * 180 / Math.PI;
      path._arrow.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      path._arrow.style.opacity = p > 0.02 ? '1' : '0';
    }
    if (path._dots) {
      const n = path._dots.length, speed = o.speed ?? 180, gap = 1 / n;
      const run = lt - (t0 + dur);
      path._dots.forEach((c, i) => {
        if (run < 0) { c.setAttribute('opacity', 0); return; }
        const u = ((run * speed) / L + i * gap) % 1;
        const pt = path.getPointAtLength(u * L);
        c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1));
        const fade = Math.min(u / 0.08, (1 - u) / 0.08, 1) * clamp(run / 0.3);
        c.setAttribute('opacity', fade.toFixed(3));
      });
    }
    return p;
  };
  // 숫자 세기. value 까지 dur 초 동안. o.decimals, o.suffix
  K.count = (el, lt, t0, dur, value, o = {}) => {
    const p = prog(lt, t0, dur, o.ease || ease.outExpo);
    el.textContent = count(p, value, { decimals: o.decimals || 0, from: o.from || 0 }) + (o.suffix || '');
    return p;
  };
  // 글자 치기: 문자열을 cps(초당 글자) 로
  K.type = (el, text, lt, t0, cps = 28) => {
    const chars = [...text];
    const n = clamp(Math.floor((lt - t0) * cps), 0, chars.length);
    el.textContent = chars.slice(0, n).join('');
    return n / chars.length;
  };
  // 반복 강조: period 초마다 0..n-1 을 돈다. 처음 시작은 t0.
  K.cycle = (lt, t0, period, n) => (lt < t0 ? -1 : Math.floor((lt - t0) / period) % n);
  // 0~1 사인 왕복(머무는 동안의 작은 움직임)
  K.wave = (lt, period = 3, phase = 0) => 0.5 - 0.5 * Math.cos(((lt / period) + phase) * Math.PI * 2);
  // 가로 막대 줄기. 최대 폭 wmax 에 비례
  K.bar = (el, lt, t0, frac, wmax, dur = 0.8) => {
    const p = prog(lt, t0, dur, ease.snap);
    el.style.width = (frac * wmax * p).toFixed(1) + 'px';
    return p;
  };
  // 행 강조(배경 색 넣고 빼기)
  K.mark = (el, on, color = 'rgba(47,123,255,.10)') => { RH.set(el, 'background', on ? color : 'transparent'); };

  // 표: cols = [{label, w, cls, align}], rows = [[셀…]]. 셀 값은 HTML 문자열.
  K.table = (parent, o) => {
    const el = K.at(parent, 'tbl', { x: o.x, y: o.y, w: o.w });
    const tpl = o.cols.map(c => (typeof c.w === 'number' ? c.w + 'px' : c.w || '1fr')).join(' ');
    const mk = (cells, cls, cellCls) => {
      const r = h('div', 'tr ' + (cls || ''), el);
      r.style.gridTemplateColumns = tpl;
      if (o.rowH && cls !== 'head') r.style.minHeight = o.rowH + 'px';
      cells.forEach((c, i) => {
        const td = h('div', cellCls + ' ' + (o.cols[i].cls || ''), r, c == null ? '' : String(c));
        if (o.cols[i].align) td.style.textAlign = o.cols[i].align;
      });
      return r;
    };
    const head = o.noHead ? null : mk(o.cols.map(c => c.label), 'head', 'th');
    const rows = o.rows.map(r => mk(r, '', 'td'));
    return {
      el, head, rows,
      render(lt, t0 = 0, each = 0.08) {
        if (head) K.rise(head, lt, t0, { y: 10 });
        rows.forEach((r, i) => K.rise(r, lt, t0 + 0.12 + i * each, { y: 16, blur: 4 }));
      },
    };
  };
  // 이미지 깔기(켄 번스): 천천히 확대·이동
  K.photo = (parent, src, box, o = {}) => {
    const wrapEl = K.at(parent, '', box);
    wrapEl.style.overflow = 'hidden';
    const img = h('img', '', wrapEl);
    img.src = src; img.alt = o.alt || '';
    css(img, { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transformOrigin: o.origin || '50% 50%' });
    wrapEl._img = img;
    return wrapEl;
  };
  K.kenburns = (wrapEl, lt, o = {}) => {
    const p = clamp(lt / (o.dur ?? 20));
    const sc = lerp(o.from ?? 1.04, o.to ?? 1.14, p);
    const x = lerp(0, o.dx ?? -30, p), y = lerp(0, o.dy ?? -10, p);
    wrapEl._img.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(4)})`;
  };
  // ── 필름과 같은 재료 ──────────────────────────────────
  // 생성 일러스트(img/gNN_*.jpg, 바탕이 종이색)를 중심 (x, y), 폭 w 로 놓는다. 가장자리는 마스크로 풀고
  // darken 으로 겹쳐 종이 바탕과 이음선이 보이지 않게 한다. crop: true 면 물체 주변만 자른 *_c.jpg 를 쓴다.
  K.sprite = (parent, name, o = {}) => {
    const crop = !!o.crop, w = o.w ?? 900;
    const ratio = o.ratio ?? (crop ? (K.CROP[name] || 0.86) : 1351 / 2400);
    const hh = w * ratio, x = o.x ?? 960, y = o.y ?? 540;
    const d = K.at(parent, 'ill', { x: x - w / 2, y: y - hh / 2, w, h: hh });
    const im = h('img', '', d); im.src = `img/${name}${crop ? '_c' : ''}.jpg`; im.alt = o.alt || '';
    css(im, { width: '100%', height: '100%', display: 'block' });
    d.style.transformOrigin = o.origin || '50% 60%';
    if (o.mask !== false && !crop) {
      const m = 'linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 5%, #000 95%, transparent 100%)';
      d.style.maskImage = m; d.style.maskComposite = 'intersect'; d.style.webkitMaskImage = m; d.style.webkitMaskComposite = 'source-in';
    }
    return d;
  };
  // 기록연구사의 질문 말풍선(필름과 같은 꼴). 반환값의 render(lt, t0) 로 사람이 들어오고 글자가 찍힌다.
  // o.person = { x, y, w } (root 기준, 자른 그림 중심과 폭) 또는 false. o.bx, o.by = 말풍선 자리. o.shown = true 면 처음부터 다 보인다.
  K.question = (parent, text, o = {}) => {
    const root = K.at(parent, '', { x: o.x ?? 60, y: o.y ?? 600, w: 1000, h: 330 });
    const pp = o.person === false ? null : Object.assign({ x: 110, y: 168, w: 210 }, o.person || {});
    const person = pp ? K.sprite(root, 'g08_person', { crop: true, x: pp.x, y: pp.y, w: pp.w }) : null;
    const bub = K.at(root, 'qbub', { x: o.bx ?? 230, y: o.by ?? 70 });
    if (o.size) bub.style.fontSize = o.size + 'px';
    if (o.pad) bub.style.padding = o.pad;
    const tag = h('div', 'tag', bub, o.tag || '기록연구사의 질문');
    if (o.tagSize) tag.style.fontSize = o.tagSize + 'px';
    const tx = h('div', '', bub);
    const spans = [...text].map(ch => h('span', '', tx, ch === ' ' ? '\u00a0' : ch));
    if (o.bars) {   // 필름 말풍선 오른쪽 위의 음성 막대(쉬는 상태)
      const bars = h('div', '', bub); css(bars, { position: 'absolute', right: '30px', top: '24px', height: '24px', display: 'flex', gap: '4px', alignItems: 'center' });
      for (let i = 0; i < 9; i++) { const b = h('div', '', bars); css(b, { width: '4px', height: '24px', background: '#8CC2F2', borderRadius: '2px', transform: 'scaleY(.15)' }); }
    }
    return {
      root, bub, person, spans,
      render(lt, t0 = 0, cps = 22) {
        if (person) { const p = o.shown ? 1 : prog(lt, t0, 0.55, ease.outCubic); person.style.transform = `translateX(${((1 - p) * -260).toFixed(1)}px)`; person.style.opacity = clamp(p * 2).toFixed(3); }
        const pb = o.shown ? 1 : prog(lt, t0 + 0.25, 0.45, ease.outBack);
        bub.style.transform = `scale(${Math.max(0, pb).toFixed(4)})`; bub.style.opacity = pb > 0 ? '1' : '0';
        spans.forEach((sp, i) => { const p = o.shown ? 1 : prog(lt, t0 + 0.5 + i / cps, 0.16, ease.outCubic); sp.style.opacity = p.toFixed(3); sp.style.display = 'inline-block'; sp.style.transform = `translateY(${((1 - p) * 12).toFixed(1)}px)`; });
      },
      // 필름처럼 사람은 왼쪽으로 빠지고 말풍선은 줄어든다
      out(lt, t1) {
        const q = prog(lt, t1, 0.4, ease.inCubic);
        if (person) person.style.transform = `translateX(${(-q * 420).toFixed(1)}px)`;
        bub.style.transform = `scale(${(1 - q).toFixed(4)})`;
        root.style.display = q >= 1 ? 'none' : 'block';
      },
    };
  };
  // 하네스 칩(필름 엔드카드의 색 칩): K.hchip(parent, 'assign', box)
  K.hchip = (parent, key, box, label) => {
    const hz = K.HZ[key];
    const el = box ? K.at(parent, 'hchip', box, label || hz.short) : h('span', 'hchip', parent, label || hz.short);
    el.style.background = hz.c;
    return el;
  };
  // 역할 칩(필름 머리말의 ◆ 담당 칩)
  K.rchip = (parent, text, box, color) => {
    const el = box ? K.at(parent, 'rchip', box) : h('span', 'rchip', parent);
    const dia = h('i', 'dia', el); if (color) dia.style.background = color;
    h('span', '', el, text);
    return el;
  };
  K.rand = rand;
})();
/* 색 상수(JS 에서 캔버스·SVG 에 쓸 때) */
/* 필름(기록관리 하네스 120초)의 팔레트를 그대로 쓴다. */
window.K.C = { ink: '#1B2A4A', ink2: '#3A4A6B', mute: '#6A7287', paper: '#FDF3E2', paper2: '#F4E6CC', paper3: '#FFFAF2', night: '#1B2A4A',
  blue: '#2F7BFF', sky: '#8CC2F2', ok: '#19A974', warn: '#E8930C', bad: '#E8483A', orange: '#FF6A2B', purple: '#6C4CE0', teal: '#0FA3B1', line: '#E3D3B4' };
/* 하네스 다섯 개. 순서·이름·색·그림·질문은 필름과 같고, dir·agents 는 이 발표에서 돌린 하네스다. */
window.K.HZ = {
  assign:    { no: 1, short: '제목 배정',       name: '제목으로 기록물철 배정',       c: '#2F7BFF', img: 'g02_sort',      q: '제목만 보고 기록물철을 고를 수 있나요?', dir: 'kac-record-assign',       agents: 3, task: '생산현황 분류 정정' },
  audit:     { no: 2, short: '오분류 점검',     name: '생산현황 오분류 점검',         c: '#FF6A2B', img: 'g03_audit',     q: '이미 분류한 문서는 맞게 분류됐을까요?', dir: 'kac-classification-audit', agents: 3, task: '생산현황 분류 정정' },
  naming:    { no: 3, short: '단위업무명 추천', name: '단위업무명 추천',              c: '#19A974', img: 'g04_naming',    q: '기준표에 없는 업무는요?',               dir: 'kac-unit-task-naming',     agents: 3, task: '단위업무명 추천·제안' },
  orgchange: { no: 4, short: '조직 변경 영향',  name: '조직 변경 시 단위업무 변경',   c: '#6C4CE0', img: 'g05_orgchange', q: '조직이 바뀌면 기준표는 어떻게 고치죠?', dir: 'kac-org-change-impact',    agents: 4, task: '조직변경 영향도' },
  strategy:  { no: 5, short: '조직 개편 추천',  name: '단위업무 기준 조직 개편 추천', c: '#0FA3B1', img: 'g06_strategy',  q: '어떻게 개편할지도 제안받을 수 있나요?', dir: 'kac-org-strategy',         agents: 5, task: '전략적 조직 설계' },
};
window.K.HZ_ORDER = ['assign', 'audit', 'naming', 'orgchange', 'strategy'];
/* 물체 주변만 자른 그림(img/*_c.jpg)의 세로/가로 비 */
window.K.CROP = { g01_archive: 601 / 720, g02_sort: 619 / 720, g03_audit: 691 / 720, g04_naming: 644 / 720, g05_orgchange: 617 / 720, g06_strategy: 626 / 720,
  g07_review: 705 / 720, g08_person: 1174 / 720, g09_box: 820 / 720, g10_pile: 750 / 720 };

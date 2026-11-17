/* 인트로 48초 — concept.md 「영상 구간」. 클립 구간(s01·s04·s06)은 바탕을 검정으로 두고, 합성 단계에서
   Higgsfield 클립이 RGB screen 으로 비친다(검정 = 클립, 흰 글자 = 그대로). */
const { ease, prog, win, kf, spring, clamp, lerp, rand, noise, split, stagger, css, h, s, cue, count, inout } = REEL;
REEL.config({ duration: 48, fps: 30, width: 1920, height: 1080, audio: null });

const F = 0.5 / 30;
const T = n => cue('scene.' + n) - F;
const TE = n => cue('scene.' + n + '.end') - F;
const COL = { paper: '#F2EFE7', ink: '#0F172A', night: '#0B1222', blue: '#2443F0', ok: '#0E9F6E', warn: '#D97706', bad: '#E5484D', mute: '#64748B' };
const TITLES = DD.titles;
const UNITS = DD.units;

function canvas(el, w = 1920, hh = 1080) {
  const c = h('canvas', '', el);
  c.width = w; c.height = hh;
  css(c, { position: 'absolute', left: 0, top: 0, width: w + 'px', height: hh + 'px' });
  return c;
}
function txt(el, cls, html, st) { const e = h('div', 'a ' + (cls || ''), el, html); if (st) e.style.cssText += ';' + st; return e; }

// ── s01: 문서 제목이 흐른다(클립 위, 흰 글자) ──────────────────────────
REEL.scene({
  id: 's01', start: 0, end: TE('s01'),
  setup(el) {
    el.style.background = '#000';
    this.cv = canvas(el); this.ctx = this.cv.getContext('2d');
    this.ctx.font = '500 30px Pretendard';
    this.lanes = [];
    for (let i = 0; i < 17; i++) {
      let t = '';
      for (let j = 0; j < 10; j++) t += TITLES[(i * 23 + j * 7) % TITLES.length] + '      ';
      this.lanes.push({ t, w: this.ctx.measureText(t).width, y: 70 + i * 60, v: 60 + rand(i, 2) * 90, o: rand(i, 5) * 1500, a: 0.32 + rand(i, 9) * 0.38 });
    }
    this.shade = h('div', 'full', el);
    this.shade.style.background = 'linear-gradient(0deg, rgba(0,0,0,.92) 0%, rgba(0,0,0,.7) 34%, rgba(0,0,0,0) 62%)';
    this.lab = txt(el, '', '2021~2026년 생산·접수 문서', 'left:120px;top:742px;font-size:40px;font-weight:700;color:#fff;letter-spacing:-0.02em');
    this.num = txt(el, 'num', '0', 'left:110px;top:790px;font-size:176px;font-weight:900;color:#fff;letter-spacing:-0.05em;line-height:1');
    this.unit = txt(el, '', '건', 'top:870px;font-size:64px;font-weight:800;color:#fff');
    this.paper = h('div', 'full', el); this.paper.style.background = COL.paper;
  },
  render(lt) {
    const c = this.ctx;
    c.clearRect(0, 0, 1920, 1080);
    c.font = '500 30px Pretendard';
    const acc = lt + 0.18 * lt * lt;            // 점점 빨라진다
    this.lanes.forEach((L, i) => {
      const a = prog(lt, 0.15 + i * 0.05, 0.6) * L.a;
      if (a <= 0) return;
      c.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      const x = -((L.o + acc * L.v) % L.w);
      c.fillText(L.t, x, L.y); c.fillText(L.t, x + L.w, L.y);
    });
    this.shade.style.opacity = prog(lt, 0.4, 0.8).toFixed(3);
    inout(this.lab, lt, 0.7, null, { rise: 30, blur: 8 });
    inout(this.num, lt, 0.85, null, { rise: 40, blur: 12 });
    this.num.textContent = count(prog(lt, 0.85, 2.5, ease.outExpo), 1076767);
    this.unit.style.left = (110 + this.num.offsetWidth + 18) + 'px';
    inout(this.unit, lt, 1.6, null, { rise: 20 });
    // 끝에 종이 면이 아래에서 올라와 다음 장면으로 넘어간다
    const p = prog(lt, 5.1, 0.85, ease.swift);
    this.paper.style.clipPath = `inset(${((1 - p) * 100).toFixed(2)}% 0 0 0)`;
  },
});

// ── s02: 제목 줄이 단위업무 703칸으로 접힌다 → U0087 확대 ─────────────
REEL.scene({
  id: 's02', start: T('s02'), end: TE('s02'),
  setup(el) {
    el.style.background = COL.paper;
    this.cam = h('div', 'full', el);
    this.cv = canvas(this.cam); this.ctx = this.cv.getContext('2d');
    this.G = { x: 294, y: 236, p: 36, c: 30, cols: 37 };
    let gi = -1, last = '';
    this.cells = UNITS.map((u, i) => {
      if (u[1] !== last) { gi++; last = u[1]; }
      return { gx: this.G.x + (i % 37) * 36, gy: this.G.y + Math.floor(i / 37) * 36, g: gi,
        sx: rand(i, 1) * 1700 + 60, sy: 70 + Math.floor(rand(i, 3) * 17) * 60 - 20, sw: 60 + rand(i, 4) * 150, d: rand(i, 6) * 0.9 };
    });
    this.fi = UNITS.findIndex(u => u[0] === 'U0087');
    this.h1 = txt(el, '', '단위업무 <span class="num">703</span>개', `left:120px;top:96px;font-size:84px;font-weight:850;color:${COL.ink};letter-spacing:-0.04em`);
    this.h2 = txt(el, '', '기록물철 1,663개 · 보존기간 1년부터 영구까지', `left:126px;top:196px;font-size:34px;font-weight:600;color:#334155`);
    // 확대 카드
    this.card = txt(el, '', '', `left:560px;top:330px;width:800px;padding:40px 46px;box-sizing:border-box;background:#FBFAF6;border:3px solid ${COL.ink};border-radius:20px;box-shadow:0 30px 60px -30px rgba(15,23,42,.5)`);
    this.card.innerHTML = `
      <div class="mono" style="font-size:26px;color:${COL.blue};font-weight:500">U0087</div>
      <div style="font-size:24px;color:#475569;margin-top:6px;font-weight:600"><span class="dept">신공항추진단</span> / 신공항건설1부</div>
      <div style="font-size:58px;font-weight:850;letter-spacing:-0.03em;margin-top:6px;color:${COL.ink}">신공항 건설사업관리</div>
      <div class="dv" style="height:2px;background:rgba(15,23,42,.18);margin:26px 0 22px"></div>
      <div class="frow" style="display:flex;align-items:baseline;gap:16px"><span class="mono" style="font-size:24px;color:${COL.blue}">F0164</span>
      <span style="font-size:36px;font-weight:800;color:${COL.ink}">제주 제2공항 사업관리</span>
      <span class="yr" style="margin-left:auto;font-size:24px;font-weight:800;color:#fff;background:${COL.blue};border-radius:8px;padding:4px 14px">30년</span></div>`;
    this.dept = this.card.querySelector('.dept');
    this.dv = this.card.querySelector('.dv'); this.frow = this.card.querySelector('.frow'); this.yr = this.card.querySelector('.yr');
    this.cover = h('div', 'full', el); this.cover.style.background = COL.night;
  },
  render(lt) {
    const c = this.ctx, G = this.G;
    c.clearRect(0, 0, 1920, 1080);
    const zp = prog(lt, 2.9, 2.4, ease.inOutCubic);   // U0087 쪽으로 다가간다
    const f = this.cells[this.fi];
    const sc = lerp(1, 6, zp) * (1 + 0.07 * prog(lt, 4.8, 3.2, ease.linear));
    const fx = f.gx + G.c / 2, fy = f.gy + G.c / 2;
    this.cam.style.transformOrigin = `${fx}px ${fy}px`;
    this.cam.style.transform = `translate(${(lerp(0, 960 - fx, zp)).toFixed(1)}px, ${(lerp(0, 540 - fy, zp)).toFixed(1)}px) scale(${sc.toFixed(4)})`;
    for (let i = 0; i < this.cells.length; i++) {
      const k = this.cells[i];
      const p = prog(lt, 0.05 + k.d * 1.45 + (k.gx - 294) / 1332 * 0.3, 0.9, ease.inOutCubic);
      const x = lerp(k.sx, k.gx, p), y = lerp(k.sy, k.gy, p);
      const w = lerp(k.sw, G.c, p), hh = lerp(3, G.c, p);
      const zf = lerp(1 - 0.9 * prog(lt, 2.6, 0.6, ease.inOutCubic), 0.5, prog(lt, 5.3, 1.4));   // U0087만 남기고 옅어진 뒤 확대   // 빠르게 움직이는 동안은 옅게(섬광 판정)
      const fade = prog(lt, 0, 0.45) * zf;
      let col = `rgba(15,23,42,${(lerp(0.13, k.g % 2 ? 0.24 : 0.13, p) * fade).toFixed(3)})`;
      if (i === this.fi && lt > 1.9) col = COL.blue;
      c.fillStyle = col;
      c.fillRect(x, y, w, hh);
    }
    inout(this.h1, lt, 0.9, 3.2, { rise: 40, lift: 80 });
    inout(this.h2, lt, 1.15, 3.2, { rise: 30, lift: 80 });
    const cp = prog(lt, 4.1, 0.6, ease.snap);
    this.card.style.opacity = cp.toFixed(3);
    this.card.style.transform = `scale(${lerp(0.04, 1, cp).toFixed(4)})`;
    this.card.style.transformOrigin = '50% 50%';
    const dvp = prog(lt, 4.9, 0.6, ease.swift);
    this.dv.style.transform = `scaleX(${dvp.toFixed(3)})`; this.dv.style.transformOrigin = '0 50%';
    const fr = prog(lt, 5.2, 0.5, ease.snap);
    this.frow.style.opacity = fr.toFixed(3); this.frow.style.transform = `translateY(${((1 - fr) * 24).toFixed(1)}px)`;
    const yp = prog(lt, 5.7, 0.4, ease.pop);
    this.yr.style.display = 'inline-block'; this.yr.style.transform = `scale(${yp.toFixed(3)})`;
    // 부서 이름이 주황으로 켜지며 다음 장면(조직변경)으로
    const hp = prog(lt, 6.4, 0.3);
    this.dept.style.background = `rgba(217,119,6,${(0.2 * hp).toFixed(3)})`;
    this.dept.style.color = hp > 0.5 ? '#9A5300' : '#475569';
    this.dept.style.outline = hp > 0.5 ? `2.5px dashed ${COL.warn}` : 'none';
    // 퇴장: 카드가 위로 밀리며 남색 면이 덮는다
    const ex = prog(lt, 7.35, 0.6, ease.swift);
    this.card.style.translate = `0 ${(-ex * 120).toFixed(1)}px`;
    this.cover.style.clipPath = `inset(0 0 ${((1 - ex) * 100).toFixed(2)}% 0)`;
  },
});

// ── s03: 조직도 — 신공항건설1부 가지가 건설사업실 아래로 옮겨 붙는다 ─────
REEL.scene({
  id: 's03', start: T('s03'), end: TE('s03'),
  setup(el) {
    el.style.background = COL.night;
    this.head = txt(el, '', '조직이 바뀌면, 분류기준표가 바뀐다', 'left:120px;top:92px;font-size:64px;font-weight:850;color:#fff;letter-spacing:-0.035em');
    this.svg = s('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080' }, el);
    css(this.svg, { position: 'absolute', left: 0, top: 0 });
    const node = (x, y, w, label, strong) => {
      const n = txt(el, '', label, `left:${x - w / 2}px;top:${y - 34}px;width:${w}px;height:68px;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:${strong ? 32 : 25}px;font-weight:${strong ? 800 : 700};color:${strong ? '#0B1222' : '#fff'};background:${strong ? '#F2EFE7' : 'rgba(255,255,255,.08)'};border:2px solid ${strong ? '#F2EFE7' : 'rgba(255,255,255,.45)'};box-sizing:border-box;letter-spacing:-0.02em`);
      return { n, x, y, w };
    };
    this.pA = node(520, 330, 340, '신공항추진단', true);
    this.pB = node(1440, 330, 340, '건설사업실', true);
    this.kids = [
      node(250, 530, 230, '신공항계획부'), node(520, 530, 230, '신공항건설1부'), node(790, 530, 230, '디지털트윈사업부'),
      node(1170, 530, 200, '건설안전부'), node(1390, 530, 200, '건설사업TF부'), node(1610, 530, 200, '공항계획부'),
    ];
    this.mv = this.kids[1];
    this.links = this.kids.map((k, i) => {
      const p = i < 3 ? this.pA : this.pB;
      return s('path', { d: `M ${p.x} ${p.y + 34} V ${p.y + 100} H ${k.x} V ${k.y - 34}`, fill: 'none', stroke: 'rgba(255,255,255,.5)', 'stroke-width': 2.5 }, this.svg);
    });
    this.newLink = s('path', { fill: 'none', stroke: COL.blue, 'stroke-width': 4 }, this.svg);
    // 옮겨 가는 부서에 붙은 단위업무 행
    this.rows = [['U0087', '신공항 건설사업관리', '확정안', 'ok'], ['U0086', '신공항 건설사업관리(1부, 2부)', '검토필요', 'warn']].map((r, i) => {
      const e = txt(el, '', `<span class="mono" style="color:#8EA2FF;font-size:20px;margin-right:12px">${r[0]}</span>${r[1]}`,
        `width:420px;height:54px;display:flex;align-items:center;padding:0 16px;box-sizing:border-box;border-radius:8px;font-size:23px;font-weight:600;color:#fff;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.2)`);
      const st = txt(el, 'stamp', r[2], `font-size:22px;color:${COL[r[3]]};background:#0B1222`);
      return { e, st, c: r[3], dy: 610 + i * 64 };
    });
    this.e2node = txt(el, '', '스마트공항추진실 / 데이터융합부', 'left:1300px;top:812px;width:500px;height:62px;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:26px;font-weight:800;color:#0B1222;background:#F2EFE7');
    this.e2row = txt(el, '', `<span class="mono" style="color:#8EA2FF;font-size:20px;margin-right:12px">U0079</span>공항BIM사업운영관리`,
      'width:420px;height:54px;display:flex;align-items:center;padding:0 16px;box-sizing:border-box;border-radius:8px;font-size:23px;font-weight:600;color:#fff;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.2)');
    this.e2tag = txt(el, 'tag', 'E02 업무이관 · 확신도 보통', `left:1300px;top:752px;color:#fff;background:${COL.blue}`);
    this.e2st = txt(el, 'stamp', '확정안', `font-size:22px;color:${COL.ok};background:#0B1222`);
    this.tag = txt(el, 'tag', 'E01 상위조직변경 · 확신도 높음', `left:120px;top:900px;color:#fff;background:${COL.blue}`);
    this.note = txt(el, '', '연결된 단위업무를 찾아 고칠 안을 만들고, 검증 에이전트가 다시 본다', 'left:120px;top:960px;font-size:26px;font-weight:600;color:rgba(255,255,255,.7)');
  },
  render(lt) {
    inout(this.head, lt, 0.2, 7.7, { rise: 30, lift: 60 });
    [this.pA, this.pB].forEach((p, i) => { const v = prog(lt, 0.35 + i * 0.1, 0.4, ease.pop); p.n.style.opacity = v; p.n.style.transform = `scale(${lerp(0.8, 1, v)})`; });
    this.links.forEach((l, i) => {
      const L = l.getTotalLength(), p = prog(lt, 0.6 + i * 0.06, 0.5, ease.inOutCubic);
      l.style.strokeDasharray = `${L} ${L}`; l.style.strokeDashoffset = ((1 - p) * L).toFixed(1);
    });
    this.kids.forEach((k, i) => { const v = prog(lt, 0.8 + i * 0.06, 0.4, ease.pop); k.n.style.opacity = v; });
    // 이동: 2.2초에 떨어져 나와 3.8초에 건설사업실 아래(1900 자리) 도착
    const lift = prog(lt, 2.2, 0.35, ease.snap);
    const mv = prog(lt, 2.55, 1.25, ease.swift);
    const y = 530 - lift * 26 * (1 - mv) - Math.sin(mv * Math.PI) * 110;
    // 건설사업실 자식들은 오른쪽으로 비켜 자리를 낸다
    const shift = prog(lt, 2.7, 0.9, ease.swift);
    [3, 4, 5].forEach(i => { this.kids[i].n.style.transform = `translateX(${(shift * 100).toFixed(1)}px)`; });
    this.links.slice(3).forEach((l, j) => {
      const k = this.kids[3 + j];
      l.setAttribute('d', `M ${this.pB.x} ${this.pB.y + 34} V ${this.pB.y + 100} H ${(k.x + shift * 100).toFixed(1)} V ${k.y - 34}`);
    });
    const fx = lerp(520, 1060, mv);
    this.mv.n.style.left = (fx - this.mv.w / 2).toFixed(1) + 'px';
    this.mv.n.style.top = (y - 34).toFixed(1) + 'px';
    this.mv.n.style.borderColor = lt > 2.2 ? COL.warn : 'rgba(255,255,255,.45)';
    this.mv.n.style.background = lt > 2.2 ? 'rgba(217,119,6,.18)' : 'rgba(255,255,255,.08)';
    if (mv >= 1) { this.mv.n.style.borderColor = COL.blue; this.mv.n.style.background = 'rgba(36,67,240,.35)'; }
    // 옛 연결은 끊어진다(주홍 점선으로 바뀌었다 사라짐)
    const old = this.links[1];
    old.style.stroke = lt > 2.2 ? COL.bad : 'rgba(255,255,255,.5)';
    old.style.opacity = (1 - prog(lt, 2.4, 0.5)).toFixed(3);
    // 새 연결: 건설사업실 → 옮긴 부서
    const np = prog(lt, 3.8, 0.5, ease.inOutCubic);
    const d = `M ${this.pB.x} ${this.pB.y + 34} V ${this.pB.y + 100} H 1060 V 496`;
    this.newLink.setAttribute('d', d);
    const L = this.newLink.getTotalLength();
    this.newLink.style.strokeDasharray = `${L} ${L}`; this.newLink.style.strokeDashoffset = ((1 - np) * L).toFixed(1);
    // 단위업무 행: 부서를 따라 움직이고, 도착 뒤 판정 도장
    this.rows.forEach((r, i) => {
      const v = prog(lt, 1.2 + i * 0.1, 0.4);
      r.e.style.opacity = v.toFixed(3);
      const rx = fx - 210, ry = r.dy + (y - 530);
      r.e.style.left = rx.toFixed(1) + 'px'; r.e.style.top = ry.toFixed(1) + 'px';
      r.e.style.borderColor = lt > 2.2 ? COL.warn : 'rgba(255,255,255,.2)';
      if (lt > 4.6 + i * 0.35) r.e.style.borderColor = COL[r.c];
      const t0 = 4.6 + i * 0.35;
      if (lt < t0) { r.st.style.opacity = 0; } else {
        const k = kf(lt, [[t0, 1.6], [t0 + 0.14, 0.95, ease.inQuad], [t0 + 0.26, 1, ease.outQuad]]);
        r.st.style.opacity = clamp((lt - t0) / 0.06);
        r.st.style.left = (rx + 440).toFixed(1) + 'px'; r.st.style.top = (ry + 4).toFixed(1) + 'px';
        r.st.style.transform = `rotate(-6deg) scale(${k.toFixed(4)})`;
      }
    });
    // E02: 디지털트윈사업부의 KAC-BIM 단위업무가 데이터융합부로 옮겨 간다
    inout(this.e2node, lt, 4.4, 7.7, { rise: 24, lift: 40 });
    inout(this.e2tag, lt, 4.5, 7.7, { rise: 16, lift: 40 });
    const ea = prog(lt, 4.2, 0.4), emy = prog(lt, 4.9, 0.5, ease.swift), em = prog(lt, 5.2, 1.0, ease.swift);
    const ex = lerp(580, 1300, em), ey = lerp(800, 896, emy);
    this.e2row.style.left = ex.toFixed(1) + 'px'; this.e2row.style.top = ey.toFixed(1) + 'px';
    this.e2row.style.opacity = (ea * (1 - prog(lt, 7.6, 0.3))).toFixed(3);
    this.e2row.style.borderColor = lt > 4.9 ? (em >= 1 && lt > 6.3 ? COL.ok : COL.warn) : 'rgba(255,255,255,.2)';
    if (lt < 6.3) this.e2st.style.opacity = 0; else {
      const k = kf(lt, [[6.3, 1.6], [6.44, 0.95, ease.inQuad], [6.56, 1, ease.outQuad]]);
      this.e2st.style.opacity = clamp((lt - 6.3) / 0.06) * (1 - prog(lt, 7.6, 0.3));
      this.e2st.style.left = (ex + 436).toFixed(1) + 'px'; this.e2st.style.top = (ey + 6).toFixed(1) + 'px';
      this.e2st.style.transform = `rotate(-6deg) scale(${k.toFixed(4)})`;
    }
    inout(this.tag, lt, 2.3, 7.7, { rise: 20, lift: 40 });
    inout(this.note, lt, 5.4, 7.7, { rise: 20, lift: 40 });
  },
});

// ── s04: 클립(새벽 공항) 위 문장 ───────────────────────────────────────
REEL.scene({
  id: 's04', start: T('s04'), end: TE('s04'),
  setup(el) {
    el.style.background = '#000';
    this.g = h('div', 'full', el);
    this.g.style.background = 'linear-gradient(90deg, rgba(0,0,0,.0) 0%, rgba(0,0,0,0) 100%)';
    this.l1 = txt(el, '', '분류 판단은 문서마다,', 'left:120px;top:690px;font-size:76px;font-weight:850;color:#fff;letter-spacing:-0.035em');
    this.l2 = txt(el, '', '조직이 바뀔 때마다 다시 필요하다', 'left:120px;top:790px;font-size:76px;font-weight:850;color:#fff;letter-spacing:-0.035em');
    this.w1 = split(this.l1, 'char', { mask: true });
    this.w2 = split(this.l2, 'char', { mask: true });
  },
  render(lt) {
    const sh = (arr, t0) => arr.forEach((c, i) => { const p = prog(lt, t0 + i * 0.025, 0.55, ease.snap); c.style.transform = `translateY(${((1 - p) * 110).toFixed(1)}%)`; });
    sh(this.w1, 0.25); sh(this.w2, 1.05);
    const out = prog(lt, 3.55, 0.4, ease.exit);
    this.l1.style.opacity = this.l2.style.opacity = (1 - out).toFixed(3);
    this.l1.style.transform = this.l2.style.transform = `translateY(${(-out * 40).toFixed(1)}px)`;
  },
});

// ── s05: 에이전트 18개가 생성·검증·중재·작성 줄로 정렬 ─────────────────
const KO = { 'org-change-interpreter': '조직변경 해석', 'unit-impact-analyst': '영향 분석', 'change-proposal-verifier': '변경안 검증', 'impact-report-writer': '영향 보고서',
  'record-assigner': '철 배정', 'assignment-verifier': '배정 검증', 'assignment-arbiter': '배정 중재', 'blind-classifier': '가린 분류', 'label-judge': '분류 판정',
  'correction-challenger': '정정 반박', 'org-diagnostician': '조직 진단', 'regulation-constraint-checker': '규정 제약', 'org-option-designer': '대안 설계',
  'org-option-critic': '대안 반박', 'executive-report-writer': '경영 보고서', 'work-cluster-analyst': '업무 군집', 'unit-task-namer': '이름 제안', 'naming-reviewer': '이름 검토' };
const AG = [
  // [이름, 하네스 번호, 역할]
  ['org-change-interpreter', 0, 0], ['unit-impact-analyst', 0, 0], ['change-proposal-verifier', 0, 1], ['impact-report-writer', 0, 3],
  ['record-assigner', 1, 0], ['assignment-verifier', 1, 1], ['assignment-arbiter', 1, 2],
  ['blind-classifier', 2, 0], ['label-judge', 2, 2], ['correction-challenger', 2, 1],
  ['org-diagnostician', 3, 0], ['regulation-constraint-checker', 3, 0], ['org-option-designer', 3, 0], ['org-option-critic', 3, 1], ['executive-report-writer', 3, 3],
  ['work-cluster-analyst', 4, 0], ['unit-task-namer', 4, 0], ['naming-reviewer', 4, 1],
];
const ROLE = [['생성', COL.blue], ['검증', COL.bad], ['중재', COL.warn], ['작성', COL.ink]];
REEL.scene({
  id: 's05', start: T('s05'), end: TE('s05'),
  setup(el) {
    el.style.background = COL.paper;
    const root = el; el = h('div', 'full', root); this.cam = el;
    this.coverRoot = root;
    this.h1 = txt(el, '', '에이전트 <span class="num">18</span>개', `left:120px;top:84px;font-size:88px;font-weight:850;color:${COL.ink};letter-spacing:-0.04em`);
    this.h2 = txt(el, '', '만드는 쪽과 반박하는 쪽을 나누고, 최종 판정은 따로 둔다', 'left:124px;top:192px;font-size:30px;font-weight:600;color:#334155');
    const counts = [0, 0, 0, 0];
    this.nodes = AG.map((a, i) => {
      const r = a[2], j = counts[r]++;
      const n = h('div', 'node', el, a[0].replace(/-/g, '-<br>').replace(/<br>([^<]*)$/, '$1').replace(/-<br>/g, '-<br>'));
      n.innerHTML = `<div style="font-family:var(--sans);font-size:23px;font-weight:800;letter-spacing:-0.03em;line-height:1.15;white-space:nowrap">${KO[a[0]]}</div>`
        + `<div style="font-size:12.5px;line-height:1.2;margin-top:6px;opacity:.8;word-break:break-all">${a[0]}</div>`;
      n.style.borderColor = ROLE[r][1]; n.style.color = r === 0 ? '#1A2FB8' : r === 1 ? '#B4232A' : r === 2 ? '#9A5300' : '#334155';
      n.style.width = '158px'; n.style.height = '76px';
      const tx = 300 + j * 168, ty = 300 + r * 150;
      return { n, tx, ty, sx: 140 + rand(i, 11) * 1560, sy: 300 + rand(i, 12) * 600, sr: (rand(i, 13) - 0.5) * 40, h: a[1], r };
    });
    this.rl = ROLE.map((r, i) => txt(el, '', `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${r[1]};margin-right:12px;vertical-align:2px"></span>${r[0]} <span class="num" style="color:#64748B;font-weight:600">${[9, 5, 2, 2][i]}</span>`,
      `left:120px;top:${300 + i * 150 + 14}px;font-size:32px;font-weight:800;color:${COL.ink}`));
    this.hs = ['조직변경', '배정', '점검', '조직설계', '이름제안'];
    // 한 하네스의 생성 → 검증 → 중재 흐름을 선으로 보인다(kac-record-assign)
    this.svg = s('svg', { width: 1920, height: 1080 }, el);
    css(this.svg, { position: 'absolute', left: 0, top: 0, overflow: 'visible' });
    const A = this.nodes[4], V = this.nodes[5], J = this.nodes[6];
    const cx = n => n.tx + 79, top = n => n.ty, bot = n => n.ty + 76;
    this.f1 = s('path', { d: `M ${cx(A)} ${bot(A)} C ${cx(A)} ${bot(A) + 50}, ${cx(V)} ${top(V) - 50}, ${cx(V)} ${top(V)}`, fill: 'none', stroke: COL.ink, 'stroke-width': 3 }, this.svg);
    this.f2 = s('path', { d: `M ${cx(V)} ${bot(V)} C ${cx(V)} ${bot(V) + 50}, ${cx(J)} ${top(J) - 50}, ${cx(J)} ${top(J)}`, fill: 'none', stroke: COL.ink, 'stroke-width': 3 }, this.svg);
    this.dots = [0, 1, 2].map(() => s('circle', { r: 7, fill: COL.blue }, this.svg));
    this.fl = txt(el, '', 'kac-record-assign 의 흐름', `font-size:22px;font-weight:700;color:${COL.ink};font-family:var(--mono)`);
    this.st = [['수정필요', 'warn', 5], ['반박', 'bad', 9], ['타당', 'ok', 2]].map(r => ({ e: txt(el, 'stamp', r[0], `font-size:24px;color:${COL[r[1]]};background:${COL.paper}`), n: this.nodes[r[2]] }));
    this.cover = h('div', 'full', root); this.cover.style.background = '#000';
  },
  render(lt) {
    // 카메라: 제목 왼쪽 위를 고정점으로 흐름 영역(왼쪽 세 열)에 다가갔다가 돌아온다
    // 흐름(배정 → 검증 → 중재)에 쓰는 세 노드만 남기고 나머지를 흐리게 했다가 되돌린다
    const z = kf(lt, [[4.0, 0], [4.6, 1, ease.inOutCubic], [7.6, 1], [8.3, 0, ease.inOutCubic]]);
    const zc = kf(lt, [[3.6, 0], [5.0, 1, ease.inOutCubic], [7.6, 1], [8.6, 0, ease.inOutCubic]]);
    this.cam.style.transformOrigin = '700px 520px';
    this.cam.style.transform = `scale(${(1 + 0.06 * zc).toFixed(4)})`;
    inout(this.h1, lt, 0.0, null, { rise: 40 });
    inout(this.h2, lt, 0.35, null, { rise: 24 });
    const snapT = 2.0;
    this.nodes.forEach((n, i) => {
      const a = prog(lt, 0.1 + i * 0.05, 0.35, ease.pop);
      const p = spring(lt, snapT + n.r * 0.12 + (i % 5) * 0.03, 2.0, 0.55);
      const drift = (1 - clamp(p)) * 40;
      const x = lerp(n.sx, n.tx, p) + noise(lt * 0.9, i) * drift + (1 - clamp(p)) * (lt * 22 * (rand(i, 14) - 0.5)), y = lerp(n.sy, n.ty, p) + noise(lt * 0.9 + 3, i) * drift;
      const focus = [4, 5, 6, 2, 9].includes(i);
      n.n.style.opacity = (a * (focus ? 1 : 1 - 0.7 * z)).toFixed(3);
      n.n.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(n.sr * (1 - clamp(p))).toFixed(2)}deg) scale(${lerp(0.7, 1, a).toFixed(3)})`;
      // 흐름에 쓰는 세 노드는 강조
      const on = lt > 4.4 && [4, 5, 6].includes(i);
      n.n.style.boxShadow = on ? '0 0 0 5px rgba(36,67,240,.18)' : 'none';
      n.n.style.background = on ? '#fff' : '#FBFAF6';
    });
    this.rl.forEach((r, i) => inout(r, lt, 2.2 + i * 0.1, null, { rise: 0, x: -30, blur: 6 }));
    [this.f1, this.f2].forEach((f, i) => {
      const L = f.getTotalLength(), p = prog(lt, 4.4 + i * 0.4, 0.5, ease.inOutCubic);
      f.style.strokeDasharray = `${L} ${L}`; f.style.strokeDashoffset = ((1 - p) * L).toFixed(1);
    });
    this.dots.forEach((d, i) => {
      const run = lt - 5.4 - i * 0.6;
      if (run < 0) { d.setAttribute('opacity', 0); return; }
      const u = (run % 1.6) / 1.6, path = u < 0.5 ? this.f1 : this.f2, uu = u < 0.5 ? u * 2 : (u - 0.5) * 2;
      const pt = path.getPointAtLength(uu * path.getTotalLength());
      d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); d.setAttribute('opacity', 1);
    });
    const A = this.nodes[4];
    this.fl.style.left = (A.tx + 180) + 'px'; this.fl.style.top = (A.ty + 74) + 'px';
    this.fl.style.opacity = prog(lt, 4.6, 0.4).toFixed(3);
    this.st.forEach((st, i) => {
      const t0 = 5.9 + i * 0.45;
      st.e.style.left = (st.n.tx + 18) + 'px'; st.e.style.top = (st.n.ty - 58) + 'px';
      if (lt < t0) { st.e.style.opacity = 0; return; }
      const k = kf(lt, [[t0, 1.6], [t0 + 0.14, 0.95, ease.inQuad], [t0 + 0.26, 1, ease.outQuad]]);
      st.e.style.opacity = clamp((lt - t0) / 0.06); st.e.style.transform = `rotate(-7deg) scale(${k.toFixed(4)})`;
    });
    // 퇴장: 검정 면이 오른쪽에서 덮는다(다음 클립 구간)
    const p = prog(lt, 9.35, 0.6, ease.swift);
    this.cover.style.clipPath = `inset(0 0 0 ${((1 - p) * 100).toFixed(2)}%)`;
  },
});

// ── s06: 클립(운영센터) 위 과제 네 가지 ──────────────────────────────
REEL.scene({
  id: 's06', start: T('s06'), end: TE('s06'),
  setup(el) {
    el.style.background = '#000';
    this.k = txt(el, '', '네 가지 과제', 'left:120px;top:320px;font-size:34px;font-weight:700;color:rgba(255,255,255,.75)');
    this.items = ['조직변경 영향도', '생산현황 분류 정정', '전략적 조직 설계', '단위업무명 제안'].map((t, i) => {
      const e = txt(el, '', `<span class="num" style="font-size:40px;font-weight:700;color:rgba(255,255,255,.6);margin-right:26px;vertical-align:14px">${i + 1}</span>${t}`,
        `left:120px;top:${380 + i * 120}px;font-size:96px;font-weight:850;color:#fff;letter-spacing:-0.04em;white-space:nowrap`);
      return e;
    });
  },
  render(lt) {
    inout(this.k, lt, 0.2, 5.75, { rise: 20, lift: 40 });
    this.items.forEach((e, i) => {
      const t0 = 0.5 + i * 1.0;
      const p = prog(lt, t0, 0.55, ease.snap);
      e.style.opacity = p.toFixed(3);
      e.style.transform = `translateX(${((1 - p) * -60).toFixed(1)}px)`;
      e.style.filter = p < 1 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : 'none';
      // 다음 항목이 나오면 앞 항목은 작아지고 흐려진다
      const dim = prog(lt, t0 + 1.0, 0.4);
      const last = i === 3;
      e.style.color = `rgba(255,255,255,${(1 - (last ? 0 : dim) * 0.55).toFixed(3)})`;
      const out = prog(lt, 5.45 + i * 0.04, 0.4, ease.exit);
      if (out > 0) { e.style.opacity = (1 - out).toFixed(3); e.style.transform = `translateY(${(-out * 50).toFixed(1)}px)`; }
    });
  },
});

// ── s07: 제목 ───────────────────────────────────────────────────────
REEL.scene({
  id: 's07', start: T('s07'), end: 48,
  setup(el) {
    el.style.background = COL.blue;
    this.cv = canvas(el); this.ctx = this.cv.getContext('2d');
    this.t1 = txt(el, '', '기록물분류', 'left:112px;top:300px;font-size:176px;font-weight:900;color:#fff;letter-spacing:-0.05em;line-height:1');
    this.t2 = txt(el, '', '하네스 5종', 'left:112px;top:490px;font-size:176px;font-weight:900;color:#fff;letter-spacing:-0.05em;line-height:1');
    this.c1 = split(this.t1, 'char', { mask: true }); this.c2 = split(this.t2, 'char', { mask: true });
    this.sub = txt(el, '', '조직변경 영향도 · 기록물철 배정 · 분류 점검 · 조직 설계 · 단위업무명 제안', 'left:120px;top:720px;font-size:38px;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:-0.02em');
    this.meta = txt(el, '', '에이전트 18개 · 단위업무 703개 · 문서 1,076,767건 · 2026년 11월', 'left:120px;top:796px;font-size:32px;font-weight:600;color:rgba(255,255,255,.8)');
  },
  render(lt) {
    const c = this.ctx;
    c.clearRect(0, 0, 1920, 1080);
    // 오른쪽 703칸(흰색 옅게). 칸마다 아주 느리게 밝기가 바뀐다
    for (let i = 0; i < 703; i++) {
      const x = 1290 + (i % 19) * 27, y = 70 + Math.floor(i / 19) * 25.5;
      const p = prog(lt, 0.2 + (i % 19) * 0.02 + Math.floor(i / 19) * 0.012, 0.5);
      if (p <= 0) continue;
      const a = 0.10 + 0.10 * (0.5 + 0.5 * Math.sin(lt * 0.9 + rand(i, 21) * 6.28));
      c.fillStyle = `rgba(255,255,255,${(a * p).toFixed(3)})`;
      c.fillRect(x, y, 20 * p, 18 * p);
    }
    const sh = (arr, t0) => arr.forEach((ch, i) => { const p = prog(lt, t0 + i * 0.05, 0.7, ease.snap); ch.style.transform = `translateY(${((1 - p) * 112).toFixed(1)}%)`; });
    sh(this.c1, 0.15); sh(this.c2, 0.45);
    const push = 1 + 0.03 * prog(lt, 0, 6, ease.linear);
    [this.t1, this.t2].forEach(e => { e.style.transformOrigin = '0 50%'; e.style.transform = `scale(${push.toFixed(4)})`; });
    inout(this.sub, lt, 1.2, null, { rise: 24 });
    inout(this.meta, lt, 1.5, null, { rise: 18 });
  },
});

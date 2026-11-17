/* 시간 함수 헬퍼 — showreel 엔진(engine.js)에서 옮겨 온 코드. 화면은 시간의 순수 함수로 그린다. */
(function () {
  'use strict';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const map = (x, a, b, c, d, e) => lerp(c, d, (e || (p => p))(clamp((x - a) / (b - a))));

  // 큐빅 베지어 이징 (CSS cubic-bezier 와 같은 정의)
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t;
    const sy = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return p => {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      let t = p;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - p;
        if (Math.abs(e) < 1e-6) break;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return sy(clamp(t));
    };
  }

  const ease = {
    linear: p => p,
    inQuad: p => p * p,
    outQuad: p => 1 - (1 - p) * (1 - p),
    inOutQuad: p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
    inCubic: p => p * p * p,
    outCubic: p => 1 - Math.pow(1 - p, 3),
    inOutCubic: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    inQuart: p => p ** 4,
    outQuart: p => 1 - Math.pow(1 - p, 4),
    inOutQuart: p => (p < 0.5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2),
    outQuint: p => 1 - Math.pow(1 - p, 5),
    inExpo: p => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
    outExpo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    inOutExpo: p => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2),
    outBack: (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
    inBack: (p, s = 1.70158) => (s + 1) * p * p * p - s * p * p,
    outElastic: p => (p <= 0 || p >= 1 ? clamp(p) : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    inOutSine: p => -(Math.cos(Math.PI * p) - 1) / 2,
    // 모션 디자인에서 자주 쓰는 곡선(After Effects 감성)
    snap: bezier(0.16, 1, 0.3, 1),      // 강한 감속 등장 — 기본 등장 곡선
    swift: bezier(0.83, 0, 0.17, 1),    // 강한 in-out — 와이프·카메라 이동
    exit: bezier(0.7, 0, 0.84, 0),      // 가속 퇴장
    pop: bezier(0.34, 1.56, 0.64, 1),   // 살짝 넘쳤다 돌아옴 — 칩·아이콘
  };

  // start부터 dur 동안 0→1 (이징 적용)
  const prog = (t, start, dur, e = ease.snap) => e(clamp((t - start) / Math.max(1e-6, dur)));
  // 등장·퇴장 창: a에서 inDur 동안 0→1, b에서 outDur 동안 1→0
  const win = (t, a, b, inDur = 0.4, outDur = 0.3, ei = ease.snap, eo = ease.exit) =>
    Math.min(prog(t, a, inDur, ei), 1 - prog(t, b - outDur, outDur, eo));
  // 키프레임 보간: kf(t, [[0, 0], [0.5, 1, ease.outExpo], [2, 0]]) — 각 구간 이징은 도착 키프레임에 적는다
  function kf(t, frames) {
    if (t <= frames[0][0]) return frames[0][1];
    for (let i = 1; i < frames.length; i++) {
      const [t1, v1, e] = frames[i];
      const [t0, v0] = frames[i - 1];
      if (t <= t1) return lerp(v0, v1, (e || ease.inOutCubic)(clamp((t - t0) / Math.max(1e-6, t1 - t0))));
    }
    return frames[frames.length - 1][1];
  }
  // 감쇠 스프링(0→1). 정지 상태에서 t0에 출발. f=진동수(Hz), z=감쇠비
  function spring(t, t0 = 0, f = 2.2, z = 0.42) {
    const dt = t - t0;
    if (dt <= 0) return 0;
    const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + ((z * w) / wd) * Math.sin(wd * dt));
  }
  // 시드 고정 의사 난수 [0, 1)
  const rand = (i, salt = 0) => {
    const x = Math.sin(i * 12.9898 + salt * 78.233 + 0.1) * 43758.5453;
    return x - Math.floor(x);
  };
  // 부드러운 1차원 잡음 [-1, 1] — 손떨림·드리프트용
  const noise = (t, seed = 0) =>
    Math.sin(t * 1.31 + seed * 12.9) * 0.5 + Math.sin(t * 2.17 + seed * 7.3) * 0.3 + Math.sin(t * 3.73 + seed * 3.1) * 0.2;

  // 글자(또는 단어) 단위로 쪼개 span 배열을 돌려준다. 한글 음절·이모지는 한 글자.
  // mode: 'char' | 'word'. 마스크 리빌을 쓰려면 opts.mask = true (글자마다 overflow:hidden 래퍼)
  function split(el, mode = 'char', opts = {}) {
    const text = el.textContent;
    el.textContent = '';
    const units = [];
    const add = (str, isSpace) => {
      if (isSpace) { el.appendChild(document.createTextNode(str)); return; }
      let host = el;
      if (opts.mask) {
        host = document.createElement('span');
        host.className = 'mask';
        host.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding:.12em .04em .18em;margin:-.12em -.04em -.18em';
        el.appendChild(host);
      }
      const s = document.createElement('span');
      s.className = mode === 'word' ? 'w' : 'ch';
      s.style.display = 'inline-block';
      s.style.whiteSpace = 'pre';
      s.textContent = str;
      host.appendChild(s);
      units.push(s);
    };
    if (mode === 'word') {
      for (const part of text.split(/(\s+)/)) if (part) add(part, /^\s+$/.test(part));
    } else {
      const seg = new Intl.Segmenter('ko', { granularity: 'grapheme' });
      for (const { segment } of seg.segment(text)) add(segment, segment === ' ');
    }
    return units;
  }
  // i번째 요소의 지연 진행률
  const stagger = (t, start, each, dur, i, e = ease.snap) => prog(t, start + i * each, dur, e);

  // 등장과 퇴장을 모두 움직임으로: a 에서 아래·흐림·확대 상태로 들어오고, b 에서 위로 밀리며 줄고 흐려지며 나간다.
  // 투명도만 바꾸는 페이드는 화면이 멈춘 것처럼 보인다. 반환값은 보이는 정도(0~1).
  //   o: { inDur 0.45, outDur 0.4, rise 60, lift 140, blur 12, from 1.06, to 0.9, x 0, dx 0 }
  function inout(el, t, a, b, o = {}) {
    const pi = prog(t, a, o.inDur ?? 0.45, ease.snap);
    const po = b == null ? 0 : prog(t, b - (o.outDur ?? 0.4), o.outDur ?? 0.4, ease.exit);
    const v = Math.min(pi, 1 - po);
    if (v <= 0.001) { if (el.style.opacity !== '0') el.style.opacity = '0'; return 0; }
    const y = (1 - pi) * (o.rise ?? 60) - po * (o.lift ?? 140);
    const x = (1 - pi) * (o.x ?? 0) + po * (o.dx ?? 0);
    const s = lerp(o.from ?? 1.06, 1, pi) * lerp(1, o.to ?? 0.9, po);
    const bl = (1 - pi) * (o.blur ?? 12) + po * (o.blur ?? 12) * 0.8;
    el.style.opacity = v.toFixed(3);
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
    el.style.filter = bl > 0.3 ? `blur(${bl.toFixed(1)}px)` : 'none';
    return v;
  }

  // 나레이션 줄의 글자별 시작 시각(어절 시각을 글자 수로 나눔). split(el,'char') 결과와 함께 쓴다.
  const count = (p, to, { decimals = 0, comma = true, from = 0 } = {}) => {
    const v = lerp(from, to, clamp(p));
    return comma
      ? v.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : v.toFixed(decimals);
  };
  // 스크램블 디코드: p=0이면 무작위 글리프, p=1이면 최종 문자열. 한글은 한글 음절로, 라틴은 라틴으로 섞는다.
  const GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@/<>=+*';
  function scramble(final, p, t, seed = 1) {
    const a = [...final];
    const f = Math.floor(t * 30);
    return a.map((ch, i) => {
      if (ch === ' ' || p >= 1 || p >= (i / a.length) * 0.75 + 0.25) return ch;   // p=1 이면 반드시 원문
      const r = rand(i * 977 + f * 131, seed);
      if (/[가-힣]/.test(ch)) return String.fromCharCode(0xac00 + Math.floor(r * 11172));
      return GLY[Math.floor(r * GLY.length)];
    }).join('');
  }
  // 충격 흔들림: hits = [[t0, amp(px), decay(초)], ...] → {x, y, r}
  function shake(t, hits, freq = 75) {
    let x = 0, y = 0, r = 0;
    for (const [t0, amp = 12, d = 0.45] of hits) {
      const dt = t - t0;
      if (dt < 0 || dt > d * 2.5) continue;
      const k = amp * Math.exp(-(dt / d) * 5);
      x += k * Math.sin(dt * freq + t0 * 3);
      y += k * Math.cos(dt * (freq * 0.87) + t0 * 5);
      r += k * 0.03 * Math.sin(dt * freq * 0.7);
    }
    return { x, y, r };
  }
  // 펄스: 히트 시각마다 1에서 지수 감쇠 (빛·스케일 반응용)
  const pulse = (t, hits, decay = 0.25) => {
    let v = 0;
    for (const h of hits) { const dt = t - h; if (dt >= 0) v = Math.max(v, Math.exp(-dt / decay)); }
    return v;
  };

  const css = (el, o) => { for (const k in o) el.style[k] = o[k]; return el; };
  const h = (tag, cls, parent, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    if (parent) parent.appendChild(el);
    return el;
  };
  const svgNS = 'http://www.w3.org/2000/svg';
  const s = (tag, attrs, parent) => {
    const el = document.createElementNS(svgNS, tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  // 값이 바뀔 때만 쓰는 setter (DOM 쓰기 비용 절약)
  const set = (el, prop, v) => { if (el.style[prop] !== v) el.style[prop] = v; };
  window.RH = { ease, bezier, prog, win, kf, spring, clamp, lerp, map, rand, noise, split, stagger, inout, count, scramble, shake, pulse, css, h, s, set };
})();

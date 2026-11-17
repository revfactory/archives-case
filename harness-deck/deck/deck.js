/* 덱 런타임: 장 등록, 넘김, 전환, 영상 장, 발표자 노트, 검수 모드.
   장의 화면은 render(lt) 에서 lt(장에 들어온 뒤 지난 초)만으로 그린다. 같은 lt 면 같은 화면이 나와야
   검수 모드(?still=1)에서 찍은 스틸과 발표 화면이 일치한다. */
(function () {
  'use strict';
  const { ease, clamp } = RH;
  const W = 1920, H = 1080;
  const TRANS = 0.62;   // 장 전환 시간(초)
  const LEAD = 0.18;    // 전환이 반쯤 진행된 뒤부터 장의 시간이 흐른다
  const slides = [];
  const qs = new URLSearchParams(location.search);
  const STILL = qs.has('still');
  const REDUCED = !STILL && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DECK = (window.DECK = { slides, ready: false, W, H });
  DECK.slide = def => { slides.push(def); return def; };

  let wrap, stage, notesEl, helpEl, edgeEl, progEl, overlay;
  let cur = -1, enteredAt = 0, trans = null, keyBuf = '', keyTimer = 0;
  const now = () => performance.now() / 1000;

  function fit() {
    const g = STILL || document.fullscreenElement ? 0 : 16;
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min((vw - 2 * g) / W, (vh - 2 * g) / H);
    wrap.style.transform = `translate(${((vw - W * s) / 2).toFixed(2)}px, ${((vh - H * s) / 2).toFixed(2)}px) scale(${s.toFixed(5)})`;
  }

  function buildSlide(def, i) {
    const el = RH.h('div', 'slide bg-' + (def.bg || 'paper'), stage);
    el.dataset.i = i;
    const hz = def.harness && window.K && K.HZ ? K.HZ[def.harness] : null;
    if (hz) el.classList.add('hz-' + def.harness);
    const root = RH.h('div', 'root', el);
    def.el = el; def.root = root; def.index = i;
    if (def.video) {
      const v = RH.h('video', 'vid', root);
      v.src = def.video; if (def.poster) v.poster = def.poster;
      v.preload = i < 2 ? 'auto' : 'metadata'; v.playsInline = true; v.setAttribute('playsinline', '');
      def.videoEl = v;
      const ctl = RH.h('div', 'vid-ctrl', root);
      const bReplay = RH.h('button', '', ctl, '처음부터');
      const bSound = RH.h('button', '', ctl, '소리 끄기');
      bReplay.type = bSound.type = 'button';
      bReplay.onclick = e => { e.stopPropagation(); v.currentTime = 0; playVideo(def, true); };
      bSound.onclick = e => { e.stopPropagation(); v.muted = !v.muted; syncSound(def); };
      def.soundBtn = bSound;
      v.addEventListener('volumechange', () => syncSound(def));
    }
    if (def.setup) {
      try { def.setup(root, def); } catch (err) { console.error('[deck] setup', def.id, err); }
    }
    // 하네스 장: 필름의 머리말처럼 오른쪽 위에 그 하네스의 작업장 그림을 둔다
    // def.wimg 로 하네스가 아닌 장에도 필름 그림을 둘 수 있다(예: 사람이 정할 것 장의 검토 책상 g07_review)
    const wimg = def.wimg || (hz && hz.img);
    if (wimg && !def.video && def.icon !== false) {
      const ic = RH.h('img', 'wicon', el);
      ic.src = 'img/' + wimg + '_c.jpg'; ic.alt = '';
      if (def.icon && typeof def.icon === 'object') Object.assign(ic.style, def.icon);
      def._wicon = ic;
    }
    if (!def.video && def.foot !== false) {
      const dark = /ink|night|blue|navy|black/.test(def.bg || '');
      const f = RH.h('div', 'foot' + (dark ? ' dark' : ''), el);
      RH.h('div', 'ch', f, def.chapter || '');
      RH.h('div', 'pg', f, `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`);
    }
  }

  function syncSound(def) { if (def.soundBtn) def.soundBtn.textContent = def.videoEl.muted ? '소리 켜기' : '소리 끄기'; }

  function playVideo(def, withSound) {
    const v = def.videoEl;
    if (withSound) v.muted = false;
    const p = v.play();
    syncSound(def);
    if (p && p.catch) p.catch(() => { overlay.hidden = false; overlay.dataset.for = def.index; });
  }

  function renderSlide(i, lt) {
    const def = slides[i];
    if (!def) return;
    if (def._wicon) {
      const p = RH.prog(lt, 0.15, 0.6, ease.outCubic);
      def._wicon.style.opacity = p.toFixed(3);
      def._wicon.style.transform = `translateY(${((1 - p) * 18).toFixed(1)}px)`;
    }
    if (!def.render) return;
    try { def.render(lt, def); } catch (err) {
      if (!def._err) { def._err = true; console.error('[deck] render', def.id, err); }
    }
  }

  function show(i, dir) {
    i = clamp(i, 0, slides.length - 1);
    if (i === cur) return;
    const prev = cur;
    const t = now();
    if (prev >= 0) {
      const pd = slides[prev];
      if (pd.videoEl) pd.videoEl.pause();
      if (pd.onLeave) pd.onLeave(pd);
    }
    overlay.hidden = true;
    cur = i;
    const def = slides[i];
    document.body.className = document.body.className.replace(/\bbg-\S+/g, '').trim() + ' bg-' + (def.bg || 'paper');
    if (STILL) document.body.classList.add('still');
    def.el.style.display = 'block';
    def.el.style.zIndex = 2;
    def._err = false;
    if (prev >= 0 && !REDUCED && !STILL) {
      if (trans) finishTrans();
      slides[prev].el.style.zIndex = 1;
      trans = { from: prev, to: i, t0: t, dir: dir || (i > prev ? 1 : -1), fromEntered: enteredAt };
    } else if (prev >= 0) {
      slides[prev].el.style.display = 'none';
    }
    enteredAt = t;
    if (def.videoEl && !STILL) { def.videoEl.currentTime = 0; playVideo(def, true); }
    if (def.onEnter) def.onEnter(def);
    progEl.style.width = (((i + 1) / slides.length) * 100).toFixed(2) + '%';
    progEl.style.background = /ink|night|blue|navy|black/.test(def.bg || '') ? 'rgba(253,243,226,.45)' : accentOf(def);
    if (notesEl.classList.contains('on')) fillNotes();
    if (!STILL) { try { history.replaceState(null, '', '#p' + (i + 1)); } catch (e) { /* 미리보기 등에서 막힐 수 있다 */ } }
    if (REDUCED) renderSlide(i, 60);
  }

  function accentOf(def) { const hz = def && def.harness && window.K && K.HZ ? K.HZ[def.harness] : null; return hz ? hz.c : '#1B2A4A'; }

  function finishTrans() {
    const from = slides[trans.from], to = slides[trans.to];
    if (trans.from !== cur) from.el.style.display = 'none';
    from.el.style.transform = '';
    to.el.style.clipPath = '';
    edgeEl.style.display = 'none';
    trans = null;
  }

  function frame() {
    const t = now();
    if (trans) {
      const p = clamp((t - trans.t0) / TRANS);
      const e = ease.swift(p);
      const inc = slides[trans.to].el, out = slides[trans.from].el;
      const cut = (1 - e) * 100;
      inc.style.clipPath = trans.dir > 0 ? `inset(0 0 0 ${cut.toFixed(3)}%)` : `inset(0 ${cut.toFixed(3)}% 0 0)`;
      out.style.transform = `translateX(${(-trans.dir * e * 4).toFixed(3)}%)`;
      edgeEl.style.display = p < 1 ? 'block' : 'none';
      const x = trans.dir > 0 ? (cut / 100) * W : (1 - cut / 100) * W;
      edgeEl.style.transform = `translateX(${(x - 5).toFixed(1)}px)`;
      edgeEl.style.background = /blue|navy|ink|night/.test(slides[trans.to].bg || '') ? '#FDF3E2' : accentOf(slides[trans.to]);
      renderSlide(trans.from, t - trans.fromEntered - LEAD);
      if (p >= 1) finishTrans();
    }
    if (!REDUCED && cur >= 0) renderSlide(cur, t - enteredAt - LEAD);
    requestAnimationFrame(frame);
  }

  function next() {
    if (!overlay.hidden) { const d = slides[+overlay.dataset.for]; overlay.hidden = true; if (d) playVideo(d, true); return; }
    show(cur + 1, 1);
  }
  function prev() { show(cur - 1, -1); }
  function replay() { enteredAt = now(); const d = slides[cur]; if (d.videoEl) { d.videoEl.currentTime = 0; playVideo(d, true); } if (REDUCED) renderSlide(cur, 60); }

  function fillNotes() {
    const d = slides[cur];
    notesEl.innerHTML = `<b>${cur + 1}. ${d.title || ''}</b><br>${(d.notes || '발표자 노트 없음').replace(/\n/g, '<br>')}`;
  }
  function toggleNotes() { notesEl.classList.toggle('on'); if (notesEl.classList.contains('on')) fillNotes(); }
  function toggleFull() {
    const r = document.documentElement;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (r.requestFullscreen) r.requestFullscreen().catch(() => {});
    } catch (e) { /* 전체 화면을 막는 환경 */ }
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) {
      keyBuf += k; clearTimeout(keyTimer);
      keyTimer = setTimeout(() => { keyBuf = ''; }, 1500);
      return;
    }
    if (k === 'Enter' && keyBuf) { show(parseInt(keyBuf, 10) - 1); keyBuf = ''; e.preventDefault(); return; }
    if (['ArrowRight', 'PageDown', ' ', 'Enter', 'l', 'j'].includes(k)) { next(); e.preventDefault(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace', 'h', 'k'].includes(k)) { prev(); e.preventDefault(); }
    else if (k === 'Home') show(0);
    else if (k === 'End') show(slides.length - 1);
    else if (k === 'n' || k === 'N' || k === 'ㅜ') toggleNotes();
    else if (k === 'f' || k === 'F' || k === 'ㄹ') toggleFull();
    else if (k === 'r' || k === 'R' || k === 'ㄱ') replay();
  }

  function hashIndex() {
    const m = /^#p(\d+)$/.exec(location.hash || '');
    return m ? clamp(parseInt(m[1], 10) - 1, 0, slides.length - 1) : 0;
  }

  async function boot() {
    wrap = document.getElementById('wrap');
    stage = document.getElementById('stage');
    notesEl = document.getElementById('notes');
    helpEl = document.getElementById('help');
    edgeEl = RH.h('div', 'wipe-edge', stage);
    const pb = RH.h('div', '', stage);
    pb.style.cssText = 'position:absolute;left:0;bottom:0;height:4px;width:100%;z-index:60;pointer-events:none';
    progEl = RH.h('div', '', pb);
    progEl.style.cssText = 'height:100%;width:0;transition:width .5s';
    overlay = document.getElementById('playov');
    if (STILL) document.body.classList.add('still');
    try { await document.fonts.ready; } catch (e) { /* 폰트 API 없음 */ }
    // place: { before: 'id' } 인 장은 그 장 앞으로 옮긴다(파일 순서와 발표 순서가 다를 때)
    slides.filter(d => d.place && d.place.before).forEach(d => {
      const j = slides.findIndex(x => x.id === d.place.before);
      if (j < 0) return;
      slides.splice(slides.indexOf(d), 1);
      slides.splice(slides.findIndex(x => x.id === d.place.before), 0, d);
    });
    slides.forEach(buildSlide);
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    DECK.ready = true;
    if (STILL) {
      const s = parseInt(qs.get('s') || '1', 10) - 1;
      DECK.seek(s, parseFloat(qs.get('t') || '8'));
      return;
    }
    document.addEventListener('keydown', onKey);
    const zones = document.getElementById('navzones');
    zones.children[0].onclick = prev;
    zones.children[1].onclick = next;
    zones.children[2].onclick = next;
    overlay.onclick = e => { e.stopPropagation(); next(); };
    let tx = 0, ty = 0;
    window.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
    }, { passive: true });
    window.addEventListener('hashchange', () => { const i = hashIndex(); if (i !== cur) show(i); });
    show(hashIndex());
    helpEl.classList.add('on');
    setTimeout(() => helpEl.classList.remove('on'), 5000);
    requestAnimationFrame(frame);
  }

  // 검수용: i 번째 장(0부터)을 시각 t 의 상태로 그린다. 전환 없이 그 장만 보인다.
  DECK.seek = (i, t) => {
    slides.forEach((d, j) => { if (j !== i) d.el.style.display = 'none'; });
    cur = -1; trans = null;
    show(i);
    slides[i].el.style.clipPath = '';
    renderSlide(i, t);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

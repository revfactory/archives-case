/* 들어가며 — 필름 인트로, 표지, 문서, 분류기준표(순서·보존기간), 자료만으로 철을 정할 수 없는 문서(세 가지와 결론), 하네스 다섯 개. */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css } = RH;
  const C = K.C;
  const CH = '들어가며';

  // 1. 인트로: 필름 「기록관리 하네스」(120초)
  DECK.slide({
    id: 'intro', title: '인트로 영상 · 기록관리 하네스(120초)', bg: 'paper', video: 'media/film.mp4', poster: 'media/film.jpg',
    notes: '120초 인트로 필름 「기록관리 하네스」. 기록연구사가 문서 한 장을 들고 질문을 던지고, 작업장 다섯 곳(제목 배정, 오분류 점검, 단위업무명 추천, 조직 변경 영향, 조직 개편 추천)이 차례로 답한다. 나레이션과 소리가 있다. 끝나면 → 키로 넘긴다.\n필름은 하네스 첫 구성(오케스트레이터 5, 전용 에이전트 15)과 그 시험 실행 수치(20묶음 중 17묶음 배정 추천, 제안 13건 중 신설 4건, 사건 7건·변경 11건)를 쓴다. 다음 장부터는 네 가지 과제에 맞춰 새로 구성한 하네스(에이전트 18개)의 실행 결과다. 발표 순서도 필름과 같다.\n필름 원본: archives/kac-records-harness/harness-film/out/기록관리하네스_120s.mp4',
  });

  // 2. 표지: 필름의 마지막 화면(엔드카드)에서 그대로 이어진다
  DECK.slide({
    id: 'cover', title: '표지', chapter: CH, foot: false,
    notes: '필름의 마지막 화면에서 그대로 이어지는 표지다. 기록연구사의 마지막 질문 「그럼, 첫 문서부터 분류해 볼까요?」를 받아, 다음 장부터는 필름 순서대로 다시 짚는다: 문서와 기준표(필름 A·B) → 하네스 다섯 개(C) → 하네스별 실행 결과(D~H) → 추천까지만(I) → 맺음(J).\n오늘은 하네스 다섯 개를 기록물 분류 과제 네 가지(생산현황 분류 정정, 단위업무명 추천·제안, 조직변경 영향도, 전략적 조직 설계)에 돌려 본 결과를 보여 드린다. 에이전트 18개, 스크립트 31개, 분류기준표 단위업무 703개, 생산현황 문서 1,076,767건이다.\n출처: 각 하네스 .claude/agents/·scripts/, kac-shared/data/classification.json, production.sqlite',
    setup(root, d) {
      // 필름 엔드카드(sJ)와 같은 자리·크기: 글자 묶음 (96, 84), 건물 그림 중심 (1420, 490) 폭 1280(끝 프레임에서 1.06배), 기록연구사 (70, 600)
      d.arch = K.sprite(root, 'g01_archive', { x: 1420, y: 490, w: 1280, origin: '50% 70%' });
      const L = d.L = K.at(root, '', { x: 96, y: 84, w: 900 });
      d.k0 = K.at(L, '', { x: 4, y: 0 }, '한국공항공사');
      d.k0.style.cssText += ';font:700 32px/1 var(--sans);color:var(--ink);white-space:nowrap';
      d.k1 = K.at(L, '', { x: 4, y: 2 }, '한국공항공사 · 기록물 분류 과제 네 가지 · 실행 결과 · 2026년 11월');
      d.k1.style.cssText += ';font:600 27px/1 var(--sans);color:var(--mute);white-space:nowrap;opacity:0';
      d.t1 = K.at(L, '', { x: -4, y: 48 }, '기록관리 하네스');
      d.t1.style.cssText += ';font:900 118px/1.05 var(--display);letter-spacing:-0.045em;color:var(--ink);white-space:nowrap';
      d.sub = K.at(L, '', { x: 0, y: 190 }, '다섯 하네스를 네 가지 과제에 돌려 본 결과');
      d.sub.style.cssText += ';font:800 46px/1.15 var(--display);letter-spacing:-0.03em;color:var(--ink-2);white-space:nowrap';
      d.subW = RH.split(d.sub, 'char', { mask: true });
      d.cw = K.at(L, '', { x: 0, y: 206, w: 800 });
      d.cw.style.cssText += ';display:flex;flex-wrap:wrap;gap:12px 12px';
      d.chips = K.HZ_ORDER.map(k => { const c = K.hchip(d.cw, k); c.style.fontSize = '36px'; c.style.padding = '11px 22px 12px'; c.style.transformOrigin = '50% 100%'; return c; });
      d.note = K.at(L, '', { x: 4, y: 368 }, '모든 산출물은 사람이 검토할 추천입니다');
      d.note.style.cssText += ';font:700 34px/1 var(--sans);color:var(--ink);white-space:nowrap';
      // 이 발표의 규모(필름 뒤에 새로 나온다)
      d.rule = K.at(L, '', { x: 4, y: 640, w: 800, h: 2 }); d.rule.style.background = 'var(--ink)';
      const stats = [['에이전트', 18, 4], ['스크립트', 31, 184], ['단위업무', 703, 364], ['문서', 1076767, 574]];
      d.stats = stats.map(([lab, v, x]) => {
        const box = K.at(L, '', { x, y: 664 });
        const n = h('div', 'num', box); n.style.cssText = 'font:800 54px/1.1 var(--sans);letter-spacing:-0.03em;color:var(--ink)';
        const l = h('div', 'small', box, lab); l.style.marginTop = '4px';
        return { box, n, v };
      });
      // 기록연구사와 마지막 질문(필름과 같은 크기·자리)
      d.Q = K.question(root, '그럼, 첫 문서부터 분류해 볼까요?', { x: 70, y: 600, person: { x: 102, y: 150, w: 235 }, bx: 225, by: 70, size: 50, pad: '26px 38px 28px', tagSize: 26, bars: true, shown: true });
      d.Q.bub.style.minWidth = '632px';   // 안쪽 여백 76px 을 더하면 필름 말풍선 폭 708px
    },
    render(lt, d) {
      // 0~0.45초: 필름 마지막 화면 그대로 → 질문이 빠지고 표지로 바뀐다
      d.Q.render(lt);
      d.Q.out(lt, 0.45);
      const sw = prog(lt, 0.7, 0.5, ease.inOutCubic);
      d.k0.style.opacity = (1 - sw).toFixed(3);
      d.k1.style.opacity = sw.toFixed(3);
      const mv = prog(lt, 0.75, 0.6, ease.inOutCubic);
      d.cw.style.transform = `translateY(${(mv * 82).toFixed(1)}px)`;
      d.note.style.transform = `translateY(${(mv * 82).toFixed(1)}px)`;
      d.subW.forEach((c, i) => { const p = RH.stagger(lt, 1.0, 0.025, 0.5, i); c.style.transform = `translateY(${((1 - p) * 120).toFixed(1)}%)`; });
      K.wipe(d.rule, lt, 1.5, 0.7);
      d.stats.forEach((st, i) => { K.rise(st.box, lt, 1.6 + i * 0.08, { y: 16 }); K.count(st.n, lt, 1.6 + i * 0.08, 1.4, st.v); });
      // 건물은 아주 천천히 다가온다. 칩은 발표 순서대로 한 번씩 짚는다
      // 필름 마지막 프레임의 건물 크기(1.06배)에서 시작해 조금 더 다가온다
      d.arch.style.transform = `translateY(-2px) scale(${(1.06 + 0.03 * prog(lt, 1.0, 9, ease.inOutSine)).toFixed(4)})`;
      const k = K.cycle(lt, 3.2, 1.0, 6);
      d.chips.forEach((c, i) => { c.style.transform = `scale(${k === i ? 1.08 : 1})`; c.style.boxShadow = k === i ? '0 10px 24px -12px rgba(27,42,74,.55)' : 'none'; });
    },
  });

  // 글자 한 줄을 절대 위치로 놓는다
  const T = (root, html, x, y, st, w) => { const e = K.at(root, '', { x, y, w }, html); e.style.cssText += ';' + st; return e; };
  const show = (el, on) => { el.style.opacity = on ? '1' : '0'; el.style.transform = `scale(${on ? 1 : 0.8})`; };

  // 문서 1,076,767건 — 필름 A 구간(기록연구사의 첫 질문과 문서 더미)
  DECK.slide({
    id: 'docs', title: '문서 1,076,767건', chapter: CH,
    notes: '필름 첫 장면의 질문으로 돌아간다. 「이 문서, 어느 기록물철에 넣어야 하죠?」 분류 대상은 2021~2026년에 생산·접수된 문서 1,076,767건이다. 생산 문서가 502,155건, 접수 문서가 574,612건이고 부서명은 65개다. 2021년과 2026년이 특히 많다.\n뒤에 흐르는 글은 실제 문서 제목이다. 문서목록의 칸은 연도, 부서명, 문서구분, 등록일자, 문서번호, 제목, 수신발신처, 공개여부 여덟 개다. 어느 단위업무·기록물철에 속하는지는 적혀 있지 않다(다음다음 장).\n출처: kac-shared/data/production.sqlite (docs 표)',
    setup(root, d) {
      const cv = h('canvas', '', root);
      css(cv, { position: 'absolute', left: 0, top: 0, width: '1920px', height: '1080px' });
      cv.width = 1920; cv.height = 1080;
      d.ctx = cv.getContext('2d');
      d.ctx.font = '500 25px Pretendard';
      const TT = DD.titles;
      d.lanes = [];
      for (let i = 0; i < 15; i++) {
        let txt = '';
        for (let j = 0; j < 12; j++) txt += TT[(i * 28 + j) % TT.length] + '     ';
        d.lanes.push({ txt, w: d.ctx.measureText(txt).width, y: 92 + i * 64, sp: 26 + K.rand(i, 3) * 34, off: K.rand(i, 7) * 900 });
      }
      d.veil = K.at(root, '', { x: 0, y: 0, w: 1920, h: 1080 });
      d.veil.style.background = 'linear-gradient(90deg, rgba(253,243,226,.94) 0%, rgba(253,243,226,.90) 52%, rgba(253,243,226,.84) 100%)';
      // 필름 첫 장면의 질문. 표지(필름 마지막 질문) 다음에 필름 첫 질문으로 돌아가 자료부터 본다
      d.Q = K.question(root, '이 문서, 어느 기록물철에 넣어야 하죠?', { x: 60, y: 20, person: { x: 80, y: 120, w: 120 }, bx: 170, by: 40, size: 38, pad: '20px 30px 22px', tagSize: 22, bars: true });
      d.lab = T(root, '2021~2026년 생산·접수 문서', 120, 430, 'font-size:46px;font-weight:700;letter-spacing:-0.02em');
      d.num = K.at(root, 'num', { x: 108, y: 500 }, '');
      d.num.style.cssText += ';font-size:196px;font-weight:900;letter-spacing:-0.05em;line-height:1;color:var(--ink);white-space:nowrap';
      d.num.innerHTML = '<span>0</span><span style="font-size:72px;font-weight:800;margin-left:16px;letter-spacing:0">건</span>';
      d.numV = d.num.firstChild;
      // 연도별 막대
      const Y = [['2021', 371947], ['2022', 99861], ['2023', 107636], ['2024', 106936], ['2025', 80604], ['2026', 309783]];
      d.yh = T(root, '연도별 문서 수', 1170, 300, 'font-size:32px;font-weight:800;letter-spacing:-0.02em');
      d.years = Y.map((r, i) => {
        const x = 1170 + i * 108;
        const b = K.at(root, '', { x, y: 0, w: 76 }); b.style.background = 'rgba(27,42,74,.8)'; b.style.borderRadius = '4px 4px 0 0';
        const yl = T(root, r[0], x - 16, 896, 'font-size:28px;font-weight:700;text-align:center;color:var(--ink-2)', 108);
        const v = K.at(root, 'num', { x: x - 16, y: 0, w: 108 }, ''); v.style.cssText += ';font-size:24px;font-weight:700;letter-spacing:-0.02em;text-align:center;color:var(--ink)';
        return { b, yl, v, val: r[1] };
      });
      d.base = K.at(root, '', { x: 1154, y: 884, w: 648, h: 3 }); d.base.style.background = C.ink;
    },
    render(lt, d) {
      const ctx = d.ctx;
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.font = '500 25px Pretendard';
      ctx.fillStyle = 'rgba(27,42,74,.30)';
      ctx.globalAlpha = prog(lt, 0, 0.8);
      d.lanes.forEach(L => {
        const x = -((L.off + lt * L.sp) % L.w);
        ctx.fillText(L.txt, x, L.y);
        ctx.fillText(L.txt, x + L.w, L.y);
      });
      ctx.globalAlpha = 1;
      d.Q.render(lt, 0, 24);
      K.rise(d.lab, lt, 0.6, { y: 16 });
      K.rise(d.num, lt, 0.7, { y: 24, blur: 10 });
      K.count(d.numV, lt, 0.7, 2.0, 1076767);
      K.rise(d.yh, lt, 0.8, { y: 10 });
      K.wipe(d.base, lt, 0.8, 0.6);
      // 머무는 동안 연도를 차례로 짚는다
      const k = K.cycle(lt, 3.0, 1.3, d.years.length);
      d.years.forEach((y, i) => {
        const p = prog(lt, 0.9 + i * 0.08, 0.9, ease.snap);
        const hh = (y.val / 371947) * 480 * p;
        y.b.style.top = (884 - hh).toFixed(1) + 'px'; y.b.style.height = hh.toFixed(1) + 'px';
        y.b.style.background = k === i ? C.blue : 'rgba(27,42,74,.8)';
        y.v.style.top = (884 - hh - 38).toFixed(1) + 'px';
        y.v.style.opacity = prog(lt, 1.2 + i * 0.08, 0.3).toFixed(3);
        y.v.style.color = k === i ? C.blue : C.ink;
        y.v.textContent = RH.count(p, y.val);
        K.rise(y.yl, lt, 0.9 + i * 0.08, { y: 8 });
      });
    },
  });

  // 분류기준표 (1) 분류 순서 — 필름 B 구간
  DECK.slide({
    id: 'scheme', title: '기록물은 부서 → 기능 → 단위업무 → 기록물철 순서로 분류한다', chapter: CH,
    notes: '분류기준표는 부서 → 기능 → 단위업무 → 기록물철 순서다. 표에는 일곱 단계가 있다: 부서1(29개), 부서2(92개), 대기능(2개), 중기능(140개), 소기능(587개), 단위업무(703개), 기록물철(1,663개). 화면의 「부서」는 부서2, 「기능」은 소기능이다.\n예로 든 줄은 신공항추진단 신공항건설1부 → 공사운영관리 · 공항건설사업관리 · 신공항사업계획관리 → 단위업무 U0087 신공항 건설사업관리 → 기록물철 F0164 제주 제2공항 사업관리(30년)다. 조직 변경 영향 사례에서 실제로 바뀐 줄이다.\n단위업무 703개는 부서별로 센 수다. 필름 화면의 「단위업무 658개」는 이름이 같은 단위업무를 하나로 센 수다(이름 657개 + 빈 이름 1).\n이 밖에 어느 부서든 쓰는 부서공통 기록물철이 46개 있다(C001 보안관리 등).\n출처: kac-shared/data/classification.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '분류기준표', title: '기록물은 부서 → 기능 → 단위업무 → 기록물철\n순서로 분류한다' });
      const lv = [['부서', '신공항건설1부', ''], ['기능', '신공항사업계획관리', ''], ['단위업무', '신공항 건설사업관리', 'U0087'], ['기록물철', '제주 제2공항 사업관리', 'F0164']];
      d.svg = K.svg(root);
      d.cards = lv.map((r, i) => {
        const x = 120 + i * 436;
        const c = K.at(root, 'card', { x, y: 420, w: 372, h: 236 });
        c.innerHTML = `<div style="position:absolute;left:28px;top:26px;font:700 30px/1 var(--sans);color:var(--mute)">${r[0]}</div>`
          + `<div style="position:absolute;left:28px;right:20px;top:78px;font:800 34px/1.28 var(--sans);letter-spacing:-0.03em;color:var(--ink)">${r[1]}</div>`
          + (r[2] ? `<div class="chip id" style="position:absolute;left:28px;bottom:24px;font-size:24px">${r[2]}</div>` : '');
        return { c, x };
      });
      d.arr = d.cards.slice(0, -1).map(k => K.path(d.svg, [[k.x + 372 + 10, 538], [k.x + 436 - 10, 538]], { color: C.ink2, width: 4, arrow: true }));
      d.cap = T(root, '분류기준표 전체에는', 120, 782, 'font:800 46px/1 var(--display);letter-spacing:-0.03em;color:var(--ink-2)');
      const big = (x, lab, unit) => {
        const g = K.at(root, '', { x, y: 706 });
        const l = h('div', '', g, lab); l.style.cssText = 'font:700 30px/1 var(--sans);color:var(--mute);margin-left:6px';
        const n = h('div', 'num', g); n.style.cssText = 'font:900 112px/1.05 var(--display);letter-spacing:-0.04em;color:var(--blue);white-space:nowrap;margin-top:8px';
        n.innerHTML = `<span>0</span><span style="font-size:56px;margin-left:8px;color:var(--ink)">${unit}</span>`;
        return { g, n: n.firstChild };
      };
      d.n1 = big(960, '단위업무', '개'); d.n2 = big(1372, '기록물철', '개');
      d.doc = K.doc(root, '문서', { x: 0, y: 0 });
      d.pos = d.cards.map(k => [k.x + 140, 358]);
    },
    render(lt, d) {
      d.T.render(lt);
      d.cards.forEach((k, i) => K.rise(k.c, lt, 0.6 + i * 0.18, { x: -24, y: 0 }));
      d.arr.forEach((p, i) => K.draw(p, lt, 0.85 + i * 0.18, 0.3));
      K.rise(d.cap, lt, 1.5, { y: 12 });
      K.rise(d.n1.g, lt, 1.6, { y: 14 }); K.count(d.n1.n, lt, 1.6, 1.0, 703);
      K.rise(d.n2.g, lt, 1.75, { y: 14 }); K.count(d.n2.n, lt, 1.75, 1.0, 1663);
      // 문서 한 건이 부서에서 기록물철까지 차례로 내려간다
      const n = d.cards.length, L = K.loop(lt, 2.6, Array(n).fill(1.3));
      d.cards.forEach((k, i) => RH.set(k.c, 'boxShadow', L.i === i && L.u > 0.25 ? '0 0 0 5px ' + C.blue : '0 18px 40px -24px rgba(27,42,74,.30)'));
      if (L.i < 0) { d.doc.style.opacity = '0'; return; }
      const to = d.pos[L.i], from = L.i === 0 ? [to[0] - 110, to[1]] : d.pos[L.i - 1];
      K.travel(d.doc, L.u, 0, 0.3, from, to, { arc: 22 });
      d.doc.className = 'doc' + (L.i === n - 1 && L.u > 0.3 ? ' blue' : '');
      d.doc.style.opacity = (L.i === 0 ? clamp(L.u / 0.15) : L.i === n - 1 ? clamp((1 - L.u) / 0.2) : 1).toFixed(3);
    },
  });

  // 분류기준표 (2) 보존기간
  DECK.slide({
    id: 'scheme-2', title: '기록물철마다 보존기간이 정해져 있다', chapter: CH,
    notes: '기록물철 1,663개의 보존기간 분포다. 1년 5, 3년 19, 5년 179, 10년 904, 30년 489, 50년 1, 준영구(70년) 1, 준영구 29, 영구 36이다. 10년과 30년이 대부분이다.\n문서를 어느 철에 넣느냐에 따라 그 문서를 몇 년 보존할지가 정해진다. 철을 잘못 고르면 보존기간도 틀린다.\n출처: kac-shared/data/classification.json (files 1,663행의 보존기간)',
    setup(root, d) {
      d.T = K.title(root, { kicker: '분류기준표', title: '기록물철마다 보존기간이 정해져 있다' });
      const R = [['1년', 5], ['3년', 19], ['5년', 179], ['10년', 904], ['30년', 489], ['50년', 1], ['준영구(70년)', 1], ['준영구', 29], ['영구', 36]];
      d.bars = R.map((r, i) => {
        const y = 296 + i * 68;
        const lab = T(root, r[0], 120, y + 4, 'font-size:32px;font-weight:700;letter-spacing:-0.02em;color:var(--ink-2);text-align:right;white-space:nowrap', 250);
        const b = K.at(root, '', { x: 400, y, h: 46 }); b.style.borderRadius = '4px';
        const n = K.at(root, 'num', { x: 400, y: y + 3 }, ''); n.style.cssText += ';font-size:34px;font-weight:800;letter-spacing:-0.02em;color:var(--ink)';
        return { lab, b, n, v: r[1] };
      });
      d.tl = T(root, '기록물철', 1290, 650, 'font:700 36px/1 var(--sans);color:var(--mute)');
      d.tn = K.at(root, 'num', { x: 1280, y: 700 }, '');
      d.tn.style.cssText += ';font:900 150px/1 var(--display);letter-spacing:-0.04em;color:var(--ink);white-space:nowrap';
      d.tn.innerHTML = '<span>0</span><span style="font-size:64px;margin-left:8px">개</span>';
    },
    render(lt, d) {
      d.T.render(lt);
      const max = 904, W = 980;
      const k = K.cycle(lt, 2.6, 1.3, d.bars.length);
      d.bars.forEach((b, i) => {
        K.rise(b.lab, lt, 0.5 + i * 0.07, { y: 8 });
        const p = K.bar(b.b, lt, 0.6 + i * 0.07, b.v / max, W, 0.9);
        const w = Math.max((b.v / max) * W * p, 3);
        b.b.style.width = w.toFixed(1) + 'px';
        b.b.style.opacity = prog(lt, 0.6 + i * 0.07, 0.2).toFixed(3);
        b.b.style.background = k === i ? C.blue : 'rgba(27,42,74,.78)';
        b.n.style.left = (400 + w + 16).toFixed(1) + 'px';
        K.count(b.n, lt, 0.6 + i * 0.07, 0.9, b.v);
        b.n.style.opacity = prog(lt, 0.7 + i * 0.07, 0.3).toFixed(3);
        b.n.style.color = k === i ? C.blue : C.ink;
        b.lab.style.color = k === i ? C.blue : C.ink2;
      });
      K.rise(d.tl, lt, 1.3, { y: 10 });
      K.rise(d.tn, lt, 1.4, { y: 16 }); K.count(d.tn.firstChild, lt, 1.4, 1.1, 1663);
    },
  });

  // 자료만으로는 기록물철을 정할 수 없는 문서가 있다 — 항목 하나에 한 장씩, 그리고 결론
  const KG = '자료만으로는 기록물철을 정할 수 없는 문서가 있다';

  // 첫째: 문서목록에 단위업무·기록물철 칸이 없다
  DECK.slide({
    id: 'gaps', title: '문서 1,076,767건에는 어느 기록물철인지 적혀 있지 않다', chapter: CH,
    notes: '하네스를 설계하기 전에 자료에서 세 가지를 확인했다. 자료만으로는 기록물철을 정할 수 없는 문서가 있다.\n첫째, 문서 1,076,767건의 목록(생산현황)에는 단위업무·기록물철 칸이 없다. 칸은 연도, 부서명, 문서구분, 등록일자, 문서번호, 제목, 수신발신처, 공개여부 여덟 개다. 문서마다 어느 철인지 적혀 있지 않아, 모든 문서는 제목과 부서명을 읽고 분류기준표에서 철을 골라야 한다.\n화면에서 바뀌는 제목은 실제 문서 제목이다.\n출처: kac-shared/data/production.sqlite (docs 표)',
    setup(root, d) {
      d.T = K.title(root, { kicker: KG + ' · 첫째', title: '문서 1,076,767건에는\n어느 기록물철인지 적혀 있지 않다' });
      d.card = K.at(root, 'card', { x: 120, y: 400, w: 1010, h: 392 });
      T(d.card, '문서목록에 있는 칸', 40, 30, 'font:700 30px/1 var(--sans);color:var(--mute)');
      const cols = ['연도', '부서명', '문서구분', '등록일자', '문서번호', '제목', '수신발신처', '공개여부'];
      d.cols = cols.map((c, i) => {
        const e = K.at(d.card, '', { x: 40 + (i % 4) * 236, y: 82 + Math.floor(i / 4) * 76, w: 220, h: 60 }, c);
        e.style.cssText += ';display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:10px;border:2px solid var(--rule-2);background:#fff;font:700 30px/1 var(--sans);letter-spacing:-0.02em;color:var(--ink)';
        if (c === '제목') { e.style.borderColor = C.blue; e.style.color = '#1456C8'; e.style.borderWidth = '3px'; }
        return e;
      });
      d.tl = T(d.card, '제목', 40, 262, 'font:800 28px/1 var(--sans);color:#1456C8');
      d.tt = T(d.card, '', 40, 306, 'font:800 42px/1.2 var(--sans);letter-spacing:-0.03em;color:var(--ink);white-space:nowrap');
      d.titles = DD.titles.filter(t => t.length >= 12 && t.length <= 21 && !/[`\[\]「」()O]/.test(t)).slice(0, 5);
      d.h2 = T(root, '문서목록에 없는 칸', 1210, 408, 'font:700 30px/1 var(--sans);color:#965A00');
      d.miss = ['단위업무', '기록물철'].map((c, i) => {
        const e = K.at(root, '', { x: 1210, y: 462 + i * 168, w: 590, h: 140 }, c + ' ?');
        e.style.cssText += ';border:4px dashed var(--warn);border-radius:16px;color:#965A00;font:800 58px/1 var(--display);letter-spacing:-0.03em;display:flex;align-items:center;justify-content:center;box-sizing:border-box;background:var(--warn-soft)';
        return e;
      });
      d.as = T(root, '제목과 부서명을 읽고 분류기준표에서 골라야 한다', 120, 856, 'font:800 44px/1.2 var(--display);letter-spacing:-0.03em;color:var(--ink)');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.card, lt, 0.6, { y: 18 });
      d.cols.forEach((c, i) => K.pop(c, lt, 0.8 + i * 0.05));
      K.rise(d.h2, lt, 1.3, { y: 8 });
      d.miss.forEach((m, i) => K.pop(m, lt, 1.4 + i * 0.15, { from: 1.25 }));
      K.rise(d.as, lt, 1.8, { y: 12 });
      // 실제 제목이 한 건씩 찍히고, 그때마다 없는 칸 두 개가 커졌다 돌아온다
      const L = K.loop(lt, 2.1, [1.4, 1.8]);
      d.tl.style.opacity = prog(lt, 1.0, 0.3).toFixed(3);
      const title = d.titles[L.lap % d.titles.length];
      if (L.i < 0) d.tt.textContent = '';
      else if (L.i === 0) K.type(d.tt, title, L.u * 1.4, 0, 20);
      else d.tt.textContent = title;
      d.tt.style.opacity = (L.i === 1 ? clamp((1 - L.u) / 0.12) : 1).toFixed(3);
      if (lt > 2.1) {
        const pu = L.i === 1 ? Math.sin(clamp(L.u / 0.6) * Math.PI) : 0;
        d.miss.forEach(m => { m.style.transform = `scale(${(1 + 0.045 * pu).toFixed(4)})`; });
      }
    },
  });

  // 둘째: 분류기준표에 없는 부서
  DECK.slide({
    id: 'gaps-2', title: '문서의 절반은 분류기준표에 없는 부서가 만들었다', chapter: CH,
    notes: '둘째, 문서목록의 부서명 65개 중 32개는 분류기준표에 없다. 이 부서들의 문서가 535,148건으로 전체의 49.7%다.\n기준표에 있는 부서는 33개, 541,619건이다. 제주·김해 운영단·시설단과 지방공항 17개 부서(522,546건)에는 김포·청주 기준표를 대신 적용했다. 양양공항과 포항경주공항은 기준표에 자체 항목이 조금 있다(1건, 9건). 없어진 부서 9개(12,185건)는 현재 부서로 추정해 연결했고 직제규정으로 확인해야 한다. 노동조합 등 6개(417건)는 기준표 적용 대상이 아니다.\n출처: kac-shared/data/production.sqlite, kac-shared/data/dept_map.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: KG + ' · 둘째', title: '문서의 절반은 분류기준표에 없는 부서가 만들었다' });
      d.big = K.at(root, 'num', { x: 112, y: 306 }, '');
      d.big.style.cssText += ';font:900 210px/1 var(--display);letter-spacing:-0.04em;color:var(--warn);white-space:nowrap';
      d.big.innerHTML = '<span>0</span><span style="font-size:110px;margin-left:6px">%</span>';
      d.s1 = K.at(root, 'num', { x: 800, y: 336 }, ''); d.s1.style.cssText += ';font:900 96px/1 var(--display);letter-spacing:-0.03em;color:var(--ink);white-space:nowrap';
      d.s1.innerHTML = '<span>0</span><span style="font-size:52px;margin-left:6px">건</span>';
      d.s2 = T(root, '부서 65개 중 32개', 806, 452, 'font:800 46px/1 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)');
      const segs = [
        ['기준표에 있는 부서', 33, 541619, C.ink],
        ['다른 공항 기준표 적용', 17, 522546, C.warn],
        ['없어진 부서', 9, 12185, '#965A00'],
        ['적용 대상 아님', 6, 417, C.mute],
      ];
      d.bar = K.at(root, '', { x: 120, y: 580, w: 1680, h: 84 });
      d.bar.style.cssText += ';display:flex;gap:3px;border-radius:8px;overflow:hidden';
      d.segs = segs.map(sg => { const e = h('div', '', d.bar); e.style.cssText = `background:${sg[3]};flex:none;width:${Math.max(6, sg[2] / 1076767 * 1670 - 3).toFixed(1)}px`; return e; });
      d.leg = segs.map((sg, i) => {
        const e = K.at(root, '', { x: 120 + (i % 2) * 850, y: 712 + Math.floor(i / 2) * 104, w: 830, h: 84 });
        e.style.cssText += ';display:flex;align-items:center;gap:18px;box-sizing:border-box;padding:0 22px;border-radius:14px;white-space:nowrap';
        e.innerHTML = `<span style="flex:none;width:28px;height:28px;border-radius:5px;background:${sg[3]}"></span><b style="font:800 36px/1 var(--sans);letter-spacing:-0.03em">${sg[0]}</b><span class="num" style="font:600 32px/1 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);margin-left:auto">${sg[1]}개 · ${sg[2].toLocaleString('ko-KR')}건</span>`;
        return e;
      });
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.big, lt, 0.5, { y: 20, blur: 8 }); K.count(d.big.firstChild, lt, 0.5, 1.3, 49.7, { decimals: 1 });
      K.rise(d.s1, lt, 0.8, { y: 14 }); K.count(d.s1.firstChild, lt, 0.8, 1.3, 535148);
      K.rise(d.s2, lt, 1.0, { y: 12 });
      K.wipe(d.bar, lt, 1.2, 1.0);
      d.leg.forEach((e, i) => K.rise(e, lt, 1.7 + i * 0.1, { y: 10 }));
      // 부서 네 종류를 차례로 짚는다
      const k = K.cycle(lt, 2.8, 1.5, 4);
      d.segs.forEach((e, i) => { e.style.opacity = k < 0 || k === i ? '1' : '0.22'; });
      d.leg.forEach((e, i) => { RH.set(e, 'background', k === i ? 'rgba(27,42,74,.07)' : 'transparent'); });
    },
  });

  // 셋째: 비상계획실 기록물철 42행 중 34행
  DECK.slide({
    id: 'gaps-3', title: '비상계획실 기록물철 42행 중 34행은 이름이 없어 철을 고를 수 없다', chapter: CH,
    notes: '셋째, 분류기준표의 비상계획실 기록물철은 42행이다(F0396~F0437). 이 가운데 34행은 단위업무명과 기록물철명이 비어 있어 철을 고를 수 없다. 이름이 있는 행은 8행이다(F0396 충무계획관리, F0400, F0405, F0418, F0424, F0426, F0431, F0436). 오른쪽 네모 42개는 표의 순서 그대로다.\n이 부서의 문서는 단위업무까지만 배정한다.\n출처: kac-shared/data/classification.json (files 가운데 부서2 = 비상계획실, 유의 = 단위업무명 공란·기록물철명 공란)',
    setup(root, d) {
      d.T = K.title(root, { kicker: KG + ' · 셋째', title: '비상계획실 기록물철 42행 중 34행은\n이름이 없어 철을 고를 수 없다' });
      const gap = '<span style="display:inline-block;border:3px dashed var(--warn);border-radius:8px;padding:2px 18px;color:#965A00;font-weight:800;background:var(--warn-soft)">공란</span>';
      d.tbl = K.table(root, { x: 120, y: 400, w: 1010, cols: [{ label: '번호', w: 170, cls: 'mono' }, { label: '단위업무명', w: 320 }, { label: '기록물철명', w: 320 }, { label: '보존기간', w: 200 }],
        rows: [['F0396', '충무계획관리', '충무계획관리', '30년'], ['F0397', gap, gap, '5년']] });
      d.tbl.el.querySelectorAll('.th').forEach(th => { th.style.fontSize = '26px'; });
      d.tbl.el.querySelectorAll('.td').forEach(td => { td.style.fontSize = '32px'; td.style.fontWeight = '700'; td.style.padding = '20px 14px'; });
      d.tbl.el.querySelectorAll('.td.mono').forEach(td => { td.style.fontSize = '28px'; td.style.fontWeight = '500'; });
      d.bl = T(root, '이름이 비어 있는 행', 120, 676, 'font:700 36px/1 var(--sans);color:var(--mute)');
      d.bn = K.at(root, 'num', { x: 112, y: 724 }, '');
      d.bn.style.cssText += ';font:900 200px/1 var(--display);letter-spacing:-0.04em;color:var(--warn);white-space:nowrap';
      d.bn.innerHTML = '<span>0</span><span style="font-size:84px;color:var(--ink);margin-left:18px">/ 42행</span>';
      // 표의 42행을 순서대로 네모 42개로 그린다. 이름이 있는 행은 0, 4, 9, 22, 28, 30, 35, 40번째다
      const filled = [0, 4, 9, 22, 28, 30, 35, 40];
      d.cells = [];
      for (let i = 0; i < 42; i++) {
        const on = filled.includes(i);
        const e = K.at(root, '', { x: 1240 + (i % 7) * 80, y: 400 + Math.floor(i / 7) * 80, w: 68, h: 68 });
        e.style.cssText += ';box-sizing:border-box;border-radius:10px;' + (on ? 'background:var(--ink)' : 'border:3px dashed var(--warn);background:var(--warn-soft)');
        d.cells.push({ e, on });
      }
      d.lg = K.at(root, '', { x: 1240, y: 898, w: 560 });
      d.lg.style.cssText += ';display:flex;gap:34px;font:700 28px/1 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);white-space:nowrap';
      d.lg.innerHTML = '<span><i style="display:inline-block;width:24px;height:24px;border-radius:5px;background:var(--ink);vertical-align:-3px;margin-right:10px"></i>이름 있음 8행</span>'
        + '<span><i style="display:inline-block;width:24px;height:24px;border-radius:5px;border:3px dashed var(--warn);box-sizing:border-box;background:var(--warn-soft);vertical-align:-3px;margin-right:10px"></i>공란 34행</span>';
    },
    render(lt, d) {
      d.T.render(lt);
      d.tbl.render(lt, 0.6, 0.15);
      K.rise(d.bl, lt, 1.1, { y: 10 });
      K.rise(d.bn, lt, 1.2, { y: 18, blur: 8 }); K.count(d.bn.firstChild, lt, 1.2, 1.1, 34);
      K.rise(d.lg, lt, 2.0, { y: 8 });
      // 표의 두 행을 번갈아 짚는다: 이름이 있는 행(8행) ↔ 공란인 행(34행)
      const L = K.loop(lt, 2.6, [1.5, 1.9]);
      K.mark(d.tbl.rows[0], L.i === 0, 'rgba(27,42,74,.08)');
      K.mark(d.tbl.rows[1], L.i === 1, 'rgba(232,147,12,.16)');
      const pu = L.i < 0 ? 0 : Math.sin(clamp(L.u / 0.7) * Math.PI);
      d.cells.forEach((c, i) => {
        const p = prog(lt, 0.9 + i * 0.025, 0.4, ease.pop), a = prog(lt, 0.9 + i * 0.025, 0.15, ease.linear);
        const act = (L.i === 0 && c.on) || (L.i === 1 && !c.on);
        const dim = L.i >= 0 && !act;
        c.e.style.opacity = (a * (dim ? 0.3 : 1)).toFixed(3);
        c.e.style.transform = `scale(${(lerp(0.6, 1, p) * (act ? 1 + 0.1 * pu : 1)).toFixed(4)})`;
      });
    },
  });

  // 결론: 정할 수 없는 문서는 사람에게 넘긴다
  DECK.slide({
    id: 'gaps-4', title: '정할 수 없는 문서는 철을 정하지 않고 사람에게 넘긴다', chapter: CH,
    notes: '세 가지 때문에 자료만으로는 기록물철을 정할 수 없는 문서가 있다. 그래서 하네스는 정할 수 없는 문서에 철을 억지로 정하지 않는다. 결과에 미배정, 검토필요, 보류로 표시해 사람에게 넘긴다.\n세 이름은 하네스 결과물에 실제로 쓰인다. 미배정과 검토필요는 제목 배정 하네스 결과(kac-record-assign/output/t1/배정결과.csv, 검토필요.csv)에, 보류는 단위업무명 추천 하네스 결과(kac-unit-task-naming/output)에 나온다.',
    setup(root, d) {
      d.T = K.title(root, { kicker: '그래서 하네스는', title: '정할 수 없는 문서는 철을 정하지 않고 사람에게 넘긴다', size: 66 });
      d.a1 = K.actor(root, { kind: 'make', name: '에이전트', job: '철을 정하지 않는다', x: 240, y: 432, w: 270, jobW: 320 });
      d.hu = K.actor(root, { kind: 'human', name: '사람', job: '확인하고 정한다', x: 1450, y: 392, w: 210, jobW: 300 });
      d.svg = K.svg(root);
      d.p1 = K.path(d.svg, [[550, 590], [1420, 590]], { color: C.warn, width: 6, arrow: true });
      d.cw = K.at(root, '', { x: 540, y: 664, w: 880 });
      d.cw.style.cssText += ';display:flex;justify-content:center;gap:30px';
      d.chips = ['미배정', '검토필요', '보류'].map(t => {
        const c = h('div', '', d.cw, t);
        c.style.cssText = 'font:800 48px/1 var(--display);letter-spacing:-0.02em;padding:20px 36px 22px;border-radius:16px;border:3px solid rgba(232,147,12,.6);background:var(--warn-soft);color:#965A00;white-space:nowrap;transform-origin:50% 50%';
        return c;
      });
      d.cc = T(root, '결과에 이렇게 표시한다', 540, 796, 'font:600 30px/1 var(--sans);color:var(--mute);text-align:center', 880);
      d.doc = K.doc(root, '문서 제목', { x: 0, y: 0 }, 'warn');
      d.s1 = K.say(root, '정할 수 없습니다', { x: 500, y: 438 }, 'warn', 'l');
      d.names = ['미배정', '검토필요', '보류'];
    },
    render(lt, d) {
      d.T.render(lt);
      d.a1.render(lt, 0.6); d.hu.render(lt, 0.8);
      K.draw(d.p1, lt, 1.0, 0.6);
      d.chips.forEach((c, i) => K.pop(c, lt, 1.5 + i * 0.12));
      K.rise(d.cc, lt, 1.9, { y: 8 });
      // 문서 한 건: 에이전트가 정할 수 없다고 말하고, 표시를 붙여 사람에게 넘긴다. 바퀴마다 표시가 바뀐다
      const L = K.loop(lt, 2.4, [0.9, 1.5, 1.3, 1.5]);
      const st = L.i, u = L.u, k = L.lap % 3, marked = st > 1 || (st === 1 && u > 0.45);
      d.a1.act(lt, st === 1); d.hu.act(lt, st === 3 && u > 0.15);
      show(d.s1, st === 1 && u > 0.2);
      if (lt > 2.2) d.chips.forEach((c, i) => {
        const on = marked && i === k;
        c.style.transform = `scale(${on ? 1.12 : 1})`;
        RH.set(c, 'background', on ? C.warn : 'rgba(232,147,12,.14)'); RH.set(c, 'color', on ? '#fff' : '#965A00');
      });
      if (st < 0) { d.doc.style.opacity = '0'; return; }
      const html = marked ? `문서 제목<b style="margin-left:12px;color:#965A00">${d.names[k]}</b>` : '문서 제목';
      if (d.doc._h !== html) { d.doc.innerHTML = html; d.doc._h = html; }
      const P = { in: [110, 366], a1: [290, 366], hu: [1440, 326] };
      if (st === 0) K.travel(d.doc, u, 0, 1, P.in, P.a1, { arc: 26 });
      else if (st === 1) K.travel(d.doc, 1, 0, 1, P.a1, P.a1);
      else if (st === 2) K.travel(d.doc, u, 0, 1, P.a1, P.hu, { arc: 46 });
      else K.travel(d.doc, 1, 0, 1, P.hu, P.hu);
      d.doc.style.opacity = (st === 0 ? clamp(u / 0.2) : st === 3 ? clamp((1 - u) / 0.15) : 1).toFixed(3);
    },
  });

  // 하네스 다섯 개와 발표 순서 — 필름 C 구간(일을 다섯 가지로 나눴다)
  DECK.slide({
    id: 'map', title: '일을 다섯 가지로 나눠 하네스 다섯 개를 만들었다', chapter: CH,
    notes: '기준표만으로 철을 정할 수 없는 문서가 있고 사람마다 고르는 철이 다르니, 일을 다섯 가지로 나눠 하네스 다섯 개를 만들었다(필름 C 구간과 같은 말). 필름에서 기록연구사가 던진 질문 다섯 개를 이 발표의 하네스 다섯 개에 그대로 대응시켰다. 순서도 필름과 같다. 문서 한 건(제목 배정)에서 시작해 조직 전체(조직 개편 추천)로 범위가 커진다. 오른쪽 숫자는 그 하네스를 다루는 장 번호다.\n요청하신 과제 네 가지 가운데 「생산현황 분류 정정」은 일이 둘이라 하네스 두 개(제목 배정, 오분류 점검)가 나눠 맡았다.\n필름은 하네스 첫 구성(에이전트 15개)과 시험 실행을 보여 줬다. 이 발표는 네 과제에 맞춰 새로 구성한 하네스(에이전트 18개: 3·3·3·4·5)의 실행 결과다. 분류기준표·생산현황 자료는 같다.\n하네스 폴더 이름: kac-record-assign(제목 배정, 에이전트 3), kac-classification-audit(오분류 점검, 3), kac-unit-task-naming(단위업무명 추천, 3), kac-org-change-impact(조직 변경 영향, 4), kac-org-strategy(조직 개편 추천, 5).\n하네스 장 앞에는 공통 구조 장이 있고, 뒤에는 사람이 정할 것과 맺음 장이 있다.\n출처: 각 하네스 폴더의 .claude/agents/',
    setup(root, d) {
      d.T = K.title(root, { kicker: '하네스 다섯 개 · 발표는 영상과 같은 순서로 간다', title: '일을 다섯 가지로 나눠 하네스 다섯 개를 만들었다' });
      const S = DECK.slides;
      d.rows = K.HZ_ORDER.map((key, i) => {
        const hz = K.HZ[key];
        const a = S.findIndex(x => x.harness === key), b = S.length - 1 - [...S].reverse().findIndex(x => x.harness === key);
        const y = 300 + i * 132;
        const row = K.at(root, '', { x: 100, y, w: 1720, h: 120 });
        row.style.borderRadius = '18px';
        const ic = K.sprite(row, hz.img, { crop: true, x: 92, y: 60, w: 124 });
        const chip = K.hchip(row, key, { x: 184, y: 32 }); chip.style.fontSize = '34px'; chip.style.padding = '11px 22px 12px';
        const qb = K.at(row, '', { x: 548, y: 27 });
        qb.style.cssText += ';background:var(--ink);color:#fff;border-radius:24px 24px 24px 5px;padding:17px 26px 18px;font:700 31px/1 var(--sans);letter-spacing:-0.02em;white-space:nowrap;transform-origin:0% 100%';
        const qt = h('span', '', qb, '');
        const tk = T(row, '과제', 1232, 22, 'font-size:24px;font-weight:600;color:var(--mute)');
        const tn = T(row, hz.task, 1232, 56, 'font-size:32px;font-weight:800;letter-spacing:-0.03em;color:var(--ink);white-space:nowrap');
        const pg = K.at(row, 'num', { r: 26, y: 40 }, a < 0 ? '' : `${a + 1}–${b + 1}<span style="font-size:26px;margin-left:4px">장</span>`);
        pg.style.cssText += `;font-size:38px;font-weight:800;letter-spacing:-0.02em;color:${hz.c};text-align:right;white-space:nowrap`;
        return { row, ic, chip, qb, qt, q: hz.q, tk, tn, pg, c: hz.c };
      });
      // 같은 과제를 두 하네스가 나눠 맡는 표시
      d.svg = K.svg(root);
      d.brace = K.path(d.svg, [[1318, 330], [1306, 330], [1306, 522], [1318, 522]], { color: K.C.ink2, width: 3, radius: 8 });
    },
    render(lt, d) {
      d.T.render(lt);
      d.rows.forEach((r, i) => {
        const t0 = 0.35 + i * 0.12;
        K.rise(r.row, lt, t0, { x: -20, y: 0 });
        K.pop(r.qb, lt, t0 + 0.35);
        K.type(r.qt, r.q, lt, t0 + 0.45, 30);
      });
      K.draw(d.brace, lt, 1.4, 0.4);
      // 발표 순서대로 한 줄씩 짚는다
      const k = K.cycle(lt, 3.0, 1.5, 5);
      d.rows.forEach((r, i) => {
        r.row.style.background = k === i ? 'rgba(27,42,74,.06)' : 'transparent';
        r.ic.style.transform = `translateY(${k === i ? -6 : 0}px) scale(${k === i ? 1.08 : 1})`;
      });
    },
  });
})();

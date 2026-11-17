/* 들어가며 — 필름 인트로, 필름에서 이어지는 표지, 발표 순서, 자료(분류기준표·문서목록·빈틈). */
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

  // 3. 문서 1,076,767건 — 필름 A 구간(기록연구사의 첫 질문과 문서 더미)
  DECK.slide({
    id: 'docs', title: '문서 1,076,767건', chapter: CH,
    notes: '필름 첫 장면의 질문으로 돌아간다. 「이 문서, 어느 기록물철에 넣어야 하죠?」 분류 대상은 2021~2026년에 생산·접수된 문서 1,076,767건이다(부서명 65개). 2021년과 2026년이 특히 많다.\n뒤에 흐르는 글은 실제 문서 제목이다. 문서목록에는 제목·부서·일자는 있지만 어느 단위업무·기록물철에 속하는지는 적혀 있지 않다.\n출처: kac-shared/data/production.sqlite (docs 표)',
    setup(root, d) {
      const cv = h('canvas', '', root);
      css(cv, { position: 'absolute', left: 0, top: 0, width: '1920px', height: '1080px' });
      cv.width = 1920; cv.height = 1080;
      d.ctx = cv.getContext('2d');
      d.ctx.font = '500 25px Pretendard';
      const T = DD.titles;
      d.lanes = [];
      for (let i = 0; i < 15; i++) {
        let txt = '';
        for (let j = 0; j < 12; j++) txt += T[(i * 28 + j) % T.length] + '     ';
        d.lanes.push({ txt, w: d.ctx.measureText(txt).width, y: 92 + i * 64, sp: 26 + K.rand(i, 3) * 34, off: K.rand(i, 7) * 900 });
      }
      d.veil = K.at(root, '', { x: 0, y: 0, w: 1920, h: 1080 });
      d.veil.style.background = 'linear-gradient(90deg, rgba(253,243,226,.94) 0%, rgba(253,243,226,.88) 52%, rgba(253,243,226,.74) 100%)';
      // 필름 첫 장면의 질문. 표지(필름 마지막 질문) 다음에 필름 첫 질문으로 돌아가 자료부터 본다
      d.Q = K.question(root, '이 문서, 어느 기록물철에 넣어야 하죠?', { x: 60, y: 20, person: { x: 80, y: 120, w: 120 }, bx: 170, by: 40, size: 38, pad: '20px 30px 22px', tagSize: 22, bars: true });
      d.kick = K.at(root, 'kicker', { x: 120, y: 254 }, '<span class="dot"></span><span>생산현황</span>');
      d.lab = K.at(root, '', { x: 120, y: 308 }, '2021~2026년 생산·접수 문서');
      d.lab.style.cssText += ';font-size:40px;font-weight:700;letter-spacing:-0.02em';
      d.num = K.at(root, 'num', { x: 108, y: 358 }, '0');
      d.num.style.cssText += ';font-size:196px;font-weight:900;letter-spacing:-0.05em;line-height:1;color:var(--ink)';
      d.num.innerHTML = '<span>0</span><span style="font-size:64px;font-weight:800;margin-left:16px;letter-spacing:0">건</span>';
      d.numV = d.num.firstChild;
      // 생산·접수 막대
      d.sp = K.at(root, '', { x: 120, y: 680, w: 880, h: 34 }); d.sp.style.display = 'flex'; d.sp.style.borderRadius = '4px'; d.sp.style.overflow = 'hidden';
      d.sa = h('div', '', d.sp); d.sa.style.cssText = `width:${(502155 / 1076767 * 100).toFixed(2)}%;background:${C.blue}`;
      d.sb = h('div', '', d.sp); d.sb.style.cssText = 'flex:1;background:rgba(27,42,74,.78)';
      d.spl = K.at(root, '', { x: 120, y: 730, w: 880 });
      d.spl.innerHTML = '<span style="color:var(--blue);font-weight:800">생산 502,155</span><span style="float:right;font-weight:800">접수 574,612</span>';
      d.spl.style.fontSize = '28px';
      d.meta = K.at(root, 'small', { x: 120, y: 800, w: 900 }, '부서명 65개 · 문서목록 칸: 연도, 부서명, 문서구분, 등록일자, 문서번호, 제목, 수신발신처, 공개여부');
      d.meta.style.fontSize = '23px';
      // 연도별 막대
      const Y = [['2021', 371947], ['2022', 99861], ['2023', 107636], ['2024', 106936], ['2025', 80604], ['2026', 309783]];
      d.yh = K.at(root, '', { x: 1290, y: 300 }, '연도별 문서 수'); d.yh.style.cssText += ';font-size:24px;font-weight:700';
      d.years = Y.map((r, i) => {
        const x = 1290 + i * 86;
        const b = K.at(root, '', { x, y: 0, w: 60 }); b.style.background = 'rgba(27,42,74,.8)'; b.style.borderRadius = '3px 3px 0 0';
        const yl = K.at(root, 'mono', { x: x - 13, y: 870, w: 86 }, r[0]); yl.style.cssText += ';font-size:21px;text-align:center;color:var(--ink-2)';
        const v = K.at(root, 'mono', { x: x - 27, y: 0, w: 114 }, ''); v.style.cssText += ';font-size:18px;text-align:center;color:var(--ink)';
        return { b, yl, v, val: r[1] };
      });
      d.base = K.at(root, '', { x: 1276, y: 860, w: 524, h: 2 }); d.base.style.background = C.ink;
    },
    render(lt, d) {
      const ctx = d.ctx;
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.font = '500 25px Pretendard';
      ctx.fillStyle = 'rgba(27,42,74,.30)';
      const a = prog(lt, 0, 0.8);
      ctx.globalAlpha = a;
      d.lanes.forEach(L => {
        let x = -((L.off + lt * L.sp) % L.w);
        ctx.fillText(L.txt, x, L.y);
        ctx.fillText(L.txt, x + L.w, L.y);
      });
      ctx.globalAlpha = 1;
      d.Q.render(lt, 0, 24);
      K.rise(d.kick, lt, 0.5, { x: -20, y: 0 });
      K.rise(d.lab, lt, 0.6, { y: 16 });
      K.rise(d.num, lt, 0.7, { y: 24, blur: 10 });
      K.count(d.numV, lt, 0.7, 2.2, 1076767);
      K.wipe(d.sp, lt, 1.0, 0.9);
      K.rise(d.spl, lt, 1.4, { y: 10 });
      K.rise(d.meta, lt, 1.6, { y: 10 });
      K.rise(d.yh, lt, 0.8, { y: 10 });
      K.wipe(d.base, lt, 0.8, 0.6);
      const k = K.cycle(lt, 3.2, 1.6, d.years.length);
      d.years.forEach((y, i) => {
        const p = prog(lt, 0.9 + i * 0.08, 0.9, ease.snap);
        const hh = (y.val / 371947) * 470 * p;
        y.b.style.top = (860 - hh).toFixed(1) + 'px'; y.b.style.height = hh.toFixed(1) + 'px';
        y.b.style.background = k === i ? C.blue : 'rgba(27,42,74,.8)';
        y.v.style.top = (860 - hh - 30).toFixed(1) + 'px';
        y.v.style.opacity = prog(lt, 1.2 + i * 0.08, 0.3).toFixed(3);
        y.v.textContent = RH.count(p, y.val);
        K.rise(y.yl, lt, 0.9 + i * 0.08, { y: 8 });
      });
    },
  });

  // 4. 분류기준표 구조 — 필름 B 구간(기록물철 1,663개)
  DECK.slide({
    id: 'scheme', title: '분류기준표의 구조', chapter: CH,
    notes: '분류기준표는 부서 → 기능 → 단위업무 → 기록물철 순서다. 예로 든 줄은 조직 변경 영향 사례에서 실제로 바뀐 줄이다(U0087 → F0164).\n단위업무 703개는 부서별로 센 수다. 필름 화면의 「단위업무 658개」는 이름이 같은 단위업무를 하나로 센 수다(이름 657개 + 빈 이름 1).\n오른쪽은 기록물철 1,663개의 보존기간 분포다. 10년(904)과 30년(489)이 대부분이다.\n출처: kac-shared/data/classification.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '분류기준표', title: '단위업무 703개, 기록물철 1,663개', sub: '기록물은 부서 → 기능 → 단위업무 → 기록물철 순서로 분류하고, 철마다 보존기간이 정해져 있다.' });
      const lv = [
        ['부서1', '29', '신공항추진단'],
        ['부서2', '92', '신공항건설1부'],
        ['대기능', '2', '공사운영관리'],
        ['중기능', '140', '공항건설사업관리'],
        ['소기능', '587', '신공항사업계획관리'],
        ['단위업무', '703', '<span class="mono" style="font-size:24px;color:var(--blue);font-weight:500">U0087</span> 신공항 건설사업관리'],
        ['기록물철', '1,663', '<span class="mono" style="font-size:24px;color:var(--blue);font-weight:500">F0164</span> 제주 제2공항 사업관리 <span class="chip blue sm" style="margin-left:8px;vertical-align:4px">30년</span>'],
      ];
      d.svg = K.svg(root);
      d.lv = lv.map((r, i) => {
        const x = 150 + i * 34, y = 392 + i * 76;
        const g = K.at(root, '', { x, y, w: 1000 - i * 34 });
        g.style.display = 'flex'; g.style.alignItems = 'baseline'; g.style.gap = '18px';
        const nm = h('span', '', g, r[0]); nm.style.cssText = 'font-size:22px;font-weight:600;color:var(--mute);width:92px;flex:none';
        const ct = h('span', 'mono', g, r[1]); ct.style.cssText = 'font-size:20px;color:var(--ink-2);width:64px;flex:none;text-align:right';
        const v = h('span', '', g, r[2]); v.style.cssText = `font-size:${i >= 5 ? 32 : 29}px;font-weight:${i >= 5 ? 800 : 700};letter-spacing:-0.02em;color:var(--ink)`;
        return { g, x, y };
      });
      // 계단형 경로: 각 줄 왼쪽 점에서 아래로 내려가 다음 줄 왼쪽 점으로
      const stair = [];
      d.lv.forEach((l, i) => { const px = l.x - 20, py = l.y + 22; stair.push([px, py]); if (i < d.lv.length - 1) stair.push([px, py + 76]); });
      d.path = K.path(d.svg, stair, { color: C.blue, width: 2.5, radius: 10 });
      d.marks = d.lv.map(l => s('circle', { cx: l.x - 20, cy: l.y + 22, r: 6, fill: C.paper, stroke: C.blue, 'stroke-width': 2.5 }, d.svg));
      d.runner = s('circle', { r: 7, fill: C.blue }, d.svg);
      d.cm = K.at(root, 'small', { x: 120, y: 922 }, '+ 부서공통 기록물철 46개(C001 보안관리 등) — 어느 부서든 쓰는 철<br>단위업무는 부서별로 셌다. 영상의 「658개」는 같은 이름을 하나로 센 수다');
      d.cm.style.fontSize = '22px';
      // 보존기간 분포
      const R = [['1년', 5], ['3년', 19], ['5년', 179], ['10년', 904], ['30년', 489], ['50년', 1], ['준영구(70년)', 1], ['준영구', 29], ['영구', 36]];
      d.rh = K.at(root, '', { x: 1240, y: 392 }, '보존기간별 기록물철'); d.rh.style.cssText += ';font-size:24px;font-weight:700';
      d.bars = R.map((r, i) => {
        const y = 446 + i * 54;
        const lab = K.at(root, '', { x: 1240, y, w: 150 }, r[0]); lab.style.cssText += ';font-size:22px;font-weight:600;color:var(--ink-2);text-align:right';
        const b = K.at(root, '', { x: 1410, y: y + 4, h: 26 }); b.style.background = r[0] === '30년' ? C.blue : 'rgba(27,42,74,.72)'; b.style.borderRadius = '3px';
        const n = K.at(root, 'mono', { x: 1410, y: y + 2 }, ''); n.style.cssText += ';font-size:20px;color:var(--ink)';
        return { lab, b, n, v: r[1], hl: r[0] === '30년' };
      });
      d.tot = K.at(root, 'small', { x: 1410, y: 446 + 9 * 54 + 6 }, '합계 1,663');
      d.tot.style.fontSize = '20px';
    },
    render(lt, d) {
      d.T.render(lt);
      d.lv.forEach((l, i) => K.rise(l.g, lt, 0.5 + i * 0.16, { x: -20, y: 0 }));
      K.draw(d.path, lt, 0.5, 0.16 * 7, { ease: ease.linear });
      d.marks.forEach((m, i) => { const p = prog(lt, 0.5 + i * 0.16, 0.25, ease.pop); m.setAttribute('r', (6 * p).toFixed(2)); });
      K.rise(d.cm, lt, 1.8, { y: 10 });
      // 경로를 따라 내려가는 점(4초마다)
      const per = 4, u = lt < 2.4 ? -1 : ((lt - 2.4) % per) / 2.2;
      if (u >= 0 && u <= 1) {
        const pt = d.path.getPointAtLength(ease.inOutCubic(u) * d.path._len);
        d.runner.setAttribute('cx', pt.x.toFixed(1)); d.runner.setAttribute('cy', pt.y.toFixed(1)); d.runner.style.opacity = '1';
      } else d.runner.style.opacity = '0';
      const hit = u > 0.97 || (lt > 2.4 && ((lt - 2.4) % per) > 2.2 && ((lt - 2.4) % per) < 3.2);
      K.rise(d.rh, lt, 0.7, { y: 10 });
      const max = 904;
      d.bars.forEach((b, i) => {
        K.rise(b.lab, lt, 0.8 + i * 0.05, { y: 8 });
        const p = K.bar(b.b, lt, 0.9 + i * 0.05, b.v / max, 330, 0.9);
        const w = (b.v / max) * 330 * p;
        b.n.style.left = (1410 + Math.max(w, 2) + 12).toFixed(1) + 'px';
        K.count(b.n, lt, 0.9 + i * 0.05, 0.9, b.v);
        b.n.style.opacity = prog(lt, 0.95 + i * 0.05, 0.3).toFixed(3);
        if (b.hl) b.b.style.boxShadow = hit ? '0 0 0 4px rgba(47,123,255,.25)' : 'none';
      });
      K.rise(d.tot, lt, 1.6, { y: 6 });
    },
  });

  // 5. 데이터의 빈틈 — 필름 B 구간(고르는 기준이 사람마다 다르다)
  DECK.slide({
    id: 'gaps', title: '데이터의 빈틈', chapter: CH,
    notes: '하네스를 설계하기 전에 데이터에서 세 가지를 확인했다.\n첫째, 문서목록에는 단위업무·기록물철 칸이 없다. 제목을 읽고 추정해야 한다.\n둘째, 생산현황의 부서명 65개 중 32개는 자기 분류기준표가 없다. 제주·김해 운영단과 지방공항 문서 522,546건은 김포·청주 기준표를 빌려 쓴다(준용).\n셋째, 비상계획실 기록물철 42행 중 34행은 단위업무명과 철명이 비어 있다.\n그래서 하네스는 확신이 없을 때 미배정·사람 확인·보류로 남기도록 만들었다.\n출처: kac-shared/data/production.sqlite, dept_map.json, classification.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '데이터 확인', title: '분류할 근거가 비어 있는 곳이 있다' });
      // A. 문서목록 칸
      d.ah = K.at(root, '', { x: 120, y: 300 }, '문서목록에는 단위업무·기록물철 칸이 없다'); d.ah.style.cssText += ';font-size:30px;font-weight:800;letter-spacing:-0.02em';
      const cols = ['연도', '부서명', '문서구분', '등록일자', '문서번호', '제목', '수신발신처', '공개여부'];
      d.cols = cols.map((c, i) => K.chip(root, c, 'id', { x: 120 + i * 146, y: 358, w: 136 }));
      d.cols.forEach(c => { c.style.justifyContent = 'center'; c.style.fontFamily = 'var(--sans)'; c.style.fontWeight = '600'; });
      d.miss = ['단위업무', '기록물철'].map((c, i) => {
        const e = K.at(root, '', { x: 1300 + i * 250, y: 358, w: 236, h: 40 }, c + ' ?');
        e.style.cssText += ';border:2.5px dashed var(--warn);border-radius:8px;color:#965A00;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;box-sizing:border-box;background:var(--warn-soft)';
        return e;
      });
      // B. 부서 대응
      d.bh = K.at(root, '', { x: 120, y: 470 }, '생산현황 부서명 65개 중 32개는 자기 분류기준표가 없다'); d.bh.style.cssText += ';font-size:30px;font-weight:800;letter-spacing:-0.02em';
      const segs = [
        ['직접', 33, 541619, C.ink, '자기 기준표가 있음'],
        ['준용', 17, 522546, C.warn, '김포·청주 기준표를 빌려 씀(제주·김해, 지방공항)'],
        ['승계추정', 9, 12185, '#965A00', '없어진 부서 → 현 부서로 추정'],
        ['대상외', 6, 417, C.mute, '노동조합 등'],
      ];
      d.bar = K.at(root, '', { x: 120, y: 530, w: 1680, h: 44 });
      d.bar.style.display = 'flex'; d.bar.style.borderRadius = '6px'; d.bar.style.overflow = 'hidden'; d.bar.style.gap = '3px';
      segs.forEach(sg => { const e = h('div', '', d.bar); e.style.cssText = `background:${sg[3]};flex:none;width:${Math.max(4, sg[2] / 1076767 * 1680 - 3).toFixed(1)}px`; });
      d.leg = segs.map((sg, i) => {
        const e = K.at(root, '', { x: 120 + [0, 840, 0, 840][i], y: 592 + (i >= 2 ? 50 : 0), w: 840 });
        e.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${sg[3]};margin-right:10px"></span><b style="font-weight:800">${sg[0]}</b> <span class="mono" style="font-size:20px;margin:0 6px">${sg[1]}개 부서 · ${sg[2].toLocaleString('ko-KR')}건</span><span class="small" style="font-size:20px">${sg[4]}</span>`;
        e.style.fontSize = '23px';
        return e;
      });
      // C. 비상계획실
      d.ch = K.at(root, '', { x: 120, y: 730 }, '비상계획실 기록물철 42행 중 34행은 단위업무명·철명이 비어 있다'); d.ch.style.cssText += ';font-size:30px;font-weight:800;letter-spacing:-0.02em';
      d.tbl = K.table(root, { x: 120, y: 786, w: 1040, cols: [{ label: 'ID', w: 110, cls: 'mono' }, { label: '소기능', w: 230 }, { label: '단위업무명', w: 300 }, { label: '기록물철명', w: 270 }, { label: '보존기간', w: 130 }],
        rows: [['F0396', '비상대비관리', '충무계획관리', '충무계획관리', '30년'], ['F0397', '비상대비관리', '<span class="gap">공란</span>', '<span class="gap">공란</span>', '5년'], ['F0398', '비상대비관리', '<span class="gap">공란</span>', '<span class="gap">공란</span>', '10년']] });
      d.tbl.el.querySelectorAll('.td').forEach(td => { td.style.padding = '9px 14px'; td.style.fontSize = '22px'; });
      d.tbl.el.querySelectorAll('.gap').forEach(g => { g.style.cssText = 'display:inline-block;border:2px dashed var(--warn);border-radius:6px;padding:0 12px;color:#965A00;font-weight:700;background:var(--warn-soft)'; });
      d.out = K.at(root, '', { x: 1240, y: 792, w: 560 });
      d.out.innerHTML = '<div style="font-size:22px;font-weight:700;color:var(--blue)">그래서 하네스는</div><div style="font-size:30px;font-weight:800;letter-spacing:-0.02em;line-height:1.35;margin-top:8px">확신이 없으면 정하지 않고 남긴다</div>';
      d.outs = ['미배정', '사람 확인', '보류'].map((t, i) => K.chip(d.out, t, 'warn lg'));
      const row = h('div', '', d.out); row.style.cssText = 'display:flex;gap:12px;margin-top:16px';
      d.outs.forEach(c => row.appendChild(c));
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.ah, lt, 0.4, { y: 12 });
      d.cols.forEach((c, i) => K.pop(c, lt, 0.55 + i * 0.05));
      const w = K.wave(lt, 2.4);
      d.miss.forEach((m, i) => { K.pop(m, lt, 1.0 + i * 0.12, { from: 1.3 }); if (lt > 1.6) m.style.borderColor = `rgba(232,147,12,${(0.45 + 0.55 * w).toFixed(3)})`; });
      K.rise(d.bh, lt, 1.2, { y: 12 });
      K.wipe(d.bar, lt, 1.35, 1.1);
      d.leg.forEach((e, i) => K.rise(e, lt, 1.7 + i * 0.08, { y: 8 }));
      K.rise(d.ch, lt, 2.0, { y: 12 });
      d.tbl.render(lt, 2.1, 0.1);
      K.rise(d.out, lt, 2.6, { x: 20, y: 0 });
      d.outs.forEach((c, i) => K.pop(c, lt, 2.8 + i * 0.1));
    },
  });

  // 6. 하네스 다섯 개와 발표 순서 — 필름 C 구간(일을 다섯 가지로 나눴다)
  DECK.slide({
    id: 'map', title: '일을 다섯 가지로 나눠 하네스 다섯 개', chapter: CH,
    notes: '기준표가 비어 있고 사람마다 고르는 철이 다르니, 일을 다섯 가지로 나눠 하네스 다섯 개를 만들었다(필름 C 구간과 같은 말). 필름에서 기록연구사가 던진 질문 다섯 개를 이 발표의 하네스 다섯 개에 그대로 대응시켰다. 순서도 필름과 같다. 문서 한 건(제목 배정)에서 시작해 조직 전체(조직 개편 추천)로 범위가 커진다.\n요청하신 과제 네 가지 가운데 「생산현황 분류 정정」은 일이 둘이라 하네스 두 개(제목 배정, 오분류 점검)가 나눠 맡았다.\n필름은 하네스 첫 구성(에이전트 15개)과 시험 실행을 보여 줬다. 이 발표의 하네스는 네 과제에 맞춰 새로 구성했고 에이전트는 18개다(3·3·3·4·5). 분류기준표·생산현황 자료는 같다.\n출처: 각 하네스 폴더의 .claude/agents/',
    setup(root, d) {
      d.T = K.title(root, { kicker: '하네스 다섯 개 · 발표는 영상과 같은 순서로 간다', title: '일을 다섯 가지로 나눠 하네스 다섯 개를 만들었다' });
      const S = DECK.slides;
      d.rows = K.HZ_ORDER.map((key, i) => {
        const hz = K.HZ[key];
        const a = S.findIndex(x => x.harness === key), b = S.length - 1 - [...S].reverse().findIndex(x => x.harness === key);
        const y = 292 + i * 120;
        const row = K.at(root, '', { x: 100, y, w: 1720, h: 108 });
        row.style.borderRadius = '16px';
        const ic = K.sprite(row, hz.img, { crop: true, x: 92, y: 54, w: 116 });
        const chip = K.hchip(row, key, { x: 180, y: 14 }); chip.style.fontSize = '27px'; chip.style.padding = '9px 18px 10px';
        const dir = K.at(row, 'mono', { x: 182, y: 66 }, `${hz.dir} · 에이전트 ${hz.agents}`); dir.style.cssText += ';font-size:19px;color:var(--ink-2);white-space:nowrap';
        const qb = K.at(row, '', { x: 620, y: 18 });
        qb.style.cssText += ';background:var(--ink);color:#fff;border-radius:22px 22px 22px 5px;padding:15px 24px 16px;font:700 29px/1.1 var(--sans);letter-spacing:-0.02em;white-space:nowrap';
        const qt = h('span', '', qb, '');
        const tk = K.at(row, '', { x: 1300, y: 20 }, '과제'); tk.style.cssText += ';font-size:19px;font-weight:600;color:var(--mute)';
        const tn = K.at(row, '', { x: 1300, y: 48 }, hz.task); tn.style.cssText += ';font-size:27px;font-weight:800;letter-spacing:-0.02em;color:var(--ink);white-space:nowrap';
        const pg = K.at(row, 'mono num', { r: 24, y: 34 }, `${a + 1}–${b + 1}`); pg.style.cssText += `;font-size:30px;font-weight:700;color:${hz.c};text-align:right`;
        return { row, ic, chip, dir, qb, qt, q: hz.q, tk, tn, pg, c: hz.c };
      });
      // 같은 과제를 두 하네스가 나눠 맡는 표시
      d.svg = K.svg(root);
      d.brace = K.path(d.svg, [[1390, 314], [1380, 314], [1380, 498], [1390, 498]], { color: K.C.ink2, width: 2.5, radius: 8 });
      const sIdx = id => DECK.slides.findIndex(x => x.id === id) + 1;
      const firstH = DECK.slides.findIndex(x => x.id === 'h-parts') + 1;
      d.foot = K.at(root, 'small', { x: 120, y: 908, w: 1680 },
        `영상은 하네스 첫 구성(에이전트 15개)과 시험 실행을 보여 줬다. 이 발표는 네 과제에 맞춰 새로 구성한 하네스(에이전트 18개)의 실행 결과다.<br>공통 구조 ${firstH}–${firstH + 3}장 · 사람이 정할 것과 맺음 ${sIdx('h-human')}–${DECK.slides.length}장`);
      d.foot.style.cssText += ';font-size:21px;line-height:1.55;color:var(--ink-2)';
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
      K.rise(d.foot, lt, 1.6, { y: 10 });
      const k = K.cycle(lt, 3.4, 1.5, 5);
      d.rows.forEach((r, i) => {
        r.row.style.background = k === i ? 'rgba(27,42,74,.055)' : 'transparent';
        r.ic.style.transform = `translateY(${k === i ? -6 : 0}px)`;
      });
    },
  });
})();

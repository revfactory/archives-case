/* 단위업무명 추천 — 과제 「단위업무명 추천·제안」. 필름 F 구간에 이어진다. 출처는 storyboard.md 「5. 사례 4」
   숫자 출처: kac-unit-task-naming/output/20261117-감사실/요약.md, 단위업무_제안표.csv,
   _workspace/20261117-감사실/manifest.json, 감사실/clusters.json·proposals.json·review_v1.json·review.json */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css } = RH;
  const C = K.C;
  const CH = '단위업무명 추천 · 단위업무명 추천·제안';

  // ── 한글 자모 분해: 음절 코드 = 0xAC00 + (초성 × 21 + 중성) × 28 + 종성 ──
  const CHO = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
  const JUNG = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
  const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
  const V_H = new Set([8, 12, 13, 17, 18]);           // ㅗㅛㅜㅠㅡ: 초성 아래에 놓이는 모음
  const V_C = new Set([9, 10, 11, 14, 15, 16, 19]);   // ㅘㅙㅚㅝㅞㅟㅢ: 아래와 오른쪽에 걸치는 모음
  // 음절 하나를 자모 조각으로 나눈다. dx, dy 는 풀렸을 때 음절 가운데에서 떨어진 거리(글자 크기 비율)
  function decompose(ch) {
    const c = ch.codePointAt(0) - 0xAC00;
    if (c < 0 || c > 11171) return [{ j: ch, dx: 0, dy: 0 }];   // 가운뎃점 같은 기호는 한 조각
    const L = Math.floor(c / 588), V = Math.floor((c % 588) / 28), T = c % 28;
    const vk = V_H.has(V) ? 'h' : V_C.has(V) ? 'c' : 'v';
    const out = [{ j: CHO[L], dx: vk === 'h' ? 0 : -0.28, dy: -0.36 }];
    if (vk === 'v') out.push({ j: JUNG[V], dx: 0.3, dy: -0.36 });
    else if (vk === 'h') out.push({ j: JUNG[V], dx: 0, dy: 0.1 });
    else out.push({ j: JUNG[V], dx: 0.26, dy: 0.04 });
    if (T) out.push({ j: JONG[T], dx: 0, dy: 0.6 });
    return out;
  }
  // 두 이름에서 그대로 남는 글자 짝 [옛 위치, 새 위치] (최장 공통 부분열)
  function lcs(a, b) {
    const n = a.length, m = b.length;
    const T = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      T[i][j] = a[i] === b[j] ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]);
    const pairs = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; }
      else if (T[i + 1][j] >= T[i][j + 1]) i++;
      else j++;
    }
    return pairs;
  }
  const MC = document.createElement('canvas').getContext('2d');
  function measure(chars, font, ls) {
    MC.font = font;
    let x = 0;
    const cells = chars.map(ch => { const w = MC.measureText(ch).width; const c = { x, w }; x += w + ls; return c; });
    return { cells, w: x - ls };
  }
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };

  // 이름 하나의 자모 재조립 장면을 만든다. 위치 계산은 글꼴이 확실히 준비된 render 때 한다.
  function buildMorph(host, from, to, S) {
    const A = [...from], B = [...to];
    const pairs = lcs(A, B);
    const keepA = new Map(pairs.map(([i, j]) => [i, j]));
    const keepB = new Set(pairs.map(p => p[1]));
    const M = { S, A, B, keepB, keep: [], olds: [], news: [], pieces: [], lines: [], laid: false };
    const glyph = ch => {
      const e = h('span', '', host, ch);
      e.style.cssText = `position:absolute;left:0;top:0;white-space:pre;font-size:${S}px;font-weight:800;line-height:1;letter-spacing:0;transform-origin:50% 60%`;
      return e;
    };
    A.forEach((ch, i) => {
      if (ch === ' ') return;
      if (keepA.has(i)) M.keep.push({ el: glyph(ch), i, j: keepA.get(i) });
      else M.olds.push({ el: glyph(ch), i, parts: decompose(ch) });
    });
    B.forEach((ch, j) => { if (ch !== ' ' && !keepB.has(j)) M.news.push({ el: glyph(ch), j, parts: decompose(ch) }); });
    // 새 음절에 필요한 자모를 옛 음절에서 같은 자모로 찾는다(위치가 가까운 것부터). 못 찾으면 아래에서 들어온다.
    const pool = [];
    M.olds.forEach(o => o.parts.forEach(p => pool.push({ ...p, src: o, used: false })));
    M.news.forEach(n => n.parts.forEach(p => {
      let best = null, bd = 1e9;
      pool.forEach(q => {
        if (q.used || q.j !== p.j) return;
        const dd = Math.abs(q.src.i - n.j);
        if (dd < bd) { bd = dd; best = q; }
      });
      if (best) best.used = true;
      M.pieces.push({ j: p.j, from: best && { src: best.src, dx: best.dx, dy: best.dy }, to: { dst: n, dx: p.dx, dy: p.dy } });
    }));
    pool.filter(q => !q.used).forEach(q => M.pieces.push({ j: q.j, from: { src: q.src, dx: q.dx, dy: q.dy }, to: null }));
    const js = Math.round(S * 0.56);
    M.pieces.forEach((p, k) => {
      p.el = h('span', '', host, p.j);
      p.el.style.cssText = `position:absolute;left:0;top:0;white-space:pre;font-size:${js}px;font-weight:700;line-height:1;opacity:0`;
      p.r = K.rand(k + 1, 41 + S);
      p.r2 = K.rand(k + 1, 53 + S);
    });
    // 바뀐 음절 묶음 아래 밑줄(머무는 동안 강조에 쓴다)
    let run = null;
    const runs = [];
    B.forEach((ch, j) => {
      const changed = !keepB.has(j);
      if (changed && ch !== ' ') { if (!run) { run = [j, j]; runs.push(run); } else run[1] = j; }
      else if (!changed && run) run = null;
    });
    M.runs = runs;
    M.lines = runs.map(() => { const u = h('div', '', host); u.style.cssText = `position:absolute;top:${S + 12}px;height:5px;border-radius:3px;background:${C.blue};opacity:0`; return u; });
    return M;
  }
  function layoutMorph(M) {
    const S = M.S, ls = -0.02 * S, f = `800 ${S}px Pretendard`;
    const fa = measure(M.A, f, ls), fb = measure(M.B, f, ls);
    M.keep.forEach(k => { k.x0 = fa.cells[k.i].x; k.x1 = fb.cells[k.j].x; });
    M.olds.forEach(o => { const c = fa.cells[o.i]; o.x = c.x; o.cx = c.x + c.w / 2; });
    M.news.forEach(n => { const c = fb.cells[n.j]; n.x = c.x; n.cx = c.x + c.w / 2; });
    MC.font = `700 ${Math.round(S * 0.56)}px Pretendard`;
    M.pieces.forEach(p => { p.w = MC.measureText(p.j).width; });
    M.runs.forEach((r, i) => {
      const a = fb.cells[r[0]], b = fb.cells[r[1]];
      M.lines[i].style.left = a.x.toFixed(1) + 'px';
      M.lines[i].style.width = (b.x + b.w - a.x).toFixed(1) + 'px';
    });
    M.laid = true;
    M.fontOk = document.fonts ? document.fonts.check(f) : true;
  }
  // u = 재조립 시작 뒤 지난 초. 0 이전에는 옛 이름, 1.75 뒤에는 새 이름이 그대로 보인다.
  function renderMorph(M, u) {
    if (!M.laid || (!M.fontOk && document.fonts && document.fonts.check(`800 ${M.S}px Pretendard`))) layoutMorph(M);
    const S = M.S, js = Math.round(S * 0.56), cy = S * 0.52;
    // 그대로 남는 음절은 풀리지 않고 새 자리로 미끄러진다
    const pk = prog(u, 0.3, 1.0, ease.inOutCubic);
    M.keep.forEach(k => { k.el.style.transform = `translate(${lerp(k.x0, k.x1, pk).toFixed(1)}px,0)`; });
    // 바뀌는 옛 음절은 자모로 풀리며 사라진다
    const fo = 1 - prog(u, 0.02, 0.16, ease.linear);
    M.olds.forEach(o => { o.el.style.opacity = fo.toFixed(3); o.el.style.transform = `translate(${o.x.toFixed(1)}px,0)`; });
    // 새 음절은 모인 자모 자리에서 나타나 군청에서 먹색으로 돌아온다
    const fi = prog(u, 1.5, 0.18, ease.linear), sc = lerp(1.12, 1, prog(u, 1.5, 0.4, ease.snap));
    const col = mix(C.blue, C.ink, prog(u, 1.7, 0.9, ease.linear));
    M.news.forEach(n => {
      n.el.style.opacity = fi.toFixed(3);
      n.el.style.transform = `translate(${n.x.toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
      n.el.style.color = col;
    });
    const spread = prog(u, 0.03, 0.27, ease.outCubic);
    const gather = 1 - prog(u, 1.36, 0.26, ease.inCubic);
    M.pieces.forEach(p => {
      if (u <= 0 || u >= 1.72) { if (p.el.style.opacity !== '0') p.el.style.opacity = '0'; return; }
      const ts = 0.28 + p.r * 0.22, tu = prog(u, ts, 0.85, ease.inOutCubic);
      const fp = p.from && { x: p.from.src.cx + p.from.dx * S * spread, y: cy + p.from.dy * S * spread };
      const tp = p.to && { x: p.to.dst.cx + p.to.dx * S * gather, y: cy + p.to.dy * S * gather };
      let x, y, a, color = C.blue;
      if (fp && tp) {
        const arc = (0.2 + 0.35 * p.r2) * S * (p.r > 0.45 ? 1 : -0.75);
        x = lerp(fp.x, tp.x, tu);
        y = lerp(fp.y, tp.y, tu) - Math.sin(Math.PI * tu) * arc;
        a = Math.min(prog(u, 0, 0.12, ease.linear), 1 - prog(u, 1.5, 0.18, ease.linear));
      } else if (fp) {   // 새 이름에 쓰이지 않는 자모: 위로 흩어지며 사라진다
        x = fp.x + (p.r2 - 0.5) * S * 0.8 * tu;
        y = fp.y - S * 0.85 * tu;
        a = Math.min(prog(u, 0, 0.12, ease.linear), 1 - prog(u, ts, 0.55, ease.linear));
        color = C.mute;
      } else {           // 옛 이름에 없던 자모: 아래에서 들어온다
        x = tp.x;
        y = tp.y + S * 0.9 * (1 - tu);
        a = Math.min(prog(u, ts + 0.1, 0.45, ease.linear), 1 - prog(u, 1.5, 0.18, ease.linear));
      }
      p.el.style.opacity = a.toFixed(3);
      p.el.style.color = color;
      p.el.style.transform = `translate(${(x - p.w / 2).toFixed(1)}px,${(y - js / 2).toFixed(1)}px)`;
    });
  }

  // 34. 챕터 영상
  DECK.slide({
    id: 'ch-naming', title: '단위업무명 추천 챕터 영상', bg: 'paper', harness: 'naming', video: 'media/ch_naming.mp4', poster: 'media/ch_naming.jpg',
    notes: '10초 챕터 영상. 필름 F 구간의 작업장(라벨 프린터 책상)이 움직이고, 질문 「기준표에 없는 업무는요?」에 kac-unit-task-naming이 답한다. 감사실 이름 하나가 자모로 풀렸다가 제안 이름으로 다시 모인다. 끝나면 → 키로 넘긴다.',
  });

  // 35. 과제와 흐름
  DECK.slide({
    id: 'c4-flow', title: '과제와 흐름', chapter: CH, harness: 'naming',
    notes: '부서 하나의 생산·접수 문서 제목을 스크립트가 군집으로 줄이고, 에이전트 세 종류가 해석(sonnet 4건 병렬) → 이름 제안(opus) → 검토(opus) 순서로 처리한다.\n검토 에이전트(naming-reviewer)는 Edit 도구가 없어 제안을 직접 고치지 못한다. 통과·수정필요·기각만 적어 돌려보내고, 수정과 재검토는 1회로 정했다. 그래도 남은 지적은 제안표에 그대로 남겨 사람이 판단한다.\n자기 분류기준표가 있는 부서는 대조 모드, 기준표를 빌려 쓰는 부서는 초안 모드로 처리한다. 이름 규칙은 기존 이름 699개와 담당부서 의견 185종에서 뽑았다(평균 10.5자, "관리"로 끝나는 이름 83%).\n출처: kac-unit-task-naming/.claude/skills/unit-task-naming/SKILL.md, unit-task-naming-rules/SKILL.md, references/naming-conventions.md, .claude/agents/*.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '과제 · 단위업무명 추천·제안', title: '문서 제목을 묶어 읽고 단위업무 이름을 다시 짓는다',
        sub: '생산현황 문서 제목으로 부서의 업무 묶음을 찾고, 기존 단위업무 이름이 그 문서를 가리키는지 확인한다.' });
      const Y = 494;   // 흐름 중심선
      d.svg = K.svg(root);
      const steps = [['1', '준비', 120], ['2', '해석 · 병렬', 400], ['3', '제안', 840], ['4', '검토', 1210], ['5', '제안표', 1580]];
      d.steps = steps.map(([n, t, x]) => {
        const e = K.at(root, '', { x, y: 342 }, `<span class="mono" style="color:var(--blue);font-weight:700;margin-right:10px">${n}</span>${t}`);
        e.style.cssText += ';font-size:22px;font-weight:700;color:var(--ink-2)';
        return e;
      });
      d.prep = K.script(root, { name: 'prepare_dept.py', cap: '공통 수신을 떼고 제목을 군집으로 묶는다', x: 120, y: Y - 54, w: 216 });
      // 해석 에이전트: part 4개를 병렬로 맡는다
      const AY = Y - 116;
      d.ac = K.at(root, 'agent', { x: 400, y: AY, w: 370, h: 232 });
      h('div', 'nm', d.ac, 'work-cluster-analyst');
      h('div', 'md sonnet', d.ac, 'sonnet');
      const parts = [['part_01', '군집 30'], ['part_02', '군집 30'], ['part_03', '군집 30'], ['part_04', '부서공통 추정 7']];
      d.parts = parts.map((pt, i) => {
        const r = K.at(d.ac, '', { x: 16, y: 56 + i * 42, w: 334, h: 34 });
        r.style.cssText += ';border-radius:7px;background:var(--paper-2);overflow:hidden';
        const fill = K.at(r, '', { x: 0, y: 0, w: 334, h: 34 });
        fill.style.background = 'rgba(47,123,255,.16)';
        const a = K.at(r, 'mono', { x: 12, y: 6 }, pt[0]); a.style.cssText += ';font-size:19px;color:var(--blue-2);font-weight:500';
        const b = K.at(r, '', { r: 12, y: 5 }, pt[1]); b.style.cssText += ';font-size:19px;font-weight:600;color:var(--ink-2)';
        return { r, fill, y: AY + 56 + i * 42 + 17 };
      });
      d.namer = K.agent(root, { name: 'unit-task-namer', role: '이름 제안·수정', model: 'opus', kind: 'make', x: 840, y: Y - 80, w: 300,
        note: '단위업무마다 유지·개명·통합·폐지 검토·신설을 정한다' });
      d.rev = K.agent(root, { name: 'naming-reviewer', role: '제안 검토', model: 'opus', kind: 'check', x: 1210, y: Y - 80, w: 300,
        note: '통과·수정필요·기각만 적고 제안은 고치지 못한다' });
      d.build = K.script(root, { name: 'build_report.py', cap: '제안표 xlsx·csv와 요약.md', x: 1580, y: Y - 54, w: 220 });
      // 연결선
      d.fan = d.parts.map(pt => {
        const p = K.path(d.svg, `M 336 ${Y} C 370 ${Y}, 366 ${pt.y}, 400 ${pt.y}`, { color: C.blue, width: 2.5 });
        K.dots(d.svg, p, 1, { r: 5 });
        return p;
      });
      d.join = d.parts.map(pt => {
        const p = K.path(d.svg, `M 770 ${pt.y} C 806 ${pt.y}, 804 ${Y}, 840 ${Y}`, { color: C.blue, width: 2.5 });
        K.dots(d.svg, p, 1, { r: 5 });
        return p;
      });
      d.p3 = K.path(d.svg, [[1140, Y], [1208, Y]], { color: C.blue, width: 2.5, arrow: true });
      K.dots(d.svg, d.p3, 1, { r: 5 });
      d.p4 = K.path(d.svg, [[1510, Y], [1578, Y]], { color: C.blue, width: 2.5, arrow: true });
      K.dots(d.svg, d.p4, 1, { r: 5 });
      const LY = Y + 132;
      d.loop = K.path(d.svg, [[1360, Y + 82], [1360, LY], [990, LY], [990, Y + 84]], { color: C.warn, width: 2.5, arrow: true, radius: 16 });
      K.dots(d.svg, d.loop, 1, { r: 6, color: C.warn });
      d.loopLab = K.at(root, '', { x: 990, y: LY + 12, w: 370 }, '수정필요 → 고쳐서 다시 검토(1회)');
      d.loopLab.style.cssText += ';font-size:21px;font-weight:700;color:#965A00;text-align:center';
      // 아래 왼쪽: 두 모드
      d.mt = K.table(root, {
        x: 120, y: 712, w: 810,
        cols: [{ label: '', w: 120 }, { label: '대조 모드', w: 345 }, { label: '초안 모드', w: 345 }],
        rows: [
          ['대상 부서', '자기 분류기준표가 있는 부서', '기준표를 빌려 쓰는 부서(제주·김해 운영단, 지방공항 등)'],
          ['하는 일', '기존 단위업무마다 유지·개명·통합·폐지 검토를 정하고, 기준표에 없는 업무는 신설로 낸다', '빌린 기준표는 참고만 하고 단위업무 목록 초안을 새로 짓는다'],
        ],
      });
      const ths = d.mt.head.querySelectorAll('.th');
      ths[1].innerHTML = '대조 모드 <span style="display:inline-block;margin-left:10px;font-size:19px;font-weight:700;color:#0B7A52;background:var(--ok-soft);border:1.5px solid rgba(25,169,116,.45);border-radius:6px;padding:2px 10px">이번 실행 · 감사실</span>';
      [ths[1], ths[2]].forEach(t => { t.style.fontSize = '24px'; t.style.color = 'var(--ink)'; t.style.fontWeight = '800'; });
      d.mt.el.querySelectorAll('.td').forEach((td, i) => {
        td.style.fontSize = '21px'; td.style.padding = '10px 14px'; td.style.lineHeight = '1.42';
        if (i % 3 === 0) { td.style.fontWeight = '700'; td.style.color = 'var(--mute)'; td.style.fontSize = '20px'; }
      });
      // 아래 오른쪽: 이름 짓는 규칙
      d.rh = K.at(root, '', { x: 990, y: 708 }, '이름 짓는 규칙');
      d.rh.style.cssText += ';font-size:26px;font-weight:800;letter-spacing:-0.02em';
      const segs = [['대상', '공직윤리', 150], ['행위 1~3개', '신고·점검·조치', 250], ['끝말', '관리', 100]];
      let sx = 990;
      d.segs = segs.map((sg, i) => {
        const b = K.at(root, '', { x: sx, y: 756, w: sg[2], h: 86 });
        b.style.cssText += ';border:2px solid var(--rule-2);border-radius:10px;background:var(--paper-3);box-sizing:border-box;padding:8px 14px';
        const l = h('div', '', b, sg[0]); l.style.cssText = 'font-size:19px;font-weight:600;color:var(--mute)';
        const v = h('div', '', b, sg[1]); v.style.cssText = 'font-size:28px;font-weight:800;letter-spacing:-0.02em;margin-top:2px;white-space:nowrap';
        const plus = i < 2 ? K.at(root, '', { x: sx + sg[2] + 8, y: 780 }, '+') : null;
        if (plus) plus.style.cssText += ';font-size:28px;font-weight:700;color:var(--mute)';
        sx += sg[2] + 36;
        return { b, plus };
      });
      d.segNote = K.at(root, 'small', { x: sx - 10, y: 790, w: 1800 - sx + 10 }, '감사실 기존 이름 예');
      d.segNote.style.fontSize = '19px';
      const rules = [
        '나란히 놓는 낱말은 가운뎃점(·)으로 잇고 ‘및’은 쓰지 않는다',
        '연도·차수·업체명·괄호, 알림·제출 같은 처리 행위는 넣지 않는다',
        '같은 부서의 다른 단위업무와 겹치지 않는 이름을 짓는다',
      ];
      d.rules = rules.map((r, i) => {
        const e = K.at(root, '', { x: 990, y: 864 + i * 38, w: 810 }, `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--blue);margin-right:14px;vertical-align:3px"></span>${r}`);
        e.style.cssText += ';font-size:22px;color:var(--ink-2);white-space:nowrap';
        return e;
      });
    },
    render(lt, d) {
      d.T.render(lt);
      d.steps.forEach((e, i) => K.rise(e, lt, 0.45 + i * 0.12, { y: 10 }));
      K.rise(d.prep, lt, 0.5, { x: -20, y: 0 });
      d.fan.forEach((p, i) => K.draw(p, lt, 0.7 + i * 0.05, 0.4, { speed: 70 }));
      K.pop(d.ac, lt, 0.75);
      d.parts.forEach((pt, i) => {
        K.rise(pt.r, lt, 0.85 + i * 0.06, { x: -16, y: 0, blur: 0 });
        // 처리 중 표시: part 마다 다른 속도로 채워졌다 비워진다
        const per = 2.2 + i * 0.35, loc = lt < 1.4 ? -1 : ((lt - 1.4 + i * 0.4) % per) / per;
        const f = loc < 0 ? 0 : loc < 0.75 ? ease.inOutCubic(loc / 0.75) : 1 - (loc - 0.75) / 0.25;
        pt.fill.style.transform = `scaleX(${f.toFixed(3)})`;
        pt.fill.style.transformOrigin = '0 50%';
      });
      d.join.forEach((p, i) => K.draw(p, lt, 1.0 + i * 0.05, 0.4, { speed: 70 }));
      K.pop(d.namer, lt, 1.1);
      K.draw(d.p3, lt, 1.25, 0.3, { speed: 60 });
      K.pop(d.rev, lt, 1.35);
      K.draw(d.p4, lt, 1.5, 0.3, { speed: 60 });
      K.rise(d.build, lt, 1.6, { x: 20, y: 0 });
      K.draw(d.loop, lt, 1.6, 0.6, { speed: 160 });
      K.rise(d.loopLab, lt, 1.9, { y: 10 });
      d.mt.render(lt, 1.9, 0.1);
      K.rise(d.rh, lt, 2.0, { y: 10 });
      const k = K.cycle(lt, 3.2, 1.6, 3);
      d.segs.forEach((sg, i) => {
        K.pop(sg.b, lt, 2.1 + i * 0.1);
        if (sg.plus) K.rise(sg.plus, lt, 2.15 + i * 0.1, { y: 0 });
        const on = k === i;
        RH.set(sg.b, 'borderColor', on ? C.blue : 'rgba(27,42,74,.28)');
        RH.set(sg.b, 'background', on ? 'rgba(47,123,255,.06)' : '#FFFAF2');
      });
      K.rise(d.segNote, lt, 2.4, { x: -10, y: 0 });
      d.rules.forEach((e, i) => K.rise(e, lt, 2.4 + i * 0.1, { y: 10 }));
    },
  });

  // 36. 감사실 실행 결과
  // 상위 군집 90개의 문서 수(문서 수 순)와 처리(k 유지 근거, r 개명 근거, h 보류). 출처 clusters.json, proposals.json
  const CL = [237,193,193,170,163,155,154,133,126,118,85,84,70,70,70,67,67,65,65,63,60,59,59,55,52,50,49,48,46,46,45,43,43,43,42,41,39,39,39,38,38,37,37,37,36,36,36,35,35,35,34,33,32,29,29,28,27,27,27,27,26,25,25,24,24,23,23,23,23,23,23,23,23,23,23,22,22,22,22,21,20,20,20,20,20,20,20,19,18,18];
  const CT = 'kkkkkkrkkhkkhkkkkkkkrrkkkkkkkrkkkkkhkkkkkkkkkkkkkkkhrkkhhrhkhhkkkhkkkkkhkkkkkkkkkkkkrkhhkh';
  DECK.slide({
    id: 'c4-run', title: '감사실 실행 결과', chapter: CH, harness: 'naming',
    notes: '감사실 문서 8,978건에서 8개 이상 부서가 같은 제목으로 받은 공통 수신 2,152건을 빼고, 출장·지출처럼 부서공통 사무로 보이는 193건(묶음 7개)을 따로 뗐다. 남은 6,633건을 제목이 비슷한 것끼리 묶어 문서가 많은 상위 군집 90개(4,597건, 69%)를 에이전트가 해석했다.\n소규모 군집 2,036건은 이번에 보지 않았다. 그래서 "문서가 없다"는 판단은 폐지가 아니라 통합·폐지 검토로만 낸다.\n기존 단위업무 23개를 모두 유지 17, 개명 3, 통합·폐지 검토 3으로 정했고 신설은 없다. 보류 21개는 부서공통·혼합·타부서 소관 수신 군집 14개와 부서공통 추정 묶음 7개다. 검토 1회차에서 4건이 수정필요였고, 고친 뒤 2회차에 2건(P013, P020)이 남았다.\n출처: kac-unit-task-naming/output/20261117-감사실/요약.md, _workspace/20261117-감사실/manifest.json, 감사실/clusters.json·proposals.json·review_v1.json·review.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '감사실 실행 결과 · 대조 모드', title: '문서 8,978건을 군집 90개로 줄여 읽었다' });
      // 캔버스(점·막대)
      const CX = 100, CY = 280, CW = 1720, CHh = 720;
      const cv = h('canvas', '', root);
      css(cv, { position: 'absolute', left: CX + 'px', top: CY + 'px', width: CW + 'px', height: CHh + 'px' });
      cv.width = CW * 2; cv.height = CHh * 2;
      d.ctx = cv.getContext('2d');
      d.ctx.setTransform(2, 0, 0, 2, -CX * 2, -CY * 2);
      d.clip = [CX, CY, CW, CHh];
      // 점 배치
      const FX = 120, FY = 380, COLS = 80, P = 3.5;
      const cnt = [2152, 193, 2036, 4597];   // 공통 수신, 부서공통 추정, 소규모 군집, 상위 군집
      const N = cnt.reduce((a, b) => a + b, 0);   // 8,978
      const gaps = [34, 60, 34];
      d.blockY = [];
      let by = FY;
      cnt.forEach((c, i) => { d.blockY.push(by); by += Math.ceil(c / COLS) * P + (gaps[i] || 0); });
      d.blockH = cnt.map(c => Math.ceil(c / COLS) * P);
      // 칸 섞기(결정적)
      const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => K.rand(a, 11) - K.rand(b, 11));
      const BX = 762, BASE = 690, HP = 290 / 237;
      d.bar = { BX, BASE, HP, PITCH: 11.5, W: 8 };
      const D = d.D = {
        ix: new Float32Array(N), iy: new Float32Array(N), sx: new Float32Array(N), sy: new Float32Array(N),
        tx: new Float32Array(N), ty: new Float32Array(N), cat: new Uint8Array(N), j: new Int16Array(N),
        tA: new Float32Array(N), tS: new Float32Array(N), tF: new Float32Array(N), arc: new Float32Array(N),
      };
      let i = 0;
      const bars = CL.map(() => 0);
      let cj = 0;
      cnt.forEach((c, cat) => {
        for (let q = 0; q < c; q++, i++) {
          const cell = order[i], row = Math.floor(cell / COLS), col = cell % COLS;
          D.ix[i] = FX + col * P; D.iy[i] = FY + row * P;
          D.sx[i] = FX + (q % COLS) * P; D.sy[i] = d.blockY[cat] + Math.floor(q / COLS) * P;
          D.cat[i] = cat;
          D.tA[i] = 0.3 + (row / 113) * 0.45 + K.rand(i, 3) * 0.08;
          D.tS[i] = 0.95 + cat * 0.08 + K.rand(i, 5) * 0.2;
          D.j[i] = -1;
          if (cat === 3) {
            while (bars[cj] >= CL[cj]) cj++;
            const k = bars[cj]++;
            D.j[i] = cj;
            D.tx[i] = BX + cj * 11.5;
            D.ty[i] = BASE - (k + 1) * HP;
            D.tF[i] = 1.75 + (cj / 90) * 0.4 + K.rand(i, 9) * 0.15;
            D.arc[i] = 30 + K.rand(i, 13) * 70;
          }
        }
      });
      d.N = N;
      // 왼쪽 글
      d.head = K.at(root, '', { x: 120, y: 296 }, '감사실 문서 <span class="num">0</span>건');
      d.head.style.cssText += ';font-size:28px;font-weight:800;letter-spacing:-0.02em';
      d.headN = d.head.querySelector('span');
      d.headS = K.at(root, 'small', { x: 120, y: 338 }, '점 하나 = 문서 한 건');
      d.headS.style.fontSize = '19px';
      const labs = [
        ['공통 수신 2,152건 제외', '8개 이상 부서가 같은 제목으로 받은 공문'],
        ['부서공통 추정 193건', '출장·지출 등 묶음 7개, 보류'],
        ['소규모 군집 2,036건', '이번에는 분석하지 않음'],
        ['상위 군집 90개 · 4,597건', '군집 대상 6,633건의 69% → 오른쪽 막대'],
      ];
      d.labs = labs.map((l, k) => {
        const y = k === 1 ? d.blockY[1] + d.blockH[1] / 2 - 18 : d.blockY[k] - 4;
        const e = K.at(root, '', { x: 418, y, w: 320 }, `<div style="font-size:23px;font-weight:800;letter-spacing:-0.02em;color:${k === 3 ? 'var(--ink)' : 'var(--ink-2)'}">${l[0]}</div><div style="font-size:19px;color:var(--mute);margin-top:2px;line-height:1.35">${l[1]}</div>`);
        return e;
      });
      d.eq = K.at(root, 'mono', { x: 120, y: d.blockY[3] + d.blockH[3] + 22 }, '8,978 − 2,152 − 193 = 6,633');
      d.eq.style.cssText += ';font-size:20px;color:var(--ink-2)';
      // 오른쪽 위: 막대 머리와 범례
      d.bh = K.at(root, '', { x: 760, y: 296 }, '상위 군집 90개 · 문서 수 순');
      d.bh.style.cssText += ';font-size:24px;font-weight:800;letter-spacing:-0.02em';
      const sw = c => `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${c};margin:0 8px 0 18px;vertical-align:-1px"></span>`;
      d.leg = K.at(root, '', { r: 120, y: 302 }, `${sw(C.ok)}유지 근거${sw(C.blue)}개명 근거${sw('#A4A9B6')}보류`);
      d.leg.style.cssText += ';font-size:20px;font-weight:600;color:var(--ink-2)';
      d.ax0 = K.at(root, 'mono', { x: 760, y: 700 }, 'c001 · 237건'); d.ax0.style.cssText += ';font-size:19px;color:var(--mute)';
      d.ax1 = K.at(root, 'mono', { r: 120, y: 700 }, 'c090 · 18건'); d.ax1.style.cssText += ';font-size:19px;color:var(--mute);text-align:right';
      // 머무는 동안 순환하는 설명(막대 강조와 짝)
      const caps = [
        ['군집 90개', 'var(--ink)', '유지 근거 69 + 개명 근거 7 + 보류 14'],
        ['개명 근거 군집 7개', 'var(--blue)', 'c007 · c058 · c021 · c022 · c053 · c030 · c085'],
        ['보류 군집 14개', '#6A7287', '부서공통·혼합·타부서 소관 수신 등. 부서공통 추정 묶음 7개도 보류'],
        ['유지 근거 군집 69개', '#0B7A52', '이름이 문서와 맞는 기존 단위업무 17개의 근거'],
      ];
      d.caps = caps.map(c => {
        const e = K.at(root, '', { x: 1250, y: 392, w: 550 }, `<div style="font-size:30px;font-weight:800;letter-spacing:-0.02em;color:${c[1]}">${c[0]}</div><div style="font-size:20px;color:var(--ink-2);margin-top:6px;line-height:1.4">${c[2]}</div>`);
        e.style.opacity = '0';
        return e;
      });
      d.caps[1].lastChild.classList.add('mono');
      d.caps[1].lastChild.style.fontSize = '19px';
      d.caps[1].lastChild.style.whiteSpace = 'nowrap';
      // 오른쪽 아래: 제안 결과
      d.rt = K.at(root, '', { x: 760, y: 752 }, '제안 23건 · 기존 단위업무 23개를 모두 판단했다');
      d.rt.style.cssText += ';font-size:26px;font-weight:800;letter-spacing:-0.02em';
      d.rt0 = K.at(root, '', { r: 120, y: 756 }, '신설·초안 0건');
      d.rt0.style.cssText += ';font-size:22px;font-weight:600;color:var(--mute)';
      const groups = [['유지', 17, C.ok, '#0B7A52'], ['개명', 3, C.blue, C.blue], ['통합·폐지 검토', 3, C.warn, '#965A00']];
      d.tiles = []; d.glab = [];
      let tx = 760;
      groups.forEach((g, gi) => {
        const gx = tx;
        for (let t = 0; t < g[1]; t++) {
          const e = K.at(root, '', { x: tx, y: 802, w: 34, h: 34 });
          e.style.cssText += `;background:${g[2]};border-radius:5px`;
          d.tiles.push({ e, g: gi });
          tx += 40;
        }
        const l = K.at(root, '', { x: gx, y: 846 }, `${g[0]} ${g[1]}`);
        l.style.cssText += `;font-size:22px;font-weight:800;color:${g[3]};white-space:nowrap`;
        d.glab.push(l);
        tx += 22;
      });
      d.hold = K.at(root, '', { x: 760, y: 898 }, '<b style="font-weight:800">보류 21개</b><span style="color:var(--mute)"> · 군집 14개와 부서공통 추정 묶음 7개</span>');
      d.hold.style.cssText += ';font-size:22px;color:var(--ink-2)';
      d.rv = K.at(root, '', { x: 760, y: 938 }, '<b style="font-weight:800">검토</b> 1회차 수정필요 4건 → 고친 뒤 2회차 2건');
      d.rv.style.cssText += ';font-size:22px;color:var(--ink-2)';
      d.stamp = K.stampEl(root, '수정필요 2건', 'warn', { x: 1560, y: 900 });
      d.stamp.style.background = 'rgba(251,250,246,.6)';
    },
    render(lt, d) {
      d.T.render(lt);
      const ctx = d.ctx, D = d.D, B = d.bar;
      ctx.clearRect(...d.clip);
      // 순환 강조: -1/0 전체, 1 개명, 2 보류, 3 유지
      const st = K.cycle(lt, 3.4, 2.6, 4);
      const loc = st < 0 ? 0 : (lt - 3.4) % 2.6;
      const on = st > 0 ? Math.min(prog(loc, 0, 0.3), 1 - prog(loc, 2.3, 0.3)) : 0;
      const focus = ['', 'r', 'h', 'k'][Math.max(0, st)];
      const tcol = { k: C.ok, r: C.blue, h: '#A4A9B6' };
      const barCol = CL.map((_, j) => mix(C.ink, tcol[CT[j]], prog(lt, 2.55 + j * 0.004, 0.35, ease.linear)));
      const barA = CL.map((_, j) => (focus && CT[j] !== focus ? lerp(1, 0.2, on) : 1));
      const landedAll = lt >= 2.95;
      const catCol = ['rgba(100,116,139,.40)', '#A4A9B6', 'rgba(27,42,74,.24)', C.ink];
      let last = '';
      const set = c => { if (c !== last) { ctx.fillStyle = c; last = c; } };
      for (let i = 0; i < d.N; i++) {
        if (lt < D.tA[i]) continue;
        const a = clamp((lt - D.tA[i]) / 0.15);
        const ps = prog(lt, D.tS[i], 0.55, ease.inOutCubic);
        let x = lerp(D.ix[i], D.sx[i], ps), y = lerp(D.iy[i], D.sy[i], ps);
        const cat = D.cat[i];
        if (cat === 3) {
          const pf = prog(lt, D.tF[i], 0.55, ease.inOutCubic);
          if (pf >= 1) {
            if (landedAll) continue;
            const j = D.j[i];
            set(barCol[j]);
            ctx.fillRect(D.tx[i], D.ty[i], B.W, B.HP + 0.4);
            continue;
          }
          if (pf > 0) { x = lerp(x, D.tx[i], pf); y = lerp(y, D.ty[i], pf) - Math.sin(Math.PI * pf) * D.arc[i]; }
        }
        set(ps > 0 ? catCol[cat] : 'rgba(27,42,74,.62)');
        ctx.globalAlpha = a;
        ctx.fillRect(x, y, 2.5, 2.5);
        ctx.globalAlpha = 1;
      }
      if (landedAll) {
        CL.forEach((n, j) => {
          ctx.globalAlpha = barA[j];
          ctx.fillStyle = barCol[j];
          ctx.fillRect(B.BX + j * B.PITCH, B.BASE - n * B.HP, B.W, n * B.HP);
        });
        ctx.globalAlpha = 1;
        last = '';
      }
      // 기준선과 비워진 상위 군집 자리
      const pb = prog(lt, 1.6, 0.6, ease.swift);
      ctx.fillStyle = C.ink;
      ctx.fillRect(760, B.BASE + 1, 1040 * pb, 1.5);
      const pe = prog(lt, 2.5, 0.4, ease.linear);
      if (pe > 0) {
        ctx.save();
        ctx.globalAlpha = pe;
        ctx.fillStyle = 'rgba(27,42,74,.09)';   // 막대로 옮겨 간 문서가 있던 자리
        for (let q = 0; q < 4597; q++) ctx.fillRect(120 + (q % 80) * 3.5, d.blockY[3] + Math.floor(q / 80) * 3.5, 2.5, 2.5);
        ctx.restore();
      }
      if (focus === 'h' && on > 0) {   // 보류 강조 때 부서공통 추정 묶음도 테두리로 표시
        ctx.save();
        ctx.globalAlpha = on;
        ctx.strokeStyle = '#6A7287';
        ctx.lineWidth = 2;
        ctx.strokeRect(114, d.blockY[1] - 6, 80 * 3.5 + 8, d.blockH[1] + 10);
        ctx.restore();
      }
      // 글
      K.rise(d.head, lt, 0.25, { y: 10 });
      K.count(d.headN, lt, 0.3, 1.0, 8978);
      K.rise(d.headS, lt, 0.4, { y: 8 });
      d.labs.forEach((e, k) => K.rise(e, lt, 1.55 + k * 0.1, { x: -12, y: 0 }));
      K.rise(d.eq, lt, 2.6, { y: 8 });
      K.rise(d.bh, lt, 1.5, { y: 10 });
      K.rise(d.leg, lt, 2.6, { y: 8 });
      K.rise(d.ax0, lt, 1.9, { y: 6 });
      K.rise(d.ax1, lt, 2.2, { y: 6 });
      d.caps.forEach((e, k) => {
        const v = st === k ? Math.min(prog(loc, 0, 0.35), 1 - prog(loc, 2.3, 0.3)) : 0;
        e.style.opacity = v.toFixed(3);
        e.style.transform = `translateY(${((1 - Math.min(1, prog(loc, 0, 0.35))) * 12).toFixed(1)}px)`;
      });
      K.rise(d.rt, lt, 2.2, { y: 10 });
      K.rise(d.rt0, lt, 2.4, { y: 10 });
      const gFocus = { r: 1, k: 0 }[focus];
      d.tiles.forEach((t, k) => {
        K.pop(t.e, lt, 2.3 + k * 0.025);
        if (lt > 2.3 + k * 0.025 + 0.2) {
          const dim = focus && t.g !== gFocus ? lerp(1, 0.25, on) : 1;
          t.e.style.opacity = dim.toFixed(3);
        }
      });
      d.glab.forEach((l, k) => K.rise(l, lt, 2.6 + k * 0.08, { y: 8 }));
      K.rise(d.hold, lt, 2.75, { y: 8 });
      d.hold.style.background = focus === 'h' ? `rgba(148,163,184,${(0.22 * on).toFixed(3)})` : 'transparent';
      K.rise(d.rv, lt, 2.85, { y: 8 });
      K.stamp(d.stamp, lt, 3.05, { rot: -6 });
    },
  });

  // 37. 개명 제안
  const RN = [
    { id: 'U0118', old: '감사제도 운영 및 지원 관리', neu: '감사처분 심의·조치이행관리', dup: '같은 부서 U0111과 이름이 같다', n: 181, cl: 'c007 · c058', v: '수정필요', vc: 'warn',
      say: '근거 군집 c058의 접수 11건은 자회사가 보낸 문서라 자회사 감사 관리 쪽 철로 옮겨야 한다. 이름은 그대로 두고 철 구성을 고친다.' },
    { id: 'U0125', old: '종합감사 관리', neu: '자회사 감사 관리', dup: '같은 부서 U0113과 이름이 같다', n: 151, cl: 'c021 · c022 · c053', v: '수정필요', vc: 'warn',
      say: '근거 군집 c022의 59건 중 13건은 자회사 감사 문서가 아니다(국토교통부 감사 7건, 본사 감사 6건). 이름과 철 3개는 그대로 둔다.' },
    { id: 'U0119', old: '외부감사·상급기관 대응관리', neu: '안전감찰협의회 대응관리', dup: '같은 부서 U0107·U0128과 이름이 같다', n: 66, cl: 'c030 · c085', v: '통과', vc: 'ok',
      say: '이 단위업무의 유일한 철 ‘행정안전부 안전감찰협의회 대응’에 맞춰 대상을 이름에 드러냈다.' },
  ];
  DECK.slide({
    id: 'c4-rename', title: '개명 제안', chapter: CH, harness: 'naming',
    notes: '개명을 제안한 세 단위업무는 모두 같은 부서 안의 다른 단위업무와 이름이 같았다. 예를 들어 U0118과 U0111은 둘 다 "감사제도 운영 및 지원 관리"인데, U0118의 기록물철은 "감사처분 조치이행관리" 하나뿐이다. 하네스는 실제 문서(처리전말 내역서, 감사처분회의 개최)에 맞춰 이름을 바꾸자고 했다.\n화면에서 바뀌지 않는 음절은 그대로 남고, 바뀌는 음절만 자모로 풀렸다가 새 음절로 모인다.\n수정필요 2건은 이름이 아니라 어느 문서를 어느 철에 둘지에 대한 지적이고, 두 건 모두 이름은 그대로 두라고 했다. 이 지적은 제안표의 검토 의견 열에 남아 담당부서가 정한다.\n출처: kac-unit-task-naming/output/20261117-감사실/단위업무_제안표.csv, _workspace/20261117-감사실/감사실/existing_units.json·review.json',
    setup(root, d) {
      d.T = K.title(root, { kicker: '개명 제안 3건 · 감사실', title: '같은 부서에서 겹치던 이름 셋을 바꾸자고 제안했다' });
      const S = 76;
      d.rows = RN.map((r, i) => {
        const top = 300 + i * 228;
        const bg = K.at(root, '', { x: 96, y: top - 14, w: 1728, h: 220 });
        bg.style.borderRadius = '14px';
        const acc = K.at(bg, '', { x: 0, y: 20, w: 6, h: 180 });
        acc.style.cssText += ';background:var(--blue);border-radius:3px;opacity:0';
        const la = K.at(root, '', { x: 120, y: top });
        la.style.cssText += ';display:flex;align-items:center;gap:14px;white-space:nowrap';
        K.chip(la, r.id, 'id');
        const on = h('span', '', la, `<span style="font-weight:500;color:var(--mute);margin-right:8px">기존</span>${r.old}`); on.style.cssText = 'font-size:24px;font-weight:600;color:var(--ink-2)';
        const du = h('span', '', la, '· ' + r.dup); du.style.cssText = 'font-size:21px;color:var(--mute)';
        const host = K.at(root, '', { x: 120, y: top + 52, w: 1200, h: S });
        host.style.color = C.ink;
        const M = buildMorph(host, r.old, r.neu, S);
        const say = K.at(root, '', { x: 120, y: top + 150, w: 1680 },
          `<b style="font-weight:800;color:${r.vc === 'ok' ? '#0B7A52' : '#965A00'}">${r.vc === 'ok' ? '검토 통과' : '검토 지적'}</b> &nbsp;${r.say}`);
        say.style.cssText += ';font-size:21px;line-height:1.45;color:var(--ink-2);white-space:nowrap';
        const rc = K.at(root, '', { x: 1390, y: top });
        rc.innerHTML = '<div style="font-size:19px;font-weight:600;color:var(--mute)">근거 문서</div>' +
          '<div style="margin-top:2px"><span class="num" style="font-size:52px;font-weight:850;letter-spacing:-0.03em;line-height:1">0</span><span style="font-size:26px;font-weight:700;margin-left:4px">건</span></div>' +
          `<div class="mono" style="font-size:19px;color:var(--ink-2);margin-top:8px">${r.cl}</div>`;
        const num = rc.querySelector('.num');
        const st = K.stampEl(root, r.v, r.vc, { x: 1622, y: top + 26 });
        st.style.background = 'rgba(251,250,246,.6)';
        const sep = i < 2 ? K.at(root, '', { x: 120, y: top + 213, w: 1680, h: 1.5 }) : null;
        if (sep) sep.style.background = 'var(--rule)';
        return { top, bg, acc, la, host, M, say, rc, num, st, sep, n: r.n };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      const k = K.cycle(lt, 4.0, 3.2, d.rows.length);
      const loc = k < 0 ? 0 : (lt - 4.0) % 3.2;
      d.rows.forEach((r, i) => {
        const t0 = 0.3 + i * 0.12, m0 = 0.7 + i * 0.3;
        K.rise(r.la, lt, t0, { x: -16, y: 0 });
        K.rise(r.host, lt, t0 + 0.05, { y: 18, blur: 4 });
        renderMorph(r.M, lt - m0);
        K.rise(r.rc, lt, t0 + 0.1, { x: 16, y: 0 });
        K.count(r.num, lt, t0 + 0.1, 1.0, r.n);
        K.stamp(r.st, lt, m0 + 1.8, { rot: -6 });
        K.rise(r.say, lt, m0 + 1.7, { y: 10 });
        if (r.sep) K.wipe(r.sep, lt, t0, 0.6);
        // 머무는 동안: 한 줄씩 돌아가며 바뀐 음절에 밑줄을 긋는다
        const on = k === i ? Math.min(prog(loc, 0, 0.3), 1 - prog(loc, 2.85, 0.3)) : 0;
        RH.set(r.bg, 'background', on > 0 ? `rgba(47,123,255,${(0.05 * on).toFixed(3)})` : 'transparent');
        r.acc.style.opacity = on.toFixed(3);
        r.M.lines.forEach((ln, q) => {
          const p = k === i ? prog(loc, 0.15 + q * 0.12, 0.45, ease.swift) : 0;
          ln.style.opacity = (p > 0 ? on : 0).toFixed(3);
          ln.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`;
        });
      });
    },
  });
})();

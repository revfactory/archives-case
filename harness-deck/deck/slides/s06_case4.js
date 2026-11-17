/* 단위업무명 추천 — 과제 「단위업무명 추천·제안」. 필름 F 구간에 이어진다.
   숫자 출처: kac-unit-task-naming/output/20261117-감사실/요약.md, 단위업무_제안표.csv,
   _workspace/20261117-감사실/manifest.json, 감사실/clusters.json·existing_units.json·proposals.json·review_v1.json·review.json,
   .claude/skills/unit-task-naming-rules/SKILL.md, references/naming-conventions.md */
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


  // ── 이 파일 안에서만 쓰는 작은 함수 ──
  const TW = 1470;   // 제목 폭(오른쪽 위 하네스 그림 자리를 비운다)
  const txt = (root, html, box, style) => { const e = K.at(root, '', box, html); e.style.cssText += ';' + style; return e; };
  const show = (el, on) => { el.style.opacity = on ? '1' : '0'; el.style.transform = `scale(${on ? 1 : 0.8})`; };
  const actor = (root, o) => K.actor(root, o);
  const kindOf = o => o.kind || K.AG[o.id].kind;

  // 진행 순서
  DECK.slide({
    id: 'c4-flow', title: '문서 제목을 묶어 읽고 단위업무 이름을 다시 짓는다', chapter: CH, harness: 'naming',
    notes: '부서 하나가 만들고 받은 문서의 제목을 스크립트(prepare_dept.py)가 비슷한 것끼리 묶는다. 묶음 해석 에이전트(work-cluster-analyst, sonnet, 묶음 30개씩 4건을 동시에 처리)가 묶음마다 어떤 업무인지 읽고, 이름 제안 에이전트(unit-task-namer, opus)가 단위업무마다 유지·개명·통합·폐지 검토·신설을 정한다.\n검토 에이전트(naming-reviewer, opus)는 제안을 직접 고칠 수 없다. 통과·수정필요·기각만 적어 돌려보낸다. 수정과 재검토는 한 번으로 정했고, 그래도 남은 지적은 제안표의 검토 의견 열에 그대로 남겨 담당 부서가 정한다. 제안표(xlsx·csv)와 요약은 스크립트(build_report.py)가 만든다.\n화면의 숫자는 감사실 실행 값이다. 제안 23건 가운데 1회차 검토에서 4건이 수정필요였고(P007, P013, P018, P020), 고친 뒤 2회차에 통과 21건, 수정필요 2건(P013, P020)이 되었다.\n출처: kac-unit-task-naming/.claude/skills/unit-task-naming/SKILL.md, .claude/agents/*.md, _workspace/20261117-감사실/감사실/review_v1.json·review.json',
    setup(root, d) {
      d.T = K.title(root, { w: TW, kicker: '단위업무명 추천 · 진행 순서', title: '문서 제목을 묶어 읽고 단위업무 이름을 다시 짓는다' });
      const BASE = 710, LANE = 314, SAY = 388;
      const A = [
        { kind: 'script', name: '스크립트', job: '제목이 비슷한<br>문서를 묶는다', x: 120, w: 200 },
        { id: 'work-cluster-analyst', job: '묶음이 어떤 업무인지<br>읽는다', x: 470, w: 200 },
        { id: 'unit-task-namer', job: '이름을 제안한다', x: 820, w: 200 },
        { id: 'naming-reviewer', job: '통과·수정필요를 적는다', x: 1170, w: 200 },
        { kind: 'human', name: '담당 부서', job: '제안표를 보고<br>정한다', x: 1565, w: 150 },
      ];
      d.svg = K.svg(root);
      d.act = A.map(a => actor(root, Object.assign({ y: BASE - a.w * K.AGR[kindOf(a)], jobW: 320 }, a)));
      d.arr = A.slice(0, -1).map((a, i) => K.path(d.svg, [[a.x + a.w + 16, 590], [A[i + 1].x - 16, 590]], { color: C.ink2, width: 4, arrow: true }));
      // 수정필요면 이름 제안 에이전트로 돌아간다
      const rx = d.act[3].cx, nx = d.act[2].cx;
      d.back = K.path(d.svg, [[rx, 828], [rx, 886], [nx, 886], [nx, 828]], { color: C.warn, width: 5, arrow: true, radius: 22 });
      d.backLab = txt(root, '수정필요면 고쳐서 한 번 더 검토한다', { x: nx - 200, y: 904, w: rx - nx + 400 }, 'text-align:center;font:800 30px/1.2 var(--sans);letter-spacing:-0.02em;color:#965A00');
      d.doc = K.doc(root, '', { x: 0, y: LANE, w: 290 });
      d.doc.style.textAlign = 'center';
      d.pos = d.act.map(a => [a.cx - 145, LANE]);
      const say = (i, t, cls) => { const e = K.say(root, t, { x: d.act[i].cx - 190, y: SAY, w: 380 }, cls, 'b'); e.style.textAlign = 'center'; return e; };
      d.s1 = say(1, '어떤 업무인지 읽었습니다', 'blue');
      d.s2 = say(2, '23건을 제안합니다', 'blue');
      d.s3 = say(3, '4건은 수정필요입니다', 'warn');
      d.s4 = say(2, '고쳤습니다', 'blue');
      d.s5 = say(3, '2건이 남았습니다', 'warn');
    },
    render(lt, d) {
      d.T.render(lt);
      d.act.forEach((a, i) => a.render(lt, 0.5 + i * 0.16));
      d.arr.forEach((p, i) => K.draw(p, lt, 0.8 + i * 0.16, 0.3));
      K.draw(d.back, lt, 1.6, 0.6); K.rise(d.backLab, lt, 1.9, { y: 10 });
      // 문서 묶음이 차례로 지나간다. 검토에서 수정필요가 나오면 한 번 돌아갔다가 다시 온다.
      const L = K.loop(lt, 2.6, [0.9, 1.3, 0.8, 1.4, 0.8, 1.4, 0.8, 1.5, 1.0, 1.2, 0.8, 1.5, 1.2]);
      const st = L.i, u = L.u, P = d.pos;
      if (lt > 2.3) {
        d.act[0].act(lt, st === 1); d.act[1].act(lt, st === 3); d.act[2].act(lt, st === 5 || st === 9);
        d.act[3].act(lt, st === 7 || st === 11); d.act[4].act(lt, st === 12 && u > 0.6);
      }
      show(d.s1, st === 3 && u > 0.3); show(d.s2, st === 5 && u > 0.3); show(d.s3, st === 7 && u > 0.3);
      show(d.s4, st === 9 && u > 0.3); show(d.s5, st === 11 && u > 0.3);
      d.back.setAttribute('stroke-width', st === 8 ? 8 : 5);
      if (st < 0) { d.doc.style.opacity = '0'; return; }
      const label = st < 1 || (st === 1 && u < 0.5) ? '문서 8,978건' : st < 5 || (st === 5 && u < 0.3) ? '묶음 90개'
        : st < 7 || (st === 7 && u < 0.3) ? '제안 23건' : st < 9 || (st === 9 && u < 0.3) ? '수정필요 4건'
        : st < 11 || (st === 11 && u < 0.3) ? '고친 제안 23건' : '통과 21 · 수정필요 2';
      if (d.doc.textContent !== label) d.doc.textContent = label;
      const warn = (st === 7 && u >= 0.3) || st === 8 || (st === 9 && u < 0.3) || (st === 11 && u >= 0.3) || st === 12;
      d.doc.className = 'doc' + (warn ? ' warn' : '');
      const hold = p => K.travel(d.doc, 1, 0, 1, p, p);
      if (st === 0) K.travel(d.doc, u, 0, 1, [P[0][0] - 110, P[0][1]], P[0], { arc: 0 });
      else if (st === 1) hold(P[0]);
      else if (st === 2) K.travel(d.doc, u, 0, 1, P[0], P[1], { arc: 24 });
      else if (st === 3) hold(P[1]);
      else if (st === 4) K.travel(d.doc, u, 0, 1, P[1], P[2], { arc: 24 });
      else if (st === 5) hold(P[2]);
      else if (st === 6) K.travel(d.doc, u, 0, 1, P[2], P[3], { arc: 24 });
      else if (st === 7) hold(P[3]);
      else if (st === 8) K.travel(d.doc, u, 0, 1, P[3], P[2], { arc: 24 });
      else if (st === 9) hold(P[2]);
      else if (st === 10) K.travel(d.doc, u, 0, 1, P[2], P[3], { arc: 24 });
      else if (st === 11) hold(P[3]);
      else K.travel(d.doc, clamp(u / 0.6), 0, 1, P[3], P[4], { arc: 24 });
      d.doc.style.opacity = (st === 0 ? clamp(u / 0.25) : st === 12 ? clamp((1 - u) / 0.15) : 1).toFixed(3);
    },
  });

  // 이름 짓는 규칙
  DECK.slide({
    id: 'c4-rule', title: '이름은 대상, 행위, 관리 순서로 짓는다', chapter: CH, harness: 'naming',
    notes: '단위업무 이름은 「대상 + 행위 1~3개 + 관리」로 짓는다. 화면의 예는 감사실 청렴감찰부가 지금 쓰는 이름(U0123 공직윤리 신고·점검·조치관리)이다.\n규칙은 분류기준표 최종(안)의 기존 이름 699개와 담당부서 의견 185종에서 뽑았다. 기존 이름은 평균 10.5자이고 577개(83%)가 "관리"로 끝난다.\n화면에서 뺀 규칙: 나란히 놓는 낱말은 가운뎃점으로 잇고 ‘및’은 쓰지 않는다. 연도·차수·업체명·괄호와 알림·제출·요청 같은 문서 처리 행위는 넣지 않는다. 같은 부서의 다른 단위업무, 기록물철 이름과 겹치지 않게 짓는다. 10자 안팎, 최대 25자.\n출처: kac-unit-task-naming/.claude/skills/unit-task-naming-rules/SKILL.md, references/naming-conventions.md, _workspace/20261117-감사실/감사실/existing_units.json',
    setup(root, d) {
      d.T = K.title(root, { w: TW, kicker: '단위업무명 추천 · 이름 짓는 규칙', title: '이름은 대상, 행위, 관리 순서로 짓는다' });
      d.top = txt(root, '감사실이 지금 쓰는 이름', { x: 120, y: 322, w: 1680 }, 'text-align:center;font:600 28px/1.2 var(--sans);color:var(--mute)');
      d.row = K.at(root, '', { x: 120, y: 384, w: 1680 });
      d.row.style.cssText += ';display:flex;justify-content:center;align-items:flex-start;gap:26px';
      const segs = [['공직윤리', '대상', C.blue], ['신고·점검·조치', '행위 1~3개', '#0B7A52'], ['관리', '관리', '#965A00']];
      d.segs = segs.map(sg => {
        const b = h('div', '', d.row); b.style.cssText = 'text-align:center';
        const nm = h('div', '', b, sg[0]); nm.style.cssText = 'font:850 122px/1.12 var(--sans);letter-spacing:-0.03em;white-space:nowrap';
        const bar = h('div', '', b); bar.style.cssText = `height:10px;border-radius:5px;margin-top:14px;background:${sg[2]};transform-origin:0 50%`;
        const lab = h('div', '', b, sg[1]); lab.style.cssText = `margin-top:16px;font:800 42px/1.2 var(--sans);letter-spacing:-0.02em;color:${sg[2]};white-space:nowrap`;
        return { b, nm, bar, lab, c: sg[2] };
      });
      const caps = ['무엇을 다루는 업무인지 먼저 쓴다', '하는 일을 가운뎃점으로 이어 쓴다', '기존 이름 699개 중 577개가 ‘관리’로 끝난다'];
      d.caps = caps.map(c => txt(root, c, { x: 120, y: 730, w: 1680 }, 'text-align:center;font:800 50px/1.2 var(--display);letter-spacing:-0.02em;color:var(--ink);opacity:0'));
      d.rule = txt(root, '연도, 업체명, 괄호는 이름에 넣지 않는다', { x: 120, y: 890, w: 1680 }, 'text-align:center;font:600 30px/1.2 var(--sans);color:var(--ink-2)');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.top, lt, 0.4, { y: 10 });
      K.rise(d.rule, lt, 1.9, { y: 10 });
      // 세 부분을 차례로 짚는다
      const L = K.loop(lt, 2.4, [1.8, 1.8, 1.8]);
      d.segs.forEach((sg, i) => {
        const p = K.rise(sg.b, lt, 0.5 + i * 0.3, { y: 30 });
        sg.bar.style.transform = `scaleX(${prog(lt, 0.9 + i * 0.3, 0.4, ease.outCubic).toFixed(4)})`;
        const on = L.i < 0 || L.i === i;
        const k = L.i === i ? Math.min(prog(L.u, 0, 0.14), 1) : 0;
        if (p >= 1) sg.b.style.opacity = on ? '1' : '0.6';
        sg.nm.style.color = L.i === i ? sg.c : C.ink;
        if (p >= 1) sg.b.style.transform = `translateY(${(-8 * k).toFixed(1)}px)`;
      });
      d.caps.forEach((c, i) => {
        const v = L.i === i ? Math.min(prog(L.u, 0, 0.16), 1 - prog(L.u, 0.9, 0.1)) : 0;
        c.style.opacity = v.toFixed(3);
        c.style.transform = `translateY(${((1 - Math.min(1, prog(L.u, 0, 0.16))) * 14).toFixed(1)}px)`;
      });
    },
  });

  // 기준표가 있는 부서와 없는 부서
  DECK.slide({
    id: 'c4-mode', title: '부서에 기준표가 있는지에 따라 하는 일이 다르다', chapter: CH, harness: 'naming',
    notes: '분류기준표가 있는 부서(하네스 안에서는 대조라고 부른다)는 기존 단위업무를 하나도 빼지 않고 유지·개명·통합·폐지 검토 가운데 하나로 정하고, 기준표에 없는 업무가 문서에서 보이면 신설로 낸다. 이번 감사실 실행이 이 경우다. 왼쪽의 이름 셋은 감사실 제안표의 실제 값이다(P018 유지, P020 개명, P010 통합·폐지 검토). 감사실에서 신설은 0건이었다.\n기준표가 없어 다른 공항 기준표를 적용하는 부서, 없어진 부서(현재 부서로 추정)는 단위업무 목록 초안을 새로 짓는다(하네스 안에서는 초안이라고 부른다). 이때 다른 부서 기준표는 참고만 하고, 같은 업무가 있으면 그 이름을 쓴다. 이 경우는 이번에 실행하지 않아 화면에 실제 이름을 넣지 않았다.\n출처: kac-unit-task-naming/.claude/skills/unit-task-naming-rules/SKILL.md 「용어와 자료」「제안 유형과 조건」, output/20261117-감사실/단위업무_제안표.csv',
    setup(root, d) {
      d.T = K.title(root, { w: TW, kicker: '단위업무명 추천 · 부서마다 다른 일', title: '부서에 기준표가 있는지에 따라 하는 일이 다르다' });
      const panel = (x, head, sub, tag) => {
        const p = K.at(root, '', { x, y: 300, w: 810, h: 640 });
        p.style.cssText += ';box-sizing:border-box;border:2px solid var(--rule-2);border-radius:20px;background:var(--paper-3)';
        txt(p, head, { x: 40, y: 30 }, 'font:900 46px/1.2 var(--display);letter-spacing:-0.03em;white-space:nowrap');
        if (tag) { const c = K.chip(p, tag, 'ok lg', { r: 36, y: 32 }); c.style.fontSize = '26px'; }
        txt(p, sub, { x: 40, y: 100 }, 'font:700 32px/1.3 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);white-space:nowrap');
        return p;
      };
      d.pl = panel(120, '기준표가 있는 부서', '기존 이름을 하나씩 판단한다', '이번 실행 · 감사실');
      d.pr = panel(990, '기준표가 없는 부서', '이름 목록을 처음부터 새로 짓는다');
      const L = [['공직윤리 신고·점검·조치관리', '유지', 'ok'], ['종합감사 관리', '개명', 'blue'], ['성과감사 관리', '통합·폐지 검토', 'warn'], ['기준표에 없는 업무', '신설', 'ghost']];
      d.lrows = L.map((r, i) => {
        const row = K.at(d.pl, '', { x: 28, y: 186 + i * 108, w: 750, h: 92 });
        row.style.cssText += ';border-radius:14px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;box-sizing:border-box';
        const nm = h('div', '', row, r[0]);
        nm.style.cssText = `font:700 32px/1.2 var(--sans);letter-spacing:-0.02em;white-space:nowrap;color:${i === 3 ? 'var(--mute)' : 'var(--ink)'}`;
        const chip = K.chip(row, r[1], r[2] + ' lg'); chip.style.fontSize = '28px'; chip.style.fontWeight = '800'; chip.style.flex = 'none';
        return { row, chip };
      });
      d.rrows = [0, 1, 2].map(i => {
        const row = K.at(d.pr, '', { x: 28, y: 186 + i * 108, w: 750, h: 92 });
        row.style.cssText += ';border-radius:14px;display:flex;align-items:center;gap:22px;padding:0 18px;box-sizing:border-box';
        const src = h('div', '', row, '문서 묶음');
        src.style.cssText = 'font:700 30px/1 var(--sans);color:var(--mute);border:2.5px dashed var(--rule-2);border-radius:12px;padding:16px 26px;white-space:nowrap';
        const ar = h('div', '', row, '→'); ar.style.cssText = 'font:700 36px/1 var(--sans);color:var(--ink-2)';
        const out = h('div', '', row, '새 단위업무 이름');
        out.style.cssText = 'font:700 32px/1 var(--sans);letter-spacing:-0.02em;color:var(--ink);border:2.5px solid var(--blue);border-radius:12px;padding:16px 26px;white-space:nowrap;background:#fff';
        const chip = K.chip(row, '초안', 'blue lg'); chip.style.fontSize = '28px'; chip.style.fontWeight = '800'; chip.style.flex = 'none';
        return { row, out, chip, ar };
      });
      d.rnote = txt(d.pr, '다른 공항 기준표는 참고만 한다', { x: 46, y: 538 }, 'font:600 28px/1.2 var(--sans);color:var(--ink-2);white-space:nowrap');
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.pl, lt, 0.5, { y: 24 }); K.rise(d.pr, lt, 0.7, { y: 24 });
      K.rise(d.rnote, lt, 1.9, { y: 8 });
      // 왼쪽은 이름마다 판단이 붙고, 오른쪽은 묶음마다 새 이름이 나온다
      const L = K.loop(lt, 2.4, [1.5, 1.5, 1.5, 1.5]);
      d.lrows.forEach((r, i) => {
        K.rise(r.row, lt, 0.9 + i * 0.1, { x: -16, y: 0, blur: 0 });
        const now = L.i === i;
        RH.set(r.row, 'background', now ? 'rgba(47,123,255,.10)' : 'transparent');
        r.chip.style.opacity = prog(lt, 1.3 + i * 0.12, 0.2).toFixed(3);
        r.chip.style.transform = `scale(${now ? lerp(1.3, 1, prog(L.u, 0.05, 0.25, ease.outCubic)).toFixed(4) : 1})`;
      });
      d.rrows.forEach((r, i) => {
        K.rise(r.row, lt, 1.1 + i * 0.1, { x: 16, y: 0, blur: 0 });
        const now = L.i === i;
        RH.set(r.row, 'background', now ? 'rgba(47,123,255,.10)' : 'transparent');
        const a = prog(lt, 1.5 + i * 0.12, 0.2).toFixed(3);
        [r.out, r.chip, r.ar].forEach(e => { e.style.opacity = a; });
        r.chip.style.transform = `scale(${now ? lerp(1.3, 1, prog(L.u, 0.05, 0.25, ease.outCubic)).toFixed(4) : 1})`;
      });
    },
  });

  // 문서 8,978건 → 묶음 90개
  // 상위 묶음 90개의 문서 수(문서 수 순). 출처 clusters.json
  const CL = [237,193,193,170,163,155,154,133,126,118,85,84,70,70,70,67,67,65,65,63,60,59,59,55,52,50,49,48,46,46,45,43,43,43,42,41,39,39,39,38,38,37,37,37,36,36,36,35,35,35,34,33,32,29,29,28,27,27,27,27,26,25,25,24,24,23,23,23,23,23,23,23,23,23,23,22,22,22,22,21,20,20,20,20,20,20,20,19,18,18];
  DECK.slide({
    id: 'c4-run', title: '감사실 문서 8,978건을 묶음 90개로 줄였다', chapter: CH, harness: 'naming',
    notes: '감사실 문서 8,978건에서 8개 이상 부서가 같은 제목으로 받은 공문(공통 수신) 2,152건을 빼고, 출장·지출처럼 모든 부서가 하는 사무로 보이는 193건(묶음 7개)을 따로 뗐다. 남은 6,633건을 제목이 비슷한 것끼리 묶어, 문서가 많은 상위 묶음 90개(4,597건, 6,633건의 69%)만 에이전트가 읽었다.\n작은 묶음의 문서 2,036건은 이번에 읽지 않았다. 그래서 "문서가 없다"는 판단은 폐지가 아니라 통합·폐지 검토로만 낸다.\n막대는 묶음 90개를 문서 수 순서로 놓은 것이다. 가장 큰 묶음(c001)은 237건이고 가장 작은 묶음(c090)은 18건이다. 화면의 제목 예는 c001(감사원 감사자료 제출 47건), c002(부패영향평가 요청 35건), c007(처리 전말 내역서 제출 77건)의 대표 제목이다.\n묶음 90개 가운데 69개는 유지 판단의 근거, 7개는 개명 판단의 근거로 쓰였고 14개는 보류했다(모든 부서가 하는 사무, 여러 업무가 섞인 묶음, 다른 부서가 주관하는 일을 통보받은 문서).\n스크립트: prepare_dept.py. 출처: kac-unit-task-naming/output/20261117-감사실/요약.md, _workspace/20261117-감사실/manifest.json, 감사실/clusters.json·proposals.json',
    setup(root, d) {
      d.T = K.title(root, { w: TW, kicker: '감사실 실행 결과 · 문서 묶기', title: '감사실 문서 8,978건을 묶음 90개로 줄였다' });
      const CX = 100, CY = 280, CW = 1720, CHh = 720;
      const cv = h('canvas', '', root);
      css(cv, { position: 'absolute', left: CX + 'px', top: CY + 'px', width: CW + 'px', height: CHh + 'px' });
      cv.width = CW * 2; cv.height = CHh * 2;
      d.ctx = cv.getContext('2d');
      d.ctx.setTransform(2, 0, 0, 2, -CX * 2, -CY * 2);
      d.clip = [CX, CY, CW, CHh];
      // 점 배치(점 하나 = 문서 한 건)
      const FX = 120, FY = 456, COLS = 80, P = 3.6;
      const cnt = [2152, 193, 2036, 4597];   // 공통 수신, 공통 사무, 작은 묶음, 큰 묶음 90개
      const N = cnt.reduce((a, b) => a + b, 0);   // 8,978
      const GAP = 26;
      d.geo = { FX, COLS, P };
      d.blockY = []; d.blockH = cnt.map(c => Math.ceil(c / COLS) * P);
      let by = FY;
      cnt.forEach((c, i) => { d.blockY.push(by); by += d.blockH[i] + GAP; });
      const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => K.rand(a, 11) - K.rand(b, 11));
      const B = d.bar = { BX: 846, BASE: 800, HP: 310 / 237, PITCH: 10.6, W: 7.4 };
      const ROWS = Math.ceil(N / COLS);
      const D = d.D = {
        ix: new Float32Array(N), iy: new Float32Array(N), sx: new Float32Array(N), sy: new Float32Array(N),
        tx: new Float32Array(N), ty: new Float32Array(N), cat: new Uint8Array(N),
        tA: new Float32Array(N), tS: new Float32Array(N), tF: new Float32Array(N), arc: new Float32Array(N),
      };
      let i = 0, cj = 0;
      const bars = CL.map(() => 0);
      cnt.forEach((c, cat) => {
        for (let q = 0; q < c; q++, i++) {
          const cell = order[i], row = Math.floor(cell / COLS), col = cell % COLS;
          D.ix[i] = FX + col * P; D.iy[i] = FY + row * P;
          D.sx[i] = FX + (q % COLS) * P; D.sy[i] = d.blockY[cat] + Math.floor(q / COLS) * P;
          D.cat[i] = cat;
          D.tA[i] = 0.3 + (row / ROWS) * 0.45 + K.rand(i, 3) * 0.08;
          D.tS[i] = 0.95 + cat * 0.08 + K.rand(i, 5) * 0.2;
          if (cat === 3) {
            while (bars[cj] >= CL[cj]) cj++;
            const k = bars[cj]++;
            D.tx[i] = B.BX + cj * B.PITCH;
            D.ty[i] = B.BASE - (k + 1) * B.HP;
            D.tF[i] = 1.75 + (cj / 90) * 0.4 + K.rand(i, 9) * 0.15;
            D.arc[i] = 30 + K.rand(i, 13) * 70;
          }
        }
      });
      d.N = N;
      // 왼쪽: 문서 8,978건
      const big = 'font:900 104px/1 var(--display);letter-spacing:-0.03em', unit = 'font:800 40px/1 var(--sans);letter-spacing:-0.02em;margin-left:8px';
      d.head = txt(root, `<span class="num" style="${big}">0</span><span style="${unit}">건</span>`, { x: 120, y: 316 }, 'white-space:nowrap');
      d.headN = d.head.querySelector('.num');
      const labs = [
        ['2,152건', '여러 부서가 같이 받은 공문'],
        ['193건', '출장·지출 같은 공통 사무'],
        ['2,036건', '작은 묶음, 이번에는 읽지 않았다'],
        ['4,597건', '큰 묶음 90개가 된다'],
      ];
      const LX = FX + COLS * P + 26;
      d.labs = labs.map((l, k) => {
        const one = k === 1, strong = k === 3;
        const y = one ? d.blockY[1] + d.blockH[1] / 2 - 18 : d.blockY[k] + d.blockH[k] / 2 - 36;
        const html = one
          ? `<span style="font:800 28px/1.25 var(--sans);color:var(--ink-2)">${l[0]}</span> <span style="font:500 24px/1.25 var(--sans);color:var(--mute)">${l[1]}</span>`
          : `<div style="font:800 ${strong ? 34 : 28}px/1.25 var(--sans);letter-spacing:-0.02em;color:${strong ? 'var(--ink)' : 'var(--ink-2)'}">${l[0]}</div><div style="font:${strong ? 700 : 500} ${strong ? 26 : 24}px/1.3 var(--sans);color:${strong ? 'var(--ink)' : 'var(--mute)'}">${l[1]}</div>`;
        return txt(root, html, { x: LX, y }, 'white-space:nowrap');
      });
      // 오른쪽: 묶음 90개
      d.bh = txt(root, `<span style="${unit};margin-left:0;margin-right:10px">묶음</span><span class="num" style="${big}">0</span><span style="${unit}">개</span>`, { x: B.BX, y: 316 }, 'white-space:nowrap');
      d.bhN = d.bh.querySelector('.num');
      d.ax0 = txt(root, '237건', { x: B.BX - 6, y: B.BASE - 310 - 40 }, 'font:700 24px/1 var(--sans);color:var(--ink-2)');
      d.ax1 = txt(root, '18건', { r: 1920 - (B.BX + 90 * B.PITCH), y: B.BASE - 18 * B.HP - 36 }, 'font:700 24px/1 var(--sans);color:var(--ink-2);text-align:right');
      // 머무는 동안: 묶음 하나씩 제목 예를 보여 준다
      d.ex = [[0, 237, '감사원 감사자료 제출'], [1, 193, '부패영향평가 요청'], [6, 154, '처리 전말 내역서 제출']];
      d.caps = d.ex.map(e => txt(root, `<span style="color:#0B7A52;font-weight:800">묶음 하나 ${e[1]}건</span>&nbsp; 제목 예: ${e[2]}`, { x: B.BX, y: 826 }, 'font:600 30px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--ink);white-space:nowrap;opacity:0'));
      d.sum = txt(root, '남은 문서 6,633건 가운데 <b style="font-weight:850">69%</b>가 이 90개에 들어 있다', { x: B.BX, y: 912 }, 'font:600 30px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);white-space:nowrap');
    },
    render(lt, d) {
      d.T.render(lt);
      const ctx = d.ctx, D = d.D, B = d.bar, G = d.geo;
      ctx.clearRect(...d.clip);
      const st = K.cycle(lt, 3.4, 2.4, 3);
      const loc = st < 0 ? 0 : (lt - 3.4) % 2.4;
      const on = st >= 0 ? Math.min(prog(loc, 0, 0.3), 1 - prog(loc, 2.1, 0.3)) : 0;
      const hot = st >= 0 ? d.ex[st][0] : -1;
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
            set(C.ink);
            ctx.fillRect(D.tx[i], D.ty[i], B.W, B.HP + 0.4);
            continue;
          }
          if (pf > 0) { x = lerp(x, D.tx[i], pf); y = lerp(y, D.ty[i], pf) - Math.sin(Math.PI * pf) * D.arc[i]; }
        }
        set(ps > 0 ? catCol[cat] : 'rgba(27,42,74,.62)');
        ctx.globalAlpha = a;
        ctx.fillRect(x, y, 2.6, 2.6);
        ctx.globalAlpha = 1;
      }
      if (landedAll) {
        CL.forEach((n, j) => {
          ctx.fillStyle = j === hot ? mix(C.ink, C.ok, on) : C.ink;
          ctx.globalAlpha = hot >= 0 && j !== hot ? lerp(1, 0.55, on) : 1;
          ctx.fillRect(B.BX + j * B.PITCH, B.BASE - n * B.HP, B.W, n * B.HP);
        });
        ctx.globalAlpha = 1;
        last = '';
      }
      // 기준선과, 막대로 옮겨 간 문서가 있던 자리
      ctx.fillStyle = C.ink;
      ctx.fillRect(B.BX - 6, B.BASE + 1, (90 * B.PITCH + 10) * prog(lt, 1.6, 0.6, ease.swift), 2);
      const pe = prog(lt, 2.5, 0.4, ease.linear);
      if (pe > 0) {
        ctx.save();
        ctx.globalAlpha = pe;
        ctx.fillStyle = 'rgba(27,42,74,.10)';
        for (let q = 0; q < 4597; q++) ctx.fillRect(G.FX + (q % G.COLS) * G.P, d.blockY[3] + Math.floor(q / G.COLS) * G.P, 2.6, 2.6);
        ctx.restore();
      }
      K.rise(d.head, lt, 0.25, { y: 10 });
      K.count(d.headN, lt, 0.3, 1.0, 8978);
      d.labs.forEach((e, k) => K.rise(e, lt, 1.55 + k * 0.1, { x: -12, y: 0 }));
      K.rise(d.bh, lt, 1.6, { y: 10 });
      K.count(d.bhN, lt, 1.8, 1.0, 90);
      K.rise(d.ax0, lt, 2.6, { y: 6 }); K.rise(d.ax1, lt, 2.7, { y: 6 });
      K.rise(d.sum, lt, 2.8, { y: 10 });
      d.caps.forEach((e, k) => {
        e.style.opacity = (st === k ? on : 0).toFixed(3);
        e.style.transform = `translateY(${((1 - Math.min(1, prog(loc, 0, 0.3))) * 10).toFixed(1)}px)`;
      });
    },
  });

  // 기존 단위업무 23개 판단
  DECK.slide({
    id: 'c4-judge', title: '기존 단위업무 23개를 모두 판단했다', chapter: CH, harness: 'naming',
    notes: '이름 제안 에이전트(unit-task-namer)는 감사실의 기존 단위업무 23개를 하나도 빼지 않고 유지 17, 개명 3, 통합·폐지 검토 3으로 정했다. 신설은 0건이다.\n유지는 이름과 문서가 맞는 경우다(예: U0123 공직윤리 신고·점검·조치관리, 근거 문서 1,038건). 개명은 문서는 있는데 이름이 그 문서를 가리키지 못하는 경우로, 세 건 모두 같은 부서 안에 같은 이름이 또 있었다(예: U0125 종합감사 관리 → 자회사 감사 관리). 통합·폐지 검토는 해당 문서가 거의 없거나 다른 단위업무와 문서가 구별되지 않는 경우다(예: U0115 성과감사 관리는 묶음 90개 어디에도 성과감사 실시 문서가 없었다). 작은 묶음 2,036건은 읽지 않았으므로 폐지가 아니라 검토 요청으로만 낸다.\n묶음 90개 가운데 14개와 공통 사무 묶음 7개, 모두 21개는 어느 단위업무의 근거로도 쓰지 않고 보류했다.\n출처: kac-unit-task-naming/output/20261117-감사실/요약.md, 단위업무_제안표.csv, _workspace/20261117-감사실/감사실/proposals.json',
    setup(root, d) {
      d.T = K.title(root, { w: TW, kicker: '감사실 실행 결과 · 이름 판단', title: '기존 단위업무 23개를 모두 판단했다' });
      const G = [['유지', 17, C.ok, '#0B7A52'], ['개명', 3, C.blue, '#1456C8'], ['통합·폐지 검토', 3, C.warn, '#965A00']];
      const S = 58, PT = 68, GG = 40;
      let x = 143;
      d.tiles = []; d.grp = [];
      G.forEach((g, gi) => {
        const gx = x, gw = g[1] * PT - (PT - S);
        for (let t = 0; t < g[1]; t++) {
          const e = K.at(root, '', { x, y: 322, w: S, h: S });
          e.style.cssText += `;background:${g[2]};border-radius:9px`;
          d.tiles.push({ e, g: gi });
          x += PT;
        }
        x += GG;
        const cx = gx + gw / 2;
        const num = txt(root, '0', { x: cx - 250, y: 410, w: 500 }, `text-align:center;font:900 168px/1 var(--display);letter-spacing:-0.03em;color:${g[3]}`);
        num.classList.add('num');
        const lab = txt(root, g[0], { x: cx - 250, y: 586, w: 500 }, `text-align:center;font:800 36px/1.2 var(--sans);letter-spacing:-0.02em;color:${g[3]};white-space:nowrap`);
        const ul = K.at(root, '', { x: cx - 110, y: 640, w: 220, h: 8 }); ul.style.cssText += `;border-radius:4px;background:${g[2]};transform-origin:50% 50%`;
        d.grp.push({ num, lab, ul, n: g[1] });
      });
      d.who = actor(root, { id: 'unit-task-namer', x: 170, y: 706, w: 170 });
      const SAY = ['이름과 문서가 맞습니다', '같은 이름이 또 있습니다', '묶음 90개에 문서가 없습니다'];
      const EX = ['공직윤리 신고·점검·조치관리', '종합감사 관리 → 자회사 감사 관리', '성과감사 관리'];
      const CLS = ['ok', 'blue', 'warn'];
      d.says = SAY.map((t, i) => K.say(root, t, { x: 400, y: 730 }, CLS[i], 'l'));
      d.exs = EX.map((t, i) => { const e = K.doc(root, t, { x: 400, y: 812 }, CLS[i]); e.style.fontSize = '32px'; e.style.padding = '14px 22px 15px'; return e; });
      d.zero = txt(root, '신설 <b style="font-weight:850;color:var(--ink)">0건</b>', { x: 1420, y: 800, w: 380 }, 'text-align:right;font:700 40px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--mute)');
    },
    render(lt, d) {
      d.T.render(lt);
      const L = K.loop(lt, 2.8, [2.3, 2.3, 2.3]);
      const on = L.i >= 0 ? Math.min(prog(L.u, 0, 0.12), 1 - prog(L.u, 0.9, 0.1)) : 0;
      d.tiles.forEach((t, k) => {
        K.pop(t.e, lt, 0.5 + k * 0.035);
        if (lt > 0.5 + k * 0.035 + 0.45) {
          t.e.style.opacity = '1';
          t.e.style.transform = `translateY(${(L.i === t.g ? -8 * on : 0).toFixed(1)}px)`;
        }
      });
      d.grp.forEach((g, k) => {
        K.rise(g.num, lt, 1.2 + k * 0.2, { y: 20 }); K.count(g.num, lt, 1.2 + k * 0.2, 0.9, g.n);
        K.rise(g.lab, lt, 1.4 + k * 0.2, { y: 10 });
        g.ul.style.transform = `scaleX(${(L.i === k ? on : 0).toFixed(4)})`;
      });
      d.who.render(lt, 1.8);
      if (lt > 2.5) d.who.act(lt, L.i >= 0 && L.u > 0.1 && L.u < 0.9);
      K.rise(d.zero, lt, 2.2, { y: 10 });
      d.says.forEach((e, i) => show(e, L.i === i && L.u > 0.1 && L.u < 0.95));
      d.exs.forEach((e, i) => {
        const v = L.i === i ? Math.min(prog(L.u, 0.2, 0.1), 1 - prog(L.u, 0.9, 0.08)) : 0;
        e.style.opacity = v.toFixed(3);
        e.style.transform = `translateX(${((1 - Math.min(1, prog(L.u, 0.2, 0.12))) * -18).toFixed(1)}px)`;
      });
    },
  });

  // 개명 제안 세 건
  const RN = [
    { old: '감사제도 운영 및 지원 관리', neu: '감사처분 심의·조치이행관리', dup: 2, n: 181, v: '수정필요', vc: 'warn',
      title: '감사제도가 아니라 감사처분 문서였다',
      rs: '이름은 그대로 두고 자회사 문서 11건을 옮깁니다',
      notes: '기존 단위업무 U0118(감사부)의 이름은 「감사제도 운영 및 지원 관리」로, 같은 부서 U0111(감사기획부)과 이름이 같았다. U0118의 기록물철은 「감사처분 조치이행관리」 하나뿐이고, 실제 문서는 종합감사·특정감사 처분요구에 따른 처리전말 내역서(묶음 c007, 154건)와 감사처분회의·감사결과 심의위원회 개최(묶음 c058, 27건)다. 근거 문서는 181건이다.\n이름 제안 에이전트(unit-task-namer)가 「감사처분 심의·조치이행관리」로 바꾸자고 했다(제안 P013). 검토 에이전트(naming-reviewer)는 두 번 모두 수정필요로 판정했지만 이름은 그대로 두라고 했다. 지적은 묶음 c058의 접수 문서 11건(2022~2024년)이 자회사(KAC공항서비스, 항공보안파트너스)가 보낸 문서라 「자회사 감사 관리」(P020) 쪽 철로 옮겨야 한다는 것, 본사 부서의 이의신청 문서를 받을 철이 필요하다는 것이다. 이 지적은 제안표의 검토 의견 열에 남아 담당 부서가 정한다.\n출처: kac-unit-task-naming/output/20261117-감사실/단위업무_제안표.csv, _workspace/20261117-감사실/감사실/existing_units.json·clusters.json·review.json' },
    { old: '종합감사 관리', neu: '자회사 감사 관리', dup: 2, n: 151, v: '수정필요', vc: 'warn',
      title: '자회사의 종합·특정·복무감사 문서가 함께 있었다',
      rs: '근거 문서 13건은 자회사 감사 문서가 아닙니다',
      notes: '기존 단위업무 U0125(감사기획부)의 이름은 「종합감사 관리」로, 같은 부서 U0113(감사부)과 이름이 같았다. U0125의 기록물철은 「자회사 종합감사 실시」 하나뿐인데, 실제 문서는 자회사 종합·특정·복무감사 결과 통보와 모·자회사 감사인 워크숍(묶음 c021, 60건), 자회사가 낸 처분사항 조치결과(c022, 59건), 감사결과 이의신청(c053, 32건)이다. 근거 문서는 151건이다.\n이름 제안 에이전트(unit-task-namer)가 「자회사 감사 관리」로 바꾸자고 했다(제안 P020). 검토 에이전트(naming-reviewer)는 두 번 모두 수정필요로 판정했지만 이름과 철 3개는 그대로 두라고 했다. 지적은 묶음 c022의 59건 가운데 13건이 자회사 감사 문서가 아니라는 것이다(국토교통부 감사 처분요구 관련 7건, 본사 감사결과 통보 4건, 본사 조치결과 회신·처분이행 요청 2건). 이 문서를 어느 철에 둘지는 담당 부서가 정한다.\n출처: kac-unit-task-naming/output/20261117-감사실/단위업무_제안표.csv, _workspace/20261117-감사실/감사실/existing_units.json·clusters.json·review.json' },
    { old: '외부감사·상급기관 대응관리', neu: '안전감찰협의회 대응관리', dup: 3, n: 66, v: '통과', vc: 'ok',
      title: '하나뿐인 철이 안전감찰협의회 대응이었다',
      rs: '지적할 것이 없습니다',
      notes: '기존 단위업무 U0119(감사부)의 이름은 「외부감사·상급기관 대응관리」로, 같은 부서 U0107(감사기획부), U0128(청렴감찰부)과 이름이 같았다. U0119의 기록물철은 「행정안전부 안전감찰협의회 대응」 하나뿐이고, 실제 문서도 행정안전부 안전감찰 협의회 운영계획·이행실태·자율감찰 과제(묶음 c030, 46건)와 범정부 안전분야 반부패협의회(c085, 20건)다. 감사원·국토교통부 감사 대응과는 대상이 다르다. 근거 문서는 66건이다.\n이름 제안 에이전트(unit-task-namer)가 「안전감찰협의회 대응관리」로 바꾸자고 했고(제안 P014), 검토 에이전트(naming-reviewer)는 두 번 모두 지적 없이 통과로 판정했다. 같은 이름을 쓰던 U0128은 통합·폐지 검토(P023), U0107은 유지(P002)다.\n출처: kac-unit-task-naming/output/20261117-감사실/단위업무_제안표.csv, _workspace/20261117-감사실/감사실/existing_units.json·clusters.json·review.json' },
  ];

  // 세 건을 묶어 보여 주는 장
  DECK.slide({
    id: 'c4-rename', title: '같은 부서에서 겹치던 이름 셋을 바꾸자고 제안했다', chapter: CH, harness: 'naming',
    notes: '개명을 제안한 세 단위업무는 모두 같은 부서(감사실) 안의 다른 단위업무와 이름이 같았다. 「감사제도 운영 및 지원 관리」는 U0111·U0118 두 개, 「종합감사 관리」는 U0113·U0125 두 개, 「외부감사·상급기관 대응관리」는 U0107·U0119·U0128 세 개다.\n하네스는 이름이 같은 단위업무 가운데 문서 내용과 이름이 맞지 않는 쪽(U0118, U0125, U0119)을 실제 문서에 맞춰 바꾸자고 했다. 다음 세 장에서 한 건씩 본다.\n출처: kac-unit-task-naming/output/20261117-감사실/단위업무_제안표.csv, _workspace/20261117-감사실/감사실/existing_units.json',
    setup(root, d) {
      d.T = K.title(root, { w: TW, kicker: '감사실 실행 결과 · 개명 제안 3건', title: '같은 부서에서 겹치던 이름 셋을 바꾸자고 제안했다' });
      d.h1 = txt(root, '기존 이름', { x: 392, y: 304 }, 'font:700 26px/1 var(--sans);color:var(--mute)');
      d.h2 = txt(root, '제안 이름', { x: 1010, y: 304 }, 'font:700 26px/1 var(--sans);color:#1456C8');
      d.svg = K.svg(root);
      d.rows = RN.map((r, i) => {
        const y = 356 + i * 196;
        const bg = K.at(root, '', { x: 96, y, w: 1728, h: 168 }); bg.style.borderRadius = '16px';
        const badge = K.chip(root, `같은 이름 ${r.dup}개`, 'warn lg', { x: 124, y: y + 58 }); badge.style.fontSize = '28px'; badge.style.fontWeight = '800';
        const old = txt(root, r.old, { x: 392, y: y + 60 }, 'font:600 38px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--ink-2);white-space:nowrap');
        const strike = h('div', '', old); strike.style.cssText = 'position:absolute;left:-6px;right:-6px;top:54%;height:3px;border-radius:2px;background:rgba(232,72,58,.6);transform-origin:0 50%';
        const ar = K.path(d.svg, [[900, y + 84], [980, y + 84]], { color: C.ink2, width: 4, arrow: true });
        const neu = txt(root, r.neu, { x: 1010, y: y + 48 }, 'font:850 58px/1.2 var(--sans);letter-spacing:-0.03em;color:var(--ink);white-space:nowrap');
        const sep = i < 2 ? K.at(root, '', { x: 120, y: y + 181, w: 1680, h: 2 }) : null;
        if (sep) sep.style.background = 'var(--rule)';
        return { bg, badge, old, strike, ar, neu, sep };
      });
    },
    render(lt, d) {
      d.T.render(lt);
      K.rise(d.h1, lt, 0.4, { y: 8 }); K.rise(d.h2, lt, 0.9, { y: 8 });
      // 머무는 동안에는 한 줄씩 강조만 한다
      const L = K.loop(lt, 2.8, [2.2, 2.2, 2.2]);
      d.rows.forEach((r, i) => {
        const t0 = 0.5 + i * 0.25;
        K.pop(r.badge, lt, t0); K.rise(r.old, lt, t0 + 0.05, { x: -16, y: 0 });
        K.draw(r.ar, lt, t0 + 0.4, 0.3);
        if (r.sep) K.wipe(r.sep, lt, t0, 0.6);
        const now = L.i === i;
        const on = now ? Math.min(prog(L.u, 0, 0.12), 1 - prog(L.u, 0.9, 0.1)) : 0;
        RH.set(r.bg, 'background', on > 0 ? `rgba(47,123,255,${(0.10 * on).toFixed(3)})` : 'transparent');
        r.strike.style.transform = `scaleX(${prog(lt, t0 + 0.5, 0.4, ease.swift).toFixed(4)})`;
        const pn = prog(lt, t0 + 0.75, 0.5, ease.swift);
        r.neu.style.opacity = pn > 0 ? '1' : '0';
        r.neu.style.clipPath = `inset(-10px ${((1 - pn) * 100).toFixed(2)}% -10px 0)`;
        r.neu.style.color = now ? mix(C.ink, '#1456C8', on) : C.ink;
      });
    },
  });

  // 한 건에 한 장: 기존 이름 → 제안 이름, 제안과 검토
  RN.forEach((r, i) => {
    DECK.slide({
      id: 'c4-rename' + (i + 1), title: r.title, chapter: CH, harness: 'naming', notes: r.notes,
      setup(root, d) {
        d.T = K.title(root, { w: TW, kicker: `개명 제안 ${i + 1} / 3 · 감사실`, title: r.title });
        d.ol = txt(root, '기존 이름', { x: 120, y: 302 }, 'font:700 26px/1 var(--sans);color:var(--mute)');
        d.old = K.at(root, '', { x: 120, y: 338 });
        d.old.style.cssText += ';display:flex;align-items:center;gap:24px;white-space:nowrap';
        const on = h('span', '', d.old, r.old); on.style.cssText = 'font:700 42px/1.2 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)';
        const bd = K.chip(d.old, `같은 부서에 같은 이름이 ${r.dup}개`, 'warn lg'); bd.style.fontSize = '28px'; bd.style.fontWeight = '800';
        d.nl = txt(root, '제안 이름', { x: 120, y: 440 }, 'font:700 26px/1 var(--sans);color:#1456C8');
        const S = 96;
        d.host = K.at(root, '', { x: 120, y: 482, w: 1300, h: S });
        d.host.style.color = C.ink;
        d.M = buildMorph(d.host, r.old, r.neu, S);
        d.M.lines.forEach(l => { l.style.height = '7px'; l.style.top = (S + 14) + 'px'; });
        // 근거 문서 수
        d.ev = K.at(root, '', { x: 1480, y: 302, w: 320 });
        d.ev.style.textAlign = 'right';
        d.ev.innerHTML = '<div style="font:700 26px/1 var(--sans);color:var(--mute)">근거 문서</div>' +
          '<div style="margin-top:10px;white-space:nowrap"><span class="num" style="font:900 104px/1 var(--display);letter-spacing:-0.03em">0</span><span style="font:800 40px/1 var(--sans);margin-left:6px">건</span></div>';
        d.evN = d.ev.querySelector('.num');
        // 제안과 검토
        d.svg = K.svg(root);
        d.a1 = actor(root, { id: 'unit-task-namer', x: 150, y: 676, w: 180 });
        d.a2 = actor(root, { id: 'naming-reviewer', x: 950, y: 652, w: 180 });
        d.p = K.path(d.svg, [[390, 840], [900, 840]], { color: C.ink2, width: 4, arrow: true });
        d.s1 = K.say(root, '같은 이름이 또 있어 문서에 맞게 바꿉니다', { x: 360, y: 716 }, 'blue', 'l');
        d.s2 = K.say(root, r.rs, { x: 1160, y: 716 }, r.vc, 'l');
        d.st = K.stampEl(root, r.v, r.vc, { x: 1190, y: 812 });
        d.st.style.fontSize = '46px'; d.st.style.padding = '10px 26px';
      },
      render(lt, d) {
        d.T.render(lt);
        K.rise(d.ol, lt, 0.4, { y: 8 }); K.rise(d.old, lt, 0.5, { x: -16, y: 0 });
        K.rise(d.nl, lt, 0.7, { y: 8 });
        K.rise(d.ev, lt, 0.9, { y: 10 }); K.count(d.evN, lt, 0.9, 1.0, r.n);
        d.a1.render(lt, 1.0); d.a2.render(lt, 1.2); K.draw(d.p, lt, 1.3, 0.4);
        // 등장: 기존 이름이 제안 이름으로 한 번 바뀐다(0.8~2.2초). 그 뒤로 제안 이름은 그대로 있다.
        const mu = (lt - 0.8) * 1.3;
        d.host.style.opacity = prog(lt, 0.6, 0.2).toFixed(3);
        renderMorph(d.M, mu);
        d.M.lines.forEach((ln, q) => {
          const p = prog(mu, 1.75 + q * 0.1, 0.4, ease.swift);
          ln.style.opacity = p > 0 ? '1' : '0';
          ln.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`;
        });
        // 반복: 제안 한마디 → 검토 한마디 → 판정 도장
        const L = K.loop(lt, 2.3, [1.5, 1.6, 2.6]);
        const st = L.i, u = L.u;
        if (lt > 1.9) { d.a1.act(lt, st === 0); d.a2.act(lt, st === 1); }
        show(d.s1, st >= 0 && (st > 0 || u > 0.1));
        show(d.s2, (st === 1 && u > 0.2) || st === 2);
        if (st === 2) K.stamp(d.st, u * 2.6, 0.1, { rot: -6 }); else d.st.style.opacity = '0';
      },
    });
  });

  // 결과 숫자
  DECK.slide({
    id: 'c4-result', title: '문서 8,978건으로 단위업무 23개의 이름을 점검했다', chapter: CH, harness: 'naming',
    notes: '감사실 실행 결과를 숫자로 모았다. 문서 8,978건을 묶음 90개로 줄여 읽고, 기존 단위업무 23개를 모두 판단했으며(유지 17, 개명 3, 통합·폐지 검토 3, 신설 0), 개명은 3건을 제안했다.\n검토 에이전트(naming-reviewer)는 1회차에 4건을 수정필요로 판정했고, 이름 제안 에이전트(unit-task-namer)가 고친 뒤 2회차에는 통과 21건, 수정필요 2건(P013, P020)이 되었다. 남은 2건은 이름이 아니라 어느 문서를 어느 철에 둘지에 대한 지적이고, 두 건 모두 이름은 그대로 두라고 했다. 이 지적은 제안표의 검토 의견 열에 남아 담당 부서가 정한다.\n결과물은 단위업무_제안표.xlsx·csv와 요약.md이고 build_report.py 가 만든다.\n출처: kac-unit-task-naming/output/20261117-감사실/요약.md, 단위업무_제안표.csv, _workspace/20261117-감사실/감사실/review_v1.json·review.json',
    setup(root, d) {
      d.T = K.title(root, { w: TW, kicker: '단위업무명 추천 · 감사실 실행 결과', title: '문서 8,978건으로 단위업무 23개의 이름을 점검했다' });
      const N = [[8978, '건', '감사실 문서', 480], [90, '개', '제목이 비슷한 문서 묶음', 360], [23, '개', '판단한 단위업무', 360], [3, '건', '개명 제안', 360]];
      let x = 120;
      d.nums = N.map((n, i) => {
        const b = K.at(root, '', { x, y: 316, w: n[3] });
        b.style.textAlign = 'center';
        b.innerHTML = `<div style="white-space:nowrap"><span class="num" style="font:900 132px/1 var(--display);letter-spacing:-0.03em">0</span><span style="font:800 44px/1 var(--sans);margin-left:6px">${n[1]}</span></div>` +
          `<div style="margin-top:16px;font:700 32px/1.25 var(--sans);letter-spacing:-0.02em;color:var(--ink-2)">${n[2]}</div>`;
        const gt = i < 3 ? txt(root, '›', { x: x + n[3], y: 336, w: 40 }, 'text-align:center;font:700 72px/1 var(--sans);color:var(--mute)') : null;
        x += n[3] + 40;
        return { b, num: b.querySelector('.num'), v: n[0], gt };
      });
      d.line = K.at(root, '', { x: 120, y: 566, w: 1680, h: 2 }); d.line.style.background = 'var(--rule-2)';
      d.svg = K.svg(root);
      d.a1 = actor(root, { id: 'naming-reviewer', x: 190, y: 626, w: 180 });
      d.st1 = K.stampEl(root, '통과 21건', 'ok', { x: 430, y: 650 });
      d.st2 = K.stampEl(root, '수정필요 2건', 'warn', { x: 430, y: 768 });
      [d.st1, d.st2].forEach(e => { e.style.fontSize = '46px'; e.style.padding = '10px 26px'; });
      d.p = K.path(d.svg, [[830, 812], [1150, 812]], { color: C.warn, width: 5, arrow: true });
      d.a2 = actor(root, { kind: 'human', name: '담당 부서', x: 1200, y: 618, w: 150 });
      d.fin = txt(root, '남은 지적 2건은<br>담당 부서가 정한다', { x: 1400, y: 724 }, 'font:800 40px/1.3 var(--display);letter-spacing:-0.02em;color:var(--ink);white-space:nowrap');
    },
    render(lt, d) {
      d.T.render(lt);
      const L = K.loop(lt, 3.0, [1.2, 1.2, 1.2, 1.2, 1.6, 1.8]);
      d.nums.forEach((n, i) => {
        const p = K.rise(n.b, lt, 0.5 + i * 0.25, { y: 24 });
        K.count(n.num, lt, 0.5 + i * 0.25, 1.0, n.v);
        if (n.gt) K.rise(n.gt, lt, 0.7 + i * 0.25, { x: -12, y: 0 });
        const on = L.i === i ? Math.min(prog(L.u, 0, 0.2), 1 - prog(L.u, 0.85, 0.15)) : 0;
        n.num.style.color = mix(C.ink, '#0B7A52', on);
        if (p >= 1) n.b.style.transform = `translateY(${(-8 * on).toFixed(1)}px)`;
      });
      K.wipe(d.line, lt, 1.4, 0.6);
      d.a1.render(lt, 1.6); d.a2.render(lt, 2.0);
      K.draw(d.p, lt, 2.1, 0.4); K.rise(d.fin, lt, 2.3, { y: 10 });
      K.stamp(d.st1, lt, 1.9, { rot: -4 }); K.stamp(d.st2, lt, 2.2, { rot: -4 });
      if (lt > 2.8) { d.a1.act(lt, L.i === 4); d.a2.act(lt, L.i === 5); }
      d.p.setAttribute('stroke-width', L.i === 5 ? 8 : 5);
    },
  });
})();

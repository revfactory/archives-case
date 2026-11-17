/* 공통 구조: 에이전트의 역할과, 만들기 → 검증 → 중재 흐름. 다른 장이 따라 쓸 본보기 장이다. */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s } = RH;
  const C = K.C;
  const CH = '공통 구조';

  // 에이전트마다 맡은 일이 다르다
  DECK.slide({
    id: 'h-roles', title: '에이전트마다 맡은 일이 다르다', chapter: CH,
    notes: '하네스 안에서 일하는 구성원을 역할로 나누면 여섯 가지다.\n스크립트는 정해진 계산만 한다(문서 추리기, 묶기, 형식 검사). 에이전트는 네 가지 역할로 나뉜다: 만드는 에이전트, 검증하는 에이전트, 갈린 판단을 정하는 에이전트, 보고서를 쓰는 에이전트. 마지막에는 사람이 검토하고 승인한다.\n이 발표의 다섯 하네스에는 에이전트가 모두 18개 있다(3·3·3·4·5). 뒤의 장에서는 이 그림과 색으로 역할을 표시한다. 파랑은 만들기, 빨강은 검증·반박, 주황은 판정·중재, 남색은 보고서다.',
    setup(root, d) {
      d.T = K.title(root, { kicker: '하네스의 구성원', title: '에이전트마다 맡은 일이 다르다' });
      const A = [
        { kind: 'script', name: '스크립트', job: '문서를 추리고 묶는다' },
        { kind: 'make', name: '만드는 에이전트', job: '첫 판단을 낸다' },
        { kind: 'check', name: '검증 에이전트', job: '따로 다시 판단한다' },
        { kind: 'judge', name: '판정 에이전트', job: '갈린 판단을 정한다' },
        { kind: 'write', name: '보고서 에이전트', job: '결과를 정리한다' },
        { kind: 'human', name: '사람', job: '검토하고 승인한다' },
      ];
      const W = 220, GAP = 292, BASE = 690;
      d.svg = K.svg(root);
      d.act = A.map((a, i) => {
        const w = a.kind === 'human' ? 172 : W;
        const x = 120 + i * GAP + (W - w) / 2, y = BASE - w * K.AGR[a.kind];
        return K.actor(root, { kind: a.kind, name: a.name, job: a.job, x, y, w, jobW: 290 });
      });
      d.arr = A.slice(0, -1).map((a, i) => K.path(d.svg, [[120 + i * GAP + W + 12, 580], [120 + (i + 1) * GAP - 12, 580]], { color: C.ink2, width: 3, arrow: true }));
      // 에이전트 네 개를 묶는 줄
      d.br = K.path(d.svg, [[120 + GAP - 30, 838], [120 + GAP - 30, 858], [120 + 4 * GAP + W + 30, 858], [120 + 4 * GAP + W + 30, 838]], { color: C.blue, width: 3, radius: 10 });
      d.cap = K.at(root, '', { x: 120 + GAP - 30, y: 884, w: 3 * GAP + W + 60 });
      d.cap.style.cssText += ';text-align:center;font:800 46px/1.2 var(--display);letter-spacing:-0.02em;color:var(--ink)';
      d.cap.innerHTML = '다섯 하네스에 에이전트 <span style="color:var(--blue)">18개</span>';
      d.doc = K.doc(root, '문서', { x: 0, y: 0 });
      d.pos = d.act.map(a => [a.cx - 46, a.top - 66]);
    },
    render(lt, d) {
      d.T.render(lt);
      d.act.forEach((a, i) => a.render(lt, 0.5 + i * 0.16));
      d.arr.forEach((p, i) => K.draw(p, lt, 0.75 + i * 0.16, 0.3));
      K.draw(d.br, lt, 1.7, 0.5); K.rise(d.cap, lt, 1.9, { y: 14 });
      // 문서 한 장이 왼쪽부터 차례로 지나간다
      const n = d.act.length, L = K.loop(lt, 2.4, Array(n).fill(1.5));
      d.act.forEach((a, i) => { if (lt > 2.2) a.act(lt, L.i === i && L.u > 0.3); });
      if (L.i < 0) { d.doc.style.opacity = '0'; return; }
      const from = d.pos[Math.max(0, L.i - 1)], to = d.pos[L.i];
      K.travel(d.doc, L.u, 0, 0.3, L.i === 0 ? [to[0] - 120, to[1]] : from, to, { arc: 26 });
      d.doc.style.opacity = (L.i === 0 ? clamp(L.u / 0.15) : L.i === n - 1 ? clamp((1 - L.u) / 0.2) : 1).toFixed(3);
    },
  });

  // 만들고, 따로 검증하고, 갈리면 중재한다
  DECK.slide({
    id: 'h-flow', title: '만들고, 따로 검증하고, 갈리면 중재한다', chapter: CH,
    notes: '다섯 하네스가 함께 쓰는 흐름이다. 한 에이전트가 판단을 내면 다른 에이전트가 그 판단을 보기 전에 따로 판단한다. 둘이 같으면 확정하고, 다르면 세 번째 에이전트가 두 의견을 비교해 정한다. 그래도 정할 수 없으면 사람에게 넘긴다.\n검증하는 에이전트는 만든 쪽의 파일을 고치지 않는다. 자기 판단만 따로 적는다.\n화면의 예는 제목 배정 하네스의 시험 실행이다. 제목 40개 중 33개는 검증이 동의했고 7개는 중재를 거쳐 확정했다.\n에이전트 이름: record-assigner, assignment-verifier, assignment-arbiter. 출처: kac-record-assign/output/t1',
    setup(root, d) {
      d.T = K.title(root, { kicker: '공통 흐름', title: '만들고, 따로 검증하고, 갈리면 중재한다' });
      d.a1 = K.actor(root, { kind: 'make', name: '만드는 에이전트', job: '철을 고른다', x: 230, y: 372, w: 260 });
      d.a2 = K.actor(root, { kind: 'check', name: '검증 에이전트', job: '앞의 판단을 보지 않고<br>다시 고른다', x: 790, y: 336, w: 260, jobW: 340 });
      d.a3 = K.actor(root, { kind: 'judge', name: '중재 에이전트', job: '둘을 비교해 정한다', x: 1185, y: 650, w: 190, jobW: 300 });
      d.svg = K.svg(root);
      d.p1 = K.path(d.svg, [[520, 520], [770, 520]], { color: C.ink2, width: 4, arrow: true });
      d.p2 = K.path(d.svg, [[1075, 470], [1440, 470]], { color: C.ok, width: 5, arrow: true });
      d.p3 = K.path(d.svg, [[1280, 470], [1280, 630]], { color: C.warn, width: 5, arrow: true });
      d.p4 = K.path(d.svg, [[1400, 780], [1620, 780], [1620, 640]], { color: C.warn, width: 5, arrow: true, radius: 24 });
      d.l2 = K.at(root, '', { x: 1110, y: 408 }, '같으면'); d.l2.style.cssText += ';font:800 34px/1 var(--sans);color:var(--ok)';
      d.l3 = K.at(root, '', { x: 1300, y: 530 }, '다르면'); d.l3.style.cssText += ';font:800 34px/1 var(--sans);color:#965A00';
      d.res = K.at(root, '', { x: 1470, y: 392 }, '확정'); d.res.style.cssText += ';font:800 44px/1 var(--display);letter-spacing:-0.02em;color:var(--ok)';
      d.n1 = K.at(root, '', { x: 1470, y: 452 }, ''); d.n1.style.cssText += ';font:900 130px/1 var(--display);color:var(--ok)';
      d.n1c = K.at(root, '', { x: 1660, y: 536 }, '개는 바로'); d.n1c.style.cssText += ';font:700 32px/1 var(--sans);color:var(--ink-2)';
      d.n2 = K.at(root, '', { x: 1470, y: 820 }, ''); d.n2.style.cssText += ';font:900 110px/1 var(--display);color:var(--warn)';
      d.n2c = K.at(root, '', { x: 1560, y: 888 }, '개는 중재를 거쳐'); d.n2c.style.cssText += ';font:700 32px/1 var(--sans);color:var(--ink-2)';
      d.cap = K.at(root, '', { x: 120, y: 930 }, '예: 제목 배정 시험, 제목 40개'); d.cap.style.cssText += ';font:600 26px/1 var(--sans);color:var(--mute)';
      d.doc = K.doc(root, '문서 제목', { x: 0, y: 0 });
      d.s1 = K.say(root, '이 철입니다', { x: 470, y: 360 }, 'blue', 'l');
      d.s2a = K.say(root, '저도 같습니다', { x: 1040, y: 300 }, 'ok', 'l');
      d.s2b = K.say(root, '저는 다릅니다', { x: 1040, y: 300 }, 'bad', 'l');
      d.s3 = K.say(root, '이쪽이 맞습니다', { x: 1360, y: 660 }, 'warn', 'l');
    },
    render(lt, d) {
      d.T.render(lt);
      d.a1.render(lt, 0.5); d.a2.render(lt, 0.7); d.a3.render(lt, 0.9);
      K.draw(d.p1, lt, 0.9, 0.4); K.draw(d.p2, lt, 1.2, 0.4); K.draw(d.p3, lt, 1.4, 0.4); K.draw(d.p4, lt, 1.7, 0.5);
      K.rise(d.l2, lt, 1.4, { y: 8 }); K.rise(d.l3, lt, 1.6, { y: 8 });
      K.rise(d.res, lt, 1.5, { y: 10 }); K.rise(d.n1c, lt, 1.7, { y: 8 }); K.rise(d.n2c, lt, 1.9, { y: 8 }); K.rise(d.cap, lt, 2.0, { y: 8 });
      K.count(d.n1, lt, 1.6, 0.9, 33); d.n1.style.opacity = prog(lt, 1.6, 0.3).toFixed(3);
      K.count(d.n2, lt, 1.8, 0.9, 7); d.n2.style.opacity = prog(lt, 1.8, 0.3).toFixed(3);
      // 문서 한 건의 진행. 짝수 바퀴는 검증이 동의하고, 홀수 바퀴는 달라서 중재로 간다.
      const L = K.loop(lt, 2.6, [0.9, 1.3, 0.9, 1.4, 1.1, 1.4]);
      const split = L.lap % 2 === 1, st = L.i, u = L.u;
      const show = (el, on) => { el.style.opacity = on ? '1' : '0'; el.style.transform = `scale(${on ? 1 : 0.8})`; };
      d.a1.act(lt, st === 1); d.a2.act(lt, st === 3); d.a3.act(lt, split && st === 5);
      show(d.s1, st === 1 && u > 0.35);
      show(d.s2a, !split && st === 3 && u > 0.35); show(d.s2b, split && st === 3 && u > 0.35);
      show(d.s3, split && st === 5 && u > 0.35);
      const P = { in: [120, 420], a1: [290, 306], a2: [850, 270], out: [1620, 380], a3: [1215, 596], out2: [1620, 380] };
      if (st < 0) { d.doc.style.opacity = '0'; return; }
      d.doc.className = 'doc' + (st >= 4 ? (split ? ' warn' : ' ok') : '');
      if (st === 0) K.travel(d.doc, u, 0, 1, P.in, P.a1, { arc: 30 });
      else if (st === 1) K.travel(d.doc, 1, 0, 1, P.a1, P.a1);
      else if (st === 2) K.travel(d.doc, u, 0, 1, P.a1, P.a2, { arc: 40 });
      else if (st === 3) K.travel(d.doc, 1, 0, 1, P.a2, P.a2);
      else if (st === 4) K.travel(d.doc, u, 0, 1, P.a2, split ? P.a3 : P.out, { arc: split ? 0 : 30 });
      else if (split) K.travel(d.doc, clamp((u - 0.6) / 0.4), 0, 1, P.a3, P.out2, { arc: 20 });
      else K.travel(d.doc, 1, 0, 1, P.out, P.out);
      d.doc.style.opacity = (st === 0 ? clamp(u / 0.2) : st === 5 ? clamp((1 - u) / 0.15) : 1).toFixed(3);
    },
  });
})();

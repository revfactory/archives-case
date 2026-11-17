/* 장 첫 영상 다섯 개(각 10초, 이어서 50초로 렌더한 뒤 10초씩 자른다).
 * 필름 「기록관리 하네스」의 하네스 구간과 같은 배치: 오른쪽에 작업장(Higgsfield 클립을 합성할 자리, 여기서는 비워 둔다),
 * 왼쪽 아래에 기록연구사와 질문, 왼쪽 위에 하네스 머리말. 그 아래에 과제와 이번 실행 수치를 둔다.
 * 수치는 발표 자료의 해당 장과 같은 값이다(출처는 각 하네스 output 폴더, 아래 SRC). */
(function () {
  'use strict';
  const R = REEL, K = KAC, C = K.C;
  const { ease, prog, clamp, css, h } = R;
  const F = 1 / R.fps;
  const DISP = '"Paperlogy", "Pretendard", sans-serif', BODY = '"Pretendard", sans-serif', MONO = '"JetBrains Mono", "Pretendard", monospace';
  const txt = (el, str, st) => { const d = h('div', 'a', el, str); css(d, Object.assign({ whiteSpace: 'nowrap' }, st)); return d; };

  const CH = [
    { key: 'assign', name: '제목으로 기록물철 배정', accent: C.blue, q: '제목만 보고 기록물철을 고를 수 있나요?', task: '생산현황 분류 정정',
      agents: ['배정', '검증', '중재'], stats: [[40, '고유 제목'], [33, '검증이 바로 동의'], [7, '중재로 확정']],
      src: 'kac-record-assign/output/t1 · 감사실·제주운영단 2026년' },
    { key: 'audit', name: '생산현황 오분류 점검', accent: C.orange, q: '이미 분류한 문서는 맞게 분류됐을까요?', task: '생산현황 분류 정정',
      agents: ['가린 분류', '판정', '반박'], stats: [[600, '시험 문서'], [158, '의심 묶음'], [65, '정정 권고(주입 오류 67건 중)']],
      src: 'kac-classification-audit/output/test01' },
    { key: 'naming', name: '단위업무명 추천', accent: C.green, q: '기준표에 없는 업무는요?', task: '단위업무명 추천·제안',
      agents: ['군집', '이름 제안', '검토'], stats: [[8978, '감사실 문서'], [90, '상위 군집'], [3, '개명 제안']],
      src: 'kac-unit-task-naming/output/20261117-감사실' },
    { key: 'orgchange', name: '조직 변경 시 단위업무 변경', accent: C.purple, q: '조직이 바뀌면 기준표는 어떻게 고치죠?', task: '조직변경 영향도',
      agents: ['해석', '영향 분석', '검증', '보고서'], stats: [[2, '조직변경 사건'], [3, '변경안 행'], [8, '검증이 찾은 누락']],
      src: 'kac-org-change-impact/output/시나리오-신공항건설1부이동' },
    { key: 'strategy', name: '단위업무 기준 조직 개편 추천', accent: C.teal, q: '어떻게 개편할지도 제안받을 수 있나요?', task: '전략적 조직 설계',
      agents: ['진단', '규정', '설계', '반박', '보고서'], stats: [[3, '관점별 대안'], [10, '옮길 단위업무'], [6, '경영진이 정할 것']],
      src: 'kac-org-strategy/output/20261117-safety' },
  ];
  const fmt = (v) => Math.round(v).toLocaleString('en-US');

  // 시각(장 안에서의 초)
  const T = { person: 0.35, bub: 0.6, type: 0.9, cps: 13, head: 2.75, task: 3.7, stats: 4.25, src: 5.5 };

  CH.forEach((c, i) => {
    const t0 = i * 10;
    R.scene({
      id: 'c' + (i + 1), start: Math.max(0, t0 - 0.5 * F), end: t0 + 10 - 0.5 * F,
      setup(el) {
        css(el, { background: C.paper });
        const root = this.root = h('div', 'full', el);

        /* 머리말: 필름의 하네스 머리말과 같은 꼴을 키웠다 */
        const hd = this.hd = h('div', 'a', root); css(hd, { left: '96px', top: '84px' });
        this.bar = h('div', 'a', hd); css(this.bar, { left: 0, top: '6px', width: '16px', height: '124px', background: c.accent, transformOrigin: '50% 0%' });
        this.small = txt(hd, '', { left: '38px', top: 0, font: `600 28px/1 ${BODY}`, color: C.dim });
        this.small.innerHTML = `기록관리 하네스 <b style="color:${c.accent};font-weight:800">${i + 1}</b> / 5`;
        const name = txt(hd, c.name, { left: '36px', top: '42px', font: `900 84px/1.05 ${DISP}`, letterSpacing: '-0.04em', color: C.navy });
        this.chars = R.split(name, 'char', { mask: true });
        this.chips = c.agents.map((a, j) => {
          const e = h('div', 'a', hd); css(e, { left: '38px', top: '160px', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px 9px 12px',
            background: C.white, border: `2px solid ${C.navy}`, borderRadius: '999px', font: `700 28px/1 ${BODY}`, color: C.navy, whiteSpace: 'nowrap' });
          const dot = h('div', '', e); css(dot, { width: '22px', height: '22px', background: c.accent, transform: 'rotate(45deg) scale(.72)' });
          h('span', '', e, a); return e;
        });
        this.widths = null;

        /* 과제 */
        this.task = h('div', 'a', root); css(this.task, { left: '134px', top: '322px' });
        txt(this.task, '과제', { left: 0, top: 0, font: `600 24px/1 ${BODY}`, color: C.dim });
        txt(this.task, c.task, { left: 0, top: 36, font: `800 46px/1.1 ${DISP}`, letterSpacing: '-0.03em', color: C.navy });
        this.task.lastChild.style.top = '36px';

        /* 이번 실행 수치 */
        const row = h('div', 'a', root); css(row, { left: '134px', top: '448px', display: 'flex', gap: '46px', alignItems: 'flex-start' });
        this.stats = c.stats.map(([v, lab]) => {
          const b = h('div', '', row); css(b, { maxWidth: '230px' });
          const n = h('div', '', b, '0'); css(n, { font: `900 80px/1 ${DISP}`, letterSpacing: '-0.04em', color: C.navy, fontVariantNumeric: 'tabular-nums' });
          const u = h('div', '', b); css(u, { height: '5px', width: '56px', background: c.accent, margin: '12px 0 10px', transformOrigin: '0 50%' });
          const l = h('div', '', b, lab); css(l, { font: `600 24px/1.3 ${BODY}`, color: C.navy, wordBreak: 'keep-all' });
          return { b, n, u, v };
        });
        this.src = txt(root, '출처 ' + c.src, { left: '134px', top: '664px', font: `500 19px/1 ${MONO}`, color: C.dim });

        /* 기록연구사와 질문(필름과 같은 그림·말풍선) */
        const qr = this.qr = h('div', 'a', root); css(qr, { left: '70px', top: '700px', width: '1300px', height: '380px' });
        this.person = K.sprite(qr, 'g08_person', { x: 105, y: 160, w: 720 }); this.person.style.mixBlendMode = 'darken';
        const bub = this.bub = h('div', 'a', qr);
        css(bub, { left: '225px', top: '74px', padding: '24px 36px 26px', background: C.navy, color: C.white, borderRadius: '30px 30px 30px 6px',
          font: `700 46px/1.2 ${BODY}`, letterSpacing: '-0.02em', whiteSpace: 'nowrap', transformOrigin: '0% 100%' });
        const tag = h('div', '', bub, '기록연구사의 질문');
        css(tag, { font: `600 24px/1 ${BODY}`, letterSpacing: '0.02em', color: C.sky, marginBottom: '14px', paddingRight: '90px' });
        const tx = h('div', '', bub);
        this.spans = [...c.q].map((ch) => h('span', '', tx, ch === ' ' ? ' ' : ch));
        const bars = h('div', 'a', bub); css(bars, { right: '30px', top: '22px', height: '24px', display: 'flex', gap: '4px', alignItems: 'center' });
        this.bs = Array.from({ length: 9 }, () => { const b = h('div', '', bars); css(b, { width: '4px', height: '24px', background: C.sky, borderRadius: '2px' }); return b; });
      },
      render(lt) {
        const u = lt - (t0 - Math.max(0, t0 - 0.5 * F));   // lt 는 장면 시작부터 잰 시간
        if (!this.widths) { this.widths = this.chips.map((e) => e.offsetWidth); let x = 38; this.chips.forEach((e, j) => { e.style.left = x + 'px'; x += this.widths[j] + 12; }); }
        // 질문
        css(this.person, { transform: `translateX(${((1 - prog(u, T.person, 0.5, ease.outCubic)) * -360).toFixed(1)}px)` });
        const pb = prog(u, T.bub, 0.45, ease.outBack);
        css(this.bub, { transform: `scale(${Math.max(0, pb).toFixed(4)})`, opacity: pb > 0 ? 1 : 0 });
        const n = this.spans.length, tEnd = T.type + n / T.cps;
        this.spans.forEach((sp, j) => { const p = prog(u, T.type + j / T.cps, 0.16, ease.outCubic); sp.style.opacity = p.toFixed(3); sp.style.display = 'inline-block'; sp.style.transform = `translateY(${((1 - p) * 12).toFixed(1)}px)`; });
        const talk = prog(u, T.type - 0.1, 0.15) * (1 - prog(u, tEnd, 0.3));
        this.bs.forEach((b, j) => { const lv = 0.5 + 0.5 * Math.sin(u * 17 + j * 1.3) * Math.sin(u * 6.1 + j * 0.7); b.style.transform = `scaleY(${(0.15 + 0.85 * talk * Math.abs(lv)).toFixed(3)})`; });
        // 머리말
        const lh = u - T.head;
        css(this.bar, { transform: `scaleY(${prog(lh, 0, 0.35, ease.outCubic).toFixed(4)})` });
        css(this.small, { opacity: prog(lh, 0.1, 0.25).toFixed(3), transform: `translateX(${((1 - prog(lh, 0.1, 0.35, ease.outCubic)) * -24).toFixed(1)}px)` });
        this.chars.forEach((ch, j) => { const p = R.stagger(lh, 0.08, 0.028, 0.5, j); css(ch, { transform: `translateY(${((1 - p) * 135).toFixed(1)}%)`, opacity: p > 0 ? 1 : 0 }); });
        this.chips.forEach((e, j) => { const p = prog(lh, 0.5 + j * 0.09, 0.4, ease.outBack); css(e, { transform: `translateY(${((1 - p) * 26).toFixed(1)}px) scale(${(0.7 + 0.3 * p).toFixed(4)})`, opacity: clamp(p * 2, 0, 1).toFixed(3) }); });
        // 과제
        const pt = prog(u, T.task, 0.45, ease.outCubic);
        css(this.task, { opacity: pt.toFixed(3), transform: `translateY(${((1 - pt) * 18).toFixed(1)}px)` });
        // 수치
        this.stats.forEach((s, j) => {
          const ts = T.stats + j * 0.3, p = prog(u, ts, 0.45, ease.outCubic);
          css(s.b, { opacity: p.toFixed(3), transform: `translateY(${((1 - p) * 22).toFixed(1)}px)` });
          s.n.textContent = fmt(s.v * prog(u, ts, 1.1, ease.outCubic));
          s.u.style.transform = `scaleX(${prog(u, ts + 0.3, 0.5, ease.outCubic).toFixed(4)})`;
        });
        css(this.src, { opacity: prog(u, T.src, 0.4).toFixed(3) });
      },
    });
  });
})();

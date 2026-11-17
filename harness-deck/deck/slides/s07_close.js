/* 맺음 — 사람이 정할 것(s02 의 h-human 이 place 로 이 앞에 온다), 한눈에, 한계, 맺음. 맺음 장은 표지(필름 엔드카드)의 건물로 돌아간다. */
(function () {
  'use strict';
  const { ease, prog, clamp, lerp, h, s, css } = RH;
  const C = K.C;
  const CH = '맺음';

  // 38. 다섯 하네스 한눈에
  DECK.slide({
    id: 'summary', title: '다섯 하네스 한눈에', chapter: CH,
    notes: '다섯 하네스를 입력, 에이전트, 산출물, 사람이 할 일로 정리했다.\n공통점은 하네스가 결과 파일과 근거를 남기고, 반영 여부는 사람이 정한다는 점이다.\n산출물 경로: 각 하네스 폴더의 output/ 아래.',
    setup(root, d) {
      d.T = K.title(root, { kicker: '정리', title: '다섯 하네스 한눈에' });
      const cols = [{ label: '하네스', w: 330 }, { label: '입력', w: 270 }, { label: '에이전트', w: 390 }, { label: '산출물', w: 340 }, { label: '사람이 할 일', w: 350 }];
      const nm = (key, dir) => `<span class="mono" style="font-size:19px;color:var(--ink-2)">${dir}</span><br><b style="color:${K.HZ[key].c}">${K.HZ[key].short}</b>`;
      // 필름과 같은 순서
      const rows = [
        [nm('assign', 'kac-record-assign'), '문서 제목(부서·연도 조건)', '배정 · 검증 · 중재 <span class="mono">3</span>', '배정결과.csv · .xlsx<br>검토필요.csv', '검토필요·미배정 건 확인'],
        [nm('audit', 'kac-classification-audit'), '분류가 붙은 생산현황', '가린 분류 · 판정 · 반박 <span class="mono">3</span>', '정정안.csv<br>사람확인.csv', '정정 권고 반영, 사람 확인 건 판정'],
        [nm('naming', 'kac-unit-task-naming'), '부서 생산현황', '군집 · 이름 제안 · 검토 <span class="mono">3</span>', '단위업무_제안표.csv · .xlsx', '개명·통합 채택, 보류 군집 판단'],
        [nm('orgchange', 'kac-org-change-impact'), '조직변경 시나리오', '해석 · 영향 분석 · 검증 · 보고서 <span class="mono">4</span>', '영향도_보고서.md<br>분류기준표_변경안.csv', '이관 범위, 부서 거취, 부 이름 결정'],
        [nm('strategy', 'kac-org-strategy'), '전략 방향 한 문장', '진단 · 규정 · 설계 · 반박 · 보고서 <span class="mono">5</span>', '조직개편_추천보고서.md', '경영진 결정 6가지'],
      ];
      d.tbl = K.table(root, { x: 120, y: 296, w: 1680, cols, rows, rowH: 124 });
      d.tbl.el.querySelectorAll('.td').forEach(td => { td.style.fontSize = '24px'; td.style.lineHeight = '1.4'; });
      d.tbl.el.querySelectorAll('.td b').forEach(b => { b.style.fontSize = '29px'; b.style.fontWeight = '800'; b.style.fontFamily = 'var(--display)'; });
      d.tbl.rows.forEach(r => { r.style.borderRadius = '10px'; r.children[4].style.fontWeight = '700'; r.children[4].style.color = 'var(--ink)'; });
    },
    render(lt, d) {
      d.T.render(lt);
      d.tbl.render(lt, 0.4, 0.12);
      const k = K.cycle(lt, 2.4, 2.2, 5);
      d.tbl.rows.forEach((r, i) => K.mark(r, k === i, 'rgba(27,42,74,.055)'));
    },
  });

  // 39. 한계와 다음 단계
  DECK.slide({
    id: 'limits', title: '한계와 다음 단계', chapter: CH,
    notes: '한계를 먼저 말씀드린다. 하네스는 문서 제목만 보고 판단한다. 시험 규모는 표본이다(배정 40개 제목, 점검 600건). 생산현황 문서 535,148건은 자기 분류기준표가 없는 부서에서 나왔다(준용 522,546 + 승계추정 12,185 + 대상외 417). 조직 설계 추천안은 인원·예산 자료가 없어 별도 산정으로 남겼다.\n다음 단계는 남은 제목을 이어서 배정하고, 사람이 확인한 결과를 판단 규칙에 반영해 다시 실행하는 것이다.\n출처: kac-record-assign/output/t1/요약.md, kac-classification-audit/output/test01/요약.md, kac-shared/data/dept_map.json, kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md',
    setup(root, d) {
      d.T = K.title(root, { kicker: '남은 일', title: '한계를 알고 다음 단계로 간다' });
      const L = [
        ['제목만 보고 판단한다', '문서목록에는 본문·첨부가 없다. 제목이 짧으면 미배정·사람 확인으로 남긴다'],
        ['시험 규모가 작다', '배정 40개 제목(문서 56건), 점검 600건(오류 128건 주입)'],
        ['기준표가 없는 부서가 많다', '문서 535,148건이 자기 분류기준표가 없는 부서에서 나왔다(준용·승계추정·대상외)'],
        ['인원·예산 자료가 없다', '조직 설계 추천안은 인원·예산을 "별도 산정 필요"로 남겼다'],
      ];
      const N = [
        ['남은 제목을 이어서 배정', '감사실·제주운영단 2026년 남은 고유 제목 14,259개, 그다음 다른 부서·연도'],
        ['사람 확인 결과를 규칙에 반영', '검토필요·사람 확인 건의 판정을 규칙 스킬에 넣고 다시 실행'],
        ['분류기준표를 정비한 뒤 다시 실행', '비상계획실 공란 34행, 준용 부서 기준표를 정비하고 같은 하네스로 확인'],
      ];
      const col = (x, head, color, items) => {
        const hd = K.at(root, '', { x, y: 300 }, head); hd.style.cssText += `;font-size:28px;font-weight:800;color:${color}`;
        const rule = K.at(root, '', { x, y: 350, w: 780, h: 3 }); rule.style.background = color;
        const its = items.map((it, i) => {
          const g = K.at(root, '', { x, y: 392 + i * 152, w: 780 });
          const mk = h('div', '', g); mk.style.cssText = `position:absolute;left:0;top:16px;width:16px;height:16px;border-radius:3px;background:${color}`;
          const t = h('div', '', g, it[0]); t.style.cssText = 'margin-left:34px;font-size:38px;font-weight:800;letter-spacing:-0.02em;color:var(--ink)';
          const ds = h('div', 'small', g, it[1]); ds.style.cssText = 'margin-left:34px;font-size:24px;margin-top:8px;color:var(--ink-2);line-height:1.45';
          return { g, mk };
        });
        return { hd, rule, its };
      };
      d.a = col(120, '한계', C.warn, L);
      d.b = col(1020, '다음 단계', C.blue, N);
      d.svg = K.svg(root);
      d.arrow = K.path(d.svg, [[930, 600], [990, 600]], { color: C.blue, width: 4, arrow: true });
    },
    render(lt, d) {
      d.T.render(lt);
      [d.a, d.b].forEach((c, j) => {
        K.rise(c.hd, lt, 0.4 + j * 0.7, { y: 12 });
        K.wipe(c.rule, lt, 0.5 + j * 0.7, 0.6);
        c.its.forEach((it, i) => K.rise(it.g, lt, 0.6 + j * 0.7 + i * 0.1, { x: -16, y: 0 }));
      });
      K.draw(d.arrow, lt, 1.1, 0.4);
      const k = K.cycle(lt, 2.8, 1.8, 3);
      d.b.its.forEach((it, i) => { it.mk.style.transform = k === i ? 'scale(1.5)' : 'scale(1)'; });
    },
  });

  // 맺음: 표지와 같은 건물로 돌아온다. 다섯 하네스 칩 옆에 결과 파일을 둔다
  DECK.slide({
    id: 'close', title: '맺음', chapter: CH,
    notes: '하네스는 고칠 안과 근거를 파일로 내고, 반영 여부는 담당자와 경영진이 정한다. 필름의 마지막 말과 같다: 모든 산출물은 사람이 검토할 추천이다.\n화면 왼쪽 아래는 각 하네스의 결과 파일 위치다. 오른쪽 아래는 필름이 끝난 질문 「그럼, 첫 문서부터 분류해 볼까요?」이고, 다음 실행은 감사실·제주운영단 2026년의 남은 고유 제목 14,259개다(한계와 다음 단계 장). 질문을 받겠다.',
    setup(root, d) {
      d.arch = K.sprite(root, 'g01_archive', { x: 1480, y: 500, w: 880, origin: '50% 70%' });
      d.l1 = K.at(root, '', { x: 116, y: 150, w: 1150 }, '하네스는 고칠 안과 근거를 내고,');
      d.l2 = K.at(root, '', { x: 116, y: 244, w: 1150 }, '결정은 사람이 한다.');
      [d.l1, d.l2].forEach(e => { e.style.cssText += ';font:900 76px/1.18 var(--display);letter-spacing:-0.04em;color:var(--ink);white-space:nowrap'; });
      d.l2.style.color = K.C.ok;
      d.w1 = RH.split(d.l1, 'char', { mask: true }); d.w2 = RH.split(d.l2, 'char', { mask: true });
      d.note = K.at(root, '', { x: 120, y: 372 }, '모든 산출물은 사람이 검토할 추천입니다');
      d.note.style.cssText += ';font:700 32px/1 var(--sans);color:var(--ink-2);white-space:nowrap';
      const P = [
        ['assign', 'kac-record-assign/output/t1/배정결과.xlsx'],
        ['audit', 'kac-classification-audit/output/test01/정정안.csv'],
        ['naming', 'kac-unit-task-naming/output/20261117-감사실/단위업무_제안표.xlsx'],
        ['orgchange', 'kac-org-change-impact/output/시나리오-신공항건설1부이동/영향도_보고서.md'],
        ['strategy', 'kac-org-strategy/output/20261117-safety/조직개편_추천보고서.md'],
      ];
      // 필름 마지막 질문으로 끝낸다. 표지가 이 질문에서 시작했고, 답은 다음 실행이다(한계와 다음 단계 장)
      d.Q = K.question(root, '그럼, 첫 문서부터 분류해 볼까요?', { x: 1090, y: 812, person: { x: 70, y: 110, w: 120 }, bx: 150, by: 40, size: 34, pad: '18px 28px 20px', tagSize: 21 });
      d.nx = K.at(root, '', { x: 1240, y: 990 }, '다음 실행 · 감사실·제주운영단 2026년 남은 고유 제목 14,259개');
      d.nx.style.cssText += ';font-size:21px;font-weight:700;color:var(--ink-2);white-space:nowrap';
      d.ph = K.at(root, '', { x: 120, y: 470 }, '결과 파일'); d.ph.style.cssText += ';font-size:24px;font-weight:700;color:var(--mute)';
      d.ps = P.map(([k, p], i) => {
        const g = K.at(root, '', { x: 120, y: 516 + i * 76, w: 1100 });
        const c = K.hchip(g, k, { x: 0, y: 0, w: 236 }); c.style.fontSize = '25px'; c.style.padding = '9px 0 10px'; c.style.justifyContent = 'center';
        const e = K.at(g, 'mono', { x: 256, y: 10 }, p); e.style.cssText += ';font-size:19px;color:var(--ink);white-space:nowrap';
        return g;
      });
    },
    render(lt, d) {
      d.w1.forEach((w, i) => { const p = RH.stagger(lt, 0.15, 0.025, 0.55, i); w.style.transform = `translateY(${((1 - p) * 120).toFixed(1)}%)`; });
      d.w2.forEach((w, i) => { const p = RH.stagger(lt, 0.65, 0.03, 0.55, i); w.style.transform = `translateY(${((1 - p) * 120).toFixed(1)}%)`; });
      K.rise(d.note, lt, 1.1, { y: 12 });
      K.rise(d.ph, lt, 1.3, { y: 10 });
      d.ps.forEach((e, i) => K.rise(e, lt, 1.4 + i * 0.09, { x: -16, y: 0 }));
      d.Q.render(lt, 2.0, 24);
      K.rise(d.nx, lt, 3.4, { y: 8 });
      const pa = prog(lt, 0.2, 0.9, ease.outCubic);
      d.arch.style.opacity = pa.toFixed(3);
      d.arch.style.transform = `translateY(${((1 - pa) * 40).toFixed(1)}px) scale(${(1 + 0.03 * prog(lt, 1, 9, ease.inOutSine)).toFixed(4)})`;
    },
  });
})();

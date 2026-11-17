// 덱 검수 스틸: 장마다 지정 시각의 화면을 PNG 로 찍는다.
//   node tools/shoot.mjs --pages 2-7 [--times 0.6,8] [--out ../qa/deck] [--scale 0.5] [--root ../publish --file _test.html]
// 페이지 오류·콘솔 오류는 끝에 모아 출력하고, 있으면 종료 코드 2.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(os.homedir(), '.claude/skills/showreel/scripts/node_modules/playwright-core'));
const here = path.dirname(new URL(import.meta.url).pathname);
const root = process.argv.includes('--root') ? path.resolve(process.argv[process.argv.indexOf('--root') + 1]) : path.resolve(here, '..');
const pageFile = process.argv.includes('--file') ? process.argv[process.argv.indexOf('--file') + 1] : 'index.html';
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const out = path.resolve(arg('out') || path.join(root, '../qa/deck'));
const times = (arg('times') || '8').split(',').map(Number);
const scale = parseFloat(arg('scale') || '0.5');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { if (!req.url.includes('favicon')) console.error('404', req.url); res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
let browser;
for (const t of [{ channel: 'chrome' }, { channel: 'chromium' }, {}]) { try { browser = await chromium.launch({ headless: true, args: ['--force-color-profile=srgb', '--hide-scrollbars'], ...t }); break; } catch (e) {} }
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${port}/${pageFile}?still=1&s=1&t=0`);
await page.waitForFunction(() => window.DECK && window.DECK.ready, null, { timeout: 30000 });
const n = await page.evaluate(() => DECK.slides.length);
let pages = [];
const pr = arg('pages') || `1-${n}`;
for (const part of pr.split(',')) { const [a, b] = part.split('-').map(Number); for (let i = a; i <= (b || a); i++) if (i >= 1 && i <= n) pages.push(i); }
// --ids a,b,c : 장 id 로 고른다(다른 사람이 장을 더해 번호가 바뀌어도 같은 장을 찍는다). 'pre*' 처럼 끝에 * 를 붙이면 앞부분이 같은 장 모두.
if (arg('ids')) {
  const want = arg('ids').split(',');
  const all = await page.evaluate(() => DECK.slides.map(d => d.id));
  pages = all.map((id, i) => (want.some(w => (w.endsWith('*') ? id.startsWith(w.slice(0, -1)) : id === w)) ? i + 1 : 0)).filter(Boolean);
}
for (const p of pages) {
  for (const t of times) {
    await page.evaluate(([i, tt]) => DECK.seek(i, tt), [p - 1, t]);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(60);
    const name = `p${String(p).padStart(2, '0')}_t${String(t).replace('.', '_')}.png`;
    await page.screenshot({ path: path.join(out, name) });
  }
}
console.log(`장 ${n}개 중 ${pages.length}개 × 시각 ${times.length}개 → ${out}`);
const titles = await page.evaluate(() => DECK.slides.map((d, i) => `${i + 1}:${d.id}`).join(' '));
console.log(titles);
await browser.close(); server.close();
if (errs.length) { console.log('오류:\n' + [...new Set(errs)].join('\n')); process.exit(2); }

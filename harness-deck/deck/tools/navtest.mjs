// 실제 재생 모드에서 → 키로 40장을 넘기며 페이지 오류를 모은다.
//   node tools/navtest.mjs [--root ../publish --file _test.html]
import { createRequire } from 'module';
import http from 'http'; import fs from 'fs'; import path from 'path'; import os from 'os';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(os.homedir(), '.claude/skills/showreel/scripts/node_modules/playwright-core'));
const here = path.dirname(new URL(import.meta.url).pathname);
const ai = k => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null;
const root = ai('--root') ? path.resolve(ai('--root')) : path.resolve(here, '..');
const file = ai('--file') || 'index.html';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let browser; for (const t of [{ channel: 'chrome' }, {}]) { try { browser = await chromium.launch({ headless: true, ...t }); break; } catch (e) {} }
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/${file}`);
await page.waitForFunction(() => window.DECK && window.DECK.ready, null, { timeout: 30000 });
const n = await page.evaluate(() => DECK.slides.length);
for (let i = 1; i < n; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(450); }
const last = await page.evaluate(() => location.hash);
await page.keyboard.press('Home').catch(() => {});
console.log('장', n, '마지막 해시', last, '페이지 오류', errs.length ? errs : '없음');
await browser.close(); server.close();

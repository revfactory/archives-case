#!/usr/bin/env python3
"""공유용 한 장짜리 페이지를 만든다(Artifact 게시용).

- doctype/html/head/body 태그를 빼고 <title>, <style>, 본문, <script> 만 남긴다(게시할 때 바깥 틀이 붙는다).
- deck.css 의 폰트는 data URI로 넣는다(외부 폰트 파일은 막힌다).
- JS 파일은 하나의 <script>로 합친다.
- 영상·포스터(media/)와 생성 그림(img/)은 publish/ 아래에 복사해 files 로 함께 게시한다.
- 슬라이드 코드가 실제로 쓰는 media 파일만 복사하고, 쓰지 않게 된 파일은 publish/media 에서 지운다.

  python3 tools/build_fonts.py && python3 tools/build_publish.py
  → ../publish/index.html, ../publish/media/*, ../publish/img/*
"""
import base64
import re
import shutil
from pathlib import Path

D = Path(__file__).resolve().parent.parent
OUT = D.parent / 'publish'
(OUT / 'media').mkdir(parents=True, exist_ok=True)
(OUT / 'img').mkdir(parents=True, exist_ok=True)

html = (D / 'index.html').read_text(encoding='utf-8')
css = (D / 'deck.css').read_text(encoding='utf-8')


def font_uri(m):
    p = D / m.group(1)
    b64 = base64.b64encode(p.read_bytes()).decode()
    return f'url("data:font/woff2;base64,{b64}")'


css = re.sub(r'url\("(fonts/[^"]+\.woff2)"\)', font_uri, css)

srcs = re.findall(r'<script src="([^"]+)"></script>', html)
js = []
for s in srcs:
    t = (D / s).read_text(encoding='utf-8')
    assert '</script' not in t.lower(), s
    js.append(f'/* ── {s} ── */\n{t}')
body = re.search(r'<body[^>]*>(.*?)<script', html, re.S).group(1).strip()
body_cls = re.search(r'<body class="([^"]*)"', html).group(1)
title = re.search(r'<title>(.*?)</title>', html).group(1)

page = f"""<title>{title}</title>
<style>
{css}
</style>
{body}
<script>
document.body.classList.add({body_cls!r});
{chr(10).join(js)}
</script>
"""
(OUT / 'index.html').write_text(page, encoding='utf-8')

alljs = '\n'.join(js)
used = set(re.findall(r"media/([\w.-]+\.(?:mp4|jpg))", alljs))
for f in sorted((OUT / 'media').glob('*')):
    if f.name not in used:
        f.unlink()
        print('  지움', f.name)
for name in sorted(used):
    shutil.copy2(D / 'media' / name, OUT / 'media' / name)
for f in sorted((D / 'img').glob('*.jpg')):
    shutil.copy2(f, OUT / 'img' / f.name)

print(OUT / 'index.html', f'{(OUT / "index.html").stat().st_size / 1e6:.2f} MB')
for f in sorted((OUT / 'media').glob('*')):
    print(' ', f.name, f'{f.stat().st_size / 1e6:.2f} MB')
print('  img', len(list((OUT / 'img').glob('*.jpg'))), '장')

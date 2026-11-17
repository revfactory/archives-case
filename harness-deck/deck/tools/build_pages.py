#!/usr/bin/env python3
"""GitHub Pages 용 발표 사이트를 저장소 루트의 docs/ 에 만든다.

build_publish.py 가 만든 ../publish/index.html(문서 틀 없이 <title>·<style>·본문·<script>)을
완전한 HTML 문서로 감싸고, media/ 와 img/ 를 함께 복사한다.

  python3 tools/build_fonts.py && python3 tools/build_publish.py && python3 tools/build_pages.py
  → ../../docs/index.html, ../../docs/media/*, ../../docs/img/*
"""
import re
import shutil
from pathlib import Path

D = Path(__file__).resolve().parent.parent          # harness-deck/deck
PUB = D.parent / 'publish'
OUT = D.parent.parent / 'docs'                      # 저장소 루트의 docs/

page = (PUB / 'index.html').read_text(encoding='utf-8')
m = re.match(r'\s*(<title>.*?</title>)\s*(<style>.*?</style>)(.*)\Z', page, re.S)
assert m, 'publish/index.html 형식이 예상과 다르다'
title, style, rest = m.groups()
html = f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="한국공항공사 기록물 분류 과제 네 가지에 하네스 다섯 개를 적용한 결과 발표(39장)">
{title}
{style}
</head>
<body>
{rest.strip()}
</body>
</html>
"""
if OUT.exists():
    shutil.rmtree(OUT)
(OUT / 'media').mkdir(parents=True)
(OUT / 'index.html').write_text(html, encoding='utf-8')
(OUT / '.nojekyll').write_text('', encoding='utf-8')
shutil.copytree(PUB / 'media', OUT / 'media', dirs_exist_ok=True)
shutil.copytree(PUB / 'img', OUT / 'img')
n = sum(1 for _ in OUT.rglob('*') if _.is_file())
size = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file()) / 1e6
print(OUT, f'파일 {n}개, {size:.1f} MB')

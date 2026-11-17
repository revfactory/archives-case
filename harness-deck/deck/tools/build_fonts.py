#!/usr/bin/env python3
"""덱에 쓰인 글자만 남겨 폰트를 줄인다.

slides/*.js, data/deckdata.js, index.html, kit.js, deck.js 의 글자를 모아
  fonts/src/ 의 원본(Pretendard 가변, Noto Serif KR 700, JetBrains Mono, Paperlogy 800·900)을 서브셋해 fonts/ 에 woff2로 쓴다.
슬라이드 문구를 바꾸면 다시 실행한다.

  python3 tools/build_fonts.py
"""
import re
import subprocess
from pathlib import Path

D = Path(__file__).resolve().parent.parent
SRC = D / 'fonts' / 'src'
OUT = D / 'fonts'

text = set()
for p in [*sorted((D / 'slides').glob('*.js')), D / 'data' / 'deckdata.js', D / 'index.html', D / 'kit.js', D / 'deck.js']:
    t = p.read_text(encoding='utf-8')
    # \uXXXX 이스케이프도 글자로 푼다
    t += ''.join(chr(int(m, 16)) for m in re.findall(r'\\u([0-9a-fA-F]{4})', t))
    text.update(t)
text.update(chr(c) for c in range(0x20, 0x7f))
text.update('·…–—→←↑↓×○●◯▶■□▲▼「」『』‘’“”%₩')
# 장을 고치는 동안에는 FULL=1 로 상용 한글 2,350자를 모두 넣어 둔다(문구를 바꿀 때마다 다시 만들지 않으려고). 게시 전에는 FULL 없이 다시 만든다.
import os
if os.environ.get('FULL'):
    for hi in range(0xB0, 0xC9):
        for lo in range(0xA1, 0xFF):
            try: text.add(bytes([hi, lo]).decode('euc-kr'))
            except UnicodeDecodeError: pass
chars = ''.join(sorted(c for c in text if ord(c) >= 0x20))
(OUT / '_chars.txt').write_text(chars, encoding='utf-8')
print('글자 수', len(chars))

JOBS = [
    ('PretendardVariable.ttf', 'PretendardVariable.woff2'),
    ('NotoSerifKR-700.ttf', 'NotoSerifKR-700.woff2'),
    ('JetBrainsMono-400.ttf', 'JetBrainsMono-400.woff2'),
    ('JetBrainsMono-500.ttf', 'JetBrainsMono-500.woff2'),
    ('JetBrainsMono-700.ttf', 'JetBrainsMono-700.woff2'),
    ('Paperlogy-800.ttf', 'Paperlogy-800.woff2'),
    ('Paperlogy-900.ttf', 'Paperlogy-900.woff2'),
]
for src, dst in JOBS:
    s = SRC / src
    if not s.exists():
        print('원본 없음, 건너뜀:', s)
        continue
    subprocess.run(['pyftsubset', str(s), f'--text-file={OUT / "_chars.txt"}', '--flavor=woff2',
                    '--layout-features=*', '--no-hinting', f'--output-file={OUT / dst}'], check=True)
    print(dst, f'{(OUT / dst).stat().st_size / 1024:.0f} KB')

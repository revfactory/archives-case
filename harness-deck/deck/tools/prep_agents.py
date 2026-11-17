#!/usr/bin/env python3
"""assets/agents/ag_*.png(codex-image 로 만든 역할 그림)을 덱용으로 다듬는다.
물체 주변만 자르고, 바탕을 덱 종이색보다 조금 밝게 맞춰(darken 겹침에서 테두리가 보이지 않게) img/ag_<역할>.jpg 로 쓴다.
끝에 kit.js 의 K.AGR 에 넣을 세로/가로 비를 출력한다.

  python3 tools/prep_agents.py
"""
from pathlib import Path
import shutil
import numpy as np
from PIL import Image

D = Path(__file__).resolve().parent.parent
SRC = D.parent / 'assets' / 'agents'
OUT = D / 'img'
TARGET = np.array([255, 246, 231], dtype=np.float32)   # 종이색(253,243,226)보다 조금 밝게
ratios = {}
for f in sorted(SRC.glob('ag_*.png')):
    im = Image.open(f).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    bg = np.median(np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3)]), axis=0)
    diff = np.abs(a - bg).max(axis=2)
    ys, xs = np.where(diff > 26)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    m = int(0.07 * max(x1 - x0, y1 - y0))
    x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(a.shape[1], x1 + m), min(a.shape[0], y1 + m)
    c = np.clip(a[y0:y1, x0:x1] * (TARGET / bg), 0, 255).astype(np.uint8)
    o = Image.fromarray(c)
    w = 640
    o = o.resize((w, round(o.height * w / o.width)), Image.LANCZOS)
    kind = f.stem[3:]
    o.save(OUT / f'ag_{kind}.jpg', quality=90)
    ratios[kind] = round(o.height / o.width, 4)
shutil.copy(OUT / 'g08_person_c.jpg', OUT / 'ag_human.jpg')
ratios['human'] = round(1174 / 720, 4)
print('K.AGR =', ratios)

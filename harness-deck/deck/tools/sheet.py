"""스틸 폴더 → 한 장의 시트. python3 tools/sheet.py <폴더> <출력.png> [--cols 3] [--match p0]"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
a = sys.argv[1:]
src, dst = a[0], a[1]
cols = int(a[a.index('--cols') + 1]) if '--cols' in a else 3
match = a[a.index('--match') + 1] if '--match' in a else ''
fs = sorted(f for f in glob.glob(os.path.join(src, '*.png')) if match in os.path.basename(f))
if not fs: sys.exit('스틸 없음')
tw = 640
ims = []
for f in fs:
    im = Image.open(f).convert('RGB'); im = im.resize((tw, int(im.height * tw / im.width)))
    ims.append((os.path.basename(f)[:-4], im))
th = ims[0][1].height + 30
rows = (len(ims) + cols - 1) // cols
o = Image.new('RGB', (cols * (tw + 10) + 10, rows * (th + 10) + 10), (60, 60, 60))
d = ImageDraw.Draw(o)
try: font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 18)
except Exception: font = None
for i, (n, im) in enumerate(ims):
    x, y = 10 + (i % cols) * (tw + 10), 10 + (i // cols) * (th + 10)
    o.paste(im, (x, y + 30)); d.text((x + 4, y + 6), n, fill=(255, 255, 255), font=font)
o.save(dst); print(dst, len(ims))

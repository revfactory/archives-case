#!/usr/bin/env python3
"""완성 영상을 덱용으로 나누고 줄여 deck/media/ 에 넣는다.

  python3 package.py <인트로 완성본.mp4> <챕터 완성본.mp4>

- intro.mp4: 1920×1080, 약 12MB(CRF 24), 포스터 intro.jpg 는 45.5초(제목 화면)
- ch1~ch5.mp4: 챕터 완성본을 10초씩 잘라 소리 끝을 0.4초 줄인다. 포스터는 9.6초(제목 고정 화면)
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / 'deck' / 'media'
MEDIA.mkdir(parents=True, exist_ok=True)
V = ['-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
     '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
     '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart']


def run(args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def poster(src, t, out):
    run(['-ss', str(t), '-i', str(src), '-frames:v', '1', '-q:v', '3', str(out)])


def main():
    intro, chapters = Path(sys.argv[1]), Path(sys.argv[2])
    run(['-i', str(intro), '-crf', '24', *V, str(MEDIA / 'intro.mp4')])
    poster(intro, 45.5, MEDIA / 'intro.jpg')
    for k in range(5):
        out = MEDIA / f'ch{k + 1}.mp4'
        run(['-ss', str(k * 10), '-t', '10', '-i', str(chapters),
             '-af', 'afade=t=in:st=0:d=0.03,afade=t=out:st=9.6:d=0.4', '-crf', '19', *V, str(out)])
        poster(chapters, k * 10 + 9.6, MEDIA / f'ch{k + 1}.jpg')
    for f in sorted(MEDIA.glob('*')):
        print(f'{f.name:12s} {f.stat().st_size / 1e6:6.2f} MB')


if __name__ == '__main__':
    main()

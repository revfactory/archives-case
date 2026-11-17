#!/usr/bin/env python3
"""렌더한 그래픽 영상에 Higgsfield 클립을 RGB screen 합성으로 넣는다.

장면 코드는 클립 구간의 바탕을 검정으로 그린다. 검정 위에서는 클립이 그대로 보이고, 흰 글자·도형은 흰색으로 남는다.
클립 구간 밖은 클립 트랙이 검정이라 그래픽이 바뀌지 않는다.

사용법
  python3 compose.py intro    <렌더.mp4> <출력.mp4> [--draft]
  python3 compose.py chapters <렌더.mp4> <출력.mp4> [--draft]
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIPS = ROOT / 'assets' / 'hf_clips'

# (시작 초, 끝 초, 클립 파일, 클립 안 시작 초, 밝기 배율[, 끝에서 어둡게 줄이는 초])
PLANS = {
    'intro': (48, [
        (0.0, 5.75, 'archive_aisle.mp4', 0.0, 0.50, 0.65),
        (22.0, 26.0, 'airport_dawn.mp4', 0.6, 0.58),
        (35.3, 42.0, 'ops_center.mp4', 0.0, 0.62),
    ]),
    'chapters': (50, [
        (0.0, 3.2, 'airport_dawn.mp4', 1.4, 0.55),
        (10.0, 13.2, 'terminal_hall.mp4', 0.6, 0.52),
        (20.0, 23.2, 'desk_records.mp4', 0.8, 0.5),
        (30.0, 33.2, 'ops_center.mp4', 1.6, 0.62),
        (40.0, 43.2, 'archive_aisle.mp4', 1.6, 0.5),
    ]),
}
SRC_DUR = 5.04


def main():
    kind, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
    draft = '--draft' in sys.argv
    dur, plan = PLANS[kind]
    W, H = (960, 540) if draft else (1920, 1080)
    args = ['ffmpeg', '-v', 'error', '-y', '-i', src]
    for p in plan:
        args += ['-i', str(CLIPS / p[2])]
    f = [f'color=c=black:s={W}x{H}:r=30:d={dur}[k0]']
    for i, (a, b, _, off, gain, *rest) in enumerate(plan):
        fo = rest[0] if rest else 0.0
        need = b - a
        avail = SRC_DUR - off
        stretch = max(1.0, need / avail)          # 클립이 짧으면 천천히 재생해 구간을 채운다
        g = f'{gain:.3f}'
        f.append(
            f'[{i + 1}:v]trim=start={off}:duration={min(avail, need / stretch):.3f},setpts=(PTS-STARTPTS)*{stretch:.4f},'
            f'fps=30,scale={W}:{H}:flags=lanczos,format=gbrp,lutrgb=r=val*{g}:g=val*{g}:b=val*{g},setpts=PTS+{a}/TB'
            + (f',fade=t=out:st={b - fo:.3f}:d={fo:.3f}' if fo else '') + f'[c{i}]')
        f.append(f"[k{i}][c{i}]overlay=eof_action=pass:enable='between(t,{a},{b - 0.001})'[k{i + 1}]")
    n = len(plan)
    f.append(f'[k{n}]format=gbrp[clip]')
    f.append(f'[0:v]scale={W}:{H}:in_color_matrix=bt709:in_range=tv,format=gbrp[gfx]')
    f.append('[gfx][clip]blend=all_mode=screen,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]')
    args += ['-filter_complex', ';'.join(f), '-map', '[v]', '-t', str(dur), '-r', '30',
             '-c:v', 'libx264', '-preset', 'veryfast' if draft else 'slow', '-crf', '20' if draft else '15',
             '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
             '-movflags', '+faststart', out]
    subprocess.run(args, check=True)
    print(out)


if __name__ == '__main__':
    main()

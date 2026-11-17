#!/usr/bin/env python3
"""장 첫 영상 다섯 개를 합성해 deck/media/ch_<하네스>.mp4·.jpg 로 낸다.

  python3 compose2.py [--only assign,audit]

입력
- out/reel.mp4: reel/ 을 50초로 렌더한 그래픽(10초씩 다섯 장). 오른쪽 작업장 자리는 종이색으로 비어 있다.
- ../../assets/hf2/<하네스>.mp4: Higgsfield kling3_0_turbo 클립(8초, 1920×1080, 필름 그림 gNN 을 첫 프레임으로 썼다).
- 필름 음악 music_edit.wav 의 하네스 구간(필름에서 그 하네스가 나오는 시각부터 10초)과 필름 효과음.

합성
- 클립 배경(약 250,238,220)을 채널별로 키워 종이색(253,243,226)에 맞춘 뒤, RGB darken 으로 그래픽과 겹친다.
  종이 위에서는 클립이 그대로 보이고, 남색 글자는 남색으로 남는다.
- 마스크: 클립 자리의 가장자리를 풀고(왼쪽 220px), 말풍선이 다 나온 뒤에는 말풍선 자리를 비워 말풍선이 앞에 오게 한다.
- 소리: 음악 + 말풍선·머리말·수치 효과음, 2패스 loudnorm 으로 -16 LUFS, true peak -1.5 dBTP.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
FILM = ROOT.parent.parent / 'archives' / 'kac-records-harness' / 'harness-film'
MEDIA = ROOT / 'deck' / 'media'
OUT = HERE / 'out'
QA = HERE / 'qa'
KEYS = ['assign', 'audit', 'naming', 'orgchange', 'strategy']
MUSIC_AT = [24.05, 40.05, 56.05, 72.05, 88.05]      # 필름에서 각 하네스 구간이 시작하는 시각
CX, CY, CW, CH = 720, 150, 1200, 675                 # 클립 자리
PAPER = (253, 243, 226)
NAVY = (27, 42, 74)
SFX = [  # (이름, 장 안 시각, dB)
    ('bubble', 0.6, -12), ('click', 2.75, -8), ('pop', 4.25, -12), ('pop', 4.55, -12), ('pop', 4.85, -11),
]


def run(args, capture=False):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error' if not capture else 'info', '-y', *args],
                       check=True, capture_output=capture, text=True)
    return r


def frame(src, t):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', str(src), '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(1080, 1920, 3)


def bubble_box(img):
    """말풍선(남색 칸)의 경계 상자. 왼쪽 아래 영역에서 남색에 가까운 화소를 찾는다."""
    sub = img[740:960, 260:1500].astype(int)
    d = np.abs(sub - np.array(NAVY)).sum(2)
    ys, xs = np.where(d < 40)
    cols = np.where(np.bincount(xs, minlength=sub.shape[1]) > 40)[0]
    rows = np.where(np.bincount(ys, minlength=sub.shape[0]) > 200)[0]
    return 260 + cols.min(), 740 + rows.min(), 260 + cols.max(), 740 + rows.max()


def masks(key, box):
    m = np.zeros((1080, 1920), np.float32)
    x0, y0, x1, y1 = CX, CY, min(1920, CX + CW), CY + CH
    xs = np.arange(1920, dtype=np.float32); ys = np.arange(1080, dtype=np.float32)
    fx = np.clip((xs - x0) / 220, 0, 1) * np.clip((x1 - xs) / 24, 0, 1)
    fy = np.clip((ys - y0) / 50, 0, 1) * np.clip((y1 - ys) / 60, 0, 1)
    m = np.outer(fy, fx)
    a = Image.fromarray((m * 255).astype(np.uint8))
    hole = Image.new('L', (1920, 1080), 0)
    bx0, by0, bx1, by1 = box
    hole.paste(255, (bx0 - 8, by0 - 8, bx1 + 8, by1 + 8))
    hole = hole.filter(ImageFilter.GaussianBlur(5))
    b = Image.fromarray((m * (1 - np.asarray(hole, np.float32) / 255) * 255).astype(np.uint8))
    pa, pb = OUT / f'mask_{key}_a.png', OUT / f'mask_{key}_b.png'
    a.save(pa); b.save(pb)
    return pa, pb


def audio(k, key):
    wav = OUT / f'ch_{key}_mix.wav'
    ins = ['-ss', f'{MUSIC_AT[k]:.3f}', '-t', '10', '-i', str(FILM / 'audio' / 'music' / 'music_edit.wav')]
    fl = ['[0:a]aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.12,afade=t=out:st=8.3:d=1.7[m]']
    for i, (name, at, db) in enumerate(SFX):
        ins += ['-i', str(FILM / 'audio' / 'sfx' / f'{name}.mp3')]
        ms = int(at * 1000)
        fl.append(f'[{i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay={ms}|{ms},volume={db}dB[s{i}]')
    fl.append('[m]' + ''.join(f'[s{i}]' for i in range(len(SFX))) + f'amix=inputs={len(SFX) + 1}:normalize=0:duration=first[a]')
    run([*ins, '-filter_complex', ';'.join(fl), '-map', '[a]', '-t', '10', '-c:a', 'pcm_s24le', str(wav)])
    r = run(['-i', str(wav), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
    ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    return wav, ln


def main():
    only = KEYS
    if '--only' in sys.argv:
        only = sys.argv[sys.argv.index('--only') + 1].split(',')
    reel = OUT / 'reel.mp4'
    MEDIA.mkdir(parents=True, exist_ok=True); QA.mkdir(exist_ok=True)
    gain = [PAPER[c] / v for c, v in enumerate((250.0, 238.0, 220.0))]
    for k, key in enumerate(KEYS):
        if key not in only:
            continue
        box = bubble_box(frame(reel, k * 10 + 9.9))
        pa, pb = masks(key, box)
        wav, ln = audio(k, key)
        clip = ROOT / 'assets' / 'hf2' / f'{key}.mp4'
        lut = ':'.join(f"{c}=min(255\\,val*{g:.4f})" for c, g in zip('rgb', gain))
        paper = '0x%02X%02X%02X' % PAPER
        fl = [
            f'[1:v]fps=30,scale={CW}:{CH}:flags=lanczos,format=gbrp,lutrgb={lut},tpad=stop_mode=clone:stop_duration=2.5,'
            f'pad=1920:1080:{CX}:{CY}:color={paper},trim=duration=10,setpts=PTS-STARTPTS[clip]',
            '[0:v]scale=in_color_matrix=bt709:in_range=tv,format=gbrp,split[g1][g2]',
            '[g1][clip]blend=all_mode=darken[dk]',
            '[2:v]format=gray,fade=t=in:st=0:d=0.6,format=gbrp[ma]',
            '[3:v]format=gray,fade=t=in:st=0:d=0.6,format=gbrp[mb]',
            "[ma][mb]blend=all_expr='if(gte(T\\,0.74)\\,B\\,A)'[mk]",
            '[g2][dk][mk]maskedmerge,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]',
            f'[4:a]{ln},aresample=48000[a]',
        ]
        out = MEDIA / f'ch_{key}.mp4'
        run(['-ss', f'{k * 10:.3f}', '-t', '10', '-i', str(reel), '-i', str(clip),
             '-loop', '1', '-framerate', '30', '-t', '10', '-i', str(pa),
             '-loop', '1', '-framerate', '30', '-t', '10', '-i', str(pb), '-i', str(wav),
             '-filter_complex', ';'.join(fl), '-map', '[v]', '-map', '[a]', '-t', '10', '-r', '30',
             '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
             '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
             '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', str(out)])
        run(['-sseof', '-0.08', '-i', str(out), '-frames:v', '1', '-q:v', '3', str(MEDIA / f'ch_{key}.jpg')])
        print(f'{key:10s} 말풍선 {box}  {out.stat().st_size / 1e6:.2f} MB')


if __name__ == '__main__':
    main()

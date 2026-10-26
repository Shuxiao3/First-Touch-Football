#!/usr/bin/env python3
"""Football Classic -- the ball, in whole pixels like the players.

A 9x9 football: white panels with dark pentagon patches, a near-black outline, lit from the top left like the
sprites (white, a light grey, a shade). Six frames of it turning as it rolls, about one of its own five-fold axes
(through a pentagon, lying along the screen's x), so 72 degrees brings it round exactly and the sixth frame runs
into the first: a seamless loop at any speed. The game draws it at the sprites' scale, turns it with the ball's
roll, and swaps the patches to amber while it's bending.

Each frame is nine rows of nine characters: . clear, K outline, W white, L light, S shade, P patch, Q a lit patch.

    python3 tools/sprites/make_ball.py                  # prints the frames, writes assets/sprites/ball_preview.png
    python3 tools/sprites/make_ball.py --embed-classic  # ...and writes them into classic.html (BALL_ART)

Needs Pillow for the preview (dev only).
"""
import math
import os
import re
import sys

S = 9               # the ball, px across
NF = 6              # frames over a fifth of a turn
PATCH = 0.30        # a pentagon's angular radius (rad): about a real ball's share of black
LIGHT = (-0.45, -0.65, 0.62)
PAL = {'K': (28, 28, 40), 'W': (248, 248, 244), 'L': (208, 212, 224), 'S': (168, 176, 196), 'P': (44, 44, 60), 'Q': (84, 84, 104)}


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(v):
    n = math.sqrt(dot(v, v))
    return tuple(c / n for c in v)


def turn(v, k, t):
    """v turned about the unit axis k by t (Rodrigues)"""
    c, s = math.cos(t), math.sin(t)
    kv, kd = cross(k, v), dot(k, v)
    return tuple(v[i] * c + kv[i] * s + k[i] * kd * (1 - c) for i in range(3))


def patches():
    """the 12 pentagons' centres (an icosahedron's corners), one of them turned onto the x axis"""
    phi = (1 + 5 ** 0.5) / 2
    vs = []
    for a in (-1, 1):
        for b in (-phi, phi):
            vs += [(0, a, b), (a, b, 0), (b, 0, a)]
    vs = [unit(v) for v in vs]
    v0, ex = vs[1], (1, 0, 0)
    axis, t = unit(cross(v0, ex)), math.acos(dot(v0, ex))
    return [turn(v, axis, t) for v in vs]


def frames():
    W, L, R, out = patches(), unit(LIGHT), S / 2, []
    for f in range(NF):
        th = f / NF * 2 * math.pi / 5
        c, s = math.cos(th), math.sin(th)
        rows = []
        for j in range(S):
            row = ''
            for i in range(S):
                x, y = (i + 0.5 - R) / R, (j + 0.5 - R) / R
                d = x * x + y * y
                if d > 1:
                    row += '.'
                    continue
                n = (x, y, math.sqrt(max(0.0, 1 - d)))
                m = (n[0], n[1] * c - n[2] * s, n[1] * s + n[2] * c)      # the ball turned about x
                lam = max(0.0, dot(n, L))
                if math.acos(min(1.0, max(dot(m, w) for w in W))) < PATCH:
                    row += 'P' if lam < 0.75 else 'Q'
                else:
                    row += 'W' if lam > 0.45 else ('L' if lam > 0.18 else 'S')
            rows.append(row)
        edge = lambda j, i: any(not (0 <= j + b < S and 0 <= i + a < S) or rows[j + b][i + a] == '.'
                                for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        out.append(' '.join(''.join('.' if rows[j][i] == '.' else ('K' if edge(j, i) else rows[j][i]) for i in range(S))
                            for j in range(S)))
    return out


def preview(fs, path, z=12):
    from PIL import Image
    img = Image.new('RGBA', (len(fs) * (S + 2) * z, (S + 2) * z), (112, 200, 139, 255))   # on the turf
    for k, f in enumerate(fs):
        for j, row in enumerate(f.split(' ')):
            for i, ch in enumerate(row):
                if ch != '.':
                    img.paste(PAL[ch] + (255,), ((k * (S + 2) + 1 + i) * z, (1 + j) * z, (k * (S + 2) + 2 + i) * z, (2 + j) * z))
    img.save(path)


def embed(html_path, fs):
    """write the frames into classic.html: BALL_ART's F"""
    src = open(html_path, encoding='utf-8').read()
    pat = re.compile(r'(const BALL_ART=\(function\(\)\{\n(\s*)const F=\[\n)(.*?)(\];)', re.S)
    m = pat.search(src)
    assert m, 'BALL_ART frames not found in ' + html_path
    lead = m.group(2) + '  '
    body = ',\n'.join(lead + '"' + f + '"' for f in fs)
    src = src[:m.start()] + m.group(1) + body + m.group(4) + src[m.end():]
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(src)
    print('embedded', len(fs), 'frames ->', html_path)


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    fs = frames()
    for f in fs:
        print(f)
    preview(fs, os.path.join(root, 'assets', 'sprites', 'ball_preview.png'))
    if '--embed-classic' in sys.argv:
        embed(os.path.join(root, 'classic.html'), fs)

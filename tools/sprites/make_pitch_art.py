#!/usr/bin/env python3
"""Football Classic -- the far side of the pitch, as the match camera sees it.

One strip, drawn at half size (the game doubles it, like the turf), in the style of the town's tiles (Ekat's
GBA-era look: navy outlines, tiled roofs, red-brown timber, cream planks, round trees lit from the top left with
dark-green outlines): sky with a cloud or two, trees past the ends of the stand, a floodlight at each corner, the
stand itself (a grey tiled roof, a timber beam with X braces, four terraces of fans, a picket fence), a paved
track and the advertising boards along the far touchline. The game pans it with the camera at the stand's own
depth, so it moves a touch slower than the far touchline (a little parallax).

    python3 tools/sprites/make_pitch_art.py                  # writes assets/sprites/pitch_far*.png
    python3 tools/sprites/make_pitch_art.py --embed-classic  # ...and embeds it in classic.html

Rows 0..41 are opaque; row 42 is the boards' shadow on the turf (half-transparent), so the game draws the turf
first and the strip over it. Needs Pillow (dev only).
"""
import json
import math
import os
import random
import sys

from PIL import Image, ImageDraw

FW = 2625                     # the pitch's length in game px (25 px a metre)
K = 0.262                     # strip px per game px (half size, at the stand's depth)
X0, X1 = -700, FW + 700       # the world x the strip spans (the camera never sees past these)
SW = round((X1 - X0) * K)
SH = 43                       # rows 0..41 opaque, row 42 the boards' shadow
STAND = (-150, FW + 150)      # where the stand runs
BOARDS = (-100, FW + 100)     # and the boards


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


C = {k: hexc(v) for k, v in {
    'sky': '#a8d8f0', 'skyL': '#d8f0f8', 'white': '#f8f8f8',
    'leafH': '#b8f888', 'leafL': '#80d060', 'leafM': '#389030', 'leafD': '#387018', 'leafK': '#385810',
    'pave': '#e2e2d3', 'paveM': '#c2c2ab', 'paveD': '#b0b090',
    'wood': '#a17873', 'woodM': '#875f63', 'woodD': '#794b4f', 'woodK': '#583840',
    'plank': '#f8e8c0', 'plankM': '#d8c8a8', 'plankD': '#b0a078',
    'navy': '#313852', 'roofL': '#9ca4b1', 'roof': '#81838c', 'roofD': '#60646e',
    'greyL': '#a8b8c8', 'greyD': '#505068', 'salmon': '#e88068', 'yellow': '#d8c870', 'groof': '#5b8575', 'redK': '#a82028',
}.items()}

F3 = {  # 3x5 pixel font
    'A': '010 101 111 101 101', 'B': '110 101 110 101 110', 'C': '011 100 100 100 011', 'D': '110 101 101 101 110',
    'E': '111 100 110 100 111', 'F': '111 100 110 100 100', 'G': '011 100 101 101 011', 'H': '101 101 111 101 101',
    'I': '111 010 010 010 111', 'K': '101 101 110 101 101', 'L': '100 100 100 100 111', 'M': '101 111 111 101 101',
    'N': '110 101 101 101 101', 'O': '010 101 101 101 010', 'P': '110 101 110 100 100', 'R': '110 101 110 101 101',
    'S': '011 100 010 001 110', 'T': '111 010 010 010 010', 'U': '101 101 101 101 111', 'Y': '101 101 010 010 010',
    '!': '010 010 010 000 010', ' ': '000 000 000 000 000',
}


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.px = self.im.load()

    def ok(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def put(self, x, y, c):
        x, y = int(x), int(y)
        if self.ok(x, y) and c is not None:
            self.px[x, y] = c

    def rect(self, x, y, w, h, c):
        for j in range(int(y), int(y + h)):
            for i in range(int(x), int(x + w)):
                self.put(i, j, c)

    def hline(self, x0, x1, y, c):
        for x in range(int(min(x0, x1)), int(max(x0, x1)) + 1):
            self.put(x, y, c)

    def vline(self, x, y0, y1, c):
        for y in range(int(min(y0, y1)), int(max(y0, y1)) + 1):
            self.put(x, y, c)

    def blit(self, s, x, y):
        for j in range(s.h):
            for i in range(s.w):
                c = s.px[i, j]
                if c[3]:
                    self.put(x + i, y + j, c)


def shade(c, f):
    return (max(0, min(255, round(c[0] * f))), max(0, min(255, round(c[1] * f))), max(0, min(255, round(c[2] * f))), c[3])


def text(cv, x, y, s, c):
    for ch in s:
        for j, row in enumerate(F3.get(ch, F3[' ']).split()):
            for i, b in enumerate(row):
                if b == '1':
                    cv.put(x + i, y + j, c)
        x += 4


def text_w(s):
    return len(s) * 4 - 1


def sx(x):
    """strip column of a world x"""
    return (x - X0) * K


def canopy(lumps, w, h):
    """round lumps, each lit from the top left, tone edges in a checker, a dark-green outline"""
    s = Canvas(w, h)
    own = {}
    for li, (cx, cy, r) in enumerate(lumps):
        for y in range(max(0, int(cy - r - 1)), min(h, int(cy + r + 2))):
            for x in range(max(0, int(cx - r - 1)), min(w, int(cx + r + 2))):
                dx, dy = (x + 0.5 - cx) / r, (y + 0.5 - cy) / r
                if dx * dx + dy * dy <= 1.0:
                    own[(x, y)] = (li, dx, dy)
    tones = ('leafD', 'leafM', 'leafL', 'leafH')
    for (x, y), (li, dx, dy) in own.items():
        v = -(dx * 0.6 + dy * 0.8)
        edge = 1 - (dx * dx + dy * dy)
        t = v * 0.9 + 0.25 - (0.35 if edge < 0.12 and v < 0.2 else 0)
        cuts = (-0.32, 0.12, 0.5)
        k = sum(1 for c_ in cuts if t > c_)
        if min(abs(t - c_) for c_ in cuts) < 0.07 and (x + y) % 2 == 0 and k > 0:
            k -= 1
        up = own.get((x, y - 1))
        if up and up[0] > li:
            k = 0
        s.put(x, y, C[tones[k]])
    for (x, y) in list(own):
        for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + a, y + b)
            if q not in own and s.ok(*q) and not s.px[q][3]:
                s.put(q[0], q[1], C['leafK'])
    return s


def build():
    cv = Canvas(SW, SH)
    R = random.Random(11)
    cv.rect(0, 0, SW, 40, C['sky'])
    # clouds, high over the ends
    cloud = ['....wwww.......', '..wwwwwwww.www.', '.wwwwwwwwwwwwww', 'wwwwwwwwwwwwwwl', '.llllllllllll..']
    for cx in (sx(-560), sx(-330), sx(FW + 260), sx(FW + 480)):
        for j, row in enumerate(cloud):
            for i, ch in enumerate(row):
                if ch != '.':
                    cv.put(round(cx) + i, 3 + (round(cx) % 7) + j, C['white'] if ch == 'w' else C['skyL'])
    # trees past both ends of the stand: two rows, the near row lower
    a0, a1 = round(sx(STAND[0])), round(sx(STAND[1]))
    for lo, hi in ((0, a0 + 6), (a1 - 6, SW)):
        for i, x in enumerate(range(lo - 6, hi + 6, 11)):
            lumps = [(7, 13, 5), (13, 13, 5), (10, 9, 5), (10, 5, 3.5)] if i % 2 else [(6, 12, 4.5), (14, 12, 4.5), (10, 8, 5), (10, 4, 3)]
            cv.blit(canopy(lumps, 20, 19), x - 4, 14 + (i % 2) * 3)
        for i, x in enumerate(range(lo - 8, hi + 8, 14)):
            cv.blit(canopy([(7, 12, 6), (15, 12, 6), (11, 7, 6), (11, 3, 3)], 22, 19), x, 20 + (i % 2) * 2)
    # floodlights at the corners: a lamp bank on a lattice mast
    for wx in (-300, FW + 300):
        fx = round(sx(wx))
        cv.rect(fx, 0, 13, 7, C['navy']); cv.rect(fx + 1, 1, 11, 5, C['greyD'])
        for c_ in range(3):
            cv.rect(fx + 2 + c_ * 4, 2, 2, 3, C['skyL'])
        for j in range(7, 40):
            cv.put(fx + 6, j, C['navy']); cv.put(fx + 7, j, C['greyL'])
    # the stand: roof of small grey tiles, navy edged
    for y in range(0, 9):
        row = y // 2
        base = C['roofL'] if row == 0 else C['roof'] if row < 3 else C['roofD']
        for x in range(a0, a1):
            cv.put(x, y, shade(base, 0.86) if y % 2 == 1 else (shade(base, 0.9) if (x + row) % 3 == 0 else base))
    cv.hline(a0, a1 - 1, 0, C['navy']); cv.hline(a0, a1 - 1, 9, C['navy'])
    # the timber beam, a post every 12 m with an X brace between
    cv.rect(a0, 10, a1 - a0, 4, C['woodM']); cv.hline(a0, a1 - 1, 10, C['wood']); cv.hline(a0, a1 - 1, 13, C['woodK'])
    post = 12 * 25 * K
    x = sx(STAND[0])
    while x < a1:
        X = round(x)
        cv.vline(X, 10, 13, C['woodD']); cv.vline(X + 1, 10, 13, C['wood'])
        for k in range(1, 4):
            cv.put(X + 1 + k * 3, 10 + k - 1, C['woodK']); cv.put(round(x + post) - 1 - k * 3, 10 + k - 1, C['woodK'])
        x += post
    cv.hline(a0, a1 - 1, 14, C['navy'])
    # four plank terraces of fans (hair, a face, a shirt); a few have their arms up
    shirts = ['#d86860', '#d86860', '#d86860', '#f8f8f8', '#609bd8', '#d8c870', '#6ba475', '#f8f8f8', '#e88068']
    skins = ['#f8d0b8', '#e0a078', '#b88252', '#7c4c30', '#ebbc90']
    hairs = ['#3a2a20', '#6c462e', '#2a2426', '#c09050', '#843620']
    for r in range(4):
        ry = 15 + r * 5
        cv.rect(a0, ry, a1 - a0, 5, C['plankM']); cv.hline(a0, a1 - 1, ry, C['plank']); cv.hline(a0, a1 - 1, ry + 4, C['plankD'])
        for x in range(a0 + 1 + r % 2, a1 - 2, 3):
            if R.random() < 0.86:
                sh, sk, hr = hexc(R.choice(shirts)), hexc(R.choice(skins)), hexc(R.choice(hairs))
                cv.rect(x, ry + 2, 2, 2, sh); cv.put(x + 1, ry + 3, shade(sh, 0.8))
                cv.put(x, ry + 1, sk); cv.put(x + 1, ry + 1, sk); cv.put(x, ry, hr); cv.put(x + 1, ry, hr)
                if R.random() < 0.08:
                    cv.put(x - 1, ry - 1, sk)
    for x in range(a0, a1):                          # the roof's shade on the top rows
        for y, f in ((15, 0.72), (16, 0.86)):
            cv.px[x, y] = shade(cv.px[x, y], f)
    # the stand's ends: stepped concrete
    for e, s in ((a0 - 1, -1), (a1, 1)):
        for k in range(0, 40):
            w_ = 2 + k // 3
            for i in range(w_):
                cv.put(e + s * i, k, C['pave'] if k % 3 else C['paveM'])
            cv.put(e + s * w_, k, C['navy'])
    # the picket fence along the front
    for x in range(a0, a1):
        k = (x - a0) % 3
        for y in range(35, 40):
            cv.put(x, y, C['wood'] if k == 0 else C['woodM'] if k == 1 else C['woodD'])
        if k == 0:
            cv.put(x, 34, C['wood'])
    cv.hline(a0, a1 - 1, 39, C['navy'])
    # a paved track the full length
    cv.rect(0, 39, SW, 3, C['pave']); cv.hline(0, SW - 1, 39, C['paveM']); cv.hline(0, SW - 1, 41, C['paveD'])
    # the boards, 8 m each
    labels = [('FIRST TOUCH', 'salmon', 'white'), ('FOOTBALL', 'white', 'navy'), ('KICK OFF', 'navy', 'white'),
              ('CLASSIC', 'white', 'redK'), ('PLAY ON', 'groof', 'white'), ('GOAL!', 'yellow', 'navy')]
    bx, k = sx(BOARDS[0]), 0
    while bx < sx(BOARDS[1]):
        x0, x1 = round(bx), round(bx + 200 * K) - 1
        lb, bg, fg = labels[k % len(labels)]
        cv.rect(x0, 35, x1 - x0, 7, C[bg])
        cv.hline(x0, x1 - 1, 35, C['navy']); cv.hline(x0, x1 - 1, 41, C['navy']); cv.vline(x0, 35, 41, C['navy'])
        if text_w(lb) <= x1 - x0 - 3:
            text(cv, x0 + (x1 - x0 - text_w(lb)) // 2, 36, lb, C[fg])
        bx += 200 * K
        k += 1
    cv.hline(0, SW - 1, 42, (0, 0, 0, 41))              # their shadow on the turf
    return cv.im


def preview(strip, path):
    """the strip at the game's size over a strip of turf, with the camera's two extremes marked"""
    big = strip.resize((strip.width * 2, strip.height * 2), Image.NEAREST)
    out = Image.new('RGBA', (big.width, big.height + 20), (112, 200, 139, 255))
    out.alpha_composite(big, (0, 0))
    d = ImageDraw.Draw(out)
    for wx in (0, FW):
        x = round(sx(wx) * 2)
        d.line([(x, big.height), (x, big.height + 19)], fill=(255, 255, 255, 255))
    out.save(path)


def meta():
    return {'x0': X0, 'k': K, 'w': SW, 'h': SH, 'opaque': SH - 1}


def embed(html_path, png_path):
    """write the strip into classic.html: the PITCH_ART / PITCH_ART_META lines"""
    import base64
    src = open(html_path, encoding='utf-8').read()
    b64 = base64.b64encode(open(png_path, 'rb').read()).decode()
    want = {'const PITCH_ART = ': 'const PITCH_ART = "data:image/png;base64,' + b64 + '";',
            'const PITCH_ART_META = ': 'const PITCH_ART_META = ' + json.dumps(meta(), separators=(',', ':')) + ';'}
    lines, hits = src.split('\n'), set()
    for i, line in enumerate(lines):
        lead = line[:len(line) - len(line.lstrip())]
        for k, v in want.items():
            if line.lstrip().startswith(k):
                lines[i] = lead + v
                hits.add(k)
    assert len(hits) == len(want), 'PITCH_ART / PITCH_ART_META lines not found in ' + html_path
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print('embedded', os.path.basename(png_path), '->', html_path, '(%d base64 chars)' % len(b64))


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    outdir = args[0] if args else os.path.join(root, 'assets', 'sprites')
    os.makedirs(outdir, exist_ok=True)
    strip = build()
    strip.save(os.path.join(outdir, 'pitch_far.png'), optimize=True)
    preview(strip, os.path.join(outdir, 'pitch_far_preview.png'))
    print('wrote', outdir, strip.width, 'x', strip.height)
    if '--embed-classic' in sys.argv:
        embed(os.path.join(root, 'classic.html'), os.path.join(outdir, 'pitch_far.png'))

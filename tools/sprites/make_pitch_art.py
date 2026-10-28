#!/usr/bin/env python3
"""Football Classic -- the far side of the pitch, as the match camera sees it: one strip for each level a ground
can be built to (see THE GROUND in classic.html).

Each is drawn at half size (the game doubles it, like the turf), in the style of the town's tiles (Ekat's GBA-era
look: navy outlines, tiled roofs, red-brown timber, cream planks, round trees lit from the top left with
dark-green outlines): sky with a cloud or two, trees where the stand doesn't reach, the stand, and a paved track
along the far touchline.
  1  a metal bleacher at halfway, a few fans on it, a white rail along the pitch; trees all round
  2  a longer, taller bleacher with a press box on the back of it, a lamp at each end
  3  a covered stand most of the way along, its green roof on steel posts, four terraces under it, floodlights
  4  the timber stand the full length under its grey tiled roof (the strip as it was), floodlights
  5  two tiers the full width, boxes between them, a white truss roof with the lights under its edge
The game pans the strip with the camera at the stand's own depth, so it moves a touch slower than the far
touchline (a little parallax). It draws the advertising boards along the front itself (the ground's own, or none),
and the stand's name on its panel -- each level's panel is in the meta.

    python3 tools/sprites/make_pitch_art.py                  # writes assets/sprites/pitch_far*.png
    python3 tools/sprites/make_pitch_art.py --embed-classic  # ...and embeds them in classic.html

Rows 0..41 are opaque; row 42 is left clear for the boards' shadow, so the game draws the turf first and the strip
over it. Needs Pillow (dev only).
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
STAND = (-150, FW + 150)      # where the timber stand runs (level 4)
BOARDS = (-100, FW + 100)     # where boards can go (the game puts them up)
LEVELS = (1, 2, 3, 4, 5)


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
    'alH': '#f0f4f8', 'alL': '#d4dce6', 'al': '#b0b8c8', 'alD': '#7c8498', 'steel': '#5c6478',
    'groofL': '#7aa592', 'groofD': '#466a5c', 'glass': '#3a4a6c', 'glassL': '#6a84b0', 'conc': '#c8c4b4', 'concD': '#a09c8c',
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


SHIRTS = ['#d86860', '#d86860', '#d86860', '#f8f8f8', '#609bd8', '#d8c870', '#6ba475', '#f8f8f8', '#e88068']
SKINS = ['#f8d0b8', '#e0a078', '#b88252', '#7c4c30', '#ebbc90']
HAIRS = ['#3a2a20', '#6c462e', '#2a2426', '#c09050', '#843620']


def fan(cv, R, x, y, arms=0.08):
    """one fan sitting: hair, a face, a shirt (2 px wide, 4 tall from y)"""
    sh, sk, hr = hexc(R.choice(SHIRTS)), hexc(R.choice(SKINS)), hexc(R.choice(HAIRS))
    cv.rect(x, y + 2, 2, 2, sh); cv.put(x + 1, y + 3, shade(sh, 0.8))
    cv.put(x, y + 1, sk); cv.put(x + 1, y + 1, sk); cv.put(x, y, hr); cv.put(x + 1, y, hr)
    if R.random() < arms:
        cv.put(x - 1, y - 1, sk)


def sky(cv):
    cv.rect(0, 0, SW, 40, C['sky'])
    cloud = ['....wwww.......', '..wwwwwwww.www.', '.wwwwwwwwwwwwww', 'wwwwwwwwwwwwwwl', '.llllllllllll..']
    for cx in (sx(-560), sx(-330), sx(FW * 0.3), sx(FW * 0.62), sx(FW + 260), sx(FW + 480)):
        for j, row in enumerate(cloud):
            for i, ch in enumerate(row):
                if ch != '.':
                    cv.put(round(cx) + i, 3 + (round(cx) % 7) + j, C['white'] if ch == 'w' else C['skyL'])


def trees(cv, lo, hi, top=14):
    """two rows of round trees between strip columns lo and hi, the near row lower"""
    for i, x in enumerate(range(lo - 6, hi + 6, 11)):
        lumps = [(7, 13, 5), (13, 13, 5), (10, 9, 5), (10, 5, 3.5)] if i % 2 else [(6, 12, 4.5), (14, 12, 4.5), (10, 8, 5), (10, 4, 3)]
        cv.blit(canopy(lumps, 20, 19), x - 4, top + (i % 2) * 3)
    for i, x in enumerate(range(lo - 8, hi + 8, 14)):
        cv.blit(canopy([(7, 12, 6), (15, 12, 6), (11, 7, 6), (11, 3, 3)], 22, 19), x, top + 6 + (i % 2) * 2)


def lawn(cv, y0=30):
    """the grass bank behind the rail, where there's no stand"""
    for y in range(y0, 39):
        for x in range(SW):
            cv.put(x, y, C['leafL'] if (x * 7 + y * 3) % 11 else C['leafM'])


def track(cv):
    cv.rect(0, 39, SW, 3, C['pave']); cv.hline(0, SW - 1, 39, C['paveM']); cv.hline(0, SW - 1, 41, C['paveD'])


def rail(cv, a=0, b=None):
    """a white rail on posts along the pitch"""
    b = SW if b is None else b
    for x in range(a, b):
        cv.put(x, 35, C['white']); cv.put(x, 36, C['greyL'])
        if (x - a) % 6 == 0:
            for y in range(35, 39):
                cv.put(x, y, C['white'] if y < 37 else C['greyL'])
    cv.hline(a, b - 1, 34, None)


def floodlights(cv, xs, top=0, h=40):
    """a lamp bank on a lattice mast at each world x"""
    for wx in xs:
        fx = round(sx(wx))
        cv.rect(fx, top, 13, 7, C['navy']); cv.rect(fx + 1, top + 1, 11, 5, C['greyD'])
        for c_ in range(3):
            cv.rect(fx + 2 + c_ * 4, top + 2, 2, 3, C['skyL'])
        for j in range(top + 7, top + h):
            cv.put(fx + 6, j, C['navy']); cv.put(fx + 7, j, C['greyL'])


def bleacher(cv, R, a0, a1, rows, base=37, fill=0.4):
    """a metal bleacher between strip columns a0 and a1: rows of aluminium planks stepping up from base, a steel frame,
    a handrail along the top, fans here and there. Returns the top row."""
    top = base - rows * 3
    for r in range(rows):
        y = base - (r + 1) * 3
        for x in range(a0, a1):
            cv.put(x, y, C['alH']); cv.put(x, y + 1, C['al']); cv.put(x, y + 2, C['steel'])
    for x in range(a0, a1, 12):                       # the frame's uprights, in the gaps
        cv.vline(x, top, base, C['navy'])
    for r in range(rows - 1, -1, -1):                 # the fans, the back rows first: a near one sits in front
        y = base - (r + 1) * 3
        for x in range(a0 + 4 + (r % 2) * 2, a1 - 4, 3):
            if R.random() < fill:
                fan(cv, R, x, y - 2)
    for e, s_ in ((a0, -1), (a1 - 1, 1)):             # the ends: a stepped steel side frame
        for r in range(rows + 1):
            y = base - r * 3
            for k in range(0, 2 + r // 2):
                cv.put(e + s_ * k, y, C['navy'])
            cv.vline(e + s_ * (1 + r // 2), y, base, C['alD'])
    cv.hline(a0, a1 - 1, top - 3, C['alD'])            # the handrail
    for x in range(a0, a1, 8):
        cv.vline(x, top - 3, top, C['alD'])
    return top - 3


def panel(cv, x, y, w, h=7, fill='white', edge='navy'):
    """the stand's name panel (the game writes the name on it)"""
    cv.rect(x, y, w, h, C[fill]); cv.hline(x, x + w - 1, y, C[edge]); cv.hline(x, x + w - 1, y + h - 1, C[edge])
    cv.vline(x, y, y + h - 1, C[edge]); cv.vline(x + w - 1, y, y + h - 1, C[edge])
    return {'x': x + 1, 'y': y + 1, 'w': w - 2, 'h': h - 2, 'ink': '#313852' if fill == 'white' else '#f8f8f8', 'bg': C_HEX[fill]}


def level1(cv, R):
    sky(cv); trees(cv, 0, SW); lawn(cv)
    a0, a1 = round(sx(FW / 2 - 520)), round(sx(FW / 2 + 520))
    top = bleacher(cv, R, a0, a1, 6, fill=0.36)
    mid = (a0 + a1) // 2
    cv.vline(mid - 30, top - 6, top, C['alD']); cv.vline(mid + 29, top - 6, top, C['alD'])
    pn = panel(cv, mid - 34, top - 12, 68)
    rail(cv); track(cv)
    return pn


def level2(cv, R):
    sky(cv); trees(cv, 0, SW); lawn(cv)
    a0, a1 = round(sx(FW / 2 - 1150)), round(sx(FW / 2 + 1150))
    top = bleacher(cv, R, a0, a1, 8, fill=0.58)
    mid = (a0 + a1) // 2
    # the press box, sat on the back of the bleacher (its roof on row 0: the strip has no room above)
    bx0, bx1, by0 = mid - 32, mid + 32, top - 9
    for x in (bx0 + 3, bx1 - 4):
        cv.vline(x, by0 + 12, top + 3, C['navy'])
    cv.rect(bx0, by0, bx1 - bx0, 12, C['white']); cv.hline(bx0, bx1 - 1, by0, C['navy']); cv.hline(bx0 - 1, bx1, by0 - 1, C['roofD'])
    cv.hline(bx0, bx1 - 1, by0 + 11, C['navy']); cv.vline(bx0, by0, by0 + 11, C['navy']); cv.vline(bx1 - 1, by0, by0 + 11, C['navy'])
    for x in range(bx0 + 3, bx1 - 4, 6):
        cv.rect(x, by0 + 7, 4, 3, C['glass']); cv.put(x, by0 + 7, C['glassL'])
    pn = {'x': bx0 + 2, 'y': by0 + 1, 'w': bx1 - bx0 - 4, 'h': 5, 'ink': '#313852', 'bg': '#f8f8f8'}
    for wx in (FW / 2 - 1250, FW / 2 + 1250):           # a lamp at each end
        fx = round(sx(wx)); cv.rect(fx - 3, 8, 8, 4, C['navy']); cv.rect(fx - 2, 9, 6, 2, C['skyL'])
        cv.vline(fx, 12, 38, C['navy']); cv.vline(fx + 1, 12, 38, C['greyL'])
    rail(cv); track(cv)
    return pn


def terraces(cv, R, a0, a1, y0, n, fill=0.86):
    for r in range(n):
        ry = y0 + r * 5
        cv.rect(a0, ry, a1 - a0, 5, C['plankM']); cv.hline(a0, a1 - 1, ry, C['plank']); cv.hline(a0, a1 - 1, ry + 4, C['plankD'])
        for x in range(a0 + 1 + r % 2, a1 - 2, 3):
            if R.random() < fill:
                fan(cv, R, x, ry)


def level3(cv, R):
    sky(cv)
    a0, a1 = round(sx(-60)), round(sx(FW + 60))
    trees(cv, 0, a0 + 6); trees(cv, a1 - 6, SW); lawn(cv); cv.rect(a0, 28, a1 - a0, 11, C['concD'])
    floodlights(cv, (-330, FW + 330))
    # the roof: green metal sheet, ribbed, a white fascia along its front edge, as tall as the name's letters
    for y in range(3, 8):
        for x in range(a0, a1):
            cv.put(x, y, C['groofL'] if y == 3 else (C['groofD'] if x % 4 == 0 else C['groof']))
    cv.hline(a0, a1 - 1, 2, C['navy'])
    cv.rect(a0, 8, a1 - a0, 5, C['white']); cv.hline(a0, a1 - 1, 13, C['navy'])
    terraces(cv, R, a0, a1, 14, 4, 0.8)
    for x in range(a0, a1):                            # the roof's shade on the top rows
        for y, f in ((14, 0.7), (15, 0.84)):
            cv.px[x, y] = shade(cv.px[x, y], f)
    post = 12 * 25 * K
    x = float(a0)
    while x < a1:
        X = round(x); cv.vline(X, 13, 33, C['steel']); cv.vline(X + 1, 13, 33, C['alD']); x += post
    for e, s_ in ((a0 - 1, -1), (a1, 1)):              # the open terraces at the ends
        for k in range(10, 39):
            w_ = 1 + (k - 10) // 3
            for i in range(w_):
                cv.put(e + s_ * i, k, C['conc'] if k % 3 else C['concD'])
            cv.put(e + s_ * w_, k, C['navy'])
    cv.rect(a0, 34, a1 - a0, 5, C['conc']); cv.hline(a0, a1 - 1, 34, C['white']); cv.hline(a0, a1 - 1, 38, C['navy'])
    track(cv)
    mid = (a0 + a1) // 2
    return panel(cv, mid - 60, 7, 120, 7, fill='white')


def level4(cv, R):
    """the timber stand the full length (the strip as it was, without its boards)"""
    sky(cv)
    a0, a1 = round(sx(STAND[0])), round(sx(STAND[1]))
    trees(cv, 0, a0 + 6); trees(cv, a1 - 6, SW)
    floodlights(cv, (-300, FW + 300))
    for y in range(0, 9):
        row = y // 2
        base = C['roofL'] if row == 0 else C['roof'] if row < 3 else C['roofD']
        for x in range(a0, a1):
            cv.put(x, y, shade(base, 0.86) if y % 2 == 1 else (shade(base, 0.9) if (x + row) % 3 == 0 else base))
    cv.hline(a0, a1 - 1, 0, C['navy']); cv.hline(a0, a1 - 1, 9, C['navy'])
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
    terraces(cv, R, a0, a1, 15, 4)
    for x in range(a0, a1):
        for y, f in ((15, 0.72), (16, 0.86)):
            cv.px[x, y] = shade(cv.px[x, y], f)
    for e, s_ in ((a0 - 1, -1), (a1, 1)):
        for k in range(0, 40):
            w_ = 2 + k // 3
            for i in range(w_):
                cv.put(e + s_ * i, k, C['pave'] if k % 3 else C['paveM'])
            cv.put(e + s_ * w_, k, C['navy'])
    for x in range(a0, a1):
        k = (x - a0) % 3
        for y in range(35, 40):
            cv.put(x, y, C['wood'] if k == 0 else C['woodM'] if k == 1 else C['woodD'])
        if k == 0:
            cv.put(x, 34, C['wood'])
    cv.hline(a0, a1 - 1, 39, C['navy'])
    track(cv)
    mid = (a0 + a1) // 2
    return panel(cv, mid - 70, 1, 140, 7)


def level5(cv, R):
    """two tiers the full width: the upper under a white truss roof, boxes between them, the lower down to the wall"""
    sky(cv)
    # the roof: a white truss, the lights along its edge
    for x in range(SW):
        cv.put(x, 0, C['navy']); cv.put(x, 1, C['white']); cv.put(x, 2, C['alL']); cv.put(x, 5, C['white']); cv.put(x, 6, C['navy'])
        for y in (3, 4):
            cv.put(x, y, C['white'] if (x + y) % 6 in (0, 1) else C['alD'])
    for x in range(4, SW, 16):
        cv.rect(x, 7, 4, 2, C['navy']); cv.rect(x + 1, 7, 2, 1, C['skyL'])
    # the upper tier: three rows of fans, steep
    for r in range(3):
        ry = 9 + r * 4
        cv.rect(0, ry, SW, 4, C['plankM']); cv.hline(0, SW - 1, ry + 3, C['plankD'])
        for x in range(1 + r % 2, SW - 2, 3):
            if R.random() < 0.9:
                fan(cv, R, x, ry - 1)
    for x in range(SW):
        cv.px[x, 9] = shade(cv.px[x, 9], 0.7); cv.px[x, 10] = shade(cv.px[x, 10], 0.85)
    # the boxes: dark glass in a white band (the name goes on it)
    cv.rect(0, 21, SW, 7, C['white']); cv.hline(0, SW - 1, 21, C['navy']); cv.hline(0, SW - 1, 27, C['navy'])
    for x in range(2, SW - 6, 9):
        cv.rect(x, 23, 7, 3, C['glass']); cv.put(x, 23, C['glassL']); cv.put(x + 1, 23, C['glassL'])
    # the lower tier: two rows down to a padded wall
    for r in range(2):
        ry = 28 + r * 4
        cv.rect(0, ry, SW, 4, C['plankM']); cv.hline(0, SW - 1, ry + 3, C['plankD'])
        for x in range(2 - r % 2, SW - 2, 3):
            if R.random() < 0.92:
                fan(cv, R, x, ry - 1)
    cv.rect(0, 36, SW, 3, C['greyD']); cv.hline(0, SW - 1, 36, C['greyL']); cv.hline(0, SW - 1, 38, C['navy'])
    track(cv)
    mid = SW // 2
    return panel(cv, mid - 80, 21, 160, 7, fill='white')


C_HEX = {'white': '#f8f8f8'}
DRAW = {1: level1, 2: level2, 3: level3, 4: level4, 5: level5}


def build(level=4):
    cv = Canvas(SW, SH)
    pn = DRAW[level](cv, random.Random(11 + level))
    for x in range(SW):                                # row 42: clear (the game draws the boards and their shadow)
        cv.px[x, 42] = (0, 0, 0, 0)
    return cv.im, pn


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


def meta(panels):
    """where the strips sit, where boards can go, and each level's name panel"""
    return {'x0': X0, 'k': K, 'w': SW, 'h': SH, 'opaque': SH - 1, 'boards': [round(sx(BOARDS[0]), 1), round(sx(BOARDS[1]), 1)],
            'board': round(200 * K, 2), 'panels': {str(k): v for k, v in panels.items()}}


def embed(html_path, pngs, panels):
    """write the strips into classic.html: the PITCH_ART (one data URL a level) and PITCH_ART_META lines"""
    import base64
    src = open(html_path, encoding='utf-8').read()
    art = {str(k): 'data:image/png;base64,' + base64.b64encode(open(v, 'rb').read()).decode() for k, v in pngs.items()}
    want = {'const PITCH_ART = ': 'const PITCH_ART = ' + json.dumps(art, separators=(',', ':')) + ';',
            'const PITCH_ART_META = ': 'const PITCH_ART_META = ' + json.dumps(meta(panels), separators=(',', ':')) + ';'}
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
    print('embedded', len(pngs), 'strips ->', html_path, '(%d base64 chars)' % sum(len(v) for v in art.values()))


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    outdir = args[0] if args else os.path.join(root, 'assets', 'sprites')
    os.makedirs(outdir, exist_ok=True)
    pngs, panels, prevs = {}, {}, []
    for lv in LEVELS:
        strip, pn = build(lv)
        path = os.path.join(outdir, 'pitch_far_%d.png' % lv)
        strip.save(path, optimize=True)
        pngs[lv], panels[lv] = path, pn
        prevs.append(strip)
    # the preview: every level, one under the next, at the game's size over a strip of turf
    big = [st.resize((st.width * 2, st.height * 2), Image.NEAREST) for st in prevs]
    out = Image.new('RGBA', (big[0].width, sum(b.height + 20 for b in big)), (112, 200, 139, 255))
    y = 0
    for b in big:
        out.alpha_composite(b, (0, y)); y += b.height + 20
    out.save(os.path.join(outdir, 'pitch_far_preview.png'))
    print('wrote', outdir, len(pngs), 'strips', prevs[0].width, 'x', prevs[0].height)
    if '--embed-classic' in sys.argv:
        embed(os.path.join(root, 'classic.html'), pngs, panels)

#!/usr/bin/env python3
"""Football Classic -- THE CLUB CAMPUS, the career's hub. It's composed from the tilesets the user sent: the houses,
offices, garden, harbour, station, industrial and tree sets by TerribleJared (with VeonTrainer and Ekat99), and the shop
set with HimuraKenshin2010's items. The sets themselves aren't in the repo (they're credited in the README and in the
game's Settings); this makes the pictures the game embeds.

Nothing Pokemon-branded is used: the clubhouse's "PC" sign is painted over with its clapboard and the stone house's
"Fly Angler" board repainted to read SCOUTS; no Poke Balls, Ball-Mart signs, creatures or creature planters appear.
The ground isn't in the sets: it's drawn here in their palette, its roofs cut from the wide glass office's.

The campus is 768 x 448: the mockup's 640 x 368 (CORE) with a border of lawn, trees and road all round it, so a bigger
phone still shows it at 1x. The ground is drawn at each level a club can build it to: level 1 in the picture itself
(campus_1.png), each other level as a patch over it (campus_2..5.png: only what changes, the trees in its way gone with
it). The game writes on it as it goes: the ground's name (on a sign at level 1, the press box at 2, the south stand's
roof from 3), the north stand's name (its roof, from 3), your boards along the north touchline, and your crest on the
clubhouse and the academy. Where each of those goes is in CAMPUS_META, with the buildings' boxes (for tapping).

    python3 -I tools/campus/make_campus.py <tiles dir> [out dir] [--embed-classic]
      out dir: assets/campus; --embed-classic writes CAMPUS_ART and CAMPUS_META into classic.html
"""
import base64
import glob
import json
import os
import random
import sys

from PIL import Image, ImageChops, ImageDraw

W, H = 768, 448                      # the campus
OX, OY = 64, 40                      # where the mockup's 640 x 368 sits in it
CORE = (OX, OY, 640, 368)
TILES = None
rnd = random.Random(7)
_sheets = {}


def sheet(n):
    if n not in _sheets:
        _sheets[n] = Image.open(glob.glob(TILES + '/' + n + '_*')[0]).convert('RGBA')
    return _sheets[n]


def cut(n, x0, y0, x1, y1, trim=True):
    im = sheet(n).crop((x0, y0, x1, y1))
    if trim:
        im = im.crop(im.getbbox())
    return im


# ---- palette (sampled from the sets) ----------------------------------------------------------------------------
OUT1 = (34, 30, 29, 255)
OUT2 = (55, 52, 48, 255)
STONE_D = (68, 65, 59, 255)
STONE_M = (104, 102, 94, 255)
STONE = (130, 126, 118, 255)
PAVE = (157, 152, 142, 255)
PAVE_L = (174, 169, 158, 255)
GRASS = (101, 129, 94, 255)
GRASS_D = (96, 118, 92, 255)
GRASS_L = (112, 137, 107, 255)
GRASS_K = (84, 106, 80, 255)
PITCH_A = (114, 156, 92, 255)
PITCH_B = (104, 146, 84, 255)
APRON = (92, 128, 80, 255)
LINE = (228, 232, 220, 255)
PLAZA = (188, 175, 161, 255)
PLAZA_J = (157, 148, 138, 255)
PLAZA_L = (200, 189, 175, 255)
ROAD = (84, 84, 90, 255)
ROAD_D = (72, 72, 78, 255)
ROAD_LINE = (222, 214, 186, 255)
RED = (196, 76, 60, 255)
RED_D = (150, 52, 46, 255)
NAVY = (49, 56, 82, 255)
NAVY_L = (78, 88, 120, 255)
WHITE = (240, 240, 232, 255)
WOOD = (110, 76, 52, 255)
WOOD_D = (78, 52, 38, 255)
WOOD_L = (150, 108, 74, 255)
LAMP = (250, 240, 196, 255)

F3 = {  # 3x5 pixel letters (our own), for the boards the picture has its own words on
    'A': '010 101 111 101 101', 'B': '110 101 110 101 110', 'C': '011 100 100 100 011', 'D': '110 101 101 101 110',
    'E': '111 100 110 100 111', 'F': '111 100 110 100 100', 'G': '011 100 101 101 011', 'H': '101 101 111 101 101',
    'I': '111 010 010 010 111', 'K': '101 110 100 110 101', 'L': '100 100 100 100 111', 'M': '101 111 111 101 101',
    'N': '110 101 101 101 101', 'O': '010 101 101 101 010', 'P': '110 101 110 100 100', 'R': '110 101 110 101 101',
    'S': '011 100 010 001 110', 'T': '111 010 010 010 010', 'U': '101 101 101 101 111', 'W': '101 101 111 111 101',
    'Y': '101 101 010 010 010', 'X': '101 101 010 101 101', ' ': '000 000 000 000 000',
    'Z': '111 001 010 100 111', 'J': '001 001 001 101 010', 'Q': '010 101 101 110 011', 'V': '101 101 101 101 010',
}


def text_w(s):
    return len(s) * 4 - 1


def text(img, x, y, s, col):
    px = img.load()
    for i, ch in enumerate(s):
        for r, row in enumerate(F3[ch].split()):
            for c, b in enumerate(row):
                if b == '1':
                    xx, yy = x + i * 4 + c, y + r
                    if 0 <= xx < img.width and 0 <= yy < img.height:
                        px[xx, yy] = col


def rect(img, x0, y0, x1, y1, col):
    """fill [x0, x1) x [y0, y1); a see-through colour goes over what's there"""
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(img.width, x1), min(img.height, y1)
    if x1 <= x0 or y1 <= y0:
        return
    if len(col) == 4 and col[3] < 255:
        img.alpha_composite(Image.new('RGBA', (x1 - x0, y1 - y0), col), (x0, y0))
    else:
        ImageDraw.Draw(img).rectangle([x0, y0, x1 - 1, y1 - 1], fill=col)


def paste(img, sp, x, y):
    """a sprite at (x, y), cut where it runs off the picture"""
    a, b = max(0, -x), max(0, -y)
    c, d = min(sp.width, img.width - x), min(sp.height, img.height - y)
    if c > a and d > b:
        img.alpha_composite(sp.crop((a, b, c, d)), (x + a, y + b))


def board(w, h, words, fill=NAVY, ink=WHITE, edge=OUT1):
    """a small sign board, our own, with 3x5 letters"""
    b = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    rect(b, 0, 0, w, h, edge)
    rect(b, 1, 1, w - 1, h - 1, fill)
    rect(b, 1, h - 2, w - 1, h - 1, tuple(max(0, c - 22) for c in fill[:3]) + (255,))
    text(b, (w - text_w(words)) // 2, (h - 5) // 2, words, ink)
    return b


# ---- the buildings, from the sheets ------------------------------------------------------------------------------
def office():
    """the clubhouse (harbour set), its gable sign painted over with clapboard: the game puts your crest there.
    Returns it and where the crest goes on it"""
    im = cut('06', 0, 700, 120, 816, trim=False)
    px = im.load()
    # the sign sits on the gable, columns 46..65 and rows 757..770 of the sheet (57..70 here): the clapboard there
    # runs right across, two rows of board then one of shadow line, by the sheet's row (the line rows are y % 3 == 2)
    board_c, line_c = (163, 177, 177, 255), (102, 115, 127, 255)
    for y in range(57, 71):
        for x in range(46, 66):
            px[x, y] = line_c if (y + 700) % 3 == 2 else board_c
    bb = im.getbbox()
    return im.crop(bb), (51 - bb[0], 59 - bb[1])


def scouting():
    """the stone house (harbour set): its shop board repainted to read SCOUTS"""
    im = cut('06', 0, 826, 104, 920, trim=False)
    px = im.load()
    # the board: columns 8..54, rows 872..886 of the sheet (46..60 here)
    bx0, by0, bx1, by1 = 8, 46, 55, 61
    inner = None
    for y in range(by0 + 2, by1 - 2):
        for x in range(bx0 + 2, bx0 + 6):
            c = px[x, y]
            if c[3] == 255 and c[1] > c[0]:
                inner = c
                break
        if inner:
            break
    # the board's own extent: the greenish pixels
    xs, ys = [], []
    for y in range(by0 - 2, by1 + 2):
        for x in range(bx0 - 2, bx1 + 2):
            c = px[x, y]
            if c[3] == 255 and c[1] > c[0] + 12 and c[1] > c[2]:
                xs.append(x)
                ys.append(y)
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    for y in range(y0 + 1, y1):
        for x in range(x0 + 1, x1):
            px[x, y] = inner or (110, 150, 110, 255)
    text(im, (x0 + x1 + 1 - text_w('SCOUTS')) // 2, (y0 + y1 - 4) // 2, 'SCOUTS', (238, 232, 206, 255))
    return im.crop(im.getbbox())


def market():
    """the modern hall (offices set), with our own board over the doors"""
    im = cut('02', 13, 16, 146, 124)
    b = board(40, 9, 'MARKET')
    im.alpha_composite(b, ((im.width - b.width) // 2 + 6, 66))
    return im


def kiosk():
    im = cut('06', 48, 128, 81, 161)
    out = Image.new('RGBA', (im.width, im.height + 7), (0, 0, 0, 0))
    out.alpha_composite(im, (0, 7))
    b = board(21, 8, 'NEWS', fill=RED_D)
    out.alpha_composite(b, ((out.width - b.width) // 2, 0))
    return out


def academy():
    """the log cabin; the game puts your crest on its gable. Returns it and where the crest goes"""
    im = cut('07', 356, 20, 460, 118)
    return im, ((im.width - 9) // 2, 52)


def house():
    return cut('07', 249, 20, 346, 117)


def barn():
    return cut('01', 139, 452, 211, 551)


# ---- props --------------------------------------------------------------------------------------------------------
TREES = {  # (sheet 05) each tree with its own shadow, above the ground strips
    'bushtree': (48, 96, 80, 160), 'yconeS': (84, 72, 108, 113), 'yconeM': (84, 113, 108, 160),
    'gconeS': (116, 72, 140, 113), 'gconeM': (116, 113, 140, 160),
    'maple_br': (144, 88, 188, 160), 'maple_gr': (190, 88, 240, 160), 'spruce': (240, 86, 272, 160),
    'spruce_b': (272, 86, 304, 160), 'maple_or': (304, 92, 352, 160), 'round_dg': (352, 108, 384, 160),
    'round_br': (384, 108, 416, 160), 'round_lg': (416, 100, 448, 160), 'round_or': (448, 100, 480, 160),
    'round_yb': (480, 100, 512, 160), 'oak_ol': (0, 176, 62, 240), 'oak_gr': (64, 176, 126, 240),
    'willow1': (130, 176, 190, 240), 'willow2': (190, 176, 242, 240), 'oak_twin': (240, 176, 306, 240),
    'oak_big': (304, 176, 366, 240), 'spiky': (366, 176, 414, 240), 'pine': (414, 176, 462, 240),
    'pine_d': (462, 176, 512, 240), 'sapling': (128, 8, 160, 48), 'sapling2': (256, 20, 288, 48),
    'smallpine': (32, 28, 48, 48), 'conifer': (48, 12, 72, 48), 'roundsm': (64, 0, 96, 48), 'fir': (96, 4, 128, 48),
}
PROPS = {
    'lamp': ('06', 0, 174, 17, 224), 'bin': ('06', 0, 8, 16, 31), 'bin2': ('06', 16, 8, 32, 31),
    'lily': ('06', 32, 0, 48, 31), 'bench_st': ('06', 64, 32, 94, 48), 'crates3': ('06', 2, 114, 30, 146),
    'ticket': ('06', 32, 122, 48, 146), 'woodfence': ('06', 48, 160, 94, 178),
    'bench_g': ('02', 181, 279, 204, 304), 'bench_gl': ('02', 213, 278, 251, 304), 'binm': ('02', 240, 202, 255, 224),
    'crate2': ('02', 178, 198, 191, 224), 'crates': ('02', 212, 196, 237, 224), 'bikes': ('02', 44, 352, 84, 400),
    'bikes2': ('02', 0, 368, 20, 416),
    'bus_b': ('03', 177, 327, 256, 368), 'bus_g': ('03', 257, 327, 336, 368),
    'maple': ('07', 464, 371, 512, 432),
    'scarecrow': ('01', 4, 0, 29, 32), 'haycart': ('01', 34, 0, 63, 32), 'bale': ('01', 69, 4, 92, 32),
    'haystack': ('01', 99, 2, 127, 32), 'pumpkins': ('01', 163, 8, 190, 32), 'pumpkin_v': ('01', 129, 34, 160, 64),
    'pumpkin_v2': ('01', 161, 34, 191, 64), 'sunflowers': ('01', 34, 34, 63, 64), 'daisy': ('01', 0, 70, 15, 96),
    'daisy2': ('01', 16, 71, 32, 96), 'blueflw': ('01', 131, 67, 159, 95), 'yelflw': ('01', 163, 65, 191, 95),
    'purflw': ('01', 101, 75, 124, 96), 'hive': ('01', 135, 177, 153, 208),
    'pl_red': ('01', 1, 242, 31, 272), 'pl_green': ('01', 33, 242, 63, 272), 'pl_leaf': ('01', 65, 245, 95, 272),
    'pl_blue': ('01', 65, 274, 95, 304), 'pl_mix': ('01', 97, 276, 127, 304), 'pl_lily': ('01', 0, 307, 80, 336),
    'pl_topi': ('01', 16, 364, 64, 400), 'pot_big': ('01', 1, 507, 32, 557), 'pot_a': ('01', 5, 466, 26, 496),
    'pot_b': ('01', 36, 464, 60, 496), 'pot_c': ('01', 68, 464, 92, 496), 'pot_d': ('01', 102, 466, 122, 496),
    'crate_st': ('01', 196, 420, 221, 448),
}


def tree(name):
    x0, y0, x1, y1 = TREES[name]
    return cut('05', x0, y0, x1, y1)


def prop(name):
    n, x0, y0, x1, y1 = PROPS[name]
    return cut(n, x0, y0, x1, y1)


# ---- the grounds ---------------------------------------------------------------------------------------------------
def lawn(img):
    rect(img, 0, 0, W, H, GRASS)
    px = img.load()
    for y in range(H):
        for x in range(W):
            r = rnd.random()
            if r < 0.025:
                px[x, y] = GRASS_D
            elif r < 0.04:
                px[x, y] = GRASS_L
    for _ in range(380):  # tufts
        x, y = rnd.randrange(2, W - 2), rnd.randrange(3, H)
        px[x, y] = GRASS_K
        px[x, y - 1] = GRASS_K
        px[x + 2, y] = GRASS_K
        px[x + 1, y - 1] = GRASS_L


def path(img, x0, y0, x1, y1):
    """grey paving, as the harbour set's pier: an outline, a darker rim on the top and left, slabs"""
    rect(img, x0, y0, x1, y1, OUT2)
    rect(img, x0 + 1, y0 + 1, x1 - 1, y1 - 1, STONE)
    rect(img, x0 + 2, y0 + 2, x1 - 1, y1 - 1, PAVE)
    px = img.load()
    for y in range(y0 + 2, y1 - 1):
        for x in range(max(0, x0 + 2), min(img.width, x1 - 1)):
            if (y - y0) % 8 == 0 or ((x + (8 if ((y - y0) // 8) % 2 else 0)) % 16 == 0):
                px[x, y] = (147, 142, 132, 255)


def plaza(img, x0, y0, x1, y1):
    rect(img, x0, y0, x1, y1, OUT2)
    rect(img, x0 + 1, y0 + 1, x1 - 1, y1 - 1, PLAZA_J)
    px = img.load()
    for y in range(y0 + 1, y1 - 1):
        for x in range(x0 + 1, x1 - 1):
            u, v = (x - x0 - 1) % 10, (y - y0 - 1) % 8
            if u == 9 or v == 7:
                continue
            px[x, y] = PLAZA_L if (u == 0 or v == 0) else PLAZA


def road(img, y0, y1):
    """the road along the foot, a pavement either side"""
    rect(img, 0, y0, W, y0 + 1, OUT2)
    rect(img, 0, y0 + 1, W, y0 + 4, PAVE)
    rect(img, 0, y0 + 4, W, y0 + 5, STONE_M)
    rect(img, 0, y0 + 5, W, y1, ROAD)
    px = img.load()
    for y in range(y0 + 5, y1):
        for x in range(W):
            if rnd.random() < 0.05:
                px[x, y] = ROAD_D
    mid = (y0 + 5 + y1) // 2 + 2
    for x in range(0, W, 20):
        rect(img, x, mid, x + 10, mid + 1, ROAD_LINE)
    rect(img, 0, y1, W, y1 + 1, STONE_M)       # the far pavement
    rect(img, 0, y1 + 1, W, y1 + 4, PAVE)
    rect(img, 0, y1 + 4, W, y1 + 5, OUT2)


# ---- the stadium (drawn here, in the sets' palette) ----------------------------------------------------------------
def stand_roof(w):
    """the wide glass office's flat roof (houses set), cut down and stretched to w"""
    src = cut('07', 259, 211, 398, 263, trim=False)  # the roof and its front fascia, 139 x 52
    # rows: keep the top rim (0..17) and the front (35..52), drop the plain middle
    rows = list(range(0, 17)) + list(range(35, 52))
    short = Image.new('RGBA', (src.width, len(rows)), (0, 0, 0, 0))
    for i, r in enumerate(rows):
        short.alpha_composite(src.crop((0, r, src.width, r + 1)), (0, i))
    L, R = short.crop((0, 0, 30, short.height)), short.crop((short.width - 30, 0, short.width, short.height))
    mid = short.crop((12, 0, 48, short.height))
    out = Image.new('RGBA', (w, short.height), (0, 0, 0, 0))
    x = 30
    while x < w - 30:
        out.alpha_composite(mid, (x, 0))
        x += mid.width
    out.alpha_composite(L, (0, 0))
    out.alpha_composite(R, (w - 30, 0))
    return out


def post():
    return cut('07', 386, 262, 395, 321)


def draw_pitch(img, px0, py, pw=208, ph=100):
    """the pitch: mown stripes, its lines, a goal at each end"""
    rect(img, px0 - 6, py - 3, px0 + pw + 6, py + ph + 4, APRON)
    for i, x in enumerate(range(px0, px0 + pw, 16)):
        rect(img, x, py, min(x + 16, px0 + pw), py + ph, PITCH_A if i % 2 == 0 else PITCH_B)
    d = ImageDraw.Draw(img)
    l0, t0, r0, b0 = px0 + 3, py + 3, px0 + pw - 4, py + ph - 4
    d.rectangle([l0, t0, r0, b0], outline=LINE)
    cx, cy = (l0 + r0) // 2, (t0 + b0) // 2
    d.line([cx, t0, cx, b0], fill=LINE)
    d.ellipse([cx - 14, cy - 11, cx + 14, cy + 11], outline=LINE)
    rect(img, cx - 1, cy - 1, cx + 1, cy + 1, LINE)
    for side in (0, 1):
        x0 = l0 if side == 0 else r0
        sg = 1 if side == 0 else -1
        bx = x0 + sg * 30
        d.rectangle([min(x0, bx), cy - 27, max(x0, bx), cy + 27], outline=LINE)
        gx = x0 + sg * 11
        d.rectangle([min(x0, gx), cy - 12, max(x0, gx), cy + 12], outline=LINE)
        rect(img, x0 + sg * 21, cy, x0 + sg * 21 + 1, cy + 1, LINE)
        for a in range(-7, 8):
            img.putpixel((bx + sg * round(5 * (1 - (a / 8) ** 2) ** 0.5), cy + a), LINE)
        g0 = x0 - sg * 6
        gl, gr = min(x0, g0), max(x0, g0)
        rect(img, gl, cy - 9, gr + 1, cy + 10, (196, 200, 196, 255))
        pz = img.load()
        for yy in range(cy - 8, cy + 9):
            for xx in range(gl + 1, gr):
                if (xx + yy) % 2 == 0:
                    pz[xx, yy] = (150, 160, 150, 255)
        rect(img, gl, cy - 9, gr + 1, cy - 8, WHITE)
        rect(img, gl, cy + 9, gr + 1, cy + 10, WHITE)
        rect(img, x0, cy - 9, x0 + 1, cy + 10, WHITE)


AL_H, AL, AL_D, STEEL = (236, 240, 244, 255), (196, 204, 214, 255), (128, 136, 152, 255), (84, 92, 110, 255)


def bleacher_front(img, x0, x1, base, rows, press=False):
    """a metal bleacher seen from the pitch (the north side): rows of aluminium planks stepping up and back, a steel frame,
    a handrail along the top; a press box on stilts at the back of a big one (returns the band its name goes on)"""
    top = base - rows * 4
    rect(img, x0, top, x1, base, STEEL)
    for r in range(rows):
        y = base - (r + 1) * 4
        rect(img, x0, y, x1, y + 1, AL_H)
        rect(img, x0, y + 1, x1, y + 2, AL)
        rect(img, x0, y + 2, x1, y + 4, (64, 70, 88, 255))
    for x in range(x0 + 2, x1 - 1, 10):
        rect(img, x, top, x + 1, base, OUT2)
    for e, sg in ((x0, 1), (x1 - 1, -1)):                    # the side frames, stepped
        for r in range(rows + 1):
            y = base - r * 4
            rect(img, min(e, e + sg * (r // 2 + 1)), y, max(e, e + sg * (r // 2 + 1)) + 1, y + 1, OUT2)
        rect(img, e, top, e + 1, base, OUT1)
    rect(img, x0, top - 4, x1, top - 3, AL_D)                # the handrail
    for x in range(x0, x1, 8):
        rect(img, x, top - 4, x + 1, top, AL_D)
    rect(img, x0, base, x1, base + 1, OUT2)
    if press:
        mid = (x0 + x1) // 2
        bx0, bx1, by0 = mid - 32, mid + 32, top - 20
        for x in (bx0 + 3, bx1 - 4):
            rect(img, x, by0 + 14, x + 1, top, OUT2)
        rect(img, bx0 - 1, by0 - 2, bx1 + 1, by0 + 15, OUT1)
        rect(img, bx0, by0 - 1, bx1, by0 + 2, STONE_D)
        rect(img, bx0, by0 + 2, bx1, by0 + 14, (232, 232, 224, 255))
        for x in range(bx0 + 3, bx1 - 4, 7):
            rect(img, x, by0 + 8, x + 5, by0 + 12, (58, 74, 108, 255))
            rect(img, x, by0 + 8, x + 2, by0 + 9, (106, 132, 176, 255))
        return (bx0 + 2, by0 + 2, bx1 - bx0 - 4)            # (the white band over its windows)
    return None


def bleacher_back(img, x0, x1, ytop, h):
    """a metal bleacher seen from behind (the south side, facing the pitch): its planks stepping down toward us along
    the top, the steel frame under them, braced, its shadow on the grass"""
    img.alpha_composite(shadow(x1 - x0 + 8, 6), (x0 - 4, ytop + h - 3))
    rows = max(2, (h - 4) // 4)
    for r in range(rows):                                    # the planks' backs, the top row furthest from us
        y = ytop + r * 2
        rect(img, x0, y, x1, y + 1, AL_H if r == 0 else AL)
        rect(img, x0, y + 1, x1, y + 2, AL_D)
    fy = ytop + rows * 2
    rect(img, x0, fy, x1, ytop + h, (112, 120, 136, 255))      # the frame behind, braced
    for x in range(x0, x1 - 1, 8):
        rect(img, x, fy, x + 2, ytop + h, (70, 76, 92, 255))
        for k in range(1, 6):
            yy = fy + k * (ytop + h - fy) // 6
            if x + 1 + k < x1:
                img.putpixel((x + 1 + k, yy), (164, 172, 186, 255))
    rect(img, x0, ytop + h, x1, ytop + h + 1, OUT1)
    rect(img, x0, ytop, x0 + 1, ytop + h, OUT1)
    rect(img, x1 - 1, ytop, x1, ytop + h, OUT1)


def covered_front(img, x0, x1, ytop, seats=(RED, RED_D), mid=(NAVY_L, NAVY), tiers=4, wall=True):
    """a covered stand seen from the pitch: the wide glass office's roof (houses set) on posts, seat rows in the club's
    colours under it, the upper ones in its shade, a front wall with the tunnel. Returns where its name goes on the roof's
    fascia: (x0, x1, y)"""
    w = x1 - x0
    roof = stand_roof(w)
    rh = roof.height
    sy, th = ytop + rh - 3, 7
    wy = sy + tiers * th
    for t in range(tiers):
        y = sy + t * th
        rect(img, x0 + 4, y, x1 - 4, y + th, PAVE)
        rect(img, x0 + 4, y + th - 2, x1 - 4, y + th - 1, STONE)
        rect(img, x0 + 4, y + th - 1, x1 - 4, y + th, STONE_M)
        for sx_ in range(x0 + 6, x1 - 6, 4):
            c, cd = mid if abs((sx_ - x0) - w / 2) < w * 0.14 else seats
            rect(img, sx_, y + 1, sx_ + 3, y + 3, cd)
            rect(img, sx_, y + 3, sx_ + 3, y + 4, c)
        if t < 2:
            pz = img.load()
            for yy in range(y, y + th):
                for xx in range(x0 + 4, x1 - 4):
                    r, g, b, a = pz[xx, yy]
                    pz[xx, yy] = (int(r * 0.72), int(g * 0.72), int(b * 0.78), a)
    rect(img, x0 + 3, sy, x0 + 4, wy, OUT2)
    rect(img, x1 - 4, sy, x1 - 3, wy, OUT2)
    if wall:
        rect(img, x0 + 3, wy, x1 - 3, wy + 1, OUT2)
        rect(img, x0 + 3, wy + 1, x1 - 3, wy + 5, STONE_M)
        rect(img, x0 + 3, wy + 1, x1 - 3, wy + 2, PAVE_L)
        rect(img, x0 + 3, wy + 5, x1 - 3, wy + 6, OUT2)
        tx = x0 + w // 2 - 6
        rect(img, tx, wy - 6, tx + 12, wy + 6, OUT1)
        rect(img, tx + 1, wy - 5, tx + 11, wy + 6, (40, 38, 44, 255))
    img.alpha_composite(roof, (x0, ytop))
    pst = post()
    for pxp in (x0 + 2, x0 + w // 3 - 4, x0 + 2 * w // 3 - 4, x1 - 11):
        img.alpha_composite(pst.crop((0, 0, pst.width, max(1, min(pst.height, wy - (ytop + rh - 6))))), (pxp, ytop + rh - 6))
    return (x0, x1, ytop + rh - 11)


def covered_back(img, x0, x1, ytop, tall=False):
    """a covered stand seen from behind (the south side): the roof's top, and its back wall, clad, a door or two.
    Returns where a board with the ground's name goes on the roof: (its centre, y, the widest it can be)"""
    rh = 12 if tall else 9
    rc = ((222, 226, 232, 255), (244, 246, 248, 255), (196, 202, 212, 255)) if tall else ((98, 112, 138, 255), (150, 160, 178, 255), (84, 96, 120, 255))
    rect(img, x0, ytop, x1, ytop + rh, OUT1)
    rect(img, x0 + 1, ytop + 1, x1 - 1, ytop + rh - 1, rc[0])
    rect(img, x0 + 1, ytop + 1, x1 - 1, ytop + 2, rc[1])
    for x in range(x0 + 6, x1 - 4, 9):
        rect(img, x, ytop + 2, x + 1, ytop + rh - 1, rc[2])
    wy = ytop + rh
    wh = 12 if tall else 9
    rect(img, x0, wy, x1, wy + wh, (118, 124, 132, 255))
    for x in range(x0, x1, 4):
        rect(img, x, wy, x + 1, wy + wh, (104, 110, 118, 255))
    rect(img, x0, wy, x1, wy + 1, (150, 156, 164, 255))
    for dx in ((x1 - x0) // 3, 2 * (x1 - x0) // 3):
        rect(img, x0 + dx - 4, wy + wh - 7, x0 + dx + 4, wy + wh, OUT1)
        rect(img, x0 + dx - 3, wy + wh - 6, x0 + dx + 3, wy + wh, (60, 58, 66, 255))
    rect(img, x0, wy + wh, x1, wy + wh + 1, OUT1)
    img.alpha_composite(shadow(x1 - x0 + 8, 6), (x0 - 4, wy + wh - 3))
    return ((x0 + x1) // 2, ytop + (2 if tall else 0), x1 - x0 - 12)


def end_terrace(img, side, x0, y0, y1, seats=(RED, RED_D)):
    """open terrace steps behind a goal, rising away from the pitch, a wall at the back"""
    tw = 24
    rect(img, x0 - 1, y0 - 1, x0 + tw + 1, y1 + 1, OUT2)
    for t in range(3):
        xs = x0 + tw - (t + 1) * 7 if side == 0 else x0 + t * 7
        rect(img, xs, y0, xs + 7, y1, PAVE)
        rect(img, xs + (0 if side == 0 else 6), y0, xs + (1 if side == 0 else 7), y1, STONE_M)
        for sy2 in range(y0 + 2, y1 - 2, 4):
            cx2 = xs + (3 if side == 0 else 2)
            rect(img, cx2, sy2, cx2 + 3, sy2 + 3, seats[1])
            rect(img, cx2 + (2 if side == 0 else 0), sy2, cx2 + (3 if side == 0 else 1), sy2 + 3, seats[0])
    wx = x0 if side == 0 else x0 + tw - 3
    rect(img, wx, y0, wx + 3, y1, STONE_M)
    rect(img, wx + (0 if side == 0 else 2), y0, wx + (1 if side == 0 else 3), y1, STONE_D)


def end_covered(img, side, x0, y0, y1, seats=(RED, RED_D), two=False):
    """a covered end stand: seat rows rising away from the pitch, its roof over the back half (seen from above)"""
    roofc = ((222, 226, 232, 255), (244, 246, 248, 255), (196, 202, 212, 255)) if two else ((98, 112, 138, 255), (150, 160, 178, 255), (84, 96, 120, 255))
    tw = 34 if two else 28
    rect(img, x0 - 1, y0 - 1, x0 + tw + 1, y1 + 1, OUT2)
    for t in range(4):
        xs = x0 + tw - (t + 1) * 6 if side == 0 else x0 + t * 6
        rect(img, xs, y0, xs + 6, y1, PAVE)
        for sy2 in range(y0 + 2, y1 - 2, 4):
            cx2 = xs + (2 if side == 0 else 1)
            rect(img, cx2, sy2, cx2 + 3, sy2 + 3, seats[1])
            rect(img, cx2 + (2 if side == 0 else 0), sy2, cx2 + (3 if side == 0 else 1), sy2 + 3, seats[0])
    rx0 = x0 if side == 0 else x0 + tw - 14
    rect(img, rx0, y0 - 3, rx0 + 14, y1 + 3, OUT1)
    rect(img, rx0 + 1, y0 - 2, rx0 + 13, y1 + 2, roofc[0])
    rect(img, rx0 + 1, y0 - 2, rx0 + 13, y0 - 1, roofc[1])
    for y in range(y0, y1, 8):
        rect(img, rx0 + 1, y, rx0 + 13, y + 1, roofc[2])
    return tw


def floodlight(img, x, y, h):
    """a floodlight: a bank of eight lamps on a tall pole; (x, y) the bank's top-left, h to the pole's foot"""
    img.alpha_composite(shadow(12, 4), (x + 1, y + h - 2))
    rect(img, x + 5, y + 8, x + 9, y + h, OUT2)
    rect(img, x + 6, y + 8, x + 8, y + h, STONE)
    rect(img, x + 6, y + 8, x + 7, y + h, PAVE)
    rect(img, x, y, x + 14, y + 9, OUT1)
    rect(img, x + 1, y + 1, x + 13, y + 8, STONE_D)
    for i in range(4):
        for j in range(2):
            rect(img, x + 2 + i * 3, y + 2 + j * 3, x + 4 + i * 3, y + 4 + j * 3, LAMP)


def ground(img, X, Y, lvl):
    """the club's ground at a level (1..5), its pitch always in the same place, nothing written on it. Returns where the
    game writes: sign (level 1: a board on posts left of the bleacher, [x, y, widest]), press (2: the press box's band,
    [x, y, w]), north (3..5: the north roof's fascia, [x0, x1, y]), south (3..5: a board on the south roof, [centre, y,
    widest]), and boards (along the north touchline, [x0, x1, y])"""
    pw, ph = 208, 100
    px0, py = X + 17, Y + 70
    a = {'boards': [px0, px0 + pw, py - 14 if lvl < 3 else py - 3]}
    if lvl == 5:                                              # the bowl's floor, under everything
        rect(img, X - 26, Y + 2, X + pw + 60, py + ph + 40, (176, 182, 192, 255))
    draw_pitch(img, px0, py, pw, ph)
    if lvl == 1:
        bleacher_front(img, px0 + 48, px0 + pw - 48, py - 4, 5)
        bleacher_back(img, px0 + 48, px0 + pw - 48, py + ph + 4, 13)
        a['sign'] = [X + 6, Y + 40, px0 + 48 - (X + 6) - 3]
    elif lvl == 2:
        a['press'] = list(bleacher_front(img, px0 + 10, px0 + pw - 10, py - 4, 8, press=True))
        bleacher_back(img, px0 + 10, px0 + pw - 10, py + ph + 4, 18)
        for fx in (px0 + 2, px0 + pw - 16):
            floodlight(img, fx, py - 54, 50)
    else:
        sx0, sx1 = (px0 - 17, px0 + pw + 17) if lvl < 5 else (px0 - 40, px0 + pw + 40)
        seats = (RED, RED_D)
        if lvl >= 4:
            for fx, fy in ((X - 14, Y - 6), (X + pw + 26, Y - 6)):
                floodlight(img, fx, fy, 60)
        if lvl == 5:
            # the bowl: the ends and the corners filled in, two tiers, a white roof all round
            for (ex, side) in ((X - 24, 0), (px0 + pw + 8, 1)):
                end_covered(img, side, ex, py - 6, py + ph + 6, seats, two=True)
        a['north'] = list(covered_front(img, sx0, sx1, Y + (4 if lvl < 5 else 0), seats, tiers=4 if lvl < 5 else 5))
        if lvl == 3:
            for (ex, side) in ((px0 - 7 - 24, 0), (px0 + pw + 7, 1)):
                end_terrace(img, side, ex, py - 2, py + ph + 2, seats)
        elif lvl == 4:
            for (ex, side) in ((px0 - 7 - 28, 0), (px0 + pw + 7, 1)):
                end_covered(img, side, ex, py - 2, py + ph + 2, seats)
        a['south'] = list(covered_back(img, sx0, sx1, py + ph + 6, tall=lvl == 5))
        if lvl == 5:
            rect(img, X - 26, Y - 2, X + pw + 60, Y + 2, WHITE)
    return a


def shadow(w, h):
    sh = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([0, 0, w - 1, h - 1], fill=(40, 30, 50, 90))
    return sh


def fence_ring(img, x0, y0, x1, y1):
    """a wooden rail fence round the training pitch, in the garden set's timber"""
    for y in (y0, y1):
        rect(img, x0, y - 1, x1, y + 2, WOOD_D)
        rect(img, x0, y, x1, y + 1, WOOD_L)
    for x in (x0, x1 - 2):
        rect(img, x - 1, y0, x + 2, y1, WOOD_D)
        rect(img, x, y0, x + 1, y1, WOOD_L)
    for x in range(x0, x1, 12):
        rect(img, x - 1, y0 - 4, x + 2, y0 + 2, WOOD_D)
        rect(img, x - 1, y1 - 4, x + 2, y1 + 2, WOOD_D)
        rect(img, x, y0 - 3, x + 1, y0 + 1, WOOD_L)
        rect(img, x, y1 - 3, x + 1, y1 + 1, WOOD_L)


def mini_pitch(img, x0, y0, w, h):
    rect(img, x0 - 2, y0 - 2, x0 + w + 2, y0 + h + 2, APRON)
    for i, x in enumerate(range(x0, x0 + w, 12)):
        rect(img, x, y0, min(x + 12, x0 + w), y0 + h, PITCH_A if i % 2 == 0 else PITCH_B)
    d = ImageDraw.Draw(img)
    d.rectangle([x0 + 2, y0 + 2, x0 + w - 3, y0 + h - 3], outline=LINE)
    cx, cy = x0 + w // 2, y0 + h // 2
    d.line([cx, y0 + 2, cx, y0 + h - 3], fill=LINE)
    d.ellipse([cx - 8, cy - 6, cx + 8, cy + 6], outline=LINE)
    for gx, s in ((x0 + 2, 1), (x0 + w - 3, -1)):
        d.rectangle([min(gx, gx + s * 14), cy - 14, max(gx, gx + s * 14), cy + 14], outline=LINE)
        rect(img, min(gx, gx - s * 4), cy - 6, max(gx, gx - s * 4) + 1, cy + 7, WHITE)
    # cones and a few balls
    for i in range(5):
        x = x0 + 18 + i * 9
        rect(img, x, y0 + h - 12, x + 2, y0 + h - 10, (232, 120, 48, 255))
        img.putpixel((x, y0 + h - 13), (250, 170, 90, 255))
    for bx, byy in ((cx + 22, cy + 4), (cx + 30, cy - 6), (cx - 26, cy + 8)):
        rect(img, bx, byy, bx + 3, byy + 3, WHITE)
        img.putpixel((bx + 1, byy + 1), OUT2)


# ---- compose -------------------------------------------------------------------------------------------------------
# the mockup's trees, in its own coordinates (the CORE's), and the border's, in the campus's: (name, x, y of its foot)
CORE_TREES = (('gconeM', 118, 30), ('gconeS', 120, 112), ('spruce', 398, 46), ('round_br', 398, 128),
              ('yconeM', 98, 128), ('round_dg', 6, 128), ('oak_big', 606, -24), ('round_or', 620, 52),
              ('maple_or', 434, 140), ('gconeM', 136, 262), ('round_lg', 252, 290),
              ('oak_twin', 418, 226), ('round_dg', 466, 276), ('willow2', 606, 240), ('spiky', 614, 300))
EDGE_TREES = (  # along the top, down each side (clear of the walk across the middle), and past the road at the foot
    ('pine', -12, 38), ('round_lg', 28, 41), ('gconeM', 60, 36), ('oak_gr', 80, 42), ('spruce', 136, 41),
    ('round_dg', 168, 36), ('pine_d', 196, 42), ('round_or', 240, 38), ('gconeS', 270, 42), ('maple_gr', 290, 40),
    ('round_dg', 338, 37), ('pine', 366, 42), ('round_lg', 410, 38), ('spruce_b', 440, 42), ('oak_ol', 468, 40),
    ('gconeM', 526, 41), ('round_br', 548, 36), ('pine_d', 578, 42), ('round_yb', 620, 38), ('maple_br', 648, 41),
    ('round_dg', 728, 40), ('pine', 740, 30),
    ('oak_gr', -26, 100), ('gconeM', 34, 128), ('round_lg', -4, 170), ('spruce', 26, 212), ('round_dg', 0, 236),
    ('pine_d', -14, 300), ('gconeS', 36, 290), ('round_or', 2, 350), ('gconeM', 38, 376),
    ('pine', 728, 96), ('round_lg', 722, 160), ('gconeM', 750, 198), ('spruce', 732, 236),
    ('round_dg', 730, 300), ('pine_d', 730, 372),
    ('sapling', 8, 452), ('fir', 112, 454), ('sapling', 196, 452), ('fir', 350, 454), ('sapling', 424, 452),
    ('fir', 488, 454), ('sapling', 602, 452), ('fir', 662, 454), ('sapling', 724, 452))
EDGE_PROPS = (('yelflw', 60, 446), ('pl_mix', 238, 446), ('daisy', 302, 444), ('yelflw', 542, 446), ('daisy', 752, 444))


def compose(lvl):
    """the campus with its ground at a level: (the picture, where the game writes on the ground, the ground's box, the
    buildings' boxes, where the crests go)"""
    global rnd
    rnd = random.Random(7)                       # (the same grass every time, so a level's patch is only its ground)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    lawn(img)
    objs = []                                    # (sprite, x, y) drawn by where they stand (their foot)

    def put(sp, x, y):
        objs.append((sp, x, y))
        return [x, y, sp.width, sp.height]

    def C(x, y):
        return x + OX, y + OY

    boxes = {}
    road(img, 340 + OY, 368 + OY)                # the road along the foot and the walk across the middle
    path(img, 0, 198 + OY, W, 214 + OY)
    plaza(img, *C(262, 212), *C(414, 342))       # the plaza in front of the stadium, down to the road
    path(img, *C(52, 106), *C(68, 200))          # walks from the doors: the top row's to the walk, the bottom row's to the road
    path(img, *C(466, 104), *C(482, 200))
    path(img, *C(60, 334), *C(78, 342))
    path(img, *C(222, 328), *C(238, 342))
    path(img, *C(543, 332), *C(559, 342))
    # the ground, on its own so its footprint is known: the trees in its way don't grow
    X, Y = C(140, 14)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    anchors = ground(layer, X, Y, lvl)
    fp = list(layer.getbbox())
    img.alpha_composite(layer)
    if lvl == 1:                                 # (the sign the game puts up is part of it)
        sx, sy, sw = anchors['sign']
        fp = [min(fp[0], sx), min(fp[1], sy), max(fp[2], sx + sw), max(fp[3], sy + 17)]
    mini_pitch(img, *C(500, 122), 116, 62)       # the training pitch, fenced, beside the academy
    fence_ring(img, *C(494, 116), *C(622, 190))
    boxes['training'] = [*C(494, 116), 128, 74]
    ofc, oc = office()
    boxes['office'] = put(ofc, *C(2, 4))
    acd, ac = academy()
    boxes['academy'] = put(acd, *C(422, 6))
    crests = [[boxes['office'][0] + oc[0], boxes['office'][1] + oc[1]], [boxes['academy'][0] + ac[0], boxes['academy'][1] + ac[1]]]
    put(barn(), *C(550, 4))
    boxes['market'] = put(market(), *C(2, 228))
    boxes['scouting'] = put(scouting(), *C(158, 242))
    boxes['home'] = put(house(), *C(520, 236))
    boxes['news'] = put(kiosk(), *C(274, 258))
    put(prop('maple'), *C(314, 232))

    def grow(name, x, foot):                     # a tree, unless the ground is where it would stand
        t = tree(name)
        y = foot - t.height
        if x < fp[2] + 1 and x + t.width > fp[0] - 1 and y < fp[3] + 1 and foot > fp[1] - 1:
            return
        put(t, x, y)

    for name, x, y in CORE_TREES:
        t = tree(name)
        grow(name, x + OX, y + OY + t.height)
    for name, x, foot in EDGE_TREES:
        grow(name, x, foot)
    for name, x, foot in EDGE_PROPS:
        p = prop(name)
        put(p, x, foot - p.height)
    # the plaza's furniture
    for name, x, y in (('lamp', 266, 214), ('lamp', 396, 214), ('lamp', 266, 290), ('lamp', 396, 290),
                       ('bench_g', 352, 258), ('bench_gl', 342, 298), ('bin', 384, 262), ('pl_red', 300, 314),
                       ('pl_blue', 334, 314), ('pl_leaf', 368, 314), ('ticket', 306, 270)):
        put(prop(name), *C(x, y))
    # the academy's yard: hay, a scarecrow by the barn
    for name, x, y in (('haystack', 520, 88), ('bale', 612, 94), ('scarecrow', 596, 190 - 32)):
        put(prop(name), *C(x, y))
    # the market's deliveries and bikes, the clubhouse's pots, the house's garden
    for name, x, y in (('crates', 108, 312), ('binm', 136, 318), ('bikes', 434, 290),
                       ('pot_b', 32, 92), ('pot_a', 76, 94), ('pl_topi', 10, 166), ('blueflw', 70, 168),
                       ('pl_mix', 488, 312), ('sunflowers', 492, 244), ('pumpkins', 584, 318), ('pumpkin_v', 500, 288),
                       ('daisy', 600, 332), ('yelflw', 580, 214)):
        put(prop(name), *C(x, y))
    put(prop('bus_g'), *C(420, 326))             # a bus on the road
    for sp, x, y in sorted(objs, key=lambda o: o[2] + o[0].height):
        paste(img, sp, x, y)
    return img, anchors, [fp[0], fp[1], fp[2] - fp[0], fp[3] - fp[1]], boxes, crests


def meta_and_shots():
    shots, meta = {}, {'w': W, 'h': H, 'core': list(CORE), 'lv': {}}
    for lv in range(1, 6):
        img, anchors, box, boxes, crests = compose(lv)
        assert img.getextrema()[3][0] == 255, 'the campus has see-through pixels'
        shots[lv] = img.convert('RGB')
        meta['lv'][str(lv)] = dict(anchors, box=box)
        if lv == 1:
            meta['boxes'], meta['crests'] = boxes, crests
    for lv in range(2, 6):                       # each other level: what changes from level 1
        bb = ImageChops.difference(shots[lv], shots[1]).getbbox()
        meta['lv'][str(lv)]['patch'] = [bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]]
    return shots, meta


def embed(html_path, pngs, meta):
    """write the pictures into classic.html: the CAMPUS_ART (level 1's picture, the others' patches, as data URLs) and
    CAMPUS_META lines"""
    src = open(html_path, encoding='utf-8').read()
    art = {str(k): 'data:image/png;base64,' + base64.b64encode(open(v, 'rb').read()).decode() for k, v in pngs.items()}
    want = {'const CAMPUS_ART = ': 'const CAMPUS_ART = ' + json.dumps(art, separators=(',', ':')) + ';',
            'const CAMPUS_META = ': 'const CAMPUS_META = ' + json.dumps(meta, separators=(',', ':')) + ';'}
    lines, hits = src.split('\n'), set()
    for i, line in enumerate(lines):
        lead = line[:len(line) - len(line.lstrip())]
        for k, v in want.items():
            if line.lstrip().startswith(k):
                lines[i] = lead + v
                hits.add(k)
    assert len(hits) == len(want), 'CAMPUS_ART / CAMPUS_META lines not found in ' + html_path
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print('embedded', len(art), 'pictures ->', html_path, '(%d base64 chars)' % sum(len(v) for v in art.values()))


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit(__doc__)
    TILES = args[0]
    out = args[1] if len(args) > 1 else os.path.join(root, 'assets', 'campus')
    os.makedirs(out, exist_ok=True)
    shots, meta = meta_and_shots()
    pngs = {1: os.path.join(out, 'campus_1.png')}
    shots[1].save(pngs[1], optimize=True)
    for lv in range(2, 6):
        x, y, w, h = meta['lv'][str(lv)]['patch']
        pngs[lv] = os.path.join(out, 'campus_%d.png' % lv)
        shots[lv].crop((x, y, x + w, y + h)).save(pngs[lv], optimize=True)
    # the preview: the ground at each level, side by side (the widest one's box, a little round it)
    bx = [min(meta['lv'][str(l)]['box'][0] for l in range(1, 6)) - 8, min(meta['lv'][str(l)]['box'][1] for l in range(1, 6)) - 8]
    bx += [max(meta['lv'][str(l)]['box'][0] + meta['lv'][str(l)]['box'][2] for l in range(1, 6)) + 8,
           max(meta['lv'][str(l)]['box'][1] + meta['lv'][str(l)]['box'][3] for l in range(1, 6)) + 8]
    tiles = [shots[l].crop(tuple(bx)) for l in range(1, 6)]
    prev = Image.new('RGB', (sum(t.width for t in tiles) + 8 * 4, tiles[0].height), (18, 26, 51))
    for i, t in enumerate(tiles):
        prev.paste(t, (i * (t.width + 8), 0))
    prev.save(os.path.join(out, 'campus_levels.png'), optimize=True)
    for lv in range(1, 6):
        print('level', lv, os.path.getsize(pngs[lv]), 'bytes', meta['lv'][str(lv)])
    if '--embed-classic' in sys.argv:
        embed(os.path.join(root, 'classic.html'), pngs, meta)

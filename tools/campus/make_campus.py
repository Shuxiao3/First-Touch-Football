#!/usr/bin/env python3
"""Football Classic -- THE CLUB CAMPUS, the career's hub. It's composed from the tilesets the user sent: the houses,
offices, garden, harbour, station and tree sets by TerribleJared (with VeonTrainer and Ekat99), and the shop set with
HimuraKenshin2010's items. The sets themselves aren't in the repo (they're credited in the README and in the game's
Settings); this makes the pictures the game embeds.

Nothing Pokemon-branded is used: the gym hall's sign and ball and the clinic's balls are painted over (the game puts
the club's code and crest there), the clubhouse's "PC" sign is painted over with its clapboard, the stone house's "Fly
Angler" board repainted to read SCOUTS and the log cabin's "Witch Hut" board cleared for the club's crest; no Poke Balls,
Ball-Mart signs, creatures or creature planters appear. The stadium isn't in the sets: it's drawn here in their palette.

The campus is 768 x 448, all lawn: no paths, no trees but the ones a club buys. The stadium is drawn as big as a stadium
is beside a clubhouse, so it doesn't fit: it runs along the top and off it, and what shows of it is its outside -- the
fence and the back of a bleacher at level 1, up to the bowl's two tiers at level 5 -- with the pitch beyond it while it's
low enough to see over. The clubhouse is in the middle (four of them, a shed up to a hall), the training pitch to its
left (four levels of it), the physio's clinic to its right, the scouts' house and the academy below them, each on a
roped-off plot till it's built. The pieces:

    campus_lawn.png        a 64 x 64 tile of lawn, all over
    campus_inside.png      the stadium's inside, as far as it shows over its walls (the pitch and its apron)
    campus_stadium_N.png   the stadium at level N, outside only (768 x SH, its foot at row SF): the campus shows the
                           bottom of it, the NEXT DAY scene all of it against the sky
    campus_lights_N.png    what's lit at night on it (lamps, windows)
    campus_sprites.png     every other piece: the clubhouses, the training pitches, the buildings, their plots, and the
                           decorations the club can buy and put where it likes

CAMPUS_META says where each goes and where the game writes on them: the ground's name (a sign on the gate at levels 1
and 2, a board on the stand's roof at 3 and 4, big letters on the bowl at 5), the club's crest and code on each
clubhouse and the academy, the footprints a decoration mustn't be put down on. campus_start.png is a new career's
campus, campus_full.png one with everything built and some decorations, campus_levels.png the five stadiums and the four
clubhouses.

    python3 -I tools/campus/make_campus.py <tiles dir> [out dir] [--embed-classic]
      out dir: assets/campus; --embed-classic writes CAMPUS_ART and CAMPUS_META into classic.html
"""
import base64
import glob
import json
import os
import random
import sys

from PIL import Image, ImageDraw

W, H = 768, 448                      # the campus
CORE = (154, 52, 460, 344)           # what the smallest phone (640 x 360) shows of it, at 1x
FOOT = 126                           # the campus's row where the stadium meets the lawn
SH, SF = 232, 222                    # a stadium picture's height, and its foot's row in it
OYS = FOOT - SF                      # where a stadium picture goes on the campus
CY = 238                             # the clubhouse's middle, up and down (across, it's the campus's middle)
TILES = None
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
APRON_D = (86, 120, 76, 255)
LINE = (228, 232, 220, 255)
RED = (196, 76, 60, 255)
RED_D = (150, 52, 46, 255)
NAVY = (49, 56, 82, 255)
NAVY_L = (78, 88, 120, 255)
WHITE = (240, 240, 232, 255)
WOOD = (110, 76, 52, 255)
WOOD_D = (78, 52, 38, 255)
WOOD_L = (150, 108, 74, 255)
LAMP = (250, 240, 196, 255)
WARM = (255, 214, 120, 255)
GLOW = (255, 236, 170, 255)
BRICK, BRICK_D, BRICK_L, MORTAR = (150, 84, 64, 255), (118, 64, 50, 255), (172, 104, 80, 255), (96, 58, 46, 255)
CLAD, CLAD_D, CLAD_L = (122, 128, 138, 255), (104, 110, 120, 255), (156, 162, 172, 255)
ROOF, ROOF_D, ROOF_L = (98, 112, 138, 255), (84, 96, 120, 255), (150, 160, 178, 255)
WROOF, WROOF_D, WROOF_L = (222, 226, 232, 255), (196, 202, 212, 255), (244, 246, 248, 255)
GLASS, GLASS_D, GLASS_L = (70, 96, 130, 255), (52, 70, 98, 255), (120, 150, 180, 255)
STEEL, STEEL_L = (84, 92, 110, 255), (128, 136, 152, 255)
AL_H, AL, AL_D = (236, 240, 244, 255), (196, 204, 214, 255), (128, 136, 152, 255)
EARTH, EARTH_D, EARTH_L, EARTH_E = (146, 116, 84, 255), (126, 98, 70, 255), (168, 138, 102, 255), (104, 80, 58, 255)
ROPE = (226, 206, 158, 255)

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


def shadow(w, h, a=90):
    sh = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([0, 0, w - 1, h - 1], fill=(40, 30, 50, a))
    return sh


def recolour(im, box, swap):
    """within box, each pixel of a colour in swap becomes its new colour"""
    px = im.load()
    for y in range(box[1], box[3]):
        for x in range(box[0], box[2]):
            c = px[x, y]
            if c[:3] in swap:
                px[x, y] = swap[c[:3]] + (255,)


# ---- the clubhouses: a shed, a log cabin, the clapboard clubhouse, the hall ---------------------------------------
def club1():
    """the garden set's red shed, let go: its paint faded, odd planks nailed over the gaps, slates missing. Returns it and
    where the crest goes (the gable over the doors)"""
    im = cut('01', 135, 451, 215, 555)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and r > g + 30:                         # the red paint, faded and greyed
                m = (r + g + b) // 3
                px[x, y] = ((r * 3 + m * 2) // 5 - 8, (g * 3 + m * 2) // 5, (b * 3 + m * 2) // 5, a)
    bb = im.getbbox()
    for (x0, y0, w, h, c) in ((bb[0] + 8, 66, 5, 22, (128, 120, 104)), (bb[0] + 13, 72, 4, 15, (104, 92, 78)),
                              (bb[2] - 17, 70, 5, 20, (120, 104, 84))):
        rect(im, x0, y0, x0 + w, y0 + h, OUT2)          # boards nailed on, a nail at each end
        rect(im, x0 + 1, y0 + 1, x0 + w - 1, y0 + h - 1, c + (255,))
        im.putpixel((x0 + w // 2, y0 + 2), OUT1)
        im.putpixel((x0 + w // 2, y0 + h - 3), OUT1)
    r = random.Random(3)
    for _ in range(9):                                  # slates gone
        x, y = r.randrange(14, im.width - 16), r.randrange(14, 46)
        if px[x, y][3] and px[x + 3, y][3]:
            rect(im, x, y, x + 4, y + 2, (96, 90, 84, 255))
            rect(im, x, y + 2, x + 4, y + 3, (52, 48, 46, 255))
    return im, (im.width // 2 - 4, 56)


def club2():
    """the log cabin with a board over its door (houses set): the board cleared -- the game puts the crest in its arch and
    the club's code under it. Returns it, the crest's spot and the code's (its middle, its top)"""
    im = cut('07', 5, 453, 101, 551, trim=False)
    px = im.load()
    cream, ink = (211, 178, 147), {(26, 26, 37), (53, 43, 49), (73, 63, 69), (109, 109, 109), (73, 86, 87), (47, 38, 44),
                                   (199, 192, 187), (5, 1, 2), (11, 5, 5), (162, 146, 128), (146, 118, 101)}
    dark = {(5, 1, 2), (11, 5, 5)}
    for y in range(34, 66):                             # the board's rows: between its outline at each end, all cream
        row = [x for x in range(13, 70) if px[x, y][:3] in dark]
        if len(row) < 2:
            continue
        for x in range(row[0] + 1, row[-1]):
            if px[x, y][:3] in ink:
                px[x, y] = cream + (255,)
    return im, (31, 41), (36, 55)                       # (the crest in the arch, the letters on the board under it)


def club3():
    """the clubhouse (harbour set), its gable sign painted over with clapboard: the game puts the crest there"""
    im = cut('06', 0, 700, 120, 816, trim=False)
    px = im.load()
    board_c, line_c = (163, 177, 177, 255), (102, 115, 127, 255)
    for y in range(57, 71):
        for x in range(46, 66):
            px[x, y] = line_c if (y + 700) % 3 == 2 else board_c
    bb = im.getbbox()
    return im.crop(bb), (51 - bb[0], 59 - bb[1])


def club4():
    """the hall (houses set): the leaf off its roof (the panel under it made good), its sign cleared for the club's code
    and its ball made a round plaque for the crest. Returns it, the crest's spot (the whole crest, 16 x 18) and the code's"""
    im = cut('07', 278, 492, 503, 684, trim=False)
    px = im.load()
    X0, Y0 = 278, 492
    E, Fc, G, K, L, J = (40, 23, 20), (80, 59, 45), (58, 41, 30), (5, 0, 0), (0, 0, 0), (32, 30, 34)
    jc = px[352 - X0, 515 - Y0][:3]                     # the panel's own grey
    for y in range(492, 513):                           # the box the leaf stood on, as it is lower down
        for x in range(342, 426):
            dx, dy = min(x - 342, 425 - x), y - 492
            d = min(dx, dy)
            c = E if d == 0 else Fc if d <= 3 else G if d <= 5 else K if d == 6 else L if d == 7 else jc
            if d >= 8 and x in (359, 408):
                c = L
            px[x - X0, y - Y0] = c + (255,)
    cream = (204, 195, 181)
    for y in range(564, 574):                           # the sign: cream, the words off it
        for x in range(368, 399):
            px[x - X0, y - Y0] = cream + (255,)
    cx, cy = 383.5, 596.0                              # the ball: a cream plaque in its dark ring
    for y in range(577, 616):
        for x in range(364, 404):
            r2 = (x + .5 - cx - .5) ** 2 + (y + .5 - cy - .5) ** 2
            if r2 <= 15.5 ** 2:
                px[x - X0, y - Y0] = cream + (255,)
            elif r2 <= 17 ** 2:
                px[x - X0, y - Y0] = (55, 30, 19, 255)
    return im, (round(cx) - 8 - X0, round(cy) - 9 - Y0), (383 - X0, 566 - Y0)


# ---- the other buildings -----------------------------------------------------------------------------------------
def physio():
    """the clinic (houses set): the ball on its gable painted over in its planks, the one on its sign by the door made
    the middle of a red cross"""
    im = cut('07', 10, 560, 112, 697, trim=False)
    px = im.load()
    X0, Y0 = 10, 560
    ball = {(26, 26, 26), (193, 95, 90), (186, 57, 51), (135, 43, 43), (251, 251, 250), (128, 132, 130), (255, 255, 255)}
    planks = {(69, 45, 39), (121, 89, 69), (90, 59, 52)}
    for y in range(626, 642):
        seen = {}
        for x in range(40, 76):
            c = px[x - X0, y - Y0][:3]
            if c in planks:
                seen[c] = seen.get(c, 0) + 1
        if not seen:
            continue
        fill = max(seen, key=seen.get) + (255,)
        for x in range(51, 72):
            if px[x - X0, y - Y0][:3] in ball:
                px[x - X0, y - Y0] = fill
    fill_c, red = (84, 63, 52), (206, 58, 50)
    ballc = {(26, 26, 26), (135, 43, 43), (203, 123, 75), (145, 43, 42), (214, 219, 215)}
    for y in range(647, 659):                           # the ball in the cross: gone, the cross's own fill there
        for x in range(33, 45):
            if (x + .5 - 38.5) ** 2 + (y + .5 - 653) ** 2 <= 4.4 ** 2 and px[x - X0, y - Y0][:3] in ballc:
                px[x - X0, y - Y0] = fill_c + (255,)
    todo, seen = [(38, 652)], set()                     # then the cross red, inside its white border
    while todo:
        x, y = todo.pop()
        if (x, y) in seen or px[x - X0, y - Y0][:3] not in (fill_c, red):
            continue
        seen.add((x, y))
        px[x - X0, y - Y0] = red + (255,)
        todo += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return im.crop(im.getbbox())


def scouting():
    """the stone house (harbour set): its shop board repainted to read SCOUTS"""
    im = cut('06', 0, 826, 104, 920, trim=False)
    px = im.load()
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


def academy():
    """the log cabin; the game puts your crest on its gable. Returns it and where the crest goes"""
    im = cut('07', 356, 20, 460, 118)
    return im, ((im.width - 9) // 2, 52)


def kiosk(words):
    """the harbour's kiosk with a board on top"""
    im = cut('06', 48, 128, 81, 161)
    out = Image.new('RGBA', (max(im.width, text_w(words) + 8), im.height + 7), (0, 0, 0, 0))
    out.alpha_composite(im, ((out.width - im.width) // 2, 7))
    b = board(text_w(words) + 8, 8, words, fill=RED_D)
    out.alpha_composite(b, ((out.width - b.width) // 2, 0))
    return out


def plot_pad(w, h, label):
    """a plot roped off for a building the club hasn't put up yet: cleared earth, a stake at each corner (and halfway
    along a long side), a rope round them, and a sign saying what's coming"""
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    r = random.Random(w * 31 + h)
    rect(im, 0, 0, w, h, EARTH_E)
    rect(im, 1, 1, w - 1, h - 1, EARTH)
    px = im.load()
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            v = r.random()
            if v < 0.08:
                px[x, y] = EARTH_D
            elif v < 0.13:
                px[x, y] = EARTH_L
    x0, y0, x1, y1 = 2, 2, w - 3, h - 6
    rect(im, x0, y0, x1 + 1, y0 + 1, ROPE)
    rect(im, x0, y1, x1 + 1, y1 + 1, ROPE)
    rect(im, x0, y0, x0 + 1, y1 + 1, ROPE)
    rect(im, x1, y0, x1 + 1, y1 + 1, ROPE)
    for x in [x0, x1] + ([(x0 + x1) // 2] if w > 60 else []):
        for y in (y0, y1):
            rect(im, x - 1, y, x + 1, y + 5, WOOD_D)
            rect(im, x - 1, y, x, y + 4, WOOD_L)
    b = board(text_w(label) + 8, 9, label, fill=WOOD, ink=(244, 236, 214, 255))
    bx, by = 6, h - 15
    rect(im, bx + 3, by + 9, bx + 4, by + 14, WOOD_D)
    rect(im, bx + b.width - 4, by + 9, bx + b.width - 3, by + 14, WOOD_D)
    im.alpha_composite(b, (bx, by))
    return im


# ---- the training pitch, at its four levels ------------------------------------------------------------------------
TW_, TH_ = 184, 112                  # the training ground, fence and all


def floodlight(img, x, y, h, lit=None):
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
            if lit is not None:
                rect(lit, x + 2 + i * 3, y + 2 + j * 3, x + 4 + i * 3, y + 4 + j * 3, GLOW)


def goal_small(img, x, y, w, h, side):
    """a goal seen from above and the front: the frame, the net behind it"""
    rect(img, x, y, x + w, y + h, (196, 200, 196, 255))
    px = img.load()
    for yy in range(y + 1, y + h - 1):
        for xx in range(x + 1, x + w - 1):
            if (xx + yy) % 2 == 0:
                px[xx, yy] = (150, 160, 150, 255)
    rect(img, x, y, x + w, y + 1, WHITE)
    rect(img, x, y + h - 1, x + w, y + h, WHITE)
    fx = x + w - 1 if side == 0 else x
    rect(img, fx, y, fx + 1, y + h, WHITE)


def training(lvl):
    """the training ground: a rough field with a pair of little goals at 1; its lines, proper goals and poles to run
    round at 2; a rail fence, a shelter and two floodlights at 3; a seated bench along it, four floodlights and a wall of
    dummies at 4"""
    im = Image.new('RGBA', (TW_, TH_), (0, 0, 0, 0))
    r = random.Random(40 + lvl)
    x0, y0, w, h = 10, 18, TW_ - 20, TH_ - 30           # the grass
    rect(im, x0 - 3, y0 - 3, x0 + w + 3, y0 + h + 3, APRON_D)
    for i, x in enumerate(range(x0, x0 + w, 12)):
        a, b = (PITCH_A, PITCH_B) if lvl >= 2 else ((108, 146, 88, 255), (108, 146, 88, 255))
        rect(im, x, y0, min(x + 12, x0 + w), y0 + h, a if i % 2 == 0 else b)
    px = im.load()
    if lvl == 1:                                        # worn: bare patches in the goalmouths and the middle
        for (cx, cy, rr) in ((x0 + 12, y0 + h // 2, 9), (x0 + w - 12, y0 + h // 2, 9), (x0 + w // 2, y0 + h // 2, 7)):
            for yy in range(cy - rr, cy + rr):
                for xx in range(cx - rr - 4, cx + rr + 4):
                    if ((xx - cx) / (rr + 4)) ** 2 + ((yy - cy) / rr) ** 2 < 1 and r.random() < 0.7:
                        px[xx, yy] = (EARTH if r.random() < 0.6 else EARTH_L)
    ln = LINE if lvl >= 2 else (196, 204, 186, 255)
    d = ImageDraw.Draw(im)
    if lvl >= 2 or True:
        d.rectangle([x0 + 2, y0 + 2, x0 + w - 3, y0 + h - 3], outline=ln)
        cx, cy = x0 + w // 2, y0 + h // 2
        d.line([cx, y0 + 2, cx, y0 + h - 3], fill=ln)
        if lvl >= 2:
            d.ellipse([cx - 10, cy - 8, cx + 10, cy + 8], outline=ln)
            for gx, s in ((x0 + 2, 1), (x0 + w - 3, -1)):
                d.rectangle([min(gx, gx + s * 18), cy - 18, max(gx, gx + s * 18), cy + 18], outline=ln)
    cy = y0 + h // 2
    gh = 12 if lvl == 1 else 18
    for gx, side in ((x0 - 4, 0), (x0 + w - 2, 1)):
        goal_small(im, gx, cy - gh // 2, 6, gh, side)
    for i in range(4 if lvl == 1 else 6):               # cones
        x = x0 + 26 + i * 10
        yy = y0 + h - 10
        rect(im, x, yy, x + 3, yy + 2, (232, 120, 48, 255))
        im.putpixel((x + 1, yy - 1), (250, 170, 90, 255))
    if lvl >= 2:                                        # poles to slalom
        for i in range(5):
            x = x0 + w - 70 + i * 9
            rect(im, x, y0 + 8, x + 1, y0 + 16, (240, 200, 60, 255))
            rect(im, x, y0 + 16, x + 2, y0 + 17, OUT2)
    for bx, byy in ((x0 + w // 2 + 20, cy + 6), (x0 + w // 2 - 28, cy - 10), (x0 + 40, cy + 14)):
        rect(im, bx, byy, bx + 3, byy + 3, WHITE)
        im.putpixel((bx + 1, byy + 1), OUT2)
    if lvl >= 3:                                        # a rail fence round it
        for yy in (y0 - 5, y0 + h + 4):
            rect(im, x0 - 7, yy - 1, x0 + w + 7, yy + 2, WOOD_D)
            rect(im, x0 - 7, yy, x0 + w + 7, yy + 1, WOOD_L)
        for xx in (x0 - 7, x0 + w + 5):
            rect(im, xx - 1, y0 - 5, xx + 2, y0 + h + 5, WOOD_D)
            rect(im, xx, y0 - 5, xx + 1, y0 + h + 5, WOOD_L)
        for xx in range(x0 - 7, x0 + w + 8, 14):
            for yy in (y0 - 5, y0 + h + 4):
                rect(im, xx - 1, yy - 4, xx + 2, yy + 3, WOOD_D)
                rect(im, xx, yy - 3, xx + 1, yy + 2, WOOD_L)
    if lvl == 3:                                        # a shelter on the far side
        sx = x0 + w // 2 - 16
        rect(im, sx, 2, sx + 32, 14, OUT1)
        rect(im, sx + 1, 3, sx + 31, 8, ROOF)
        rect(im, sx + 1, 3, sx + 31, 4, ROOF_L)
        rect(im, sx + 1, 8, sx + 31, 13, (60, 58, 66, 255))
        for k in range(4):
            rect(im, sx + 4 + k * 7, 10, sx + 8 + k * 7, 12, (196, 76, 60, 255))
    if lvl == 4:                                        # a seated bench along the far side, a wall of dummies
        rect(im, x0 + 20, 1, x0 + w - 20, 15, OUT1)
        rect(im, x0 + 21, 2, x0 + w - 21, 6, WROOF)
        rect(im, x0 + 21, 2, x0 + w - 21, 3, WROOF_L)
        rect(im, x0 + 21, 6, x0 + w - 21, 14, PAVE)
        for xx in range(x0 + 23, x0 + w - 23, 4):
            rect(im, xx, 8, xx + 3, 10, NAVY_L)
            rect(im, xx, 11, xx + 3, 13, NAVY)
        for k in range(4):
            dx = x0 + 30 + k * 5
            rect(im, dx, y0 + 6, dx + 3, y0 + 14, (232, 200, 60, 255))
            rect(im, dx, y0 + 6, dx + 3, y0 + 7, OUT2)
    if lvl >= 3:
        spots = ((0, 0), (TW_ - 14, 0)) if lvl == 3 else ((0, 0), (TW_ - 14, 0), (0, TH_ - 44), (TW_ - 14, TH_ - 44))
        for (fx, fy) in spots:
            floodlight(im, fx, fy, 40)
    return im


# ---- trees and props, for the shop ---------------------------------------------------------------------------------
TREES = {  # (sheet 05) each tree with its own shadow
    'bushtree': (48, 96, 80, 160), 'yconeM': (84, 113, 108, 160), 'gconeM': (116, 113, 140, 160),
    'maple_br': (144, 88, 188, 160), 'maple_gr': (190, 88, 240, 160), 'spruce': (240, 86, 272, 160),
    'maple_or': (304, 92, 352, 160), 'round_dg': (352, 108, 384, 160), 'round_lg': (416, 100, 448, 160),
    'round_or': (448, 100, 480, 160), 'oak_gr': (64, 176, 126, 240), 'willow1': (130, 176, 190, 240),
    'oak_big': (304, 176, 366, 240), 'pine': (414, 176, 462, 240), 'sapling': (128, 8, 160, 48), 'fir': (96, 4, 128, 48),
}
PROPS = {
    'lamp': ('06', 0, 174, 17, 224), 'bin': ('06', 0, 8, 16, 31), 'bench_st': ('06', 64, 32, 94, 48),
    'bench_g': ('02', 181, 279, 204, 304), 'bikes': ('02', 44, 352, 84, 400), 'bus_b': ('03', 177, 327, 256, 368),
    'maple': ('07', 464, 371, 512, 432), 'scarecrow': ('01', 4, 0, 29, 32), 'haystack': ('01', 99, 2, 127, 32),
    'pumpkins': ('01', 163, 8, 190, 32), 'sunflowers': ('01', 34, 34, 63, 64), 'blueflw': ('01', 131, 67, 159, 95),
    'yelflw': ('01', 163, 65, 191, 95), 'hive': ('01', 135, 177, 153, 208), 'pl_red': ('01', 1, 242, 31, 272),
    'pot_big': ('01', 1, 507, 32, 557), 'pot_plant': ('02', 132, 438, 146, 458),
}


def tree(name):
    return cut('05', *TREES[name])


def prop(name):
    n, x0, y0, x1, y1 = PROPS[name]
    return cut(n, x0, y0, x1, y1)


# what the DECORATE shop sells: id -> (the sprite)
DECO = {
    'oak': ('tree', 'oak_gr'), 'bigoak': ('tree', 'oak_big'), 'maple': ('tree', 'maple_or'), 'maple_gr': ('tree', 'maple_gr'),
    'willow': ('tree', 'willow1'), 'pine': ('tree', 'pine'), 'spruce': ('tree', 'spruce'), 'round': ('tree', 'round_lg'),
    'autumn': ('tree', 'round_or'), 'cone': ('tree', 'yconeM'), 'bush': ('tree', 'bushtree'), 'fir': ('tree', 'fir'),
    'sapling': ('tree', 'sapling'),
    'sunflowers': ('prop', 'sunflowers'), 'yellow': ('prop', 'yelflw'), 'blue': ('prop', 'blueflw'),
    'bed': ('prop', 'pl_red'), 'pot': ('prop', 'pot_big'), 'plant': ('prop', 'pot_plant'), 'pumpkins': ('prop', 'pumpkins'),
    'scarecrow': ('prop', 'scarecrow'), 'hay': ('prop', 'haystack'), 'hive': ('prop', 'hive'),
    'lamp': ('prop', 'lamp'), 'bench': ('prop', 'bench_st'), 'gbench': ('prop', 'bench_g'), 'bin': ('prop', 'bin'),
    'bikes': ('prop', 'bikes'), 'statue': ('prop', 'maple'), 'bus': ('prop', 'bus_b'),
}


def deco_sprite(k):
    kind, name = DECO[k]
    return tree(name) if kind == 'tree' else prop(name)


def foot_box(w, h, lo=4, hi=14, inset=0.18):
    """a piece's footprint, from its top-left: the strip along its foot"""
    fh = max(lo, min(hi, h // 4))
    dx = round(w * inset)
    return [dx, h - fh, max(2, w - 2 * dx), fh]


# ---- the stadium ---------------------------------------------------------------------------------------------------
PX0, PX1, TY = 122, 646, 90          # the pitch's goal lines and its near touchline (the campus's rows)


def inside():
    """the stadium's inside, as far as the campus sees over its walls: the apron, and the near half of the pitch -- its
    stripes, the touchline, the halfway line and the bottom of the centre circle, the corners, the boxes' sides"""
    im = Image.new('RGBA', (W, FOOT), APRON)
    r = random.Random(9)
    px = im.load()
    for y in range(FOOT):
        for x in range(W):
            if r.random() < 0.03:
                px[x, y] = APRON_D
    for x in range(PX0, PX1):
        c = PITCH_A if ((x - PX0) // 24) % 2 == 0 else PITCH_B
        for y in range(0, TY):
            px[x, y] = c
    d = ImageDraw.Draw(im)
    d.line([PX0, TY, PX1, TY], fill=LINE)
    d.line([PX0, 0, PX0, TY], fill=LINE)
    d.line([PX1, 0, PX1, TY], fill=LINE)
    d.line([384, 0, 384, TY], fill=LINE)
    d.ellipse([384 - 46, -18 - 28, 384 + 46, -18 + 28], outline=LINE)
    for gx, s in ((PX0, 1), (PX1, -1)):
        bx = gx + s * 82
        d.line([bx, 0, bx, 46], fill=LINE)
        d.line([min(gx, bx), 46, max(gx, bx), 46], fill=LINE)
        sx = gx + s * 27
        d.line([sx, 0, sx, 12], fill=LINE)
        d.line([min(gx, sx), 12, max(gx, sx), 12], fill=LINE)
        for a in range(0, 7):                           # the corner's arc
            im.putpixel((gx + s * a, TY - round((36 - a * a) ** 0.5)), LINE)
    return im


def fence_rail(img, x0, x1, foot, gap):
    """a post-and-rail fence along foot (a gap left for the gate)"""
    for yy in (foot - 9, foot - 5):
        for x0_, x1_ in ((x0, gap[0]), (gap[1], x1)):
            rect(img, x0_, yy, x1_, yy + 2, WOOD_D)
            rect(img, x0_, yy, x1_, yy + 1, WOOD_L)
    for x in list(range(x0 + 4, gap[0] - 2, 12)) + list(range(gap[1] + 6, x1, 12)):
        rect(img, x - 1, foot - 11, x + 2, foot, WOOD_D)
        rect(img, x, foot - 11, x + 1, foot - 1, WOOD_L)
    rect(img, x0, foot, x1, foot + 2, (60, 80, 56, 70))


def brick_wall(img, x0, x1, foot, h, gap):
    """a low brick wall along foot, coped, a gap for the gate"""
    for a, b in ((x0, gap[0]), (gap[1], x1)):
        rect(img, a, foot - h, b, foot, BRICK)
        px = img.load()
        for y in range(foot - h + 2, foot):
            for x in range(max(0, a), min(img.width, b)):
                row = (y - (foot - h + 2)) // 3
                if (y - (foot - h + 2)) % 3 == 2 or (x + (4 if row % 2 else 0)) % 8 == 0:
                    px[x, y] = MORTAR
                elif (x * 7 + y * 3) % 11 == 0:
                    px[x, y] = BRICK_L
        rect(img, a, foot - h, b, foot - h + 2, PAVE_L)
        rect(img, a, foot - h + 2, b, foot - h + 3, STONE_M)
    rect(img, x0, foot, x1, foot + 2, (60, 80, 56, 80))


def pillar(img, x, foot, w, h, brick=True):
    rect(img, x, foot - h, x + w, foot, BRICK_D if brick else WOOD_D)
    rect(img, x + 1, foot - h + 1, x + w - 1, foot, BRICK if brick else WOOD)
    rect(img, x - 1, foot - h - 2, x + w + 1, foot - h + 1, PAVE_L if brick else WOOD_L)
    rect(img, x - 1, foot - h + 1, x + w + 1, foot - h + 2, STONE_M if brick else WOOD_D)


def bleacher_back(img, x0, x1, ytop, h):
    """a metal bleacher seen from behind: its planks stepping down toward us along the top, the steel frame under them,
    braced"""
    img.alpha_composite(shadow(x1 - x0 + 8, 6), (x0 - 4, ytop + h - 3))
    rows = max(2, (h - 4) // 5)
    for k in range(rows):
        y = ytop + k * 2
        rect(img, x0, y, x1, y + 1, AL_H if k == 0 else AL)
        rect(img, x0, y + 1, x1, y + 2, AL_D)
    fy = ytop + rows * 2
    rect(img, x0, fy, x1, ytop + h, (112, 120, 136, 255))
    for x in range(x0, x1 - 1, 8):
        rect(img, x, fy, x + 2, ytop + h, (70, 76, 92, 255))
        span = ytop + h - fy
        for k in range(1, span):
            xx = x + 2 + (k * 6) // span
            if xx < x1:
                img.putpixel((xx, fy + k), (164, 172, 186, 255))
    rect(img, x0, ytop + h, x1, ytop + h + 1, OUT1)
    rect(img, x0, ytop, x0 + 1, ytop + h, OUT1)
    rect(img, x1 - 1, ytop, x1, ytop + h, OUT1)


def stand_back(img, lit, x0, x1, foot, wall, roof, rows=1, doors=6, white=False, letters=False):
    """a covered stand from behind: its roof's top (seen from above, rising toward the pitch), its back wall clad in
    sheeting, a row of windows a floor, turnstile doors along the bottom with a lamp over each. Returns the roof's band
    (y0, y1)"""
    rc = (WROOF, WROOF_D, WROOF_L) if white else (ROOF, ROOF_D, ROOF_L)
    ry0, ry1 = foot - wall - roof, foot - wall
    img.alpha_composite(shadow(x1 - x0 + 10, 8, 70), (x0 - 5, foot - 4))
    rect(img, x0, ry0, x1, ry1 + 1, OUT1)
    rect(img, x0 + 1, ry0 + 1, x1 - 1, ry1, rc[0])
    rect(img, x0 + 1, ry0 + 1, x1 - 1, ry0 + 2, rc[2])
    for x in range(x0 + 6, x1 - 4, 12):
        rect(img, x, ry0 + 2, x + 1, ry1, rc[1])
    rect(img, x0 + 1, ry1 - 3, x1 - 1, ry1, rc[1])                # the gutter
    rect(img, x0, ry1, x1, foot, OUT1)
    rect(img, x0 + 1, ry1 + 1, x1 - 1, foot - 1, CLAD)
    px = img.load()
    for y in range(ry1 + 1, foot - 1):
        for x in range(x0 + 2, x1 - 1, 3):
            px[x, y] = CLAD_D
    rect(img, x0 + 1, ry1 + 1, x1 - 1, ry1 + 2, CLAD_L)
    floor = (wall - 18) // max(1, rows)
    for k in range(rows):                               # windows, a row a floor
        wy = ry1 + 6 + k * floor
        for x in range(x0 + 14, x1 - 16, 18):
            rect(img, x, wy, x + 8, wy + 5, OUT2)
            rect(img, x + 1, wy + 1, x + 7, wy + 5, GLASS)
            rect(img, x + 1, wy + 1, x + 3, wy + 2, GLASS_L)
            if lit is not None and (x // 18 + k) % 3 != 1:
                rect(lit, x + 1, wy + 1, x + 7, wy + 5, WARM)
    step = (x1 - x0) // (doors + 1)
    for i in range(doors):                              # the turnstiles
        dx = x0 + step * (i + 1) - 6
        rect(img, dx - 1, foot - 15, dx + 13, foot, OUT1)
        rect(img, dx, foot - 14, dx + 12, foot, (52, 50, 58, 255))
        rect(img, dx + 2, foot - 10, dx + 10, foot - 9, STEEL_L)
        rect(img, dx + 5, foot - 9, dx + 7, foot, STEEL)
        if letters:
            ch = 'ABCDEFGHJK'[i]
            rect(img, dx + 2, foot - 23, dx + 10, foot - 16, OUT1)
            rect(img, dx + 3, foot - 22, dx + 9, foot - 17, (232, 200, 60, 255))
            text(img, dx + 5, foot - 22, ch, OUT1)
        rect(img, dx + 5, foot - 17 - (8 if letters else 0), dx + 7, foot - 15 - (8 if letters else 0), LAMP)
        if lit is not None:
            rect(lit, dx + 5, foot - 17 - (8 if letters else 0), dx + 7, foot - 15 - (8 if letters else 0), GLOW)
            rect(lit, dx + 1, foot - 13, dx + 11, foot - 1, (255, 200, 110, 150))
    return ry0, ry1


def end_back(img, x0, x1, foot, h):
    """the back of an open terrace behind a goal: a concrete wall with a rail along its top, the steps showing over it"""
    img.alpha_composite(shadow(x1 - x0 + 6, 6, 60), (x0 - 3, foot - 3))
    for k in range(4):                                  # the steps, rising away
        y = foot - h - 8 + k * 2
        rect(img, x0 + 2, y, x1 - 2, y + 2, PAVE if k % 2 == 0 else PAVE_L)
    rect(img, x0, foot - h, x1, foot, OUT2)
    rect(img, x0 + 1, foot - h + 1, x1 - 1, foot - 1, STONE)
    px = img.load()
    for y in range(foot - h + 1, foot - 1):
        for x in range(x0 + 1, x1 - 1):
            if (y - foot) % 6 == 0:
                px[x, y] = STONE_M
    rect(img, x0, foot - h - 3, x1, foot - h - 2, AL_D)
    for x in range(x0, x1, 6):
        rect(img, x, foot - h - 3, x + 1, foot - h, AL_D)


def pylon(img, lit, x, foot, h):
    """a floodlight tower: a lattice mast, its bank of lamps tilted toward the pitch at the top"""
    top = foot - h
    rect(img, x, top + 14, x + 1, foot, OUT2)
    rect(img, x + 9, top + 14, x + 10, foot, OUT2)
    for y in range(top + 14, foot, 6):
        for k in range(6):
            img.putpixel((x + 1 + (k * 8) // 6, y + k), STEEL_L)
            img.putpixel((x + 8 - (k * 8) // 6, y + k), STEEL)
        rect(img, x, y, x + 10, y + 1, STEEL)
    rect(img, x - 6, top, x + 16, top + 14, OUT1)
    rect(img, x - 5, top + 1, x + 15, top + 13, STONE_D)
    for i in range(5):
        for j in range(3):
            rect(img, x - 4 + i * 4, top + 2 + j * 4, x - 1 + i * 4, top + 5 + j * 4, LAMP)
            if lit is not None:
                rect(lit, x - 4 + i * 4, top + 2 + j * 4, x - 1 + i * 4, top + 5 + j * 4, GLOW)
    img.alpha_composite(shadow(16, 5, 70), (x - 3, foot - 3))


def bowl(img, lit, foot):
    """the grand stadium from outside: a glass concourse along the foot, its entrances under canopies, the upper tier's
    white fins over it, the roof's edge on top; it curves away at each end"""
    top = foot - 176
    img.alpha_composite(shadow(W + 20, 10, 70), (-10, foot - 5))
    for x in range(W):
        e = min(x, W - 1 - x)                           # toward the ends: the top lower, the face darker
        drop = 0 if e >= 70 else round((70 - e) ** 2 / 70 * 0.55)
        shade = 0 if e >= 90 else (90 - e) / 90 * 0.35
        col = lambda c: tuple(int(v * (1 - shade)) for v in c[:3]) + (255,)
        y0 = top + drop
        for y in range(y0, foot):
            if y < y0 + 2:
                c = OUT1
            elif y < y0 + 22:                           # the roof's top, white, its inner edge darker
                c = WROOF_D if y < y0 + 5 else (WROOF_L if (x // 24) % 2 == 0 and y < y0 + 7 else WROOF)
                if x % 24 == 0:
                    c = WROOF_D
            elif y < y0 + 24:
                c = OUT2
            elif y < foot - 72:                         # the fins
                c = WHITE if x % 5 < 3 else (150, 156, 168, 255)
                if x % 5 == 2:
                    c = (210, 214, 220, 255)
            elif y < foot - 66:                         # the concourse's slab
                c = PAVE_L if y < foot - 70 else STONE_M
            elif y < foot - 6:                          # the glass
                c = GLASS_L if (x + (foot - y)) % 23 < 2 else GLASS
                if x % 10 == 0:
                    c = (150, 172, 196, 255)
                if (foot - y) in (40, 41):
                    c = (150, 172, 196, 255)
            else:
                c = STONE_M if y < foot - 3 else STONE_D
            img.putpixel((x, y), col(c))
            if lit is not None and foot - 66 <= y < foot - 6 and x % 10 != 0 and (foot - y) not in (40, 41) and e > 40:
                lit.putpixel((x, y), (255, 214, 140, 150))
        if lit is not None and x % 4 == 0 and e > 30:   # the roof's lamps along its inner edge
            lit.putpixel((x, top + drop + 3), GLOW)
            lit.putpixel((x + 1 if x + 1 < W else x, top + drop + 3), GLOW)
    for cx in range(96, W - 60, 144):                   # the entrances: a canopy over a dark doorway
        rect(img, cx - 22, foot - 34, cx + 22, foot - 6, OUT1)
        rect(img, cx - 21, foot - 33, cx + 21, foot - 6, (40, 44, 56, 255))
        rect(img, cx - 26, foot - 38, cx + 26, foot - 33, WHITE)
        rect(img, cx - 26, foot - 33, cx + 26, foot - 32, STONE_M)
        for k in range(3):
            rect(img, cx - 15 + k * 12, foot - 28, cx - 9 + k * 12, foot - 6, (60, 66, 80, 255))
        if lit is not None:
            rect(lit, cx - 20, foot - 32, cx + 20, foot - 7, (255, 210, 130, 190))
            rect(lit, cx - 26, foot - 33, cx + 26, foot - 32, GLOW)
    return top


def stadium(lvl):
    """the stadium at a level, from outside: (the picture, what's lit at night, where its name goes). The picture is
    W x SH, its foot at row SF; the name's spot is in its rows: {k: 'gate' | 'roof' | 'big', cx, y, w}"""
    im = Image.new('RGBA', (W, SH), (0, 0, 0, 0))
    lit = Image.new('RGBA', (W, SH), (0, 0, 0, 0))
    F = SF
    if lvl == 1:
        bleacher_back(im, 196, 572, F - 52, 36)
        fence_rail(im, 0, W, F, (364, 404))
        for x in (357, 405):
            pillar(im, x, F, 6, 28, brick=False)
        k = kiosk('TICKETS')
        im.alpha_composite(k, (300 - k.width // 2, F - k.height))
        rect(lit, 300 - 6, F - 20, 300 + 6, F - 13, (255, 210, 130, 200))
        sign = {'k': 'gate', 'cx': 384, 'y': F - 39, 'w': 120}
    elif lvl == 2:
        for fx in (78, W - 92):
            floodlight(im, fx, F - 168, 164, lit)
        bleacher_back(im, 112, 656, F - 80, 62)
        brick_wall(im, 0, W, F, 13, (362, 406))
        for x in (352, 406):
            pillar(im, x, F, 10, 34)
        for kx in (296, 472):
            k = kiosk('TICKETS')
            im.alpha_composite(k, (kx - k.width // 2, F - k.height))
            rect(lit, kx - 6, F - 20, kx + 6, F - 13, (255, 210, 130, 200))
        sign = {'k': 'gate', 'cx': 384, 'y': F - 46, 'w': 150}
    elif lvl == 3:
        for (a, b) in ((6, 78), (W - 78, W - 6)):
            end_back(im, a, b, F, 30)
        for fx in (62, W - 76):
            floodlight(im, fx, F - 190, 186, lit)
        ry0, ry1 = stand_back(im, lit, 84, W - 84, F, 58, 26, rows=1, doors=6)
        sign = {'k': 'roof', 'cx': 384, 'y': ry0 + 8, 'w': 260}
    elif lvl == 4:
        for (a, b) in ((0, 66), (W - 66, W)):
            stand_back(im, lit, a, b, F, 76, 22, rows=2, doors=1)
        for px_ in (68, W - 78):
            pylon(im, lit, px_, F, 214)
        ry0, ry1 = stand_back(im, lit, 84, W - 84, F, 92, 30, rows=2, doors=8, white=True, letters=True)
        sign = {'k': 'roof', 'cx': 384, 'y': ry0 + 10, 'w': 300}
    else:
        top = bowl(im, lit, F)
        sign = {'k': 'big', 'cx': 384, 'y': F - 128, 'w': 440}
    return im, lit, sign


# ---- the layout ----------------------------------------------------------------------------------------------------
def lawn_tile():
    """a 64 x 64 tile of lawn that repeats without a seam"""
    t = Image.new('RGBA', (64, 64), GRASS)
    r = random.Random(7)
    px = t.load()
    for y in range(64):
        for x in range(64):
            v = r.random()
            if v < 0.025:
                px[x, y] = GRASS_D
            elif v < 0.04:
                px[x, y] = GRASS_L
    for _ in range(14):
        x, y = r.randrange(64), r.randrange(64)
        for (dx, dy, c) in ((0, 0, GRASS_K), (0, -1, GRASS_K), (2, 0, GRASS_K), (1, -1, GRASS_L)):
            px[(x + dx) % 64, (y + dy) % 64] = c
    return t


def build_all():
    """every piece, packed, and the meta"""
    sprites, meta = {}, {'w': W, 'h': H, 'core': list(CORE), 'foot': FOOT, 'sf': SF, 'sh': SH, 'oys': OYS,
                         'stad': {}, 'club': {}, 'train': {}, 'bld': {}, 'plot': {}, 'deco': {}}
    stads = {}
    for lvl in range(1, 6):
        im, lit, sign = stadium(lvl)
        stads[lvl] = (im, lit)
        meta['stad'][str(lvl)] = {'sign': sign, 'box': [0, 0, W, FOOT]}
    clubs = {1: club1(), 2: club2(), 3: club3(), 4: club4()}
    for lvl, got in clubs.items():
        im = got[0]
        x, y = round(W / 2 - im.width / 2), round(CY - im.height / 2)
        sprites['club%d' % lvl] = im
        m = {'x': x, 'y': y, 'c': list(got[1]) + [2 if lvl == 4 else 1],
             'box': [x, y, im.width, im.height], 'fp': [x, y + im.height // 2, im.width, im.height - im.height // 2 - 4]}
        if len(got) > 2:
            m['code'] = list(got[2])
        meta['club'][str(lvl)] = m
    for lvl in range(1, 5):
        im = training(lvl)
        sprites['train%d' % lvl] = im
        x, y = 66, 146
        meta['train'][str(lvl)] = {'x': x, 'y': y, 'box': [x, y, im.width, im.height], 'fp': [x, y, im.width, im.height]}
    ph, sc, (ac, acc) = physio(), scouting(), academy()
    for bid, im, cx, fy, crest in (('physio', ph, 570, 262, None), ('scouting', sc, 168, 370, None), ('academy', ac, 592, 372, acc)):
        x, y = round(cx - im.width / 2), fy - im.height
        sprites['b_' + bid] = im
        m = {'x': x, 'y': y, 'box': [x, y, im.width, im.height], 'fp': [x, y + im.height // 2, im.width, im.height - im.height // 2 - 4]}
        if crest:
            m['c'] = list(crest) + [1]
        meta['bld'][bid] = m
        pw, phh = 100, 50
        p = plot_pad(pw, phh, {'physio': 'PHYSIO', 'scouting': 'SCOUTS', 'academy': 'ACADEMY'}[bid])
        sprites['p_' + bid] = p
        px_, py_ = round(cx - pw / 2), fy - phh
        meta['plot'][bid] = {'x': px_, 'y': py_, 'box': [px_, py_, pw, phh], 'fp': [px_, py_, pw, phh]}
    for k in DECO:
        im = deco_sprite(k)
        sprites['d_' + k] = im
        meta['deco'][k] = {'fp': foot_box(im.width, im.height, hi=16 if k == 'bus' else 12, inset=0.06 if k == 'bus' else 0.2)}
    sheet_, at = pack(sprites)
    for lvl in range(1, 5):
        meta['club'][str(lvl)]['s'] = at['club%d' % lvl]
        meta['train'][str(lvl)]['s'] = at['train%d' % lvl]
    for bid in ('physio', 'scouting', 'academy'):
        meta['bld'][bid]['s'] = at['b_' + bid]
        meta['plot'][bid]['s'] = at['p_' + bid]
    for k in DECO:
        meta['deco'][k]['s'] = at['d_' + k]
    return stads, sheet_, meta, sprites


def pack(sprites):
    """the sprites, packed in rows into one sheet: (the sheet, {name: [x, y, w, h]})"""
    names = sorted(sprites, key=lambda n: (-sprites[n].height, n))
    SW_, x, y, row, at = 512, 0, 0, 0, {}
    for n in names:
        im = sprites[n]
        if x + im.width > SW_:
            x, y, row = 0, y + row + 1, 0
        at[n] = [x, y, im.width, im.height]
        x, row = x + im.width + 1, max(row, im.height)
    sheet_ = Image.new('RGBA', (SW_, y + row), (0, 0, 0, 0))
    for n, (x, y, w, h) in at.items():
        sheet_.alpha_composite(sprites[n], (x, y))
    return sheet_, at


def compose(stads, sprites, meta, o):
    """the campus as the game draws it (without the words and the crest): o -- stad, club, train (levels), bld (the
    built buildings), plots (the ones roped off), deco ([id, x, y]...)"""
    img = Image.new('RGBA', (W, H), GRASS)
    t = lawn_tile()
    for y in range(0, H, 64):
        for x in range(0, W, 64):
            img.alpha_composite(t, (x, y))
    img.alpha_composite(INSIDE, (0, 0))
    paste(img, stads[o['stad']][0], 0, OYS)
    pieces = []
    m = meta['club'][str(o['club'])]
    pieces.append((m['y'] + sprites['club%d' % o['club']].height, sprites['club%d' % o['club']], m['x'], m['y']))
    m = meta['train'][str(o['train'])]
    pieces.append((m['y'] + sprites['train%d' % o['train']].height, sprites['train%d' % o['train']], m['x'], m['y']))
    for bid in ('physio', 'scouting', 'academy'):
        if bid in o['bld']:
            m, s = meta['bld'][bid], sprites['b_' + bid]
        elif bid in o['plots']:
            m, s = meta['plot'][bid], sprites['p_' + bid]
        else:
            continue
        pieces.append((m['y'] + s.height, s, m['x'], m['y']))
    for k, x, y in o.get('deco', []):
        s = sprites['d_' + k]
        pieces.append((y + s.height, s, x, y))
    for _, s, x, y in sorted(pieces, key=lambda p: p[0]):
        paste(img, s, x, y)
    return img


def embed(html_path, pngs, meta):
    """write the pictures into classic.html: CAMPUS_ART (data URLs) and CAMPUS_META lines"""
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


INSIDE = None

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit(__doc__)
    TILES = args[0]
    out = args[1] if len(args) > 1 else os.path.join(root, 'assets', 'campus')
    os.makedirs(out, exist_ok=True)
    INSIDE = inside()
    stads, sheet_, meta, sprites = build_all()
    pngs = {'lawn': os.path.join(out, 'campus_lawn.png'), 'in': os.path.join(out, 'campus_inside.png'),
            'sprites': os.path.join(out, 'campus_sprites.png')}
    lawn_tile().convert('RGB').save(pngs['lawn'], optimize=True)
    INSIDE.convert('RGB').save(pngs['in'], optimize=True)
    sheet_.save(pngs['sprites'], optimize=True)
    for lvl in range(1, 6):
        pngs['s%d' % lvl] = os.path.join(out, 'campus_stadium_%d.png' % lvl)
        pngs['l%d' % lvl] = os.path.join(out, 'campus_lights_%d.png' % lvl)
        stads[lvl][0].save(pngs['s%d' % lvl], optimize=True)
        stads[lvl][1].save(pngs['l%d' % lvl], optimize=True)
    start = compose(stads, sprites, meta, {'stad': 1, 'club': 1, 'train': 1, 'bld': [], 'plots': ['physio']})
    deco = [['oak', 40, 300], ['maple', 236, 300], ['lamp', 262, 360], ['lamp', 496, 360], ['bench', 300, 384],
            ['bed', 420, 380], ['pine', 650, 160], ['sunflowers', 690, 330], ['statue', 362, 380], ['bus', 660, 400],
            ['willow', 0, 150], ['round', 470, 180], ['sapling', 270, 130]]
    full = compose(stads, sprites, meta, {'stad': 5, 'club': 4, 'train': 4, 'bld': ['physio', 'scouting', 'academy'],
                                          'plots': [], 'deco': deco})
    start.convert('RGB').save(os.path.join(out, 'campus_start.png'), optimize=True)
    full.convert('RGB').save(os.path.join(out, 'campus_full.png'), optimize=True)
    # the five stadiums (the whole of each, against a sky) and the four clubhouses, for the README
    cols = [Image.new('RGBA', (W, SH), (150, 196, 232, 255)) for _ in range(5)]
    for i in range(5):
        rect(cols[i], 0, SF, W, SH, GRASS)
        cols[i].alpha_composite(stads[i + 1][0])
    cl = Image.new('RGBA', (W, 220), GRASS)
    x = 20
    for lvl in range(1, 5):
        s = sprites['club%d' % lvl]
        cl.alpha_composite(s, (x, 210 - s.height))
        x += s.width + 40
    prev = Image.new('RGB', (W, SH * 5 + 220 + 6 * 4), (18, 26, 51))
    for i, c in enumerate(cols + [cl]):
        prev.paste(c.convert('RGB'), (0, i * (SH + 4)))
    prev.save(os.path.join(out, 'campus_levels.png'), optimize=True)
    for k, v in pngs.items():
        print(k, os.path.getsize(v), 'bytes')
    if '--embed-classic' in sys.argv:
        embed(os.path.join(root, 'classic.html'), pngs, meta)

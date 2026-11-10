#!/usr/bin/env python3
"""Football Classic -- the far stands in layers, so a match can fill them to the crowd that came (v186), and the
supporters in them drawn pixel by pixel (v187).

For each of the five grounds this draws the stand with tools/sprites/make_pitch_art.py's own code -- its old little
two-pixel fans left out -- at twice the size, and seats it at that size: rows of steps, and on them supporters seen from
the chest up, the front row up against the wall, men and women with the players' skin tones and hair, quieter in colour
than the men on the pitch and the back rows a touch dimmer, a few with their arms up. Then:

    the stand with every seat taken      -> PITCH_ART
    the stand with nobody in it          -> PITCH_ART_EMPTY
    whose pixel is whose                 -> PITCH_ART_FANS   (a fan's number in the red and green of each of his pixels)

and writes the three into classic.html, and "px":2 into PITCH_ART_META (the strips' pixels to one of the stand's: its
panels and boards are still given in the stand's own). The game keeps as many fans as the gate brought and paints the
empty stand over the rest (see composeFor in classic.html).

    python3 tools/clips/make_stand_layers.py            # embeds into classic.html
    python3 tools/clips/make_stand_layers.py --check    # draws them, embeds nothing
    python3 tools/clips/make_stand_layers.py --sheet out.png   # the five, full and half full, to look at

Needs numpy and Pillow (dev only)."""
import base64, io, json, os, random, re, sys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'sprites'))
import make_pitch_art as P

Z = 2                                   # the strips' pixels to one of the stand's

# ---------------------------------------------------------------------------------------------- the supporters
def hexrgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
def ramp_of(hexc, floor=0.0):
    """the game's rampOf: one picked colour -> [line, shadow, base, light] in its own hue"""
    r, g, b = [v / 255 for v in hexrgb(hexc)]
    mx, mn = max(r, g, b), min(r, g, b); d = mx - mn; h = s = 0.0
    if d:
        s = d / (1 - abs(mx + mn - 1))
        h = ((g - b) / d + (6 if g < b else 0) if mx == r else (b - r) / d + 2 if mx == g else (r - g) / d + 4) / 6
    l = max((mx + mn) / 2, floor)
    def ch(p, q, t):
        t = t % 1
        return p + (q - p) * 6 * t if t < 1 / 6 else q if t < 1 / 2 else p + (q - p) * (2 / 3 - t) * 6 if t < 2 / 3 else p
    def at(L):
        L = min(1, max(0, L)); q = L * (1 + s) if L < 0.5 else L + s - L * s; p = 2 * L - q
        return tuple(int(round(255 * (ch(p, q, t) if s else L))) for t in (h + 1 / 3, h, h - 1 / 3))
    return [at(l - 0.3), at(l - 0.14), at(l), at(l + 0.15)]

SKIN = [['#7c4a48', '#c8907a', '#ecc2a6', '#fde6d8'], ['#784040', '#b87050', '#e0a078', '#f8d0b8'], ['#6c3a2e', '#a86a44', '#cf9666', '#ebbc90'],
        ['#5c3222', '#916036', '#b88252', '#d6a472'], ['#4a2618', '#7a4a2c', '#9c683e', '#bc8858'], ['#38190e', '#5e3620', '#7c4c30', '#9a6844'],
        ['#28110a', '#472618', '#603824', '#7e5034']]                  # the players' skin tones (SKIN_TONES in classic.html)
HAIR = dict(black='#2a2426', darkbrown='#4a3022', brown='#6c462e', chestnut='#8a5432', lightbrown='#a07848', dirtyblonde='#b89458',
            blonde='#dcbc70', ginger='#c0602e', grey='#9a9694')
SHIRTS = ['#d4202a', '#c83838', '#f0f0f0', '#e0e0e4', '#2c3e6b', '#3a7a4a', '#d8b848', '#7a7f8c', '#b06038', '#5a3a7a',
          '#30343c', '#5890c0', '#609bd8', '#d86860']                 # all sorts, a few more reds than anything
OUT = (46, 42, 58)                     # their outline: soft, not the players' black
FACE = ['....aaaaa....', '...aaaaaaa...', '..aaaaaaaaa..', '..aaaaaaaab..', '..aaaaaaaab..', '..aapaaapab..', '..aapaaapab..', '..baaaaaaab..', '...baaaaab...']
HAIRS = {
    'crop':  {1: '....11122....', 2: '...1112222...', 3: '..111222223..', 4: '..222222233..', 5: '..3b.....b3..'},
    'mop':   {0: '.....111.....', 1: '...11112222..', 2: '..111122222..', 3: '..111222223..', 4: '..222222233..', 5: '..223232233..', 6: '..3.......3..'},
    'spiky': {0: '...1..1..2...', 1: '...11112222..', 2: '..111122222..', 3: '..112222223..', 4: '..222222233..', 5: '..3b.....b3..'},
    'afro':  {0: '....22222....', 1: '..212222223..', 2: '.21222222233.', 3: '.12222222333.', 4: '.22222223333.', 5: '.23b.....b33.', 6: '.3.........3.'},
    'bald':  {},
    'flong': {0: '.....111.....', 1: '...11112222..', 2: '..111122222..', 3: '..111222223..', 4: '..222222233..', 5: '..22b...b33..', 6: '..2.......3..', 7: '..2.......3..', 8: '..2.......3..', 9: '..23.....33..'},
    'fbob':  {0: '.....111.....', 1: '...11112222..', 2: '..111122222..', 3: '..111222223..', 4: '..222222233..', 5: '..223232233..', 6: '..2.......3..', 7: '..2.......3..', 8: '..3.......3..'},
    'fpony': {1: '....11122....', 2: '...1112222...', 3: '..1112222232.', 4: '..2222222333.', 5: '..3b.....b33.', 6: '...........3.'},
}
BODY = ['....snnns....', '.Vv.SSssz.Vv.', '.AA.ssszz.AA.']           # his shoulders and his hands on the seat in front
BODY_UP = ['.Vv.snnns.Vv.', '....SSssz....', '....ssszz....']        # arms up: his hands beside his head
FAN_H, FAN_W = 13, 15

def small_fan(R, dim=1.0):
    """one supporter, 13 rows by 15: a head in the players' colouring, his shoulders, his hands"""
    woman = R.random() < 0.42
    style = R.choice(['flong', 'fbob', 'fpony', 'flong'] if woman else ['crop', 'crop', 'mop', 'spiky', 'afro', 'bald', 'mop'])
    tone = min(6, int(R.random() * R.random() * 7.6 + R.random() * 1.4))
    hair = R.choice(['black', 'black', 'darkbrown'] if tone >= 4 else ['darkbrown', 'brown', 'chestnut', 'lightbrown', 'dirtyblonde', 'blonde', 'black', 'ginger', 'grey'])
    sk = [hexrgb(h) for h in SKIN[tone]]; hr = ramp_of(HAIR[hair], 0.12); sh = ramp_of(R.choice(SHIRTS), 0.16)
    up = R.random() < 0.12
    g = [list('.' * 13) for _ in range(FAN_H)]
    for j, row in enumerate(FACE):
        for i, ch in enumerate(row):
            if ch != '.': g[1 + j][i] = ch
    for j, row in HAIRS[style].items():
        for i, ch in enumerate(row):
            if ch != '.': g[j][i] = ch
    for j, row in enumerate(BODY_UP if up else BODY):
        for i, ch in enumerate(row):
            if ch != '.': g[10 + j][i] = ch
    if up:
        for (x, y) in ((1, 7), (1, 8), (2, 8), (11, 7), (11, 8), (10, 8)):
            if g[y][x] == '.': g[y][x] = 'A'
    col = {'a': sk[3], 'b': sk[2], 'n': sk[1], 'A': sk[3], 'p': (58, 40, 38), '1': hr[3], '2': hr[2], '3': hr[1],
           'S': sh[3], 's': sh[2], 'z': sh[1], 'V': sh[3], 'v': sh[2]}
    img = np.zeros((FAN_H, FAN_W, 4), np.uint8)
    for y in range(FAN_H):
        for x in range(13):
            if g[y][x] != '.': img[y, x + 1] = (*col[g[y][x]], 255)
    a = img[:, :, 3] > 0
    for y in range(FAN_H):                               # the outline round him
        for x in range(FAN_W):
            if a[y, x]: continue
            if any(0 <= y + dy < FAN_H and 0 <= x + dx < FAN_W and a[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                img[y, x] = (*OUT, 255)
    f = img.astype(float); grey = np.array([150, 150, 150.0])
    f[:, :, :3] = (f[:, :, :3] * 0.86 + grey * 0.14) * dim     # quieter than the players
    return f.astype(np.uint8)

# ---------------------------------------------------------------------------------------------- the stands
STEPS = {'timber': ((214, 200, 168), (196, 182, 150), (160, 146, 120)), 'metal': ((204, 210, 220), (176, 184, 198), (120, 128, 146)),
         'conc': ((200, 200, 204), (180, 180, 186), (134, 134, 146))}

class Stand:
    """the doubled strip twice over -- full and empty -- and whose each pixel is"""
    def __init__(self, base):
        self.full, self.empty = base.copy(), base.copy()
        self.ids = np.zeros((base.size[1], base.size[0]), np.int32); self.n = 0
    def rect(self, box, fill):                          # something in front of the crowd (a wall, a post): on both, nobody's
        for im in (self.full, self.empty): ImageDraw.Draw(im).rectangle(box, fill=fill)
        x0, y0, x1, y1 = box; self.ids[max(0, y0):y1 + 1, max(0, x0):x1 + 1] = 0
    def line(self, xy, fill):
        for im in (self.full, self.empty): ImageDraw.Draw(im).line(xy, fill=fill)
    def fan(self, spr, x, y):
        self.n += 1; self.full.alpha_composite(Image.fromarray(spr, 'RGBA'), (x, y))
        a = spr[:, :, 3] > 0; H, W = self.ids.shape
        ys, xs = np.nonzero(a); ys, xs = ys + y, xs + x; k = (xs >= 0) & (xs < W) & (ys >= 0) & (ys < H)
        self.ids[ys[k], xs[k]] = self.n                  # (a fan in front over the one behind)

def rows_into(st, R, x0, x1, y0, n, pitch, kind, wall=None):
    """n rows of steps between x0 and x1, the back row's top at y0, a supporter in every seat (the back rows first, so the
    rows in front sit over them), each seen head and shoulders; then a wall along the front, if there is one"""
    pal = STEPS[kind]
    for k in range(n):
        top = y0 + k * pitch
        st.rect([x0, top, x1 - 1, top + pitch - 1], pal[1] if k % 2 else pal[0]); st.line([(x0, top), (x1 - 1, top)], pal[2])
    for k in range(n):
        top = y0 + k * pitch; dim = 0.86 + 0.14 * (k + 1) / n
        x = x0 + 2 + (7 if k % 2 else 0)
        while x < x1 - FAN_W:
            st.fan(small_fan(R, dim), x, top + pitch - FAN_H)
            x += 14 + R.choice([0, 0, 1])
    if wall:
        y, h, c1, c2 = wall
        st.rect([x0, y, x1 - 1, y + h - 1], c1); st.line([(x0, y), (x1 - 1, y)], c2); st.line([(x0, y + h - 1), (x1 - 1, y + h - 1)], (49, 56, 82))

def base(level):
    """the stand as make_pitch_art draws it, its own little fans left out, doubled"""
    fan = P.fan; P.fan = lambda *a, **k: None
    try:
        cv = P.Canvas(P.SW, P.SH); P.DRAW[level](cv, random.Random(11 + level))
    finally:
        P.fan = fan
    for x in range(P.SW):                                # row 42: clear (the game draws the boards and their shadow)
        cv.px[x, 42] = (0, 0, 0, 0)
    return cv.im.convert('RGBA').resize((P.SW * Z, P.SH * Z), Image.NEAREST)

def layers(level):
    """(full strip, empty strip, fan map, how many fans) for one ground, all doubled"""
    st, R = Stand(base(level)), random.Random(5 + level)
    sx = lambda wx: round(P.sx(wx)) * Z
    white = (70, 6, (240, 240, 244), (255, 255, 255))
    if level == 1:
        rows_into(st, R, sx(P.FW / 2 - 520), sx(P.FW / 2 + 520), 37, 3, 11, 'metal', wall=white)
    elif level == 2:
        rows_into(st, R, sx(P.FW / 2 - 1150), sx(P.FW / 2 + 1150), 26, 4, 11, 'metal', wall=white)
    elif level == 3:
        rows_into(st, R, sx(-60), sx(P.FW + 60), 28, 3, 13, 'conc')
        x = float(sx(-60))                               # the roof's posts, in front of the crowd
        while x < sx(P.FW + 60):
            st.rect([round(x), 26, round(x) + 3, 44], (120, 128, 146)); x += 12 * 25 * P.K * Z
    elif level == 4:
        rows_into(st, R, sx(P.STAND[0]), sx(P.STAND[1]), 30, 3, 13, 'timber')
    else:
        W = P.SW * Z
        rows_into(st, R, 0, W, 16, 2, 13, 'conc')        # the upper tier
        rows_into(st, R, 0, W, 56, 1, 16, 'conc')        # and the lower
    m = np.zeros((st.ids.shape[0], st.ids.shape[1], 4), np.uint8)
    on = st.ids > 0
    m[on, 0] = st.ids[on] >> 8; m[on, 1] = st.ids[on] & 255; m[on, 3] = 255
    return st.full, st.empty, Image.fromarray(m, 'RGBA'), int(len(np.unique(st.ids[on])))

def data_url(im):
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

def embed(html_path, art):
    src = open(html_path, encoding='utf-8').read()
    lines, hits = src.split('\n'), set()
    for i, line in enumerate(lines):
        lead = line[:len(line) - len(line.lstrip())]
        for k in art:
            if line.lstrip().startswith('const %s = ' % k):
                v = art[k]
                if k == 'PITCH_ART_META':                # (the meta as it was, with the strips' scale in it)
                    v = json.loads(re.match(r'\s*const PITCH_ART_META = (\{.*\});\s*$', line).group(1)); v['px'] = Z
                lines[i] = lead + 'const %s = %s;' % (k, json.dumps(v, separators=(',', ':')))
                hits.add(k)
    assert hits == set(art), 'not found in %s: %s' % (html_path, sorted(set(art) - hits))
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

def sheet(all_layers, path):
    """the five, every seat taken over half of them taken, to look at"""
    rows = []
    for lv, (full, empty, fans, n) in all_layers.items():
        half = np.array(full).copy(); e = np.array(empty); ids = np.array(fans)
        fid = ids[:, :, 0].astype(int) << 8 | ids[:, :, 1]; gone = (ids[:, :, 3] > 0) & ((fid * 2654435761 % 4294967296) / 4294967296 >= 0.5)
        half[gone] = e[gone]
        for im in (np.array(full), half): rows.append(im)
    W = rows[0].shape[1]; mid = W // 2; w = 900; gap = 6
    out = np.zeros((sum(r.shape[0] + gap for r in rows), w, 4), np.uint8); out[:, :] = (24, 40, 30, 255)
    y = 0
    for r in rows:
        crop = r[:, mid - w // 2: mid + w // 2].astype(float); a = crop[:, :, 3:4] / 255.0
        bg = np.zeros_like(crop); bg[:, :] = (88, 170, 104, 255)
        out[y:y + r.shape[0]] = (crop * a + bg * (1 - a)).astype(np.uint8); y += r.shape[0] + gap
    Image.fromarray(out, 'RGBA').resize((w * 2, out.shape[0] * 2), Image.NEAREST).save(path)

if __name__ == '__main__':
    art = {'PITCH_ART': {}, 'PITCH_ART_EMPTY': {}, 'PITCH_ART_FANS': {}, 'PITCH_ART_META': None}
    got = {}
    for lv in P.LEVELS:
        full, empty, fans, n = got[lv] = layers(lv)
        art['PITCH_ART'][str(lv)], art['PITCH_ART_EMPTY'][str(lv)], art['PITCH_ART_FANS'][str(lv)] = data_url(full), data_url(empty), data_url(fans)
        print('level', lv, 'fans', n, 'strip', full.size)
    if '--sheet' in sys.argv:
        sheet(got, sys.argv[sys.argv.index('--sheet') + 1]); print('wrote', sys.argv[sys.argv.index('--sheet') + 1])
    elif '--check' not in sys.argv:
        embed(os.path.join(ROOT, 'classic.html'), art)
        print('embedded ->', os.path.join(ROOT, 'classic.html'), sum(len(v) for d in art.values() if d for v in d.values()), 'base64 chars')

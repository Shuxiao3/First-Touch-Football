#!/usr/bin/env python3
"""Football Classic -- the players, drawn by hand (v187; v188: every body frame by hand too).

Every man on the pitch is put together from parts, drawn pixel by pixel in the style of the old overworld sprites: a
head wider than it's tall with a three-tone thatch, a body eight rows high with the hands out at its sides, a black
line softened to navy on top and to the skin's own maroon round the hands and the cheeks.

    players_art/base.txt        the bald head in five views (S, SE, E, NE, N; the other three are mirrors)
    players_art/hair_*.txt      a hairstyle laid over it, the same five views
    players_art/over.txt        the beard and the headband
    players_art/frames.txt      every outfield body frame -- standing, running, shooting, passing, the slide and up
                                off the turf -- in the five views, outline and all
    players_art/keepers.txt     the keeper's own: set, the ball in his gloves, the dive, going down big

A keeper's run, side-step and kick are the outfield frames with gloves for his hands; his dive the other way is the
one drawn, mirrored, and down the picture it's turned over.

    python3 tools/clips/make_players.py                 # builds the lot and embeds it in classic.html
    python3 tools/clips/make_players.py --sheet out.png # a sheet to look at; embeds nothing

It writes PLAYER_BODY (the outfield sheet, no heads), PLAYER_HEADS (every hairstyle and overlay, five views),
PLAYER_PARTS (where the head goes in each cell, and the drawn palette), KEEPER_SHEET (the keepers' sheet, no heads)
and KEEPER_SHEET_PAL (its rows, and where the head goes in each of its cells).

Needs numpy and Pillow (dev only)."""
import sys, os, re, math, json, io, base64
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
ART = os.path.join(HERE, 'players_art')

CELL = 32
HW, HH = 21, 19       # a head's grid; standing, its top-left sits at (5, 2) in the cell (frames.txt says, frame by frame)

# ---- palette: the game's drawn ramps [line, shadow, base, light], so its kit and look swaps still work
RAMPS = {'skin': [(120, 64, 64), (184, 112, 80), (224, 160, 120), (248, 208, 184)],
         'shirt': [(40, 40, 104), (48, 72, 160), (72, 112, 216), (128, 168, 240)],
         'trim': [(112, 112, 128), (176, 176, 192), (224, 224, 236), (255, 255, 255)],
         'shorts': [(72, 72, 96), (152, 160, 184), (216, 220, 232), (248, 248, 248)],
         'boots': [(16, 16, 24), (44, 44, 56), (72, 72, 92), (144, 144, 168)]}
RAMPS['socks'] = RAMPS['shirt']               # (socks in the shirt's colours: a kit swap recolours both)
RAMPS['gloves'] = [(64, 68, 76), (184, 190, 198), (232, 236, 240), (252, 253, 254)]
RAMPS['ball'] = [(28, 30, 26), (164, 170, 158), (236, 240, 230), (250, 251, 246)]
BLACK = (0, 0, 0); SOFT = (52, 58, 96)       # the outline, and its softer navy on the lit edges
HEAD_PAL = {'K': BLACK, 'k': SOFT, 'D': (56, 36, 32), '1': (156, 104, 64), '2': (108, 70, 46), '3': (70, 44, 36),
            'a': (248, 208, 184), 'b': (224, 160, 120), 'c': (184, 112, 80), 'r': (120, 64, 64),
            'l': (168, 160, 200), 'i': (88, 136, 112), 'w': (240, 240, 248), 'p': BLACK,
            't': RAMPS['trim'][3], 'u': RAMPS['trim'][2], 'v': RAMPS['trim'][1]}

VIEWS = ['S', 'SE', 'E', 'NE', 'N']
def read_grids(fn):
    out, cur = {}, None
    for line in open(os.path.join(ART, fn)):
        line = line.rstrip('\n')
        m = re.match(r'^#\s*(\w+)\s+(\w+)', line)
        if m: cur = (m.group(1), m.group(2)); out[cur] = []; continue
        if cur and line.strip(): out[cur].append(line)
    for k, rows in out.items():
        assert len(rows) == HH and all(len(r) == HW for r in rows), '%s %s: %s' % (fn, k, [(i, len(r)) for i, r in enumerate(rows) if len(r) != HW] or len(rows))
    return out

def load_heads():
    """every style in every view: the bald base head with the style's hair laid over it ('.' in a hair grid keeps the base)"""
    base = read_grids('base.txt'); heads = {}
    for v in VIEWS: heads[('bald', v)] = base[('base', v)]
    for fn in sorted(os.listdir(ART)):
        if not fn.startswith('hair_'): continue
        for (style, v), rows in read_grids(fn).items():
            b = base[('base', v)]
            heads[(style, v)] = [''.join(h if h != '.' else c for h, c in zip(hr, br)) for hr, br in zip(rows, b)]
    return heads

# ---- the bodies, every frame drawn by hand: a letter a pixel, each a colour of the drawn palette (see frames.txt)
PX = {'K': BLACK, 'k': SOFT, 'r': RAMPS['skin'][0],
      'Y': RAMPS['shirt'][0], 'z': RAMPS['shirt'][1], 's': RAMPS['shirt'][2], 'S': RAMPS['shirt'][3],
      't': RAMPS['trim'][1], 'T': RAMPS['trim'][2], 'U': RAMPS['trim'][3],
      'L': RAMPS['shorts'][0], 'j': RAMPS['shorts'][1], 'h': RAMPS['shorts'][2], 'H': RAMPS['shorts'][3],
      'e': RAMPS['skin'][1], 'a': RAMPS['skin'][2], 'A': RAMPS['skin'][3],
      'o': RAMPS['socks'][1], 'O': RAMPS['socks'][2], 'Q': RAMPS['socks'][3],
      'v': RAMPS['boots'][0], 'b': RAMPS['boots'][1], 'B': RAMPS['boots'][2], 'V': RAMPS['boots'][3],
      'q': RAMPS['gloves'][1], 'g': RAMPS['gloves'][2], 'G': RAMPS['gloves'][3],
      'X': RAMPS['ball'][0], 'x': RAMPS['ball'][1], 'w': RAMPS['ball'][2], 'W': RAMPS['ball'][3]}

def read_frames(fn):
    """'# animation frame view hx hy headview' then 'row|pixels' -> {(animation, frame, view): {at, hv, rows}}"""
    out, cur = {}, None
    for line in open(os.path.join(ART, fn)):
        line = line.rstrip('\n')
        m = re.match(r'^#\s*(\w+)\s+(\d+)\s+(\w+)\s+(-?\d+)\s+(-?\d+)\s*(\w*)\s*$', line)
        if m:
            cur = (m.group(1), int(m.group(2)), m.group(3))
            out[cur] = dict(at=(int(m.group(4)), int(m.group(5))), hv=m.group(6) or m.group(3), rows={}); continue
        m = re.match(r'^(\d+)\|(.*)$', line)
        if cur and m:
            s = m.group(2).rstrip().rstrip('.')
            assert len(s) <= CELL, '%s %s row %s: %d wide' % (fn, cur, m.group(1), len(s))
            assert all(c == '.' or c in PX for c in s), '%s %s row %s: %r' % (fn, cur, m.group(1), sorted(set(s) - set(PX) - {'.'}))
            out[cur]['rows'][int(m.group(1))] = s.ljust(CELL, '.')
    return out

def paint(rows):
    img = np.zeros((CELL, CELL, 4), np.uint8)
    for y, row in rows.items():
        if not 0 <= y < CELL: continue
        for x, ch in enumerate(row):
            if ch != '.': img[y, x] = (*PX[ch], 255)
    return img

def mirror(c): return c[:, ::-1].copy()
DIRS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE']
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
VI = {v: i for i, v in enumerate(VIEWS)}

def drawn(fr, d, flip=None):
    """one frame as a cell with no head on it, and where its head goes: [x, y, view, mirrored]"""
    hx, hy = fr['at']; c = paint(fr['rows']); flip = (d in MIRROR) if flip is None else flip
    return (mirror(c), [CELL - (hx + HW), hy, VI[fr['hv']], 1]) if flip else (c, [hx, hy, VI[fr['hv']], 0])

def gloved(fr):
    """an outfield frame with a keeper's gloves for his hands: the skin above his knees goes glove-white, its line black"""
    rows = dict(fr['rows'])
    shorts = [y for y, r in rows.items() if any(c in 'Hhj' for c in r)]
    top = max(shorts) if shorts else CELL
    hand = {}
    for y, r in rows.items():
        if y > top: continue
        for x, c in enumerate(r):
            if c in 'Aae': hand[(x, y)] = {'A': 'G', 'a': 'g', 'e': 'q'}[c]
    out = {}
    for y, r in rows.items():
        r = list(r)
        for x, c in enumerate(r):
            if (x, y) in hand: r[x] = hand[(x, y)]
            elif c == 'r' and any((x + dx, y + dy) in hand for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): r[x] = 'K'
        out[y] = ''.join(r)
    return dict(fr, rows=out)

def pack(rows, cols=4):
    """rows of (cell, head spot) -> the sheet and its table of head spots"""
    blank = np.zeros((CELL, CELL, 4), np.uint8)
    img = np.concatenate([np.concatenate([c for c, _ in r] + [blank] * (cols - len(r)), axis=1) for r in rows], axis=0)
    return img, [[a for _, a in r] + [None] * (cols - len(r)) for r in rows]

OUTFIELD = [('idle', 1), ('run', 4), ('shoot', 2), ('pass', 2), ('slide', 2)]   # (the slide's second frame: up off the turf)
def outfield_sheet():
    F = read_frames('frames.txt'); rows = []
    for name, n in OUTFIELD:
        for d in DIRS:
            rows.append([drawn(F[(name, i, MIRROR.get(d, d))], d) for i in range(n)])
    return pack(rows)

GK_ROWS = {'ready': 0, 'shuffle': 8, 'run': 16, 'hold': 24, 'kick': 32, 'dive': 40, 'spread': 44}
GK_FRAMES = {'ready': 1, 'shuffle': 2, 'run': 4, 'hold': 1, 'kick': 1, 'dive': 2, 'spread': 2}
DIVE_LIFT = 5         # in the air he's this many pixels off the turf; down, he lies on it
def shifted(fr, dy):
    return dict(fr, at=(fr['at'][0], fr['at'][1] + dy), rows={y + dy: r for y, r in fr['rows'].items()})
def turned_over(fr):
    """the dive up the picture turned over to go down it: his body and legs flipped top to bottom about his middle, his
    gloves kept ahead of his face, his head lower"""
    rows, gl = {}, {}
    for y, r in fr['rows'].items():
        body = ''.join(c if c not in 'Ggq' and not (c == 'K' and x >= 24) else '.' for x, c in enumerate(r))
        glove = ''.join(c if (c in 'Ggq' or (c == 'K' and x >= 24)) else '.' for x, c in enumerate(r))
        rows[39 - y] = body; gl[y + 11] = glove
    out = {}
    for y in set(rows) | set(gl):
        a, b = rows.get(y, '.' * CELL), gl.get(y, '.' * CELL)
        out[y] = ''.join(q if q != '.' else p for p, q in zip(a, b))
    return dict(fr, at=(fr['at'][0], fr['at'][1] + 5), rows=out)
def keeper_sheet():
    F = read_frames('frames.txt'); K = read_frames('keepers.txt'); rows = []
    v = lambda d: MIRROR.get(d, d)
    for d in DIRS: rows.append([drawn(K[('ready', 0, v(d))], d)])
    for d in DIRS: rows.append([drawn(K[('ready', 0, v(d))], d), drawn(gloved(F[('idle', 0, v(d))]), d)])   # side-stepping: set, then feet together
    for d in DIRS: rows.append([drawn(gloved(F[('run', i, v(d))]), d) for i in range(4)])
    for d in DIRS: rows.append([drawn(K[('hold', 0, v(d))], d)])
    for d in DIRS: rows.append([drawn(gloved(F[('shoot', 1, v(d))]), d)])
    up = K[('diveup', 0, 'E')]; down = turned_over(up)
    for fr, flip in ((up, False), (down, False), (up, True), (down, True)):    # up the picture and down it, facing E; then W
        rows.append([drawn(shifted(fr, -DIVE_LIFT), 'E', flip), drawn(fr, 'E', flip)])
    for flip in (False, True):                                                 # his right knee down, then his left
        rows.append([drawn(K[('spread', i, 'S')], 'S', flip) for i in range(2)])
    return pack(rows)

STYLES = ['mop', 'crop', 'bald', 'afro', 'spiky', 'mohawk', 'side']
OVERLAYS = ['beard', 'band']
def head_atlas():
    """every style then every overlay, a row each; the five views across. -> (image, {name/view: [0, 0, w, h]})"""
    heads = load_heads(); over = read_grids('over.txt'); names = STYLES + OVERLAYS
    img = np.zeros((len(names) * HH, len(VIEWS) * HW, 4), np.uint8); rect = {}
    for r, n in enumerate(names):
        for c, v in enumerate(VIEWS):
            g = heads[(n, v)] if n in STYLES else over[(n, v)]; any_px = False
            for j, row in enumerate(g):
                for i, ch in enumerate(row):
                    if ch != '.': img[r * HH + j, c * HW + i] = (*HEAD_PAL[ch], 255); any_px = True
            rect[n + '/' + v] = [0, 0, HW, HH] if any_px else [0, 0, 0, 0]
    return img, rect

def put_heads(sheet, at, atlas, style, overlays=()):
    """the sheet with a style's head (and overlays) in every cell, as the game puts them on"""
    out = sheet.copy(); names = STYLES + OVERLAYS
    for r, row in enumerate(at):
        for f, a in enumerate(row):
            if not a: continue
            hx, hy, vi, mir = a
            for n in (style,) + tuple(overlays):
                h = atlas[names.index(n) * HH:(names.index(n) + 1) * HH, vi * HW:(vi + 1) * HW]
                if mir: h = h[:, ::-1]
                for j in range(HH):
                    for i in range(HW):
                        y, x = hy + j, hx + i
                        if h[j, i, 3] and 0 <= y < CELL and 0 <= x < CELL: out[r * CELL + y, f * CELL + x] = h[j, i]
    return out

hexr = lambda ramp: ['#%02x%02x%02x' % tuple(c) for c in ramp]
def drawn_palette():
    d = {m: hexr(RAMPS[m]) for m in ('shirt', 'trim', 'shorts', 'boots')}
    d['hair'] = hexr([HEAD_PAL[k] for k in 'D321']); d['skin'] = hexr([HEAD_PAL[k] for k in 'rcba'])
    d['lid'] = hexr([HEAD_PAL['l']]); d['iris'] = hexr([HEAD_PAL['i']])
    return d

def png_url(arr):
    b = io.BytesIO(); Image.fromarray(arr, 'RGBA').save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

def build():
    body, at = outfield_sheet(); gk, gk_at = keeper_sheet(); atlas, rect = head_atlas(); drawn = drawn_palette()
    parts = {'cell': CELL, 'views': VIEWS, 'styles': STYLES, 'overlays': OVERLAYS, 'atlas': {'w': HW, 'h': HH}, 'baseW': HW,
             'heads': rect, 'at': at, 'drawn': drawn}
    gk_pal = {'drawn': {m: drawn[m] for m in ('shirt', 'trim', 'shorts', 'boots', 'hair')}, 'rows': GK_ROWS, 'frames': GK_FRAMES, 'at': gk_at}
    return dict(body=body, at=at, gk=gk, gk_at=gk_at, atlas=atlas, parts=parts, gk_pal=gk_pal)

def embed(html_path, A):
    js = lambda v: json.dumps(v, separators=(',', ':'))
    want = {'const PLAYER_BODY = ': js(png_url(A['body'])), 'const PLAYER_HEADS = ': js(png_url(A['atlas'])), 'const PLAYER_PARTS = ': js(A['parts']),
            'const KEEPER_SHEET = ': js(png_url(A['gk'])), 'const KEEPER_SHEET_PAL = ': js(A['gk_pal'])}
    lines, hits = open(html_path, encoding='utf-8').read().split('\n'), set()
    for i, line in enumerate(lines):
        lead = line[:len(line) - len(line.lstrip())]
        for k, v in want.items():
            if line.lstrip().startswith(k): lines[i] = lead + k + v + ';'; hits.add(k)
    assert hits == set(want), 'not found in %s: %s' % (html_path, sorted(set(want) - hits))
    with open(html_path, 'w', encoding='utf-8') as f: f.write('\n'.join(lines))

def look_sheet(A, path, z=4):
    """something to look at: every style on the outfield sheet's standing row, then the whole of two sheets"""
    bg = (58, 132, 80, 255); tiles = []
    for st in STYLES:
        for ov in ((), ('beard',), ('band',), ('beard', 'band')):
            s = put_heads(A['body'][:8 * CELL], A['at'][:8], A['atlas'], st, ov)
            tiles.append(np.concatenate([s[r * CELL:(r + 1) * CELL, :CELL] for r in range(8)], axis=1))
    top = np.concatenate(tiles, axis=0)
    full = put_heads(A['body'], A['at'], A['atlas'], 'crop'); gk = put_heads(A['gk'], A['gk_at'], A['atlas'], 'mop', ('band',))
    def fold(sh, per):                                   # rows of cells side by side, `per` rows of the sheet a line
        n = sh.shape[0] // CELL; lines = []
        for a in range(0, n, per):
            seg = [sh[r * CELL:(r + 1) * CELL] for r in range(a, min(n, a + per))]
            seg += [np.zeros_like(seg[0])] * (per - len(seg)); lines.append(np.concatenate(seg, axis=1))
        return np.concatenate(lines, axis=0)
    parts = [top, fold(full, 2), fold(gk, 2)]; W = max(p.shape[1] for p in parts)
    can = Image.new('RGBA', (W * z, sum(p.shape[0] for p in parts) * z + 8 * (len(parts) - 1)), bg); y = 0
    for p in parts:
        im = Image.fromarray(p, 'RGBA').resize((p.shape[1] * z, p.shape[0] * z), Image.NEAREST); can.alpha_composite(im, (0, y)); y += p.shape[0] * z + 8
    can.save(path)

if __name__ == '__main__':
    A = build()
    print('outfield sheet', A['body'].shape[1], 'x', A['body'].shape[0], '| keepers', A['gk'].shape[1], 'x', A['gk'].shape[0], '| heads', A['atlas'].shape[1], 'x', A['atlas'].shape[0])
    if '--sheet' in sys.argv:
        look_sheet(A, sys.argv[sys.argv.index('--sheet') + 1]); print('wrote', sys.argv[sys.argv.index('--sheet') + 1])
    else:
        embed(os.path.join(ROOT, 'classic.html'), A); print('embedded ->', os.path.join(ROOT, 'classic.html'))

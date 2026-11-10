#!/usr/bin/env python3
"""Football Classic -- the players, redrawn (v187).

Every man on the pitch is put together from parts, as before, but the parts are drawn by hand now, in the style of
the old overworld sprites: a head wider than it's tall with a three-tone thatch, a body eight rows high with the
hands out at its sides, a black line softened to navy on top and to the skin's own maroon round the hands.

    players_art/base.txt        the bald head in five views (S, SE, E, NE, N; the other three are mirrors)
    players_art/hair_*.txt      a hairstyle laid over it, the same five views
    players_art/over.txt        the beard and the headband
    players_art/bodies.txt      the bodies no rig can pose: the slide, the keeper's dive and spread, the ball in his gloves

The standing, running, shooting and passing bodies come off a small pixel rig posed from the old sheet's skeleton
(tools/sprites/make_player_sheet.py, read and not changed): a torso stamped from a few fixed rows, legs three wide that
step a pixel sideways a row at most, a two-row boot, a 2x2 hand (a keeper's glove is 3x3).

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
sys.path.insert(0, os.path.join(ROOT, 'tools', 'sprites'))
import make_player_sheet as M

CELL = 32; PAD = 10; CAN = CELL + 2 * PAD
CXF = 15.5            # the figure's centre line: the middle of cell column 15
GROUND = 30.0         # the ground: the bottom edge of cell row 29
HEAD_X0, HEAD_Y0 = 5, 2     # where a head grid's top-left sits in the cell at rest
HW, HH = 21, 19

# ---- palette: the game's drawn ramps [line, shadow, base, light], so its kit and look swaps still work
RAMPS = {k: list(v) for k, v in M.RAMPS.items()}
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

# ---- the skeleton on screen: flat (no depth in the row), the arms carried just outside the torso
ARM_OUT = 5.5 / M.SH_W
STRIDE = 1.8          # how much wider than the skeleton's the legs swing, seen side on
LEG_AHEAD = 0.3       # side on, the near leg this far ahead of the far one for each pixel of depth between them
LEG_TILT = 0.45       # toward or away from you: a leg forward reaches this much lower for each pixel forward
def joints(pose, phi, tilt=0.0):
    J = M.build_skeleton(pose); Rw = M.local_to_world_matrix(phi); out = {}
    ch = J['chest']
    for k, v in J.items():
        if k in ('Rp', 'Rt'): continue
        v = np.array(v, float)
        if k[:3] in ('sho', 'elb', 'wri', 'han'):       # push the whole arm out sideways from the chest
            side = 1 if k.endswith('R') else -1
            lat = J['Rt'] @ np.array([side * M.SH_W * (ARM_OUT - 1), 0, 0])
            v = v + lat
        w = Rw @ v
        out[k] = [CXF + w[0], GROUND - w[2] + tilt * w[1], w[1]]
    # the stride: side on, the legs swing wider than the little skeleton's (the references' step is eight pixels from
    # foot to foot) and the near leg stands a touch ahead of the far one; toward or away from you, the leg coming
    # forward reaches lower on the screen and the one going back is drawn shorter
    side = abs(math.cos(phi))
    for s in 'RL':
        hx, hy, hz = out['hip' + s]
        for k in ('knee', 'ankle', 'toe', 'heel'):
            q = out[k + s]
            q[0] = hx + (q[0] - hx) * (1 + (STRIDE - 1) * side) + LEG_AHEAD * hz * math.cos(phi)
            q[1] += LEG_TILT * (q[2] - hz) * (1 - side)
        out['hip' + s][0] += LEG_AHEAD * hz * math.cos(phi)
    if 0.2 < side < 0.9:
        # turned half away: the legs side by side under him, close together (not splayed), the far one in shade; a
        # foot stays under its own hip unless it's swung
        for s in 'RL':
            hx = out['hip' + s][0]; nx = CXF + (1.5 if hx > CXF else -1.5)
            for k in ('knee', 'ankle', 'toe', 'heel'):
                q = out[k + s]; dxk = q[0] - hx
                q[0] = nx + (dxk if abs(out['ankle' + s][0] - hx) > 1.0 else 0.0)
            out['hip' + s][0] = nx
    return {k: tuple(v) for k, v in out.items()}

def span2(xc):
    """left column of a 2 px span centred as near xc as whole pixels allow, mirrored about the centre line"""
    u = xc - CXF; m = abs(u); s = 1 if u >= 0 else -1
    h = 0.5 if m < 1.0 else math.floor(m - 1e-3) + 0.5      # (a tie goes toward the centre line)
    c = CXF + s * h
    return int(round(c - 1.0))

class Frame:
    def __init__(self):
        self.px = {}          # (x, y) -> [mat, tone, part]
    def put(self, x, y, mat, tone, part):
        self.px[(x, y)] = [mat, tone, part]

def limb(F, pts, mats, part, far=False, w=2):
    """a 2 px limb along a polyline of screen points; mats(d_end) -> (material, tone pair) by distance from its end"""
    total = sum(math.dist(pts[i][:2], pts[i + 1][:2]) for i in range(len(pts) - 1))
    run = 0.0
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i][:2], pts[i + 1][:2]
        dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy)
        if abs(dy) >= abs(dx):
            lo, hi = (y0, y1) if y0 <= y1 else (y1, y0)
            for row in range(int(math.floor(lo)), int(math.ceil(hi)) + 1):
                yc = row + 0.5
                if not (lo <= yc < hi): continue
                t = (yc - y0) / dy; xc = x0 + dx * t
                d_end = total - (run + L * t)
                m = mats(d_end); xl = span2(xc)
                for j in range(w):
                    tone = m[1][j] - (1 if far and m[1][j] > 1 else 0)
                    F.put(xl + j, row, m[0], tone, part)
        else:
            lo, hi = (x0, x1) if x0 <= x1 else (x1, x0)
            for col in range(int(math.floor(lo)), int(math.ceil(hi)) + 1):
                xc = col + 0.5
                if not (lo <= xc < hi): continue
                t = (xc - x0) / dx; yc = y0 + dy * t
                d_end = total - (run + L * t)
                m = mats(d_end); yt = int(math.floor(yc - 0.5))
                for j in range(w):
                    tone = m[1][j] - (1 if far and m[1][j] > 1 else 0)
                    F.put(col, yt + j, m[0], tone, part)
        run += L

def leg_mats(d):      # from the ankle up: sock, knee, then the shorts' leg
    if d < 1.25: return ('socks', (2, 1))
    if d < 2.3: return ('skin', (3, 2))
    return ('shorts', (2, 1))
STAMPS = {
    'S':  dict(shirt=['.tnnnt.', '3322221', '2222211'], shorts=['2222221', '221L221'], w=7),
    'SE': dict(shirt=['..tnnt', '332211', '222111'], shorts=['222211', '22L211'], w=6),
    'E':  dict(shirt=['...tn.', '332221', '222211'], shorts=['222221', '222211'], w=6),
    'NE': dict(shirt=['.t22t.', '332211', '222111'], shorts=['222211', '22L211'], w=6),
    'N':  dict(shirt=['.t222t.', '3322221', '2222211'], shorts=['2222221', '221L221'], w=7),
}
def stamp(F, rows, x0, y0, mat, part):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == '.': continue
            if ch == 't': F.put(x0 + i, y0 + j, 'trim', 2, part)
            elif ch == 'n': F.put(x0 + i, y0 + j, 'skin', 1, part)
            elif ch == 'L': F.put(x0 + i, y0 + j, mat, 0, part)
            else: F.put(x0 + i, y0 + j, mat, int(ch), part)

def leg(F, J, s, part, far, top, ground=True, side=0.0):
    """a leg in whole pixels: two wide, a row at a time from under the shorts (row `top`) down to the boot, stepping a
    pixel sideways at most each row -- skin at the knee, the sock above the boot; a foot off the ground makes a shorter
    leg. Only a leg out near level (a kick, a slide) is drawn along its length instead."""
    hx, hy = J['hip' + s][:2]; ax, ay = J['ankle' + s][:2]; tx = J['toe' + s][0]; hlx = J['heel' + s][0]
    dn = 1 if far else 0
    brow = max(top, min(28 + J.get('_bob', 0), int(math.floor(ay - 1.1))))   # the boot's top row: a boot is two rows
    n = brow - top                                         # leg rows over the boot
    if abs(ax - hx) > (n + 1) * 1.6 + 0.6 and ay < hy + 1.2:   # out level: along its length
        limb(F, [(hx, hy), J['knee' + s][:2], (ax, ay)], leg_mats, part, far)
        F.put(int(math.floor(ax)), int(math.floor(ay - 0.5)), 'boots', 2 - dn, part); F.put(int(math.floor(ax)), int(math.floor(ay - 0.5)) + 1, 'boots', 1, part)
        return
    lim = (n + 1) * 1.0                                   # (a pixel sideways a row at most: the boot stays under the leg)
    ax = hx + max(-lim, min(lim, ax - hx))
    span3 = lambda xc: int(math.floor(xc)) - 1           # a sturdy leg, three wide, on the pixel its middle is in
    for i, y in enumerate(range(top, brow)):
        t = (i + 1.0) / (n + 1.0); xl = span3(hx + (ax - hx) * t)
        mat = ('socks', (2, 2, 1)) if y == brow - 1 else ('skin', (3, 3, 2))
        for j in range(3): F.put(xl + j, y, mat[0], max(1, mat[1][j] - dn), part)
    xl = span3(ax); cols = [xl, xl + 1, xl + 2]
    if side > 0.2 and abs(tx - hlx) > 0.8: cols = cols + [xl + 3] if tx > hlx else [xl - 1] + cols   # side on: the toe ahead
    body = [xl, xl + 1, xl + 2]
    for c in body: F.put(c, brow, 'boots', 1 if far else 2, part)          # the boot: over the ankle, then the sole a pixel longer at the toe
    for i, c in enumerate(cols): F.put(c, brow + 1, 'boots', 1 if far or (c in body and c != body[0]) else 2, part)

ARM_LEN = 2.75
ARM_SWING = 0.55
GLOVE3 = [(3, 3, 2), (3, 2, 2), (2, 2, 1)]
def arm(F, J, s, part, far, top, gk=False):
    """the sleeve on the shoulder row, the forearm, and a 2x2 hand at the end of an arm of one length whichever way
    it points; where it lies over the body, a line down the side of it that has more of the body showing"""
    (sx, _), (hx, hy) = J['sho' + s][:2], J['hand' + s][:2]; sy = J['sho' + s][1]
    dn = 1 if far else 0
    vx, vy = hx - sx, hy - sy
    vy -= ARM_SWING * abs(J['hand' + s][2] - J['sho' + s][2]) * J.get('_front', 0.0)   # toward or away from you: an arm swung forward or back comes up
    L = math.hypot(vx, vy) or 1.0
    y_s = top + 1.0                                        # the top of the sleeve's row
    hx2, hy2 = sx + vx / L * ARM_LEN, y_s + vy / L * ARM_LEN
    xl = span2(sx); px = [(xl, top + 1, 'shirt', 3 - dn), (xl + 1, top + 1, 'shirt', 2 - dn)]
    if vy < -0.3 * L: px = [(xl, top, 'shirt', 3 - dn), (xl + 1, top, 'shirt', 2 - dn)]   # the arm raised: the sleeve a row up
    hxl = span2(hx2); hy0 = int(math.floor(hy2 - 1.5 + 0.5)) if vy >= 0 else int(math.floor(hy2 - 0.5))
    mid = (xl + hxl) / 2.0
    for yy in range(min(top + 2, hy0 + 2), max(top + 1, hy0)):   # the forearm, where the hand isn't hard under the sleeve
        xf = int(round(xl + (hxl - xl) * (yy - (top + 1)) / max(1, hy0 - (top + 1))))
        px += [(xf, yy, 'shirt' if gk else 'skin', 2 - dn), (xf + 1, yy, 'shirt' if gk else 'skin', 2 - dn)]
    if gk:                                                 # a keeper's glove: three by three, out from his side
        gx = hxl - 1 if hx2 < sx - 0.2 or (abs(hx2 - sx) <= 0.2 and sx < CXF) else hxl; gy = hy0 if vy >= 0 else hy0 - 1
        for j in range(3):
            for i in range(3): px.append((gx + i, gy + j, 'gloves', max(1, GLOVE3[j][i] - dn)))
    else:
        for j in range(2):
            for i in range(2): px.append((hxl + i, hy0 + j, 'skin', (2 if (i, j) == (1, 1) else 3) - dn))
    mine = {(x, y) for x, y, _, _ in px}
    for y in sorted({y for _, y in mine}):
        xs = sorted(x for x, yy in mine if yy == y)
        left = sum(1 for x in range(xs[0] - 4, xs[0]) if (x, y) in F.px and F.px[(x, y)][2] == 'torso')
        right = sum(1 for x in range(xs[-1] + 1, xs[-1] + 5) if (x, y) in F.px and F.px[(x, y)][2] == 'torso')
        if left == 0 and right == 0: continue
        q = (xs[0] - 1, y) if left >= right else (xs[-1] + 1, y)
        if q in F.px and F.px[q][2] == 'torso': F.px[q][1] = 0
    for x, y, m, t in px: F.put(x, y, m, t, part)

def draw_body(pose, d, tilt=0.0):
    phi = math.radians(M.DIR_ANGLE[d]); J = dict(joints(pose, phi, tilt)); F = Frame()
    bob = pose.get('bob', 0)
    if bob: J = {k: (v[0], v[1] + bob, v[2]) for k, v in J.items()}
    J['_bob'] = bob; J['_front'] = abs(math.sin(phi))
    if not pose.get('air'):                                # on the ground: the lower foot stands on it
        low = max(J['ankleR'][1], J['ankleL'][1]); dy = (29.1 + bob) - low
        for s in 'RL':
            for k in ('ankle', 'toe', 'heel'):
                q = J[k + s]; J[k + s] = (q[0], q[1] + dy, q[2])
    side = abs(math.cos(phi))
    if 0.2 < side < 0.9:
        # turned half away: the near arm hangs close down his side, the far one is tucked behind him, only its edge showing
        for s in 'RL':
            sx, sy, sz = J['sho' + s]; near = sz > J['chest'][2]
            k = 0.35 if near else 0.2; pull = 0.0 if near else 1.2
            sx2 = sx + (pull if sx < J['chest'][0] else -pull)
            for q in ('sho', 'elb', 'wri', 'hand'):
                x, y, z = J[q + s]; J[q + s] = (sx2 + (x - sx) * k, y, z)
    st = STAMPS[d]; parts = []
    for s in 'RL':
        parts.append(((J['knee' + s][2] + J['ankle' + s][2]) / 2 - 0.01, 'leg' + s))
        parts.append(((J['elb' + s][2] + J['hand' + s][2]) / 2 + 0.01, 'arm' + s))
    parts.append((J['chest'][2], 'torso'))
    parts.sort(key=lambda p: p[0])
    td = J['chest'][2]
    x0 = int(math.floor(J['chest'][0] - st['w'] / 2.0 + 0.5)); y0 = 21 + bob + pose.get('crouch', 0)
    px0 = int(math.floor(J['pelvis'][0] - st['w'] / 2.0 + 0.5))
    for depth, name in parts:
        s = name[-1]; far = depth < td - 1.0
        if name == 'torso':
            stamp(F, st['shorts'], px0, y0 + 3, 'shorts', 'torso')
            stamp(F, st['shirt'], x0, y0, 'shirt', 'torso')
        elif name.startswith('leg'):
            leg(F, J, s, name, far, y0 + 5, side=side if side > 0.9 else 0.0)
        elif not pose.get('noarms'):
            arm(F, J, s, name, far, y0, gk=bool(pose.get('gk')))
    return F, J

BODY_CH = {'S': ('shirt', 3), 's': ('shirt', 2), 'z': ('shirt', 1), 'H': ('shorts', 3), 'h': ('shorts', 2), 'j': ('shorts', 1), 'L': ('shorts', 0),
           'A': ('skin', 3), 'a': ('skin', 2), 'e': ('skin', 1), 'N': ('skin', 3), 'n': ('skin', 2), 'O': ('socks', 2), 'o': ('socks', 1),
           'B': ('boots', 2), 'b': ('boots', 1), 'T': ('trim', 2), 'G': ('gloves', 3), 'g': ('gloves', 2), 'q': ('gloves', 1),
           'W': ('ball', 3), 'w': ('ball', 2), 'x': ('ball', 1), 'X': ('ball', 0)}
def read_bodies(fn='bodies.txt'):
    """the bodies drawn by hand (the slide, the keeper's dive and spread, the ball in his gloves): '# name view hx hy'
    then rows 'NN|' + 32 pixels, NN the cell row"""
    out, cur = {}, None
    for line in open(os.path.join(ART, fn)):
        line = line.rstrip('\n')
        m = re.match(r'^#\s*(\w+)\s+(\w+)\s+(-?\d+)\s+(-?\d+)', line)
        if m: cur = (m.group(1), m.group(2)); out[cur] = dict(at=(int(m.group(3)), int(m.group(4))), rows={}); continue
        m = re.match(r'^(\d+)\|(.*)$', line)
        if cur and m:
            assert len(m.group(2).rstrip()) <= CELL, '%s %s row %s: %d wide' % (cur + (m.group(1), len(m.group(2))))
            out[cur]['rows'][int(m.group(1))] = m.group(2).rstrip().ljust(CELL, '.')
    return out
def stamp_body(F, B, dx=0, dy=0):
    for y, row in B['rows'].items():
        for x, ch in enumerate(row):
            if ch == '.': continue
            mat, tone = BODY_CH[ch]
            F.put(x + dx, y + dy, mat, tone, 'arm' if ch in 'Aae' else 'drawn')
def compose(F, head=None, head_at=(HEAD_X0, HEAD_Y0)):
    img = np.zeros((CAN, CAN, 4), np.uint8)
    fill = {}
    for (x, y), (mat, tone, part) in F.px.items():
        fill[(x + PAD, y + PAD)] = (RAMPS[mat][tone], part, mat)
    hp = {}
    if head:
        ox, oy = head_at
        for j, row in enumerate(head):
            for i, ch in enumerate(row):
                if ch != '.': hp[(ox + i + PAD, oy + j + PAD)] = HEAD_PAL[ch]
    solid = set(fill) | set(hp)
    for (x, y), (c, part, mat) in fill.items():
        img[y, x] = (*c, 255)
    # the outline: every empty pixel beside a filled one -- soft navy over the top of a part, the skin's own line
    # round a hand, black elsewhere
    for (x, y) in list(fill):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q in solid or not (0 <= q[0] < CAN and 0 <= q[1] < CAN) or img[q[1], q[0], 3]: continue
            nb = [fill[n] for n in ((q[0] + 1, q[1]), (q[0] - 1, q[1]), (q[0], q[1] + 1), (q[0], q[1] - 1)) if n in fill]
            if all(m == 'skin' and p.startswith('arm') for _, p, m in nb): col = RAMPS['skin'][0]
            elif (q[0], q[1] + 1) in fill and (q[0], q[1] - 1) not in solid and len(nb) == 1: col = SOFT
            else: col = BLACK
            img[q[1], q[0]] = (*col, 255)
    for (x, y), c in hp.items():
        img[y, x] = (*c, 255)
    return img

def crop(img): return img[PAD:PAD + CELL, PAD:PAD + CELL].copy()

def anim_run():
    """four frames, as the references step: the stride (legs wide in an upside-down V, the body down), then the
    passing (one leg under him, the other knee coming through, the whole figure a pixel up), then both again with
    the legs changed over"""
    stride = M.P(lean=9, twist=-6, R=dict(flex=40, knee=6, ankle=-6), L=dict(flex=-40, knee=18, ankle=10),
                 aR=dict(flex=-34, abd=12, elbow=50), aL=dict(flex=40, abd=12, elbow=62))
    passing = M.P(lean=10, twist=1, R=dict(flex=-4, knee=6), L=dict(flex=46, knee=84),
                  aR=dict(flex=8, abd=12, elbow=60), aL=dict(flex=-8, abd=12, elbow=60))
    passing['bob'] = -1
    fr = [stride, passing]
    return fr + [dict(M.mirror_pose(f), bob=f.get('bob', 0)) for f in fr]

_REST = {}
def neck_xy(pose, d):
    J = joints(pose, math.radians(M.DIR_ANGLE[d])); return J['neck'][0], J['neck'][1] + pose.get('bob', 0) + pose.get('crouch', 0)
def head_at(pose, d):
    if d not in _REST: _REST[d] = neck_xy(M.anim_idle()[0], d)
    rx, ry = _REST[d]; nx, ny = neck_xy(pose, d)
    fl = lambda v: int(math.floor(v + 0.5))
    return (HEAD_X0 + fl(rx - CXF) + fl(nx - rx), HEAD_Y0 + fl(ny - ry))

def cell(heads, style, pose, d, tilt=0.0):
    """one finished cell: the body posed, the head on it (d one of the five drawn views)"""
    F, J = draw_body(pose, d, tilt)
    return crop(compose(F, heads[(style, d)], head_at(pose, d)))

def mirror(c): return c[:, ::-1].copy()
DIRS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE']
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}
def cell8(heads, style, pose, d, tilt=0.0):
    return mirror(cell(heads, style, pose, MIRROR[d], tilt)) if d in MIRROR else cell(heads, style, pose, d, tilt)


# ----------------------------------------------------------------------------- the poses
P = M.P
def tag(poses, **kw): return [dict(p, **kw) for p in poses]
def anim_getup():
    """up off the turf after a slide: crouched low, his hands coming up"""
    leg = dict(flex=6, knee=12, abd=7, toe=12); arm = dict(flex=30, abd=25, elbow=40)
    return tag([P(lean=4, R=dict(leg), L=dict(leg), aR=dict(arm), aL=dict(arm))], crouch=2)
def gk_ready(abd=13, crouch=1, bob=0):
    """set: his knees bent, his gloves up and open"""
    leg = dict(flex=4, knee=9, abd=abd, toe=12); arm = dict(flex=44, abd=34, elbow=52)
    return tag([P(lean=4, R=dict(leg), L=dict(leg), aR=dict(arm), aL=dict(arm))], gk=1, crouch=crouch, bob=bob)[0]
def gk_hold():
    leg = dict(flex=6, knee=12, abd=7, toe=12)
    return tag([P(lean=4, R=dict(leg), L=dict(leg))], gk=1, noarms=1)[0]
def gk_kick():
    return tag([P(lean=-12, twist=10, R=dict(flex=96, knee=4, ankle=40, toe=0, abd=-6, len=1.15), L=dict(flex=-6, knee=16, ankle=20),
                  aR=dict(flex=30, abd=74, elbow=20), aL=dict(flex=-16, abd=92, elbow=16))], gk=1)[0]
def gk_going():
    """going down big: low, his arms opening"""
    leg = dict(flex=4, knee=9, abd=30, toe=12); arm = dict(flex=30, abd=60, elbow=20)
    return tag([P(lean=4, R=dict(leg), L=dict(leg), aR=dict(arm), aL=dict(arm))], gk=1, crouch=2)[0]

OUTFIELD = [('idle', lambda: M.anim_idle()), ('run', anim_run), ('shoot', M.anim_shoot), ('pass', M.anim_pass), ('slide', None)]
VI = {v: i for i, v in enumerate(VIEWS)}

def rig_cell(pose, d, stamp_on=None):
    """one cell with no head on it, and where its head goes: [x, y, view, mirrored]"""
    v = MIRROR.get(d, d); F, J = draw_body(pose, v)
    if stamp_on: stamp_body(F, stamp_on)
    c = crop(compose(F)); hx, hy = head_at(pose, v)
    return (mirror(c), [CELL - (hx + HW), hy, VI[v], 1]) if d in MIRROR else (c, [hx, hy, VI[v], 0])
def hand_cell(B, d, dy=0, view=None, flip=None):
    """a cell drawn by hand (bodies.txt), the same way"""
    v = view or MIRROR.get(d, d); F = Frame(); stamp_body(F, B, 0, dy)
    c = crop(compose(F)); hx, hy = B['at'][0], B['at'][1] + dy
    flip = (d in MIRROR) if flip is None else flip
    return (mirror(c), [CELL - (hx + HW), hy, VI[v], 1]) if flip else (c, [hx, hy, VI[v], 0])

def pack(rows, cols=4):
    """rows of (cell, head spot) -> the sheet and its table of head spots"""
    blank = np.zeros((CELL, CELL, 4), np.uint8)
    img = np.concatenate([np.concatenate([c for c, _ in r] + [blank] * (cols - len(r)), axis=1) for r in rows], axis=0)
    return img, [[a for _, a in r] + [None] * (cols - len(r)) for r in rows]

def outfield_sheet():
    B = read_bodies(); rows = []
    for name, fn in OUTFIELD:
        for d in DIRS:
            if name == 'slide': rows.append([hand_cell(B[('slide', MIRROR.get(d, d))], d), rig_cell(anim_getup()[0], d)])
            else: rows.append([rig_cell(p, d) for p in fn()])
    return pack(rows)

GK_ROWS = {'ready': 0, 'shuffle': 8, 'run': 16, 'hold': 24, 'kick': 32, 'dive': 40, 'spread': 44}
GK_FRAMES = {'ready': 1, 'shuffle': 2, 'run': 4, 'hold': 1, 'kick': 1, 'dive': 2, 'spread': 2}
DIVE_LIFT = 5         # in the air he's this many pixels off the turf; down, he lies on it
def keeper_sheet():
    B = read_bodies(); rows = []
    for d in DIRS: rows.append([rig_cell(gk_ready(), d)])
    for d in DIRS: rows.append([rig_cell(gk_ready(abd=24), d), rig_cell(gk_ready(abd=4, crouch=0), d)])
    for d in DIRS: rows.append([rig_cell(p, d) for p in tag(anim_run(), gk=1)])
    for d in DIRS: rows.append([rig_cell(gk_hold(), d, B[('hold', MIRROR.get(d, d))])])
    for d in DIRS: rows.append([rig_cell(gk_kick(), d)])
    for way, flip in (('diveup', False), ('divedown', False), ('diveup', True), ('divedown', True)):   # up the screen and down it, facing E; then W
        rows.append([hand_cell(B[(way, 'E')], 'E', -DIVE_LIFT, 'E', flip), hand_cell(B[(way, 'E')], 'E', 0, 'E', flip)])
    for flip in (False, True):                                                                       # his right knee down, then his left
        g, at = rig_cell(gk_going(), 'S')
        rows.append([(mirror(g), [CELL - (at[0] + HW), at[1], at[2], 1]) if flip else (g, at), hand_cell(B[('spread', 'S')], 'S', 0, 'S', flip)])
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

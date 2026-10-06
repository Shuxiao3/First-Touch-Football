#!/usr/bin/env python3
"""First Touch Football -- player sprite sheet generator.

Builds a 32x32, 8-direction sheet in the style of the Gen-4 (HeartGold/SoulSilver) overworld
sprites: a big hand-pixelled head on a small body. The body is a little 3D skeleton (capsules
and ellipsoids) posed per frame and ray-marched at exactly one ray per pixel. A cleanup pass
then does what a pixel artist would: fills 1px bites and shaves spurs off the silhouette,
removes lone tones, cuts clean 1px cuffs, shades the far limb down, and lines only where parts
overlap. The head is hand-drawn pixel art per view.

    python3 tools/sprites/make_player_sheet.py            # writes assets/sprites/*
    python3 tools/sprites/make_player_sheet.py --embed    # ...and embeds the sheet in index.html

Needs numpy and Pillow (dev only -- the game itself stays dependency-free).

Sheet layout: one row per (animation, direction), one 32x32 cell per frame.
Rows go animation-major: idle E,SE,S,SW,W,NW,N,NE, then run E..NE, and so on.
Direction order is the game's snap8 (atan2 on screen, 0=E, clockwise).
"""
import json
import math
import os
import re
import sys

import numpy as np
from PIL import Image

CELL = 32
PAD = 10                 # render margin around the cell, so big poses can be fitted back in
CAN = CELL + 2 * PAD     # canvas size
GY = 29.0                # cell row where the feet touch the ground
CX = 16.0                # cell column of the body's centre line
SQ5 = math.sqrt(5.0)

# ----------------------------------------------------------------------------- palette
# every material is a ramp: [line, shadow, base, light]
RAMPS = {
    'skin':   [(120, 64, 64), (184, 112, 80), (224, 160, 120), (248, 208, 184)],
    'shirt':  [(40, 40, 104), (48, 72, 160), (72, 112, 216), (128, 168, 240)],
    'trim':   [(112, 112, 128), (176, 176, 192), (224, 224, 236), (255, 255, 255)],
    'shorts': [(72, 72, 96), (152, 160, 184), (216, 220, 232), (248, 248, 248)],
    'boots':  [(16, 16, 24), (44, 44, 56), (72, 72, 92), (144, 144, 168)],
    'dust':   [(150, 132, 104), (200, 186, 150), (226, 216, 186), (246, 242, 226)],
}
RAMPS['socks'] = RAMPS['shirt']   # socks match the shirt, so a kit swap recolours both
OUTLINE = (24, 20, 28)
LINE_GAP = 0.75          # depth gap (px) before two body groups get a separating line
FAR_GAP = 1.5            # depth gap (px) between paired limbs before the far one is shaded down

HEAD_PAL = {
    'K': OUTLINE, 'D': (56, 36, 32),
    '1': (156, 104, 64), '2': (108, 70, 46), '3': (70, 44, 36),
    'a': (248, 208, 184), 'b': (224, 160, 120), 'c': (184, 112, 80), 'r': (120, 64, 64),
    'l': (168, 160, 200), 'w': (240, 240, 248), 'p': OUTLINE,
}

# Hand-drawn heads, 16x15. Views facing right; SW/W/NW are mirrors of SE/E/NE.
# K outline  D hair outline  1/2/3 hair light/base/dark  a/b/c skin  r skin line
# l lid  w eye white  p pupil
HEADS_TXT = """
# S
......DDDD......
....DD1111DD....
...D11111112D...
..D1111112222D..
.D112222222223D.
.D122222222233D.
K12223222232333K
K22223222232333K
K2223a2222a3333K
K23baaa33aaab33K
K3bal3aaaa3lab3K
.DbawpaaaapwabD.
..rbaaaaaaaabr..
...rbbaaaabbr...
....KrrrrrrK....
# SE
.....DDDDD......
...DD11111DD....
..D111111112D...
.D11111112222D..
.D112222222223D.
K1222222222233D.
K12222322232333K
K22222322232333K
K2222223a32a333K
K23bc3aaa33aaa3K
K3bcb3alaaaa3lK.
.D3bb3awpaaapwK.
..rbbbaaaaaaabK.
...rbbaaaaaabr..
....KKrrrrrrK...
# E
.....DDDDD......
...DD11111DD....
..D111111112D...
.D11111112222D..
.D112222222223D.
K1222222222233D.
K12222322223333D
K22222322223333K
K2222232222aa3K.
K32222bc3aaaaaK.
K3222bcbaaalpaK.
.D322bbaaaawpaaK
..D33rbaaaaaabK.
...K3rbbaaaabrK.
....KKrrrrrrK...
# NE
.....DDDDD......
..DD211111DD....
.D2111111112D...
.D21111112222D..
K1122222222223D.
K1222222222233D.
K12222222222333K
K22222322222333K
K22222322223333K
K2222322222bc33K
K3222322222bcbaK
.D32222222223baK
..D332222223brK.
...K333333333K..
....KKKKKKKKK...
# N
......DDDD......
....DD1111DD....
...D11111112D...
..D1111112222D..
.D112222222223D.
.D122222222233D.
K12222222222333K
K22222222222333K
K22232222322333K
K22232222322333K
Kb223222232233bK
.Kc3322222233cK.
..K3332222333K..
...KK33bbb33KK..
.....KKrrrKK....
"""


def parse_heads(txt):
    views, cur = {}, None
    for line in txt.splitlines():
        m = re.match(r'^#\s*(\w+)', line)
        if m:
            cur = m.group(1)
            views[cur] = []
            continue
        if cur and line.strip():
            views[cur].append(line.strip())
    for k, rows in views.items():
        assert len({len(r) for r in rows}) == 1, 'ragged head ' + k
    return views


HEADS = parse_heads(HEADS_TXT)


# ----------------------------------------------------------------------------- maths
def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def ang_dir(flex, abd=0.0, side=1):
    """unit vector: 0 = straight down, +flex swings toward +y (forward), abd swings out to `side`."""
    f, a = math.radians(flex), math.radians(abd)
    return np.array([side * math.sin(a), math.sin(f) * math.cos(a), -math.cos(f) * math.cos(a)])


# ----------------------------------------------------------------------------- skeleton
PELVIS_Z = 6.3
HIP_W = 1.75
THIGH, SHIN = 2.4, 2.25
FOOT = 1.8
CHEST_UP = 2.6     # pelvis centre -> chest centre
SH_W, SH_Z = 3.9, 0.9
UPPER, FORE = 2.1, 1.8
NECK_UP = 2.4      # chest centre -> head anchor


def pose_default():
    return {
        'root': (0.0, 0.0, 0.0), 'yaw': 0.0, 'lean': 0.0, 'twist': 0.0, 'roll': 0.0,
        'leg': {'R': dict(flex=0, abd=4, knee=0, ankle=0, toe=8, len=1.0),
                'L': dict(flex=0, abd=4, knee=0, ankle=0, toe=8, len=1.0)},
        'arm': {'R': dict(flex=0, abd=12, elbow=10, len=1.0),
                'L': dict(flex=0, abd=12, elbow=10, len=1.0)},
        'head': (0.0, 0.0, 0.0),
        'chest_dz': 0.0,           # upper-body drop (breathing) that leaves the legs planted
        'fx': [],
    }


def build_skeleton(pose):
    """joint positions in character-local space (x right, y forward, z up)."""
    J = {}
    rx, ry, rz = pose['root']
    pel = np.array([rx, ry, PELVIS_Z + rz])
    Rp = rot_z(math.radians(pose['yaw']))
    Rt = (Rp @ rot_z(math.radians(pose['twist'])) @ rot_x(-math.radians(pose['lean']))
          @ rot_y(math.radians(pose['roll'])))
    J['pelvis'], J['Rp'], J['Rt'] = pel, Rp, Rt
    chest = pel + Rt @ np.array([0, 0, CHEST_UP]) + np.array([0, 0, pose.get('chest_dz', 0.0)])
    J['chest'] = chest
    for s, side in (('R', 1), ('L', -1)):
        L = pose['leg'][s]
        k = L.get('len', 1.0)
        hip = pel + Rp @ np.array([side * HIP_W, 0, -0.4])
        knee = hip + THIGH * k * (Rp @ ang_dir(L['flex'], L['abd'], side))
        shin_pitch = L['flex'] - L['knee']
        ankle = knee + SHIN * k * (Rp @ ang_dir(shin_pitch, L['abd'] * 0.5, side))
        fa = math.radians(shin_pitch + 90 - L['ankle'])
        fd = np.array([0, math.sin(fa), -math.cos(fa)])
        fd = Rp @ (rot_z(-side * math.radians(L['toe'])) @ fd)
        J['hip' + s], J['knee' + s], J['ankle' + s] = hip, knee, ankle
        J['toe' + s] = ankle + FOOT * fd
        J['heel' + s] = ankle - 0.45 * fd
        A = pose['arm'][s]
        ka = A.get('len', 1.0)
        sho = chest + Rt @ np.array([side * SH_W, 0, SH_Z])
        elb = sho + UPPER * ka * (Rt @ ang_dir(A['flex'], A['abd'], side))
        fdir = Rt @ ang_dir(A['flex'] + A['elbow'], A['abd'] * 0.6, side)
        wri = elb + FORE * ka * fdir
        J['sho' + s], J['elb' + s], J['wri' + s] = sho, elb, wri
        J['hand' + s] = wri + 0.35 * fdir
    hx, hy, hz = pose['head']
    J['neck'] = chest + Rt @ np.array([0, 0.25, NECK_UP]) + np.array([hx, hy, hz])
    return J


# ----------------------------------------------------------------------------- primitives
class Capsule:
    def __init__(self, a, b, r, bands, group):
        self.a, self.b = np.asarray(a, float), np.asarray(b, float)
        self.r, self.bands, self.group = r, bands, group

    def _h(self, P):
        ba = self.b - self.a
        return np.clip(((P - self.a) @ ba) / max(ba @ ba, 1e-9), 0, 1), ba

    def sdf(self, P):
        h, ba = self._h(P)
        return np.linalg.norm(P - self.a - h[:, None] * ba, axis=1) - self.r

    def material(self, P):
        h, _ = self._h(P)
        out = np.empty(len(P), dtype=object)
        out[:] = self.bands[-1][1]
        for t_end, m in reversed(self.bands):
            out[h <= t_end] = m
        return out


class Ellipsoid:
    def __init__(self, c, radii, R, mat, group):
        self.c, self.r, self.R = np.asarray(c, float), np.asarray(radii, float), R
        self.mat, self.group = mat, group

    def sdf(self, P):
        q = (P - self.c) @ self.R          # world -> local (columns of R are local axes)
        k0 = np.linalg.norm(q / self.r, axis=1)
        k1 = np.linalg.norm(q / (self.r * self.r), axis=1)
        return np.where(k1 > 1e-9, k0 * (k0 - 1.0) / np.maximum(k1, 1e-9), -self.r.min())

    def material(self, P):
        out = np.empty(len(P), dtype=object)
        out[:] = self.mat
        return out


def local_to_world_matrix(phi):
    """columns: world images of local x (right), y (forward), z (up). phi: 0=E, +pi/2=S."""
    return np.array([[-math.sin(phi), math.cos(phi), 0],
                     [math.cos(phi), math.sin(phi), 0],
                     [0, 0, 1]])


UPPER_ARM_BANDS = [(1.0, 'shirt')]                    # long sleeves: more kit on show, so
FOREARM_BANDS = [(0.8, 'shirt'), (1.0, 'skin')]      # the teams read apart at a glance
THIGH_BANDS = [(0.55, 'shorts'), (1.0, 'skin')]     # shorts, then a bare knee
SHIN_BANDS = [(0.12, 'skin'), (1.0, 'socks')]


def body_prims(J, pose, phi):
    Rw = local_to_world_matrix(phi)
    W = lambda k: Rw @ J[k]
    prims = [
        Ellipsoid(W('chest'), (4.1, 3.0, 2.7), Rw @ J['Rt'], 'shirt', 'torso'),
        Ellipsoid(Rw @ (J['chest'] + J['Rt'] @ np.array([0, 0.75, 1.55])), (2.1, 2.4, 0.62),
                  Rw @ J['Rt'], 'trim', 'torso'),
        Ellipsoid(W('pelvis') + Rw @ J['Rp'] @ np.array([0, 0, 0.1]), (3.4, 2.4, 1.7),
                  Rw @ J['Rp'], 'shorts', 'torso'),
    ]
    for s in 'RL':
        g = 'leg' + s
        prims.append(Capsule(W('hip' + s), W('knee' + s), 1.5, THIGH_BANDS, g))
        prims.append(Capsule(W('knee' + s), W('ankle' + s), 1.2, SHIN_BANDS, g))
        prims.append(Capsule(W('heel' + s), W('toe' + s), 1.15, [(1.0, 'boots')], g))
        g = 'arm' + s
        prims.append(Capsule(W('sho' + s), W('elb' + s), 1.25, UPPER_ARM_BANDS, g))
        prims.append(Capsule(W('elb' + s), W('wri' + s), 1.0, FOREARM_BANDS, g))
        prims.append(Capsule(W('hand' + s), W('hand' + s), 1.1, [(1.0, 'skin')], g))
    for i, (kind, pos, r) in enumerate(pose.get('fx', [])):
        if kind == 'dust':
            c = Rw @ np.array([pos[0], pos[1], r * 0.55])
            prims.append(Capsule(c, c, r, [(1.0, 'dust')], 'fx%d' % i))
    return prims


# ----------------------------------------------------------------------------- render
LIGHT = np.array([-0.55, 0.45, 0.85])
LIGHT /= np.linalg.norm(LIGHT)
OX, OY = CX + PAD, GY + PAD    # canvas position of the ground origin


def raymarch(prims):
    """one ray per canvas pixel. World axes: x east, y south (toward the viewer), z up; the
    projection is oblique -- screen row = ground row - z + y/2 -- so every ray runs along
    (0, 2, 1) and the nearest surface is the hit with the largest ray parameter s."""
    ys, xs = np.mgrid[0:CAN, 0:CAN]
    X = xs.ravel() + 0.5 - OX
    Yc = OY - (ys.ravel() + 0.5)
    n = X.size
    s = np.full(n, 40.0)
    hit = np.zeros(n, bool)
    alive = np.ones(n, bool)
    for _ in range(200):
        idx = np.where(alive & ~hit)[0]
        if idx.size == 0:
            break
        P = np.stack([X[idx], 2 * s[idx], Yc[idx] + s[idx]], axis=1)
        d = np.min(np.stack([p.sdf(P) for p in prims]), axis=0)
        h = d < 0.02
        hit[idx[h]] = True
        s[idx[~h]] -= np.maximum(d[~h], 0.02) / SQ5 * 0.9
        alive[idx[s[idx] < -40]] = False
    P = np.stack([X, 2 * s, Yc + s], axis=1)
    D = np.stack([p.sdf(P) for p in prims])
    which = np.argmin(D, axis=0)
    mat = np.empty(n, dtype=object)
    grp = np.empty(n, dtype=object)
    nrm = np.zeros((n, 3))
    e = 0.04
    for i, p in enumerate(prims):
        sel = hit & (which == i)
        if not sel.any():
            continue
        Ps = P[sel]
        mat[sel] = p.material(Ps)
        grp[sel] = p.group
        g = np.stack([p.sdf(Ps + np.array(dv) * e) - p.sdf(Ps - np.array(dv) * e)
                      for dv in ((1, 0, 0), (0, 1, 0), (0, 0, 1))], axis=1)
        nrm[sel] = g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)
    sh = (CAN, CAN)
    return hit.reshape(sh), mat.reshape(sh), grp.reshape(sh), nrm.reshape(CAN, CAN, 3), s.reshape(sh)


# per-material cel thresholds on N.L: (light above, shadow below). Small parts get no light
# tone at all -- on a 2px limb a third tone only reads as noise.
TONES = {
    'shirt':  (0.80, 0.25),
    'shorts': (0.86, 0.25),
    'skin':   (0.88, 0.22),
    'socks':  (None, 0.30),
    'trim':   (None, 0.25),
    'boots':  (None, 0.55),
    'dust':   (0.70, 0.20),
}


def shade(hit, mat, nrm):
    v = nrm @ LIGHT
    tone = np.zeros(hit.shape, int)
    for y, x in zip(*np.where(hit)):
        hi, lo = TONES[mat[y, x]]
        tone[y, x] = 3 if hi is not None and v[y, x] > hi else 1 if v[y, x] < lo else 2
    return tone


N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
N8 = N4 + ((1, 1), (1, -1), (-1, 1), (-1, -1))


def nbrs(y, x, ring=N4):
    for dx, dy in ring:
        if 0 <= y + dy < CAN and 0 <= x + dx < CAN:
            yield y + dy, x + dx


# ----------------------------------------------------------------------------- cleanup
def clean_silhouette(L):
    """fill 1px bites (an empty pixel walled in on 3+ sides) and shave 1px spurs (a pixel hanging
    on by a single side), so limbs keep smooth edges instead of ray-sampling noise."""
    hit, mat, grp, tone, depth = L['hit'], L['mat'], L['grp'], L['tone'], L['depth']
    for _ in range(2):
        for y in range(CAN):
            for x in range(CAN):
                if hit[y, x]:
                    continue
                nb = [q for q in nbrs(y, x) if hit[q]]
                if len(nb) >= 3:
                    q = max(nb, key=lambda q: depth[q])
                    hit[y, x], mat[y, x], grp[y, x], tone[y, x], depth[y, x] = (
                        True, mat[q], grp[q], tone[q], depth[q])
        spurs = [(y, x) for y, x in zip(*np.where(hit))
                 if sum(hit[q] for q in nbrs(y, x)) <= 1 and mat[y, x] != 'dust']
        for q in spurs:
            hit[q] = False


def despeckle(L):
    """a tone that appears nowhere among a pixel's same-material neighbours is noise: take theirs."""
    hit, mat, tone = L['hit'], L['mat'], L['tone']
    out = tone.copy()
    for y, x in zip(*np.where(hit)):
        same = [tone[q] for q in nbrs(y, x, N8) if hit[q] and mat[q] == mat[y, x]]
        if len(same) >= 3 and tone[y, x] not in same:
            out[y, x] = max(set(same), key=same.count)
    L['tone'] = out


def add_cuffs(L):
    """the last row of each sleeve, where it meets the forearm, is trim -- a clean 1px cuff."""
    hit, mat, grp, tone = L['hit'], L['mat'], L['grp'], L['tone']
    cuff = [(y, x) for y, x in zip(*np.where(hit))
            if mat[y, x] == 'shirt' and str(grp[y, x]).startswith('arm')
            and any(hit[q] and grp[q] == grp[y, x] and mat[q] == 'skin' for q in nbrs(y, x))]
    for q in cuff:
        mat[q], tone[q] = 'trim', 2


def shade_far_limbs(L):
    """when a pair of limbs is clearly split front-to-back, the far one drops a tone -- the
    standard pixel-art depth cue, and it keeps crossing legs apart without extra lines."""
    hit, grp, tone, depth = L['hit'], L['grp'], L['tone'], L['depth']
    for a, b in (('legR', 'legL'), ('armR', 'armL')):
        ma, mb = hit & (grp == a), hit & (grp == b)
        if not ma.any() or not mb.any():
            continue
        da, db = depth[ma].mean(), depth[mb].mean()
        if abs(da - db) > FAR_GAP:
            far = mb if da > db else ma
            tone[far] = np.maximum(tone[far] - 1, 1)


def part_lines(L):
    """1px line on the farther of two touching body parts. Where that part is only a sliver
    against the background, a line would double the outline, so it gets its shadow tone."""
    hit, grp, tone, depth = L['hit'], L['grp'], L['tone'], L['depth']
    line = np.zeros_like(hit)
    for y, x in zip(*np.where(hit)):
        if any(hit[q] and grp[q] != grp[y, x] and depth[q] > depth[y, x] + LINE_GAP for q in nbrs(y, x)):
            if all(hit[q] for q in nbrs(y, x)):
                line[y, x] = True
            else:
                tone[y, x] = 1
    lone = [(y, x) for y, x in zip(*np.where(line)) if not any(line[q] for q in nbrs(y, x, N8))]
    for q in lone:
        line[q], tone[q] = False, 1
    L['line'] = line


def compose(L, head_rows, head_at):
    hit, mat, tone, line = L['hit'], L['mat'], L['tone'], L['line']
    img = np.zeros((CAN, CAN, 4), np.uint8)
    for y, x in zip(*np.where(hit)):
        ramp = RAMPS[mat[y, x]]
        img[y, x] = (*(ramp[0] if line[y, x] else ramp[tone[y, x]]), 255)
    # external outline; dust keeps a soft outline of its own
    for y in range(CAN):
        for x in range(CAN):
            if hit[y, x]:
                continue
            nb = [mat[q] for q in nbrs(y, x) if hit[q]]
            if nb:
                img[y, x] = (*(RAMPS['dust'][0] if all(m == 'dust' for m in nb) else OUTLINE), 255)
    ox, oy = head_at
    for j, row in enumerate(head_rows):
        for i, ch in enumerate(row):
            if ch != '.' and 0 <= ox + i < CAN and 0 <= oy + j < CAN:
                img[oy + j, ox + i] = (*HEAD_PAL[ch], 255)
    return img


def fit_shift(imgs):
    """integer (dx, dy) that brings the union of the figures back inside the cell window."""
    a = np.zeros((CAN, CAN), bool)
    for im in imgs:
        a |= im[:, :, 3] > 0
    ys, xs = np.where(a)
    dx = dy = 0
    if len(xs):
        lo_x, hi_x, lo_y, hi_y = xs.min(), xs.max(), ys.min(), ys.max()
        if hi_y > PAD + CELL - 1:
            dy = (PAD + CELL - 1) - hi_y
        if lo_y + dy < PAD:
            dy = PAD - lo_y
        if lo_x < PAD:
            dx = PAD - lo_x
        if hi_x + dx > PAD + CELL - 1:
            dx = (PAD + CELL - 1) - hi_x
    return dx, dy


def crop(img, shift):
    dx, dy = shift
    y0, x0 = PAD - dy, PAD - dx
    return img[y0:y0 + CELL, x0:x0 + CELL].copy()


def neck_screen(pose, phi):
    nk = local_to_world_matrix(phi) @ build_skeleton(pose)['neck']
    return OX + nk[0], OY - nk[2] + 0.5 * nk[1]


_REST = {}    # view angle -> screen position of the idle pose's neck


def snap(v):
    return int(math.floor(v + 0.5))


def head_positions(poses, phi, head_rows, steady=False):
    """top-left of the head sprite for each frame of a row. Heads are placed from the view's rest
    pose and moved by whole pixels, so sub-pixel wobble never makes them jitter. `steady` rows
    (idle/run) keep one column and only bob vertically around their mean height."""
    if phi not in _REST:
        _REST[phi] = neck_screen(anim_idle()[0], phi)
    rx, ry = _REST[phi]
    hw, hh = len(head_rows[0]), len(head_rows)
    x0, y0 = snap(rx - hw / 2), snap(ry - hh + 1.5)
    d = np.array([np.subtract(neck_screen(p, phi), (rx, ry)) for p in poses])
    if not steady:
        return [(x0 + snap(dx), y0 + snap(dy)) for dx, dy in d]
    mx, my = d.mean(axis=0)
    return [(x0 + snap(mx), y0 + snap(my) + p.get('bob', 0)) for p in poses]


def render_frame(pose, phi, head_rows, head_at=None):
    J = build_skeleton(pose)
    hit, mat, grp, nrm, depth = raymarch(body_prims(J, pose, phi))
    L = dict(hit=hit, mat=mat, grp=grp, depth=depth, tone=shade(hit, mat, nrm))
    clean_silhouette(L)
    add_cuffs(L)
    despeckle(L)
    shade_far_limbs(L)
    part_lines(L)
    if head_at is None:
        head_at = head_positions([pose], phi, head_rows)[0]
    return compose(L, head_rows, head_at)


# ----------------------------------------------------------------------------- poses
def P(lean=0.0, twist=0.0, roll=0.0, yaw=0.0, root=(0, 0, 0), head=(0, 0, 0),
      R=None, L=None, aR=None, aL=None, fx=()):
    p = pose_default()
    p.update(lean=lean, twist=twist, roll=roll, yaw=yaw, root=tuple(root), head=tuple(head),
             fx=list(fx))
    for side, d in (('R', R), ('L', L)):
        if d:
            p['leg'][side].update(d)
    for side, d in (('R', aR), ('L', aL)):
        if d:
            p['arm'][side].update(d)
    return p


def mirror_pose(p):
    q = pose_default()
    q.update(lean=p['lean'], twist=-p['twist'], roll=-p['roll'], yaw=-p['yaw'],
             root=(-p['root'][0], p['root'][1], p['root'][2]),
             head=(-p['head'][0], p['head'][1], p['head'][2]),
             fx=[(k, (-pos[0], pos[1]), r) for k, pos, r in p['fx']], chest_dz=p.get('chest_dz', 0.0))
    q['leg'] = {'R': dict(p['leg']['L']), 'L': dict(p['leg']['R'])}
    q['arm'] = {'R': dict(p['arm']['L']), 'L': dict(p['arm']['R'])}
    return q


def anim_idle():
    leg = dict(flex=4, knee=9, abd=7, toe=12)
    arm = dict(flex=6, abd=16, elbow=24)
    return [P(lean=4, R=dict(leg), L=dict(leg), aR=dict(arm), aL=dict(arm))]


def anim_run():
    """four frames: contact (legs split, body low), passing (knee up, body high), mirrored."""
    lean = 13
    contact = P(lean=lean, twist=-7, root=(0, 0, -0.2),
                R=dict(flex=36, knee=12, ankle=-8), L=dict(flex=-36, knee=80, ankle=18),
                aR=dict(flex=-40, abd=14, elbow=70), aL=dict(flex=44, abd=12, elbow=78))
    passing = P(lean=lean + 2, twist=1, root=(0, 0, 0.5),
                R=dict(flex=-14, knee=30, ankle=24), L=dict(flex=48, knee=88),
                aR=dict(flex=10, abd=14, elbow=74), aL=dict(flex=-8, abd=14, elbow=74))
    passing['bob'] = -1                                   # the head rides up a pixel in flight
    frames = [contact, passing]
    return frames + [dict(mirror_pose(f), bob=f.get('bob', 0)) for f in frames]


def anim_shoot():
    return [
        # build-up: plant left, right heel drawn high behind, shoulders turned away, arms wide
        P(lean=8, twist=-20, root=(0, -0.8, -0.7),
          R=dict(flex=-64, knee=84, ankle=24, toe=0, abd=22, len=1.1), L=dict(flex=16, knee=28, abd=6),
          aR=dict(flex=-56, abd=46, elbow=30), aL=dict(flex=44, abd=76, elbow=26)),
        # shot: the leg whips through high, toe pointed, body leaning back, arms flung out
        P(lean=-10, twist=12, root=(0, 0.8, 0.0),
          R=dict(flex=90, knee=6, ankle=44, toe=0, abd=-8, len=1.2), L=dict(flex=-4, knee=14, ankle=20),
          aR=dict(flex=36, abd=66, elbow=22), aL=dict(flex=-24, abd=88, elbow=18)),
    ]


def anim_pass():
    return [
        # backswing, foot opened out for the side-foot
        P(lean=4, twist=-9, root=(0, -0.2, -0.3),
          R=dict(flex=-34, knee=38, toe=60, abd=10), L=dict(flex=8, knee=18),
          aR=dict(flex=-18, abd=32, elbow=24), aL=dict(flex=18, abd=44, elbow=24)),
        # strike: the inside of the foot swept through
        P(lean=4, twist=8, root=(0, 0.4, -0.3),
          R=dict(flex=30, knee=8, toe=74, abd=-8), L=dict(flex=6, knee=16),
          aR=dict(flex=6, abd=34, elbow=22), aL=dict(flex=-4, abd=46, elbow=22)),
    ]


def anim_slide():
    return [
        # slide: down on the hip, lead leg flat out, trail knee up, hand down behind, dust kicked up
        P(lean=-56, roll=-26, root=(0, 1.6, -4.8), head=(-1.0, -0.6, -0.8),
          R=dict(flex=82, knee=0, ankle=-16, toe=0, len=1.3), L=dict(flex=34, knee=122, abd=14),
          aR=dict(flex=40, abd=84, elbow=50), aL=dict(flex=-62, abd=42, elbow=4),
          fx=[('dust', (-1.4, -4.4), 2.3), ('dust', (1.6, -5.0), 1.6)]),
        # get up: kneeling on the trail leg, lead foot planted
        P(lean=12, root=(0, 1.4, -2.4),
          R=dict(flex=72, knee=96), L=dict(flex=-22, knee=112),
          aR=dict(flex=30, abd=25, elbow=50), aL=dict(flex=-10, abd=30, elbow=20)),
    ]


# name, poses, suggested fps, what each frame is
ANIMS = [
    ('idle', anim_idle, 1, ['stand']),
    ('run', anim_run, 10, ['contact R', 'passing', 'contact L', 'passing']),
    ('shoot', anim_shoot, 6, ['build-up', 'shot']),
    ('pass', anim_pass, 8, ['backswing', 'strike']),
    ('slide', anim_slide, 3, ['slide', 'get up']),
]

# sheet direction order (matches the game's snap8: atan2 on screen, 0=E clockwise)
DIRS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE']
DIR_ANGLE = {'E': 0, 'SE': 45, 'S': 90, 'N': 270, 'NE': 315}
MIRROR = {'SW': 'SE', 'W': 'E', 'NW': 'NE'}


PER_FRAME_FIT = {'slide'}     # whole-body actions may re-centre per frame; the rest move as one
STEADY_HEAD = {'idle', 'run'}  # loops whose head keeps one column and only bobs


def render_row(name, poses, d):
    """the cells of one animation in one of the five drawn directions, plus the fit shifts used."""
    phi = math.radians(DIR_ANGLE[d])
    heads = head_positions(poses, phi, HEADS[d], steady=name in STEADY_HEAD)
    imgs = [render_frame(p, phi, HEADS[d], h) for p, h in zip(poses, heads)]
    if name in PER_FRAME_FIT:
        shifts = [fit_shift([im]) for im in imgs]
    else:
        shifts = [fit_shift(imgs)] * len(imgs)
    return [crop(im, sh) for im, sh in zip(imgs, shifts)], shifts


def build_sheet(log=None):
    cols = max(len(fn()) for _, fn, _, _ in ANIMS)
    blank = np.zeros((CELL, CELL, 4), np.uint8)
    rows = []
    for name, fn, _, _ in ANIMS:
        poses = fn()
        drawn = {}
        for d in DIR_ANGLE:
            drawn[d], shifts = render_row(name, poses, d)
            if log is not None and any(sh != (0, 0) for sh in shifts):
                log.append((name, d, shifts))
        for d in DIRS:
            cells = drawn[d] if d not in MIRROR else [c[:, ::-1].copy() for c in drawn[MIRROR[d]]]
            cells = cells + [blank] * (cols - len(cells))
            rows.append(np.concatenate(cells, axis=1))
    return np.concatenate(rows, axis=0)


# ----------------------------------------------------------------------------- kits
# Kits recolour the sheet by exact palette swap: socks share the shirt ramp, so a kit names
# ramps for 'shirt', 'trim' and 'shorts' (and optionally 'boots' / 'hair'). The two game kits
# differ in value as well as hue -- light shirt over dark shorts against dark shirt over white
# -- so they stay apart in grayscale and for red-green colour blindness.
KITS = {
    'blue':  {},                                              # the base sheet as drawn
    'green': {'shirt':  [(28, 84, 36), (72, 156, 40), (132, 220, 52), (196, 255, 128)],
              'trim':   [(112, 124, 112), (184, 200, 188), (233, 245, 236), (255, 255, 255)],
              'shorts': [(10, 14, 10), (30, 38, 30), (50, 62, 50), (86, 102, 84)]},
    'red':   {'shirt':  [(88, 16, 32), (156, 32, 44), (212, 52, 52), (248, 120, 104)],
              'trim':   [(112, 124, 112), (184, 200, 188), (233, 245, 236), (255, 255, 255)]},
}
HAIR_KEYS = ['D', '3', '2', '1']     # head palette letters for the hair ramp: line, dark, base, light


def palette_keys():
    """material -> ramp of colours that are safe to swap (all unique across the sheet)."""
    keys = {m: list(RAMPS[m]) for m in ('shirt', 'trim', 'shorts', 'boots')}
    keys['hair'] = [HEAD_PAL[k] for k in HAIR_KEYS]
    return keys


def check_palette():
    """every colour a kit or look swap touches must belong to exactly one material."""
    owners = {}
    for m, ramp in RAMPS.items():
        if m != 'socks':                      # socks deliberately share the shirt ramp
            for c in ramp:
                owners.setdefault(tuple(c), set()).add(m)
    for k, c in HEAD_PAL.items():
        owners.setdefault(tuple(c), set()).add('hair' if k in HAIR_KEYS else 'head')
    owners.setdefault(tuple(OUTLINE), set()).add('outline')
    for m, ramp in palette_keys().items():
        for c in ramp:
            assert owners[tuple(c)] == {m}, 'palette clash: %s shares %r with %r' % (m, c, owners[tuple(c)])


def recolor(sheet, kit):
    out = sheet.copy()
    keys = palette_keys()
    src = []
    for m, ramp in kit.items():
        base = keys['shirt'] if m == 'socks' else keys[m]
        src += list(zip(base, ramp))
    rgb = sheet[:, :, :3]
    for a, b in src:
        sel = np.all(rgb == np.array(a, np.uint8), axis=2) & (sheet[:, :, 3] > 0)
        out[sel, :3] = b
    return out


# ----------------------------------------------------------------------------- export
def save_indexed(arr, path):
    """exact palette PNG (index 0 = transparent): a third the size of RGBA, colours bit-exact."""
    mask = arr[:, :, 3] > 0
    cols = sorted(set(map(tuple, arr[mask][:, :3].tolist())))
    assert len(cols) < 256, 'too many colours for an indexed PNG'
    idx = np.zeros(arr.shape[:2], np.uint8)
    for i, c in enumerate(cols, 1):
        idx[np.all(arr[:, :, :3] == c, axis=2) & mask] = i
    im = Image.fromarray(idx, 'P')
    pal = [0, 0, 0] + [v for c in cols for v in c]
    im.putpalette(pal + [0] * (768 - len(pal)))
    im.save(path, optimize=True, transparency=0)


def sheet_meta(cols):
    anims, row = {}, 0
    for name, fn, fps, names in ANIMS:
        n = len(fn())
        anims[name] = {'row': row, 'frames': n, 'fps': fps, 'loop': name in ('idle', 'run'),
                       'frame_names': names}
        row += len(DIRS)
    return {
        'image': 'player_sheet.png',
        'frame': {'w': CELL, 'h': CELL},
        'columns': cols,
        'anchor': {'x': int(CX), 'y': int(GY)},
        'directions': DIRS,
        'direction_note': 'row = anim.row + direction index; directions follow atan2(dy, dx) '
                          'on screen in 45 degree steps, starting East and turning clockwise',
        'animations': anims,
        'palette': {m: ['#%02x%02x%02x' % c for c in ramp] for m, ramp in palette_keys().items()},
        'palette_note': 'ramps are [line, shadow, base, light]; socks use the shirt ramp. '
                        'Swap exact colours to recolour kits, boots or hair.',
        'kits': {k: {m: ['#%02x%02x%02x' % c for c in ramp] for m, ramp in v.items()}
                 for k, v in KITS.items()},
    }


def preview(sheet, path, z=3):
    """labelled, zoomed contact sheet: animations side by side, one row per direction,
    each frame named underneath"""
    from PIL import ImageDraw
    meta = sheet_meta(sheet.shape[1] // CELL)
    lab, top, foot, gap, C = 34, 22, 20, 14, CELL * z
    widths = [meta['animations'][n]['frames'] * C for n, _, _, _ in ANIMS]
    img = Image.new('RGBA', (lab + sum(widths) + gap * (len(ANIMS) - 1) + 8, top + len(DIRS) * C + foot),
                    (16, 28, 20, 255))
    d = ImageDraw.Draw(img)
    for di, dn in enumerate(DIRS):
        d.text((8, top + di * C + C // 2 - 5), dn, fill=(157, 255, 60, 255))
    x = lab
    for (name, _, _, names), w in zip(ANIMS, widths):
        m = meta['animations'][name]
        d.text((x + 4, 5), name, fill=(233, 245, 236, 255))
        for f, label in enumerate(names):
            d.text((x + f * C + 4, top + len(DIRS) * C + 5), label, fill=(157, 255, 60, 255))
        for di in range(len(DIRS)):
            r = m['row'] + di
            for f in range(m['frames']):
                fill = (49, 129, 77, 255) if (di + f) % 2 else (43, 116, 69, 255)
                x0, y0 = x + f * C, top + di * C
                d.rectangle([x0, y0, x0 + C - 1, y0 + C - 1], fill=fill)
                cell = Image.fromarray(sheet[r * CELL:(r + 1) * CELL, f * CELL:(f + 1) * CELL], 'RGBA')
                img.alpha_composite(cell.resize((C, C), Image.NEAREST), (x0, y0))
        x += w + gap
    img.save(path)


def preview_gif(sheet, path, z=3):
    """every animation looping in all 8 directions"""
    from PIL import ImageDraw
    meta = sheet_meta(sheet.shape[1] // CELL)
    tick, total, lab, C = 20, 1680, 52, CELL * z      # 1680 ms divides evenly into every fps used
    W, H = lab + len(DIRS) * C, 16 + len(ANIMS) * C
    base = Image.new('RGBA', (W, H), (16, 28, 20, 255))
    d = ImageDraw.Draw(base)
    for di, dn in enumerate(DIRS):
        d.text((lab + di * C + C // 2 - 6, 3), dn, fill=(157, 255, 60, 255))
    for ai, (name, _, _, _) in enumerate(ANIMS):
        d.text((6, 16 + ai * C + C // 2 - 5), name, fill=(233, 245, 236, 255))
        for di in range(len(DIRS)):
            fill = (49, 129, 77, 255) if (ai + di) % 2 else (43, 116, 69, 255)
            d.rectangle([lab + di * C, 16 + ai * C, lab + (di + 1) * C - 1, 16 + (ai + 1) * C - 1], fill=fill)
    frames = []
    for t in range(0, total, tick):
        fr = base.copy()
        for ai, (name, _, fps, _) in enumerate(ANIMS):
            m = meta['animations'][name]
            f = int(t / 1000 * fps)
            f = f % m['frames'] if m['loop'] else min(f % (m['frames'] + 4), m['frames'] - 1)
            for di in range(len(DIRS)):
                r = m['row'] + di
                cell = Image.fromarray(sheet[r * CELL:(r + 1) * CELL, f * CELL:(f + 1) * CELL], 'RGBA')
                fr.alpha_composite(cell.resize((C, C), Image.NEAREST), (lab + di * C, 16 + ai * C))
        frames.append(fr.convert('RGB'))
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=tick, loop=0)


GAME_TEAMS = {'G': 'green', 'R': 'red'}     # index.html team id -> kit


def embed(index_path, sheet_path):
    """write the sheet and its palettes into index.html (the PLAYER_SHEET / PLAYER_SHEET_PAL lines)"""
    import base64
    src = open(index_path, encoding='utf-8').read()
    b64 = base64.b64encode(open(sheet_path, 'rb').read()).decode()
    hexr = lambda ramp: ['#%02x%02x%02x' % tuple(c) for c in ramp]
    pal = {'drawn': {m: hexr(r) for m, r in palette_keys().items()},
           'kits': {t: {m: hexr(r) for m, r in KITS[k].items()} for t, k in GAME_TEAMS.items()}}
    lines, hits = src.split('\n'), 0
    for i, line in enumerate(lines):
        lead = line[:len(line) - len(line.lstrip())]
        if line.lstrip().startswith('const PLAYER_SHEET = '):
            lines[i] = lead + 'const PLAYER_SHEET = "data:image/png;base64,' + b64 + '";'
            hits += 1
        elif line.lstrip().startswith('const PLAYER_SHEET_PAL = '):
            lines[i] = lead + 'const PLAYER_SHEET_PAL = ' + json.dumps(pal, separators=(',', ':')) + ';'
            hits += 1
    assert hits == 2, 'PLAYER_SHEET / PLAYER_SHEET_PAL lines not found in ' + index_path
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print('embedded', os.path.basename(sheet_path), '->', index_path, '(%d base64 chars)' % len(b64))


def main(outdir):
    check_palette()
    os.makedirs(outdir, exist_ok=True)
    log = []
    sheet = build_sheet(log)
    for name, d, shifts in log:
        print('  fitted', name, d, [tuple(int(v) for v in sh) for sh in shifts])
    save_indexed(sheet, os.path.join(outdir, 'player_sheet.png'))
    for kit, ramps in KITS.items():
        if ramps:
            save_indexed(recolor(sheet, ramps), os.path.join(outdir, 'player_sheet_%s.png' % kit))
    meta = sheet_meta(sheet.shape[1] // CELL)
    with open(os.path.join(outdir, 'player_sheet.json'), 'w') as f:
        json.dump(meta, f, indent=2)
        f.write('\n')
    preview(sheet, os.path.join(outdir, 'player_sheet_preview.png'))
    preview_gif(sheet, os.path.join(outdir, 'player_sheet_preview.gif'))
    print('wrote', outdir, sheet.shape[1], 'x', sheet.shape[0])


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    outdir = args[0] if args else os.path.join(root, 'assets', 'sprites')
    main(outdir)
    if '--embed' in sys.argv:
        embed(os.path.join(root, 'index.html'), os.path.join(outdir, 'player_sheet.png'))

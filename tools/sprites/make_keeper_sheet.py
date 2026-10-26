#!/usr/bin/env python3
"""First Touch Football -- goalkeeper sprite sheet generator.

Same pipeline and style as the player sheet (make_player_sheet.py, which this imports): a small 3D
skeleton posed per frame, ray-marched one ray per pixel, cleaned up like hand pixel art and topped with
the hand-drawn heads. The keeper wears long sleeves, gloves and his own top, and has his own moves:
the set position, a side-shuffle along his line, a run, the ball held to his chest, the kick out, and
dives to either side (stretched in the air, then down on the turf).

    python3 tools/sprites/make_keeper_sheet.py            # writes assets/sprites/keeper_sheet*
    python3 tools/sprites/make_keeper_sheet.py --embed    # ...and embeds it in index.html
    python3 tools/sprites/make_keeper_sheet.py --embed-classic   # ...or in classic.html

Sheet layout, 32x32 cells, rows animation-major like the player sheet:
    ready, shuffle, run, hold, kick -- 8 rows each, directions in snap8 order (E, SE, S, SW, W, NW, N, NE)
    dive -- 4 rows: up the screen facing E, down the screen facing E, then the same two facing W
The keeper's top, shorts and trim are recoloured in the game by exact palette swap, like the kits.
"""
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_player_sheet as pl                     # noqa: E402  (the shared renderer)

CELL, CAN, PAD = pl.CELL, pl.CAN, pl.PAD

# ----------------------------------------------------------------------------- materials
# gloves and the held ball get ramps of their own, unlike any kit colour, so a kit swap never touches them
pl.RAMPS['gloves'] = [(64, 68, 76), (184, 190, 198), (232, 236, 240), (252, 253, 254)]
pl.RAMPS['ball'] = [(28, 30, 26), (164, 170, 158), (236, 240, 230), (250, 251, 246)]
pl.TONES['gloves'] = (0.85, 0.30)
pl.TONES['ball'] = (0.75, 0.15)

SLEEVE_BANDS = [(1.0, 'shirt')]                     # a keeper's sleeves run down to his gloves


def keeper_prims(J, pose, phi):
    Rw = pl.local_to_world_matrix(phi)
    W = lambda k: Rw @ J[k]
    prims = [
        pl.Ellipsoid(W('chest'), pl.TORSO_R, Rw @ J['Rt'], 'shirt', 'torso'),
        pl.Ellipsoid(Rw @ (J['chest'] + J['Rt'] @ np.array(pl.COLLAR_AT)), pl.COLLAR_R, Rw @ J['Rt'], 'trim', 'torso'),
        pl.Ellipsoid(W('pelvis') + Rw @ J['Rp'] @ np.array([0, 0, 0.1]), pl.PELVIS_R, Rw @ J['Rp'], 'shorts', 'torso'),
    ]
    for s in 'RL':
        g = 'leg' + s
        prims.append(pl.Capsule(W('hip' + s), W('knee' + s), 1.5, pl.THIGH_BANDS, g))
        prims.append(pl.Capsule(W('knee' + s), W('ankle' + s), 1.2, pl.SHIN_BANDS, g))
        prims.append(pl.Capsule(W('heel' + s), W('toe' + s), 1.15, [(1.0, 'boots')], g))
        g = 'arm' + s
        prims.append(pl.Capsule(W('sho' + s), W('elb' + s), 1.25, SLEEVE_BANDS, g))
        prims.append(pl.Capsule(W('elb' + s), W('wri' + s), 1.05, SLEEVE_BANDS, g))
        prims.append(pl.Capsule(W('wri' + s), W('hand' + s), 1.45, [(1.0, 'gloves')], g))
    if pose.get('ball'):                            # held to the chest, between the gloves
        prims.append(pl.Capsule(Rw @ ball_centre(J), Rw @ ball_centre(J), 2.6, [(1.0, 'ball')], 'ball'))
    return prims


def ball_centre(J):
    return (J['handR'] + J['handL']) / 2 + J['Rt'] @ np.array([0, 1.1, 0.2])


def add_wristbands(L):
    """the last row of each sleeve, where it meets the glove, is trim: a clean 1px band"""
    hit, mat, grp, tone = L['hit'], L['mat'], L['grp'], L['tone']
    band = [(y, x) for y, x in zip(*np.where(hit))
            if mat[y, x] == 'shirt' and str(grp[y, x]).startswith('arm')
            and any(hit[q] and grp[q] == grp[y, x] and mat[q] == 'gloves' for q in pl.nbrs(y, x))]
    for q in band:
        mat[q], tone[q] = 'trim', 2


def render_frame(pose, phi, head_rows, head_at):
    J = pl.build_skeleton(pose)
    hit, mat, grp, nrm, depth = pl.raymarch(keeper_prims(J, pose, phi))
    L = dict(hit=hit, mat=mat, grp=grp, depth=depth, tone=pl.shade(hit, mat, nrm))
    pl.clean_silhouette(L)
    add_wristbands(L)
    pl.despeckle(L)
    pl.shade_far_limbs(L)
    pl.part_lines(L)
    img = pl.compose(L, head_rows, head_at)
    if pose.get('ball'):                            # a dark panel on the ball, where it shows, so it reads as one
        w = pl.local_to_world_matrix(phi) @ ball_centre(J)
        x, y = pl.snap(pl.OX + w[0] - 0.5), pl.snap(pl.OY - w[2] + 0.5 * w[1] - 0.5)
        for q in ((y, x), (y, x + 1)):
            if L['hit'][q] and L['mat'][q] == 'ball':
                img[q] = (*pl.RAMPS['ball'][0], 255)
    return img


# ----------------------------------------------------------------------------- poses
P = pl.P


def anim_ready():
    """the set position: feet apart, knees bent, weight forward, gloves up and open"""
    leg = dict(flex=24, knee=46, ankle=6, abd=13, toe=14)
    arm = dict(flex=44, abd=34, elbow=52)
    return [P(lean=16, root=(0, -0.3, -1.1), R=dict(leg), L=dict(leg), aR=dict(arm), aL=dict(arm))]


def anim_shuffle():
    """a side step along the line, staying set: feet wide, then drawn together"""
    arm = dict(flex=40, abd=32, elbow=54)
    wide = P(lean=14, root=(0, -0.3, -1.2),
             R=dict(flex=20, knee=42, ankle=6, abd=21, toe=14), L=dict(flex=20, knee=42, ankle=6, abd=21, toe=14),
             aR=dict(arm), aL=dict(arm))
    close = P(lean=14, root=(0, -0.3, -0.8),
              R=dict(flex=16, knee=34, ankle=6, abd=4, toe=10), L=dict(flex=16, knee=34, ankle=6, abd=4, toe=10),
              aR=dict(arm), aL=dict(arm))
    close['bob'] = -1
    return [wide, close]


def anim_hold():
    """the ball gathered into the chest, elbows in"""
    leg = dict(flex=6, knee=12, abd=7, toe=12)
    return [P(lean=6, R=dict(leg), L=dict(leg),
              aR=dict(flex=62, abd=-6, elbow=96), aL=dict(flex=62, abd=-6, elbow=96))
            | {'ball': True}]


def anim_kick():
    """the kick out of his hands: kicking leg swung through high, arms flung wide for balance"""
    return [P(lean=-12, twist=10, root=(0, 0.6, 0.0),
              R=dict(flex=96, knee=4, ankle=40, toe=0, abd=-6, len=1.15), L=dict(flex=-6, knee=16, ankle=20),
              aR=dict(flex=30, abd=74, elbow=20), aL=dict(flex=-16, abd=92, elbow=16))]


def dive_pose(up):
    """a full-stretch dive along the goal line: rolled on to his side, legs trailing together, arms out past
    his head. Seen from this camera a dive straight along the line is all foreshortening, so the body goes
    forward too and climbs toward the top corner (up the screen) or drops toward the bottom one (down it)."""
    s = -1 if up else 1                            # up the screen = to his left when he faces E
    roll = s * 78 if up else s * 102               # down the screen: head lower than his feet
    return P(lean=6, roll=roll, yaw=s * 64, root=(0, 0.6, -0.8 if up else 1.4),
             R=dict(flex=4, knee=14, abd=-s * 86, ankle=14, len=1.3),
             L=dict(flex=-6, knee=6, abd=s * 86, ankle=14, len=1.3),
             aR=dict(flex=172, abd=-10, elbow=4, len=1.15), aL=dict(flex=162, abd=-14, elbow=8, len=1.15))


# Gloves at full stretch, painted in front of the face: in this style the head is bigger than the reach of
# the arms, so the arms run behind it and only the gloves show, out ahead of him (as a pixel artist draws it).
GLOVE = ['.KKK.', 'KlbbK', 'KbbsK', 'KbssK', '.KKK.']
GLOVE_AT = {True: ((14, 1), (15, 8)), False: ((14, 4), (15, 11))}     # top-left, relative to the head's
HEAD_ALONG = 7.0       # head centre past the neck (px), so the top shows between his legs and his head
DIVE_LIFT = 5          # the stretch is this many px off the turf; "down" lies on it


def render_dive(up):
    """the two dive frames, facing E, going up (to his left) or down (to his right) the screen: the stretch
    in the air, then down on the turf. Centred over the ground point; the stretch is lifted off it."""
    pose, phi = dive_pose(up), 0.0
    rows = pl.HEADS['E']
    J, Rw = pl.build_skeleton(pose), pl.local_to_world_matrix(phi)
    scr = lambda v: np.array([pl.OX + (Rw @ v)[0], pl.OY - (Rw @ v)[2] + 0.5 * (Rw @ v)[1]])
    c, n = scr(J['chest']), scr(J['neck'])
    d = (n - c) / (np.linalg.norm(n - c) or 1)
    ctr = n + d * HEAD_ALONG
    at = (pl.snap(ctr[0] - len(rows[0]) / 2), pl.snap(ctr[1] - len(rows) / 2))
    img = render_frame(pose, phi, rows, at)
    pal = {'K': pl.OUTLINE, 'l': pl.RAMPS['gloves'][3], 'b': pl.RAMPS['gloves'][2], 's': pl.RAMPS['gloves'][1]}
    for gx, gy in GLOVE_AT[up]:
        for j, row in enumerate(GLOVE):
            for i, ch in enumerate(row):
                if ch != '.':
                    img[at[1] + gy + j, at[0] + gx + i] = (*pal[ch], 255)
    ys, xs = np.where(img[:, :, 3] > 0)
    out = []
    for lift in (DIVE_LIFT, 0):                     # in the air, then down: centred on the ground point
        dx = int(pl.snap(pl.OX - (xs.min() + xs.max() + 1) / 2))
        dy = int(pl.snap(pl.OY + 1 - lift - (ys.max() + 1)))
        moved = np.zeros_like(img)
        moved[max(0, dy):pl.CAN + min(0, dy), max(0, dx):pl.CAN + min(0, dx)] = \
            img[max(0, -dy):pl.CAN - max(0, dy), max(0, -dx):pl.CAN - max(0, dx)]
        out.append(pl.crop(moved, (0, 0)))
    return out, (0, 0)


# name, poses, suggested fps, what each frame is
ANIMS8 = [
    ('ready', anim_ready, 1, ['set']),
    ('shuffle', anim_shuffle, 8, ['wide', 'together']),
    ('run', pl.anim_run, 10, ['contact R', 'passing', 'contact L', 'passing']),
    ('hold', anim_hold, 1, ['ball held']),
    ('kick', anim_kick, 1, ['kick out']),
]
DIVE_ROWS = [('up', 'E'), ('down', 'E'), ('up', 'W'), ('down', 'W')]
DIVE_FRAMES = ['in the air', 'down']
STEADY_HEAD = {'ready', 'shuffle', 'run'}


def render_row(name, poses, d):
    phi = math.radians(pl.DIR_ANGLE[d])
    heads = pl.head_positions(poses, phi, pl.HEADS[d], steady=name in STEADY_HEAD)
    imgs = [render_frame(p, phi, pl.HEADS[d], h) for p, h in zip(poses, heads)]
    shift = pl.fit_shift(imgs)
    return [pl.crop(im, shift) for im in imgs], shift


def build_sheet(log=None):
    cols = 4
    blank = np.zeros((CELL, CELL, 4), np.uint8)
    rows = []
    pad = lambda cells: np.concatenate(cells + [blank] * (cols - len(cells)), axis=1)
    for name, fn, _, _ in ANIMS8:
        poses = fn()
        drawn = {}
        for d in pl.DIR_ANGLE:
            drawn[d], shift = render_row(name, poses, d)
            if log is not None and shift != (0, 0):
                log.append((name, d, shift))
        for d in pl.DIRS:
            cells = drawn[d] if d not in pl.MIRROR else [c[:, ::-1].copy() for c in drawn[pl.MIRROR[d]]]
            rows.append(pad(cells))
    dives = {}
    for up in (True, False):
        dives[up], shift = render_dive(up)
        if log is not None and shift != (0, 0):
            log.append(('dive', 'up' if up else 'down', shift))
    for way, facing in DIVE_ROWS:
        cells = dives[way == 'up']
        if facing == 'W':
            cells = [c[:, ::-1].copy() for c in cells]
        rows.append(pad(cells))
    return np.concatenate(rows, axis=0)


# ----------------------------------------------------------------------------- export
def sheet_meta():
    anims, row = {}, 0
    for name, fn, fps, names in ANIMS8:
        anims[name] = {'row': row, 'frames': len(fn()), 'fps': fps, 'loop': name in ('shuffle', 'run'),
                       'frame_names': names}
        row += len(pl.DIRS)
    anims['dive'] = {'row': row, 'frames': 2, 'fps': 2, 'loop': False, 'frame_names': DIVE_FRAMES,
                     'rows': ['%s the screen, facing %s' % w for w in DIVE_ROWS]}
    return {
        'image': 'keeper_sheet.png',
        'frame': {'w': CELL, 'h': CELL},
        'columns': 4,
        'anchor': {'x': int(pl.CX), 'y': int(pl.GY)},
        'directions': pl.DIRS,
        'direction_note': 'row = anim.row + direction index (snap8 order) for every animation but dive, '
                          'whose four rows are listed under it',
        'animations': anims,
        'palette': {m: ['#%02x%02x%02x' % c for c in pl.RAMPS[m]] for m in ('shirt', 'trim', 'shorts', 'boots')},
        'palette_note': 'ramps are [line, shadow, base, light]; socks use the shirt ramp. The game swaps '
                        'shirt (and socks) to the keeper top, and trim and shorts to a dark kit.',
    }


def preview(sheet, path, z=3):
    from PIL import Image, ImageDraw
    meta = sheet_meta()
    C, lab, top = CELL * z, 70, 18
    blocks = [(n, meta['animations'][n]) for n, _, _, _ in ANIMS8]
    width = lab + sum(a['frames'] * C + 12 for _, a in blocks)
    height = top + len(pl.DIRS) * C + 30 + top + 4 * C + 8
    img = Image.new('RGBA', (width, height), (16, 28, 20, 255))
    d = ImageDraw.Draw(img)
    for di, dn in enumerate(pl.DIRS):
        d.text((8, top + di * C + C // 2 - 5), dn, fill=(157, 255, 60, 255))
    x = lab
    for name, a in blocks:
        d.text((x + 4, 4), name, fill=(233, 245, 236, 255))
        for di in range(len(pl.DIRS)):
            for f in range(a['frames']):
                x0, y0 = x + f * C, top + di * C
                d.rectangle([x0, y0, x0 + C - 1, y0 + C - 1], fill=(49, 129, 77, 255) if (di + f) % 2 else (43, 116, 69, 255))
                r = a['row'] + di
                cell = Image.fromarray(sheet[r * CELL:(r + 1) * CELL, f * CELL:(f + 1) * CELL], 'RGBA')
                img.alpha_composite(cell.resize((C, C), Image.NEAREST), (x0, y0))
        x += a['frames'] * C + 12
    y = top + len(pl.DIRS) * C + 30
    d.text((8, y - 14), 'dive', fill=(233, 245, 236, 255))
    a = meta['animations']['dive']
    for i, label in enumerate(a['rows']):
        for f in range(2):
            x0, y0 = lab + (i * 2 + f) * (C + 4), y
            d.rectangle([x0, y0, x0 + C - 1, y0 + C - 1], fill=(49, 129, 77, 255) if f % 2 else (43, 116, 69, 255))
            r = a['row'] + i
            cell = Image.fromarray(sheet[r * CELL:(r + 1) * CELL, f * CELL:(f + 1) * CELL], 'RGBA')
            img.alpha_composite(cell.resize((C, C), Image.NEAREST), (x0, y0))
        d.text((lab + i * 2 * (C + 4), y + C + 2), label.replace('the screen, ', ''), fill=(157, 255, 60, 255))
    img.save(path)


def palette_keys():
    keys = {m: list(pl.RAMPS[m]) for m in ('shirt', 'trim', 'shorts', 'boots')}
    keys['hair'] = [pl.HEAD_PAL[k] for k in pl.HAIR_KEYS]
    return keys


def check_palette():
    """the colours the game swaps must each belong to one material only (gloves and ball included)"""
    owners = {}
    for m, ramp in pl.RAMPS.items():
        if m != 'socks':
            for c in ramp:
                owners.setdefault(tuple(c), set()).add(m)
    for k, c in pl.HEAD_PAL.items():
        owners.setdefault(tuple(c), set()).add('hair' if k in pl.HAIR_KEYS else 'head')
    owners.setdefault(tuple(pl.OUTLINE), set()).add('outline')
    for m in ('shirt', 'trim', 'shorts', 'boots', 'gloves', 'ball'):
        for c in pl.RAMPS[m]:
            assert owners[tuple(c)] == {m}, 'palette clash: %s shares %r with %r' % (m, c, owners[tuple(c)])


def embed(index_path, sheet_path):
    """write the sheet and its palette into index.html (the KEEPER_SHEET / KEEPER_SHEET_PAL lines)"""
    import base64
    src = open(index_path, encoding='utf-8').read()
    b64 = base64.b64encode(open(sheet_path, 'rb').read()).decode()
    hexr = lambda ramp: ['#%02x%02x%02x' % tuple(c) for c in ramp]
    meta = sheet_meta()
    pal = {'drawn': {m: hexr(r) for m, r in palette_keys().items()},
           'rows': {n: meta['animations'][n]['row'] for n in meta['animations']},
           'frames': {n: meta['animations'][n]['frames'] for n in meta['animations']}}
    lines, hits = src.split('\n'), 0
    for i, line in enumerate(lines):
        lead = line[:len(line) - len(line.lstrip())]
        if line.lstrip().startswith('const KEEPER_SHEET = '):
            lines[i] = lead + 'const KEEPER_SHEET = "data:image/png;base64,' + b64 + '";'
            hits += 1
        elif line.lstrip().startswith('const KEEPER_SHEET_PAL = '):
            lines[i] = lead + 'const KEEPER_SHEET_PAL = ' + json.dumps(pal, separators=(',', ':')) + ';'
            hits += 1
    assert hits == 2, 'KEEPER_SHEET / KEEPER_SHEET_PAL lines not found in ' + index_path
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print('embedded', os.path.basename(sheet_path), '->', index_path, '(%d base64 chars)' % len(b64))


def main(outdir):
    check_palette()
    os.makedirs(outdir, exist_ok=True)
    log = []
    sheet = build_sheet(log)
    for name, d, shift in log:
        print('  fitted', name, d, tuple(int(v) for v in shift))
    pl.save_indexed(sheet, os.path.join(outdir, 'keeper_sheet.png'))
    with open(os.path.join(outdir, 'keeper_sheet.json'), 'w') as f:
        json.dump(sheet_meta(), f, indent=2)
        f.write('\n')
    preview(sheet, os.path.join(outdir, 'keeper_sheet_preview.png'))
    print('wrote', outdir, sheet.shape[1], 'x', sheet.shape[0])


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    outdir = args[0] if args else os.path.join(root, 'assets', 'sprites')
    main(outdir)
    if '--embed' in sys.argv:
        embed(os.path.join(root, 'index.html'), os.path.join(outdir, 'keeper_sheet.png'))
    if '--embed-classic' in sys.argv:
        embed(os.path.join(root, 'classic.html'), os.path.join(outdir, 'keeper_sheet.png'))

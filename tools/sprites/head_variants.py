"""Head variants for the player sprite: hairstyles and overlays built from the hand-drawn base head.

The base head (make_player_sheet.HEADS) is one hairstyle -- a full mop -- drawn in five views (S, SE, E,
NE, N; the other three are mirrors). Every style here starts from those same pixels, so the face, the eyes
and the head's outline stay exactly as drawn, and only the hair changes:

    mop      the base head
    crop     shorter on top, the forehead showing under a hairline
    bald     the dome in skin, eyebrows kept
    afro     the hair grown out two pixels all round the top and sides
    long     a curtain falling past the chin (over the shoulders behind)
    mohawk   bald sides, a crest down the middle
    bun      the crop with a knot on top

and two overlays, drawn over any style:

    beard    jaw and chin in the hair colour
    band     a headband across the brow, in the kit's trim colour

A style or overlay is a char grid in the head palette (see make_player_sheet.HEAD_PAL, plus t/u/v/T for
the trim ramp) and an offset (ox, oy) of its top-left from the base grid's top-left, so it can sit
outside the base 16x15 box (taller hair, a fall below the chin). Every style covers at least the base
head's own pixels, so whatever of the body the base head hid stays hidden.
"""

PADX, PADT, PADB = 3, 4, 4          # room around the base grid for hair to grow into
HAIR = set('D123')
SKIN = set('abcr')
FACE = SKIN | set('lwp')
VIEWS = ['S', 'SE', 'E', 'NE', 'N']
FRONT = {'S', 'SE', 'E'}            # views that show the face


class Grid:
    """a base head on a padded canvas; get/set take base-grid coordinates (may be negative)."""

    def __init__(self, rows):
        self.bw, self.bh = len(rows[0]), len(rows)
        self.w, self.h = self.bw + 2 * PADX, self.bh + PADT + PADB
        self.g = [['.'] * self.w for _ in range(self.h)]
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                self.g[j + PADT][i + PADX] = ch

    def copy(self):
        o = Grid.__new__(Grid)
        o.bw, o.bh, o.w, o.h = self.bw, self.bh, self.w, self.h
        o.g = [r[:] for r in self.g]
        return o

    def get(self, r, c):
        R, C = r + PADT, c + PADX
        return self.g[R][C] if 0 <= R < self.h and 0 <= C < self.w else '.'

    def set(self, r, c, ch):
        R, C = r + PADT, c + PADX
        if 0 <= R < self.h and 0 <= C < self.w:
            self.g[R][C] = ch

    def cells(self):
        for R in range(self.h):
            for C in range(self.w):
                yield R - PADT, C - PADX

    def rows_range(self):
        return range(-PADT, self.bh + PADB)

    def cols_range(self):
        return range(-PADX, self.bw + PADX)

    def export(self):
        """(rows, ox, oy): the grid trimmed to what's drawn, and its top-left from the base grid's."""
        used = [(R, C) for R in range(self.h) for C in range(self.w) if self.g[R][C] != '.']
        if not used:
            return [], 0, 0                   # (an overlay with nothing to draw from this view)
        r0, r1 = min(r for r, _ in used), max(r for r, _ in used)
        c0, c1 = min(c for _, c in used), max(c for _, c in used)
        rows = [''.join(self.g[R][c0:c1 + 1]) for R in range(r0, r1 + 1)]
        return rows, c0 - PADX, r0 - PADT


def n4(r, c):
    return ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1))


def n8(r, c):
    return n4(r, c) + ((r - 1, c - 1), (r - 1, c + 1), (r + 1, c - 1), (r + 1, c + 1))


def head_mid(G):
    """the column the head's silhouette is centred on, at its widest rows"""
    xs = [c for r, c in G.cells() if G.get(r, c) != '.' and 0 <= r <= 10]
    return (min(xs) + max(xs)) / 2.0


# ----------------------------------------------------------------------------- styles
def mop(G, view):
    return G


def bald(G, view):
    """hair -> skin, shaded the way the hair was (light top-left, shadow right); the outline goes to the
    head outline; eyebrows (hair-dark beside an eyelid) stay."""
    B = G.copy()
    brow = set()
    for r, c in G.cells():
        if G.get(r, c) == '3' and ('l' in (G.get(r, c - 1), G.get(r, c + 1))):
            brow.add((r, c))
    dome = set()
    for r, c in G.cells():
        ch = G.get(r, c)
        if ch not in HAIR or (r, c) in brow:
            continue
        B.set(r, c, 'K' if ch == 'D' else 'a')
        if ch != 'D':
            dome.add((r, c))
    # shade the dome's far side (a ring in from the outline on the right), so it reads round, and light none
    mid = head_mid(G)
    for r, c in dome:
        edge = any(B.get(q, p) == 'K' for q, p in n4(r, c))
        if c > mid + 2 and edge:
            B.set(r, c, 'b')
        elif c > mid + 4 and r <= 7 and any(B.get(q, p) == 'K' for q, p in n8(r, c)):
            B.set(r, c, 'b')
    return B


def _drop_top(G, rows=1):
    """the hair sits lower on top: shave the topmost row(s) of the silhouette, re-outlining what's left."""
    B = G.copy()
    for _ in range(rows):
        cols = sorted({c for r, c in B.cells() if B.get(r, c) != '.'})
        for c in cols:
            top = min(r for r in B.rows_range() if B.get(r, c) != '.')
            if B.get(top, c) not in ('D', 'K') or top > 3:
                continue
            below = B.get(top + 1, c)
            if below in HAIR:
                B.set(top, c, '.')
                B.set(top + 1, c, 'D')
    return B


def crop(G, view):
    """shorter hair: lower on top, and in the views that show the face the fringe lifts off the forehead
    (hair just above face pixels becomes skin, the first row of it a touch shaded under the hairline)."""
    B = _drop_top(G)
    if view in FRONT:
        mid = head_mid(G)
        lift = []
        for r, c in B.cells():
            if B.get(r, c) not in HAIR or B.get(r, c) == 'D' or not 5 <= r <= 9:
                continue
            if view == 'E' and c < mid + 1:
                continue                  # the back of the head (and the ear) keeps its hair
            if view == 'SE' and c < mid - 1:
                continue
            if any(B.get(r + k, c) in FACE for k in (1, 2, 3)) and not ('l' in (B.get(r, c - 1), B.get(r, c + 1))):
                lift.append((r, c))
        for r, c in lift:
            B.set(r, c, 'a')
        for r, c in lift:                 # the hairline: the top row of new forehead, under hair
            if B.get(r - 1, c) in HAIR:
                B.set(r, c, 'b')
    return B


def afro(G, view):
    """a big round mass: an ellipse round the top of the head, out past the sides down to the temples
    (behind the head in the back views), outlined, with curls picked out in light and dark."""
    B = G.copy()
    mid = head_mid(G)
    floor = 9 if view in FRONT else 11       # how far down the sides it comes
    cy, rx, ry = 5.0, 10.2, 7.6
    grown = set()
    for r, c in B.cells():
        if B.get(r, c) != '.' or r > floor:
            continue
        if ((c - mid) / rx) ** 2 + ((r - cy) / ry) ** 2 <= 1.0:
            B.set(r, c, '2')
            grown.add((r, c))
    for r, c in B.cells():                    # re-outline
        ch = B.get(r, c)
        if ch in HAIR and any(B.get(q, p) == '.' for q, p in n4(r, c)):
            B.set(r, c, 'D')
        elif ch == 'D' and not any(B.get(q, p) == '.' for q, p in n4(r, c)):
            B.set(r, c, '3' if c > mid + 3 else '2')
    for r, c in B.cells():                    # curls
        ch = B.get(r, c)
        if ch not in ('1', '2', '3') or r > (4 if view in FRONT else 10):
            continue
        k = (r * 3 + c * 2) % 5
        if k == 0:
            B.set(r, c, '1' if c < mid + 1 else '3')
        elif k == 3 and c > mid + 2:
            B.set(r, c, '3')
    return B


def long(G, view):
    """hair past the chin: a curtain down each side of the face from the front (only behind, from the
    side), a fall down the back from behind. The curtains hang straight from the temples and hug the face;
    the fall narrows a pixel every few rows and is rounded off at the bottom."""
    B = G.copy()
    mid = head_mid(G)
    bottom = G.bh + 1                         # two rows below the chin row
    def left_edge(r):
        xs = [c for c in G.cols_range() if G.get(r, c) != '.']
        return min(xs) if xs else None
    def right_edge(r):
        xs = [c for c in G.cols_range() if G.get(r, c) != '.']
        return max(xs) if xs else None
    def curtain(left, wide):
        for r in range(5, bottom + 1):
            out = (-1 if r < 8 or r > bottom - 2 else -1 - wide) if left else (G.bw if r < 8 or r > bottom - 2 else G.bw + wide)
            e = left_edge(min(r, G.bh - 1)) if left else right_edge(min(r, G.bh - 1))
            if left:
                inner = e - 1 if r <= 11 else min(e - 1, 1)
                rng = range(out, inner + 1)
            else:
                inner = e + 1 if r <= 11 else max(e + 1, G.bw - 2)
                rng = range(inner, out + 1)
            if r == bottom:                   # round the end off
                rng = range(out + 1, inner + 1) if left else range(inner, out)
            for c in rng:
                if B.get(r, c) == '.':
                    B.set(r, c, '2')
    if view == 'S':
        curtain(True, 1)
        curtain(False, 1)
    elif view in ('SE', 'E'):
        curtain(True, 1)
    else:                                     # NE / N: the back of the head, all the way down
        l9, r9 = left_edge(9), right_edge(9)
        for r in range(9, bottom + 1):
            t = (r - 9) // 3
            lo, hi = l9 + t, r9 - t
            if r == bottom:
                lo, hi = lo + 1, hi - 1
            for c in range(lo, hi + 1):
                ch = B.get(r, c)
                if view == 'NE' and ch in FACE and c > mid + 2:
                    continue                  # the cheek still shows on the right
                if ch == '.' or ch in SKIN or ch == 'K':
                    B.set(r, c, '2')
    for r, c in B.cells():                    # outline it and shade it
        ch = B.get(r, c)
        if ch not in HAIR:
            continue
        if any(B.get(q, p) == '.' for q, p in n4(r, c)):
            B.set(r, c, 'D')
        elif r >= 5 and ch == '2' and (c > mid + 3 or any(B.get(q, p) in FACE | {'K'} for q, p in n4(r, c))):
            B.set(r, c, '3')
    return B


def mohawk(G, view):
    """bald, with a crest two pixels proud of the dome: down the middle seen from the front or back, along
    the top seen from the side."""
    B = bald(G, view)
    mid = head_mid(G)
    if view == 'E':
        lo, hi = 3, 10
        for c in range(lo, hi + 1):
            top = min(r for r in G.rows_range() if G.get(r, c) != '.')
            rise = 2 if 5 <= c <= 8 else 1          # highest in the middle: a fin, not a cap
            for r in range(top - rise, top + 2):
                B.set(r, c, '2')
    else:
        shift = {'S': 0, 'N': 0, 'SE': 1, 'NE': -1}[view]
        lo, hi = int(round(mid)) - 2 + shift, int(round(mid)) + 1 + shift
        for c in range(lo, hi + 1):
            top = min(r for r in G.rows_range() if G.get(r, c) != '.')
            for r in range(top - 2, (4 if view in FRONT else 9) + 1):
                B.set(r, c, '2')
    for r, c in B.cells():                    # outline and light the crest
        if B.get(r, c) not in HAIR:
            continue
        if any(B.get(q, p) in ('.',) or B.get(q, p) in SKIN for q, p in n4(r, c)):
            B.set(r, c, 'D')
        elif c <= lo + 1 or r < 0:
            B.set(r, c, '1')
    return B


def bun(G, view):
    """the crop, with a knot of hair on top (toward the back, seen from the side)"""
    B = crop(G, view)
    top_c = {'S': 7, 'N': 7, 'SE': 6, 'NE': 7, 'E': 4}[view]
    top = min(r for r in B.rows_range() if B.get(r, top_c) != '.')
    blob = ['.DD.', 'D12D', 'D22D']           # a little ball, sitting on the head
    for j, row in enumerate(blob):
        for i, ch in enumerate(row):
            if ch != '.':
                B.set(top - 3 + j, top_c - 1 + i, ch)
    return B


STYLES = {'mop': mop, 'crop': crop, 'bald': bald, 'afro': afro, 'long': long, 'mohawk': mohawk, 'bun': bun}


# ----------------------------------------------------------------------------- overlays
def beard(G, view):
    """jaw, cheeks and chin in the hair colour, a gap left for the mouth (nothing from behind)"""
    O = Grid([['.'] * G.bw for _ in range(G.bh)])
    if view == 'N':
        return O
    h = G.bh
    face12 = [c for c in G.cols_range() if G.get(h - 3, c) in SKIN]
    fmid = (min(face12) + max(face12)) / 2.0 if face12 else head_mid(G)
    if view == 'E':
        fmid += 2                              # the mouth's toward the front, seen from the side
    for r, c in G.cells():
        ch = G.get(r, c)
        if r < h - 3 or ch == '.' or ch in ('w', 'p', 'l'):
            continue
        if view == 'NE' and c < head_mid(G) + 3:
            continue
        if r == h - 3 and abs(c - fmid) < 2.1:
            continue                           # the mouth
        if r == h - 1 or ch in ('r', 'K'):
            O.set(r, c, 'D')
        elif ch in SKIN:
            O.set(r, c, '3' if ch in ('c',) or any(G.get(q, p) in ('.', 'K', 'r') for q, p in n4(r, c)) else '2')
    return O


def band(G, view):
    """a headband across the brow (row 5), in the trim colours; its ends get the trim's line colour"""
    O = Grid([['.'] * G.bw for _ in range(G.bh)])
    mid = head_mid(G)
    r = 5
    xs = [c for c in G.cols_range() if G.get(r, c) != '.']
    for c in range(min(xs), max(xs) + 1):
        O.set(r, c, 'v' if c in (min(xs), max(xs)) else ('u' if c > mid + 3 else 't'))
    if view == 'E':                            # the knot's tails, out the back
        O.set(r + 1, min(xs) - 1, 'u')
        O.set(r + 2, min(xs) - 1, 'v')
    return O


OVERLAYS = {'beard': beard, 'band': band}


def build(heads):
    """{(name, view): (rows, ox, oy)} for every style and overlay, from the base heads by view"""
    out = {}
    for view in VIEWS:
        base = Grid(heads[view])
        for name, fn in list(STYLES.items()) + list(OVERLAYS.items()):
            out[(name, view)] = fn(base.copy(), view).export()
    return out

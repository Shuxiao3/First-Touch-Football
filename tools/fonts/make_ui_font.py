#!/usr/bin/env python3
"""Football Classic -- the one font the menus and the match use.

DotGothic16 (Fontworks, SIL Open Font License 1.1), cut down to the characters the game shows, with the few
symbols it lacks (play/back triangles, the little menu caret, close, the menu bars, the clock, the cog...) drawn
in on its own 16-dot grid so every character on screen is the same kind of pixel. Its Latin is monospaced, so
letters and punctuation are respaced to their own width plus a dot of air, like a handheld RPG's font ("$20,000"
rather than "$20, 000"); the digits keep one width so columns of numbers still line up.

The source font isn't kept in the repo (it's 2 MB of Japanese). Fetch it first:

    curl -LO https://raw.githubusercontent.com/google/fonts/main/ofl/dotgothic16/DotGothic16-Regular.ttf

    python3 tools/fonts/make_ui_font.py DotGothic16-Regular.ttf                  # writes assets/fonts/ftc-dotgothic.woff2
    python3 tools/fonts/make_ui_font.py DotGothic16-Regular.ttf --embed-classic  # ...and embeds it in classic.html

The licence travels with the font: assets/fonts/OFL-DotGothic16.txt, and the font's own name table (kept whole).
Needs fonttools and brotli (dev only).
"""
import base64
import os
import re
import sys

from fontTools import subset
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

DOT = 62.5          # one dot: the font is drawn on 16 dots to the em
KEEP = ([range(0x20, 0x7F), range(0xA0, 0x100), [0x152, 0x153, 0x160, 0x161, 0x178, 0x17D, 0x17E],
         range(0x2010, 0x2028), [0x2030, 0x2039, 0x203A, 0x20AC, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193,
                                 0x2212, 0x221D, 0x25B2, 0x25BC, 0x25CB, 0x25CF, 0x2605, 0x2606]])

# The added symbols, top row first. '#' is a dot; each row is one dot tall, its bottom row sits on `base`.
# A glyph n dots wide gets n+1 dots of advance (half a dot of air each side), like the font's own letters.
NEW = {
    0x25B6: (2, ['#....', '##...', '###..', '####.', '#####', '####.', '###..', '##...', '#....']),           # ▶
    0x25C0: (2, ['....#', '...##', '..###', '.####', '#####', '.####', '..###', '...##', '....#']),           # ◀
    0x25B8: (4, ['#..', '##.', '###', '##.', '#..']),                                                       # ▸
    0x25C2: (4, ['..#', '.##', '###', '.##', '..#']),                                                       # ◂
    0x25BE: (4, ['#######', '.#####.', '..###..', '...#...']),                                              # ▾
    0x2715: (2, ['#.....#', '##...##', '.##.##.', '..###..', '.##.##.', '##...##', '#.....#']),             # ✕
    0x2630: (2, ['#######', '#######', '.......', '#######', '#######', '.......', '#######', '#######']),   # ☰
    0x2248: (3, ['.##...#', '#..###.', '.......', '.##...#', '#..###.']),                                   # ≈
    0x23F1: (0, ['..###..', '...#...', '.#####.', '#..#..#', '#..#..#', '#..##.#', '#.....#', '#.....#', '.#####.']),   # ⏱
    0x2699: (1, ['...#...', '.#####.', '.##.##.', '###.###', '.##.##.', '.#####.', '...#...']),             # ⚙
    0x21BB: (1, ['..###.#', '.#...##', '#...###', '#......', '#.....#', '.#...#.', '..###..']),             # ↻
    0x2197: (1, ['..#####', '.....##', '....#.#', '...#..#', '..#....', '.#.....', '#......']),             # ↗
    0x2198: (1, ['#......', '.#.....', '..#....', '...#..#', '....#.#', '.....##', '..#####']),             # ↘
    0x2199: (1, ['......#', '.....#.', '....#..', '#..#...', '#.#....', '##.....', '#####..']),             # ↙
    0x2196: (1, ['#####..', '##.....', '#.#....', '#..#...', '....#..', '.....#.', '......#']),             # ↖
    0x23ED: (2, ['#...#...#', '##..##..#', '###.###.#', '#########', '###.###.#', '##..##..#', '#...#...#']),   # ⏭
}


# respaced to their ink: letters and punctuation (digits stay tabular); the space is 5 dots
PROP = [u for r in (range(0x21, 0x30), range(0x3A, 0x7F), range(0xA1, 0x100), [0x152, 0x153, 0x160, 0x161, 0x178,
        0x17D, 0x17E], range(0x2010, 0x2028), [0x2030, 0x2039, 0x203A, 0x20AC, 0x2122]) for u in r]
SPACE = 5


def decompose_all(font):
    """composite glyphs (accented letters) become plain outlines, so respacing a base letter can't move its accents"""
    glyf, gs = font['glyf'], font.getGlyphSet()
    from fontTools.pens.recordingPen import DecomposingRecordingPen
    for name in font.getGlyphOrder():
        g = glyf[name]
        if g.isComposite():
            rec = DecomposingRecordingPen(gs)
            gs[name].draw(rec)
            pen = TTGlyphPen(None)
            rec.replay(pen)
            glyf[name] = pen.glyph()
            glyf[name].recalcBounds(glyf)


def respace(font):
    """each PROP glyph: ink moved to start half a dot in, advance = ink + one dot"""
    glyf, hmtx, cmap, done = font['glyf'], font['hmtx'], font.getBestCmap(), set()
    for u in PROP:
        name = cmap.get(u)
        if not name or name in done:
            continue
        done.add(name)
        g = glyf[name]
        g.recalcBounds(glyf)
        if not g.numberOfContours:
            continue
        c0 = round((g.xMin + DOT / 2) / DOT)
        c1 = round((g.xMax - DOT / 2) / DOT)
        shift = round((c0 - 1) * DOT)
        if shift:
            coords = g.coordinates
            for k in range(len(coords)):
                x, y = coords[k]
                coords[k] = (x - shift, y)
            g.recalcBounds(glyf)
        hmtx.metrics[name] = (round((c1 - c0 + 2) * DOT), g.xMin)
    sp = cmap.get(0x20)
    if sp:
        hmtx.metrics[sp] = (round(SPACE * DOT), 0)


def dot_glyph(rows, base):
    """a TrueType glyph from dot rows: each row's runs become one rectangle"""
    pen, h = TTGlyphPen(None), len(rows)
    for r, row in enumerate(rows):
        y0 = (base + h - 1 - r) * DOT - DOT / 2
        i = 0
        while i < len(row):
            if row[i] != '#':
                i += 1
                continue
            j = i
            while j < len(row) and row[j] == '#':
                j += 1
            x0, x1 = (i + 1) * DOT - DOT / 2, j * DOT + DOT / 2
            pts = [(x0, y0), (x0, y0 + DOT), (x1, y0 + DOT), (x1, y0)]
            pen.moveTo(*[tuple(round(c) for c in pts[0])])
            for p in pts[1:]:
                pen.lineTo(tuple(round(c) for c in p))
            pen.closePath()
            i = j
    return pen.glyph(), round((len(rows[0]) + 1) * DOT)


def build(src, out):
    font = TTFont(src)
    opts = subset.Options()
    opts.name_IDs = ['*']            # keep the copyright and licence records
    opts.name_languages = ['*']
    opts.layout_features = ['kern', 'liga', 'calt', 'ccmp', 'locl']
    opts.notdef_outline = True
    opts.flavor = None
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[u for r in KEEP for u in r])
    sub.subset(font)
    decompose_all(font)
    respace(font)
    glyf, hmtx = font['glyf'], font['hmtx']
    order = font.getGlyphOrder() + ['uni%04X' % u for u in NEW]
    font.setGlyphOrder(order)
    glyf.glyphOrder = order
    for u, (base, rows) in NEW.items():
        name = 'uni%04X' % u
        g, adv = dot_glyph(rows, base)
        glyf[name] = g
        g.recalcBounds(glyf)
        hmtx.metrics[name] = (adv, g.xMin)
        if 'vmtx' in font:
            font['vmtx'].metrics[name] = (1000, 0)
        for t in font['cmap'].tables:
            if t.isUnicode():
                t.cmap[u] = name
    font['maxp'].numGlyphs = len(order)
    font.flavor = 'woff2'
    font.save(out)
    return out


def embed(html_path, woff2):
    """write the font into classic.html as the FTC Dot face"""
    src = open(html_path, encoding='utf-8').read()
    b64 = base64.b64encode(open(woff2, 'rb').read()).decode()
    face = ("@font-face{font-family:'FTC Dot';font-style:normal;font-weight:400;font-display:block;"
            "src:url(data:font/woff2;base64," + b64 + ") format('woff2');}")
    pat = re.compile(r"@font-face\{font-family:'FTC Dot';[^}]*\}")
    if pat.search(src):
        src = pat.sub(lambda m: face, src, count=1)
    else:
        src = src.replace('<style>', '<style>' + face, 1)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(src)
    print('embedded', os.path.getsize(woff2), 'bytes ->', html_path)


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.normpath(os.path.join(here, '..', '..'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        sys.exit(__doc__)
    out = os.path.join(root, 'assets', 'fonts', 'ftc-dotgothic.woff2')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    build(args[0], out)
    print('wrote', out, os.path.getsize(out), 'bytes')
    if '--embed-classic' in sys.argv:
        embed(os.path.join(root, 'classic.html'), out)

#!/usr/bin/env python3
"""Football Classic -- the far stands in layers, so a match can fill them to the crowd that came (v186).

For each of the five grounds this draws, with tools/sprites/make_pitch_art.py's own code and its own fans:

    the stand with every seat taken      -> PITCH_ART        (it held each level's usual crowd)
    the stand with nobody in it          -> PITCH_ART_EMPTY
    whose pixel is whose                 -> PITCH_ART_FANS   (a fan's number in the red and green of each of his pixels)

and writes the three into classic.html. The game keeps as many fans as the gate brought and paints the empty stand
over the rest (see composeFor in classic.html).

    python3 tools/clips/make_stand_layers.py            # embeds into classic.html
    python3 tools/clips/make_stand_layers.py --check    # draws them, embeds nothing

Needs Pillow (dev only)."""
import base64, io, json, os, random, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'sprites'))
import make_pitch_art as P

_fan = P.fan


class Always:
    """the stands' dice, loaded: every seat is taken (random() says 0); a fan's own colours come from real dice"""
    def __init__(self, seed):
        self.real, self.inside = random.Random(seed), False

    def random(self):
        return self.real.random() if self.inside else 0.0

    def choice(self, seq):
        return self.real.choice(seq)


class Tap:
    """a canvas that notes which pixels a fan put down"""
    def __init__(self, cv, ids, fid):
        self.cv, self.ids, self.fid = cv, ids, fid

    def put(self, x, y, c):
        if self.cv.ok(x, y):
            self.ids[(x, y)] = self.fid
        self.cv.put(x, y, c)

    def rect(self, x, y, w, h, c):
        for j in range(h):
            for i in range(w):
                self.put(x + i, y + j, c)


def layers(level):
    """(full strip, empty strip, fan map, how many fans) for one ground"""
    out = {}
    for mode in ('full', 'empty'):
        ids, n = {}, [0]

        def fan(cv, R, x, y, arms=0.08):
            if mode == 'empty':
                return
            n[0] += 1
            R.inside = True
            _fan(Tap(cv, ids, n[0]), R, x, y, arms)
            R.inside = False
        P.fan = fan
        cv = P.Canvas(P.SW, P.SH)
        P.DRAW[level](cv, Always(11 + level))
        for x in range(P.SW):
            cv.px[x, 42] = (0, 0, 0, 0)
        out[mode] = cv.im.copy()
        if mode == 'full':
            m = Image.new('RGBA', (P.SW, P.SH), (0, 0, 0, 0))
            for (x, y), fid in ids.items():
                m.putpixel((x, y), (fid >> 8, fid & 255, 0, 255))
            out['fans'], out['n'] = m, n[0]
    P.fan = _fan
    return out['full'], out['empty'], out['fans'], out['n']


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
                lines[i] = lead + 'const %s = %s;' % (k, json.dumps(art[k], separators=(',', ':')))
                hits.add(k)
    assert hits == set(art), 'not found in %s: %s' % (html_path, sorted(set(art) - hits))
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    art = {'PITCH_ART': {}, 'PITCH_ART_EMPTY': {}, 'PITCH_ART_FANS': {}}
    for lv in P.LEVELS:
        full, empty, fans, n = layers(lv)
        art['PITCH_ART'][str(lv)], art['PITCH_ART_EMPTY'][str(lv)], art['PITCH_ART_FANS'][str(lv)] = data_url(full), data_url(empty), data_url(fans)
        print('level', lv, 'fans', n)
    if '--check' not in sys.argv:
        embed(os.path.join(ROOT, 'classic.html'), art)
        print('embedded ->', os.path.join(ROOT, 'classic.html'), sum(len(v) for d in art.values() for v in d.values()), 'base64 chars')

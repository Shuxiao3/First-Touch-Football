// FOOTBALL CLASSIC, THE PITCH: drawn in the style of the town's tiles -- mint turf in mown bands with specks, the lines,
// goals and flags in whole pixels at half size, the far stand panned with the camera -- with the far touchline at 100 px
// so the stand shows. The specks are fixed to the pitch: pan the camera and the ground moves with it, pixel for pixel.
// PITCH.enable(false) puts the vector pitch back. On a copy of the game that lets the test move the camera and redraw.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={cam:v=>{ if(v!=null) camX=v; return camX; }, draw:()=>draw(), HORIZON, FAR_SCALE, NEAR_SCALE, NEAR_Y, FH};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-pitch-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);

const r = await page.evaluate(() => {
  const T = window.__T, cv = document.querySelector('canvas'), g = cv.getContext('2d');
  const hex = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
  const row = y => { const d = g.getImageData(0, y, cv.width, 1).data, out = []; for(let i = 0; i < d.length; i += 4) out.push((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); return out; };
  const out = { on: PITCH.enabled && PITCH.ready, horizon: T.HORIZON };
  T.cam(1312); T.draw();
  out.line = hex(cv.width / 2 - 37, T.HORIZON); out.line2 = hex(cv.width / 2 + 41, T.HORIZON + 1);
  out.top = hex(cv.width / 2, 20);
  // the run-off between the near touchline and the turf's edge: no lines, no men, only ground
  const y = cv.height - 20, j = y >> 1, t = (2 * j + 1 - T.HORIZON) / (T.NEAR_Y - T.HORIZON), s = T.FAR_SCALE + (T.NEAR_SCALE - T.FAR_SCALE) * t;
  const a = row(y); T.cam(1312 + 2 * 9 / s); T.draw(); const b = row(y);   // panned 9 half-size pixels
  let same = 0, n = 0; for(let x = 0; x + 18 < a.length; x++){ n++; if(b[x] === a[x + 18]) same++; }
  out.panSame = same / n;
  out.turf = new Set(a.map(v => '#' + v.toString(16).padStart(6, '0'))).size;
  PITCH.enable(false); T.cam(1312); T.draw();
  out.offTop = hex(cv.width / 2, 20); out.offTurf = hex(cv.width / 2 + 100, cv.height - 60);   // (off the halfway line)
  PITCH.enable(true);
  return out;
});
info(JSON.stringify(r));
ok(r.on, 'the pitch art is on by default');
ok(r.horizon === 100, 'the far touchline sits at 100 px, under the stand');
ok(r.line === '#f4fbf2' && r.line2 === '#f4fbf2', 'the far touchline is a white pixel line (' + r.line + ', ' + r.line2 + ')');
ok(parseInt(r.top.slice(1), 16) !== 0 && !['#0e1626', '#1a2740', '#0c1410'].includes(r.top), 'the stand is over it, not the night sky (' + r.top + ')');
ok(r.turf >= 3 && r.turf <= 12, 'the turf is a few mint shades, specked (' + r.turf + ' colours along a row)');
ok(r.panSame > 0.97, 'pan the camera and the ground moves with it, speck for speck (' + (r.panSame * 100).toFixed(1) + '% of a row matches)');
ok([1, 3, 5].every(k => parseInt(r.offTop.slice(k, k + 2), 16) < 60), 'switched off, the old pitch is back: its night sky (' + r.offTop + ')');
ok(['#2b7445', '#31814d', '#235c38'].includes(r.offTurf), '...and its dark green bands (' + r.offTurf + ')');

process.exitCode = rep.finish();
await browser.close();

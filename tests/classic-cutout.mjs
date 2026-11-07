// FOOTBALL CLASSIC, CUT-OUTS AND BACK PASSES (v146): a man cutting their pass out is reacting to it, at a stretch -- his
// touch is the worse for it, the less composed the worse again (0.08 off at Composure 10 to 0.24 at 1, and less sure):
// a composed defender takes one clean more often than not, a nervy one loose. And a pass of ours is harder to take the
// further it's come (nothing up to 15 m, more to 40 m) and a touch harder played back to him from further up the pitch;
// knocked about at the back, short, it's as clean as ever. Each touch drawn 400 times, nobody near, in his own half.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, ball:()=>ball, FW, YC, MK, atkOf, touchQuality, touchDifficulty, '
  + 'freeze:()=>{ restartT=0; restartInfo=null; offsideT=0; offsidePass=null; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; skill=null; matchClock=0; recvAuto=null; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-cut-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(400);

const r = await page.evaluate(() => { const T = window.__T, b = T.ball(), atk = T.atkOf('G'), own = atk > 0 ? 0 : T.FW;
  T.freeze();
  const gs = T.players().filter(q => q.team === 'G'), p = gs.find(q => q.role === 'DEF'), mate = gs.find(q => q !== p && q.role !== 'DEF'), them = T.players().find(q => q.team === 'R');
  for(const q of T.players()) if(q !== p){ q.x = T.FW / 2; q.y = 40; q.vx = q.vy = 0; }   // (nobody near him)
  p.x = own + atk * 22 * T.MK; p.y = T.YC; p.vx = p.vy = 0; p.facing = { x: atk, y: 0 }; p.state = 'normal';
  const stats0 = Object.assign({}, p.stats);
  // the ball coming to him along the grass from (dx m up the pitch, dy m across), struck by (who) of (team), at (v) px/s
  const draw = (dx, dy, team, by, v, comp, icp) => { Object.assign(p.stats, stats0, { ballControl: 6, composure: comp });
    const fx = p.x + atk * dx * T.MK, fy = p.y + dy * T.MK, l = Math.hypot(p.x - fx, p.y - fy) || 1;
    const out = { P: 0, C: 0, L: 0, H: 0 };
    for(let i = 0; i < 400; i++){ b.ownedBy = null; b.z = 0; b.vz = 0; b.x = p.x - (p.x - fx) / l * 30; b.y = p.y - (p.y - fy) / l * 30; b.vx = (p.x - fx) / l * v; b.vy = (p.y - fy) / l * v;
      b.lastTouch = team; b.passFrom = { x: fx, y: fy, team, by };
      const s = T.touchQuality(p, icp); out[s > 0.8 ? 'P' : s > 0.55 ? 'C' : s > 0.3 ? 'L' : 'H']++; }
    for(const k in out) out[k] = Math.round(out[k] / 4); return out; };
  const res = {
    // their pass cut out (theirs, from 20 m up the pitch toward our goal), Composure 8 and 4
    cut8: draw(20, 4, 'R', them, 450, 8, true), cut4: draw(20, 4, 'R', them, 450, 4, true),
    // ours, short across the back (10 m across), and Composure 3 too: as clean as ever
    across: draw(0, 10, 'G', mate, 330, 6, false), across3: (() => { Object.assign(p.stats, { ballControl: 3 }); const o = draw(0, 10, 'G', mate, 330, 3, false); return o; })(),
    // played back to him from 12 m and from 38 m up the pitch
    back12: draw(12, 2, 'G', mate, 420, 6, false), back38: draw(38, 4, 'G', mate, 560, 6, false),
    // a long one across (38 m across), not back
    long: draw(0, 38, 'G', mate, 560, 6, false) };
  Object.assign(p.stats, stats0);
  return res; });
info('400 touches each, nobody near: ' + JSON.stringify(r));
ok(r.cut8.P <= 30 && r.cut8.P + r.cut8.C >= 50 && r.cut4.P <= 5 && r.cut4.L + r.cut4.H >= 50 && r.cut4.L + r.cut4.H > r.cut8.L + r.cut8.H + 20,
  'their pass cut out: at Composure 8 PERFECT ' + r.cut8.P + '%, clean or better ' + (r.cut8.P + r.cut8.C) + '%; at Composure 4 PERFECT ' + r.cut4.P + '%, loose or heavy ' + (r.cut4.L + r.cut4.H) + '% (8: ' + (r.cut8.L + r.cut8.H) + '%)');
ok(r.across.P >= 85 && r.across3.P + r.across3.C === 100 && r.across3.P >= 50,   // (90 or so: 400 draws swing a point or two)
  'knocked about at the back, 10 m across: PERFECT ' + r.across.P + '% -- and a defender rated 3 for both clean or better every time, PERFECT ' + r.across3.P + '%');
ok(r.back38.P < r.back12.P && r.back12.P < r.across.P && r.long.P < r.across.P - 10 && r.back38.P <= 75,
  'played back to him: PERFECT ' + r.back12.P + '% from 12 m up the pitch, ' + r.back38.P + '% from 38 m (a long one across: ' + r.long.P + '%; short across: ' + r.across.P + '%)');

process.exitCode = rep.finish();
await browser.close();

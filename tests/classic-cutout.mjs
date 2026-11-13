// FOOTBALL CLASSIC, CUT-OUTS AND BACK PASSES (v146): a man cutting their pass out is reacting to it, at a stretch -- his
// touch is the worse for it, the less composed the worse again (0.08 off at Composure 10 to 0.24 at 1, and less sure):
// a composed defender takes one clean more often than not, a nervy one loose. And a pass of ours is harder to take the
// further it's come (nothing up to 15 m, more to 40 m) and a touch harder played back to him from further up the pitch;
// knocked about at the back, short, it's as clean as ever. Each touch drawn 2000 times, nobody near, in his own half.
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
  const draw = (dx, dy, team, by, v, comp, icp, n) => { Object.assign(p.stats, stats0, { ballControl: 6, composure: comp, compFinal: comp });
    const fx = p.x + atk * dx * T.MK, fy = p.y + dy * T.MK, l = Math.hypot(p.x - fx, p.y - fy) || 1;
    p.facing = { x: (fx - p.x) / l, y: (fy - p.y) / l };   // (v208: he faces it as it comes, as a man it's coming to turns to it -- the edge of his cone is classic-dribble's; up the pitch, a ball from 10 m across was at the edge of a Ball control 6 man's)
    const out = { P: 0, C: 0, L: 0, H: 0 }, N = n || 2000; let sum = 0;   // (v214: 8000 for the two read off his touch on average)   // (v147: 2000 draws, to a tenth of a per cent: with 400, a ball played back from 12 m and one knocked across could round to the same)
    for(let i = 0; i < N; i++){ b.ownedBy = null; b.z = 0; b.vz = 0; b.x = p.x - (p.x - fx) / l * 30; b.y = p.y - (p.y - fy) / l * 30; b.vx = (p.x - fx) / l * v; b.vy = (p.y - fy) / l * v;
      b.lastTouch = team; b.passFrom = { x: fx, y: fy, team, by };
      const s = T.touchQuality(p, icp); sum += s; out[s > 0.8 ? 'P' : s > 0.55 ? 'C' : s > 0.3 ? 'L' : 'H']++; }
    for(const k in out) out[k] = Math.round(out[k] / N * 1000) / 10; out.mean = +(sum / N).toFixed(3); return out; };   // (v214: and his touch on average)
  const res = {
    // their pass cut out (theirs, from 20 m up the pitch toward our goal), Composure 8 and 4
    cut8: draw(20, 4, 'R', them, 450, 8, true), cut4: draw(20, 4, 'R', them, 450, 4, true),
    // ours, short across the back (10 m across), and Composure 3 too: as clean as ever
    across: draw(0, 10, 'G', mate, 330, 6, false), across3: (() => { Object.assign(p.stats, { ballControl: 3 }); const o = draw(0, 10, 'G', mate, 330, 3, false); return o; })(),
    // played back to him from 12 m and from 38 m up the pitch -- and the same ball from 12 m not a pass of ours (theirs,
    // loose): what the 12 m one costs for coming back, the turn and the rest alike (v147: it was set against the short one
    // across, which costs him a half-turn as much -- the two came out level as often as not)
    back12: draw(12, 2, 'G', mate, 420, 6, false, 8000), back38: draw(38, 4, 'G', mate, 560, 6, false), same12: draw(12, 2, 'R', them, 420, 6, false, 8000),
    // a long one across (38 m across), not back
    long: draw(0, 38, 'G', mate, 560, 6, false) };
  Object.assign(p.stats, stats0);
  return res; });
info('2000 touches each, nobody near: ' + JSON.stringify(r));
ok(r.cut8.P <= 30 && r.cut8.P + r.cut8.C >= 50 && r.cut4.P <= 5 && r.cut4.L + r.cut4.H >= 50 && r.cut4.L + r.cut4.H > r.cut8.L + r.cut8.H + 20,
  'their pass cut out: at Composure 8 PERFECT ' + r.cut8.P + '%, clean or better ' + (r.cut8.P + r.cut8.C) + '%; at Composure 4 PERFECT ' + r.cut4.P + '%, loose or heavy ' + (r.cut4.L + r.cut4.H) + '% (8: ' + (r.cut8.L + r.cut8.H) + '%)');
ok(r.across.P >= 30 && r.across.P <= 65 && r.across.P + r.across.C >= 85 && Math.abs(r.across3.P - r.across.P) <= 6,   // (v214: 85 or more, before -- an easy ball near-perfect whatever his stats)
  'knocked about at the back, 10 m across, nobody near: as good as his Ball control lets it be (6) -- PERFECT ' + r.across.P + '%, clean or better ' + Math.round(r.across.P + r.across.C) + '%; his Composure barely tells there (at 3: PERFECT ' + r.across3.P + '%)');
ok(r.back38.mean < r.back12.mean && r.back12.mean < r.same12.mean - 0.005 && r.long.P < r.across.P - 10 && r.back38.P <= 75,   // (v214: by his touch on average -- PERFECT 3 points under the same ball, before; on v214's touch the difference is a point or two, inside 2000 draws' spread)
  'played back to him: his touch ' + r.back12.mean + ' on average from 12 m up the pitch (the same ball not a pass of ours: ' + r.same12.mean + '), ' + r.back38.mean + ' from 38 m; PERFECT ' + r.back38.P + '% from 38 m, a long one across ' + r.long.P + '%, short across ' + r.across.P + '%');

process.exitCode = rep.finish();
await browser.close();

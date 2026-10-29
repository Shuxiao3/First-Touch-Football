// FOOTBALL CLASSIC, THE PITCH: drawn in the style of the town's tiles -- mint turf in mown bands with specks, the lines,
// goals and flags in whole pixels at half size, the far stand panned with the camera -- with the far touchline at 100 px
// so the stand shows. The specks are fixed to the pitch: pan the camera and the ground moves with it, pixel for pixel.
// PITCH.enable(false) puts the vector pitch back. THE NET: a shot in goes all the way over the line into the net, which
// gives where it's hit and holds it (never through it or out of the back), and it's a goal; wide of the post or over the
// bar it comes back off the line. THE STANDS: each level's name panel is inside its strip and as tall as the letters
// (five rows), and the Stadium's Stands tab gets a picture of each. On a copy of the game that lets the test move the
// camera, redraw and set a shot up.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={cam:v=>{ if(v!=null) camX=v; return camX; }, draw:()=>draw(), HORIZON, FAR_SCALE, NEAR_SCALE, NEAR_Y, FH, proj, PA_D, PA_HW, GA_D, GA_HW, PEN_SPOT, CIRCLE_R, '
  + 'ball:()=>ball, net:()=>NET, scored:()=>scoredT, score:()=>scoreG+scoreR, simNow:()=>simNow, players:()=>players, keepers:()=>keepers, '
  + 'FW, YC, GOAL_W, GOAL_H, NET_D, freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; }, over:()=>matchOver, '
  + 'endgame:()=>{ half=2; matchClock=halfLenSec()+1; ftPending=true; ftShot=true; ftT0=simNow; ftLastTeam=null; }};\n  const LAB_TITLE=');
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
// THE STANDS: a name on a panel off the top of the strip, or on one shorter than the letters, is cut
const meta = JSON.parse(src.match(/const PITCH_ART_META = (\{.*\});/)[1]);
const badPanel = Object.entries(meta.panels).filter(([, p]) => !(p.y >= 0 && p.h >= 5 && p.y + p.h <= meta.h && p.x >= 0 && p.x + p.w <= meta.w));
ok(Object.keys(meta.panels).length === 5 && !badPanel.length, 'every level\'s name panel is inside its strip and five rows tall, the letters\' height ('
  + (badPanel.map(([l, p]) => 'level ' + l + ': ' + JSON.stringify(p)).join('; ') || 'all five') + ')');
const pics = await page.evaluate(() => [1, 2, 3, 4, 5].map(l => PITCH.picture({ lvl: l, boards: [], stand: 'North Stand' }, 190).length));
ok(pics.every(n => n > 1000), 'the Stands tab gets a picture of every level (' + pics.join(', ') + ' characters of PNG)');
// A FIFTH SHORTER, A TENTH NARROWER: a real pitch's markings at 18.225 px to its metre (25, the men's, at first, then
// 22.5, then 20.25) on one 93 1/3 m long and 68 wide -- a fifth shorter goal to goal than the last (105 m at 20.25) and a
// tenth narrower, the markings a tenth smaller with the width so they stay round -- and the camera as it was: the far
// touchline under the stand, the near one 0.729 of the way down, the men as big as ever; the far stand's middle (its
// name, its boards) over the halfway line
const sz = await page.evaluate(() => { const T = window.__T, cv = document.querySelector('canvas'), g = cv.getContext('2d'); PITCH.enable(true); T.cam(T.FW / 2); T.draw();
  const near = T.proj(T.FW / 2, T.FH).y, x = Math.round(T.proj(T.FW / 2 + 300, T.FH).x);
  let line = -1; for(let y = Math.round(near) - 3; y <= Math.round(near) + 3; y++){ const d = g.getImageData(x, y, 1, 1).data; if(d[0] === 0xf4 && d[1] === 0xfb && d[2] === 0xf2) line = y; }
  return { FW: T.FW, FH: T.FH, mk: [[T.PA_D, 16.5], [T.PA_HW, 20.16], [T.GA_D, 5.5], [T.GA_HW, 9.16], [T.PEN_SPOT, 11], [T.CIRCLE_R, 9.15]].map(([v, m]) => +(v / T.FH * 68 / m).toFixed(6)),
    far: T.proj(T.FW / 2, 0).y, near: +near.toFixed(1), line, sMid: +T.proj(T.FW / 2, 765).scale.toFixed(4), goal: T.GOAL_W, stand: +PITCH.standMid.toFixed(1) }; });
info('the pitch: ' + JSON.stringify(sz));
ok(Math.abs(sz.FW / 2126.25 - 0.8) < 1e-9 && Math.abs(sz.FH / 1377 - 0.9) < 1e-9 && Math.abs(sz.FW / sz.FH - (105 * 0.8 / 0.9) / 68) < 1e-9,
  'the pitch a fifth shorter goal to goal and a tenth narrower: ' + +sz.FW.toFixed(2) + ' x ' + +sz.FH.toFixed(2) + ' (93 1/3 m by 68; it was 2126.25 x 1377, 2362.5 x 1530, and 2625 x 1700)');
ok(sz.mk.every(k => Math.abs(k - 1) < 1e-6), 'its markings a real pitch\'s at its metre, in proportion to its width: the box, the six-yard box, the spot, the circle');
ok(sz.far === 100 && Math.abs(sz.near - (100 + 412 * 0.729)) < 0.5 && sz.line >= 0 && sz.sMid === +(0.55 + 0.5 * 765 / 1700).toFixed(4) && sz.goal === 227,
  'the camera as it was: the far touchline at 100, the near one drawn at ' + sz.line + ' (was 512, then 471, then 434), the men and the goal as big as ever');
ok(Math.abs(sz.stand - sz.FW / 2) < 1, 'the far stand\'s middle -- its name, its boards -- is over the halfway line (' + sz.stand + ', halfway ' + sz.FW / 2 + '; it was 131 px to the right, drawn for the first pitch)');

// THE NET, in real frames: everyone out of the way, the ball struck at the goal on the right from x0 px out. Followed
// for `secs` of game time: how far past the line it got, how far the net gave, and where it lay while the goal was on.
const shot = (x0, dy, z, vx, vy, vz, secs, inNet = 0) => page.evaluate(a => new Promise(res => {
  const T = window.__T, b = T.ball(); T.freeze();
  for(const p of T.players().concat(T.keepers())){ p.x = T.FW / 2; p.y = 40; p.vx = p.vy = 0; }
  const g0 = T.score(), t0 = T.simNow(), w0 = performance.now();
  b.ownedBy = null; b.dribbler = null; b.inNet = a.inNet; b.shotT = 0; b.x = T.FW - a.x0; b.y = T.YC + a.dy; b.z = a.z; b.vz = a.vz; b.vx = a.vx; b.vy = a.vy;
  let far = -1e9, give = 0, inNet = false, rest = null;
  (function tick(){
    far = Math.max(far, b.x - T.FW); inNet = inNet || b.inNet === 1;
    const N = T.net()[1]; give = Math.max(give, N.back.d, N.near.d, N.far.d, N.roof.d);
    if(T.scored() > 0) rest = { x: Math.round(b.x - T.FW), y: Math.round(b.y - T.YC), z: Math.round(b.z) };
    if(T.simNow() - t0 < a.secs && performance.now() - w0 < 15000) return requestAnimationFrame(tick);
    res({ far: +far.toFixed(1), give: +give.toFixed(1), inNet, goals: T.score() - g0, rest });
  })(); }), { x0, dy, z, vx, vy, vz, secs, inNet });
const dims = await page.evaluate(() => { const T = window.__T; return { GOAL_W: T.GOAL_W, GOAL_H: T.GOAL_H, NET_D: T.NET_D, r: T.ball().r }; });
const low = await shot(180, 10, 0, 950, 0, 0, 1.3);
info('a low drive: ' + JSON.stringify(low));
ok(low.goals === 1 && low.inNet, 'a low drive goes in: a goal');
ok(low.far > dims.NET_D - dims.r + 2 && low.far <= dims.NET_D + 20.5 && low.give > 4, 'it carries all the way to the back of the net and pushes it out ' + low.give + ' px (' + low.far + ' px past the line, the back at ' + dims.NET_D + ')');
ok(!!low.rest && low.rest.x > dims.r && low.rest.x <= dims.NET_D && Math.abs(low.rest.y) < dims.GOAL_W / 2 && low.rest.z < dims.GOAL_H, 'and it stays in, on the floor of the goal (' + JSON.stringify(low.rest) + ')');
const side = await shot(50, 50, 0, 500, 320, 0, 1.3);
info('into the side netting: ' + JSON.stringify(side));
ok(side.goals === 1 && !!side.rest && Math.abs(side.rest.y) < dims.GOAL_W / 2 && side.rest.x <= dims.NET_D + 1, 'across the goal into the side netting: held in, and a goal (' + JSON.stringify(side.rest) + ')');
const wide = await shot(180, dims.GOAL_W / 2 + 40, 0, 950, 0, 0, 0.6), high = await shot(180, 0, dims.GOAL_H + 30, 950, 0, 0, 0.6);
ok(!wide.goals && !wide.inNet && wide.far <= 0.5 && !high.goals && !high.inNet && high.far <= 0.5, 'wide of the post, or over the bar, it comes back off the line: no goal (' + wide.far + ', ' + high.far + ')');
// a ball that was in the mouth, back out in front (a parry) and going over the line just past the post: not a goal
const past = await shot(4, dims.GOAL_W / 2 + 10, 0, 30, 0, 0, 0.6, 1);
ok(!past.goals && past.far <= 0.5, 'a ball back out of the mouth and over the line past the post comes back off it: no goal (' + past.far + ')');
// A GOAL IN THE LAST PLAY: the clock run out, the full-time advantage on, a shot struck into the net -- it counts once,
// the match ends with the ball still in the net, and nothing more is counted however long the full-time screen stays
// up. (It used to count again every time the celebration ran out: a phantom goal or two in a career's result.)
const last = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(); T.freeze(); T.endgame();
  for(const p of T.players().concat(T.keepers())){ p.x = T.FW / 2; p.y = 40; p.vx = p.vy = 0; }
  const g0 = T.score(), t0 = T.simNow(), w0 = performance.now(); let overAt = null;
  b.ownedBy = null; b.dribbler = null; b.inNet = 0; b.shotT = 1.1; b.x = T.FW - 180; b.y = T.YC + 10; b.z = 0; b.vz = 0; b.vx = 950; b.vy = 0;
  (function tick(){ if(T.over() && overAt == null) overAt = +(T.simNow() - t0).toFixed(1);
    if(T.simNow() - t0 < 7 && performance.now() - w0 < 20000) return requestAnimationFrame(tick);
    res({ goals: T.score() - g0, over: T.over(), overAt, secs: +(T.simNow() - t0).toFixed(1) }); })(); }));
info('a goal in the last play: ' + JSON.stringify(last));
ok(last.goals === 1 && last.over && last.overAt != null && last.secs >= 6.5,
  'a goal in the last play (the full-time advantage) counts once and ends the match (' + last.overAt + ' s on); ' + last.secs + ' s later the score hasn\'t moved');

process.exitCode = rep.finish();
await browser.close();

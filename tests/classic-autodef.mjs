// FOOTBALL CLASSIC, AUTO DEFEND (v86): hold SWITCH (J) while they have it and your man defends by himself -- he jockeys
// the man on the ball, goal-side of him and a few metres off (never tight), square to him, and never tackles by himself;
// out wide in our end, where a cross is on, he's across into its way. A quick tap is still a switch; let go of a hold and
// he's yours again (no switch). The higher his Def IQ, the truer he holds the spot as the man moves. And a cross struck
// into a man stood in its way a few metres off the crosser stops on him; one with him further off goes over him.
// On a copy of the game that lets the test script the man on the ball (he goes where the test says, the ball at his feet).
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, setControlled, aiCross, FW, FH, YC, MK, PA_HW, atkOf, '
  + 'simNow:()=>simNow, own:(p,c)=>{ ball.ownedBy=c; ball.dribbler=null; ball.x=c.x; ball.y=c.y; ball.z=0; ball.vx=ball.vy=ball.vz=0; ball.lastTouch=c.team; ball.crossT=0; ball.crossBy=null; ball.shotT=0; }, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; matchClock=0; switchLock=null; }, '
  + 'grade:()=>lastGrade, setGrade:v=>{ lastGrade=v; }};\n  const LAB_TITLE=');
// the man on the ball, scripted: where the test puts him each frame (and the ball at his feet, while it's his)
patch('      else{\n        let ai=aiBrain(p,dt);', '      else if(p.__script){ p.__script(p,dt); }\n      else{\n        let ai=aiBrain(p,dt);');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-ad-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);

// THE SCENE: Red's man on the ball at (x m from our goal line, y m off the middle), walking the way the test says (m/s);
// our man (yours: a defender) at (dx, dy) m from him toward our goal; everyone else parked out of the way.
const SCENE = `window.__scene = (o) => { const T = window.__T, MK = T.MK, b = T.ball(), me = T.players().find(q => q.team === 'G' && q.role === 'DEF');
  const c = T.players().find(q => q.team === 'R' && q.role === 'ATT') || T.players().find(q => q.team === 'R'), atk = T.atkOf('G'), ownX = atk > 0 ? 0 : T.FW;
  T.freeze(); for(const q of T.players()) if(q !== me && q !== c){ q.x = T.FW / 2 + (q.team === 'R' ? 1 : -1) * 0.3 * T.FW; q.y = 30 + 10 * T.players().indexOf(q); q.vx = q.vy = 0; q.__script = (p) => { p.vx = p.vy = 0; }; }
  for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; }
  c.x = ownX + atk * o.x * MK; c.y = T.YC + o.y * MK; c.vx = c.vy = 0; c.state = 'normal'; c.facing = { x: -atk, y: 0 };
  me.x = c.x - atk * o.dx * MK; me.y = c.y + (o.dy || 0) * MK; me.vx = me.vy = 0; me.state = 'normal'; me.facing = { x: atk, y: 0 }; me.stats = Object.assign({}, me.stats, { defIQ: o.iq });
  const path = o.path || (() => ({ vx: 0, vy: 0 }));
  c.__script = (p, dt) => { const v = path(T.simNow() - t0); p.vx = v.vx * MK; p.vy = v.vy * MK; p.x = Math.max(20, Math.min(T.FW - 20, p.x + p.vx * dt)); p.y = Math.max(20, Math.min(T.FH - 20, p.y + p.vy * dt));
    if(b.ownedBy === p){ const s = Math.hypot(p.vx, p.vy); p.facing = s > 1 ? { x: p.vx / s, y: p.vy / s } : p.facing; b.x = p.x + p.facing.x * 12; b.y = p.y + p.facing.y * 12; b.vx = p.vx; b.vy = p.vy; } };
  T.own(c, c); T.setControlled(me); const t0 = T.simNow(); window.__sc = { me, c, ownX, atk, t0 }; return true; };
window.__unscript = () => { for(const q of window.__T.players()) q.__script = null; };
// watch for secs: how far he stands off the man (min, mean), how near the right spot (goal-side at the jockey's gap) on
// average, how often the man's got goal-side of him, how square he is to him at the end, and who's on the ball after
window.__watchAD = (secs, gap) => new Promise(res => { const T = window.__T, S = window.__sc, MK = T.MK, t0 = T.simNow(); let n = 0, dmin = 1e9, dsum = 0, esum = 0, beat = 0, on = 0;
  (function tick(){ const me = S.me, c = S.c, d = Math.hypot(me.x - c.x, me.y - c.y), gl = Math.hypot(S.ownX - c.x, T.YC - c.y) || 1;
    const sx = c.x + (S.ownX - c.x) / gl * gap, sy = c.y + (T.YC - c.y) / gl * gap;
    if(T.simNow() - t0 > 0.6){ n++; dmin = Math.min(dmin, d); dsum += d; esum += Math.hypot(me.x - sx, me.y - sy); if(S.atk * (c.x - me.x) < 0) beat++; if(me.adOn) on++; }
    if(T.simNow() - t0 < secs) return requestAnimationFrame(tick);
    const f = me.facing, sq = (f.x * (c.x - me.x) + f.y * (c.y - me.y)) / (d || 1);
    res({ n, dmin: +(dmin / MK).toFixed(2), dmean: +(dsum / n / MK).toFixed(2), err: +(esum / n / MK).toFixed(2), beat: +(beat / n).toFixed(2), on: +(on / n).toFixed(2), square: +sq.toFixed(2),
      owner: T.ball().ownedBy === c ? 'him' : T.ball().ownedBy ? T.ball().ownedBy.team : 'none', mine: T.controlled() === me }); })(); });`;
await page.evaluate(SCENE);
const scene = o => page.evaluate(o => window.__scene(Object.assign(o, { path: o.path ? new Function('t', o.path) : null })), o);
const holdJ = async () => { await page.keyboard.down('KeyJ'); await page.waitForFunction(() => window.__T.controlled().adOn, null, { timeout: 4000 }).catch(() => {}); };
const releaseJ = () => page.keyboard.up('KeyJ');

// 1. JOCKEYING: he's 6 m off the man (to one side), the man stands then walks at our goal and across; hold J
await scene({ x: 28, y: 4, dx: 6, dy: -4, iq: 6, path: "return t < 1.5 ? { vx: 0, vy: 0 } : { vx: -1.6 * (window.__sc.atk), vy: 1.2 };" });
await holdJ();
const j = await page.evaluate(() => window.__watchAD(3.5, 0));
await releaseJ(); await page.waitForTimeout(150);
const still = await page.evaluate(() => ({ mine: window.__T.controlled() === window.__sc.me, on: window.__sc.me.adOn }));
info('jockeying, Def IQ 6: ' + JSON.stringify(j) + '; let go: ' + JSON.stringify(still));
ok(j.on > 0.95, 'held, your man defends by himself (AUTO DEFEND on ' + Math.round(j.on * 100) + '% of the time)');
ok(j.beat === 0 && j.dmin >= 2 && j.dmean <= 5.5, 'goal-side of the man on the ball, a few metres off -- never tight (' + j.dmin + ' m at the nearest, ' + j.dmean + ' m on average)');
ok(j.square > 0.8, 'square to him as he jockeys (' + j.square + ')');
ok(j.owner === 'him', 'he doesn\'t tackle by himself: the man still has it');
ok(still.mine && !still.on, 'let go of a hold: he\'s yours again, and no switch');

// 2. A TAP IS STILL A SWITCH
await scene({ x: 28, y: 4, dx: 6, dy: -4, iq: 6 });
const before = await page.evaluate(() => window.__T.controlled() === window.__sc.me);
await page.keyboard.down('KeyJ'); await page.waitForTimeout(60); await page.keyboard.up('KeyJ'); await page.waitForTimeout(150);
const tap = await page.evaluate(() => ({ same: window.__T.controlled() === window.__sc.me, on: !!window.__sc.me.adOn }));
info('a tap: ' + JSON.stringify({ before, after: tap }));
ok(before && !tap.same && !tap.on, 'a quick tap on J still switches player');

// 3. DEF IQ: the man walks across, then turns and goes at goal, then across the other way -- at 10 he holds the spot
// truer than at 1, and isn't got goal-side of as often (four goes each)
const run = async iq => { const R = [];
  for(let i = 0; i < 4; i++){ await scene({ x: 30, y: i % 2 ? 6 : -6, dx: 4, dy: 0, iq, path: "const a = window.__sc.atk, s = " + (i % 2 ? -1 : 1) + "; return t < 1.2 ? { vx: 0, vy: 3.5 * s } : t < 2.2 ? { vx: -3.5 * a, vy: 0 } : { vx: -1.5 * a, vy: -3.5 * s };" });
    await holdJ(); R.push(await page.evaluate(() => window.__watchAD(3.2, (100 + (68 - 100) * Math.min(1, Math.max(0, (window.__sc.me.stats.defIQ - 1) / 9))) )));
    await releaseJ(); await page.waitForTimeout(100); }
  const m = k => +(R.reduce((s, r) => s + r[k], 0) / R.length).toFixed(2);
  return { err: m('err'), beat: m('beat'), dmin: Math.min(...R.map(r => r.dmin)), dmean: m('dmean') }; };
const lo = await run(1), hi = await run(10);
info('Def IQ 1: ' + JSON.stringify(lo) + '; Def IQ 10: ' + JSON.stringify(hi) + ' (err: m off the right spot on average; beat: share of the time the man was goal-side of him)');
ok(hi.err < lo.err * 0.8, 'the higher his Def IQ, the truer he holds the spot as the man moves (' + hi.err + ' m off it on average at 10, ' + lo.err + ' m at 1)');
ok(hi.beat <= lo.beat, 'and the man gets goal-side of him no more often (' + hi.beat + ' of the time at 10, ' + lo.beat + ' at 1)');
ok(lo.dmean >= 2.5 && hi.dmean >= 2.5 && hi.dmin >= 1.8, 'never tight: ' + lo.dmean + ' m off on average at 1 (a step behind, the man can run close by him), ' + hi.dmean + ' m at 10, never nearer than ' + hi.dmin + ' m');

// 4. OUT WIDE: the man on the ball 10 m from our byline, 26 m wide -- held, our man gets across into the cross's way,
// nearer him than he'd jockey in the middle
await scene({ x: 10, y: 26, dx: 4, dy: 3, iq: 6 });
await holdJ();
const w = await page.evaluate(() => new Promise(res => { const T = window.__T, S = window.__sc, MK = T.MK, t0 = T.simNow();
  (function tick(){ if(T.simNow() - t0 < 2) return requestAnimationFrame(tick);
    const me = S.me, c = S.c, d = Math.hypot(me.x - c.x, me.y - c.y), tx = S.ownX + S.atk * 9 * MK, ty = T.YC + 2 * MK;   // (toward the near side of the penalty spot)
    const ax = (me.x - c.x) / d, ay = (me.y - c.y) / d, tl = Math.hypot(tx - c.x, ty - c.y), bx = (tx - c.x) / tl, by = (ty - c.y) / tl;
    res({ d: +(d / MK).toFixed(2), deg: +(Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by))) * 57.3).toFixed(1) }); })(); }));
await releaseJ(); await page.waitForTimeout(100);
info('out wide: ' + JSON.stringify(w) + ' (his distance off the man; how far off the line from the ball to the box he is, degrees)');
ok(w.deg < 20 && w.d >= 1.5 && w.d < 3.6, 'out wide he\'s across into the cross\'s way (' + w.deg + '° off the line to the box, ' + w.d + ' m off the man)');

// 5. THE CROSS BLOCK: the man on the ball crosses toward the penalty spot with ours stood in its way (yours: their cross
// puts you on him), three each. 3 m off him it's blocked: it's up past his shins as it gets near him, so he can't take it, and
// it hasn't swung wide of him yet. 2.5 m off it stops on him, blocked or ('met') a touch from him: it can still be at his shins
// as it comes into his reach, a frame earlier than his block would get it (one cross in six or so, by the crosser and the
// frame). 8 m off, it's over him.
const cross = (gapM) => page.evaluate(gapM => new Promise(res => { const T = window.__T, MK = T.MK; window.__scene({ x: 6, y: 24, dx: 0, dy: 0, iq: 6 }); window.__unscript();
  const S = window.__sc, me = S.me, c = S.c, b = T.ball(), tx = S.ownX + S.atk * 11 * MK, ty = T.YC, d = Math.hypot(tx - c.x, ty - c.y);
  me.x = c.x + (tx - c.x) / d * gapM * MK; me.y = c.y + (ty - c.y) / d * gapM * MK; me.vx = me.vy = 0; me.noTouchT = 0;
  T.setControlled(T.players().find(q => q.team === 'G' && q !== me)); T.setGrade('');
  T.aiCross(c, { x: tx, y: ty, who: null }); const t0 = T.simNow();
  (function tick(){ if(T.grade() === 'BLOCKED!') return res('blocked'); if(b.lastTouch === 'G' && Math.hypot(b.x - me.x, b.y - me.y) < 2.2 * MK) return res('met');
    if(T.simNow() - t0 > 0.8) return res(b.z > 0 ? 'over' : 'on'); requestAnimationFrame(tick); })(); }), gapM);
const near = [], block = [], far = [];
for(let i = 0; i < 3; i++){ near.push(await cross(2.5)); block.push(await cross(3)); far.push(await cross(8)); }
info('a cross with ours in its way: 2.5 m off the crosser ' + JSON.stringify(near) + ', 3 m off ' + JSON.stringify(block) + ', 8 m off ' + JSON.stringify(far));
ok(block.every(r => r === 'blocked'), 'a cross struck into a man stood in its way a few metres off is blocked');
ok(near.every(r => r === 'blocked' || r === 'met'), 'nearer still, it stops on him (blocked, or he gets a touch on it)');
ok(far.every(r => r !== 'blocked'), 'with him 8 m off, it\'s over him');

process.exitCode = rep.finish();
await browser.close();

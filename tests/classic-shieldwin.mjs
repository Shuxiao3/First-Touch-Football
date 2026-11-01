// FOOTBALL CLASSIC, AFTER A TACKLE (v91): your man wins it off one of theirs with a standing tackle, and as soon as he has
// it he gets his back to the man he took it from, the ball tight on his far side, for a split second -- so that man
// can't just get up and take it straight back off him. Def IQ is how quickly he turns, how long he keeps at it, and how
// little of the ball he shows. Not after a slide. The stick still moves him -- only not back into that man.
// On a copy of the game that lets the test set the scene: everyone else stood well away; their man (on the computer)
// tackled by ours, then left to get up and go after it; ours left alone (or the stick held at their man), and a copy
// with the guard taken out, to see what it saves him from.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

const src0 = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const build = (noGuard) => { let src = src0;
  const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
  patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, setControlled, winBall, own, FW, FH, YC, MK, atkOf, simNow:()=>simNow, '
    + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; matchClock=0; switchLock=null; }};\n  const LAB_TITLE=');
  patch('      else{\n        let ai=aiBrain(p,dt);', '      else if(p.__script){ p.__script(p,dt); }\n      else{\n        let ai=aiBrain(p,dt);');
  patch('    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}',
    '    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}\n    if(window.__stick&&(window.__stick.x||window.__stick.y)){ ix=window.__stick.x; iy=window.__stick.y; }');   // (a stick the test can hold)
  if(noGuard) patch('  function startGuard(p){\n', '  function startGuard(p){\n    return;\n');
  const copy = join(mkdtempSync(join(tmpdir(), 'ftf-guard-')), 'classic.html'); writeFileSync(copy, src); return copy; };

// THE SCENE: their forward on the ball in our half; our centre-back (yours) square in front of him, facing him; everyone
// else stood well away. o.kind 'tackle': the tackle goes in (winBall: poked loose, their man down for a moment) and you
// chase the ball with the stick (a slide, o.slide); 'won': he's just won it -- the ball at his feet between him and their
// man, their man getting up (as he is a moment after a tackle). Then: whether he's guarding it (and how), which way he's
// facing against the way from their man to him, whether their man gets it back within 2.5 s (ours put down by it), and
// with the stick held at their man (o.at), how far he goes toward him.
const scene = (page, o) => page.evaluate(o => new Promise(res => { const T = window.__T, MK = T.MK, b = T.ball();
  const me = T.players().find(q => q.team === 'G' && q.role === 'DEF'), them = T.players().find(q => q.team === 'R' && q.role === 'ATT');
  T.freeze(); T.setControlled(me); window.__stick = null;
  const atk = T.atkOf('R'), x0 = T.FW / 2 + atk * 12 * MK, y0 = T.YC + (o.i % 3 - 1) * 2 * MK;
  for(const q of T.players()) if(q !== me && q !== them){ q.x = T.FW / 2 - atk * 0.4 * T.FW * (q.team === 'G' ? 1 : -1); q.y = 40 + 12 * T.players().indexOf(q); q.vx = q.vy = 0; q.__script = p => { p.vx = p.vy = 0; }; }
  for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; k.vx = k.vy = 0; }
  me.__script = null; them.__script = null;
  me.stats = Object.assign({}, me.stats, { defIQ: o.iq, strength: 5.5, tackle: 6, dribbling: 4, ballControl: 5, speed: 6, acceleration: 6 });
  them.stats = Object.assign({}, them.stats, { strength: 5.5, tackle: 7, dribbling: 6, ballControl: 6, speed: 6, acceleration: 6, defIQ: 6 });
  Object.assign(them, { x: x0, y: y0, vx: 0, vy: 0, state: 'normal', noTouchT: 0, tackleCd: 0, facing: { x: atk, y: 0 }, stamina: 1, ob: null, takeOn: null, guard: null, guardFrom: null });
  Object.assign(me, { x: x0 + atk * 1.4 * MK, y: y0 + (o.i % 2 ? 0.3 : -0.3) * MK, vx: 0, vy: 0, state: 'normal', noTouchT: 0, tackleCd: 0, facing: { x: -atk, y: 0 }, stamina: 1, guard: null, guardFrom: null, sprint: false });
  Object.assign(b, { ownedBy: them, x: them.x + atk * 22, y: them.y, z: 0, vx: 0, vy: 0, vz: 0, shotT: 0, crossT: 0, intendedRcv: null, thru: null, lastTouch: 'R', dribbler: null, dribbleGrace: 0, passerRef: null });
  if(o.kind === 'tackle'){ if(o.slide) me.state = 'slide'; T.winBall(me, them); if(o.slide) me.state = 'normal'; }
  else { b.x = me.x - atk * 24; b.y = me.y; me.guardFrom = them; me.guardWon = T.simNow();     // (just won it, the ball at his feet toward their man,
    Object.assign(them, { state: 'stumble', stateT: 0.4, noTouchT: 0.55 }); T.own(me, me.r + b.r + 5); }   //  him getting up)
  const t0 = T.simNow(); let got = o.kind === 'won' ? 0 : null, guard = null, turned = null, back = null, downed = false, faceAt = null, moved = null, x1 = o.kind === 'won' ? { x: me.x, y: me.y } : null;
  if(got !== null) guard = me.guard ? { len: +(me.guard.until - me.guard.at).toFixed(2), rate: +me.guard.rate.toFixed(1), nick: Math.round(me.guard.nick * 180 / Math.PI) } : null;
  (function tick(){ const t = T.simNow() - t0;
    if(got === null && b.ownedBy === me){ got = t; x1 = { x: me.x, y: me.y }; guard = me.guard ? { len: +(me.guard.until - me.guard.at).toFixed(2), rate: +me.guard.rate.toFixed(1), nick: Math.round(me.guard.nick * 180 / Math.PI) } : null; }
    if(got === null){ const dx = b.x - me.x, dy = b.y - me.y, l = Math.hypot(dx, dy) || 1; window.__stick = { x: dx / l, y: dy / l }; }   // (after the ball)
    else if(o.at && back === null){ const dx = them.x - me.x, dy = them.y - me.y, l = Math.hypot(dx, dy) || 1; window.__stick = { x: dx / l, y: dy / l }; }   // (the stick at their man)
    else window.__stick = null;
    if(got !== null && back === null){
      const ax = me.x - them.x, ay = me.y - them.y, al = Math.hypot(ax, ay) || 1, cosA = (me.facing.x * ax + me.facing.y * ay) / al;   // (1: his back square to their man)
      if(turned === null && cosA > 0.7) turned = +(t - got).toFixed(2);
      if(faceAt === null && t - got >= 0.4) faceAt = +cosA.toFixed(2);
      if(o.at && moved === null && t - got >= 0.4) moved = +(((me.x - x1.x) * (them.x - x1.x) + (me.y - x1.y) * (them.y - x1.y)) / (Math.hypot(them.x - x1.x, them.y - x1.y) || 1) / MK).toFixed(2);
      if(b.ownedBy === them) back = +(t - got).toFixed(2);
      if(me.state === 'stumble') downed = true; }
    if(t < (got === null ? 2.5 : got + 2.5)) return requestAnimationFrame(tick);
    window.__stick = null; for(const q of T.players()) q.__script = null;
    res({ got: got === null ? null : +got.toFixed(2), guard, turned, faceAt, back, downed, moved }); })(); }), o);

const runAll = async (copy, cases) => { const { browser, page, rep } = await open({ url: 'file://' + copy });
  await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);
  const out = {};
  for(const [name, o, n] of cases){ out[name] = []; for(let i = 0; i < n; i++) out[name].push(await scene(page, { ...o, i })); }
  return { browser, rep, out }; };

// the game as it plays, and a copy without the guard
const A = await runAll(build(false), [['tackle10', { kind: 'tackle', iq: 10 }, 6], ['tackle1', { kind: 'tackle', iq: 1 }, 6], ['slide', { kind: 'tackle', iq: 10, slide: true }, 4],
  ['won10', { kind: 'won', iq: 10 }, 12], ['won1', { kind: 'won', iq: 1 }, 12], ['at', { kind: 'won', iq: 5.5, at: true }, 12]]);
const B = await runAll(build(true), [['won10', { kind: 'won', iq: 10 }, 12], ['at', { kind: 'won', iq: 5.5, at: true }, 12]]);
await B.browser.close();
const { ok, info } = A.rep;
const sum = (R, f) => R.filter(f).length, med = a => { const b = a.map(x => x ?? 9).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
for(const [k, R] of Object.entries(A.out)) info(k + ': ' + JSON.stringify(R));
for(const [k, R] of Object.entries(B.out)) info('without the guard, ' + k + ': ' + JSON.stringify(R));
const got = R => R.filter(r => r.got !== null);

// 1. a standing tackle, the ball chased down: he guards it as soon as he has it (Def IQ: for longer, showing less of it)
const t10 = got(A.out.tackle10), t1 = got(A.out.tackle1);
ok(t10.length >= 4 && t1.length >= 4 && t10.every(r => r.guard && r.guard.len === 1 && r.guard.nick === 30) && t1.every(r => r.guard && r.guard.len === 0.6 && r.guard.nick === 60),
  'won with a standing tackle, he guards it as soon as he has it (' + t10.length + ' and ' + t1.length + ' of 6 chased down): for 1 s at Def IQ 10, showing 30° of it; 0.6 s at 1, showing 60°');
ok(sum(t10, r => r.back !== null) <= 1 && sum(t10, r => r.back !== null) < sum(t1, r => r.back !== null),
  '...and the better his Def IQ the surer he keeps it: their man got it back ' + sum(t10, r => r.back !== null) + ' of ' + t10.length + ' times at Def IQ 10, ' + sum(t1, r => r.back !== null) + ' of ' + t1.length + ' at 1 (quick round him to the ball as he turns)');
ok(got(A.out.slide).every(r => !r.guard), 'not after a slide (' + A.out.slide.map(r => r.got === null ? '-' : r.guard ? 'guard' : 'none').join(' ') + ')');

// 2. his back to the man he took it from -- quicker the better his Def IQ
const w10 = A.out.won10, w1 = A.out.won1;
ok(med(w10.map(r => r.turned)) < med(w1.map(r => r.turned)) && sum(w10, r => r.faceAt > 0.7) >= 10,
  'he gets his back to the man he took it from, quicker the better his Def IQ (' + med(w10.map(r => r.turned)) + ' s at 10, ' + med(w1.map(r => r.turned)) + ' s at 1; square to him 0.4 s on in ' + sum(w10, r => r.faceAt > 0.7) + ' of 12)');

// 3. what it saves him from: their man getting up and taking it straight back (and him going down)
const back = R => sum(R, r => r.back !== null);
ok(back(A.out.won10) <= 2 && back(B.out.won10) - back(A.out.won10) >= 4,
  'their man can\'t just get up and take it back: ' + back(A.out.won10) + ' of 12 times in 2.5 s with the guard, ' + back(B.out.won10) + ' of 12 without (' + sum(B.out.won10, r => r.downed) + ' with ours put down)');

// 4. the stick still moves him -- but not back into that man (and, his split second over, the stick still pushed at him, it's
// as it was: run into him and he loses it -- so what counts is the first second)
const at = A.out.at, atB = B.out.at, early = R => sum(R, r => r.back !== null && r.back < 1);
ok(at.every(r => r.moved !== null && r.moved < 0.4) && med(atB.map(r => r.moved)) - med(at.map(r => r.moved)) >= 0.6 && early(at) <= 1,
  'with the stick pushed at their man he doesn\'t go back into him (' + med(at.map(r => r.moved)) + ' m toward him in 0.4 s; ' + med(atB.map(r => r.moved)) + ' m without the guard), and keeps it through it (lost in the first second ' + early(at) + ' of 12 times, ' + early(atB) + ' without)');

process.exitCode = A.rep.finish();
await A.browser.close();

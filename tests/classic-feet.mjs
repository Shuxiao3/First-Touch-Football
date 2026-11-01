// FOOTBALL CLASSIC, THE BALL AT HIS FEET (v96): in control of it, the ball is at his boots (AT_FEET from where he
// stands), not out on a ring round him; turning with it held there, it goes round with his feet; running with it, every
// touch is from his feet (DRIB_TOUCH) -- never knocked on from out where his reach ends -- and the ball still goes on
// ahead between touches; letting go of the stick, it ends at his boots; a tackle still finds it where it did (out where
// it was held before); and a move begun with it at his boots starts from there, no jump.
// In the Dribble Lab, on a copy of the game that lets the test reach the man, hold the stick and PASS, and see each touch.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={controlled:()=>controlled, ball:()=>ball, LAB, MK, simNow:()=>simNow, atkOf, dlDef, controlROf, tackleSpot, mkSkill, '
  + 'setSkill:s=>{ skill=s; }, skill:()=>skill, kick:v=>{ kickHeld=!!v; }, feet:()=>({AT_FEET, AT_FEET_RUN, DRIB_TOUCH, DRIB_GATHER})};\n  const LAB_TITLE=');
patch('    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}',
  '    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}\n    if(window.__stick&&(window.__stick.x||window.__stick.y)){ ix=window.__stick.x; iy=window.__stick.y; }');   // (a stick the test can hold)
patch('  function dribbleTouch(p,vp,cap=9.5){\n', '  function dribbleTouch(p,vp,cap=9.5){\n    if(window.__touches&&p===controlled) window.__touches.push({t:simNow, gap:dist(p,ball)});\n');   // (each touch, and how far off him the ball was)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-feet-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.evaluate(() => document.querySelector('#smItems [data-act="dribblelab"]').click()); await page.waitForTimeout(1500);
const F = await page.evaluate(() => window.__T.feet()), MK = await page.evaluate(() => window.__T.MK), m = px => (px / MK).toFixed(2) + ' m';

// a scene: a new ball (Dribbling d, the defender stood right away), then the stick (and PASS held) as the steps say,
// each [secs, stick: 'fwd' | 'back' | 'side' | null, pass held]; every frame the ball's distance from him, every touch
const scene = (o) => page.evaluate(o => new Promise(res => { const T = window.__T;
  T.LAB.dDrib = o.drib || 5.5; T.LAB.dDef = 'stand';
  document.querySelector('#labHud [data-lab="go"]').click();
  const me = T.controlled(), b = T.ball(), D = T.dlDef(), atk = T.atkOf(me.team);
  D.x = me.x + atk * 1300; window.__touches = [];
  const dirs = { fwd: { x: atk, y: 0 }, back: { x: -atk, y: 0 }, side: { x: 0, y: 1 } };
  const t0 = T.simNow(), frames = []; let step = 0, tStep = t0;
  (function tick(){ const t = T.simNow();
    while(step < o.steps.length && t - tStep >= o.steps[step][0]){ tStep += o.steps[step][0]; step++; }
    if(step >= o.steps.length){ window.__stick = null; T.kick(false);
      const f = me.facing, bx = b.x - me.x, by = b.y - me.y, bl = Math.hypot(bx, by) || 1;
      return res({ frames, touches: window.__touches.map(x => ({ t: +(x.t - t0).toFixed(2), gap: x.gap })), end: { gap: Math.hypot(bx, by), sp: Math.hypot(me.vx, me.vy), inFront: (f.x * bx + f.y * by) / bl },
        mine: b.ownedBy === me || b.dribbler === me }); }
    const s = o.steps[step]; window.__stick = s[1] ? dirs[s[1]] : null; T.kick(!!s[2]);
    frames.push({ t: +(t - t0).toFixed(3), step, gap: Math.hypot(b.x - me.x, b.y - me.y), sp: Math.hypot(me.vx, me.vy), own: b.ownedBy === me });
    requestAnimationFrame(tick); })(); }), o);
const maxOf = (a, f) => a.reduce((x, y) => Math.max(x, f(y)), -Infinity), minOf = (a, f) => a.reduce((x, y) => Math.min(x, f(y)), Infinity);

// 1. AT REST: a new ball at his feet, left alone -- at his boots
const rest = await scene({ steps: [[0.8, null]] });
info('at rest: the ball ' + m(rest.end.gap) + ' from him (his boots: ' + m(F.AT_FEET) + '; it was held at ' + m(25) + ' before)');
ok(Math.abs(rest.end.gap - F.AT_FEET) <= 1.5 && rest.mine, 'in control of it, standing, the ball\'s at his boots: ' + m(rest.end.gap) + ' from him (it was held ' + m(25) + ' off, out on a ring round him)');

// 2. TURNING WITH IT: PASS held (so it's at his feet) running one way, then the stick pulled right round -- it goes round
//    with his feet, never out on a ring, and ends up in front of him the new way
const turn = await scene({ steps: [[0.7, 'fwd', true], [1.0, 'back', true], [0.05, null, false]] });
const tf = turn.frames.filter(x => x.step === 1), tMax = maxOf(tf, x => x.gap), tMin = minOf(tf, x => x.gap);
info('turning with PASS held: the ball ' + m(tMin) + ' to ' + m(tMax) + ' from him through the turn (' + tf.length + ' frames); at the end ' + m(turn.end.gap) + ', in front of him ' + turn.end.inFront.toFixed(2) + '; touches ' + turn.touches.length);
ok(tf.length > 20 && tMax <= F.AT_FEET + F.AT_FEET_RUN + 1.5 && turn.end.inFront > 0.7 && turn.touches.length === 0 && turn.mine,
  'turning with it at his feet (PASS held), it goes round with his feet: ' + m(tMin) + ' to ' + m(tMax) + ' from him all the way round, and it ends in front of him the new way (it went round a ring 25 px and more off him before)');

// 3. RUNNING WITH IT (Dribbling 10): every touch from his feet, and the ball on ahead of him between them
const run = await scene({ drib: 10, steps: [[3, 'fwd']] });
const rt = run.touches.filter(x => x.t > 0.2), rGap = maxOf(run.frames.filter(x => x.t > 0.5), x => x.gap), rTouch = maxOf(rt, x => x.gap);
info('running with it at Dribbling 10: touches at ' + rt.map(x => m(x.gap)).join(', ') + '; the ball up to ' + m(rGap) + ' from him between them');
ok(rt.length >= 4 && rTouch <= F.DRIB_TOUCH + 0.5 && rGap >= rTouch + 0.2 * MK && run.mine,
  'running with it, every touch is from his feet (' + rt.length + ', at most ' + m(rTouch) + ' from him), and between them it goes on ahead (up to ' + m(rGap) + ')');

// 4. TURNING WHILE RUNNING WITH IT (Dribbling 5.5): the stick pushed 90 degrees off -- he goes on to it and takes it the
//    new way, every touch still from his feet (none knocked on from out at his reach)
const side = await scene({ steps: [[1.2, 'fwd'], [1.4, 'side']] });
const st = side.touches.filter(x => x.t > 0.2), sAfter = st.filter(x => x.t > 1.2), sTouch = maxOf(st, x => x.gap);
info('turning 90 degrees while running with it: touches at ' + st.map(x => x.t + ' s ' + m(x.gap)).join(', '));
ok(sAfter.length >= 2 && sTouch <= F.DRIB_TOUCH + 0.5 && side.mine,
  'turning while running with it, he goes on to it and every touch is still from his feet (' + st.length + ', ' + sAfter.length + ' after the turn, at most ' + m(sTouch) + ' from him; his reach is ' + m(30) + ' and more)');

// 5. LETTING GO: running with it, then the stick let go -- he goes on to it and stops with it at his boots
const stop = await scene({ steps: [[1.2, 'fwd'], [1.8, null]] });
info('the stick let go: at the end ' + m(stop.end.gap) + ' from him, going ' + (stop.end.sp / MK).toFixed(2) + ' m/s');
ok(stop.end.gap <= F.AT_FEET + 2 && stop.end.sp < 5 && stop.mine, 'letting go of the stick, he goes on to it and stops with it at his boots (' + m(stop.end.gap) + ' from him)');

// 6. A TACKLE finds it where it did: out where it was held before (his body and a step), not at his boots
const spot = await page.evaluate(() => { const T = window.__T, me = T.controlled(), b = T.ball(), s = T.tackleSpot(me);
  me.vx = me.vy = 0;
  const bd = Math.hypot(b.x - me.x, b.y - me.y), sd = Math.hypot(s.x - me.x, s.y - me.y), cos = ((b.x - me.x) * (s.x - me.x) + (b.y - me.y) * (s.y - me.y)) / (bd * sd || 1);
  return { bd, sd, cos }; });
info('a tackle: the ball ' + m(spot.bd) + ' from him, where a tackle finds it ' + m(spot.sd) + ' (the same way: ' + spot.cos.toFixed(3) + ')');
ok(Math.abs(spot.sd - 25) < 0.6 && spot.cos > 0.999, 'a tackle finds it where it always did: ' + m(spot.sd) + ' from him, the way the ball is (it\'s at his boots, ' + m(spot.bd) + ' off)');

// 7. A MOVE begun with it at his boots: from there, no jump (a croqueta from standing)
await scene({ steps: [[0.6, null]] });
const mv = await page.evaluate(() => new Promise(res => { const T = window.__T, me = T.controlled(), b = T.ball(), b0 = { x: b.x, y: b.y }, g0 = Math.hypot(b.x - me.x, b.y - me.y);
  T.setSkill(T.mkSkill(me, { kind: 'croq' })); let n = 0, first = null, prev = { x: b.x, y: b.y }, maxStep = 0;
  (function tick(){ n++; const s = Math.hypot(b.x - prev.x, b.y - prev.y); prev = { x: b.x, y: b.y };
    if(first === null) first = { jump: Math.hypot(b.x - b0.x, b.y - b0.y), gap: Math.hypot(b.x - me.x, b.y - me.y) }; else maxStep = Math.max(maxStep, s);
    if(T.skill() && n < 120) return requestAnimationFrame(tick);
    res({ g0, first, maxStep, frames: n, done: !T.skill() }); })(); }));
info('a croqueta begun at his boots: ' + JSON.stringify(mv));
ok(mv.first.jump <= 5 && mv.done, 'a move begun with it at his boots starts from there: the ball ' + m(mv.first.jump) + ' on in the first frame (from ' + m(mv.g0) + ' off him), and the move goes through');

process.exitCode = rep.finish();
await browser.close();

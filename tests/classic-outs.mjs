// FOOTBALL CLASSIC, THE BALL OUT OF PLAY (v138): over a touchline it's a throw-in to the side that didn't touch it last,
// from where it went out; over an end line a goal kick, or a corner off a man of the side whose goal it is; off a post it
// comes back. The man taking a throw-in gets to it and takes it on the line with both hands over his head, the other
// side 2 m off him, and it's thrown -- in the air -- to a team-mate; yours you're put on, PASS throws it (or it goes on
// its own after five seconds). Nobody's offside from it. At a corner his men go into the box, theirs mark them and one
// takes the near post, all 9.15 m off the ball, and it's crossed in; yours, CROSS crosses it. At a goal kick the other
// side stay out of the penalty area till it's taken, and nobody's offside from it. Free play keeps the old walls.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, FW, FH, YC, MK, PA_D, PA_HW, GOAL_W, atkOf, keeperOf, inOffsidePos, passTo, doPass, '
  + 'get RS(){ return {YOURS:RS_YOURS, LATE:RS_LATE, OFF:RS_OFF, THROW_Z, THROW_D, WIND:THROW_WIND, LIFT:THROW_LIFT, FOLLOW:THROW_FOLLOW, RUN:OUTBALL_RUN, FADE:OUTBALL_FADE}; }, '
  + 'outBall:()=>outBall, newAlpha:()=>newBallAlpha(), pose:p=>throwPoseOf(p), keepers:()=>keepers, rs:()=>restartInfo, rt:()=>restartT, last:()=>lastRestart, check:()=>checkOutOfPlay(), '
  + 'give:(t,tm,x,y)=>doRestart(t,tm,x,y), controlled:()=>controlled, gk:()=>gkHold, offsideT:()=>offsideT, offsidePass:()=>offsidePass, simNow:()=>simNow, '
  + 'setFree:v=>{ freePlay=v; }, grade:()=>lastGrade, ballAt, '
  + 'freeze:()=>{ restartT=0; restartInfo=null; offsideT=0; offsidePass=null; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; skill=null; matchClock=0; advOn=false; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-outs-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, fastFrames: true });
const { ok, info } = rep;
const HELPERS = `window.__run = (sec, until) => new Promise(res => { const T = window.__T, t0 = T.simNow();
  (function tick(){ if(T.simNow() - t0 >= sec || (until && until())) return res(+(T.simNow() - t0).toFixed(2)); requestAnimationFrame(tick); })(); });
window.__watch = () => { const T = window.__T, b = T.ball(); window.__after = null;   // (the ball the frame it's taken: the frames run on, fast, while a key's pressed)
  (function tick(){ if(!T.rs()){ const r = b.intendedRcv; window.__after = { up: b.z > 0 && b.vz > 0, z: Math.round(b.z), vx: b.vx, vy: b.vy, to: r ? r.team : 'space', onTo: r ? T.controlled() === r : null,
    cross: b.crossT > 0 && b.crossBy === 'G' && !b.ownedBy }; return; } requestAnimationFrame(tick); })(); };`;
const start = async () => { await page.goto('file://' + copy); await page.waitForTimeout(500);
  await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(400);
  await page.evaluate(HELPERS); };
await start();

// --- THE LINES: over a touchline, a throw-in; off a post, back in play; wide of it, out --------------------------------
let r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = {};
  const out = (x, y, last) => { T.freeze(); b.ownedBy = null; b.x = x; b.y = y; b.vx = b.vy = 0; b.z = 0; b.lastTouch = last; T.check(); const s = T.rs();
    return s ? s.type + ':' + s.team + ':' + Math.round(s.x / T.MK) + ':' + (s.y === 0 ? 'far' : s.y === T.FH ? 'near' : s.y) : 'none'; };
  res.far = out(T.FW * 0.4, -12, 'G'); res.near = out(T.FW * 0.7, T.FH + 12, 'R'); res.inside = out(T.FW * 0.5, 4, 'R');
  res.x = [Math.round(T.FW * 0.4 / T.MK), Math.round(T.FW * 0.7 / T.MK)];
  // the woodwork: a ball rolling over the end line at a post comes back; a metre and a half wide of it, out
  const roll = async y => { T.freeze(); b.ownedBy = null; b.x = T.FW - 30; b.y = y; b.vx = 500; b.vy = 0; b.z = 0; b.vz = 0; b.lastTouch = 'G'; b.shotT = 0;
    for(const k of T.keepers()) k.claimCd = 5;                                               // (the keepers left out of it)
    for(const q of T.players()) if(Math.hypot(q.x - b.x, q.y - b.y) < 6 * T.MK) q.x = T.FW / 2;
    await window.__run(0.4, () => T.rs() || T.gk()); return { out: !!(T.rs() || T.gk()), back: b.vx < 0, x: Math.round(b.x - T.FW) }; };
  res.post = await roll(T.YC + T.GOAL_W / 2); res.wide = await roll(T.YC + T.GOAL_W / 2 + 1.5 * T.MK);
  res.wideLast = T.last() && T.last().type;
  T.freeze(); return res; });
info('lines: ' + JSON.stringify(r));
ok(r.far === 'throw:R:' + r.x[0] + ':far' && r.near === 'throw:G:' + r.x[1] + ':near' && r.inside === 'none',
  'over a touchline, all of it: a throw-in to the side that didn\'t touch it last, on the line where it went out (' + r.far + ', ' + r.near + '); on the line, still in (' + r.inside + ')');
ok(!r.post.out && r.post.back && r.wide.out && /^(goalkick|corner)$/.test(r.wideLast),
  'off a post it comes back, play on (' + JSON.stringify(r.post) + '); a metre and a half wide of it, out (' + r.wideLast + ')');

// --- THE COMPUTER'S THROW-IN: he gets to it, takes it on the line over his head, theirs 2 m off, thrown in the air ------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = {};
  T.freeze(); b.ownedBy = null; b.x = T.FW * 0.55; b.y = -12; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G'; T.check();
  const R = T.rs(); res.type = R && R.type; res.team = R && R.team;
  res.walk = await window.__run(4, () => T.rs() && T.rs().set);
  const tk = T.rs().taker; res.onLine = Math.abs(tk.y) < 0.5;
  res.hands = Math.abs(b.z - T.RS.THROW_Z) < 1 && Math.hypot(b.x - tk.x, b.y - tk.y) < 2; res.faces = +tk.facing.y.toFixed(2);
  let minOff = 1e9, touched = false; const lt = b.lastTouchP;
  res.held = await window.__run(T.RS.LATE.throw + 1, () => { for(const q of T.players()) if(q.team !== tk.team) minOff = Math.min(minOff, Math.hypot(q.x - tk.x, q.y - tk.y));
    if(T.rs() && b.ownedBy) touched = true; return !T.rs(); });
  res.minOff = +(minOff / T.MK).toFixed(2); res.touched = touched;
  res.thrown = !T.rs(); res.z0 = Math.round(b.z); res.up = b.vz > 0; res.by = b.lastTouchP === tk; res.rcv = b.intendedRcv ? b.intendedRcv.team : 'space';
  res.noOff = T.offsidePass() === null; res.noTouch = tk.noTouchT > 0.2;
  const x0 = b.x, y0 = b.y; await window.__run(2, () => b.z <= 0 || b.ownedBy); res.dist = +(Math.hypot(b.x - x0, b.y - y0) / T.MK).toFixed(1);
  T.freeze(); return res; });
info('their throw-in: ' + JSON.stringify(r));
ok(r.type === 'throw' && r.team === 'R' && r.walk < 3.1, 'theirs: their man gets to the ball (' + r.walk + ' s)');
ok(r.onLine && r.hands && r.faces > 0.7, 'he takes it on the line, the ball over his head with both hands, facing the pitch');
ok(r.minOff >= 1.99 && !r.touched, 'our men stay 2 m off him (nearest ' + r.minOff + ' m), and nobody touches it till it\'s thrown');
ok(r.thrown && r.held <= 3.0 && r.z0 >= 30 && r.up && r.by && r.noTouch, 'he throws it -- within ' + r.held + ' s, up from over his head (' + r.z0 + ' px), the thrower not to touch it again straight off');
ok(r.dist <= 26.5 && r.rcv !== 'G', 'to one of theirs (' + r.rcv + '), coming down within 25 m (' + r.dist + ' m)');

// --- YOUR THROW-IN: you're put on him; PASS throws it -- to the man that way, and you go with it ------------------------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = {};
  T.freeze(); b.ownedBy = null; b.x = T.FW * 0.45; b.y = T.FH + 12; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'R'; T.check();
  await window.__run(4, () => T.rs() && T.rs().set); const tk = T.rs().taker; res.team = T.rs().team; res.yours = T.controlled() === tk;
  await window.__run(0.3); res.still = T.rs() && T.rs().set;   // (it waits for you)
  window.__tk = tk; window.__watch(); return res; });
info('your throw-in: ' + JSON.stringify(r));
ok(r.team === 'G' && r.yours && r.still, 'yours: you\'re put on the man taking it, and it waits for you');
await page.keyboard.down('KeyD'); await page.waitForTimeout(60);                              // (the stick along the line: aimed that way, onto the pitch)
await page.keyboard.down('KeyJ'); await page.waitForTimeout(160); await page.keyboard.up('KeyJ'); await page.keyboard.up('KeyD');
r = await page.evaluate(async () => { const T = window.__T, res = {};
  await window.__run(1.5, () => window.__after); const a = window.__after || {}; res.thrown = !!window.__after; res.up = a.up; res.z = a.z;
  res.to = a.to; res.onTo = a.onTo; res.way = Math.sign(a.vx); res.into = a.vy < 0;
  T.freeze(); return res; });
info('pressed: ' + JSON.stringify(r));
ok(r.thrown && r.up && r.into && r.way === 1 && (r.to === 'G' ? r.onTo : r.to === 'space'), 'PASS throws it the way you aim it, onto the pitch, in the air -- to one of ours (you go with him), or into the space (' + r.to + ')');
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = {};
  T.freeze(); b.ownedBy = null; b.x = T.FW * 0.3; b.y = -12; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'R'; T.check();
  await window.__run(4, () => T.rs() && T.rs().set); res.yours = T.controlled() === T.rs().taker;
  res.after = await window.__run(T.RS.YOURS + 1, () => !T.rs()); res.thrown = !T.rs(); T.freeze(); return res; });
info('left: ' + JSON.stringify(r));
ok(r.yours && r.thrown && Math.abs(r.after - 5.25) < 0.2, 'left alone, it\'s thrown for you after ' + r.after + ' s (5 s, and the wind-up)');

// --- NO OFFSIDE FROM A THROW-IN: a man of ours past their last man, a throw to him -- nobody's flagged; a pass, he is -----
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = { trials: [] };
  for(let i = 0; i < 4; i++){
    T.freeze(); const atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0; b.ownedBy = null; b.x = gx - atk * 22 * T.MK; b.y = -12; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'R'; T.check();
    await window.__run(4, () => T.rs() && T.rs().set); const tk = T.rs().taker;
    const q = T.players().filter(p => p.team === 'G' && p !== tk).sort((a, c) => atk * (c.x - a.x))[0];
    const defs = T.players().filter(p => p.team === 'R').map(p => p.x).concat(T.keeperOf('R').x).sort((a, c) => atk * (c - a));
    q.x = defs[1] + atk * 3 * T.MK; q.y = 8 * T.MK; q.vx = q.vy = 0;                           // (three metres past their second-last man)
    const off = T.inOffsidePos(q);
    T.doPass(0.3, { target: q });                                                             // (thrown to him: yours, a tap on him)
    await window.__run(1, () => !T.rs()); const snap = T.offsidePass(), thrown = !T.rs();     // (wound up, and gone: nobody flagged as it goes)
    await window.__run(2.5, () => b.ownedBy || T.offsideT() > 0);
    // the same man, the same spot, a pass instead: he's flagged
    T.freeze(); b.ownedBy = null; b.x = tk.x; b.y = 2 * T.MK; b.z = 0; b.vx = b.vy = 0;
    const defs2 = T.players().filter(p => p.team === 'R').map(p => p.x).concat(T.keeperOf('R').x).sort((a, c) => atk * (c - a));
    q.x = defs2[1] + atk * 3 * T.MK; q.y = 8 * T.MK;
    T.passTo(tk, q); const snap2 = T.offsidePass();
    res.trials.push({ off, thrown, snapNull: snap === null, whistle: T.offsideT() > 0, passFlags: !!(snap2 && snap2.flagged.includes(q)) });
  }
  T.freeze(); return res; });
info('offside: ' + JSON.stringify(r));
ok(r.trials.every(t => t.off && t.thrown && t.snapNull && !t.whistle) && r.trials.every(t => t.passFlags),
  'nobody\'s offside from a throw-in: a man past their last but one, thrown to, isn\'t flagged -- passed to from the same spot, he is');

// --- A CORNER: theirs set up in our box, ours marking them and on the near post, 9.15 m off; crossed in ----------------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = {};
  // as when it comes from an attack: their men up our end, 15-35 m out, ours back in front of our goal, 5-22 m out
  T.freeze(); const atkR = T.atkOf('R'), gx = atkR > 0 ? T.FW : 0;
  T.players().forEach((p, i) => { const k = i / 17, rr = Math.sin(i * 2.4); if(p.team === 'R'){ p.x = gx - atkR * (15 + 20 * k) * T.MK; p.y = T.YC + rr * 18 * T.MK; }
    else { p.x = gx - atkR * (5 + 17 * k) * T.MK; p.y = T.YC + rr * 14 * T.MK; } p.vx = p.vy = 0; });
  b.ownedBy = null; b.x = gx + atkR * 12; b.y = 30; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G'; T.check();
  const R = T.rs(); res.type = R && R.type; res.team = R && R.team; res.at = R && [Math.round(Math.abs(R.x - gx)), Math.round(R.y)];
  let minOff = 1e9, quad = 0, tk = null; const inB = q => Math.abs(q.x - gx) < T.PA_D && Math.abs(q.y - T.YC) < T.PA_HW;
  await window.__run(10, () => { const S = T.rs(); if(S) tk = S.taker; if(S && S.set){ for(const q of T.players()) if(q.team === 'G') minOff = Math.min(minOff, Math.hypot(q.x - S.x, q.y - S.y));
      quad = Math.max(quad, Math.hypot(b.x - S.x, b.y - S.y)); }
    if(S && S.set){ res.att = T.players().filter(q => q.team === 'R' && inB(q)).length; res.def = T.players().filter(q => q.team === 'G' && inB(q)).length;
      const post = { x: gx - atkR * 0.7 * T.MK, y: T.YC - (T.GOAL_W / 2 - 0.7 * T.MK) }; res.post = +(Math.min(...T.players().filter(q => q.team === 'G').map(q => Math.hypot(q.x - post.x, q.y - post.y))) / T.MK).toFixed(1); }
    return !S; });
  res.minOff = +(minOff / T.MK).toFixed(2); res.quad = +(quad / T.MK).toFixed(2);
  res.cross = b.crossT > 0 && b.crossBy === 'R' && !b.ownedBy;
  // where it comes down through head height (its path, as it's struck): in the box
  let land = null; for(let t = 0.05; t < 2.5 && !land; t += 0.02){ const B = T.ballAt(t), B2 = T.ballAt(t + 0.02); if(B.z < 45 && B2.z < B.z) land = { x: B.x, y: B.y }; }
  res.land = land ? [+(Math.abs(land.x - gx) / T.MK).toFixed(1), +(Math.abs(land.y - T.YC) / T.MK).toFixed(1)] : null;
  T.freeze(); return res; });
info('their corner: ' + JSON.stringify(r));
ok(r.type === 'corner' && r.team === 'R' && r.at[0] <= 14 && r.at[1] <= 14, 'off one of ours over our end line: a corner to them, at the corner it went out nearer');
ok(r.att >= 3 && r.def >= r.att && r.post <= 2.5, 'as it\'s taken: ' + r.att + ' of theirs in our box, ' + r.def + ' of ours, one of ours on the near post (' + r.post + ' m)');
ok(r.minOff >= 9.1 && r.quad <= 0.5, 'ours 9.15 m off the ball (nearest ' + r.minOff + ' m) and the ball in the quadrant till it\'s taken');
ok(r.cross && r.land && r.land[0] <= 18 && r.land[1] <= 21, 'crossed in: it comes down through head height in our box (' + JSON.stringify(r.land) + ' m from the line, the middle)');

// --- YOUR CORNER: you're put on him; the stick doesn't move him; CROSS crosses it ---------------------------------------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = {};
  T.freeze(); const atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0; b.ownedBy = null; b.x = gx + atk * 12; b.y = T.FH - 30; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'R'; T.check();
  await window.__run(5, () => T.rs() && T.rs().set); const R = T.rs(); res.team = R.team; res.type = R.type; res.yours = T.controlled() === R.taker;
  window.__tk = R.taker; window.__tk0 = { x: R.taker.x, y: R.taker.y }; window.__watch(); return res; });
await page.keyboard.down('KeyA'); await page.waitForTimeout(250);
const moved = await page.evaluate(() => { const tk = window.__tk; return +(Math.hypot(tk.x - window.__tk0.x, tk.y - window.__tk0.y) / window.__T.MK).toFixed(2); });
await page.keyboard.up('KeyA');
await page.keyboard.down('KeyL'); await page.waitForTimeout(220); await page.keyboard.up('KeyL');
const c2 = await page.evaluate(async () => { const T = window.__T; await window.__run(1.5, () => window.__after); const a = window.__after || {}; T.freeze(); return { taken: !!window.__after, cross: !!a.cross, z: a.z }; });
info('your corner: ' + JSON.stringify(r) + ' moved ' + moved + ' m, ' + JSON.stringify(c2));
ok(r.type === 'corner' && r.team === 'G' && r.yours && moved < 0.05, 'yours: you\'re on the man taking it, and the stick doesn\'t walk him off it');
ok(c2.taken && c2.cross, 'CROSS crosses it in');

// --- A GOAL KICK: theirs; ours can't go into their box till it's taken; nobody's offside from it -------------------------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = {};
  T.freeze(); const atkR = T.atkOf('R'), gl = atkR > 0 ? 0 : T.FW; b.ownedBy = null; b.x = gl - atkR * 12; b.y = T.YC + 12 * T.MK; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G';
  { const k = T.keepers().find(k => k.team === 'R'); k.x = k.homeX - k.side * 6 * T.MK; k.y = T.YC + 4 * T.MK; k.mode = 'line'; }   // (off his line, out to the ball that went past him)
  T.check();
  const k0 = T.keepers().find(k => k.team === 'R'); let jump = 0, px = k0.x, py = k0.y; const d0 = Math.hypot(k0.x - k0.homeX, k0.y - T.YC);
  res.walk = await window.__run(3.5, () => { jump = Math.max(jump, Math.hypot(k0.x - px, k0.y - py)); px = k0.x; py = k0.y; return T.gk(); });   // (he walks to it)
  res.jump = +(jump / T.MK).toFixed(2); res.d0 = +(d0 / T.MK).toFixed(1);
  const kp = T.gk(); res.gk = !!kp && kp.team === 'R' && !!kp.goalKick;
  const inB = q => Math.abs(q.x - gl) < T.PA_D && Math.abs(q.y - T.YC) < T.PA_HW, was = new Set(T.players().filter(q => q.team === 'G' && inB(q)));
  let came = 0; const snap = { off: null };
  await window.__run(8, () => { for(const q of T.players()) if(q.team === 'G' && !was.has(q) && inB(q)) came++;
    if(!T.gk() && snap.off === null){ snap.off = T.offsidePass() === null ? 'none' : 'flagged'; return true; } return false; });
  res.came = came; res.kicked = !T.gk(); res.off = snap.off; T.freeze(); return res; });
info('goal kick: ' + JSON.stringify(r));
ok(r.gk && r.kicked && r.came === 0, 'a goal kick to them: their keeper\'s, and none of ours goes into their box till it\'s taken');
ok(r.jump < 0.4 && r.walk > 0, 'their keeper walks to the ball in his six-yard box (' + r.d0 + ' m in ' + r.walk + ' s, never more than ' + r.jump + ' m a frame) -- he isn\'t put there');
ok(r.off === 'none', 'nobody\'s offside from it (nobody flagged as it\'s kicked)');

// --- THE BALL GONE OUT runs on, and a new one comes in where it's taken: the old fading as the new one does -----------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = { old: [], nw: [] };
  T.freeze(); b.ownedBy = null; b.dribbler = null; b.x = T.FW * 0.45; b.y = 40; b.vx = 100; b.vy = -450; b.z = 0; b.vz = 0; b.lastTouch = 'G'; b.shotT = 0;
  for(const q of T.players()) if(Math.hypot(q.x - b.x, q.y - b.y) < 15 * T.MK) q.y = T.YC;
  await window.__run(0.5, () => T.outBall()); const o0 = T.outBall(); res.started = !!o0; const y0 = o0 ? o0.y : 0;
  for(const at of [0.4, 0.7, 1.0, 1.15, 1.45]){ await window.__run(9, () => !T.outBall() || T.outBall().t >= at); const o = T.outBall();
    res.old.push(o ? [+(o.y / T.MK).toFixed(1), +(1 - Math.min(1, Math.max(0, (o.t - T.RS.RUN) / T.RS.FADE))).toFixed(2)] : null); res.nw.push(+T.newAlpha().toFixed(2)); }
  res.spot = [Math.round(b.y), b.vx === 0 && b.vy === 0]; T.freeze(); return res; });
info('the ball gone out: ' + JSON.stringify(r));
ok(r.started && r.old[0] && r.old[1] && r.old[1][0] < r.old[0][0] && r.old[0][0] < -1 && r.old[0][1] === 1 && r.old[1][1] === 1,
  'over the touchline, the ball runs on off the pitch (' + (r.old[0] && r.old[0][0]) + ' m, then ' + (r.old[1] && r.old[1][0]) + ' m past the line), as it was');
ok(r.nw[0] === 0 && r.nw[1] === 0 && r.nw[2] > 0 && r.nw[2] < 1 && r.nw[3] > r.nw[2] && r.nw[4] === 1 && r.old[2][1] < 1 && r.old[3][1] < r.old[2][1] && r.old[4] === null,
  'and a new one comes in on the line where it went out, faded in from 0.8 s to 1.3 s as the old one fades out (new ' + r.nw.join(' ') + '; old ' + r.old.map(x => x ? x[1] : '-').join(' ') + ')');

// --- THE THROW, DRAWN: held up over his head; wound up, higher; gone, his arms coming down, him where he is ------------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), res = {};
  T.freeze(); b.ownedBy = null; b.x = T.FW * 0.6; b.y = -12; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G'; T.check();
  await window.__run(4, () => T.rs() && T.rs().set); const tk = T.rs().taker; res.hold = T.pose(tk); res.z0 = Math.round(b.z);
  await window.__run(4, () => !T.rs() || T.rs().windT > 0); res.wind = T.pose(tk); const tw = T.simNow();
  let top = 0; await window.__run(1, () => { if(T.rs()) top = Math.max(top, b.z); return !T.rs(); }); res.windFor = +(T.simNow() - tw).toFixed(2); res.lift = Math.round(top - res.z0);
  res.follow = T.pose(tk); const fx = tk.x, fy = tk.y;
  await window.__run(T.RS.FOLLOW - 0.06); res.still = Math.hypot(tk.x - fx, tk.y - fy) < 1; res.during = T.pose(tk);
  await window.__run(0.15); res.after = T.pose(tk); T.freeze(); return res; });
info('the throw, drawn: ' + JSON.stringify(r));
ok(r.hold === 'hold' && r.z0 === 40, 'he holds it up over his head with both arms (his frame\'s hanging hands left out, his arms drawn up to it)');
ok(r.wind === 'wind' && Math.abs(r.windFor - 0.25) <= 0.07 && r.lift >= 4, 'to throw it he takes it back over his head -- ' + r.lift + ' px up over ' + r.windFor + ' s -- and lets it go');
ok(r.follow === 'follow' && r.during === 'follow' && r.still && r.after === null, 'gone, his arms come down in front of him, him where he is for a moment, then he\'s off');

// --- FREE PLAY keeps its walls --------------------------------------------------------------------------------------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball();
  T.freeze(); T.setFree(true); b.ownedBy = null; b.x = T.FW * 0.5; b.y = 20; b.vx = 0; b.vy = -400; b.z = 0; b.vz = 0; b.lastTouch = 'G';
  for(const q of T.players()) if(Math.hypot(q.x - b.x, q.y - b.y) < 8 * T.MK) q.y = T.YC;
  await window.__run(0.4); const res = { out: !!T.rs(), back: b.vy > 0, y: Math.round(b.y) }; T.setFree(false); T.freeze(); return res; });
info('free play: ' + JSON.stringify(r));
ok(!r.out && r.back && r.y > 0, 'free play: the ball comes back off the wall, as it always did');

process.exitCode = rep.finish();
await browser.close();

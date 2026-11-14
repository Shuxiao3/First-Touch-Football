// FOOTBALL CLASSIC, RECEIVE, SETTLE, THEN GO; AND A PASS GOT READY (v210). A ball he's just received beside or behind
// him, the way he wants to go: he has to get round it before he can go at it -- (v218) as fast as his Ball control brings
// it round to his front; it was his Agility -- his
// pace and acceleration cut till it's in front of him (never frozen); one already in front of him, nothing changes.
// Agility is also how well he gets going again the other way. And Off IQ is how soon a pass is ready, not how good it
// is once it is: the moment he has the ball, or has just got round it, or has just turned, a pass goes less true, and
// the better his Off IQ the sooner it's as true as it gets. Compared at 1, 5.5 and 10, everything else level, for you
// and the computer alike. Stepped by hand at 60 a second. On a copy of the game that lets the test set the scene. (v218)
// And turning with the ball: one off to his side and him turning the other way, it comes round the way he's turning,
// across his front, never round his back, and he can't turn at full speed till it's in front of him -- the quicker the
// better his Ball control.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, MK, atkOf, own, stepOutfield, carry, runSpeedOf, turnWorst, turnSpray, passSpray, trackFacing, '
  + 'simNow:()=>simNow, adv:dt=>{ simNow+=dt; }, freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-settle-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);

// ===== RECEIVE, SETTLE, THEN GO =====
// a man stood still facing up the pitch, a ball he's just received 1 m off him at th degrees round from the way he
// faces; the stick held on up the pitch. When he's away (85% of his running pace), when the ball's round in front of
// him, and how far he's got in the first second
const settle = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), b = T.ball(), dt = 1 / 60, out = {};
  const you = T.controlled(), mate = T.players().find(q => q.team === 'G' && q !== you);
  T.freeze(); for(const q of T.players()) if(q !== you && q !== mate){ q.x = 60; q.y = 40; q.vx = q.vy = 0; }
  const run = (p, ag, th, bc = 5.5) => {
    const keep = p.stats; p.stats = Object.assign({}, keep, { agility: ag, ballControl: bc, dribbling: 5.5, speed: 6, acceleration: 6 });   // (v218: his Ball control set -- it's how fast the ball comes round)
    p.x = T.FW / 2; p.y = T.YC; p.vx = p.vy = 0; p.state = 'normal'; p.facing = { x: atk, y: 0 }; p.stamina = 1; p.staminaCap = 1; p.sprint = false;
    const a = th * Math.PI / 180, bx = Math.cos(a) * atk, by = Math.sin(a);
    b.ownedBy = null; b.dribbler = null; b.dribbleGrace = 0; b.x = p.x + bx * 26; b.y = p.y + by * 26; b.z = 0; b.vx = b.vy = b.vz = 0; b.touchAt = T.simNow();
    T.own(p, 26, true); p.carryAngle = Math.atan2(by, bx);
    const x0 = p.x, run0 = T.runSpeedOf(p); let go = null, set = null, d1 = 0, moved = 0;
    for(let t = 0; t < 1.5; t += dt){ T.adv(dt);
      T.stepOutfield(p, atk, 0, dt); T.carry(p, dt, true); b.x += b.vx * dt; b.y += b.vy * dt;
      if(b.ownedBy !== p) break;
      const sp = Math.hypot(p.vx, p.vy); if(go == null && sp > 0.85 * run0 * 0.875) go = +t.toFixed(2);
      if(set == null && !(p.settleT > 0)) set = +t.toFixed(2);
      if(t <= 1) d1 = (p.x - x0) * atk; if(t <= 0.25) moved = (p.x - x0) * atk; }
    p.stats = keep; return { go, set, m1: +(d1 / T.MK).toFixed(2), m025: +(moved / T.MK).toFixed(2) }; };
  for(const who of ['you', 'mate']) for(const ag of [1, 5.5, 10]) for(const th of [0, 90, 180]) out[who + ' ' + ag + ' ' + th] = run(who === 'you' ? you : mate, ag, th);
  for(const who of ['you', 'mate']) for(const bc of [1, 10]) for(const th of [0, 90, 180]) out[who + ' bc' + bc + ' ' + th] = run(who === 'you' ? you : mate, 5.5, th, bc);   // (v218: and at Ball control 1 and 10, Agility 5.5)
  return out; });
for(const ag of [1, 5.5, 10]) info('Agility ' + ag + ' -- in front, beside, behind him (away at s, round in front at s, m in the first second): ' + [0, 90, 180].map(th => JSON.stringify(settle['you ' + ag + ' ' + th])).join('  '));
const S = (ag, th) => settle['you ' + ag + ' ' + th], B = (bc, th) => bc === 5.5 ? S(5.5, th) : settle['you bc' + bc + ' ' + th];   // (B: by Ball control, Agility 5.5)
for(const bc of [1, 10]) info('Ball control ' + bc + ' -- in front, beside, behind him: ' + [0, 90, 180].map(th => JSON.stringify(B(bc, th))).join('  '));
ok([1, 5.5, 10].every(ag => S(ag, 0).go === S(5.5, 0).go && S(ag, 0).m1 === S(5.5, 0).m1 && S(ag, 0).set === 0) && [1, 10].every(bc => B(bc, 0).go === S(5.5, 0).go && B(bc, 0).set === 0), 'a ball received in front of him, the way he wants to go: he\'s away as he always was, whatever his Agility or Ball control (in ' + S(5.5, 0).go + ' s, ' + S(5.5, 0).m1 + ' m in the first second)');
ok([1, 5.5, 10].every(ag => S(ag, 90).go > S(ag, 0).go + 0.1 && S(ag, 180).go > S(ag, 90).go + 0.1 && S(ag, 180).m1 < S(ag, 0).m1 - 0.6),
  'one beside him, or behind him, he has to get round first: away in ' + [1, 5.5, 10].map(ag => S(ag, 90).go + '/' + S(ag, 180).go).join(', ') + ' s at Agility 1, 5.5, 10 (beside/behind)');
ok(B(1, 180).go > B(5.5, 180).go + 0.15 && B(5.5, 180).go > B(10, 180).go + 0.04 && B(1, 90).go > B(10, 90).go + 0.08 && B(10, 180).m1 > B(1, 180).m1 + 0.4,
  '...the quicker the better his Ball control (v218: it brings the ball round to his front): round one behind him and away in ' + B(1, 180).go + ' s at Ball control 1, ' + B(5.5, 180).go + ' at 5.5, ' + B(10, 180).go + ' at 10 (' + B(1, 180).m1 + ', ' + B(5.5, 180).m1 + ', ' + B(10, 180).m1 + ' m in the first second)');
ok(Math.abs(S(1, 180).go - S(10, 180).go) <= 0.03 && Math.abs(S(1, 90).go - S(10, 90).go) <= 0.03, '...and not his Agility any more: away in ' + S(1, 180).go + ' s at Agility 1 and ' + S(10, 180).go + ' at 10, one behind him (v210 to v217 it was his Agility that got him round)');
ok([1, 5.5, 10].every(ag => S(ag, 180).m025 > 0.15) && [1, 10].every(bc => B(bc, 180).m025 > 0.1), 'never frozen: even with it behind him he\'s moving off within a quarter of a second (' + [1, 5.5, 10].map(ag => S(ag, 180).m025).join(', ') + ' m; at Ball control 1 and 10, ' + [1, 10].map(bc => B(bc, 180).m025).join(', ') + ')');
ok(Object.keys(settle).filter(k => k.startsWith('you ')).every(k => { const a = settle[k], m = settle['mate' + k.slice(3)]; return Math.abs(a.go - m.go) <= 0.02 && Math.abs(a.set - m.set) <= 0.03 && Math.abs(a.m1 - m.m1) <= 0.05; }),
  'the same for the computer\'s men as for yours, at every Agility and every angle (to a hundredth or two)');

// TURNING WITH THE BALL (v218): yours, stood with the ball 90 deg off to one side of the way he faces, the stick pushed
// 135 deg round the other way -- which way round the ball goes (round his front, or his back?), how far round his body is
// a tenth of a second on, and how soon the ball's in front of where he's going, at Ball control 1, 5.5 and 10
const turn = await page.evaluate(() => { const T = window.__T, p = T.controlled(), b = T.ball(), dt = 1 / 60, out = {};
  T.freeze(); for(const q of T.players()) if(q !== p){ q.x = 60; q.y = 40; q.vx = q.vy = 0; }
  const W = a => Math.atan2(Math.sin(a), Math.cos(a)), D = a => Math.round(a * 180 / Math.PI);
  for(const bc of [1, 5.5, 10]){ const keep = p.stats; p.stats = Object.assign({}, keep, { ballControl: bc, agility: 5.5, dribbling: 5.5, speed: 6, acceleration: 6 });
    p.x = T.FW / 2; p.y = T.YC; p.vx = p.vy = 0; p.state = 'normal'; p.facing = { x: 1, y: 0 }; p.stamina = 1; p.staminaCap = 1; p.sprint = false;
    const ba = Math.PI / 2; b.ownedBy = null; b.dribbler = null; b.x = p.x + Math.cos(ba) * 25; b.y = p.y + Math.sin(ba) * 25; b.z = 0; b.vx = b.vy = b.vz = 0;
    T.own(p, 25, true); p.carryAngle = ba; p.settleT = 0; p.prepT = 0;
    const want = -3 * Math.PI / 4; let far = -9, body01 = null, front = null;
    for(let i = 0; i < 90; i++){ T.adv(dt); T.stepOutfield(p, Math.cos(want), Math.sin(want), dt); T.carry(p, dt, true); b.x += b.vx * dt; b.y += b.vy * dt;
      if(b.ownedBy !== p) break; const at = Math.atan2(b.y - p.y, b.x - p.x); far = Math.max(far, W(at));
      if(i === 5) body01 = D(W(Math.atan2(p.facing.y, p.facing.x)));
      if(front == null && Math.abs(W(at - want)) < 20 * Math.PI / 180) front = +((i + 1) * dt).toFixed(2); }
    out[bc] = { far: D(far), body01, front }; p.stats = keep; }
  return out; });
info('stood, the ball 90 deg to one side, the stick 135 deg round the other way (furthest the ball went round its own side, deg; his body 0.1 s on; the ball in front of where he\'s going at s): ' + JSON.stringify(turn));
ok([1, 5.5, 10].every(bc => turn[bc].far <= 92 && turn[bc].front != null), 'the ball comes round the way he\'s turning, across his front -- never further round its own side than it started (' + [1, 5.5, 10].map(bc => turn[bc].far + '°').join(', ') + '), never round his back as it used to');
ok([1, 5.5, 10].every(bc => Math.abs(turn[bc].body01) <= 60), '...and he can\'t turn at full speed till it\'s in front of him: a tenth of a second on he\'s ' + [1, 5.5, 10].map(bc => Math.abs(turn[bc].body01) + '°').join(', ') + ' round, not the 135° the stick asks (he used to be round at once)');
ok(turn[1].front > turn[5.5].front + 0.1 && turn[5.5].front > turn[10].front + 0.03, '...the ball in front of where he\'s going in ' + turn[1].front + ' s at Ball control 1, ' + turn[5.5].front + ' at 5.5, ' + turn[10].front + ' at 10');

// GETTING GOING AGAIN THE OTHER WAY (without the ball): running one way, the stick pushed the other -- how soon he's
// going the other way at half his pace
const back = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), dt = 1 / 60, p = T.players().find(q => q.team === 'G' && q !== T.controlled()), b = T.ball(), out = {};
  T.freeze(); b.ownedBy = null; b.x = 60; b.y = 40; for(const q of T.players()) if(q !== p){ q.x = 60; q.y = 40; q.vx = q.vy = 0; }
  for(const ag of [1, 5.5, 10]){ const keep = p.stats; p.stats = Object.assign({}, keep, { agility: ag, speed: 6, acceleration: 6 });
    p.x = T.FW / 2; p.y = T.YC; p.vx = atk * T.runSpeedOf(p); p.vy = 0; p.state = 'normal'; p.facing = { x: atk, y: 0 }; p.stamina = 1; p.staminaCap = 1; p.sprint = false; p.sprintMoT = 0;
    let t = 0; for(; t < 3; t += dt){ T.adv(dt); T.stepOutfield(p, -atk, 0, dt); if(-p.vx * atk > 0.5 * T.runSpeedOf(p)) break; }
    out[ag] = +t.toFixed(2); p.stats = keep; }
  return out; });
ok(back[1] > back[5.5] && back[5.5] > back[10] && back[1] - back[10] >= 0.08, 'turning and going again the other way is quicker the more agile he is: half his pace back the other way in ' + back[1] + ' s at Agility 1, ' + back[5.5] + ' at 5.5, ' + back[10] + ' at 10');

// ON THE RUN: running at 3.5 m/s up the pitch, a ball received beside him -- he keeps the pace he has while he gets round
// it, he just can't go any quicker till it's in front (one received in front of him, he's on up to his running pace)
const onRun = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), b = T.ball(), dt = 1 / 60, out = {}, p = T.players().find(q => q.team === 'G' && q !== T.controlled());
  T.freeze(); for(const q of T.players()) if(q !== p){ q.x = 60; q.y = 40; q.vx = q.vy = 0; }
  const keep = p.stats; p.stats = Object.assign({}, keep, { agility: 5.5, ballControl: 5.5, dribbling: 5.5, speed: 6, acceleration: 6 });   // (v218: his Ball control set -- it brings the ball round)
  for(const th of [0, 90]){ const v0 = 3.5 * T.MK;
    p.x = T.FW / 2; p.y = T.YC; p.vx = atk * v0; p.vy = 0; p.state = 'normal'; p.facing = { x: atk, y: 0 }; p.stamina = 1; p.staminaCap = 1; p.sprint = false;
    const a = th * Math.PI / 180, bx = Math.cos(a) * atk, by = Math.sin(a);
    b.ownedBy = null; b.dribbler = null; b.dribbleGrace = 0; b.x = p.x + bx * 26; b.y = p.y + by * 26; b.z = 0; b.vx = p.vx; b.vy = 0; b.vz = 0; b.touchAt = T.simNow();
    T.own(p, 26, true); p.carryAngle = Math.atan2(by, bx);
    let lo = 1e9, at02 = null, at01 = null, set = null;
    for(let t = 0; t < 0.6; t += dt){ T.adv(dt); T.stepOutfield(p, atk, 0, dt); T.carry(p, dt, true); b.x += b.vx * dt; b.y += b.vy * dt;
      const sp = Math.hypot(p.vx, p.vy) / T.MK; if(set == null && !(p.settleT > 0)) set = +t.toFixed(2); if(set == null) lo = Math.min(lo, sp); if(at02 == null && t >= 0.2) at02 = +sp.toFixed(2); if(at01 == null && t >= 0.1) at01 = +sp.toFixed(2); }
    out[th] = { lo: lo === 1e9 ? null : +lo.toFixed(2), at01, at02, set }; }
  p.stats = keep; return out; });
info('running at 3.5 m/s, a ball received in front of him and beside him (his slowest while he gets round it, his pace at 0.1 s and 0.2 s, round at s): ' + JSON.stringify(onRun));
ok(onRun[90].lo >= 3.4 && onRun[90].at01 < onRun[0].at01 - 0.5 && onRun[90].set > 0.1, 'on the run, a ball beside him: he keeps his pace while he gets round it (never under ' + onRun[90].lo + ' m/s) but goes no quicker till it\'s in front (' + onRun[90].at01 + ' m/s at 0.1 s, v218 -- his Ball control brings it round quicker than his Agility got him round; with it in front, ' + onRun[0].at01 + ')');

// ONCE A RECEIVE: a ball he's received with a touch, gathered again, then knocked on and gathered again as he goes -- the
// pass he'll play gets ready from when he first gathered it, not again each time he gathers his own knock-on
const once = await page.evaluate(() => {
  const T = window.__T, b = T.ball(), p = T.players().find(q => q.team === 'G' && q !== T.controlled()), atk = T.atkOf('G');
  T.freeze(); p.x = T.FW / 2; p.y = T.YC; p.vx = p.vy = 0; p.state = 'normal'; p.facing = { x: atk, y: 0 };
  const put = () => { b.x = p.x + atk * 20; b.y = p.y; b.z = 0; b.vx = b.vy = b.vz = 0; };
  b.ownedBy = null; b.dribbler = null; put(); T.own(p, 26, true); const t0 = T.simNow(), p0 = p.prepT;
  b.ownedBy = null; b.dribbler = p; b.dribbleGrace = 0.85; b.touchAt = T.simNow(); T.adv(0.2); put(); T.own(p, 26, true); const p1 = p.prepT;   // (his first touch, knocked on, and gathered)
  b.ownedBy = null; b.dribbler = p; b.dribbleGrace = 0.85; T.adv(0.3); put(); T.own(p, 26, true); const p2 = p.prepT;                         // (knocked on as he goes, and gathered again)
  return { first: +(p0 - t0).toFixed(2), touch: +(p1 - t0).toFixed(2), again: +(p2 - t0).toFixed(2) }; });
info('his pass getting ready from (s after the ball first reached him): ' + JSON.stringify(once));
ok(once.first === 0 && once.touch === 0.2 && once.again === 0.2, 'the pass he\'ll play gets ready from when he\'s gathered his first touch (' + once.touch + ' s), not again each time he gathers a knock-on as he goes (' + once.again + ' s)');

// ===== A PASS GOT READY =====
// (a) the worst a pass can go off line the moment he's received it, facing the way he'll play it, and as he gets it
// ready; (b) the same long after he got it, but just turned right round to play it back
const prep = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), b = T.ball(), dt = 1 / 60, out = {};
  const p = T.players().find(q => q.team === 'G' && q !== T.controlled());
  T.freeze(); for(const q of T.players()) if(q !== p){ q.x = 60; q.y = 40; q.vx = q.vy = 0; }
  const deg = v => +(v * 180 / Math.PI).toFixed(2), at = [0, 0.15, 0.3, 0.5, 0.8];
  for(const iq of [1, 5.5, 10]){
    const keep = p.stats; p.stats = Object.assign({}, keep, { offIQ: iq, agility: 5.5 });
    p.x = T.FW / 2; p.y = T.YC; p.vx = p.vy = 0; p.state = 'normal'; p.facing = { x: atk, y: 0 }; p.faceAvg = { x: atk, y: 0 };
    b.ownedBy = null; b.dribbler = null; b.x = p.x + atk * 25; b.y = p.y; b.vx = b.vy = 0; b.touchAt = T.simNow(); T.own(p, 25, true);
    const got = {}; for(let t = 0; t <= 0.81; t += dt){ for(const m of at) if(Math.abs(t - m) < dt / 2) got[m] = deg(T.turnWorst(p, atk, 0)); T.adv(dt); T.stepOutfield(p, 0, 0, dt); T.carry(p, dt, false); T.trackFacing(p, dt); }
    p.prepT = T.simNow() - 5; p.facing = { x: -atk, y: 0 }; p.faceAvg = { x: atk, y: 0 }; const turned = {};
    for(let t = 0; t <= 0.81; t += dt){ for(const m of at) if(Math.abs(t - m) < dt / 2) turned[m] = deg(T.turnWorst(p, -atk, 0)); T.adv(dt); T.trackFacing(p, dt); }
    out[iq] = { got, turned }; p.stats = keep; }
  // (c) what it costs a pass: the spray, 15 m, played the moment he has it and once he's ready, at Off IQ 1 and 10
  const spr = (iq, wait) => { const keep = p.stats; p.stats = Object.assign({}, keep, { offIQ: iq, passAcc: 5.5, longPass: 5.5 }); let s = 0; const N = 4000;
    for(let i = 0; i < N; i++){ p.facing = { x: atk, y: 0 }; p.faceAvg = { x: atk, y: 0 }; b.ownedBy = p; p.prepT = T.simNow() - wait; s += Math.abs(T.passSpray(15 * T.MK, p) + T.turnSpray(p, atk, 0)); }
    p.stats = keep; return +(s / N * 180 / Math.PI).toFixed(2); };
  out.spray = { now1: spr(1, 0), now10: spr(10, 0), ready1: spr(1, 2), ready10: spr(10, 2), q1: spr(1, 0.25), q10: spr(10, 0.25) };
  // (d) a first-time pass: he never had it -- nothing of this (it has its own: the one-touch pass's)
  b.ownedBy = null; p.prepT = T.simNow(); out.firstTime = deg(T.turnWorst(p, atk, 0));
  return out; });
for(const iq of [1, 5.5, 10]) info('Off IQ ' + iq + ': the worst off line (°) just received, at ' + Object.keys(prep[iq].got).join('/') + ' s: ' + Object.values(prep[iq].got).join(', ') + '; just turned right round: ' + Object.values(prep[iq].turned).join(', '));
info('a 15 m pass, mean degrees off line: ' + JSON.stringify(prep.spray));
const G = iq => prep[iq].got, Tn = iq => prep[iq].turned;
ok(G(1)[0] === G(10)[0] && G(1)[0] >= 5 && Tn(1)[0] === Tn(10)[0], 'the moment he has it, or has just turned, a pass is as far off at Off IQ 10 as at 1 (' + G(1)[0] + '°, ' + Tn(1)[0] + '° turned right round): Off IQ isn\'t a pass made better');
ok(G(10)[0.15] < G(5.5)[0.15] && G(5.5)[0.15] < G(1)[0.15] && G(10)[0.3] === 0 && G(5.5)[0.5] < 0.1 && G(1)[0.5] > 0.5 && G(1)[0.8] === 0,
  '...it\'s how soon he\'s ready: just received, ready in 0.3 s at Off IQ 10, 0.5 s at 5.5, 0.8 s at 1 (' + G(1)[0.15] + '°, ' + G(5.5)[0.15] + '°, ' + G(10)[0.15] + '° at 0.15 s)');
ok(Tn(10)[0.3] < Tn(5.5)[0.3] && Tn(5.5)[0.3] < Tn(1)[0.3] && Tn(10)[0.5] === 0 && Tn(1)[0.8] > Tn(5.5)[0.8], '...and just turned, his sense of where he\'s facing catches up the sooner the better his Off IQ (' + Tn(1)[0.3] + '°, ' + Tn(5.5)[0.3] + '°, ' + Tn(10)[0.3] + '° at 0.3 s)');
ok(prep.spray.now1 > prep.spray.ready1 * 2 && Math.abs(prep.spray.now1 - prep.spray.now10) <= 0.1 * prep.spray.now1 && prep.spray.q1 > prep.spray.q10 * 1.5 && Math.abs(prep.spray.ready1 - prep.spray.ready10) <= 0.08,
  'played at once it goes far wider (' + prep.spray.now1 + '° on average, ' + prep.spray.ready1 + '° once ready) at any Off IQ; a quarter of a second in, the better he reads it the truer (' + prep.spray.q1 + '° at 1, ' + prep.spray.q10 + '° at 10); ready, no different');
ok(prep.firstTime === 0, 'a first-time pass, a ball he never had, has none of it (it has its own: the one-touch pass\'s)');

process.exitCode = rep.finish();
await browser.close();

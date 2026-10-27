// FOOTBALL CLASSIC, THE FIRST TOUCH: no timing -- the touch is the player's own, judged off his Ball control and
// Composure, and how much they matter depends on the moment. Knocking it about at the back with nobody near, even a
// poor defender almost always takes it cleanly; with a man on him, or in the final third, the touch is only as good as
// his Ball control and Composure. Nobody presses anything: you and the computer alike, it's taken as it arrives -- a
// PERFECT touch dead at your feet, a worse one off you. The reach is smaller (18 to 32, was 25 to 45). A man the ball
// is coming to turns his body to it, as quick as his Agility lets him, and moves however he must to get to it (slower
// side-on, slower still backing off); one who hasn't got round to it takes it worse. On the pitch: one solid green
// ring under the man you control (no dotted one), and the ball in whole pixels, as the players are.
// On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, atkOf, controlROf, '
  + 'touchQuality, touchPressure, finalThirdOf, lastGrade:()=>lastGrade, proj, draw:()=>draw(), stepOutfield, runSpeedOf, simNow:()=>simNow, cam:v=>{ camX=v; }, '
  + 'watchBall, setControlled, queueOneTouch, recvAuto:()=>recvAuto, stick:(x,y)=>{ window.__stick={x,y}; }, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}',
  '    if(padId!==null){const l=Math.hypot(pdx,pdy);if(l>10){ix=pdx/l;iy=pdy/l;}}\n    if(window.__stick&&(window.__stick.x||window.__stick.y)){ ix=window.__stick.x; iy=window.__stick.y; }');   // (a stick the test can hold)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-touch-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);

// THE REACH
const reach = await page.evaluate(() => { const T = window.__T, q = { stats: {} }, at = v => { q.stats.ballControl = v; return T.controlROf(q); };
  return { lo: at(1), mid: at(5.5), hi: at(10) }; });
ok(reach.lo === 18 && reach.hi === 32 && reach.mid === 25, 'the reach: ' + reach.lo + ' at Ball control 1, ' + reach.mid + ' at 5.5, ' + reach.hi + ' at 10 (was 25 to 45)');

// THE TOUCH, as the moment and the man make it: n touches each, graded PERFECT / CLEAN / LOOSE / HEAVY.
// u: how far up the pitch he is, going his side's way (0.25 = at the back, 0.8 = the final third); man: an opponent
// that far away (px; 25 = 1 m), or nobody near; he faces the ball as it comes (he'd have turned to it), or, back,
// faces away from it (he didn't get round in time)
const odds = (u, man, bc, cp, n = 800, back = false) => page.evaluate(({ u, man, bc, cp, n, back }) => {
  const T = window.__T, p = T.players().find(q => q !== T.controlled() && q.team === 'G'), atk = T.atkOf('G');
  for(const q of T.players()) if(q.team !== 'G'){ q.x = atk > 0 ? T.FW - 60 : 60; q.y = 80; q.vx = q.vy = 0; q.state = 'normal'; }
  p.x = atk > 0 ? T.FW * u : T.FW * (1 - u); p.y = T.YC + 200; p.vx = p.vy = 0;
  const o = T.players().find(q => q.team !== 'G');
  if(man) { o.x = p.x - atk * man; o.y = p.y; }
  const b = T.ball(); b.ownedBy = null; b.x = p.x - atk * 60; b.y = p.y; b.z = 0; b.vx = atk * 400; b.vy = 0;
  p.facing = { x: back ? atk : -atk, y: 0 };
  const keep = p.stats; p.stats = Object.assign({}, keep, { ballControl: bc, composure: cp });
  const c = { PERFECT: 0, CLEAN: 0, LOOSE: 0, HEAVY: 0 };
  for(let i = 0; i < n; i++){ const s = T.touchQuality(p, false); c[s > 0.8 ? 'PERFECT' : s > 0.55 ? 'CLEAN' : s > 0.3 ? 'LOOSE' : 'HEAVY']++; }
  const out = { pressure: +T.touchPressure(p).toFixed(2), third: +T.finalThirdOf(p).toFixed(2), perfect: c.PERFECT / n, clean: (c.PERFECT + c.CLEAN) / n, heavy: c.HEAVY / n };
  p.stats = keep; return out; }, { u, man, bc, cp, n, back });
const pc = v => Math.round(v * 100) + '%';
await page.evaluate(() => window.__T.freeze());
const backPoor = await odds(0.25, 0, 3, 3), backPoorPressed = await odds(0.25, 30, 3, 3), backGoodPressed = await odds(0.25, 30, 9, 9);
info('at the back: ' + JSON.stringify({ backPoor, backPoorPressed, backGoodPressed }));
ok(backPoor.pressure === 0 && backPoor.third === 0, 'the scene: at the back with nobody within 6 m (pressure ' + backPoor.pressure + ')');
ok(backPoor.clean >= 0.97 && backPoor.perfect >= 0.7 && backPoor.heavy === 0, 'a poor defender (Ball control 3, Composure 3) at the back with nobody near: clean or better ' + pc(backPoor.clean) + ', perfect ' + pc(backPoor.perfect));
ok(backPoorPressed.pressure === 1 && backPoorPressed.clean <= 0.6, '...with a man 1.2 m off him: clean or better only ' + pc(backPoorPressed.clean));
ok(backGoodPressed.clean >= 0.95, 'a good one (9, 9) with the same man on him: still clean or better ' + pc(backGoodPressed.clean));
const thirdPoor = await odds(0.8, 0, 3, 3), thirdGood = await odds(0.8, 0, 9, 9);
info('the final third, nobody near: ' + JSON.stringify({ thirdPoor, thirdGood }));
ok(thirdPoor.third === 1 && thirdPoor.pressure === 0, 'the scene: well into the final third, nobody near');
ok(thirdPoor.clean <= backPoor.clean - 0.12 && thirdGood.clean - thirdPoor.clean >= 0.12, 'in the final third it comes down to the man: poor ' + pc(thirdPoor.clean) + ' clean or better (' + pc(backPoor.clean) + ' at the back), good ' + pc(thirdGood.clean));
const cpLo = await odds(0.25, 30, 6, 2), cpHi = await odds(0.25, 30, 6, 9), cpLoBack = await odds(0.25, 0, 6, 2), cpHiBack = await odds(0.25, 0, 6, 9);
ok(cpHi.clean - cpLo.clean >= 0.2 && Math.abs(cpHiBack.clean - cpLoBack.clean) <= 0.05, 'Composure tells under pressure (2: ' + pc(cpLo.clean) + ', 9: ' + pc(cpHi.clean) + ' clean or better), not at the back with nobody near (' + pc(cpLoBack.clean) + ', ' + pc(cpHiBack.clean) + ')');
const bcLo = await odds(0.25, 30, 2, 6), bcHi = await odds(0.25, 30, 9, 6);
ok(bcHi.clean - bcLo.clean >= 0.2, 'so does Ball control (2: ' + pc(bcLo.clean) + ', 9: ' + pc(bcHi.clean) + ')');
// SQUARE TO IT: the same man, his back to the ball as it reaches him (he didn't turn to it in time), takes it worse
const backTurned = await odds(0.25, 0, 3, 3, 800, true);
ok(backTurned.perfect <= backPoor.perfect - 0.25 && backTurned.clean < backPoor.clean, 'his back to the ball as it gets to him, the same man takes it worse: perfect ' + pc(backTurned.perfect) + ' (square to it ' + pc(backPoor.perfect) + '), clean or better ' + pc(backTurned.clean));

// NO TIMING: a ball rolled to a man is taken as it arrives, nothing pressed. The spread off (First-touch spread 0), so
// each touch is the likely one: PERFECT at the back with nobody near (dead at his feet); with a man on him in the final
// third, a 1-rated man's is LOOSE (it comes off him and he has to go and get it).
const receive = (who, u, man, bc, cp) => page.evaluate(({ who, u, man, bc, cp }) => new Promise(res => {
  const T = window.__T, c = T.controlled(), atk = T.atkOf(c.team); T.freeze(); T.P.aiTouch.val = 0;
  const p = who === 'you' ? c : T.players().find(q => q !== c && q.team === c.team);
  for(const q of T.players()) if(q !== p){ q.x = atk > 0 ? 80 : T.FW - 80; q.y = q.team === c.team ? 90 : T.FH - 90; q.vx = q.vy = 0; q.state = 'normal'; }
  p.x = atk > 0 ? T.FW * u : T.FW * (1 - u); p.y = T.YC - 150; p.vx = p.vy = 0; p.noTouchT = 0; p.state = 'normal';
  const keep = p.stats; p.stats = Object.assign({}, keep, { ballControl: bc, composure: cp });
  const o = T.players().find(q => q.team !== c.team), ox = p.x + atk * man, oy = p.y;
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.lastTouch = c.team; b.x = p.x - atk * 150; b.y = p.y; b.z = 0; b.vz = 0; b.vx = atk * 380; b.vy = 0;
  const g0 = T.lastGrade(), t0 = performance.now();
  (function tick(){
    if(man){ o.x = ox; o.y = oy; o.vx = o.vy = 0; }                       // the man on him stays put
    p.vx = p.vy = 0;
    const done = b.ownedBy === p || (b.dribbler === p && !b.ownedBy);
    if(done || performance.now() - t0 > 2500){
      const out = { owned: b.ownedBy === p, off: !b.ownedBy && b.dribbler === p, sp: Math.round(Math.hypot(b.vx, b.vy)), grade: T.lastGrade(), changed: T.lastGrade() !== g0, pressure: +T.touchPressure(p).toFixed(2) };
      p.stats = keep; T.P.aiTouch.val = 1; return res(out); }
    requestAnimationFrame(tick);
  })(); }), { who, u, man, bc, cp });
const youEasy = await receive('you', 0.3, 0, 5, 5);
ok(youEasy.owned && youEasy.grade === 'PERFECT', 'you, at the back with nobody near, nothing pressed: taken dead at your feet (' + youEasy.grade + ')');
const youHard = await receive('you', 0.8, 30, 1, 1);
ok(youHard.off && youHard.sp > 20 && youHard.grade === 'LOOSE', 'you, a 1-rated man in the final third with a man on you: a ' + youHard.grade + ' touch, off you at ' + youHard.sp + ' px/s');
const aiEasy = await receive('mate', 0.3, 0, 5, 5);
ok(aiEasy.owned, 'a computer team-mate the same, no press to time: taken at his feet');
const aiHard = await receive('mate', 0.8, 30, 1, 1);
ok(aiHard.off && aiHard.sp > 20, '...and pressed in the final third with poor stats, off him at ' + aiHard.sp + ' px/s');

// WATCHING THE BALL: a man the ball's coming to turns his body to it as it comes -- as quick as he reads it, his Off IQ
// -- and gets to it however he must: off his front he's slower, side-on slower still backing off, and he can't sprint. A
// runner played in behind runs onto a ball out in front of him flat out; one that comes to him from behind, he has to
// check and turn to. One man, stepped by hand, the ball his.
const watch = await page.evaluate(() => {
  const T = window.__T, c = T.controlled(), p = T.players().find(q => q !== c && q.team === c.team), atk = T.atkOf(p.team), dt = 1 / 60, keep = p.stats;
  T.freeze(); for(const q of T.players()) if(q !== p){ q.x = 60; q.y = 60; q.vx = q.vy = 0; }
  const scene = (iq, bx, bv) => { p.stats = Object.assign({}, keep, { offIQ: iq, speed: 5.5 }); p.state = 'normal'; p.stamina = 1; p.staminaCap = 1; p.sprint = false; p.sprintMoT = 0;
    p.x = T.FW / 2; p.y = T.YC; p.vx = p.vy = 0; p.goingForBall = p.intercepting = false;
    const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = p.x + bx; b.y = p.y; b.z = b.vz = 0; b.vx = bv; b.vy = 0;
    b.lastTouch = p.team; b.intendedRcv = p; b.rcvRunner = false; b.thru = null; return b; };
  const out = { turn: {} };
  for(const iq of [1, 10]){ const b = scene(iq, -atk * 200, 0); p.facing = { x: atk, y: 0 }; let t = 0;   // his back to it
    for(; t < 3; t += dt){ T.stepOutfield(p, 0, 0, dt); b.x = p.x - atk * 200; b.y = p.y; if(-p.facing.x * atk > 0.95) break; }
    out.turn[iq] = +t.toFixed(2); }
  const run = T.runSpeedOf(p);   // the ball 70 px in front of him; pushed each way, asking to sprint: his top speed, as a share of his run
  for(const [k, ix, iy] of [['fwd', 1, 0], ['side', 0, 1], ['back', -1, 0]]){ const b = scene(5.5, atk * 70, 0); p.facing = { x: atk, y: 0 }; let v = 0, face = 1;
    for(let t = 0; t < 2; t += dt){ p.sprint = true; T.stepOutfield(p, ix * atk, iy, dt); b.x = p.x + atk * 70; b.y = p.y;
      if(t > 1.2){ v = Math.max(v, Math.hypot(p.vx, p.vy)); face = Math.min(face, p.facing.x * atk); } }
    out[k] = { share: +(v / run).toFixed(2), face: +face.toFixed(2) }; }
  { const b = scene(5.5, atk * 120, atk * 140); b.thru = { until: T.simNow() + 5 }; p.facing = { x: atk, y: 0 }; let v = 0;   // a through ball out in front of him
    for(let t = 0; t < 0.8; t += dt){ p.sprint = true; T.stepOutfield(p, atk, 0, dt); b.x += b.vx * dt; v = Math.max(v, Math.hypot(p.vx, p.vy)); }
    out.runner = { share: +(v / run).toFixed(2), face: +(p.facing.x * atk).toFixed(2) }; }
  { const b = scene(5.5, -atk * 260, atk * 380); b.thru = { until: T.simNow() + 5 }; p.facing = { x: atk, y: 0 }; let v = 0, face = 1;   // ...and one that comes to him from behind
    for(let t = 0; t < 0.9; t += dt){ p.sprint = true; T.stepOutfield(p, atk, 0, dt); b.x += b.vx * dt; if(t > 0.6){ v = Math.max(v, Math.hypot(p.vx, p.vy)); face = Math.min(face, p.facing.x * atk); } }
    out.behind = { share: +(v / run).toFixed(2), face: +face.toFixed(2), watching: !!p.watching }; }
  { const b = scene(5.5, atk * 250, -atk * 400), o = T.players().find(q => q.team !== p.team); b.lastTouch = o.team; b.intendedRcv = o;   // their pass, across him
    p.facing = { x: 0, y: 1 }; let v = 0, w = 0;
    for(let t = 0; t < 0.5; t += dt){ p.sprint = true; p.intercepting = true; T.stepOutfield(p, 0, 1, dt); b.x -= atk * 400 * dt; v = Math.max(v, Math.hypot(p.vx, p.vy)); w += p.watching ? 1 : 0; }
    p.intercepting = false; out.cut = { share: +(v / run).toFixed(2), watching: w }; }
  { const b = scene(5.5, -atk * 200, 0); b.intendedRcv = null; b.ownedBy = c; c.x = b.x - atk * 20; c.y = b.y;   // you on it, him 8 m off with his back to you
    p.facing = { x: atk, y: 0 }; out.expects = T.watchBall(p, 0, 0);
    for(let t = 0; t < 1; t += dt) T.stepOutfield(p, 0, 0, dt);
    out.expectsFace = +(-p.facing.x * atk).toFixed(2);
    const o = T.players().find(q => q.team !== p.team); b.ownedBy = o; out.theirs = T.watchBall(p, 0, 0);   // (one of theirs on it: no)
    b.ownedBy = null; }
  p.stats = keep; return out; });
info('watching the ball: ' + JSON.stringify(watch));
ok(watch.turn[1] > 0.6 && watch.turn[1] < 1.1 && watch.turn[10] < 0.4 && watch.turn[1] > 2.4 * watch.turn[10], 'his back to a ball that\'s his, he turns to it as quick as he reads it: in ' + watch.turn[1] + ' s at Off IQ 1, ' + watch.turn[10] + ' s at 10');
ok(watch.fwd.share > 1.25 && watch.fwd.face > 0.95, 'facing it, he can go at it flat out (' + watch.fwd.share + 'x his run)');
ok(watch.side.share > 0.6 && watch.side.share < 0.85 && watch.side.face > 0.95, 'side-on to it he shuffles across, still facing it, at ' + pc(watch.side.share) + ' of his run (no sprint)');
ok(watch.back.share > 0.4 && watch.back.share < watch.side.share - 0.08 && watch.back.face > 0.95, 'backing off, facing it, slower still: ' + pc(watch.back.share));
ok(watch.runner.share > 1.25 && watch.runner.face > 0.95, 'a runner played in behind runs onto a ball out in front of him flat out (' + watch.runner.share + 'x his run)');
ok(watch.behind.watching && watch.behind.share < 1 && watch.behind.face < 0.2, 'one that comes to him from behind, he checks and turns to it (' + pc(watch.behind.share) + ' of his run, facing ' + watch.behind.face + ' his way)');
ok(watch.cut.share > 1.25 && !watch.cut.watching, 'darting across to cut out their pass, he goes flat out for the spot (' + watch.cut.share + 'x his run)');
ok(watch.expects && watch.expectsFace > 0.95 && !watch.theirs, 'you on the ball, a team-mate 8 m away looking to get it turns to face it before it\'s played (facing ' + watch.expectsFace + ' its way); one of theirs on it, he doesn\'t');
// ...and in the match: a pass rolled to a computer team-mate with his back to it. Quick to read it (Off IQ 9), he's round
// to it by the time it gets to him and takes it; slow (Off IQ 1), he isn't round yet (side-on, a harder touch)
const squareUp = iq => page.evaluate(iq => new Promise(res => {
  const T = window.__T, c = T.controlled(), atk = T.atkOf(c.team); T.freeze();
  const p = T.players().find(q => q !== c && q.team === c.team), keep = p.stats;
  for(const q of T.players()) if(q !== p){ q.x = atk > 0 ? 80 : T.FW - 80; q.y = q.team === c.team ? 90 : T.FH - 90; q.vx = q.vy = 0; q.state = 'normal'; }
  p.stats = Object.assign({}, keep, { offIQ: iq }); p.x = T.FW / 2; p.y = T.YC - 150; p.vx = p.vy = 0; p.noTouchT = 0; p.state = 'normal'; p.facing = { x: atk, y: 0 };
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.lastTouch = c.team; b.intendedRcv = p; b.rcvRunner = false; b.thru = null;
  b.x = p.x - atk * 240; b.y = p.y; b.z = 0; b.vz = 0; b.vx = atk * 430; b.vy = 0;
  let cos = -1, near = false; const t0 = performance.now();
  (function tick(){
    const got = b.ownedBy === p || b.dribbler === p, lost = b.intendedRcv !== p && !got;
    if(got || lost || performance.now() - t0 > 2500){ p.stats = keep; return res({ cos: +cos.toFixed(2), got }); }
    const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy); if(d > 1 && !near) cos = (p.facing.x * dx + p.facing.y * dy) / d;
    near = near || d < 34;
    requestAnimationFrame(tick);
  })(); }), iq);
const quick = await squareUp(9), slow = await squareUp(1);
ok(quick.cos > 0.9 && quick.got && slow.cos < quick.cos - 0.3, 'a pass to a team-mate with his back to it: at Off IQ 9 he\'s square to it as it gets to him (' + quick.cos + ') and takes it; at 1 he isn\'t round yet (' + slow.cos + ')');

// HIS BACK TO IT: you running away from a ball rolled after you, too quick on you to turn to it -- it hits you and comes
// off you, or (22 px wide of you) it goes past you; with time to turn (Off IQ 10, the ball further off) you get round
// and take it
const backTo = (off, turnIn) => page.evaluate(({ off, turnIn }) => new Promise(res => {
  const T = window.__T, atk = T.atkOf('G'), m = T.players().find(q => q.team === 'G'); T.setControlled(m); T.freeze();
  for(const q of T.players()) if(q !== m){ q.x = T.FW / 2 + 600; q.y = 40; q.vx = q.vy = 0; }
  const keep = m.stats; m.stats = Object.assign({}, keep, { offIQ: turnIn ? 10 : 5.5 });
  m.x = T.FW / 2; m.y = T.YC; m.vx = atk * 60; m.vy = 0; m.state = 'normal'; m.noTouchT = 0; m.facing = { x: atk, y: 0 }; m.reactUntil = turnIn ? 0 : T.simNow() + 5;
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = m.x - atk * (turnIn ? 380 : 90); b.y = m.y + off; b.z = 0; b.vz = 0; b.vx = atk * 800; b.vy = 0; b.lastTouch = 'G'; b.intendedRcv = m; b.shotT = 0;
  T.stick(turnIn ? 0 : atk * 0.4, 0); const t0 = performance.now();
  (function tick(){
    const got = b.ownedBy === m || b.dribbler === m, off_ = b.intendedRcv !== m, past = (b.x - m.x) * atk > 30;
    if(got || off_ || past || performance.now() - t0 > 2500){ T.stick(0, 0); m.reactUntil = 0; m.stats = keep;
      return res({ got, cameOff: off_ && !got && !past && b.lastTouch === 'G', past, behind: Math.round((b.x - m.x) * atk) }); }
    requestAnimationFrame(tick);
  })(); }), { off, turnIn });
const hit = await backTo(0, false), wide = await backTo(22, false), turned = await backTo(0, true);
info('his back to it: ' + JSON.stringify({ hit, wide, turned }));
ok(!hit.got && hit.cameOff, 'his back to it, it hits him and comes off him (not his)');
ok(!wide.got && wide.past, '...22 px wide of him, it goes past him');
ok(turned.got, 'with time to turn (Off IQ 10), he gets round to it and takes it');
// A FIRST-TIME PASS INTO SPACE: nobody near enough the way it's aimed, so it's a short ball into space -- and you're put
// on whoever's best placed for it, who takes a beat (Off IQ) to see it's his, then goes to meet it; the stick you aimed
// it with, still held that way, isn't his
const ot = await page.evaluate(() => new Promise(res => {
  const T = window.__T, atk = T.atkOf('G'), mates = T.players().filter(q => q.team === 'G'), c = mates[0], m = mates[1]; T.setControlled(c); T.freeze();
  for(const q of T.players()) if(q !== c && q !== m){ q.x = T.FW / 2 - atk * 700; q.y = 40; q.vx = q.vy = 0; }
  c.x = T.FW / 2; c.y = T.YC; c.vx = c.vy = 0; c.facing = { x: -atk, y: 0 }; c.noTouchT = 0; c.state = 'normal';
  m.x = c.x + atk * 600; m.y = T.YC + 150; m.vx = m.vy = 0; m.state = 'normal';   // (24 m off: too far to play first time to him)
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = c.x + atk * 160; b.y = c.y; b.z = 0; b.vz = 0; b.vx = -atk * 350; b.vy = 0; b.lastTouch = 'G'; b.intendedRcv = c; b.shotT = 0;
  T.stick(atk, 0.25); T.queueOneTouch();
  const t0 = performance.now(); let at = null, p0 = null, r = null;
  (function tick(){
    if(!at && T.controlled() !== c){ at = T.simNow(); p0 = { x: m.x, y: m.y }; r = { switched: T.controlled() === m, wait: +((T.recvAuto() && T.recvAuto().wait || 0) - at).toFixed(2), held: !!(T.recvAuto() && T.recvAuto().hold) }; }
    if(at && r.inWait === undefined && T.simNow() > at + 0.08) r.inWait = Math.round(Math.hypot(m.x - p0.x, m.y - p0.y));
    if(at && T.simNow() > at + 0.9){ r.after = Math.round(Math.hypot(m.x - p0.x, m.y - p0.y)); T.stick(0, 0); return res(r); }
    if(performance.now() - t0 > 4000){ T.stick(0, 0); return res(r || { switched: false }); }
    requestAnimationFrame(tick);
  })(); }));
info('a first-time ball into space: ' + JSON.stringify(ot));
ok(ot.switched && ot.wait >= 0.14 && ot.wait <= 0.36 && ot.held, 'a first-time pass into space puts you on the man best placed for it (he takes ' + ot.wait + ' s to see it\'s his)');
ok(ot.inWait <= 8 && ot.after >= 60, '...he waits that beat, then goes to meet it (' + ot.inWait + ' px, then ' + ot.after + ' px), the stick you aimed it with left out of it');

// ON THE PITCH: the man you control has one solid green ring at his reach; the ball is drawn in whole pixels
const look = await page.evaluate(() => {
  const T = window.__T, c = T.controlled(), atk = T.atkOf(c.team), cv = document.querySelector('canvas'), g = cv.getContext('2d'); T.freeze();
  for(const q of T.players()) if(q !== c){ q.x = atk > 0 ? 80 : T.FW - 80; q.y = 90; }
  c.x = T.FW / 2; c.y = T.YC + 250; c.vx = c.vy = 0;
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = c.x + atk * 160; b.y = c.y - 160; b.vx = b.vy = 0; b.z = 0; b.vz = 0;
  const hex = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
  T.cam(c.x); T.draw();   // (the camera on him, wherever the last scene left it)
  const R = T.controlROf(c), ring = [];
  // (the ring is snapped to the pitch's 2 px pixels: look within a pixel or two of where each point of it falls)
  const near = (x, y) => { const d = g.getImageData(Math.round(x) - 3, Math.round(y) - 3, 7, 7).data; for(let i = 0; i < d.length; i += 4) if(d[i] === 0x9d && d[i + 1] === 0xff && d[i + 2] === 0x3c) return '#9dff3c'; return hex(Math.round(x), Math.round(y)); };
  for(const a of [0, 0.5, 1.2, 1.9, 2.6, Math.PI]){ const s = T.proj(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R); ring.push(near(s.x, s.y)); }
  const s = T.proj(b.x, b.y, 0), box = g.getImageData(Math.round(s.x) - 12, Math.round(s.y) - 22, 24, 26).data, cols = new Set();
  for(let i = 0; i < box.length; i += 4) cols.add('#' + [box[i], box[i + 1], box[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''));
  SPRITE.disable(); T.draw();
  const box2 = g.getImageData(Math.round(s.x) - 12, Math.round(s.y) - 12, 24, 24).data, cols2 = new Set();
  for(let i = 0; i < box2.length; i += 4) cols2.add('#' + [box2[i], box2[i + 1], box2[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''));
  SPRITE.enable();
  return { ring, pixel: ['#1c1c28', '#f8f8f4', '#2c2c3c'].filter(k => cols.has(k)), plain: cols2.has('#f4f7ee') };
});
info(JSON.stringify(look));
ok(look.ring.every(h => h === '#9dff3c'), 'one solid green ring at his reach, all the way round its near side (' + look.ring.join(' ') + ')');
ok(look.pixel.length === 3, 'the ball in whole pixels: its outline, white and patches (' + look.pixel.join(' ') + ')');
ok(look.plain, 'with the sprites off, the plain round ball is back');

process.exitCode = rep.finish();
await browser.close();

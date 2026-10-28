// FOOTBALL CLASSIC, CURVE: one stat, Curve, for shots (as before), crosses and passes. A cross swings -- an outswinger
// facing the byline, an inswinger facing back toward his own goal -- by more the higher his Curve, aimed so it still
// comes down on the spot (on time, at head height); everyone reading it reads its swing. A curling cross is harder to
// head clear (a weaker, wilder clearance, and less of a chance in a duel) and to claim (a little less reach for the
// keeper). A through ball to a man running across its line bends a little into his path (no more than 10 degrees: it
// was a banana); one with a man of theirs on its line bends a little away from him, not round him; one to a man running
// along its line goes straight. A long ball over the top to a man running across bends a little into his path too. And
// a shot's curl is worked out as before.
// On a copy of the game that lets the test set the scene and reach the cross, the passes and the reading of the ball.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, P, FW, FH, YC, atkOf, simNow:()=>simNow, STAT_LABEL, '
  + 'aiCross, ballAt, crossCurlQ, headClear, obThruBall, obLobBall, curlSwing, crossClaim, reachOf, keeperSpdOf, CB:()=>CROSS_BEND, PB:()=>PASS_BEND, CH:()=>GK_CLAIM_H, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('  function checkOffsideTouch(t){\n', '  function checkOffsideTouch(t){\n    if(window.__noOffside) return false;\n');   // (the scenes' runners are beyond everyone)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-curve-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);
await page.evaluate(() => { window.__noOffside = true; });

const lab = await page.evaluate(() => ({ stat: window.__T.STAT_LABEL.curve, dial: window.__T.P.curve.label }));
ok(lab.stat === 'Curve' && /^Curve /.test(lab.dial), 'the stat is just Curve (' + lab.stat + '; ' + lab.dial + ')');

// A CROSS from the right of their box, 5 m in from the byline, to a spot by the far post 25 m away; everyone else out of
// the way. Facing the byline, facing back, side-on; Curve 1 and 10; Crossing 10. How far it bows off the line to the
// spot (+: toward the goal line), where and when it comes down past it, and how well the flight was read from 0.1 s in.
const cross = (face, cv) => page.evaluate(({ face, cv }) => new Promise(res => {
  const T = window.__T, p = T.players().find(q => q.team === 'R' && q.role !== 'G'); T.freeze();
  const atk = T.atkOf('R'), gx = atk > 0 ? T.FW : 0, keep = p.stats;
  p.stats = Object.assign({}, keep, { curve: cv, crossing: 10 });
  const park = () => { for(const q of T.players()) if(q !== p){ q.x = T.FW / 2 + (q.team === 'R' ? -200 : 200); q.y = 40; q.vx = q.vy = 0; } for(const k of T.keepers()){ k.x = k.homeX; k.y = 30; } };
  const put = () => { p.x = gx - atk * 120; p.y = T.YC + 520; p.vx = p.vy = 0; };
  park(); put(); p.facing = face === 'byline' ? { x: atk, y: 0 } : face === 'back' ? { x: -atk, y: 0 } : { x: 0, y: -1 };
  const spot = { x: gx - atk * 170, y: T.YC - 110 }, b = T.ball();
  b.ownedBy = null; b.dribbler = null; b.x = p.x; b.y = p.y; b.z = 0; b.vx = b.vy = b.vz = 0;
  T.aiCross(p, { x: spot.x, y: spot.y, who: null });
  const x0 = b.x, y0 = b.y, d = Math.hypot(spot.x - x0, spot.y - y0), cx = (spot.x - x0) / d, cy = (spot.y - y0) / d, q = T.crossCurlQ(), t0 = T.simNow();
  let bow = 0, at = null, pred = null, err = 0;
  (function tick(){
    park(); put();
    const t = T.simNow() - t0, s = (b.x - x0) * cx + (b.y - y0) * cy, off = (b.y - y0) * cx - (b.x - x0) * cy;
    if(!at && Math.abs(off) > Math.abs(bow)) bow = off;
    if(!pred && t >= 0.1) pred = { t: t + 0.7, p: T.ballAt(0.7) };
    if(pred && !pred.done && t >= pred.t - 1e-6){ pred.done = true; err = Math.hypot(pred.p.x - b.x, pred.p.y - b.y); }
    if(!at && s >= d - 2) at = { t, miss: Math.hypot(b.x - spot.x, b.y - spot.y), z: b.z };
    if((at && pred && pred.done) || t > 2.5){ p.stats = keep; b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = b.vz = 0; b.z = 0;
      return res({ face, cv, q, toGoal: Math.round(bow * -cy * atk) , bow: Math.abs(bow), at, err }); }   // (bowing toward the goal line: an outswinger)
    requestAnimationFrame(tick); })(); }), { face, cv });
const X = {};
for(const face of ['byline', 'back', 'side']) for(const cv of [1, 10]) X[face + cv] = await cross(face, cv);
info('crosses: ' + Object.values(X).map(r => `${r.face} Curve ${r.cv}: bows ${Math.round(r.bow)} px ${r.toGoal > 0 ? 'toward goal (out)' : 'away from goal (in)'}, down ${r.at ? Math.round(r.at.miss) + ' px off the spot at ' + r.at.t.toFixed(2) + ' s, ' + Math.round(r.at.z) + ' px up' : 'never'}; read ${Math.round(r.err)} px out`).join('; '));
ok(X.byline10.toGoal > 0 && X.byline10.bow > 35, 'facing the byline it\'s an outswinger: it bows out toward the goal line and bends away from it (' + Math.round(X.byline10.bow) + ' px)');
ok(X.back10.toGoal < 0 && X.back10.bow > 35, 'facing back toward his own goal, an inswinger (' + Math.round(X.back10.bow) + ' px)');
ok(X.byline1.bow < 15 && X.back1.bow < 15, 'Curve 1 barely bends it (' + Math.round(X.byline1.bow) + ', ' + Math.round(X.back1.bow) + ' px)');
ok(Object.values(X).every(r => r.at && r.at.miss < 18 && r.at.t < 1.25 && r.at.z > 25), 'every one still comes down on the spot (within 0.7 m), on time and at head height');
ok(Object.values(X).every(r => r.err < 12), 'its flight is read as it swings (within 12 px, 0.7 s ahead)');
ok(X.byline10.q > 0.99 && X.byline1.q < 0.15, 'a Curve 10 cross counts as curling all the way (' + X.byline10.q.toFixed(2) + '), a Curve 1 one hardly (' + X.byline1.q.toFixed(2) + ')');

// HARDER TO CLEAR: the same header clearance off a cross curling all the way and off a straight one (the same dice)
const clr = await page.evaluate(() => { const T = window.__T, p = T.players().find(q => q.team === 'G' && q.role !== 'G'), b = T.ball(), out = {}, R = Math.random; T.freeze();
  try { for(const k of [0, 1]){ Math.random = () => 0.9; p.x = 300; p.y = T.YC; b.ownedBy = null; b.x = 300; b.y = T.YC; b.z = 60; b.vx = 300; b.vy = 0; b.vz = 0;
    b.crossT = 1; b.crossCurl = k * T.CB()[1]; T.headClear(p); out[k] = Math.hypot(b.vx, b.vy); } } finally { Math.random = R; }
  b.vx = b.vy = 0; b.z = 0; return out; });
info('a headed clearance: ' + Math.round(clr[0]) + ' px/s off a straight cross, ' + Math.round(clr[1]) + ' off a curling one');
ok(Math.abs(clr[1] / clr[0] - 0.8) < 0.01, 'off a curling cross a headed clearance goes a fifth less far');

// HARDER TO CLAIM: a cross dropping past the keeper (from just under where he can claim it, nearly still) as far off as
// he can just get to before it lands -- he comes for it straight, and not if it's curling all the way
const cl = await page.evaluate(() => { const T = window.__T, kp = T.keepers()[0], b = T.ball(), out = {}; T.freeze();
  const glX = kp.side < 0 ? 0 : T.FW, z0 = T.CH() - 4, tEnd = Math.sqrt(z0 / 260), reach = T.reachOf(kp) + b.r, v = T.keeperSpdOf(kp) * 1.25;
  const L = reach + v * (tEnd - 0.12 - 0.05);                                   // (he'd be there with 0.05 s to spare)
  for(const k of [0, 1]){ kp.x = glX - kp.side * 30; kp.y = T.YC; b.ownedBy = null; b.x = kp.x; b.y = kp.y + L; b.z = z0; b.vx = 1; b.vy = 0; b.vz = 0;
    b.crossT = 1; b.crossBy = kp.team === 'G' ? 'R' : 'G'; b.crossCurl = k * T.CB()[1]; b.curveSpinT = 0; out[k] = !!T.crossClaim(kp); }
  b.crossT = 0; b.crossBy = null; b.z = 0; b.x = T.FW / 2; b.y = T.YC; return out; });
info('a cross he can just get to: ' + (cl[0] ? 'claimed' : 'left') + ' straight, ' + (cl[1] ? 'claimed' : 'left') + ' curling');
ok(cl[0] && !cl[1], 'a curling cross is a little harder for the keeper to claim: one he\'d just get to straight, he can\'t');

// THROUGH BALLS: the computer's, 11 m into the path of a runner, struck true. He runs across its line at 60°, or
// along it; or along it with one of theirs sat 0.6 m off its line half-way (not touching it). Curve 1 and 10. Where it
// gets to, which way it's going as it gets there (+: turned toward his run), and how near the man in the way it passes.
const thru = (cv, run, lane, lob) => page.evaluate(({ cv, run, lane, lob }) => new Promise(res => {
  const T = window.__T, R = T.players().filter(q => q.team === 'R' && q.role !== 'G'), G = T.players().filter(q => q.team === 'G' && q.role !== 'G'); T.freeze();
  const p = R[0], q = R[1], o = G[1], atk = T.atkOf('R'), keep = p.stats;
  p.stats = Object.assign({}, keep, { curve: cv, passAcc: 10, offIQ: 10 });
  const D = lob ? 800 : 280, ang = run === 'across' ? 60 / 57.3 : 0, rv = 170, b = T.ball();
  const park = () => { for(const x of T.players()) if(x !== p && x !== q && x !== o){ x.x = T.FW / 2; x.y = 40; x.vx = x.vy = 0; } for(const k of T.keepers()) k.y = 30; };
  park(); p.x = T.FW / 2 - atk * 300; p.y = T.YC; p.vx = p.vy = 0; p.facing = { x: atk, y: 0 };
  b.ownedBy = null; b.dribbler = null; b.x = p.x + atk * 20; b.y = p.y; b.z = 0; b.vx = b.vy = b.vz = 0;
  const x0 = b.x, y0 = b.y, tx = x0 + atk * D, ty = T.YC, cx = atk, cy = 0, rvx = atk * Math.cos(ang) * rv, rvy = -Math.sin(ang) * rv;
  const oAt = () => { o.x = lane ? x0 + atk * D * 0.5 : T.FW / 2; o.y = lane ? T.YC + 16 : 80; o.vx = o.vy = 0; o.state = 'normal'; o.noTouchT = 99; };   // (the man in the way doesn't touch it: how far round him it goes)
  oAt(); q.vx = rvx; q.vy = rvy; q.x = tx - rvx * 3; q.y = ty - rvy * 3;    // (far back on his run: he's not there before it)
  { const R = Math.random; Math.random = () => 0.5; try { if(lob) T.obLobBall(p, q, tx, ty); else T.obThruBall(p, q, tx, ty, 0.9); } finally { Math.random = R; } }   // (struck true: no error in its weight or line)
  const spin = b.curveSpinT > 0, t0 = T.simNow(); let near = 1e9, at = null, hd = 0;
  (function tick(){
    park(); oAt(); q.x = tx - rvx * 3; q.y = ty - rvy * 3; q.vx = rvx; q.vy = rvy;
    const t = T.simNow() - t0, s = (b.x - x0) * cx + (b.y - y0) * cy;
    if(!b.ownedBy) hd = Math.atan2(cx * b.vy - cy * b.vx, cx * b.vx + cy * b.vy) * 57.3 * (Math.sign(rvy * atk) || 1);
    if(lane && b.z < 30) near = Math.min(near, Math.hypot(b.x - o.x, b.y - o.y));
    if(!at && (lob ? t > 0.3 && b.z <= 0.5 : s >= D - 3)) at = { t, miss: Math.hypot(b.x - tx, b.y - ty), hd };
    if(at || b.ownedBy || t > 3){ p.stats = keep; const r = { cv, run, lane, lob, spin, at, cutOut: b.ownedBy === o, near };
      b.ownedBy = null; b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = b.vz = 0; b.z = 0; b.curveSpinT = 0; return res(r); }
    requestAnimationFrame(tick); })(); }), { cv, run, lane, lob });
const P = {};
for(const cv of [1, 10]){ P['x' + cv] = await thru(cv, 'across', false, false); P['a' + cv] = await thru(cv, 'along', false, false);
  P['l' + cv] = await thru(cv, 'along', true, false); P['o' + cv] = await thru(cv, 'across', false, true); }
info('through balls: ' + Object.entries(P).map(([k, r]) => `${r.lob ? 'over the top' : 'along the grass'}, ${r.lane ? 'a man on its line' : 'run ' + r.run}, Curve ${r.cv}: ${r.spin ? 'bent' : 'straight'}, ${r.at ? 'got there ' + Math.round(r.at.miss) + ' px off, turned ' + Math.round(r.at.hd) + '° his way' : r.cutOut ? 'cut out' : 'never got there'}${r.lane ? ', ' + Math.round(r.near) + ' px off the man' : ''}`).join('; '));
ok(P.x10.spin && P.x10.at && P.x10.at.hd >= 5 && P.x10.at.hd <= 10 && P.x10.at.miss < 15, 'a through ball to a man running across its line bends a little into his path at Curve 10, no banana (gets there turned ' + (P.x10.at ? Math.round(P.x10.at.hd) : '-') + '° his way; it was 17°)');
ok(P.x1.at && Math.abs(P.x1.at.hd) <= 3, '...hardly at all at Curve 1 (' + (P.x1.at ? Math.round(P.x1.at.hd) : '-') + '°)');
ok(!P.a1.spin && !P.a10.spin && P.a10.at && P.a10.at.miss < 12, 'to a man running along its line it goes straight');
ok(P.l10.spin && P.l10.at && P.l10.at.miss < 10 && P.l10.near > P.l1.near && P.l10.near - P.l1.near < 8, 'with one of theirs on its line it bends a little away from him, not round him: Curve 10 takes it ' + Math.round(P.l10.near - P.l1.near) + ' px further off him than Curve 1 (' + Math.round(P.l10.near) + ' against ' + Math.round(P.l1.near) + '), still to the spot');
ok(P.o10.spin && P.o10.at && P.o10.at.hd >= 5 && P.o10.at.hd <= 10 && P.o10.at.miss < 45, 'a long ball over the top to a man running across bends a little into his path and comes down by the spot (' + (P.o10.at ? Math.round(P.o10.at.miss) + ' px off, turned ' + Math.round(P.o10.at.hd) + '°' : '-') + ')');

// A SHOT'S CURL is worked out as before
const sw = await page.evaluate(() => { const T = window.__T, P = T.P;
  function old(sp,vz,range,force,spinT,side){ let x=0,y=0,z=0,h=0,t=0; const dt=1/120;
    const frShot=Math.pow(1-P.friction.val*0.3,dt*3.2), fr=Math.pow(1-P.friction.val,dt*3.2);
    while(t<3 && x*x+y*y<range*range && sp>40){ if(t<spinT) h-=side*force*dt/sp; if(z>0||vz!==0){ vz-=520*dt; z+=vz*dt; if(z<=0){ z=0; vz=vz<-40?-vz*0.45:0; } }
      x+=Math.cos(h)*sp*dt; y+=Math.sin(h)*sp*dt; if(z<12) sp*=(t<1.1?frShot:fr); t+=dt; } return Math.atan2(y,x); }
  return [[800, 120, 600, 300, 1.1, 1], [650, 60, 900, 500, 0.9, -1], [900, 260, 400, 150, 1.1, 1]].map(a => Math.abs(T.curlSwing(...a) - old(...a))); });
ok(sw.every(e => e < 1e-12), 'a shot\'s curl is worked out as before');

process.exitCode = rep.finish();
await browser.close();

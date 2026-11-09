// FOOTBALL CLASSIC, CURVE: one stat, Curve, for shots (as before), crosses and passes. A cross swings -- an outswinger
// facing the byline, an inswinger facing back toward his own goal -- by more the higher his Curve, aimed so it still
// comes down on the spot (on time, at head height); everyone reading it reads its swing. A curling cross is harder to
// head clear (a weaker, wilder clearance, and less of a chance in a duel) and to claim (a little less reach for the
// keeper). A through ball (v167, v168, v169) is hooked in late as it was drawn, as much as it needs and as much as his
// Curve and its length allow: with nobody of theirs near it goes straight, however the man it's for is running; with a
// man of theirs on its line it bulges away from him and still gets to the spot; with one off to the side short of the
// spot, 2 m off its line, it bulges away from him and bends round onto the spot (v169: from the start, the more as it
// slows -- it hooked in late), coming in turned toward his side -- by then 36 degrees of turn on it at Curve 10 (a 16 m
// ball), none at 1. Curve 1 bends nothing (v169) -- but a cross: that bends by tenths, a tenth of Curve 10's at 1 (v180).
// And a shot's curl is worked out as before.
// On a copy of the game that lets the test set the scene and reach the cross, the passes and the reading of the ball.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, P, FW, FH, YC, MK, atkOf, simNow:()=>simNow, STAT_LABEL, '
  + 'aiCross, ballAt, crossCurlQ, headClear, obThruBall, curlSwing, crossClaim, reachOf, keeperSpdOf, CB:()=>CROSS_BEND, PB:()=>PASS_BEND, CH:()=>GK_CLAIM_H, GR:()=>[GK_RUN,GK_GRAB], '
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
  T.aiCross(p, { x: spot.x, y: spot.y, who: null }); const spin = b.curveSpin !== 0 && b.curveSpinT > 0;
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
      return res({ face, cv, q, spin, toGoal: Math.round(bow * -cy * atk) , bow: Math.abs(bow), at, err }); }   // (bowing toward the goal line: an outswinger)
    requestAnimationFrame(tick); })(); }), { face, cv });
const X = {};
for(const face of ['byline', 'back', 'side']) for(const cv of [1, 10]) X[face + cv] = await cross(face, cv);
info('crosses: ' + Object.values(X).map(r => `${r.face} Curve ${r.cv}: bows ${Math.round(r.bow)} px ${r.toGoal > 0 ? 'toward goal (out)' : 'away from goal (in)'}, down ${r.at ? Math.round(r.at.miss) + ' px off the spot at ' + r.at.t.toFixed(2) + ' s, ' + Math.round(r.at.z) + ' px up' : 'never'}; read ${Math.round(r.err)} px out`).join('; '));
ok(X.byline10.toGoal > 0 && X.byline10.bow > 35, 'facing the byline it\'s an outswinger: it bows out toward the goal line and bends away from it (' + Math.round(X.byline10.bow) + ' px)');
ok(X.back10.toGoal < 0 && X.back10.bow > 35, 'facing back toward his own goal, an inswinger (' + Math.round(X.back10.bow) + ' px)');
ok(X.byline1.bow < X.byline10.bow / 4 && X.back1.bow < X.back10.bow / 4, 'Curve 1 bends it a tenth as much as Curve 10 (v180: 10% a point) -- it bows ' + Math.round(X.byline1.bow) + ' and ' + Math.round(X.back1.bow) + ' px, against ' + Math.round(X.byline10.bow) + ' and ' + Math.round(X.back10.bow) + ' (v169-v179: none at all)');
ok(Object.values(X).every(r => r.at && r.at.miss < 18 && r.at.t < 1.25 && r.at.z > 25), 'every one still comes down on the spot (within 0.7 m), on time and at head height');
ok(Object.values(X).every(r => r.err < 12), 'its flight is read as it swings (within 12 px, 0.7 s ahead)');
ok(Math.abs(X.byline10.q - 0.95) < 0.005 && Math.abs(X.byline1.q - 0.095) < 0.005, 'a Curve 10 cross counts as curling 0.95 of the most a cross can (' + X.byline10.q.toFixed(2) + ': v169, the most a twentieth less), a Curve 1 one a tenth of that (' + X.byline1.q.toFixed(3) + ': v180, 10% a point -- none before)');

// HARDER TO CLEAR: the same header clearance off a cross curling all the way and off a straight one (the same dice)
const clr = await page.evaluate(() => { const T = window.__T, p = T.players().find(q => q.team === 'G' && q.role !== 'G'), b = T.ball(), out = {}, R = Math.random; T.freeze();
  try { for(const k of [0, 1]){ Math.random = () => 0.9; p.x = 300; p.y = T.YC; b.ownedBy = null; b.x = 300; b.y = T.YC; b.z = 60; b.vx = 300; b.vy = 0; b.vz = 0;
    b.crossT = 1; b.crossCurl = k * T.CB(); T.headClear(p); out[k] = Math.hypot(b.vx, b.vy); } } finally { Math.random = R; }
  b.vx = b.vy = 0; b.z = 0; return out; });
info('a headed clearance: ' + Math.round(clr[0]) + ' px/s off a straight cross, ' + Math.round(clr[1]) + ' off a curling one');
ok(Math.abs(clr[1] / clr[0] - 0.8) < 0.01, 'off a curling cross a headed clearance goes a fifth less far');

// HARDER TO CLAIM: a cross dropping past the keeper as he comes for it (from just under where he can claim it, nearly
// still) as far off as he can just get to before it lands -- he has it straight, and not if it's curling all the way.
// (Coming for it: committed, reading it all the way. Whether he comes at all is his read of it -- v85: see crossClaim.)
const cl = await page.evaluate(() => { const T = window.__T, kp = T.keepers()[0], b = T.ball(), out = {}; T.freeze();
  const glX = kp.side < 0 ? 0 : T.FW, z0 = T.CH() - 4;
  const at = (L, k) => { kp.x = glX - kp.side * 30; kp.y = T.YC; b.ownedBy = null; b.x = kp.x; b.y = kp.y + L; b.z = z0; b.vx = 1; b.vy = 0; b.vz = 0;
    b.crossT = 1; b.crossBy = kp.team === 'G' ? 'R' : 'G'; b.crossCurl = k * T.CB(); b.curveSpinT = 0; return !!T.crossClaim(kp, true); };
  let lo = 0, hi = 400; for(let i = 0; i < 30; i++){ const m = (lo + hi) / 2; if(at(m, 0)) lo = m; else hi = m; }   // (the furthest off he can just get to it, straight)
  out.L = +(lo / T.MK).toFixed(2); for(const k of [0, 1]) out[k] = at(lo, k);
  b.crossT = 0; b.crossBy = null; b.z = 0; b.x = T.FW / 2; b.y = T.YC; return out; });
info('a cross he can just get to (' + cl.L + ' m off): ' + (cl[0] ? 'claimed' : 'left') + ' straight, ' + (cl[1] ? 'claimed' : 'left') + ' curling');
ok(cl[0] && !cl[1], 'a curling cross is a little harder for the keeper to claim: one he\'d just get to straight, he can\'t');

// THROUGH BALLS (v167): the computer's into the path of a runner, struck true. 12 m, nobody of theirs near where it's
// going: he runs across its line at 60°, or along it. 12 m along his line with one of theirs sat 0.6 m off it half-way
// (not touching it). 16 m with one of theirs 5 m short of the spot and 2 m off its line. Curve 1 and 10. Where it gets
// to (against where it was played to), which way it's going as it gets there (+: turned toward the man's side of its
// line), how far it bulges off its line (+: to his side), and how near the man in the way it passes.
const thru = (cv, run, man) => page.evaluate(({ cv, run, man }) => new Promise(res => {
  const T = window.__T, R = T.players().filter(q => q.team === 'R' && q.role !== 'G'), G = T.players().filter(q => q.team === 'G' && q.role !== 'G'); T.freeze();
  const p = R[0], q = R[1], o = G[1], atk = T.atkOf('R'), keep = p.stats;
  p.stats = Object.assign({}, keep, { curve: cv, passAcc: 10, longPass: 10, offIQ: 10 });
  const D = man === 'short' ? 360 : 280, ang = run === 'across' ? 60 / 57.3 : 0, rv = 170, b = T.ball();
  const park = () => { for(const x of T.players()) if(x !== p && x !== q && x !== o){ x.x = T.FW / 2; x.y = 40; x.vx = x.vy = 0; } for(const k of T.keepers()) k.y = 30; };
  park(); p.x = T.FW / 2 - atk * 300; p.y = T.YC; p.vx = p.vy = 0; p.facing = { x: atk, y: 0 };
  b.ownedBy = null; b.dribbler = null; b.x = p.x + atk * 20; b.y = p.y; b.z = 0; b.vx = b.vy = b.vz = 0;
  const x0 = b.x, y0 = b.y, tx = x0 + atk * D, ty = T.YC, cx = atk, cy = 0, rvx = atk * Math.cos(ang) * rv, rvy = -Math.sin(ang) * rv;
  const oAt = () => { if(man === 'lane'){ o.x = x0 + atk * D * 0.5; o.y = T.YC + 16; } else if(man === 'short'){ o.x = tx - atk * 5 * T.MK; o.y = T.YC + 2 * T.MK; } else { o.x = T.FW / 2; o.y = 80; }
    o.vx = o.vy = 0; o.state = 'normal'; o.noTouchT = 99; };   // (the man of theirs doesn't touch it: how it's bent for him)
  oAt(); q.vx = rvx; q.vy = rvy; q.x = tx - rvx * 3; q.y = ty - rvy * 3;    // (far back on his run: he's not there before it)
  const oSide = Math.sign((o.y - y0) * cx - (o.x - x0) * cy) || 1;
  { const R = Math.random; Math.random = () => 0.5; try { T.obThruBall(p, q, tx, ty, man === 'short' ? 1.5 : 0.9); } finally { Math.random = R; } }   // (struck true: no error in its weight or line)
  const spin = b.curveSpinT > 0, t0 = T.simNow(), spot = b.thru ? { x: b.thru.x, y: b.thru.y } : { x: tx, y: ty }, moved = Math.hypot(spot.x - tx, spot.y - ty); let near = 1e9, at = null, hd = 0, bow = 0;
  (function tick(){
    park(); oAt(); q.x = tx - rvx * 3; q.y = ty - rvy * 3; q.vx = rvx; q.vy = rvy;
    const t = T.simNow() - t0, s = (b.x - x0) * cx + (b.y - y0) * cy, off = ((b.y - y0) * cx - (b.x - x0) * cy) * oSide;
    if(!b.ownedBy) hd = Math.atan2(cx * b.vy - cy * b.vx, cx * b.vx + cy * b.vy) * 57.3 * oSide;
    if(s > 0 && s < D && Math.abs(off) > Math.abs(bow)) bow = off;
    if(man === 'lane' && b.z < 30) near = Math.min(near, Math.hypot(b.x - o.x, b.y - o.y));
    if(!at && s >= D - 3) at = { t, miss: Math.hypot(b.x - spot.x, b.y - spot.y), hd };
    if(at || b.ownedBy || t > 3.5){ p.stats = keep; const r = { cv, run, man, spin, at, cutOut: b.ownedBy === o, near, bow: +(bow / T.MK).toFixed(2), moved: Math.round(moved) };
      b.ownedBy = null; b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = b.vz = 0; b.z = 0; b.curveSpinT = 0; b.arcK = 0; return res(r); }
    requestAnimationFrame(tick); })(); }), { cv, run, man });
const P = {};
for(const cv of [1, 10]){ P['x' + cv] = await thru(cv, 'across', null); P['a' + cv] = await thru(cv, 'along', null);
  P['l' + cv] = await thru(cv, 'along', 'lane'); P['s' + cv] = await thru(cv, 'along', 'short'); }
info('through balls: ' + Object.entries(P).map(([k, r]) => `${r.man === 'lane' ? 'a man on its line' : r.man === 'short' ? 'a man short of the spot' : 'nobody near, run ' + r.run}, Curve ${r.cv}: ${r.spin ? 'bent' : 'straight'}, ${r.at ? 'got there ' + Math.round(r.at.miss) + ' px off, turned ' + Math.round(r.at.hd) + '° his way' : r.cutOut ? 'cut out' : 'never got there'}, bulging ${r.bow} m${r.man === 'lane' ? ', ' + Math.round(r.near) + ' px off the man' : ''}`).join('; '));
ok(!P.x1.spin && !P.x10.spin && !P.a1.spin && !P.a10.spin && P.x10.at && P.a10.at && P.x10.at.miss < 12 && P.a10.at.miss < 12,
  'with nobody of theirs near where it\'s going a through ball goes straight to the spot, however he\'s running -- across its line or along it (v167: it bent into his path)');
ok(P.l10.spin && !P.l1.spin && P.l10.at && P.l10.at.miss < 10 && P.l10.bow < 0 && P.l10.near - P.l1.near >= 8 && P.l10.near - P.l1.near <= 32 && P.l10.moved === 0,
  'with one of theirs on its line it bulges away from him and still gets to the spot: Curve 10 takes it ' + Math.round(P.l10.near - P.l1.near) + ' px further off him than Curve 1 does straight (' + Math.round(P.l10.near) + ' against ' + Math.round(P.l1.near) + '; v169, a 12 m ball: half the bend it could have from 17 m)');
ok(P.s10.spin && P.s10.at && P.s10.at.miss < 12 && P.s10.bow <= -0.9 && P.s10.bow >= -2.0 && P.s10.at.hd >= 14 && P.s10.at.hd <= 34,
  'with one of theirs short of the spot, off to the side, it bulges away from him and bends round onto the spot at Curve 10 (' + P.s10.bow + ' m off its line, coming in turned ' + (P.s10.at ? Math.round(P.s10.at.hd) : '-') + '° toward his side, ' + (P.s10.at ? Math.round(P.s10.at.miss) : '-') + ' px off the spot; v169, bending from the start: not as steep a dip at the end)');
ok(!P.s1.spin && P.s1.at && P.s1.at.miss < 12 && Math.abs(P.s1.bow) < 0.1,
  '...and at Curve 1 not at all: straight to the spot (v169 -- ' + P.s1.bow + ' m off its line)');

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

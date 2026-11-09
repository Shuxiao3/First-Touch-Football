// FOOTBALL CLASSIC, WHERE IT'S AIMED (v180). YOUR CORNER'S RETICLE: set over it, the stick moves a target round their
// box -- it starts 8.5 m out in the middle and goes anywhere in the box but the goal line -- and your cross goes there,
// or the one taken for you when your time's up; the computer's corners have none. THE CORNER'S MEN IN MIDFIELD: between
// the edge of the box and halfway, 24 to 36 m out. A CROSS INTO THE HEART OF THE BOX: no further out than 12 m, nor wider
// than 9 m off the middle -- a man out on the edge of the box isn't crossed to while one of ours is in it, a lone one has
// it put in front of him, and the computer's crosses the same. NO THROUGH BALL OFF A FIRST TOUCH: yours, pressed with the
// ball still loose off his first touch, goes as a pass; the computer never picks one first time. THE COMPUTER'S SHOT ONLY
// WITH A CHANCE: one in 25 or better, so a man who can't strike it from range doesn't try.
// On a copy of the game that lets the test set the scenes and reach the cross, the corner, the pass and the computer's
// choices, and hear of every cross the computer (or the corner taken for you) puts in and every through ball of yours.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, ball:()=>ball, FW, FH, YC, MK, PA_D, PA_HW, atkOf, keeperOf, rs:()=>restartInfo, rt:()=>restartT, check:()=>checkOutOfPlay(), controlled:()=>controlled, '
  + 'setCtl:q=>setControlled(q), recv:()=>recvAuto, prefs:()=>PREFS, simNow:()=>simNow, cross:(c,low)=>cross(c,low), crossMen:(p,low)=>crossMen(p,low), crossSpot:p=>crossSpot(p), crossZone:(a,s)=>crossZone(a,s), '
  + 'aimOn:()=>cornerAimOn(), get AIM0(){ return CORNER_AIM0; }, get AIMV(){ return CORNER_AIM_V; }, get ZD(){ return CROSS_ZD; }, get ZW(){ return CROSS_ZW; }, get ZOUT(){ return CROSS_ZOUT; }, '
  + 'obCtx:p=>{ const a=atkOf(p.team); return obCtx(p,a,a>0?FW:0); }, obShotOpt:(p,C)=>obShotOpt(p,C), obChoose:(p,ob,o,l,C)=>obChoose(p,ob,o,l,C), otMax:()=>oneTouchMax(), get OB_SHOT_MIN(){ return OB_SHOT_MIN; }, get OBM(){ return OBM; }, '
  + 'doPass:(c,o)=>doPass(c,o), myLoose:()=>myLooseBall(), get FT_THRU_T(){ return FT_THRU_T; }, '
  + 'noPlan:()=>{ for(const t of ["G","R"]) if(PLAN[t]) PLAN[t].last=null; }, setJob:(q,j)=>{ const S=PLAN[q.team]; S.last=S.last||new Map(); S.last.set(q,j); }, '
  + 'freeze:()=>{ restartT=0; restartInfo=null; offsideT=0; offsidePass=null; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; skill=null; matchClock=0; advOn=false; recvAuto=null; shotQ=null; actQ=null; }};\n  const LAB_TITLE=');
patch('    const cs=spot||crossSpot(p);\n', '    const cs=spot||crossSpot(p);\n    if(window.__AC) window.__AC.push({team:p.team, x:cs?cs.x:null, y:cs?cs.y:null});\n');   // (every cross the computer puts in, and where it's aimed)
patch('  function thruBall(p,mate,drag){\n', '  function thruBall(p,mate,drag){\n    if(window.__TB) window.__TB.n++;\n');   // (every through ball of yours)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-aim-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy, fastFrames: true });
const { ok, info } = rep;
const HELPERS = `window.__run = (sec, until) => new Promise(res => { const T = window.__T, t0 = T.simNow();
  (function tick(){ if(T.simNow() - t0 >= sec || (until && until())) return res(+(T.simNow() - t0).toFixed(2)); requestAnimationFrame(tick); })(); });
// a corner of ours at their end, our men up the pitch as when it comes from an attack
window.__corner = () => { const T = window.__T, b = T.ball(), atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0; T.freeze();
  T.players().forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; if(p.team === 'G'){ p.x = gx - atk * (14 + (i % 4) * 6) * T.MK; p.y = T.YC + Math.sin(i * 2.4) * 16 * T.MK; } else { p.x = gx - atk * (5 + (i % 4) * 4) * T.MK; p.y = T.YC + Math.sin(i * 1.7) * 12 * T.MK; } });
  b.ownedBy = null; b.x = gx + atk * 12; b.y = 30; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'R'; T.check(); };
// where the reticle is: metres out from their goal line, and across from the middle
window.__aim = () => { const T = window.__T, R = T.rs(), atk = T.atkOf('G'), gx = atk > 0 ? T.FW : 0; if(!R || !R.aim) return null;
  return { out: +(atk * (gx - R.aim.x) / T.MK).toFixed(2), across: +((R.aim.y - T.YC) / T.MK).toFixed(2), x: R.aim.x, y: R.aim.y }; };`;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(400);
await page.evaluate(HELPERS);
const atkG = await page.evaluate(() => window.__T.atkOf('G'));
const IN = atkG > 0 ? 'KeyD' : 'KeyA', OUT = atkG > 0 ? 'KeyA' : 'KeyD';   // (the stick toward their goal line, and away from it)
const hold = async (key, sec) => { await page.keyboard.down(key); await page.evaluate(s => window.__run(s), sec); await page.keyboard.up(key); await page.evaluate(() => window.__run(0.05)); };

// --- YOUR CORNER'S RETICLE: where it starts, the stick moving it, the edges it keeps to ---------------------------------
await page.evaluate(async () => { const P = window.__T.prefs(); P.cornerBox = 4; P.cornerBack = 2; window.__corner(); await window.__run(5, () => window.__T.rs() && window.__T.rs().set); });
const a0 = await page.evaluate(() => ({ aim: window.__aim(), on: window.__T.aimOn(), yours: window.__T.controlled() === window.__T.rs().taker, tk: (t => ({ x: t.x, y: t.y }))(window.__T.rs().taker), b: (b => ({ x: b.x, y: b.y }))(window.__T.ball()) }));
await hold('KeyW', 0.5); const a1 = await page.evaluate(() => window.__aim());
await hold(IN, 1); const a2 = await page.evaluate(() => window.__aim());
await hold(OUT, 1.6); const a3 = await page.evaluate(() => window.__aim());
await hold('KeyW', 1.4); const a4 = await page.evaluate(() => window.__aim());
const a5 = await page.evaluate(() => ({ tk: (t => ({ x: t.x, y: t.y }))(window.__T.rs().taker), b: (b => ({ x: b.x, y: b.y }))(window.__T.ball()), set: window.__T.rs().set }));
info('your corner\'s reticle: ' + JSON.stringify({ a0, a1, a2, a3, a4, a5 }));
const PA = await page.evaluate(() => ({ d: window.__T.PA_D / window.__T.MK, hw: window.__T.PA_HW / window.__T.MK, v: window.__T.AIMV / window.__T.MK }));
ok(a0.on && a0.yours && a0.aim && Math.abs(a0.aim.out - 8.5) < 0.05 && Math.abs(a0.aim.across) < 0.05,
  'your corner, set: a reticle in their box, 8.5 m out in the middle (' + (a0.aim ? a0.aim.out + ' m, ' + a0.aim.across + ' across' : 'none') + ')');
ok(a1 && a1.across < -2.5 && a1.across > -7 && Math.abs(a1.out - 8.5) < 0.3,
  'the stick moves it: up, half a second, ' + (a1 ? Math.abs(a1.across) : '?') + ' m (' + PA.v + ' m a second once the stick\'s all the way over)');
ok(a2 && Math.abs(a2.out - 1.5) < 0.05 && a3 && Math.abs(a3.out - PA.d) < 0.05 && a4 && Math.abs(a4.across + PA.hw) < 0.05,
  'it stays in the box and off the goal line: in to ' + (a2 && a2.out) + ' m, out to ' + (a3 && a3.out) + ' m (the box ' + PA.d.toFixed(1) + '), up to ' + (a4 && Math.abs(a4.across)) + ' m across (its side ' + PA.hw.toFixed(2) + ')');
ok(a5.set && Math.hypot(a5.tk.x - a0.tk.x, a5.tk.y - a0.tk.y) < 1 && Math.hypot(a5.b.x - a0.b.x, a5.b.y - a0.b.y) < 1, 'and the taker stands over it, the ball where it was, while the stick moves the reticle');

// --- YOUR CORNER, CROSSED to the reticle -- and taken for you when your time's up, to it as well; the computer's none -----
let r = await page.evaluate(async () => { const T = window.__T, out = {};
  window.__corner(); await window.__run(5, () => T.rs() && T.rs().set); return 1; });
await hold(IN, 0.2); await hold('KeyS', 0.35);
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), out = {}, A = window.__aim();
  T.cross(0.5, false); await window.__run(0.05); const rv = T.recv();
  out.aim = A; out.crossed = !T.rs() && !b.ownedBy && b.crossT > 0; out.spot = rv && rv.spot ? { out: +((T.atkOf('G') * ((T.atkOf('G') > 0 ? T.FW : 0) - rv.spot.x)) / T.MK).toFixed(2), across: +((rv.spot.y - T.YC) / T.MK).toFixed(2), d: Math.hypot(rv.spot.x - A.x, rv.spot.y - A.y) } : null;
  out.mate = T.controlled().team === 'G' && !!rv && rv.q === T.controlled();
  out.manD = +(Math.hypot(T.controlled().x - A.x, T.controlled().y - A.y) / T.MK).toFixed(1);
  out.nearest = +(Math.min(...T.players().filter(q => q.team === 'G' && !q.isGK && q !== T.controlled()).map(q => Math.hypot(q.x - A.x, q.y - A.y))) / T.MK).toFixed(1);
  T.freeze(); return out; });
info('your corner, crossed: ' + JSON.stringify(r));
ok(r.crossed && r.spot && r.spot.d < 1 && r.mate, 'your corner crossed to the reticle (' + (r.aim && r.aim.out) + ' m out, ' + (r.aim && r.aim.across) + ' across): the cross is for there, and you\'re on the man going for it (' + r.manD + ' m from it)');
await page.evaluate(async () => { window.__corner(); await window.__run(5, () => window.__T.rs() && window.__T.rs().set); });
await hold(OUT, 0.15); await hold('KeyW', 0.4);
r = await page.evaluate(async () => { const T = window.__T, A = window.__aim(); window.__AC = [];
  const t = await window.__run(10, () => !T.rs()); const ac = window.__AC.slice(); window.__AC = null; T.freeze();
  return { A, t, ac: ac.map(c => ({ team: c.team, d: Math.hypot(c.x - A.x, c.y - A.y) })) }; });
info('your corner, left: ' + JSON.stringify(r));
ok(r.ac.length === 1 && r.ac[0].team === 'G' && r.ac[0].d < 1, 'left alone, it\'s crossed for you when your time\'s up (' + r.t + ' s) -- to the reticle (' + r.A.out + ' m out, ' + r.A.across + ' across), not where the computer would have put it');
r = await page.evaluate(async () => { const T = window.__T; T.freeze(); const b = T.ball(), atkR = T.atkOf('R'), gxR = atkR > 0 ? T.FW : 0;
  b.ownedBy = null; b.x = gxR + atkR * 12; b.y = 30; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G'; T.check(); await window.__run(5, () => T.rs() && T.rs().set);
  const R = T.rs(), out = { type: R && R.type, team: R && R.team, aim: !!(R && R.aim), on: T.aimOn() }; T.freeze(); return out; });
ok(r.type === 'corner' && r.team === 'R' && !r.aim && !r.on, 'the computer\'s corner: no reticle (' + JSON.stringify(r) + ')');

// --- THE CORNER'S MEN IN MIDFIELD: between the edge of the box and halfway -----------------------------------------------
r = await page.evaluate(async () => { const T = window.__T, out = {};
  const mids = () => { const R = T.rs(), atk = T.atkOf(R.team), gx = atk > 0 ? T.FW : 0, res = [];
    for(const [q, s] of R.plan){ if(q.team !== R.team || !s || s.x == null || (R.boxMen || []).includes(q)) continue; if(atk * (s.x - T.FW / 2) < 0) continue;   // (not in the box, not back in his own half)
      res.push({ out: +(atk * (gx - s.x) / T.MK).toFixed(1), across: +((s.y - T.YC) / T.MK).toFixed(1) }); }
    return res; };
  const P = T.prefs(); P.cornerBox = 3; P.cornerBack = 1; window.__corner(); await window.__run(0.3); out.ours = mids();
  T.freeze(); const b = T.ball(), atkR = T.atkOf('R'), gxR = atkR > 0 ? T.FW : 0; b.ownedBy = null; b.x = gxR + atkR * 12; b.y = 30; b.vx = b.vy = 0; b.z = 0; b.lastTouch = 'G'; T.check(); await window.__run(0.3); out.theirs = mids();
  out.half = +(T.FW / 2 / T.MK).toFixed(1); T.freeze(); return out; });
info('the corner\'s men in midfield: ' + JSON.stringify(r));
const mOK = m => m.out >= 24 && m.out <= 36 && Math.abs(m.across) <= 15.5;
ok(r.ours.length >= 3 && r.ours.every(mOK) && r.theirs.length >= 1 && r.theirs.every(mOK),
  'at a corner the men neither in the box nor back are between the edge of the box (16.5 m) and halfway (' + r.half + ' m): yours ' + r.ours.map(m => m.out).join(', ') + ' m out, the computer\'s ' + r.theirs.map(m => m.out).join(', ') + ' (v138-v179: 16 to 19 m, then 26 and 32)');

// --- A CROSS INTO THE HEART OF THE BOX ---------------------------------------------------------------------------------
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), out = {};
  const zone = (atk, sp) => { const gx = atk > 0 ? T.FW : 0; return { out: +(atk * (gx - sp.x) / T.MK).toFixed(2), across: +((sp.y - T.YC) / T.MK).toFixed(2) }; };
  // crossZone: 15 m out and 14 m across pulled in to 12 m and 9 m; 0.5 m off the goal line out to 1.5 m; 8 m out in the middle left
  const aG = T.atkOf('G'), gG = aG > 0 ? T.FW : 0;
  out.z1 = zone(aG, T.crossZone(aG, { x: gG - aG * 15 * T.MK, y: T.YC + 14 * T.MK })); out.z2 = zone(aG, T.crossZone(aG, { x: gG - aG * 0.5 * T.MK, y: T.YC - 3 * T.MK })); out.z3 = zone(aG, T.crossZone(aG, { x: gG - aG * 8 * T.MK, y: T.YC }));
  // a scene: one of a side wide by their byline with the ball, theirs on their goal line out wide (nobody offside) and
  // their keeper in goal; the rest of his side back by halfway but for the men placed in the box
  const scene = (team, men) => { T.freeze(); T.noPlan(); const atk = T.atkOf(team), gx = atk > 0 ? T.FW : 0, ms = T.players().filter(p => p.team === team && !p.isGK), os = T.players().filter(p => p.team !== team && !p.isGK);
    ms.forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; p.x = T.FW / 2 - atk * (6 + i) * T.MK; p.y = T.YC + (i % 3 - 1) * 10 * T.MK; });
    os.forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; p.x = gx - atk * 0.5 * T.MK; p.y = T.YC + (i % 2 ? 1 : -1) * (26 + i) * T.MK; });
    const kp = T.keeperOf(team === 'G' ? 'R' : 'G'); if(kp){ kp.x = gx - atk * 1 * T.MK; kp.y = T.YC; kp.vx = kp.vy = 0; }
    const c = ms[0]; c.x = gx - atk * 4 * T.MK; c.y = T.YC - 21 * T.MK; c.facing = { x: 0, y: 1 };
    men.forEach(([d, o], i) => { const q = ms[1 + i]; q.x = gx - atk * d * T.MK; q.y = T.YC + o * T.MK; });
    b.ownedBy = c; b.dribbler = null; b.x = c.x; b.y = c.y + c.r + b.r + 5; b.vx = b.vy = 0; b.z = 0; b.lastTouch = team;
    const still = () => { T.noPlan(); for(const q of T.players()) q.vx = q.vy = 0;   // (as placed, standing; the plan's edge-of-the-box spot his if he's given it)
      men.forEach(([d, o, job], i) => { const q = ms[1 + i]; q.x = gx - atk * d * T.MK; q.y = T.YC + o * T.MK; if(job) T.setJob(q, { job, x: q.x, y: q.y, bx: q.x, by: q.y }); }); };
    return { c, ms, atk, still }; };
  // yours: a lone man on the edge of the box (the plan's spot there his: BOXEDGE, 16.4 m out); him and one 8 m out;
  // the lone man crossed to for real
  let S = scene('G', [[16.4, 2, 'BOXEDGE']]); T.setCtl(S.c); await window.__run(0.05); S.still(); out.lone = T.crossMen(S.c, false).map(m => ({ who: S.ms.indexOf(m.q), ...zone(S.atk, m) }));
  S = scene('G', [[16.4, 2, 'BOXEDGE'], [8, -1]]); T.setCtl(S.c); await window.__run(0.05); S.still(); out.two = T.crossMen(S.c, false).map(m => ({ who: S.ms.indexOf(m.q), ...zone(S.atk, m) }));
  S = scene('G', [[16.4, 2, 'BOXEDGE']]); T.setCtl(S.c); await window.__run(0.05); S.still(); T.cross(0.5, false); const rv = T.recv(); out.real = { crossed: !b.ownedBy && b.crossT > 0, spot: rv && rv.spot ? zone(S.atk, rv.spot) : null };
  // the computer's: a lone man of theirs as far out as it looks for one, 14 m (beyond it, he's not one to cross to); him and
  // one 7 m out
  S = scene('R', [[14, -2]]); await window.__run(0.05); S.still(); let cs = T.crossSpot(S.c); out.cLone = cs ? { who: S.ms.indexOf(cs.who), ...zone(S.atk, cs) } : null;
  S = scene('R', [[14, -2], [7, 1]]); await window.__run(0.05); S.still(); cs = T.crossSpot(S.c); out.cTwo = cs ? { who: S.ms.indexOf(cs.who), ...zone(S.atk, cs) } : null;
  { const kp = T.keeperOf('G'), kx = kp.x; kp.x = T.FW / 2; cs = T.crossSpot(S.c); out.cTwoNoKp = cs ? { who: S.ms.indexOf(cs.who), ...zone(S.atk, cs) } : null; kp.x = kx; }   // (and with our keeper out of the way)
  T.freeze(); b.ownedBy = null; b.x = T.FW / 2; b.y = T.YC; out.ZD = T.ZD / T.MK; out.ZW = T.ZW / T.MK; return out; });
info('a cross into the heart of the box: ' + JSON.stringify(r));
const inZ = m => !!m && m.out <= r.ZD + 0.01 && m.out >= 1.49 && Math.abs(m.across) <= r.ZW + 0.01;
ok(r.z1.out === 12 && r.z1.across === 9 && r.z2.out === 1.5 && r.z3.out === 8 && r.z3.across === 0,
  'the heart of the box: a spot 15 m out and 14 m across is pulled in to ' + r.z1.out + ' m and ' + r.z1.across + ' m, one 0.5 m off the goal line out to ' + r.z2.out + ', one 8 m out in the middle left where it is');
ok(r.lone.length === 1 && r.lone[0].who === 1 && inZ(r.lone[0]) && r.two.length === 1 && r.two[0].who === 2 && inZ(r.two[0]),
  'your cross: a lone man on the edge of the box has it put in front of him (' + (r.lone[0] ? r.lone[0].out : '?') + ' m out); with one of ours 8 m out as well, only he\'s crossed to (' + r.two.map(m => '#' + m.who + ' ' + m.out + ' m').join(', ') + ')');
ok(r.real.crossed && inZ(r.real.spot), 'crossed for real to the lone man on the edge: it\'s for ' + (r.real.spot ? r.real.spot.out + ' m out, ' + r.real.spot.across + ' across' : 'nowhere') + ' -- he goes in to meet it');
ok(inZ(r.cLone) && r.cLone.who === 1 && inZ(r.cTwo) && r.cTwo.who === 1 && inZ(r.cTwoNoKp) && r.cTwoNoKp.who === 2,
  'the computer\'s cross the same: for its lone man 14 m out, ' + (r.cLone ? r.cLone.out : '?') + ' m out; with one 7 m out as well, still ' + (r.cTwo ? r.cTwo.out : '?') + ' m (the 7 m man\'s the keeper\'s, him on his line) -- with the keeper out of the way, the 7 m man (' + (r.cTwoNoKp ? r.cTwoNoKp.out : '?') + ' m)');

// --- NO THROUGH BALL OFF A FIRST TOUCH --------------------------------------------------------------------------------
// yours: the ball loose off his first touch, out of reach (a pass queued for when he gets to it) and in reach; then the
// same off a touch two seconds old, and with it at his feet
r = await page.evaluate(async () => { const T = window.__T, b = T.ball(), out = {};
  const scene = (touchAgo, how) => { T.freeze(); const atk = T.atkOf('G'), gs = T.players().filter(p => p.team === 'G' && !p.isGK), c = gs[0], m = gs[1];
    gs.forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; p.x = T.FW / 2 - atk * (10 + i) * T.MK; p.y = T.YC + (i % 3 - 1) * 12 * T.MK; });
    T.players().filter(p => p.team === 'R' && !p.isGK).forEach((p, i) => { p.vx = p.vy = 0; p.state = 'normal'; p.x = T.FW / 2 + atk * 30 * T.MK; p.y = T.YC + (i - 4) * 4 * T.MK; });
    c.x = T.FW / 2; c.y = T.YC; c.facing = { x: atk, y: 0 }; m.x = c.x + atk * 14 * T.MK; m.y = T.YC - 3 * T.MK; m.vx = atk * 150; c.noTouchT = 0; T.setCtl(c);
    if(how === 'feet'){ b.ownedBy = c; b.dribbler = null; b.x = c.x + atk * (c.r + b.r + 2); b.y = c.y; }
    else { b.ownedBy = null; b.dribbler = c; b.dribbleGrace = 0.85; b.touchAt = T.simNow() - touchAgo; b.x = c.x + atk * (how === 'far' ? 2.2 : 0.5) * T.MK; b.y = c.y; b.vx = how === 'far' ? atk * 40 : 0; b.vy = 0; }
    b.z = 0; b.vz = 0; b.lastTouch = 'G'; return { c, m, atk }; };
  for(const [k, ago, how] of [['farFirst', 0, 'far'], ['nearFirst', 0, 'near'], ['nearOld', 2, 'near'], ['feet', 2, 'feet']]){
    const S = scene(ago, how); window.__TB = { n: 0 }; const loose = T.myLoose();
    T.doPass(0.4, { thru: { dx: S.atk * 80, dy: 0 } }); await window.__run(1, () => b.ownedBy !== S.c && b.dribbler !== S.c);
    out[k] = { loose, played: b.ownedBy !== S.c && b.dribbler !== S.c, thru: window.__TB.n, v: Math.round(Math.hypot(b.vx, b.vy)) }; window.__TB = null; }
  T.freeze(); b.ownedBy = null; b.dribbler = null; b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = 0; return out; });
info('a through ball off a first touch: ' + JSON.stringify(r));
ok(r.farFirst.loose && r.farFirst.played && r.farFirst.thru === 0 && r.nearFirst.loose && r.nearFirst.played && r.nearFirst.thru === 0,
  'yours, pressed with the ball still loose off his first touch -- out of reach (played as he gets to it) or in it -- goes as a pass, not through');
ok(r.nearOld.played && r.nearOld.thru === 1 && r.feet.played && r.feet.thru === 1, '...off a touch two seconds old, or at his feet, it\'s played through as asked');
// the computer's: a through ball worth five times the plain pass to the same man, a short one -- picked 200 times
r = await page.evaluate(() => { const T = window.__T, p = T.players().find(q => q.team === 'R' && !q.isGK), q = T.players().find(x => x.team === 'R' && !x.isGK && x !== p), C = T.obCtx(p), d = Math.min(150, T.otMax() * 0.5);
  const thru = { kind: 'pass', key: 'p1', q, d, thru: { x: 1, y: 0 }, ev: 0.05, P: 0.9, v: 0.06, loss: 0.01 }, plain = { kind: 'pass', key: 'p2', q, d, ev: 0.01, P: 0.95, v: 0.02, loss: 0.01 };
  const n = { first: 0, later: 0 }; for(let i = 0; i < 200; i++){ const ob = { since: T.simNow(), plan: null, pressed: false }; if(T.obChoose(p, ob, [thru, plain], true, C) === thru) n.first++; if(T.obChoose(p, ob, [thru, plain], false, C) === thru) n.later++; }
  return n; });
info('the computer\'s first-time ball: ' + JSON.stringify(r));
ok(r.first === 0 && r.later >= 180, 'the computer\'s: a through ball worth five times the plain one, never picked first time (0 of 200), almost always once he\'s had a look (' + r.later + ' of 200)');

// --- THE COMPUTER'S SHOT ONLY WITH A CHANCE: one of theirs on the ball straight in front of our goal, nobody of ours
// near, Long shots 1, 3, 5.5 and 10 (his finishing 5.5): what the shot's worth as he sees it, from 12 m out to 30 m ----
r = await page.evaluate(() => { const T = window.__T, out = {}, b = T.ball(); T.freeze();
  const p = T.players().find(q => q.team === 'R' && !q.isGK), keep = p.stats, atk = T.atkOf('R'), gx = atk > 0 ? T.FW : 0;
  T.players().filter(q => q.team === 'G' && !q.isGK).forEach((q, i) => { q.vx = q.vy = 0; q.x = T.FW / 2 - atk * 20 * T.MK; q.y = T.YC + (i - 4) * 5 * T.MK; });
  T.players().filter(q => q.team === 'R' && !q.isGK && q !== p).forEach((q, i) => { q.vx = q.vy = 0; q.x = T.FW / 2 - atk * 25 * T.MK; q.y = T.YC + (i - 4) * 5 * T.MK; });
  const kp = T.keeperOf('G'); if(kp){ kp.x = gx - atk * 1 * T.MK; kp.y = T.YC; }
  for(const ls of [1, 3, 5.5, 10]){ const row = [];
    p.stats = Object.assign({}, keep, { longShots: ls, shotAcc: 5.5, compFinal: 5.5 });
    for(let m = 12; m <= 30; m += 0.5){ p.x = gx - atk * m * T.OBM; p.y = T.YC; p.vx = p.vy = 0; b.ownedBy = p; b.x = p.x + atk * 10; b.y = p.y;
      const o = T.obShotOpt(p, T.obCtx(p)); row.push({ m, P: o ? +o.P.toFixed(3) : 0 }); }
    out[ls] = { far: Math.max(0, ...row.filter(x => x.P > 0).map(x => x.m)), low: Math.min(1, ...row.filter(x => x.P > 0).map(x => x.P)), at: Object.fromEntries(row.filter(x => [16, 18, 19, 20, 23].includes(x.m)).map(x => [x.m, x.P])) }; }
  p.stats = keep; T.freeze(); b.ownedBy = null; b.x = T.FW / 2; b.y = T.YC; out.min = T.OB_SHOT_MIN; return out; });
info('the computer\'s shot, straight on with the way clear: ' + JSON.stringify(r));
ok([1, 3, 5.5, 10].every(k => r[k].low >= r.min), 'never a shot worth less than one in ' + Math.round(1 / r.min) + ' to him (the least he\'ll take: ' + [1, 3, 5.5, 10].map(k => r[k].low).join(', ') + ' at Long shots 1, 3, 5.5, 10)');
ok(r[1].far <= r[3].far && r[3].far <= r[10].far && r[3].far >= 18 && r[3].far < 19.5 && r[10].far < 23,
  'how far out he\'ll try it, the way clear: Long shots 1 ' + r[1].far + ' m, 3 ' + r[3].far + ' m, 5.5 ' + r[5.5].far + ' m, 10 ' + r[10].far + ' m -- nothing from 23 m (till v180 he could from 34 m)');

process.exitCode = rep.finish();
await browser.close();

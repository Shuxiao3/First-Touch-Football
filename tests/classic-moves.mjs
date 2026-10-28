// FOOTBALL CLASSIC, SKILL MOVES AND SKILL STARS. What you draw on SKILL is read against the way your man is going -- the
// way he's running, else the way he's facing -- as a stick is in other football games, so a shape is the same move
// whichever way he's going on the pitch: a flick anywhere in the half in front of him a FLICK (1 star), in the half
// behind him a DRAG-BACK (2), an L a CROQUETA, a circle a ROULETTE, a hook a CRUYFF TURN (3), back then ahead a RAINBOW
// (4), ahead then back a SOMBRERO, across and back an ELASTICO, a loop with a line out of it a HEEL FLICK (5). A move
// above his stars doesn't happen. Each move from a run at a man 3 m in front of him (who leaves the ball alone): the flick
// popped up off his foot with him still facing his way, the drag-back and the Cruyff turn turned back, the croqueta
// across, the roulette out of the spin seven-eighths of the way round going diagonally away past the man, the rainbow
// over both their heads, the sombrero over the man to drop behind him, the elastico popped up past him on the side it
// snapped back to, the heel flick past him on one side while he goes round the other -- and he has it again after.
// SKILL STARS: a ceiling drawn by position and the league his rating belongs in (five-stars rare and most of them the
// top league's wingers; a centre-back three at most; the lower leagues' defenders one or two), grown into by 19 to 23 and
// perhaps one of them lost in his thirties; in a new career's world, and its news when your man gains or loses one.
// On a copy of the game that lets the test reach the moves and the stars, its frames stepped at a steady 60 a second.
import { chromium } from 'playwright';
import { reporter } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={readSkill, skillFor, startSkill, mkSkill, setSkill:s=>{ skill=s; }, skill:()=>skill, grade:()=>lastGrade, controlled:()=>controlled, players:()=>players, keepers:()=>keepers, ball:()=>ball, simNow:()=>simNow, atkOf, FW, YC, proj, screenDirToPitch, SKILL_STARS, SKILL_NAME, '
  + 'STAR_ODDS, starPot, starsAt, starLeague, freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; oneTouch=null; ftAim=null; recvAuto=null; skill=null; skillCd=0; }};\n  const LAB_TITLE=');
patch('  // ===== END MANAGER CAREER', '  window.__S={get d(){ return CAREER&&CAREER.data; }, careerStars, careerStarPot, starLeague, starsAt, natPos, mgAgeWorld, mgYouthIntake};\n  // ===== END MANAGER CAREER');
patch('  function checkOffsideTouch(t){\n', '  function checkOffsideTouch(t){\n    if(window.__noOffside) return false;\n');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-moves-')), 'classic.html');
writeFileSync(copy, src);

const browser = await chromium.launch();
const rep = reporter(), { ok, info } = rep;
const newPage = async () => { const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  page.on('pageerror', e => rep.errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if(m.type() === 'error') rep.errs.push('CONSOLE: ' + m.text()); });
  return page; };
const page = await newPage();
// every frame 1/60 s on, whoever asks for it (the game, and the scenes below): the same run every time
await page.addInitScript(() => { let vt = 0, q = [], armed = false;
  window.requestAnimationFrame = cb => { q.push(cb); if(!armed){ armed = true; setTimeout(() => { armed = false; vt += 1000 / 60; const run = q; q = []; for(const f of run) f(vt); }, 0); } return 0; }; });
await page.goto('file://' + copy); await page.waitForTimeout(700);
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);
await page.evaluate(() => { window.__noOffside = true; });

// --- WHAT YOU DRAW: the shapes, drawn on the screen relative to the way he's going there ----------------------------
// u along his way on the screen, v across it (+ his right); `fx, fy` his way on the pitch
const SHAPES = `(() => {
  const seg = (pts, u0, v0, u1, v1) => { const n = Math.ceil(Math.hypot(u1 - u0, v1 - v0) / 2.5); for(let i = 1; i <= n; i++) pts.push([u0 + (u1 - u0) * i / n, v0 + (v1 - v0) * i / n]); return pts; };   // (a point every 2.5 px, as a finger gives)
  const S = {};
  S.lineAhead = seg([[0, 0]], 0, 0, 40, 6, 8);
  S.lineAheadSide = seg([[0, 0]], 0, 0, 10, 40, 8);                 // (80 degrees off: still in the half in front of him)
  S.lineBackSide = seg([[0, 0]], 0, 0, -12, 40, 8);                 // (100 degrees off: in the half behind him)
  S.lineBack = seg([[0, 0]], 0, 0, -40, 5, 8);
  S.L = seg(seg([[0, 0]], 0, 0, 35, 0, 7), 35, 0, 35, 35, 7);
  S.circleCW = []; for(let i = 0; i <= 40; i++){ const t = i / 40 * Math.PI * 2.1; S.circleCW.push([25 * Math.sin(t), 25 - 25 * Math.cos(t)]); }
  S.circleACW = []; for(let i = 0; i <= 40; i++){ const t = i / 40 * Math.PI * 2.1; S.circleACW.push([25 * Math.sin(t), -25 + 25 * Math.cos(t)]); }
  S.hook = []; for(let i = 0; i <= 30; i++){ const t = i / 30 * Math.PI; S.hook.push([30 * Math.sin(t), 30 - 30 * Math.cos(t)]); }   // (ahead, round to his right and back)
  S.backAhead = seg(seg([[0, 0]], 0, 0, -35, 0, 7), -35, 0, 5, 4, 8);
  S.aheadBack = seg(seg([[0, 0]], 0, 0, 35, 0, 7), 35, 0, -5, 4, 8);
  S.rightLeft = seg(seg([[0, 0]], 0, 0, 4, 35, 7), 4, 35, 8, -5, 8);
  S.leftRight = seg(seg([[0, 0]], 0, 0, 4, -35, 7), 4, -35, 8, 5, 8);
  S.loopLine = []; for(let i = 0; i <= 36; i++){ const t = i / 36 * Math.PI * 2; S.loopLine.push([20 * Math.sin(t), 20 - 20 * Math.cos(t)]); } seg(S.loopLine, 0, 0, 45, -30, 9);
  return S; })()`;
// the shape drawn for a man running (or standing) facing f on the pitch: canvas px
const DRAW = `((T, p, f, name) => { const a = T.proj(p.x, p.y), b = T.proj(p.x + f.x * 20, p.y + f.y * 20), l = Math.hypot(b.x - a.x, b.y - a.y),
  F = { x: (b.x - a.x) / l, y: (b.y - a.y) / l }, R = { x: -F.y, y: F.x };
  return window.__SH[name].map(([u, v]) => ({ x: 500 + F.x * u + R.x * v, y: 400 + F.y * u + R.y * v })); })`;
await page.evaluate(`window.__SH = ${SHAPES}; window.__DRAW = ${DRAW};`);

const gest = await page.evaluate(() => { const T = window.__T, p = T.controlled(), out = {}, keep = { x: p.x, y: p.y };
  p.x = T.FW / 2; p.y = T.YC;
  for(const [fx, fy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
    const f = { x: fx, y: fy }, right = { x: -fy, y: fx }, key = fx > 0 ? 'E' : fx < 0 ? 'W' : fy > 0 ? 'S' : 'N';
    p.vx = fx * 150; p.vy = fy * 150; p.facing = { x: fx, y: fy };
    for(const name of Object.keys(window.__SH)){ const g = T.readSkill(window.__DRAW(T, p, f, name)), m = g && T.skillFor(p, g);
      out[key + ' ' + name] = !m ? null : { g: g.kind, kind: m.kind, side: m.side, sense: m.sense,
        ahead: m.d ? +(m.d.x * fx + m.d.y * fy).toFixed(2) : null, across: m.d ? +(m.d.x * right.x + m.d.y * right.y).toFixed(2) : null }; } }
  // standing still, it's the way he faces; and the same stroke on the screen, one way and the other
  p.vx = p.vy = 0; p.facing = { x: 1, y: 0 }; const stroke = window.__DRAW(T, p, { x: 1, y: 0 }, 'lineAhead');
  out.standing = (T.skillFor(p, T.readSkill(window.__DRAW(T, p, { x: 1, y: 0 }, 'lineBack'))) || {}).kind;
  p.vx = 150; out.strokeGoingThatWay = (T.skillFor(p, T.readSkill(stroke)) || {}).kind;
  p.vx = -150; p.facing = { x: -1, y: 0 }; out.strokeGoingTheOther = (T.skillFor(p, T.readSkill(stroke)) || {}).kind;
  // wherever he is on the screen (the camera off to one side of him), the way he's going there is his way on the pitch
  let worst = 0; for(const [x, y] of [[T.FW * 0.2, T.YC * 0.4], [T.FW * 0.8, T.YC * 1.6], [T.FW / 2, T.YC]]) for(let a = 0; a < 8; a++){
    const f = { x: Math.cos(a * Math.PI / 4), y: Math.sin(a * Math.PI / 4) }, s0 = T.proj(x, y), s1 = T.proj(x + f.x * 4, y + f.y * 4), u = T.screenDirToPitch(s1.x - s0.x, s1.y - s0.y, y, x);
    worst = Math.max(worst, Math.acos(Math.min(1, u.x * f.x + u.y * f.y)) * 57.3); }
  out.worst = +worst.toFixed(2);
  p.vx = p.vy = 0; p.x = keep.x; p.y = keep.y; return out; });
const W = ['E', 'W', 'S', 'N'], all = (name, test) => W.every(w => gest[w + ' ' + name] && test(gest[w + ' ' + name]));
const show = name => W.map(w => { const m = gest[w + ' ' + name]; return w + ':' + (m ? m.kind + (m.ahead != null ? '(' + m.ahead + ',' + m.across + ')' : '') + (m.side ? ' side ' + m.side : '') + (m.sense ? ' sense ' + m.sense : '') : '-'); }).join(' ');
info('running east, west, south and north: ' + Object.keys(gest).filter(k => k.startsWith('E ')).map(k => k.slice(2) + ' ' + show(k.slice(2))).join(' | '));
ok(all('lineAhead', m => m.kind === 'flick' && m.ahead > 0.85) && all('lineAheadSide', m => m.kind === 'flick' && m.ahead >= 0 && m.across > 0.6),
  'a flick in the half in front of him is a FLICK, that way (straight on, or 80 degrees off to his right), whichever way he\'s going: ' + show('lineAheadSide'));
ok(all('lineBack', m => m.kind === 'dragback' && m.ahead < -0.9) && all('lineBackSide', m => m.kind === 'dragback' && m.ahead < 0 && m.across > 0.5),
  'a flick in the half behind him is a DRAG-BACK, that way: ' + show('lineBackSide'));
ok(all('L', m => m.kind === 'croq' && m.across > 0.8), 'an L is a CROQUETA, the way its second stroke goes: ' + show('L'));
ok(all('circleCW', m => m.kind === 'spin' && m.sense === 1) && all('circleACW', m => m.kind === 'spin' && m.sense === -1), 'a circle is a ROULETTE, round the way it was drawn: ' + show('circleCW'));
ok(all('hook', m => m.kind === 'cruyff' && m.ahead < -0.3 && m.across > 0), 'a hook is a CRUYFF TURN, back the way it ends: ' + show('hook'));
ok(all('backAhead', m => m.kind === 'rainbow') && all('aheadBack', m => m.kind === 'sombrero'), 'back then ahead is a RAINBOW, ahead then back a SOMBRERO: ' + show('aheadBack'));
ok(all('rightLeft', m => m.kind === 'elastico' && m.side === -1) && all('leftRight', m => m.kind === 'elastico' && m.side === 1), 'out to one side and back is an ELASTICO, to the side it came back to: ' + show('rightLeft'));
ok(all('loopLine', m => m.kind === 'heel' && m.ahead > 0 && m.across < -0.1), 'a loop with a line out of it is a HEEL FLICK, the way the line goes: ' + show('loopLine'));
ok(gest.worst < 1, 'a way on the screen is read back as the way on the pitch it shows, the camera off to one side of him or not (out by ' + gest.worst + ' degrees at worst)');
ok(gest.standing === 'dragback' && gest.strokeGoingThatWay === 'flick' && gest.strokeGoingTheOther === 'dragback',
  'standing, it\'s the way he faces; the same stroke on the screen is a flick going that way and a drag-back going the other (' + gest.strokeGoingThatWay + ', ' + gest.strokeGoingTheOther + ')');

// --- HIS STARS: a move above them doesn't happen -------------------------------------------------------------------
const gate = await page.evaluate(() => { const T = window.__T, p = T.controlled(), b = T.ball(), out = {};
  const shape = { flick: 'lineAhead', dragback: 'lineBack', croq: 'L', spin: 'circleCW', cruyff: 'hook', rainbow: 'backAhead', sombrero: 'aheadBack', elastico: 'rightLeft', heel: 'loopLine' };
  for(const [kind, need] of Object.entries(T.SKILL_STARS)) for(const st of [need - 1, need]){ if(st < 1) continue;
    T.freeze(); p.state = 'normal'; p.stars = st; p.x = T.FW / 2; p.y = T.YC; p.vx = 150; p.vy = 0; p.facing = { x: 1, y: 0 };
    b.ownedBy = p; b.x = p.x + 14; b.y = p.y; b.z = 0; b.vz = 0;
    const did = T.startSkill(T.readSkill(window.__DRAW(T, p, { x: 1, y: 0 }, shape[kind]))), sk = T.skill();
    out[kind + st] = { did, kind: sk && sk.kind, grade: T.grade() }; T.freeze(); }
  p.stars = 5; return out; });
const needs = { flick: 1, dragback: 2, croq: 3, spin: 3, cruyff: 3, rainbow: 4, sombrero: 5, elastico: 5, heel: 5 };
const gateOK = Object.entries(needs).every(([k, n]) => gate[k + n].did && gate[k + n].kind === k && (n === 1 || (!gate[k + (n - 1)].did && /★ ONLY$/.test(gate[k + (n - 1)].grade))));
info(Object.entries(gate).map(([k, v]) => k + ':' + (v.did ? 'yes' : 'no (' + v.grade + ')')).join(' '));
ok(gateOK, 'every move needs its stars: the flick 1, the drag-back 2, the croqueta, roulette and Cruyff turn 3, the rainbow 4, the sombrero, elastico and heel flick 5 (one short: "' + gate.rainbow3.grade + '")');

// --- EACH MOVE, from a run at a man 3 m in front of him who leaves the ball alone ----------------------------------
// where he and the ball are after it (along his run, across it: + his right), which way he faces, how high it went
const scene = (kind, o) => page.evaluate(({ kind, o }) => new Promise(res => { const T = window.__T, p = T.controlled(), b = T.ball(), atk = T.atkOf(p.team), d = T.players().filter(q => q.team !== p.team)[0];
  T.freeze();
  for(const q of T.players()) if(q !== p){ q.x = T.FW / 2 - atk * 400; q.y = 60; q.vx = q.vy = 0; }
  for(const k of T.keepers()) k.y = 30;
  p.x = T.FW / 2; p.y = T.YC; p.vx = atk * 150; p.vy = 0; p.facing = { x: atk, y: 0 }; p.stars = 5; p.state = 'normal'; p.noTouchT = 0; p.skill = null; p.stamina = 1;
  d.x = p.x + atk * 70; d.y = p.y + 6; d.vx = d.vy = 0; d.state = 'normal'; d.noTouchT = 99; d.tackleCd = 99;   // (nor slides in)
  b.ownedBy = p; b.x = p.x + atk * 14; b.y = p.y; b.z = 0; b.vx = p.vx; b.vy = 0; b.vz = 0; b.lob = null; b.thru = null; b.dribbler = null; b.dribbleGrace = 0; b.intendedRcv = null; b.curveSpinT = 0;
  const m = { kind }; if(o.d) m.d = { x: o.d[0] * atk, y: o.d[1] * atk }; if(o.sense) m.sense = o.sense; if(o.side) m.side = o.side;
  T.setSkill(T.mkSkill(p, m));
  const x0 = p.x, y0 = p.y, t0 = T.simNow(), rel = (x, y) => [Math.round((x - x0) * atk), Math.round((y - y0) * atk)];
  let top = 0, end = null, passed = null; const path = [];
  (function tick(){ const t = T.simNow() - t0; top = Math.max(top, b.z); d.x = x0 + atk * 70; d.y = y0 + 6; d.vx = d.vy = 0; d.noTouchT = 99; d.tackleCd = 99;
    if(!end && !T.skill()) end = { t: +t.toFixed(2), face: Math.round(Math.atan2(p.facing.y * atk, p.facing.x * atk) * 57.3), loose: !b.ownedBy, ball: rel(b.x, b.y) };
    const pm = rel(p.x, p.y), bm = rel(b.x, b.y); path.push({ man: pm, ball: bm, z: Math.round(b.z) });
    if(passed == null && pm[0] >= 70) passed = pm[1];                                     // (his side as he goes by the man)
    if(t < 1.4) return requestAnimationFrame(tick);
    const ballBy = path.find(s => s.ball[0] >= 70);
    res({ end, man: rel(p.x, p.y), ball: rel(b.x, b.y), top: Math.round(top), has: b.ownedBy === p, near: Math.round(Math.hypot(b.x - p.x, b.y - p.y)), passed, ballBy: ballBy && { across: ballBy.ball[1], z: ballBy.z } }); })(); }), { kind, o });
const mv = {};
for(const [key, kind, o] of [['flick', 'flick', { d: [0.6, -0.8] }], ['dragback', 'dragback', { d: [-0.9, 0.4] }], ['croq', 'croq', { d: [0, 1] }], ['spinCW', 'spin', { sense: 1 }], ['spinACW', 'spin', { sense: -1 }],
  ['cruyff', 'cruyff', { d: [-0.6, 0.8] }], ['rainbow', 'rainbow', {}], ['sombrero', 'sombrero', { side: 1 }], ['elastico', 'elastico', { side: -1 }], ['heel', 'heel', { d: [0.85, 0.53] }]]) mv[key] = await scene(kind, o);
for(const [k, r] of Object.entries(mv)) info(k + ': ' + JSON.stringify(r));
const got = r => r.has || r.near < 30;
ok(mv.flick.end.t <= 0.15 && Math.abs(mv.flick.end.face) <= 5 && mv.flick.top >= 3 && mv.flick.top <= 15 && mv.flick.end.loose && got(mv.flick),
  'FLICK: over in ' + mv.flick.end.t + ' s, the ball popped up ' + mv.flick.top + ' px off his foot, him still facing his way (' + mv.flick.end.face + ' degrees), and on it again');
ok(Math.abs(mv.dragback.end.face) >= 120 && mv.dragback.ball[0] < mv.dragback.man[0] && mv.dragback.has, 'DRAG-BACK: he turns back with it (facing ' + mv.dragback.end.face + ' degrees), the ball behind where he was going');
ok(mv.croq.man[1] >= 30 && Math.abs(mv.croq.end.face) <= 5 && mv.croq.has, 'CROQUETA: across the way the L went (' + mv.croq.man[1] + ' px), still facing on');
ok(mv.spinCW.end.face <= -20 && mv.spinCW.end.face >= -70 && mv.spinCW.man[1] <= -30 && mv.spinACW.end.face >= 20 && mv.spinACW.end.face <= 70 && mv.spinACW.man[1] >= 30 && mv.spinCW.has && mv.spinACW.has,
  'ROULETTE: out of the spin seven-eighths of the way round, going diagonally away past the man -- clockwise to his left (facing ' + mv.spinCW.end.face + ', ' + mv.spinCW.man[1] + ' px across), anticlockwise to his right (' + mv.spinACW.end.face + ', ' + mv.spinACW.man[1] + ' px)');
ok(Math.abs(mv.cruyff.end.face) >= 100 && mv.cruyff.end.face > 0 && mv.cruyff.has, 'CRUYFF TURN: back the way the hook ended (facing ' + mv.cruyff.end.face + ' degrees, to his right)');
ok(mv.rainbow.top >= 60 && mv.rainbow.ball[0] >= 150 && got(mv.rainbow), 'RAINBOW: over both their heads (' + mv.rainbow.top + ' px up) to drop well past the man (' + mv.rainbow.ball[0] + ' px on), and he\'s on to it');
ok(mv.sombrero.top >= 40 && mv.sombrero.ballBy && mv.sombrero.ballBy.z >= 30 && mv.sombrero.ball[0] >= 90 && got(mv.sombrero),
  'SOMBRERO: flicked over the man (' + (mv.sombrero.ballBy && mv.sombrero.ballBy.z) + ' px up as it goes over him) to drop behind him (' + mv.sombrero.ball[0] + ' px on), and he goes round to it');
ok(mv.elastico.end.ball[1] > 5 && mv.elastico.top >= 8 && mv.elastico.top <= 30 && mv.elastico.ball[1] <= -20 && mv.elastico.ball[0] >= 45 && got(mv.elastico),
  'ELASTICO: out to his right (' + mv.elastico.end.ball[1] + ' px), snapped back and popped up (' + mv.elastico.top + ' px) on past the man on his left (' + mv.elastico.ball[1] + ' px across), and he has it');
ok(mv.heel.ballBy && mv.heel.ballBy.across >= 15 && mv.heel.passed != null && mv.heel.passed <= -5 && got(mv.heel),
  'HEEL FLICK: the ball past the man on his right (' + (mv.heel.ballBy && mv.heel.ballBy.across) + ' px), him round the other side (' + mv.heel.passed + ' px), and on it again');
await page.close();

// --- SKILL STARS: the odds of each ceiling ------------------------------------------------------------------------
const cp = await newPage();
await cp.goto('file://' + copy); await cp.waitForTimeout(600);
const odds = await cp.evaluate(() => { const T = window.__T, O = T.STAR_ODDS, o = {};
  o.sums = Object.entries(O).every(([k, rows]) => rows.every(r => Math.abs(r.reduce((a, x) => a + x, 0) - 100) < 1e-6));
  const pl = k => O[k][3], low = k => [O[k][0], O[k][1]];
  o.cb = O.CB.every(r => r[3] === 0 && r[4] === 0) && pl('CB')[0] + pl('CB')[1] >= 90;
  o.lowDef = ['CB', 'FB'].every(k => low(k).every(r => r[0] + r[1] >= 95));
  o.lowFive = Object.values(O).every(rows => rows[0][4] === 0 && rows[1][4] === 0 && rows[2][4] <= 0.5);
  o.wing = pl('WNG')[2] + pl('WNG')[3] >= 75 && Object.keys(O).every(k => k === 'WNG' || pl(k)[4] < pl('WNG')[4]);
  o.stk = pl('STK')[2] > 45 && pl('STK')[3] > pl('STK')[4] * 4 && pl('STK')[4] <= 3;
  o.mid = pl('DM')[4] <= 0.5 && pl('CM')[4] <= 0.5 && pl('AM')[4] <= 1 && pl('WM')[4] > pl('AM')[4] && pl('WM')[4] < pl('STK')[4];
  o.fb = pl('FB')[4] <= 1;
  // drawn: u spread evenly over 0..1 gives each ceiling its share
  const n = [0, 0, 0, 0, 0]; for(let i = 0; i < 10000; i++) n[T.starPot('WNG', 80, (i + 0.5) / 10000) - 1]++;
  o.drawn = n.map(x => x / 100); o.leagues = [T.starLeague(58), T.starLeague(59), T.starLeague(67), T.starLeague(75)].join('');
  return o; });
info('a top-league winger\'s ceiling 1..5, drawn: ' + odds.drawn.join('% ') + '%');
ok(odds.sums && odds.leagues === '1234' && odds.drawn.join() === '0,11,42,40,7', 'each position\'s odds in each league add up, and a draw gives each ceiling its share');
ok(odds.cb && odds.lowDef, 'a centre-back three stars at most (the top league\'s 9 in 10 one or two); the lower two leagues\' defenders one or two, 95 in 100 or more');
ok(odds.lowFive, 'no five-stars in the lower two leagues, hardly any in the one below the top');
ok(odds.wing && odds.stk && odds.mid && odds.fb, 'in the top league: wingers mostly three or four stars and the most five-stars; strikers mostly three, some four, five rare; a five-star midfielder very rare (the wide one a little less); a full-back hardly ever');

// --- grown into, and perhaps one lost: his stars at each age -------------------------------------------------------
const ages = await cp.evaluate(() => { const T = window.__T, o = { mono: true, young: true, prime: true, lose: 0, peaks: {}, n: 2000 };
  for(let seed = 1; seed <= o.n; seed++){ let prev = 0, peak = null;
    for(let age = 15; age <= 36; age++){ const s = T.starsAt(5, age, seed);
      if(age <= 31 && s < prev) o.mono = false; if(age <= 31) prev = s;
      if(peak == null && s === 5) peak = age; }
    if(T.starsAt(5, 16, seed) !== 3 || T.starsAt(2, 16, seed) !== 1) o.young = false;
    for(let age = 24; age <= 31; age++) if(T.starsAt(5, age, seed) !== 5 || T.starsAt(3, age, seed) !== 3) o.prime = false;
    const old = T.starsAt(5, 36, seed); if(old === 4) o.lose++; else if(old !== 5) o.mono = false;
    o.peaks[peak] = (o.peaks[peak] || 0) + 1; }
  o.one = T.starsAt(1, 16, 7) === 1 && T.starsAt(1, 36, 7) === 1 && T.starsAt(4, null, 7) === 4;
  return o; });
info('reaching his ceiling at (age: men of 2000) ' + JSON.stringify(ages.peaks) + '; a star gone by 36: ' + ages.lose);
ok(ages.young && ages.mono && Object.keys(ages.peaks).every(a => a >= 19 && a <= 23) && Object.keys(ages.peaks).length === 5,
  'a star or two short when he\'s young (a five-star ceiling three stars at 16), grown into by 19 to 23, never going back before he\'s old');
ok(ages.prime && Math.abs(ages.lose / ages.n - 0.55) < 0.04, 'his ceiling through his prime; about half lose one in their thirties (' + Math.round(ages.lose / ages.n * 100) + '% by 36), never more');
ok(ages.one, 'a one-star man is one star at any age; with no age (an exhibition club\'s), his ceiling');

// --- IN A NEW CAREER'S WORLD ----------------------------------------------------------------------------------------
await cp.click('#smItems [data-act="new"]'); await cp.waitForTimeout(200); await cp.click('#newSlotList .slotBtn >> nth=1'); await cp.waitForTimeout(300);
await cp.fill('#mgName', 'Sam Okafor'); await cp.fill('#mgClubIn', 'Fenmoor Athletic'); await cp.click('#mgGo'); await cp.waitForSelector('#careerHub.show', { timeout: 8000 });
const world = await cp.evaluate(() => { const S = window.__S, d = S.d, o = { men: 0, gk: true, cb: true, cur: true, low5: 0, fives: [], young: 0, youngShort: true, prime: true };
  for(const t of [1, 2, 3, 4]) for(const id of d.div[t]){ const ps = id === d.clubId ? d.roster : d.world.clubs[id].players;
    for(const p of ps){ o.men++; const sp = S.careerStarPot(p), s = S.careerStars(p);
      if(p.role === 'GK'){ if(sp !== 1 || s !== 1) o.gk = false; continue; }
      if(S.natPos(p) === 'CB' && sp > 3) o.cb = false;
      if(s > sp || s < 1) o.cur = false;
      const rl = S.starLeague(((p.ovr || 60) + (p.pot || p.ovr || 60)) / 2);
      if(sp === 5){ o.fives.push(S.natPos(p) + ' ' + p.age); if(rl <= 2) o.low5++; }
      if(p.age >= 24 && p.age <= 31 && s !== sp) o.prime = false; } }
  for(let i = 0; i < 3 && (d.youth || []).length < 8; i++) S.mgYouthIntake(d);   // (the academy's lads, 16 and 17)
  for(const p of [...d.youth, ...d.roster]) if(p.role !== 'GK' && p.age < 19 && S.careerStarPot(p) >= 2){ o.young++; if(S.careerStars(p) >= S.careerStarPot(p)) o.youngShort = false; }
  // your man grows into another star: the news says so
  const p = d.roster.find(q => q.role !== 'GK'); p.sp = 5; let a = 15; while(a < 23 && !(S.starsAt(5, a + 1, (p.seed >>> 0) || p.id || 1) > S.starsAt(5, a, (p.seed >>> 0) || p.id || 1))) a++;
  p.age = a; const before = S.careerStars(p), R = { grew: [], retired: [], expired: [], youthOut: [] };
  S.mgAgeWorld(d, R); o.news = (d.news || []).map(n => n.t).find(t => t.startsWith(p.name + ' has grown into another skill star')) || null; o.from = before; o.to = S.careerStars(p);
  return o; });
info(world.men + ' men; ' + world.fives.length + ' five-star ceilings: ' + (world.fives.join(', ') || 'none') + '; ' + world.young + ' in the academy with a ceiling of two stars or more');
ok(world.gk && world.cb && world.cur, 'in a new career\'s world: every keeper one star, no centre-back over three, no man over his ceiling');
ok(world.fives.length <= 10 && world.low5 === 0 && world.fives.filter(f => f.startsWith('FB ')).length <= 1, 'five-stars rare (' + world.fives.length + ' in the world), none whose rating belongs in the lower two leagues, one full-back at most');
ok(world.youngShort && world.prime, 'the academy\'s lads short of their ceilings (' + world.young + ' of them with two stars or more to come' + (world.youngShort ? '' : ', NOT all short') + '), everyone 24 to 31 at his' + (world.prime ? '' : ' (NOT)'));
ok(world.news && world.to === world.from + 1, 'a year on, your man has grown into another star, and the news says so: "' + world.news + '"');

process.exitCode = rep.finish();
await browser.close();

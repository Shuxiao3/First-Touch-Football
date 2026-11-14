// FOOTBALL CLASSIC, DRIBBLING AND BALL CONTROL (v208). Dribbling is the ball at his feet once he has it: how far each
// stride's touch takes it, how much further flat out, how quickly it's back at his feet (after a touch, a ball he's just
// got back) -- Agility turns his body, Dribbling has the ball keep up with it. (v215: v208's cut at pace that pushed it out
// from his feet, the touch that got away from a poor dribbler altogether, and the ball off his feet coming out of a skill
// move, taken out: through a cut it's as close as running straight, it's never loose, and out of a move it's at his feet.) Ball control is the cone in front of him he takes a ball
// in, centred on the way he faces (not the way he's moving): 120° in all at 1, 180° at 5, 210° at 10, on a smooth curve,
// the touch harder the nearer the edge, not all at once; past his Back to it angle he can't take it at all. Compared at
// 1, 5.5 and 10, everything else held level, for you and the computer alike. The game run at a steady 60 frames a
// second, and the touch's spread off (Knock-on variance 0) where it's the carry being measured, so each run is the same.
// On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('<head>', '<head><script>{ let vt = 0, q = [], on = false; window.requestAnimationFrame = cb => { q.push(cb); if(!on){ on = true; setTimeout(() => { on = false; vt += 1000 / 60; const run = q; q = []; for(const f of run) f(vt); }, 0); } return 0; }; }</script>');   // (a steady 60 a second: every frame's callbacks run together, on the same clock, as a browser runs them)
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, atkOf, controlROf, simNow:()=>simNow, setControlled, touchQuality, '
  + 'coneHalfOf, coneOff, awayOf, facingAway, mkSkill, setSkill:s=>{ skill=s; }, skill:()=>skill, carry, own, runTouch, dribQ, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('  function humanIntent(){\n', '  function humanIntent(){\n    if(window.__stick) return {ix:window.__stick.x, iy:window.__stick.y};\n');   // (a stick the test holds)
patch('  function attemptCaptures(){\n', '  function attemptCaptures(){\n    if(window.__holdFace){ const H=window.__holdFace; H.p.facing={x:H.f.x,y:H.f.y}; }\n');   // (he can't turn to it)
patch('  function magnetPull(p,ix,iy){\n', '  function magnetPull(p,ix,iy){\n    if(window.__noMag) return null;\n');
patch('  function checkOffsideTouch(t){\n', '  function checkOffsideTouch(t){\n    if(window.__noOffside) return false;\n');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-dribble-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);
await page.evaluate(() => { window.__noOffside = true; });

// ===== BALL CONTROL'S CONE =====
const cone = await page.evaluate(() => { const T = window.__T, at = b => ({ stats: { ballControl: b } }), deg = r => Math.round(r * 180 / Math.PI * 10) / 10;
  return { w: [1, 3, 5, 5.5, 7.5, 10].map(b => deg(2 * T.coneHalfOf(at(b)))), away: [1, 5, 10].map(b => deg(T.awayOf(at(b), false))), cut: deg(T.awayOf(at(1), true)) }; });
info('the cone, in all (Ball control 1, 3, 5, 5.5, 7.5, 10): ' + cone.w.join(', ') + '°; his Back to it angle (1, 5, 10): ' + cone.away.join(', ') + '°');
ok(cone.w[0] === 120 && cone.w[2] === 180 && cone.w[5] === 210, 'the cone he takes a ball in is 120° in all at Ball control 1, 180° at 5, 210° at 10 (' + cone.w[0] + ', ' + cone.w[2] + ', ' + cone.w[5] + ')');
ok(cone.w[1] > 120 && cone.w[1] < 180 && cone.w[3] > 180 && cone.w[3] < cone.w[4] && cone.w[4] < 210 && cone.w[1] - 120 > (180 - 120) / 2,
  '...on a smooth curve between, quickest up from 1: ' + cone.w[1] + '° at 3, ' + cone.w[3] + '° at 5.5, ' + cone.w[4] + '° at 7.5');
ok(cone.away[0] === 80 && cone.away[1] === 110 && cone.away[2] === 125 && cone.cut === 110, 'past it, his Back to it angle moves with it: ' + cone.away.join(', ') + '° (110° at Ball control 5, as everyone\'s was); cutting out their pass it\'s 110° for everyone');

// THE TOUCH BY ANGLE: the ball reaching him th degrees off the way he faces, at the back with nobody near (easy) or with a
// man 1.6 m off him (pressed): its mean, and how often it's clean or better (1500 each)
const byAngle = await page.evaluate(() => { const T = window.__T, atk = T.atkOf('G'), p = T.players().find(q => q.team === 'G' && q !== T.controlled()), o = T.players().find(q => q.team !== 'G');
  T.freeze(); for(const q of T.players()) if(q !== p){ q.x = 60; q.y = 60; q.vx = q.vy = 0; }
  const keep = p.stats, out = {}, n = 1500;
  for(const bc of [1, 5, 10]) for(const ctx of ['easy', 'pressed']) for(const th of [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 180]){
    p.stats = Object.assign({}, keep, { ballControl: bc, composure: 5.5, compFinal: 5.5 });
    p.x = atk > 0 ? T.FW * 0.3 : T.FW * 0.7; p.y = T.YC; p.vx = p.vy = 0; p.facing = { x: atk, y: 0 };
    if(ctx === 'pressed'){ o.x = p.x; o.y = p.y - 40; o.vx = o.vy = 0; } else { o.x = 60; o.y = 60; }
    const a = th * Math.PI / 180, R = T.controlROf(p), b = T.ball(); b.ownedBy = null; b.z = 0; b.passFrom = null; b.intendedRcv = null; b.thru = null;
    b.x = p.x + atk * Math.cos(a) * R; b.y = p.y + Math.sin(a) * R; b.vx = -atk * Math.cos(a) * 400; b.vy = -Math.sin(a) * 400;
    let sum = 0, sq = 0, cl = 0;
    for(let i = 0; i < n; i++){ const s = T.touchQuality(p, false); sum += s; sq += s * s; if(s > 0.55) cl++; }
    const mean = sum / n; out[bc + ctx + th] = { mean: +mean.toFixed(3), sd: +Math.sqrt(Math.max(0, sq / n - mean * mean)).toFixed(3), clean: +(cl / n).toFixed(2), away: T.facingAway(p, false) };
  }
  p.stats = keep; o.x = 60; o.y = 60; return out; });
const row = (bc, ctx) => [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 180].map(th => { const r = byAngle[bc + ctx + th]; return th + '° ' + (r.away ? 'X' : r.mean); }).join(', ');
for(const bc of [1, 5, 10]) for(const ctx of ['easy', 'pressed']) info('Ball control ' + bc + ', ' + ctx + ': ' + row(bc, ctx));
const edge = { 1: 60, 5: 90, 10: 105 }, last = { 1: 75, 5: 105, 10: 120 }, first = { 1: 90, 5: 120, 10: 135 };
const falls = (bc, ctx, from) => { const th = [0, 30, 45, 60, 75, 90, 105, 120].filter(t => t >= from && t <= last[bc]); return th.every((t, i) => !i || byAngle[bc + ctx + t].mean <= byAngle[bc + ctx + th[i - 1]].mean + 0.012); };   // (each mean of 1500 touches: within 0.012, three times the spread of the difference of two)
for(const bc of [1, 5, 10]){
  const e = byAngle[bc + 'easy' + edge[bc]], f = byAngle[bc + 'easy0'], pe = byAngle[bc + 'pressed' + edge[bc]], pf = byAngle[bc + 'pressed0'];
  ok(!byAngle[bc + 'easy' + last[bc]].away && byAngle[bc + 'easy' + first[bc]].away && byAngle[bc + 'easy180'].away,
    'Ball control ' + bc + ': he can take a ball from up to ' + last[bc] + '° off the way he faces, not from ' + first[bc] + '° round to behind him');
  ok(falls(bc, 'easy', 30) && falls(bc, 'pressed', 30) && f.mean - e.mean >= 0.025 && pf.mean - pe.mean >= 0.02,
    '...and the touch gets worse the nearer the edge of his cone, a bit at a time, nobody near (' + f.mean + ' straight at him, ' + e.mean + ' at the edge, ' + edge[bc] + '°) and pressed too (' + pf.mean + ', ' + pe.mean + ')');
  ok(e.sd > f.sd * 1.15, '...and less sure: its spread ' + e.sd + ' at the edge, ' + f.sd + ' straight at him');
}
ok(byAngle['1easy15'].mean >= byAngle['1easy0'].mean - 0.012 && byAngle['5easy30'].mean >= byAngle['5easy0'].mean - 0.012 && byAngle['10easy30'].mean >= byAngle['10easy0'].mean - 0.012,
  'the middle of the cone is clean: a ball 15° off him at Ball control 1, 30° at 5 and 10, as easy as one straight at him (' + byAngle['1easy15'].mean + ' / ' + byAngle['1easy0'].mean + ', ' + byAngle['5easy30'].mean + ' / ' + byAngle['5easy0'].mean + ')');
ok(byAngle['10easy90'].mean > byAngle['1easy60'].mean + 0.08 && byAngle['10pressed105'].mean > byAngle['5pressed90'].mean + 0.1, 'a good touch takes a wider ball easily: Ball control 10 at 90° ' + byAngle['10easy90'].mean + ' against 1 at 60° ' + byAngle['1easy60'].mean);

// LIVE: the ball rolled at him from 5 m, th degrees off the way he faces, slow (420 px/s) or quick (700); he stands where he
// is and can't turn to it. Taken (dead, or off him) -- or it comes off him, or goes past: you and a computer team-mate
const live = (who, bc, th, v) => page.evaluate(({ who, bc, th, v }) => new Promise(res => {
  const T = window.__T, c = T.controlled(), atk = T.atkOf('G'); T.freeze();
  const p = who === 'you' ? c : T.players().find(q => q !== c && q.team === 'G');
  for(const q of T.players()) if(q !== p){ q.x = atk > 0 ? 80 : T.FW - 80; q.y = q.team === 'G' ? 90 : T.FH - 90; q.vx = q.vy = 0; q.state = 'normal'; }
  const keep = p.stats; p.stats = Object.assign({}, keep, { ballControl: bc, composure: 5.5, compFinal: 5.5 });
  p.x = T.FW / 2; p.y = T.YC; p.vx = p.vy = 0; p.noTouchT = 0; p.state = 'normal'; p.facing = { x: atk, y: 0 }; p.reactUntil = T.simNow() + 9;
  window.__holdFace = { p, f: { x: atk, y: 0 } }; window.__noMag = true;
  const a = th * Math.PI / 180, b = T.ball(); b.ownedBy = null; b.dribbler = null; b.lastTouch = 'G'; b.intendedRcv = p; b.thru = null; b.shotT = 0; b.passFrom = null;
  b.x = p.x + atk * Math.cos(a) * 130; b.y = p.y + Math.sin(a) * 130; b.z = 0; b.vz = 0; b.vx = -atk * Math.cos(a) * v; b.vy = -Math.sin(a) * v;
  const t0 = T.simNow();
  (function tick(){
    p.vx = p.vy = 0; p.x = T.FW / 2; p.y = T.YC;
    const got = b.ownedBy === p, off = !b.ownedBy && b.dribbler === p, defl = b.intendedRcv !== p && !got && !off, d = Math.hypot(b.x - p.x, b.y - p.y);
    const past = T.simNow() - t0 > 0.3 && d > 60 && !got && !off;
    if(got || off || defl || past || T.simNow() - t0 > 2){ p.reactUntil = 0; p.stats = keep; window.__holdFace = null; window.__noMag = false;
      return res(got || off ? 'T' : defl ? 'off him' : 'past'); }
    requestAnimationFrame(tick);
  })(); }), { who, bc, th, v });
const ANG = [0, 45, 90, 120, 180], liveR = {};
for(const bc of [1, 5, 10]) for(const v of [420, 700]) for(const who of ['you', 'mate']) liveR[bc + ' ' + v + ' ' + who] = await Promise.all([]).then(async () => { const r = []; for(const th of ANG) r.push(await live(who, bc, th, v)); return r; });
for(const k in liveR) info('live, Ball control ' + k + ': ' + ANG.map((th, i) => th + '° ' + liveR[k][i]).join(', '));
const takes = { 1: [0, 45], 5: [0, 45, 90], 10: [0, 45, 90, 120] };
for(const bc of [1, 5, 10]){
  const all = Object.keys(liveR).filter(k => k.startsWith(bc + ' ')).every(k => ANG.every((th, i) => (liveR[k][i] === 'T') === takes[bc].includes(th)));
  ok(all, 'Ball control ' + bc + ', a ball rolled at him slow or quick, you or a computer team-mate alike: he takes it from ' + takes[bc].join('°, ') + '° off the way he faces; from further round it comes off him or goes past');
}

// FACING, NOT MOVING: a man side-stepping or backing off, facing up the pitch -- his cone doesn't turn with his running
const facing = await page.evaluate(() => { const T = window.__T, atk = T.atkOf('G'), p = T.players().find(q => q.team === 'G' && q !== T.controlled()), b = T.ball(), keep = p.stats, out = {};
  p.stats = Object.assign({}, keep, { ballControl: 1 }); p.x = T.FW / 2; p.y = T.YC; p.facing = { x: atk, y: 0 }; b.ownedBy = null; b.vx = b.vy = 0; b.z = 0;
  for(const [k, vx, vy] of [['side', 0, 140], ['back', -atk * 120, 0], ['still', 0, 0]]){ p.vx = vx; p.vy = vy;
    b.x = p.x + atk * 30; b.y = p.y; const ahead = T.coneOff(p);
    b.x = p.x; b.y = p.y + 30; out[k] = { ahead, sideAway: T.facingAway(p, false), side: +T.coneOff(p).toFixed(2) }; }
  p.stats = keep; p.vx = p.vy = 0; return out; });
info('facing up the pitch, moving: ' + JSON.stringify(facing));
ok(['side', 'back', 'still'].every(k => facing[k].ahead === 0 && facing[k].sideAway && facing[k].side === facing.still.side),
  'side-stepping across or backing off, facing up the pitch, his cone stays on the way he faces: a ball straight ahead of him is in its clean middle, one coming from the side he\'s running to past it (Ball control 1)');

// ===== DRIBBLING: THE CARRY =====
// the man alone in midfield with it at his feet, the stick held [[from, x, y, sprint], ...] (x up the pitch); after a
// touch that's got away from him the stick goes after it, as you would. Every frame: how far the ball is from him, and
// whether it's at his feet or loose (his)
const carry = (drib, agil, legs, T, aiTurn) => page.evaluate(({ drib, agil, legs, T, aiTurn }) => new Promise(res => {
  const H = window.__T, atk = H.atkOf('G'), m = H.players().find(q => q.team === 'G' && q.role === 'MID') || H.players().find(q => q.team === 'G');
  H.setControlled(m); H.freeze(); H.P.knockVar.val = 0;
  const park = () => { for(const q of H.players()) if(q !== m){ q.x = H.FW / 2 + (q.team === 'G' ? -1 : 1) * 900; q.y = q.team === 'G' ? 40 : H.FH - 40; q.vx = q.vy = 0; } };
  park();
  m.stats = Object.assign({}, m.stats, { dribbling: drib, agility: agil, speed: 6, acceleration: 6, ballControl: 5.5, strength: 5.5 });
  m.x = H.FW / 2 - atk * 300; m.y = H.YC; m.vx = m.vy = 0; m.state = 'normal'; m.noTouchT = 0; m.facing = { x: atk, y: 0 }; m.stamina = 1; m.staminaCap = 1; m.sprint = false; m.carryAngle = atk > 0 ? 0 : Math.PI;
  const b = H.ball(); b.ownedBy = m; b.dribbler = null; b.dribbleGrace = 0; b.x = m.x + atk * 20; b.y = m.y; b.z = 0; b.vx = b.vy = b.vz = 0; H.own(m, 25);
  const t0 = H.simNow(), rows = [];
  (function tick(){
    park();
    const t = H.simNow() - t0; let leg = legs[0]; for(const L of legs) if(t >= L[0]) leg = L;
    const loose = !b.ownedBy && b.dribbler === m;
    if(loose){ const dx = b.x - m.x, dy = b.y - m.y, l = Math.hypot(dx, dy) || 1; window.__stick = { x: dx / l, y: dy / l }; }
    else window.__stick = { x: leg[1] * atk, y: leg[2] };
    m.sprint = !!leg[3];
    const mine = b.ownedBy === m || loose;
    rows.push({ t, d: Math.hypot(b.x - m.x, b.y - m.y), owned: b.ownedBy === m, loose, sp: Math.hypot(m.vx, m.vy) });
    if(t > T || !mine){ window.__stick = null; m.sprint = false; H.P.knockVar.val = 0.8; return res({ rows, lost: !mine }); }
    requestAnimationFrame(tick);
  })(); }), { drib, agil, legs, T, aiTurn });
const sum = (r, from) => { const x = r.rows.filter(q => q.t >= from), d = x.map(q => q.d); let n = 0, cur = 0, mx = 0; for(const q of x){ if(q.loose){ if(!cur) n++; cur++; mx = Math.max(mx, cur); } else cur = 0; }
  return { mean: +(d.reduce((a, v) => a + v, 0) / d.length).toFixed(1), max: +Math.max(...d).toFixed(1), loose: +(x.filter(q => q.loose).length / x.length).toFixed(2), got: n, longest: +(mx / 60).toFixed(2), lost: r.lost }; };
const zig = (n, dt, sprint) => { const L = []; for(let i = 0; i < n; i++) L.push([i * dt, i % 2 ? 0 : 1, i % 2 ? 1 : 0, sprint]); return L; };
const C = {};
for(const D of [1, 5.5, 10]){
  C[D] = { jog: sum(await carry(D, 5.5, [[0, 1, 0, 0]], 5), 1), sprint: sum(await carry(D, 5.5, [[0, 1, 0, 1]], 5), 1),
    zigJog: sum(await carry(D, 5.5, zig(8, 0.75, 0), 6), 0.75), zig: sum(await carry(D, 5.5, zig(8, 0.75, 1), 6), 0.75) };
  info('Dribbling ' + D + ' (px from his middle: mean, furthest; the share of it loose, the touches that got away, the longest loose): ' + JSON.stringify(C[D]));
}
ok(C[1].jog.max > C[5.5].jog.max + 4 && C[5.5].jog.max > C[10].jog.max + 4 && C[1].jog.mean > C[5.5].jog.mean + 2 && C[5.5].jog.mean > C[10].jog.mean + 2 && C[1].sprint.mean > C[5.5].sprint.mean + 3 && C[5.5].sprint.mean > C[10].sprint.mean + 3,
  'running with it, a good dribbler keeps it closer: each stride\'s knock out to ' + C[10].jog.max + ' px from his middle at Dribbling 10, ' + C[5.5].jog.max + ' at 5.5, ' + C[1].jog.max + ' at 1, on average ' + C[10].jog.mean + ', ' + C[5.5].jog.mean + ', ' + C[1].jog.mean + ' (flat out ' + C[10].sprint.mean + ', ' + C[5.5].sprint.mean + ', ' + C[1].sprint.mean + ')');
ok(C[5.5].jog.mean >= 19 && C[5.5].jog.mean <= 23 && C[5.5].sprint.mean >= 18.5 && C[5.5].sprint.mean <= 22.5 && C[5.5].jog.max >= 25 && C[5.5].jog.max <= 31,
  '...a man with Dribbling 5.5 about where everyone had it before (v207, whatever his Dribbling: on average 20 px from his middle running, 19.3 flat out, each knock out to 27): ' + C[5.5].jog.mean + ' running, ' + C[5.5].sprint.mean + ' flat out, out to ' + C[5.5].jog.max);
ok(C[10].sprint.max <= 23 && C[10].zig.max <= 24, '...and at Dribbling 10 it never gets more than ' + Math.max(C[10].sprint.max, C[10].zig.max) + ' px from his middle, flat out or cutting -- tight, not stuck to him (it\'s touched on every stride)');
// GETTING GOING: from standing, flat out at once -- how far out the first knocks take it (the pace he's picked up since his
// last touch counts as flat out does)
const G = {}; for(const D of [1, 5.5, 10]){ const r = await carry(D, 5.5, [[0, 1, 0, 1]], 1.2); const x = r.rows.filter(q => q.t >= 0.15); G[D] = +Math.max(...x.map(q => q.d)).toFixed(1); }
info('getting going, flat out from standing (px from his middle, the furthest in the first 1.2 s): ' + JSON.stringify(G));
ok(G[1] > G[5.5] + 4 && G[5.5] > G[10] + 4, 'getting going, a poor dribbler\'s first knocks go further: out to ' + G[1] + ' px at Dribbling 1, ' + G[5.5] + ' at 5.5, ' + G[10] + ' at 10');
ok(C[1].sprint.max > C[1].jog.max + 2.5 && C[10].sprint.max <= C[10].jog.max + 1 && C[1].sprint.max > C[10].sprint.max + 15,
  'a poor dribbler knocks it further ahead flat out (Dribbling 1 out to ' + C[1].sprint.max + ' px, running ' + C[1].jog.max + '); a good one doesn\'t (Dribbling 10: ' + C[10].sprint.max + ', running ' + C[10].jog.max + ')');
ok([1, 5.5, 10].every(D => C[D].jog.got === 0 && C[D].sprint.got === 0), 'running straight, even flat out, it never gets away from anyone: he\'s still effective in open space with it');
ok([1, 5.5, 10].every(D => C[D].zig.got === 0 && C[D].zigJog.got === 0 && !C[D].zig.lost && !C[D].zigJog.lost),
  'cutting this way and that, at a sprint or a jog, it never gets away from anyone, a Dribbling 1 man included (v215: v208 had his touch get away from him, two times and more in 5 s cutting at a sprint -- taken out)');
ok([1, 5.5, 10].every(D => C[D].zig.max <= C[D].sprint.max + 3 && C[D].zig.mean <= C[D].sprint.mean + 1.5),
  '...nor do the cuts push it out from his feet: as close through them as running straight flat out, the stride\'s knock all there is to it (furthest ' + [1, 5.5, 10].map(D => C[D].zig.max + '/' + C[D].sprint.max).join(', ') + ' px cutting/straight, at Dribbling 1, 5.5, 10)');
ok(C[1].zig.mean > C[5.5].zig.mean + 2.5 && C[5.5].zig.mean > C[10].zig.mean + 2.5, '...and the better he dribbles the closer it stays, cutting as running straight (' + C[1].zig.mean + ', ' + C[5.5].zig.mean + ', ' + C[10].zig.mean + ' px on average)');

// AGILITY TURNS HIM, DRIBBLING THE BALL: the same cuts at a sprint, quick of body (Agility 10) or slow (Agility 1) -- it's
// never loose (v215: v208 had a quick man who couldn't dribble turn away from it); a slow-turning man with Dribbling 10 has
// it at his feet all through, he just takes longer about it
const both = async (D, A) => { const a = sum(await carry(D, A, zig(8, 0.75, 1), 6), 0.75), b = sum(await carry(D, A, zig(8, 0.75, 1), 6), 0.75);   // (twice over: which touches get away isn't the same run to run)
  return { loose: +((a.loose + b.loose) / 2).toFixed(2), got: a.got + b.got, mean: +((a.mean + b.mean) / 2).toFixed(1), max: Math.max(a.max, b.max) }; };
const A10 = await both(1, 10), A1 = await both(1, 1), D10A1 = await both(10, 1);
info('cutting at a sprint, Dribbling 1: Agility 10 ' + JSON.stringify(A10) + ', Agility 1 ' + JSON.stringify(A1) + '; Dribbling 10, Agility 1 ' + JSON.stringify(D10A1));
ok(A10.got === 0 && A1.got === 0 && A10.loose === 0 && A1.loose === 0, 'a man who can\'t dribble, quick of body or slow, never turns away from it: never loose through the same cuts at a sprint, at Agility 10 or 1 (v215: v208 had the quick one lose it ' + 'more)');
ok(D10A1.got === 0 && D10A1.max <= 26, 'a slow-turning man who can dribble (Agility 1, Dribbling 10) keeps it at his feet through every cut (' + D10A1.max + ' px at most)');

// THE BALL ROUND WITH HIM: stood still, the stick swung square across -- how long the ball takes to come round to the
// way he faces (it's his Dribbling, not his Agility: ballFollow 9.5 rad/s at 5.5)
const roundT = await page.evaluate(() => { const T = window.__T, atk = T.atkOf('G'), m = T.controlled(), b = T.ball(), dt = 1 / 60, out = {};
  T.freeze(); for(const q of T.players()) if(q !== m){ q.x = 60; q.y = 60; q.vx = q.vy = 0; }
  const keep = m.stats;
  for(const D of [1, 5.5, 10]){ m.stats = Object.assign({}, keep, { dribbling: D }); m.x = T.FW / 2; m.y = T.YC; m.vx = m.vy = 0; m.state = 'normal';
    b.x = m.x + atk * 25; b.y = m.y; b.z = 0; b.vx = b.vy = 0; T.own(m, 25); m.carryAngle = atk > 0 ? 0 : Math.PI; m.facing = { x: 0, y: 1 };
    let t = 0; for(; t < 2; t += dt){ T.carry(m, dt, false); b.x += b.vx * dt; b.y += b.vy * dt; if(Math.sin(m.carryAngle) > 0.99) break; }
    out[D] = +t.toFixed(2); }
  m.stats = keep; return out; });
ok(roundT[1] > roundT[5.5] * 1.4 && roundT[5.5] > roundT[10] * 1.15, 'the ball comes round with him the quicker the better he dribbles: a quarter turn in ' + roundT[10] + ' s at Dribbling 10, ' + roundT[5.5] + ' s at 5.5, ' + roundT[1] + ' s at 1');

// THE SAME FOR THE COMPUTER: one of its men carrying it straight on, the carry stepped on its own -- as far from him as
// yours at each Dribbling
const same = await page.evaluate(() => { const T = window.__T, b = T.ball(), dt = 1 / 60, c = T.controlled(), R = T.players().find(q => q.team === 'R' && q.role !== 'DEF'), out = {};
  T.P.knockVar.val = 0; T.freeze();
  const run = (q, D) => { const keep = q.stats; q.stats = Object.assign({}, keep, { dribbling: D, speed: 6 }); const a = T.atkOf(q.team);
    q.x = T.FW / 2; q.y = T.YC; q.vx = a * 130; q.vy = 0; q.state = 'normal'; q.stepPhase = 0; q.facing = { x: a, y: 0 }; q.carryAngle = a > 0 ? 0 : Math.PI;
    b.x = q.x + a * 25; b.y = q.y; b.z = 0; b.vx = q.vx; b.vy = 0; T.own(q, 25); let s = 0, n = 0;
    for(let i = 0; i < 240; i++){ q.x += q.vx * dt; T.carry(q, dt, true); b.x += b.vx * dt; b.y += b.vy * dt; if(i > 60){ s += Math.hypot(b.x - q.x, b.y - q.y); n++; } }
    q.stats = keep; return +(s / n).toFixed(1); };
  for(const D of [1, 5.5, 10]) out[D] = { you: run(c, D), them: run(R, D) };
  T.P.knockVar.val = 0.8; return out; });
info('carried straight on at 130 px/s, yours and the computer\'s (mean px from his middle): ' + JSON.stringify(same));
ok([1, 5.5, 10].every(D => Math.abs(same[D].you - same[D].them) <= 1) && same[1].them > same[10].them + 6, 'the computer\'s men carry it the same as yours at each Dribbling (' + [1, 5.5, 10].map(D => same[D].you + '/' + same[D].them).join(', ') + ')');

// ===== OUT OF A SKILL MOVE =====
// a drag-back from a run: as it ends, how soon the ball's at his feet -- at once, whatever his Dribbling (v215: v208 had it
// off them a moment, a poor dribbler's further off and longer); the move itself as long as ever (its timing is the skill
// move's own)
const move = D => page.evaluate(D => new Promise(res => { const T = window.__T, atk = T.atkOf('G'), m = T.controlled(), b = T.ball();
  T.freeze(); T.P.knockVar.val = 0; for(const q of T.players()) if(q !== m){ q.x = 60; q.y = 60; q.vx = q.vy = 0; }
  const keep = m.stats; m.stats = Object.assign({}, keep, { dribbling: D, agility: 5.5, speed: 6 }); m.stars = 5;
  m.x = T.FW / 2; m.y = T.YC; m.vx = atk * 130; m.vy = 0; m.state = 'normal'; m.facing = { x: atk, y: 0 }; m.carryAngle = atk > 0 ? 0 : Math.PI;
  b.x = m.x + atk * 25; b.y = m.y; b.z = 0; b.vx = m.vx; b.vy = 0; T.own(m, 25);
  T.setSkill(T.mkSkill(m, { kind: 'dragback', d: { x: -atk, y: 0 } })); const T0 = T.skill().T; window.__stick = null;
  const t0 = T.simNow(); let end = null, far = 0, back = null, lost = false;
  (function tick(){
    const t = T.simNow() - t0, d = Math.hypot(b.x - m.x, b.y - m.y);
    if(!T.skill() && end == null){ end = t; window.__stick = { x: -atk, y: 0 }; }   // (out of it, and on the way he turned)
    if(end != null){ far = Math.max(far, d); if(back == null && t - end > 0.05 && d <= 27) back = t - end; if(!(b.ownedBy === m || b.dribbler === m)) lost = true; }
    if((end != null && t - end > 1) || t > 3){ window.__stick = null; m.stats = keep; T.P.knockVar.val = 0.8; return res({ T: +T0.toFixed(2), far: +far.toFixed(1), back: back == null ? null : +back.toFixed(2), lost }); }
    requestAnimationFrame(tick);
  })(); }), D);
const M = {}; for(const D of [1, 5.5, 10]) M[D] = await move(D);
info('out of a drag-back (how long the move took, the furthest out the ball got from his middle after it, how soon it was back within 27 px): ' + JSON.stringify(M));
ok([1, 5.5, 10].every(D => M[D].back != null && M[D].back <= 0.12 && !M[D].lost), 'coming out of a drag-back the ball\'s at his feet at once, whatever his Dribbling: within 27 px of his middle ' + [1, 5.5, 10].map(D => M[D].back + ' s').join(', ') + ' after it, at Dribbling 1, 5.5 and 10 -- his stride\'s knock takes it on from there as ever (v215: v208 had a poor dribbler\'s off his feet a moment, and back later than a good one\'s)');

// NOTHING GETS AWAY (v215): a poor dribbler's stride knock on top of a ball well out from his feet -- what got away from
// him, v208 to v214, loose and anyone's -- is still his, at his feet
const keepIt = await page.evaluate(() => { const T = window.__T, atk = T.atkOf('G'), m = T.controlled(), b = T.ball();
  T.freeze(); for(const q of T.players()) if(q !== m){ q.x = 60; q.y = 60; q.vx = q.vy = 0; }
  const keep = m.stats; m.stats = Object.assign({}, keep, { dribbling: 1, speed: 6 });
  m.x = T.FW / 2; m.y = T.YC; m.vx = atk * 150; m.vy = 0; m.state = 'normal'; m.facing = { x: atk, y: 0 }; m.carryAngle = atk > 0 ? 0 : Math.PI;
  b.x = m.x + atk * 25; b.y = m.y; b.z = 0; b.vx = m.vx; b.vy = 0; T.own(m, 25); m.touchOff = 60;
  T.runTouch(m, 150); const r = { his: b.ownedBy === m, loose: !b.ownedBy, knock: +(m.touchKnock || 0).toFixed(1) };
  m.touchOff = 0; m.touchKnock = 0; m.stats = keep; return r; });
info('a Dribbling 1 man\'s stride knock on top of a ball 60 px out from his feet: ' + JSON.stringify(keepIt));
ok(keepIt.his && !keepIt.loose, 'a poor dribbler\'s knock on top of a ball well out from his feet is still his, not loose (v215: v208 to v214 it got away from him, anyone\'s to nick)');

process.exitCode = rep.finish();
await browser.close();

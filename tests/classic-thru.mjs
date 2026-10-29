// FOOTBALL CLASSIC, THROUGH BALLS ROUND THEIR LINE: the computer's through ball to a man running in behind their back
// line goes through a gap in it -- between two of them, or between the outside one and the touchline when the run's out
// there -- and bends on round onto the runner along a steady arc (the same turn every metre, however it slows), as much
// as that takes and as much as the passer's Curve gives him (6 degrees of turn at Curve 1, 34 at 10). The pass is chosen
// on that path, not on a straight line through a man. The ball goes the way it was chosen for, a read of its path reads
// the bend, and a touch on the way ends it.
// On a copy of the game that lets the test set the scene and reach the passes.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, P, FW, FH, YC, MK, atkOf, simNow:()=>simNow, '
  + 'obThruBall, obPassOpt, obCtx, thruDoors, thruArcs, arcAt, thruArcOf, ballAt, passLead, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('  function checkOffsideTouch(t){\n', '  function checkOffsideTouch(t){\n    if(window.__noOffside) return false;\n');   // (the scenes' runners are in behind)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-thru-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });   // (real frames: the ball's path as the game steps it)
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);
await page.evaluate(() => { window.__noOffside = true;
  // THE SCENE: R attacking; u metres into their half, w metres off the middle. The passer 18 m in with the ball at his
  // feet, two of theirs in a line 27 m in (A and B, at wA and wB), a man of ours (the runner, out of the way unless asked
  // for); everyone else parked back in our half by the near touchline, their keeper on his line.
  window.__scene = (cv, wA, wB, run) => { const T = window.__T, M = T.MK, atk = T.atkOf('R'); T.freeze();
    const X = u => T.FW / 2 + atk * u * M, Y = w => T.YC + w * M;
    const R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
    const p = R[0], q = R[1], A = G[0], B = G[1];
    for(const o of T.players()) if(o !== p && o !== q && o !== A && o !== B){ o.x = X(-30); o.y = Y(-30); o.vx = o.vy = 0; o.noTouchT = 99; }
    for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; }
    p.stats = Object.assign({}, p.stats, { curve: cv, passAcc: 10, offIQ: 10 }); p.x = X(18); p.y = Y(0); p.vx = p.vy = 0; p.facing = { x: atk, y: 0 };
    A.x = X(27); A.y = Y(wA); B.x = X(27); B.y = Y(wB);
    for(const o of [A, B]){ o.vx = o.vy = 0; o.state = 'normal'; o.noTouchT = 99; }
    if(run){ q.x = X(run.u); q.y = Y(run.w); q.vx = atk * run.v * M; q.vy = (run.vw || 0) * M; q.state = 'normal'; }
    else { q.x = X(-30); q.y = Y(30); q.vx = q.vy = 0; }
    const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = p.x + atk * 20; b.y = p.y; b.z = 0; b.vx = b.vy = b.vz = 0; b.curveSpinT = 0; b.arcK = 0;
    return { T, M, atk, X, Y, p, q, A, B, b }; };
});

// THE GAPS: two of theirs 8 m apart, 27 m in; a ball to 31 m in, behind the gap, finds that gap; one to a man out past
// the outside one finds the one between him and the touchline too
const doors = await page.evaluate(() => { const S = window.__scene(10, -3.4, 4.6), { T, M, X, Y } = S;
  const at = (u, w) => (T.thruDoors('R', X(u), Y(w)) || []).map(d => [+((d.x - T.FW / 2) / M * S.atk).toFixed(1), +((d.y - T.YC) / M).toFixed(1)]);
  return { gap: at(31, 0), wide: at(31, 8), short: at(25, 0) }; });
info('gaps: behind them ' + JSON.stringify(doors.gap) + '; out past the outside one ' + JSON.stringify(doors.wide) + '; short of them ' + JSON.stringify(doors.short));
ok(doors.gap.length === 1 && doors.gap[0][0] === 27 && doors.gap[0][1] === 0.6, 'a ball in behind them: the gap is between the two, its middle 0.6 m off the middle');
ok(doors.wide.length === 2 && doors.wide[1][1] > 4.6 + 3, '...to a man out past the outside one, the gap between him and the touchline too');
ok(doors.short.length === 0, 'a ball that stops short of their line has no gap to go through');

// THE BEND: a ball 12 m to a spot 31 m in, straight behind the passer's line, the gap's middle 0.6 m to one side of it
// at their line -- 26 degrees of turn to go through it. Curve 10 takes it through the middle; Curve 1 gets 6 degrees of
// turn on it and no further.
const arcs = await page.evaluate(() => { const out = {};
  for(const cv of [10, 1]){ const S = window.__scene(cv, -3.4, 4.6), { T, M, X, Y, b } = S, tx = X(31), ty = Y(0), d = Math.hypot(tx - b.x, ty - b.y);
    const A = T.thruArcs(S.p, tx, ty, d), door = { x: X(27), y: Y(0.6) };
    out[cv] = A.map(a => { let near = 1e9; for(let i = 0; i <= 400; i++){ const pt = T.arcAt(a, i / 400); near = Math.min(near, Math.hypot(pt.x - door.x, pt.y - door.y)); }
      const end = T.arcAt(a, 1); return { deg: +(a.th * 57.3).toFixed(1), near: +(near / M).toFixed(2), end: +(Math.hypot(end.x - tx, end.y - ty) / M).toFixed(3), side: a.side }; });
    out['max' + cv] = +(T.thruArcOf(S.p) * 57.3).toFixed(1); }
  return out; });
info('the bend: Curve 10 (' + arcs.max10 + '° at most): ' + JSON.stringify(arcs[10]) + '; Curve 1 (' + arcs.max1 + '°): ' + JSON.stringify(arcs[1]));
ok(Math.abs(arcs.max10 - 34.4) < 0.2 && Math.abs(arcs.max1 - 5.7) < 0.2, 'as much bend as his Curve gives him: 6 degrees of turn at Curve 1, 34 at 10');
ok(arcs[10].length && arcs[10][0].near < 0.15 && arcs[10][0].deg > 20 && arcs[10][0].deg < 30 && arcs[10][0].end < 0.01, 'Curve 10: bent through the middle of the gap (' + (arcs[10][0] && arcs[10][0].near) + ' m off it, ' + (arcs[10][0] && arcs[10][0].deg) + '° of turn) and on to the spot');
ok(arcs[1].length && arcs[1][0].deg === arcs.max1 && arcs[1][0].near > 0.4 && arcs[1][0].end < 0.01, 'Curve 1: as far that way as he can bend it (' + (arcs[1][0] && arcs[1][0].deg) + '°), ' + (arcs[1][0] && arcs[1][0].near) + ' m short of the middle of the gap');

// STRUCK ON IT: the Curve 10 ball, struck true (no error in its line or weight), to get there in 1.1 s; A and B don't
// touch it. Where it goes against the arc it was chosen on, how near the middle of the gap it passes, how near the spot
// it gets and how hard it's going there; the path a read of it from 0.15 s in has for half a second on (and the same
// for the ball struck straight there, as the game reads any ball)
const flight = (mode) => page.evaluate(mode => new Promise(res => {
  const S = window.__scene(10, -3.4, 4.6), { T, M, X, Y, b, p, q } = S, tx = X(31), ty = Y(0), d = Math.hypot(tx - b.x, ty - b.y);
  const deflect = mode === 'knocked', A = T.thruArcs(p, tx, ty, d)[0];
  { const R = Math.random; Math.random = () => 0.5; try { T.obThruBall(p, q, tx, ty, 1.1, mode === 'straight' ? null : A); } finally { Math.random = R; } }
  const t0 = T.simNow(), door = { x: X(27), y: Y(0.6) }, pts = [];
  const arc = []; for(let i = 0; i <= 600; i++) arc.push(T.arcAt(A, i / 600));
  let off = 0, nearDoor = 1e9, nearEnd = 1e9, spEnd = 0, read = null, readAt = null, still = null, bent = null, kill = null, hd = [];
  (function tick(){
    S.A.x = X(27); S.A.y = Y(-3.4); S.B.x = X(27); S.B.y = Y(4.6); S.A.vx = S.A.vy = S.B.vx = S.B.vy = 0; S.A.noTouchT = S.B.noTouchT = 99;
    q.x = X(-30); q.y = Y(30); q.vx = q.vy = 0;
    const t = T.simNow() - t0, sp = Math.hypot(b.vx, b.vy);
    let m = 1e9; for(const a of arc) m = Math.min(m, Math.hypot(b.x - a.x, b.y - a.y));
    const de = Math.hypot(b.x - tx, b.y - ty); if(de < nearEnd){ nearEnd = de; spEnd = sp; }
    if(de > 1.5 * M) off = Math.max(off, m);
    nearDoor = Math.min(nearDoor, Math.hypot(b.x - door.x, b.y - door.y));
    if(!read && t >= 0.15){ read = T.ballAt(0.5); readAt = t + 0.5; }
    if(read && !still && t >= readAt){ still = Math.hypot(b.x - read.x, b.y - read.y) / M; }
    if(bent === null && t >= 0.5) bent = b.arcK > 0;
    if(deflect && t >= 0.3 && kill === null){ const c = Math.cos(0.35), s = Math.sin(0.35), vx = b.vx; b.vx = vx * c - b.vy * s; b.vy = vx * s + b.vy * c; kill = -1; }
    else if(kill === -1){ kill = b.arcK; }
    else if(kill !== null && kill !== -1) hd.push(Math.atan2(b.vy, b.vx));
    if(t > 2.6 || (t > 0.3 && sp < 20)){
      const r = { off: +(off / M).toFixed(2), nearDoor: +(nearDoor / M).toFixed(2), nearEnd: +(nearEnd / M).toFixed(2), spEnd: +(spEnd / M).toFixed(1), read: still === null ? null : +still.toFixed(2), bent, deg: +(A.th * 57.3).toFixed(1),
        kill, turnAfter: hd.length > 2 ? +(Math.abs(hd[hd.length - 1] - hd[0]) * 57.3).toFixed(2) : null };
      b.ownedBy = null; b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = 0; b.curveSpinT = 0; b.arcK = 0; return res(r); }
    requestAnimationFrame(tick); })(); }), mode);
const F = await flight('arc'), S0 = await flight('straight');
info('struck on it: ' + JSON.stringify(F) + '; struck straight there: ' + JSON.stringify(S0));
ok(F.bent && F.off < 0.25, 'struck on the arc it was chosen on, still bending half a second in: never more than ' + F.off + ' m off it');
ok(F.nearDoor < 0.35, 'through the middle of the gap (' + F.nearDoor + ' m off it)');
ok(F.nearEnd < 0.5 && Math.abs(F.spEnd - S0.spEnd) < 0.6, '...and onto the spot, weighted as the straight ball is (' + F.nearEnd + ' m off it, going ' + F.spEnd + ' m/s; straight ' + S0.spEnd + ')');
ok(F.read !== null && S0.read !== null && F.read < S0.read + 0.1, 'a read of its path reads the bend: half a second on, ' + F.read + ' m out (a straight ball\'s, ' + S0.read + ')');
const D = await flight('knocked');
info('touched on the way: ' + JSON.stringify(D));
ok(D.kill === 0 && D.turnAfter !== null && D.turnAfter < 0.5, 'knocked off its line on the way, it stops bending (turned ' + D.turnAfter + '° after)');

// THE CHOICE: A 6 m off the middle, B 3 m the other way; the runner 1 m inside B and a metre short of them, going in
// behind at 7.5 m/s. The ball straight to the spot in front of him goes a couple of metres inside B; Curve 10 bends it
// away from him, through the gap; Curve 1 can't bend it enough to make a difference -- it's the riskier ball
const choice = await page.evaluate(() => { const out = {};
  for(const cv of [10, 1]){ const S = window.__scene(cv, -6, 3, { u: 26, w: 2, v: 7.5 }), { T, M, p, q } = S;
    const C = T.obCtx(p, S.atk, S.atk > 0 ? T.FW : 0);
    const R = Math.random; Math.random = () => 0.5; let o; try { o = T.obPassOpt(p, q, C); } finally { Math.random = R; }
    const mid = o && o.arc ? T.arcAt(o.arc, 0.5) : null, cy = o ? (S.b.y + o.ty) / 2 : 0;   // (its bow, halfway: + toward B's side)
    out[cv] = o ? { P: +o.P.toFixed(3), arc: o.arc ? +(o.arc.th * 57.3).toFixed(1) : 0, bow: mid ? +((mid.y - cy) / M).toFixed(2) : 0, thru: !!o.thru } : null; }
  return out; });
info('the choice, the ball to the runner: Curve 10 ' + JSON.stringify(choice[10]) + '; Curve 1 ' + JSON.stringify(choice[1]));
ok(choice[10] && choice[10].thru && choice[10].arc > 0 && choice[10].bow < -0.3, 'Curve 10: a ball in behind, bent away from B through the gap (' + (choice[10] && choice[10].arc) + '°, bowed ' + (choice[10] && -choice[10].bow) + ' m away from him off its line)');
ok(choice[10] && (!choice[1] || choice[1].P < choice[10].P - 0.04), 'Curve 1: he can\'t bend it enough, so it\'s the riskier ball (' + (choice[1] ? choice[1].P : 'not on') + ' against ' + (choice[10] && choice[10].P) + ')');

// OUT WIDE: their outside man 20 m off the middle, the runner outside him (24 m off it) going in behind down the line,
// the passer 18 m off it; the ball goes between their man and the touchline, bent away from him, and stays in. Against
// Curve 1, the same ball's chance
const wideP1 = await page.evaluate(() => { const S = window.__scene(1, 6, 20, { u: 26, w: 24, v: 7.5 }), { T, p, q, b, Y } = S; p.y = Y(18); b.y = p.y;
  const C = T.obCtx(p, S.atk, S.atk > 0 ? T.FW : 0); const R = Math.random; Math.random = () => 0.5; let o; try { o = T.obPassOpt(p, q, C); } finally { Math.random = R; }
  return o ? +o.P.toFixed(3) : 0; });
const wide = await page.evaluate(() => new Promise(res => {
  const S = window.__scene(10, 6, 20, { u: 26, w: 24, v: 7.5 }), { T, M, X, Y, p, q, b } = S;
  p.y = Y(18); b.y = p.y;
  const C = T.obCtx(p, S.atk, S.atk > 0 ? T.FW : 0);
  const R = Math.random; Math.random = () => 0.5; let o; try { o = T.obPassOpt(p, q, C); } finally { Math.random = R; }
  if(!o || !o.thru){ return res({ o: null }); }
  { const R = Math.random; Math.random = () => 0.5; try { T.obThruBall(p, q, o.tx, o.ty, o.thru, o.arc); } finally { Math.random = R; } }
  const t0 = T.simNow(), edge = T.FH / 2 / M; let wMax = 0, outside = false;
  (function tick(){ S.A.x = X(27); S.A.y = Y(6); S.B.x = X(27); S.B.y = Y(20); S.A.noTouchT = S.B.noTouchT = 99; q.x = X(-30); q.y = Y(30); q.vx = q.vy = 0;
    const t = T.simNow() - t0, w = (b.y - T.YC) / M, u = (b.x - T.FW / 2) / M * S.atk; wMax = Math.max(wMax, w);
    if(Math.abs(u - 27) < 0.6 && w > 20 + 2.5) outside = true;
    if(t > 2.4 || (t > 0.3 && Math.hypot(b.vx, b.vy) < 20)){ const r = { arc: o.arc ? +(o.arc.th * 57.3).toFixed(1) : 0, side: o.arc ? o.arc.side : 0, wMax: +wMax.toFixed(1), edge: +edge.toFixed(1), outside, P: +o.P.toFixed(3) };
      b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = 0; b.curveSpinT = 0; b.arcK = 0; return res(r); }
    requestAnimationFrame(tick); })(); }));
info('out wide: ' + JSON.stringify(wide));
ok(wide.arc > 0 && wide.outside, 'out wide, a ball in behind goes between their outside man and the touchline, bent away from him (' + wide.arc + '°)');
ok(wideP1 < wide.P - 0.15, '...and it\'s on because he can bend it: the same ball at Curve 1 has ' + wideP1 + ' of getting there to his ' + wide.P);
ok(wide.wMax < wide.edge - 1, '...and stays in (' + wide.wMax + ' m off the middle at most; the line\'s at ' + wide.edge + ')');

await browser.close();
process.exit(rep.finish() ? 1 : 0);

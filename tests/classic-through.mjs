// FOOTBALL CLASSIC, THE THROUGH BALL: along the grass, knee high at most (yours used to be struck like a pass, up to
// 2.5 m high and over everyone's heads), struck to get there when the runner does -- and threaded: it goes into the gap
// and the way through their men that gives them least chance, the spot moving up to 1.5 m across, the ball bent round a
// man and curling back in to the runner by as much as the passer's Curve gives him (23 degrees over the way at Curve 10,
// 2 at 1). A man standing in its way still gets a foot to it. On a copy of the game that lets the test set the scene:
// our passer on the ball, our runner going, the men of theirs that matter placed off the ball's line, everyone else out
// of the way; the ball played as yours is (a drag the way he's running), struck true (no error in its line).
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, simNow:()=>simNow, gkHold:()=>gkHold, P, FW, FH, YC, MK, atkOf, '
  + 'thruBall, passSolve, setControlled, live:()=>restartT<=0&&scoredT<=0&&offsideT<=0, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
patch('  function checkOffsideTouch(t){\n', '  function checkOffsideTouch(t){\n    if(window.__noOffside) return false;\n');   // (the runners are level with their line)
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');   // (the runner plays himself)
patch('  function thruAim(team,q,tx,ty,max,weigh){\n', '  function thruAim(team,q,tx,ty,max,weigh){\n    window.__aimIn={x:tx,y:ty};\n');   // (the spot meant, before it moves into the gap)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-thru-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);
await page.evaluate(() => { window.__noOffside = true; window.__aiAll = true; });

// THE SCENE: our passer on the ball (`side` px across from the middle), our runner `ahead` px up the pitch from him, in
// the middle, running at `run` degrees off straight (+: to his left) at 190 px/s; the men of theirs in `men` placed off
// the line to the spot he means (f: how far along it, o: px off it, + to its left; iq: their Def IQ, Interceptions and
// Tackling), everyone else parked out of the way.
// Watch until somebody has it (or 4 s): how high it went, how near it came to each of theirs, how far it swung off its
// line (the line to the spot it was played to), where it got to when it was as far along as the spot and which way it
// was going then (degrees off its line, + towards the way he's running), and how fast it was going when it was taken
// and how far from the spot.
const scene = (o) => page.evaluate(({ ahead, run, curve, men, side = 0 }) => new Promise(res => {
  const T = window.__T, atk = T.atkOf('G'), G = T.players().filter(q => q.team === 'G'), O = T.players().filter(q => q.team === 'R'), b = T.ball();
  T.freeze();
  const X = u => atk > 0 ? u : T.FW - u, u0 = T.FW * 0.4, passer = G.find(q => q.role === 'MID') || G[1], runner = G.find(q => q.role === 'ATT' && q !== passer) || G[G.length - 1];
  const park = () => { G.forEach((q, i) => { if(q !== passer && q !== runner){ q.x = X(60 + i * 20); q.y = T.FH - 40; q.vx = q.vy = 0; } });
    O.forEach((q, i) => { if(i >= men.length){ q.x = X(T.FW * 0.25 + i * 20); q.y = 40; q.vx = q.vy = 0; } }); for(const k of T.keepers()) k.y = 30; };
  park();
  for(const q of [passer, runner]) q.stats = Object.assign({}, q.stats, { curve, passAcc: 10, offIQ: 10, speed: 6 });
  passer.x = X(u0); passer.y = T.YC + side; passer.vx = passer.vy = 0; passer.facing = { x: atk, y: 0 }; passer.state = 'normal';
  const ra = run / 57.3; runner.x = X(u0 + ahead); runner.y = T.YC; runner.vx = atk * Math.cos(ra) * 190; runner.vy = Math.sin(ra) * 190 * atk; runner.state = 'normal';
  b.ownedBy = null; b.dribbler = null; b.x = passer.x + atk * 14; b.y = passer.y; b.z = 0; b.vx = b.vy = b.vz = 0; b.thru = null; b.curveSpinT = 0;
  // the spot he means: the way he's running, as far ahead as thruBall leads him (worked out the same way, then read back)
  const lead = Math.max(130, Math.min(230, 120 + ahead * 0.15)) * T.P.thruLead.val, L0 = { x: runner.x + Math.cos(ra) * atk * lead, y: runner.y + Math.sin(ra) * atk * lead };
  const d0 = Math.hypot(L0.x - b.x, L0.y - b.y), cx = (L0.x - b.x) / d0, cy = (L0.y - b.y) / d0;
  const opp = men.map((m, i) => { const q = O[i]; q.x = b.x + cx * d0 * m.f - cy * m.o; q.y = b.y + cy * d0 * m.f + cx * m.o; q.vx = q.vy = 0; q.state = 'normal'; q.noTouchT = 0;
    q.stats = Object.assign({}, q.stats, { defIQ: m.iq, interceptions: m.iq, tackle: m.iq, speed: 5 }); return q; });
  T.setControlled(passer);
  const R = Math.random; Math.random = () => 0.5; window.__aimIn = null;
  try { T.thruBall(passer, runner, { dx: atk * Math.cos(ra), dy: Math.sin(ra) }, false); } finally { Math.random = R; }
  const meant = window.__aimIn, L = { x: b.thru.x, y: b.thru.y }, x0 = b.x, y0 = b.y, d = Math.hypot(L.x - x0, L.y - y0), ux = (L.x - x0) / d, uy = (L.y - y0) / d, t0 = T.simNow();
  const sideOfRun = Math.sign(ux * runner.vy - uy * runner.vx) || 1;
  let top = 0, at = null, near = opp.map(() => 1e9), swing = 0, v = 0, took = null, untouched = true;
  (function tick(){ const t = T.simNow() - t0; top = Math.max(top, b.z);
    opp.forEach((q, i) => { if(!b.ownedBy) near[i] = Math.min(near[i], Math.hypot(b.x - q.x, b.y - q.y)); });
    const s = (b.x - x0) * ux + (b.y - y0) * uy;
    if(b.lastTouch !== 'G' || b.intendedRcv !== runner || Math.hypot(b.x - runner.x, b.y - runner.y) < 45 || opp.some(q => Math.hypot(b.x - q.x, b.y - q.y) < 30)) untouched = false;   // (at a man's feet: its swing is over)
    if(!b.ownedBy){ v = Math.hypot(b.vx, b.vy); if(s < d && untouched) swing = Math.max(swing, Math.abs((b.x - x0) * -uy + (b.y - y0) * ux)); }
    else if(!took) took = { v: Math.round(v), off: Math.round(Math.hypot(b.x - L.x, b.y - L.y)) };
    if(!at && !b.ownedBy && s >= d - 3) at = { t, off: Math.hypot(b.x - L.x, b.y - L.y), hd: Math.atan2(ux * b.vy - uy * b.vx, ux * b.vx + uy * b.vy) * 57.3 * sideOfRun, v: Math.hypot(b.vx, b.vy) };
    let end = b.ownedBy ? (b.ownedBy.team === 'G' ? 'ours' : 'theirs') : T.gkHold() ? 'theirs' : (!T.live() || t > 4) ? 'none' : null;
    if(!end) return requestAnimationFrame(tick);
    const out = { end, top: +top.toFixed(1), d: Math.round(d), swing: +swing.toFixed(1), took, moved: meant ? Math.round(Math.hypot(L.x - meant.x, L.y - meant.y)) : -1, at, near: near.map(Math.round),
      straightNear: opp.map(q => Math.round(Math.abs((q.x - x0) * -uy + (q.y - y0) * ux))), passApex: (() => { const sol = T.passSolve(d); return Math.round(sol.vz * sol.vz / 1040); })() };
    b.ownedBy = null; b.thru = null; b.x = T.FW / 2; b.y = T.YC; b.vx = b.vy = b.vz = 0; b.z = 0; b.curveSpinT = 0; res(out); })(); }), o);

// LOW, AND WEIGHTED FOR THE RUNNER: nobody of theirs near, played in from 9 m across -- 15, 25 and 32 m
const free = [];
for(const ahead of [190, 380, 520]) free.push(await scene({ ahead, run: 0, curve: 10, men: [], side: 200 }));
info('free: ' + JSON.stringify(free.map(r => ({ m: Math.round(r.d / 22.5), top: r.top, wasApex: r.passApex, end: r.end, took: r.took }))));
ok(free.every(r => r.top <= 12), 'a through ball goes along the grass, knee high at most: ' + free.map(r => Math.round(r.d / 22.5) + ' m ' + Math.round(r.top) + ' px').join(', ') + ' (struck as a pass it went up ' + free.map(r => r.passApex).join(', ') + ' px)');
ok(free.every(r => r.end === 'ours' && r.took && r.took.v >= 60 && r.took.v <= 500 && r.took.off <= 90), 'struck to get to the spot as he does: he has it ' + free.map(r => r.took ? Math.round(r.took.off / 22.5 * 10) / 10 + ' m' : '-').join(', ') + ' from it, still rolling and never too hot (' + free.map(r => r.took ? r.took.v : '-').join(', ') + ' px/s)');

// THROUGH THE GAP: one of theirs 1.2 m off its line three quarters of the way, another 10 m off the other side -- it
// goes through the gap between them (the spot moving over, the ball bent away from the near man), and he has it
const gap = {}; for(const curve of [1, 10]) gap[curve] = await scene({ ahead: 380, run: 0, curve, men: [{ f: 0.75, o: 28, iq: 5 }, { f: 0.75, o: -230, iq: 5 }] });
info('gap: ' + JSON.stringify(gap));
ok([1, 10].every(c => gap[c].near[0] >= gap[c].straightNear[0] + 15 && gap[c].moved > 0 && gap[c].moved <= 35 && gap[c].end === 'ours'),
  'through the gap: it goes ' + [1, 10].map(c => gap[c].near[0] + ' px').join(' / ') + ' from the near man (straight to the spot meant: ' + gap[1].straightNear[0] + '), the spot moving ' + [1, 10].map(c => gap[c].moved).join(' / ') + ' px across (Curve 1 / 10), and he has it');

// ROUND HIM: one of theirs (slow to read it) right on its line halfway -- it goes round him (the spot moving over, the
// ball bent out round him and back in, as far as the passer's Curve lets it bend), and he has it
const round = {}; for(const curve of [1, 10]) round[curve] = await scene({ ahead: 380, run: 0, curve, men: [{ f: 0.5, o: 0, iq: 1 }] });
info('round: ' + JSON.stringify(round));
ok([1, 10].every(c => round[c].near[0] >= round[c].straightNear[0] + 5 && round[c].end === 'ours') && round[10].swing >= 7 && round[10].swing >= round[1].swing + 5,
  'round a man on its line: ' + [1, 10].map(c => round[c].near[0] + ' px').join(' / ') + ' off him (Curve 1 / 10), Curve 10 bending it ' + round[10].swing + ' px off its line and back (Curve 1: ' + round[1].swing + '), and he has it');

// CURLING BACK INTO HIS PATH: him running across its line, nobody near -- at Curve 10 it comes to him turned his way;
// at Curve 1 hardly
const back = {}; for(const curve of [1, 10]) back[curve] = await scene({ ahead: 380, run: 45, curve, men: [] });
info('back: ' + JSON.stringify(back));
ok(back[10].at && back[10].at.hd >= 8 && back[10].at.hd <= 14 && back[1].at && Math.abs(back[1].at.hd) <= 3, 'curling back in to a man running across: turned ' + (back[10].at ? Math.round(back[10].at.hd) : '-') + '° his way at Curve 10, ' + (back[1].at ? Math.round(back[1].at.hd) : '-') + '° at Curve 1');

// NOT A SURE THING: one of theirs who reads it well, right in its way a third of the way along -- neither the gap nor
// the bend gets it past him, and low as it is, he gets a foot to it
const cut = await scene({ ahead: 380, run: 0, curve: 10, men: [{ f: 0.35, o: 0, iq: 10 }] });
info('cut: ' + JSON.stringify(cut));
ok(cut.end === 'theirs' && cut.top <= 12, 'a man standing in its way still cuts it out (' + cut.end + ', ' + cut.near[0] + ' px off him)');

process.exitCode = rep.finish();
await browser.close();

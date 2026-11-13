// FOOTBALL CLASSIC, PRESSURE AND COMPOSURE (v209). Pressure is one number, 0 to 1, for how hemmed in a man on the ball
// is: every man of theirs near him, the nearer the more, as if nearer still the faster he's closing (a sprint at him is
// more than a man stood there, and one going away no more), and more of them more pressure -- less and less for each one
// more, never past full. Every touch, pass, cross, dribble and shot reads it. Composure goes by the action, wherever he
// is: Composure in traffic for the ordinary things (his first touch, a pass, his touches running with it), Final third
// composure for the final ball into a scoring position (a pass or a cross into their box, or to where a shot's worth
// 0.05 or more) and every shot. Neither changes what he decides. Compared at 1, 5 and 10, everything else level.
// On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, MK, PA_D, atkOf, '
  + 'pressureOn, poiseLoss, composureOf, finalBall, passSpray, crossSpray, touchQuality, runTouch, own, shootAt, obCtx, obShotOpt, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-pressure-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);

// ===== THE PRESSURE ON HIM =====
// a man in midfield, everyone else well away; then one of theirs (or more) where the scene puts them
const pr = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), p = T.players().find(q => q.team === 'G' && q !== T.controlled()), opp = T.players().filter(q => q.team !== 'G' && !q.isGK), K = T.keepers();
  T.freeze();
  const clear = () => { for(const q of T.players()) if(q !== p){ q.x = atk > 0 ? 60 : T.FW - 60; q.y = 40; q.vx = q.vy = 0; q.state = 'normal'; } for(const k of K){ k.x = k.side < 0 ? 26 : T.FW - 26; k.y = T.YC; k.vx = k.vy = 0; } };
  p.x = T.FW / 2; p.y = T.YC; p.vx = p.vy = 0;
  const at = (o, m, a) => { o.x = p.x + Math.cos(a) * m * T.MK; o.y = p.y + Math.sin(a) * m * T.MK; };
  const r2 = v => Math.round(v * 100) / 100, out = { one: {}, closing: {}, away: {}, ring: {} };
  for(const m of [1.6, 3, 5, 7]){ clear(); const o = opp[0]; at(o, m, 0); out.one[m] = r2(T.pressureOn(p));
    o.vx = -200; out.closing[m] = r2(T.pressureOn(p)); o.vx = 200; out.away[m] = r2(T.pressureOn(p)); o.vx = 0; }
  clear(); const o = opp[0]; at(o, 3, 0); o.vx = -2000; out.rocket = r2(T.pressureOn(p)); o.vx = 0;   // (however fast he comes)
  for(const n of [1, 2, 3, 4]){ clear(); for(let i = 0; i < n; i++) at(opp[i], 3, i * Math.PI * 2 / n); out.ring[n] = r2(T.pressureOn(p)); }
  clear(); for(let i = 0; i < 6; i++) at(opp[i], 1.2, i); out.six = r2(T.pressureOn(p));
  clear(); at(opp[0], 3, 0); at(opp[1], 6.5, 2); out.nearFar = r2(T.pressureOn(p));
  clear(); at(opp[0], 2, 0); opp[0].state = 'getup'; out.down = r2(T.pressureOn(p)); opp[0].state = 'normal';
  clear(); return out; });
info('pressure (1 = full): one man stood off him ' + JSON.stringify(pr.one) + ', running at him at 8 m/s ' + JSON.stringify(pr.closing) + ', going away ' + JSON.stringify(pr.away) + '; men round him at 3 m ' + JSON.stringify(pr.ring) + '; six right on him ' + pr.six);
ok(pr.one[1.6] === 1 && pr.one[3] > pr.one[5] && pr.one[5] > pr.one[7] && pr.one[7] <= 0.05, 'one man of theirs: full right on him (1.6 m), less the further off he is (' + pr.one[3] + ' at 3 m, ' + pr.one[5] + ' at 5 m), none from 7 m');
ok(pr.closing[5] >= pr.one[5] + 0.25 && pr.closing[7] >= pr.one[7] + 0.25 && [1.6, 3, 5, 7].every(m => pr.away[m] === pr.one[m]),
  'the same man running at him is more pressure than one stood there (' + pr.closing[5] + ' at 5 m, ' + pr.closing[7] + ' at 7 m), going away no more (' + pr.away[5] + ')');
ok(pr.rocket === pr.closing[3] && pr.rocket < 1.01 && pr.closing[7] <= pr.one[5] + 0.01, '...and only so much more, however fast he comes: as if 1.6 m nearer at most (counted once, not again for his pace)');
ok(pr.ring[2] > pr.ring[1] + 0.05 && pr.ring[3] > pr.ring[2] && pr.ring[4] > pr.ring[3] && pr.ring[2] - pr.ring[1] > pr.ring[3] - pr.ring[2] && pr.ring[3] - pr.ring[2] >= pr.ring[4] - pr.ring[3],
  'more men round him are more pressure, less and less for each one more: ' + [1, 2, 3, 4].map(n => n + ' at 3 m ' + pr.ring[n]).join(', '));
ok(pr.six <= 1 && pr.six >= 0.99 && pr.nearFar > pr.one[3] && pr.nearFar < pr.ring[2], '...never more than full (six right on him: ' + pr.six + '), and a man further off adds less than one as near (' + pr.nearFar + ')');
ok(pr.down === 0, 'a man of theirs on the ground is no pressure');

// ===== COMPOSURE BY THE ACTION =====
// a man with a man of theirs right on him (full pressure), deep in their half or in his own: his poise lost (pressure,
// less what his composure shrugs off) on an ordinary pass, a final ball into their box, a cross into it and a shot --
// with Composure in traffic 9 and Final third composure 2, and the other way round
const cmp = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), p = T.players().find(q => q.team === 'G' && q !== T.controlled()), o = T.players().find(q => q.team !== 'G' && !q.isGK), keep = p.stats, out = {};
  T.freeze(); for(const q of T.players()) if(q !== p && q !== o){ q.x = T.FW / 2; q.y = 30; q.vx = q.vy = 0; }
  const goal = atk > 0 ? T.FW : 0, box = { x: goal - atk * 10 * T.MK, y: T.YC }, mid = { x: T.FW / 2, y: T.YC - 200 }, wide = { x: goal - atk * 12 * T.MK, y: T.YC + 30 * T.MK };
  for(const [tc, fc] of [[9, 2], [2, 9]]) for(const [where, u] of [['own', 0.3], ['theirs', 0.85]]){
    p.stats = Object.assign({}, keep, { composure: tc, compFinal: fc }); p.x = atk > 0 ? T.FW * u : T.FW * (1 - u); p.y = T.YC; o.x = p.x + atk * 30; o.y = p.y; o.vx = o.vy = 0;
    const pl = k => Math.round(T.poiseLoss(p, k) * 100) / 100;
    out[tc + '/' + fc + ' ' + where] = { pass: Math.round(T.poiseLoss(p, T.finalBall(p, mid) ? 'final' : 'traffic') * 100) / 100, final: Math.round(T.poiseLoss(p, T.finalBall(p, box) ? 'final' : 'traffic') * 100) / 100,
      finalBox: T.finalBall(p, box), midFinal: T.finalBall(p, mid), wideFinal: T.finalBall(p, wide), shot: pl('final') }; }
  p.stats = keep; return out; });
info('poise lost with a man right on him (Composure in traffic / Final third composure): ' + JSON.stringify(cmp));
const A = cmp['9/2 theirs'], B = cmp['2/9 theirs'], Ao = cmp['9/2 own'], Bo = cmp['2/9 own'];
ok(A.finalBox && !A.midFinal && !A.wideFinal, 'a pass or a cross into their box is a final ball; one to midfield, or out wide past their box, isn\'t');
ok(A.pass === 0.2 && Ao.pass === 0.2 && B.pass === 0.9 && Bo.pass === 0.9, 'an ordinary pass goes by Composure in traffic wherever he is: deep in their half as in his own (0.2 lost at 9, 0.9 at 2) -- v163-v208 it was the final third\'s up there');
ok(A.final === 0.9 && A.shot === 0.9 && B.final === 0.2 && B.shot === 0.2 && Ao.shot === 0.9, 'the final ball into their box and every shot go by Final third composure, from anywhere (0.9 lost at 2, 0.2 at 9; a shot from his own half too)');

// THE SPRAY IT MAKES: passes and crosses, mean degrees off line, a man right on him or nobody near, by the composure
// each goes by (1, 5, 10); and a shot's line off where it's aimed
const spray = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), p = T.players().find(q => q.team === 'G' && q !== T.controlled()), o = T.players().find(q => q.team !== 'G' && !q.isGK), keep = p.stats, out = {}, N = 3000;
  T.freeze(); for(const q of T.players()) if(q !== p && q !== o){ q.x = T.FW / 2; q.y = 30; q.vx = q.vy = 0; }
  const goal = atk > 0 ? T.FW : 0; p.x = goal - atk * 30 * T.MK; p.y = T.YC - 60; p.vx = p.vy = 0;
  const box = { x: goal - atk * 9 * T.MK, y: T.YC }, back = { x: p.x - atk * 15 * T.MK, y: p.y - 100 };
  const deg = f => { let s = 0; for(let i = 0; i < N; i++) s += Math.abs(f()); return Math.round(s / N * 180 / Math.PI * 100) / 100; };
  for(const press of [false, true]) for(const c of [1, 5, 10]){
    o.x = press ? p.x + atk * 30 : 60; o.y = press ? p.y : 30;
    p.stats = Object.assign({}, keep, { composure: c, compFinal: 5.5, passAcc: 5.5, longPass: 5.5, crossing: 5.5 }); const ord = deg(() => T.passSpray(15 * T.MK, p, undefined, back));
    p.stats = Object.assign({}, keep, { composure: 5.5, compFinal: c, passAcc: 5.5, longPass: 5.5, crossing: 5.5 }); const fin = deg(() => T.passSpray(15 * T.MK, p, undefined, box)), cr = deg(() => T.crossSpray(p, 0, box));
    out[(press ? 'pressed ' : 'free ') + c] = { ord, fin, cr }; }
  p.stats = keep; o.x = 60; o.y = 30; return out; });
info('spray, mean degrees off line (an ordinary 15 m pass back, by Composure in traffic; one into their box and a cross into it, by Final third composure): ' + JSON.stringify(spray));
const sp = (k, c) => spray[k + ' ' + c];
ok(['ord', 'fin', 'cr'].every(k => Math.abs(sp('free', 1)[k] - sp('free', 10)[k]) <= 0.05 * sp('free', 5)[k]), 'with nobody near, composure makes no difference to a pass or a cross (within the draw: ' + ['ord', 'fin', 'cr'].map(k => sp('free', 1)[k] + '/' + sp('free', 10)[k]).join(', ') + ')');
ok(['ord', 'fin', 'cr'].every(k => sp('pressed', 1)[k] > sp('pressed', 5)[k] && sp('pressed', 5)[k] > sp('pressed', 10)[k] && sp('pressed', 1)[k] > sp('free', 1)[k] * (k === 'cr' ? 1.35 : 1.6) && sp('pressed', 10)[k] < sp('free', 10)[k] * 1.15),   // (a cross half as much as a pass: CROSS_POISE)
  'pressed, the spray widens by as little as the composure it goes by lets it (a cross half as much as a pass): an ordinary pass ' + [1, 5, 10].map(c => sp('pressed', c).ord).join(' / ') + '°, a final ball ' + [1, 5, 10].map(c => sp('pressed', c).fin).join(' / ') + '°, a cross ' + [1, 5, 10].map(c => sp('pressed', c).cr).join(' / ') + '° at 1 / 5 / 10 (nobody near: ' + sp('free', 1).ord + ', ' + sp('free', 1).fin + ', ' + sp('free', 1).cr + ')');

// A SHOT: yours, 20 m out at a corner, a man on you -- how far either side of its line it goes (the spread), by your
// Final third composure (your Composure in traffic counts for nothing)
const shots = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), p = T.controlled(), o = T.players().find(q => q.team !== 'G' && !q.isGK), b = T.ball(), keep = p.stats, out = {};
  T.freeze(); for(const q of T.players()) if(q !== p && q !== o){ q.x = T.FW / 2; q.y = 30; q.vx = q.vy = 0; }
  const goal = atk > 0 ? T.FW : 0;
  for(const [tc, fc] of [[5.5, 1], [5.5, 10], [1, 5.5], [10, 5.5]]){
    p.stats = Object.assign({}, keep, { composure: tc, compFinal: fc, shotAcc: 5.5, shotPower: 5.5, longShots: 5.5, curve: 1 }); const as = [], N = 800;
    for(let i = 0; i < N; i++){ T.freeze(); p.x = goal - atk * 20 * T.MK; p.y = T.YC; p.vx = p.vy = 0; p.facing = { x: atk, y: 0 }; o.x = p.x + atk * 30; o.y = p.y + 8; o.vx = o.vy = 0;
      b.x = p.x + atk * 20; b.y = p.y; b.z = 0; b.vx = b.vy = b.vz = 0; T.own(p, 20);
      T.shootAt(p, atk, 1, 0.8, 0); as.push(Math.atan2(b.vy, b.vx * atk)); }
    const m = as.reduce((a, v) => a + v, 0) / N; out[tc + '/' + fc] = Math.round(Math.sqrt(as.reduce((a, v) => a + (v - m) * (v - m), 0) / N) * 180 / Math.PI * 100) / 100; }
  p.stats = keep; o.x = 60; o.y = 30; b.ownedBy = null; b.vx = b.vy = 0; return out; });
info('your shot at a corner from 20 m with a man on you, its spread either side of its line in degrees (Composure in traffic / Final third composure): ' + JSON.stringify(shots));
ok(shots['5.5/1'] > shots['5.5/10'] * 1.1 && Math.abs(shots['1/5.5'] - shots['10/5.5']) <= 0.07 * shots['1/5.5'],
  'a shot under pressure goes truer the better your Final third composure (spread ' + shots['5.5/1'] + '° at 1, ' + shots['5.5/10'] + '° at 10); your Composure in traffic doesn\'t come into it (' + shots['1/5.5'] + '°, ' + shots['10/5.5'] + '°)');

// THE FIRST TOUCH, AND RUNNING WITH IT, deep in their half with a man on him: Composure in traffic (v163-v208: the final
// third's there)
const touch = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('G'), p = T.players().find(q => q.team === 'G' && q !== T.controlled()), o = T.players().find(q => q.team !== 'G' && !q.isGK), b = T.ball(), keep = p.stats, out = {}, N = 1500;
  T.freeze(); for(const q of T.players()) if(q !== p && q !== o){ q.x = T.FW / 2; q.y = 30; q.vx = q.vy = 0; }
  p.x = atk > 0 ? T.FW * 0.85 : T.FW * 0.15; p.y = T.YC; p.vx = p.vy = 0; p.facing = { x: -atk, y: 0 }; o.x = p.x + atk * 35; o.y = p.y + 10; o.vx = o.vy = 0;
  b.ownedBy = null; b.x = p.x - atk * 25; b.y = p.y; b.z = 0; b.vx = atk * 400; b.vy = 0; b.passFrom = null;
  for(const [tc, fc] of [[9, 2], [2, 9]]){ p.stats = Object.assign({}, keep, { composure: tc, compFinal: fc, ballControl: 5.5 }); let s = 0; for(let i = 0; i < N; i++) s += T.touchQuality(p, false); out['touch ' + tc + '/' + fc] = Math.round(s / N * 1000) / 1000; }
  // his touches running with it: how uneven (the spread of how far each goes), with and without the man on him
  const knocks = (tc, press) => { p.stats = Object.assign({}, keep, { composure: tc, dribbling: 5.5, speed: 6 }); o.x = press ? p.x + atk * 35 : 60; o.y = press ? p.y + 10 : 30;
    b.x = p.x + atk * 25; b.y = p.y; b.vx = b.vy = 0; T.own(p, 25); p.vx = atk * 120; p.vy = 0; p.carryAngle = atk > 0 ? 0 : Math.PI; const xs = [];
    for(let i = 0; i < N; i++){ p.touchKnock = 0; p.touchOff = 0; p.touchSp = 120; T.runTouch(p, 120, 0); xs.push(p.touchKnock); if(!b.ownedBy) T.own(p, 25); }
    const m = xs.reduce((a, v) => a + v, 0) / N; return Math.round(Math.sqrt(xs.reduce((a, v) => a + (v - m) * (v - m), 0) / N) / m * 1000) / 1000; };
  out.dribFree1 = knocks(1, false); out.dribPress1 = knocks(1, true); out.dribPress10 = knocks(10, true);
  p.stats = keep; o.x = 60; o.y = 30; b.ownedBy = null; return out; });
info('deep in their half with a man on him: ' + JSON.stringify(touch));
ok(touch['touch 9/2'] > touch['touch 2/9'] + 0.08, 'his first touch deep in their half under pressure goes by Composure in traffic: ' + touch['touch 9/2'] + ' at traffic 9 (final third 2), ' + touch['touch 2/9'] + ' the other way round');
ok(touch.dribPress1 > touch.dribFree1 * 1.25 && touch.dribPress1 > touch.dribPress10 * 1.25, 'running with it under pressure his touches are less even, unless he\'s composed: their spread ' + touch.dribPress1 + ' of a touch at Composure in traffic 1 with a man on him, ' + touch.dribFree1 + ' with nobody near, ' + touch.dribPress10 + ' at 10');

// COMPOSURE DOESN'T DECIDE: the computer's man 14 m out with a clear sight of goal and nobody on him -- how keen he is on
// the shot is the same at Final third composure 1 and 10 (v163-v208: 0.94 to 1.06)
const keen = await page.evaluate(() => {
  const T = window.__T, atk = T.atkOf('R'), p = T.players().find(q => q.team === 'R' && !q.isGK), b = T.ball(), keep = p.stats, out = {};
  T.freeze(); for(const q of T.players()) if(q !== p){ q.x = T.FW / 2; q.y = 30; q.vx = q.vy = 0; }
  const goal = atk > 0 ? T.FW : 0; p.x = goal - atk * 14 * T.MK; p.y = T.YC + 20; p.vx = p.vy = 0; p.facing = { x: atk, y: 0 };
  b.x = p.x + atk * 20; b.y = p.y; b.z = 0; b.vx = b.vy = 0; T.own(p, 20);
  for(const fc of [1, 10]){ p.stats = Object.assign({}, keep, { compFinal: fc, shotAcc: 5.5 }); const C = T.obCtx(p, atk, goal), o = T.obShotOpt(p, C); out[fc] = o ? Math.round(o.P * 1000) / 1000 : null; }
  p.stats = keep; b.ownedBy = null; return out; });
ok(keen[1] != null && keen[1] === keen[10], 'composure doesn\'t change what he decides: the computer rates the same shot the same at Final third composure 1 and 10 (' + keen[1] + ', ' + keen[10] + ')');

process.exitCode = rep.finish();
await browser.close();

// FOOTBALL CLASSIC, CLEARANCES AND CROSSES (v85). A HEADED CLEARANCE is a forehead, not a boot: from 8 m out in front
// of his own goal it stops some 13-24 m away by the man's Heading -- the computer's, and yours (J) off a cross coming
// across at 700 px/s -- and never as far as a kick. A CLEARANCE BY FOOT carries to about halfway: short of it for a
// man rated low in Shot power and Def IQ, past it for one rated high. A KEEPER COMING FOR A CROSS gets it: a ball at
// his hands as he gets under it is his (it used to drop behind him -- his read of where it would come down ran out a
// moment before he got there, and he turned back for his line); over a run of crosses toward 7 m out, one of theirs
// attacking each, he never comes for one and concedes, and gets the ones he comes for; and a ball that drops in his
// six-yard box he comes for, and has. On a copy of the game that lets the test set the scene: everyone else held out
// of the way, the clock held (no half time in the middle of it).
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, setControlled, headClear, clearBall, tryDefHeaderContact, own, pressClear, clearRelease, charge:()=>clearCharge, '
  + 'crossClaim, aiCross, reachOf, dht:v=>{ if(v!=null) defHeaderT=v; return defHeaderT; }, FW, FH, YC, MK, PLAYER_H, atkOf, simNow:()=>simNow, gkHold:()=>gkHold, '
  + 'drop:()=>{ gkHold=null; }, score:()=>[scoreG,scoreR], stopped:()=>restartT>0||scoredT>0, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; matchClock=0; }};\n  const LAB_TITLE=');
patch('  function keeperPunch(kp){\n', '  function keeperPunch(kp){\n    window.__punch=(window.__punch||0)+1;\n');
patch('      if(p===controlled){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }', '      if(p===controlled&&!window.__aiAll){ if(!skillStep(p,dt)) stepOutfield(p,hi.ix,hi.iy,dt); }');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-clr-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ fastFrames: true, url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);

// HOW FAR A CLEARANCE GOES: one of Red's defenders 8 m out in front of his goal, rated `v` in Heading, Def IQ and Shot
// power, the ball coming across him at 700 px/s; the computer's header (headClear), yours (J: tryDefHeaderContact),
// and by foot (clearBall). Where it stops, in metres from where it was struck (the median of N).
const clear = (kind, v, N) => page.evaluate(({ kind, v, N }) => new Promise(res => {
  const T = window.__T, b = T.ball(), p = T.players().find(q => q.team === 'R' && q.role === 'DEF'), a = T.atkOf('R'), gx = a > 0 ? 0 : T.FW;
  const others = T.players().filter(q => q !== p);
  const park = () => { others.forEach((q, i) => { q.x = T.FW / 2 + (i % 2 ? 1 : -1) * 6 * T.MK; q.y = 20 + 6 * i; q.vx = q.vy = 0; }); for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; } };
  const keep = p.stats; p.stats = Object.assign({}, keep, { heading: v, defIQ: v, shotPower: v });
  window.__aiAll = true; const out = []; let i = 0;
  const one = () => { if(i++ >= N){ p.stats = keep; window.__aiAll = false; out.sort((x, y) => x - y); return res(+out[Math.floor(out.length / 2)].toFixed(1)); }
    T.freeze(); park(); p.x = gx + a * 8 * T.MK; p.y = T.YC; p.vx = p.vy = 0; p.z = 0; p.vz = 0; p.state = 'normal'; p.noTouchT = 0;
    Object.assign(b, { ownedBy: null, dribbler: null, x: p.x, y: p.y, z: kind === 'foot' ? 0 : T.PLAYER_H * 0.95, vx: 0, vy: 700, vz: 0, lastTouch: 'G', crossT: 0.5, crossBy: 'G', shotT: 0 });
    if(kind === 'head') T.headClear(p);
    else if(kind === 'yours'){ T.setControlled(p); T.dht(1); T.tryDefHeaderContact(); if(T.dht() !== 0) return res(null); }
    else { b.vx = b.vy = 0; b.ownedBy = p; T.clearBall(p, false); }
    const x0 = p.x, y0 = p.y; p.x = gx + a * 3 * T.MK; const t0 = T.simNow();
    (function tick(){ park(); p.x = gx + a * 3 * T.MK; p.y = T.YC; p.vx = p.vy = 0;
      const d = Math.hypot(b.x - x0, b.y - y0) / T.MK;
      if((Math.hypot(b.vx, b.vy) < 15 && b.z <= 1) || T.stopped() || T.simNow() - t0 > 8){ out.push(d); return one(); }
      requestAnimationFrame(tick); })(); };
  one(); }), { kind, v, N });

const D = {};
for(const [lvl, v] of [['low', 3], ['mid', 5.5], ['high', 9]]) for(const kind of ['head', 'yours', 'foot']) D[kind + ':' + lvl] = await clear(kind, v, 5);
const halfway = await page.evaluate(() => { const T = window.__T; return +((T.FW / 2) / T.MK - 8).toFixed(1); });
info('where a clearance from 8 m out stops (m; halfway is ' + halfway + ' m on): ' + JSON.stringify(D));
ok(D['yours:low'] !== null && ['low', 'mid', 'high'].every(l => D['head:' + l] >= 9 && D['head:' + l] <= 25 && D['yours:' + l] >= 9 && D['yours:' + l] <= 27),
  'a headed clearance stops some 9-27 m away (the computer\'s ' + ['low', 'mid', 'high'].map(l => D['head:' + l]).join(' / ') + ' m, yours ' + ['low', 'mid', 'high'].map(l => D['yours:' + l]).join(' / ') + ' m at Heading 3 / 5.5 / 9)');
ok(D['head:low'] < D['head:mid'] && D['head:mid'] < D['head:high'] && D['yours:low'] < D['yours:high'], 'the better his Heading, the further it goes');
ok(['low', 'mid', 'high'].every(l => D['foot:' + l] > D['head:' + l] + 10 && D['foot:' + l] > D['yours:' + l] + 8), 'a header never goes as far as a kick');
ok(Math.abs(D['foot:mid'] - halfway) < 6 && D['foot:low'] < halfway - 3 && D['foot:low'] > 26 && D['foot:high'] > halfway + 2 && D['foot:high'] < halfway + 14,
  'a clearance by foot carries to about halfway (' + D['foot:mid'] + ' m at 5.5), short of it rated low (' + D['foot:low'] + ' m), past it rated high (' + D['foot:high'] + ' m)');

// CHARGED (v107): yours, at your feet in your own half -- CLEAR (L) charges it, the meter filling in 0.6 s, and it goes as
// you let go: a tap a short way, low; held full the whole way, high (as every clearance went before). Pressed, the frames
// let run till it's charged to `to` (0: let go at once), let go; where it first comes down and where it stops, from 8 m
// out, rated 5.5; and how high it went.
const charged = to => page.evaluate(to => new Promise(res => { const T = window.__T, b = T.ball(), a = T.atkOf('G'), gx = a > 0 ? 0 : T.FW;
  const p = T.players().find(q => q.team === 'G' && q.role === 'DEF'), others = T.players().filter(q => q !== p);
  const park = () => { others.forEach((q, i) => { q.x = T.FW / 2 + (i % 2 ? 1 : -1) * 6 * T.MK; q.y = 20 + 6 * i; q.vx = q.vy = 0; }); for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; } };
  const keep = p.stats; p.stats = Object.assign({}, keep, { defIQ: 5.5, shotPower: 5.5 });
  T.freeze(); park(); T.setControlled(p); p.x = gx + a * 8 * T.MK; p.y = T.YC; p.vx = p.vy = 0; p.z = 0; p.vz = 0; p.state = 'normal'; p.noTouchT = 0; p.facing = { x: a, y: 0 };
  Object.assign(b, { ownedBy: null, dribbler: null, z: 0, vx: 0, vy: 0, vz: 0, crossT: 0, shotT: 0 }); T.own(p, p.r + b.r + 5);
  const pressed = T.pressClear(), x0 = b.x, y0 = b.y; let gone = false, t0 = 0, top = 0, land = null, ch = 0;
  (function tick(){ park(); if(!gone){ p.vx = p.vy = 0; ch = T.charge(); if(ch >= to){ T.clearRelease(); gone = true; t0 = T.simNow(); } return requestAnimationFrame(tick); }
    top = Math.max(top, b.z); if(land == null && b.z <= 0.5 && T.simNow() - t0 > 0.1) land = Math.hypot(b.x - x0, b.y - y0) / T.MK;
    if((Math.hypot(b.vx, b.vy) < 15 && b.z <= 1 && T.simNow() - t0 > 0.3) || T.stopped() || T.simNow() - t0 > 8){ p.stats = keep;
      return res({ pressed, charge: +ch.toFixed(2), land: land && +land.toFixed(1), stop: +(Math.hypot(b.x - x0, b.y - y0) / T.MK).toFixed(1), top: +(top / 25).toFixed(1) }); }
    requestAnimationFrame(tick); })(); }), to);
const CT = { tap: await charged(0), quarter: await charged(0.25), full: await charged(1) };
info('your clearance, charged (first down / stops / how high, m): ' + JSON.stringify(CT));
ok(CT.tap.pressed && CT.tap.land < 0.55 * CT.full.land && CT.tap.land > 6 && CT.tap.land < CT.quarter.land && CT.quarter.land < CT.full.land && CT.tap.top < CT.full.top / 1.8 && Math.abs(CT.full.stop - D['foot:mid']) < 6,
  'CLEAR at your feet charges: a tap goes a short way and low (down ' + CT.tap.land + ' m on, ' + CT.tap.top + ' m up), a quarter charged further (' + CT.quarter.land + ' m), full the whole way (' + CT.full.land + ' m, ' + CT.full.top + ' m up; stops ' + CT.full.stop + ' m on, as a clearance always did)');

// AT HIS HANDS: our keeper come for a cross, five metres off his line, the ball right by him at 60 px and dropping, going
// across him -- too late now to read where it'll come down (it never will, in his reach, after he's had a moment to
// read it: crossClaim's null) -- with nobody near: he catches it; with one of theirs right with him, he punches it.
const atHands = rival => page.evaluate(rival => new Promise(res => { const T = window.__T, kp = T.keepers().find(k => k.team === 'G'), b = T.ball(), out = -kp.side, gx = kp.side < 0 ? 0 : T.FW;
  const R = T.players().filter(q => q.team === 'R' && q.role !== 'G'), att = R[0];
  T.setControlled(T.players().find(q => q.team === 'G' && q.role === 'DEF'));            // (you're ours again, as in a game)
  const park = () => { for(const q of T.players()) if(!(rival && q === att)){ q.x = T.FW / 2 + out * 400 + (q.team === 'R' ? 0 : 60); q.y = 60; q.vx = q.vy = 0; } };
  T.freeze(); T.drop(); park(); window.__punch = 0;
  Object.assign(kp, { x: gx + out * 5 * T.MK, y: T.YC, mode: 'claimX', claimCd: 0, diveT: 0, groundT: 0, holdT: 0, heldT: 0, vx: 0, vy: 0, spreadT: 0, gkRoaming: false });
  Object.assign(b, { ownedBy: null, dribbler: null, x: kp.x, y: kp.y + 20, z: 60, vx: 0, vy: 300, vz: -180, crossT: 1, crossBy: 'R', shotT: 0, lastTouch: 'R', curveSpinT: 0 });
  if(rival){ att.x = b.x + out * 18; att.y = b.y + 14; att.z = 10; att.vx = att.vy = 0; att.state = 'normal'; }
  const unread = !T.crossClaim(kp), t0 = T.simNow();
  (function tick(){ park(); if(rival){ att.x = b.x + out * 18; att.y = b.y + 14; }
    if(T.gkHold() === kp) return res({ unread, how: 'caught' });
    if(window.__punch) return res({ unread, how: 'punched' });
    if(T.simNow() - t0 > 0.5) return res({ unread, how: kp.mode });
    requestAnimationFrame(tick); })(); }), rival);
const ah = await atHands(false), ahc = await atHands(true);
info('at his hands, too late to read where it comes down: ' + JSON.stringify(ah) + '; one of theirs with him: ' + JSON.stringify(ahc));
ok(ah.unread && ah.how === 'caught' && ahc.how === 'punched', 'a cross at his hands as he gets under it is his: caught, or punched with one of theirs with him (not left to drop behind him)');

// A RUN OF CROSSES: their man whips it in from the byline (or from 18 m out on the wing) toward 7 m out, one of theirs
// attacking it and one of ours marking him (yours); everyone else parked. He never comes for one (claimX, before any
// header of theirs) and lets it in, and he gets the ones he comes for. (v84: 9 of 10 from the byline went in after he'd
// come for it.) And A BALL INTO HIS SIX-YARD
// BOX -- from the byline toward 4.5 m out, their man well behind it -- he comes for, and has.
const crosses = (fx, fy, D, N, far) => page.evaluate(({ fx, fy, D, N, far }) => new Promise(res => { const T = window.__T, b = T.ball(); window.__aiAll = true;
  const kp = T.keepers().find(k => k.team === 'G'), out = -kp.side, gx = kp.side < 0 ? 0 : T.FW, MK = T.MK;
  const R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
  const cr = R.find(q => q.role === 'MID') || R[0], att = R.find(q => q.role === 'ATT') || R[1], mk = G.find(q => q.role === 'DEF') || G[0];
  T.setControlled(mk); const tally = {}; let i = 0;
  const one = () => { if(i >= N){ window.__aiAll = false; return res(tally); } const sd = i++ % 2 ? 1 : -1;
    T.freeze(); T.drop(); window.__punch = 0;
    for(const q of T.players()) if(q !== cr && q !== att && q !== mk){ q.x = T.FW / 2 + out * 300 + (q.team === 'R' ? 0 : 60); q.y = 60; q.vx = q.vy = 0; q.state = 'normal'; }
    Object.assign(kp, { x: kp.homeX, y: T.YC, mode: 'line', claimCd: 0, diveT: 0, groundT: 0, holdT: 0, heldT: 0, vx: 0, vy: 0, spreadT: 0, spreadDn: 0, closeT: -9, gkRoaming: false });
    const spot = { x: gx + out * D * MK, y: T.YC + sd * MK };
    Object.assign(cr, { x: gx + out * fx * MK, y: T.YC + sd * fy * MK, vx: 0, vy: 0, state: 'normal', facing: { x: -out, y: 0 } });
    Object.assign(att, { x: spot.x + out * (far ? 9 : 5) * MK, y: spot.y + sd * 3 * MK, vx: 0, vy: 0, state: 'normal', z: 0 });
    Object.assign(mk, { x: att.x - out * 1.2 * MK, y: att.y, vx: 0, vy: 0, state: 'normal', z: 0 });
    Object.assign(b, { ownedBy: null, dribbler: null, x: cr.x, y: cr.y - sd * 20, z: 0, vx: 0, vy: 0, vz: 0, crossT: 0, shotT: 0, lastTouch: 'R' });
    const s0 = T.score()[1]; T.aiCross(cr, { x: spot.x, y: spot.y, who: att }); const t0 = T.simNow(); let came = false, hdr = false;
    (function tick(){ if(b.shotT > 0 && b.lastTouch === 'R') hdr = true; if(!hdr && kp.mode === 'claimX') came = true;
      const how = T.score()[1] > s0 ? 'goal' : T.gkHold() === kp ? 'caught' : window.__punch ? 'punched' : (T.stopped() || T.simNow() - t0 > 3.5) ? 'other' : null;
      if(how){ const k = (came ? 'came:' : '') + how; tally[k] = (tally[k] || 0) + 1; return one(); }
      requestAnimationFrame(tick); })(); };
  one(); }), { fx, fy, D, N, far });
const byl = await crosses(1.5, 23, 7, 10), deep = await crosses(18, 26, 7, 10), six = await crosses(1.5, 23, 4.5, 6, true);
info('crosses toward 7 m out, from the byline: ' + JSON.stringify(byl) + '; from 18 m out on the wing: ' + JSON.stringify(deep) + '; into his six-yard box: ' + JSON.stringify(six));
const came = t => Object.entries(t).filter(([k]) => k.startsWith('came:')).reduce((s, [, n]) => s + n, 0), got = t => (t['came:caught'] || 0) + (t['came:punched'] || 0);
ok(!byl['came:goal'] && !deep['came:goal'] && !six['came:goal'], 'he never comes for one and lets it in');
ok(got(byl) + got(deep) >= 0.8 * (came(byl) + came(deep)), 'he gets the ones he comes for (' + (got(byl) + got(deep)) + ' of ' + (came(byl) + came(deep)) + ' toward 7 m, caught or punched; the rest he leaves to us, set on his line)');
ok(came(six) >= 5 && got(six) >= 5, 'a ball dropping in his six-yard box he comes for, and has (' + got(six) + ' of 6)');

process.exitCode = rep.finish();
await browser.close();

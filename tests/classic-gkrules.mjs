// FOOTBALL CLASSIC, THE KEEPER AND THE RULES (v113). His hands only in his own penalty area, and never to a ball a
// team-mate has kicked to him on purpose (a pass, a cross, a clearance -- a header isn't one), unless someone else has
// touched it since. Otherwise he plays it with his feet, like anyone: yours and you're on him (the stick moves him, PASS
// plays it on, and one of theirs can take it off him); the computer's settles it, then plays it short to a man who's
// free or, pressed, kicks it long. Here: a team-mate's pass back to him (yours, the computer's); a loose ball of theirs
// into his box and a team-mate's header back to him (hands, as before); a ball outside his box he comes out for (feet:
// it used to be booted upfield); and your keeper on the ball. On a copy of the game that lets the test reach it, on a
// virtual clock.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, now:()=>simNow, atkOf, FW, YC, MK, PA_D, controlled:()=>controlled, gkHold:()=>gkHold, passTo, own, setControlled, setTI:(t,o)=>setTI(t,Object.assign(tiDefault(TAC[t].style),o)),\n'
  + '    freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; }, grade:()=>lastGrade,\n'
  + '    goalKick:t=>{ restartInfo={type:"goalkick",team:t,x:0,y:YC}; executeRestart(); }};\n  const LAB_TITLE=');
patch('\n    draw();\n', '\n    if(!window.__noDraw) draw();\n');
patch('  function gkLaunch(kp, tx, ty){', '  function gkLaunch(kp, tx, ty){ if(window.__K){ window.__K.kick++; window.__K.from=ball.z; }');
patch('  function gkShort(kp,tx,ty,vh,vz){\n', '  function gkShort(kp,tx,ty,vh,vz){\n    if(window.__K){ window.__K.short++; window.__K.from=ball.z; }\n');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-gkr-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
const frameErr = []; page.on('console', m => { if(/frame error/.test(m.text())) frameErr.push(m.text().slice(0, 200)); });
await page.addInitScript(() => { try{ const o = JSON.parse(localStorage.getItem('ftc_prefs') || '{}') || {}; o.diff = 'star'; o.halfMin = 5; localStorage.setItem('ftc_prefs', JSON.stringify(o));
  localStorage.setItem('ft_exh', JSON.stringify({ you: 'ARS', opp: 'AVL' })); }catch(e){} });
await page.addInitScript(() => { let vt = 0; const ch = new MessageChannel(), q = [];
  ch.port1.onmessage = () => { if(window.__vpause){ setTimeout(() => ch.port2.postMessage(0), 4); return; }   // (the clock held: see pressPass)
    const cbs = q.splice(0); vt += 33; for(const cb of cbs){ try{ cb(vt); }catch(e){} } };
  window.requestAnimationFrame = cb => { q.push(cb); if(q.length === 1) ch.port2.postMessage(0); return 0; }; window.__noDraw = true; });
await page.goto('file://' + copy); await page.waitForTimeout(300);
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(600);

// the scene: team's half cleared -- theirs on halfway, ours spread 30 m+ out -- the keeper on his line, and the ball:
//   back: a pass from one of ours 22 m out, played to the keeper (passTo)
//   loose: one of theirs' ball rolling into his box
//   header: one of ours' header back to him from 12 m (a header leaves no kicker behind it)
//   out: a slow ball of theirs 21 m out, outside his box, him the nearest
const scene = (team, kind) => page.evaluate(({ team, kind }) => new Promise(res => { const T = window.__T, M = T.MK, b = T.ball();
  const kp = T.keepers().find(k => k.team === team), atk = T.atkOf(team), gl = atk > 0 ? 0 : T.FW;
  T.freeze(); T.setTI('G', {}); T.setTI('R', {});
  const mine = T.players().filter(q => q.team === team), theirs = T.players().filter(q => q.team !== team);
  theirs.forEach((q, i) => Object.assign(q, { x: T.FW / 2 + atk * 20 * M, y: 100 + i * 150, vx: 0, vy: 0, state: 'normal' }));
  mine.forEach((q, i) => Object.assign(q, { x: gl + atk * ((kind === 'out' ? 45 : 30) + i * 4) * M, y: 120 + i * 180, vx: 0, vy: 0, state: 'normal' }));
  for(const k of T.keepers()) Object.assign(k, { x: k.homeX, y: T.YC, vx: 0, vy: 0, mode: 'line', claimCd: 0, diveT: 0, groundT: 0, holdT: 0, heldT: 0, spreadT: 0, spreadDn: 0, closeT: -9, gkRoaming: false, charging: false, state: 'normal' });   // (both: the last scene's may still have it)
  Object.assign(b, { ownedBy: null, dribbler: null, intendedRcv: null, z: 0, vz: 0, shotT: 0, crossT: 0, crossBy: null });
  const other = mine[mine.length - 1]; if(team === 'G') T.setControlled(other);
  if(kind === 'back'){ const d = mine[0]; Object.assign(d, { x: gl + atk * 22 * M, y: T.YC + 4 * M, facing: { x: -atk, y: 0 } }); Object.assign(b, { x: d.x - atk * 14, y: d.y, vx: 0, vy: 0 }); T.own(d, 20); T.passTo(d, kp); }
  else { const m = kind === 'header' ? mine[0] : theirs[0];
    Object.assign(b, { x: gl + atk * (kind === 'loose' ? 20 : kind === 'header' ? 12 : 21) * M, y: T.YC + (kind === 'out' ? 3 * M : 0), vx: -atk * (kind === 'out' ? 60 : kind === 'header' ? 300 : 260), vy: 0,
      lastTouch: m.team, lastTouchP: m, kickBy: m.team, kickP: kind === 'header' ? null : m }); }
  const t0 = T.now(); let seen = null, onHim = false, handsEver = false, left = null;
  (function tick(){ const t = T.now() - t0;
    if(T.gkHold() === kp) handsEver = true;
    if(!seen && (T.gkHold() === kp || kp.mode === 'feet')) seen = { how: T.gkHold() === kp ? 'hands' : 'feet', t: +t.toFixed(2), inBox: Math.abs(b.x - gl) < T.PA_D && Math.abs(b.y - T.YC) < 600 };
    if(seen && kp.mode === 'feet' && T.controlled() === kp) onHim = true;
    if(seen && seen.how === 'feet' && left === null && b.ownedBy !== kp && b.dribbler !== kp) left = { t: +(t - seen.t).toFixed(2), to: b.intendedRcv ? (b.intendedRcv === kp ? 'keeper' : b.intendedRcv.team) : null };
    const done = t > 8 || (seen && (seen.how === 'hands' || (team === 'G' && kind === 'back') || left));
    if(done) return res({ team, kind, seen, onHim, handsEver, left, grade: T.grade() });
    requestAnimationFrame(tick); })(); }), { team, kind });

const gBack = await scene('G', 'back'), rBack = await scene('R', 'back');
info('a team-mate\'s pass back to the keeper -- yours: ' + JSON.stringify(gBack) + '; the computer\'s: ' + JSON.stringify(rBack));
ok(gBack.seen && gBack.seen.how === 'feet' && gBack.onHim && !gBack.handsEver,
  'one of ours passes it back to our keeper: he can\'t pick it up -- he has it at his feet, and you\'re on him (' + (gBack.seen && gBack.seen.t) + ' s)');
ok(rBack.seen && rBack.seen.how === 'feet' && !rBack.handsEver && rBack.left && rBack.left.t < 4,
  'the computer\'s the same: at his feet, never in his hands, and he plays it on himself (' + (rBack.left && rBack.left.t) + ' s after)');
const gLoose = await scene('G', 'loose'), rHead = await scene('R', 'header'), gHead = await scene('G', 'header');
info('a loose ball of theirs into his box: ' + JSON.stringify(gLoose) + '; a team-mate\'s header back to him: ' + JSON.stringify(gHead) + ', ' + JSON.stringify(rHead));
ok(gLoose.seen && gLoose.seen.how === 'hands', 'a ball of theirs rolling into his box: in his hands, as ever');
ok(gHead.seen && gHead.seen.how === 'hands' && rHead.seen && rHead.seen.how === 'hands', 'a team-mate\'s header back to him: hands too (the rule is for a ball kicked to him)');
const rOut = await scene('R', 'out'), gOut = await scene('G', 'out');
info('a ball outside his box he comes for: ' + JSON.stringify(rOut) + ', ' + JSON.stringify(gOut));
ok(rOut.seen && rOut.seen.how === 'feet' && !rOut.seen.inBox && !rOut.handsEver && gOut.seen && gOut.seen.how === 'feet' && !gOut.handsEver,
  'a ball 21 m out, outside his box, that he gets to first: at his feet, never his hands (it used to be booted upfield)');

// PASS, held a quarter of a second -- past a tap, so it goes as you let go (a tap waits a moment of real time in case
// it's a double-tap) -- with the game's clock held meanwhile
const pressPass = async () => { await page.evaluate(() => { window.__vpause = true; dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ' })); });
  await page.waitForTimeout(260); await page.evaluate(() => { dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ' })); window.__vpause = false; }); };
// --- YOUR KEEPER ON THE BALL: the stick moves him, PASS plays it on (and you go with it), and one of theirs can take it --
const yours = async what => { await scene('G', 'back');
  if(what === 'pass'){ await page.evaluate(() => { const T = window.__T, M = T.MK, kp = T.keepers().find(k => k.team === 'G'), atk = T.atkOf('G'), G = T.players().filter(q => q.team === 'G');
    Object.assign(G[0], { x: kp.x + atk * 15 * M, y: kp.y, vx: 0, vy: 0 }); kp.facing = { x: atk, y: 0 }; window.__t0 = T.now(); }); await pressPass(); }
  return page.evaluate(what => new Promise(res => { const T = window.__T, M = T.MK, b = T.ball(), kp = T.keepers().find(k => k.team === 'G'), atk = T.atkOf('G');
  const G = T.players().filter(q => q.team === 'G'), R = T.players().filter(q => q.team === 'R'), key = (type, code) => dispatchEvent(new KeyboardEvent(type, { code }));
  const t0 = T.now(), x0 = kp.x; let out = null;
  if(what === 'stick'){ key('keydown', atk > 0 ? 'KeyD' : 'KeyA');
    (function tick(){ if(T.now() - t0 < 0.8) return requestAnimationFrame(tick); key('keyup', atk > 0 ? 'KeyD' : 'KeyA');
      res({ ran: +(atk * (kp.x - x0) / M).toFixed(1), still: b.ownedBy === kp, mode: kp.mode, you: T.controlled() === kp }); })(); return; }
  if(what === 'pass'){
    let rcv = null; const clamp1 = x => Math.max(-1, Math.min(1, x));   // (your pass along the ground: you're on the man it's for as it goes -- passSwitch)
    (function tick(){ const t = T.now() - window.__t0;
      if(!out && b.ownedBy !== kp){ rcv = T.controlled(); const dx = rcv.x - b.x, dy = rcv.y - b.y, v = Math.hypot(b.vx, b.vy) || 1;
        out = { t: +t.toFixed(2), to: rcv !== kp && rcv.team === 'G' && atk * b.vx > 0, m: +(Math.hypot(dx, dy) / M).toFixed(1), off: Math.round(Math.acos(clamp1((b.vx * dx + b.vy * dy) / v / (Math.hypot(dx, dy) || 1))) * 57.3) }; }   // (how true: his passing -- a keeper's, by his stats)
      if(out || t > 3) return res({ out, you: rcv && T.controlled() === rcv && rcv !== kp ? 'the man it\'s for' : T.controlled() === kp ? 'keeper' : 'another', mode: kp.mode, hands: T.gkHold() === kp });
      requestAnimationFrame(tick); })(); return; }
  if(what === 'tackle'){ const a = R.find(q => q.role === 'ATT') || R[0]; Object.assign(a, { x: kp.x + atk * 4 * M, y: kp.y + 1 * M, vx: 0, vy: 0, facing: { x: -atk, y: 0 } }); let hands = false;
    (function tick(){ const t = T.now() - t0; if(T.gkHold() === kp) hands = true;
      if(b.lastTouch === 'R' || (b.ownedBy && b.ownedBy.team === 'R') || t > 8) return res({ won: b.lastTouch === 'R' || !!(b.ownedBy && b.ownedBy.team === 'R'), t: +t.toFixed(2), hands });
      requestAnimationFrame(tick); })(); }
  }), what); };
// your own pass back to him: one of yours on the ball 20 m out, facing our goal, PASS
await page.evaluate(() => { const T = window.__T, M = T.MK, b = T.ball(), kp = T.keepers().find(k => k.team === 'G'), atk = T.atkOf('G'), gl = atk > 0 ? 0 : T.FW;
  const G = T.players().filter(q => q.team === 'G'), R = T.players().filter(q => q.team === 'R'), key = (type, code) => dispatchEvent(new KeyboardEvent(type, { code }));
  T.freeze(); for(const k of T.keepers()) Object.assign(k, { x: k.homeX, y: T.YC, vx: 0, vy: 0, mode: 'line', claimCd: 0, holdT: 0, heldT: 0, gkRoaming: false, charging: false, state: 'normal' });
  R.forEach((q, i) => Object.assign(q, { x: (atk > 0 ? T.FW - 8 * M : 8 * M), y: 200 + i * 150, vx: 0, vy: 0 }));
  G.forEach((q, i) => Object.assign(q, { x: gl + atk * (30 + i * 4) * M, y: 120 + i * 180, vx: 0, vy: 0 }));
  const d = G[0]; Object.assign(d, { x: gl + atk * 20 * M, y: T.YC, vx: 0, vy: 0, facing: { x: -atk, y: 0 }, state: 'normal' });
  Object.assign(b, { ownedBy: null, dribbler: null, x: d.x - atk * 14, y: d.y, z: 0, vx: 0, vy: 0, vz: 0, shotT: 0 }); T.own(d, 20); T.setControlled(d); window.__d = d; });
await pressPass();
const back = await page.evaluate(() => new Promise(res => { const T = window.__T, b = T.ball(), kp = T.keepers().find(k => k.team === 'G'), d = window.__d;
  const t0 = T.now(); let gone = null;
  (function tick(){ const t = T.now() - t0; if(gone === null && b.ownedBy !== d) gone = +t.toFixed(2);
    if(kp.mode === 'feet' || T.gkHold() === kp || t > 6) return res({ how: kp.mode === 'feet' ? 'feet' : T.gkHold() === kp ? 'hands' : null, you: T.controlled() === kp, t: +(t - (gone || 0)).toFixed(2) });
    requestAnimationFrame(tick); })(); }));
info('your pass back to your keeper: ' + JSON.stringify(back));
ok(back.how === 'feet' && back.you, 'you pass it back to your keeper (facing him, PASS): he has it at his feet, not his hands, and you\'re on him');
const st = await yours('stick'), ps = await yours('pass'), tk = await yours('tackle');
info('your keeper on the ball -- the stick: ' + JSON.stringify(st) + '; PASS: ' + JSON.stringify(ps) + '; one of theirs at him: ' + JSON.stringify(tk));
ok(st.ran > 1.5 && st.still && st.you, 'your keeper with it at his feet: the stick takes him on with it (' + st.ran + ' m in 0.8 s, the ball still his)');
ok(ps.out && ps.out.to && ps.you === 'the man it\'s for' && !ps.hands, 'PASS plays it up the pitch to one of ours (' + (ps.out && ps.out.off) + '° off him: a keeper\'s passing), and you go with it, on to him');
ok(tk.won && !tk.hands, 'one of theirs 4 m off him while you stand on it: he comes in and takes it off him (' + tk.t + ' s) -- the keeper never picks it up');

// --- THE COMPUTER'S KEEPER ON THE BALL: free, a short ball to a man of his; pressed, long -----------------------------
const cpu = pressed => page.evaluate(pressed => new Promise(res => { const T = window.__T, M = T.MK, b = T.ball(), kp = T.keepers().find(k => k.team === 'R'), atk = T.atkOf('R'), gl = atk > 0 ? 0 : T.FW;
  const R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
  T.freeze(); T.setTI('R', {});
  for(const k of T.keepers()) Object.assign(k, { x: k.homeX, y: T.YC, vx: 0, vy: 0, mode: 'line', claimCd: 0, diveT: 0, groundT: 0, holdT: 0, heldT: 0, spreadT: 0, spreadDn: 0, closeT: -9, gkRoaming: false, charging: false, state: 'normal' });
  G.forEach((q, i) => Object.assign(q, { x: T.FW / 2 + atk * 22 * M, y: 100 + i * 150, vx: 0, vy: 0, state: 'normal' }));
  R.forEach((q, i) => Object.assign(q, { x: gl + atk * (16 + i * 3) * M, y: 200 + i * 220, vx: 0, vy: 0, state: 'normal' }));
  Object.assign(kp, { x: gl + atk * 8 * M, y: T.YC, vx: 0, vy: 0, claimCd: 0, gkRoaming: false, charging: false, state: 'normal' });
  if(pressed){ const g = G[0]; Object.assign(g, { x: kp.x + atk * 5 * M, y: kp.y + 1 * M }); }
  Object.assign(b, { ownedBy: null, dribbler: null, intendedRcv: null, z: 0, vz: 0, vx: 0, vy: 0, x: kp.x + atk * 1.2 * M, y: kp.y, lastTouch: 'R', lastTouchP: R[0], kickBy: 'R', kickP: R[0], shotT: 0 });
  window.__K = { kick: 0 }; kp.mode = 'claim';
  const t0 = T.now(); let feet = false, hands = false;
  (function tick(){ const t = T.now() - t0; if(kp.mode === 'feet') feet = true; if(T.gkHold() === kp) hands = true;
    if(feet && b.ownedBy !== kp && b.dribbler !== kp && kp.mode !== 'feet'){ return res({ feet, hands, t: +t.toFixed(2), long: window.__K.kick > 0, to: b.intendedRcv ? b.intendedRcv.team : null }); }
    if(t > 6) return res({ feet, hands, t: 6, long: window.__K.kick > 0, to: null, stuck: true });
    requestAnimationFrame(tick); })(); }), pressed);
const free = await cpu(false), pr = await cpu(true);
info('the computer\'s keeper with a team-mate\'s ball at his feet -- free: ' + JSON.stringify(free) + '; one of yours 5 m off: ' + JSON.stringify(pr));
ok(free.feet && !free.hands && !free.long && free.to === 'R', 'the computer\'s keeper, nobody near him: a short ball to one of his own (' + free.t + ' s)');
ok(pr.feet && !pr.hands && pr.long && pr.t < 1.5, 'one of yours closing him down: he kicks it long (' + pr.t + ' s)');
// --- A GOAL KICK: on the ground in front of him, not in his gloves; kicked -- short along the grass, never thrown ------
const gk = build => page.evaluate(build => new Promise(res => { const T = window.__T, M = T.MK, b = T.ball(), kp = T.keepers().find(k => k.team === 'R'), atk = T.atkOf('R'), gl = atk > 0 ? 0 : T.FW;
  const R = T.players().filter(q => q.team === 'R'), G = T.players().filter(q => q.team === 'G');
  T.freeze(); T.setTI('R', { build }); for(const k of T.keepers()) Object.assign(k, { mode: 'line', holdT: 0, heldT: 0, gkRoaming: false, charging: false });
  G.forEach((q, i) => Object.assign(q, { x: T.FW / 2 + atk * 15 * M, y: 100 + i * 150, vx: 0, vy: 0 }));
  R.forEach((q, i) => Object.assign(q, { x: gl + atk * (14 + i * 5) * M, y: 150 + i * 200, vx: 0, vy: 0 }));
  window.__K = { kick: 0, short: 0, from: null }; T.goalKick('R'); const t0 = T.now(); let frames = 0, onGround = true, gone = false;
  (function tick(){ const t = T.now() - t0;
    if(T.gkHold() === kp){ if(t > 0.05){ frames++; if(b.z > 0.5) onGround = false; } }   // (from the first frame on: where the hold puts it)
    else gone = true;
    if(gone || t > 8) return res({ onGround: onGround && frames > 5, from: window.__K.from, kick: window.__K.kick, short: window.__K.short, t: +t.toFixed(2) });
    requestAnimationFrame(tick); })(); }), build);
const gkS = await gk('short'), gkL = await gk('long');
info('a goal kick, told SHORT: ' + JSON.stringify(gkS) + '; told LONG: ' + JSON.stringify(gkL));
ok(gkS.onGround && gkS.short === 1 && gkS.from === 0 && gkL.onGround && gkL.kick === 1 && gkL.from === 0,
  'a goal kick sits on the ground in front of him, not in his gloves, and is struck off the ground -- SHORT to a man near him, LONG up the pitch -- never thrown');
ok(frameErr.length === 0, 'no frame errors' + (frameErr.length ? ': ' + frameErr[0] : ''));

process.exitCode = rep.finish();
await browser.close();

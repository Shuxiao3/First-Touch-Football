// FOOTBALL CLASSIC, YOUR KEEPER: with the ball in his hands you're on him (v114) -- the stick walks him round his box,
// PASS throws it to the man you aim at (twice: overarm), CLEAR or SHOOT punts it as far as you hold it -- and if you do
// nothing, once he's had it 5 s, the last 2 s of that with a red stopwatch flashing over his head, it goes to the man you
// have lit (v169: a tapped punt goes a short way into the space, held it goes further, and it's to a man only when it comes
// down about where he is; v115: it was pinged at once to the best man that way, up to 60 m off, however short the press). The
// computer's keeper plays it out himself, as before. IN THE AIR no man gets to a ball higher than a keeper: a header
// tops out at 61 px (Heading 10, at the top of his leap), the keeper's hands at 82; and a keeper coming for a cross
// catches it when he's comfortably under it, and punches it clear when one of theirs is up with him. v178: struck, the
// cross has him set where he is till he's read it (GK_READ at his Reflexes), and then he goes; and at his hands he
// catches only what comes to him -- straight at him he has it, across him 0.7 of his reach off he punches it, and one a
// third of his reach off (and a step) a keeper of Handling 10 catches where one of Handling 1 punches. HIS WAY TO IT
// (v87): three of theirs stood across his way to it and he doesn't come (he can't go through them); two of ours on his
// line, and he does -- they're shoved aside, off it, not on ahead of him. On a copy of the game that lets the test set
// the scene, give the keeper the ball and count the stopwatch's frames.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, simNow:()=>simNow, gkHold:()=>gkHold, TI:()=>TI, gkHowOf, gkTarget, '
  + 'GK:()=>[GK_WAIT,GK_WARN], FW, FH, YC, atkOf, tryHeaderContact, tryDefHeaderContact, aiCross, crossClaim, GKH:()=>GK_CLAIM_H, '
  + 'gkTakeCross, gkRead:kp=>gkRead(kp), reachOf, endCurve, GRAB:()=>GK_GRAB, CATCH:()=>[CATCH_FAR,CATCH_STEP,CATCH_RIVAL], '
  + 'ht:v=>{ if(v!=null) headerT=v; return headerT; }, dht:v=>{ if(v!=null) defHeaderT=v; return defHeaderT; }, drop:()=>{ gkHold=null; }, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }, '
  + 'puntOn, puntSpot, hold:kp=>{ kp.mode="hold"; kp.holdT=1.0; kp.heldT=0; kp.x=kp.homeX; kp.y=YC; gkHold=kp; ball.ownedBy=null; ball.dribbler=null; ball.intendedRcv=null; ball.x=kp.x-kp.side*18; ball.y=kp.y; ball.z=6; ball.vx=ball.vy=ball.vz=0; }};\n  const LAB_TITLE=');
patch('  function drawStopwatch(x,y){', '  function drawStopwatch(x,y){ window.__sw=(window.__sw||0)+1;');
patch('  function keeperPunch(kp){\n', '  function keeperPunch(kp){\n    window.__punch=(window.__punch||0)+1;\n');
patch('      else{\n        let ai=aiBrain(p,dt);', '      else if(p.__hold){ p.vx=p.vy=0; }\n      else{\n        let ai=aiBrain(p,dt);');   // (a man the test stands still)
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-gk-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);

// YOUR KEEPER, THE BALL IN HIS HANDS (v114): you're on him. THE SCENE: theirs parked out of the way in the far corner,
// ours set at known spots up the pitch from him (held there), the keeper given the ball; then, 0.5 s in, what you do --
// the stick held one way (walk), PASS tapped with the stick one way (pass), PASS twice (loft), CLEAR (the stick held or
// not), SHOOT -- or
// nothing, his time running out. When it's gone: who it was for, who you're on, how high it went up and where it first
// came down; and how many frames the stopwatch showed in his first 3 s and after.
const yours = (act, dir, o) => page.evaluate(({ act, dir, o }) => new Promise(res => {   // (o.hold: CLEAR or SHOOT held that long, s; o.man: one of ours, i, put m metres straight up the pitch from the keeper)
  const T = window.__T, kp = T.keepers().find(k => k.team === 'G'), atk = T.atkOf('G'), G = T.players().filter(q => q.team === 'G'), R = T.players().filter(q => q.team === 'R');
  T.freeze();
  const gx = atk > 0 ? 0 : T.FW, spots = G.map((q, i) => ({ q, x: gx + atk * (300 + i * 150), y: T.YC + (i % 2 ? 1 : -1) * (120 + 40 * i) }));
  o = o || {}; if(o.man){ spots[o.man.i].x = kp.homeX + atk * o.man.m * 22.5; spots[o.man.i].y = T.YC; }
  const place = () => { for(const s of spots){ s.q.x = s.x; s.q.y = s.y; s.q.vx = s.q.vy = 0; }
    for(const [i, o] of R.entries()){ o.x = atk > 0 ? T.FW - 40 : 40; o.y = T.FH - 60 - i * 40; o.vx = o.vy = 0; } };
  const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code.slice(-1).toLowerCase() }));
  const stick = { up: 'KeyW', down: 'KeyS', fwd: atk > 0 ? 'KeyD' : 'KeyA' }[dir];
  place(); T.hold(kp); kp.facing = { x: atk, y: 0 }; window.__sw = 0;   // (facing up the pitch)
  const t0 = T.simNow(), x0 = kp.x, y0 = kp.y; let sw3 = 0, swEnd = 0, frames3 = 0, framesEnd = 0, on = false, out = null, step = 0, inBox = true, charging = false;
  (function tick(){
    const t = T.simNow() - t0, b = T.ball();
    if(T.gkHold() === kp){ place(); if(T.controlled() === kp) on = true;
      if(Math.abs(kp.x - gx) > 16.5 * 22.5 || Math.abs(kp.y - T.YC) > 900) inBox = false;
      const n = window.__sw; window.__sw = 0; if(t < 3){ sw3 += n; frames3++; } else { swEnd += n; framesEnd++; } }
    else if(!out){ out = { t: +t.toFixed(2), rcv: b.intendedRcv ? G.indexOf(b.intendedRcv) : -1, side: b.intendedRcv ? Math.sign(b.intendedRcv.y - kp.y) : 0, you: T.controlled() === kp ? 'keeper' : G.indexOf(T.controlled()),
        vz: Math.round(b.vz), bx: b.x, by: b.y, land: null }; if(stick) key('keyup', stick); }
    else if(out.land == null){ place();   // (where it first comes down, or where it's taken)
      if((t - out.t > 0.25 && b.z <= 0.5) || b.ownedBy || t - out.t > 4){ out.land = +(Math.hypot(b.x - out.bx, b.y - out.by) / 22.5).toFixed(1); out.dy = Math.sign(Math.round(b.y - out.by)); } }
    if(act !== 'none' && step === 0 && t >= 0.5){ step = 1; if(stick) key('keydown', stick); }
    if(step === 1 && t >= 0.7){ step = 2;
      if(act === 'pass') { key('keydown', 'KeyJ'); key('keyup', 'KeyJ'); }
      if(act === 'loft') { key('keydown', 'KeyJ'); key('keyup', 'KeyJ'); key('keydown', 'KeyJ'); key('keyup', 'KeyJ'); }
      if(act === 'clear'){ key('keydown', 'KeyL'); if(!o.hold) key('keyup', 'KeyL'); }
      if(act === 'shoot'){ key('keydown', 'KeyK'); if(!o.hold) key('keyup', 'KeyK'); } }
    if(step === 2 && o.hold){ if(T.puntOn()) charging = true; if(t >= 0.7 + o.hold){ step = 3; key('keyup', act === 'shoot' ? 'KeyK' : 'KeyL'); } }
    if(act === 'walk' && t >= 1.7){ key('keyup', stick); return res({ on, held: T.gkHold() === kp, inBox, moved: +(Math.hypot(kp.x - x0, kp.y - y0) / 22.5).toFixed(1), dy: Math.sign(kp.y - y0) }); }
    if((out && out.land != null) || t > 9) return res({ act, dir, on, out, sw3, swEnd, frames3, framesEnd, charging });
    requestAnimationFrame(tick); })(); }), { act, dir, o: o || {} });

// THE MOMENT HE HAS IT: you're on him; the stick walks him round his box with it in his hands
const w = await yours('walk', 'down');
info('the stick held down for a second: ' + JSON.stringify(w));
ok(w.on && w.held && w.moved >= 2 && w.dy > 0 && w.inBox, 'your keeper takes it in his hands and you\'re on him: the stick walks him round his box with it (' + w.moved + ' m in a second, still in his hands, still in his box)');
// HIS TIME: nothing pressed -- the stopwatch for his last 2 s, then it goes to the man you've got lit (the way he faces: up the pitch)
const c = await yours('none');
info('nothing pressed: ' + JSON.stringify(c));
ok(c.on && c.out && c.out.t >= 4.9 && c.out.t <= 5.4 && c.out.rcv >= 0, 'his time\'s up at 5 s and it goes to the man you had lit (' + (c.out ? c.out.t.toFixed(2) : '-') + ' s, man ' + (c.out && c.out.rcv) + ')');
ok(c.sw3 === 0 && c.swEnd > 0 && c.swEnd < c.framesEnd, 'no stopwatch for his first 3 s; in the last 2 s it flashes over his head (' + c.swEnd + ' of ' + c.framesEnd + ' frames)');
// PASS: thrown to the man you aim at -- the stick up, one of ours up that way; down, down that way -- and you go with it
const pu = await yours('pass', 'up'), pd = await yours('pass', 'down');
info('PASS with the stick up: ' + JSON.stringify(pu.out) + '; down: ' + JSON.stringify(pd.out));
ok(pu.out && pd.out && pu.out.t < 1.2 && pu.out.rcv >= 0 && pd.out.rcv >= 0 && pu.out.side < 0 && pd.out.side > 0 && pu.out.you === pu.out.rcv && pd.out.you === pd.out.rcv,
  'PASS throws it at once to the man you aim at -- the stick up, a man up that way (' + pu.out.rcv + '); down, down that way (' + pd.out.rcv + ') -- and you go with it, on to him');
// two taps (v167: no lofted pass, so no overarm throw) -- the same as one: at once, along the grass
const lf = await yours('loft', 'fwd'), gr = await yours('pass', 'fwd');
info('two taps: ' + JSON.stringify(lf.out) + '; one: ' + JSON.stringify(gr.out));
ok(lf.out && gr.out && lf.out.rcv >= 0 && lf.out.t < 1.2 && Math.abs(lf.out.vz - gr.out.vz) <= 5, 'two taps of PASS: no overarm throw now -- it goes at once, along the grass as a tap does (' + lf.out.vz + ' up; a tap, ' + gr.out.vz + ')');
// CLEAR, and SHOOT (v169): his punt, as far as you hold it, the way he faces (up the pitch) or the stick points. A tap: a
// short one, 20 m or so, into the space there -- nobody of ours about where it comes down, so it's nobody's; held the
// whole way: 60 m; held about half way with one of ours about where that comes down (40 m straight up the pitch): it's
// his, down at his feet, and you go with him. (v115 to v168: a tap pinged it at once to the best man that way, 30 m on.)
const cl = await yours('clear', null), sh = await yours('shoot', null), cf = await yours('clear', null, { hold: 1.2 }),
  cm = await yours('clear', null, { hold: 0.45, man: { i: 3, m: 40 } }), sm = await yours('shoot', null, { hold: 0.45, man: { i: 3, m: 40 } }), cu = await yours('clear', 'up');
info('CLEAR tapped: ' + JSON.stringify(cl.out) + '; SHOOT tapped: ' + JSON.stringify(sh.out) + '; CLEAR held 1.2 s: ' + JSON.stringify(cf.out) + '; held 0.45 s, one of ours 40 m up: CLEAR ' + JSON.stringify(cm.out) + ', SHOOT ' + JSON.stringify(sm.out) + '; tapped, the stick up: ' + JSON.stringify(cu.out));
ok(cl.out && sh.out && cl.out.t < 1.2 && cl.out.rcv === -1 && sh.out.rcv === -1 && cl.out.land >= 16 && cl.out.land <= 24 && sh.out.land >= 16 && sh.out.land <= 24,
  'a tap of CLEAR -- or SHOOT -- punts it only a short way, into the space up the pitch: nobody\'s (first down ' + (cl.out ? cl.out.land : '-') + ' m out, ' + (sh.out ? sh.out.land : '-') + ' off SHOOT; v168: pinged at once 30 m and more, to a man)');
ok(cf.out && cf.out.land >= 54 && cf.out.land <= 63, '...held the whole way it goes 60 m (' + (cf.out ? cf.out.land : '-') + ' m)');
ok(cm.charging && cm.out && cm.out.rcv === 3 && cm.out.you === 3 && Math.abs(cm.out.land - 39) < 5 && sm.out && sm.out.rcv === 3 && sm.out.you === 3,
  '...and held about half way, with one of ours about where it comes down, it\'s to him at his feet and you go with him -- CLEAR or SHOOT (man ' + (cm.out && cm.out.rcv) + ', ' + (cm.out ? cm.out.land : '-') + ' m; charging the while)');
ok(cu.out && cu.out.rcv === -1 && cu.out.dy < 0 && cu.out.land >= 16 && cu.out.land <= 24, 'it goes the way you aim it: the stick up, a short one up that way (' + (cu.out ? cu.out.land : '-') + ' m)');
// THE COMPUTER'S KEEPER plays it out by himself, as before
const ai = await page.evaluate(() => new Promise(res => { const T = window.__T, kp = T.keepers().find(k => k.team === 'R'); T.freeze(); T.hold(kp);
  const t0 = T.simNow(); (function tick(){ const t = T.simNow() - t0; if(T.gkHold() !== kp || t > 6) return res({ t, held: T.gkHold() === kp }); requestAnimationFrame(tick); })(); }));
ok(!ai.held && ai.t < 4, 'the computer\'s keeper plays it out by himself (' + ai.t.toFixed(2) + ' s)');

// IN THE AIR: the highest a ball can be and still be headed -- yours, and your header clearing it in your own box --
// standing and at the top of his leap at Heading 10, the ball right over his head
const tops = await page.evaluate(() => { const T = window.__T, p = T.controlled(), b = T.ball(), out = {}; T.freeze();
  const atk = T.atkOf(p.team); p.stats = Object.assign({}, p.stats, { heading: 10 });
  for(const [k, fn, set] of [['attack', T.tryHeaderContact, T.ht], ['defend', T.tryDefHeaderContact, T.dht]]) for(const z0 of [0, 14]){
    let top = 0; p.x = T.FW / 2 - atk * 300; p.y = T.YC;           // (in our own half: nobody offside)
    for(let z = 20; z <= 110; z++){ p.z = z0; p.vz = 0; p.vx = p.vy = 0; Object.assign(b, { ownedBy: null, dribbler: null, x: p.x, y: p.y, z, vx: 0, vy: 0, vz: 0, crossT: 0, shotT: 0 });
      set(1); fn(); if(set() === 0) top = z; }
    out[k + z0] = top; set(0); }
  out.gk = T.GKH(); return out; });
info('the highest it\'s headed (px): ' + JSON.stringify(tops));
ok(tops.attack14 >= 55 && tops.attack14 <= 62 && tops.defend14 <= 62 && tops.attack0 < tops.attack14 && Math.max(tops.attack14, tops.defend14) < tops.gk - 15,
  'a header tops out at ' + tops.attack14 + ' px (Heading 10, up in his leap; ' + tops.attack0 + ' standing), a keeper\'s hands at ' + Math.round(tops.gk) + ' px: no man reaches a ball higher than a keeper');
// a cross from their byline into our six-yard box, our keeper on his line: with nobody near it he catches it; with one of
// theirs going up with him (kept by the ball as it comes in), he punches it clear
const cross = rival => page.evaluate(rival => new Promise(res => { const T = window.__T, kp = T.keepers().find(k => k.team === 'G'), b = T.ball(); T.freeze(); window.__punch = 0;
  const R = T.players().filter(q => q.team === 'R' && q.role !== 'G'), cr = R[0], att = R[1], out = -kp.side, gx = kp.side < 0 ? 0 : T.FW;
  const park = () => { for(const q of T.players()) if(q !== cr && !(rival && q === att)){ q.x = T.FW / 2 + out * 400 + (q.team === 'R' ? 0 : 60); q.y = 60; q.vx = q.vy = 0; } };
  T.drop(); park(); Object.assign(kp, { x: kp.homeX, y: T.YC, mode: 'line', claimCd: 0, diveT: 0, groundT: 0, holdT: 0, heldT: 0, vx: 0, vy: 0 });
  cr.x = gx + out * 30; cr.y = T.YC + 520; cr.vx = cr.vy = 0; cr.facing = { x: -out, y: 0 };
  cr.stats = Object.assign({}, cr.stats, { crossing: 10, curve: 1 });   // (a true ball to the spot: since v107 a lesser crosser's can drop short, out of the keeper's patch)
  Object.assign(b, { ownedBy: null, dribbler: null, x: cr.x, y: cr.y - 20, z: 0, vx: 0, vy: 0, vz: 0, crossT: 0, shotT: 0 });
  T.aiCross(cr, { x: gx + out * 90, y: T.YC + 30, who: null }); const t0 = T.simNow();
  let tc = null, p0 = null, tm = null;   // (v178: when he decided it was his, and when he first moved off that spot)
  (function tick(){ park(); cr.x = gx + out * 30; cr.y = T.YC + 520;
    if(rival){ const d = Math.hypot(b.x - att.x, b.y - att.y) || 1; att.x = b.x + (out * 18); att.y = b.y + 14; att.vx = att.vy = 0; }
    if(kp.mode === 'claimX' && tc == null){ tc = T.simNow(); p0 = { x: kp.x, y: kp.y }; }
    if(tc != null && tm == null && Math.hypot(kp.x - p0.x, kp.y - p0.y) > 3) tm = T.simNow();
    const lag = { decide: tc == null ? null : +(tc - t0).toFixed(3), go: tm == null ? null : +(tm - t0).toFixed(3), read: +T.gkRead(kp).toFixed(3) };
    if(T.gkHold() === kp) return res({ how: 'caught', t: +(T.simNow() - t0).toFixed(2), lag });
    if(window.__punch) return res({ how: 'punched', t: +(T.simNow() - t0).toFixed(2), away: Math.round((b.x - kp.x) * out), up: Math.round(b.vz), lag });
    if(T.simNow() - t0 > 3) return res({ how: 'neither' });
    requestAnimationFrame(tick); })(); }), rival);
const alone = await cross(false), contested = await cross(true);
info('a cross into the six-yard box: ' + JSON.stringify(alone) + '; with one of theirs up with him: ' + JSON.stringify(contested));
ok(alone.how === 'caught' && contested.how === 'punched', 'the keeper catches a cross he\'s comfortably under, and punches it with one of theirs up with him');
ok(alone.lag.decide != null && alone.lag.decide <= 0.1 && alone.lag.go != null && alone.lag.go >= alone.lag.read - 1 / 60 && alone.lag.go <= alone.lag.read + 0.1,
  'struck, the cross is his at once (' + alone.lag.decide + ' s) but he stands, reading it, and goes at ' + alone.lag.go + ' s (his read at his Reflexes: ' + alone.lag.read + ' s; v177: off his line the instant it was struck)');
// AT HIS HANDS (v178): the ball 0.85 of his reach from him, at his hands' height, nobody of theirs anywhere near -- coming
// straight at him; across him, passing 0.7 of his reach off; and across him a third of his reach (and the step) off, for
// a keeper of Handling 1 and of Handling 10. What he does with it there and then (gkTakeCross)
const hands = await page.evaluate(() => { const T = window.__T, kp = T.keepers().find(k => k.team === 'G'), b = T.ball(), out = -kp.side, res = {}, st0 = kp.stats; T.freeze();
  for(const q of T.players()) if(q !== kp){ q.x = T.FW / 2; q.y = 40; q.vx = q.vy = 0; }
  const STEP = T.CATCH()[1];
  const one = (k, hand, off) => { T.drop(); window.__punch = 0; kp.stats = Object.assign({}, st0, { gkHandling: hand });
    Object.assign(kp, { x: kp.homeX, y: T.YC, mode: 'claimX', claimCd: 0, diveT: 0, groundT: 0, holdT: 0, heldT: 0, vx: 0, vy: 0, xGo: 0 });
    T.endCurve(); Object.assign(b, { ownedBy: null, dribbler: null, lob: null, crossT: 0, shotT: 0, z: 50, vz: 0 });
    const R = (T.reachOf(kp) + b.r + 10) * T.GRAB(), o = typeof off === 'function' ? off(R) : off;
    if(o === 0){ b.x = kp.x + out * 0.85 * R; b.y = kp.y; b.vx = -out * 300; b.vy = 0; }
    else { b.x = kp.x + out * o * R; b.y = kp.y - Math.sqrt(0.85 * 0.85 - o * o) * R; b.vx = 0; b.vy = 300; }
    const took = T.gkTakeCross(kp, 150); res[k] = { took, how: T.gkHold() === kp ? 'caught' : window.__punch ? 'punched' : 'neither', R: Math.round(R), off: +o.toFixed(2) }; };
  one('at', 5, 0); one('across', 10, 0.7); one('h1', 1, R => 0.32 + STEP / R); one('h10', 10, R => 0.32 + STEP / R);
  kp.stats = st0; T.drop(); kp.mode = 'line'; window.__punch = 0; return res; });
info('at his hands: ' + JSON.stringify(hands));
ok(hands.at.how === 'caught' && hands.across.how === 'punched' && hands.h1.how === 'punched' && hands.h10.how === 'caught',
  'he catches only what comes to him: straight at him, caught; across him ' + hands.across.off + ' of his reach off, punched (Handling 10 -- v177 caught it, a stride and in); ' + hands.h1.off + ' off, Handling 1 punches it and Handling 10 catches it');

// HIS WAY TO IT: the same cross; where he'd take it read first, with nobody about; then men stood still in his way: three
// of theirs abreast across his line to it, half way and a body's width apart -- or two of ours on it, 40% and 70% of the
// way. Did he come (claimX), what came of it, and (ours) how far each was moved off his line and how far along it
const way = who => page.evaluate(who => new Promise(res => { const T = window.__T, kp = T.keepers().find(k => k.team === 'G'), b = T.ball(); T.freeze(); window.__punch = 0;
  const R = T.players().filter(q => q.team === 'R' && q.role !== 'G'), G = T.players().filter(q => q.team === 'G'), cr = R[0], out = -kp.side, gx = kp.side < 0 ? 0 : T.FW;
  const men = who ? (who === 'R' ? R.slice(1, 4) : G.slice(0, 2)) : [];
  const park = () => { for(const q of T.players()) if(q !== cr && !men.includes(q)){ q.x = T.FW / 2 + out * 400 + (q.team === 'R' ? 0 : 60); q.y = 60; q.vx = q.vy = 0; } };
  T.drop(); park(); Object.assign(kp, { x: kp.homeX, y: T.YC, mode: 'line', claimCd: 0, diveT: 0, groundT: 0, holdT: 0, heldT: 0, vx: 0, vy: 0, runDir: null });
  cr.x = gx + out * 30; cr.y = T.YC + 520; cr.vx = cr.vy = 0; cr.facing = { x: -out, y: 0 };
  cr.stats = Object.assign({}, cr.stats, { crossing: 10, curve: 1 });   // (a true ball to the spot: since v107 a lesser crosser's can drop short, out of the keeper's patch)
  for(const q of men){ q.x = T.FW / 2; q.y = 40; q.vx = q.vy = 0; }
  Object.assign(b, { ownedBy: null, dribbler: null, x: cr.x, y: cr.y - 20, z: 0, vx: 0, vy: 0, vz: 0, crossT: 0, shotT: 0 });
  T.aiCross(cr, { x: gx + out * 90, y: T.YC + 30, who: null });
  let cs = null; for(let k = 0; k < 12 && !cs; k++) cs = T.crossClaim(kp);   // (where he'd go for it, nobody about)
  if(!cs) return res({ cs: null });
  const ux = (cs.x - kp.x), uy = (cs.y - kp.y), L = Math.hypot(ux, uy), sp = men.map((q, i) => {
    if(who === 'R'){ const k = (i - 1) * 26 / L; q.x = kp.x + ux * 0.5 + uy * k; q.y = kp.y + uy * 0.5 - ux * k; }   // (abreast, across his line)
    else { const f = i ? 0.7 : 0.4; q.x = kp.x + ux * f; q.y = kp.y + uy * f; }
    q.__hold = true; return { x: q.x, y: q.y }; });
  const t0 = T.simNow(); let came = false;
  (function tick(){ park(); cr.x = gx + out * 30; cr.y = T.YC + 520; if(kp.mode === 'claimX') came = true;
    const how = T.gkHold() === kp ? 'caught' : window.__punch ? 'punched' : T.simNow() - t0 > 2.5 ? 'neither' : null;
    if(!how) return requestAnimationFrame(tick);
    const moved = men.map((q, i) => { const dx = q.x - sp[i].x, dy = q.y - sp[i].y; return { side: +(Math.abs(dx * uy - dy * ux) / L / 22.5).toFixed(2), on: +((dx * ux + dy * uy) / L / 22.5).toFixed(2) }; });
    for(const q of men) q.__hold = false;
    res({ came, how, run: +(L / 22.5).toFixed(1), moved }); })(); }), who);
const clear = await way(null), theirs = await way('R'), ours = await way('G');
info('his way to it: clear ' + JSON.stringify(clear) + '; three of theirs across it ' + JSON.stringify(theirs) + '; two of ours on it ' + JSON.stringify(ours));
ok(clear.came && clear.how === 'caught', 'nobody in his way: he comes for it, and has it (a ' + clear.run + ' m run)');
ok(!theirs.came, 'three of theirs stood across his way: he doesn\'t come -- he can\'t go through them');
ok(ours.came && ours.how === 'caught' && ours.moved.every(m => m.side > 0.5 && m.side > Math.abs(m.on)), 'two of ours in his way: he comes, and has it -- each shoved aside, off his line (' + ours.moved.map(m => m.side + ' m aside, ' + m.on + ' m on').join('; ') + ')');

process.exitCode = rep.finish();
await browser.close();

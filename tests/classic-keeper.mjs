// FOOTBALL CLASSIC, YOUR KEEPER: with the ball in his hands he waits for you -- he plays it out when you press PASS, or by
// himself once he's had it 5 s, the last 2 s of that with a red stopwatch flashing over his head -- and either way to
// whoever his PASS instruction says: PLAYER (the man you're playing as), CLOSEST OPEN, FARTHEST OPEN or HOOF IT. The
// computer's keeper plays it out himself, as before. IN THE AIR no man gets to a ball higher than a keeper: a header
// tops out at 61 px (Heading 10, at the top of his leap), the keeper's hands at 82; and a keeper coming for a cross
// catches it when he's comfortably under it, and punches it clear when one of theirs is up with him. On a copy of the
// game that lets the test set the scene, give the keeper the ball and count the stopwatch's frames.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, simNow:()=>simNow, gkHold:()=>gkHold, PI, gkSet, gkTarget, '
  + 'GK:()=>[GK_WAIT,GK_WARN], FW, FH, YC, atkOf, tryHeaderContact, tryDefHeaderContact, aiCross, GKH:()=>GK_CLAIM_H, '
  + 'ht:v=>{ if(v!=null) headerT=v; return headerT; }, dht:v=>{ if(v!=null) defHeaderT=v; return defHeaderT; }, drop:()=>{ gkHold=null; }, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }, '
  + 'hold:kp=>{ kp.mode="hold"; kp.holdT=1.0; kp.heldT=0; kp.x=kp.homeX; kp.y=YC; gkHold=kp; ball.ownedBy=null; ball.dribbler=null; ball.intendedRcv=null; ball.x=kp.x-kp.side*18; ball.y=kp.y; ball.z=6; ball.vx=ball.vy=ball.vz=0; }};\n  const LAB_TITLE=');
patch('  function drawStopwatch(x,y){', '  function drawStopwatch(x,y){ window.__sw=(window.__sw||0)+1;');
patch('  function keeperPunch(kp){\n', '  function keeperPunch(kp){\n    window.__punch=(window.__punch||0)+1;\n');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-gk-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1500);

// THE SCENE: their men parked on their own goal line out of the way, ours set at known distances up the pitch from our
// keeper (held there), and the keeper given the ball. Watch it for `secs` (or until he lets it go): when he does, who
// it's for and how far from him it comes down; and how many frames the stopwatch showed in the first 3 s and the 2 s after.
const scene = (how, secs, pressAt) => page.evaluate(({ how, secs, pressAt }) => new Promise(res => {
  const T = window.__T, kp = T.keepers().find(k => k.team === 'G'), atk = T.atkOf('G'), G = T.players().filter(q => q.team === 'G'), R = T.players().filter(q => q.team === 'R');
  T.freeze(); T.gkSet(T.PI.G, 'gkPass', how);
  const gx = atk > 0 ? 0 : T.FW, spots = G.map((q, i) => ({ q, x: gx + atk * (300 + i * 150), y: T.YC + (i % 2 ? 1 : -1) * (120 + 40 * i) }));
  const place = () => { for(const s of spots){ s.q.x = s.x; s.q.y = s.y; s.q.vx = s.q.vy = 0; }
    for(const [i, o] of R.entries()){ o.x = atk > 0 ? T.FW - 40 : 40; o.y = 60 + i * 40; o.vx = o.vy = 0; } };
  place(); T.hold(kp); window.__sw = 0;
  const t0 = T.simNow(); let sw3 = 0, swEnd = 0, frames3 = 0, framesEnd = 0, out = null, want = null, pressed = false;
  (function tick(){
    const t = T.simNow() - t0;
    if(T.gkHold() === kp){ place(); want = T.gkTarget(kp, how);
      const n = window.__sw; window.__sw = 0; if(t < 3){ sw3 += n; frames3++; } else { swEnd += n; framesEnd++; } }
    else if(!out){ const b = T.ball(); out = { t, rcv: b.intendedRcv ? G.indexOf(b.intendedRcv) : -1, you: b.intendedRcv === T.controlled(), want: want ? G.indexOf(want) : -1,
      x0: b.x, y0: b.y, land: null, dists: G.map(q => Math.hypot(q.x - kp.x, q.y - kp.y)) }; }
    else if(out.land == null){ const b = T.ball(); place();   // (where it comes down: the first bounce, or where it's taken)
      if((t - out.t > 0.25 && b.z <= 0.5) || b.ownedBy || t - out.t > 4) out.land = Math.hypot(b.x - out.x0, b.y - out.y0) / 22.5; }
    if(pressAt != null && !pressed && t >= pressAt){ pressed = true; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', key: 'j' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ', key: 'j' })); }
    if((out && out.land != null) || t > secs + 4) return res({ how, out, sw3, swEnd, frames3, framesEnd });
    requestAnimationFrame(tick); })(); }), { how, secs, pressAt });

// THE TIMER, with CLOSEST OPEN
const c = await scene('closest', 7, null);
info('closest: ' + JSON.stringify(c));
ok(c.out && c.out.t >= 4.9 && c.out.t <= 5.4, 'your keeper holds it until his time\'s up, then plays it out by himself (' + (c.out ? c.out.t.toFixed(2) : '-') + ' s)');
ok(c.sw3 === 0 && c.swEnd > 0 && c.swEnd < c.framesEnd, 'no stopwatch for his first 3 s; in the last 2 s it flashes over his head (' + c.swEnd + ' of ' + c.framesEnd + ' frames)');
const near = c.out ? c.out.dists.indexOf(Math.min(...c.out.dists)) : -2;
ok(c.out && c.out.rcv === near, 'CLOSEST OPEN: to the nearest of ours, with nobody near (man ' + (c.out && c.out.rcv) + ', the nearest ' + near + ')');
// FARTHEST OPEN
const f = await scene('farthest', 7, null);
const inRange = f.out ? f.out.dists.map((d, i) => [d, i]).filter(([d]) => d <= 1250) : [], far = inRange.length ? inRange.reduce((a, b) => b[0] > a[0] ? b : a)[1] : -2;
ok(f.out && f.out.rcv === far && f.out.rcv !== near, 'FARTHEST OPEN: to the furthest of ours in his range (man ' + (f.out && f.out.rcv) + ', ' + (f.out ? Math.round(f.out.dists[f.out.rcv] / 22.5) : '-') + ' m away)');
// PLAYER: the man you're playing as
const p = await scene('player', 7, null);
ok(p.out && p.out.you, 'PLAYER: to the man you\'re playing as');
// HOOF IT: long, up towards the forwards
const h = await scene('hoof', 7, null);
const hm = h.out && h.out.rcv >= 0 ? h.out.dists[h.out.rcv] / 22.5 : 0;
ok(hm >= 45 && h.out.land > c.out.land + 20, 'HOOF IT: kicked as far up as it goes, to a man ' + Math.round(hm) + ' m up the pitch, first bouncing ' + (h.out ? Math.round(h.out.land) : '-') + ' m out (CLOSEST OPEN: thrown ' + (c.out ? Math.round(c.out.land) : '-') + ' m)');
// PASS pressed before his time's up: at once, to his instruction's man
const j = await scene('closest', 7, 1.5);
ok(j.out && j.out.t < 1.7 && j.out.rcv === near, 'press PASS and he plays it at once (' + (j.out ? j.out.t.toFixed(2) : '-') + ' s), to the man his instruction says');

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
  Object.assign(b, { ownedBy: null, dribbler: null, x: cr.x, y: cr.y - 20, z: 0, vx: 0, vy: 0, vz: 0, crossT: 0, shotT: 0 });
  T.aiCross(cr, { x: gx + out * 90, y: T.YC + 30, who: null }); const t0 = T.simNow();
  (function tick(){ park(); cr.x = gx + out * 30; cr.y = T.YC + 520;
    if(rival){ const d = Math.hypot(b.x - att.x, b.y - att.y) || 1; att.x = b.x + (out * 18); att.y = b.y + 14; att.vx = att.vy = 0; }
    if(T.gkHold() === kp) return res({ how: 'caught', t: +(T.simNow() - t0).toFixed(2) });
    if(window.__punch) return res({ how: 'punched', t: +(T.simNow() - t0).toFixed(2), away: Math.round((b.x - kp.x) * out), up: Math.round(b.vz) });
    if(T.simNow() - t0 > 3) return res({ how: 'neither' });
    requestAnimationFrame(tick); })(); }), rival);
const alone = await cross(false), contested = await cross(true);
info('a cross into the six-yard box: ' + JSON.stringify(alone) + '; with one of theirs up with him: ' + JSON.stringify(contested));
ok(alone.how === 'caught' && contested.how === 'punched', 'the keeper catches a cross he\'s comfortably under, and punches it with one of theirs up with him');

process.exitCode = rep.finish();
await browser.close();

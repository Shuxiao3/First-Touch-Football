// FOOTBALL CLASSIC, YOUR KEEPER: with the ball in his hands he waits for you -- he plays it out when you press PASS, or by
// himself once he's had it 5 s, the last 2 s of that with a red stopwatch flashing over his head -- and either way to
// whoever his PASS instruction says: PLAYER (the man you're playing as), CLOSEST OPEN, FARTHEST OPEN or HOOF IT. The
// computer's keeper plays it out himself, as before. On a copy of the game that lets the test set the scene, give the
// keeper the ball and count the stopwatch's frames.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, simNow:()=>simNow, gkHold:()=>gkHold, PI, gkSet, gkTarget, '
  + 'GK:()=>[GK_WAIT,GK_WARN], FW, FH, YC, atkOf, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }, '
  + 'hold:kp=>{ kp.mode="hold"; kp.holdT=1.0; kp.heldT=0; kp.x=kp.homeX; kp.y=YC; gkHold=kp; ball.ownedBy=null; ball.dribbler=null; ball.intendedRcv=null; ball.x=kp.x-kp.side*18; ball.y=kp.y; ball.z=6; ball.vx=ball.vy=ball.vz=0; }};\n  const LAB_TITLE=');
patch('  function drawStopwatch(x,y){', '  function drawStopwatch(x,y){ window.__sw=(window.__sw||0)+1;');
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

process.exitCode = rep.finish();
await browser.close();

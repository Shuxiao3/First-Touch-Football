// FOOTBALL CLASSIC, THE MAGNET (v88): the ball loose a stride or two from your man and he's drawn to it till it's at
// his feet -- pushing the stick across it he bends toward it and has it; with the stick left alone he goes and gets it;
// steering off his own knock-on he still gets back to it. Only a bit: a ball 4 m off doesn't pull him off his line, and
// pushing hard away from one he goes away from it; and one of theirs knocked on in their own stride doesn't pull him at
// all. On a copy of the game that lets the test set the scene: everyone else stood well away, the stick held on the keys.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, ball:()=>ball, controlled:()=>controlled, setControlled, FW, FH, YC, MK, atkOf, simNow:()=>simNow, '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; kickT=0; kickBy=null; kickTo=null; restartInfo=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; matchClock=0; switchLock=null; }};\n  const LAB_TITLE=');
patch('      else{\n        let ai=aiBrain(p,dt);', '      else if(p.__script){ p.__script(p,dt); }\n      else{\n        let ai=aiBrain(p,dt);');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-mag-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(1200);

// THE SCENE: your man (a midfielder) stood in the middle of our half; the ball loose at (bx, by) m from him, moving at
// (vx, vy) m/s -- his own knock-on (own), one of theirs knocked on in his stride (theirs: their man running with it), or
// nobody's; everyone else stood well away. Hold the keys for secs: did he get it, how near he got, where he ended up.
const scene = (o) => page.evaluate(o => new Promise(res => { const T = window.__T, MK = T.MK, b = T.ball();
  const me = T.players().find(q => q.team === 'G' && q.role === 'MID'), them = T.players().find(q => q.team === 'R' && q.role === 'ATT');
  T.freeze(); T.setControlled(me);
  for(const q of T.players()) if(q !== me && !(o.theirs && q === them)){ q.x = T.FW / 2 + (q.team === 'R' ? 0.35 : -0.35) * T.FW; q.y = 40 + 12 * T.players().indexOf(q); q.vx = q.vy = 0; q.__script = p => { p.vx = p.vy = 0; }; }
  for(const k of T.keepers()){ k.x = k.homeX; k.y = T.YC; }
  const x0 = T.FW / 2 - T.atkOf('G') * 18 * MK, y0 = T.YC;
  Object.assign(me, { x: x0, y: y0, vx: (o.mv || 0) * MK, vy: 0, state: 'normal', noTouchT: 0, sprint: false, facing: { x: 1, y: 0 } });
  Object.assign(b, { ownedBy: null, x: x0 + o.bx * MK, y: y0 + o.by * MK, z: 0, vx: (o.vx || 0) * MK, vy: (o.vy || 0) * MK, vz: 0, shotT: 0, crossT: 0, intendedRcv: null, thru: null,
    lastTouch: o.theirs ? 'R' : 'G', dribbler: o.own ? me : o.theirs ? them : null, dribbleGrace: o.own || o.theirs ? 0.85 : 0 });
  if(o.theirs){ Object.assign(them, { x: b.x - 2.2 * MK, y: b.y, state: 'normal' }); them.__script = (p, dt) => { p.vx = (o.vx || 0) * MK; p.vy = 0; p.x += p.vx * dt; }; }
  const t0 = T.simNow(); let near = 1e9, got = null;
  (function tick(){ const d = Math.hypot(b.x - me.x, b.y - me.y) / MK; near = Math.min(near, d);
    if(b.ownedBy === me && got === null) got = +(T.simNow() - t0).toFixed(2);
    if(T.simNow() - t0 < o.secs) return requestAnimationFrame(tick);
    for(const q of T.players()) q.__script = null;
    res({ got, near: +near.toFixed(2), dy: +((me.y - y0) / MK).toFixed(2), dx: +((me.x - x0) / MK).toFixed(2), end: +d.toFixed(2), owner: b.ownedBy ? (b.ownedBy === me ? 'me' : b.ownedBy.team) : 'none' }); })(); }), o);
const hold = async (keys, o) => { for(const k of keys) await page.keyboard.down(k); const r = await scene(o); for(const k of keys) await page.keyboard.up(k); await page.waitForTimeout(100); return r; };

// 1. pushing across it: the ball 2 m to his side (out of his reach), the stick straight ahead
const across = await hold(['KeyD'], { bx: 0.6, by: 2.0, secs: 1.6 });
info('pushing across a loose ball 2 m to his side: ' + JSON.stringify(across));
ok(across.got !== null && across.got < 1.2, 'pushing the stick across a loose ball a stride or two to his side, he bends to it and has it (' + across.got + ' s)');

// 2. the stick left alone: the ball 2.2 m off, ahead and to the side
const alone = await hold([], { bx: 1.6, by: -1.5, secs: 1.6 });
info('the stick left alone, a loose ball 2.2 m off: ' + JSON.stringify(alone));
ok(alone.got !== null && alone.got < 1.4, 'the stick left alone, he goes and gets it (' + alone.got + ' s)');

// 3. his own knock-on, running: the ball 2.3 m ahead of him going on at 6 m/s, him at 5.5 m/s; you steer off 45° (D+W)
const knock = await hold(['KeyD', 'KeyW'], { bx: 2.3, by: 0, vx: 6, mv: 5.5, own: true, secs: 1.2 });
info('steering 45° off his own knock-on: ' + JSON.stringify(knock));
ok(knock.got !== null, 'steering off his own knock-on, he still gets back to it (' + knock.got + ' s)');

// 4. only a bit: a ball 4 m to his side doesn't pull him off his line
const far = await hold(['KeyD'], { bx: 0, by: 4, secs: 1.0 });
info('a loose ball 4 m to his side, pushing ahead: ' + JSON.stringify(far));
ok(far.got === null && Math.abs(far.dy) < 0.4, 'a ball 4 m off doesn\'t pull him off his line (' + far.dy + ' m across)');

// 5. pushing hard away from one 2.1 m behind him (out of his reach): he goes away from it
const away = await hold(['KeyD'], { bx: -2.1, by: 0, secs: 1.0 });
info('pushing away from a loose ball 2.1 m behind him: ' + JSON.stringify(away));
ok(away.got === null && away.end > 3, 'pushing hard away from one, he goes away from it (' + away.end + ' m off it after 1 s)');

// 6. one of theirs knocked on in his stride, passing 1.5 m in front of him: no pull
const theirs = await hold(['KeyS'], { bx: -0.5, by: -1.5, vx: 4, theirs: true, secs: 0.8 });
info('their man\'s knock-on 1.5 m in front, pushing back toward our half (down): ' + JSON.stringify(theirs));
ok(theirs.got === null && Math.abs(theirs.dx) < 0.4, 'one of theirs knocked on in his stride doesn\'t pull him (' + theirs.dx + ' m along)');

process.exitCode = rep.finish();
await browser.close();

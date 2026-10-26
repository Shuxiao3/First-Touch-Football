// FOOTBALL CLASSIC, THE FIRST TOUCH: no timing -- the touch is the player's own, judged off his Ball control and
// Composure, and how much they matter depends on the moment. Knocking it about at the back with nobody near, even a
// poor defender almost always takes it cleanly; with a man on him, or in the final third, the touch is only as good as
// his Ball control and Composure. Nobody presses anything: you and the computer alike, it's taken as it arrives -- a
// PERFECT touch dead at your feet, a worse one off you. The reach is smaller (18 to 32, was 25 to 45). On the pitch: one
// solid green ring under the man you control (no dotted one), and the ball in whole pixels, as the players are.
// On a copy of the game that lets the test set the scene.
import { open } from './_harness.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

let src = readFileSync(fileURLToPath(new URL('../classic.html', import.meta.url)), 'utf8');
const patch = (from, to) => { if(src.split(from).length !== 2) throw new Error('instrumenting: anchor not found once: ' + from); src = src.replace(from, to); };
patch('  const LAB_TITLE=', '  window.__T={players:()=>players, keepers:()=>keepers, controlled:()=>controlled, ball:()=>ball, P, FW, FH, YC, atkOf, controlROf, '
  + 'touchQuality, touchPressure, finalThirdOf, lastGrade:()=>lastGrade, proj, draw:()=>draw(), '
  + 'freeze:()=>{ restartT=0; offsideT=0; scoredT=0; gkHold=null; skill=null; oneTouch=null; ftAim=null; recvAuto=null; }};\n  const LAB_TITLE=');
const copy = join(mkdtempSync(join(tmpdir(), 'ftf-touch-')), 'classic.html');
writeFileSync(copy, src);

const { browser, page, rep } = await open({ url: 'file://' + copy });
const { ok, info } = rep;
await page.click('#smItems [data-act="exhibition"]'); await page.waitForSelector('#exhPanel.show'); await page.click('#exhGo'); await page.waitForTimeout(800);

// THE REACH
const reach = await page.evaluate(() => { const T = window.__T, q = { stats: {} }, at = v => { q.stats.ballControl = v; return T.controlROf(q); };
  return { lo: at(1), mid: at(5.5), hi: at(10) }; });
ok(reach.lo === 18 && reach.hi === 32 && reach.mid === 25, 'the reach: ' + reach.lo + ' at Ball control 1, ' + reach.mid + ' at 5.5, ' + reach.hi + ' at 10 (was 25 to 45)');

// THE TOUCH, as the moment and the man make it: n touches each, graded PERFECT / CLEAN / LOOSE / HEAVY.
// u: how far up the pitch he is, going his side's way (0.25 = at the back, 0.8 = the final third); man: an opponent
// that far away (px; 25 = 1 m), or nobody near
const odds = (u, man, bc, cp, n = 800) => page.evaluate(({ u, man, bc, cp, n }) => {
  const T = window.__T, p = T.players().find(q => q !== T.controlled() && q.team === 'G'), atk = T.atkOf('G');
  for(const q of T.players()) if(q.team !== 'G'){ q.x = atk > 0 ? T.FW - 60 : 60; q.y = 80; q.vx = q.vy = 0; q.state = 'normal'; }
  p.x = atk > 0 ? T.FW * u : T.FW * (1 - u); p.y = T.YC + 200; p.vx = p.vy = 0;
  const o = T.players().find(q => q.team !== 'G');
  if(man) { o.x = p.x - atk * man; o.y = p.y; }
  const b = T.ball(); b.ownedBy = null; b.x = p.x - atk * 60; b.y = p.y; b.z = 0; b.vx = atk * 400; b.vy = 0;
  const keep = p.stats; p.stats = Object.assign({}, keep, { ballControl: bc, composure: cp });
  const c = { PERFECT: 0, CLEAN: 0, LOOSE: 0, HEAVY: 0 };
  for(let i = 0; i < n; i++){ const s = T.touchQuality(p, false); c[s > 0.8 ? 'PERFECT' : s > 0.55 ? 'CLEAN' : s > 0.3 ? 'LOOSE' : 'HEAVY']++; }
  const out = { pressure: +T.touchPressure(p).toFixed(2), third: +T.finalThirdOf(p).toFixed(2), perfect: c.PERFECT / n, clean: (c.PERFECT + c.CLEAN) / n, heavy: c.HEAVY / n };
  p.stats = keep; return out; }, { u, man, bc, cp, n });
const pc = v => Math.round(v * 100) + '%';
await page.evaluate(() => window.__T.freeze());
const backPoor = await odds(0.25, 0, 3, 3), backPoorPressed = await odds(0.25, 30, 3, 3), backGoodPressed = await odds(0.25, 30, 9, 9);
info('at the back: ' + JSON.stringify({ backPoor, backPoorPressed, backGoodPressed }));
ok(backPoor.pressure === 0 && backPoor.third === 0, 'the scene: at the back with nobody within 6 m (pressure ' + backPoor.pressure + ')');
ok(backPoor.clean >= 0.97 && backPoor.perfect >= 0.7 && backPoor.heavy === 0, 'a poor defender (Ball control 3, Composure 3) at the back with nobody near: clean or better ' + pc(backPoor.clean) + ', perfect ' + pc(backPoor.perfect));
ok(backPoorPressed.pressure === 1 && backPoorPressed.clean <= 0.6, '...with a man 1.2 m off him: clean or better only ' + pc(backPoorPressed.clean));
ok(backGoodPressed.clean >= 0.95, 'a good one (9, 9) with the same man on him: still clean or better ' + pc(backGoodPressed.clean));
const thirdPoor = await odds(0.8, 0, 3, 3), thirdGood = await odds(0.8, 0, 9, 9);
info('the final third, nobody near: ' + JSON.stringify({ thirdPoor, thirdGood }));
ok(thirdPoor.third === 1 && thirdPoor.pressure === 0, 'the scene: well into the final third, nobody near');
ok(thirdPoor.clean <= backPoor.clean - 0.12 && thirdGood.clean - thirdPoor.clean >= 0.12, 'in the final third it comes down to the man: poor ' + pc(thirdPoor.clean) + ' clean or better (' + pc(backPoor.clean) + ' at the back), good ' + pc(thirdGood.clean));
const cpLo = await odds(0.25, 30, 6, 2), cpHi = await odds(0.25, 30, 6, 9), cpLoBack = await odds(0.25, 0, 6, 2), cpHiBack = await odds(0.25, 0, 6, 9);
ok(cpHi.clean - cpLo.clean >= 0.2 && Math.abs(cpHiBack.clean - cpLoBack.clean) <= 0.05, 'Composure tells under pressure (2: ' + pc(cpLo.clean) + ', 9: ' + pc(cpHi.clean) + ' clean or better), not at the back with nobody near (' + pc(cpLoBack.clean) + ', ' + pc(cpHiBack.clean) + ')');
const bcLo = await odds(0.25, 30, 2, 6), bcHi = await odds(0.25, 30, 9, 6);
ok(bcHi.clean - bcLo.clean >= 0.2, 'so does Ball control (2: ' + pc(bcLo.clean) + ', 9: ' + pc(bcHi.clean) + ')');

// NO TIMING: a ball rolled to a man is taken as it arrives, nothing pressed. The spread off (First-touch spread 0), so
// each touch is the likely one: PERFECT at the back with nobody near (dead at his feet); with a man on him in the final
// third, a 1-rated man's is LOOSE (it comes off him and he has to go and get it).
const receive = (who, u, man, bc, cp) => page.evaluate(({ who, u, man, bc, cp }) => new Promise(res => {
  const T = window.__T, c = T.controlled(), atk = T.atkOf(c.team); T.freeze(); T.P.aiTouch.val = 0;
  const p = who === 'you' ? c : T.players().find(q => q !== c && q.team === c.team);
  for(const q of T.players()) if(q !== p){ q.x = atk > 0 ? 80 : T.FW - 80; q.y = q.team === c.team ? 90 : T.FH - 90; q.vx = q.vy = 0; q.state = 'normal'; }
  p.x = atk > 0 ? T.FW * u : T.FW * (1 - u); p.y = T.YC - 150; p.vx = p.vy = 0; p.noTouchT = 0; p.state = 'normal';
  const keep = p.stats; p.stats = Object.assign({}, keep, { ballControl: bc, composure: cp });
  const o = T.players().find(q => q.team !== c.team), ox = p.x + atk * man, oy = p.y;
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.lastTouch = c.team; b.x = p.x - atk * 150; b.y = p.y; b.z = 0; b.vz = 0; b.vx = atk * 380; b.vy = 0;
  const g0 = T.lastGrade(), t0 = performance.now();
  (function tick(){
    if(man){ o.x = ox; o.y = oy; o.vx = o.vy = 0; }                       // the man on him stays put
    p.vx = p.vy = 0;
    const done = b.ownedBy === p || (b.dribbler === p && !b.ownedBy);
    if(done || performance.now() - t0 > 2500){
      const out = { owned: b.ownedBy === p, off: !b.ownedBy && b.dribbler === p, sp: Math.round(Math.hypot(b.vx, b.vy)), grade: T.lastGrade(), changed: T.lastGrade() !== g0, pressure: +T.touchPressure(p).toFixed(2) };
      p.stats = keep; T.P.aiTouch.val = 1; return res(out); }
    requestAnimationFrame(tick);
  })(); }), { who, u, man, bc, cp });
const youEasy = await receive('you', 0.3, 0, 5, 5);
ok(youEasy.owned && youEasy.grade === 'PERFECT', 'you, at the back with nobody near, nothing pressed: taken dead at your feet (' + youEasy.grade + ')');
const youHard = await receive('you', 0.8, 30, 1, 1);
ok(youHard.off && youHard.sp > 20 && youHard.grade === 'LOOSE', 'you, a 1-rated man in the final third with a man on you: a ' + youHard.grade + ' touch, off you at ' + youHard.sp + ' px/s');
const aiEasy = await receive('mate', 0.3, 0, 5, 5);
ok(aiEasy.owned, 'a computer team-mate the same, no press to time: taken at his feet');
const aiHard = await receive('mate', 0.8, 30, 1, 1);
ok(aiHard.off && aiHard.sp > 20, '...and pressed in the final third with poor stats, off him at ' + aiHard.sp + ' px/s');

// ON THE PITCH: the man you control has one solid green ring at his reach; the ball is drawn in whole pixels
const look = await page.evaluate(() => {
  const T = window.__T, c = T.controlled(), atk = T.atkOf(c.team), cv = document.querySelector('canvas'), g = cv.getContext('2d'); T.freeze();
  for(const q of T.players()) if(q !== c){ q.x = atk > 0 ? 80 : T.FW - 80; q.y = 90; }
  c.x = T.FW / 2; c.y = T.YC + 250; c.vx = c.vy = 0;
  const b = T.ball(); b.ownedBy = null; b.dribbler = null; b.x = c.x + atk * 160; b.y = c.y - 160; b.vx = b.vy = 0; b.z = 0; b.vz = 0;
  const hex = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
  T.draw();
  const R = T.controlROf(c), ring = [];
  for(const a of [0, 0.5, 1.2, 1.9, 2.6, Math.PI]){ const s = T.proj(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R); ring.push(hex(Math.floor(s.x / 2) * 2 + 1, Math.floor(s.y / 2) * 2)); }
  const s = T.proj(b.x, b.y, 0), box = g.getImageData(Math.round(s.x) - 12, Math.round(s.y) - 22, 24, 26).data, cols = new Set();
  for(let i = 0; i < box.length; i += 4) cols.add('#' + [box[i], box[i + 1], box[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''));
  SPRITE.disable(); T.draw();
  const box2 = g.getImageData(Math.round(s.x) - 12, Math.round(s.y) - 12, 24, 24).data, cols2 = new Set();
  for(let i = 0; i < box2.length; i += 4) cols2.add('#' + [box2[i], box2[i + 1], box2[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''));
  SPRITE.enable();
  return { ring, pixel: ['#1c1c28', '#f8f8f4', '#2c2c3c'].filter(k => cols.has(k)), plain: cols2.has('#f4f7ee') };
});
info(JSON.stringify(look));
ok(look.ring.every(h => h === '#9dff3c'), 'one solid green ring at his reach, all the way round its near side (' + look.ring.join(' ') + ')');
ok(look.pixel.length === 3, 'the ball in whole pixels: its outline, white and patches (' + look.pixel.join(' ') + ')');
ok(look.plain, 'with the sprites off, the plain round ball is back');

process.exitCode = rep.finish();
await browser.close();
